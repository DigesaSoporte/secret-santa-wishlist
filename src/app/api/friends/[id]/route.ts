import { NextResponse } from 'next/server';
import { getFriendById, updateFriend, logActivity } from '@/lib/storage';
import { getClientIp, getClientUserAgent } from '@/lib/ip-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cleanId = decodeURIComponent(id || '').trim();
    const friend = await getFriendById(cleanId);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    return NextResponse.json(
      { success: true, data: friend },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener la carpeta';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cleanId = decodeURIComponent(id || '').trim();
    const friend = await getFriendById(cleanId);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json();
    const { pin, newPin, ...updates } = body;

    if (!pin || pin.toString().trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. Solo el dueño de la carpeta puede modificarla.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    if (newPin) {
      if (newPin.toString().trim().length < 4) {
        return NextResponse.json(
          { success: false, error: 'El nuevo PIN debe tener al menos 4 dígitos.' },
          { status: 400, headers: NO_CACHE_HEADERS }
        );
      }
      updates.pin = newPin.toString().trim();
    }

    const updated = await updateFriend(friend.id, updates);

    const ip = getClientIp(request);
    const userAgent = getClientUserAgent(request);
    logActivity({
      action: 'EDITAR_PERFIL',
      targetId: friend.id,
      targetName: updated.name,
      ip,
      userAgent
    }).catch(() => {});

    return NextResponse.json(
      { success: true, data: updated },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar la carpeta';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
