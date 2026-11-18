import fs from 'fs';
import path from 'path';
import os from 'os';
import { FriendProfile, GiftItem, FriendWithGifts, ActivityLog, RecentGiftNotification } from '@/types';
import { supabase, isSupabaseConfigured } from './supabase';
import { INITIAL_FRIENDS, INITIAL_GIFTS } from './seed-data';

interface DatabaseSchema {
  friends: FriendProfile[];
  gifts: GiftItem[];
  logs?: ActivityLog[];
}

// Ruta escribible en Vercel Serverless (/tmp) o local (data/db.json)
const isVercel = Boolean(process.env.VERCEL);
const DB_PATH = isVercel
  ? path.join(os.tmpdir(), 'secret_santa_db.json')
  : path.join(process.cwd(), 'data', 'db.json');

// Vercel KV / Upstash Redis support
const kvUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const kvToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
const isKvConfigured = Boolean(kvUrl && kvToken);

async function kvGet<T>(key: string): Promise<T | null> {
  if (!isKvConfigured) return null;
  try {
    const res = await fetch(`${kvUrl}/get/${key}`, {
      headers: { Authorization: `Bearer ${kvToken}` },
      cache: 'no-store'
    });
    const json = await res.json();
    if (json.result) {
      return typeof json.result === 'string' ? JSON.parse(json.result) : json.result;
    }
  } catch (err) {
    console.warn('Error reading from KV:', err);
  }
  return null;
}

async function kvSet(key: string, value: unknown): Promise<void> {
  if (!isKvConfigured) return;
  try {
    await fetch(`${kvUrl}/set/${key}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${kvToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(value)
    });
  } catch (err) {
    console.warn('Error writing to KV:', err);
  }
}

// Memoria volátil
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
    console.warn('Could not read local DB, using memoryDb', error);
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
    console.warn('Could not write to local DB', error);
  }
}

export async function uploadImageToStorage(base64OrUrl: string, giftId: string): Promise<string> {
  if (!base64OrUrl || !base64OrUrl.startsWith('data:image')) {
    return base64OrUrl;
  }
  if (!isSupabaseConfigured() || !supabase) {
    return base64OrUrl;
  }
  try {
    const match = base64OrUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!match) return base64OrUrl;
    const contentType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = contentType.includes('png')
      ? 'png'
      : contentType.includes('webp')
      ? 'webp'
      : 'jpg';
    const filePath = `gifts/${giftId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('wishlist-images')
      .upload(filePath, buffer, {
        contentType,
        upsert: true
      });

    if (uploadError) {
      console.warn('Storage upload error, keeping original:', uploadError);
      return base64OrUrl;
    }

    const { data: publicUrlData } = supabase.storage
      .from('wishlist-images')
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl || base64OrUrl;
  } catch (err) {
    console.warn('uploadImageToStorage exception:', err);
    return base64OrUrl;
  }
}

export async function getAllFriends(): Promise<FriendWithGifts[]> {
  // 1. Si KV (Vercel KV / Upstash) está activo
  if (isKvConfigured) {
    const kvData = await kvGet<DatabaseSchema>('secret_santa_db');
    if (kvData && Array.isArray(kvData.friends)) {
      return kvData.friends.map((f) => ({
        ...f,
        gifts: (kvData.gifts || []).filter((g) => g.friendId === f.id)
      }));
    }
  }

  // 2. Si Supabase está configurado
  if (isSupabaseConfigured() && supabase) {
    const { data: friendsData, error: friendsError } = await supabase
      .from('friends')
      .select('*')
      .order('created_at', { ascending: false });

    if (!friendsError && friendsData) {
      const { data: giftsData } = await supabase
        .from('gifts')
        .select('*')
        .order('created_at', { ascending: false });

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
        ipAddress: f.ip_address || '',
        userAgent: f.user_agent || '',
        createdAt: f.created_at,
        gifts: allGifts.filter((g) => g.friendId === f.id)
      }));
    }
  }

  // 3. Fallback en archivo (/tmp o data/db.json) y memoria
  const db = readLocalDb();
  return db.friends.map((f) => ({
    ...f,
    gifts: db.gifts.filter((g) => g.friendId === f.id)
  }));
}

