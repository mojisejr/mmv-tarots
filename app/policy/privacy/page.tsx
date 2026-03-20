import Link from 'next/link';
import { PageShell } from '@/components';

export default function PrivacyPolicyPage() {
  return (
    <PageShell maxWidth="3xl" className="md:pt-14">
      <h1 className="text-3xl font-serif text-foreground mb-4">Privacy Policy</h1>
      <div className="rounded-2xl border border-white/10 bg-white/40 backdrop-blur-xl p-6 space-y-4 text-sm leading-relaxed text-foreground/80">
        <h2 className="text-base font-semibold text-foreground">ภาษาไทย</h2>
        <p>
          เราเก็บข้อมูลเท่าที่จำเป็นต่อการสมัครสมาชิก การยืนยันตัวตน การชำระเงิน และการให้บริการช่วยเหลือผู้ใช้
        </p>
        <p>
          ข้อมูลการชำระเงินถูกประมวลผลโดยผู้ให้บริการชำระเงินภายนอกที่ได้รับการรับรอง โดยข้อมูลบัตรที่มีความอ่อนไหวจะไม่ถูกส่งผ่านเซิร์ฟเวอร์ของเรา
        </p>
        <p>
          เราอาจเก็บบันทึกธุรกรรม บันทึกการใช้งาน และบันทึกการติดต่อ เพื่อป้องกันการทุจริต รองรับการตรวจสอบข้อพิพาท และปฏิบัติตามกฎหมายที่เกี่ยวข้อง
        </p>
        <p>
          เจ้าของข้อมูลสามารถขอเข้าถึง แก้ไข หรือยื่นคำร้องเกี่ยวกับข้อมูลส่วนบุคคลได้ที่ support@mmv-tarots.com
        </p>

        <hr className="border-white/10" />

        <h2 className="text-base font-semibold text-foreground">English</h2>
        <p>
          We collect only the data necessary for account access, identity verification, payment processing, and support operations.
        </p>
        <p>
          Payment information is processed by certified third-party payment providers. Sensitive card details do not pass through our servers.
        </p>
        <p>
          We may retain transaction, usage, and support logs to prevent fraud, handle disputes, and comply with legal obligations.
        </p>
        <p>
          Data-subject requests (access, correction, or other privacy requests) can be submitted to support@mmv-tarots.com.
        </p>
      </div>
      <p className="mt-6 text-xs text-foreground/60">
        Read our{' '}
        <Link href="/policy/terms" className="underline underline-offset-2">Terms</Link>
        {' '}and{' '}
        <Link href="/policy/refund" className="underline underline-offset-2">Refund Policy</Link>.
      </p>
    </PageShell>
  );
}
