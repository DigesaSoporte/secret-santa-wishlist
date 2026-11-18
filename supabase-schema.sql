-- ========================================================
-- SCRIPT SQL PARA SUPABASE (Copiar y pegar en SQL Editor)
-- Base de datos para Secret Santa / Amigo Secreto Wishlists
-- ========================================================

-- 1. Tabla de amigos / carpetas
CREATE TABLE IF NOT EXISTS public.friends (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  avatar TEXT NOT NULL DEFAULT '🎅',
  pin TEXT NOT NULL DEFAULT '1234',
  bio TEXT,
  dislikes TEXT,
  shirt_size TEXT,
  shoe_size TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabla de regalos / deseos
CREATE TABLE IF NOT EXISTS public.gifts (
  id TEXT PRIMARY KEY,
  friend_id TEXT NOT NULL REFERENCES public.friends(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  link TEXT,
  image_url TEXT,
  price_estimate TEXT,
  priority TEXT DEFAULT 'medium',
  notes TEXT,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Habilitar RLS pero permitir lectura/escritura pública con Anon Key para la app
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir todo en friends con clave anon" 
ON public.friends FOR ALL 
USING (true) 
WITH CHECK (true);

CREATE POLICY "Permitir todo en gifts con clave anon" 
ON public.gifts FOR ALL 
USING (true) 
WITH CHECK (true);

