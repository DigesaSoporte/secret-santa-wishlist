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

-- 4. Datos iniciales de prueba (Opcional)
INSERT INTO public.friends (id, name, avatar, pin, bio, dislikes, shirt_size, shoe_size)
VALUES 
  ('kenny', 'Kenny', '🎅', '1234', '¡Hola! Me encanta la tecnología, el buen café y los videojuegos.', 'No me gustan los calcetines aburridos.', 'M', '41'),
  ('valeria', 'Valeria', '🦌', '1234', 'Fanática de los libros de fantasía y tazas de café.', 'Alérgica a las nueces.', 'S', '37')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.gifts (id, friend_id, title, link, image_url, price_estimate, priority, notes)
VALUES
  ('gift-seed-1', 'kenny', 'Audífonos Bluetooth In-Ear con Cancelación de Ruido', 'https://amazon.com', 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80', '$30 - $45 USD', 'high', 'En color negro o azul'),
  ('gift-seed-2', 'valeria', 'Taza Navideña de Cerámica', 'https://amazon.com', 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', '$10 - $15 USD', 'high', 'Para café caliente en invierno')
ON CONFLICT (id) DO NOTHING;

