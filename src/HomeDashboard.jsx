import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function HomeDashboard({ medico, lanzarAlerta }) {
  const [citasHoy, setCitasHoy] = useState([]);
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [totalCompletadas, setTotalCompletadas] = useState(0);
  const [porcentajeEficiencia, setPorcentajeEficiencia] = useState(0);
  const [cargando, setCargando] = useState(true);
  
  // Únicamente conservamos el estado para el cuadro modal de confirmación
  const [confirmarCancelacion, setConfirmarCancelacion] = useState({ mostrar: false, citaId: null, pacienteNombre: '' });

  const cargarMetricasDashboard = async () => {
    if (!medico?.id) return;
    setCargando(true);
    
    const fechaLocal = new Date();
    const hoyLocal = `${fechaLocal.getFullYear()}-${String(fechaLocal.getMonth() + 1).padStart(2, '0')}-${String(fechaLocal.getDate()).padStart(2, '0')}`;

    const { data: dataHoy, error: errorHoy } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medico.id)
      .eq('fecha', hoyLocal)
      .order('hora', { ascending: true });

    if (!errorHoy && dataHoy) setCitasHoy(dataHoy);

    const { data: todasLasCitas, error: errorTotal } = await supabase
      .from('citas')
      .select('estado')
      .eq('medico_id', medico.id);

    if (!errorTotal && todasLasCitas) {
      const completadas = todasLasCitas.filter(c => c.estado === 'Completada').length;
      const totalValidas = todasLasCitas.filter(c => c.estado !== 'Cancelada').length;
      setTotalCompletadas(completadas);
      setPorcentajeEficiencia(totalValidas > 0 ? Math.round((completadas / totalValidas) * 100) : 0);
    }
    setCargando(false);
  };

  const cambiarEstadoCita = async (citaId, nuevoEstado) => {
    const { error } = await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', citaId);

    if (error) {
      lanzarAlerta("Error al actualizar la cita: " + error.message, 'error');
    } else {
      lanzarAlerta(nuevoEstado === 'Completada' ? "🎉 ¡Cita completada con éxito!" : "❌ Cita cancelada correctamente", 'success');
      cargarMetricasDashboard();
    }
  };

  const esCitaInminente = (horaCita, modalidad, estado) => {
    if (modalidad !== 'Virtual' || estado !== 'Pendiente') return false;

    const ahora = new Date();
    const [horas, minutos] = horaCita.split(':').map(Number);
    
    const momentoCita = new Date();
    momentoCita.setHours(horas, minutos, 0, 0);

    const diferenciaMinutos = (momentoCita - ahora) / (1000 * 60);
    return diferenciaMinutos <= 10 && diferenciaMinutos >= -45;
  };

  useEffect(() => {
    if (!medico?.id) return;
    cargarMetricasDashboard();

    const intervaloTiempo = setInterval(() => {
      setCitasHoy(prev => [...prev]); 
    }, 60000);

    const canalCitas = supabase
      .channel('cambios-dashboard-limpio')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'citas', filter: `medico_id=eq.${medico.id}` }, () => {
        cargarMetricasDashboard();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canalCitas);
      clearInterval(intervaloTiempo);
    };
  }, [medico]);

  const citasFiltradas = citasHoy.filter(cita => filtroModalidad === 'Todas' ? true : cita.modalidad === filtroModalidad);

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6 relative">
      
      {/* 🪟 Modal Integrado para Confirmar Cancelación */}
      {confirmarCancelacion.mostrar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full space-y-4 mx-4">
            <h3 className="text-sm font-bold text-slate-800">¿Cancelar Cita Médica?</h3>
            <p className="text-xs text-slate-400">¿Estás seguro de que deseas cancelar la cita del paciente <span className="font-semibold text-slate-700">{confirmarCancelacion.pacienteNombre}</span>? Esta acción no se puede deshacer.</p>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <button onClick={() => setConfirmarCancelacion({ mostrar: false, citaId: null, pacienteNombre: '' })} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition">Volver</button>
              <button onClick={() => { cambiarEstadoCita(confirmarCancelacion.citaId, 'Cancelada'); setConfirmarCancelacion({ mostrar: false, citaId: null, pacienteNombre: '' }); }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm transition">Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Banner de Bienvenida */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">Bienvenido, {medico?.nombre_completo || 'Médico'} ✨</h1>
        <p className="text-xs text-slate-400 mt-1">Aquí tienes un resumen de tu actividad médica para el día de hoy.</p>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-sky-50 text-sky-600 rounded-xl text-xl">📅</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Citas de Hoy</p>
            <p className="text-2xl font-black text-slate-800">{citasHoy.length}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl text-xl">✅</div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Completadas</p>
            <p className="text-2xl font-black text-slate-800">{totalCompletadas}</p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl text-xl">📈</div>
          <div className="w-full">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tasa de Finalización</p>
            <div className="flex items-center gap-2">
              <p className="text-2xl font-black text-slate-800">{porcentajeEficiencia}%</p>
              <div className="w-full bg-slate-100 rounded-full h-1.5 max-w-[100px]">
                <div className="bg-purple-500 h-1.5 rounded-full transition-all" style={{ width: `${porcentajeEficiencia}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Listado de Citas */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-700 flex items-center gap-2">🕒 Citas del Día</h2>
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-500">
            {['Todas', 'Virtual', 'Presencial'].map((mod) => (
              <button key={mod} onClick={() => setFiltroModalidad(mod)} className={`px-3 py-1.5 rounded-lg transition-all ${filtroModalidad === mod ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-slate-800'}`}>{mod}</button>
            ))}
          </div>
        </div>
        
        {cargando ? (
          <p className="text-xs text-slate-400 text-center py-4">Buscando citas...</p>
        ) : citasFiltradas.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">No hay citas registradas hoy.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] font-bold text-slate-400 uppercase">
                  <th className="pb-2">Hora</th>
                  <th className="pb-2">Paciente</th>
                  <th className="pb-2">Consulta</th>
                  <th className="pb-2">Modalidad</th>
                  <th className="pb-2">Estado</th>
                  <th className="pb-2 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-600 divide-y divide-slate-50">
                {citasFiltradas.map((cita) => {
                  const inminente = esCitaInminente(cita.hora, cita.modalidad, cita.estado);
                  return (
                    <tr key={cita.id} className={`transition-all duration-300 ${inminente ? 'bg-sky-50/70 hover:bg-sky-50 animate-pulse border-l-4 border-sky-500' : 'hover:bg-slate-50/50'}`}>
                      <td className="py-3 px-1 font-semibold text-sky-600">{cita.hora.slice(0, 5)}</td>
                      <td className="py-3 font-medium text-slate-800">
                        {cita.paciente_nombre} ({cita.paciente_edad} años)
                        {inminente && <span className="block text-[9px] font-bold text-sky-600 mt-0.5 tracking-wide">🔵 ¡Hora de conectar!</span>}
                      </td>
                      <td className="py-3 text-slate-500">{cita.tipo_consulta}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cita.modalidad === 'Virtual' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>{cita.modalidad}</span>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cita.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600' : cita.estado === 'Cancelada' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'}`}>{cita.estado}</span>
                      </td>
                      <td className="py-3 text-center">
                        {cita.estado === 'Pendiente' ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => cambiarEstadoCita(cita.id, 'Completada')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] shadow-sm transition">✅ Completar</button>
                            <button onClick={() => setConfirmarCancelacion({ mostrar: true, citaId: cita.id, pacienteNombre: cita.paciente_nombre })} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition">❌ Cancelar</button>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-300 font-medium italic">Sin acciones</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}