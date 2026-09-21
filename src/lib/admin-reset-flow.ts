export function buildAdminResetErrorPath(rawToken: string, message: string) {
  return `/admin/reset-password/${encodeURIComponent(rawToken)}?error=${encodeURIComponent(message)}`;
}
