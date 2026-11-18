'use client';

import Link from 'next/link';
import { Gift, Users } from 'lucide-react';

interface NavbarProps {
  onOpenCreate?: () => void;
}

export default function Navbar({ onOpenCreate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-[#0c2017]/95 backdrop-blur-md border-b border-emerald-900/40 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white">
              Amigo Secreto
            </span>
            <p className="text-[11px] text-emerald-300/80 font-medium -mt-1">
              Carpetas & Wishlists
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-900/50 transition-colors"
          >
            <Users className="w-4 h-4" />
            Ver Amigos
          </Link>

          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition-all active:scale-95"
            >
              <span>+ Crear mi carpeta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
