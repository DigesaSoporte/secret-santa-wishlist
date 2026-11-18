import { NextResponse } from 'next/server';
import { getFriendById, addGift, addMultipleGifts } from '@/lib/storage';

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
    const { pin, gifts, title, link, imageUrl, priceEstimate, priority, notes } = body;

    // Validar PIN
    if (!pin || pin.toString().trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. Ingresa el PIN correcto de esta carpeta.' },
        { status: 403 }
      );
    }

    // Caso 1: Subida masiva de múltiples regalos / fotos
    if (Array.isArray(gifts) && gifts.length > 0) {
      const formattedItems = gifts.map((item: any, idx: number) => ({
        title: item.title?.trim() || `Regalo / Idea #${idx + 1}`,
        link: item.link?.trim() || '',
        imageUrl: item.imageUrl || '',
        priceEstimate: item.priceEstimate?.trim() || '',
        priority: item.priority || 'high',
        notes: item.notes?.trim() || '',
        isPurchased: false
      }));

      const createdList = await addMultipleGifts(id, formattedItems);
      return NextResponse.json({ success: true, count: createdList.length, data: createdList }, { status: 201 });
    }

    // Caso 2: Un solo regalo
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
    const message = error instanceof Error ? error.message : 'Error al guardar';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
