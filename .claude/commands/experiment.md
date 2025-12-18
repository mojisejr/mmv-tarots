# Experiment Command

## 🎯 จุดประสงค์

Experiment Command คือ AI-powered code execution system ที่ทดลองแก้ไขโค้ดตามที่ `/debug` แนะนำ ช่วยลดความเสี่ยงและเพิ่มประสิทธิภาพในการแก้ปัญหา

## Usage

```bash
/experiment "รายละเอียดการแก้ไขที่ต้องการทดลอง"
```

### พารามิเตอร์
- `experiment_description` (required): รายละเอียดการแก้ไขโค้ดที่ต้องการทดลอง

## ตัวอย่างการใช้งาน (Examples)

### 1. Fixing API Timeouts
```bash
/experiment "implement Vercel Blob streaming for file upload"
```
**AI จะทำ:**
- ✅ เพิ่ม dependency: `@vercel/blob`
- ✅ แก้ไข upload logic ให้ใช้ streaming
- ✅ เพิ่ม progress indicators
- ✅ อัพเดท error handling
- 📝 บันทึกทุกการเปลี่ยนแปลง

### 2. Fixing React Rendering Errors
```bash
/experiment "fix React rendering by destructuring object properties"
```
**AI จะทำ:**
- ✅ อ่าน component ที่มีปัญหา
- ✅ แก้ไข JSX ไม่ให้ render objects โดยตรง
- ✅ ใช้ property destructuring แทน
- ✅ ทดสอบความถูกต้องของ types

### 3. Database Connection Issues
```bash
/experiment "add retry logic with exponential backoff for database"
```
**AI จะทำ:**
- ✅ เพิ่ม retry wrapper function
- ✅ implement exponential backoff
- ✅ เพิ่ม connection timeout handling
- ✅ ทดสอบกับ database connection

## ภาษาไทย (Language Policy)

**ทุกการตอบสนองและการอธิบายจะเป็นภาษาไทย** เทอร์มทางเทคนิคจะคงเป็นภาษาอังกฤษในวงเล็บ

ตัวอย่าง:
- **User**: "ทำไม fix นีนีไม่ได้?"
- **AI**: "จากการตรวจสอบพบว่า TypeScript type ไม่ตรงกัน แก้ไขโดย..."

## การทำงานภายใน (How It Works)

1. **🔍 Safety Validation**
   - ตรวจสอบว่า changes ปลอดภัย
   - ป้องกันการลบไฟล์สำคัญ
   - validate ความถูกต้องของ syntax

2. **🛠️ Code Analysis**
   - AI อ่านไฟล์ที่เกี่ยวข้อง
   - วิเคราะห์ current implementation
   - หา location ที่ต้องแก้ไข

3. **📝 Smart Changes**
   - ทำการเปลี่ยนแปลงอย่างมีระบบ
   - รักษา code style และ patterns
   - เพิ่ม comments อธิบายสิ่งที่เปลี่ยน

4. **✅ Quality Assurance**
   - ตรวจสอบ TypeScript compilation
   - ตรวจสอบ linting rules
   - validate การทำงานของการเปลี่ยนแปลง

## ความปลอดภัย (Security Features)

### 🚫 Operations ที่ห้าม
- ไม่สามารถลบ `.env`, `package.json`, `next.config.ts`
- ไม่สามารถใช้ `rm -rf` commands
- ไม่สามารถแก้ไข git history
- ไม่สามารถเปลี่ยน database schema โดยตรง

### ✅ Operations ที่อนุญาต
- แก้ไข source code (`.ts`, `.tsx`, `.js`, `.jsx`)
- เพิ่ม dependencies ใน `package.json`
- แก้ไข configuration files (อย่างมีข้อจำกัด)
- สร้าง test files

## ข้อมูลที่เก็บ (Data Storage)

- **Experiments**: ใน `.claude/memory/experiment-command.db`
- **Change History**: บันทึกทุกการแก้ไข
- **Success Rates**: ติดตามว่า approaches ไหนใช้ได้ผล

## Command ที่เกี่ยวข้อง (Related Commands)

- `/debug` - วิเคราะห์ปัญหาก่อน experiment
- `/aha` - บันทึกสิ่งที่เรียนรู้หลัง experiment
- `/learn` - ค้นหา experiments ที่ประสบความสำเร็จในอดีต
- `/debug-chain` - ดู chain ของ experiments ที่เกี่ยวข้อง

## ตัวอย่าง Workflow ที่สมบูรณ์

```bash
# 1. Debug ปัญหา
/debug "API returns 500 error when uploading large files"

# 2. AI แนะนำ solution
# → "File size exceeds Vercel function limit"
# → Suggest: "Use Vercel Blob Storage"

# 3. ทดลองแก้ไข
/experiment "implement Vercel Blob Storage streaming"

# 4. AI ทำการเปลี่ยนแปลง
# ✅ Add @vercel/blob dependency
# ✅ Replace upload logic
# ✅ Add streaming support
# ✅ Update error handling

# 5. ทดสอบและเรียนรู้
/aha "Blob streaming แก้ปัญหา file size ได้สำเร็จ"
```

## ข้อควรระวัง (Important Notes)

1. **🔒 Always Safe** - AI จะปฏิเสธ operations ที่เสี่ยง
2. **📝 Documented** - ทุกการเปลี่ยนแปลงมีการบันทึกไว้
3. **🧪 Testable** - พร้อมทดสอบหลังการเปลี่ยนแปลง
4. **🔄 Reversible** - สามารถ rollback ได้ถ้าจำเป็น
5. **⚡ Fast** - ทำการเปลี่ยนแปลงภายใน 30 วินาที

## Success Metrics

- **Time Saved**: ลดเวลาแก้ปัญหาจาก 30 นาที → 5 นาที
- **Success Rate**: >85% ของ experiments สำเร็จ
- **Safety**: 0 incidents ของ data loss
- **Learning**: ทุกครั้งเพิ่มความรู้ให้ AI

**Experiment Command ทำให้การแก้ปัญหาเป็นเรื่องง่ายและปลอดภัย! 🧪⚡**

## Examples

```bash
# Fix API issues
/experiment "implement Vercel Blob Storage for file upload"

# Fix React errors
/experiment "fix React destructuring error with optional chaining"

# Database improvements
/experiment "add retry logic with exponential backoff"
```

## Notes

- AI validates all changes for safety before applying
- Failed experiments can be rolled back automatically
- All changes are documented for future reference
- Best for tested, low-risk code modifications