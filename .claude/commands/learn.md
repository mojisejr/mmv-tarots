# Learn Command

## 🎯 จุดประสงค์

Learn Command คือ intelligent knowledge retrieval system ที่ค้นหาข้อมูลและ solutions จากอดีตที่เคยสำเร็จ ช่วยให้การแก้ปัญหาในปัจจุบันเร็วขึ้นด้วยประสบการณ์ที่สั่งสมมา

## Usage

```bash
/learn "คำค้นหาสิ่งที่ต้องการเรียนรู้"
```

### พารามิเตอร์
- `query` (required): คำค้นหาสิ่งที่ต้องการเรียนรู้หรือหา solution

## ตัวอย่างการใช้งาน (Examples)

### 1. ค้นหาวิธีแก้ปัญหาที่เคยเจอ
```bash
/learn "file upload timeout solutions"
```
**ผลลัพธ์:**
- ✅ **Session DEBUG-001**: Vercel Blob streaming (15 นาที)
- ✅ **Session DEBUG-045**: Chunked uploads (2 ชั่วโมง)
- ✅ **Session DEBUG-089**: Client-side compression (1 ชั่วโมง)
- 💡 **แนะนำ**: "ใช้ streaming approach เร็วที่สุด"

### 2. ค้นหาวิธีแก้ error patterns
```bash
/learn "destructuring assignment errors"
```
**ผลลัพธ์:**
- ✅ **Pattern**: 80% เกิดจาก missing properties
- ✅ **Solution**: ใช้ optional chaining (`?.`)
- ✅ **Example**: `const { name } = user || {}`
- ✅ **Prevention**: Validate object ก่อน destructure

### 3. ค้นหา best practices
```bash
/learn "React performance optimization"
```
**ผลลัพธ์:**
- ✅ **React.memo**: ลด re-render ใน lists
- ✅ **useCallback**: สำหรับ function props
- ✅ **useMemo**: สำหรับ expensive calculations
- ✅ **Code splitting**: ลด bundle size

### 4. ค้นหา architecture patterns
```bash
/learn "microservices vs monolith"
```
**ผลลัพธ์:**
- ✅ **Experience**: Microservices ไม่เหมาะกับโปรเจคเล็ก
- ✅ **Rule**: ถ้า <5 services → ใช้ monolith
- ✅ **Exception**: ถ้าต้องการ scalable จริงจัง → microservices

## ภาษาไทย (Language Policy)

**ทุกการค้นหาและตอบสนองเป็นภาษาไทย** เทอร์มทางเทคนิคคงเป็นภาษาอังกฤษในวงเล็บ

ตัวอย่าง:
- **User**: "/learn async error"
- **AI**: "พบ 3 วิธีจัดการ async errors: try/catch, Promise.catch(), Error Boundaries"

## การค้นหาขั้นสูง (Advanced Search)

### 🔍 **Semantic Search**
ค้นหาตามความหมาย ไม่ใช่แค่ keyword:
```bash
/learn "ทำให้เว็บเร็วขึ้น"  # จะหา performance optimization
```

### ⏰ **Time-based Search**
```bash
/learn "database issues last month"
/learn "React patterns สัปดาห์ที่แล้ว"
```

### 🏷️ **Tag-based Search**
```bash
/learn "performance tag:database"
/learn "debugging tag:production"
```

### 📊 **Success Rate Filter**
```bash
/learn "API timeout success rate:90%"  # แสดงแค่ที่สำเร็จ >90%
```

## ประเภทของข้อมูลที่ค้นหาได้

### 🐛 **Debug Solutions**
- Error patterns ที่เคยแก้
- Solutions ที่ใช้ได้ผล
- Time ที่ใช้ในการแก้

### 💡 **Technical Insights**
- Best practices ที่ค้นพบ
- Performance optimizations
- Code patterns ที่ดี

### 🏗️ **Architecture Decisions**
- เหตุผลที่เลือก technologies
- Trade-offs ที่พิจารณา
- Lessons learned

