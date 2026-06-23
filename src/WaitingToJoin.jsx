// src/screens/WaitingToJoinScreen.jsx
import React from "react";

export default function WaitingToJoinScreen({ nombreSala, onCancel }) {
  return (
    <div className="p-8 bg-slate-900 text-white rounded-2xl min-h-[500px] flex flex-col items-center justify-center shadow-2xl border border-slate-800 m-4 text-center animate-fade-in flex-1">
      
      {/* 🔄 Indicador de ondas de radar médico flotando */}
      <div className="relative flex items-center justify-center h-24 w-24 mb-8">
        <span className="animate-ping absolute inline-flex h-20 w-20 rounded-full bg-sky-500 opacity-20"></span>
        <span className="animate-pulse absolute inline-flex h-16 w-16 rounded-full bg-sky-500/10 border border-sky-400/30"></span>
        <div className="relative flex items-center justify-center rounded-full bg-slate-950 border border-slate-800 h-14 w-14 shadow-2xl">
          <span className="text-2xl animate-spin duration-3000">⏳</span>
        </div>
      </div>

      <h2 className="text-xl font-black text-white tracking-tight">Sala de Espera Virtual</h2>
      <p className="text-xs text-slate-400 mt-2 max-w-sm leading-relaxed">
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
        <div className="w-full bg-slate-800 h-1 rounded-full mt-1 overflow-hidden">
          <div className="bg-sky-500 h-full w-2/3 rounded-full animate-pulse"></div>
        </div>
      </div>

      {/* Botón de salida o cancelación por si el paciente se cansa de esperar */}
      {onCancel && (
        <button
          onClick={onCancel}
          className="mt-8 text-slate-400 hover:text-rose-400 text-xs font-bold px-4 py-2 rounded-lg transition hover:bg-rose-500/5"
        >
          Cancelar Solicitud
        </button>
      )}

    </div>
  );
}