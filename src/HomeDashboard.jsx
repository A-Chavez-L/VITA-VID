import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function HomeDashboard({ medico }) {
  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);

  const cargarCitasHoy = async () => {
    if (!medico?.id) return;
    setCargando(true);
    
    // Obtener la fecha local exacta en formato YYYY-MM-DD sin desfase UTC
    const fechaLocal = new Date();
    const año = fechaLocal.getFullYear();
    const mes = String(fechaLocal.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaLocal.getDate()).padStart(2, '0');
    const hoyLocal = `${año}-${mes}-${dia}`;

    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medico.id)
      .eq('fecha', hoyLocal)
      .order('hora', { ascending: true });

    if (!error && data) {
      setCitas(data);
    } else if (error) {
      console.error("Error cargando citas:", error.message);
    }
    setCargando(false);
  };

  useEffect(() => {
    if (!medico?.id) return;

    // Carga inicial de datos
    cargarCitasHoy();

    // Suscripción en tiempo real a la tabla de citas
    const canalCitas = supabase
      .channel('cambios-citas-medico')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'citas', filter: `medico_id=eq.${medico.id}` },
        () => {
          cargarCitasHoy(); // Recarga la lista automáticamente ante cualquier inserción o cambio
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(canalCitas);
    };
  }, [medico]);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          Bienvenido, {medico?.nombre_completo || 'Médico'} ✨
        </h1>
        <p className="text-xs text-slate-400 mt-1">Aquí tienes un resumen de tu actividad médica para el día de hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl text-xl">📅</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citas de Hoy</p>
            <p className="text-2xl font-black text-slate-800">{citas.length}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h2 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">🕒 Citas del Día</h2>
        
        {cargando ? (
          <p className="text-xs text-slate-400 text-center py-4">Buscando citas...</p>
        ) : citas.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">
            No tienes citas programadas para el día de hoy.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-2">Hora</th>
                  <th className="py-2">Paciente</th>
                  <th className="py-2">Consulta</th>
                  <th className="py-2">Modalidad</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-600 divide-y divide-slate-50">
                {citas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-slate-50/50">
                    <td className="py-3 font-semibold text-sky-600">{cita.hora.slice(0, 5)}</td>
                    <td className="py-3 font-medium text-slate-800">{cita.paciente_nombre} ({cita.paciente_edad} años)</td>
                    <td className="py-3 text-slate-500">{cita.tipo_consulta}</td>
                    <td className="py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cita.modalidad === 'Virtual' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>
                        {cita.modalidad}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600">
                        {cita.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}