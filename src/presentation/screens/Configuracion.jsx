// src/presentation/screens/Configuracion.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from "../../data/supabaseClient";
import { UserRound, Camera, AlertTriangle, Loader2 } from 'lucide-react';

// Mismas constantes de estilo que ProgramarCitas: un solo sistema de diseño en toda la app
const CLASE_CAMPO = "w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm text-slate-700 focus:outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 transition-all";
const CLASE_LABEL = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

const TAMANO_MAXIMO_MB = 2;

export default function Configuracion({ medico, onProfileUpdate, lanzarAlerta }) {
  const [nombre, setNombre] = useState('');
  const [especialidad, setEspecialidad] = useState('');
  const [codigoMedico, setCodigoMedico] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const inputArchivoRef = useRef(null);

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
    if (!medico?.id) return lanzarAlerta("Sesión inválida.", "error");
    setGuardando(true);

    const { error } = await supabase
      .from('perfiles_medicos')
      .update({
        nombre_completo: nombre.trim(),
        especialidad: especialidad.trim(),
        codigo_medico: codigoMedico.trim()
      })
      .eq('id', medico.id);

    if (error) {
      lanzarAlerta("Error al actualizar perfil: " + error.message, "error");
    } else {
      lanzarAlerta("¡Perfil actualizado correctamente!", "success");
      onProfileUpdate();
    }
    setGuardando(false);
  };

  const manejarSubidaFoto = async (e) => {
    const file = e.target.files[0];
    if (!file || !medico?.id) return;

    // Validación en la capa de presentación antes de gastar la subida
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      lanzarAlerta("Solo se permiten imágenes JPG o PNG.", "warning");
      return;
    }
    if (file.size > TAMANO_MAXIMO_MB * 1024 * 1024) {
      lanzarAlerta(`La imagen no debe superar los ${TAMANO_MAXIMO_MB} MB.`, "warning");
      return;
    }

    setSubiendo(true);

    const fileExt = file.name.split('.').pop();
    const fileName = `${medico.id}-${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 1. Subida al Bucket de Supabase Storage
    let { error: uploadError } = await supabase.storage
      .from('vita-assets')
      .upload(filePath, file);

    if (uploadError) {
      lanzarAlerta("Error al subir imagen: " + uploadError.message, "error");
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
      lanzarAlerta("Error al guardar la referencia de la foto: " + updateError.message, "error");
    } else {
      lanzarAlerta("¡Foto de perfil actualizada!", "success");
      onProfileUpdate();
    }
    setSubiendo(false);
  };

  return (
    <div className="p-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Mi Perfil Profesional</h2>
        <form onSubmit={guardarCambios} className="space-y-5">

          {/* Avatar editable */}
          <div className="flex items-center gap-4 mb-4">
            <div className="relative shrink-0">
              {medico?.avatar_url ? (
                <img
                  src={medico.avatar_url}
                  alt={`Foto de perfil de ${medico?.nombre_completo || 'médico'}`}
                  className="w-16 h-16 rounded-full object-cover border border-slate-200"
                />
              ) : (
                // Fallback local: sin depender de servicios externos de placeholder
                <div className="w-16 h-16 rounded-full bg-sky-100 border border-sky-200 flex items-center justify-center">
                  <UserRound className="w-7 h-7 text-sky-600" />
                </div>
              )}
            </div>
            <div>
              {/* Input de archivo oculto, disparado por un botón estilizado */}
              <input
                ref={inputArchivoRef}
                type="file"
                accept="image/jpeg,image/png"
                disabled={subiendo}
                onChange={manejarSubidaFoto}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => inputArchivoRef.current?.click()}
                disabled={subiendo}
                className="inline-flex items-center gap-2 text-xs font-bold text-sky-600 bg-sky-50 hover:bg-sky-100 border border-sky-100 px-3 py-2 rounded-xl transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {subiendo
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Camera className="w-3.5 h-3.5" />}
                {subiendo ? 'Subiendo...' : 'Cambiar foto'}
              </button>
              <p className="text-[10px] text-slate-500 mt-1.5">Formatos permitidos: JPG, PNG. Máx. {TAMANO_MAXIMO_MB} MB.</p>
            </div>
          </div>

          <div>
            <label htmlFor="perfil-nombre" className={CLASE_LABEL}>Nombre Completo</label>
            <input id="perfil-nombre" type="text" required className={CLASE_CAMPO} value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>

          <div>
            <label htmlFor="perfil-especialidad" className={CLASE_LABEL}>Especialidad Médica</label>
            <input id="perfil-especialidad" type="text" className={CLASE_CAMPO} value={especialidad} onChange={e => setEspecialidad(e.target.value)} />
          </div>

          <div>
            <label htmlFor="perfil-codigo" className={CLASE_LABEL}>Código Médico</label>
            <input id="perfil-codigo" type="text" className={CLASE_CAMPO} value={codigoMedico} onChange={e => setCodigoMedico(e.target.value)} />
          </div>

          <div className="flex items-start gap-2.5 bg-amber-50 p-3 rounded-xl border border-amber-100 text-amber-700 text-xs">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>Las credenciales de acceso (correo y contraseña) están gestionadas por el administrador de sistemas y no pueden modificarse desde este panel.</span>
          </div>

          <button
            type="submit"
            disabled={subiendo || guardando}
            className="w-full bg-sky-600 text-white p-3 rounded-xl font-bold text-sm hover:bg-sky-700 transition disabled:bg-slate-300 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 focus-visible:outline-2 focus-visible:outline-sky-700"
          >
            {guardando && <Loader2 className="w-4 h-4 animate-spin" />}
            {guardando ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </div>
    </div>
  );
}
