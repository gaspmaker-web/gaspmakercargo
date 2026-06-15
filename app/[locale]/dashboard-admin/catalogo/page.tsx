'use client';

import { useRef, useState } from 'react';
import { createProduct } from '../../../../actions/product';

export default function CatalogoAdminPage() {
  // Referencia para poder limpiar el formulario
  const formRef = useRef<HTMLFormElement>(null);
  
  // Estados para controlar la interfaz
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Función que intercepta el envío para darle un comportamiento Enterprise
  const handleAction = async (formData: FormData) => {
    setIsSubmitting(true);
    setShowSuccess(false);

    try {
      // 1. Enviamos los datos a la base de datos (Server Action)
      await createProduct(formData);

      // 2. Limpiamos todos los campos del formulario dejándolo en blanco
      if (formRef.current) {
        formRef.current.reset();
      }

      // 3. Mostramos un mensaje de éxito por 3 segundos
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
      
    } catch (error) {
      console.error("Error al guardar:", error);
      alert("Hubo un error al guardar el producto.");
    } finally {
      // 4. Volvemos a activar el botón
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6 text-gmc-gris-oscuro">Agregar Producto al Catálogo</h1>
      
      {/* Mensaje de Éxito Flotante */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 text-green-700 border border-green-200 rounded-lg shadow-sm">
          <span className="font-bold">¡Producto guardado exitosamente!</span> El formulario está listo para el siguiente artículo.
        </div>
      )}
      
      {/* Conectamos la referencia (ref) y la nueva función (action) */}
      <form ref={formRef} action={handleAction} className="space-y-4">
        <input name="title" placeholder="Título del Producto" className="w-full p-2 border rounded focus:ring-2 focus:ring-gmc-dorado-principal outline-none" required />
        <input name="price" placeholder="Precio (ej. $39.99)" className="w-full p-2 border rounded focus:ring-2 focus:ring-gmc-dorado-principal outline-none" required />
        <input name="imageUrl" placeholder="URL de la Imagen" className="w-full p-2 border rounded focus:ring-2 focus:ring-gmc-dorado-principal outline-none" required />
        <input name="affiliateUrl" placeholder="Enlace de Afiliado" className="w-full p-2 border rounded focus:ring-2 focus:ring-gmc-dorado-principal outline-none" required />
        
        <select name="category" className="w-full p-2 border rounded focus:ring-2 focus:ring-gmc-dorado-principal outline-none" required>
          <option value="">Selecciona una categoría...</option>
          <option value="Scanner">Scanner (Escáner OBDII)</option>
          <option value="Battery">Battery (Baterías)</option>
          <option value="Diagnostic">Diagnostic (Diagnóstico)</option>
          <option value="DashCam">Dash Cam (Cámaras)</option>
          <option value="JumpStarter">Jump Starter (Arrancadores)</option>
          <option value="TireCare">Tire Care (Bombas de Aire/Llantas)</option>
          <option value="CarCare">Car Care (Limpieza/Detailing)</option>
          <option value="Electronics">Electronics (Pantallas/Audio)</option>
          <option value="Lighting">Lighting (Luces/Focos LED)</option>
        </select>
        
        {/* El botón ahora reacciona al estado de "isSubmitting" */}
        <button 
          type="submit" 
          disabled={isSubmitting}
          className="bg-gmc-dorado-principal text-white px-6 py-3 rounded font-bold hover:bg-yellow-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
        >
          {isSubmitting ? 'Guardando producto...' : 'Guardar Producto en Producción'}
        </button>
      </form>
    </div>
  );
}