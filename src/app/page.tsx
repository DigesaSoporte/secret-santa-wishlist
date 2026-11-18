'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SnowEffect from '@/components/SnowEffect';
import FriendCard from '@/components/FriendCard';
import CreateFriendModal from '@/components/CreateFriendModal';
import RecentGiftsModal from '@/components/RecentGiftsModal';
import { FriendWithGifts } from '@/types';
import { Search, Gift, Users, ArrowRight, Bell } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { isGiftNewlyAdded } from '@/lib/gift-utils';

export default function HomePage() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendWithGifts[]>([]);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isRecentOpen, setIsRecentOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [now] = useState(() => Date.now());

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/friends', { cache: 'no-store' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        if (json.data.length > 0) {
          setFriends(json.data);
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('santa_all_friends', JSON.stringify(json.data));
            } catch {}
          }
          return;
        }
      }

      // Si el servidor devolvió vacío, verificar si hay respaldo en localStorage
      if (typeof window !== 'undefined') {
        try {
          const cachedRaw = localStorage.getItem('santa_all_friends');
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            if (Array.isArray(cached) && cached.length > 0) {
              setFriends(cached);
              return;
            }
          }
        } catch {}
      }

      setFriends([]);
    } catch (error) {
      console.error('Error fetching friends:', error);
      if (typeof window !== 'undefined') {
        try {
          const cachedRaw = localStorage.getItem('santa_all_friends');
          if (cachedRaw) {
            setFriends(JSON.parse(cachedRaw));
          }
        } catch {}
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  const filteredFriends = friends.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalGifts = friends.reduce((acc, f) => acc + (f.gifts?.length || 0), 0);

  // Cantidad de regalos creados después de esta actualización
  const newGiftsTotal = friends.reduce((acc, f) => {
    return (
      acc +
      (f.gifts || []).filter((g) => isGiftNewlyAdded(g.createdAt, now)).length
    );
  }, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9] relative">
      <SnowEffect />
      <Navbar onOpenCreate={() => setIsCreateOpen(true)} />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Banner Hero Limpio y Moderno */}
        <section className="rounded-3xl bg-[#0c2017] text-white p-6 sm:p-10 shadow-xl border border-emerald-950">
          <div className="max-w-2xl">
            <span className="inline-block text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-full mb-3">
              Intercambio Navideño
            </span>

            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-tight">
              Carpetas de Regalos del Amigo Secreto
            </h1>

            <p className="mt-2.5 text-sm sm:text-base text-emerald-100/90 leading-relaxed">
              Crea tu carpeta en segundos, sube fotos o capturas de lo que sueñas recibir y mira la carpeta de la persona que te tocó para regalarle sin fallar.
            </p>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm"
              >
                <Gift className="w-4 h-4" />
                <span>+ Crear mi carpeta</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {newGiftsTotal > 0 && (
                <button
                  onClick={() => setIsRecentOpen(true)}
                  className="px-4 py-3 bg-emerald-900/70 hover:bg-emerald-900 text-emerald-200 hover:text-white font-bold rounded-xl border border-emerald-700/60 flex items-center gap-2 transition-all active:scale-95 text-xs sm:text-sm"
                >
                  <Bell className="w-4 h-4 text-amber-400" />
                  <span>Ver {newGiftsTotal} novedades</span>
                </button>
              )}
            </div>
          </div>

          {/* Estadísticas */}
          <div className="mt-6 pt-5 border-t border-emerald-900/80 flex items-center gap-6 text-xs text-emerald-200">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span><strong>{friends.length}</strong> amigos unidos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-rose-400" />
              <span><strong>{totalGifts}</strong> ideas en wishlists</span>
            </div>
            {newGiftsTotal > 0 && (
              <div className="hidden sm:flex items-center gap-1.5 text-amber-300">
                <Bell className="w-4 h-4" />
                <span><strong>{newGiftsTotal}</strong> regalos nuevos</span>
              </div>
            )}
          </div>
        </section>

        {/* ALERTA DE REGALOS NUEVOS GLOBALES */}
        {newGiftsTotal > 0 && (
          <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center text-base shadow-xs shrink-0">
                🔔
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-950">
                  ¡Hay {newGiftsTotal} {newGiftsTotal === 1 ? 'regalo nuevo añadido' : 'regalos nuevos añadidos'} recientemente!
                </p>
                <p className="text-amber-800">
                  Descubre los últimos deseos que tus amigos han publicado para el intercambio.
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsRecentOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 self-start sm:self-auto shrink-0"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Ver novedades</span>
            </button>
          </div>
        )}

        {/* Buscador y Directorio */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Amigos Participantes
                <span className="text-xs font-semibold bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full">
                  {filteredFriends.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Haz clic en el amigo que te tocó para ver su lista de regalos.
              </p>
            </div>

            {/* Input de Búsqueda */}
            {friends.length > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar amigo por nombre..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-slate-200 focus:border-red-500 outline-none text-xs text-slate-800 shadow-sm transition-all"
                />
              </div>
            )}
          </div>

          {/* Estado de carga */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-36 bg-slate-100 animate-pulse rounded-2xl p-5" />
              ))}
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
              <span className="text-5xl">🎁</span>
              <h3 className="text-base font-bold text-slate-900 mt-3">
                {search ? `No encontramos a "${search}"` : 'Aún no hay amigos en la lista'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {search
                  ? 'Revisa el nombre o crea una carpeta nueva.'
                  : 'Crea tu carpeta primero para empezar el intercambio.'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-4 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
              >
                + Crear la primera carpeta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </section>

        {/* Guía en 3 pasos sencilla */}
        <section className="mt-12 bg-white border border-slate-200 rounded-3xl p-6 sm:p-8">
          <h3 className="text-base font-bold text-slate-900 mb-4">
            ¿Cómo funciona?
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs text-slate-600">
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="font-bold text-slate-900 block text-sm mb-1">1. Crea tu carpeta</span>
              Pon tu nombre y un PIN de 4 dígitos para proteger y poder editar tu lista cuando quieras.
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="font-bold text-slate-900 block text-sm mb-1">2. Sube tus capturas</span>
              Sube de 1 a 40 capturas de fotos, tallas, gustos o enlaces de lo que quieres recibir.
            </div>
            <div className="p-3 bg-slate-50 rounded-2xl">
              <span className="font-bold text-slate-900 block text-sm mb-1">3. Tu amigo secreto compra</span>
              Quien te sacó entra a tu carpeta y puede apartar el regalo para no duplicar.
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-12 py-5 border-t border-slate-200 bg-white text-center text-xs text-slate-400">
        Amigo Secreto • Carpetas de Deseos
      </footer>

      {/* Modal para crear amigo */}
      <CreateFriendModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newId) => {
          fetchFriends();
          router.push(`/amigo/${newId}`);
        }}
      />

      {/* Modal para ver novedades recientes */}
      <RecentGiftsModal
        isOpen={isRecentOpen}
        onClose={() => setIsRecentOpen(false)}
      />
    </div>
  );
}
