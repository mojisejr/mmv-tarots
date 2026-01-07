import { ImageResponse } from 'next/og';
import { db } from '@/lib/server/db';
import { mapReadingData } from '@/lib/client/reading-utils';
import { adaptReadingData } from '@/lib/server/adapters/reading-adapter';
import type { ReadingResult } from '@/types/reading';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    // Load Font from filesystem
    const fontPath = path.join(process.cwd(), 'assets', 'fonts', 'NotoSansThai-Bold.ttf');
    const fontBuffer = fs.readFileSync(fontPath);
    // Convert Buffer to ArrayBuffer/Uint8Array for Satori compatibility
    const fontData = new Uint8Array(fontBuffer).buffer;

    const { searchParams } = new URL(request.url);
    const identifier = searchParams.get('id');

    // Load Logo with Error Handling - temporarily disabled for debugging u2 error
    let logoBase64 = '';
    /* 
    try {
      const logoPath = path.join(process.cwd(), 'public', 'logo.webp');
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/webp;base64,${logoBuffer.toString('base64')}`;
    } catch (error) {
      console.error('Failed to load logo for OG Image:', error);
    }
    */

    if (!identifier) {
       return new ImageResponse(
          <div style={{ 
              width: '100%', height: '100%', backgroundColor: '#FFF0F0', color: '#592E2E', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 60,
              fontWeight: 'bold', fontFamily: 'serif'
          }}>
             {logoBase64 && <img src={logoBase64} width="80" height="80" style={{ marginRight: 20, borderRadius: 16 }} />}
             MimiVibe Tarot
          </div>, 
          { width: 1200, height: 630 }
       );
    }

    const isJobId = identifier.startsWith('job-');
    // Simple UUID check to prevent Prisma crashing if passed invalid non-job-id string
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);

    if (!isJobId && !isUUID) {
        return new Response('Invalid ID pattern', { status: 400 });
    }

    const prediction = await db.prediction.findFirst({
        where: isJobId ? { jobId: identifier } : { id: identifier },
    });

    if (!prediction || !prediction.finalReading) {
       return new Response('Prediction not found or not completed', { status: 404 });
    }

    // Adapt and Map data
    const adaptedReading = adaptReadingData(prediction.finalReading);
    const mappedData = adaptedReading ? mapReadingData(adaptedReading) : null;
    
    if (!mappedData) {
       return new Response('Failed to parse reading data', { status: 500 });
    }
    
    // Select the main card (usually the first one)
    const mainCard = mappedData.cards[0];
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
            backgroundColor: '#FFF0F0', // Creamy White background
            fontFamily: 'Noto Sans Thai',
            padding: '40px',
            position: 'relative',
          }}
        >
            {/* Background Aura - Simplified to a large circle instead of gradient if needed */}
            <div style={{
                position: 'absolute',
                top: '-20%',
                left: '-20%',
                width: '140%',
                height: '140%',
                backgroundColor: '#FFD6D1',
                borderRadius: '1000px',
                opacity: 0.3,
            }} />

            {/* Glass Container */}
            <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                alignItems: 'center', 
                width: '100%', 
                height: '100%',
                backgroundColor: 'rgba(255,255,255,0.6)',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: 'rgba(255,255,255,0.8)',
                borderRadius: '32px',
                padding: '60px',
            }}>
                
                {/* Left: Card Image */}
                <div style={{ 
                    display: 'flex', 
                    borderRadius: '20px', 
                    overflow: 'hidden',
                    borderWidth: '4px',
                    borderStyle: 'solid',
                    borderColor: 'white',
                    marginRight: '60px',
                    width: '320px',
                    height: '530px',
                    flexShrink: 0,
                    backgroundColor: '#FFF'
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
                         <div style={{ width: 320, height: 530, backgroundColor: '#FFE4E1', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: 60, color: '#592E2E' }}>?</div>
                    )}
                </div>

                {/* Right: Typography Content */}
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, justifyContent: 'space-between', padding: '10px 0' }}>
                    
                    {/* Brand Header */}
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center',
                        borderBottomWidth: '2px',
                        borderBottomStyle: 'solid',
                        borderBottomColor: 'rgba(89, 46, 46, 0.1)',
                        paddingBottom: '20px',
                        marginBottom: 'auto'
                    }}>
                        {/* Logo temporarily disabled to debug u2 error */}
                        {/* {logoBase64 && <img src={logoBase64} width="56" height="56" style={{ borderRadius: '12px', marginRight: '20px' }} />} */}
                        <div style={{ 
                            fontSize: 32, 
                            color: '#592E2E', 
                            fontWeight: 'bold',
                        }}>
                            MimiVibe Tarot
                        </div>
                    </div>

                    {/* Main Prediction */}
                    <div style={{ display: 'flex', flexDirection: 'column', margin: '40px 0' }}>
                        <div style={{ 
                            fontSize: 24, 
                            color: '#D4AF37', // Custom gold accent
                            marginBottom: 16, 
                            textTransform: 'uppercase', 
                            letterSpacing: '4px',
                            fontWeight: 'bold'
                        }}>
                            Your Prediction
                        </div>

                        <div style={{ 
                            fontSize: 68, 
                            fontWeight: 900, 
                            lineHeight: 1.1, 
                            marginBottom: 24, 
                            color: '#592E2E',
                        }}>
                            {mainCard?.name_th || 'ชะตาของคุณ'}
                        </div>

                        <div style={{ 
                            fontSize: 32, 
                            color: '#8C6B6B', // Muted foreground
                            lineHeight: 1.4,
                            fontWeight: 'normal',
                        }}>
                            {keywords}
                        </div>
                    </div>

                   {/* Footer Tag */}
                   <div style={{
                       display: 'flex',
                       backgroundColor: '#592E2E',
                       padding: '16px 32px',
                       borderRadius: '100px',
                       alignSelf: 'flex-start',
                       marginTop: 'auto'
                   }}>
                       <span style={{ fontSize: 24, color: '#FFF0F0', fontWeight: 'bold', fontFamily: 'sans-serif' }}>mmv-tarots.com</span>
                   </div>
                </div>
            </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
        fonts: [
          {
            name: 'Noto Sans Thai',
            data: fontData,
            style: 'normal',
            weight: 700,
          },
        ],
      }
    );

  } catch (e: any) {
    console.error('OG Generation Error:', e);
    return new Response(`Failed to generate the image`, {
      status: 500,
    });
  }
}
