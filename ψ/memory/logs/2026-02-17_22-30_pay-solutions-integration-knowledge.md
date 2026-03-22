# 📸 Snapshot: Pay Solutions Integration Strategy (Redirect API)

**Timestamp**: 2026-02-17 22:30 GMT+7
**Project**: `projects/mmv-tarots`
**Topic**: Payment Gateway Integration Research (Pay Solutions)

## 🔍 Discovery & Confirmation
จากการค้นคว้าและยืนยันผ่าน Official Documentation ของ Pay Solutions พบว่า **สามารถใช้งานร่วมกับ Next.js ได้อย่างสมบูรณ์** และเป็นทางเลือกที่ดีที่สุดในขณะนี้แทน Stripe

### 1. The "Simple Payment" Method (Redirect API)
- **Concept**: ใช้โมเดล **Hosted Payment Page** ซึ่งเหมือนกับ Stripe Checkout ในแง่ของ User Experience
- **Mechanism**: ใช้การส่งข้อมูลผ่าน **HTTP POST Form** (Standard HTML Form) ไปยัง URL ของ Pay Solutions
    - URL: `https://payments.paysolutions.asia/payment`
- **Security**: เราไม่ต้องเก็บข้อมูลบัตรเครดิตลูกค้า (No PCI DSS burden) เพราะลูกค้ากรอกข้อมูลที่หน้าของ Pay Solutions โดยตรง

### 2. Implementation Strategy (Next.js)
เนื่องจาก Pay Solutions ใช้ Form Post แบบดั้งเดิม (ไม่ใช่ REST API เพื่อขอ Session ID แบบ Stripe) เราจะใช้เทคนิค **Auto-Submit Hidden Form**:

1.  **Frontend Component**: สร้าง `PaySolutionsForm` ที่รับ Props เป็น `orderId`, `amount`, `customerEmail`.
2.  **Hidden Fields**:
    - `merchantid`: รหัสร้านค้าของเรา
    - `refno`: Order ID (Unique)
    - `customeremail`: อีเมลลูกค้า
    - `productdetail`: รายละเอียดสินค้า ("Personal Consultation")
    - `total`: ยอดเงิน
    - `cc`: Currency Code (00 = THB)
    - `lang`: Language (TH หรือ EN)
3.  **Auto-Redirect**: เมื่อ Component ถูก Render หรือ User กดปุ่ม "Pay", JavaScript จะสั่ง `form.submit()` ทันทีเพื่อพา User ไปยังหน้าจ่ายเงิน

### 3. Stripe Comparison
| Feature | Stripe Checkout | Pay Solutions (Simple Payment) |
| :--- | :--- | :--- |
| **Integration** | Server-side API call -> Get URL -> Redirect | Client-side Form Submit -> Redirect |
| **UX** | Hosted Page (Modern UI) | Hosted Page (Functional UI with Bank Logos) |
| **Payment Methods** | Global focus | **Thai focus** (PromptPay, Installment, Thai Banks) |
| **Security** | High (Tokenized) | High (Offloaded to Gateway) |

## 🛠️ Next Action Plan
- [ ] สมัคร Account Pay Solutions ในนามบุคคลธรรมดา (Individual)
- [ ] สร้าง `PaySolutionsForm` component ใน `mmv-tarots`
- [ ] ทดสอบยิง Form Post ไปยัง Environment จริง (หรือ Sandbox ถ้ามี)
- [ ] เตรียมหน้า `return_url` (Success/Failed) เพื่อรับ User กลับมาหลังจ่ายเงิน

---
**Oracle Note**: "Old school but gold." วิธี Form Post เป็นวิธีที่เสถียรและ Simple ที่สุดสำหรับ Gateway ในไทยครับ
