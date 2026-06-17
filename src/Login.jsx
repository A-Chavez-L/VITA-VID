import React, { useState } from 'react';
import { User, Lock, Activity } from 'lucide-react';
import { supabase } from './supabaseClient'; 

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para las alertas estilizadas (Toast) en lugar de errorMsg
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'error' });

  const lanzarAlertaLocal = (mensaje, tipo = 'error') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, mostrar: false })), 4000);
  };

  const rickRollUrl = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TU LÓGICA ORIGINAL RESTAURADA: Autenticación real con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) throw error;

      console.log('Autenticación exitosa:', data.user);
      
      if (onLogin) {
        onLogin(data.user); 
      }

    } catch (error) {
      if (error.message === 'Invalid login credentials') {
        lanzarAlertaLocal('El correo electrónico o la contraseña son incorrectos.', 'error');
      } else {
        lanzarAlertaLocal(error.message, 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-100 overflow-hidden">
      
      {/* 🔔 Alerta integrada estilo Toast abajo a la derecha */}
      {toast.mostrar && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold w-80 bg-rose-50 border-rose-200 text-rose-800 animate-slide-up">
          <div className="flex items-center gap-2">
            <span>❌</span>
            <p className="font-medium text-slate-700">{toast.mensaje}</p>
          </div>
          <button onClick={() => setToast(prev => ({ ...prev, mostrar: false }))} className="text-slate-400 hover:text-slate-600 font-bold">×</button>
        </div>
      )}

      {/* Líneas de pulso de fondo decorativas */}
      <div className="absolute inset-0 opacity-5 pointer-events-none flex justify-between items-center px-10">
        <Activity size={300} className="text-sky-600" />
        <Activity size={300} className="text-sky-600" />
      </div>

      {/* Tarjeta de Login */}
      <div className="w-full max-w-md p-8 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 z-10 mx-4">
        
        {/* Encabezado con imágenes */}
        <div className="flex justify-center items-center gap-6 mb-8 border-b border-slate-100 pb-6">
          <div className="text-center flex flex-col items-center">
            <img 
              src="/img/logo-hospital-gabriel.png" 
              alt="San Gabriel con Cruz" 
              className="h-16 w-auto mb-2" 
            />
            <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">Hospital</p>
            <p className="text-base font-black text-sky-900 uppercase tracking-tight">San Gabriel</p>
            <p className="text-[9px] text-slate-400 italic">de la Virgen Dolorosa</p>
          </div>
          <div className="h-14 w-[1px] bg-slate-300"></div>
          <div className="flex flex-col items-center">
            <img 
              src="/img/logo-vita.png" 
              alt="VITA Pulso Circular" 
              className="h-16 w-auto mb-2" 
            />
            <div className="flex items-center gap-1 text-sky-600 font-black text-3xl tracking-wider">
              VITA
            </div>
          </div>
        </div>

        {/* Eslogan */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-black text-sky-900 tracking-tight">VITA</h2>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">
            Tu salud, a un clic.
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="relative flex items-center">
              <User className="absolute left-3 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="Correo Electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <div className="relative flex items-center">
              <Lock className="absolute left-3 w-5 h-5 text-slate-400" />
              <input
                type="password"
                placeholder="Contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-700 transition-all"
                required
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-lg text-sm shadow-md transition-all ${
              loading 
                ? 'bg-sky-400 cursor-not-allowed shadow-none' 
                : 'bg-sky-600 hover:bg-sky-700 shadow-sky-200'
            }`}
          >
            {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
          </button>
        </form>

        {/* Enlaces de pie de página */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-center space-y-2">
          <div className="flex justify-center gap-4 text-[11px] text-slate-400 font-medium items-center">
            <a 
              href={rickRollUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hover:underline cursor-pointer text-slate-400 hover:text-sky-600"
            >
              Soporte técnico
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}