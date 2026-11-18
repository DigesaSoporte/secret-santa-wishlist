// Fecha de despliegue de la actualización:
// Cualquier regalo creado antes o durante esta fecha NO se considera nuevo.
// Solo los regalos creados POSTERIOR a este momento serán reconocidos como nuevos.
export const SYSTEM_UPDATE_RELEASE_TIMESTAMP = new Date('2026-11-18T16:15:00Z').getTime();

export function isGiftNewlyAdded(createdAt?: string, referenceNow?: number): boolean {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return false;

  // Si fue creado antes o durante la actualización, NO es nuevo
  if (createdTime <= SYSTEM_UPDATE_RELEASE_TIMESTAMP) {
    return false;
  }

  const now = referenceNow ?? Date.now();
  const diffMs = now - createdTime;
  // Se considera nuevo durante las primeras 48 horas posteriores a haberlo subido
  return diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;
}
