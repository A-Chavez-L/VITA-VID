// src/presentation/screens/WaitingToJoinScreen.jsx
import React from "react";
import { LoaderCircle } from "lucide-react";

export default function WaitingToJoinScreen({ nombreSala, onCancel }) {
  return (
    <div className="p-8 bg-slate-900 text-white rounded-2xl min-h-[500px] flex flex-col items-center justify-center shadow-2xl border border-slate-800 m-4 text-center animate-fade-in flex-1">

      {/* Indicador de ondas tipo radar médico */}
      <div className="relative flex items-center justify-center h-24 w-24 mb-8">
        <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-sky-500 opacity-20"></span>
        <span className="animate-pulse absolute inline-flex h-16 w-16 rounded-full bg-sky-500/10 border border-sky-400/30"></span>
        <div className="relative flex items-center justify-center rounded-full bg-slate-950 border border-slate-800 h-14 w-14 shadow-2xl">
          <LoaderCircle className="w-6 h-6 text-sky-400 animate-spin" />
        </div>
      </div>

      <h2 className="text-xl font-black text-white tracking-tight">Sala de Espera Virtual</h2>
      <p className="text-sm text-slate-400 mt-2 max-w-sm leading-relaxed">
        Estamos solicitando acceso al canal de telemedicina seguro de <span className="text-sky-400 font-bold">VITA</span>. Por favor, aguarda un momento en línea.
      </p>

      {/* Tarjeta con los detalles de la interconexión */}
      <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl mt-6 w-full max-w-xs text-left space-y-2">
        <div className="flex justify-between items-center text-[10px] font-black text-slate-500 uppercase tracking-wider">
          <span>Módulo</span>
          <span>Identificador</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-slate-300 font-semibold">Hospital San Gabriel</span>
          <span className="text-sky-400 font-mono font-bold truncate max-w-[100px]" title={nombreSala}>
            {nombreSala || "Enlazando..."}
          </span>
        </div>
        {/* Indicador de actividad indeterminado: no simula un porcentaje que no existe */}
        <div className="flex items-center gap-2 mt-1">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse [animation-delay:150ms]"></span>
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse [animation-delay:300ms]"></span>
          <span className="text-[10px] text-slate-500 font-mono ml-1">Estableciendo conexión...</span>
        </div>
      </div>

      {/* Botón de cancelación (solo se muestra si el contenedor provee el callback) */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-8 text-slate-400 hover:text-rose-400 text-xs font-bold px-4 py-2 rounded-lg transition hover:bg-rose-500/5 focus-visible:outline-2 focus-visible:outline-rose-400"
        >
          Cancelar Solicitud
        </button>
      )}

    </div>
  );
}
