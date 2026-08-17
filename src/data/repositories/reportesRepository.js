import { supabase } from '../supabaseClient';

export const reportesRepository = {
    async obtenerTodosLosPacientes(medicoId) {
        console.log('Buscando pacientes para médico:', medicoId);
        
        const { data, error } = await supabase
            .from('citas')
            .select('paciente_nombre, fecha, estado, modalidad, nota_medica')
            .eq('medico_id', medicoId);
        
        if (error) {
            console.error('Error en obtenerTodosLosPacientes:', error);
            throw error;
        }
        
        console.log('Datos obtenidos:', data?.length || 0, 'registros');
        return { data, error };
    },

    async obtenerNotasPaciente(pacienteNombre, medicoId) {
        console.log('Buscando notas para:', pacienteNombre, 'médico:', medicoId);
        
        const { data, error } = await supabase
            .from('citas')
            .select(`
                id,
                fecha,
                hora,
                tipo_consulta,
                modalidad,
                estado,
                nota_medica,
                diagnostico,
                tratamiento,
                duracion_llamada_segundos,
                meeting_id,
                created_at,
                paciente_nombre,
                paciente_edad
            `)
            .eq('medico_id', medicoId)
            .eq('paciente_nombre', pacienteNombre)
            .order('fecha', { ascending: false });
        
        if (error) {
            console.error('Error en obtenerNotasPaciente:', error);
            throw error;
        }
        
        console.log('Notas encontradas:', data?.length || 0);
        return { data, error };
    },

    async obtenerMetricasMensuales(medicoId, limite = 12) {
        const { data, error } = await supabase
            .from('metricas_mensuales')
            .select('*')
            .eq('medico_id', medicoId)
            .order('mes', { ascending: false })
            .limit(limite);
        
        if (error) console.error('Error en obtenerMetricasMensuales:', error);
        return { data, error };
    },

    async obtenerResumenMesActual(medicoId) {
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);
        
        const finMes = new Date();
        finMes.setMonth(finMes.getMonth() + 1);
        finMes.setDate(0);
        finMes.setHours(23, 59, 59, 999);

        const { data, error } = await supabase
            .from('citas')
            .select('estado, modalidad, duracion_llamada_segundos')
            .eq('medico_id', medicoId)
            .gte('fecha', inicioMes.toISOString().split('T')[0])
            .lte('fecha', finMes.toISOString().split('T')[0]);
        
        if (error) console.error('Error en obtenerResumenMesActual:', error);
        return { data, error };
    },

    async guardarEstadisticasLlamada(estadisticas) {
        const { data, error } = await supabase
            .from('estadisticas_llamadas')
            .insert([estadisticas]);
        
        if (error) console.error('Error en guardarEstadisticasLlamada:', error);
        return { data, error };
    },

    async obtenerTodasLasCitas(medicoId) {
        try {
            const { data, error } = await supabase
                .from('citas')
                .select('*')
                .eq('medico_id', medicoId);
            
            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error en obtenerTodasLasCitas:', error);
            return { data: null, error };
        }
    },

    async obtenerCitasPorRango(medicoId, fechaInicio, fechaFin) {
        try {
            const { data, error } = await supabase
                .from('citas')
                .select('*')
                .eq('medico_id', medicoId)
                .gte('fecha', fechaInicio)
                .lte('fecha', fechaFin)
                .order('fecha', { ascending: false });

            if (error) throw error;
            return { data, error: null };
        } catch (error) {
            console.error('Error en obtenerCitasPorRango:', error);
            return { data: null, error };
        }
    }
};