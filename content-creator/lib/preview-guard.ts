/**
 * PreviewGuard — กัน preview response stale/out-of-order แบบ deterministic [S3.5a ตู๋ P2]
 *
 * ปัญหา: ยิง preview A → เปลี่ยน input เป็น B → A response กลับมาทีหลัง → แสดง prompt A ตอน input B.
 * แก้ด้วย sequence: ทุก begin() ออก token เพิ่มขึ้น ; invalidate() (เรียกตอน input เปลี่ยน) bump seq
 * → ทำให้ in-flight ก่อนหน้า "ตกขบวน". accepts(token) จริงเฉพาะ token ล่าสุดเท่านั้น.
 */
export class PreviewGuard {
  private seq = 0;

  /** เริ่ม preview request ใหม่ → คืน token ของรอบนี้ */
  begin(): number {
    return ++this.seq;
  }

  /** input เปลี่ยน → in-flight request ทั้งหมดถือว่า stale (สำคัญ: ไม่งั้น A กลับมาก่อนกด preview ใหม่จะผ่าน guard) */
  invalidate(): void {
    this.seq++;
  }

  /** response ของ token นี้ ยัง relevant ไหม (ไม่มีอะไรใหม่กว่ามาทับ) */
  accepts(token: number): boolean {
    return token === this.seq;
  }
}
