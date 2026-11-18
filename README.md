# 🎄 Secret Santa - Carpetas de Deseos (Amigo Secreto)

Un sistema web moderno, elegante y festivo diseñado para que tú y tus amigos jueguen al **Amigo Secreto / Secret Santa**. Cada amigo puede crear su carpeta personalizada, subir fotos, capturas de pantalla, enlaces de tiendas y especificaciones de lo que sueña recibir, facilitando que a quien le tocó regalarle sepa exactamente qué comprar sin equivocarse.

---

## ✨ Características Principales

1. **Directorio de Amigos & Carpetas:**
   - Visualiza a todos los amigos participantes con avatares festivos (🎅, 🦌, ⛄, 🎄, etc.).
   - Muestra el número de regalos deseados y resumen de gustos.
   - Buscador en tiempo real por nombre (ej: "Kenny").

2. **Wishlist Completa con Fotos y Capturas:**
   - **Carga de imágenes:** Permite subir fotos o capturas de pantalla directamente desde el celular o PC (con compresión automática para que cargue ultra rápido) o pegar enlaces de imágenes web.
   - **Ampliador de fotos:** Clic para ver fotos y capturas en pantalla completa con alta calidad.
   - **Enlaces directos:** Botón para ir a la tienda (Amazon, MercadoLibre, Shein, tiendas locales).
   - **Tallas y Notas:** Especificaciones como talla de ropa, talla de calzado, color preferido y cosas que **NO** le gustan (alergias o disgustos).
   - **Nivel de deseo:** ⭐ Máximo Deseo, ✨ Buena Idea, 💡 Detalle Accesible.

3. **Modo Amigo Secreto (Función Secreta):**
   - La persona a quien le tocó regalarle a Kenny puede marcar de forma anónima: **"🎁 ¡Yo le voy a regalar esto!"**
   - El regalo queda reservado para evitar que otro amigo compre lo mismo.

4. **Seguridad y Privacidad con PIN:**
   - Cada amigo elige un PIN de 4 dígitos al crear su carpeta.
   - Solo el dueño con su PIN puede agregar o eliminar sus regalos, pero cualquier amigo puede entrar a ver su carpeta.

---

## 🚀 Cómo Probar Localmente

1. Abre una terminal en esta carpeta:
   ```bash
   npm install
   npm run dev
   ```
2. Entra en tu navegador a:
   [http://localhost:3000](http://localhost:3000)

---

## 🌐 Cómo Desplegar en Vercel (Gratis)

### Opción 1: Despliegue Rápido en Vercel
1. Sube este repositorio a tu cuenta de **GitHub**.
2. Entra a [vercel.com](https://vercel.com) e inicia sesión.
3. Haz clic en **"Add New..." > "Project"** y selecciona tu repositorio.
4. Haz clic en **"Deploy"**. ¡Listo! Vercel te dará un enlace público (ej: `https://tu-amigo-secreto.vercel.app`) para compartir con tus amigos.

### Opción 2: Con Base de Datos Permanente Gratuita (Supabase)
Para que los datos se guarden para siempre en la nube de forma ilimitada:
1. Crea una cuenta gratuita en [supabase.com](https://supabase.com) y crea un nuevo proyecto.
2. Ve al **SQL Editor** en Supabase, copia y pega el contenido del archivo [`supabase-schema.sql`](./supabase-schema.sql) y dale **Run**.
3. En la configuración de tu proyecto en Vercel (o en tu archivo `.env.local`), agrega las variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: La URL de tu proyecto Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: La clave pública `anon` de tu proyecto Supabase.

---

## 🛠️ Tecnologías Usadas
- **Next.js 16 (App Router)** & **React 19**
- **TypeScript**
- **Tailwind CSS v4**
- **Lucide React** (Iconos modernos)
- **Canvas Confetti** (Efectos festivos de celebración)
- **Compresión de imágenes en cliente** (WebP/Canvas)
- **Supabase Client & Local DB Fallback**
