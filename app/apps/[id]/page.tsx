import { Navbar } from '@/components/Navbar';
import { AppDetailClient } from '@/components/AppDetailClient';

export default async function AppDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <div className="flex-1">
        <AppDetailClient appId={id} />
      </div>
    </div>
  );
}
