// src/presentation/components/ParticipantView.jsx
import React, { useEffect, useRef } from "react";
import { useParticipant, VideoPlayer } from "@videosdk.live/react-sdk";
import { MicOff } from "lucide-react";

const ParticipantAudioPlayer = ({ participantId }) => {
  const { micStream, micOn, isLocal } = useParticipant(participantId);
  const micRef = useRef(null);

  useEffect(() => {
    if (micRef.current) {
      if (micOn && micStream && !isLocal) { // No reproducimos el audio local para evitar feedback/eco
        const mediaStream = new MediaStream();
        mediaStream.addTrack(micStream.track);
        micRef.current.srcObject = mediaStream;

        micRef.current
          .play()
          .catch((error) => {
            console.warn("Autoplay de audio retenido por el navegador. Esperando interacción:", error);
          });
      } else {
        micRef.current.srcObject = null;
      }
    }

    // Limpieza al desmontar: libera la referencia al stream de audio
    return () => {
      if (micRef.current) {
        micRef.current.srcObject = null;
      }
    };
  }, [micStream, micOn, isLocal]);

  // Si es el participante local, no renderizamos el elemento de audio
  if (isLocal) return null;

  return (
    <audio
      ref={micRef}
      autoPlay
      playsInline // Crucial para iOS Safari y Android Chrome
      controls={false}
      style={{ display: "none" }}
    />
  );
};

export default function ParticipantView({ participantId }) {
  const { webcamOn, micOn, displayName, isLocal, mode } = useParticipant(participantId);

  if (mode !== "SEND_AND_RECV") return null;

  return (
    <div className="h-full w-full bg-slate-950 relative overflow-hidden rounded-xl flex items-center justify-center min-h-[200px] border border-slate-800 shadow-inner flex-1">

      {/* Reproductor de Audio (solo participantes remotos) */}
      <ParticipantAudioPlayer participantId={participantId} />

      {/* Renderizado de Video */}
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
        <div className="flex flex-col items-center gap-3 text-center select-none p-4">
          <div className="flex items-center justify-center rounded-full bg-slate-800 border-2 border-slate-700 h-20 w-20 shadow-2xl">
            <span className="text-3xl text-sky-400 font-black">
              {String(displayName || "U").charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 tracking-wider uppercase">Cámara Apagada</p>
            <p className="text-[10px] text-slate-500">{isLocal ? "Tu transmisión" : "Señal remota"}</p>
          </div>
        </div>
      )}

      {/* Etiqueta con el Nombre y estado de audio */}
      <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800/60 px-3 py-1.5 rounded-full shadow-lg z-10">
        <span className={`w-1.5 h-1.5 rounded-full ${webcamOn ? "bg-emerald-500" : "bg-slate-500"}`}></span>
        <span className="text-white text-xs font-bold tracking-tight">
          {isLocal ? `${displayName} (Tú)` : displayName}
        </span>
        {/* Indicador de micrófono silenciado: clave en telemedicina para
            diagnosticar de un vistazo el clásico "no me escucha" */}
        {!micOn && (
          <span
            className="flex items-center justify-center bg-rose-500/20 border border-rose-500/40 rounded-full p-1"
            title={isLocal ? "Tu micrófono está silenciado" : "Este participante está silenciado"}
          >
            <MicOff className="w-3 h-3 text-rose-400" />
          </span>
        )}
      </div>

    </div>
  );
}
