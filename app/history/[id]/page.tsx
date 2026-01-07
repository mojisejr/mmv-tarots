import type { Metadata, ResolvingMetadata } from 'next';
import { db } from '@/lib/server/db';
import { HistoryDetailView } from './history-detail-view';

type Props = {
  params: Promise<{ id: string }>;
};

// Helper to check if string is a valid UUID
const isValidUUID = (str: string) => {
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  // Note: Simplified regex for consistency, though standard UUID is better. 
  // Let's use the one from our share page to be safe.
  const standardRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return standardRegex.test(str);
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const identifier = resolvedParams.id;
  
  const isJobId = identifier.startsWith('job-');
  const isUUID = isValidUUID(identifier);

  if (!isJobId && !isUUID) {
     return { title: 'คำทำนาย | MimiVibe' };
  }

  const prediction = await db.prediction.findFirst({
    where: isJobId ? { jobId: identifier } : { id: identifier },
    select: { 
      status: true,
      question: true
    }
  });

  if (!prediction || prediction.status !== 'COMPLETED') {
    return {
      title: 'คำทำนายกู้ดวิล | MimiVibe',
    };
  }

  return {
    title: `${prediction.question} | MimiVibe Tarot`,
    description: 'เปิดคำทำนายไพ่ยิปซีพร้อมความหมายลึกซึ้งที่ MimiVibe',
    openGraph: {
      title: `${prediction.question} | MimiVibe Tarot`,
      description: 'เปิดคำทำนายไพ่ยิปซีพร้อมความหมายลึกซึ้งที่ MimiVibe',
      images: [
        {
          url: `/api/og?id=${identifier}`,
          width: 1200,
          height: 630,
        }
      ],
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${prediction.question} | MimiVibe Tarot`,
      description: 'เปิดคำทำนายไพ่ยิปซีพร้อมความหมายลึกซึ้งที่ MimiVibe',
      images: [`/api/og?id=${identifier}`],
    },
  };
}

export default async function PredictionDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const jobId = resolvedParams.id;

  return <HistoryDetailView id={jobId} />;
}
