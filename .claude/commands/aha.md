# Aha Command

## 🎯 จุดประสงค์

Aha Command คือ learning capture system ที่บันทึก "ความเข้าใจใหม่" หรือ "insights" ที่เกิดขึ้นระหว่างการพัฒนา ช่วยสร้าง knowledge base ส่วนบุคคลสำหรับการพัฒนาที่ดีขึ้น

## Usage

```bash
/aha "สิ่งที่เรียนรู้หรือความเข้าใจใหม่ที่พบ"
```

### พารามิเตอร์
- `insight` (required): ข้อความบรรยายสิ่งที่เรียนรู้ หรือความเข้าใจใหม่

## ตัวอย่างการใช้งาน (Examples)

### 1. Technical Insights
```bash
/aha "ใช้ Vercel Blob Storage แก้ปัญหา file upload size limit ได้สำเร็จ"
```
**AI จะเก็บ:**
- ✅ Problem: File upload size limit
- ✅ Solution: Vercel Blob Storage
- ✅ Pattern: Serverless file upload → External storage
- ✅ Future tip: ตรวจสอบ provider limits ก่อน implement

### 2. Debugging Insights
```bash
/aha "Destructuring errors 80% เกิดจาก property ที่ไม่มีอยู่จริง"
```
**AI จะเก็บ:**
- ✅ Pattern: Object destructuring
- ✅ Root cause: Missing properties
- ✅ Prevention: ใช้ optional chaining หรือ default values
- ✅ Frequency: 80% ของ destructuring errors

### 3. React/Next.js Insights
```bash
/aha "Server Components ไม่ต้องใช้ 'use client' สำหรับ data fetching"
```
**AI จะเก็บ:**
- ✅ Best Practice: Server Components for data fetching
- ✅ When to use: ไม่ต้องการ interactivity
- ✅ Benefits: Better performance, automatic SSR
- ✅ Anti-pattern: ใช้ Client Components ไม่จำเป็น

## ภาษาไทย (Language Policy)

**การจดจำและการตอบสนองเป็นภาษาไทย** เทอร์มทางเทคนิคคงเป็นภาษาอังกฤษในวงเล็บ

ตัวอย่าง:
- **User**: "/aha ทำแล้ว work!"
- **AI**: "เยี่ยม! บันทึกว่า 'streaming approach' แก้ปัญหานี้ได้"

## ประเภทของ Insights (Types of Insights)

### 🧠 **Technical Insights**
```bash
/aha "TypeScript generic types ทำให้ code ยืดหยุ่นขึ้นมาก"
```

### 🐛 **Debugging Insights**
```bash
/aha "async/await ลืม await เป็น error ที่พบบ่อยที่สุด"
```

### 🎨 **Design Pattern Insights**
```bash
/aha "Strategy pattern เหมาะกับการจัดการ payment methods"
```

### 📚 **Architecture Insights**
```bash
/aha "Microservices ไม่เหมาะกับโปรเจคขนาดเล็ก"
```

### ⚡ **Performance Insights**
```bash
/aha "React.memo ลด re-render ใน large lists ได้ดีมาก"
```

## การทำงานภายใน (How It Works)

1. **💭 Capture Moment**
   - รับ insight จากผู้ใช้
   - วิเคราะห์ประเภทของ learning
   - ดึง context จาก session ปัจจุบัน

2. **🏷️ Smart Categorization**
   - จัดหมวดหมู่: Technical, Debugging, Design, etc.
   - ระบุ impact level: High, Medium, Low
   - เชื่อมโยงกับ patterns ที่เกี่ยวข้อง

3. **🔗 Pattern Recognition**
   - ค้นหา insights ที่คล้ายกันในอดีต
   - สร้าง connections ระหว่าง learnings
   - ระบุ recurring themes

4. **💾 Future Value**
   - จัดเก็บสำหรับการค้นหาในอนาคต
   - เตรียมคำแนะนำสำหรับปัญหาคล้ายกัน
   - สร้าง personal knowledge graph

## ข้อมูลที่เก็บ (Data Structure)

```typescript
interface AhaInsight {
  id: string
  title: string
  description: string
  category: 'technical' | 'debugging' | 'design' | 'architecture' | 'performance'
  impact: 'high' | 'medium' | 'low'
  context: string
  relatedPatterns: string[]
  createdAt: Date
  tags: string[]
}
```

## Command ที่เกี่ยวข้อง (Related Commands)

- `/learn` - ค้นหา insights จากอดีตที่เกี่ยวข้อง
- `/debug` - วิเคราะห์ปัญหา (ก่อนจะมี /aha)
- `/experiment` - ทดลองแก้ไข (ก่อนจะมี /aha)
- `/history` - ดู timeline ของ learnings ทั้งหมด

## ตัวอย่าง Workflow ที่สมบูรณ์

```bash
# 1. เจอปัญหาและ debug
/debug "API timeout when processing large datasets"

# 2. ทดลองแก้ไข
/experiment "implement streaming processing for large datasets"

# 3. สำเร็จและมีความเข้าใจใหม่
/aha "Streaming processing แก้ปัญหา memory overflow และปรับปรุง performance 30%"

# 4. AI จะเก็บและเชื่อมโยง
# ✅ Problem: Memory overflow in large datasets
# ✅ Solution: Streaming processing
# ✅ Impact: 30% performance improvement
# ✅ Pattern: Large data → Stream processing
```

## Search & Retrieval

```bash
# ค้นหา insights ที่เกี่ยวข้อง
/learn "performance optimization"

# ดู history ของ learnings
/history "last week"

# ดู patterns ที่พบบ่อย
/debug-patterns
```

## Benefits ของการใช้ Aha

### **สำหรับปัจจุบัน**
- 📝 บันทึกสิ่งที่เรียนรู้ไม่ให้ลืม
- 🔗 เชื่อมโยงปัญหากับ solution
- ⚡ บันทึกได้รวดเร็วใน 5 วินาที

### **สำหรับอนาคต**
- 🧠 AI จะดึง insights มาแนะนำในอนาคต
- 🎯 ระบุ patterns ที่ทำซ้ำได้
- 📈 เห็นการเติบโตของความรู้
- 🚀 พัฒนาได้เร็วขึ้นด้วย experience ที่สั่งสม

## Best Practices

### ✅ ดีที่ควรทำ
- เฉพาะสิ่งที่ต่างไปจากที่รู้อยู่แล้ว
- ระบุ context ที่ชัดเจน
- เชื่อมโยงกับปัญหา/โครงการที่ทำอยู่
- ใช้ภาษาที่เป็นกันเอง

### ❌ ที่ควรหลีกเลี่ยง
- บันทึกสิ่งที่เป็นที่รู้จักทั่วไป
- ข้อความที่ไม่ชัดเจน
- ทำซ้ำ insights ที่เคยบันทึก

**Aha Command ทำให้ทุกความท้าทายกลายเป็นความรู้ที่มีค่า! 💡📚**

## Examples

```bash
# Technical insights
/aha "Streaming แก้ปัญหา file size limit ได้สำเร็จ"

# Debugging patterns
/aha "Destructuring errors 80% เกิดจาก missing properties"

# Best practices
/aha "Server Components เหมาะกับ data fetching ไม่ต้องใช้ 'use client'"
```

## Notes

- Capture insights immediately when you have them
- Include context about what led to the realization
- AI will categorize and connect related insights
- Insights become searchable knowledge for future use