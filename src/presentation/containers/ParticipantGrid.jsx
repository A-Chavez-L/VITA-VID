import React, { useState, useEffect } from "react";
import ParticipantView from "../components/ParticipantView";

const MemoizedParticipant = React.memo(
  ParticipantView,
  (prevProps, nextProps) => prevProps.participantId === nextProps.participantId
);


function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const actualizar = (e) => setEsMovil(e.matches);

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", actualizar);
      return () => mediaQuery.removeEventListener("change", actualizar);
    } else {
      mediaQuery.addListener(actualizar);
      return () => mediaQuery.removeListener(actualizar);
    }
  }, []);

  return esMovil;
}

export default function ParticipantGrid({ participantIds }) {
  const esMovil = useEsMovil();

  const perRow = esMovil
    ? (participantIds.length <= 2 ? 1 : 2)
    : (participantIds.length === 1 ? 1 : 2);

  const rows = Math.ceil(participantIds.length / perRow);

  return (
    <div className="flex flex-col w-full h-full gap-3 p-2 flex-1 overflow-y-auto">
      {Array.from({ length: rows }, (_, rowIndex) => {
        const start = rowIndex * perRow;
        const end = Math.min(start + perRow, participantIds.length);
        const rowParticipants = participantIds.slice(start, end);

        return (
          <div
            key={`row-${rowIndex}`}
            className="flex flex-row gap-3 w-full flex-1 min-h-[200px]"
          >
            {rowParticipants.map((id) => (
              <div key={`participant-${id}`} className="flex-1 min-w-0">
                <MemoizedParticipant participantId={id} />
              </div>
            ))}
            {rowParticipants.length < perRow &&
              Array.from({ length: perRow - rowParticipants.length }).map((_, i) => (
                <div key={`empty-${i}`} className="flex-1" />
              ))
            }
          </div>
        );
      })}
    </div>
  );
}
