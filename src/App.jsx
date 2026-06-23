import React, { useState, useEffect } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';
import { supabase } from './supabaseClient';

export default function App() {
  const [session, setSession] = useState(null);
  const [medicoDatos, setMedicoDatos] = useState(null);

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

  if (!session) {
    return <Login />;
  }

  return (
    <Dashboard 
      medico={medicoDatos} 
      onLogout={() => supabase.auth.signOut()} 
      refrescarPerfil={() => session && fetchMedicoDatos(session.user.id)}
    />
  );
}