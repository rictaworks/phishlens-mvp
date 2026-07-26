import { RECAPTCHA_SITE_KEY, RecaptchaNotConfiguredError, isRecaptchaConfigured } from '../config';

/**
 * Issue #37準拠。content scriptはページ本体(mail.google.com)とは別の隔離ワールドで動作するため、
 * grecaptcha(reCAPTCHA v3のグローバルオブジェクト)へ直接アクセスできない。
 * そこでページのDOMに<script>を注入し、window上のCustomEventでトークンをやり取りする。
 */
const REQUEST_EVENT = 'phishlens-recaptcha-token-request';
const RESPONSE_EVENT = 'phishlens-recaptcha-token-response';
const SCRIPT_LOADER_ID = 'phishlens-recaptcha-loader';
const EXECUTOR_ID = 'phishlens-recaptcha-executor';

export type RecaptchaAction = 'agree' | 'dispute';

interface RecaptchaResponseDetail {
  requestId: string;
  token?: string;
  error?: string;
}

function injectScriptOnce(id: string, build: (script: HTMLScriptElement) => void): void {
  if (document.getElementById(id) !== null) {
    return;
  }
  const script = document.createElement('script');
  script.id = id;
  build(script);
  document.head.appendChild(script);
}

function ensureRecaptchaScriptsInjected(): void {
  injectScriptOnce(SCRIPT_LOADER_ID, (script) => {
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
  });
  injectScriptOnce(EXECUTOR_ID, (script) => {
    script.textContent = `
      window.addEventListener('${REQUEST_EVENT}', function (event) {
        var detail = event.detail || {};
        var requestId = detail.requestId;
        var action = detail.action;
        function respond(payload) {
          window.dispatchEvent(new CustomEvent('${RESPONSE_EVENT}', {
            detail: Object.assign({ requestId: requestId }, payload),
          }));
        }
        if (typeof grecaptcha === 'undefined') {
          respond({ error: 'grecaptchaが読み込まれていません' });
          return;
        }
        grecaptcha.ready(function () {
          grecaptcha.execute('${RECAPTCHA_SITE_KEY}', { action: action })
            .then(function (token) { respond({ token: token }); })
            .catch(function (error) { respond({ error: String(error) }); });
        });
      });
    `;
  });
}

/**
 * reCAPTCHA v3のトークンを取得する。サイトキー未設定時はRecaptchaNotConfiguredErrorを投げる
 * (google-auth.tsのGoogleAuthNotConfiguredErrorと同様、フォールバックせず明示的エラーとする設計)。
 */
export function getRecaptchaToken(action: RecaptchaAction): Promise<string> {
  if (!isRecaptchaConfigured()) {
    return Promise.reject(new RecaptchaNotConfiguredError());
  }

  ensureRecaptchaScriptsInjected();

  const requestId = crypto.randomUUID();

  return new Promise((resolve, reject) => {
    const handleResponse = (event: Event): void => {
      const detail = (event as CustomEvent<RecaptchaResponseDetail>).detail;
      if (detail.requestId !== requestId) {
        return;
      }
      window.removeEventListener(RESPONSE_EVENT, handleResponse);
      if (detail.token !== undefined) {
        resolve(detail.token);
      } else {
        reject(new Error(detail.error ?? 'reCAPTCHAトークンの取得に失敗しました'));
      }
    };

    window.addEventListener(RESPONSE_EVENT, handleResponse);
    window.dispatchEvent(new CustomEvent(REQUEST_EVENT, { detail: { action, requestId } }));
  });
}
