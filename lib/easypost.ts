import EasyPost from '@easypost/api';
import { getTenantEasyPost } from '@/lib/tenant-easypost';

// Cliente EasyPost default (GaspMaker) — para compatibilidad
const apiKey = process.env.EASYPOST_API_KEY;

if (!apiKey) {
  console.warn("⚠️ Advertencia: No se detectó EASYPOST_API_KEY.");
}

const easypost = new EasyPost(apiKey || 'TEST_KEY_PLACEHOLDER');

export default easypost;
export { getTenantEasyPost };