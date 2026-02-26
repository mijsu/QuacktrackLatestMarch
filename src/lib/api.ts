// When running in the Capacitor APK the mobile bundle has no server of its
// own, so it must talk to a hosted backend.  Set NEXT_PUBLIC_API_BASE_URL in
// your environment (e.g. `.env.local`) to point at the deployed service.
//
// For convenience we fall back to the production deployment URL if the
// variable is missing, but during development you should override it so that
// the app talks to your local server instead.

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  'https://ptcquacktrackv1.space.z.ai';

export async function apiFetch(input: string, init?: RequestInit) {
  // ensure path starts with slash
  const path = input.startsWith('/') ? input : `/${input}`;
  return fetch(`${API_BASE_URL}${path}`, init);
}
