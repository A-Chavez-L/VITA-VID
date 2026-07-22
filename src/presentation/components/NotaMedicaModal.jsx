// src/presentation/components/NotaMedicaModal.jsx
import React, { useState, useEffect } from 'react';
import { X, Save, FileText, Stethoscope, Pill } from 'lucide-react';
import { citasService } from '../../core/services/citasService';

export default function NotaMedicaModal({ cita, onClose, onGuardado, lanzarAlerta }) {
  const [nota, setNota] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [tratamiento, setTratamiento] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (cita) {
      setNota(cita.nota_medica || '');
      setDiagnostico(cita.diagnostico || '');
      setTratamiento(cita.tratamiento || '');
    }
  }, [cita]);

  const guardarNota = async () => {
    if (!nota.trim()) {
      lanzarAlerta('La nota médica es obligatoria', 'warning');
      return;
    }

    setCargando(true);
    try {
      await citasService.guardarNotaMedica(
        cita.id,
        nota,
        diagnostico || null,
        tratamiento || null
      );
      
      lanzarAlerta('Nota médica guardada exitosamente', 'success');
      if (onGuardado) onGuardado();
      onClose();
    } catch (error) {
      lanzarAlerta(error.message || 'Error al guardar la nota', 'error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto space-y-5 animate-scale-in">

        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Nota Médica</h3>
              <p className="text-[10px] text-slate-500 font-medium">
                {cita?.paciente_nombre} · {cita?.fecha && new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario de Nota */}
        <div className="space-y-4">
          {/* Diagnóstico */}
          <div>
            <label htmlFor="diagnostico" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5" />
              Diagnóstico
            </label>
            <input
              id="diagnostico"
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
              value={diagnostico}
              onChange={(e) => setDiagnostico(e.target.value)}
              placeholder="Ej. Hipertensión arterial"
            />
          </div>

          {/* Tratamiento */}
          <div>
            <label htmlFor="tratamiento" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              Tratamiento / Indicaciones
            </label>
            <input
              id="tratamiento"
              type="text"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
              value={tratamiento}
              onChange={(e) => setTratamiento(e.target.value)}
              placeholder="Ej. Enalapril 10mg cada 24h"
            />
          </div>

          {/* Nota médica */}
          <div>
            <label htmlFor="nota" className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              Nota Médica *
            </label>
            <textarea
              id="nota"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              rows={8}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all resize-none"
              placeholder="Escribe aquí el resumen de la consulta, hallazgos, recomendaciones..."
            />
            <p className="text-[9px] text-slate-400 text-right mt-1">
              {nota.length}/5000 caracteres
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            onClick={guardarNota}
            disabled={cargando || !nota.trim()}
            className="inline-flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition shadow-sm"
          >
            {cargando ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                Guardar Nota
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}