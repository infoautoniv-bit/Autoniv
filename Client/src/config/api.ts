const API_URL = import.meta.env.VITE_API_URL;

if (import.meta.env.PROD && !API_URL) {
  throw new Error('VITE_API_URL must be set in production builds');
}

export const API_BASE_URL = API_URL || 'http://localhost:3000/api';
export const API_HOST = API_URL ? new URL(API_URL).host : 'localhost:3000';
