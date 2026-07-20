// src/presentation/components/CompartirEnlace.jsx
import React, { useState } from 'react';
import { Copy, Check, Share2, Users, X, MessageCircle, Mail, Smartphone } from 'lucide-react';

export default function CompartirEnlace({ meetingId, pacienteNombre, onClose }) {
  const [copiado, setCopiado] = useState(false);

  const idSalaLimpio = meetingId ? String(meetingId).trim() : '';

  // Composición dinámica de la URL de teleconsulta
  // (debe coincidir con la ruta /unirse/:meetingId definida en App.jsx)
  const enlaceCompleto = idSalaLimpio
    ? `${window.location.protocol}//${window.location.host}/unirse/${idSalaLimpio}`
    : '';

  const copiarEnlace = async () => {
    if (!enlaceCompleto) return;
    try {
      await navigator.clipboard.writeText(enlaceCompleto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch (err) {
      // Fallback clásico para HTTP local o navegadores sin permisos de Clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = enlaceCompleto;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    }
  };

  const compartirVia = (medio) => {
    if (!enlaceCompleto) return;
    const saludo = pacienteNombre ? `*${pacienteNombre}*` : 'Paciente';
    const mensaje = `Hola, ${saludo}. Su médico le comparte el enlace para unirse a la teleconsulta en VITA. Ingrese pulsando aquí: ${enlaceCompleto}`;

    if (medio === 'whatsapp') {
      // WhatsApp es una URL http: abre bien en pestaña nueva
      window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
    } else if (medio === 'correo') {
      // mailto: y sms: son protocolos del sistema; window.open dejaría
      // una pestaña en blanco huérfana en varios navegadores
      window.location.href = `mailto:?subject=${encodeURIComponent('Enlace de Teleconsulta VITA')}&body=${encodeURIComponent(mensaje)}`;
    } else if (medio === 'sms') {
      window.location.href = `sms:?&body=${encodeURIComponent(mensaje)}`;
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full space-y-5 animate-scale-in">

        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Compartir Acceso</h3>
              <p className="text-[10px] text-slate-500 font-medium">Invita al paciente a la consulta</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tarjeta de Información Interna */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paciente</p>
          <p className="text-xs font-bold text-slate-700">{pacienteNombre || 'Paciente No Asignado'}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-500">ID de Sala:</span>
            <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600 font-bold select-all">
              {idSalaLimpio || 'No asignado'}
            </span>
          </div>
        </div>

        {/* Caja de Enlace y Copiado */}
        <div className="space-y-1.5">
          <label htmlFor="enlace-paciente" className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enlace del Paciente</label>
          <div className="flex gap-1.5">
            <input
              id="enlace-paciente"
              type="text"
              readOnly
              value={enlaceCompleto || 'Generando enlace de sala...'}
              className="w-full text-[11px] bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-600 select-all font-medium focus:outline-none focus:border-sky-300"
            />
            <button
              onClick={copiarEnlace}
              disabled={!enlaceCompleto}
              className={`px-3 py-2 rounded-xl border font-bold text-xs transition-all flex items-center gap-1 active:scale-95 ${
                copiado
                  ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50'
              }`}
            >
              {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{copiado ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        {/* Integraciones con Terceros */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enviar por aplicación externa</p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => compartirVia('whatsapp')}
              disabled={!enlaceCompleto}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
            </button>
            <button
              onClick={() => compartirVia('correo')}
              disabled={!enlaceCompleto}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Correo
            </button>
            <button
              onClick={() => compartirVia('sms')}
              disabled={!enlaceCompleto}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-1.5"
            >
              <Smartphone className="w-3.5 h-3.5" /> SMS
            </button>
          </div>
        </div>

        {/* Acción de Monitoreo Directo */}
        <button
          onClick={() => enlaceCompleto && window.open(enlaceCompleto, '_blank')}
          disabled={!enlaceCompleto}
          className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <Share2 className="w-4 h-4" /> Probar / Abrir en pestaña nueva
        </button>

        {/* Nota informativa (texto veraz: el paciente no se autentica, ingresa con su nombre) */}
        <div className="text-[10px] text-slate-500 text-center border-t border-slate-100 pt-3 select-none leading-relaxed">
          El paciente accederá directamente con este enlace, sin necesidad de crear una cuenta: solo confirmará su nombre antes de ingresar a la videoconsulta.
        </div>

      </div>
    </div>
  );
}
