import React, { useState } from 'react';
import { User, Lock, Activity } from 'lucide-react';
import { authService } from '../../core/services/authService';

// 1. Importamos las imágenes (Asegúrate de que la ruta coincida con donde las guardaste)
import logoVita from '../../assets/logo-vita.jpeg';
import logoHospital from '../../assets/logo-hospital.jpeg';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      const user = await authService.login(email, password);
      console.log('Autenticación exitosa en VITA');
      if (onLogin) onLogin(user);
    } catch (error) {
      lanzarAlertaLocal(error.message || "Credenciales incorrectas", 'error');
    } finally {
      // 🐛 SOLUCIÓN AL BUG: 
      // Eliminamos el "loading &&" para asegurar que SIEMPRE se liberen los inputs
      setLoading(false); 
    }
  };

  return (
    // Modificamos el contenedor principal para que use justify-between y ocupe todo el ancho
    <div className="min-h-screen flex items-center justify-between bg-slate-50 px-4 md:px-12 relative overflow-hidden">
      
      {toast.mostrar && (
        <div className="fixed top-5 right-5 bg-rose-600 text-white px-4 py-3 rounded-xl shadow-lg border border-rose-500 text-xs font-bold animate-fade-in z-50">
          ⚠️ {toast.mensaje}
        </div>
      )}
      
      {/* 2. LADO IZQUIERDO: Logo de VITA */}
      <div className="hidden md:flex w-1/3 justify-center items-center">
        <img 
          src={logoVita} 
          alt="Logo VITA" 
          className="max-w-[320px] w-full object-contain mix-blend-multiply opacity-95"
        />
      </div>

      {/* 3. CENTRO: Tu formulario de Login */}
      <div className="w-full md:w-1/3 flex justify-center items-center z-10">
        <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-slate-100">
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 w-12 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-100 mb-3">
              <Activity className="text-white h-6 w-6" />
            </div>
            <h2 className="text-xl font-black text-slate-800 tracking-tight">Ingreso al Sistema VITA</h2>
            <p className="text-xs text-slate-400 font-medium">Hospital San Gabriel</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Correo Electrónico</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="medico@hospital.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  // Añadí 'disabled:opacity-50 disabled:bg-slate-100' para dar feedback visual
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-700 disabled:opacity-50 disabled:bg-slate-100 transition-all" 
                  required 
                  disabled={loading} 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 text-slate-700 disabled:opacity-50 disabled:bg-slate-100 transition-all" 
                  required 
                  disabled={loading} 
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading} 
              className={`w-full py-3 text-white font-bold rounded-xl text-sm shadow-md transition-all ${loading ? 'bg-sky-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700'}`}
            >
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </button>
          </form>
        </div>
      </div>

      {/* 4. LADO DERECHO: Logo del Hospital */}
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