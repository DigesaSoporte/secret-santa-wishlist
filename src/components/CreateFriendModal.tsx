'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, Lock, ChevronDown, ChevronUp } from 'lucide-react';

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

    const payload = {
      name: name.trim(),
      avatar,
      pin: pin.trim(),
      bio: bio.trim(),
      dislikes: dislikes.trim(),
      shirtSize: shirtSize.trim(),
      shoeSize: shoeSize.trim()
    };

    try {
      setLoading(true);
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al crear la carpeta');
      }

      const createdFriend = json.data;

      // Respaldo inmediato en localStorage para evitar 404 en lambdas efímeras
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(`santa_friend_${createdFriend.id}`, JSON.stringify(createdFriend));
          sessionStorage.setItem(`santa_pin_${createdFriend.id}`, pin.trim());

          const existingListRaw = localStorage.getItem('santa_all_friends');
          const existingList = existingListRaw ? JSON.parse(existingListRaw) : [];
          const updatedList = [createdFriend, ...existingList.filter((f: any) => f.id !== createdFriend.id)];
          localStorage.setItem('santa_all_friends', JSON.stringify(updatedList));
        } catch (e) {
          console.warn('LocalStorage error:', e);
        }
      }

      confetti({ particleCount: 70, spread: 65, origin: { y: 0.6 } });
      onCreated(createdFriend.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white sm:bg-slate-950/70 sm:p-4 sm:flex sm:items-center sm:justify-center">
      {/* Contenedor del Modal: Pantalla completa en móvil para estabilidad con el teclado, tarjeta flotante en desktop */}
      <div className="min-h-full sm:min-h-0 w-full sm:max-w-md bg-white sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200 flex flex-col justify-between">
        
        {/* Cabecera fija */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div>
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">Crear mi Carpeta</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Crea tu perfil para el Amigo Secreto
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

        {/* Formulario fluido con scroll nativo */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Tu Nombre *
            </label>
            <input
              type="text"
              required
              placeholder="Ej: Kenny"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-base font-medium transition-all"
            />
          </div>

          {/* Avatar con toques táctiles grandes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
              Elige tu Avatar
            </label>
            <div className="grid grid-cols-5 gap-2">
              {AVATAR_OPTIONS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setAvatar(item)}
                  className={`h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
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
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-slate-500" />
              PIN Secreto (4 dígitos) *
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              required
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-lg font-mono tracking-widest text-center"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Solo tú lo sabrás para agregar o borrar tus regalos.
            </p>
          </div>

          {/* Opcionales colapsables */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowOptional(!showOptional)}
              className="w-full py-2.5 flex items-center justify-between text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <span>+ Añadir tallas y gustos (Opcional)</span>
              {showOptional ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {showOptional && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Talla de Ropa
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: M, L..."
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
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
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Gustos generales o pasatiempos
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Café, videojuegos, anime..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    ¿Qué NO te gusta o alergias?
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Nada de chocolates..."
                    value={dislikes}
                    onChange={(e) => setDislikes(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-red-500 outline-none text-base sm:text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="pt-3 pb-8 sm:pb-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50 text-sm flex items-center justify-center"
            >
              <span>{loading ? 'Creando carpeta...' : '¡Listo, crear mi carpeta!'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
