// jsdomのcryptoにはrandomUUIDが実装されていない場合があるため、
// Node標準のcrypto.randomUUIDをテスト環境にのみ補う(本番のChrome拡張環境ではWeb Crypto APIが使われる)。
const nodeCrypto = require('node:crypto');

if (typeof globalThis.crypto === 'undefined') {
  globalThis.crypto = nodeCrypto.webcrypto;
}
if (typeof globalThis.crypto.randomUUID !== 'function') {
  globalThis.crypto.randomUUID = () => nodeCrypto.randomUUID();
}

// background.tsはモジュール読み込み時(トップレベル)でchrome.runtime.onMessage.addListenerを
// 呼び出すため、テスト環境にもchrome名前空間の最小限のスタブが必要
// (本番のChrome拡張環境では実際のchrome名前空間が注入される)。
// 各テストファイルは必要に応じてこのスタブを上書き・削除してよい。
if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {
    runtime: {
      onMessage: { addListener: () => {} },
      sendMessage: () => {},
      getURL: (path) => path,
      lastError: undefined,
    },
  };
}
