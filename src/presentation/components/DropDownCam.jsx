// src/presentation/components/DropDownCam.jsx
import React, { useState, useEffect, useRef } from "react";
import { useMeeting } from "@videosdk.live/react-sdk";
import { Video, ChevronDown, Check } from "lucide-react";

/**
 * Selector de cámara para la videollamada.
 * Reescrito con React puro + lucide-react (sin @headlessui ni @heroicons:
 * evita agregar dos dependencias para un solo dropdown).
 * Estilizado en tema oscuro para integrarse a los controles del VideoCallContainer.
 */
export default function DropDownCam() {
  const [abierto, setAbierto] = useState(false);
  const [listaCamaras, setListaCamaras] = useState([]);
  const [camaraActiva, setCamaraActiva] = useState(null);
  const contenedorRef = useRef(null);

  const { webcams, changeWebcam } = useMeeting();

  // Lista inicial de cámaras del sistema (los labels están disponibles
  // porque el usuario ya otorgó permisos al entrar a la llamada)
  useEffect(() => {
    const obtenerWebcams = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        if (videoDevices.length > 0) {
          setListaCamaras(videoDevices);
          // Solo asigna la activa si aún no hay una elegida:
          // no pisa la selección del usuario (bug del código original)
          setCamaraActiva(prev => prev || videoDevices[0]);
        }
      } catch (error) {
        console.warn("Error al obtener webcams:", error);
      }
    };

    obtenerWebcams();
  }, []);

  // Sincroniza con la lista de webcams que reporta VideoSDK, preservando la selección
  useEffect(() => {
    if (webcams && Array.isArray(webcams) && webcams.length > 0) {
      setListaCamaras(webcams);
      setCamaraActiva(prev => {
        if (prev && webcams.some(w => w.deviceId === prev.deviceId)) return prev;
        return webcams[0];
      });
    }
  }, [webcams]);

  // Cierra el menú al hacer clic fuera o presionar Escape
  useEffect(() => {
    if (!abierto) return;

    const alClicFuera = (e) => {
      if (contenedorRef.current && !contenedorRef.current.contains(e.target)) {
        setAbierto(false);
      }
    };
    const alPresionarTecla = (e) => {
      if (e.key === "Escape") setAbierto(false);
    };

    document.addEventListener("mousedown", alClicFuera);
    document.addEventListener("keydown", alPresionarTecla);
    return () => {
      document.removeEventListener("mousedown", alClicFuera);
      document.removeEventListener("keydown", alPresionarTecla);
    };
  }, [abierto]);

  const cambiarCamara = async (deviceId) => {
    try {
      await changeWebcam(deviceId);
      const cam = listaCamaras.find(c => c.deviceId === deviceId);
      if (cam) setCamaraActiva(cam);
      setAbierto(false);
    } catch (error) {
      console.error("Error al cambiar cámara:", error);
    }
  };

  return (
    <div className="relative" ref={contenedorRef}>
      <button
        onClick={() => setAbierto(prev => !prev)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label="Seleccionar cámara"
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition ${
          abierto
            ? "bg-slate-700 border-slate-600 text-white"
            : "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-200"
        }`}
      >
        <Video className="w-4 h-4" />
        <span className="truncate max-w-[90px] hidden sm:inline">
          {camaraActiva?.label || "Cámara"}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div
          role="listbox"
          className="absolute bottom-full mb-2 right-0 z-50 w-56 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-1.5"
        >
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] font-black text-slate-500 tracking-wider uppercase">
            Cámaras disponibles
          </div>
          <div className="max-h-48 overflow-y-auto mt-1">
            {listaCamaras.length > 0 ? (
              listaCamaras.map((camera, index) => (
                <button
                  key={camera.deviceId || `cam-${index}`}
                  role="option"
                  aria-selected={camaraActiva?.deviceId === camera.deviceId}
                  onClick={() => cambiarCamara(camera.deviceId)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${
                    camaraActiva?.deviceId === camera.deviceId
                      ? "bg-sky-500/15 text-sky-400 font-bold"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate pr-2">{camera.label || `Cámara ${index + 1}`}</span>
                  {camaraActiva?.deviceId === camera.deviceId && <Check className="w-4 h-4 text-sky-400 flex-shrink-0" />}
                </button>
              ))
            ) : (
              <p className="text-[11px] text-slate-500 p-3 text-center">No se detectaron cámaras</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
