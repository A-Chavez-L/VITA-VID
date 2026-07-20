// src/presentation/containers/ParticipantGrid.jsx
import React, { useState, useEffect } from "react";
import ParticipantView from "../components/ParticipantView";

// Evita re-renderizar cada tile cuando cambia la lista completa de participantes:
// cada ParticipantView se suscribe internamente a su propio participante vía el SDK,
// así que solo necesita re-renderizarse si cambia su participantId.
const MemoizedParticipant = React.memo(
  ParticipantView,
  (prevProps, nextProps) => prevProps.participantId === nextProps.participantId
);

/**
 * Hook reactivo de media query: escucha los cambios de tamaño/orientación,
 * no solo el valor inicial (bug común: rotar el teléfono no reorganizaba el grid).
 */
function useEsMovil() {
  const [esMovil, setEsMovil] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
  );

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    const actualizar = (e) => setEsMovil(e.matches);

    // addEventListener es el API moderno; addListener queda como respaldo
    // para navegadores móviles antiguos
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

  // Columnas por fila: en móvil 1 (o 2 si hay más de 2 personas); en desktop 1 solo o 2
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
            {/* Relleno para mantener el ancho uniforme cuando la última fila está incompleta */}
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
