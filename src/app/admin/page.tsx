'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import { FriendWithGifts, ActivityLog } from '@/types';
import {
  ShieldAlert,
  Trash2,
  Lock,
  Globe,
  Smartphone,
  Calendar,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Gift,
  KeyRound,
  Eye,
  LogOut
} from 'lucide-react';

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [friends, setFriends] = useState<FriendWithGifts[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'folders' | 'logs'>('folders');

  useEffect(() => {
    const savedKey = sessionStorage.getItem('santa_admin_secret');
    if (savedKey) {
      setAdminKey(savedKey);
      fetchAdminData(savedKey);
    }
  }, []);

  const fetchAdminData = async (keyToUse: string) => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/admin/friends?key=${encodeURIComponent(keyToUse)}`);
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Clave de administrador incorrecta');
      }

      setFriends(json.data.friends || []);
      setLogs(json.data.logs || []);
      setIsAuthenticated(true);
      sessionStorage.setItem('santa_admin_secret', keyToUse);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al autenticar');
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminKey.trim()) return;
    fetchAdminData(adminKey.trim());
  };

  const handleDeleteFolder = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que deseas ELIMINAR para siempre la carpeta "${name}" (${id})?`)) {
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`/api/admin/friends/${id}?key=${encodeURIComponent(adminKey)}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'No se pudo eliminar');
      }

      // Actualizar vista local
      setFriends((prev) => prev.filter((f) => f.id !== id));
      alert(`Carpeta "${name}" eliminada correctamente.`);
      fetchAdminData(adminKey);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('santa_admin_secret');
    setIsAuthenticated(false);
    setAdminKey('');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfbf9]">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {/* Cabecera */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-3.5 py-2 rounded-xl border border-slate-200 shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la App</span>
          </Link>

          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-700 bg-white px-3.5 py-2 rounded-xl border border-red-200 shadow-sm"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión Admin</span>
            </button>
          )}
        </div>

        {/* PANTALLA 1: LOGIN DE ADMINISTRADOR */}
        {!isAuthenticated ? (
          <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl">
            <div className="w-14 h-14 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto mb-4">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <h1 className="text-2xl font-black text-center text-slate-900">
              Panel de Administrador
            </h1>
            <p className="text-xs text-center text-slate-500 mt-1">
              Acceso exclusivo para moderar carpetas, ver IPs y eliminar duplicados.
            </p>

            <form onSubmit={handleLogin} className="mt-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-semibold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5 flex items-center gap-1">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  Clave Maestra de Admin
                </label>
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="Ingresa la clave..."
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-slate-900 hover:bg-slate-800 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg transition-all text-sm flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <span>{loading ? 'Verificando...' : 'Acceder como Administrador'}</span>
              </button>
            </form>
          </div>
        ) : (
          /* PANTALLA 2: PANEL DE CONTROL DE ADMIN */
          <div className="space-y-6">
            {/* Banner de bienvenida Admin */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/30 text-red-300 text-xs font-bold uppercase tracking-wider mb-2 border border-red-500/30">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Modo Administrador Activo
                </div>
                <h1 className="text-2xl sm:text-3xl font-black">Control de Carpetas & Auditoría</h1>
                <p className="text-xs text-slate-400 mt-1">
                  Revisa las IPs de quienes crearon carpetas y elimina duplicados o spam.
                </p>
              </div>

              <button
                onClick={() => fetchAdminData(adminKey)}
                disabled={loading}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-700 self-start sm:self-auto"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Actualizar Datos</span>
              </button>
            </div>

            {/* Pestañas */}
            <div className="flex gap-2 border-b border-slate-200 pb-2">
              <button
                onClick={() => setActiveTab('folders')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'folders'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Carpetas Creadas ({friends.length})
              </button>
              <button
                onClick={() => setActiveTab('logs')}
                className={`py-2 px-4 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'logs'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100'
                }`}
              >
                Registro de Actividad & IPs ({logs.length})
              </button>
            </div>

            {/* TAB 1: LISTA DE CARPETAS CON IP Y BOTÓN DE BORRAR */}
            {activeTab === 'folders' && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Todas las Carpetas en el Sistema
                  </h3>
                  <span className="text-xs text-slate-500">
                    Puedes eliminar las carpetas repetidas o falsas con 1 clic.
                  </span>
                </div>

                {friends.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    No hay carpetas registradas.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {friends.map((friend) => (
                      <div
                        key={friend.id}
                        className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl shrink-0">
                            {friend.avatar || '🎅'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-slate-900 text-base">
                                {friend.name}
                              </h4>
                              <span className="text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                /{friend.id}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                              <span className="flex items-center gap-1 font-semibold text-slate-700">
                                <Lock className="w-3.5 h-3.5 text-amber-600" />
                                PIN: <code className="bg-amber-50 text-amber-900 px-1.5 py-0.5 rounded font-mono font-bold">{friend.pin}</code>
                              </span>

                              <span className="flex items-center gap-1 text-slate-600">
                                <Gift className="w-3.5 h-3.5 text-red-500" />
                                {friend.gifts?.length || 0} regalos
                              </span>

                              {friend.ipAddress && (
                                <span className="flex items-center gap-1 text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                                  IP: <strong className="font-mono text-slate-800">{friend.ipAddress}</strong>
                                </span>
                              )}

                              <span className="flex items-center gap-1 text-slate-400">
                                <Calendar className="w-3.5 h-3.5" />
                                {new Date(friend.createdAt).toLocaleDateString()} {new Date(friend.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {friend.userAgent && (
                              <p className="text-[11px] text-slate-400 mt-1 truncate max-w-xl">
                                Dispositivo: {friend.userAgent}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Botones de acción */}
                        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
                          <Link
                            href={`/amigo/${friend.id}`}
                            target="_blank"
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors"
                          >
                            Ver Carpeta
                          </Link>

                          <button
                            onClick={() => handleDeleteFolder(friend.id, friend.name)}
                            className="px-3 py-1.5 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-red-200"
                            title="Eliminar esta carpeta"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: AUDITORÍA DE ACTIVIDAD & IPs */}
            {activeTab === 'logs' && (
              <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Historial de Actividad & Registro de IPs
                  </h3>
                  <span className="text-xs text-slate-500">
                    Últimas acciones registradas en el sistema.
                  </span>
                </div>

                {logs.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    Aún no hay registros de actividad guardados.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {logs.map((log) => (
                      <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded font-mono">
                              {log.action}
                            </span>
                            {log.targetName && (
                              <span className="font-semibold text-slate-900">
                                En: &quot;{log.targetName}&quot; ({log.targetId})
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1 text-slate-500">
                            <span className="flex items-center gap-1 text-blue-700 font-mono font-bold bg-blue-50 px-2 py-0.5 rounded">
                              <Globe className="w-3 h-3 text-blue-500" />
                              {log.ip}
                            </span>
                            <span className="truncate max-w-sm text-slate-400">
                              {log.userAgent}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-400 shrink-0">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

