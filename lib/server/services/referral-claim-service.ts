import { ReferralSource } from '@/constants/referral';
import { db } from '@/lib/server/db';
import { referralService } from '@/lib/server/services/referral-service';

type ClaimInput = {
  userId: string;
  code: string;
  ipAddress: string;
};

type ClaimResult = {
  status: number;
  body: Record<string, unknown>;
};

export const referralClaimService = {
  async claimReferralCode(input: ClaimInput): Promise<ClaimResult> {
    const user = await db.user.findUnique({
      where: { id: input.userId },
    });

    if (!user) {
      return { status: 404, body: { error: 'User not found' } };
    }

    const entitlement = await db.referralHistory.findFirst({
      where: { refereeId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        source: true,
        status: true,
        eligibilityState: true,
      },
    });

    if (entitlement?.source === ReferralSource.LINK) {
      return {
        status: 409,
        body: { error: 'Manual claim is blocked for link-attributed users' },
      };
    }

    if (entitlement) {
      return { status: 409, body: { error: 'Referral already claimed' } };
    }

    if (user.referredById) {
      return { status: 409, body: { error: 'Referral already claimed' } };
    }

    if (user.referralCode === input.code) {
      return { status: 400, body: { error: 'Self referral is not allowed' } };
    }

    const referrer = await db.user.findUnique({
      where: { referralCode: input.code },
      select: { id: true },
    });

    if (!referrer) {
      return { status: 404, body: { error: 'Referral code is invalid' } };
    }

    await referralService.processReferralSignup(user, input.code, input.ipAddress, {
      source: ReferralSource.MANUAL_CODE,
    });

    const updatedUser = await db.user.findUnique({
      where: { id: user.id },
      select: { referredById: true },
    });

    if (!updatedUser?.referredById) {
      return { status: 422, body: { error: 'Unable to claim referral code' } };
    }

    return {
      status: 200,
      body: {
        success: true,
        referredById: updatedUser.referredById,
        message: 'Referral code claimed successfully',
      },
    };
  },
};
