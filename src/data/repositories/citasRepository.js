// src/data/repositories/citasRepository.js
import { supabase } from '../supabaseClient';

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

  async actualizarEstadoCita(citaId, nuevoEstado, notaClinica = null) {
    const idLimpio = String(citaId).trim();
    const updateData = { estado: nuevoEstado };
    
    if (notaClinica) {
      updateData.nota_medica = notaClinica;
      updateData.nota_actualizada_en = new Date().toISOString();
    }

    return await supabase
      .from('citas')
      .update(updateData)
      .eq('id', idLimpio)
      .select();
  },

  // Nuevo método para guardar/actualizar notas médicas
  async guardarNotaMedica(citaId, notaMedica, diagnostico = null, tratamiento = null) {
    const idLimpio = String(citaId).trim();
    const updateData = {
      nota_medica: notaMedica,
      nota_actualizada_en: new Date().toISOString()
    };

    if (diagnostico) {
      updateData.diagnostico = diagnostico;
    }

    if (tratamiento) {
      updateData.tratamiento = tratamiento;
    }

    return await supabase
      .from('citas')
      .update(updateData)
      .eq('id', idLimpio)
      .select();
  },

  // Obtener todas las citas con notas médicas
  async obtenerCitasConNotas(medicoId) {
    return await supabase
      .from('citas')
      .select('*')
      .eq('medico_id', medicoId)
      .not('nota_medica', 'is', null)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: true });
  }
};