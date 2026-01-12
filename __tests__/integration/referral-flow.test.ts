
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CreditService } from '@/services/credit-service';
import { referralService } from '@/lib/server/services/referral-service';
import { REFERRAL_REWARDS, ReferralStatus } from '@/constants/referral';
import { TransactionType, TransactionStatus } from '@prisma/client';

// 1. Mock the DB module
vi.mock('@/lib/server/db', () => {
    const transactionMethods = {
      user: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      creditTransaction: {
        create: vi.fn(),
      },
      referralHistory: {
        count: vi.fn(),
        create: vi.fn(),
        findFirst: vi.fn(),
      },
    };
  
    return {
      db: {
        ...transactionMethods,
        $transaction: vi.fn((callback) => {
          // If callback is a function, execute it with the mocked db methods (acting as tx)
          if (typeof callback === 'function') {
            return callback(transactionMethods);
          }
          // If it's an array (Promise[]), just await them
          return Promise.all(callback);
        }),
      },
    };
  });

import { db } from '@/lib/server/db';

describe('Referral Flow Integration (Resolved Paradox)', () => {
  const mockReferrerId = 'referrer-123';
  const mockRefereeId = 'referee-999';
  const mockReferralCode = 'REF123';

  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('Phase 1: Signup & Onboarding', () => {
    it('should grant Universal Onboarding Bonus (+1 Star)', async () => {
      // Mock db setup for onboarding
      vi.mocked(db.user.findUnique).mockResolvedValue({ id: mockRefereeId, stars: 0 } as any);
      vi.mocked(db.user.update).mockResolvedValue({ id: mockRefereeId, stars: 1 } as any);

      // Execute
      await CreditService.grantOnboardingBonus(mockRefereeId);

      // Verify Transaction
      expect(db.$transaction).toHaveBeenCalled();
      expect(db.user.update).toHaveBeenCalledWith({
        where: { id: mockRefereeId },
        data: { stars: REFERRAL_REWARDS.ONBOARDING }, // 0 + 1
      });
      expect(db.creditTransaction.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: mockRefereeId,
            amount: REFERRAL_REWARDS.ONBOARDING,
            type: TransactionType.ONBOARDING,
          }),
        })
      );
    });

    it('should grant Referral Entry Bonus (+1 Star) when applied', async () => {
        // Mock db setup
        vi.mocked(db.user.findUnique).mockResolvedValue({ id: mockRefereeId, stars: 1 } as any);
        vi.mocked(db.user.update).mockResolvedValue({ id: mockRefereeId, stars: 2 } as any);
  
        // Execute
        await CreditService.grantReferralEntryBonus(mockRefereeId, mockReferrerId);
  
        // Verify Transaction
        expect(db.$transaction).toHaveBeenCalled();
        expect(db.user.update).toHaveBeenCalledWith({
          where: { id: mockRefereeId },
          data: { stars: 2 }, // 1 + 1
        });
        expect(db.creditTransaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
                userId: mockRefereeId,
                amount: REFERRAL_REWARDS.REFEREE,
                type: TransactionType.REFERRAL,
                metadata: expect.objectContaining({ referrerId: mockReferrerId }),
            }),
          })
        );
      });
  });

  describe('Phase 2: Referral Process Logic', () => {
    it('should process referral signup and trigger entry bonus if not suspicious', async () => {
      // Setup Mock Data
      vi.mocked(db.user.findUnique)
        .mockResolvedValueOnce({ id: mockReferrerId, referralCode: mockReferralCode } as any) // find referrer
        .mockResolvedValue({ id: mockRefereeId, stars: 1 } as any); // inside grantReferralEntryBonus

      vi.mocked(db.referralHistory.count).mockResolvedValue(0); // Not suspicious (count < 3)

      // Spy on CreditService to ensure it's called
      const grantBonusSpy = vi.spyOn(CreditService, 'grantReferralEntryBonus');

      // Execute
      await referralService.processReferralSignup(
        { id: mockRefereeId } as any,
        mockReferralCode,
        '127.0.0.1'
      );

      // Verify Referral History Creation
      expect(db.referralHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            referrerId: mockReferrerId,
            refereeId: mockRefereeId,
            status: ReferralStatus.PENDING,
          })
        })
      );

      // Verify Entry Bonus Trigger check
      expect(grantBonusSpy).toHaveBeenCalledWith(mockRefereeId, mockReferrerId);
    });

    it('should NOT grant entry bonus if referral is suspicious', async () => {
        // Setup Suspicious Data
        vi.mocked(db.user.findUnique).mockResolvedValue({ id: mockReferrerId } as any);
        vi.mocked(db.referralHistory.count).mockResolvedValue(5); // Suspicious (>3)
  
        const grantBonusSpy = vi.spyOn(CreditService, 'grantReferralEntryBonus');
  
        // Execute
        await referralService.processReferralSignup(
          { id: mockRefereeId } as any,
          mockReferralCode,
          '127.0.0.1'
        );
  
        // Verify Blocked Status
        expect(db.referralHistory.create).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({
                status: ReferralStatus.BLOCKED,
              })
            })
        );
  
        // Verify NO Bonus call
        expect(grantBonusSpy).not.toHaveBeenCalled();
      });
  });

  describe('Phase 3: The Resolved Paradox (Capability Check)', () => {
    it('User with 2 stars (1 Base + 1 Ref) should satisfy hasEnoughStars', async () => {
        // Mock user with 2 stars
        vi.mocked(db.user.findUnique).mockResolvedValue({ id: mockRefereeId, stars: 2 } as any);

        const canPredict = await CreditService.hasEnoughStars(mockRefereeId);
        expect(canPredict).toBe(true);
    });
  });
});
