'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/client/auth-client';
import { useNavigation } from '@/lib/client/providers/navigation-provider';
import { TransactionHistoryList } from '@/components/features/transaction-history-list';

export default function TransactionsPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const { setCurrentPage } = useNavigation();

  useEffect(() => {
    setCurrentPage('transactions');
  }, [setCurrentPage]);

  useEffect(() => {
    if (!isPending && !session?.user?.id) {
      router.push('/');
    }
  }, [isPending, session?.user?.id, router]);

  if (isPending) {
    return (
      <div className="max-w-4xl mx-auto pt-10 px-4 h-full flex items-center justify-center pb-24">
        <div className="w-10 h-10 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto pt-10 px-4 pb-24">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-serif text-foreground mb-2">Transactions</h1>
        <p className="text-sm text-muted-foreground">ประวัติการเคลื่อนไหว Stars ทั้งหมดของคุณ</p>
      </div>

      <TransactionHistoryList />
    </div>
  );
}