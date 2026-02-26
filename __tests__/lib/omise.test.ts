import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('omise', () => ({
  default: vi.fn(),
}))

type OmiseModule = typeof import('@/lib/server/omise')

const ORIGINAL_ENV = { ...process.env }

async function loadOmiseModule(): Promise<OmiseModule> {
  vi.resetModules()
  return import('@/lib/server/omise')
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV }
  delete process.env.OMISE_CONFIG_MODE
  delete process.env.OMISE_SECRET_KEY
  delete process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY
  vi.clearAllMocks()
})

afterEach(() => {
  process.env = { ...ORIGINAL_ENV }
})

describe('lib/server/omise', () => {
  describe('getOmiseConfigState', () => {
    it('returns not ready when secret key is missing', async () => {
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY = 'pkey_test_1234567890'

      const { getOmiseConfigState } = await loadOmiseModule()
      const state = getOmiseConfigState()

      expect(state.ready).toBe(false)
      expect(state.reason).toBe('OMISE_SECRET_KEY is missing or invalid format')
    })

    it('returns not ready when public key is missing', async () => {
      process.env.OMISE_SECRET_KEY = 'skey_test_1234567890'

      const { getOmiseConfigState } = await loadOmiseModule()
      const state = getOmiseConfigState()

      expect(state.ready).toBe(false)
      expect(state.reason).toBe('NEXT_PUBLIC_OMISE_PUBLIC_KEY is missing or invalid format')
    })

    it('returns not ready when secret key mode mismatches config mode', async () => {
      process.env.OMISE_CONFIG_MODE = 'live'
      process.env.OMISE_SECRET_KEY = 'skey_test_1234567890'
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY = 'pkey_test_1234567890'

      const { getOmiseConfigState } = await loadOmiseModule()
      const state = getOmiseConfigState()

      expect(state.ready).toBe(false)
      expect(state.reason).toBe('OMISE_SECRET_KEY does not match OMISE_CONFIG_MODE=live')
    })

    it('returns not ready when public key mode mismatches config mode', async () => {
      process.env.OMISE_CONFIG_MODE = 'live'
      process.env.OMISE_SECRET_KEY = 'skey_live_1234567890'
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY = 'pkey_test_1234567890'

      const { getOmiseConfigState } = await loadOmiseModule()
      const state = getOmiseConfigState()

      expect(state.ready).toBe(false)
      expect(state.reason).toBe('NEXT_PUBLIC_OMISE_PUBLIC_KEY does not match OMISE_CONFIG_MODE=live')
    })

    it('returns ready with valid test keys', async () => {
      process.env.OMISE_SECRET_KEY = 'skey_test_1234567890'
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY = 'pkey_test_1234567890'

      const { getOmiseConfigState } = await loadOmiseModule()
      const state = getOmiseConfigState()

      expect(state).toEqual({ ready: true })
    })
  })

  describe('getOmiseClient', () => {
    it('returns null and logs warning when config is invalid', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined)

      const { getOmiseClient } = await loadOmiseModule()
      const client = getOmiseClient()

      expect(client).toBeNull()
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toContain('[Omise] OMISE_SECRET_KEY is missing or invalid format')
    })

    it('initializes client once and reuses singleton instance', async () => {
      process.env.OMISE_SECRET_KEY = 'skey_test_1234567890'
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY = 'pkey_test_1234567890'

      const omiseFactory = (await import('omise')).default as unknown as ReturnType<typeof vi.fn>
      const fakeClient = { charges: { create: vi.fn() } }
      omiseFactory.mockReturnValue(fakeClient)

      const { getOmiseClient } = await loadOmiseModule()

      const first = getOmiseClient()
      const second = getOmiseClient()

      expect(first).toBe(fakeClient)
      expect(second).toBe(fakeClient)
      expect(omiseFactory).toHaveBeenCalledTimes(1)
      expect(omiseFactory).toHaveBeenCalledWith({
        secretKey: 'skey_test_1234567890',
        publicKey: 'pkey_test_1234567890',
      })
    })

    it('returns null and logs error when factory throws', async () => {
      process.env.OMISE_SECRET_KEY = 'skey_test_1234567890'
      process.env.NEXT_PUBLIC_OMISE_PUBLIC_KEY = 'pkey_test_1234567890'

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
      const omiseFactory = (await import('omise')).default as unknown as ReturnType<typeof vi.fn>
      omiseFactory.mockImplementation(() => {
        throw new Error('boom')
      })

      const { getOmiseClient } = await loadOmiseModule()
      const client = getOmiseClient()

      expect(client).toBeNull()
      expect(errorSpy).toHaveBeenCalledTimes(1)
      expect(errorSpy.mock.calls[0]?.[0]).toBe('[Omise] Client init failed:')
      expect(errorSpy.mock.calls[0]?.[1]).toBe('boom')
    })
  })

  describe('amount conversions', () => {
    it('converts THB to satang with rounding', async () => {
      const { toSatang } = await loadOmiseModule()

      expect(toSatang(100)).toBe(10000)
      expect(toSatang(10.555)).toBe(1056)
    })

    it('converts satang to THB', async () => {
      const { fromSatang } = await loadOmiseModule()

      expect(fromSatang(10000)).toBe(100)
      expect(fromSatang(1056)).toBe(10.56)
    })
  })
})
