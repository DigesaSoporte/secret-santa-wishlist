import fs from 'fs';
import path from 'path';
import { FriendProfile, GiftItem, FriendWithGifts } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_FRIENDS, INITIAL_GIFTS } from './seed-data';

interface DatabaseSchema {
  friends: FriendProfile[];
  gifts: GiftItem[];
}

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

// Memoria volátil para serverless fallback si fs no puede escribir en Vercel
let memoryDb: DatabaseSchema = {
  friends: [...INITIAL_FRIENDS],
  gifts: [...INITIAL_GIFTS]
};

function readLocalDb(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.warn('Could not read from local db.json, using in-memory state', error);
  }
  return memoryDb;
}

function writeLocalDb(data: DatabaseSchema): void {
  memoryDb = data;
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.warn('Could not persist to local db.json (likely running in read-only serverless)', error);
  }
}

export async function getAllFriends(): Promise<FriendWithGifts[]> {
  if (isSupabaseConfigured() && supabase) {
    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .order('created_at', { ascending: false });

    if (!friendsError && friendsData) {
      const { data: giftsData } = await supabase.from('gifts').select('*');
      const allGifts = (giftsData || []).map((g) => ({
        id: g.id,
        friendId: g.friend_id,
        title: g.title,
        link: g.link,
        imageUrl: g.image_url,
        priceEstimate: g.price_estimate,
        priority: g.priority,
        notes: g.notes,
        isPurchased: g.is_purchased,
        purchasedBy: g.purchased_by,
        createdAt: g.created_at
      })) as GiftItem[];

      return friendsData.map((f) => ({
        id: f.id,
        name: f.name,
        avatar: f.avatar,
        pin: f.pin,
        bio: f.bio,
        dislikes: f.dislikes,
        shirtSize: f.shirt_size,
        shoeSize: f.shoe_size,
        createdAt: f.created_at,
        gifts: allGifts.filter((g) => g.friendId === f.id)
      }));
    }
  }

  // Fallback local
  const db = readLocalDb();
  return db.friends.map((f) => ({
    ...f,
    gifts: db.gifts.filter((g) => g.friendId === f.id)
  }));
}

export async function getFriendById(id: string): Promise<FriendWithGifts | null> {
  const all = await getAllFriends();
  const match = all.find((f) => f.id.toLowerCase() === id.toLowerCase());
  return match || null;
}

export async function createFriend(
  data: Omit<FriendProfile, 'createdAt'>
): Promise<FriendProfile> {
  const newFriend: FriendProfile = {
    ...data,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('friends').insert({
      id: newFriend.id,
      name: newFriend.name,
      avatar: newFriend.avatar,
      pin: newFriend.pin,
      bio: newFriend.bio,
      dislikes: newFriend.dislikes,
      shirt_size: newFriend.shirtSize,
      shoe_size: newFriend.shoeSize,
      created_at: newFriend.createdAt
    });

    if (error) {
      console.error('Supabase createFriend error:', error);
      throw new Error(error.message);
    }
    return newFriend;
  }

  const db = readLocalDb();
  const exists = db.friends.some((f) => f.id.toLowerCase() === newFriend.id.toLowerCase());
  if (exists) {
    throw new Error('Ya existe una carpeta con este identificador.');
  }

  db.friends.unshift(newFriend);
  writeLocalDb(db);
  return newFriend;
}

export async function updateFriend(
  id: string,
  updates: Partial<Omit<FriendProfile, 'id' | 'createdAt'>>
): Promise<FriendProfile> {
  if (isSupabaseConfigured() && supabase) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    if (updates.pin !== undefined) payload.pin = updates.pin;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.dislikes !== undefined) payload.dislikes = updates.dislikes;
    if (updates.shirtSize !== undefined) payload.shirt_size = updates.shirtSize;
    if (updates.shoeSize !== undefined) payload.shoe_size = updates.shoeSize;

    const { error } = await supabase
      .from('friends')
      .update(payload)
      .eq('id', id);

    if (error) throw new Error(error.message);
    const updated = await getFriendById(id);
    if (!updated) throw new Error('Amigo no encontrado');
    return updated;
  }

  const db = readLocalDb();
  const index = db.friends.findIndex((f) => f.id.toLowerCase() === id.toLowerCase());
  if (index === -1) throw new Error('Amigo no encontrado');

  db.friends[index] = { ...db.friends[index], ...updates };
  writeLocalDb(db);
  return db.friends[index];
}

export async function addGift(
  friendId: string,
  giftData: Omit<GiftItem, 'id' | 'friendId' | 'createdAt'>
): Promise<GiftItem> {
  const newGift: GiftItem = {
    ...giftData,
    id: `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    friendId,
    createdAt: new Date().toISOString()
  };

  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('gifts').insert({
      id: newGift.id,
      friend_id: newGift.friendId,
      title: newGift.title,
      link: newGift.link,
      image_url: newGift.imageUrl,
      price_estimate: newGift.priceEstimate,
      priority: newGift.priority,
      notes: newGift.notes,
      is_purchased: Boolean(newGift.isPurchased),
      created_at: newGift.createdAt
    });

    if (error) throw new Error(error.message);
    return newGift;
  }

  const db = readLocalDb();
  db.gifts.unshift(newGift);
  writeLocalDb(db);
  return newGift;
}

export async function addMultipleGifts(
  friendId: string,
  giftsData: Array<Omit<GiftItem, 'id' | 'friendId' | 'createdAt'>>
): Promise<GiftItem[]> {
  const timestamp = Date.now();
  const newGifts: GiftItem[] = giftsData.map((giftData, index) => ({
    ...giftData,
    id: `gift-${timestamp}-${index}-${Math.random().toString(36).substring(2, 7)}`,
    friendId,
    createdAt: new Date().toISOString()
  }));

  if (isSupabaseConfigured() && supabase) {
    const records = newGifts.map((g) => ({
      id: g.id,
      friend_id: g.friendId,
      title: g.title,
      link: g.link,
      image_url: g.imageUrl,
      price_estimate: g.priceEstimate,
      priority: g.priority,
      notes: g.notes,
      is_purchased: Boolean(g.isPurchased),
      created_at: g.createdAt
    }));

    const { error } = await supabase.from('gifts').insert(records);
    if (error) throw new Error(error.message);
    return newGifts;
  }

  const db = readLocalDb();
  db.gifts.unshift(...newGifts);
  writeLocalDb(db);
  return newGifts;
}

export async function deleteGift(giftId: string): Promise<boolean> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase.from('gifts').delete().eq('id', giftId);
    if (error) throw new Error(error.message);
    return true;
  }

  const db = readLocalDb();
  db.gifts = db.gifts.filter((g) => g.id !== giftId);
  writeLocalDb(db);
  return true;
}

export async function toggleGiftPurchased(
  giftId: string,
  isPurchased: boolean,
  purchasedBy?: string
): Promise<GiftItem> {
  if (isSupabaseConfigured() && supabase) {
    const { error } = await supabase
      .from('gifts')
      .update({
        is_purchased: isPurchased,
        purchased_by: purchasedBy || null
      })
      .eq('id', giftId);

    if (error) throw new Error(error.message);
  }

  const db = readLocalDb();
  const gift = db.gifts.find((g) => g.id === giftId);
  if (!gift) throw new Error('Regalo no encontrado');

  gift.isPurchased = isPurchased;
  gift.purchasedBy = purchasedBy;
  writeLocalDb(db);
  return gift;
}

