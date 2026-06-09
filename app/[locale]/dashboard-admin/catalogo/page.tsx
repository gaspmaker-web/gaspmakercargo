'use client';
import { createProduct } from '@/actions/product'; // Importamos la acción

export default function CatalogoAdminPage() {
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Agregar Producto al Catálogo</h1>
      
      {/* Usamos la acción directamente en el form */}
      <form action={createProduct} className="space-y-4">
        <input name="title" placeholder="Título del Producto" className="w-full p-2 border rounded" required />
        <input name="price" placeholder="Precio (ej. $39.99)" className="w-full p-2 border rounded" required />
        <input name="imageUrl" placeholder="URL de la Imagen" className="w-full p-2 border rounded" required />
        <input name="affiliateUrl" placeholder="Enlace de Afiliado" className="w-full p-2 border rounded" required />
        
        <select name="category" className="w-full p-2 border rounded">
          <option value="Scanner">Scanner</option>
          <option value="Battery">Battery</option>
          <option value="Diagnostic">Diagnostic</option>
        </select>
        
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-bold hover:bg-blue-700">
          Guardar Producto en Producción
        </button>
      </form>
    </div>
  );
}