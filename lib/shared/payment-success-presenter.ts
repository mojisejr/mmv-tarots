export interface PaymentSuccessSummary {
  referenceCode: string;
  starsGranted: number;
  packageName: string;
  amountTHB: number;
  creditedAt: Date;
  primaryAction?: SuccessAction;
  returnTo?: string;
}

export interface SuccessAction {
  label: string;
  href: string;
}

const DEFAULT_PRIMARY_ACTION: SuccessAction = {
  label: 'ไปดูดวงเลย',
  href: '/',
};

const SECONDARY_ACTION: SuccessAction = {
  label: 'ดูรายการชำระเงิน',
  href: '/billing',
};

export function buildPrimaryAction(returnTo?: string): SuccessAction {
  if (returnTo && returnTo.startsWith('/')) {
    return { label: 'ดำเนินการต่อ', href: returnTo };
  }
  return DEFAULT_PRIMARY_ACTION;
}

export function getSecondaryAction(): SuccessAction {
  return SECONDARY_ACTION;
}

export function buildLineOaMessage(summary: PaymentSuccessSummary): string {
  const lines = [
    `✨ เติมดาวสำเร็จ!`,
    `แพ็กเกจ: ${summary.packageName}`,
    `ดาวที่ได้รับ: +${summary.starsGranted} ดวง`,
    `ยอดชำระ: ฿${summary.amountTHB.toFixed(0)}`,
    `อ้างอิง: ${summary.referenceCode}`,
    ``,
    `ไปดูดวงกันเลย 🔮`,
  ];
  return lines.join('\n');
}

export function buildToastMessage(summary: PaymentSuccessSummary): string {
  return `เติมดาวสำเร็จ! +${summary.starsGranted} ดวง 🌟`;
}
