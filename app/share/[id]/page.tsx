import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { ShareView } from './share-view';
import { mapReadingData } from '@/lib/client/reading-utils';
import type { ReadingResult } from '@/types/reading';
import { headers } from 'next/headers';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  
  // Quick fetch for metadata
  const prediction = await db.prediction.findUnique({
    where: { id: resolvedParams.id },
    select: { 
      status: true,
      selectedCards: true // We might use this for title later
    }
  });

  if (!prediction || prediction.status !== 'COMPLETED') {
    return {
      title: 'ไม่พบคำทำนาย | MimiVibe',
      robots: {
        index: false,
        follow: false,
      }
    };
  }

  return {
    title: 'ผลการทำนายไพ่ยิปซีของคุณ | MimiVibe',
    description: 'เปิดคำทำนายไพ่ยิปซีพร้อมความหมายลึกซึ้งที่ MimiVibe แชร์ความเฮงให้เพื่อนๆ ของคุณ',
    openGraph: {
      title: 'ผลการทำนายไพ่ยิปซีของคุณ | MimiVibe',
      description: 'เปิดคำทำนายไพ่ยิปซีพร้อมความหมายลึกซึ้งที่ MimiVibe',
      images: [`/api/og?id=${resolvedParams.id}`],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const resolvedParams = await params;
  const prediction = await db.prediction.findUnique({
    where: { id: resolvedParams.id },
  });

  if (!prediction || prediction.status !== 'COMPLETED' || !prediction.finalReading) {
    notFound();
  }

  // Ensure type safety when casting Json to ReadingResult
  const readingResult = prediction.finalReading as unknown as ReadingResult;
  const mappedData = mapReadingData(readingResult);

  if (!mappedData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
        <h2 className="text-xl font-serif text-foreground">ไม่สามารถแสดงผลคำทำนายได้</h2>
        <p className="text-muted-foreground">ข้อมูลอาจไม่สมบูรณ์หรือถูกลบไปแล้ว</p>
      </div>
    );
  }

  // Server Component: Fetch data -> Render Client View
  return <ShareView data={mappedData} predictionId={prediction.id} />;
}
