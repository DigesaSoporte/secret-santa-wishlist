// Manejo de estado de lectura/visto de regalos y novedades

export const SYSTEM_UPDATE_RELEASE_TIMESTAMP = new Date('2026-11-18T16:15:00Z').getTime();

export function isGiftNewlyAdded(createdAt?: string, referenceNow?: number): boolean {
  if (!createdAt) return false;
  const createdTime = new Date(createdAt).getTime();
  if (isNaN(createdTime)) return false;

  // Si fue creado antes de la actualización, no es una novedad del sistema
  if (createdTime <= SYSTEM_UPDATE_RELEASE_TIMESTAMP) {
    return false;
  }

  const now = referenceNow ?? Date.now();
  const diffMs = now - createdTime;
  return diffMs >= 0 && diffMs < 48 * 60 * 60 * 1000;
}

/**
 * Obtiene el conjunto de IDs de regalos que el usuario ya marcó como vistos.
 */
export function getSeenGiftIds(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem('santa_seen_gift_ids');
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {}
  return new Set();
}

/**
 * Obtiene la marca de tiempo (timestamp) en la que el usuario hizo "Marcar todas como vistas".
 */
export function getLastSeenTimestamp(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem('santa_last_seen_gift_time');
    if (raw) {
      const time = new Date(raw).getTime();
      if (!isNaN(time)) return time;
    }
  } catch {}
  return 0;
}

/**
 * Determina si un regalo específico ya fue visto por el usuario.
 */
export function isGiftSeen(
  giftId: string,
  createdAt?: string,
  seenIds?: Set<string>,
  lastSeenTime?: number
): boolean {
  const ids = seenIds ?? getSeenGiftIds();
  // 1. Si el ID específico está en la lista de vistos
  if (ids.has(giftId)) return true;

  // 2. Si se marcó todo como visto en un timestamp posterior a la creación de este regalo
  const cutoff = lastSeenTime ?? getLastSeenTimestamp();
  if (cutoff > 0 && createdAt) {
    const createdTime = new Date(createdAt).getTime();
    if (createdTime <= cutoff) return true;
  }

  return false;
}

/**
 * Marca un regalo individual como visto.
 */
export function markGiftAsSeen(giftId: string): void {
  if (typeof window === 'undefined') return;
  try {
    const ids = getSeenGiftIds();
    ids.add(giftId);
    localStorage.setItem('santa_seen_gift_ids', JSON.stringify(Array.from(ids)));
    window.dispatchEvent(new CustomEvent('santa_gifts_seen_updated'));
  } catch {}
}

/**
 * Marca todos los regalos dados como vistos y actualiza el timestamp general.
 */
export function markAllGiftsAsSeen(allGiftIds: string[] = []): void {
  if (typeof window === 'undefined') return;
  try {
    const nowIso = new Date().toISOString();
    localStorage.setItem('santa_last_seen_gift_time', nowIso);

    const ids = getSeenGiftIds();
    allGiftIds.forEach((id) => ids.add(id));
    localStorage.setItem('santa_seen_gift_ids', JSON.stringify(Array.from(ids)));

    window.dispatchEvent(new CustomEvent('santa_gifts_seen_updated'));
  } catch {}
}

/**
 * Representa la información de reserva o apartado de un regalo
 */
export interface ParsedReservation {
  by: string;
  msg?: string;
}

/**
 * Parsea el string `purchasedBy` (JSON o texto plano) de forma segura y retrocompatible.
 */
export function parsePurchasedBy(raw?: string | null): ParsedReservation | null {
  if (!raw || !raw.trim()) return null;
  const str = raw.trim();

  // Si fue guardado como objeto JSON
  if (str.startsWith('{') && str.endsWith('}')) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === 'object') {
        return {
          by: (parsed.by || 'Tu Amigo Secreto 🤫').trim(),
          msg: parsed.msg && typeof parsed.msg === 'string' ? parsed.msg.trim() : undefined
        };
      }
    } catch {}
  }

  // Formato delimitado por " ~ "
  if (str.includes(' ~ ')) {
    const [by, ...rest] = str.split(' ~ ');
    return {
      by: (by || 'Tu Amigo Secreto 🤫').trim(),
      msg: rest.join(' ~ ').trim() || undefined
    };
  }

  // Formato delimitado por ": "
  if (str.includes(': ')) {
    const [by, ...rest] = str.split(': ');
    return {
      by: (by || 'Tu Amigo Secreto 🤫').trim(),
      msg: rest.join(': ').trim() || undefined
    };
  }

  // Texto simple (solo alias/nombre)
  return { by: str };
}

/**
 * Formatea los datos de reserva para almacenarlos en `purchased_by` / `purchasedBy`.
 */
export function formatPurchasedBy(by: string, msg?: string): string {
  const cleanBy = by.trim() || 'Tu Amigo Secreto 🤫';
  const cleanMsg = msg ? msg.trim() : '';

  if (!cleanMsg) {
    return cleanBy;
  }

  return JSON.stringify({
    by: cleanBy,
    msg: cleanMsg
  });
}

