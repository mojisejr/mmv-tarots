import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/server/db', () => ({
  db: {
    packagePrice: {
      findUnique: vi.fn(),
    },
    creditTransaction: {
      count: vi.fn(),
    },
  },
}))

vi.mock('@/lib/server/omise', () => ({
  getOmiseClient: vi.fn(),
  getOmiseConfigState: vi.fn(),
  toSatang: vi.fn((amount: number) => Math.round(amount * 100)),
}))

vi.mock('@/lib/server/payment-observability', () => ({
  capturePaymentException: vi.fn(),
  emitPaymentEvent: vi.fn(),
  notifyPaymentAlert: vi.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/checkout/omise/route'
import { db } from '@/lib/server/db'
import { getOmiseClient, getOmiseConfigState } from '@/lib/server/omise'
import {
  capturePaymentException,
  emitPaymentEvent,
  notifyPaymentAlert,
} from '@/lib/server/payment-observability'

const mockPrice = {
  id: 'price_001',
  packageId: 'pkg_001',
  amount: 99,
  currency: 'THB',
  active: true,
  isPromo: false,
  package: {
    id: 'pkg_001',
    name: 'Starter Pack',
    stars: 50,
    active: true,
  },
}

const validCardPayload = {
  priceId: 'price_001',
  userId: 'user_001',
  paymentMethod: 'CARD',
  token: 'tokn_test_1234',
}

describe('POST /api/checkout/omise integration', () => {
  const mockOmise = {
    sources: {
      create: vi.fn(),
    },
    charges: {
      create: vi.fn(),
    },
  }

  beforeEach(() => {
    vi.clearAllMocks()

    vi.mocked(getOmiseConfigState).mockReturnValue({ ready: true })
    vi.mocked(getOmiseClient).mockReturnValue(mockOmise as any)
    vi.mocked(db.packagePrice.findUnique).mockResolvedValue(mockPrice as any)
    vi.mocked(db.creditTransaction.count).mockResolvedValue(0)
  })

  it('returns 200 with authorizeUri when card flow requires 3DS', async () => {
    mockOmise.charges.create.mockResolvedValue({
      id: 'chrg_test_3ds',
      authorize_uri: 'https://3ds.omise.co/session/abc',
      status: 'pending',
      paid: false,
    })

    const request = new Request('http://localhost/api/checkout/omise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCardPayload),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({
      success: false,
      requires3DS: true,
      authorizeUri: 'https://3ds.omise.co/session/abc',
      chargeId: 'chrg_test_3ds',
    })
    expect(emitPaymentEvent).toHaveBeenCalledWith('omise.card.requires_3ds', {
      chargeId: 'chrg_test_3ds',
      userId: 'user_001',
      priceId: 'price_001',
    })
  })

  it('returns 400 for invalid request payload', async () => {
    const request = new Request('http://localhost/api/checkout/omise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'user_001' }),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(400)
    expect(body.error).toBe('Invalid request')
    expect(db.packagePrice.findUnique).not.toHaveBeenCalled()
  })

  it('returns 500 and captures exception when upstream omise call fails', async () => {
    mockOmise.charges.create.mockRejectedValue(new Error('authentication failed'))

    const request = new Request('http://localhost/api/checkout/omise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCardPayload),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({ error: 'authentication failed' })
    expect(capturePaymentException).toHaveBeenCalledWith(
      'omise.checkout.create_charge',
      expect.any(Error)
    )
    expect(notifyPaymentAlert).toHaveBeenCalledWith({
      title: 'Omise checkout API error',
      severity: 'critical',
      details: { message: 'authentication failed' },
    })
  })
})
