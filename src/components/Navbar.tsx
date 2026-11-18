'use client';

import Link from 'next/link';
import { Gift, Sparkles, Users } from 'lucide-react';

interface NavbarProps {
  onOpenCreate?: () => void;
}

export default function Navbar({ onOpenCreate }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-emerald-950/90 backdrop-blur-md border-b border-emerald-800/50 text-white shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-md shadow-red-900/30 group-hover:scale-105 transition-transform">
            <Gift className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight flex items-center gap-1.5 text-amber-100">
              Secret Santa <Sparkles className="w-4 h-4 text-amber-400" />
            </span>
            <p className="text-xs text-emerald-300 font-medium -mt-1">
              Carpetas de Deseos
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-900/50 transition-colors"
          >
            <Users className="w-4 h-4" />
            Amigos
          </Link>

          {onOpenCreate && (
            <button
              onClick={onOpenCreate}
              className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-md shadow-red-900/40 hover:shadow-red-800/50 active:scale-95 transition-all"
            >
              <span>+ Crear mi carpeta</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

