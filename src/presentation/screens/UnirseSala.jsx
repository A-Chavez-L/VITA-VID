import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MeetingProvider } from "@videosdk.live/react-sdk";
import VideoCallContainer from '../containers/VideoCallContainer';
import { getToken } from '../../data/api';
import { citasService } from '../../core/services/citasService';
import { supabase } from '../../data/supabaseClient';
import { Ban, Stethoscope, HeartPulse, CheckCircle2, Video, Loader2, User } from 'lucide-react';

export default function UnirseSala() {
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [meetingIdReal, setMeetingIdReal] = useState(null);

  const [nombrePaciente, setNombrePaciente] = useState('');
  const [esperandoMedico, setEsperandoMedico] = useState(true);
  const [llamadaTerminada, setLlamadaTerminada] = useState(false);
  const [unido, setUnido] = useState(false);
  const [procesandoIngreso, setProcesandoIngreso] = useState(false);

  useEffect(() => {
    let canalRealtime = null;
    let pollingInterval = null;

    const verificarEstadoYConectar = async () => {
      try {
        if (!meetingId) {
          throw new Error("No se detectó ningún identificador de sala.");
        }

        const esNumero = /^\d+$/.test(meetingId);
        let query = supabase.from('citas').select('id, host_conectado, meeting_id, paciente_nombre');

        if (esNumero) {
          query = query.or(`id.eq.${meetingId},meeting_id.eq.${meetingId}`);
        } else {
          query = query.eq('meeting_id', meetingId);
        }

        const { data } = await query.maybeSingle();

        if (data) {
          if (data.meeting_id) setMeetingIdReal(data.meeting_id);
          else if (!esNumero) setMeetingIdReal(meetingId);

          if (data.paciente_nombre) {
            setNombrePaciente((prev) => prev || data.paciente_nombre);
          }

          setEsperandoMedico(data.host_conectado !== true);
        } else if (!esNumero) {
          setMeetingIdReal(meetingId);
        }

        setCargando(false);

        // Suscripción Realtime
        canalRealtime = supabase
          .channel(`sala-espera-${meetingId}`)
          .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'citas' },
            (payload) => {
              if (payload.new) {
                const esEstaCita =
                  String(payload.new.id) === String(meetingId) ||
                  payload.new.meeting_id === meetingId ||
                  (data && payload.new.id === data.id);

                if (esEstaCita) {
                  if (payload.new.meeting_id) setMeetingIdReal(payload.new.meeting_id);
                  setEsperandoMedico(payload.new.host_conectado !== true);
                }
              }
            }
          );

        canalRealtime.subscribe();

      } catch (err) {
        console.error("Error verificando sala:", err);
        setError(err.message || "Error al verificar la sala.");
        setCargando(false);
      }
    };

    verificarEstadoYConectar();

    // Polling de respaldo constante cada 2.5 segundos para móviles
    pollingInterval = setInterval(async () => {
      if (meetingId) {
        try {
          const esNumero = /^\d+$/.test(meetingId);
          let query = supabase.from('citas').select('host_conectado, meeting_id');

          if (esNumero) {
            query = query.or(`id.eq.${meetingId},meeting_id.eq.${meetingId}`);
          } else {
            query = query.eq('meeting_id', meetingId);
          }

          const { data } = await query.maybeSingle();

          if (data) {
            if (data.meeting_id) setMeetingIdReal(data.meeting_id);
            setEsperandoMedico(data.host_conectado !== true);
          }
        } catch (e) {
          console.warn('Error en polling:', e);
        }
      }
    }, 2500);

    return () => {
      if (canalRealtime) supabase.removeChannel(canalRealtime);
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [meetingId]);

  const unirseALlamada = async () => {
    const nombreLimpio = nombrePaciente.trim();
    if (!nombreLimpio) {
      alert('Por favor, ingresa tu nombre.');
      return;
    }

    setProcesandoIngreso(true);

    try {
      const tokenVideo = await getToken();
      setToken(tokenVideo);
      setUnido(true);
    } catch (err) {
      console.error(err);
      setError("Error al obtener token de acceso para la videollamada.");
    } finally {
      setProcesandoIngreso(false);
    }
  };

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <Loader2 className="w-10 h-10 animate-spin text-sky-500 mx-auto mb-4" />
          <p className="text-xs font-mono text-slate-400">Verificando estado de la consulta...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-md">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-full">
              <Ban className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Error de Conexión</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2 rounded-xl text-xs transition">
            Volver
          </button>
        </div>
      </div>
    );
  }

  if (llamadaTerminada) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-lg font-black text-slate-200">Consulta Finalizada</h2>
          <p className="text-sm text-slate-400 mt-2">El médico ha terminado la videoconsulta.</p>
          <button onClick={() => window.close()} className="mt-6 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-6 py-3 rounded-xl transition">
            Cerrar Ventana
          </button>
        </div>
      </div>
    );
  }

  if (unido && token && meetingIdReal) {
    return (
      <MeetingProvider
        config={{
          meetingId: meetingIdReal,
          micEnabled: true,
          webcamEnabled: true,
          name: nombrePaciente.trim(),
        }}
        token={token}
      >
        <VideoCallContainer
          meetingId={meetingIdReal}
          citaId={meetingId}
          onLeave={() => setLlamadaTerminada(true)}
          esHost={false}
          nombreParticipante={nombrePaciente.trim()}
        />
      </MeetingProvider>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-center">
        
        <div className="flex justify-center">
          <div className={`p-3 rounded-full border ${esperandoMedico ? "bg-sky-500/10 border-sky-500/30" : "bg-emerald-500/10 border-emerald-500/30"}`}>
            {esperandoMedico ? <Stethoscope className="w-8 h-8 text-sky-400" /> : <HeartPulse className="w-8 h-8 text-emerald-400" />}
          </div>
        </div>

        <h2 className="text-lg font-black mt-3 text-slate-100">VITA Telemedicina</h2>
        <p className="text-xs text-slate-400 mt-0.5">Hospital San Gabriel</p>

        <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold">
          {esperandoMedico ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              <span className="text-amber-400">Esperando al médico...</span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-emerald-400">Médico en la sala</span>
            </>
          )}
        </div>

        <div className="mt-6 text-left">
          <label htmlFor="nombre-paciente" className="text-[10px] font-black text-slate-400 tracking-wider uppercase flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5 text-sky-400" />
            Tu Nombre Completo
          </label>
          <input
            id="nombre-paciente"
            type="text"
            maxLength={80}
            value={nombrePaciente}
            onChange={(e) => setNombrePaciente(e.target.value)}
            placeholder="Ingresa tu nombre (ej. María Pérez)"
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-200 transition"
          />
        </div>

        <button
          onClick={unirseALlamada}
          disabled={esperandoMedico || !nombrePaciente.trim() || procesandoIngreso}
          className="w-full mt-6 inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed text-white font-bold py-3.5 px-4 rounded-xl text-sm transition shadow-lg shadow-sky-500/10"
        >
          {procesandoIngreso ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Video className="w-4 h-4" />
          )}
          {procesandoIngreso
            ? "Conectando..."
            : esperandoMedico
            ? "Esperando que el médico inicie..."
            : "Entrar a la consulta"}
        </button>

      </div>
    </div>
  );
}