import { NextResponse } from 'next/server';
import { getAllFriends, createFriend } from '@/lib/storage';

export async function GET() {
  try {
    const friends = await getAllFriends();
    return NextResponse.json({ success: true, data: friends });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error desconocido';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
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

    const created = await createFriend({
      id: finalSlug,
      name: name.trim(),
      avatar: avatar || '🎅',
      pin: pin.toString().trim(),
      bio: bio?.trim() || '',
      dislikes: dislikes?.trim() || '',
      shirtSize: shirtSize?.trim() || '',
      shoeSize: shoeSize?.trim() || ''
    });

    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error al crear la carpeta';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
