'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Lock, ChevronDown, ChevronUp, User } from 'lucide-react';

interface CreateFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (friendId: string) => void;
}

const AVATAR_OPTIONS = ['🎅', '🦌', '⛄', '🎄', '🎁', '🧝', '🍪', '🦊', '🐻', '⭐'];

export default function CreateFriendModal({ isOpen, onClose, onCreated }: CreateFriendModalProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🎅');
  const [pin, setPin] = useState('');
  const [showOptional, setShowOptional] = useState(false);
  const [bio, setBio] = useState('');
  const [dislikes, setDislikes] = useState('');
  const [shirtSize, setShirtSize] = useState('');
  const [shoeSize, setShoeSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Por favor ingresa tu nombre');
      return;
    }

    if (!pin.trim() || pin.trim().length < 4) {
      setError('Crea un PIN de 4 dígitos para proteger tu lista');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          avatar,
          pin: pin.trim(),
          bio: bio.trim(),
          dislikes: dislikes.trim(),
          shirtSize: shirtSize.trim(),
          shoeSize: shoeSize.trim()
        })
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al crear la carpeta');
      }

      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      onCreated(json.data.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[94dvh] sm:max-h-[92vh] flex flex-col">
        {/* Cabecera limpia */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 relative border-b border-slate-800 shrink-0">
          <button
            onClick={onClose}
            className="absolute top-3.5 right-3.5 text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
            title="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold tracking-tight">Crear mi Carpeta de Deseos</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Solo te tomará unos segundos sumarte al Amigo Secreto.
          </p>
        </div>

        {/* Formulario rápido */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Tu Nombre *
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="Ej: Kenny"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm font-medium"
            />
          </div>

          {/* Avatar en un click */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Elige tu ícono
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAvatar(item)}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                    avatar === item
                      ? 'bg-red-50 border-2 border-red-600 scale-105 shadow-sm'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* PIN */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              PIN Secreto (4 dígitos) *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              required
              placeholder="Ej: 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm font-mono tracking-widest"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Solo tú lo sabrás para agregar o borrar tus regalos.
            </p>
          </div>

          {/* Sección opcional colapsable */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="w-full py-2 flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>+ Añadir tallas y gustos (Opcional)</span>
              {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOptional && (
              <div className="space-y-3 pt-2 animate-in fade-in duration-150">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Talla de Ropa
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: M, L, S..."
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-red-500 outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Talla de Calzado
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 41, 8.5 US..."
                      value={shoeSize}
                      onChange={(e) => setShoeSize(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-red-500 outline-none text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Gustos generales o pasatiempos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Café, videojuegos, anime, libros..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-red-500 outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    ¿Qué NO te gusta o alergias?
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Nada de chocolates, alérgico a nueces..."
                    value={dislikes}
                    onChange={(e) => setDislikes(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:border-red-500 outline-none text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg transition-all active:scale-[0.99] disabled:opacity-50 text-sm"
            >
              <span>{loading ? 'Creando carpeta...' : '¡Listo, crear mi carpeta!'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
