"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Loader2, CheckCircle } from 'lucide-react';

export default function InvoiceUploadForm({ packageId, currentInvoice }: { packageId: string, currentInvoice: string | null }) {
    const router = useRouter();
    const [uploading, setUploading] = useState(false);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            // 1. Subir a Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default');
            
            const cloudRes = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`, {
                method: 'POST',
                body: formData
            });
            const cloudJson = await cloudRes.json();
            
            if (cloudJson.secure_url) {
                // 2. Guardar URL en Base de Datos
                const dbRes = await fetch('/api/packages/update-invoice', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ packageId, invoiceUrl: cloudJson.secure_url })
                });

                if (dbRes.ok) {
                    alert("Factura actualizada correctamente.");
                    router.refresh();
                }
            }
        } catch (error) {
            console.error(error);
            alert("Error al subir.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <input 
                type="file" 
                id="invoice-upload" 
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={handleUpload}
                disabled={uploading}
            />
            
            <label 
                htmlFor="invoice-upload"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-blue-200 text-blue-600 font-bold rounded-lg cursor-pointer hover:bg-blue-50 transition shadow-sm"
            >
                {uploading ? <Loader2 className="animate-spin" size={18}/> : <Upload size={18}/>}
                {currentInvoice ? 'Replace Invoice' : 'Upload Invoice'}
            </label>
        </div>
    );
}