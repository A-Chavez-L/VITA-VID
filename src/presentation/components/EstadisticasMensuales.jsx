// src/presentation/components/EstadisticasMensuales.jsx
import React, { useState, useEffect } from 'react';
import { 
    Users,
    Video,
    Phone,
    CheckCircle2,
    XCircle,
    Clock,
    BarChart3,
    Download,
    Printer,
    Award,
    Loader2,
    TrendingUp
} from 'lucide-react';
import { reportesService } from '../../core/services/reportesService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function EstadisticasMensuales({ medico, lanzarAlerta }) {
    const [metricas, setMetricas] = useState([]);
    const [resumen, setResumen] = useState(null);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarEstadisticas();
    }, [medico]);

    const cargarEstadisticas = async () => {
        setCargando(true);
        try {
            const [metricasData, resumenData] = await Promise.all([
                reportesService.obtenerMetricasMensuales(medico.id),
                reportesService.obtenerResumenMensual(medico.id)
            ]);
            setMetricas(metricasData || []);
            setResumen(resumenData);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            lanzarAlerta(error.message || 'Error cargando estadísticas', 'error');
        } finally {
            setCargando(false);
        }
    };

    const imprimirReporte = () => {
        window.print();
    };

    const descargarReporte = () => {
        if (!resumen) {
            lanzarAlerta('No hay datos para descargar', 'warning');
            return;
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        // ==========================================
        // DISEÑO DE MEMBRETE INSTITUCIONAL LÍMPIO
        // ==========================================
        
        // Capa superior base (Gris oscuro / Azul medianoche - Slate 800)
        doc.setFillColor(30, 41, 59);
        doc.rect(0, 0, 210, 30, 'F');
        
        // Franja de acento inferior en el encabezado (Azul rey - Sky 600)
        doc.setFillColor(2, 132, 199);
        doc.rect(0, 30, 210, 2, 'F');

        // Textos del Encabezado
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('HOSPITAL SAN GABRIEL', 15, 13);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('Departamento de Analítica Médica y Control de Gestión', 15, 20);

        // Marca de agua / Versión
        doc.setFontSize(8);
        doc.setTextColor(203, 213, 225);
        doc.text('SISTEMA CLÍNICO GABRIEL v2.0', 155, 13);

        // ==========================================
        // CUERPO DEL DOCUMENTO
        // ==========================================
        doc.setTextColor(30, 41, 59);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('REPORTE ESTADÍSTICO MENSUAL', 15, 45);

        // Bloque de metadatos con línea vertical decorativa
        doc.setDrawColor(2, 132, 199); // Acento Sky-600 en línea vertical
        doc.setLineWidth(0.7);
        doc.line(15, 50, 15, 68);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text(`Médico Tratante: ${medico.nombre_completo || 'Abigail Chavez'}`, 19, 54);
        doc.text(`Especialidad: ${medico.especialidad || 'Ortopedia'}`, 19, 60);
        doc.text(`Período de Análisis: ${resumen.mes.toUpperCase()} / Emisión: ${new Date().toLocaleDateString('es-ES')}`, 19, 66);

        // Tabla 1: Resumen de Rendimiento
        const filasResumen = [
            ['Total de Citas Gestionadas', resumen.total_citas],
            ['Tasa de Efectividad (Completadas)', `${resumen.tasa_completadas}%`],
            ['Citas Finalizadas con Éxito', resumen.completadas],
            ['Citas Canceladas/Inasistencias', resumen.canceladas],
            ['Citas en Estado Pendiente', resumen.pendientes],
            ['Atenciones vía Telemedicina (Virtual)', resumen.virtuales],
            ['Atenciones en Consultorio (Presencial)', resumen.presenciales],
            ['Tiempo Promedio de Consulta', `${resumen.duracion_promedio_minutos} minutos`]
        ];

        autoTable(doc, {
            startY: 75,
            head: [['Indicador Clave de Rendimiento', 'Métrica General']],
            body: filasResumen,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 }
        });

        // Tabla 2: Historial Evolutivo
        const siguienteY = doc.lastAutoTable.finalY + 12;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Evolución Cronológica del Historial', 15, siguienteY);

        const cabeceraMetricas = ['Mes Evaluado', 'Total Citas', '% Completadas', 'Consultas Virtuales', 'Consultas Presenciales'];
        
        const filasMetricas = metricas.map(m => {
            const esMesActual = resumen && m.mes_nombre?.toLowerCase() === resumen.mes?.toLowerCase();
            
            const total = esMesActual ? resumen.total_citas : (m.total_citas ?? m.total ?? 0);
            const virtuales = esMesActual ? resumen.virtuales : (m.citas_virtuales ?? m.virtuales ?? 0);
            const presenciales = esMesActual ? resumen.presenciales : (m.citas_presenciales ?? m.presenciales ?? (total - virtuales));
            const tasa = esMesActual ? resumen.tasa_completadas : (m.tasa_completadas ?? m.tasa ?? 0);

            return [
                m.mes_nombre || m.mes || 'N/A',
                total,
                `${tasa}%`,
                virtuales,
                presenciales
            ];
        });

        autoTable(doc, {
            startY: siguienteY + 4,
            head: [cabeceraMetricas],
            body: filasMetricas,
            theme: 'grid',
            headStyles: { fillColor: [2, 132, 199], fontStyle: 'bold' },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
            margin: { left: 15, right: 15 }
        });

        // ==========================================
        // PIE DE PÁGINA INSTITUCIONAL
        // ==========================================
        const paginaAlto = doc.internal.pageSize.height;
        
        // Base inferior fija Slate-800
        doc.setFillColor(30, 41, 59);
        doc.rect(0, paginaAlto - 15, 210, 15, 'F');

        // Franja de acento superior del footer Sky-600
        doc.setFillColor(2, 132, 199);
        doc.rect(0, paginaAlto - 15, 210, 1, 'F');

        // Texto legal o institucional en el footer
        doc.setTextColor(226, 232, 240);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('Este documento es un reporte automatizado generado por la intranet del Hospital San Gabriel. Todos los datos están protegidos.', 15, paginaAlto - 6);

        // Guardado automático
        const nombreArchivo = `Reporte_Estadisticas_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        lanzarAlerta('Reporte en PDF generado correctamente con membrete institucional', 'success');
    };

    if (cargando) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
                <span className="ml-3 text-slate-500">Cargando estadísticas...</span>
            </div>
        );
    }

    return (
        <div className="seccion-reporte-modulo space-y-6 p-6 w-full uniqueness-root-print">
            
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body * {
                        visibility: hidden !important;
                    }
                    .uniqueness-root-print, .uniqueness-root-print * {
                        visibility: visible !important;
                    }
                    .uniqueness-root-print {
                        position: absolute !important;
                        left: 0 !important;
                        top: 0 !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10mm !important;
                    }
                    .print\\:hidden, button {
                        display: none !important;
                        visibility: hidden !important;
                    }
                }
            `}} />

            {/* Cabecera */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:border-b-2 print:border-slate-300 print:mb-6">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 print:text-2xl print:text-sky-600">
                        <BarChart3 className="w-6 h-6 text-sky-500 print:hidden" />
                        HOSPITAL SAN GABRIEL — REPORTE ESTADÍSTICO
                    </h2>
                    <p className="text-sm text-slate-500 print:text-slate-600 print:mt-1">
                        Médico Tratante: <span className="font-bold">{medico.nombre_completo || 'Abigail Chavez'}</span> 
                        <span className="hidden print:inline"> | Especialidad: {medico.especialidad || 'Ortopedia'}</span>
                    </p>
                    <p className="hidden print:block text-xs text-slate-400 mt-0.5">
                        Fecha de emisión: {new Date().toLocaleString('es-ES')}
                    </p>
                </div>
                <div className="flex gap-2 print:hidden">
                    <button
                        onClick={imprimirReporte}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold rounded-xl transition cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                    <button
                        onClick={descargarReporte}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition cursor-pointer"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </button>
                </div>
            </div>

            {/* Fichas de datos / Resumen */}
            {resumen && (
                <div className="bg-gradient-to-r from-sky-500 to-sky-600 rounded-2xl p-6 text-white print:bg-none print:bg-slate-50 print:text-slate-900 print:border print:border-slate-300 print:rounded-xl print:p-5">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-sm font-medium opacity-90 print:text-slate-500">Resumen del Mes Seleccionado</p>
                            <p className="text-2xl font-black capitalize print:text-slate-800">{resumen.mes}</p>
                        </div>
                        <div className="bg-white/20 rounded-xl px-4 py-2 text-center print:bg-white print:border print:border-sky-200">
                            <p className="text-xs font-bold uppercase opacity-80 print:text-slate-500">Tasa de Completación</p>
                            <p className="text-3xl font-black print:text-sky-600">{resumen.tasa_completadas}%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                        <div className="bg-white/10 rounded-xl p-3 print:bg-white print:border print:border-slate-200">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 opacity-80 print:text-slate-400" />
                                <p className="text-xs font-medium opacity-80 print:text-slate-500">Total Citas</p>
                            </div>
                            <p className="text-2xl font-bold print:text-slate-800">{resumen.total_citas}</p>
                        </div>
                        <div className="bg-emerald-500/20 rounded-xl p-3 print:bg-emerald-50 print:border print:border-emerald-200">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-emerald-300 print:text-emerald-600" />
                                <p className="text-xs font-medium opacity-80 print:text-emerald-700">Completadas</p>
                            </div>
                            <p className="text-2xl font-bold print:text-emerald-700">{resumen.completadas}</p>
                        </div>
                        <div className="bg-rose-500/20 rounded-xl p-3 print:bg-rose-50 print:border print:border-rose-200">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-4 h-4 text-rose-300 print:text-rose-600" />
                                <p className="text-xs font-medium opacity-80 print:text-rose-700">Canceladas</p>
                            </div>
                            <p className="text-2xl font-bold print:text-rose-700">{resumen.canceladas}</p>
                        </div>
                        <div className="bg-amber-50/20 rounded-xl p-3 print:bg-amber-50 print:border print:border-amber-200">
                            <div className="flex items-center gap-2">
                                <Clock className="w-4 h-4 text-amber-300 print:text-amber-600" />
                                <p className="text-xs font-medium opacity-80 print:text-amber-700">Duración Prom.</p>
                            </div>
                            <p className="text-2xl font-bold print:text-amber-700">{resumen.duracion_promedio_minutos} min</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4 print:grid-cols-2">
                        <div className="bg-purple-500/20 rounded-xl p-3 print:bg-purple-50 print:border print:border-purple-200">
                            <div className="flex items-center gap-2">
                                <Video className="w-4 h-4 text-purple-300 print:text-purple-600" />
                                <p className="text-xs font-medium opacity-80 print:text-purple-700">Virtuales</p>
                            </div>
                            <p className="text-xl font-bold print:text-purple-700">{resumen.virtuales}</p>
                        </div>
                        <div className="bg-amber-500/20 rounded-xl p-3 print:bg-orange-50 print:border print:border-orange-200">
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-amber-300 print:text-orange-600" />
                                <p className="text-xs font-medium opacity-80 print:text-orange-700">Presenciales</p>
                            </div>
                            <p className="text-xl font-bold print:text-orange-700">{resumen.presenciales}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Historial y Evolución Mensual */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm print:border-slate-300 print:shadow-none print:rounded-xl print:p-5">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 print:text-slate-800 print:text-base print:border-b print:pb-2 print:border-slate-200">
                    <TrendingUp className="w-4 h-4 text-sky-500 print:hidden" />
                    Historial y Evolución Mensual
                </h3>

                {metricas.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                        No hay datos históricos disponibles
                    </p>
                ) : (
                    <div className="space-y-4">
                        {metricas.map((m, index) => {
                            const esMesActual = resumen && m.mes_nombre?.toLowerCase() === resumen.mes?.toLowerCase();

                            const total = esMesActual ? resumen.total_citas : (m.total_citas ?? m.total ?? 0);
                            const virtuales = esMesActual ? resumen.virtuales : (m.citas_virtuales ?? m.virtuales ?? 0);
                            const presenciales = esMesActual ? resumen.presenciales : (m.citas_presenciales ?? m.presenciales ?? (total - virtuales));
                            const tasa = esMesActual ? resumen.tasa_completadas : (m.tasa_completadas ?? m.tasa ?? 0);
                            const completadas = esMesActual ? resumen.completadas : (m.citas_completadas ?? m.completadas ?? 0);

                            return (
                                <div key={index} className="border-b border-slate-50 last:border-0 pb-3 last:pb-0 print:border-slate-200">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-bold text-slate-700 capitalize">{m.mes_nombre || m.mes}</span>
                                        <div className="flex items-center gap-4">
                                            <span className="text-xs text-slate-500 font-medium">{total} citas</span>
                                            <span className={`text-xs font-bold ${tasa >= 70 ? 'text-emerald-600' : 'text-amber-600'}`}>
                                                {tasa}% completadas
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden print:border print:border-slate-300">
                                        <div 
                                            className="bg-sky-500 h-2.5 rounded-full print:bg-sky-600"
                                            style={{ width: `${tasa}%` }}
                                        />
                                    </div>
                                    
                                    <div className="flex gap-4 mt-1.5 text-[11px] text-slate-500 font-medium">
                                        <span>Virtuales: <strong>{virtuales}</strong></span>
                                        <span>Presenciales: <strong>{presenciales}</strong></span>
                                        <span>Completadas: <strong>{completadas}</strong></span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Consejos de Rendimiento */}
            {resumen && resumen.total_citas > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 print:bg-white print:border-slate-300 print:rounded-xl">
                    <div className="flex items-start gap-3">
                        <Award className="w-5 h-5 text-amber-600 mt-0.5 print:hidden" />
                        <div>
                            <p className="text-sm font-bold text-amber-800 print:text-slate-800 print:text-base">Consejos y Conclusiones de Rendimiento</p>
                            <ul className="text-xs text-amber-700 mt-1.5 space-y-1.5 print:text-slate-600 print:list-disc print:pl-4">
                                {resumen.tasa_completadas < 70 && (
                                    <li>• Tu tasa de completación es baja ({resumen.tasa_completadas}%). Considera seguir el seguimiento de citas pendientes.</li>
                                )}
                                {resumen.virtuales > resumen.presenciales && (
                                    <li>• Las consultas virtuales predominan ({Math.round((resumen.virtuales / resumen.total_citas) * 100)}%). Asegúrate de mantener una excelente estabilidad en la plataforma de telemedicina.</li>
                                )}
                                {resumen.duracion_promedio_minutos === 0 && (
                                    <li>• Las consultas cerradas marcan 0 minutos de promedio. Verifica que los tiempos de inicio y fin de consulta se registren correctamente.</li>
                                )}
                                {resumen.tasa_completadas >= 80 && (
                                    <li>• ¡Excelente desempeño! Mantienes una alta eficiencia de completación ({resumen.tasa_completadas}%).</li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}