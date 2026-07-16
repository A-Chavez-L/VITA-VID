// src/presentation/screens/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import HomeDashboard from './HomeDashboard';
import ProgramarCitas from './ProgramarCitas';
import HistorialCitas from './HistorialCitas';
import Configuracion from './Configuracion';
import CompartirEnlace from "../components/CompartirEnlace";
import { MeetingProvider } from "@videosdk.live/react-sdk";
import VideoCallContainer from "../containers/VideoCallContainer";
import LeaveScreen from "./LeaveScreen";
import { createMeeting, getToken } from "../../data/api"; 
import { citasService } from '../../core/services/citasService';

export default function Dashboard({ medico, onLogout, refrescarPerfil }) {
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  const [llamadaActiva, setLlamadaActiva] = useState({ activa: false, meetingId: null });
  const [citaIdActiva, setCitaIdActiva] = useState(null); // 💾 Almacena la cita en ejecución
  const [isMeetingLeft, setIsMeetingLeft] = useState(false);
  const [videoToken, setVideoToken] = useState(null);
  const [modalInvitacion, setModalInvitacion] = useState({ mostrar: false, meetingId: null, pacienteNombre: '' });

  const lanzarAlerta = (mensaje, tipo = 'success') => {
    setToast({ mostrar: true, mensaje, tipo });
    setTimeout(() => setToast(prev => ({ ...prev, mostrar: false })), 4000);
  };

  useEffect(() => {
    const cargarToken = async () => {
      try {
        const token = await getToken();
        setVideoToken(token);
      } catch (err) {
        console.error("❌ Error al cargar el token de video:", err);
      }
    };
    cargarToken();
  }, []);

  const obtenerNombreParticipante = () => {
    if (!medico) return "Usuario VITA";
    return medico.nombre_completo || "Dr. Lester Rugama";
  };

  // 🎥 ACCIÓN 1: Une al médico cambiando el estado a 'En progreso' de manera controlada
  const manejarConexionTelemedicina = async (citaId, pacienteNombre = '') => {
    lanzarAlerta("Generando canal de telemedicina seguro...", "info");
    setCitaIdActiva(citaId); 
    
    try {
      const citaValidada = await citasService.validarAccesoASala(citaId);
      
      if (citaValidada && citaValidada.meeting_id) {
        await citasService.asociarMeetingACita(citaId, citaValidada.meeting_id, 'En progreso');
        setIsMeetingLeft(false);
        setLlamadaActiva({ activa: true, meetingId: citaValidada.meeting_id });
        lanzarAlerta("Reingresando a la sesión de teleconsulta...", "success");
        return;
      }

      const idSalaReal = await createMeeting();
      if (idSalaReal) {
        await citasService.asociarMeetingACita(citaId, idSalaReal, 'En progreso');
        setIsMeetingLeft(false);
        setLlamadaActiva({ activa: true, meetingId: idSalaReal });
        lanzarAlerta("Conexión establecida con éxito.", "success");
      } else {
        lanzarAlerta("Error al inicializar la sala. Revisa la vigencia del Token.", "error");
      }
    } catch (error) {
      console.error("❌ Error al conectar telemedicina:", error);
      lanzarAlerta("Error al asociar la sala con la cita en VITA", "error");
    }
  };

  // 🔗 ACCIÓN 2: Genera enlace para el paciente manteniendo la cita disponible ('Pendiente')
  const manejarSoloMostrarEnlace = async (citaId, pacienteNombre = '') => {
    lanzarAlerta("Generando enlace de telemedicina...", "info");
    
    try {
      const citaValidada = await citasService.validarAccesoASala(citaId);
      
      if (citaValidada && citaValidada.meeting_id) {
        setModalInvitacion({
          mostrar: true,
          meetingId: citaValidada.meeting_id,
          pacienteNombre: pacienteNombre
        });
        lanzarAlerta("Enlace recuperado. Listo para compartir.", "success");
        return;
      }

      const idSalaReal = await createMeeting();
      if (idSalaReal) {
        await citasService.asociarMeetingACita(citaId, idSalaReal);
        setModalInvitacion({
          mostrar: true,
          meetingId: idSalaReal,
          pacienteNombre: pacienteNombre
        });
        lanzarAlerta("Enlace generado. Listo para compartir.", "success");
      } else {
        lanzarAlerta("No se pudo organizar la sala de VideoSDK.", "error");
      }
    } catch (error) {
      console.error("❌ Error al procesar el enlace:", error);
      lanzarAlerta("Error al asegurar el canal en la base de datos", "error");
    }
  };

  // 🚪 Procesa la resolución final tomada por el médico en el LeaveScreen
  const manejarFinalizacionCita = async (nuevoEstado) => {
    if (citaIdActiva) {
      try {
        await citasService.cambiarEstadoCita(citaIdActiva, nuevoEstado);
        lanzarAlerta(`La cita ha sido marcada como: ${nuevoEstado}`, "success");
      } catch (error) {
        console.error("❌ Error al actualizar el estado de la cita:", error);
        lanzarAlerta("No se pudo actualizar el estado de la consulta.", "error");
      }
    }
    
    // Limpieza integral de llamadas inactivas
    setLlamadaActiva({ activa: false, meetingId: null });
    setIsMeetingLeft(false);
    setCitaIdActiva(null);
  };

  const renderContenido = () => {
    if (!medico) {
      return <div className="p-6 text-center text-slate-500 font-medium">Sincronizando perfil profesional...</div>;
    }

    if (llamadaActiva.activa) {
      if (!videoToken) {
        return <div className="p-6 text-center text-slate-500 font-medium">Cargando módulo de videollamada...</div>;
      }

      return (
        <MeetingProvider
          config={{
            meetingId: llamadaActiva.meetingId,
            micEnabled: true,
            webcamEnabled: true,
            name: obtenerNombreParticipante(),
          }}
          token={videoToken}
        >
          {isMeetingLeft ? (
            <LeaveScreen 
              onReingresar={() => setIsMeetingLeft(false)} 
              onCompletar={() => manejarFinalizacionCita('Completada')}
              onCancelar={() => manejarFinalizacionCita('Cancelada')}
              onDejarPendiente={() => manejarFinalizacionCita('Pendiente')}
            />
          ) : (
            <VideoCallContainer 
              meetingId={llamadaActiva.meetingId} 
              onLeave={() => setIsMeetingLeft(true)} 
            />
          )}
        </MeetingProvider>
      );
    }

    return (
      <>
        {pestanaActiva === 'dashboard' && (
          <HomeDashboard 
            medico={medico} 
            lanzarAlerta={lanzarAlerta} 
            iniciarLlamada={manejarConexionTelemedicina} 
            mostrarSoloEnlace={manejarSoloMostrarEnlace} 
          />
        )}
        {pestanaActiva === 'citas' && <ProgramarCitas medico={medico} lanzarAlerta={lanzarAlerta} />}
        {pestanaActiva === 'historial' && <HistorialCitas medico={medico} lanzarAlerta={lanzarAlerta} />}
        {pestanaActiva === 'config' && <Configuracion medico={medico} onProfileUpdate={refrescarPerfil} lanzarAlerta={lanzarAlerta} />}
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {/* Sistema Toast */}
      {toast.mostrar && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl border text-xs font-bold w-80 transition-all duration-300 ${
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
          <button onClick={() => setToast(prev => ({ ...prev, mostrar: false }))} className="text-slate-400 hover:text-slate-600 font-bold text-sm px-1">×</button>
        </div>
      )}

      {/* Modal Compartir Enlace */}
      {modalInvitacion.mostrar && (
        <CompartirEnlace 
          meetingId={modalInvitacion.meetingId}
          pacienteNombre={modalInvitacion.pacienteNombre}
          onClose={() => setModalInvitacion(prev => ({ ...prev, mostrar: false }))}
        />
      )}

      {/* Sidebar de Navegación */}
      <aside className="w-64 bg-white border-r border-slate-100 p-4 flex flex-col justify-between select-none">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-4">
            <span className="text-red-500 text-xl">❤️</span>
            <span className="font-black text-xl text-sky-900 tracking-wider">VITA</span>
          </div>
          <nav className="space-y-1">
            <button onClick={() => setPestanaActiva('dashboard')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'dashboard' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>📊 Dashboard</button>
            <button onClick={() => setPestanaActiva('citas')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'citas' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>📅 Programar Citas</button>
            <button onClick={() => setPestanaActiva('historial')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'historial' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>📁 Historial de Citas</button>
            <button onClick={() => setPestanaActiva('config')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${pestanaActiva === 'config' ? 'bg-sky-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>⚙️ Configuración</button>
          </nav>
        </div>
        <button onClick={onLogout} className="w-full text-sm font-semibold text-rose-500 hover:bg-rose-50 p-3 rounded-xl text-left transition">🚪 Cerrar Sesión</button>
      </aside>

      {/* Contenedor Principal */}
      <main className="flex-1 flex flex-col">
        <header className="bg-white border-b border-slate-100 p-4 flex justify-between items-center px-8 select-none">
          <div className="text-xs text-slate-400 font-black tracking-widest uppercase">HOSPITAL SAN GABRIEL</div>
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
          {renderContenido()}
        </div>
      </main>
    </div>
  );
}