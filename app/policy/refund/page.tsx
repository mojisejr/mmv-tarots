import Link from 'next/link';
import { PageShell } from '@/components';

export default function RefundPolicyPage() {
  return (
    <PageShell maxWidth="3xl" className="md:pt-14">
      <h1 className="text-3xl font-serif text-foreground mb-4">Refund Policy</h1>
      <div className="rounded-2xl border border-white/10 bg-white/40 backdrop-blur-xl p-6 space-y-4 text-sm leading-relaxed text-foreground/80">
        <h2 className="text-base font-semibold text-foreground">ภาษาไทย</h2>
        <p>
          การซื้อบน MimiVibe เป็นการซื้อสินค้าดิจิทัลประเภทโทเคน (Digital Token) เพื่อปลดล็อกเนื้อหาเชิงอินไซต์แบบส่วนตัวภายในระบบ
        </p>
        <p>
          ธุรกรรมการเติมโทเคนทั้งหมดถือเป็นรายการสิ้นสุด (Final Sale) และไม่สามารถคืนเงินได้ เมื่อโทเคนถูกเติมเข้าบัญชีหรือถูกใช้งานแล้ว
        </p>
        <p>
          กรณีเกิดปัญหาจากระบบชำระเงิน เช่น ตัดเงินสำเร็จแต่โทเคนไม่เข้า กรุณาติดต่อภายใน 24 ชั่วโมงที่ support@mmv-tarots.com เพื่อให้ทีมตรวจสอบและแก้ไข
        </p>
        <p>
          บริษัทอาจพิจารณาปรับยอดเฉพาะกรณีความผิดพลาดทางเทคนิคที่ตรวจสอบได้เท่านั้น โดยไม่ถือเป็นการคืนเงินทั่วไป
        </p>

        <hr className="border-white/10" />

        <h2 className="text-base font-semibold text-foreground">English</h2>
        <p>
          Purchases on MimiVibe are digital-token purchases used to unlock private insight content within the platform.
        </p>
        <p>
          All top-up transactions are final sales and non-refundable once tokens are delivered to your account or consumed.
        </p>
        <p>
          If a payment issue occurs (for example: payment completed but tokens not credited), please contact support@mmv-tarots.com within 24 hours for investigation and resolution.
        </p>
        <p>
          Balance adjustments may be provided only for verified technical failures and do not constitute a general refund policy.
        </p>
      </div>
      <p className="mt-6 text-xs text-foreground/60">
        Need more details? Read our{' '}
        <Link href="/policy/terms" className="underline underline-offset-2">Terms</Link>
        {' '}and{' '}
        <Link href="/policy/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </PageShell>
  );
}
