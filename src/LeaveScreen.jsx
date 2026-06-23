// src/screens/LeaveScreen.jsx
import React from "react";

export default function LeaveScreen({ setIsMeetingLeft }) {
  return (
    <div className="p-8 bg-slate-900 text-white rounded-2xl min-h-[550px] flex flex-col items-center justify-center shadow-2xl border border-slate-800 m-4 text-center animate-fade-in flex-1">
      
      {/* Icono decorativo de éxito/salida segura */}
      <div className="flex items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 h-20 w-20 mb-6 shadow-xl">
        <span className="text-3xl">✅</span>
      </div>

      <h1 className="text-2xl font-black text-white tracking-tight">Consulta Finalizada</h1>
      <p className="text-xs text-slate-400 mt-2 max-w-xs">
        La conexión segura con el canal de telemedicina de **VITA** se ha cerrado correctamente de forma segura.
      </p>

      {/* Tarjeta informativa del estado del puente de VideoSDK */}
      <div className="bg-slate-950/60 border border-slate-800 px-6 py-3 rounded-xl mt-6 w-full max-w-xs space-y-1">
        <p className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Estado del Canal</p>
        <p className="text-xs text-slate-300 font-semibold">Sesión destruida con éxito</p>
        <div className="h-1 w-full bg-slate-800 rounded-full mt-2 overflow-hidden">
          <div className="bg-emerald-500 h-full w-full"></div>
        </div>
      </div>

      {/* Botón oficial de Reingreso usando tu prop original */}
      <div className="mt-8">
        <button
          onClick={() => {
            // 🔄 Ejecuta la reactivación nativa para volver a renderizar useMeeting
            setIsMeetingLeft(false);
          }}
          className="bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold px-12 py-3 rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer tracking-wide uppercase"
        >
          Reingresar a la Consulta
        </button>
      </div>

    </div>
  );
}