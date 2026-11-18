import { NextResponse } from 'next/server';
import { getFriendById, deleteGift, toggleGiftPurchased } from '@/lib/storage';

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
    const { isPurchased, purchasedBy } = body;

    const updated = await toggleGiftPurchased(giftId, Boolean(isPurchased), purchasedBy);
    return NextResponse.json(
      { success: true, data: updated },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar el estado del regalo';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
