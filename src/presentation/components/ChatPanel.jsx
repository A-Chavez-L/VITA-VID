// src/presentation/components/ChatPanel.jsx
import React, { useState, useEffect, useRef } from "react";
import { X, SendHorizonal, MessageSquare } from "lucide-react";

/**
 * Panel de chat durante la videoconsulta.
 * Componente presentacional: recibe los mensajes y el callback de envío
 * desde el VideoCallContainer (que maneja usePubSub de VideoSDK).
 * Funciona como canal de respaldo cuando el audio falla, y para compartir
 * texto que se dicta mal por voz (medicamentos, dosis, enlaces).
 */
export default function ChatPanel({ mensajes, onEnviar, onClose, localParticipantId }) {
  const [texto, setTexto] = useState("");
  const finListaRef = useRef(null);

  // Auto-scroll al último mensaje cada vez que llega uno nuevo
  useEffect(() => {
    finListaRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const enviarMensaje = (e) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (!limpio) return;
    onEnviar(limpio);
    setTexto("");
  };

  const formatearHora = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <div className="absolute inset-y-0 right-0 z-30 w-full sm:w-80 bg-slate-900/95 backdrop-blur-md border-l border-slate-800 flex flex-col rounded-r-xl shadow-2xl animate-fade-in">

      {/* Cabecera */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-400" />
          <h3 className="text-xs font-black text-slate-200 tracking-wider uppercase">Chat de la Consulta</h3>
        </div>
        <button
          onClick={onClose}
          aria-label="Cerrar chat"
          className="text-slate-400 hover:text-slate-200 p-1.5 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Lista de mensajes */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5">
        {(!mensajes || mensajes.length === 0) ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-4 select-none">
            <MessageSquare className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">Aún no hay mensajes.</p>
            <p className="text-[10px] text-slate-600 mt-1">Útil si el audio falla o para compartir indicaciones por escrito.</p>
          </div>
        ) : (
          mensajes.map((msg, index) => {
            const esPropio = msg.senderId === localParticipantId;
            return (
              <div key={msg.id || `msg-${index}`} className={`flex flex-col ${esPropio ? "items-end" : "items-start"}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-xs leading-relaxed break-words ${
                  esPropio
                    ? "bg-sky-600 text-white rounded-br-md"
                    : "bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-md"
                }`}>
                  {!esPropio && (
                    <p className="text-[10px] font-bold text-sky-400 mb-0.5">{msg.senderName || "Participante"}</p>
                  )}
                  <p>{msg.message}</p>
                </div>
                <span className="text-[9px] text-slate-600 mt-0.5 px-1">{formatearHora(msg.timestamp)}</span>
              </div>
            );
          })
        )}
        <div ref={finListaRef} />
      </div>

      {/* Caja de envío */}
      <form onSubmit={enviarMensaje} className="p-3 border-t border-slate-800 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escribe un mensaje..."
            maxLength={500}
            aria-label="Mensaje de chat"
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 transition"
          />
          <button
            type="submit"
            disabled={!texto.trim()}
            aria-label="Enviar mensaje"
            className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-800 disabled:text-slate-600 text-white p-2.5 rounded-xl transition shrink-0"
          >
            <SendHorizonal className="w-4 h-4" />
          </button>
        </div>
      </form>

    </div>
  );
}
