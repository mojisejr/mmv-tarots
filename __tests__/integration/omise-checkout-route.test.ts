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

vi.mock('@/services/credit-service', () => ({
  CreditService: {
    addStars: vi.fn(),
  },
}))

import { POST } from '@/app/api/checkout/omise/route'
import { db } from '@/lib/server/db'
import { getOmiseClient, getOmiseConfigState } from '@/lib/server/omise'
import {
  capturePaymentException,
  emitPaymentEvent,
  notifyPaymentAlert,
} from '@/lib/server/payment-observability'
import { CreditService } from '@/services/credit-service'

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

const validPromptPayPayload = {
  priceId: 'price_001',
  userId: 'user_001',
  paymentMethod: 'PROMPTPAY',
  ownerName: 'Test User',
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

  it('credits stars immediately when card charge is successful without 3DS', async () => {
    mockOmise.charges.create.mockResolvedValue({
      id: 'chrg_test_success',
      authorize_uri: null,
      status: 'successful',
      paid: true,
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
      success: true,
      chargeId: 'chrg_test_success',
      chargeStatus: 'successful',
      stars: 50,
      packageName: 'Starter Pack',
    })
    expect(CreditService.addStars).toHaveBeenCalledWith('user_001', 50, {
      omiseChargeId: 'chrg_test_success',
      paymentMethod: 'CARD',
      packageId: 'price_001',
      amount: 99,
      creditedVia: 'direct_checkout',
    })
    expect(emitPaymentEvent).toHaveBeenCalledWith('omise.card.success', {
      chargeId: 'chrg_test_success',
      userId: 'user_001',
      priceId: 'price_001',
    })
  })

  it('prioritizes direct fulfillment when charge is successful even with authorize_uri', async () => {
    mockOmise.charges.create.mockResolvedValue({
      id: 'chrg_test_success_with_authorize_uri',
      authorize_uri: 'https://3ds.omise.co/session/legacy',
      status: 'successful',
      paid: true,
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
      success: true,
      chargeId: 'chrg_test_success_with_authorize_uri',
      chargeStatus: 'successful',
      stars: 50,
      packageName: 'Starter Pack',
    })
    expect(CreditService.addStars).toHaveBeenCalledWith('user_001', 50, {
      omiseChargeId: 'chrg_test_success_with_authorize_uri',
      paymentMethod: 'CARD',
      packageId: 'price_001',
      amount: 99,
      creditedVia: 'direct_checkout',
    })
    expect(emitPaymentEvent).toHaveBeenCalledWith('omise.card.success', {
      chargeId: 'chrg_test_success_with_authorize_uri',
      userId: 'user_001',
      priceId: 'price_001',
    })
  })

  it('returns 500 and captures exception when upstream omise call fails', async () => {
    mockOmise.charges.create.mockRejectedValue({
      message: 'authentication failed',
      code: 'authentication_failure',
    })

    const request = new Request('http://localhost/api/checkout/omise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validCardPayload),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(500)
    expect(body).toEqual({
      error: 'authentication failed',
      code: 'authentication_failure',
    })
    expect(capturePaymentException).toHaveBeenCalledWith(
      'omise.checkout.create_charge',
      expect.objectContaining({
        message: 'authentication failed',
        code: 'authentication_failure',
      })
    )
    expect(notifyPaymentAlert).toHaveBeenCalledWith({
      title: 'Omise checkout API error',
      severity: 'critical',
      details: {
        message: 'authentication failed',
        omiseCode: 'authentication_failure',
      },
    })
  })

  it('creates promptpay source and charge successfully', async () => {
    mockOmise.sources.create.mockResolvedValue({
      id: 'src_test_promptpay',
      scannable_code: {
        image: {
          download_uri: 'https://cdn.omise.co/qr.png',
        },
      },
    })

    mockOmise.charges.create.mockResolvedValue({
      id: 'chrg_test_promptpay',
      status: 'pending',
      expires_at: '2026-03-01T00:00:00Z',
    })

    const request = new Request('http://localhost/api/checkout/omise', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPromptPayPayload),
    })

    const response = await POST(request as any)
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(mockOmise.sources.create).toHaveBeenCalledWith({
      type: 'promptpay',
      amount: 9900,
      currency: 'thb',
      name: 'Test User',
    })
    expect(mockOmise.charges.create).toHaveBeenCalled()
    expect(body).toEqual({
      success: true,
      chargeId: 'chrg_test_promptpay',
      chargeStatus: 'pending',
      qrImageUrl: 'https://cdn.omise.co/qr.png',
      amount: 99,
      currency: 'THB',
      packageName: 'Starter Pack',
      stars: 50,
      expiresAt: '2026-03-01T00:00:00Z',
    })
  })
})
