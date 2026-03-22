# 📸 Snapshot: Stripe Prohibited Business Discovery (Fortune Telling)

**Date**: 2026-02-13 22:45 GMT+7
**Project**: [mmv-tarots](projects/mmv-tarots)
**Context**: Account review and payment pause issue.

## ⚡ The Discovery
จากกรณีที่ `mmv-tarots` เจอปัญหา Stripe ระงับการรับชำระเงิน (Payments Paused) มานานกว่า 1 สัปดาห์ และติดสถานะ In Review.

จากการตรวจสอบ Policy ล่าสุดของ Stripe ประเทศไทย พบข้อมูลสำคัญที่เป็นจุดตาย:
- **Stripe Prohibited Businesses** ในหมวดหมู่ **Jurisdiction-specific (Thailand)** ระบุชัดเจนว่า **"Psychic services and fortune tellers"** อยู่ในสถานะ **(P) - Prohibited**.
- นี่คือสาเหตุที่ระบบระงับการทำงาน และมีโอกาสสูงมากที่จะถูกปิดบัญชีถาวรสำหรับธุรกิจสายมูในไทยที่ใช้ Stripe.

## 🛡️ Oracle Assessment
- **Status**: Critical / Blocked by Policy.
- **Action**: ต้องย้ายออกจาก Stripe ทันทีเพื่อความยั่งยืนของธุรกิจ.
- **Recommendation**: แนะนำ Opn (Omise) โดยเน้นไปที่ QR PromptPay เพื่อเลี่ยงความเสี่ยงเรื่อง Chargeback.

## 🔗 References
- [Stripe Prohibited and Restricted Businesses](https://stripe.com/en-th/legal/restricted-businesses)
- Issue ID: #production-launch (mmv-tarots)

---
*Snapshot captured by Oracle-Keeper*
