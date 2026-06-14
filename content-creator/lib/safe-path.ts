/**
 * safe-path — path traversal + symlink escape guard ที่เดียว (DRY) [S4a]
 *
 * รวม logic ที่ verify แล้วจาก media route (S3 P2) + loadBrandRef (S3.5c ตู๋ P1) ไว้ที่เดียว
 * เพื่อกัน "เขียน lexical check ซ้ำแล้วลืม symlten" (เคยพลาดรอบ 2). file access ใหม่ใน content-creator
 * (เช่น publish อ่าน image) เรียกอันนี้ — ไม่เขียน path-safety เองอีก.
 */
import { existsSync, lstatSync, realpathSync } from "node:fs";
import { resolve, sep } from "node:path";

/**
 * คืน real absolute path ที่อยู่ "ใต้ rootDir จริง" เท่านั้น (กัน ../ traversal + symlink ชี้ออกนอก).
 * @returns real path ถ้าปลอดภัย+มีจริง ; null ถ้าไม่ปลอดภัย/ไม่พบ (caller ตัดสินเอง 404 หรือ throw)
 */
export function safeResolveUnderRoot(rootDir: string, relPath: string): string | null {
  try {
    const root = realpathSync(resolve(rootDir)); // realpath root (กัน symlink ใน path เช่น /tmp→/private/tmp)
    const candidate = resolve(root, relPath);
    if (!existsSync(candidate)) return null;
    if (lstatSync(candidate).isSymbolicLink()) return null; // ไม่ follow symlink (final)
    const real = realpathSync(candidate);
    if (real !== candidate) return null; // มี symlink component กลางทาง
    if (real !== root && !real.startsWith(root + sep)) return null; // หลุดนอก root
    return real;
  } catch {
    return null; // stat ล้ม / root ไม่มี → ถือว่าไม่พบ
  }
}
