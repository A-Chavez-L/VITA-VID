// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './presentation/screens/Login';
import Dashboard from './presentation/screens/Dashboard';
import UnirseSala from "./presentation/screens/UnirseSala";
import LlamadaExterna from "./presentation/screens/LlamadaExterna";
import { supabase } from './data/supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [medicoDatos, setMedicoDatos] = useState(null);
  const [verificandoSesion, setVerificandoSesion] = useState(true);

  const fetchMedicoDatos = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('perfiles_medicos')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setMedicoDatos(data);
      } else {
        const userEmail = (await supabase.auth.getUser()).data.user?.email;
        const nombreInicial = userEmail ? userEmail.split('@')[0] : 'Médico';

        const { data: nuevoPerfil, error: insertError } = await supabase
          .from('perfiles_medicos')
          .insert([{
            id: userId,
            nombre_completo: nombreInicial,
            especialidad: 'Especialista',
            codigo_medico: '0000'
          }])
          .select()
          .single();

        if (insertError) throw insertError;
        setMedicoDatos(nuevoPerfil);
      }
    } catch (err) {
      console.error("Error gestionando el perfil del médico:", err.message);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchMedicoDatos(session.user.id);
      setVerificandoSesion(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchMedicoDatos(session.user.id);
      } else {
        setMedicoDatos(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (verificandoSesion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-sky-500 border-t-transparent mx-auto mb-3"></div>
          <p className="text-xs font-medium text-slate-500">Iniciando VITA...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Ruta para la llamada en ventana externa */}
        <Route path="/llamada" element={<LlamadaExterna />} />

        {/* Ruta pública para pacientes */}
        <Route path="/unirse/:meetingId" element={<UnirseSala />} />

        <Route
          path="/"
          element={
            session ? (
              <Dashboard
                medico={medicoDatos}
                onLogout={() => supabase.auth.signOut()}
                refrescarPerfil={() => session && fetchMedicoDatos(session.user.id)}
              />
            ) : (
              <Login onLogin={() => {}} />
            )
          }
        />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}