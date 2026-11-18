import { NextResponse } from 'next/server';
import { getAllFriends, createFriend, logActivity } from '@/lib/storage';
import { getClientIp, getClientUserAgent } from '@/lib/ip-utils';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  Pragma: 'no-cache',
  Expires: '0'
};

export async function GET() {
  try {
    const friends = await getAllFriends();
    return NextResponse.json(
      { success: true, data: friends },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json(
      { success: false, error: message },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, avatar, pin, bio, dislikes, shirtSize, shoeSize } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'El nombre es obligatorio' },
        { status: 400 }
      );
    }

    if (!pin || pin.toString().trim().length < 4) {
      return NextResponse.json(
        { success: false, error: 'El PIN debe ser de al menos 4 dígitos para proteger tu lista' },
        { status: 400 }
      );
    }

    // Generar un ID limpio / slug a partir del nombre
    const baseSlug = name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '-');

    const existingFriends = await getAllFriends();
    let finalSlug = baseSlug || 'amigo';
    let counter = 1;
    while (existingFriends.some((f) => f.id === finalSlug)) {
      counter++;
      finalSlug = `${baseSlug}-${counter}`;
    }

    const ip = getClientIp(request);
    const userAgent = getClientUserAgent(request);

    const created = await createFriend({
      id: finalSlug,
      name: name.trim(),
      avatar: avatar || '🎅',
      pin: pin.toString().trim(),
      bio: bio?.trim() || '',
      dislikes: dislikes?.trim() || '',
      shirtSize: shirtSize?.trim() || '',
      shoeSize: shoeSize?.trim() || '',
      ipAddress: ip,
      userAgent: userAgent
    });

    logActivity({
      action: 'CREAR_CARPETA',
      targetId: finalSlug,
      targetName: name.trim(),
      ip,
      userAgent
    }).catch(() => {});

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear la carpeta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
