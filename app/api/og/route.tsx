import { ImageResponse } from 'next/og';
import { db } from '@/lib/server/db';
import { mapReadingData } from '@/lib/client/reading-utils';
import type { ReadingResult } from '@/types/reading';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
       return new ImageResponse(
          <div style={{ 
              width: '100%', height: '100%', backgroundColor: '#0f172a', color: 'white', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 
          }}>
             MimiVibe Tarot
          </div>, 
          { width: 1200, height: 630 }
       );
    }

    const prediction = await db.prediction.findUnique({
        where: { id },
    });

    if (!prediction || !prediction.finalReading) {
       return new Response('Not Found', { status: 404 });
    }

    const mappedData = mapReadingData(prediction.finalReading as unknown as ReadingResult);
    
    // Select the main card (usually the first one or the one in 'Present' position)
    // Fallback to first if logical position logic isn't strictly defined
    const mainCard = mappedData?.cards[0];
    const keywords = mainCard?.keywords?.slice(0, 3).join(' • ') || 'เปิดไพ่พยากรณ์';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f172a', // slate-950
            backgroundImage: 'linear-gradient(to bottom right, #2e1065, #0f172a)', // purple-950 to slate-950
            color: 'white',
            fontFamily: 'sans-serif',
            padding: '60px',
          }}
        >
            {/* Wrapper for content */}
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%', height: '100%' }}>
                
                {/* Left: Card Image with Glow */}
                <div style={{ 
                    display: 'flex', 
                    borderRadius: '24px', 
                    overflow: 'hidden',
                    boxShadow: '0 0 80px rgba(168, 85, 247, 0.4)', // purple glow
                    border: '2px solid rgba(255,255,255,0.1)',
                    marginRight: '60px'
                }}>
                    {mainCard?.image ? (
                        <img 
                            src={mainCard.image} 
                            alt="Tarot Card" 
                            width="320" 
                            height="530" 
                            style={{ objectFit: 'cover' }} 
                        />
                    ) : (
                         <div style={{ width: 320, height: 530, backgroundColor: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>?</div>
                    )}
                </div>

                {/* Right: Typography */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', flex: 1 }}>
                    <div style={{ 
                        fontSize: 24, 
                        color: '#d8b4fe', // purple-300
                        marginBottom: 16, 
                        textTransform: 'uppercase', 
                        letterSpacing: '4px',
                        display: 'flex',
                        alignItems: 'center'
                    }}>
                        MimiVibe Tarot
                    </div>

                    <div style={{ 
                        fontSize: 64, 
                        fontWeight: 900, 
                        lineHeight: 1.1, 
                        marginBottom: 24, 
                        backgroundImage: 'linear-gradient(to right, #fff, #e9d5ff)',
                        backgroundClip: 'text',
                        color: 'transparent',
                    }}>
                        {mainCard?.name_th || 'ชะตาของคุณ'}
                    </div>

                    <div style={{ 
                        fontSize: 32, 
                        color: '#94a3b8', // slate-400
                        marginBottom: 40,
                        lineHeight: 1.4,
                    }}>
                        {keywords}
                    </div>

                   <div style={{
                       display: 'flex',
                       backgroundColor: 'rgba(255,255,255,0.1)',
                       padding: '16px 32px',
                       borderRadius: '100px',
                       alignSelf: 'flex-start',
                       border: '1px solid rgba(255,255,255,0.1)'
                   }}>
                       <span style={{ fontSize: 24, color: '#f472b6' }}>mmv-tarots.com</span>
                   </div>
                </div>
            </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );

  } catch (e: any) {
    console.error('OG Generation Error:', e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
