// src/presentation/containers/VideoCallContainer.jsx
import React, { useState, useEffect, useRef } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import ParticipantGrid from "./ParticipantGrid";
import WaitingToJoinScreen from "../screens/WaitingToJoin";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Ban, MessageSquare } from "lucide-react";
import NetworkStats from "../components/NetworkStats";
import DropDownCam from "../components/DropDownCam";
import ChatPanel from "../components/ChatPanel";
import { reportesService } from '../../core/services/reportesService';

export default function VideoCallContainer({ meetingId, citaId, onLeave, fechaInicio, lanzarAlerta }) {
  const [error, setError] = useState(null);
  const [reunionIniciada, setReunionIniciada] = useState(false);
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  const [fechaInicioLlamada, setFechaInicioLlamada] = useState(fechaInicio || new Date());
  const [estadisticasGuardadas, setEstadisticasGuardadas] = useState(false);
  
  const chatAbiertoRef = useRef(chatAbierto);
  chatAbiertoRef.current = chatAbierto;

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    participants,
    localParticipant,
    localMicOn,
    localWebcamOn,
  } = useMeeting({
    onMeetingJoined: () => {
      setReunionIniciada(true);
      setFechaInicioLlamada(new Date());
    },
    onMeetingLeft: () => {
      // Guardar estadísticas antes de salir
      guardarEstadisticasLlamada();
      if (onLeave) onLeave();
    },
    onError: (error) => {
      console.error("Error registrado en VideoSDK:", error);
      setError(error.message || "Error en la interconexión de videollamada");
    },
  });

  const { publish, messages } = usePubSub("CHAT", {
    onMessageReceived: (mensaje) => {
      if (!chatAbiertoRef.current && mensaje.senderId !== localParticipant?.id) {
        setMensajesNoLeidos((c) => c + 1);
      }
    },
  });

  const guardarEstadisticasLlamada = async () => {
    if (estadisticasGuardadas || !citaId) return;
    
    try {
      const ahora = new Date();
      const duracionSegundos = Math.round((ahora - fechaInicioLlamada) / 1000);
      
      // Obtener estadísticas de la conexión
      let calidadVideo = 'Buena';
      let calidadAudio = 'Buena';
      let latencia = 0;
      let paquetesPerdidos = 0;
      let anchoBanda = 0;

      // Intentar obtener métricas del participante local
      try {
        if (localParticipant && typeof localParticipant.getVideoStats === 'function') {
          const stats = await localParticipant.getVideoStats();
          if (stats && stats.length > 0) {
            const rtt = stats[0]?.rtt;
            if (rtt !== undefined) {
              latencia = rtt;
              if (rtt < 150) calidadVideo = 'Excelente';
              else if (rtt < 300) calidadVideo = 'Buena';
              else if (rtt < 500) calidadVideo = 'Regular';
              else calidadVideo = 'Mala';
            }
          }
        }
      } catch (e) {
        console.warn('No se pudieron obtener estadísticas de video:', e);
      }

      const estadisticas = {
        cita_id: citaId,
        fecha_inicio: fechaInicioLlamada.toISOString(),
        fecha_fin: ahora.toISOString(),
        duracion_segundos: duracionSegundos,
        calidad_video: calidadVideo,
        calidad_audio: calidadAudio,
        latencia_promedio_ms: latencia,
        paquetes_perdidos: paquetesPerdidos,
        ancho_banda_kbps: anchoBanda
      };

      await reportesService.guardarEstadisticasLlamada(estadisticas);
      setEstadisticasGuardadas(true);
      
      if (lanzarAlerta) {
        lanzarAlerta(`Estadísticas de llamada guardadas (${duracionSegundos}s)`, 'success');
      }
      
      console.log('Estadísticas guardadas:', estadisticas);
    } catch (error) {
      console.error('Error guardando estadísticas:', error);
      if (lanzarAlerta) {
        lanzarAlerta('Error al guardar estadísticas de la llamada', 'warning');
      }
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (meetingId) {
        join();
      } else {
        setError("El identificador de la sala (meetingId) es inválido o no fue recibido.");
      }
    }, 500);

    return () => {
      clearTimeout(timer);
      try {
        guardarEstadisticasLlamada();
        leave();
      } catch (e) {
        console.warn('Error al salir de la reunión:', e);
      }
    };
  }, [meetingId]);

  // Guardar estadísticas al cambiar de pestaña
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && reunionIniciada) {
        // La pestaña se ocultó, no hacemos nada especial
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [reunionIniciada]);

  const participantIds = Array.from(participants.keys());

  if (error) {
    return (
      <div className="p-8 bg-slate-900 text-white rounded-2xl min-h-[400px] flex flex-col items-center justify-center m-4 border border-rose-500/20">
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-full mb-4">
          <Ban className="w-8 h-8 text-rose-400" />
        </div>
        <h3 className="text-lg font-bold">Error en Telemedicina</h3>
        <p className="text-sm text-slate-400 mt-2 text-center max-w-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-xl text-sm font-bold transition">
          Reintentar Conexión
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-900 text-white rounded-2xl min-h-[500px] flex flex-col shadow-2xl border border-slate-800 m-4 flex-1">
      {/* Encabezado */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3">
        <div>
          <h2 className="text-sm font-black text-white tracking-tight uppercase">Consulta Médica VITA</h2>
          <p className="text-[10px] font-mono text-slate-400">Sala ID: {meetingId || "Cargando..."}</p>
          {citaId && (
            <p className="text-[9px] font-mono text-slate-500">Cita ID: {citaId}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {reunionIniciada && <NetworkStats />}
          <div className="flex items-center gap-2 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">
            <span className={`w-2 h-2 rounded-full ${reunionIniciada ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            <span className="text-[10px] font-bold text-sky-400 tracking-wider uppercase">
              {reunionIniciada ? "En Vivo" : "Conectando"}
            </span>
          </div>
        </div>
      </div>

      {/* Espacio Central */}
      <div className="flex-grow my-3 relative min-h-[350px] flex">
        {reunionIniciada && participantIds.length > 0 ? (
          <ParticipantGrid participantIds={participantIds} />
        ) : (
          <WaitingToJoinScreen
            nombreSala={meetingId}
            onCancel={() => window.location.reload()}
          />
        )}

        {chatAbierto && (
          <ChatPanel
            mensajes={messages}
            onEnviar={(texto) => publish(texto, { persist: true })}
            onClose={() => setChatAbierto(false)}
            localParticipantId={localParticipant?.id}
          />
        )}
      </div>

      {/* Controles de la llamada */}
      <div className="flex flex-wrap gap-2 justify-center border-t border-slate-800 pt-3 z-10">
        <button
          onClick={() => toggleMic()}
          aria-label={localMicOn ? "Silenciar micrófono" : "Activar micrófono"}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${localMicOn ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200" : "bg-rose-600 border-rose-500 text-white"}`}
        >
          {localMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          {localMicOn ? "Micrófono" : "Silenciado"}
        </button>
        <button
          onClick={() => toggleWebcam()}
          aria-label={localWebcamOn ? "Apagar cámara" : "Encender cámara"}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${localWebcamOn ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200" : "bg-rose-600 border-rose-500 text-white"}`}
        >
          {localWebcamOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          {localWebcamOn ? "Cámara" : "Video Apagado"}
        </button>
        {localWebcamOn && <DropDownCam />}
        <button
          onClick={() => { setChatAbierto(prev => !prev); setMensajesNoLeidos(0); }}
          aria-label={chatAbierto ? "Cerrar chat" : "Abrir chat"}
          className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${chatAbierto ? "bg-sky-600 border-sky-500 text-white" : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"}`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
          {mensajesNoLeidos > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900">
              {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
            </span>
          )}
        </button>
        <button
          onClick={() => {
            guardarEstadisticasLlamada();
            leave();
          }}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-6 py-2 rounded-xl transition shadow-lg shadow-rose-900/20"
        >
          <PhoneOff className="w-4 h-4" />
          Terminar Consulta
        </button>
      </div>
    </div>
  );
}