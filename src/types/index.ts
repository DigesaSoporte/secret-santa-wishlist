export interface FriendProfile {
  id: string;
  name: string;
  avatar: string;
  pin: string; // 4 dígitos o contraseña corta para editar
  bio?: string;
  dislikes?: string;
  shirtSize?: string;
  shoeSize?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface GiftItem {
  id: string;
  friendId: string;
  title: string;
  link?: string;
  imageUrl?: string;
  priceEstimate?: string;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  isPurchased?: boolean;
  purchasedBy?: string;
  createdAt: string;
}

export interface FriendWithGifts extends FriendProfile {
  gifts: GiftItem[];
}

export interface ActivityLog {
  id: string;
  action: string;
  targetId?: string;
  targetName?: string;
  ip: string;
  userAgent: string;
  createdAt: string;
}
