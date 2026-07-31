import { reportesRepository } from '../../data/repositories/reportesRepository';

export const reportesService = {
    async obtenerListaPacientes(medicoId) {
        if (!medicoId) {
            console.error('ID del médico es requerido');
            return [];
        }

        try {
            const { data: citas, error } = await reportesRepository.obtenerTodosLosPacientes(medicoId);
            
            if (error) {
                console.error('Error en obtenerListaPacientes:', error);
                return [];
            }

            if (!citas || citas.length === 0) {
                console.log('No hay citas para este médico');
                return [];
            }

            const pacientesMap = new Map();
            citas.forEach(cita => {
                const nombre = cita.paciente_nombre;
                if (!pacientesMap.has(nombre)) {
                    pacientesMap.set(nombre, {
                        nombre: nombre,
                        total_consultas: 0,
                        ultima_consulta: cita.fecha,
                        tiene_nota: false,
                        completadas: 0,
                        pendientes: 0
                    });
                }
                const paciente = pacientesMap.get(nombre);
                paciente.total_consultas += 1;
                if (cita.fecha > paciente.ultima_consulta) {
                    paciente.ultima_consulta = cita.fecha;
                }
                if (cita.nota_medica) {
                    paciente.tiene_nota = true;
                }
                if (cita.estado === 'Completada') {
                    paciente.completadas += 1;
                } else if (cita.estado === 'Pendiente') {
                    paciente.pendientes += 1;
                }
            });

            const resultado = Array.from(pacientesMap.values())
                .sort((a, b) => new Date(b.ultima_consulta) - new Date(a.ultima_consulta));

            console.log('Pacientes encontrados:', resultado.length);
            return resultado;
        } catch (error) {
            console.error('Error en obtenerListaPacientes:', error);
            return [];
        }
    },

    async obtenerReportePaciente(pacienteNombre, medicoId) {
        if (!pacienteNombre || !medicoId) {
            console.error('Nombre del paciente y ID del médico son requeridos');
            return null;
        }

        try {
            const { data: notas, error } = await reportesRepository.obtenerNotasPaciente(
                pacienteNombre,
                medicoId
            );

            if (error) {
                console.error('Error en obtenerReportePaciente:', error);
                return null;
            }

            if (!notas || notas.length === 0) {
                console.log('No hay notas para este paciente');
                return {
                    total_consultas: 0,
                    consultas_completadas: 0,
                    consultas_virtuales: 0,
                    consultas_presenciales: 0,
                    diagnostico_mas_comun: null,
                    promedio_duracion: 0,
                    ultima_consulta: null,
                    notas: []
                };
            }

            const stats = {
                total_consultas: notas.length,
                consultas_completadas: notas.filter(n => n.estado === 'Completada').length,
                consultas_virtuales: notas.filter(n => n.modalidad === 'Virtual').length,
                consultas_presenciales: notas.filter(n => n.modalidad === 'Presencial').length,
                diagnostico_mas_comun: this._obtenerDiagnosticoMasComun(notas),
                promedio_duracion: this._calcularPromedioDuracion(notas),
                ultima_consulta: notas.length > 0 ? notas[0] : null,
                notas: notas
            };

            return stats;
        } catch (error) {
            console.error('Error en obtenerReportePaciente:', error);
            return null;
        }
    },

    async obtenerMetricasMensuales(medicoId) {
        if (!medicoId) return [];

        try {
            const { data: metricas, error } = await reportesRepository.obtenerMetricasMensuales(medicoId);
            if (error) return [];

            const metrics = metricas.map(m => ({
                ...m,
                tasa_completadas: m.total_citas > 0 
                    ? Math.round((m.citas_completadas / m.total_citas) * 100) 
                    : 0,
                tasa_virtuales: m.total_citas > 0 
                    ? Math.round((m.citas_virtuales / m.total_citas) * 100) 
                    : 0,
                mes_nombre: new Date(m.mes).toLocaleString('es-ES', { month: 'long', year: 'numeric' })
            }));

            return metrics;
        } catch (error) {
            console.error('Error en obtenerMetricasMensuales:', error);
            return [];
        }
    },

    async obtenerResumenMensual(medicoId) {
        if (!medicoId) return null;

        try {
            const { data: citas, error } = await reportesRepository.obtenerResumenMesActual(medicoId);
            if (error) return null;

            const total = citas.length;
            const completadas = citas.filter(c => c.estado === 'Completada').length;
            const canceladas = citas.filter(c => c.estado === 'Cancelada').length;
            const pendientes = citas.filter(c => c.estado === 'Pendiente').length;
            const virtuales = citas.filter(c => c.modalidad === 'Virtual').length;
            const presenciales = citas.filter(c => c.modalidad === 'Presencial').length;

            const duraciones = citas
                .filter(c => c.duracion_llamada_segundos)
                .map(c => c.duracion_llamada_segundos);
            const duracionPromedio = duraciones.length > 0 
                ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length / 60)
                : 0;

            return {
                mes: new Date().toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
                total_citas: total,
                completadas,
                canceladas,
                pendientes,
                virtuales,
                presenciales,
                tasa_completadas: total > 0 ? Math.round((completadas / total) * 100) : 0,
                duracion_promedio_minutos: duracionPromedio,
                citas_por_estado: { completadas, canceladas, pendientes },
                citas_por_modalidad: { virtuales, presenciales }
            };
        } catch (error) {
            console.error('Error en obtenerResumenMensual:', error);
            return null;
        }
    },

    async guardarEstadisticasLlamada(estadisticas) {
        try {
            const { data, error } = await reportesRepository.guardarEstadisticasLlamada(estadisticas);
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error en guardarEstadisticasLlamada:', error);
            throw error;
        }
    },

    _obtenerDiagnosticoMasComun(notas) {
        const diagnosticos = notas
            .filter(n => n.diagnostico)
            .map(n => n.diagnostico);
        
        if (diagnosticos.length === 0) return null;

        const frecuencia = {};
        diagnosticos.forEach(d => {
            frecuencia[d] = (frecuencia[d] || 0) + 1;
        });

        return Object.entries(frecuencia)
            .sort((a, b) => b[1] - a[1])[0][0];
    },

    _calcularPromedioDuracion(notas) {
        const duraciones = notas
            .filter(n => n.duracion_llamada_segundos)
            .map(n => n.duracion_llamada_segundos);
        
        if (duraciones.length === 0) return 0;
        return Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length / 60);
    }
};