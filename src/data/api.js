const API_BASE_URL = "https://api.videosdk.live";

const VIDEOSDK_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlrZXkiOiIxYzNiZWU0ZS0wOGJiLTQ4MTYtODVlMC03ZGFiYjc3NTBlMTUiLCJwZXJtaXNzaW9ucyI6WyJhbGxvd19qb2luIl0sInJvbGVzIjpbInJ0YyJdLCJpYXQiOjE3ODI1MjExNzksImV4cCI6MTc4NTExMzE3OX0.1QOIUeqMjoS63gfsZovT0TcsPLPP0S1ovLfC61wmQPQ";

export const getToken = () => {
  return VIDEOSDK_TOKEN;
};

export const createMeeting = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/v2/rooms`, {
      method: "POST",
      headers: {
        Authorization: VIDEOSDK_TOKEN,
        "Content-Type": "application/json",
      },
    });
    const data = await response.json();
    if (data.roomId) {
      console.log("✅ Sala creada:", data.roomId);
      return data.roomId;
    }
    console.error("❌ Error:", data);
    return null;
  } catch (error) {
    console.error("❌ Error de red:", error);
    return null;
  }
};

export const validateMeeting = async ({ roomId }) => {
  try {
    const response = await fetch(`${API_BASE_URL}/v2/rooms/validate/${roomId}`, {
      method: "GET",
      headers: {
        Authorization: VIDEOSDK_TOKEN,
        "Content-Type": "application/json",
      },
    });
    if (response.status === 400) {
      return { valido: false, err: "Sala inválida o expirada" };
    }
    const data = await response.json();
    return { valido: !!data.roomId, err: null };
  } catch (error) {
    return { valido: false, err: error.message };
  }
};