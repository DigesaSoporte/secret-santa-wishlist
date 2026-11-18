import { NextResponse } from 'next/server';
import { getFriendById, addGift } from '@/lib/storage';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(request: Request, context: RouteContext) {
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
    const { pin, title, link, imageUrl, priceEstimate, priority, notes } = body;

    // Validar PIN
    if (!pin || pin.toString().trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. Ingresa el PIN correcto de esta carpeta para agregar regalos.' },
        { status: 403 }
      );
    }

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre o título del regalo es obligatorio' },
        { status: 400 }
      );
    }

    const gift = await addGift(id, {
      title: title.trim(),
      link: link?.trim() || '',
      imageUrl: imageUrl || '',
      priceEstimate: priceEstimate?.trim() || '',
      priority: priority || 'medium',
      notes: notes?.trim() || '',
      isPurchased: false
    });

    return NextResponse.json({ success: true, data: gift }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar el regalo';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