export async function getFriendById(id: string): Promise<FriendWithGifts | null> {
  let cleanId = id;
  try {
    cleanId = decodeURIComponent(id).trim().toLowerCase();
  } catch {
    cleanId = id.trim().toLowerCase();
  }

  // 1. Supabase directo: ultra rápido, ligero y no descarga toda la BD
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data: friendData, error: friendError } = await supabase
        .from('friends')
        .select('*')
        .ilike('id', cleanId)
        .maybeSingle();

      if (friendData && !friendError) {
        const { data: giftsData } = await supabase
          .from('gifts')
          .select('*')
          .eq('friend_id', friendData.id)
          .order('created_at', { ascending: false });

        const gifts = ((giftsData || []) as any[]).map((g) => ({
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

        return {
          id: friendData.id,
          name: friendData.name,
          avatar: friendData.avatar,
          pin: friendData.pin,
          bio: friendData.bio,
          dislikes: friendData.dislikes,
          shirtSize: friendData.shirt_size,
          shoeSize: friendData.shoe_size,
          ipAddress: friendData.ip_address || '',
          userAgent: friendData.user_agent || '',
          createdAt: friendData.created_at,
          gifts
        };
      }
    } catch (err) {
      console.warn('Supabase getFriendById error:', err);
    }
  }

  // 2. KV / Local fallback
  const all = await getAllFriends();
  const match = all.find((f) => f.id.toLowerCase() === cleanId);
  return match || null;
}

export async function createFriend(
  data: Omit<FriendProfile, 'createdAt'>
): Promise<FriendProfile> {
  const newFriend: FriendProfile = {
    ...data,
    createdAt: new Date().toISOString()
  };

  // 1. Guardar en KV si está activo
  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    const exists = kvData.friends.some((f) => f.id.toLowerCase() === newFriend.id.toLowerCase());
    if (exists) {
      throw new Error('Ya existe una carpeta con este nombre.');
    }
    kvData.friends.unshift(newFriend);
    await kvSet('secret_santa_db', kvData);
    return newFriend;
  }

  // 2. Guardar en Supabase si está activo
  if (isSupabaseConfigured() && supabase) {
    try {
      const payload: Record<string, any> = {
        id: newFriend.id,
        name: newFriend.name,
        avatar: newFriend.avatar,
        pin: newFriend.pin,
        bio: newFriend.bio,
        dislikes: newFriend.dislikes,
        shirt_size: newFriend.shirtSize,
        shoe_size: newFriend.shoeSize,
        created_at: newFriend.createdAt
      };

      if (newFriend.ipAddress) payload.ip_address = newFriend.ipAddress;
      if (newFriend.userAgent) payload.user_agent = newFriend.userAgent;

      const { error } = await supabase.from('friends').insert(payload);

      if (!error) {
        return newFriend;
      }
      console.warn('Supabase insert friend warning, fallbacking:', error.message);
    } catch (err) {
      console.warn('Supabase exception, fallbacking:', err);
    }
  }

  // 3. Guardar en archivo local /tmp
  const db = readLocalDb();
  const exists = db.friends.some((f) => f.id.toLowerCase() === newFriend.id.toLowerCase());
  if (exists) {
    throw new Error('Ya existe una carpeta con este nombre.');
  }

  db.friends.unshift(newFriend);
  writeLocalDb(db);
  return newFriend;
}

