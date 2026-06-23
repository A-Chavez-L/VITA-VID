// src/DropDownSpeaker.jsx
import { Popover, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Fragment, useState, useEffect } from 'react'
import React from "react";
import { useMeeting } from "@videosdk.live/react-sdk";

export default function DropDownSpeaker() {
  const [listaAltavoces, setListaAltavoces] = useState([]);
  const [audioProgress, setAudioProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const { speakers, speakersId, changeSpeaker } = useMeeting();

  useEffect(() => {
    if (speakers && Array.isArray(speakers)) {
      setListaAltavoces(speakers);
    }
  }, [speakers]);

  const altavozActivo = listaAltavoces.find(spk => spk.deviceId === speakersId) || listaAltavoces[0];

  const testSpeakers = (e) => {
    e.stopPropagation();
    const selectedSpeakerDeviceId = altavozActivo?.deviceId;
    if (selectedSpeakerDeviceId) {
      const audio = new Audio("https://static.videosdk.live/prebuilt/notification.mp3");
      try {
        if (typeof audio.setSinkId === 'function') {
          audio.setSinkId(selectedSpeakerDeviceId)
            .then(() => arrancarAudioPrueba(audio))
            .catch(() => arrancarAudioPrueba(audio));
        } else {
          arrancarAudioPrueba(audio);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const arrancarAudioPrueba = (audio) => {
    audio.play();
    setIsPlaying(true);
    audio.addEventListener('timeupdate', () => setAudioProgress((audio.currentTime / audio.duration) * 100));
    audio.addEventListener('ended', () => { setAudioProgress(0); setIsPlaying(false); });
  };

  return (
    <div className="relative">
      <Popover className="relative w-64">
        {({ open }) => (
          <>
            <Popover.Button className={`focus:outline-none w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${open ? "bg-slate-800 border-slate-700 text-white" : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"}`}>
              <div className="flex items-center gap-2 overflow-hidden">
                <span>🔊</span>
                <span className="truncate max-w-[140px]">{altavozActivo?.label || "Altavoces por Defecto"}</span>
              </div>
              <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${open ? 'transform rotate-180' : ''}`} aria-hidden="true" />
            </Popover.Button>

            <Transition as={Fragment} enter="transition ease-out duration-200" enterFrom="opacity-0 translate-y-1" enterTo="opacity-100 translate-y-0" leave="transition ease-in duration-150" leaveFrom="opacity-100 translate-y-0" leaveTo="opacity-0 translate-y-1">
              <Popover.Panel className="absolute bottom-full mb-2 left-0 z-50 w-full bg-white border border-slate-100 rounded-xl shadow-2xl p-1.5 space-y-0.5">
                <div className="px-3 py-1.5 border-b border-slate-50 text-[10px] font-black text-slate-400 tracking-wider uppercase">Salida de Audio</div>
                <div className="max-h-40 overflow-y-auto">
                  {listaAltavoces.length > 0 ? (
                    listaAltavoces.map((speaker, index) => (
                      speaker?.kind === "audiooutput" && (
                        <button key={`speaker_device_${index}`} onClick={() => changeSpeaker(speaker.deviceId)} className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left text-xs font-semibold transition ${altavozActivo?.deviceId === speaker.deviceId ? "bg-sky-50 text-sky-700 font-bold" : "text-slate-600 hover:bg-slate-50"}`}>
                          <span className="truncate pr-2">{speaker.label || `Altavoz ${index + 1}`}</span>
                          {altavozActivo?.deviceId === speaker.deviceId && <CheckIcon className="h-4 w-4 text-sky-600 flex-shrink-0" />}
                        </button>
                      )
                    ))
                  ) : (
                    <p className="text-[11px] text-slate-400 p-3 text-center">Buscando altavoces...</p>
                  )}
                </div>
                {listaAltavoces.length > 0 && (
                  <div className="pt-1.5 border-t border-slate-100 mt-1">
                    <button onClick={testSpeakers} className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition">
                      {isPlaying ? (
                        <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                          <div className="bg-sky-500 h-full transition-all duration-100" style={{ width: `${audioProgress}%` }}></div>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center"><span>临</span><span>Probar Altavoces</span></div>
                      )}
                    </button>
                  </div>
                )}
              </Popover.Panel>
            </Transition>
          </>
        )}
      </Popover>
    </div>
  );
}