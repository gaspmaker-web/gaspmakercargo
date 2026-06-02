"use client";

import { useState, useRef } from "react";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { registrarUsuario } from "@/app/actions/auth";

export default function FormularioRegistro() {
  const [turnstileToken, setTurnstileToken] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [notificacion, setNotificacion] = useState<{ tipo: "error" | "exito"; texto: string } | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNotificacion(null);

    if (!turnstileToken) {
      setNotificacion({ tipo: "error", texto: "Es necesario completar la validación de seguridad." });
      return;
    }

    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("turnstileToken", turnstileToken);

    const resultado = await registrarUsuario(formData);

    if (resultado.error) {
      setNotificacion({ tipo: "error", texto: resultado.error });
      turnstileRef.current?.reset();
      setTurnstileToken("");
    } else if (resultado.success) {
      setNotificacion({ tipo: "exito", texto: resultado.message! });
      e.currentTarget.reset();
    }

    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 max-w-md mx-auto p-6 bg-white shadow-lg rounded-xl border border-gray-100">
      <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Crear una cuenta</h2>
      
      <div style={{ display: "none", position: "absolute", left: "-9999px" }} aria-hidden="true">
        <label htmlFor="address-field">Por favor, ignora este campo si eres un usuario real:</label>
        <input type="text" id="address-field" name="address-field" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Correo Electrónico</label>
        <input 
          type="email" 
          name="email"
          required 
          className="border border-gray-300 p-2.5 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          placeholder="ejemplo@correo.com"
        />
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium text-gray-700">Contraseña</label>
        <input 
          type="password" 
          name="password"
          required 
          className="border border-gray-300 p-2.5 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" 
          placeholder="••••••••"
        />
      </div>

      {notificacion && (
        <div className={`p-3 rounded-lg text-sm font-medium ${notificacion.tipo === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-800 border border-green-200"}`}>
          {notificacion.texto}
        </div>
      )}

      <div className="flex justify-center my-1">
        <Turnstile
          ref={turnstileRef}
          siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY!}
          onSuccess={(token) => setTurnstileToken(token)}
        />
      </div>

      <button 
        type="submit" 
        disabled={loading}
        className="bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500 transition-all mt-2 shadow-sm"
      >
        {loading ? "Procesando solicitud..." : "Registrarse"}
      </button>
    </form>
  );
}