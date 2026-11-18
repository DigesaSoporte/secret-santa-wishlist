'use client';

import { useState } from 'react';
import { GiftItem } from '@/types';
import { ExternalLink, Trash2, CheckCircle2, ZoomIn, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';

interface GiftCardProps {
  gift: GiftItem;
  friendId: string;
  isOwner: boolean;
  pin?: string;
  onDeleted: () => void;
  onToggledPurchased: () => void;
  onPreviewImage: (url: string, title: string) => void;
}

export default function GiftCard({
  gift,
  friendId,
  isOwner,
  pin,
  onDeleted,
  onToggledPurchased,
  onPreviewImage
}: GiftCardProps) {
  const [loading, setLoading] = useState(false);

  const priorityLabels = {
    high: { text: '⭐ Me encantaría', bg: 'bg-red-50 text-red-700 border-red-200' },
    medium: { text: '✨ Buena opción', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    low: { text: '💡 Accesible', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  const currentPriority = priorityLabels[gift.priority] || priorityLabels.high;

  const handleDelete = async () => {
    if (!pin) return;
    if (!confirm('¿Seguro que deseas eliminar este regalo de tu lista?')) return;

    try {
      setLoading(true);
      const res = await fetch(`/api/friends/${friendId}/gifts/${gift.id}?pin=${encodeURIComponent(pin)}`, {
        method: 'DELETE'
      });
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
      const res = await fetch(`/api/friends/${friendId}/gifts/${gift.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPurchased: nextState })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al actualizar');
      }

      if (nextState) {
        confetti({ particleCount: 35, spread: 50, origin: { y: 0.6 } });
      }

      onToggledPurchased();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={`relative bg-white rounded-2xl border transition-all duration-200 flex flex-col overflow-hidden ${
        gift.isPurchased
          ? 'border-emerald-300 bg-emerald-50/20 shadow-sm'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      }`}
    >
      {/* Imagen / Captura */}
      <div className="relative w-full h-56 bg-slate-100 overflow-hidden group">
        {gift.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-full h-full object-cover cursor-pointer group-hover:scale-105 transition-transform duration-300"
              onClick={() => onPreviewImage(gift.imageUrl!, gift.title)}
            />
            <button
              onClick={() => onPreviewImage(gift.imageUrl!, gift.title)}
              className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black text-white p-2 rounded-xl backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              title="Ampliar captura"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-4 text-center">
            <span className="text-3xl mb-1">🎁</span>
            <span className="text-xs font-medium">Sin captura adjunta</span>
          </div>
        )}

        {/* Prioridad */}
        <div className="absolute top-2.5 left-2.5">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm backdrop-blur-md ${currentPriority.bg}`}>
            {currentPriority.text}
          </span>
        </div>

        {/* Si ya fue apartado */}
        {gift.isPurchased && (
          <div className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full shadow-sm flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apartado</span>
          </div>
        )}
      </div>

      {/* Contenido */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
            {gift.title}
          </h3>

          {gift.priceEstimate && (
            <p className="text-xs font-semibold text-emerald-800 mt-1 flex items-center gap-0.5">
              <DollarSign className="w-3.5 h-3.5 -mr-1" />
              <span>{gift.priceEstimate}</span>
            </p>
          )}

          {gift.notes && (
            <p className="mt-2 text-xs text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-200/60 leading-relaxed">
              <strong className="text-slate-700">Nota:</strong> {gift.notes}
            </p>
          )}
        </div>

        {/* Acciones */}
        <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
          {gift.link ? (
            <a
              href={gift.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Ver en tienda o web</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          ) : null}

          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePurchased}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                gift.isPurchased
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
              }`}
            >
              {gift.isPurchased ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Apartado (clic para liberar)</span>
                </>
              ) : (
                <span>🎁 ¡Yo le regalo esto!</span>
              )}
            </button>

            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                title="Eliminar este regalo"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
