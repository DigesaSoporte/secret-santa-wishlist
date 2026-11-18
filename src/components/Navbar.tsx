'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Gift, Users, Bell, Sparkles } from 'lucide-react';
import RecentGiftsModal from '@/components/RecentGiftsModal';
import { RecentGiftNotification } from '@/types';

interface NavbarProps {
  onOpenCreate?: () => void;
}

export default function Navbar({ onOpenCreate }: NavbarProps) {
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const checkRecentGifts = async () => {
    try {
      const res = await fetch('/api/gifts/recent?limit=20', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        if (typeof window !== 'undefined') {
          const lastSeen = localStorage.getItem('santa_last_seen_gift_time');
          if (lastSeen) {
            const lastSeenTime = new Date(lastSeen).getTime();
            const unread = json.data.filter(
              (g: RecentGiftNotification) => new Date(g.createdAt).getTime() > lastSeenTime
            ).length;
            setNewCount(unread);
          } else {
            // Si nunca ha entrado, mostrar regalos de las últimas 48 horas
            const threshold = Date.now() - 48 * 60 * 60 * 1000;
            const unread = json.data.filter(
              (g: RecentGiftNotification) => new Date(g.createdAt).getTime() > threshold
            ).length;
            setNewCount(unread);
          }
        }
      }
    } catch {}
  };

  useEffect(() => {
    checkRecentGifts();
  }, []);

  const handleMarkAllSeen = () => {
    setNewCount(0);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-[#0c2017]/95 backdrop-blur-md border-b border-emerald-900/40 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Gift className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5">
                Amigo Secreto
                <Sparkles className="w-3.5 h-3.5 text-amber-400 opacity-90 hidden sm:inline" />
              </span>
              <p className="text-[11px] text-emerald-300/80 font-medium -mt-1">
                Carpetas & Wishlists
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Botón de Alertas y Novedades */}
            <button
              onClick={() => {
                setIsRecentOpen(true);
                setNewCount(0);
              }}
              className="relative flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-900/60 border border-emerald-800/40 transition-all active:scale-95"
              title="Ver novedades y regalos recientes"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Novedades</span>
              {newCount > 0 && (
                <span className="bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full animate-pulse shadow-sm">
                  {newCount}
                </span>
              )}
            </button>

            <Link
              href="/"
              className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-200 hover:text-white rounded-xl hover:bg-emerald-900/50 transition-colors"
            >
              <Users className="w-4 h-4" />
              Ver Amigos
            </Link>

            {onOpenCreate && (
              <button
                onClick={onOpenCreate}
                className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl shadow-md transition-all active:scale-95"
              >
                <span>+ Crear mi carpeta</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Modal de Regalos Recientes y Novedades */}
      <RecentGiftsModal
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
        onMarkAllSeen={handleMarkAllSeen}
      />
    </>
  );
}
