# 📸 Snapshot: GB Prime Pay Integration Plan (The Safe Route)

**Date**: 2026-02-13 23:55 GMT+7
**Project**: [mmv-tarots](projects/mmv-tarots)
**Context**: Migration plan from Stripe to GB Prime Pay (QR PromptPay Focus).

## 🏗️ Architecture Change
Shift from "Card-First" (Stripe) to "QR-First" (GB Prime Pay) to minimize chargeback risks and comply with local regulations.

### Key Components
1.  **Backend API (`app/api/checkout/gbprime`)**:
    -   Role: Generate QR Code.
    -   Endpoint: `POST /v3/qrcode`.
    -   Payload: `amount`, `referenceNo`, `backgroundUrl` (Webhook).
2.  **Frontend (`components/checkout/GBPrimeQR.tsx`)**:
    -   Role: Display Base64 QR Image.
    -   Logic: Poll internal API status every 3-5s.
3.  **Webhook (`app/api/webhooks/gbprime`)**:
    -   Role: Handle payment success callback.
    -   Logic: Update Prisma Order status -> `COMPLETED`.

## 💻 Code Blueprint

### 1. API Route: Generate QR
```typescript
// app/api/checkout/gbprime/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { amount, orderId, detail } = await req.json();
  const url = 'https://api.gbprimepay.com/v3/qrcode'; // Production endpoint

  const payload = {
    token: process.env.GB_PRIME_TOKEN,
    amount: amount,
    referenceNo: orderId,
    backgroundUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/gbprime`,
    detail: 'Personal Consultation', // *Framing Strategy*
    customerName: 'Guest',
    customerEmail: 'guest@example.com',
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(payload as any),
    });
    // GB usually returns binary image or base64 text
    return NextResponse.json({ success: true, qrCodeData: await res.text() });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to generate QR' }, { status: 500 });
  }
}
```

### 2. Webhook Route
```typescript
// app/api/webhooks/gbprime/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    if (formData.get('resultCode') === '00') { // 00 = Success
      await prisma.order.update({
        where: { id: String(formData.get('referenceNo')) },
        data: { status: 'COMPLETED', paymentMethod: 'QR_PROMPTPAY' }
      });
      return new NextResponse('OK', { status: 200 });
    }
    return new NextResponse('Failed', { status: 400 });
  } catch (error) {
    return new NextResponse('Error', { status: 500 });
  }
}
```

## 📝 Action Items
- [ ] Apply for GB Prime Pay Account (Business Type: Consulting/E-learning).
- [ ] Obtain `Public Key` & `Secret Key`.
- [ ] Implement the detailed architecture.

---
*Snapshot captured by Oracle-Keeper*
