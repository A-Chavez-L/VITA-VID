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
    Loader2,
    TrendingUp,
    Calendar
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
            
            console.log('Métricas mensuales:', metricasData);
            console.log('Resumen del mes:', resumenData);
            
            setMetricas(metricasData || []);
            setResumen(resumenData);
            
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            lanzarAlerta(error.message || 'Error cargando estadísticas', 'error');
        } finally {
            setCargando(false);
        }
    };

    const generarPDF = () => {
        if (!resumen && metricas.length === 0) {
            lanzarAlerta('No hay datos para generar el reporte', 'warning');
            return null;
        }

        try {
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pintarDisenoInstitucional = (pdf) => {
                const paginaAlto = pdf.internal.pageSize.height;

                pdf.setFillColor(30, 41, 59);
                pdf.rect(0, 0, 297, 25, 'F');
                
                pdf.setFillColor(15, 23, 42);
                pdf.lines([[60, 0], [60, 20], [0, 20]], 230, 0, [1, 1], 'F');

                pdf.setFillColor(2, 132, 199);
                pdf.lines([[-110, 12], [0, 12]], 297, 0, [1, 1], 'F');

                pdf.setFillColor(132, 204, 22);
                pdf.lines([[50, 0], [40, 6]], 0, 19, [1, 1], 'F');

                pdf.setTextColor(255, 255, 255);
                pdf.setFont('helvetica', 'bold');
                pdf.setFontSize(14);
                pdf.text('HOSPITAL SAN GABRIEL', 15, 11);
                
                pdf.setFont('helvetica', 'normal');
                pdf.setFontSize(9);
                pdf.text('Departamento de Analítica Médica y Control de Gestión', 15, 17);

                pdf.setFontSize(8);
                pdf.text('SISTEMA CLÍNICO GABRIEL v2.0', 230, 9);

                pdf.setFillColor(30, 41, 59);
                pdf.rect(0, paginaAlto - 12, 297, 12, 'F');

                pdf.setFillColor(14, 165, 233);
                pdf.lines([[45, -8], [120, -8], [120, 0]], 45, paginaAlto, [1, 1], 'F');

                pdf.setFillColor(15, 23, 42);
                pdf.lines([[-35, -12], [-80, -12]], 297, paginaAlto, [1, 1], 'F');

                pdf.setTextColor(255, 255, 255);
                pdf.setFontSize(7);
                pdf.setFont('helvetica', 'normal');
                pdf.text('CONFIDENCIALIDAD: Este reporte contiene datos estadísticos de gestión médica. Uso exclusivo interno.', 15, paginaAlto - 5);
            };

            pintarDisenoInstitucional(doc);

            doc.setTextColor(51, 65, 85);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('REPORTE ESTADÍSTICO MENSUAL', 15, 38);

            doc.setDrawColor(226, 232, 240);
            doc.setLineWidth(0.5);
            doc.line(15, 42, 15, 56);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`Médico: ${medico.nombre_completo || 'No especificado'}`, 19, 46);
            doc.text(`Especialidad: ${medico.especialidad || 'No especificada'}`, 19, 52);
            doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-ES')}`, 19, 58);

            if (resumen) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(11);
                doc.text(`Resumen - ${resumen.mes}`, 15, 70);

                const filasResumen = [
                    ['Total de Citas', resumen.total_citas || 0],
                    ['Citas Completadas', resumen.completadas || 0],
                    ['Citas Canceladas', resumen.canceladas || 0],
                    ['Citas Pendientes', resumen.pendientes || 0],
                    ['Consultas Virtuales', resumen.virtuales || 0],
                    ['Consultas Presenciales', resumen.presenciales || 0],
                    ['Tasa de Completación', `${resumen.tasa_completadas || 0}%`],
                    ['Promedio de Citas por Día', resumen.promedio_citas_por_dia || 0],
                    ['Duración Promedio', `${resumen.duracion_promedio_minutos || 0} min`]
                ];

                autoTable(doc, {
                    startY: 75,
                    head: [['Indicador', 'Valor']],
                    body: filasResumen,
                    theme: 'striped',
                    headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
                    styles: { font: 'helvetica', fontSize: 9, cellPadding: 3 },
                    margin: { left: 15, right: 15, top: 20, bottom: 20 }
                });

                const siguienteY = doc.lastAutoTable.finalY + 10;
                
                if (metricas.length > 0) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(11);
                    doc.text('Evolución Mensual (Últimos 12 meses)', 15, siguienteY);

                    const cabecera = ['Mes', 'Total', 'Completadas', 'Canceladas', 'Pendientes', 'Virtuales', 'Presenciales', 'Tasa %'];
                    const filas = metricas.map(m => [
                        m.mes_nombre || m.mes || 'N/A',
                        m.total_citas || 0,
                        m.citas_completadas || 0,
                        m.citas_canceladas || 0,
                        m.citas_pendientes || 0,
                        m.citas_virtuales || 0,
                        m.citas_presenciales || 0,
                        `${m.tasa_completadas || 0}%`
                    ]);

                    autoTable(doc, {
                        startY: siguienteY + 5,
                        head: [cabecera],
                        body: filas,
                        theme: 'grid',
                        headStyles: { fillColor: [2, 132, 199], fontStyle: 'bold' },
                        styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 2 },
                        columnStyles: {
                            0: { cellWidth: 30 },
                            1: { cellWidth: 18 },
                            2: { cellWidth: 22 },
                            3: { cellWidth: 20 },
                            4: { cellWidth: 20 },
                            5: { cellWidth: 20 },
                            6: { cellWidth: 22 },
                            7: { cellWidth: 20 }
                        },
                        margin: { left: 15, right: 15, top: 20, bottom: 20 },
                        didDrawPage: (data) => {
                            if (data.pageNumber > 1) pintarDisenoInstitucional(doc);
                        }
                    });
                }
            }

            return doc;
        } catch (error) {
            console.error('Error generando PDF:', error);
            lanzarAlerta('Error al generar el PDF', 'error');
            return null;
        }
    };

    const imprimirReporte = () => {
        try {
            const doc = generarPDF();
            if (!doc) return;

            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            
            const ventanaImpresion = window.open(pdfUrl, '_blank', 'width=900,height=700');
            
            if (ventanaImpresion) {
                ventanaImpresion.onload = () => {
                    setTimeout(() => {
                        ventanaImpresion.print();
                        setTimeout(() => {
                            URL.revokeObjectURL(pdfUrl);
                        }, 1000);
                    }, 500);
                };
                lanzarAlerta('Reporte abierto para impresión', 'success');
            } else {
                const nombreArchivo = `Reporte_Estadisticas_${new Date().toISOString().split('T')[0]}.pdf`;
                doc.save(nombreArchivo);
                lanzarAlerta('Reporte descargado - Abre el PDF para imprimir', 'info');
            }
        } catch (error) {
            console.error('Error al imprimir reporte:', error);
            lanzarAlerta('Error al generar el reporte para impresión', 'error');
        }
    };

    const descargarReporte = () => {
        try {
            const doc = generarPDF();
            if (!doc) return;

            const nombreArchivo = `Reporte_Estadisticas_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nombreArchivo);
            lanzarAlerta('Reporte estadístico descargado correctamente', 'success');
        } catch (error) {
            console.error('Error al descargar reporte:', error);
            lanzarAlerta('Error al descargar el reporte', 'error');
        }
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
        <div className="space-y-6 p-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <BarChart3 className="w-6 h-6 text-sky-500" />
                        Estadísticas Mensuales
                    </h2>
                    <p className="text-sm text-slate-500">
                        Médico: <span className="font-bold">{medico.nombre_completo || 'No especificado'}</span>
                        {medico.especialidad && ` • ${medico.especialidad}`}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={imprimirReporte}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition"
                    >
                        <Printer className="w-4 h-4" />
                        Imprimir
                    </button>
                    <button
                        onClick={descargarReporte}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold rounded-xl transition"
                    >
                        <Download className="w-4 h-4" />
                        Descargar PDF
                    </button>
                </div>
            </div>

            {/* Resumen del Mes Actual - MÁS GRANDE */}
            {resumen && (
                <div className="bg-gradient-to-r from-sky-600 to-sky-700 rounded-2xl p-8 text-white shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <p className="text-sm font-medium opacity-90 flex items-center gap-2">
                                <Calendar className="w-5 h-5" />
                                Resumen del Mes Actual
                            </p>
                            <p className="text-3xl font-black capitalize mt-1">
                                {resumen.mes || 'Mes actual'}
                            </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-3 text-center border border-white/10">
                            <p className="text-xs font-bold uppercase opacity-80">Tasa de Completación</p>
                            <p className="text-4xl font-black">{resumen.tasa_completadas || 0}%</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/5">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5 opacity-80" />
                                <p className="text-xs font-medium opacity-80">Total Citas</p>
                            </div>
                            <p className="text-3xl font-bold mt-1">{resumen.total_citas || 0}</p>
                        </div>
                        <div className="bg-emerald-500/20 backdrop-blur-sm rounded-xl p-4 border border-emerald-400/20">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-300" />
                                <p className="text-xs font-medium opacity-80">Completadas</p>
                            </div>
                            <p className="text-3xl font-bold mt-1">{resumen.completadas || 0}</p>
                        </div>
                        <div className="bg-rose-500/20 backdrop-blur-sm rounded-xl p-4 border border-rose-400/20">
                            <div className="flex items-center gap-2">
                                <XCircle className="w-5 h-5 text-rose-300" />
                                <p className="text-xs font-medium opacity-80">Canceladas</p>
                            </div>
                            <p className="text-3xl font-bold mt-1">{resumen.canceladas || 0}</p>
                        </div>
                        <div className="bg-amber-500/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/20">
                            <div className="flex items-center gap-2">
                                <Clock className="w-5 h-5 text-amber-300" />
                                <p className="text-xs font-medium opacity-80">Duración Prom.</p>
                            </div>
                            <p className="text-3xl font-bold mt-1">{resumen.duracion_promedio_minutos || 0} min</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-purple-500/20 backdrop-blur-sm rounded-xl p-4 border border-purple-400/20">
                            <div className="flex items-center gap-2">
                                <Video className="w-5 h-5 text-purple-300" />
                                <p className="text-xs font-medium opacity-80">Virtuales</p>
                            </div>
                            <p className="text-2xl font-bold mt-1">{resumen.virtuales || 0}</p>
                        </div>
                        <div className="bg-orange-500/20 backdrop-blur-sm rounded-xl p-4 border border-orange-400/20">
                            <div className="flex items-center gap-2">
                                <Phone className="w-5 h-5 text-orange-300" />
                                <p className="text-xs font-medium opacity-80">Presenciales</p>
                            </div>
                            <p className="text-2xl font-bold mt-1">{resumen.presenciales || 0}</p>
                        </div>
                    </div>

                    <div className="mt-4 text-sm opacity-90 bg-white/5 rounded-lg p-3 border border-white/5">
                        <span className="font-medium">📊 Pendientes:</span> {resumen.pendientes || 0} citas
                        <span className="ml-4 font-medium">📊 Promedio por día:</span> {resumen.promedio_citas_por_dia || 0}
                    </div>
                </div>
            )}

            {/* Tabla de Evolución Mensual */}
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
                <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-sky-500" />
                    Evolución Mensual (Últimos 12 meses)
                </h3>

                {metricas.length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                        No hay datos históricos disponibles
                    </p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b-2 border-slate-200">
                                    <th className="text-left py-3 px-4 font-semibold text-slate-600">Mes</th>
                                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Total</th>
                                    <th className="text-center py-3 px-4 font-semibold text-emerald-600">Completadas</th>
                                    <th className="text-center py-3 px-4 font-semibold text-rose-600">Canceladas</th>
                                    <th className="text-center py-3 px-4 font-semibold text-amber-600">Pendientes</th>
                                    <th className="text-center py-3 px-4 font-semibold text-purple-600">Virtuales</th>
                                    <th className="text-center py-3 px-4 font-semibold text-orange-600">Presenciales</th>
                                    <th className="text-center py-3 px-4 font-semibold text-slate-600">Tasa %</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metricas.map((m, index) => {
                                    const esMesActual = resumen && m.mes_nombre?.toLowerCase() === resumen.mes?.toLowerCase();
                                    return (
                                        <tr key={index} className={`border-b border-slate-50 hover:bg-slate-50/50 transition ${esMesActual ? 'bg-sky-50/70' : ''}`}>
                                            <td className="py-3 px-4 font-medium text-slate-700 capitalize">
                                                {m.mes_nombre || m.mes || 'N/A'}
                                                {esMesActual && (
                                                    <span className="ml-2 text-xs bg-sky-200 text-sky-700 px-2 py-0.5 rounded-full font-bold">
                                                        Actual
                                                    </span>
                                                )}
                                            </td>
                                            <td className="text-center py-3 px-4 font-bold text-slate-800">{m.total_citas || 0}</td>
                                            <td className="text-center py-3 px-4 text-emerald-600 font-medium">{m.citas_completadas || 0}</td>
                                            <td className="text-center py-3 px-4 text-rose-600">{m.citas_canceladas || 0}</td>
                                            <td className="text-center py-3 px-4 text-amber-600">{m.citas_pendientes || 0}</td>
                                            <td className="text-center py-3 px-4 text-purple-600">{m.citas_virtuales || 0}</td>
                                            <td className="text-center py-3 px-4 text-orange-600">{m.citas_presenciales || 0}</td>
                                            <td className="text-center py-3 px-4 font-bold">
                                                <span className={`px-2 py-1 rounded-full text-xs ${
                                                    m.tasa_completadas >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                    m.tasa_completadas >= 50 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-rose-100 text-rose-700'
                                                }`}>
                                                    {m.tasa_completadas || 0}%
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}