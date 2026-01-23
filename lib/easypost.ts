import EasyPost from '@easypost/api';

// Verificamos que la clave exista para evitar errores silenciosos
const apiKey = process.env.EASYPOST_API_KEY;

if (!apiKey) {
  throw new Error("❌ Error Crítico: Falta la variable EASYPOST_API_KEY en .env.local");
}

// Inicializamos el cliente
const easypost = new EasyPost(apiKey);

export default easypost;