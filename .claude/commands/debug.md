# Debug Command

## 🎯 จุดประสงค์

Debug Command เป็น AI-powered debugging assistant ที่วิเคราะห์ปัญหาและให้คำแนะนำแก้ไขอย่างเป็นระบบ ช่วยลดเวลาในการแก้ปัญหาที่ซับซ้อน

## Usage

```bash
/debug "ข้อความแสดงความผิดพลาดที่พบ"
```

### พารามิเตอร์
- `error_message` (required): ข้อความแสดงความผิดพลาดที่ต้องการวิเคราะห์

## ตัวอย่างการใช้งาน (Examples)

### 1. Debugging API Errors
```bash
/debug "504 Gateway Timeout when uploading large files"
```
**ผลลัพธ์:**
- ✅ AI วิเคราะห์ root cause: "Vercel function size limit exceeded"
- 💡 แนะนำ solution: "ใช้ Vercel Blob Storage streaming"
- 🔗 Command ถัดไป: `/experiment "implement Vercel Blob streaming"`

### 2. Debugging React Errors
```bash
/debug "Objects are not valid as a React child error"
```
**ผลลัพธ์:**
- ✅ AI วิเคราะห์: "พยายาม render object โดยตรงใน JSX"
- 💡 แนะนำ: "ใช้ JSON.stringify() หรือเข้าถึง property ที่ต้องการ"
- 🔗 Command ถัดไป: `/experiment "fix React rendering issue"`

### 3. Debugging Database Issues
```bash
/debug "Connection timeout to Neon database"
```
**ผลลัพธ์:**
- ✅ AI วิเคราะห์: "Connection pool exhaustion"
- 💡 แนะนำ: "เพิ่ม connection timeout และ retry logic"
- 🔗 Command ถัดไป: `/experiment "implement database retry mechanism"`

## ภาษาไทย (Language Policy)

**ทุกคำตอบจาก AI จะเป็นภาษาไทย** ไม่ว่าผู้ใช้จะถามเป็นภาษาใด คำศัพท์ทางเทคนิคจะคงเป็นภาษาอังกฤษในวงเล็บ

ตัวอย่าง:
- **User (English)**: "Why is the API failing?"
- **AI (Thai)**: "จากการวิเคราะห์พบว่า API timeout เกิดจาก..."

## การทำงานภายใน (How It Works)

1. **🔍 Analysis Phase**
   - AI อ่านและวิเคราะห์ error message
   - ตรวจสอบ patterns ที่เคยเจอในอดีต
   - ค้นหา solutions ที่เคยสำเร็จ

2. **🧠 Pattern Recognition**
   - ค้นหา debug patterns ที่คล้ายกัน
   - ดึงข้อมูลจาก knowledge base
   - แนะนำ approach ที่เคยใช้สำเร็จ

3. **📋 Action Plan**
   - สร้างแผนการแก้ไขแบบ step-by-step
   - จัดลำดับความสำคัญของการแก้ไข
   - แนะนำ command ถัดไปโดยอัตโนมัติ

4. **💾 Learning Storage**
   - เก็บ error patterns ไว้เรียนรู้
   - บันทึก solutions ที่ใช้ได้ผล
   - สร้าง knowledge สำหรับครั้งถัดไป

## ข้อมูลที่เก็บ (Data Storage)

- **Sessions**: ใน `.claude/memory/debug-command.db`
- **Patterns**: จัดเก็บ error → solution mappings
- **Learning**: บันทึกสิ่งที่ AI เรียนรู้จากแต่ละ session

## Command ที่เกี่ยวข้อง (Related Commands)

- `/experiment` - ทดลองแก้ไขปัญหาตามที่ /debug แนะนำ
- `/aha` - บันทึ่บสิ่งที่เรียนรู้จากการ debug
- `/debug-patterns` - ดู patterns การ debug ที่พบบ่อย
- `/learn` - ค้นหา solutions จากอดีต

## ข้อควรระวัง (Important Notes)

1. **🔒 Security** - ไม่เก็บ sensitive data ใน memory
2. **⏱️ Performance** - วิเคราะห์ภายใน 5-10 วินาที
3. **🎯 Focus** - มุ่งเน้นที่ปัญหาที่ระบุโดยเฉพาะ
4. **🔄 Iterative** - พร้อมให้ debug ซ้ำถ้า solution แรกไม่สำเร็จ

## ตัวอย่าง Workflow ที่สมบูรณ์

```bash
# 1. เจอ error
/debug "Cannot access 'variable' before initialization"

# 2. AI วิเคราะห์และแนะนำ
# → "Temporal dead zone error ใน JavaScript/TypeScript"
# → Suggested fix: "ใช้ let/const แทน var หรือย้าย declaration"

# 3. ทดลองแก้ไข
/experiment "fix temporal dead zone by using let declaration"

# 4. ทดสอบและบันทึ่บสิ่งที่เรียนรู้
/aha "ใช้ let/const แก้ปัญหา temporal dead zone ได้สำเร็จ"
```

**Debug Command ทำให้การแก้ปัญหาเร็วขึ้น 10x ด้วย AI-powered analysis! 🚀**

## Examples

```bash
# Quick debug
/debug "API returns 500 error"

# Complex issue
/debug "Cannot destructure property 'user' of undefined"

# Database issue
/debug "Connection timeout to Neon database"
```

## Notes

- Always include the exact error message for better analysis
- Command works best with specific, actionable errors
- AI will suggest the next command automatically
- All debug sessions are saved for future reference