### 📚 **Learning Resources**
- Documentation ที่มีประโยชน์
- Examples ที่ใช้ได้จริง
- Common pitfalls

## การจัดลำดับผลลัพธ์ (Ranking Algorithm)

### **Priority Factors:**
1. **Success Rate** - solutions ที่ใช้ได้ผลบ่อยสุด
2. **Relevance** - ตรงกับ query มากสุด
3. **Recency** - เร็วๆ นี้มีความสำคัญสูงกว่า
4. **Impact** - solutions ที่มีผลกระทบสูง
5. **Similarity** - context ที่คล้ายกัน

### **Result Format:**
```typescript
interface SearchResult {
  id: string
  title: string
  description: string
  category: 'debug' | 'insight' | 'pattern' | 'best-practice'
  successRate: number
  timeToSolve: string  // "15 min", "2 hr", etc.
  tags: string[]
  relatedTo: string[]
  when: Date
  confidence: number  // 0-100
}
```

## Command ที่เกี่ยวข้อง (Related Commands)

- `/aha` - บันทึกสิ่งที่เรียนรู้ใหม่
- `/debug` - วิเคราะห์ปัญหาปัจจุบัน
- `/history` - ดู timeline ของ learnings
- `/debug-patterns` - ดู patterns ที่พบบ่อย

## ตัวอย่าง Workflow ที่สมบูรณ์

```bash
# 1. เจอปัญหาใหม่
# API timeout เมื่อ upload ไฟล์ใหญ่

# 2. ค้นหา solutions จากอดีต
/learn "file upload timeout"

# 3. ได้ผลลัพธ์ที่เคยสำเร็จ
# ✅ Vercel Blob streaming (15 min, 95% success)
# ✅ Chunked uploads (2 hr, 80% success)

# 4. เลือก solution ที่ดีที่สุด
/experiment "implement Vercel Blob streaming"

# 5. สำเร็จและบันทึกสิ่งที่เรียนรู้
/ha "Blob streaming แก้ปัญหา file size ได้ดีที่สุด"
```

## Search Operators

### **Basic Operators:**
- `+`: ต้องมีคำนี้
- `-`: ต้องไม่มีคำนี้
- `""`: exact phrase
- `*`: wildcard

### **Advanced Operators:**
- `category:debug`: ค้นในหมวดเฉพาะ
- `success:>90%`: success rate มากกว่า 90%
- `time:<30min`: แก้ได้ภายใน 30 นาที
- `recent:7d`: เจอใน 7 วันที่ผ่านมา

## Performance Metrics

- **Search Speed**: <200ms สำหรับทุก queries
- **Relevance**: >85% ของผลลัพธ์มีประโยชน์
- **Coverage**: บันทึกทุก sessions และ learnings
- **Recall**: ดึงข้อมูลที่เกี่ยวข้องได้ >90%

## Best Practices

### ✅ **ควรค้นหาแบบนี้:**
- เฉพาะสิ่งที่ต้องการจริงๆ
- ใช้คำที่เจาะจง
- ลองหลายคำถ้าไม่เจอ
- ดู confidence score ของผลลัพธ์

### ❌ **ควรหลีกเลี่ยง:**
- ค้นหาคำทั่วไปเกินไป
- ถือว่า AI รู้ทุกอย่าง
- ไม่อ่าน context ของผลลัพธ์
- ใช้ครั้งเดียวแล้วไม่บันทึก

**Learn Command ทำให้ประสบการณ์ในอดีตเป็นประโยชน์ในปัจจุบัน! 🧠⚡**

## Examples

```bash
# Find solutions for specific problems
/learn "file upload timeout solutions"

# Search by technology
/learn "React performance optimization"

# Find debugging approaches
/learn "database connection issues"

# General best practices
/learn "async error handling patterns"
```

## Notes

- Use specific keywords for better results
- Results are ranked by success rate and relevance
- AI provides context for each suggested solution
- All searches include confidence scores