import { IS_PROD } from './logger.js';

const ACCESS_COOKIE = 'access_token';
const REFRESH_COOKIE = 'refresh_token';

function getCookieDomain() {
  return process.env.COOKIE_DOMAIN || undefined;
}

function getAccessMaxAge() {
  const ttl = process.env.JWT_ACCESS_TTL || '15m';
  return ttlToMs(ttl);
}

function getRefreshMaxAge() {
  const ttl = process.env.JWT_REFRESH_TTL || '7d';
  return ttlToMs(ttl);
}

function ttlToMs(str) {
  const m = String(str).match(/^(\d+)(ms|s|m|h|d)?$/);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = parseInt(m[1], 10);
  const unit = m[2] || 'ms';
  const mult = { ms: 1, s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit];
  return n * mult;
}

function commonOptions(maxAge) {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path: '/',
    domain: getCookieDomain(),
    maxAge,
  };
}

export function setAccessCookie(res, token) {
  res.cookie(ACCESS_COOKIE, token, commonOptions(getAccessMaxAge()));
}

export function setRefreshCookie(res, token) {
  res.cookie(REFRESH_COOKIE, token, commonOptions(getRefreshMaxAge()));
}

export function setTokenCookies(res, accessToken, refreshToken) {
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
}

export function clearAccessCookie(res) {
  res.clearCookie(ACCESS_COOKIE, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path: '/',
    domain: getCookieDomain(),
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: IS_PROD ? 'strict' : 'lax',
    path: '/',
    domain: getCookieDomain(),
  });
}

export function clearTokenCookies(res) {
  clearAccessCookie(res);
  clearRefreshCookie(res);
}

export function extractTokenFromCookie(req) {
  return req.cookies?.[ACCESS_COOKIE] || null;
}

export function extractRefreshFromCookie(req) {
  return req.cookies?.[REFRESH_COOKIE] || null;
}
