// src/presentation/components/NetworkStats.jsx
import React, { useEffect, useState, useRef } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";

/**
 * Indicador de calidad de conexión basado en RTT (latencia de ida y vuelta).
 * Umbrales: < 150ms = BUENA | 150-300ms = REGULAR | > 300ms = MALA
 * Mientras no exista una medición real, muestra MIDIENDO (no asume calidad).
 */
const ESTILOS_CALIDAD = {
  MIDIENDO: { capa: "bg-slate-700 text-slate-300 border-slate-600/40", punto: "bg-slate-400", ping: "bg-slate-400" },
  BUENA:    { capa: "bg-emerald-500 text-emerald-100 border-emerald-400/20", punto: "bg-emerald-200", ping: "bg-emerald-300" },
  REGULAR:  { capa: "bg-amber-500 text-amber-100 border-amber-400/20", punto: "bg-amber-200", ping: "bg-amber-300" },
  MALA:     { capa: "bg-rose-500 text-rose-100 border-rose-400/20", punto: "bg-rose-200", ping: "bg-rose-300" },
};

export default function NetworkStats() {
  const [calidadConexion, setCalidadConexion] = useState("MIDIENDO");
  const statsIntervalIdRef = useRef(null);

  // Información del participante local directamente del core del meeting
  const { localParticipant } = useMeeting();

  const actualizarMetricas = async () => {
    try {
      if (localParticipant && typeof localParticipant.getVideoStats === 'function') {
        const stats = await localParticipant.getVideoStats();

        if (stats && stats.length > 0) {
          const rtt = stats[0]?.rtt; // Latencia de ida y vuelta en milisegundos

          if (rtt === undefined || rtt === null) return;

          if (rtt < 150) {
            setCalidadConexion("BUENA");
          } else if (rtt < 300) {
            setCalidadConexion("REGULAR");
          } else {
            setCalidadConexion("MALA");
          }
        }
      }
    } catch (error) {
      // Silencioso: las métricas pueden no estar listas en los primeros segundos
      // de la llamada; el badge simplemente permanece en su último estado válido.
    }
  };

  useEffect(() => {
    if (localParticipant) {
      actualizarMetricas();

      if (statsIntervalIdRef.current) clearInterval(statsIntervalIdRef.current);
      // Consulta en background cada 3 segundos
      statsIntervalIdRef.current = setInterval(actualizarMetricas, 3000);
    }

    return () => {
      if (statsIntervalIdRef.current) clearInterval(statsIntervalIdRef.current);
    };
  }, [localParticipant]);

  const estilos = ESTILOS_CALIDAD[calidadConexion] || ESTILOS_CALIDAD.MIDIENDO;

  return (
    <div
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border shadow-sm transition-all duration-300 ${estilos.capa}`}
      title="Calidad de tu conexión, medida por latencia (RTT)"
    >
      <span className="flex h-1.5 w-1.5 relative">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${estilos.ping}`}></span>
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${estilos.punto}`}></span>
      </span>
      <span>Red: {calidadConexion}</span>
    </div>
  );
}
