// src/presentation/screens/ProgramarCitas.jsx
import React, { useState } from 'react';
import { citasService } from '../../core/services/citasService';
import { CalendarPlus, Loader2 } from 'lucide-react';

// Clase compartida para todos los campos: consistencia visual y de foco en un solo lugar
const CLASE_CAMPO = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all";
const CLASE_LABEL = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

export default function ProgramarCitas({ medico, lanzarAlerta }) {
  const [nombre, setNombre] = useState('');
  const [edad, setEdad] = useState('');
  const [genero, setGenero] = useState('Masculino');
  const [tipoConsulta, setTipoConsulta] = useState('Consulta General');
  const [modalidad, setModalidad] = useState('Virtual');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [cargando, setCargando] = useState(false);

  // Fecha mínima permitida: hoy (evita agendar citas en el pasado)
  const hoyISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  const guardarCita = async (e) => {
    e.preventDefault();
    setCargando(true);

    try {
      await citasService.agendarCitaMedica(medico.id, {
        paciente_nombre: nombre.trim(),
        paciente_edad: edad,
        paciente_genero: genero,
        tipo_consulta: tipoConsulta,
        modalidad,
        fecha,
        hora
      });

      lanzarAlerta("¡Cita programada con éxito!", "success");
      setNombre('');
      setEdad('');
      setFecha('');
      setHora('');
    } catch (error) {
      lanzarAlerta(error.message, "warning");
    } finally {
      setCargando(false);
    }
  };

  return (
    // Wrapper con padding: da aire entre el header y la tarjeta del formulario
    <div className="p-6">
      <form onSubmit={guardarCita} className="space-y-5 max-w-lg mx-auto bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h3 className="text-base font-black text-slate-800 tracking-tight border-b border-slate-100 pb-3 flex items-center gap-2">
          <CalendarPlus className="w-4 h-4 text-sky-500" />
          Programar Nueva Cita
        </h3>

        <div>
          <label htmlFor="paciente-nombre" className={CLASE_LABEL}>Nombre del Paciente</label>
          <input
            id="paciente-nombre"
            type="text"
            required
            className={CLASE_CAMPO}
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej. Juan Pérez"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="paciente-edad" className={CLASE_LABEL}>Edad</label>
            <input
              id="paciente-edad"
              type="number"
              required
              min="0"
              max="120"
              className={CLASE_CAMPO}
              value={edad}
              onChange={(e) => setEdad(e.target.value)}
              placeholder="Ej. 29"
            />
          </div>
          <div>
            <label htmlFor="paciente-genero" className={CLASE_LABEL}>Género</label>
            <select id="paciente-genero" className={CLASE_CAMPO} value={genero} onChange={(e) => setGenero(e.target.value)}>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="tipo-consulta" className={CLASE_LABEL}>Especialidad/Consulta</label>
            <select id="tipo-consulta" className={CLASE_CAMPO} value={tipoConsulta} onChange={(e) => setTipoConsulta(e.target.value)}>
              <option value="Consulta General">Consulta General</option>
              <option value="Pediatría">Pediatría</option>
              <option value="Cardiología">Cardiología</option>
              <option value="Ginecología">Ginecología</option>
              <option value="Dermatología">Dermatología</option>
            </select>
          </div>
          <div>
            <label htmlFor="modalidad" className={CLASE_LABEL}>Modalidad</label>
            <select id="modalidad" className={CLASE_CAMPO} value={modalidad} onChange={(e) => setModalidad(e.target.value)}>
              <option value="Virtual">Virtual</option>
              <option value="Presencial">Presencial</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="cita-fecha" className={CLASE_LABEL}>Fecha</label>
            <input
              id="cita-fecha"
              type="date"
              required
              min={hoyISO}
              className={CLASE_CAMPO}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
          <div>
            <label htmlFor="cita-hora" className={CLASE_LABEL}>Hora</label>
            <input
              id="cita-hora"
              type="time"
              required
              className={CLASE_CAMPO}
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={cargando}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold p-3 rounded-xl transition disabled:bg-sky-300 disabled:cursor-not-allowed text-sm inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-sky-600"
        >
          {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
          {cargando ? 'Guardando Cita...' : 'Confirmar y Programar'}
        </button>
      </form>
    </div>
  );
}
