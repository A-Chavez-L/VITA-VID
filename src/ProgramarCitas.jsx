import React, { useState } from 'react';
import { supabase } from './supabaseClient';

export default function ProgramarCitas({ medico, onProfileUpdate }) {
  const estadoInicial = { 
    paciente_nombre: '', 
    paciente_edad: '', 
    paciente_genero: 'Masculino', 
    hora: '', 
    fecha: '', 
    tipo_consulta: 'Consulta General', 
    modalidad: 'Virtual' 
  };

  const [form, setForm] = useState(estadoInicial);

  const registrarCita = async (e) => {
    e.preventDefault();

    if (!medico?.id) {
      alert("Error: No se detectó una sesión de médico válida.");
      return;
    }

    const datosCita = {
      medico_id: medico.id,
      paciente_nombre: form.paciente_nombre,
      paciente_edad: parseInt(form.paciente_edad, 10),
      paciente_genero: form.paciente_genero,
      hora: form.hora, // Ej: "14:30"
      fecha: form.fecha, // Ej: "2026-06-11"
      tipo_consulta: form.tipo_consulta,
      modalidad: form.modalidad,
      estado: 'Pendiente'
    };

    const { error } = await supabase
      .from('citas')
      .insert([datosCita]);

    if (error) {
      alert("Error al guardar la cita: " + error.message);
    } else {
      alert("¡Cita programada con éxito!");
      setForm(estadoInicial);
      if (onProfileUpdate) onProfileUpdate(); 
    }
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Programar Nueva Cita</h2>
        <form onSubmit={registrarCita} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre del Paciente</label>
            <input type="text" required className="w-full p-2 border border-slate-200 rounded-xl focus:outline-sky-500" value={form.paciente_nombre} onChange={e => setForm({...form, paciente_nombre: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Edad</label>
              <input type="number" required className="w-full p-2 border border-slate-200 rounded-xl" value={form.paciente_edad} onChange={e => setForm({...form, paciente_edad: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Género</label>
              <select className="w-full p-2 border border-slate-200 rounded-xl" value={form.paciente_genero} onChange={e => setForm({...form, paciente_genero: e.target.value})}>
                <option>Masculino</option>
                <option>Femenino</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Fecha</label>
              <input type="date" required className="w-full p-2 border border-slate-200 rounded-xl" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Hora</label>
              <input type="time" required className="w-full p-2 border border-slate-200 rounded-xl" value={form.hora} onChange={e => setForm({...form, hora: e.target.value})} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Tipo de Consulta</label>
              <select className="w-full p-2 border border-slate-200 rounded-xl" value={form.tipo_consulta} onChange={e => setForm({...form, tipo_consulta: e.target.value})}>
                <option>Consulta General</option>
                <option>Especialidad</option>
                <option>Seguimiento</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Modalidad</label>
              <select className="w-full p-2 border border-slate-200 rounded-xl" value={form.modalidad} onChange={e => setForm({...form, modalidad: e.target.value})}>
                <option>Virtual</option>
                <option>Presencial</option>
              </select>
            </div>
          </div>

          <button type="submit" className="w-full bg-sky-600 text-white p-3 rounded-xl font-bold hover:bg-sky-700 transition">Agendar Cita</button>
        </form>
      </div>
    </div>
  );
}