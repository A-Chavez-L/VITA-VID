// src/core/services/citasService.js
import { citasRepository } from '../../data/repositories/citasRepository';

export const citasService = {
  async agendarCitaMedica(medicoId, datosCita) {
    if (!datosCita.paciente_nombre || !datosCita.paciente_edad || !datosCita.fecha || !datosCita.hora) {
      throw new Error("Por favor, completa todos los campos requeridos.");
    }

    const edadNumero = parseInt(datosCita.paciente_edad);
    if (isNaN(edadNumero) || edadNumero < 0 || edadNumero > 120) {
      throw new Error("Por favor, ingresa una edad válida entre 0 y 120 años.");
    }

    const fechaSeleccionada = new Date(datosCita.fecha + 'T00:00:00');
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (fechaSeleccionada < hoy) {
      throw new Error("No puedes agendar citas en fechas pasadas.");
    }

    const horaFormateada = datosCita.hora + ":00";
    const { data: conflicto, error: errorConflicto } = await citasRepository.buscarConflictos(medicoId, datosCita.fecha, horaFormateada);
    
    if (errorConflicto) throw errorConflicto;
    if (conflicto && conflicto.length > 0) {
      throw new Error(`Ya tienes una cita programada a esa hora.`);
    }

    const { error } = await citasRepository.insertarCita({
      medico_id: medicoId,
      paciente_nombre: datosCita.paciente_nombre,
      paciente_edad: edadNumero,
      paciente_genero: datosCita.paciente_genero,
      tipo_consulta: datosCita.tipo_consulta,
      modalidad: datosCita.modalidad,
      fecha: datosCita.fecha,
      hora: horaFormateada,
      estado: 'Pendiente'
    });

    if (error) throw error;
    return true;
  },

  // 🛡️ Nombre unificado para evitar errores de tipo en las pantallas receptoras
  async validarAccesoASala(citaId) {
    if (!citaId) throw new Error("El ID de la cita es requerido.");
    const citaIdTexto = String(citaId).trim(); 
    
    const { data: cita, error } = await citasRepository.obtenerCitaPorId(citaIdTexto);
    if (error) throw error;
    return cita;
  },

  // ✅ Sincronizado para alternar estados de forma opcional (Pendiente o En progreso)
  async asociarMeetingACita(citaId, meetingId, nuevoEstado = null) {
    if (!citaId || !meetingId) throw new Error("Faltan parámetros requeridos.");
    const { data, error } = await citasRepository.actualizarMeetingId(citaId, meetingId, nuevoEstado);
    if (error) throw error;
    return data;
  },

  // 🔄 Cambia el flujo del estado en el cierre de la teleconsulta
  async cambiarEstadoCita(citaId, nuevoEstado) {
    if (!citaId || !nuevoEstado) throw new Error("Faltan parámetros para cambiar el estado.");
    const { data, error } = await citasRepository.actualizarEstadoCita(citaId, nuevoEstado);
    if (error) throw error;
    return data;
  }
};