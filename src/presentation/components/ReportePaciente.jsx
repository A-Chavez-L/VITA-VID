import React, { useState, useEffect, useRef } from 'react';
import { 
    FileText, 
    Search, 
    X, 
    Users, 
    ChevronRight, 
    Calendar, 
    Clock, 
    Phone, 
    Video, 
    CheckCircle2, 
    Stethoscope, 
    Pill, 
    Download, 
    Printer 
} from 'lucide-react';
import { reportesService } from '../../core/services/reportesService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ReportePaciente({ medico, onClose, lanzarAlerta }) {
    const [pacientes, setPacientes] = useState([]);
    const [pacientesFiltrados, setPacientesFiltrados] = useState([]);
    const [busqueda, setBusqueda] = useState('');
    const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
    const [reporte, setReporte] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [cargandoLista, setCargandoLista] = useState(true);
    const [mostrarReporte, setMostrarReporte] = useState(false);
    const reporteRef = useRef(null);

    useEffect(() => {
        cargarPacientes();
    }, [medico]);

    const cargarPacientes = async () => {
        setCargandoLista(true);
        try {
            const lista = await reportesService.obtenerListaPacientes(medico.id);
            setPacientes(lista || []);
            setPacientesFiltrados(lista || []);
        } catch (error) {
            console.error('Error cargando pacientes:', error);
            lanzarAlerta('Error al cargar la lista de pacientes', 'error');
        } finally {
            setCargandoLista(false);
        }
    };

    useEffect(() => {
        if (!busqueda.trim()) {
            setPacientesFiltrados(pacientes);
        } else {
            const filtrados = pacientes.filter(p => 
                p.nombre && p.nombre.toLowerCase().includes(busqueda.toLowerCase())
            );
            setPacientesFiltrados(filtrados);
        }
    }, [busqueda, pacientes]);

    const seleccionarPaciente = async (paciente) => {
        if (!paciente || !paciente.nombre) return;
        
        setPacienteSeleccionado(paciente);
        setCargando(true);
        setMostrarReporte(true);
        
        try {
            const stats = await reportesService.obtenerReportePaciente(
                paciente.nombre,
                medico.id
            );
            setReporte(stats);
        } catch (error) {
            console.error('Error cargando reporte:', error);
            lanzarAlerta('Error al cargar el reporte del paciente', 'error');
            setMostrarReporte(false);
        } finally {
            setCargando(false);
        }
    };

    const volverALista = () => {
        setMostrarReporte(false);
        setReporte(null);
        setPacienteSeleccionado(null);
    };

    const imprimirReporte = () => {
        window.print();
    };

    const descargarReporte = () => {
        if (!reporte || !pacienteSeleccionado) {
            lanzarAlerta('No hay datos para descargar', 'warning');
            return;
        }

        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pintarDisenoInstitucional = (pdf) => {
            const paginaAlto = pdf.internal.pageSize.height;

            pdf.setFillColor(30, 41, 59);
            pdf.rect(0, 0, 210, 30, 'F');
            
            pdf.setFillColor(15, 23, 42);
            pdf.lines([[60, 0], [60, 20], [0, 20]], 150, 0, [1, 1], 'F');

            pdf.setFillColor(2, 132, 199);
            pdf.lines([[-110, 12], [0, 12]], 210, 0, [1, 1], 'F');

            pdf.setFillColor(132, 204, 22);
            pdf.lines([[50, 0], [40, 6]], 0, 24, [1, 1], 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFont('helvetica', 'bold');
            pdf.setFontSize(14);
            pdf.text('HOSPITAL SAN GABRIEL', 15, 13);
            
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(9);
            pdf.text('Expediente Clínico Digital e Historial del Paciente', 15, 19);

            pdf.setFontSize(8);
            pdf.text('SISTEMA CLÍNICO GABRIEL v2.0', 155, 11);

            pdf.setFillColor(30, 41, 59);
            pdf.rect(0, paginaAlto - 15, 210, 15, 'F');

            pdf.setFillColor(14, 165, 233); 
            pdf.lines([[45, -8], [120, -8], [120, 0]], 45, paginaAlto, [1, 1], 'F');

            pdf.setFillColor(15, 23, 42);
            pdf.lines([[-35, -12], [-80, -12]], 210, paginaAlto, [1, 1], 'F');

            pdf.setTextColor(255, 255, 255);
            pdf.setFontSize(7.5);
            pdf.setFont('helvetica', 'normal');
            pdf.text('CONFIDENCIALIDAD: Este expediente contiene datos de salud protegidos por secreto profesional. Prohibida su difusión sin autorización.', 15, paginaAlto - 6);
        };

        pintarDisenoInstitucional(doc);

        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('REPORTE Y DATOS DE CONSULTA', 15, 45);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(15, 49, 15, 63);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9.5);
        doc.text(`Paciente: ${pacienteSeleccionado.nombre}`, 19, 53);
        doc.text(`Médico Tratante: ${medico.nombre_completo || 'No especificado'}`, 19, 59);
        doc.text(`Fecha de Emisión: ${new Date().toLocaleString('es-ES')}`, 19, 65);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('Estadísticas Clínicas Generales', 15, 76);

        const filasEstadisticas = [
            ['Total de Consultas Registradas', reporte.total_consultas || 0],
            ['Consultas Completadas exitosamente', reporte.consultas_completadas || 0],
            ['Consultas en Modalidad Virtual', reporte.consultas_virtuales || 0],
            ['Consultas en Modalidad Presencial', reporte.consultas_presenciales || 0],
            ['Duración Promedio por Consulta', `${reporte.promedio_duracion || 0} min`],
            ['Diagnóstico más Recurrente / Común', reporte.diagnostico_mas_comun || 'No especificado']
        ];

        autoTable(doc, {
            startY: 81,
            head: [['Métrica Analizada', 'Valor']],
            body: filasEstadisticas,
            theme: 'striped',
            headStyles: { fillColor: [30, 41, 59], fontStyle: 'bold' },
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 2.5 },
            margin: { left: 15, right: 15, top: 38, bottom: 20 },
            didDrawPage: (data) => {
                if (data.pageNumber > 1) pintarDisenoInstitucional(doc);
            }
        });

        const siguienteY = doc.lastAutoTable.finalY + 12;
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.text('Historial Cronológico de Notas Clínicas', 15, siguienteY);

        const cabeceraNotas = ['Fecha / Hora', 'Tipo / Estado', 'Diagnóstico / Tratamiento / Notas Clínicas'];
        const filasNotas = [];
        
        if (reporte.notas && reporte.notas.length > 0) {
            reporte.notas.forEach((nota) => {
                const fechaStr = nota.fecha ? new Date(nota.fecha + 'T00:00:00').toLocaleDateString('es-ES') : 'S/F';
                const horaStr = nota.hora?.slice(0, 5) || '--:--';
                
                let detallesClinicos = '';
                if (nota.diagnostico) detallesClinicos += `Diagnóstico: ${nota.diagnostico}\n`;
                if (nota.tratamiento) detallesClinicos += `Tratamiento: ${nota.tratamiento}\n`;
                if (nota.nota_medica) detallesClinicos += `Evolución/Nota: ${nota.nota_medica}`;
                
                if (!detallesClinicos.trim()) detallesClinicos = 'Consulta registrada sin anotaciones clínicas adicionales.';

                filasNotas.push([
                    `${fechaStr}\n${horaStr}`,
                    `${nota.tipo_consulta || 'Sin tipo'}\n(${nota.estado || 'Pendiente'})`,
                    detallesClinicos.trim()
                ]);
            });
        } else {
            filasNotas.push(['-', '-', 'No hay notas clínicas registradas para este paciente.']);
        }

        autoTable(doc, {
            startY: siguienteY + 5,
            head: [cabeceraNotas],
            body: filasNotas,
            theme: 'grid',
            headStyles: { fillColor: [2, 132, 199], fontStyle: 'bold' }, 
            styles: { font: 'helvetica', fontSize: 9, cellPadding: 3.5, valign: 'top' },
            columnStyles: {
                0: { cellWidth: 30 }, 
                1: { cellWidth: 35 }, 
                2: { cellWidth: 'auto' } 
            },
            margin: { left: 15, right: 15, top: 38, bottom: 20 },
            didDrawPage: (data) => {
                pintarDisenoInstitucional(doc);
            }
        });

        const nombreArchivo = `Reporte_${pacienteSeleccionado.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nombreArchivo);
        lanzarAlerta('Reporte Clínico en PDF generado correctamente en todas sus páginas', 'success');
    };

    const renderListaPacientes = () => (
        <div className="p-6 print:hidden">
            <div className="mb-6">
                <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar paciente por nombre..."
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
                    />
                </div>
                <p className="text-xs text-slate-400 mt-2">
                    {pacientesFiltrados.length} pacientes encontrados
                </p>
            </div>

            {cargandoLista ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-sky-500 border-t-transparent"></div>
                    <span className="ml-3 text-sm text-slate-500">Cargando pacientes...</span>
                </div>
            ) : pacientesFiltrados.length === 0 ? (
                <div className="text-center py-12">
                    <Users className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No hay pacientes registrados</p>
                    <p className="text-sm text-slate-400">Los pacientes aparecerán aquí después de crear citas</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {pacientesFiltrados.map((paciente, index) => (
                        <button
                            key={index}
                            onClick={() => seleccionarPaciente(paciente)}
                            className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-sky-300 hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 font-bold">
                                    {paciente.nombre?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-slate-800">{paciente.nombre || 'Sin nombre'}</p>
                                    <div className="flex items-center gap-3 text-xs text-slate-500">
                                        <span>{paciente.total_consultas || 0} consultas</span>
                                        <span>•</span>
                                        <span className="flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {paciente.ultima_consulta ? new Date(paciente.ultima_consulta + 'T00:00:00').toLocaleDateString('es-ES') : 'N/A'}
                                        </span>
                                        {paciente.tiene_nota && (
                                            <span className="text-emerald-600 font-medium">✓ Con nota</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-sky-500 transition" />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );

    const renderReporte = () => {
        if (!reporte || !pacienteSeleccionado) return null;

        return (
            <div ref={reporteRef} className="p-6 space-y-6 print:p-0 print:space-y-4 print:w-full">
                <button
                    onClick={volverALista}
                    className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-sky-600 transition print:hidden"
                >
                    &larr; Volver a lista de pacientes
                </button>

                <div className="flex gap-2 justify-end print:hidden">
                    <button
                        onClick={imprimirReporte}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
                    >
                        <Printer className="w-3.5 h-3.5" />
                        Imprimir
                    </button>
                    <button
                        onClick={descargarReporte}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-lg transition"
                    >
                        <Download className="w-3.5 h-3.5" />
                        Descargar Reporte
                    </button>
                </div>

                <div className="bg-gradient-to-r from-sky-50 to-slate-50 rounded-xl p-6 border border-sky-100 print:bg-slate-50 print:border-slate-200 print:rounded-lg">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800">{pacienteSeleccionado.nombre}</h3>
                            <p className="text-sm text-slate-500">
                                Reporte generado: {new Date().toLocaleString('es-ES')}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">
                                Médico: {medico.nombre_completo || 'No especificado'}
                            </p>
                        </div>
                        <div className="bg-white rounded-xl p-4 text-center border border-slate-100 shadow-sm print:border-slate-200 print:rounded-lg print:shadow-none">
                            <p className="text-[10px] text-slate-500 uppercase font-bold">Total Consultas</p>
                            <p className="text-3xl font-black text-sky-600">{reporte.total_consultas || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 print:grid-cols-4">
                    <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100 print:border-slate-200 print:bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <p className="text-[10px] text-emerald-700 font-bold uppercase">Completadas</p>
                        </div>
                        <p className="text-2xl font-black text-emerald-700">{reporte.consultas_completadas || 0}</p>
                    </div>
                    <div className="bg-purple-50 rounded-xl p-4 border border-purple-100 print:border-slate-200 print:bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Video className="w-4 h-4 text-purple-600" />
                            <p className="text-[10px] text-purple-700 font-bold uppercase">Virtuales</p>
                        </div>
                        <p className="text-2xl font-black text-purple-700">{reporte.consultas_virtuales || 0}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-4 border border-amber-100 print:border-slate-200 print:bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Phone className="w-4 h-4 text-amber-600" />
                            <p className="text-[10px] text-amber-700 font-bold uppercase">Presenciales</p>
                        </div>
                        <p className="text-2xl font-black text-amber-700">{reporte.consultas_presenciales || 0}</p>
                    </div>
                    <div className="bg-sky-50 rounded-xl p-4 border border-sky-100 print:border-slate-200 print:bg-white">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-sky-600" />
                            <p className="text-[10px] text-sky-700 font-bold uppercase">Duración Prom.</p>
                        </div>
                        <p className="text-2xl font-black text-sky-600">{reporte.promedio_duracion || 0} min</p>
                    </div>
                </div>

                {reporte.diagnostico_mas_comun && (
                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 print:bg-white print:border-slate-200 print:rounded-lg">
                        <p className="text-[10px] text-slate-500 uppercase font-bold flex items-center gap-1.5">
                            <Stethoscope className="w-3.5 h-3.5" />
                            Diagnóstico más común
                        </p>
                        <p className="text-sm font-bold text-slate-700 mt-1">{reporte.diagnostico_mas_comun}</p>
                    </div>
                )}

                <div>
                    <h4 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2 print:text-slate-800">
                        <FileText className="w-4 h-4" />
                        Historial de Notas Clínicas
                    </h4>
                    <div className="space-y-4 print:space-y-6 print:block">
                        {reporte.notas && reporte.notas.length > 0 ? (
                            reporte.notas.map((nota, index) => (
                                <div key={index} className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition print:border-slate-300 print:shadow-none print:rounded-lg print:p-4 break-inside-avoid mb-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="text-xs font-bold text-slate-500">
                                                {nota.fecha ? new Date(nota.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                                                    day: '2-digit',
                                                    month: 'long',
                                                    year: 'numeric'
                                                }) : 'Fecha no disponible'} - {nota.hora?.slice(0, 5) || '--:--'}
                                            </p>
                                            <p className="text-xs text-slate-500">{nota.tipo_consulta || 'Sin tipo'}</p>
                                        </div>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 print:border-slate-300">
                                            {nota.estado || 'Pendiente'}
                                        </span>
                                    </div>

                                    {nota.diagnostico && (
                                        <div className="mb-2">
                                            <p className="text-[10px] text-slate-500 font-bold">Diagnóstico:</p>
                                            <p className="text-sm text-slate-700">{nota.diagnostico}</p>
                                        </div>
                                    )}

                                    {nota.tratamiento && (
                                        <div className="mb-2">
                                            <p className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                                <Pill className="w-3 h-3 text-slate-400" />
                                                Tratamiento:
                                            </p>
                                            <p className="text-sm text-slate-700">{nota.tratamiento}</p>
                                        </div>
                                    )}

                                    {nota.nota_medica && (
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold">Nota Clínica:</p>
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap">{nota.nota_medica}</p>
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-slate-500 text-center py-4">No hay notas clínicas para este paciente</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 print:static print:bg-white print:p-0 print:z-auto print:block print:h-auto print:overflow-visible">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto print:max-h-none print:shadow-none print:border-none print:rounded-none print:overflow-visible print:w-full print:block">
                
                <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-start z-10 print:hidden">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <FileText className="w-6 h-6 text-sky-500" />
                            {mostrarReporte ? 'Reporte de Paciente' : 'Pacientes'}
                        </h2>
                        <p className="text-sm text-slate-500">
                            {mostrarReporte 
                                ? `Historial clínico de ${pacienteSeleccionado?.nombre || ''}`
                                : 'Selecciona un paciente para ver su historial completo'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {cargando ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent"></div>
                        <span className="ml-3 text-sm text-slate-500">Cargando reporte...</span>
                    </div>
                ) : mostrarReporte ? (
                    renderReporte()
                ) : (
                    renderListaPacientes()
                )}
            </div>
        </div>
    );
}