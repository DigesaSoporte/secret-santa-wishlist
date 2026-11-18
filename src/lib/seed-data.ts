import { FriendProfile, GiftItem } from '@/types';

export const INITIAL_FRIENDS: FriendProfile[] = [
  {
    id: 'kenny',
    name: 'Kenny',
    avatar: '🎅',
    pin: '1234',
    bio: '¡Hola! Me encanta la tecnología, el buen café y los videojuegos. Talla de playera M, calzado 41 (8.5 US).',
    dislikes: 'No me gustan los calcetines aburridos ni cosas con fragancias muy fuertes.',
    shirtSize: 'M',
    shoeSize: '41 / 8.5 US',
    createdAt: new Date().toISOString()
  },
  {
    id: 'valeria',
    name: 'Valeria',
    avatar: '🦌',
    pin: '1234',
    bio: 'Fanática de los libros de fantasía, tazas bonitas y los postres de chocolate.',
    dislikes: 'Alérgica a las nueces. Nada de ropa de lana que pique.',
    shirtSize: 'S',
    shoeSize: '37 / 6 US',
    createdAt: new Date().toISOString()
  },
  {
    id: 'carlos',
    name: 'Carlos',
    avatar: '⛄',
    pin: '1234',
    bio: 'Amante del fútbol, ejercicio y termos de agua resistentes para el gimnasio.',
    dislikes: 'No tomo bebidas alcohólicas.',
    shirtSize: 'L',
    shoeSize: '42 / 9 US',
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_GIFTS: GiftItem[] = [
  {
    id: 'gift-1',
    friendId: 'kenny',
    title: 'Audífonos Bluetooth In-Ear con Cancelación de Ruido',
    link: 'https://www.amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80',
    priceEstimate: '$30 - $45 USD',
    priority: 'high',
    notes: 'De preferencia en color negro o azul marino. ¡Para escuchar música programando!',
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'gift-2',
    friendId: 'kenny',
    title: 'Termo / Botella térmica de acero inoxidable (1 Litro)',
    link: 'https://www.mercadolibre.com',
    imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    priceEstimate: '$15 - $20 USD',
    priority: 'medium',
    notes: 'Que mantenga el agua fría o el café caliente.',
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'gift-3',
    friendId: 'kenny',
    title: 'Mousepad Gamer XL antideslizante para escritorio',
    link: 'https://www.amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1616440347437-b1c73416efc2?w=600&auto=format&fit=crop&q=80',
    priceEstimate: '$12 - $18 USD',
    priority: 'low',
    notes: 'Diseño minimalista oscuro o con temática espacial.',
    isPurchased: false,
    createdAt: new Date().toISOString()
  },
  {
    id: 'gift-4',
    friendId: 'valeria',
    title: 'Taza de Cerámica Artesanal Navideña',
    link: 'https://www.amazon.com',
    imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    priceEstimate: '$10 - $15 USD',
    priority: 'high',
    notes: 'Para mis cafés y tés de las mañanas de invierno ☕',
    isPurchased: false,
    createdAt: new Date().toISOString()
  }
];

