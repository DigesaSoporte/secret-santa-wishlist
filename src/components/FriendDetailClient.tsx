'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import SnowEffect from '@/components/SnowEffect';
import GiftCard from '@/components/GiftCard';
import AddGiftModal from '@/components/AddGiftModal';
import EditGiftModal from '@/components/EditGiftModal';
import EditProfileModal from '@/components/EditProfileModal';
import PinVerifyModal from '@/components/PinVerifyModal';
import ImagePreviewModal from '@/components/ImagePreviewModal';
import { FriendWithGifts, FriendProfile, GiftItem } from '@/types';
import {
  ArrowLeft,
  Plus,
  Share2,
  Lock,
  Unlock,
  Gift,
  ThumbsDown,
  Shirt,
  Upload,
  Heart,
  Bell,
  Edit3,
  Search,
  CheckCircle2
} from 'lucide-react';
import { isGiftNewlyAdded, isGiftSeen } from '@/lib/gift-utils';

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
  const [pendingAction, setPendingAction] = useState<
    'add_gift' | 'edit_profile' | { type: 'edit_gift'; gift: GiftItem } | null
  >(null);

  // Modales
  const [isAddGiftOpen, setIsAddGiftOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<GiftItem | null>(null);
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // Filtros y Búsqueda dentro de la Wishlist
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'new' | 'high' | 'available' | 'purchased'>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'priority' | 'name'>('newest');

  // Copiado de enlace & Toasts
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [, setSeenTick] = useState(0);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchFriendData = async () => {
    if (!friendId) return;
    try {
      setLoading(true);
      setError(null);
      let decodedId = friendId;
      try {
        decodedId = decodeURIComponent(friendId).trim();
      } catch {
        decodedId = friendId.trim();
      }

      const res = await fetch(`/api/friends/${encodeURIComponent(decodedId)}`, {
        cache: 'no-store'
      });
      const json = await res.json();

      if (res.ok && json.success && json.data) {
        setFriend(json.data);

        // Guardado seguro en storage del dispositivo
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(`santa_friend_${decodedId}`, JSON.stringify(json.data));
            const savedPin = sessionStorage.getItem(`santa_pin_${decodedId}`);
            if (savedPin && savedPin === json.data.pin) {
              setUnlockedPin(savedPin);
            }
          } catch {}
        }
        return;
      }

      throw new Error(json?.error || 'No se encontró la carpeta en el servidor');
    } catch (err: unknown) {
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
    const handleSeenUpdated = () => setSeenTick((t) => t + 1);
    window.addEventListener('santa_gifts_seen_updated', handleSeenUpdated);
    return () => window.removeEventListener('santa_gifts_seen_updated', handleSeenUpdated);
  }, [friendId]);

  const handleUnlockPin = (pin: string) => {
    if (friend && pin === friend.pin) {
      setUnlockedPin(pin);
      try {
        sessionStorage.setItem(`santa_pin_${friendId}`, pin);
      } catch {}
      setIsPinModalOpen(false);

      if (pendingAction === 'edit_profile') {
        setIsEditProfileOpen(true);
      } else if (pendingAction && typeof pendingAction === 'object' && pendingAction.type === 'edit_gift') {
        setEditingGift(pendingAction.gift);
      } else {
        setIsAddGiftOpen(true);
      }
      setPendingAction(null);
    } else {
      alert('PIN incorrecto. Intenta de nuevo.');
    }
  };

  const handleRequestEditGift = (giftToEdit: GiftItem) => {
    if (unlockedPin && friend && unlockedPin === friend.pin) {
      setEditingGift(giftToEdit);
    } else {
      setPendingAction({ type: 'edit_gift', gift: giftToEdit });
      setIsPinModalOpen(true);
    }
  };

  const handleGiftUpdated = (updatedGift?: GiftItem) => {
    if (!updatedGift) {
      fetchFriendData();
      return;
    }
    setFriend((prev) => {
      if (!prev) return prev;
      const nextGifts = prev.gifts.map((g) => (g.id === updatedGift.id ? updatedGift : g));
      const nextFriend = { ...prev, gifts: nextGifts };
      try {
        localStorage.setItem(`santa_friend_${prev.id}`, JSON.stringify(nextFriend));
      } catch {}
      return nextFriend;
    });
    setEditingGift(null);
    showToast('¡Regalo actualizado con éxito!');
  };

  const handleGiftDeleted = (giftId: string) => {
    setFriend((prev) => {
      if (!prev) return prev;
      const nextGifts = prev.gifts.filter((g) => g.id !== giftId);
      const nextFriend = { ...prev, gifts: nextGifts };
      try {
        localStorage.setItem(`santa_friend_${prev.id}`, JSON.stringify(nextFriend));
      } catch {}
      return nextFriend;
    });
    showToast('Regalo eliminado de tu lista');
  };

  const handleGiftPurchasedToggled = (updatedGift?: GiftItem) => {
    if (!updatedGift) {
      fetchFriendData();
      return;
    }
    setFriend((prev) => {
      if (!prev) return prev;
      const nextGifts = prev.gifts.map((g) => (g.id === updatedGift.id ? updatedGift : g));
      const nextFriend = { ...prev, gifts: nextGifts };
      try {
        localStorage.setItem(`santa_friend_${prev.id}`, JSON.stringify(nextFriend));
      } catch {}
      return nextFriend;
    });
  };

  const handleLockOwner = () => {
    setUnlockedPin(null);
    try {
      sessionStorage.removeItem(`santa_pin_${friendId}`);
    } catch {}
    showToast('Modo edición cerrado');
  };

  const handleOpenEditProfile = () => {
    if (isOwner) {
      setIsEditProfileOpen(true);
    } else {
      setPendingAction('edit_profile');
      setIsPinModalOpen(true);
    }
  };

  const handleOpenAddGifts = () => {
    if (isOwner) {
      setIsAddGiftOpen(true);
    } else {
      setPendingAction('add_gift');
      setIsPinModalOpen(true);
    }
  };

  const handleProfileUpdated = (updated: FriendProfile, effectivePin: string) => {
    if (!friend) return;
    setFriend({
      ...friend,
      name: updated.name,
      avatar: updated.avatar,
      pin: updated.pin || effectivePin,
      bio: updated.bio,
      dislikes: updated.dislikes,
      shirtSize: updated.shirtSize,
      shoeSize: updated.shoeSize
    });
    setUnlockedPin(effectivePin);
    showToast('¡Perfil actualizado con éxito!');
  };

  const handleShare = async () => {
    if (typeof window !== 'undefined') {
      const shareUrl = window.location.href;
      const shareText = `¡Mira la carpeta de deseos de ${friend?.name} para el Amigo Secreto! Entra para ver qué regalarle:`;

      if (navigator.share) {
        try {
          await navigator.share({
            title: `Wishlist de ${friend?.name} | Amigo Secreto`,
            text: shareText,
            url: shareUrl
          });
          return;
        } catch {}
      }

      await navigator.clipboard.writeText(shareUrl);
      showToast('¡Enlace copiado al portapapeles!');
    }
  };

  const isOwner = Boolean(unlockedPin && friend && unlockedPin === friend.pin);
  const [now] = useState(() => Date.now());

  // Estadísticas y Regalos
  const allGifts = useMemo(() => friend?.gifts || [], [friend?.gifts]);
  const totalGiftsCount = allGifts.length;
  const purchasedCount = allGifts.filter((g) => g.isPurchased).length;
  const availableCount = totalGiftsCount - purchasedCount;

  // Regalos nuevos (creados DESPUÉS de la actualización que no han sido vistos)
  const newGiftsCount = allGifts.filter((g) => isGiftNewlyAdded(g.createdAt, now) && !isGiftSeen(g.id, g.createdAt)).length;

  // Filtrado y Ordenamiento
  const filteredGifts = useMemo(() => {
    let result = [...allGifts];

    // Filtro por Tab
    if (filterTab === 'new') {
      result = result.filter((g) => isGiftNewlyAdded(g.createdAt, now) && !isGiftSeen(g.id, g.createdAt));
    } else if (filterTab === 'high') {
      result = result.filter((g) => g.priority === 'high');
    } else if (filterTab === 'available') {
      result = result.filter((g) => !g.isPurchased);
    } else if (filterTab === 'purchased') {
      result = result.filter((g) => g.isPurchased);
    }

    // Filtro por Búsqueda de texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter(
        (g) =>
          g.title.toLowerCase().includes(query) ||
          (g.notes && g.notes.toLowerCase().includes(query)) ||
          (g.priceEstimate && g.priceEstimate.toLowerCase().includes(query))
      );
    }

    // Ordenamiento
    if (sortBy === 'newest') {
      result.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    } else if (sortBy === 'priority') {
      const rank = { high: 3, medium: 2, low: 1 };
      result.sort((a, b) => rank[b.priority] - rank[a.priority]);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.title.localeCompare(b.title));
    }

    return result;
  }, [allGifts, filterTab, searchQuery, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col items-center justify-center">
        <SnowEffect />
        <div className="w-10 h-10 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-slate-600">Cargando carpeta de deseos...</p>
      </div>
    );
  }

  if (error || !friend) {
    return (
      <div className="min-h-screen bg-[#fcfbf9] flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-md mx-auto px-4 py-20 text-center">
          <span className="text-5xl">🎄</span>
          <h2 className="text-2xl font-black text-slate-800 mt-4">
            {error && error !== 'Carpeta no encontrada' ? 'No se pudo cargar la carpeta' : 'Carpeta no encontrada'}
          </h2>
          <p className="text-xs text-slate-500 mt-2">
            {error && error !== 'Carpeta no encontrada'
              ? error
              : 'No encontramos la lista de deseos para este amigo.'}
          </p>
          <div className="flex items-center justify-center gap-3 mt-6">
            <button
              onClick={() => fetchFriendData()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs shadow-md hover:bg-slate-800 transition-colors"
            >
              Reintentar
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs shadow-md hover:bg-red-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al inicio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9] relative">
      <SnowEffect />
      <Navbar />

      {/* Toast Feedback flotante */}
      {toastMessage && (
        <div className="fixed top-20 right-4 sm:right-6 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl border border-slate-700 animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <span>✓</span>
          <span>{toastMessage}</span>
        </div>
      )}

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-32 sm:pb-12 relative z-10">
        {/* Barra superior de navegación */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Ver todos los amigos</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShare}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-xs hover:shadow-sm transition-all"
            >
              <Share2 className="w-4 h-4 text-red-600" />
              <span>Compartir carpeta</span>
            </button>
          </div>
        </div>

        {/* Tarjeta de Perfil Rediseñada */}
        <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start sm:items-center gap-4 sm:gap-5">
              {/* Avatar con botón de edición rápido */}
              <div className="relative group shrink-0">
                <div className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 flex items-center justify-center text-4xl sm:text-5xl shadow-xs">
                  {friend.avatar || '🎅'}
                </div>
                {isOwner && (
                  <button
                    onClick={handleOpenEditProfile}
                    className="absolute -bottom-1.5 -right-1.5 bg-red-600 text-white p-1.5 rounded-xl shadow-md hover:bg-red-700 transition-colors"
                    title="Editar avatar y perfil"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-md">
                    Carpeta de Deseos
                  </span>

                  {isOwner ? (
                    <span className="text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Unlock className="w-3 h-3 text-emerald-700" />
                      Modo Edición Activo
                    </span>
                  ) : (
                    <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                      Vista para amigos
                    </span>
                  )}
                </div>

                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5 tracking-tight">
                  Lista de {friend.name}
                </h1>

                {/* Resumen de ideas / estadísticas en pastillas */}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                    <Gift className="w-3.5 h-3.5 text-red-500" />
                    <strong>{totalGiftsCount}</strong> {totalGiftsCount === 1 ? 'deseo' : 'deseos'}
                  </span>

                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/70 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <strong>{availableCount}</strong> {availableCount === 1 ? 'disponible' : 'disponibles'}
                  </span>

                  {purchasedCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-lg">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <strong>{purchasedCount}</strong> apartado(s)
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Acciones principales del perfil */}
            <div className="flex flex-wrap items-center gap-2.5">
              {isOwner ? (
                <>
                  <button
                    onClick={handleOpenAddGifts}
                    className="flex-1 sm:flex-none px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Upload className="w-4 h-4" />
                    <span>+ Subir fotos o regalos</span>
                  </button>

                  <button
                    onClick={handleOpenEditProfile}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl border border-slate-200 flex items-center gap-1.5 transition-all active:scale-95"
                  >
                    <Edit3 className="w-4 h-4 text-slate-600" />
                    <span>Editar mi perfil</span>
                  </button>

                  <button
                    onClick={handleLockOwner}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                    title="Cerrar modo edición"
                  >
                    <Lock className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleOpenAddGifts}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-2 transition-all active:scale-95"
                  >
                    <Lock className="w-3.5 h-3.5 text-amber-300" />
                    <span>¿Eres {friend.name}? Gestionar lista</span>
                  </button>

                  <button
                    onClick={handleOpenEditProfile}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 shadow-xs flex items-center gap-1.5 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Editar perfil</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Tarjetas de Información: Gustos, Tallas, Alergias */}
          <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            {/* Gustos */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Gustos o Pasatiempos:
              </span>
              <p className="text-slate-600 leading-relaxed">
                {friend.bio || (
                  <span className="text-slate-400 italic">No ha especificado gustos aún.</span>
                )}
              </p>
            </div>

            {/* Tallas */}
            <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200/60">
              <span className="font-bold text-slate-800 block mb-1 flex items-center gap-1.5">
                <Shirt className="w-3.5 h-3.5 text-slate-600" />
                Tallas recomendadas:
              </span>
              {friend.shirtSize || friend.shoeSize ? (
                <div className="text-slate-600 space-y-0.5">
                  {friend.shirtSize && (
                    <p>
                      Ropa: <strong>{friend.shirtSize}</strong>
                    </p>
                  )}
                  {friend.shoeSize && (
                    <p>
                      Calzado: <strong>{friend.shoeSize}</strong>
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-slate-400 italic">No ha indicado tallas.</p>
              )}
            </div>

            {/* Alergias o Disgustos */}
            <div className="bg-rose-50/60 p-3.5 rounded-2xl border border-rose-200/60">
              <span className="font-bold text-rose-900 block mb-1 flex items-center gap-1.5">
                <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
                NO regalar / Alergias:
              </span>
              <p className="text-slate-700 leading-relaxed">
                {friend.dislikes || (
                  <span className="text-slate-400 italic">Sin restricciones o disgustos indicados.</span>
                )}
              </p>
            </div>
          </div>
        </section>

        {/* ALERTA DE REGALOS NUEVOS EN ESTA LISTA */}
        {newGiftsCount > 0 && (
          <div className="mt-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-3 animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm shadow-xs shrink-0">
                🔔
              </div>
              <div className="text-xs">
                <p className="font-bold text-amber-950">
                  ¡Novedades en la lista de {friend.name}!
                </p>
                <p className="text-amber-800">
                  Se {newGiftsCount === 1 ? 'ha agregado 1 regalo nuevo' : `han agregado ${newGiftsCount} regalos nuevos`} recientemente.
                </p>
              </div>
            </div>

            <button
              onClick={() => setFilterTab(filterTab === 'new' ? 'all' : 'new')}
              className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs shrink-0 ${
                filterTab === 'new'
                  ? 'bg-amber-600 text-white'
                  : 'bg-white text-amber-900 hover:bg-amber-100 border border-amber-300'
              }`}
            >
              {filterTab === 'new' ? 'Ver todos' : 'Ver solo nuevos'}
            </button>
          </div>
        )}

        {/* SECCIÓN WISHLIST Y CONTROLES */}
        <section className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                Deseos de {friend.name}
                <span className="text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
                  {filteredGifts.length} {filteredGifts.length === 1 ? 'idea' : 'ideas'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Fotos, capturas y detalles de lo que sueña recibir en el intercambio.
              </p>
            </div>

            {totalGiftsCount > 0 && (
              <button
                onClick={handleOpenAddGifts}
                className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3.5 py-2 rounded-xl transition-colors self-start sm:self-auto flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Agregar más ideas</span>
              </button>
            )}
          </div>

          {/* BARRA DE HERRAMIENTAS: Búsqueda y Filtros */}
          {totalGiftsCount > 0 && (
            <div className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs mb-6 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Tabs de Filtro Rápido */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      filterTab === 'all'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Todos ({totalGiftsCount})
                  </button>

                  {newGiftsCount > 0 && (
                    <button
                      onClick={() => setFilterTab('new')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                        filterTab === 'new'
                          ? 'bg-amber-500 text-white shadow-xs'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                      }`}
                    >
                      <Bell className="w-3 h-3" />
                      Nuevos ({newGiftsCount})
                    </button>
                  )}

                  <button
                    onClick={() => setFilterTab('available')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      filterTab === 'available'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    Disponibles ({availableCount})
                  </button>

                  {purchasedCount > 0 && (
                    <button
                      onClick={() => setFilterTab('purchased')}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                        filterTab === 'purchased'
                          ? 'bg-emerald-800 text-white shadow-xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Apartados ({purchasedCount})
                    </button>
                  )}

                  <button
                    onClick={() => setFilterTab('high')}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      filterTab === 'high'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    ⭐ Máximo deseo
                  </button>
                </div>

                {/* Ordenamiento */}
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400 font-medium hidden sm:inline">Ordenar:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'priority' | 'name')}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl px-2.5 py-1.5 outline-none focus:border-red-500"
                  >
                    <option value="newest">Más recientes primero</option>
                    <option value="priority">Mayor prioridad (⭐)</option>
                    <option value="name">Nombre (A-Z)</option>
                  </select>
                </div>
              </div>

              {/* Buscador dentro de la lista (si hay más de 3 deseos) */}
              {totalGiftsCount >= 3 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar dentro de los regalos de esta lista..."
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-800 outline-none focus:border-red-500 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 font-bold"
                    >
                      ✕
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* GRID DE REGALOS O ESTADO VACÍO */}
          {totalGiftsCount === 0 ? (
            <div className="bg-white rounded-3xl p-10 sm:p-14 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
              <span className="text-5xl block mb-3 animate-bounce">🎁</span>
              <h3 className="text-lg font-black text-slate-900">
                {friend.name} aún no ha subido regalos
              </h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                ¡Sé el primero en darle ideas! Si eres {friend.name}, puedes subir fotos, capturas de pantalla de tiendas o enlaces web.
              </p>

              <button
                onClick={handleOpenAddGifts}
                className="mt-6 px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>+ Subir fotos o capturas de lo que quiero</span>
              </button>
            </div>
          ) : filteredGifts.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 sm:p-12 text-center border border-slate-200 shadow-sm max-w-md mx-auto">
              <span className="text-4xl block mb-2">🔍</span>
              <h3 className="text-sm font-bold text-slate-900">
                No encontramos regalos con ese filtro
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Prueba borrando la búsqueda o cambiando el filtro seleccionado.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTab('all');
                }}
                className="mt-4 px-4 py-2 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
              >
                Restablecer filtros
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredGifts.map((gift) => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  friendId={friend.id}
                  friendName={friend.name}
                  isOwner={isOwner}
                  pin={unlockedPin || undefined}
                  onDeleted={() => handleGiftDeleted(gift.id)}
                  onToggledPurchased={handleGiftPurchasedToggled}
                  onPreviewImage={(url, title) => setPreviewImage({ url, title })}
                  onEdit={handleRequestEditGift}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* BARRA DE ACCIÓN FIJA INFERIOR EN CELULARES (Mobile Sticky Action Bar) */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 shadow-lg flex items-center gap-2">
        {isOwner ? (
          <>
            <button
              onClick={handleOpenAddGifts}
              className="flex-1 h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>+ Subir fotos</span>
            </button>
            <button
              onClick={handleOpenEditProfile}
              className="h-12 px-3.5 bg-slate-100 hover:bg-slate-200 active:scale-[0.98] text-slate-800 font-bold text-xs rounded-xl border border-slate-200 flex items-center justify-center gap-1"
            >
              <Edit3 className="w-4 h-4 text-slate-600" />
              <span>Perfil</span>
            </button>
          </>
        ) : (
          <>
            <button
              onClick={() => {
                setPendingAction('add_gift');
                setIsPinModalOpen(true);
              }}
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
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
        onSuccess={handleUnlockPin}
        friendName={friend.name}
      />

      {/* Modal Editar Perfil */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        friend={friend}
        currentPin={unlockedPin}
        onUpdated={handleProfileUpdated}
      />

      {/* Modal Agregar Regalos */}
      {isOwner && unlockedPin && (
        <AddGiftModal
          isOpen={isAddGiftOpen}
          onClose={() => setIsAddGiftOpen(false)}
          friendId={friend.id}
          pin={unlockedPin}
          onGiftAdded={fetchFriendData}
        />
      )}

      {/* Modal Editar Regalo Existente */}
      {editingGift && isOwner && unlockedPin && (
        <EditGiftModal
          isOpen={Boolean(editingGift)}
          onClose={() => setEditingGift(null)}
          gift={editingGift}
          friendId={friend.id}
          pin={unlockedPin}
          onGiftUpdated={handleGiftUpdated}
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
