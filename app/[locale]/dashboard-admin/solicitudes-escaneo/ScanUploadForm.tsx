"use client";

import React, { useState } from 'react';
import { Camera, Loader2, CheckCircle2, UploadCloud } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { jsPDF } from 'jspdf';

interface ScanProps {
  mailItemId?: string;      
  id?: string;              
  type?: 'PACKAGE' | 'CONSOLIDATED'; 
}

export default function ScanUploadForm({ mailItemId, id, type }: ScanProps) {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔥 EL EXPRIMIDOR: Reduce el peso de las fotos del móvil de 5MB a 150KB
  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (e) => {
              const img = new Image();
              img.src = e.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  // Reducimos el ancho a 800px (Tamaño ideal y súper ligero para documentos)
                  const MAX_WIDTH = 800; 
                  let width = img.width;
                  let height = img.height;

                  if (width > MAX_WIDTH) {
                      height = Math.round((height * MAX_WIDTH) / width);
                      width = MAX_WIDTH;
                  }

                  canvas.width = width;
                  canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  
                  if (ctx) {
                      ctx.fillStyle = '#FFFFFF'; // Arregla el bug de los PNGs de Mac
                      ctx.fillRect(0, 0, width, height);
                      ctx.drawImage(img, 0, 0, width, height);
                      // 0.6 = 60% de calidad JPEG (suficiente para leer, peso pluma)
                      resolve(canvas.toDataURL('image/jpeg', 0.6));
                  } else {
                      resolve(img.src);
                  }
              };
              img.onerror = reject;
          };
          reader.onerror = reject;
      });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);
    try {
        let finalFile: File;

        if (files.length === 1 && (files[0].type === 'application/pdf' || files[0].name.toLowerCase().endsWith('.pdf'))) {
            finalFile = files[0];
        } 
        else {
            const pdf = new jsPDF('p', 'px', 'letter');
            let pagesAdded = 0;

            for (let i = 0; i < files.length; i++) {
                const file = files[i];
                if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) continue;

                try {
                    // 🔥 Pasamos cada foto por el exprimidor antes de ponerla en el PDF
                    const compressedImgData = await compressImage(file);
                    const imgProps = pdf.getImageProperties(compressedImgData);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

                    if (pagesAdded > 0) {
                        pdf.addPage();
                    }
                    
                    // Ahora podemos usar JPEG y FAST tranquilamente porque la imagen ya viene comprimida y limpia
                    pdf.addImage(compressedImgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, `img_${i}`, 'FAST');
                    pagesAdded++;
                } catch (imgError) {
                    console.error("Error al procesar la imagen:", imgError);
                }
            }
            
            if (pagesAdded === 0) {
                alert("No se seleccionaron imágenes válidas.");
                setIsUploading(false);
                return;
            }

            const pdfBlob = pdf.output('blob');
            finalFile = new File([pdfBlob], `Documento_${Date.now()}.pdf`, { type: 'application/pdf' });
        }

        const formData = new FormData();
        formData.append('file', finalFile);

        let apiEndpoint = '';

        if (mailItemId) {
            formData.append('mailItemId', mailItemId);
            apiEndpoint = '/api/admin/bodega/subir-escaneo';
        } else if (id && type) {
            formData.append('id', id);
            formData.append('type', type);
            apiEndpoint = '/api/admin/bodega/subir-awb';
        }

        const res = await fetch(apiEndpoint, {
            method: 'POST',
            body: formData,
        });

        if (res.ok) {
            setSuccess(true);
            setTimeout(() => {
                setSuccess(false);
                router.refresh();
            }, 1500);
        } else {
            const errorData = await res.json();
            alert(`❌ Error: ${errorData.error || 'No se pudo subir. Intenta con menos fotos.'}`);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("⚠️ Error procesando el documento.");
    } finally {
        setIsUploading(false);
        e.target.value = ''; // Permite volver a seleccionar los mismos archivos
    }
  };

  if (success) {
      return (
          <div className={mailItemId 
              ? "flex items-center justify-center gap-2 text-green-700 font-bold text-sm bg-green-50 px-4 py-3 rounded-lg border border-green-200"
              : "text-green-600 font-bold text-[10px] flex items-center justify-center gap-1"
          }>
              <CheckCircle2 size={mailItemId ? 18 : 12} className="text-green-600" /> 
              {mailItemId ? "¡PDF Enviado!" : "¡AWB LISTO!"}
          </div>
      );
  }

  return (
    <label className={mailItemId 
        ? "cursor-pointer bg-slate-900 hover:bg-black text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm active:scale-95 w-full md:w-auto"
        : "inline-flex items-center gap-1.5 bg-gray-50 text-gray-400 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-dashed border-gray-300 hover:bg-gray-100 hover:text-blue-600 transition-all cursor-pointer"
    }>
        <input 
            type="file" 
            multiple 
            accept="image/*,application/pdf" 
            className="hidden" 
            onChange={handleFileUpload} 
            disabled={isUploading} 
        />
        {isUploading ? (
            <Loader2 size={mailItemId ? 18 : 14} className="animate-spin text-blue-400" />
        ) : (
            mailItemId ? <Camera size={18} className="text-blue-400" /> : <UploadCloud size={14} />
        )}
        {isUploading 
            ? (mailItemId ? "Comprimiendo PDF..." : "PROCESANDO...") 
            : (mailItemId ? "Escanear con Cámara" : "SUBIR AWB")
        }
    </label>
  );
}