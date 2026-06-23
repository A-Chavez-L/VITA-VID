// src/DropDownCam.jsx
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon, CheckIcon } from "@heroicons/react/24/outline";
import { Fragment, useState, useEffect } from 'react'
import React from "react";
import { useMeeting } from "@videosdk.live/react-sdk";

export default function DropDownCam() {
  const [listaCamaras, setListaCamaras] = useState([]);
  const { webcams, changeWebcam, speakersId } = useMeeting();

  useEffect(() => {
    if (webcams && Array.isArray(webcams)) {
      setListaCamaras(webcams);
    }
  }, [webcams]);

  const camaraActiva = listaCamaras.find(cam => cam.deviceId === changeWebcam?.id) || listaCamaras[0];

  return (
    <div className="relative">
      <Popover className="relative w-64">
        {({ open }) => (
          <>
            <Popover.Button className={`focus:outline-none w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${open ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <span>📷</span>
                <span className="truncate max-w-[140px]">{camaraActiva?.label || "Cámara por Defecto"}</span>
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'transform rotate-180' : ''}`} aria-hidden="true" />
            </Popover.Button>

            <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
              <Popover.Panel className="absolute bottom-full mb-2 left-0 z-50 w-full bg-white border border-slate-100 rounded-xl shadow-2xl p-1.5 space-y-0.5">
                <div className="px-3 py-1.5 border-b border-slate-50 text-[10px] font-black text-slate-400 tracking-wider uppercase">Seleccionar Cámara</div>
                <div className="max-h-48 overflow-y-auto">
                  {listaCamaras.length > 0 ? (
                    listaCamaras.map((camera, index) => (
                      camera?.kind === "videoinput" && (
                        <button key={`webcam_device_${index}`} onClick={() => changeWebcam(camera.deviceId)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${camaraActiva?.deviceId === camera.deviceId ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                          <span className="truncate pr-2">{camera.label || `Cámara de Video ${index + 1}`}</span>
                          {camaraActiva?.deviceId === camera.deviceId && <CheckIcon className="h-4 w-4 text-sky-600 flex-shrink-0" />}
                        </button>
                      )
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 p-3 text-center">Buscando webcams...</p>
                  )}
                </div>
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}