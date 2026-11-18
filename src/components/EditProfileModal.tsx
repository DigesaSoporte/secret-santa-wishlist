'use client';

import { useState } from 'react';
import confetti from 'canvas-confetti';
import { X, User, Lock, Heart, Shirt, ThumbsDown, KeyRound, Check } from 'lucide-react';
import { FriendProfile } from '@/types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  friend: FriendProfile;
  currentPin?: string | null;
  onUpdated: (updated: FriendProfile, effectivePin: string) => void;
}

const AVATAR_OPTIONS = [
  '🎅', '🦌', '⛄', '🎄', '🎁', '🧝',
  '🍪', '🦊', '🐻', '⭐', '🛷', '🔔',
  '🧦', '❄️', '🕯️', '👑', '🎉', '🌟'
];

export default function EditProfileModal({
  isOpen,
  onClose,
  friend,
  currentPin,
  onUpdated
}: EditProfileModalProps) {
  const [name, setName] = useState(friend.name || '');
  const [avatar, setAvatar] = useState(friend.avatar || '🎅');
  const [bio, setBio] = useState(friend.bio || '');
  const [dislikes, setDislikes] = useState(friend.dislikes || '');
  const [shirtSize, setShirtSize] = useState(friend.shirtSize || '');
  const [shoeSize, setShoeSize] = useState(friend.shoeSize || '');

  // PIN
  const [pinInput, setPinInput] = useState(currentPin || '');
  const [showChangePin, setShowChangePin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const activePin = currentPin || pinInput.trim();
    if (!activePin) {
      setError('Por favor ingresa tu PIN actual para autorizar los cambios.');
      return;
    }

    if (!name.trim()) {
      setError('El nombre no puede estar vacío.');
      return;
    }

    if (showChangePin) {
      if (!newPin.trim() || newPin.trim().length < 4) {
        setError('El nuevo PIN debe tener al menos 4 dígitos.');
        return;
      }
      if (newPin.trim() !== confirmPin.trim()) {
        setError('La confirmación del nuevo PIN no coincide.');
        return;
      }
    }

    try {
      setLoading(true);

      const payload: Record<string, unknown> = {
        pin: activePin,
        name: name.trim(),
        avatar,
        bio: bio.trim(),
        dislikes: dislikes.trim(),
        shirtSize: shirtSize.trim(),
        shoeSize: shoeSize.trim()
      };

      if (showChangePin && newPin.trim()) {
        payload.newPin = newPin.trim();
      }

      const res = await fetch(`/api/friends/${encodeURIComponent(friend.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Error al actualizar el perfil.');
      }

      const updatedFriend: FriendProfile = json.data;
      const effectivePin: string = (showChangePin && newPin.trim()) ? newPin.trim() : activePin;

      // Sincronizar con localStorage / sessionStorage
      if (typeof window !== 'undefined') {
        try {
          const cachedRaw = localStorage.getItem(`santa_friend_${friend.id}`);
          if (cachedRaw) {
            const cached = JSON.parse(cachedRaw);
            const merged = { ...cached, ...updatedFriend };
            localStorage.setItem(`santa_friend_${friend.id}`, JSON.stringify(merged));
          } else {
            localStorage.setItem(`santa_friend_${friend.id}`, JSON.stringify(updatedFriend));
          }

          sessionStorage.setItem(`santa_pin_${friend.id}`, effectivePin);

          // Actualizar lista global en caché
          const allListRaw = localStorage.getItem('santa_all_friends');
          if (allListRaw) {
            const allList = JSON.parse(allListRaw);
            if (Array.isArray(allList)) {
              const updatedList = allList.map((f: FriendProfile) =>
                f.id === friend.id ? { ...f, ...updatedFriend } : f
              );
              localStorage.setItem('santa_all_friends', JSON.stringify(updatedList));
            }
          }
        } catch (e) {
          console.warn('Error sync storage:', e);
        }
      }

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      onUpdated(updatedFriend, effectivePin);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error desconocido al guardar cambios');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm p-3 sm:p-6 flex items-center justify-center animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Cabecera */}
        <div className="sticky top-0 z-10 bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center text-lg">
              {avatar}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold leading-tight">
                Editar perfil de {friend.name}
              </h2>
              <p className="text-[11px] text-slate-300">
                Personaliza tus gustos, tallas, avatar y datos de tu carpeta
              </p>
            </div>
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

        {/* Formulario con scroll */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Selector de Avatar */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Elige tu avatar festivo
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-1.5 p-2 bg-slate-50 rounded-2xl border border-slate-200">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setAvatar(emoji)}
                  className={`h-10 text-xl rounded-xl flex items-center justify-center transition-all ${
                    avatar === emoji
                      ? 'bg-white shadow-md ring-2 ring-red-600 scale-105'
                      : 'hover:bg-white/70 hover:scale-105'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span>Tu Nombre</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Kenny Galeano"
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none text-xs text-slate-800 transition-all font-medium"
            />
          </div>

          {/* Gustos y Pasatiempos */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>Tus gustos o pasatiempos</span>
            </label>
            <textarea
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Ej: Me apasiona el café de grano, los videojuegos de Nintendo, leer thrillers y la ropa negra..."
              className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none text-xs text-slate-800 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Tallas */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Shirt className="w-3.5 h-3.5 text-slate-500" />
                <span>Talla de ropa</span>
              </label>
              <input
                type="text"
                value={shirtSize}
                onChange={(e) => setShirtSize(e.target.value)}
                placeholder="Ej: M, L, Oversized XL..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none text-xs text-slate-800 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
                Talla de calzado
              </label>
              <input
                type="text"
                value={shoeSize}
                onChange={(e) => setShoeSize(e.target.value)}
                placeholder="Ej: 41 EUR / 8 US / 26 MX..."
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl border border-slate-200 focus:border-red-500 focus:bg-white focus:ring-2 focus:ring-red-100 outline-none text-xs text-slate-800 transition-all"
              />
            </div>
          </div>

          {/* Disgustos / Alergias */}
          <div>
            <label className="block text-xs font-bold text-rose-900 uppercase tracking-wide mb-1 flex items-center gap-1">
              <ThumbsDown className="w-3.5 h-3.5 text-rose-600" />
              <span>Cosas que NO te gustan / Alergias</span>
            </label>
            <textarea
              rows={2}
              value={dislikes}
              onChange={(e) => setDislikes(e.target.value)}
              placeholder="Ej: Alérgico a los frutos secos, no me gustan los adornos plásticos ni los colores fosforescentes..."
              className="w-full px-3.5 py-2.5 bg-rose-50/40 rounded-xl border border-rose-200 focus:border-rose-500 focus:bg-white focus:ring-2 focus:ring-rose-100 outline-none text-xs text-slate-800 transition-all resize-none leading-relaxed"
            />
          </div>

          {/* Verificación de PIN actual (si no viene pre-autenticado) */}
          {!currentPin && (
            <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
              <label className="block text-xs font-bold text-amber-900 uppercase tracking-wide mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-700" />
                <span>PIN actual de la carpeta (obligatorio)</span>
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={8}
                required
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresa tu PIN de 4 dígitos"
                className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 focus:border-amber-600 outline-none text-xs text-slate-800 tracking-widest font-mono"
              />
            </div>
          )}

          {/* Sección Opcional: Cambiar PIN */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setShowChangePin(!showChangePin)}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              <span>{showChangePin ? '— Cancelar cambio de PIN' : '+ ¿Quieres cambiar tu PIN de acceso?'}</span>
            </button>

            {showChangePin && (
              <div className="mt-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3 animate-in fade-in duration-150">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Nuevo PIN (4+ dígitos)
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs text-slate-800 font-mono tracking-widest text-center"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wide mb-1">
                    Confirmar Nuevo PIN
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    maxLength={8}
                    value={confirmPin}
                    onChange={(e) => setConfirmPin(e.target.value)}
                    placeholder="••••"
                    className="w-full px-3 py-2 bg-white rounded-xl border border-slate-300 focus:border-red-500 outline-none text-xs text-slate-800 font-mono tracking-widest text-center"
                  />
                </div>
              </div>
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
              disabled={loading}
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
