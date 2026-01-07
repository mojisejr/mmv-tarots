import type { Metadata, ResolvingMetadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/server/db';
import { ShareView } from './share-view';
import { mapReadingData } from '@/lib/client/reading-utils';
import { adaptReadingData } from '@/lib/server/adapters/reading-adapter';
import type { ReadingResult } from '@/types/reading';

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Helper to check if string is a valid UUID
const isValidUUID = (str: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return regex.test(str);
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const identifier = resolvedParams.id;
  
  // Prioritize Job ID, fallback to UUID if valid
  const isJobId = identifier.startsWith('job-');
  const isUUID = isValidUUID(identifier);

  if (!isJobId && !isUUID) {
     return { title: 'คำทำนาย | MimiVibe' };
  }

  // Quick fetch for metadata
  const prediction = await db.prediction.findFirst({
    where: isJobId ? { jobId: identifier } : { id: identifier },
    select: { 
      status: true,
      selectedCards: true
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
      images: [`/api/og?id=${identifier}`],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const resolvedParams = await params;
  const identifier = resolvedParams.id;
  
  const isJobId = identifier.startsWith('job-');
  const isUUID = isValidUUID(identifier);

  if (!isJobId && !isUUID) {
    notFound();
  }

  const prediction = await db.prediction.findFirst({
    where: isJobId ? { jobId: identifier } : { id: identifier },
  });

  if (!prediction || prediction.status !== 'COMPLETED' || !prediction.finalReading) {
    notFound();
  }

  // 1. Adapt raw DB JSON to standardized ReadingResult
  const adaptedReading = adaptReadingData(prediction.finalReading);
  
  // 2. Map standardized ReadingResult to UI display data
  const mappedData = adaptedReading ? mapReadingData(adaptedReading) : null;

  if (!mappedData) {
    console.error(`Failed to map reading data for ${identifier}`, {
      hasFinalReading: !!prediction.finalReading,
      adapted: !!adaptedReading
    });
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4 px-4 text-center">
        <h2 className="text-xl font-serif text-foreground">ไม่สามารถแสดงผลคำทำนายได้</h2>
        <p className="text-muted-foreground whitespace-pre-wrap">ข้อมูลอาจอยู่ในรูปแบบที่เก่าเกินไปหรือขัดข้องชั่วคราว\nกรุณาลองใหม่อีกครั้งในภายหลัง</p>
      </div>
    );
  }

  // Server Component: Fetch data -> Render Client View
  return <ShareView data={mappedData} predictionId={prediction.id} />;
}
