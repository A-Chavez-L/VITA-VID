import React, { useState } from 'react';
import HomeDashboard from './HomeDashboard';
import ProgramarCitas from './ProgramarCitas';
import HistorialCitas from './HistorialCitas';
import Configuracion from './Configuracion';

export default function Dashboard({ medico, onLogout, refrescarPerfil }) {
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');
  
  // Estado para controlar las notificaciones globales
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });

  const lanzarAlerta = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, mostrar: false })), 4000);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      
      {/* 🔔 SISTEMA DE ALERTAS INTEGRADO */}
      {toast.mostrar && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold w-80 transition-all duration-300 animate-slide-up ${
          toast.tipo === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
          toast.tipo === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
          toast.tipo === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' :
          'bg-sky-50 border-sky-200 text-sky-800'
        }`}>
          <div className="flex items-center gap-2">
            <span className="text-base">
              {toast.tipo === 'success' && '✅'}
              {toast.tipo === 'error' && '❌'}
              {toast.tipo === 'warning' && '⚠️'}
              {toast.tipo === 'info' && 'ℹ️'}
            </span>
            <div className="flex flex-col">
              <span className="capitalize text-[10px] text-slate-400 font-black tracking-wider">{toast.tipo}</span>
              <p className="font-medium text-slate-700 mt-0.5">{toast.mensaje}</p>
            </div>
          </div>
          <button 
            onClick={() => setToast(prev => ({ ...prev, mostrar: false }))} 
            className="text-slate-400 hover:text-slate-600 font-bold text-sm px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Sidebar / Menú Lateral Izquierdo */}
      <aside className="w-64 bg-white border-r border-slate-100 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-4">
            <span className="text-red-500 text-xl">❤️</span>
            <span className="font-black text-xl text-sky-900 tracking-wider">VITA</span>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setPestanaActiva('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'dashboard' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>📊 Dashboard</button>
            <button onClick={() => setPestanaActiva('citas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'citas' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>📅 Programar Citas</button>
            <button onClick={() => setPestanaActiva('historial')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'historial' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>📁 Historial Clínico</button>
            <button onClick={() => setPestanaActiva('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'config' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>⚙️ Configuración</button>
          </nav>
        </div>
        <button onClick={onLogout} className="w-full text-sm font-semibold text-rose-500 hover:bg-rose-50 p-3 rounded-xl text-left transition">🚪 Cerrar Sesión</button>
      </aside>

      {/* Área de Visualización */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-100 p-4 flex justify-between items-center px-8">
          <div className="text-xs text-slate-400 font-medium">HOSPITAL SAN GABRIEL</div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800">Hola, {medico?.nombre_completo || 'Cargando...'}</p>
              <p className="text-[10px] text-slate-400 font-medium">{medico?.especialidad || 'Médico'}</p>
            </div>
            <div className="bg-sky-100 text-sky-700 font-bold p-2 rounded-full w-9 h-9 flex items-center justify-center text-xs border border-sky-200 overflow-hidden">
              {medico?.avatar_url ? <img src={medico.avatar_url} className="w-full h-full object-cover" alt="Avatar"/> : "MD"}
            </div>
          </div>
        </header>

        <div className="flex-1">
          {!medico ? (
            <div className="p-6 text-center text-slate-500">Sincronizando perfil profesional...</div>
          ) : (
            <>
              {pestanaActiva === 'dashboard' && <HomeDashboard medico={medico} lanzarAlerta={lanzarAlerta} />}
              {pestanaActiva === 'citas' && <ProgramarCitas medico={medico} lanzarAlerta={lanzarAlerta} />}
              {pestanaActiva === 'historial' && <HistorialCitas medico={medico} lanzarAlerta={lanzarAlerta} />}
              {pestanaActiva === 'config' && <Configuracion medico={medico} onProfileUpdate={refrescarPerfil} lanzarAlerta={lanzarAlerta} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}