import { NextResponse } from 'next/server';
import { getFriendById, deleteGift, toggleGiftPurchased, updateGift } from '@/lib/storage';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

interface RouteContext {
  params: Promise<{ id: string; giftId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id, giftId } = await context.params;
    const cleanId = decodeURIComponent(id || '').trim();
    const friend = await getFriendById(cleanId);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');

    if (!pin || pin.trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. No puedes eliminar este regalo.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    await deleteGift(giftId);
    return NextResponse.json(
      { success: true, message: 'Regalo eliminado con éxito' },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar el regalo';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, giftId } = await context.params;
    const cleanId = decodeURIComponent(id || '').trim();
    const friend = await getFriendById(cleanId);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    const body = await request.json();
    const { pin, ...updates } = body;

    // Caso 1: Toggle de apartado / reservado (hecho de forma anónima por un amigo)
    if (updates.isPurchased !== undefined && updates.title === undefined && updates.notes === undefined) {
      const updated = await toggleGiftPurchased(giftId, Boolean(updates.isPurchased), updates.purchasedBy);
      return NextResponse.json(
        { success: true, data: updated },
        { headers: NO_CACHE_HEADERS }
      );
    }

    // Caso 2: Edición completa de datos del regalo (solo el dueño con su PIN)
    if (!pin || pin.toString().trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. Solo el dueño de la carpeta puede editar este regalo.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    if (updates.title !== undefined && !updates.title.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre o título del regalo no puede estar vacío.' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const updated = await updateGift(giftId, updates);
    return NextResponse.json(
      { success: true, data: updated },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar el regalo';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
