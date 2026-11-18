'use client';

import { useState } from 'react';
import { X, Gift, MessageSquare, Check, Shield } from 'lucide-react';
import { GiftItem } from '@/types';

interface ReserveGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: GiftItem;
  friendName: string;
  onConfirm: (alias: string, comment?: string) => Promise<void> | void;
}

const QUICK_CLUES = [
  '🤫 ¡Me tocaste vos!',
  '👀 ¡Preparate!',
  '🎁 Ya lo compré',
  '🤫 No sospeches de mí',
  '🎉 ¡Te va a encantar!',
  '🎄 Sorpresa navideña'
];

export default function ReserveGiftModal({
  isOpen,
  onClose,
  gift,
  friendName,
  onConfirm
}: ReserveGiftModalProps) {
  const [alias, setAlias] = useState('Tu Amigo Secreto 🤫');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSelectChip = (chip: string) => {
    setComment(chip);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      const chosenAlias = alias.trim() || 'Tu Amigo Secreto 🤫';
      await onConfirm(chosenAlias, comment.trim() || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al apartar el regalo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera festiva */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-700 text-white p-5 sm:p-6 relative">
          <button
            onClick={onClose}
            disabled={loading}
            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-inner">
              🎁
            </div>
            <div>
              <h2 className="text-lg font-black text-white leading-tight">
                Apartar este regalo
              </h2>
              <p className="text-xs text-red-100 mt-0.5">
                Para <strong>{friendName}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Resumen del regalo a apartar */}
        <div className="px-5 sm:px-6 pt-4 pb-2 bg-slate-50 border-b border-slate-100 flex items-center gap-3">
          {gift.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={gift.imageUrl}
              alt={gift.title}
              className="w-12 h-12 object-cover rounded-xl border border-slate-200"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xl">
              🎁
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-800 truncate">{gift.title}</h4>
            {gift.priceEstimate && (
              <span className="text-[11px] font-semibold text-emerald-700">
                {gift.priceEstimate}
              </span>
            )}
          </div>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-200">
              {error}
            </div>
          )}

          {/* Campo 1: Alias o Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-red-600" />
              ¿Quién aparta? (Nombre o Alias secreto):
            </label>
            <input
              type="text"
              value={alias}
              onChange={(e) => setAlias(e.target.value)}
              maxLength={40}
              placeholder="Ej: Tu Amigo Secreto 🤫 o tu nombre"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Tip: Deja &ldquo;Tu Amigo Secreto 🤫&rdquo; para mantener la sorpresa hasta el día del intercambio.
            </p>
          </div>

          {/* Campo 2: Pista o Comentario divertido */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-red-600" />
              Pista o comentario divertido (opcional):
            </label>
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              maxLength={120}
              placeholder="Ej: ¡Me tocaste vos!, Ya lo compré, No sospeches de mí..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:bg-white transition-all"
            />

            {/* Chips rápidos de sugerencia */}
            <div className="mt-2 flex flex-wrap gap-1.5">
              {QUICK_CLUES.map((chip) => (
                <button
                  type="button"
                  key={chip}
                  onClick={() => handleSelectChip(chip)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border transition-all active:scale-95 ${
                    comment === chip
                      ? 'bg-red-50 border-red-300 text-red-700 font-bold'
                      : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Apartando...' : '¡Confirmar y apartar regalo!'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
