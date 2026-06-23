// src/NetworkStats.jsx
import React, { useEffect, useState, useRef } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";

export default function NetworkStats() {
  const [calidadConexion, setCalidadConexion] = useState("BUENA"); // BUENA, REGULAR, MALA
  const statsIntervalIdRef = useRef(null);

  // 🚀 Obtenemos la información de los participantes locales directamente del core del meeting
  const { localParticipant } = useMeeting();

  const actualizarMetricas = async () => {
    try {
      // Usamos el método nativo del participante local si está disponible en memoria
      if (localParticipant && typeof localParticipant.getVideoStats === 'function') {
        const stats = await localParticipant.getVideoStats();
        
        if (stats && stats.length > 0) {
          const rtt = stats[0]?.rtt; // Latencia de ida y vuelta en milisegundos

          if (rtt === undefined || rtt === null) return;

          if (rtt < 150) {
            setCalidadConexion("BUENA");
          } else if (rtt >= 150 && rtt < 300) {
            setCalidadConexion("REGULAR");
          } else {
            setCalidadConexion("MALA");
          }
        }
      }
    } catch (error) {
      console.warn("Métricas de red no disponibles en este milisegundo:", error);
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

  // Manejo de colores de red con Tailwind CSS
  const obtenerEstilosCapa = () => {
    if (calidadConexion === "BUENA") return "bg-emerald-500 text-emerald-100 border-emerald-400/20";
    if (calidadConexion === "REGULAR") return "bg-amber-500 text-amber-100 border-amber-400/20";
    return "bg-rose-500 text-rose-100 border-rose-400/20";
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wider uppercase border shadow-sm transition-all duration-300 ${obtenerEstilosCapa()}`}>
      <span className="flex h-1.5 w-1.5 relative">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
          calidadConexion === 'BUENA' ? 'bg-emerald-300' : calidadConexion === 'REGULAR' ? 'bg-amber-300' : 'bg-rose-300'
        }`}></span>
        <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
          calidadConexion === 'BUENA' ? 'bg-emerald-200' : calidadConexion === 'REGULAR' ? 'bg-amber-200' : 'bg-rose-200'
        }`}></span>
      </span>
      <span>Red: {calidadConexion}</span>
    </div>
  );
}