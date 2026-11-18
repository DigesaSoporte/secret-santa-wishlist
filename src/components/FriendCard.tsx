import Link from 'next/link';
import { FriendWithGifts } from '@/types';
import { Gift, HeartHandshake, Sparkles, ChevronRight } from 'lucide-react';

interface FriendCardProps {
  friend: FriendWithGifts;
}

export default function FriendCard({ friend }: FriendCardProps) {
  const giftCount = friend.gifts.length;
  const purchasedCount = friend.gifts.filter((g) => g.isPurchased).length;

  return (
    <Link
      href={`/amigo/${friend.id}`}
      className="group relative bg-white/90 hover:bg-white rounded-2xl p-6 border border-emerald-900/10 shadow-sm hover:shadow-xl hover:shadow-emerald-950/10 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden"
    >
      {/* Detalle decorativo festivo en esquina */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-amber-100/60 via-red-50/30 to-transparent rounded-bl-full pointer-events-none" />

      <div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-100 to-amber-100/70 border border-emerald-200/50 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform">
              {friend.avatar || '🎅'}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-800 group-hover:text-red-700 transition-colors flex items-center gap-2">
                {friend.name}
              </h3>
              <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                <Gift className="w-3.5 h-3.5 text-red-500" />
                <span className="font-semibold text-slate-700">{giftCount}</span> {giftCount === 1 ? 'regalo deseado' : 'regalos deseados'}
              </p>
            </div>
          </div>
        </div>

        {/* Bio / Notas de gustos */}
        {friend.bio && (
          <p className="mt-4 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-amber-50/60 p-2.5 rounded-xl border border-amber-200/40">
            {friend.bio}
          </p>
        )}

        {/* Tallas rápidas si existen */}
        {(friend.shirtSize || friend.shoeSize) && (
          <div className="flex flex-wrap gap-2 mt-3">
            {friend.shirtSize && (
              <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Camisa: {friend.shirtSize}
              </span>
            )}
            {friend.shoeSize && (
              <span className="text-[11px] font-medium bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200/60">
                Calzado: {friend.shoeSize}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span className="text-emerald-700 group-hover:text-red-600 transition-colors flex items-center gap-1">
          Ver qué le gusta
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </span>

        {purchasedCount > 0 && (
          <span className="text-[11px] font-medium text-amber-700 bg-amber-100/70 px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-600" />
            {purchasedCount} reservado(s)
          </span>
        )}
      </div>
    </Link>
  );
}

