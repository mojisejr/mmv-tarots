/**
 * /data-deletion — public Data Deletion Instructions (Meta App Review requirement)
 * ไม่อยู่ใต้ /content-creator + ไม่ต้อง login (Meta reviewer + ใครก็เปิดได้)
 * เนื้อหาตามจริง: app ใช้โพสต์เพจ ไม่เก็บข้อมูลส่วนตัวผู้ใช้ Facebook (login หลักใช้ LINE)
 */
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "วิธีลบข้อมูล · Data Deletion — แม่หมอมีมี่ (MimiVibe)",
  description: "Data deletion instructions for MimiVibe / แม่หมอมีมี่",
};

const CONTACT = "nonthasak.l@gmail.com";
const UPDATED = "16 มิถุนายน 2569 / 16 June 2026";

export default function DataDeletionPage() {
  return (
    <main style={{ maxWidth: 760, margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif", lineHeight: 1.65, color: "#1f2937" }}>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 4 }}>วิธีลบข้อมูล · Data Deletion Instructions</h1>
      <p style={{ color: "#6b7280", marginTop: 0 }}>แม่หมอมีมี่ (MimiVibe) — ปรับปรุงล่าสุด / Last updated: {UPDATED}</p>

      {/* ภาษาไทย */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>ภาษาไทย</h2>
        <p>
          แอป <strong>mimivibe-management</strong> ของแม่หมอมีมี่ (MimiVibe) ใช้สำหรับ
          <strong> เผยแพร่เนื้อหาขึ้นเพจ Facebook ของเราเองเท่านั้น</strong> (จัดการโพสต์ของเพจ)
          แอปนี้ <strong>ไม่ได้เก็บหรือประมวลผลข้อมูลส่วนตัวของผู้ใช้ Facebook</strong> ผ่าน Facebook Login
          (การเข้าสู่ระบบของผู้ใช้ MimiVibe ใช้ผู้ให้บริการอื่น ไม่ใช่ Facebook)
        </p>
        <p>
          หากคุณเชื่อว่าเรามีข้อมูลส่วนตัวของคุณและต้องการให้ลบ โปรดส่งอีเมลถึง{" "}
          <a href={`mailto:${CONTACT}`} style={{ color: "#2563eb" }}>{CONTACT}</a> หัวข้อ <em>“ขอลบข้อมูล”</em>{" "}
          พร้อมระบุรายละเอียดที่ช่วยให้เรายืนยันตัวตนได้ เราจะตรวจสอบและดำเนินการลบข้อมูลที่เกี่ยวข้อง
          ภายใน <strong>30 วัน</strong> นับจากวันที่ยืนยันคำขอ (ยกเว้นข้อมูลที่ต้องเก็บตามกฎหมาย)
        </p>
      </section>

      {/* English */}
      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700 }}>English</h2>
        <p>
          The <strong>mimivibe-management</strong> app for MimiVibe (แม่หมอมีมี่) is used{" "}
          <strong>solely to publish content to our own Facebook Page</strong> (managing the Page’s posts).
          This app <strong>does not collect or process personal data of Facebook users</strong> via Facebook Login
          (MimiVibe user sign-in uses a different provider, not Facebook).
        </p>
        <p>
          If you believe we hold your personal data and would like it deleted, please email{" "}
          <a href={`mailto:${CONTACT}`} style={{ color: "#2563eb" }}>{CONTACT}</a> with the subject{" "}
          <em>“Data Deletion Request”</em> and details that help us verify your identity. We will review and delete
          any related data within <strong>30 days</strong> of a verified request (except data we must retain by law).
        </p>
      </section>

      <p style={{ marginTop: 32, color: "#6b7280", fontSize: 14 }}>
        ติดต่อ / Contact: <a href={`mailto:${CONTACT}`} style={{ color: "#2563eb" }}>{CONTACT}</a>
      </p>
    </main>
  );
}
