"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Loader2, UploadCloud, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PickupCapturePage({ params }: { params: { id: string, locale: string } }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Manejar selección de archivo (Cámara o Galería)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert("Por favor toma la foto de recogida");
    setLoading(true);

    try {
      // 1. SUBIR A CLOUDINARY
      const formData = new FormData();
      formData.append("file", file);
      
      // Usamos 'ml_default' como vimos en tu configuración
      formData.append("upload_preset", "ml_default"); 

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      
      if (!uploadRes.ok) {
        console.error("Error Cloudinary:", await uploadRes.text());
        throw new Error("Falló la subida de la imagen");
      }
      
      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.secure_url;

      // 2. GUARDAR EN BACKEND
      const res = await fetch('/api/driver/complete-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            pickupId: params.id, 
            photoUrl: photoUrl 
        })
      });

      if (res.ok) {
        // 🚀 EL SECRETO: Usamos window.location.href
        // Esto fuerza una recarga real, asegurando que el Paso 2 se desbloquee al instante.
        // Al usar esto, eliminamos el problema de caché que te obligaba a refrescar.
        window.location.href = `/${params.locale}/dashboard-driver/tareas/${params.id}`;
      } else {
        const errorData = await res.json();
        alert(`Error al guardar: ${errorData.error || 'Intenta de nuevo'}`);
      }

    } catch (e) {
      console.error(e);
      alert("Error de conexión. Verifica tu internet e intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col p-6 font-montserrat text-white">
      
      {/* HEADER DE NAVEGACIÓN */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${params.locale}/dashboard-driver/tareas/${params.id}`} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
            <ArrowLeft size={20} className="text-white"/>
        </Link>
        <h1 className="text-xl font-bold">Evidencia de Recogida</h1>
      </div>

      <p className="text-gray-400 mb-6 text-center text-sm">
        Toma una foto clara del paquete al momento de recogerlo.
      </p>

      {/* ÁREA DE CÁMARA */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="w-full max-w-sm aspect-[3/4] bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-2xl">
            {preview ? (
                <Image src={preview} alt="Preview" fill className="object-cover" />
            ) : (
                <label className="flex flex-col items-center cursor-pointer p-10 w-full h-full justify-center hover:bg-gray-700/50 transition">
                    <Camera size={48} className="text-gmc-dorado-principal mb-3 opacity-80"/>
                    <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tocar para abrir cámara</span>
                    <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                </label>
            )}
        </div>

        {/* BOTÓN DE ACCIÓN */}
        <button 
            onClick={handleSubmit}
            disabled={loading || !file}
            className={`w-full max-w-sm py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${loading || !file ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gmc-dorado-principal text-black hover:bg-yellow-400'}`}
        >
            {loading ? <Loader2 className="animate-spin"/> : <UploadCloud />}
            {loading ? "GUARDANDO..." : "CONFIRMAR Y GUARDAR"}
        </button>

        {!loading && file && (
            <button onClick={() => { setFile(null); setPreview(null); }} className="mt-4 text-sm text-red-400 hover:text-red-300 font-medium">
                Borrar y tomar otra
            </button>
        )}
      </div>
    </div>
  );
}