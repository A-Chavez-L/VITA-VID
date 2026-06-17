import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function HistorialCitas({ medico, lanzarAlerta }) {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [cargando, setCargando] = useState(true);

  const [confirmarCancelacion, setConfirmarCancelacion] = useState({ mostrar: false, citaId: null, pacienteNombre: '' });

  const cargarTodasLasCitas = async () => {
    if (!medico?.id) return;
    setCargando(true);
    const { data, error } = await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medico.id)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: true });

    if (!error && data) setCitas(data);
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
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c));
    }
  };

  useEffect(() => {
    cargarTodasLasCitas();
  }, [medico]);

  const citasFiltradas = citas.filter(cita => {
    const coincideBusqueda = cita.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideModalidad = filtroModalidad === 'Todas' ? true : cita.modalidad === filtroModalidad;
    const coincideEstado = filtroEstado === 'Todas' ? true : cita.estado === filtroEstado;
    return coincideBusqueda && coincideModalidad && coincideEstado;
  });

  return (
    <div className="p-6 bg-slate-50 min-h-screen space-y-6 relative">
      
      {/* 🪟 Modal Integrado para Confirmar Cancelación */}
      {confirmarCancelacion.mostrar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full space-y-4 mx-4">
            <h3 className="text-sm font-bold text-slate-800">¿Cancelar Cita Médica?</h3>
            <p className="text-xs text-slate-400">¿Estás seguro de que deseas cancelar la cita del paciente <span className="font-semibold text-slate-700">{confirmarCancelacion.pacienteNombre}</span>?</p>
            <div className="flex justify-end gap-2 text-xs font-bold pt-2">
              <button onClick={() => setConfirmarCancelacion({ mostrar: false, citaId: null, pacienteNombre: '' })} className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl transition">Volver</button>
              <button onClick={() => { cambiarEstadoCita(confirmarCancelacion.citaId, 'Cancelada'); setConfirmarCancelacion({ mostrar: false, citaId: null, pacienteNombre: '' }); }} className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-sm transition">Sí, Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Encabezado */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Historial del Consultorio</h1>
          <p className="text-xs text-slate-400 mt-1">Consulta y gestiona el registro completo de tus citas médicas.</p>
        </div>
        <div className="relative w-full md:w-64">
          <input type="text" placeholder="🔍 Buscar paciente..." className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-sky-500 transition-all" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        {/* Filtros: Modalidad y Estado */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-500 w-fit">
            {['Todas', 'Virtual', 'Presencial'].map((mod) => (
              <button key={mod} onClick={() => setFiltroModalidad(mod)} className={`px-4 py-1.5 rounded-lg transition-all ${filtroModalidad === mod ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-slate-800'}`}>{mod}</button>
            ))}
          </div>
          
          <div className="flex bg-slate-100 p-1 rounded-xl text-[10px] font-bold text-slate-500 w-fit">
            {['Todas', 'Pendiente', 'Completada', 'Cancelada'].map((est) => (
              <button key={est} onClick={() => setFiltroEstado(est)} className={`px-4 py-1.5 rounded-lg transition-all ${filtroEstado === est ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-slate-800'}`}>{est}</button>
            ))}
          </div>
        </div>

        {cargando ? (
          <p className="text-xs text-slate-400 text-center py-4">Cargando historial médico...</p>
        ) : citasFiltradas.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs">No se encontraron registros de citas con estos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase">
                  <th className="py-3">Fecha</th>
                  <th className="py-3">Hora</th>
                  <th className="py-3">Paciente</th>
                  <th className="py-3">Consulta</th>
                  <th className="py-3">Modalidad</th>
                  <th className="py-3">Estado</th>
                  <th className="py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-600 divide-y divide-slate-50">
                {citasFiltradas.map((cita) => (
                  <tr key={cita.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 font-medium text-slate-700">{new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td className="py-3 font-semibold text-sky-600">{cita.hora.slice(0, 5)}</td>
                    <td className="py-3 font-medium text-slate-800">{cita.paciente_nombre} ({cita.paciente_edad} años)</td>
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
                          <button onClick={() => cambiarEstadoCita(cita.id, 'Completada')} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all">✅ Completar</button>
                          <button onClick={() => setConfirmarCancelacion({ mostrar: true, citaId: cita.id, pacienteNombre: cita.paciente_nombre })} className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all">❌ Cancelar</button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-medium italic">Sin acciones</span>
                      )}
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