import { NextResponse } from 'next/server';
import { getFriendById, updateFriend } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const friend = await getFriendById(id);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: friend });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al obtener la carpeta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const friend = await getFriendById(id);

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { pin, ...updates } = body;

    if (!pin || pin.toString().trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. Solo el dueño de la carpeta puede modificarla.' },
        { status: 403 }
      );
    }

    const updated = await updateFriend(id, updates);
    return NextResponse.json({ success: true, data: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al actualizar la carpeta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
