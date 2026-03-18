import { NextRequest, NextResponse } from 'next/server';
import { PaymentOrderStatus } from '@prisma/client';
import { auth } from '@/lib/server/auth';
import { db } from '@/lib/server/db';

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;

const PAYMENT_ORDER_STATUSES: PaymentOrderStatus[] = [
  PaymentOrderStatus.PENDING_PAYMENT,
  PaymentOrderStatus.SLIP_UPLOADED,
  PaymentOrderStatus.VERIFYING,
  PaymentOrderStatus.VERIFIED,
  PaymentOrderStatus.REJECTED,
  PaymentOrderStatus.EXPIRED,
  PaymentOrderStatus.CREDITED,
];

function parsePositiveInt(value: string | null, fallback: number): number {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function parseStatusFilter(rawStatuses: string | null): PaymentOrderStatus[] {
  if (!rawStatuses) {
    return [];
  }

  const candidates = rawStatuses
    .split(',')
    .map((status) => status.trim().toUpperCase())
    .filter(Boolean);

  const uniqueStatuses = Array.from(new Set(candidates));

  return uniqueStatuses.filter((status): status is PaymentOrderStatus =>
    PAYMENT_ORDER_STATUSES.includes(status as PaymentOrderStatus)
  );
}

export async function GET(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const url = new URL(request.url);

  const page = parsePositiveInt(url.searchParams.get('page'), DEFAULT_PAGE);
  const requestedPageSize = parsePositiveInt(
    url.searchParams.get('pageSize'),
    DEFAULT_PAGE_SIZE
  );
  const pageSize = Math.min(requestedPageSize, MAX_PAGE_SIZE);
  const statuses = parseStatusFilter(url.searchParams.get('status'));

  const whereClause = {
    userId: session.user.id,
    ...(statuses.length > 0 ? { status: { in: statuses } } : {}),
  };

  const [total, orders] = await Promise.all([
    db.paymentOrder.count({ where: whereClause }),
    db.paymentOrder.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        packagePrice: {
          include: {
            package: true,
          },
        },
        creditTransaction: {
          select: {
            id: true,
            amount: true,
            status: true,
            createdAt: true,
          },
        },
        verificationLogs: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            id: true,
            provider: true,
            status: true,
            errorCode: true,
            errorMessage: true,
            createdAt: true,
          },
        },
      },
    }),
  ]);

  return NextResponse.json({
    success: true,
    data: {
      items: orders.map((order) => ({
        id: order.id,
        referenceCode: order.referenceCode,
        status: order.status,
        amountTHB: Number(order.amountTHB),
        amountSatang: order.amountSatang,
        currency: order.currency,
        createdAt: order.createdAt,
        verifiedAt: order.verifiedAt,
        creditedAt: order.creditedAt,
        verificationErrorCode: order.verificationErrorCode,
        verificationErrorMessage: order.verificationErrorMessage,
        package: {
          packagePriceId: order.packagePrice.id,
          id: order.packagePrice.package.id,
          name: order.packagePrice.package.name,
          stars: order.packagePrice.package.stars,
        },
        creditedTransaction: order.creditTransaction
          ? {
              id: order.creditTransaction.id,
              amount: order.creditTransaction.amount,
              status: order.creditTransaction.status,
              createdAt: order.creditTransaction.createdAt,
            }
          : null,
        latestVerificationLog:
          order.verificationLogs.length > 0
            ? {
                id: order.verificationLogs[0].id,
                provider: order.verificationLogs[0].provider,
                status: order.verificationLogs[0].status,
                errorCode: order.verificationLogs[0].errorCode,
                errorMessage: order.verificationLogs[0].errorMessage,
                createdAt: order.verificationLogs[0].createdAt,
              }
            : null,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: total > 0 ? Math.ceil(total / pageSize) : 0,
      },
      filters: {
        status: statuses,
      },
    },
  });
}