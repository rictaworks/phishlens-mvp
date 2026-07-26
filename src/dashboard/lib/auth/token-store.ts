const ID_TOKEN_STORAGE_KEY = 'phishlens.dashboard.googleIdToken';

interface JwtPayload {
  exp?: number;
}

export function setIdToken(idToken: string): void {
  window.sessionStorage.setItem(ID_TOKEN_STORAGE_KEY, idToken);
}

export function getIdToken(): string | null {
  return window.sessionStorage.getItem(ID_TOKEN_STORAGE_KEY);
}

export function clearIdToken(): void {
  window.sessionStorage.removeItem(ID_TOKEN_STORAGE_KEY);
}

function decodeJwtPayload(idToken: string): JwtPayload | null {
  const segments = idToken.split('.');
  if (segments.length !== 3) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(base64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

export function isTokenExpired(idToken: string): boolean {
  const payload = decodeJwtPayload(idToken);
  if (payload?.exp === undefined) {
    return true;
  }

  return payload.exp * 1000 <= Date.now();
}
