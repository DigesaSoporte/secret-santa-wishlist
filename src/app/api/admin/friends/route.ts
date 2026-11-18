import { NextResponse } from 'next/server';
import { getAllFriends, getActivityLogs } from '@/lib/storage';
import { verifyAdmin } from '@/lib/admin-auth';

export async function GET(request: Request) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Acceso no autorizado. Clave de admin incorrecta.' },
      { status: 401 }
    );
  }

  try {
    const friends = await getAllFriends();
    const logs = await getActivityLogs();

    return NextResponse.json({
      success: true,
      data: {
        friends,
        logs
      }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error en admin';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

