import { NextResponse } from 'next/server';
import { deleteFriend, logActivity, getFriendById } from '@/lib/storage';
import { verifyAdmin } from '@/lib/admin-auth';
import { getClientIp, getClientUserAgent } from '@/lib/ip-utils';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  if (!verifyAdmin(request)) {
    return NextResponse.json(
      { success: false, error: 'Acceso no autorizado' },
      { status: 401 }
    );
  }

  try {
    const { id } = await context.params;
    const friend = await getFriendById(id);

    await deleteFriend(id);

    const ip = getClientIp(request);
    const userAgent = getClientUserAgent(request);

    logActivity({
      action: 'ADMIN_ELIMINAR_CARPETA',
      targetId: id,
      targetName: friend?.name || id,
      ip,
      userAgent
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Carpeta ${id} eliminada con éxito`
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar carpeta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

