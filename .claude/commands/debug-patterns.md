# Debug Patterns Command

## 🎯 จุดประสงค์

Debug Patterns Command คือ pattern recognition system ที่วิเคราะห์และแสดง error patterns ที่พบบ่อยในโปรเจค พร้อมวิธีการป้องกัน เพื่อลดการเกิดปัญหาซ้ำในอนาคต

## Usage

```bash
/debug-patterns [optional_filter]
```

### พารามิเตอร์
- `filter` (optional): filter เฉพาะ patterns ประเภทที่ต้องการ

## ตัวอย่างการใช้งาน (Examples)

### 1. ดู patterns ทั้งหมด
```bash
/debug-patterns
```
**ผลลัพธ์:**
```
🔍 Your Common Error Patterns (Based on 50 debug sessions):

1️⃣ **Destructuring Errors** (80% occurrence)
   📝 Pattern: "Cannot destructure property 'x' of undefined"
   🎯 Root Cause: Missing/null object properties
   💡 Prevention: ใช้ optional chaining หรือ default values
   ✅ Success Rate: 95% when using `?.` operator

2️⃣ **Async/Await Issues** (60% occurrence)
   📝 Pattern: "Promise returned instead of value"
   🎯 Root Cause: ลืมใส่ await keyword
   💡 Prevention: ESLint rule สำหรับ async/await
   ✅ Success Rate: 98% with proper linting

3️⃣ **TypeScript Type Errors** (45% occurrence)
   📝 Pattern: "Type 'X' is not assignable to type 'Y'"
   🎯 Root Cause: ไม่ระบุ types อย่างชัดเจน
   💡 Prevention: Use strict TypeScript mode
   ✅ Success Rate: 89% with strict mode
```

### 2. ดู patterns ตามประเภท
```bash
/debug-patterns "react"
/debug-patterns "database"
/debug-patterns "api"
/debug-patterns "typescript"
```

**ตัวอย่างผลลัพธ์สำหรับ "react":**
```
🔍 React Error Patterns:

1️⃣ **Objects as React Children** (75%)
   ❌ Error: "Objects are not valid as a React child"
   💡 Fix: `JSON.stringify(obj)` หรือ `{obj.property}`
   🛡️ Prevention: Component prop validation
   ⏱️ Avg Fix Time: 10 min

2️⃣ **State Mutation** (40%)
   ❌ Error: Component not re-rendering after state change
   💡 Fix: Use immutable updates หรือ immer
   🛡️ Prevention: State update patterns
   ⏱️ Avg Fix Time: 25 min

3️⃣ **Missing Keys in Lists** (30%)
   ⚠️ Warning: "Each child in a list should have a unique key"
   💡 Fix: Add unique `key` prop
   🛡️ Prevention: ESLint plugin for React
   ⏱️ Avg Fix Time: 5 min
```

## ภาษาไทย (Language Policy)

**ทุกการวิเคราะห์และแนะนำเป็นภาษาไทย** เทอร์มทางเทคนิคคงเป็นภาษาอังกฤษในวงเล็บ

ตัวอย่าง:
- **User**: "/debug-patterns"
- **AI**: "พบว่าคุณมี error pattern ที่พ�บบ่อยที่สุดคือ 'Destructuring errors' 80%"

## ประเภทของ Patterns

### **🏷️ Syntax Patterns**
```bash
/debug-patterns "syntax"
```
- Missing semicolons
- Incorrect bracket matching
- String interpolation errors

### **🏷️ Runtime Patterns**
```bash
/debug-patterns "runtime"
```
- Null/undefined references
- Type coercion issues
- Async timing problems

### **🏷️ TypeScript Patterns**
```bash
/debug-patterns "typescript"
```
- Type inference failures
- Generic type errors
- Interface mismatches

### **🏷️ React Patterns**
```bash
/debug-patterns "react"
```
- Component lifecycle issues
- State management problems
- Props validation errors

### **🏷️ Database Patterns**
```bash
/debug-patterns "database"
```
- Connection timeouts
- Query syntax errors
- Transaction issues

### **🏷️ API Patterns**
```bash
/debug-patterns "api"
```
- Request/response mismatches
- Authentication errors
- Rate limiting issues

## Pattern Analysis Metrics

### **Occurrence Rate**
- บ่อยมาก: >70% ของ debug sessions
- บ่อย: 40-70%
- ปานกลาง: 20-40%
- น้อย: <20%

### **Fix Time**
- เร็ว: <10 นาที
- ปานกลาง: 10-30 นาที
- ช้า: >30 นาที

### **Success Rate**
- สูง: >90% แก้ได้สำเร็จ
- ปานกลาง: 70-90%
- ต่ำ: <70%

