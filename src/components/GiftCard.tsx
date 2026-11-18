'use client';

import { useState } from 'react';
import { GiftItem } from '@/types';
import {
  ExternalLink,
  Trash2,
  CheckCircle2,
  ZoomIn,
  DollarSign,
  Gift,
  Clock,
  Share2,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { isGiftNewlyAdded, isGiftSeen } from '@/lib/gift-utils';

interface GiftCardProps {
  gift: GiftItem;
  friendId: string;
  isOwner: boolean;
  pin?: string;
  onDeleted: () => void;
  onToggledPurchased: () => void;
  onPreviewImage: (url: string, title: string) => void;
  onEdit?: (gift: GiftItem) => void;
}

export default function GiftCard({
  gift,
  friendId,
  isOwner,
  pin,
  onDeleted,
  onToggledPurchased,
  onPreviewImage,
  onEdit
}: GiftCardProps) {
  const [loading, setLoading] = useState(false);
  const [now] = useState(() => Date.now());

  const priorityLabels = {
    high: { text: '⭐ Me encantaría', bg: 'bg-red-50 text-red-700 border-red-200' },
    medium: { text: 'Buena opción', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    low: { text: '💡 Accesible', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  const currentPriority = priorityLabels[gift.priority] || priorityLabels.high;

  // Comprobar si el regalo es nuevo y no ha sido visto aún
  const isNew = isGiftNewlyAdded(gift.createdAt, now) && !isGiftSeen(gift.id, gift.createdAt);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      const diffMs = now - date.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);

      if (diffHours < 1) return 'Hace un momento';
      if (diffHours < 24) return `Hace ${diffHours} h`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} d`;
      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return null;
    }
  };

  const relativeTime = formatRelativeTime(gift.createdAt);

  const handleDelete = async () => {
    if (!pin) return;
    if (!confirm('¿Seguro que deseas eliminar este regalo de tu lista?')) return;

    try {
      setLoading(true);
      const res = await fetch(
        `/api/friends/${encodeURIComponent(friendId)}/gifts/${encodeURIComponent(gift.id)}?pin=${encodeURIComponent(pin)}`,
        { method: 'DELETE' }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al eliminar');
      }
      onDeleted();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePurchased = async () => {
    try {
      setLoading(true);
      const nextState = !gift.isPurchased;
      const res = await fetch(
        `/api/friends/${encodeURIComponent(friendId)}/gifts/${encodeURIComponent(gift.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ isPurchased: nextState })
        }
      );
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al actualizar');
      }

      if (nextState) {
        confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      }

      onToggledPurchased();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      id={`gift-${gift.id}`}
      className={`group relative bg-white rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden shadow-sm hover:shadow-xl ${
        gift.isPurchased
          ? 'border-emerald-300/80 bg-emerald-50/15'
          : 'border-slate-200/90 hover:border-slate-300 hover:-translate-y-1'
      }`}
    >
      {/* Contenedor de Imagen o Captura */}
      <div className="relative w-full h-56 bg-slate-100 overflow-hidden">
        {gift.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gift.imageUrl}
              alt={gift.title}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-500 ease-out"
              onClick={() => onPreviewImage(gift.imageUrl!, gift.title)}
            />
            {/* Botón de ampliar foto */}
            <button
              onClick={() => onPreviewImage(gift.imageUrl!, gift.title)}
              className="absolute bottom-3 right-3 bg-slate-900/80 hover:bg-slate-900 text-white p-2 rounded-xl backdrop-blur-md opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-all shadow-md active:scale-90"
              title="Ampliar captura en pantalla completa"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-6 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200/60 flex items-center justify-center text-3xl mb-2 group-hover:scale-110 transition-transform">
              🎁
            </div>
            <span className="text-xs font-semibold text-slate-500">Sin foto o captura</span>
            <span className="text-[11px] text-slate-400 mt-0.5">Deseo especificado en texto</span>
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-md ${currentPriority.bg}`}>
            {currentPriority.text}
          </span>

          {isNew && (
            <span className="inline-flex items-center text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full shadow-md">
              Nuevo
            </span>
          )}
        </div>

        {/* Badge superior derecho: Estado de Apartado */}
        {gift.isPurchased && (
          <div className="absolute top-3 right-3 bg-emerald-600/95 backdrop-blur-md text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1.5 z-10">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-200" />
            <span>¡Ya fue apartado!</span>
          </div>
        )}
      </div>

      {/* Contenido / Cuerpo de la tarjeta */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Título */}
          <h3 className="font-bold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-red-600 transition-colors">
            {gift.title}
          </h3>

          {/* Precio y tiempo */}
          <div className="flex items-center justify-between gap-2 mt-2">
            {gift.priceEstimate ? (
              <span className="inline-flex items-center text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-lg">
                <DollarSign className="w-3.5 h-3.5 -mr-0.5 text-emerald-600" />
                {gift.priceEstimate}
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 italic">Precio no especificado</span>
            )}

            {relativeTime && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1" title={gift.createdAt}>
                <Clock className="w-3 h-3 text-slate-400" />
                {relativeTime}
              </span>
            )}
          </div>

          {/* Notas o especificaciones del amigo */}
          {gift.notes && (
            <div className="mt-3.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-200/70 leading-relaxed">
              <span className="font-bold text-slate-800 block mb-0.5">Nota del amigo:</span>
              <p className="line-clamp-3">{gift.notes}</p>
            </div>
          )}
        </div>

        {/* Acciones del pie */}
        <div className="mt-5 pt-3.5 border-t border-slate-100 space-y-2.5">
          {gift.link && (
            <a
              href={gift.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
            >
              <span>Ver en tienda o web</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
            </a>
          )}

          <div className="flex items-center gap-2">
            {/* Botón de Apartar Regalo */}
            <button
              onClick={handleTogglePurchased}
              disabled={loading}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-sm ${
                gift.isPurchased
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {gift.isPurchased ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Apartado (clic para liberar)</span>
                </>
              ) : (
                <>
                  <span>🎁 ¡Yo le regalo esto!</span>
                </>
              )}
            </button>

            {/* Acciones del dueño (Editar y Eliminar) */}
            {isOwner && (
              <div className="flex items-center gap-1">
                {onEdit && (
                  <button
                    onClick={() => onEdit(gift)}
                    disabled={loading}
                    className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all active:scale-90"
                    title="Editar detalles de este regalo"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                )}

                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                  title="Eliminar este regalo de tu lista"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
