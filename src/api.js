// src/api.js

const API_BASE_URL = "https://api.videosdk.live";

// 🔴 PEGA AQUÍ TU TOKEN TEMPORAL DE DESARROLLADOR DE VIDEOSDK
const VIDEOSDK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiI2ZjgzNzY4MC01OGQxLTQxYWItODY3MS05NzZjY2YyYmU0YjkiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sImlhdCI6MTc4MjE3MDUzMSwiZXhwIjoxNzgyNzc1MzMxfQ.pr59wxX4oOIKrG7-KmwqYd39-_8kyBB5-vRqkAqYH2w"; 

export const getToken = async () => {
  return VIDEOSDK_TOKEN;
};

// Crea una reunión real en los servidores de VideoSDK
export const createMeeting = async () => {
  const url = `${API_BASE_URL}/v2/rooms`;
  const options = {
    method: "POST",
    headers: { 
      Authorization: VIDEOSDK_TOKEN, 
      "Content-Type": "application/json" 
    },
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (data.roomId) {
      console.log("✅ Sala registrada con éxito en la nube de VideoSDK:", data.roomId);
      return data.roomId; // Nos da el ID real como "abcd-efgh-ijkl"
    } else {
      console.error("❌ El servidor rechazó la creación de la sala:", data.error);
      return null;
    }
  } catch (error) {
    console.error("❌ Error de red en createMeeting:", error);
    return null;
  }
};

// Valida si la sala sigue existiendo antes de conectar al Paciente
export const validateMeeting = async ({ roomId }) => {
  const url = `${API_BASE_URL}/v2/rooms/validate/${roomId}`;
  const options = {
    method: "GET",
    headers: { 
      Authorization: VIDEOSDK_TOKEN, 
      "Content-Type": "application/json" 
    },
  };

  try {
    const response = await fetch(url, options);
    if (response.status === 400) {
      return { valido: false, err: "Sala inválida o expirada" };
    }
    const data = await response.json();
    return { valido: !!data.roomId, err: null };
  } catch (error) {
    return { valido: false, err: error.message };
  }
};