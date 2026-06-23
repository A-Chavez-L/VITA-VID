// src/VideoCallContainer.jsx
import React, { useEffect, useState } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import ParticipantGrid from "./ParticipantGrid";
import DropDownCam from "./DropDownCam";
import DropDownSpeaker from "./DropDownSpeaker";
import NetworkStats from "./NetworkStats";
import WaitingToJoinScreen from "./WaitingToJoin";

export default function VideoCallContainer({ onLeave }) {
  const [permitidoUnirse, setPermitidoUnirse] = useState(false);

  // 🚀 Extraemos los controles y eventos directamente del hook oficial de VideoSDK
  const { join, leave, toggleMic, toggleWebcam, participants, meetingId } = useMeeting({
    onParticipantJoined: (participant) => {
      if (participant) participant.setQuality("high");
    },
    onEntryResponded: (participantId, status) => {
      // Al ser aprobados por el servidor, liberamos la interfaz de video
      if (status === "allowed") {
        setPermitidoUnirse(true);
      }
    },
    onMeetingLeft: () => {
      onLeave();
    }
  });

  // Conexión automática de hardware al montar el módulo de telemedicina
  useEffect(() => {
    join();
    
    // Fallback de seguridad por si corremos en entorno local de desarrollo
    const timeoutFallback = setTimeout(() => {
      setPermitidoUnirse(true);
    }, 1200);

    return () => {
      clearTimeout(timeoutFallback);
      leave();
    };
  }, []);

  // Convertimos el mapa de participantes activos a un arreglo tradicional de IDs
  const participantIds = Array.from(participants.keys());

  return (
    <div className="p-6 bg-slate-900 text-white rounded-2xl min-h-[600px] flex flex-col justify-between shadow-2xl border border-slate-800 m-4">
      
      {/* 📋 ENCABEZADO PROFESIONAL DE LA CONSULTA */}
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Consulta Médica Virtual</h2>
          <p className="text-xs text-slate-400 mt-0.5">Módulo de Interconexión Real • VITA</p>
        </div>
        
        <div className="flex items-center gap-4">
          {/* ⚡ DIAGNÓSTICO DE VELOCIDAD DE INTERNET EN TIEMPO REAL */}
          <NetworkStats />

          <div className="flex items-center gap-2 bg-sky-500/10 border border-sky-500/20 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 bg-sky-400 rounded-full animate-pulse"></span>
            <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider">Canal Activo</span>
          </div>
        </div>
      </header>

      {/* 📺 ESPACIO CENTRAL: REJILLA DINÁMICA / SALA DE ESPERA */}
      <div className="flex-grow flex items-center justify-center my-6 relative w-full h-full">
        {!permitidoUnirse ? (
          /* ⚡ Inyectamos tu pantalla interactiva de radar en la sala de espera */
          <WaitingToJoinScreen nombreSala={meetingId} onCancel={() => { leave(); onLeave(); }} />
        ) : participantIds.length > 0 ? (
          <ParticipantGrid participantIds={participantIds} />
        ) : (
          <div className="text-center p-8 border border-dashed border-slate-800 rounded-xl max-w-sm w-full">
            <span className="text-3xl">⏳</span>
            <p className="text-sm font-bold text-slate-300 mt-3">Iniciando transmisiones multimedia...</p>
          </div>
        )}
      </div>

      {/* 🎛️ CONTROLES INFERIORES ADAPTADOS PARA ESCRITORIO */}
      <div className="flex gap-4 justify-center items-center border-t border-slate-800 pt-4 z-20">
        
        {/* 🎙️ Botón de Micrófono Corregido en una sola línea plana */}
        <button 
          onClick={() => toggleMic()} 
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-5 py-2.5 rounded-xl transition border border-slate-700/40 cursor-pointer"
        >
          🎙️ Mudar Micrófono
        </button>

        {/* Selector Dinámico de Cámara Web */}
        <DropDownCam />

        {/* Selector Dinámico de Altavoces / Bocinas */}
        <DropDownSpeaker />

        {/* 🔴 BOTÓN DE COLGAR / TERMINAR CONSULTA FORZADO */}
        <button 
          onClick={() => { 
            try {
              leave(); 
            } catch (err) {
              console.warn("El flujo de VideoSDK ya estaba cerrado:", err);
            }
            onLeave(); 
          }} 
          className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold px-6 py-2.5 rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        >
          🔴 Terminar Consulta
        </button>
      </div>

    </div>
  );
}