'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, DollarSign, Layers, Plus, Trash2, CheckCircle } from 'lucide-react';
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
  // Modo de subida: 'batch' (varias fotos a la vez) o 'single' (un regalo con todo detalle)
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

  // Manejador para selección múltiple de fotos
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
        const compressed = await compressImage(file, 900, 900, 0.82);
        // Limpiar el nombre del archivo para usarlo como sugerencia de título
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

  // Enviar múltiples regalos
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

      const res = await fetch(`/api/friends/${friendId}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          gifts: giftsPayload
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al guardar los regalos');
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

  // Enviar un solo regalo
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleTitle.trim()) {
      setError('Por favor indica qué regalo deseas');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/friends/${friendId}/gifts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pin,
          title: singleTitle.trim(),
          link: singleLink.trim(),
          imageUrl: singleImageUrl || '',
          priceEstimate: singlePrice.trim(),
          priority: singlePriority,
          notes: singleNotes.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo guardar el regalo');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera sin sparkles, limpia y moderna */}
        <div className="bg-slate-900 text-white p-5 relative border-b border-slate-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-bold tracking-tight">Agregar a mi Wishlist</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Sube fotos o capturas de lo que te gustaría que te regalen.
          </p>

          {/* Selector de modo: Masivo vs Individual */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => setUploadMode('batch')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                uploadMode === 'batch'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Subir varias fotos a la vez (Capturas)</span>
            </button>
            <button
              type="button"
              onClick={() => setUploadMode('single')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                uploadMode === 'single'
                  ? 'bg-red-600 text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Un solo regalo con enlace</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
            {error}
          </div>
        )}

        {/* ============================================================== */}
        {/* MODO 1: SUBIDA MASIVA DE FOTOS (Fácil para 10, 20 o 40 fotos) */}
        {/* ============================================================== */}
        {uploadMode === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="p-6 overflow-y-auto flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Botón de subida masiva */}
              <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-red-300 hover:border-red-500 bg-red-50/40 hover:bg-red-50/70 rounded-2xl cursor-pointer transition-colors group">
                <Upload className="w-8 h-8 text-red-500 mb-2 group-hover:scale-110 transition-transform" />
                <span className="text-sm font-bold text-slate-800">
                  {batchItems.length === 0
                    ? 'Selecciona todas tus fotos o capturas a la vez'
                    : '+ Agregar más fotos o capturas'}
                </span>
                <span className="text-xs text-slate-500 mt-1 text-center">
                  Puedes seleccionar 5, 20 o 40 fotos de un solo golpe. Se optimizan automáticamente.
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

              {/* Lista de fotos seleccionadas en cuadrícula */}
              {batchItems.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                      Fotos listas para subir ({batchItems.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setBatchItems([])}
                      className="text-xs text-red-600 hover:underline font-medium"
                    >
                      Limpiar todas
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                    {batchItems.map((item, idx) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-200 rounded-xl relative group"
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
                            className="w-full text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg focus:border-red-500 outline-none"
                          />
                          <input
                            type="url"
                            value={item.link}
                            placeholder="Link opcional (Amazon, etc.)"
                            onChange={(e) => updateBatchItem(item.id, { link: e.target.value })}
                            className="w-full text-[11px] text-slate-500 px-2 py-0.5 mt-1 bg-white border border-slate-200 rounded-lg focus:border-red-500 outline-none"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBatchItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Quitar esta foto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={loading || batchItems.length === 0}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg shadow-red-950/20 flex items-center justify-center gap-2 transition-all active:scale-[0.99] disabled:opacity-40 text-sm"
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

        {/* ============================================================== */}
        {/* MODO 2: UN SOLO REGALO DETALLADO */}
        {/* ============================================================== */}
        {uploadMode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                ¿Qué te gustaría? *
              </label>
              <input
                type="text"
                required
                placeholder="Ej: Audífonos inalámbricos Sony, Suéter, Libro..."
                value={singleTitle}
                onChange={(e) => setSingleTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm"
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
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    singleImageTab === 'file'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  Subir archivo
                </button>
                <button
                  type="button"
                  onClick={() => setSingleImageTab('url')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    singleImageTab === 'url'
                      ? 'bg-slate-800 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  Pegar URL de foto
                </button>
              </div>

              {singleImageTab === 'file' ? (
                <label className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 rounded-xl cursor-pointer">
                  <span className="text-xs font-medium text-slate-600">Elegir foto de galería o archivo</span>
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
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs"
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
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
                Enlace a la tienda (Opcional)
              </label>
              <input
                type="url"
                placeholder="https://www.amazon.com/..."
                value={singleLink}
                onChange={(e) => setSingleLink(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  Precio aproximado
                </label>
                <input
                  type="text"
                  placeholder="Ej: $25 USD / $400"
                  value={singlePrice}
                  onChange={(e) => setSinglePrice(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                  Nivel de deseo
                </label>
                <select
                  value={singlePriority}
                  onChange={(e) => setSinglePriority(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs"
                >
                  <option value="high">⭐ Me encantaría</option>
                  <option value="medium">✨ Buena opción</option>
                  <option value="low">💡 Detalle accesible</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Notas adicionales (Color, talla, especificaciones)
              </label>
              <textarea
                rows={2}
                placeholder="Ej: Color azul o negro, talla M..."
                value={singleNotes}
                onChange={(e) => setSingleNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 text-sm"
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
