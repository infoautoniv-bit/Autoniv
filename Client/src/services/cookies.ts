// ── Cookie helpers ─────────────────────────────────────────────────────────

export function setCookie(name: string, value: string, days?: number) {
  let cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Lax`;
  if (days) {
    const expires = new Date(Date.now() + days * 864e5).toUTCString();
    cookie += `; expires=${expires}`;
  }
  document.cookie = cookie;
}

export function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${encodeURIComponent(name)}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

export function deleteCookie(name: string) {
  document.cookie = `${encodeURIComponent(name)}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
}
