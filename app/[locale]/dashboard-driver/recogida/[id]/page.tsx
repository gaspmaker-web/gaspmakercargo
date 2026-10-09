"use client";

import { useState } from 'react';
import { Camera, Loader2, UploadCloud, ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

export default function PickupCapturePage({ params }: { params: { id: string, locale: string } }) {
  const [step, setStep] = useState<'pin' | 'photo'>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePinSubmit = () => {
    if (pin.length !== 4) { setPinError('Enter the 4-digit PIN'); return; }
    setPinError('');
    setStep('photo');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = async () => {
    if (!file) return alert("Please take the pickup photo");
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "ml_default");

      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });

      if (!uploadRes.ok) throw new Error("Image upload failed");

      const uploadData = await uploadRes.json();
      const photoUrl = uploadData.secure_url;

      const res = await fetch('/api/driver/complete-pickup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pickupId: params.id, photoUrl, pin })
      });

      if (res.ok) {
        window.location.href = `/${params.locale}/dashboard-driver/tareas/${params.id}`;
      } else {
        const errorData = await res.json();
        if (res.status === 403) {
          setStep('pin');
          setPin('');
          setPinError('Incorrect PIN. Try again.');
          setFile(null);
          setPreview(null);
        } else {
          alert(`Error: ${errorData.error || 'Try again'}`);
        }
      }
    } catch (e) {
      console.error(e);
      alert("Connection error. Check your internet and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col p-6 font-montserrat text-white">

      <div className="flex items-center gap-4 mb-6">
        <Link href={`/${params.locale}/dashboard-driver/tareas/${params.id}`} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
          <ArrowLeft size={20} className="text-white"/>
        </Link>
        <h1 className="text-xl font-bold">Pickup Evidence</h1>
      </div>

      {step === 'pin' ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-full max-w-sm bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6">
            <KeyRound size={48} className="text-gmc-dorado-principal"/>
            <div className="text-center">
              <h2 className="text-lg font-bold mb-1">Store PIN Required</h2>
              <p className="text-gray-400 text-sm">Ask the store for the 4-digit pickup PIN to confirm collection.</p>
            </div>

            <input
              type="number"
              inputMode="numeric"
              value={pin}
              onChange={e => { if (e.target.value.length <= 4) setPin(e.target.value); }}
              placeholder="• • • •"
              className="w-40 text-center text-3xl font-bold tracking-[0.5em] bg-gray-700 border-2 border-gray-600 rounded-xl px-4 py-4 text-white focus:border-gmc-dorado-principal outline-none"
            />

            {pinError && <p className="text-red-400 text-sm font-bold">{pinError}</p>}

            <button
              onClick={handlePinSubmit}
              className="w-full py-4 rounded-xl font-bold text-lg bg-gmc-dorado-principal text-black hover:bg-yellow-400 active:scale-95 transition flex items-center justify-center gap-2"
            >
              <CheckCircle size={20}/> VERIFY PIN
            </button>
          </div>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-6 text-center text-sm">Take a clear photo of the package at the time of pickup.</p>

          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-full max-w-sm aspect-[3/4] bg-gray-800 rounded-2xl border-2 border-dashed border-gray-600 flex flex-col items-center justify-center relative overflow-hidden mb-8 shadow-2xl">
              {preview ? (
                <Image src={preview} alt="Preview" fill className="object-cover" />
              ) : (
                <label className="flex flex-col items-center cursor-pointer p-10 w-full h-full justify-center hover:bg-gray-700/50 transition">
                  <Camera size={48} className="text-gmc-dorado-principal mb-3 opacity-80"/>
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Tap to open camera</span>
                  <input type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />
                </label>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading || !file}
              className={`w-full max-w-sm py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg active:scale-95 ${loading || !file ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gmc-dorado-principal text-black hover:bg-yellow-400'}`}
            >
              {loading ? <Loader2 className="animate-spin"/> : <UploadCloud />}
              {loading ? "SAVING..." : "CONFIRM & SAVE"}
            </button>

            {!loading && file && (
              <button onClick={() => { setFile(null); setPreview(null); }} className="mt-4 text-sm text-red-400 hover:text-red-300 font-medium">
                Delete and retake
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
