'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Sparkles, Lock, ShieldCheck, HeartHandshake } from 'lucide-react';

interface CreateFriendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (friendId: string) => void;
}

const AVATAR_OPTIONS = ['🎅', '🦌', '⛄', '🎄', '🎁', '🧝', '🍪', '🦊', '🐻', '⭐', '🐧', '🧤'];

export default function CreateFriendModal({ isOpen, onClose, onCreated }: CreateFriendModalProps) {
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('🎅');
  const [pin, setPin] = useState('');
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
      setError('Crea un PIN de al menos 4 dígitos para proteger tu lista');
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

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });

      onCreated(json.data.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-emerald-900/20 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Cabecera del modal */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-teal-900 text-white p-6 pb-5 relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-200 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Amigo Secreto 2024 - 2025
          </div>
          <h2 className="text-2xl font-black text-white">Crea tu Carpeta de Deseos</h2>
          <p className="text-xs text-emerald-200 mt-1">
            Tus amigos podrán entrar y ver exactamente qué te gustaría recibir.
          </p>
        </div>

        {/* Formulario scrolleable */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-medium text-red-700">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Tu Nombre o Apodo *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Kenny, Sofi, Alex..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-sm transition-all"
            />
          </div>

          {/* Selección de Avatar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Elige tu Avatar Festivo
            </label>
            <div className="grid grid-cols-6 gap-2">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAvatar(item)}
                  className={`h-11 rounded-xl text-xl flex items-center justify-center transition-all ${
                    avatar === item
                      ? 'bg-red-100 border-2 border-red-500 scale-105 shadow-sm'
                      : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          {/* PIN de seguridad */}
          <div className="bg-amber-50/80 p-3.5 rounded-2xl border border-amber-200/60">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>PIN Secreto (4 dígitos) *</span>
            </div>
            <p className="text-[11px] text-amber-800/80 mb-2">
              Te servirá para agregar, cambiar o borrar tus regalos después.
            </p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              required
              placeholder="Ej: 1234"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-2 bg-white rounded-xl border border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-mono tracking-widest"
            />
          </div>

          {/* Tallas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Talla de Ropa / Playera
              </label>
              <input
                type="text"
                placeholder="Ej: M, L, S, 32..."
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Talla de Calzado
              </label>
              <input
                type="text"
                placeholder="Ej: 41, 7.5 US, 26 MX..."
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
              />
            </div>
          </div>

          {/* Gustos / Bio */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Cosas que te gustan o pasatiempos
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Me gusta el café en grano, la lectura, el anime, videojuegos o chocolates..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
            />
          </div>

          {/* Qué NO regalarte */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              ¿Qué NO te gusta o alergias?
            </label>
            <textarea
              rows={2}
              placeholder="Ej: Alérgico a los frutos secos, no me gustan los adornos de pared..."
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-red-900/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-200" />
              <span>{loading ? 'Creando carpeta...' : '¡Listo, crear mi carpeta!'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

