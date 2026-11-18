import { NextResponse } from 'next/server';
import { getFriendById, deleteGift, toggleGiftPurchased } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string; giftId: string }>;
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const { id, giftId } = await context.params;
    const friend = await getFriendById(id);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const pin = searchParams.get('pin');

    if (!pin || pin.trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. No puedes eliminar este regalo.' },
        { status: 403 }
      );
    }

    await deleteGift(giftId);
    return NextResponse.json({ success: true, message: 'Regalo eliminado con éxito' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al eliminar el regalo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id, giftId } = await context.params;
    const friend = await getFriendById(id);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { isPurchased, purchasedBy } = body;

    const updated = await toggleGiftPurchased(giftId, Boolean(isPurchased), purchasedBy);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar el estado del regalo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
