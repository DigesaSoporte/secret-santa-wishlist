'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, DollarSign, Layers, Plus, Trash2 } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface AddGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: string;
  pin: string;
  onGiftAdded: () => void;
}

interface BatchImageItem {
  id: string;
  file: File;
  previewUrl: string;
  title: string;
  link: string;
}

export default function AddGiftModal({
  isOpen,
  onClose,
  friendId,
  pin,
  onGiftAdded
}: AddGiftModalProps) {
  const [uploadMode, setUploadMode] = useState<'batch' | 'single'>('batch');

  // Estado para subida múltiple (batch)
  const [batchItems, setBatchItems] = useState<BatchImageItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [processingProgress, setProcessingProgress] = useState('');

  // Estado para un solo regalo (single)
  const [singleTitle, setSingleTitle] = useState('');
  const [singleLink, setSingleLink] = useState('');
  const [singleImageUrl, setSingleImageUrl] = useState('');
  const [singleImagePreview, setSingleImagePreview] = useState<string | null>(null);
  const [singlePrice, setSinglePrice] = useState('');
  const [singlePriority, setSinglePriority] = useState<'high' | 'medium' | 'low'>('high');
  const [singleNotes, setSingleNotes] = useState('');
  const [singleImageTab, setSingleImageTab] = useState<'file' | 'url'>('file');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleBatchFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsProcessingFiles(true);
    setError(null);
    setProcessingProgress(`Procesando ${files.length} fotos...`);

    const newItems: BatchImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        setProcessingProgress(`Optimizando foto ${i + 1} de ${files.length}...`);
        const compressed = await compressImage(file, 800, 800, 0.75);
        const cleanName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[-_]/g, ' ')
          .trim();

        newItems.push({
          id: `item-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`,
          file,
          previewUrl: compressed,
          title: cleanName || `Regalo #${batchItems.length + i + 1}`,
          link: ''
        });
      } catch (err) {
        console.error('Error procesando imagen', err);
      }
    }

    setBatchItems((prev) => [...prev, ...newItems]);
    setIsProcessingFiles(false);
    setProcessingProgress('');
    e.target.value = '';
  };

  const removeBatchItem = (id: string) => {
    setBatchItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateBatchItem = (id: string, updates: Partial<BatchImageItem>) => {
    setBatchItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (batchItems.length === 0) {
      setError('Selecciona al menos una foto para subir');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const giftsPayload = batchItems.map((item, index) => ({
        title: item.title.trim() || `Regalo #${index + 1}`,
        link: item.link.trim(),
        imageUrl: item.previewUrl,
        priority: 'high',
        notes: ''
      }));

      let friendProfile: any = null;
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`santa_friend_${friendId}`);
        if (cached) {
          try {
            friendProfile = JSON.parse(cached);
          } catch {}
        }
      }

      const res = await fetch(`/api/friends/${encodeURIComponent(friendId)}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          gifts: giftsPayload,
          friendProfile
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al guardar los regalos');
      }

      // Respaldo en localStorage
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`santa_friend_${friendId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.gifts = [...(json.data || []), ...(parsed.gifts || [])];
            localStorage.setItem(`santa_friend_${friendId}`, JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }

      confetti({ particleCount: 60, spread: 65, origin: { y: 0.6 } });
      onGiftAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTitle.trim()) {
      setError('Por favor indica qué regalo deseas');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let friendProfile: any = null;
      if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(`santa_friend_${friendId}`);
        if (cached) {
          try {
            friendProfile = JSON.parse(cached);
          } catch {}
        }
      }

      const res = await fetch(`/api/friends/${encodeURIComponent(friendId)}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          title: singleTitle.trim(),
          link: singleLink.trim(),
          imageUrl: singleImageUrl || '',
          priceEstimate: singlePrice.trim(),
          priority: singlePriority,
          notes: singleNotes.trim(),
          friendProfile
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo guardar el regalo');
      }

      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`santa_friend_${friendId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.gifts = [json.data, ...(parsed.gifts || [])];
            localStorage.setItem(`santa_friend_${friendId}`, JSON.stringify(parsed));
          }
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.6 } });
      onGiftAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  const handleSingleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const compressed = await compressImage(file, 900, 900, 0.82);
      setSingleImageUrl(compressed);
      setSingleImagePreview(compressed);
    } catch {
      setError('Error al procesar la imagen seleccionada');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white sm:bg-slate-950/70 sm:p-4 sm:flex sm:items-center sm:justify-center">
      {/* Contenedor Modal */}
      <div className="min-h-full sm:min-h-0 w-full sm:max-w-2xl bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200 flex flex-col justify-between">
        
        {/* Cabecera fija */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">Agregar a mi Wishlist</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Sube fotos o capturas de lo que te gustaría recibir
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-full text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Selector de modo */}
          <div className="flex gap-2 mt-3.5">
            <button
              type="button"
              onClick={() => setUploadMode('batch')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                uploadMode === 'batch'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">Varias fotos a la vez</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('single')}
              className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                uploadMode === 'single'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4 shrink-0" />
              <span className="truncate">Un regalo con link</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
            {error}
          </div>
        )}

        {/* MODO 1: SUBIDA MASIVA DE FOTOS */}
        {uploadMode === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="p-5 sm:p-6 space-y-4 flex-1">
            <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/40 hover:bg-red-50/70 rounded-2xl cursor-pointer transition-colors active:scale-[0.99]">
              <Upload className="w-8 h-8 text-red-500 mb-2" />
              <span className="text-sm font-bold text-slate-800 text-center">
                {batchItems.length === 0
                  ? 'Toca aquí para elegir todas tus fotos o capturas'
                  : '+ Agregar más fotos o capturas'}
              </span>
              <span className="text-xs text-slate-500 mt-1 text-center">
                Puedes seleccionar 5, 20 o 40 fotos de tu galería
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleBatchFileSelect}
                className="hidden"
              />
            </label>

            {isProcessingFiles && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 font-semibold flex items-center gap-2 animate-pulse">
                <div className="w-3.5 h-3.5 border-2 border-amber-700 border-t-transparent rounded-full animate-spin" />
                <span>{processingProgress}</span>
              </div>
            )}

            {batchItems.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Fotos seleccionadas ({batchItems.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setBatchItems([])}
                    className="text-xs text-red-600 hover:underline font-semibold"
                  >
                    Borrar todas
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                  {batchItems.map((item, idx) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl relative"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.previewUrl}
                        alt="preview"
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200"
                      />
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={item.title}
                          placeholder={`Regalo #${idx + 1}`}
                          onChange={(e) => updateBatchItem(item.id, { title: e.target.value })}
                          className="w-full text-xs font-semibold px-2 py-1.5 bg-white border border-slate-200 rounded-lg focus:border-red-500 outline-none text-base sm:text-xs"
                        />
                        <input
                          type="url"
                          value={item.link}
                          placeholder="Link opcional"
                          onChange={(e) => updateBatchItem(item.id, { link: e.target.value })}
                          className="w-full text-xs text-slate-500 px-2 py-1 mt-1 bg-white border border-slate-200 rounded-lg focus:border-red-500 outline-none text-base sm:text-xs"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeBatchItem(item.id)}
                        className="p-2 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                        title="Quitar foto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-3 pb-8 sm:pb-2">
              <button
                type="submit"
                disabled={loading || batchItems.length === 0}
                className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-40 text-sm flex items-center justify-center"
              >
                <span>
                  {loading
                    ? 'Subiendo regalos...'
                    : `Subir todas las fotos (${batchItems.length} ${
                        batchItems.length === 1 ? 'regalo' : 'regalos'
                      })`}
                </span>
              </button>
            </div>
          </form>
        )}

        {/* MODO 2: UN SOLO REGALO DETALLADO */}
        {uploadMode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-5 sm:p-6 space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                ¿Qué te gustaría? *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Audífonos Sony, Suéter..."
                value={singleTitle}
                onChange={(e) => setSingleTitle(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Foto o Captura
              </label>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setSingleImageTab('file')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                    singleImageTab === 'file' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir archivo
                </button>
                <button
                  type="button"
                  onClick={() => setSingleImageTab('url')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 ${
                    singleImageTab === 'url' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Pegar URL
                </button>
              </div>

              {singleImageTab === 'file' ? (
                <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-slate-600">Elegir foto de galería</span>
                  <input type="file" accept="image/*" onChange={handleSingleFileChange} className="hidden" />
                </label>
              ) : (
                <input
                  type="url"
                  placeholder="https://ejemplo.com/foto.jpg"
                  value={singleImageUrl}
                  onChange={(e) => {
                    setSingleImageUrl(e.target.value);
                    setSingleImagePreview(e.target.value);
                  }}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
                />
              )}

              {singleImagePreview && (
                <div className="mt-2 relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={singleImagePreview} alt="preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setSingleImageUrl('');
                      setSingleImagePreview(null);
                    }}
                    className="absolute top-1 right-1 bg-black/70 text-white p-0.5 rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                Enlace a la tienda (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://www.amazon.com/..."
                value={singleLink}
                onChange={(e) => setSingleLink(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  Precio aproximado
                </label>
                <input
                  type="text"
                  placeholder="Ej: $25 USD"
                  value={singlePrice}
                  onChange={(e) => setSinglePrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                  Nivel de deseo
                </label>
                <select
                  value={singlePriority}
                  onChange={(e) => setSinglePriority(e.target.value as any)}
                  className="w-full px-3 py-3 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
                >
                  <option value="high">⭐ Me encantaría</option>
                  <option value="medium">Buena opción</option>
                  <option value="low">💡 Detalle accesible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                Notas adicionales (Color, talla)
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Color azul, talla M..."
                value={singleNotes}
                onChange={(e) => setSingleNotes(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
              />
            </div>

            <div className="pt-3 pb-8 sm:pb-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 text-sm flex items-center justify-center"
              >
                <span>{loading ? 'Guardando...' : 'Guardar regalo'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
