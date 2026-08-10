// Public-only API barrel — imports only services needed by marketing/auth pages.
// Avoids pulling admin, dashboard, or agent modules into the public bundle.

export { default, BASE_URL } from './api.base';
export { authService } from './api.auth';
export { contactService } from './api.misc';
