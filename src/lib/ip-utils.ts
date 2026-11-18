export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return 'IP no disponible';
}

export function getClientUserAgent(request: Request): string {
  return request.headers.get('user-agent') || 'Desconocido';
}

