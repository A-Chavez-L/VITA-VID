// src/presentation/screens/Login.jsx
import React, { useState } from 'react';
import { User, Lock, Activity, Eye, EyeOff, AlertTriangle, Loader2 } from 'lucide-react';
import { authService } from '../../core/services/authService';

// Logos institucionales (verificar que la ruta coincida con /src/assets)
import logoVita from '../../assets/logo-vita.jpeg';
import logoHospital from '../../assets/logo-hospital.jpeg';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'error' });

  const lanzarAlertaLocal = (mensaje, tipo = 'error') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, mostrar: false })), 4000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await authService.login(email.trim(), password);
      if (onLogin) onLogin(user);
    } catch (error) {
      lanzarAlertaLocal(error.message || "Credenciales incorrectas", 'error');
    } finally {
      // El finally garantiza que los inputs siempre se liberen, incluso tras un error
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-between bg-slate-50 px-4 md:px-12 relative overflow-hidden">

      {toast.mostrar && (
        <div role="alert" className="fixed top-5 right-5 flex items-center gap-2 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-lg border border-rose-500 text-xs font-bold animate-fade-in z-50">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          {toast.mensaje}
        </div>
      )}

      {/* LADO IZQUIERDO: Logo de VITA */}
      <div className="hidden md:flex w-1/3 justify-center items-center">
        <img
          src={logoVita}
          alt="Logo VITA"
          className="max-w-[320px] w-full object-contain mix-blend-multiply opacity-95"
        />
      </div>

      {/* CENTRO: Formulario de Login */}
      <div className="w-full md:w-1/3 flex justify-center items-center z-10">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-100 mb-3">
              <Activity className="text-white h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Ingreso al Sistema VITA</h2>
            <p className="text-xs text-slate-500 font-medium">Hospital San Gabriel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Correo Electrónico</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder="medico@hospital.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-slate-700 disabled:opacity-50 disabled:bg-slate-100 transition-all"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="login-password" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400 pointer-events-none" />
                <input
                  id="login-password"
                  type={mostrarPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 text-slate-700 disabled:opacity-50 disabled:bg-slate-100 transition-all"
                  required
                  disabled={loading}
                />
                {/* Alternar visibilidad de la contraseña */}
                <button
                  type="button"
                  onClick={() => setMostrarPassword(prev => !prev)}
                  disabled={loading}
                  aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-0.5 rounded transition disabled:opacity-50"
                >
                  {mostrarPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 text-white font-bold rounded-xl text-sm shadow-md transition-all inline-flex items-center justify-center gap-2 ${loading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* LADO DERECHO: Logo del Hospital */}
      <div className="hidden md:flex w-1/3 justify-center items-center">
        <img
          src={logoHospital}
          alt="Hospital San Gabriel"
          className="max-w-[280px] w-full object-contain mix-blend-multiply opacity-95"
        />
      </div>

    </div>
  );
}
