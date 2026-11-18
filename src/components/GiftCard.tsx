'use client';

import { useState } from 'react';
import { GiftItem } from '@/types';
import { ExternalLink, Trash2, CheckCircle2, CircleDashed, ZoomIn, Sparkles, DollarSign } from 'lucide-react';
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
    high: { text: '⭐ Máximo Deseo', bg: 'bg-red-50 text-red-700 border-red-200' },
    medium: { text: '✨ Buena Idea', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
    low: { text: '💡 Detalle Accesible', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  const currentPriority = priorityLabels[gift.priority] || priorityLabels.medium;

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
        confetti({
          particleCount: 40,
          spread: 50,
          origin: { y: 0.6 }
        });
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
      className={`relative bg-white rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden ${
        gift.isPurchased
          ? 'border-emerald-300 shadow-md bg-emerald-50/20'
          : 'border-slate-200/80 hover:border-red-200 hover:shadow-xl hover:-translate-y-1'
      }`}
    >
      {/* Imagen / Captura */}
      <div className="relative w-full h-52 bg-slate-100 overflow-hidden group">
        {gift.imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 cursor-pointer"
              onClick={() => onPreviewImage(gift.imageUrl!, gift.title)}
            />
            <button
              onClick={() => onPreviewImage(gift.imageUrl!, gift.title)}
              className="absolute bottom-2.5 right-2.5 bg-black/60 hover:bg-black text-white p-2 rounded-xl backdrop-blur-sm opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
              title="Ampliar foto"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
            <span className="text-4xl mb-2">🎁</span>
            <span className="text-xs font-medium">Sin imagen adjunta</span>
          </div>
        )}

        {/* Badge de prioridad sobre la imagen */}
        <div className="absolute top-3 left-3">
          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-md ${currentPriority.bg}`}
          >
            {currentPriority.text}
          </span>
        </div>

        {/* Si ya fue apartado por el amigo secreto */}
        {gift.isPurchased && (
          <div className="absolute top-3 right-3 bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Apartado</span>
          </div>
        )}
      </div>

      {/* Contenido de la tarjeta */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-base leading-snug line-clamp-2">
            {gift.title}
          </h3>

          {/* Precio estimado si lo tiene */}
          {gift.priceEstimate && (
            <p className="text-xs font-semibold text-emerald-700 mt-1.5 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 -mr-1" />
              <span>{gift.priceEstimate}</span>
            </p>
          )}

          {/* Notas adicionales */}
          {gift.notes && (
            <p className="mt-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
              <strong className="text-slate-700">Nota:</strong> {gift.notes}
            </p>
          )}
        </div>

        {/* Acciones inferiores */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
          {/* Botón al link de la tienda */}
          {gift.link ? (
            <a
              href={gift.link}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-xs rounded-xl border border-emerald-200/80 flex items-center justify-center gap-2 transition-colors group/btn"
            >
              <span>Ver en la tienda</span>
              <ExternalLink className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
            </a>
          ) : (
            <div className="text-[11px] text-center text-slate-400 py-1">
              Sin enlace directo (búscalo en tienda)
            </div>
          )}

          {/* Función para el Amigo Secreto: Apartar / Comprar */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePurchased}
              disabled={loading}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                gift.isPurchased
                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-sm'
              }`}
            >
              {gift.isPurchased ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>¡Ya apartado! (clic para liberar)</span>
                </>
              ) : (
                <>
                  <span>🎁 ¡Yo le voy a regalar esto!</span>
                </>
              )}
            </button>

            {/* Si es el dueño y tiene su PIN desbloqueado, botón de eliminar */}
            {isOwner && (
              <button
                onClick={handleDelete}
                disabled={loading}
                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-transparent hover:border-red-200"
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

