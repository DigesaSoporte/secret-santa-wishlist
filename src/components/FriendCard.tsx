import Link from 'next/link';
import { FriendWithGifts } from '@/types';
import { Gift, ChevronRight } from 'lucide-react';

interface FriendCardProps {
  friend: FriendWithGifts;
}

export default function FriendCard({ friend }: FriendCardProps) {
  const giftCount = friend.gifts.length;
  const purchasedCount = friend.gifts.filter((g) => g.isPurchased).length;

  return (
    <Link
      href={`/amigo/${friend.id}`}
      className="group bg-white hover:bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm hover:shadow-lg hover:border-slate-300 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-3xl shrink-0 group-hover:scale-105 transition-transform">
            {friend.avatar || '🎅'}
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-red-600 transition-colors truncate">
              {friend.name}
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
              <Gift className="w-3.5 h-3.5 text-red-500" />
              <span className="font-semibold text-slate-700">{giftCount}</span>{' '}
              {giftCount === 1 ? 'regalo deseado' : 'regalos deseados'}
            </p>
          </div>
        </div>

        {/* Bio / Notas de gustos */}
        {friend.bio && (
          <p className="mt-3.5 text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
            {friend.bio}
          </p>
        )}

        {/* Tallas si existen */}
        {(friend.shirtSize || friend.shoeSize) && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {friend.shirtSize && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                Ropa: {friend.shirtSize}
              </span>
            )}
            {friend.shoeSize && (
              <span className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                Calzado: {friend.shoeSize}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-700 group-hover:text-red-600 transition-colors flex items-center gap-1">
          Abrir lista de deseos
          <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>

        {purchasedCount > 0 && (
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded-full">
            {purchasedCount} apartado(s)
          </span>
        )}
      </div>
    </Link>
  );
}
