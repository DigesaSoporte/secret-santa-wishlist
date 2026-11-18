'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SnowEffect from '@/components/SnowEffect';
import GiftCard from '@/components/GiftCard';
import AddGiftModal from '@/components/AddGiftModal';
import PinVerifyModal from '@/components/PinVerifyModal';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import { FriendWithGifts } from '@/types';
import {
  ArrowLeft,
  Plus,
  Share2,
  Lock,
  Unlock,
  Sparkles,
  Gift,
  ThumbsDown,
  Shirt
} from 'lucide-react';

interface FriendDetailClientProps {
  friendId: string;
}

export default function FriendDetailClient({ friendId }: FriendDetailClientProps) {
  const [friend, setFriend] = useState<FriendWithGifts | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de autenticación del dueño con PIN
  const [unlockedPin, setUnlockedPin] = useState<string | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isAddGiftOpen, setIsAddGiftOpen] = useState(false);

  // Modal para ampliar foto
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Filtro de prioridad
  const [filterPriority, setFilterPriority] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Copiado de enlace
  const [copiedLink, setCopiedLink] = useState(false);

  const fetchFriendData = async () => {
    if (!friendId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/friends/${friendId}`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se encontró la carpeta');
      }
      setFriend(json.data);

      // Comprobar si hay PIN guardado en sessionStorage para esta carpeta
      const savedPin = sessionStorage.getItem(`santa_pin_${friendId}`);
      if (savedPin && savedPin === json.data.pin) {
        setUnlockedPin(savedPin);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendData();
  }, [friendId]);

  const handleUnlockPin = (pin: string) => {
    if (friend && pin === friend.pin) {
      setUnlockedPin(pin);
      sessionStorage.setItem(`santa_pin_${friendId}`, pin);
      setIsPinModalOpen(false);
      setIsAddGiftOpen(true);
    } else {
      alert('PIN incorrecto. Intenta de nuevo.');
    }
  };

  const handleLockOwner = () => {
    setUnlockedPin(null);
    sessionStorage.removeItem(`santa_pin_${friendId}`);
  };

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center">
        <SnowEffect />
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Abriendo la carpeta de regalos...</p>
      </div>
    );
  }

  if (error || !friend) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <span className="text-6xl">🎄</span>
          <h2 className="text-2xl font-black text-slate-800 mt-4">Carpeta no encontrada</h2>
          <p className="text-xs text-slate-500 mt-2">
            No encontramos la lista de deseos para este amigo o fue eliminada.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a la lista de amigos
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = Boolean(unlockedPin && unlockedPin === friend.pin);

  const displayedGifts = friend.gifts.filter((g) => {
    if (filterPriority === 'all') return true;
    return g.priority === filterPriority;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#fdfbf7] relative">
      <SnowEffect />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 relative z-10">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-emerald-800 hover:text-emerald-950 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-emerald-900/10 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver todas las carpetas</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white/80 hover:bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <Share2 className="w-3.5 h-3.5 text-red-600" />
            <span>{copiedLink ? '¡Enlace copiado!' : 'Compartir link'}</span>
          </button>
        </div>

        {/* Tarjeta Perfil del Amigo */}
        <section className="bg-white/90 rounded-3xl p-6 sm:p-8 border border-emerald-950/10 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-red-100/50 via-amber-100/30 to-transparent rounded-bl-full pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-start sm:items-center gap-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-br from-emerald-100 via-amber-50 to-red-100 border-2 border-white shadow-md flex items-center justify-center text-4xl sm:text-5xl shrink-0">
                {friend.avatar || '🎅'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                    Carpeta de Deseos
                  </span>
                  {isOwner && (
                    <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200/60 flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Modo Dueño
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-4xl font-black text-slate-900 mt-1">
                  Lista de {friend.name}
                </h1>

                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-red-500" />
                  <span>
                    <strong>{friend.gifts.length}</strong> {friend.gifts.length === 1 ? 'idea de regalo' : 'ideas de regalo'} registradas
                  </span>
                </p>
              </div>
            </div>

            {/* Botones de acción del Dueño */}
            <div className="flex flex-wrap sm:flex-col items-stretch gap-2.5">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setIsAddGiftOpen(true)}
                    className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold rounded-xl shadow-md shadow-red-900/30 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ Agregar nuevo regalo</span>
                  </button>
                  <button
                    onClick={handleLockOwner}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Bloquear edición</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="px-5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-950/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>¿Eres {friend.name}? Editar mi lista</span>
                </button>
              )}
            </div>
          </div>

          {/* Información complementaria: Gustos, Tallas y Disgustos */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            {/* Bio / Gustos */}
            <div className="bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/50">
              <span className="font-bold text-amber-900 flex items-center gap-1.5 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Gustos y Pasatiempos:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {friend.bio || 'No especificó gustos generales.'}
              </p>
            </div>

            {/* Tallas */}
            <div className="bg-emerald-50/70 p-3.5 rounded-2xl border border-emerald-200/50">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5 mb-1.5">
                <Shirt className="w-3.5 h-3.5 text-emerald-600" />
                Tallas de {friend.name}:
              </span>
              <div className="space-y-1 text-slate-700">
                <p>
                  <strong>Ropa:</strong> {friend.shirtSize || 'No especificada'}
                </p>
                <p>
                  <strong>Calzado:</strong> {friend.shoeSize || 'No especificada'}
                </p>
              </div>
            </div>

            {/* Qué NO regalarle */}
            <div className="bg-rose-50/70 p-3.5 rounded-2xl border border-rose-200/50">
              <span className="font-bold text-rose-900 flex items-center gap-1.5 mb-1">
                <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                Lo que NO le gusta / Alergias:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {friend.dislikes || '¡Le gusta casi todo!'}
              </p>
            </div>
          </div>
        </section>

        {/* Sección de Wishlist */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-2">
                Deseos y Posibles Regalos 🎁
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fotos, capturas y links directos para que su amigo secreto acierte al 100%.
              </p>
            </div>

            {/* Filtros de Prioridad */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                onClick={() => setFilterPriority('all')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterPriority === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Todos ({friend.gifts.length})
              </button>
              <button
                onClick={() => setFilterPriority('high')}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  filterPriority === 'high'
                    ? 'bg-red-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⭐ Máximo Deseo
              </button>
            </div>
          </div>

          {/* Grid de Regalos */}
          {displayedGifts.length === 0 ? (
            <div className="bg-white/80 rounded-3xl p-10 text-center border border-slate-200/80 shadow-sm max-w-md mx-auto">
              <span className="text-5xl">🎁</span>
              <h3 className="text-lg font-bold text-slate-800 mt-3">
                {friend.gifts.length === 0
                  ? `${friend.name} aún no ha agregado regalos`
                  : 'No hay regalos en este filtro'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {friend.gifts.length === 0
                  ? 'Si eres tú, desbloquea tu carpeta con tu PIN para agregar tus fotos y links.'
                  : 'Cambia el filtro para ver los demás regalos.'}
              </p>

              {friend.gifts.length === 0 && (
                <button
                  onClick={() => {
                    if (isOwner) {
                      setIsAddGiftOpen(true);
                    } else {
                      setIsPinModalOpen(true);
                    }
                  }}
                  className="mt-5 px-5 py-2.5 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  + Agregar primer regalo
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  friendId={friend.id}
                  isOwner={isOwner}
                  pin={unlockedPin || undefined}
                  onDeleted={fetchFriendData}
                  onToggledPurchased={fetchFriendData}
                  onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal para verificar PIN */}
      <PinVerifyModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleUnlockPin}
        friendName={friend.name}
      />

      {/* Modal para agregar regalo */}
      {isOwner && unlockedPin && (
        <AddGiftModal
          isOpen={isAddGiftOpen}
          onClose={() => setIsAddGiftOpen(false)}
          friendId={friend.id}
          pin={unlockedPin}
          onGiftAdded={fetchFriendData}
        />
      )}

      {/* Modal para ampliar fotos/capturas */}
      <ImagePreviewModal
        imageUrl={previewImage?.url || null}
        title={previewImage?.title || ''}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}

