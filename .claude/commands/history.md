# History Command

## 🎯 จุดประสงค์

History Command คือ timeline query system ที่แสดงประวัติการพัฒนา การเรียนรู้ และการแก้ปัญหาทั้งหมด ช่วยให้มองภาพรวมของการเติบโตและ progress ในโปรเจค

## Usage

```bash
/history [filter/keyword]
```

### พารามิเตอร์
- `filter` (optional): keyword หรือ filter สำหรับการค้นหา

## ตัวอย่างการใช้งาน (Examples)

### 1. ดูประวัติทั้งหมด
```bash
/history
```
**ผลลัพธ์:**
```
📅 2024-12-18 (วันนี้)
├── ✅ Implement Vercel Blob Storage (15 min)
├── 💡 Learn: Streaming แก้ปัญหา file size (Aha)
└── 🐛 Debug: Upload timeout (504 error)

📅 2024-12-17 (เมื่อวาน)
├── ✅ Fix React rendering errors (30 min)
├── 💡 Learn: Destructuring patterns (Aha)
└── 🐛 Debug: Objects not valid as React child
```

### 2. ค้นหาตาม keyword
```bash
/history "performance"
```
**ผลลัพธ์:**
- ✅ **2024-12-15**: Optimize API response time (2hr)
- 💡 **2024-12-10**: Learn: React.memo reduces re-renders
- ✅ **2024-12-05**: Implement database indexing
- 💡 **2024-11-28**: Learn: Bundle splitting ลด load time 40%

### 3. ค้นหาตามช่วงเวลา
```bash
/history "yesterday"
/history "last week"
/history "last month"
```

### 4. ดูแค่ debugging sessions
```bash
/history "debug sessions"
```
**ผลลัพธ์:**
```
🔍 Debug History:
├── DEBUG-012: Upload timeout (15min → Solved)
├── DEBUG-011: React rendering (30min → Solved)
├── DEBUG-010: Database connection (45min → Solved)
└── DEBUG-009: CORS issues (1hr → Solved)
```

### 5. ดูแค่ learning insights
```bash
/history "learnings" หรือ /history "aha moments"
```
**ผลลัพธ์:**
```
💡 Learning Timeline:
├── 2024-12-18: Streaming แก้ปัญหา large files
├── 2024-12-15: React.lazy สำหรับ code splitting
├── 2024-12-10: Database connection pooling
└── 2024-12-05: TypeScript generics ลด code duplication
```

## ภาษาไทย (Language Policy)

**ทุกการแสดงผลและคำอธิบายเป็นภาษาไทย** เทอร์มทางเทคนิคคงเป็นภาษาอังกฤษในวงเล็บ

ตัวอย่าง:
- **User**: "/history api"
- **AI**: "พบ 3 sessions เกี่ยวกับ API: 2 สำเร็จ, 1 ยังไม่สมบูรณ์"

## Filters และ Search Options

### **Time-based Filters:**
```bash
/history "today"          # วันนี้
/history "yesterday"      # เมื่อวาน
/history "this week"      # สัปดาห์นี้
/history "last week"      # สัปดาห์ที่แล้ว
/history "this month"     # เดือนนี้
/history "last month"     # เดือนที่แล้ว
```

### **Type-based Filters:**
```bash
/history "debug"          # แค่ debugging sessions
/history "impl"           # แค่ implementation work
/history "aha"            # แค่ learning insights
/history "experiments"    # แค่การทดลอง
```

### **Technology Filters:**
```bash
/history "react"          # sessions ที่เกี่ยวกับ React
/history "database"       # sessions ที่เกี่ยวกับฐานข้อมูล
/history "api"            # sessions ที่เกี่ยวกับ API
/history "performance"    # sessions ที่เกี่ยวกับ performance
```

### **Status Filters:**
```bash
/history "solved"         # แค่ที่แก้ไขสำเร็จ
/history "failed"         # แค่ที่ล้มเหลว
/history "in-progress"    # แค่ที่กำลังทำอยู่
```

## การแสดงผล (Display Format)