## การแสดงผลขั้นสูง (Advanced Display)

### **Trends View:**
```bash
/debug-patterns --trends
```
**ผลลัพธ์:**
```
📈 Debug Pattern Trends (Last 30 days):

🔴 Increasing Patterns:
├── Async/await issues: +15% (3 → 6 sessions)
├── Type errors: +20% (2 → 5 sessions)

🟢 Decreasing Patterns:
├── Destructuring errors: -30% (10 → 7 sessions)
├── Import errors: -50% (4 → 2 sessions)

🟡 Stable Patterns:
├── React rendering: 3 sessions (no change)
└── Database timeouts: 2 sessions (no change)
```

### **Prevention Matrix:**
```bash
/debug-patterns --prevention
```
**ผลลัพธ์:**
```
🛡️ Prevention Strategies Matrix:

┌─────────────────┬───────────────┬─────────────┬─────────────┐
│ Pattern         │ Occurrence    │ Prevention  │ Impact      │
├─────────────────┼───────────────┼─────────────┼─────────────┤
│ Destructuring   │ 80%           │ ?. operator │ -95% errors │
│ Async/Await     │ 60%           │ ESLint rule │ -98% errors │
│ TypeScript      │ 45%           │ Strict mode │ -89% errors │
│ React State     │ 30%           │ Immer lib   │ -92% errors │
└─────────────────┴───────────────┴─────────────┴─────────────┘
```

### **Cost Analysis:**
```bash
/debug-patterns --cost
```
**ผลลัพธ์:**
```
💰 Debug Cost Analysis (Last 30 days):

🔴 Most Expensive Patterns:
├── Database timeouts: 12 hours total (6 sessions)
├── Type errors: 8 hours total (10 sessions)
├── API integration: 6 hours total (4 sessions)

💡 Potential Savings:
├── Enable ESLint: Save ~15 hours/month
├── Add database pooling: Save ~8 hours/month
├── TypeScript strict mode: Save ~10 hours/month

💵 Total Estimated Savings: $2,400/month
```

## Prevention Strategies

### **🛠️ Tool-based Prevention**
- **ESLint Rules**: ป้องกัน syntax errors
- **TypeScript Strict**: ป้องกัน type errors
- **Prettier**: ป้องกัน formatting issues
- **Husky**: Pre-commit validation

### **📚 Knowledge-based Prevention**
- **Pattern Documentation**: บันทึก solutions
- **Code Reviews**: ตรวจสอบกันก่อน merge
- **Team Guidelines**: Best practices sharing
- **Training Sessions**: เรียนรู้จาก mistakes

### **🔄 Process-based Prevention**
- **TDD Approach**: เขียน test ก่อน code
- **Incremental Development**: ทำทีละน้อย
- **Regular Refactoring**: ปรับปรุง code บ่อยๆ
- **Automated Testing**: Test ทุก changes

## Command ที่เกี่ยวข้อง (Related Commands)

- `/debug` - เริ่ม debugging session
- `/learn` - ค้นหา solutions จาก patterns
- `/aha` - บันทึก prevention insights
- `/history` - ดู timeline ของ patterns

## ตัวอย่าง Workflow ที่สมบูรณ์

```bash
# 1. เจอปัญหาใหม่
# Error: "Cannot destructure property 'user' of undefined"

# 2. ดู patterns ที่เกี่ยวข้อง
/debug-patterns "destructuring"

# 3. AI แสดง pattern และ prevention
# ✅ Pattern: 80% occurrence
# 💡 Prevention: Use optional chaining

# 4. ป้องกันในอนาคต
/aha "ใช้ optional chaining ป้องกัน destructuring errors"

# 5. Implement prevention
/experiment "add optional chaining to user data access"
```

## Best Practices

### ✅ **ควรทำ:**
- Review patterns ทุกสัปดาห์
- Implement prevention สำหรับ high-frequency patterns
- Share patterns กับ team
- Update documentation เมื่อเจอ patterns ใหม่

### ❌ **ควรหลีกเลี่ยง:**
- ละเลย recurring patterns
- ไม่ implement prevention strategies
- ไม่บันทึก learnings
- แก้ไขแค่ symptom ไม่ใช่ root cause

**Debug Patterns Command ช่วยแปลง mistakes ให้กลายเป็น wisdom! 🔍💡**

## Examples

```bash
# View all patterns
/debug-patterns

# Filter by technology
/debug-patterns "react"
/debug-patterns "database"
/debug-patterns "api"

# View prevention strategies
/debug-patterns --prevention

# Analytics view
/debug-patterns --trends
```

## Notes

- Patterns are updated automatically from each debug session
- Prevention strategies are ranked by effectiveness
- Analytics show trends over time
- Most valuable for teams with recurring issues