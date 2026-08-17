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
            // Obtener todas las citas del médico
            const { data: citas, error } = await reportesRepository.obtenerTodasLasCitas(medicoId);
            if (error || !citas) return [];

            // Agrupar por mes
            const meses = {};
            const ahora = new Date();
            
            // Generar los últimos 12 meses fijos
            for (let i = 0; i < 12; i++) {
                const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
                const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                const nombreMes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
                meses[key] = {
                    mes: key,
                    mes_nombre: nombreMes.charAt(0).toUpperCase() + nombreMes.slice(1),
                    total_citas: 0,
                    citas_completadas: 0,
                    citas_virtuales: 0,
                    citas_presenciales: 0,
                    citas_canceladas: 0,
                    citas_pendientes: 0,
                    mes_orden: fecha.getTime()
                };
            }

            // Procesar las citas - CONTEO EXPLÍCITO
            citas.forEach(cita => {
                const fecha = new Date(cita.fecha + 'T00:00:00');
                const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
                
                if (meses[key]) {
                    meses[key].total_citas += 1;
                    
                    if (cita.estado === 'Completada') {
                        meses[key].citas_completadas += 1;
                    } else if (cita.estado === 'Cancelada') {
                        meses[key].citas_canceladas += 1;
                    } else if (cita.estado === 'Pendiente') {
                        meses[key].citas_pendientes += 1;
                    }
                    
                    if (cita.modalidad === 'Virtual') {
                        meses[key].citas_virtuales += 1;
                    } else if (cita.modalidad === 'Presencial') {
                        meses[key].citas_presenciales += 1;
                    }
                }
            });

            // Calcular tasa de completación (misma fórmula que el dashboard)
            const resultado = Object.values(meses).map(m => {
                // Para la tasa: (completadas / totales no canceladas) * 100
                const totalValidas = m.total_citas - m.citas_canceladas;
                const tasa = totalValidas > 0 
                    ? Math.round((m.citas_completadas / totalValidas) * 100) 
                    : 0;
                
                return {
                    ...m,
                    tasa_completadas: tasa
                };
            });

            // Ordenar por fecha (más reciente primero)
            return resultado.sort((a, b) => b.mes_orden - a.mes_orden);
            
        } catch (error) {
            console.error('Error en obtenerMetricasMensuales:', error);
            return [];
        }
    },

    async obtenerResumenMensual(medicoId) {
        if (!medicoId) return null;

        try {
            // Obtener el mes actual
            const ahora = new Date();
            const año = ahora.getFullYear();
            const mes = ahora.getMonth();
            const primerDia = new Date(año, mes, 1);
            const ultimoDia = new Date(año, mes + 1, 0);

            const { data: citas, error } = await reportesRepository.obtenerCitasPorRango(
                medicoId,
                primerDia.toISOString().split('T')[0],
                ultimoDia.toISOString().split('T')[0]
            );

            if (error) {
                console.error('Error obteniendo citas del mes:', error);
                return null;
            }

            if (!citas || citas.length === 0) {
                return {
                    mes: ahora.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
                    total_citas: 0,
                    completadas: 0,
                    canceladas: 0,
                    pendientes: 0,
                    virtuales: 0,
                    presenciales: 0,
                    tasa_completadas: 0,
                    duracion_promedio_minutos: 0,
                    promedio_citas_por_dia: 0
                };
            }

            // CONTAR EXPLÍCITAMENTE CADA ESTADO
            let total = citas.length;
            let completadas = 0;
            let canceladas = 0;
            let pendientes = 0;
            let virtuales = 0;
            let presenciales = 0;

            citas.forEach(cita => {
                // Contar por estado
                if (cita.estado === 'Completada') completadas++;
                else if (cita.estado === 'Cancelada') canceladas++;
                else if (cita.estado === 'Pendiente') pendientes++;
                
                // Contar por modalidad
                if (cita.modalidad === 'Virtual') virtuales++;
                else if (cita.modalidad === 'Presencial') presenciales++;
            });

            // VERIFICAR CONSISTENCIA
            console.log('=== RESUMEN DEL MES ===');
            console.log('Total citas:', total);
            console.log('Completadas:', completadas);
            console.log('Canceladas:', canceladas);
            console.log('Pendientes:', pendientes);
            console.log('Suma estados:', completadas + canceladas + pendientes);
            console.log('Virtuales:', virtuales);
            console.log('Presenciales:', presenciales);
            console.log('Suma modalidades:', virtuales + presenciales);

            // Misma fórmula que el dashboard para la tasa
            const totalValidas = citas.filter(c => c.estado !== 'Cancelada').length;
            const tasaCompletadas = totalValidas > 0 ? Math.round((completadas / totalValidas) * 100) : 0;

            // Calcular duración promedio
            const duraciones = citas
                .filter(c => c.duracion_llamada_segundos)
                .map(c => c.duracion_llamada_segundos);
            const duracionPromedio = duraciones.length > 0 
                ? Math.round(duraciones.reduce((a, b) => a + b, 0) / duraciones.length / 60)
                : 0;

            // Promedio de citas por día (sobre días del mes)
            const diasEnMes = ultimoDia.getDate();
            const promedioPorDia = diasEnMes > 0 ? Math.round((total / diasEnMes) * 10) / 10 : 0;

            return {
                mes: ahora.toLocaleString('es-ES', { month: 'long', year: 'numeric' }),
                total_citas: total,
                completadas,
                canceladas,
                pendientes,
                virtuales,
                presenciales,
                tasa_completadas: tasaCompletadas,
                duracion_promedio_minutos: duracionPromedio,
                promedio_citas_por_dia: promedioPorDia
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