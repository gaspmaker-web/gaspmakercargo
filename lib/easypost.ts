import EasyPost from '@easypost/api';

// Usamos la variable de entorno
const apiKey = process.env.EASYPOST_API_KEY;

if (!apiKey) {
  console.warn("⚠️ Advertencia: No se detectó EASYPOST_API_KEY. EasyPost fallará si intentas usarlo.");
}

// Inicializamos el cliente (ponemos string vacío si falla para evitar crash en build time)
const easypost = new EasyPost(apiKey || 'TEST_KEY_PLACEHOLDER');

export default easypost;