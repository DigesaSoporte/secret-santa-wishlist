'use client';

import { useState } from 'react';
import { Lock, X, KeyRound } from 'lucide-react';

interface PinVerifyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  friendName: string;
}

export default function PinVerifyModal({
  isOpen,
  onClose,
  onSuccess,
  friendName
}: PinVerifyModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Por favor ingresa tu PIN');
      return;
    }
    setError(null);
    onSuccess(pin.trim());
    setPin('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-emerald-900/20 p-6 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-4">
          <KeyRound className="w-6 h-6" />
        </div>

        <h3 className="text-xl font-bold text-slate-900">¿Eres {friendName}?</h3>
        <p className="text-xs text-slate-500 mt-1">
          Ingresa el PIN de 4 dígitos que elegiste al crear tu carpeta para agregar o eliminar tus deseos.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1">
              Tu PIN Secreto
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={8}
              autoFocus
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-200 outline-none text-center text-lg font-mono tracking-widest"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-bold shadow-md shadow-red-900/30 transition-all"
            >
              Desbloquear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

