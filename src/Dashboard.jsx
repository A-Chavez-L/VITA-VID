// src/Dashboard.jsx
import React, { useState } from 'react';
import HomeDashboard from './HomeDashboard';
import ProgramarCitas from './ProgramarCitas';
import HistorialCitas from './HistorialCitas';
import Configuracion from './Configuracion';
import { MeetingProvider } from "@videosdk.live/react-sdk";
import VideoCallContainer from "./VideoCallContainer";
import LeaveScreen from "./LeaveScreen";
import { createMeeting } from "./api";

export default function Dashboard({ medico, onLogout, refrescarPerfil }) {
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  
  // Control de estado para la videollamada activa
  const [llamadaActiva, setLlamadaActiva] = useState({ activa: false, meetingId: null });
  
  // 🔄 Nuevo estado: Controla si se muestra la pantalla de despedida dentro del módulo de video
  const [isMeetingLeft, setIsMeetingLeft] = useState(false);

  const VIDEO_SDK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2ZjgzNzY4MC01OGQxLTQxYWBeODY3MS05NzZjY2YyYmU0YjkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc4MTc0Mjc3NCwiZXhwIjoxNzgyMzQ3NTc0fQ.zXU5hGeIYnp87JGexBlksKv7xTdQ_y_RnG0YXxYPa1c"; 

  const lanzarAlerta = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, mostrar: false })), 4000);
  };

  const obtenerNombreParticipante = () => {
    if (!medico) return "Usuario VITA";
    const esDispositivoMovil = /Mobi|Android|iPhone|iPad|Tablet/i.test(navigator.userAgent);
    if (esDispositivoMovil) {
      return "Paciente (Tablet)";
    }
    return medico.nombre_completo || "Dr. Lester Rugama";
  };

  const manejarConexionTelemedicina = async () => {
    lanzarAlerta("Generando canal de telemedicina seguro...", "info");
    const idSalaReal = await createMeeting();
    
    if (idSalaReal) {
      console.log("➡️ Cambiando estado de Dashboard a sala activa ID:", idSalaReal);
      // 🚀 Al iniciar una llamada nueva, nos aseguramos de limpiar el estado de salida
      setIsMeetingLeft(false);
      setLlamadaActiva({ activa: true, meetingId: idSalaReal });
      lanzarAlerta("Conexión establecida con éxito.", "success");
    } else {
      lanzarAlerta("Error al inicializar la sala. Revisa la vigencia del Token.", "error");
    }
  };

  // 🔄 Función manejadora para resetear estados al presionar "Reingresar"
  const manejarReingresoMeeting = (valor) => {
    setIsMeetingLeft(valor);
    if (valor === false) {
      // Si cambia a false, limpia el ID anterior para forzar al médico a generar un puente limpio al Dashboard
      setLlamadaActiva({ activa: false, meetingId: null });
    }
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
          ) : llamadaActiva.activa ? (
            /* 🖥️ ORQUESTADOR DE RENDERIZADO CONDICIONAL DE LLAMADA / SALIDA */
            isMeetingLeft ? (
              /* 1️⃣ Si el médico colgó, inyectamos la pantalla de salida de forma limpia */
              <LeaveScreen setIsMeetingLeft={manejarReingresoMeeting} />
            ) : (
              /* 2️⃣ Si la llamada está fluyendo normalmente, se renderiza el motor multimedia */
              <MeetingProvider
                config={{
                  meetingId: llamadaActiva.meetingId,
                  micEnabled: true,
                  webcamEnabled: true,
                  name: obtenerNombreParticipante(),
                }}
                token={VIDEO_SDK_TOKEN}
              >
                <VideoCallContainer onLeave={() => setIsMeetingLeft(true)} />
              </MeetingProvider>
            )
          ) : (
            <>
              {pestanaActiva === 'dashboard' && (
                <HomeDashboard 
                  medico={medico} 
                  lanzarAlerta={lanzarAlerta} 
                  iniciarLlamada={manejarConexionTelemedicina} 
                />
              )}
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