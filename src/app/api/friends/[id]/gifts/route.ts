import { NextResponse } from 'next/server';
import { getFriendById, addGift, addMultipleGifts, createFriend, logActivity } from '@/lib/storage';
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

export async function POST(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const cleanId = decodeURIComponent(id || '').trim();
    const body = await request.json();
    const { pin, gifts, title, link, imageUrl, priceEstimate, priority, notes, friendProfile } = body;

    let friend = await getFriendById(cleanId);

    // Si la lambda serverless de Vercel no tiene la carpeta en su contenedor local,
    // la auto-restaura al vuelo con el perfil del usuario para evitar 404.
    if (!friend && (friendProfile || pin)) {
      try {
        const created = await createFriend({
          id: cleanId,
          name: friendProfile?.name || cleanId,
          avatar: friendProfile?.avatar || '🎅',
          pin: (friendProfile?.pin || pin).toString().trim(),
          bio: friendProfile?.bio || '',
          dislikes: friendProfile?.dislikes || '',
          shirtSize: friendProfile?.shirtSize || '',
          shoeSize: friendProfile?.shoeSize || ''
        });
        friend = { ...created, gifts: [] };
      } catch {
        friend = await getFriendById(cleanId);
      }
    }

    if (!friend) {
      return NextResponse.json(
        { success: false, error: 'Carpeta no encontrada' },
        { status: 404, headers: NO_CACHE_HEADERS }
      );
    }

    // Validar PIN
    if (!pin || pin.toString().trim() !== friend.pin.trim()) {
      return NextResponse.json(
        { success: false, error: 'PIN incorrecto. Ingresa el PIN correcto de esta carpeta.' },
        { status: 403, headers: NO_CACHE_HEADERS }
      );
    }

    // Caso 1: Subida masiva de múltiples regalos / fotos
    if (Array.isArray(gifts) && gifts.length > 0) {
      const formattedItems = gifts.map((item: any, idx: number) => ({
        title: item.title?.trim() || `Regalo #${idx + 1}`,
        link: item.link?.trim() || '',
        imageUrl: item.imageUrl || '',
        priceEstimate: item.priceEstimate?.trim() || '',
        priority: item.priority || 'high',
        notes: item.notes?.trim() || '',
        isPurchased: false
      }));

      const createdList = await addMultipleGifts(friend.id, formattedItems);
      const ip = getClientIp(request);
      const userAgent = getClientUserAgent(request);
      logActivity({
        action: 'SUBIDA_REGALOS_MASIVA',
        targetId: friend.id,
        targetName: friend.name,
        ip,
        userAgent
      }).catch(() => {});

      return NextResponse.json(
        { success: true, count: createdList.length, data: createdList },
        { status: 201, headers: NO_CACHE_HEADERS }
      );
    }

    // Caso 2: Un solo regalo
    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre o título del regalo es obligatorio' },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const gift = await addGift(friend.id, {
      title: title.trim(),
      link: link?.trim() || '',
      imageUrl: imageUrl || '',
      priceEstimate: priceEstimate?.trim() || '',
      priority: priority || 'medium',
      notes: notes?.trim() || '',
      isPurchased: false
    });

    return NextResponse.json(
      { success: true, data: gift },
      { status: 201, headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al guardar';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
