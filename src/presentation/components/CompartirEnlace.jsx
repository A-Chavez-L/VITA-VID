// src/presentation/components/CompartirEnlace.jsx
import React, { useState } from 'react';
import { Copy, Check, Share2, Users, X, MessageCircle, Mail, Smartphone, AlertCircle } from 'lucide-react';

export default function CompartirEnlace({ meetingId, pacienteNombre, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const [errorCompartir, setErrorCompartir] = useState(null);
  const [mostrarMenuCorreo, setMostrarMenuCorreo] = useState(false);

  const idSalaLimpio = meetingId ? String(meetingId).trim() : '';

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
    if (!enlaceCompleto) {
      setErrorCompartir("No hay un enlace válido para compartir");
      setTimeout(() => setErrorCompartir(null), 3000);
      return;
    }

    const saludo = pacienteNombre ? `${pacienteNombre}` : 'Paciente';
    const mensaje = `Hola, ${saludo}. Su médico le comparte el enlace para unirse a la teleconsulta en VITA. Ingrese pulsando aquí: ${enlaceCompleto}`;

    try {
      if (medio === 'whatsapp') {
        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`, '_blank');
      } 
      else if (medio === 'sms') {
        const smsUrl = `sms:?&body=${encodeURIComponent(mensaje)}`;
        const ventana = window.open(smsUrl, '_blank');
        if (!ventana || ventana.closed) {
          window.location.href = smsUrl;
        }
      }
    } catch (error) {
      console.error("Error al compartir:", error);
      setErrorCompartir(`No se pudo abrir ${medio}. Intenta copiar el enlace manualmente.`);
      setTimeout(() => setErrorCompartir(null), 4000);
    }
  };

  const abrirCorreoWeb = (servicio) => {
    if (!enlaceCompleto) return;

    const saludo = pacienteNombre ? `${pacienteNombre}` : 'Paciente';
    const mensaje = `Hola, ${saludo}. Su médico le comparte el enlace para unirse a la teleconsulta en VITA. Ingrese pulsando aquí: ${enlaceCompleto}`;
    
    const subject = encodeURIComponent('Enlace de Teleconsulta VITA');
    const body = encodeURIComponent(mensaje);

    let url;
    if (servicio === 'gmail') {
      url = `https://mail.google.com/mail/?view=cm&fs=1&su=${subject}&body=${body}`;
    } else if (servicio === 'outlook') {
      url = `https://outlook.live.com/mail/0/deeplink/compose?to=&subject=${subject}&body=${body}`;
    } else {
      // Cliente local
      url = `mailto:?subject=${subject}&body=${body}`;
    }

    const ventana = window.open(url, '_blank');
    if (!ventana || ventana.closed) {
      window.location.href = url;
    }
    
    setMostrarMenuCorreo(false);
  };

  const copiarMensajeCompleto = () => {
    if (!enlaceCompleto) return;
    
    const mensaje = `📋 *Enlace de Teleconsulta VITA*\n\n` +
      `Paciente: ${pacienteNombre || 'No especificado'}\n` +
      `Enlace: ${enlaceCompleto}\n\n` +
      `El paciente puede unirse haciendo clic en el enlace. No necesita cuenta.`;
    
    navigator.clipboard.writeText(mensaje)
      .then(() => {
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      })
      .catch(() => {
        const textArea = document.createElement('textarea');
        textArea.value = mensaje;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopiado(true);
        setTimeout(() => setCopiado(false), 2500);
      });
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

        {/* Mensaje de error */}
        {errorCompartir && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">{errorCompartir}</p>
          </div>
        )}

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

        {/* Botón para copiar mensaje completo */}
        <button
          onClick={copiarMensajeCompleto}
          disabled={!enlaceCompleto}
          className="w-full bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold py-2 rounded-xl transition-colors flex items-center justify-center gap-1.5"
        >
          <Copy className="w-3.5 h-3.5" />
          Copiar mensaje completo con enlace
        </button>

        {/* Integraciones con Terceros */}
        <div className="space-y-2">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Enviar por aplicación externa</p>
          
          {/* Menú de correo desplegable */}
          <div className="relative">
            <button
              onClick={() => setMostrarMenuCorreo(!mostrarMenuCorreo)}
              disabled={!enlaceCompleto}
              className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> 
              {mostrarMenuCorreo ? 'Selecciona servicio...' : 'Correo Electrónico ▼'}
            </button>
            
            {mostrarMenuCorreo && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-20">
                <button
                  onClick={() => abrirCorreoWeb('gmail')}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition flex items-center gap-2 border-b border-slate-100"
                >
                  <span className="text-red-500 text-base">📧</span> Gmail
                </button>
                <button
                  onClick={() => abrirCorreoWeb('outlook')}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition flex items-center gap-2 border-b border-slate-100"
                >
                  <span className="text-blue-500 text-base">📨</span> Outlook
                </button>
                <button
                  onClick={() => {
                    abrirCorreoWeb('local');
                    setMostrarMenuCorreo(false);
                  }}
                  className="w-full text-left px-4 py-2.5 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition flex items-center gap-2"
                >
                  <span className="text-slate-500 text-base">📩</span> Cliente local
                </button>
              </div>
            )}
          </div>

          {/* Botones de WhatsApp y SMS */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => compartirVia('whatsapp')}
              disabled={!enlaceCompleto}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 inline-flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
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

        {/* Nota informativa */}
        <div className="text-[10px] text-slate-400 text-center border-t border-slate-100 pt-3 select-none leading-relaxed">
          💡 Selecciona tu servicio de correo preferido para abrirlo en una nueva pestaña.
          <br />
          Si no funciona, usa <strong>"Copiar mensaje completo"</strong>.
        </div>

      </div>
    </div>
  );
}