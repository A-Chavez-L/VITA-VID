import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';

export default function Configuracion({ medico, onProfileUpdate }) {
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [codigoMedico, setCodigoMedico] = useState('');
  const [subiendo, setSubiendo] = useState(false);

  // Sincronizar el estado interno cuando los datos del médico carguen
  useEffect(() => {
    if (medico) {
      setNombre(medico.nombre_completo || '');
      setEspecialidad(medico.especialidad || '');
      setCodigoMedico(medico.codigo_medico || '');
    }
  }, [medico]);

const guardarCambios = async (e) => {
  e.preventDefault();
  if (!medico?.id) return alert("Sesión inválida.");

  const { error } = await supabase
    .from('perfiles_medicos')
    .update({ 
      nombre_completo: nombre, 
      especialidad: especialidad, 
      codigo_medico: codigoMedico 
    })
    .eq('id', medico.id);

  if (error) {
    alert("Error al actualizar perfil: " + error.message);
  } else {
    alert("¡Perfil actualizado correctamente!");
    onProfileUpdate();
  }
};

  const manejarSubidaFoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !medico?.id) return;
    setSubiendo(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${medico.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 1. Subida al Bucket de Supabase Storage
    let { error: uploadError } = await supabase.storage
      .from('vita-assets')
      .upload(filePath, file);

    if (uploadError) {
      alert("Error al subir imagen: " + uploadError.message);
      setSubiendo(false);
      return;
    }

    // 2. Traer la URL Pública generada
    const { data } = supabase.storage.from('vita-assets').getPublicUrl(filePath);

    // 3. Registrar la URL en la tabla del médico
    const { error: updateError } = await supabase
      .from('perfiles_medicos')
      .update({ avatar_url: data.publicUrl })
      .eq('id', medico.id);

    if (updateError) {
      alert("Error al guardar la referencia de la foto: " + updateError.message);
    } else {
      alert("¡Foto de perfil actualizada!");
      onProfileUpdate();
    }
    setSubiendo(false);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Mi Perfil Profesional</h2>
        <form onSubmit={guardarCambios} className="space-y-4">
          
          {/* Avatar editable */}
          <div className="flex items-center gap-4 mb-4">
            <img 
              src={medico?.avatar_url || 'https://via.placeholder.com/150'} 
              alt="Avatar" 
              className="w-16 h-16 rounded-full object-cover border border-slate-200" 
            />
            <div>
              <input type="file" accept="image/*" disabled={subiendo} onChange={manejarSubidaFoto} className="text-xs text-slate-500" />
              <p className="text-[10px] text-slate-400 mt-1">Formatos permitidos: JPG, PNG. {subiendo && "(Subiendo...)"}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Nombre Completo</label>
            <input type="text" required className="w-full p-2 border border-slate-200 rounded-xl" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Especialidad Médica</label>
            <input type="text" className="w-full p-2 border border-slate-200 rounded-xl" value={especialidad} onChange={e => setEspecialidad(e.target.value)} />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Código Médico</label>
            <input type="text" className="w-full p-2 border border-slate-200 rounded-xl" value={codigoMedico} onChange={e => setCodigoMedico(e.target.value)} />
          </div>

          <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-700 text-xs">
            ⚠️ Las credenciales de acceso (correo y contraseña) están gestionadas por el administrador de sistemas y no pueden modificarse desde este panel.
          </div>

          <button type="submit" disabled={subiendo} className="w-full bg-sky-600 text-white p-3 rounded-xl font-bold hover:bg-sky-700 transition disabled:bg-slate-300">
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}