// src/core/services/citasService.js
import { citasRepository } from '../../data/repositories/citasRepository';

const LONGITUD_MAXIMA_NOTA = 5000; // Aumentado para notas médicas más detalladas

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

  async validarAccesoASala(citaId) {
    if (!citaId) throw new Error("El ID de la cita es requerido.");
    const citaIdTexto = String(citaId).trim();

    const { data: cita, error } = await citasRepository.obtenerCitaPorId(citaIdTexto);
    if (error) throw error;
    return cita;
  },

  async asociarMeetingACita(citaId, meetingId, nuevoEstado = null) {
    if (!citaId || !meetingId) throw new Error("Faltan parámetros requeridos.");
    const { data, error } = await citasRepository.actualizarMeetingId(citaId, meetingId, nuevoEstado);
    if (error) throw error;
    return data;
  },

  async cambiarEstadoCita(citaId, nuevoEstado, notaClinica = null) {
    if (!citaId || !nuevoEstado) throw new Error("Faltan parámetros para cambiar el estado.");

    let notaLimpia = null;
    if (typeof notaClinica === 'string' && notaClinica.trim().length > 0) {
      notaLimpia = notaClinica.trim();
      if (notaLimpia.length > LONGITUD_MAXIMA_NOTA) {
        throw new Error(`La nota clínica no puede superar los ${LONGITUD_MAXIMA_NOTA} caracteres.`);
      }
    }

    const { data, error } = await citasRepository.actualizarEstadoCita(citaId, nuevoEstado, notaLimpia);
    if (error) throw error;
    return data;
  },

  // Nuevo método para guardar notas médicas
  async guardarNotaMedica(citaId, notaMedica, diagnostico = null, tratamiento = null) {
    if (!citaId) throw new Error("El ID de la cita es requerido.");
    if (!notaMedica || notaMedica.trim().length === 0) {
      throw new Error("La nota médica no puede estar vacía.");
    }

    const notaLimpia = notaMedica.trim();
    if (notaLimpia.length > LONGITUD_MAXIMA_NOTA) {
      throw new Error(`La nota médica no puede superar los ${LONGITUD_MAXIMA_NOTA} caracteres.`);
    }

    const { data, error } = await citasRepository.guardarNotaMedica(
      citaId,
      notaLimpia,
      diagnostico ? diagnostico.trim() : null,
      tratamiento ? tratamiento.trim() : null
    );

    if (error) throw error;
    return data;
  },

  // Obtener todas las citas con notas médicas
  async obtenerCitasConNotas(medicoId) {
    if (!medicoId) throw new Error("El ID del médico es requerido.");
    const { data, error } = await citasRepository.obtenerCitasConNotas(medicoId);
    if (error) throw error;
    return data;
  }
};