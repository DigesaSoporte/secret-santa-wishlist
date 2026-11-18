import { Suspense } from 'react';
import FriendDetailClient from '@/components/FriendDetailClient';
import SnowEffect from '@/components/SnowEffect';
import Navbar from '@/components/Navbar';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function FriendPage({ params }: PageProps) {
  const { id } = await params;
  let decodedId = id;
  try {
    decodedId = decodeURIComponent(id || '').trim();
  } catch {
    decodedId = (id || '').trim();
  }

  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fdfbf7] flex flex-col items-center justify-center">
          <SnowEffect />
          <Navbar />
          <div className="flex-1 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-slate-600">Cargando carpeta de regalos...</p>
          </div>
        </div>
      }
    >
      <FriendDetailClient friendId={decodedId} />
    </Suspense>
  );
}
