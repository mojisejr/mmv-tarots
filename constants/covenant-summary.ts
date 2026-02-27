export interface CovenantSummaryItem {
  key: 'refund' | 'service' | 'privacy';
  title: string;
  description: string;
}

export interface CovenantPolicyLink {
  key: 'refund' | 'terms' | 'privacy';
  label: string;
  href: '/policy/refund' | '/policy/terms' | '/policy/privacy';
}

export const COVENANT_SUMMARY_ITEMS: CovenantSummaryItem[] = [
  {
    key: 'refund',
    title: 'การใช้ Stars เป็น Digital Token (ไม่คืนเงิน)',
    description:
      'Stars ที่ซื้อหรือได้รับ เป็นโทเคนดิจิทัลสำหรับปลดล็อกเนื้อหาในระบบ และไม่สามารถแลกคืนเป็นเงินสดได้หลังเริ่มใช้งาน',
  },
  {
    key: 'service',
    title: 'ลักษณะบริการเป็น Personalized Insight และแนะแนวส่วนบุคคล',
    description:
      'บริการนี้มีวัตถุประสงค์เพื่อการสะท้อนตนเองและความบันเทิงเชิง Wellness Guidance ไม่ใช่คำแนะนำทางการแพทย์ กฎหมาย หรือการลงทุน',
  },
  {
    key: 'privacy',
    title: 'ข้อมูลผู้ใช้ได้รับการดูแลตามมาตรฐาน PDPA',
    description:
      'ข้อมูลบัญชีและประวัติการใช้งานถูกจัดเก็บเพื่อให้บริการอย่างปลอดภัย พร้อมช่องทางติดต่อ support@mmv-tarots.com หากต้องการความช่วยเหลือ',
  },
];

export const COVENANT_POLICY_LINKS: CovenantPolicyLink[] = [
  { key: 'refund', label: 'Refund Policy', href: '/policy/refund' },
  { key: 'terms', label: 'Terms', href: '/policy/terms' },
  { key: 'privacy', label: 'Privacy', href: '/policy/privacy' },
];

export const COVENANT_ACCEPTANCE_LABEL =
  'ฉันได้อ่านและยอมรับ Refund Policy, Terms และ Privacy Policy ก่อนเริ่มใช้งานระบบ';
