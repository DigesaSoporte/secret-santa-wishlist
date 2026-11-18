export const DEFAULT_ADMIN_SECRET = 'santa-admin-2024';

export function verifyAdmin(request: Request): boolean {
  const adminSecret = process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;

  // 1. Header Authorization
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (token === adminSecret) return true;
  }

  // 2. Query param
  const url = new URL(request.url);
  const queryKey = url.searchParams.get('adminKey') || url.searchParams.get('key');
  if (queryKey && queryKey.trim() === adminSecret) {
    return true;
  }

  // 3. Custom Header
  const customHeader = request.headers.get('x-admin-key');
  if (customHeader && customHeader.trim() === adminSecret) {
    return true;
  }

  return false;
}

