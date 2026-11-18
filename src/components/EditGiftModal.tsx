'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Upload, Link as LinkIcon, Image as ImageIcon, DollarSign, Check, Trash2 } from 'lucide-react';
import { GiftItem } from '@/types';
import { compressImage } from '@/lib/image-utils';

interface EditGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  gift: GiftItem;
  friendId: string;
  pin: string;
  onGiftUpdated?: (updatedGift?: GiftItem) => void;
}

export default function EditGiftModal({
  isOpen,
  onClose,
  gift,
  friendId,
  pin,
  onGiftUpdated
}: EditGiftModalProps) {
  const [title, setTitle] = useState(gift.title || '');
  const [link, setLink] = useState(gift.link || '');
  const [priceEstimate, setPriceEstimate] = useState(gift.priceEstimate || '');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>(gift.priority || 'high');
  const [notes, setNotes] = useState(gift.notes || '');

  // Manejo de imagen
  const [imageUrl, setImageUrl] = useState(gift.imageUrl || '');
  const [imagePreview, setImagePreview] = useState<string | null>(gift.imageUrl || null);
  const [imageTab, setImageTab] = useState<'current' | 'file' | 'url'>('current');
  const [isCompressing, setIsCompressing] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsCompressing(true);
      setError(null);
      const compressed = await compressImage(file, 800, 800, 0.75);
      setImagePreview(compressed);
      setImageUrl(compressed);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al procesar la imagen');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setImageUrl('');
    setImageTab('file');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('El título o nombre del regalo es obligatorio');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(
        `/api/friends/${encodeURIComponent(friendId)}/gifts/${encodeURIComponent(gift.id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            pin,
            title: title.trim(),
            link: link.trim(),
            imageUrl: imageUrl.trim(),
            priceEstimate: priceEstimate.trim(),
            priority,
            notes: notes.trim()
          })
        }
      );

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al actualizar el regalo');
      }

      confetti({ particleCount: 40, spread: 55, origin: { y: 0.6 } });
      onGiftUpdated?.(json.data);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-base sm:text-lg font-bold">Editar deseo de regalo</h2>
            <p className="text-[11px] text-slate-300">
              Modifica los detalles, enlaces, notas o foto de este regalo
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Nombre o descripción del regalo *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Suéter navideño verde, Cafetera italiana, Libro..."
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white outline-none text-xs text-slate-800 font-semibold"
            />
          </div>

          {/* Precio y Prioridad */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Precio estimado (opcional)</span>
              </label>
              <input
                type="text"
                value={priceEstimate}
                onChange={(e) => setPriceEstimate(e.target.value)}
                placeholder="Ej: $250, $15 USD..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white outline-none text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Nivel de preferencia
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white outline-none text-xs text-slate-800 font-semibold"
              >
                <option value="high">⭐ Me encantaría</option>
                <option value="medium">Buena opción</option>
                <option value="low">💡 Detalle accesible</option>
              </select>
            </div>
          </div>

          {/* Enlace de tienda */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Enlace de tienda o web (opcional)</span>
            </label>
            <input
              type="url"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://amazon.com/... o https://mercadolibre.com/..."
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white outline-none text-xs text-slate-800"
            />
          </div>

          {/* Notas */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Notas, detalles o especificaciones
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Talla M, en color azul marino, de preferencia en la sucursal del centro..."
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white outline-none text-xs text-slate-800 resize-none leading-relaxed"
            />
          </div>

          {/* Foto o captura */}
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
              <span>Foto o Captura del Regalo</span>
            </label>

            {/* Vista previa si existe */}
            {imagePreview && (
              <div className="relative w-full h-40 rounded-2xl bg-slate-100 overflow-hidden border border-slate-200 mb-3 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-slate-900/80 hover:bg-red-600 text-white p-2 rounded-xl text-xs font-semibold flex items-center gap-1 shadow-md transition-colors"
                  title="Quitar foto"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Quitar foto</span>
                </button>
              </div>
            )}

            {/* Opciones de carga */}
            <div className="flex items-center gap-2 mb-2 text-xs">
              <button
                type="button"
                onClick={() => setImageTab('file')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  imageTab === 'file'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Subir nueva foto
              </button>
              <button
                type="button"
                onClick={() => setImageTab('url')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                  imageTab === 'url'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Pegar enlace de imagen
              </button>
            </div>

            {imageTab === 'file' && (
              <label className="border-2 border-dashed border-slate-300 hover:border-red-500 rounded-2xl p-4 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-slate-100/70 transition-all">
                <Upload className="w-6 h-6 text-slate-400 mb-1" />
                <span className="text-xs font-bold text-slate-700">
                  {isCompressing ? 'Optimizando foto...' : 'Seleccionar foto o captura de pantalla'}
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Se optimiza automáticamente para cargar rápido
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {imageTab === 'url' && (
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value.trim() || null);
                }}
                placeholder="https://ejemplo.com/foto.jpg"
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 outline-none text-xs text-slate-800"
              />
            )}
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5 sticky bottom-0 bg-white pb-1">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={loading || isCompressing}
              className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <span>Guardando...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Guardar cambios</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
