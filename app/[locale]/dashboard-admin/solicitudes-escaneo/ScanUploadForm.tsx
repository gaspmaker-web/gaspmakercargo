"use client";

import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle2 } from 'lucide-react'; // Mantenemos tu ícono de cámara
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf'; // 🔥 Importamos el motor

export default function ScanUploadForm({ mailItemId }: { mailItemId: string }) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔥 Función auxiliar: Lee el archivo de imagen como Base64 para el PDF
  const readFileAsDataURL = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Array.from atrapa si el usuario seleccionó 1 o 20 archivos
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
        let finalFile: File;

        // CASO 1: Si subió un PDF ya hecho (ej. app de escaner externa)
        if (files.length === 1 && files[0].type === 'application/pdf') {
            finalFile = files[0];
        } 
        // CASO 2: Si subió una o múltiples imágenes, armamos la Grapadora Digital
        else {
            const pdf = new jsPDF('p', 'px', 'letter'); // Hoja tamaño carta, vertical
            
            let pagesAdded = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (!file.type.startsWith('image/')) continue;

                const imgData = await readFileAsDataURL(file);
                const imgProps = pdf.getImageProperties(imgData);
                const pdfWidth = pdf.internal.pageSize.getWidth();
                // Ajustamos la altura de la foto para que encaje perfecto a lo ancho
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                // Si ya pegamos una hoja, agregamos una página nueva al PDF
                if (pagesAdded > 0) {
                    pdf.addPage();
                }
                
                // Incrusta la foto en el PDF con compresión rápida
                pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
                pagesAdded++;
            }
            
            const pdfBlob = pdf.output('blob');
            // Retorna el nuevo archivo PDF multipágina listo para subir
            finalFile = new File([pdfBlob], `Scan_${Date.now()}.pdf`, { type: 'application/pdf' });
        }

        const formData = new FormData();
        formData.append('mailItemId', mailItemId);
        formData.append('file', finalFile); // Enviamos el PDF resultante

        const res = await fetch('/api/admin/bodega/subir-escaneo', {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            setSuccess(true);
            setTimeout(() => {
                router.refresh();
            }, 1500);
        } else {
            const data = await res.json();
            alert(`❌ Error: ${data.error || 'No se pudo subir el archivo.'}`);
        }
    } catch (error) {
        console.error("Error al procesar el documento:", error);
        alert("⚠️ Error al procesar las imágenes o conectar al servidor.");
    } finally {
        setIsUploading(false);
    }
  };

  if (success) {
      return (
          <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm bg-green-50 px-4 py-3 rounded-lg border border-green-200 shadow-sm animate-in fade-in">
              <CheckCircle2 size={18} className="text-green-600" /> ¡PDF Generado y Enviado!
          </div>
      );
  }

  return (
    <label className="cursor-pointer bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 w-full md:w-auto">
        <input 
            type="file" 
            multiple // 🔥 Agregado para soportar múltiples fotos
            accept="application/pdf, image/jpeg, image/png" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={isUploading} 
        />
        {isUploading ? <Loader2 size={18} className="animate-spin text-blue-400" /> : <Camera size={18} className="text-blue-400" />}
        {isUploading ? "Creando PDF..." : "Escanear con Cámara"}
    </label>
  );
}