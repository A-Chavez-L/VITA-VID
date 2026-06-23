// src/ParticipantGrid.jsx
import React from "react";
import ParticipantView from "./ParticipantView"; // Asegúrate de que la importación sea limpia

// Componente memorizado para evitar que el cuadro de un participante parpadee si el otro se mueve
const MemoizedParticipant = React.memo(
  ParticipantView,
  (prevProps, nextProps) => {
    return prevProps.participantId === nextProps.participantId;
  }
);

export default function ParticipantGrid({ participantIds }) {
  // Evaluamos directamente si es un dispositivo pequeño de forma nativa
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches;

  // Calculamos la distribución de la rejilla según la cantidad de participantes activos
  const perRow = isMobile
    ? participantIds.length < 4
      ? 1
      : 2
    : participantIds.length < 5
    ? 2
    : 3;

  return (
    <div className="flex flex-col md:flex-row flex-grow m-3 items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col w-full h-full gap-4 justify-center items-center">
        {Array.from(
          { length: Math.ceil(participantIds.length / perRow) },
          (_, i) => {
            return (
              <div
                key={`grid_row_${i}`}
                className="flex flex-row items-center justify-center w-full h-full gap-4"
              >
                {participantIds
                  .slice(i * perRow, (i + 1) * perRow)
                  .map((participantId) => {
                    return (
                      <div
                        key={`participant_container_${participantId}`}
                        className="flex flex-1 items-center justify-center h-full w-full overflow-hidden rounded-xl p-1"
                      >
                        <MemoizedParticipant participantId={participantId} />
                      </div>
                    );
                  })}
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}