export async function updateFriend(
  id: string,
  updates: Partial<Omit<FriendProfile, 'id' | 'createdAt'>>
): Promise<FriendProfile> {
  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    const index = kvData.friends.findIndex((f) => f.id.toLowerCase() === id.toLowerCase());
    if (index === -1) throw new Error('Amigo no encontrado');
    kvData.friends[index] = { ...kvData.friends[index], ...updates };
    await kvSet('secret_santa_db', kvData);
    return kvData.friends[index];
  }

  if (isSupabaseConfigured() && supabase) {
    const payload: Record<string, unknown> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.avatar !== undefined) payload.avatar = updates.avatar;
    if (updates.pin !== undefined) payload.pin = updates.pin;
    if (updates.bio !== undefined) payload.bio = updates.bio;
    if (updates.dislikes !== undefined) payload.dislikes = updates.dislikes;
    if (updates.shirtSize !== undefined) payload.shirt_size = updates.shirtSize;
    if (updates.shoeSize !== undefined) payload.shoe_size = updates.shoeSize;

    const { error } = await supabase.from('friends').update(payload).eq('id', id);
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
  const newGiftId = `gift-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  let finalImageUrl = giftData.imageUrl || '';

  if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
    finalImageUrl = await uploadImageToStorage(finalImageUrl, newGiftId);
  }

  const newGift: GiftItem = {
    ...giftData,
    id: newGiftId,
    friendId,
    imageUrl: finalImageUrl,
    createdAt: new Date().toISOString()
  };

  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    kvData.gifts.unshift(newGift);
    await kvSet('secret_santa_db', kvData);
    return newGift;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
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

      if (!error) return newGift;
      console.warn('Supabase addGift warning:', error.message);
    } catch (err) {
      console.warn('Supabase addGift exception:', err);
    }
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
  const newGifts: GiftItem[] = [];

  for (let index = 0; index < giftsData.length; index++) {
    const giftData = giftsData[index];
    const newGiftId = `gift-${timestamp}-${index}-${Math.random().toString(36).substring(2, 7)}`;
    let finalImageUrl = giftData.imageUrl || '';

    if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
      finalImageUrl = await uploadImageToStorage(finalImageUrl, newGiftId);
    }

    newGifts.push({
      ...giftData,
      id: newGiftId,
      friendId,
      imageUrl: finalImageUrl,
      createdAt: new Date().toISOString()
    });
  }

  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    kvData.gifts.unshift(...newGifts);
    await kvSet('secret_santa_db', kvData);
    return newGifts;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
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
      if (!error) return newGifts;
      console.warn('Supabase addMultipleGifts warning:', error.message);
    } catch (err) {
      console.warn('Supabase addMultipleGifts exception:', err);
    }
  }

  const db = readLocalDb();
  db.gifts.unshift(...newGifts);
  writeLocalDb(db);
  return newGifts;
}

export async function deleteGift(giftId: string): Promise<boolean> {
  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    kvData.gifts = kvData.gifts.filter((g) => g.id !== giftId);
    await kvSet('secret_santa_db', kvData);
    return true;
  }

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
  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    const gift = kvData.gifts.find((g) => g.id === giftId);
    if (!gift) throw new Error('Regalo no encontrado');
    gift.isPurchased = isPurchased;
    gift.purchasedBy = purchasedBy;
    await kvSet('secret_santa_db', kvData);
    return gift;
  }

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

export async function deleteFriend(friendId: string): Promise<boolean> {
  // 1. KV
  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [] };
    kvData.friends = kvData.friends.filter((f) => f.id !== friendId);
    kvData.gifts = kvData.gifts.filter((g) => g.friendId !== friendId);
    await kvSet('secret_santa_db', kvData);
  }

  // 2. Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('gifts').delete().eq('friend_id', friendId);
      await supabase.from('friends').delete().eq('id', friendId);
    } catch (err) {
      console.warn('Supabase deleteFriend error:', err);
    }
  }

  // 3. Local
  const db = readLocalDb();
  db.friends = db.friends.filter((f) => f.id !== friendId);
  db.gifts = db.gifts.filter((g) => g.friendId !== friendId);
  writeLocalDb(db);
  return true;
}

export async function logActivity(entry: {
  action: string;
  targetId?: string;
  targetName?: string;
  ip: string;
  userAgent: string;
}): Promise<void> {
  const newLog: ActivityLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    ...entry,
    createdAt: new Date().toISOString()
  };

  // KV
  if (isKvConfigured) {
    const kvData = (await kvGet<DatabaseSchema>('secret_santa_db')) || { friends: [], gifts: [], logs: [] };
    if (!kvData.logs) kvData.logs = [];
    kvData.logs.unshift(newLog);
    if (kvData.logs.length > 200) kvData.logs = kvData.logs.slice(0, 200);
    await kvSet('secret_santa_db', kvData);
    return;
  }

  // Supabase (intenta insertar si la tabla existe)
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('activity_logs').insert({
        id: newLog.id,
        action: newLog.action,
        target_id: newLog.targetId,
        target_name: newLog.targetName,
        ip: newLog.ip,
        user_agent: newLog.userAgent,
        created_at: newLog.createdAt
      });
    } catch {}
  }

  // Local
  const db = readLocalDb();
  if (!db.logs) db.logs = [];
  db.logs.unshift(newLog);
  if (db.logs.length > 200) db.logs = db.logs.slice(0, 200);
  writeLocalDb(db);
}

export async function getActivityLogs(): Promise<ActivityLog[]> {
  if (isKvConfigured) {
    const kvData = await kvGet<DatabaseSchema>('secret_santa_db');
    if (kvData?.logs) return kvData.logs;
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (!error && data) {
        return data.map((l) => ({
          id: l.id,
          action: l.action,
          targetId: l.target_id,
          targetName: l.target_name,
          ip: l.ip,
          userAgent: l.user_agent,
          createdAt: l.created_at
        }));
      }
    } catch {}
  }

  const db = readLocalDb();
  return db.logs || [];
}

export async function getRecentGifts(limit = 20): Promise<RecentGiftNotification[]> {
  const friends = await getAllFriends();
  const all: RecentGiftNotification[] = [];

  for (const friend of friends) {
    for (const gift of friend.gifts || []) {
      all.push({
        ...gift,
        friendName: friend.name,
        friendAvatar: friend.avatar || '🎅'
      });
    }
  }

  // Ordenar por fecha más reciente
  all.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  return all.slice(0, limit);
}
