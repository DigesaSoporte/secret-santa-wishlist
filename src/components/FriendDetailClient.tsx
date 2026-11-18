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
  Gift,
  ThumbsDown,
  Shirt,
  Upload
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
      setError(null);
      const res = await fetch(`/api/friends/${friendId}`);
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setFriend(json.data);
        if (typeof window !== 'undefined') {
          localStorage.setItem(`santa_friend_${friendId}`, JSON.stringify(json.data));
        }

        const savedPin = sessionStorage.getItem(`santa_pin_${friendId}`);
        if (savedPin && savedPin === json.data.pin) {
          setUnlockedPin(savedPin);
        }
        return;
      }

      // Si el servidor devolvió error o 404 (ej. lambda reciclada en Vercel)
      throw new Error(json?.error || 'No se encontró en el servidor');
    } catch (err: unknown) {
      // Fallback de resiliencia: Buscar en localStorage
      if (typeof window !== 'undefined') {
        try {
          const cached = localStorage.getItem(`santa_friend_${friendId}`);
          if (cached) {
            const parsed = JSON.parse(cached);
            if (!parsed.gifts) parsed.gifts = [];
            setFriend(parsed);
            setError(null);

            const savedPin = sessionStorage.getItem(`santa_pin_${friendId}`);
            if (savedPin && savedPin === parsed.pin) {
              setUnlockedPin(savedPin);
            }

            // Re-sincronizar silenciosamente con el servidor
            fetch('/api/friends', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(parsed)
            }).catch(() => {});

            return;
          }
        } catch (e) {
          console.warn('LocalStorage fallback failed:', e);
        }
      }

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

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.href;
      const shareText = `¡Mira mi carpeta de deseos para el Amigo Secreto en ${friend?.name}! Entra a ver qué me gustaría recibir:`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Wishlist de ${friend?.name} | Amigo Secreto`,
            text: shareText,
            url: shareUrl
          });
          return;
        } catch {
          // Si el usuario canceló el diálogo nativo, no hacemos nada o copiamos
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center">
        <SnowEffect />
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Cargando carpeta...</p>
      </div>
    );
  }

  if (error || !friend) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <span className="text-5xl">🎄</span>
          <h2 className="text-2xl font-black text-slate-800 mt-4">Carpeta no encontrada</h2>
          <p className="text-xs text-slate-500 mt-2">
            No encontramos la lista de deseos para este amigo.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 mt-6 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
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
    <div className="min-h-screen flex flex-col bg-[#fcfbf9] relative">
      <SnowEffect />
      <Navbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-28 sm:pb-8 relative z-10">
        {/* Barra superior */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver todos los amigos</span>
          </Link>

          <button
            onClick={handleShare}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm transition-all"
          >
            <Share2 className="w-4 h-4 text-red-600" />
            <span>{copiedLink ? '¡Link copiado!' : 'Compartir mi link'}</span>
          </button>
        </div>

        {/* Tarjeta Perfil */}
        <section className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-4xl shrink-0">
                {friend.avatar || '🎅'}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Carpeta de Deseos
                  </span>
                  {isOwner && (
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                      <Unlock className="w-3 h-3" /> Modo Edición Activo
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                  Lista de {friend.name}
                </h1>

                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Gift className="w-3.5 h-3.5 text-red-500" />
                  <span>
                    <strong>{friend.gifts.length}</strong> {friend.gifts.length === 1 ? 'idea' : 'ideas'} en su wishlist
                  </span>
                </p>
              </div>
            </div>

            {/* Acciones del dueño */}
            <div className="flex items-center gap-2">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setIsAddGiftOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>+ Subir fotos o regalos</span>
                  </button>
                  <button
                    onClick={handleLockOwner}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-semibold rounded-xl"
                    title="Cerrar modo edición"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setIsPinModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-300" />
                  <span>¿Eres {friend.name}? Editar lista</span>
                </button>
              )}
            </div>
          </div>

          {/* Detalles opcionales (tallas, gustos) */}
          {(friend.bio || friend.dislikes || friend.shirtSize || friend.shoeSize) && (
            <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {friend.bio && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-0.5">Gustos o pasatiempos:</span>
                  <p className="text-slate-600">{friend.bio}</p>
                </div>
              )}

              {(friend.shirtSize || friend.shoeSize) && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                  <span className="font-bold text-slate-800 block mb-0.5 flex items-center gap-1">
                    <Shirt className="w-3.5 h-3.5" /> Tallas:
                  </span>
                  <p className="text-slate-600">
                    {friend.shirtSize && <span>Ropa: <strong>{friend.shirtSize}</strong> </span>}
                    {friend.shoeSize && <span>Calzado: <strong>{friend.shoeSize}</strong></span>}
                  </p>
                </div>
              )}

              {friend.dislikes && (
                <div className="bg-rose-50/70 p-3 rounded-xl border border-rose-200/60">
                  <span className="font-bold text-rose-900 block mb-0.5 flex items-center gap-1">
                    <ThumbsDown className="w-3.5 h-3.5 text-rose-600" /> NO regalar / Alergias:
                  </span>
                  <p className="text-slate-700">{friend.dislikes}</p>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Wishlist */}
        <section className="mt-8">
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Regalos deseados ({friend.gifts.length})
              </h2>
              <p className="text-xs text-slate-500">
                Fotos y capturas de lo que le gustaría recibir.
              </p>
            </div>

            {friend.gifts.length > 0 && (
              <button
                onClick={() => {
                  if (isOwner) {
                    setIsAddGiftOpen(true);
                  } else {
                    setIsPinModalOpen(true);
                  }
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 hover:underline flex items-center gap-1"
              >
                <Plus className="w-4 h-4" /> Agregar más
              </button>
            )}
          </div>

          {/* Grid de Regalos */}
          {displayedGifts.length === 0 ? (
            <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
              <span className="text-5xl">🎁</span>
              <h3 className="text-base font-bold text-slate-900 mt-3">
                {friend.name} aún no ha subido regalos
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Puedes subir fotos, capturas de pantalla de tiendas o enlaces.
              </p>

              <button
                onClick={() => {
                  if (isOwner) {
                    setIsAddGiftOpen(true);
                  } else {
                    setIsPinModalOpen(true);
                  }
                }}
                className="mt-5 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                + Subir fotos o capturas de lo que quiero
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

      {/* Barra de acción fija inferior en celulares (Mobile Sticky Action Bar) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center gap-2">
        {isOwner ? (
          <button
            onClick={() => setIsAddGiftOpen(true)}
            className="flex-1 h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>+ Subir fotos o capturas</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex-1 h-12 bg-slate-900 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-sm flex items-center justify-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <span>¿Eres {friend.name}? Editar</span>
            </button>
            <button
              onClick={handleShare}
              className="h-12 px-4 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-4 h-4 text-red-600" />
              <span>Compartir</span>
            </button>
          </>
        )}
      </div>

      {/* Modal PIN */}
      <PinVerifyModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handleUnlockPin}
        friendName={friend.name}
      />

      {/* Modal Agregar Regalos (Soporta 1 o 40 fotos en lote) */}
      {isOwner && unlockedPin && (
        <AddGiftModal
          isOpen={isAddGiftOpen}
          onClose={() => setIsAddGiftOpen(false)}
          friendId={friend.id}
          pin={unlockedPin}
          onGiftAdded={fetchFriendData}
        />
      )}

      {/* Modal Ampliar Fotos */}
      <ImagePreviewModal
        imageUrl={previewImage?.url || null}
        title={previewImage?.title || ''}
        onClose={() => setPreviewImage(null)}
      />
    </div>
  );
}
