// src/presentation/screens/LeaveScreen.jsx
import React, { useState } from "react";
import { CheckCircle2, XCircle, Clock, Video, ShieldCheck, NotebookPen } from "lucide-react";

/**
 * Pantalla posterior a la videollamada.
 * Recibe los cuatro callbacks que Dashboard.jsx le pasa:
 *  - onReingresar:     vuelve a montar la videollamada (useMeeting se re-renderiza)
 *  - onCompletar(nota): marca la cita como 'Completada' con la nota clínica opcional
 *  - onCancelar(nota):  marca la cita como 'Cancelada' con el motivo opcional
 *  - onDejarPendiente:  deja la cita 'Pendiente' (ej. consulta interrumpida) y limpia la sesión
 */
export default function LeaveScreen({ onReingresar, onCompletar, onCancelar, onDejarPendiente }) {
  const [notaClinica, setNotaClinica] = useState("");

  // La nota viaja con la resolución; vacía se envía como null
  const obtenerNota = () => notaClinica.trim() || null;

  return (
    <div className="p-8 bg-slate-900 text-white rounded-2xl min-h-[550px] flex flex-col items-center justify-center shadow-2xl border border-slate-800 m-4 text-center animate-fade-in flex-1">

      {/* Icono de salida segura */}
      <div className="flex items-center justify-center rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 h-20 w-20 mb-6 shadow-xl">
        <ShieldCheck className="w-9 h-9 text-emerald-400" />
      </div>

      <h1 className="text-2xl font-black text-white tracking-tight">Consulta Finalizada</h1>
      <p className="text-sm text-slate-400 mt-2 max-w-xs">
        La conexión con el canal de telemedicina de VITA se ha cerrado de forma segura.
      </p>

      {/* Tarjeta informativa del estado del canal de VideoSDK */}
      <div className="bg-slate-950/60 border border-slate-800 px-6 py-3 rounded-xl mt-6 w-full max-w-xs space-y-1">
        <p className="text-[10px] font-black text-slate-500 tracking-wider uppercase">Estado del Canal</p>
        <p className="text-xs text-slate-300 font-semibold inline-flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Sesión cerrada con éxito
        </p>
      </div>

      {/* Resolución de la cita: el médico decide el estado final */}
      <div className="mt-8 w-full max-w-sm space-y-3">

        {/* Nota clínica: resumen e indicaciones de la consulta (opcional) */}
        <div className="text-left space-y-1.5">
          <label htmlFor="nota-clinica" className="text-[10px] font-black text-slate-500 tracking-wider uppercase inline-flex items-center gap-1.5">
            <NotebookPen className="w-3.5 h-3.5 text-sky-400" />
            Nota clínica de la consulta
          </label>
          <textarea
            id="nota-clinica"
            value={notaClinica}
            onChange={(e) => setNotaClinica(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Resumen, diagnóstico e indicaciones para el paciente (opcional)..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 leading-relaxed resize-none focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
          <p className="text-[9px] text-slate-600 text-right">{notaClinica.length}/2000</p>
        </div>

        <p className="text-[10px] font-black text-slate-500 tracking-wider uppercase">¿Cómo deseas registrar esta consulta?</p>

        <button
          onClick={() => onCompletar(obtenerNota())}
          className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-emerald-400"
        >
          <CheckCircle2 className="w-4 h-4" />
          Marcar como Completada
        </button>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={onDejarPendiente}
            className="inline-flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-bold px-4 py-3 rounded-xl transition focus-visible:outline-2 focus-visible:outline-slate-400"
            title="La cita quedará disponible para retomarla después"
          >
            <Clock className="w-3.5 h-3.5" />
            Dejar Pendiente
          </button>
          <button
            onClick={() => onCancelar(obtenerNota())}
            className="inline-flex items-center justify-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-xs font-bold px-4 py-3 rounded-xl transition focus-visible:outline-2 focus-visible:outline-rose-400"
          >
            <XCircle className="w-3.5 h-3.5" />
            Cancelar Cita
          </button>
        </div>

        {/* Reingreso: acción secundaria, separada de la resolución */}
        <button
          onClick={onReingresar}
          className="w-full inline-flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 text-xs font-bold px-6 py-3 rounded-xl border border-transparent hover:border-sky-500/20 transition focus-visible:outline-2 focus-visible:outline-sky-400"
        >
          <Video className="w-4 h-4" />
          Reingresar a la Consulta
        </button>
      </div>

    </div>
  );
}
