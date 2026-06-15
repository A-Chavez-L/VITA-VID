import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function ProgramarCitas({ medico, lanzarAlerta }) {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [tipoConsulta, setTipoConsulta] = useState('Consulta General');
  const [modalidad, setModalidad] = useState('Virtual');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [cargando, setCargando] = useState(false);

  const guardarCita = async (e) => {
    e.preventDefault();
    
    // Validación 1: Campos requeridos
    if (!nombre || !edad || !fecha || !hora) {
      lanzarAlerta("Por favor, completa todos los campos requeridos.", "warning");
      return;
    }

    // Validación 2: Edad válida
    const edadNumero = parseInt(edad);
    if (isNaN(edadNumero) || edadNumero < 0 || edadNumero > 120) {
      lanzarAlerta("Por favor, ingresa una edad válida entre 0 y 120 años.", "warning");
      return;
    }

    // Validación 3: Fecha no puede ser pasada (PERMITIENDO EL DÍA ACTUAL)
    const fechaSeleccionada = new Date(fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    if (fechaSeleccionada < hoy) {
      lanzarAlerta("No puedes agendar citas en fechas pasadas.", "warning");
      return;
    }

    setCargando(true);

    try {
      // Validación 4: Verificar si ya existe una cita pendiente o completada en ese horario
      const { data: conflicto, error: errorConflicto } = await supabase
        .from('citas')
        .select('id, paciente_nombre, estado')
        .eq('medico_id', medico.id)
        .eq('fecha', fecha)
        .eq('hora', hora + ":00")
        .in('estado', ['Pendiente', 'Completada']);

      if (errorConflicto) throw errorConflicto;

      if (conflicto && conflicto.length > 0) {
        const citaExistente = conflicto[0];
        lanzarAlerta(`Horario no disponible. Ya hay una cita ${citaExistente.estado === 'Pendiente' ? 'pendiente' : 'completada'} con ${citaExistente.paciente_nombre} a las ${hora}.`, "warning");
        setCargando(false);
        return;
      }

      // Insertar la cita (sin límite de citas por día)
      const { error } = await supabase
        .from('citas')
        .insert([
          {
            medico_id: medico.id,
            paciente_nombre: nombre,
            paciente_edad: edadNumero,
            paciente_genero: genero,
            tipo_consulta: tipoConsulta,
            modalidad: modalidad,
            fecha: fecha,
            hora: hora + ":00",
            estado: 'Pendiente'
          }
        ]);

      if (error) throw error;

      lanzarAlerta("¡Cita programada con éxito!", "success");
      
      // Limpiar formulario
      setNombre('');
      setEdad('');
      setFecha('');
      setHora('');
      
    } catch (error) {
      lanzarAlerta("Error al agendar: " + error.message, "error");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen flex justify-center items-start">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-xl w-full space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Agendar Nueva Cita</h1>
          <p className="text-xs text-slate-400 mt-1">Ingresa los datos para registrar un nuevo paciente en la agenda.</p>
        </div>

        <form onSubmit={guardarCita} className="space-y-4 text-xs">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Nombre del Paciente</label>
            <input type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. Nidia Escalante" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Edad</label>
              <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={edad} onChange={(e) => setEdad(e.target.value)} placeholder="Ej. 28" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Género</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={genero} onChange={(e) => setGenero(e.target.value)}>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tipo de Consulta</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)}>
                <option value="Consulta General">Consulta General</option>
                <option value="Especialidad">Especialidad</option>
                <option value="Seguimiento">Control/Seguimiento</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Modalidad</label>
              <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
                <option value="Virtual">Virtual</option>
                <option value="Presencial">Presencial</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Fecha</label>
              <input type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Hora</label>
              <input type="time" className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-700 focus:outline-none focus:border-sky-500" value={hora} onChange={(e) => setHora(e.target.value)} />
            </div>
          </div>

          <button type="submit" disabled={cargando} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold py-3 rounded-xl shadow-lg shadow-sky-500/10 transition disabled:opacity-50 text-xs">
            {cargando ? 'Registrando en Agenda...' : 'Agendar Cita Médica'}
          </button>
        </form>
      </div>
    </div>
  );
}