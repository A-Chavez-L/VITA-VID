// src/data/repositories/citasRepository.js
import { supabase } from '../supabaseClient'; // Ajusta la ruta si es necesario

export const citasRepository = {
  async buscarConflictos(medicoId, fecha, hora) {
    return await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medicoId)
      .eq('fecha', fecha)
      .eq('hora', hora)
      .not('estado', 'eq', 'Cancelada');
  },

  async insertarCita(datosCita) {
    return await supabase
      .from('citas')
      .insert([datosCita]);
  },

  async obtenerCitaPorId(citaId) {
    return await supabase
      .from('citas')
      .select('*')
      .eq('id', citaId)
      .single();
  },

  // Vincula el meeting_id y opcionalmente cambia el estado (ej: 'En progreso')
  async actualizarMeetingId(citaId, meetingId, nuevoEstado = null) {
    const idLimpio = String(citaId).trim();
    const updateData = { meeting_id: meetingId };
    
    if (nuevoEstado) {
      updateData.estado = nuevoEstado;
    }

    return await supabase
      .from('citas')
      .update(updateData)
      .eq('id', idLimpio)
      .select();
  },

  // Cambia exclusivamente el estado de la cita (Pendiente, En progreso, Completada, Cancelada)
  async actualizarEstadoCita(citaId, nuevoEstado) {
    const idLimpio = String(citaId).trim();
    return await supabase
      .from('citas')
      .update({ estado: nuevoEstado })
      .eq('id', idLimpio)
      .select();
  }
};