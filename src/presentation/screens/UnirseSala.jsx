// src/presentation/screens/UnirseSala.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MeetingProvider } from "@videosdk.live/react-sdk";
import VideoCallContainer from '../containers/VideoCallContainer';
import { getToken } from '../../data/api';
import { citasService } from '../../core/services/citasService';
import { supabase } from '../../data/supabaseClient';
import { Ban, Stethoscope, HeartPulse, CheckCircle2, Video } from 'lucide-react';

export default function UnirseSala() {
  // react-router-dom mapea el parámetro exacto según App.jsx (:meetingId)
  const { meetingId } = useParams();
  const navigate = useNavigate();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(null);
  const [meetingIdReal, setMeetingIdReal] = useState(null);

  // Estados para el Lobby adaptado a móviles
  const [nombrePaciente, setNombrePaciente] = useState('');
  const [confirmarIngreso, setConfirmarIngreso] = useState(false);
  const [requiereNombreManual, setRequiereNombreManual] = useState(false);
  const [esperandoMedico, setEsperandoMedico] = useState(false);
  // Pantalla post-llamada del paciente (evita crash al colgar: antes no había onLeave)
  const [llamadaTerminada, setLlamadaTerminada] = useState(false);

  useEffect(() => {
    let canalRealtime = null;

    const validarYConectar = async () => {
      try {
        if (!meetingId) {
          throw new Error("No se detectó ningún identificador de sala en el enlace de acceso.");
        }

        let meetingIdFinal = null;
        const esNumeroCita = /^\d+$/.test(meetingId);

        if (esNumeroCita) {
          // Caso A: Viene el ID numérico de la cita de Supabase
          const cita = await citasService.validarAccesoASala(meetingId);

          if (cita) {
            if (cita.paciente_nombre) {
              setNombrePaciente(cita.paciente_nombre);
              setRequiereNombreManual(false);
            } else {
              setRequiereNombreManual(true);
            }

            if (cita.meeting_id) {
              meetingIdFinal = cita.meeting_id;
            } else {
              // El médico no ha iniciado la videollamada aún: activamos canal Realtime
              setEsperandoMedico(true);
              setCargando(false);

              canalRealtime = supabase
                .channel(`espera-sala-${meetingId}`)
                .on(
                  'postgres_changes',
                  {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'citas',
                    filter: `id=eq.${meetingId}`,
                  },
                  async (payload) => {
                    if (payload.new && payload.new.meeting_id) {
                      // Manejo de errores dentro del callback: si el token falla,
                      // el paciente recibe un mensaje en vez de quedar atrapado esperando
                      try {
                        const tokenVideo = await getToken();
                        setToken(tokenVideo);
                        setMeetingIdReal(payload.new.meeting_id);
                        setEsperandoMedico(false);
                      } catch (errToken) {
                        console.error("Error al obtener token de video:", errToken);
                        setEsperandoMedico(false);
                        setError("El médico inició la consulta, pero no se pudo establecer la conexión de video. Recarga la página para reintentar.");
                      }
                    }
                  }
                )
                .subscribe();

              return; // Pausamos la ejecución hasta recibir el evento
            }
          } else {
            throw new Error("La cita médica especificada no existe en el sistema.");
          }
        } else {
          // Caso B: Viene el código de sala directo de VideoSDK (con guiones)
          meetingIdFinal = meetingId;
          setRequiereNombreManual(true);
        }

        const tokenVideo = await getToken();
        setToken(tokenVideo);
        setMeetingIdReal(meetingIdFinal);

      } catch (err) {
        console.error("Error al enlazar sala:", err);
        setError(err.message || "No se pudo conectar de manera segura con el canal de telemedicina.");
      } finally {
        if (!canalRealtime) {
          setCargando(false);
        }
      }
    };

    validarYConectar();

    // Limpieza del canal Realtime al desmontar el componente
    return () => {
      if (canalRealtime) {
        supabase.removeChannel(canalRealtime);
      }
    };
  }, [meetingId]);

  if (cargando) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-sky-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-xs font-mono text-slate-400">Verificando credenciales de acceso VITA...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center text-white max-w-md p-6">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-full">
              <Ban className="w-8 h-8 text-rose-400" />
            </div>
          </div>
          <h2 className="text-xl font-bold mb-2">Error de conexión</h2>
          <p className="text-sm text-slate-400">{error}</p>
          <button onClick={() => navigate('/')} className="mt-4 bg-sky-500 hover:bg-sky-600 text-white font-bold px-6 py-2 rounded-xl text-xs transition">
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA POST-LLAMADA DEL PACIENTE (simple: sin resolución de cita, eso es del médico)
  if (llamadaTerminada) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-emerald-500/10 border-2 border-emerald-500/30 rounded-full">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
          </div>
          <h2 className="text-lg font-black text-slate-200 tracking-tight">Consulta finalizada</h2>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed">
            Has salido de la videoconsulta de VITA. Ya puedes cerrar esta ventana. Si saliste por error, puedes reingresar mientras la consulta siga activa.
          </p>
          <button
            onClick={() => setLlamadaTerminada(false)}
            className="mt-6 inline-flex items-center justify-center gap-2 text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 text-xs font-bold px-6 py-3 rounded-xl border border-sky-500/20 transition"
          >
            <Video className="w-4 h-4" />
            Reingresar a la consulta
          </button>
        </div>
      </div>
    );
  }

  // PANTALLA DE ESPERA REACTIVA EN TIEMPO REAL
  if (esperandoMedico) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl text-center">
          <div className="relative flex justify-center mb-4">
            <div className="animate-ping absolute inline-flex h-14 w-14 rounded-full bg-sky-400 opacity-25"></div>
            <div className="relative p-3 bg-sky-500/10 border border-sky-500/30 rounded-full">
              <Stethoscope className="w-7 h-7 text-sky-400" />
            </div>
          </div>
          <h2 className="text-lg font-black text-slate-200 tracking-tight">Sala de Espera Virtual</h2>
          <p className="text-xs text-sky-400 mt-1 font-bold tracking-wider uppercase">Cita Registrada #{meetingId}</p>

          <div className="mt-6 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
            <p className="text-xs text-slate-400">Paciente:</p>
            <p className="text-sm font-bold text-slate-300 mt-0.5">{nombrePaciente || "Validando..."}</p>
          </div>

          <p className="text-xs text-slate-400 mt-6 leading-relaxed">
            El médico aún no ha iniciado la videollamada. Por favor, permanece en esta pantalla; la consulta se activará de forma automática en cuanto el profesional se conecte.
          </p>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] font-mono text-slate-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Escuchando canal de telemedicina seguro
          </div>
        </div>
      </div>
    );
  }

  // LOBBY INTERMEDIO: Captura la interacción obligatoria del usuario móvil
  // (los navegadores exigen un gesto del usuario antes de activar cámara/micrófono)
  if (!confirmarIngreso) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl text-center">
          <div className="flex justify-center">
            <div className="p-3 bg-sky-500/10 border border-sky-500/30 rounded-full">
              <HeartPulse className="w-8 h-8 text-sky-400" />
            </div>
          </div>
          <h2 className="text-lg font-black mt-3 text-sky-400 tracking-tight">TELEMEDICINA VITA</h2>
          <p className="text-xs text-slate-400 mt-1">Hospital San Gabriel</p>

          <div className="mt-6 text-left">
            {requiereNombreManual ? (
              <>
                <label htmlFor="nombre-paciente" className="text-[10px] font-black text-slate-400 tracking-wider uppercase block mb-2">
                  Ingresa tu nombre completo
                </label>
                <input
                  id="nombre-paciente"
                  type="text"
                  maxLength={80}
                  value={nombrePaciente}
                  onChange={(e) => setNombrePaciente(e.target.value)}
                  placeholder="Ej. María Pérez"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm font-medium focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 text-slate-200 transition"
                />
              </>
            ) : (
              <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800/80 text-center">
                <p className="text-xs text-slate-400">Ingresando como:</p>
                <p className="text-base font-bold text-slate-200 mt-1">{nombrePaciente}</p>
              </div>
            )}
          </div>

          <button
            disabled={!nombrePaciente.trim()}
            onClick={() => setConfirmarIngreso(true)}
            className="w-full mt-6 inline-flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl text-sm transition shadow-lg shadow-sky-500/10"
          >
            <Video className="w-4 h-4" />
            Unirse a la consulta médica
          </button>
        </div>
      </div>
    );
  }

  // CONEXIÓN EN VIVO MULTIMEDIA
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
        onLeave={() => setLlamadaTerminada(true)}
      />
    </MeetingProvider>
  );
}
