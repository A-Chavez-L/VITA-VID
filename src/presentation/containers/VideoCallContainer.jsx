import React, { useState, useEffect, useRef } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import ParticipantGrid from "./ParticipantGrid";
import WaitingToJoinScreen from "../screens/WaitingToJoin";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Ban, MessageSquare } from "lucide-react";
import NetworkStats from "../components/NetworkStats";
import DropDownCam from "../components/DropDownCam";
import ChatPanel from "../components/ChatPanel";
import { reportesService } from '../../core/services/reportesService';

export default function VideoCallContainer({ meetingId, citaId, esHost = false, onLeave, fechaInicio, lanzarAlerta }) {
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
      guardarEstadisticasLlamada();
      if (onLeave) onLeave();
    },
    onParticipantLeft: (participant) => {
      const participantesRestantes = Array.from(participants.keys()).filter(
        (id) => id !== participant.id
      );
      
      if (participantesRestantes.length <= 1) {
        guardarEstadisticasLlamada();
        leave();
        if (onLeave) onLeave();
      }
    },
    onError: (error) => {
      console.error("Error registrado en VideoSDK:", error);
      setError(error.message || "Error en la interconexión de videollamada");
    },
  });

  // PubSub para Chat
  const { publish, messages } = usePubSub("CHAT", {
    onMessageReceived: (mensaje) => {
      if (!chatAbiertoRef.current && mensaje.senderId !== localParticipant?.id) {
        setMensajesNoLeidos((c) => c + 1);
      }
    },
  });

  // PubSub para Expulsar Participantes cuando el Médico cuelga
  const { publish: publicarFinConsulta } = usePubSub("FIN_CONSULTA", {
    onMessageReceived: (message) => {
      if (message.message === "MEDICO_FINALIZO_CONSULTA") {
        guardarEstadisticasLlamada();
        leave();
      }
    },
  });

  const guardarEstadisticasLlamada = async () => {
    if (estadisticasGuardadas || !citaId) return;
    
    try {
      const ahora = new Date();
      const duracionSegundos = Math.round((ahora - fechaInicioLlamada) / 1000);
      
      let calidadVideo = 'Buena';
      let calidadAudio = 'Buena';
      let latencia = 0;
      let paquetesPerdidos = 0;
      let anchoBanda = 0;

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

  const finalizarConsulta = () => {
    if (esHost) {
      publicarFinConsulta("MEDICO_FINALIZO_CONSULTA", { persist: true });
    }
    guardarEstadisticasLlamada();
    leave();
  };

  const participantIds = Array.from(participants.keys());

  if (error) {
    return (
      <div className="fixed inset-0 h-screen w-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
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
    <div className="fixed inset-0 h-screen w-screen bg-slate-950 text-white flex flex-col overflow-hidden select-none">
      
      {/* HEADER SUPERIOR FIJO */}
      <div className="h-12 px-4 flex items-center justify-between border-b border-slate-800 bg-slate-900/90 shrink-0 z-10">
        <div>
          <h2 className="text-xs font-black text-white tracking-tight uppercase">Consulta Médica VITA</h2>
          <p className="text-[9px] font-mono text-slate-400">Sala: {meetingId || "..."}</p>
        </div>
        <div className="flex items-center gap-2">
          {reunionIniciada && <NetworkStats />}
          <div className="flex items-center gap-1.5 bg-sky-500/10 px-2.5 py-1 rounded-full border border-sky-500/20">
            <span className={`w-2 h-2 rounded-full ${reunionIniciada ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></span>
            <span className="text-[9px] font-bold text-sky-400 tracking-wider uppercase">
              {reunionIniciada ? "En Vivo" : "Conectando"}
            </span>
          </div>
        </div>
      </div>

      {/* ÁREA CENTRAL PRINCIPAL SIN SCROLL */}
      <div className="flex-1 min-h-0 w-full relative overflow-hidden flex">
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

      {/* FOOTER BARRA DE CONTROLES FLOTANTE/FIJA (COMPACTA PARA MÓVILES) */}
      <div className="h-16 shrink-0 bg-slate-900 border-t border-slate-800 flex items-center justify-center gap-2 md:gap-3 px-2 z-20">
        <button
          onClick={() => toggleMic()}
          aria-label="Micrófono"
          className={`p-3 rounded-full border transition ${
            localMicOn ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-rose-600 border-rose-500 text-white"
          }`}
        >
          {localMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>

        <button
          onClick={() => toggleWebcam()}
          aria-label="Cámara"
          className={`p-3 rounded-full border transition ${
            localWebcamOn ? "bg-slate-800 border-slate-700 text-slate-200" : "bg-rose-600 border-rose-500 text-white"
          }`}
        >
          {localWebcamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>

        {localWebcamOn && <DropDownCam />}

        <button
          onClick={() => { setChatAbierto(prev => !prev); setMensajesNoLeidos(0); }}
          aria-label="Chat"
          className={`relative p-3 rounded-full border transition ${
            chatAbierto ? "bg-sky-600 border-sky-500 text-white" : "bg-slate-800 border-slate-700 text-slate-200"
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          {mensajesNoLeidos > 0 && (
            <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black min-w-[16px] h-[16px] rounded-full flex items-center justify-center border border-slate-900">
              {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
            </span>
          )}
        </button>

        {/* Botón de Terminar Consulta */}
        <button
          onClick={finalizarConsulta}
          className="bg-rose-600 hover:bg-rose-700 text-white p-3 md:px-5 rounded-full flex items-center gap-2 font-bold text-xs transition shadow-lg shadow-rose-900/30"
          title="Terminar Consulta"
        >
          <PhoneOff className="w-5 h-5" />
          <span className="hidden md:inline">Terminar Consulta</span>
        </button>
      </div>
    </div>
  );
}