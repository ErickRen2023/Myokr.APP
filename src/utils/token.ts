const TOKEN_KEY = 'myokr_token';
const SSO_PROFILE_KEY = 'myokr_sso_profile';

export interface SsoProfile {
  username?: string;
  avatar?: string;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getSsoProfile(): SsoProfile | null {
  const value = localStorage.getItem(SSO_PROFILE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as SsoProfile;
  } catch {
    localStorage.removeItem(SSO_PROFILE_KEY);
    return null;
  }
}

export function setSsoProfile(profile?: SsoProfile): void {
  if (profile && (profile.username || profile.avatar)) {
    localStorage.setItem(SSO_PROFILE_KEY, JSON.stringify(profile));
  } else {
    localStorage.removeItem(SSO_PROFILE_KEY);
  }
}
