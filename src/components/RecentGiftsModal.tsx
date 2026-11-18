'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { X, Bell, ExternalLink, CheckCircle2, DollarSign, Clock, ArrowRight, Check } from 'lucide-react';
import { RecentGiftNotification } from '@/types';
import {
  isGiftSeen,
  getSeenGiftIds,
  getLastSeenTimestamp,
  markGiftAsSeen,
  markAllGiftsAsSeen
} from '@/lib/gift-utils';

interface RecentGiftsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkAllSeen?: () => void;
}

export default function RecentGiftsModal({
  isOpen,
  onClose,
  onMarkAllSeen
}: RecentGiftsModalProps) {
  const [gifts, setGifts] = useState<RecentGiftNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estados de visto / no visto
  const [seenIds, setSeenIds] = useState<Set<string>>(() => getSeenGiftIds());
  const [lastSeenTimestamp, setLastSeenTimestamp] = useState<number>(() => getLastSeenTimestamp());
  const [activeTab, setActiveTab] = useState<'all' | 'unseen' | 'seen'>('all');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);

  const fetchRecent = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/gifts/recent?limit=30', { cache: 'no-store' });
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data)) {
        setGifts(json.data);
      } else {
        throw new Error(json.error || 'Error al cargar novedades');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  // Cargar estado de vistos al abrir
  useEffect(() => {
    if (isOpen) {
      setSeenIds(getSeenGiftIds());
      setLastSeenTimestamp(getLastSeenTimestamp());
      fetchRecent();
    }
  }, [isOpen]);

  // Escuchar evento global de sincronización de vistos
  useEffect(() => {
    const handleSeenUpdated = () => {
      setSeenIds(getSeenGiftIds());
      setLastSeenTimestamp(getLastSeenTimestamp());
    }
    window.addEventListener('santa_gifts_seen_updated', handleSeenUpdated);
    return () => window.removeEventListener('santa_gifts_seen_updated', handleSeenUpdated);
  }, []);

  if (!isOpen) return null;

  // Marcar todas como vistas
  const handleMarkAllSeen = () => {
    const allIds = gifts.map((g) => g.id);
    markAllGiftsAsSeen(allIds);

    // Actualizar estado local inmediatamente
    const now = Date.now();
    const updatedSet = new Set(seenIds);
    allIds.forEach((id) => updatedSet.add(id));

    setSeenIds(updatedSet);
    setLastSeenTimestamp(now);
    setFeedbackToast('¡Todas las novedades han sido marcadas como vistas!');

    if (onMarkAllSeen) onMarkAllSeen();
    setTimeout(() => setFeedbackToast(null), 3000);
  };

  // Marcar un regalo individual como visto
  const handleMarkSingleSeen = (giftId: string) => {
    markGiftAsSeen(giftId);
    const updatedSet = new Set(seenIds);
    updatedSet.add(giftId);
    setSeenIds(updatedSet);
    if (onMarkAllSeen) onMarkAllSeen();
  };

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return 'Reciente';
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Hace un momento';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} ${diffHours === 1 ? 'hora' : 'horas'}`;
      if (diffDays === 1) return 'Ayer';
      if (diffDays < 7) return `Hace ${diffDays} días`;

      return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch {
      return 'Reciente';
    }
  };

  const priorityLabels = {
    high: { text: '⭐ Me encantaría', bg: 'bg-red-50 text-red-700 border-red-200' },
    medium: { text: 'Buena opción', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
    low: { text: '💡 Detalle accesible', bg: 'bg-slate-100 text-slate-700 border-slate-200' }
  };

  // Contadores de Visto vs No Visto
  const unseenCount = gifts.filter(
    (g) => !isGiftSeen(g.id, g.createdAt, seenIds, lastSeenTimestamp)
  ).length;
  const seenCount = gifts.length - unseenCount;

  // Filtrado por pestaña
  const displayedGifts = gifts.filter((item) => {
    const isSeen = isGiftSeen(item.id, item.createdAt, seenIds, lastSeenTimestamp);
    if (activeTab === 'unseen') return !isSeen;
    if (activeTab === 'seen') return isSeen;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center text-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                Novedades y Regalos
                {unseenCount > 0 ? (
                  <span className="text-[11px] font-bold bg-amber-500 text-white px-2.5 py-0.5 rounded-full">
                    {unseenCount} sin ver
                  </span>
                ) : (
                  <span className="text-[11px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" /> Todo visto
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-300">
                Historial de deseos agregados por tus amigos al Amigo Secreto
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Acciones y Filtros */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-2.5">
          {/* Pestañas: Todas / Sin ver / Vistas */}
          <div className="flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Todas ({gifts.length})
            </button>
            <button
              onClick={() => setActiveTab('unseen')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'unseen'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Sin ver ({unseenCount})
            </button>
            <button
              onClick={() => setActiveTab('seen')}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                activeTab === 'seen'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              Vistas ({seenCount})
            </button>
          </div>

          {/* Botón Principal para Marcar Todas Como Vistas */}
          <button
            type="button"
            onClick={handleMarkAllSeen}
            disabled={unseenCount === 0}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-xs active:scale-95 ${
              unseenCount > 0
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Marcar todas las novedades de la lista como vistas"
          >
            <Check className="w-3.5 h-3.5" />
            <span>{unseenCount > 0 ? 'Marcar todas como vistas' : 'Al día'}</span>
          </button>
        </div>

        {/* Banner de Feedback al marcar como visto */}
        {feedbackToast && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-bold text-emerald-800 flex items-center justify-between animate-in fade-in duration-150">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {feedbackToast}
            </span>
            <button
              onClick={() => setFeedbackToast(null)}
              className="text-emerald-600 hover:text-emerald-950 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lista con scroll */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-slate-100 space-y-4">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-xs font-semibold text-slate-600">Cargando novedades...</p>
            </div>
          ) : error ? (
            <div className="py-12 text-center text-xs text-red-600 bg-red-50 p-4 rounded-2xl">
              {error}
            </div>
          ) : displayedGifts.length === 0 ? (
            <div className="py-16 text-center">
              <span className="text-4xl block mb-2">
                {activeTab === 'unseen' ? '✓' : '🎁'}
              </span>
              <h3 className="text-sm font-bold text-slate-800">
                {activeTab === 'unseen'
                  ? '¡No tienes novedades pendientes por ver!'
                  : activeTab === 'seen'
                  ? 'Aún no has marcado regalos como vistos.'
                  : 'Aún no hay regalos registrados'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {activeTab === 'unseen'
                  ? 'Todas las novedades están al día. Cuando un amigo agregue un deseo nuevo aparecerá aquí.'
                  : 'Los deseos de tus amigos aparecerán en esta sección.'}
              </p>
            </div>
          ) : (
            displayedGifts.map((item) => {
              const priorityInfo = priorityLabels[item.priority] || priorityLabels.medium;
              const isSeen = isGiftSeen(item.id, item.createdAt, seenIds, lastSeenTimestamp);

              return (
                <div
                  key={item.id}
                  className={`pt-4 first:pt-0 flex gap-3.5 items-start group rounded-2xl p-2.5 transition-colors ${
                    isSeen ? 'bg-slate-50/50' : 'bg-amber-50/20 border border-amber-200/50'
                  }`}
                >
                  {/* Foto o Icono */}
                  <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shrink-0">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">
                        🎁
                      </div>
                    )}
                  </div>

                  {/* Detalles */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold truncate">
                        <span className="text-base">{item.friendAvatar}</span>
                        <span className="truncate">{item.friendName}</span>
                        <span className="text-[11px] font-normal text-slate-400">• agregó:</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isSeen ? (
                          <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" /> Visto
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md animate-pulse">
                            Sin ver
                          </span>
                        )}

                        <span className="text-[10px] font-medium text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900 leading-snug line-clamp-1 group-hover:text-red-600 transition-colors">
                      {item.title}
                    </h4>

                    {/* Metadata: Prioridad, Precio, Estado */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityInfo.bg}`}>
                        {priorityInfo.text}
                      </span>

                      {item.priceEstimate && (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-0.5">
                          <DollarSign className="w-3 h-3 -mr-0.5" />
                          {item.priceEstimate}
                        </span>
                      )}

                      {item.isPurchased ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Apartado
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                          Disponible
                        </span>
                      )}
                    </div>

                    {item.notes && (
                      <p className="mt-1.5 text-xs text-slate-500 line-clamp-1 italic">
                        &ldquo;{item.notes}&rdquo;
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-2">
                      <Link
                        href={`/amigo/${encodeURIComponent(item.friendId)}`}
                        onClick={() => {
                          handleMarkSingleSeen(item.id);
                          onClose();
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-colors"
                      >
                        <span>Ver en la lista de {item.friendName}</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>

                      {!isSeen && (
                        <button
                          type="button"
                          onClick={() => handleMarkSingleSeen(item.id)}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl transition-colors"
                        >
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Marcar vista</span>
                        </button>
                      )}

                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition-colors"
                        >
                          <span>Tienda</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pie */}
        <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between px-5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {unseenCount > 0 ? `${unseenCount} novedades pendientes` : 'Todas las novedades vistas'}
          </span>
          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-700 hover:text-slate-950 underline"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    </div>
  );
}
