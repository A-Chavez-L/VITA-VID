// src/presentation/screens/HistorialCitas.jsx
import React, { useState, useEffect } from 'react';
import { supabase } from "../../data/supabaseClient";
import { Search, Check, X, AlertCircle, FileText, Stethoscope, Pill, Edit } from 'lucide-react';
import NotaMedicaModal from '../components/NotaMedicaModal';

export default function HistorialCitas({ medico, lanzarAlerta }) {
  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [filtroModalidad, setFiltroModalidad] = useState('Todas');
  const [filtroEstado, setFiltroEstado] = useState('Todas');
  const [filtroNotas, setFiltroNotas] = useState('Todas'); // 'Todas', 'Con nota', 'Sin nota'
  const [cargando, setCargando] = useState(true);
  const [confirmarCancelacion, setConfirmarCancelacion] = useState({ mostrar: false, citaId: null, pacienteNombre: '' });
  const [notaVisible, setNotaVisible] = useState(null);
  const [notaEditando, setNotaEditando] = useState(null);

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
      lanzarAlerta(nuevoEstado === 'Completada' ? "¡Cita completada con éxito!" : "Cita cancelada correctamente", 'success');
      setCitas(prev => prev.map(c => c.id === citaId ? { ...c, estado: nuevoEstado } : c));
    }
  };

  useEffect(() => {
    cargarTodasLasCitas();
  }, [medico]);

  const esCitaExpirada = (cita) => {
    if (cita.estado !== 'Pendiente' && cita.estado !== 'En progreso') return false;
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaCita = new Date(cita.fecha + 'T00:00:00');
    return fechaCita < hoy;
  };

  const citasFiltradas = citas.filter(cita => {
    const coincideBusqueda = cita.paciente_nombre.toLowerCase().includes(busqueda.toLowerCase());
    const coincideModalidad = filtroModalidad === 'Todas' ? true : cita.modalidad === filtroModalidad;
    const coincideEstado = filtroEstado === 'Todas' ? true : cita.estado === filtroEstado;
    
    let coincideNotas = true;
    if (filtroNotas === 'Con nota') coincideNotas = cita.nota_medica && cita.nota_medica.trim().length > 0;
    if (filtroNotas === 'Sin nota') coincideNotas = !cita.nota_medica || cita.nota_medica.trim().length === 0;
    
    return coincideBusqueda && coincideModalidad && coincideEstado && coincideNotas;
  });

  // Función para abrir el modal de nota
  const abrirNota = (cita) => {
    setNotaVisible(cita);
  };

  // Función para editar nota
  const editarNota = (cita) => {
    setNotaEditando(cita);
  };

  return (
    <div className="p-6 space-y-6 relative">

      {/* Modal de Nota Médica (ver) */}
      {notaVisible && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-md w-full space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Nota Médica</h3>
                  <p className="text-[10px] text-slate-500 font-medium">
                    {notaVisible.paciente_nombre} · {new Date(notaVisible.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setNotaVisible(null)}
                aria-label="Cerrar nota"
                className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Diagnóstico */}
            {notaVisible.diagnostico && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Stethoscope className="w-3.5 h-3.5" />
                  Diagnóstico
                </p>
                <p className="text-sm text-slate-700">{notaVisible.diagnostico}</p>
              </div>
            )}

            {/* Tratamiento */}
            {notaVisible.tratamiento && (
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-3">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                  <Pill className="w-3.5 h-3.5" />
                  Tratamiento / Indicaciones
                </p>
                <p className="text-sm text-slate-700">{notaVisible.tratamiento}</p>
              </div>
            )}

            {/* Nota */}
            <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 max-h-64 overflow-y-auto">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Nota Clínica</p>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{notaVisible.nota_medica}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setNotaEditando(notaVisible);
                  setNotaVisible(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-600 text-xs font-bold rounded-xl transition"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar
              </button>
              <button
                onClick={() => setNotaVisible(null)}
                className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Edición de Nota */}
      {notaEditando && (
        <NotaMedicaModal
          cita={notaEditando}
          onClose={() => setNotaEditando(null)}
          onGuardado={cargarTodasLasCitas}
          lanzarAlerta={lanzarAlerta}
        />
      )}

      {/* Modal para Confirmar Cancelación */}
      {confirmarCancelacion.mostrar && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xl max-w-sm w-full space-y-4 mx-4">
            <h3 className="text-base font-bold text-slate-800">¿Cancelar Cita Médica?</h3>
            <p className="text-sm text-slate-500">¿Estás seguro de que deseas cancelar la cita del paciente <span className="font-semibold text-slate-700">{confirmarCancelacion.pacienteNombre}</span>?</p>
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
          <p className="text-sm text-slate-500 mt-1">Consulta y gestiona el registro completo de tus citas médicas.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            aria-label="Buscar paciente por nombre"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
      </div>

      {/* Tabla Principal */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-3 justify-between">
          <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500 w-fit">
            {['Todas', 'Virtual', 'Presencial'].map((mod) => (
              <button key={mod} onClick={() => setFiltroModalidad(mod)} className={`px-4 py-1.5 rounded-lg transition-all ${filtroModalidad === mod ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-slate-800'}`}>{mod}</button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500">
              {['Todas', 'Pendiente', 'En progreso', 'Completada', 'Cancelada'].map((est) => (
                <button key={est} onClick={() => setFiltroEstado(est)} className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${filtroEstado === est ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-slate-800'}`}>{est}</button>
              ))}
            </div>
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-500">
              {['Todas', 'Con nota', 'Sin nota'].map((nota) => (
                <button key={nota} onClick={() => setFiltroNotas(nota)} className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${filtroNotas === nota ? 'bg-white text-sky-600 shadow-sm' : 'hover:text-slate-800'}`}>{nota}</button>
              ))}
            </div>
          </div>
        </div>

        {cargando ? (
          <p className="text-sm text-slate-500 text-center py-4 animate-pulse">Cargando historial médico...</p>
        ) : citasFiltradas.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">No se encontraron registros de citas con estos filtros.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-bold text-slate-500 uppercase">
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
                {citasFiltradas.map((cita) => {
                  const expirada = esCitaExpirada(cita);
                  const permiteAcciones = cita.estado === 'Pendiente' || cita.estado === 'En progreso';
                  const tieneNota = cita.nota_medica && cita.nota_medica.trim().length > 0;

                  return (
                    <tr key={cita.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 font-medium text-slate-700">{new Date(cita.fecha + 'T00:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                      <td className="py-3 font-semibold text-sky-600">{cita.hora.slice(0, 5)}</td>
                      <td className="py-3 text-sm font-medium text-slate-800">{cita.paciente_nombre} ({cita.paciente_edad} años)</td>
                      <td className="py-3 text-slate-500">{cita.tipo_consulta}</td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${cita.modalidad === 'Virtual' ? 'bg-purple-50 text-purple-600' : 'bg-amber-50 text-amber-600'}`}>{cita.modalidad}</span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            cita.estado === 'Completada' ? 'bg-emerald-50 text-emerald-600' :
                            cita.estado === 'Cancelada' ? 'bg-rose-50 text-rose-600' :
                            cita.estado === 'En progreso' ? 'bg-sky-50 text-sky-600' :
                            'bg-amber-50 text-amber-600'
                          }`}>{cita.estado}</span>
                          {expirada && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100" title="La fecha de la cita ya pasó y no fue cerrada. Márcala como Completada o Cancelada.">
                              <AlertCircle className="w-3 h-3" />
                              Sin cerrar
                            </span>
                          )}
                          {/* Indicador de nota médica */}
                          {tieneNota && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-600 border border-sky-100">
                              <FileText className="w-3 h-3" />
                              Nota
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {permiteAcciones ? (
                            <>
                              <button
                                onClick={() => cambiarEstadoCita(cita.id, 'Completada')}
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all inline-flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" strokeWidth={3} />
                                Completar
                              </button>
                              <button
                                onClick={() => setConfirmarCancelacion({ mostrar: true, citaId: cita.id, pacienteNombre: cita.paciente_nombre })}
                                className="bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all inline-flex items-center gap-1"
                              >
                                <X className="w-3 h-3" strokeWidth={3} />
                                Cancelar
                              </button>
                            </>
                          ) : (
                            <>
                              {tieneNota ? (
                                <button
                                  onClick={() => abrirNota(cita)}
                                  className="inline-flex items-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all"
                                  title="Ver nota médica"
                                >
                                  <FileText className="w-3 h-3" />
                                  Ver nota
                                </button>
                              ) : (
                                <button
                                  onClick={() => editarNota(cita)}
                                  className="inline-flex items-center gap-1 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all"
                                  title="Agregar nota médica"
                                >
                                  <Edit className="w-3 h-3" />
                                  Agregar nota
                                </button>
                              )}
                              {tieneNota && (
                                <button
                                  onClick={() => editarNota(cita)}
                                  className="inline-flex items-center gap-1 bg-amber-50 hover:bg-amber-100 text-amber-600 font-bold px-2.5 py-1 rounded-lg text-[10px] transition-all"
                                  title="Editar nota médica"
                                >
                                  <Edit className="w-3 h-3" />
                                  Editar
                                </button>
                              )}
                            </>
                          )}
                        </div>
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