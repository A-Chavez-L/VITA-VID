import React from "react";
import ParticipantView from "../components/ParticipantView";

const MemoizedParticipant = React.memo(
  ParticipantView,
  (prevProps, nextProps) => prevProps.participantId === nextProps.participantId
);

export default function ParticipantGrid({ participantIds = [] }) {
  // Limitar estrictamente a máximo 4 personas
  const activeParticipants = participantIds.slice(0, 4);
  const count = activeParticipants.length;

  // Clases Grid dinámicas según el número de participantes
  // Se fuerzan rows y cols para aprovechar todo el espacio disponible
  const gridClasses = {
    1: "grid-cols-1 grid-rows-1",
    2: "grid-cols-1 md:grid-cols-2 grid-rows-2 md:grid-rows-1",
    3: "grid-cols-1 md:grid-cols-2 grid-rows-3 md:grid-rows-2",
    4: "grid-cols-2 grid-rows-2",
  }[count] || "grid-cols-1 grid-rows-1";

  return (
    <div className="w-full h-full min-h-0 flex-1 p-2 md:p-3 bg-slate-950 overflow-hidden flex items-center justify-center">
      <div className={`grid ${gridClasses} gap-2 md:gap-3 w-full h-full max-h-full min-h-0 min-w-0`}>
        {activeParticipants.map((id) => (
          <div 
            key={`participant-${id}`} 
            className="relative w-full h-full min-h-0 min-w-0 overflow-hidden rounded-xl md:rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center"
          >
            <MemoizedParticipant participantId={id} />
          </div>
        ))}
      </div>
    </div>
  );
}