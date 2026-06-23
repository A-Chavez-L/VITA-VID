// src/ParticipantView.jsx
import React, { useEffect, useRef } from "react";
import { useParticipant, VideoPlayer } from "@videosdk.live/react-sdk";

// 🎙️ REPRODUCTOR DE AUDIO CLÁSICO (Maneja la voz de los participantes)
const ParticipantAudioPlayer = ({ participantId }) => {
  const { micStream, micOn, isLocal } = useParticipant(participantId);
  const micRef = useRef(null);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream) {
        // Creamos un contenedor multimedia de HTML5 y le añadimos el track de audio del SDK
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;
        micRef.current
          .play()
          .catch((error) => console.error("Error al reproducir audio nativo:", error));
      } else {
        micRef.current.srcObject = null;
      }
    }
  }, [micStream, micOn]);

  // Si eres tú mismo (el Doctor) se silencia localmente para evitar feedback/eco molesto en tus bocinas
  return <audio ref={micRef} autoPlay muted={isLocal} />;
};

// 📺 COMPONENTE PRINCIPAL DE VIDEO
export default function ParticipantView({ participantId }) {
  const { webcamOn, displayName, isLocal, mode } = useParticipant(participantId);

  // Si el participante no está enviando ni recibiendo datos, evitamos renderizar basura en la rejilla
  if (mode !== "SEND_AND_RECV") return null;

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden rounded-xl flex items-center justify-center min-h-[350px] border border-slate-800 shadow-inner">
      
      {/* 🔊 ACOPLAMIENTO DE AUDIO NATIVO */}
      <ParticipantAudioPlayer participantId={participantId} />

      {/* 🎥 DETECCIÓN Y RENDERIZADO DINÁMICO DE VIDEO */}
      {webcamOn ? (
        <div className="w-full h-full">
          <VideoPlayer
            participantId={participantId}
            type="video"
            containerStyle={{
              height: "100%",
              width: "100%",
            }}
            className="h-full w-full"
            classNameVideo="h-full w-full object-cover rounded-xl"
          />
        </div>
      ) : (
        /* VISTA DE REEMPLAZO (AVATAR) SI EL MÉDICO O PACIENTE APAGAN LA CÁMARA */
        <div className="flex flex-col items-center gap-4 text-center select-none animate-fade-in">
          <div className="flex items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 h-24 w-24 shadow-2xl transition duration-300">
            <span className="text-4xl text-sky-400 font-black">
              {String(displayName || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Cámara Apagada</p>
            <p className="text-[11px] text-slate-500 mt-0.5">{isLocal ? "Tu transmisión" : "Señal remota"}</p>
          </div>
        </div>
      )}

      {/* 🏷️ NOMBRE DEL PARTICIPANTE FLOTANDO EN LA ESQUINA INFERIOR */}
      <div className="absolute bottom-4 left-4 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/60 px-4 py-2 rounded-full shadow-lg z-10 select-none">
        <span className={`w-2 h-2 rounded-full ${webcamOn ? "bg-emerald-500" : "bg-slate-500"}`}></span>
        <span className="text-white text-xs font-bold tracking-tight">
          {isLocal ? `${displayName} (Tú)` : displayName}
        </span>
      </div>

    </div>
  );
}