// src/presentation/containers/VideoCallContainer.jsx
import React, { useState, useEffect, useRef } from "react";
import { useMeeting, usePubSub } from "@videosdk.live/react-sdk";
import ParticipantGrid from "./ParticipantGrid";
import WaitingToJoinScreen from "../screens/WaitingToJoin";
import { Mic, MicOff, Video, VideoOff, PhoneOff, Ban, MessageSquare } from "lucide-react";
import NetworkStats from "../components/NetworkStats";
import DropDownCam from "../components/DropDownCam";
import ChatPanel from "../components/ChatPanel";

export default function VideoCallContainer({ meetingId, onLeave }) {
  const [error, setError] = useState(null);
  const [reunionIniciada, setReunionIniciada] = useState(false);

  // Estado del chat en llamada
  const [chatAbierto, setChatAbierto] = useState(false);
  const [mensajesNoLeidos, setMensajesNoLeidos] = useState(0);
  // Ref espejo para leer el estado actual dentro del callback de PubSub
  // (el callback captura el valor del render en que se creó)
  const chatAbiertoRef = useRef(chatAbierto);
  chatAbiertoRef.current = chatAbierto;

  const {
    join,
    leave,
    toggleMic,
    toggleWebcam,
    participants,
    localParticipant,
    // Estado real del SDK: única fuente de verdad para mic y cámara.
    // Evita que la UI se desincronice si un toggle falla (permisos, cámara ocupada, etc.)
    localMicOn,
    localWebcamOn,
  } = useMeeting({
    onMeetingJoined: () => {
      setReunionIniciada(true);
    },
    onMeetingLeft: () => {
      if (onLeave) onLeave();
    },
    onError: (error) => {
      console.error("Error registrado en VideoSDK:", error);
      setError(error.message || "Error en la interconexión de videollamada");
    },
  });

  // Canal de chat sobre la infraestructura PubSub de VideoSDK:
  // no requiere backend adicional. persist:true hace que quien entre tarde
  // reciba el historial de mensajes de la sesión.
  const { publish, messages } = usePubSub("CHAT", {
    onMessageReceived: (mensaje) => {
      // Cuenta como "no leído" solo si el panel está cerrado y el mensaje es ajeno
      if (!chatAbiertoRef.current && mensaje.senderId !== localParticipant?.id) {
        setMensajesNoLeidos((c) => c + 1);
      }
    },
  });

  useEffect(() => {
    // Pequeño delay para evitar la condición de carrera con el MeetingProvider
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
        leave();
      } catch (e) {
        // La reunión ya estaba cerrada al desmontar: no es un error real
      }
    };
  }, [meetingId]);

  // Participantes activos en la llamada
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
        </div>
        <div className="flex items-center gap-2">
          {/* Indicador de calidad de red (solo tiene sentido con la reunión activa) */}
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

        {/* Panel de chat en llamada */}
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
        {/* Selector de dispositivo de cámara (visible solo con la webcam encendida) */}
        {localWebcamOn && <DropDownCam />}
        <button
          onClick={() => { setChatAbierto(prev => !prev); setMensajesNoLeidos(0); }}
          aria-label={chatAbierto ? "Cerrar chat" : "Abrir chat"}
          className={`relative inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition ${chatAbierto ? "bg-sky-600 border-sky-500 text-white" : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"}`}
        >
          <MessageSquare className="w-4 h-4" />
          Chat
          {/* Contador de mensajes no leídos */}
          {mensajesNoLeidos > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[9px] font-black min-w-[18px] h-[18px] px-1 rounded-full flex items-center justify-center border-2 border-slate-900">
              {mensajesNoLeidos > 9 ? "9+" : mensajesNoLeidos}
            </span>
          )}
        </button>
        <button
          onClick={() => leave()}
          className="inline-flex items-center gap-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black px-6 py-2 rounded-xl transition shadow-lg shadow-rose-900/20"
        >
          <PhoneOff className="w-4 h-4" />
          Terminar Consulta
        </button>
      </div>
    </div>
  );
}