'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Upload, Link as LinkIcon, Sparkles, Image as ImageIcon, DollarSign } from 'lucide-react';
import { compressImage } from '@/lib/image-utils';

interface AddGiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  friendId: string;
  pin: string;
  onGiftAdded: () => void;
}

export default function AddGiftModal({
  isOpen,
  onClose,
  friendId,
  pin,
  onGiftAdded
}: AddGiftModalProps) {
  const [title, setTitle] = useState('');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [priceEstimate, setPriceEstimate] = useState('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('high');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeImageTab, setActiveImageTab] = useState<'file' | 'url'>('file');

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      // Comprimir la imagen para que pese poco (< 150KB)
      const compressedDataUrl = await compressImage(file, 900, 900, 0.82);
      setImageUrl(compressedDataUrl);
      setImagePreview(compressedDataUrl);
    } catch (err) {
      console.error(err);
      setError('Error al procesar la imagen seleccionada');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
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
          title: title.trim(),
          link: link.trim(),
          imageUrl: imageUrl || '',
          priceEstimate: priceEstimate.trim(),
          priority,
          notes: notes.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo agregar el regalo');
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 }
      });

      onGiftAdded();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="bg-gradient-to-r from-red-700 via-rose-700 to-red-800 text-white p-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-red-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-1.5 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Nueva Idea en tu Wishlist
          </div>
          <h2 className="text-xl font-bold">Agregar Regalo a mi Lista</h2>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Nombre / Título */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              ¿Qué te gustaría? (Nombre del producto) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Audífonos inalámbricos Sony, Suéter navideño, Libro..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-sm"
            />
          </div>

          {/* Subida o link de imagen / captura */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Foto o Captura de Pantalla
            </label>

            {/* Pestañas de origen de imagen */}
            <div className="flex gap-2 mb-2.5">
              <button
                type="button"
                onClick={() => setActiveImageTab('file')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeImageTab === 'file'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Subir foto / captura
              </button>
              <button
                type="button"
                onClick={() => setActiveImageTab('url')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeImageTab === 'url'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                Pegar link de imagen
              </button>
            </div>

            {activeImageTab === 'file' ? (
              <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-300 hover:border-red-400 bg-slate-50 hover:bg-red-50/20 rounded-2xl cursor-pointer transition-colors group">
                <Upload className="w-6 h-6 text-slate-400 group-hover:text-red-500 mb-1 transition-colors" />
                <span className="text-xs font-medium text-slate-600 group-hover:text-red-700">
                  Haz clic para elegir foto o captura de tu galería
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5">
                  Se optimiza automáticamente para cargar rápido
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            ) : (
              <input
                type="url"
                placeholder="https://ejemplo.com/foto-del-producto.jpg"
                value={imageUrl}
                onChange={(e) => {
                  setImageUrl(e.target.value);
                  setImagePreview(e.target.value);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
              />
            )}

            {/* Vista previa de imagen si ya hay */}
            {imagePreview && (
              <div className="mt-2.5 relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Vista previa"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl('');
                    setImagePreview(null);
                  }}
                  className="absolute top-1 right-1 bg-black/70 hover:bg-black text-white p-0.5 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Link del producto */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <LinkIcon className="w-3.5 h-3.5 text-slate-500" />
              Link o Enlace a la tienda (Opcional)
            </label>
            <input
              type="url"
              placeholder="https://www.amazon.com/dp/... o MercadoLibre, Shein..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
            />
          </div>

          {/* Precio y Prioridad */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                Precio estimado
              </label>
              <input
                type="text"
                placeholder="Ej: $20 - $30 USD / $500"
                value={priceEstimate}
                onChange={(e) => setPriceEstimate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Nivel de deseo
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as 'high' | 'medium' | 'low')}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs font-medium"
              >
                <option value="high">⭐ ¡Me encantaría! (Alta)</option>
                <option value="medium">✨ Buena opción (Media)</option>
                <option value="low">💡 Detalle accesible (Baja)</option>
              </select>
            </div>
          </div>

          {/* Notas / Especificaciones */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Notas, detalles o especificaciones
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Color negro de preferencia, talla M, lo vi en la tienda de la esquina..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 text-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{loading ? 'Guardando...' : 'Guardar en mi lista'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

