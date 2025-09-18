
import { getAdminApp } from './firebase-admin';
import type { DecodedIdToken } from 'firebase-admin/auth';

export async function getDecodedUser(req: Request): Promise<DecodedIdToken | null> {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
  if (!token) return null;
  try {
    const adminAuth = getAdminApp().auth();
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch {
    return null;
  }
}

export function assertIsAdmin(decoded: DecodedIdToken | null) {
  if (decoded?.email !== process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
    throw new Error('Not authorized');
  }
}
