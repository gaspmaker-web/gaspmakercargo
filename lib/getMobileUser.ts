import { jwtVerify } from 'jose';

export async function getMobileUser(req: Request): Promise<{ id: string; email: string; name: string; role: string } | null> {
  try {
    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
    const token = authHeader.slice(7);
    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'secret');
    const { payload } = await jwtVerify(token, secret);
    if (!payload.id) return null;
    return { id: payload.id as string, email: payload.email as string, name: payload.name as string, role: payload.role as string };
  } catch {
    return null;
  }
}
