// src/presentation/screens/LlamadaExterna.jsx
import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MeetingProvider } from "@videosdk.live/react-sdk";
import VideoCallContainer from "../containers/VideoCallContainer";
import LeaveScreen from "./LeaveScreen";
import { getToken } from "../../data/api";
import { citasService } from '../../core/services/citasService';

export default function LlamadaExterna() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const meetingId = searchParams.get('meetingId');
  const citaId = searchParams.get('citaId');
  const pacienteNombre = searchParams.get('paciente') || 'Paciente';
  const medicoNombre = searchParams.get('medico') || 'Médico';
  
  const [token, setToken] = useState(null);
  const [isMeetingLeft, setIsMeetingLeft] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarToken = async () => {
      try {
        const tokenVideo = await getToken();
        setToken(tokenVideo);
      } catch (err) {
        setError("Error al cargar el token de video");
        console.error(err);
      } finally {
        setCargando(false);
      }
    };
    cargarToken();

    // Notificar a la ventana padre que la llamada está lista
    if (window.opener) {
      window.opener.postMessage({ type: 'VIDEO_CALL_READY' }, '*');
    }

    // Manejar cierre de ventana
    const handleBeforeUnload = () => {
      if (window.opener) {
        window.opener.postMessage({ type: 'VIDEO_CALL_CLOSED' }, '*');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  const manejarFinalizacion = async (nuevoEstado, notaClinica = null) => {
    if (citaId) {
      try {
        await citasService.cambiarEstadoCita(citaId, nuevoEstado, notaClinica);
      } catch (error) {
        console.error("Error al actualizar el estado:", error);
      }
    }

    // Cerrar la ventana después de finalizar
    window.close();
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xs font-mono text-slate-400">Iniciando videollamada VITA...</p>
        </div>
      </div>
    );
  }

  if (error || !meetingId || !token) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <h2 className="text-xl font-bold mb-2">Error en la videollamada</h2>
          <p className="text-sm text-slate-400">{error || "No se pudo establecer la conexión"}</p>
          <button 
            onClick={() => window.close()}
            className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2 rounded-xl text-xs transition"
          >
            Cerrar ventana
          </button>
        </div>
      </div>
    );
  }

  return (
    <MeetingProvider
      config={{
        meetingId: meetingId,
        micEnabled: true,
        webcamEnabled: true,
        name: medicoNombre,
      }}
      token={token}
    >
      {isMeetingLeft ? (
        <LeaveScreen
          onReingresar={() => setIsMeetingLeft(false)}
          onCompletar={(nota) => manejarFinalizacion('Completada', nota)}
          onCancelar={(nota) => manejarFinalizacion('Cancelada', nota)}
          onDejarPendiente={() => manejarFinalizacion('Pendiente')}
        />
      ) : (
        <VideoCallContainer
          meetingId={meetingId}
          onLeave={() => setIsMeetingLeft(true)}
        />
      )}
    </MeetingProvider>
  );
}