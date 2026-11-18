'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import SnowEffect from '@/components/SnowEffect';
import FriendCard from '@/components/FriendCard';
import CreateFriendModal from '@/components/CreateFriendModal';
import { FriendWithGifts } from '@/types';
import { Sparkles, Search, Gift, Users, HeartHandshake, ArrowRight, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [friends, setFriends] = useState<FriendWithGifts[]>([]);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/friends');
      const json = await res.json();
      if (json.success) {
        setFriends(json.data);
      }
    } catch (error) {
      console.error('Error fetching friends:', error);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] relative">
      <SnowEffect />
      <Navbar onOpenCreate={() => setIsCreateOpen(true)} />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Banner Hero Festivo */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-950 via-emerald-900 to-teal-950 text-white p-6 sm:p-12 shadow-2xl border border-emerald-800/40">
          <div className="absolute top-0 right-0 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="max-w-2xl relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-800/60 border border-emerald-700/50 text-amber-300 text-xs font-semibold mb-4 backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Intercambio Navideño & Amigo Secreto</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-amber-50">
              ¡Dile a tu <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 via-rose-300 to-amber-200">Amigo Secreto</span> qué te gustaría recibir!
            </h1>

            <p className="mt-3 text-sm sm:text-base text-emerald-100/90 leading-relaxed font-normal">
              Entra a tu carpeta, sube fotos, capturas y enlaces de tus regalos soñados. Y si te tocó regalarle a alguien (ej: Kenny), entra a su carpeta y mira su lista para no equivocarte.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-6 py-3.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-xl shadow-red-950/40 hover:shadow-red-900/50 flex items-center gap-2.5 transition-all active:scale-95 text-sm"
              >
                <Gift className="w-4 h-4 text-amber-200" />
                <span>Crear mi carpeta de regalos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="mt-8 pt-6 border-t border-emerald-800/60 grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2 text-emerald-200">
              <Users className="w-4 h-4 text-amber-400" />
              <span><strong>{friends.length}</strong> amigos unidos</span>
            </div>
            <div className="flex items-center gap-2 text-emerald-200">
              <Gift className="w-4 h-4 text-rose-400" />
              <span><strong>{totalGifts}</strong> ideas en wishlists</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 text-emerald-200">
              <HeartHandshake className="w-4 h-4 text-emerald-400" />
              <span>Regalos seguros sin fallar</span>
            </div>
          </div>
        </section>

        {/* Buscador y Directorio */}
        <section className="mt-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                Carpetas de Amigos
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  {filteredFriends.length}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Haz clic en el nombre de la persona que te tocó para ver su lista de regalos.
              </p>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar amigo (ej. Kenny)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white rounded-2xl border border-slate-200 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs text-slate-800 shadow-sm transition-all"
              />
            </div>
          </div>

          {/* Estado de carga */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-44 bg-white/60 animate-pulse rounded-2xl border border-slate-200/60 p-6"
                />
              ))}
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="bg-white/80 rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto">
              <span className="text-5xl">🎅</span>
              <h3 className="text-lg font-bold text-slate-800 mt-3">
                {search ? `No encontramos a "${search}"` : 'Aún no hay amigos registrados'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {search
                  ? 'Verifica la ortografía o pídele que cree su carpeta.'
                  : '¡Sé el primero en sumarte y crear tu lista de regalos!'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md transition-colors"
              >
                + Crear la primera carpeta
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredFriends.map((friend) => (
                <FriendCard key={friend.id} friend={friend} />
              ))}
            </div>
          )}
        </section>

        {/* Cómo Funciona (3 Pasos) */}
        <section className="mt-16 bg-white/70 border border-emerald-950/10 rounded-3xl p-6 sm:p-8">
          <h3 className="text-lg font-bold text-slate-800 text-center mb-6">
            ¿Cómo funciona el Amigo Secreto? 🎄
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-700 font-bold text-sm flex items-center justify-center shrink-0">
                1
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Crea tu Carpeta</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Pon tu nombre, un PIN secreto de 4 dígitos, tus tallas y tus gustos generales.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 font-bold text-sm flex items-center justify-center shrink-0">
                2
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Sube tus Deseos</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Agrega fotos o capturas de lo que quieres, enlaces directos a tiendas y precios aproximados.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-sm flex items-center justify-center shrink-0">
                3
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Tu Amigo Secreto te regala</h4>
                <p className="text-xs text-slate-600 mt-1">
                  Quien te sacó en el sorteo abre tu carpeta, ve tu lista y puede apartar el regalo para no duplicar.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-16 py-6 border-t border-slate-200/80 bg-white/60 text-center text-xs text-slate-500 relative z-10">
        <p>🎄 Amigo Secreto / Secret Santa Wishlist • Creado para compartir con tus amigos</p>
      </footer>

      {/* Modal para unirse */}
      <CreateFriendModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(newId) => {
          fetchFriends();
          router.push(`/amigo/${newId}`);
        }}
      />
    </div>
  );
}
