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
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Si la tabla ya existía, agregar columnas ip_address y user_agent por si acaso
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE public.friends ADD COLUMN IF NOT EXISTS user_agent TEXT;

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

-- 3. Tabla de auditoría / logs de actividad
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  target_id TEXT,
  target_name TEXT,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Habilitar RLS
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Permitir todo en friends') THEN
    CREATE POLICY "Permitir todo en friends" ON public.friends FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'gifts' AND policyname = 'Permitir todo en gifts') THEN
    CREATE POLICY "Permitir todo en gifts" ON public.gifts FOR ALL USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'Permitir todo en activity_logs') THEN
    CREATE POLICY "Permitir todo en activity_logs" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;