### **Timeline View (Default):**
```
📅 December 2024
├── Week 3 (Dec 16-22)
│   ├── ✅ Fix API timeout (2hr)
│   ├── 💡 Aha: Streaming patterns
│   └── 🐛 Debug: CORS issues
├── Week 2 (Dec 9-15)
│   ├── ✅ Implement React.memo
│   └── 💡 Aha: Performance optimization
└── Week 1 (Dec 2-8)
    └── ✅ Setup database schema
```

### **Summary View:**
```bash
/history --summary
```
```
📊 December 2024 Summary:
├── 🎯 Total Sessions: 24
├── ✅ Success Rate: 87.5%
├── 💡 Learnings: 8 insights
├── 🐛 Debug Sessions: 12 (solved: 11)
├── ⚡ Avg Solve Time: 35 min
└── 🏆 Top Achievement: 50% performance improvement
```

### **Progress View:**
```bash
/history --progress
```
```
📈 Development Progress:
├── 🧪 Problem Solving: +25% (faster)
├── 💡 Knowledge Growth: +8 insights
├── 🔄 Debug Efficiency: -40% time
└── 🚀 Feature Velocity: +3 features/week
```

## Data Types ที่เก็บ

### **Development Sessions:**
- Implementation work (`/impl`)
- Feature development
- Bug fixes
- Refactoring

### **Debug Sessions:**
- Error investigation
- Problem analysis
- Solution attempts
- Resolution

### **Learning Moments:**
- Aha insights (`/aha`)
- Best practices discovered
- Pattern recognitions
- Lessons learned

### **Experiments:**
- Solution testing (`/experiment`)
- Hypothesis validation
- Performance tests
- Architecture trials

## Command ที่เกี่ยวข้อง (Related Commands)

- `/aha` - บันทึก learning moments
- `/debug` - เริ่ม debugging session
- `/learn` - ค้นหาจากประวัติที่เกี่ยวข้อง
- `/debug-patterns` - ดู patterns ที่พบบ่อย

## ตัวอย่าง Advanced Usage

### **Complex Filtering:**
```bash
# ดู debugging sessions ที่สำเร็จในสัปดาห์นี้
/history "debug solved this week"

# ดู React-related learnings ในเดือนนี้
/history "react learnings this month"

# ดู performance improvements ทั้งหมด
/history "performance optimizations"
```

### **Analytics Mode:**
```bash
/history --analytics
```
**ผลลัพธ์:**
```
📊 Development Analytics:
├── 🏃 Most Active: Monday (avg 4 sessions)
├── ⚡ Fastest Day: Wednesday (avg 20 min/session)
├── 💡 Most Learnings: Friday (avg 2 insights)
├── 🐛 Most Debugs: Tuesday (avg 3 sessions)
└── 🎯 Success Rate: 91% (highest on Thursday)
```

## Benefits ของ History Command

### **สำหรับ Tracking:**
- 📈 เห็นความคืบหน้าของโปรเจค
- 📊 วิเคราะห์ patterns การพัฒนา
- 🎯 ระบุจุดที่ต้องปรับปรุง
- 💪 สร้างแรงจูงใจจากความสำเร็จ

### **สำหรับ Learning:**
- 🧠 ดู evolution ของความเข้าใจ
- 🔍 หา connections ระหว่าง learnings
- 💡 ทบทวนสิ่งที่เรียนรู้
- 📚 สร้าง personal knowledge base

### **สำหรับ Planning:**
- 📅 ประเมิน time estimates จากอดีต
- 🎯 ตั้ง goals ที่ realistic
- 🔮 ทำนาย challenges ที่อาจเจอ
- 📋 เตรียม resources ที่จำเป็น

## Performance

- **Query Speed**: <100ms สำหรับทุก queries
- **Storage**: Compressed ทั้งหมด <50MB
- **Search**: Full-text search ในทุก sessions
- **Retention**: Keep 2 years แบบ rolling

**History Command ทำให้เห็นภาพรวมของการพัฒนาและการเติบโต! 📈🎯**

## Examples

```bash
# View all history
/history

# Search by keyword
/history "performance"
/history "api"
/history "react"

# Filter by time
/history "yesterday"
/history "last week"
/history "last month"

# Filter by type
/history "debug sessions"
/history "learnings"
```

## Notes

- All timestamps in local timezone
- Sessions automatically categorized by type
- Search works across all session content
- Data is retained for 2 years in rolling fashion