import React, { useState } from 'react';
import HomeDashboard from './HomeDashboard';
import ProgramarCitas from './ProgramarCitas';
import Configuracion from './Configuracion';

export default function Dashboard({ medico, onLogout, refrescarPerfil }) {
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-100 p-4 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-4">
            <span className="text-red-500 text-xl">❤️</span>
            <span className="font-black text-xl text-sky-900 tracking-wider">VITA</span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setPestanaActiva('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                pestanaActiva === 'dashboard' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              📊 Dashboard
            </button>
            <button 
              onClick={() => setPestanaActiva('citas')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                pestanaActiva === 'citas' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              📅 Programar Citas
            </button>
            <button 
              onClick={() => setPestanaActiva('config')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                pestanaActiva === 'config' ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20' : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              ⚙️ Configuración
            </button>
          </nav>
        </div>

        <button onClick={onLogout} className="w-full text-sm font-semibold text-rose-500 hover:bg-rose-50 p-3 rounded-xl text-left transition">
          🚪 Cerrar Sesión
        </button>
      </aside>

      {/* Contenido Principal */}
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
            <div className="p-6 text-center text-slate-500">Sincronizando perfil profesional con la base de datos...</div>
          ) : (
            <>
              {pestanaActiva === 'dashboard' && <HomeDashboard medico={medico} />}
              {pestanaActiva === 'citas' && <ProgramarCitas medico={medico} onProfileUpdate={refrescarPerfil} />}
              {pestanaActiva === 'config' && <Configuracion medico={medico} onProfileUpdate={refrescarPerfil} />}
            </>
          )}
        </div>
      </main>
    </div>
  );
}