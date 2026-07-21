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
import {
  LayoutDashboard,
  CalendarPlus,
  FolderClock,
  Settings,
  LogOut,
  HeartPulse,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';

// Configuración centralizada del sistema de toasts (estilo + etiqueta en español)
const ESTILOS_TOAST = {
  success: { clases: 'bg-emerald-50 border-emerald-200 text-emerald-800', etiqueta: 'Éxito',  Icono: CheckCircle2, colorIcono: 'text-emerald-500' },
  error:   { clases: 'bg-rose-50 border-rose-200 text-rose-800',           etiqueta: 'Error',  Icono: XCircle,      colorIcono: 'text-rose-500' },
  warning: { clases: 'bg-amber-50 border-amber-200 text-amber-800',        etiqueta: 'Aviso',  Icono: AlertTriangle, colorIcono: 'text-amber-500' },
  info:    { clases: 'bg-sky-50 border-sky-200 text-sky-800',              etiqueta: 'Info',   Icono: Info,          colorIcono: 'text-sky-500' },
};

// Definición de la navegación lateral en un solo lugar (evita repetir markup)
const OPCIONES_NAV = [
  { id: 'dashboard', etiqueta: 'Dashboard',          Icono: LayoutDashboard },
  { id: 'citas',     etiqueta: 'Programar Citas',    Icono: CalendarPlus },
  { id: 'historial', etiqueta: 'Historial de Citas', Icono: FolderClock },
  { id: 'config',    etiqueta: 'Configuración',      Icono: Settings },
];

export default function Dashboard({ medico, onLogout, refrescarPerfil }) {
  const [pestanaActiva, setPestanaActiva] = useState('dashboard');
  const [toast, setToast] = useState({ mostrar: false, mensaje: '', tipo: 'success' });
  const [llamadaActiva, setLlamadaActiva] = useState({ activa: false, meetingId: null });
  const [citaIdActiva, setCitaIdActiva] = useState(null);
  const [isMeetingLeft, setIsMeetingLeft] = useState(false);
  const [videoToken, setVideoToken] = useState(null);
  const [modalInvitacion, setModalInvitacion] = useState({ mostrar: false, meetingId: null, pacienteNombre: '' });
  // Nueva ventana de llamada
  const [ventanaLlamada, setVentanaLlamada] = useState(null);
  const [modoVentanaExterna, setModoVentanaExterna] = useState(false);

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
        console.error("Error al cargar el token de video:", err);
      }
    };
    cargarToken();
  }, []);

  // Escuchar mensajes de la ventana de llamada
  useEffect(() => {
    const handleMessage = (event) => {
      // Verificar origen por seguridad
      if (event.data?.type === 'VIDEO_CALL_CLOSED') {
        setLlamadaActiva({ activa: false, meetingId: null });
        setIsMeetingLeft(false);
        setCitaIdActiva(null);
        setModoVentanaExterna(false);
        setVentanaLlamada(null);
        lanzarAlerta("La videollamada ha finalizado", "info");
      }
      if (event.data?.type === 'VIDEO_CALL_READY') {
        // La ventana de llamada está lista
        setModoVentanaExterna(true);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const obtenerNombreParticipante = () => {
    if (!medico) return "Usuario VITA";
    return medico.nombre_completo || "Médico VITA";
  };

  // Función para abrir la llamada en nueva ventana
  const abrirLlamadaEnVentana = (citaId, meetingId, pacienteNombre) => {
    const ancho = 1200;
    const alto = 800;
    const izquierda = (window.screen.width - ancho) / 2;
    const arriba = (window.screen.height - alto) / 2;

    // Construir URL con parámetros
    const url = `${window.location.origin}/llamada?meetingId=${meetingId}&citaId=${citaId}&paciente=${encodeURIComponent(pacienteNombre)}&medico=${encodeURIComponent(obtenerNombreParticipante())}`;

    const nuevaVentana = window.open(
      url,
      'videollamada_vita',
      `width=${ancho},height=${alto},left=${izquierda},top=${arriba},menubar=no,toolbar=no,location=no,status=no,scrollbars=no`
    );

    if (nuevaVentana) {
      setVentanaLlamada(nuevaVentana);
      setLlamadaActiva({ activa: true, meetingId });
      setCitaIdActiva(citaId);
      setModoVentanaExterna(true);

      // Guardar referencia en localStorage para reconexión
      localStorage.setItem('vita_llamada_activa', JSON.stringify({
        citaId,
        meetingId,
        pacienteNombre,
        timestamp: Date.now()
      }));

      lanzarAlerta("Videollamada abierta en nueva ventana", "success");
    } else {
      lanzarAlerta("No se pudo abrir la ventana. Revisa que los bloqueadores de pop-ups estén desactivados.", "error");
    }
  };

  const manejarConexionTelemedicina = async (citaId, pacienteNombre = '') => {
    lanzarAlerta("Generando canal de telemedicina seguro...", "info");
    setCitaIdActiva(citaId);

    try {
      const citaValidada = await citasService.validarAccesoASala(citaId);
      let idSalaReal;

      if (citaValidada && citaValidada.meeting_id) {
        idSalaReal = citaValidada.meeting_id;
        await citasService.asociarMeetingACita(citaId, citaValidada.meeting_id, 'En progreso');
      } else {
        idSalaReal = await createMeeting();
        if (idSalaReal) {
          await citasService.asociarMeetingACita(citaId, idSalaReal, 'En progreso');
        } else {
          lanzarAlerta("Error al inicializar la sala. Revisa la vigencia del Token.", "error");
          return;
        }
      }

      // Abrir en nueva ventana
      abrirLlamadaEnVentana(citaId, idSalaReal, pacienteNombre);
      lanzarAlerta("Conexión establecida con éxito.", "success");

    } catch (error) {
      console.error("Error al conectar telemedicina:", error);
      lanzarAlerta("Error al asociar la sala con la cita en VITA", "error");
    }
  };

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
      console.error("Error al procesar el enlace:", error);
      lanzarAlerta("Error al asegurar el canal en la base de datos", "error");
    }
  };

  // Procesa la resolución final tomada por el médico en el LeaveScreen
  const manejarFinalizacionCita = async (nuevoEstado, notaClinica = null) => {
    if (citaIdActiva) {
      try {
        await citasService.cambiarEstadoCita(citaIdActiva, nuevoEstado, notaClinica);
        lanzarAlerta(`La cita ha sido marcada como: ${nuevoEstado}`, "success");
      } catch (error) {
        console.error("Error al actualizar el estado de la cita:", error);
        lanzarAlerta("No se pudo actualizar el estado de la consulta.", "error");
      }
    }

    // Limpieza integral de llamadas inactivas
    setLlamadaActiva({ activa: false, meetingId: null });
    setIsMeetingLeft(false);
    setCitaIdActiva(null);
    setModoVentanaExterna(false);
    localStorage.removeItem('vita_llamada_activa');

    if (ventanaLlamada && !ventanaLlamada.closed) {
      ventanaLlamada.close();
    }
    setVentanaLlamada(null);
  };

  // Verificar si hay una llamada activa guardada al cargar
  useEffect(() => {
    const llamadaGuardada = localStorage.getItem('vita_llamada_activa');
    if (llamadaGuardada) {
      try {
        const data = JSON.parse(llamadaGuardada);
        // Verificar si la llamada sigue activa (menos de 4 horas)
        if (Date.now() - data.timestamp < 4 * 60 * 60 * 1000) {
          setLlamadaActiva({ activa: true, meetingId: data.meetingId });
          setCitaIdActiva(data.citaId);
          setModoVentanaExterna(true);
        } else {
          localStorage.removeItem('vita_llamada_activa');
        }
      } catch (e) {
        localStorage.removeItem('vita_llamada_activa');
      }
    }
  }, []);

  const renderContenido = () => {
    if (!medico) {
      return <div className="p-6 text-center text-slate-500 font-medium">Sincronizando perfil profesional...</div>;
    }

    // Si hay una llamada activa, mostrar un overlay o indicador
    if (llamadaActiva.activa && modoVentanaExterna) {
      // Mostrar el contenido normal pero con un indicador de llamada activa
      return (
        <>
          {/* Banner de llamada activa */}
          <div className="bg-sky-50 border-b border-sky-200 p-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-sm font-medium text-sky-800">
                📹 Videollamada en curso
              </span>
              <span className="text-xs text-sky-600">
                (ID: {llamadaActiva.meetingId})
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (ventanaLlamada && !ventanaLlamada.closed) {
                    ventanaLlamada.focus();
                  } else {
                    // Reabrir la ventana
                    const llamadaGuardada = localStorage.getItem('vita_llamada_activa');
                    if (llamadaGuardada) {
                      const data = JSON.parse(llamadaGuardada);
                      abrirLlamadaEnVentana(data.citaId, data.meetingId, data.pacienteNombre);
                    }
                  }
                }}
                className="inline-flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Reabrir llamada
              </button>
              <button
                onClick={() => {
                  if (ventanaLlamada && !ventanaLlamada.closed) {
                    ventanaLlamada.close();
                  }
                  setLlamadaActiva({ activa: false, meetingId: null });
                  setCitaIdActiva(null);
                  setModoVentanaExterna(false);
                  localStorage.removeItem('vita_llamada_activa');
                  lanzarAlerta("Llamada finalizada", "info");
                }}
                className="inline-flex items-center gap-1.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-4 py-1.5 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
                Finalizar llamada
              </button>
            </div>
          </div>

          {/* Contenido normal */}
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
    }

    // Llamada en modo embebido (sin ventana externa)
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
              onCompletar={(nota) => manejarFinalizacionCita('Completada', nota)}
              onCancelar={(nota) => manejarFinalizacionCita('Cancelada', nota)}
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

  const estiloToast = ESTILOS_TOAST[toast.tipo] || ESTILOS_TOAST.info;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 relative">

      {/* Sistema Toast */}
      {toast.mostrar && (
        <div
          role="status"
          className={`fixed bottom-6 right-6 z-50 flex items-center justify-between gap-3 px-4 py-3 rounded-xl shadow-xl border w-80 transition-all duration-300 ${estiloToast.clases}`}
        >
          <div className="flex items-start gap-2.5">
            <estiloToast.Icono className={`w-5 h-5 mt-0.5 shrink-0 ${estiloToast.colorIcono}`} />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-black tracking-wider uppercase">{estiloToast.etiqueta}</span>
              <p className="text-xs font-medium text-slate-700 mt-0.5">{toast.mensaje}</p>
            </div>
          </div>
          <button
            onClick={() => setToast(prev => ({ ...prev, mostrar: false }))}
            aria-label="Cerrar notificación"
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-white/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
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

      {/* Sidebar de Navegación (fijo) */}
      <aside className="w-64 bg-white border-r border-slate-100 p-4 flex flex-col justify-between select-none shrink-0">
        <div className="space-y-6">
          <div className="flex items-center gap-2 px-2 py-4">
            <HeartPulse className="w-6 h-6 text-red-500" strokeWidth={2.5} />
            <span className="font-black text-xl text-sky-900 tracking-wider">VITA</span>
          </div>
          <nav className="space-y-1">
            {OPCIONES_NAV.map(({ id, etiqueta, Icono }) => (
              <button
                key={id}
                onClick={() => setPestanaActiva(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all focus-visible:outline-2 focus-visible:outline-sky-500 ${
                  pestanaActiva === id
                    ? 'bg-sky-500 text-white shadow-md'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Icono className="w-4 h-4 shrink-0" />
                {etiqueta}
              </button>
            ))}
          </nav>
        </div>
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 text-sm font-semibold text-rose-500 hover:bg-rose-50 p-3 rounded-xl transition focus-visible:outline-2 focus-visible:outline-rose-400"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Cerrar Sesión
        </button>
      </aside>

      {/* Contenedor Principal */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-slate-100 p-4 flex justify-between items-center px-8 select-none shrink-0">
          <div className="text-xs text-slate-500 font-black tracking-widest uppercase">HOSPITAL SAN GABRIEL</div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold text-slate-800">Hola, {medico?.nombre_completo || 'Cargando...'}</p>
              <p className="text-xs text-slate-500 font-medium">{medico?.especialidad || 'Médico'}</p>
            </div>
            <div className="bg-sky-100 text-sky-700 font-bold rounded-full w-10 h-10 flex items-center justify-center text-xs border border-sky-200 overflow-hidden shrink-0">
              {medico?.avatar_url
                ? <img src={medico.avatar_url} className="w-full h-full object-cover" alt={`Avatar de ${medico?.nombre_completo || 'médico'}`} />
                : "MD"}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto">
          {renderContenido()}
        </div>
      </main>
    </div>
  );
}