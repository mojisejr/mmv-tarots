import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 md:py-14">
      <h1 className="text-3xl font-serif text-foreground mb-4">Terms of Service</h1>
      <div className="rounded-2xl border border-white/10 bg-white/40 backdrop-blur-xl p-6 space-y-4 text-sm leading-relaxed text-foreground/80">
        <h2 className="text-base font-semibold text-foreground">ภาษาไทย</h2>
        <p>
          บริการ MimiVibe เป็นบริการดิจิทัลเพื่อการสะท้อนตนเองและความเป็นอยู่ที่ดีเชิงใจ โดยเนื้อหาที่สร้างขึ้นมีวัตถุประสงค์เพื่อการบันเทิงและการพิจารณาส่วนบุคคล
        </p>
        <p>
          ผู้ใช้ต้องมีอายุอย่างน้อย 18 ปี และรับผิดชอบการใช้งานบัญชีของตนเองทั้งหมด รวมถึงการรักษาข้อมูลเข้าสู่ระบบ
        </p>
        <p>
          การชำระเงินคือการซื้อโทเคนดิจิทัลเพื่อปลดล็อกฟีเจอร์ในแพลตฟอร์ม ไม่ใช่การรับประกันผลลัพธ์เฉพาะทางวิชาชีพ
        </p>
        <p>
          ห้ามใช้งานแพลตฟอร์มในทางผิดกฎหมาย หลอกลวง คุกคาม หรือพยายามโจมตีระบบ บริษัทมีสิทธิ์ระงับหรือยุติบัญชีที่ละเมิดเงื่อนไข
        </p>
        <p>
          ข้อกำหนดนี้อยู่ภายใต้กฎหมายไทย และข้อพิพาทให้อยู่ในเขตอำนาจศาลไทย
        </p>

        <hr className="border-white/10" />

        <h2 className="text-base font-semibold text-foreground">English</h2>
        <p>
          MimiVibe provides digital experiences for personal reflection and wellness. Generated content is intended for entertainment and self-reflection purposes.
        </p>
        <p>
          You must be at least 18 years old to use the service and are responsible for all activity under your account.
        </p>
        <p>
          Payment is for digital tokens used to unlock platform features and does not guarantee specific professional outcomes.
        </p>
        <p>
          Illegal, abusive, fraudulent, or system-disruptive activities are prohibited. We may suspend or terminate accounts that violate these terms.
        </p>
        <p>
          These terms are governed by Thai law, and disputes are subject to Thai court jurisdiction.
        </p>
      </div>
      <p className="mt-6 text-xs text-foreground/60">
        See also our{' '}
        <Link href="/policy/refund" className="underline underline-offset-2">Refund Policy</Link>
        {' '}and{' '}
        <Link href="/policy/privacy" className="underline underline-offset-2">Privacy Policy</Link>.
      </p>
    </div>
  );
}
