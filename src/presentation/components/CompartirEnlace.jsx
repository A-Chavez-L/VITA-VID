// src/presentation/components/CompartirEnlace.jsx
import React, { useState } from 'react';
import { Copy, Check, Share2, Users } from 'lucide-react';

export default function CompartirEnlace({ meetingId, meeting_Id, meeting_id, pacienteNombre, onClose }) {
  const [copiado, setCopiado] = useState(false);

  // 🛡️ Mapeo defensivo de propiedades para erradicar el bug de capitalización
  const idSalaBruto = meetingId || meeting_Id || meeting_id;
  const idSalaLimpio = idSalaBruto ? String(idSalaBruto).trim() : '';

  // 🌐 Composición dinámica de la URL de teleconsulta
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
    
    let url = '';
    if (medio === 'whatsapp') url = `https://api.whatsapp.com/send?text=${encodeURIComponent(mensaje)}`;
    if (medio === 'correo') url = `mailto:?subject=Enlace%20de%20Teleconsulta%20VITA&body=${encodeURIComponent(mensaje)}`;
    if (medio === 'sms') url = `sms:?&body=${encodeURIComponent(mensaje)}`;

    if (url) window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center z-50 animate-fade-in p-4">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-2xl max-w-sm w-full space-y-5 animate-scale-in">
        
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between border-b border-slate-50 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-sky-50 rounded-xl text-sky-600">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Compartir Acceso</h3>
              <p className="text-[10px] text-slate-400 font-medium">Invita al paciente a la consulta</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1 hover:bg-slate-50 rounded-lg transition"
          >
            ✕
          </button>
        </div>

        {/* Tarjeta de Información Interna */}
        <div className="bg-slate-50 border border-slate-100 rounded-xl p-3 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Paciente</p>
          <p className="text-xs font-bold text-slate-700">{pacienteNombre || 'Paciente No Asignado'}</p>
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] text-slate-400">ID de Sala:</span>
            <span className="text-[10px] font-mono bg-slate-200/60 px-1.5 py-0.5 rounded text-slate-600 font-bold select-all">
              {idSalaLimpio || 'No asignado'}
            </span>
          </div>
        </div>

        {/* Caja de Enlace y Copiado */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enlace del Paciente</label>
          <div className="flex gap-1.5">
            <input 
              type="text" 
              readOnly 
              value={enlaceCompleto || 'Generando enlace de sala...'} 
              className="w-full text-[11px] bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-slate-600 select-all font-medium focus:outline-none"
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Enviar por aplicación externa</p>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => compartirVia('whatsapp')} 
              disabled={!enlaceCompleto}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 text-center"
            >
              💬 WhatsApp
            </button>
            <button 
              onClick={() => compartirVia('correo')} 
              disabled={!enlaceCompleto}
              className="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 text-center"
            >
              ✉️ Correo
            </button>
            <button 
              onClick={() => compartirVia('sms')} 
              disabled={!enlaceCompleto}
              className="bg-purple-500 hover:bg-purple-600 disabled:opacity-50 text-white text-[11px] font-bold py-2 rounded-xl transition-all shadow-sm active:scale-95 text-center"
            >
              📱 SMS
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

        {/* Nota Técnica de Cierre */}
        <div className="text-[9px] text-slate-400 text-center border-t border-slate-100 pt-3 select-none leading-relaxed">
          El paciente ingresará de forma segura y directa a través del módulo de autenticación clínica de la app.
        </div>

      </div>
    </div>
  );
}