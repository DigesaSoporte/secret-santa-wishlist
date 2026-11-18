'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FriendWithGifts } from '@/types';
import { Gift, ChevronRight, CheckCircle2 } from 'lucide-react';
import { isGiftNewlyAdded, isGiftSeen } from '@/lib/gift-utils';

interface FriendCardProps {
  friend: FriendWithGifts;
}

export default function FriendCard({ friend }: FriendCardProps) {
  const [now] = useState(() => Date.now());
  const giftCount = friend.gifts.length;
  const purchasedCount = friend.gifts.filter((g) => g.isPurchased).length;

  // Comprobar si tiene algún regalo añadido DESPUÉS de la actualización que no ha sido visto
  const hasNewGifts = friend.gifts.some((g) => isGiftNewlyAdded(g.createdAt, now) && !isGiftSeen(g.id, g.createdAt));

  return (
    <Link
      href={`/amigo/${encodeURIComponent(friend.id)}`}
      className="group bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-slate-300 hover:-translate-y-1 transition-all duration-200 flex flex-col justify-between relative overflow-hidden"
    >
      <div>
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-xs">
            {friend.avatar || '🎅'}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
                {friend.name}
              </h3>
            </div>

            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Gift className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-slate-700">{giftCount}</span>{' '}
              {giftCount === 1 ? 'idea en su lista' : 'ideas en su lista'}
            </p>
          </div>
        </div>

        {/* Badge de regalos nuevos (solo si se agregaron después de la actualización) */}
        {hasNewGifts && (
          <div className="mt-3">
            <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 border border-amber-500/30 px-2 py-0.5 rounded-full">
              Novedad agregada
            </span>
          </div>
        )}

        {/* Bio / Notas de gustos */}
        {friend.bio && (
          <p className="mt-3 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            {friend.bio}
          </p>
        )}

        {/* Tallas si existen */}
        {(friend.shirtSize || friend.shoeSize) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {friend.shirtSize && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/50">
                Ropa: <strong>{friend.shirtSize}</strong>
              </span>
            )}
            {friend.shoeSize && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/50">
                Calzado: <strong>{friend.shoeSize}</strong>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-700 group-hover:text-red-600 transition-colors flex items-center gap-1">
          Abrir carpeta
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>

        {purchasedCount > 0 ? (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/90 px-2.5 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            {purchasedCount} apartado(s)
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">
            {giftCount > 0 ? 'Disponible' : 'Sin deseos'}
          </span>
        )}
      </div>
    </Link>
  );
}
