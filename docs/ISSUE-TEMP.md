# GitHub Context Issue Template for Iterative Discussion
**Template for creating and evolving context through multi-session discussions**

---

## 🎯 [ISSUE-XXX] [Context Title]

### 🎯 CONTEXT OBJECTIVE
**Goal หลักที่ต้องการทำ:**
- [เป้าหมายหลักของ context นี้]
- [ประโยชน์ที่ต้องการจาก Context นี้]

### 📝 DISCUSSION LOG
**Session Timeline:**
- **Initial Session**: [YYYY-MM-DD HH:MM] - เริ่ม discuss
- **Update Session 1**: [YYYY-MM-DD HH:MM] - เพิ่มเติม requirements
- **Update Session 2**: [YYYY-MM-DD HH:MM] - ปรับ clarify ขอบเขต
- [สามารถเพิ่มได้ตามจำนวน discussion sessions]

### 🔄 CURRENT STATUS
**Context Phase**:
- `[Planning]` - กำลังวางแผน/ปรึกษา
- `[Ready for Planning]` - พร้อมสำหรับ =plan
- `[Implementation Ready]` - พร้อม implement

**Last Updated**: [YYYY-MM-DD HH:MM]

### 📋 ACCUMULATED CONTEXT
**Requirements ที่ได้จากการ discuss:**
- [Requirement 1 - จาก session แรก]
- [Requirement 2 - จาก session ต่อมา]
- [Requirement N - จาก session ล่าสุด]

**Technical Decisions:**
- [Decision 1 - architecture choice]
- [Decision 2 - technology stack]
- [Decision 3 - implementation approach]

**Constraints & Assumptions:**
- [Constraint 1 - performance/time]
- [Assumption 1 - user behavior]
- [Constraint 2 - technical limitation]

**Scope Boundaries:**
**IN SCOPE:**
- [Feature/Component ที่ต้องทำ]
- [Functionality ที่ต้องรองรับ]

**OUT OF SCOPE:**
- [Feature/Component ที่ไม่ต้องทำ]
- [Functionality ที่ไม่ต้องรองรับใน context นี้]

### 🏗️ TECHNICAL ARCHITECTURE
**System Components:**
- **Frontend Components**: [components/pages ที่จะ implement]
- **Backend Services**: [APIs/services ที่จะ implement]
- **Database Models**: [tables/models ที่จะ implement]
- **External Integrations**: [services ที่ต้อง connect]

**Architecture Patterns:**
- [Pattern 1 - design pattern ที่จะใช้]
- [Pattern 2 - technical approach ที่เลือก]

**Key Technical Requirements:**
- **Performance**: [ความเร็ว/ขนาด/response time]
- **Security**: [ความปลอดภัยที่ต้องการ]
- **Scalability**: [การรองรับผู้ใช้งาน]
- **Compatibility**: [browser/device support]

### 🎯 IMPLEMENTATION DIRECTIONS
**Breaking Down Strategy:**
- [แนะนำวิธีแบ่งเป็น atomic tasks]
- [ลำดับความสำคัญของ features]
- [Dependencies ที่ต้องจัดการ]

**Risk Areas Identified:**
- [Risk 1 - technical complexity]
- [Risk 2 - integration challenge]
- [Risk 3 - time/skill constraint]

**Success Criteria:**
- [Criteria 1 - measurable outcome]
- [Criteria 2 - user impact metric]
- [Criteria 3 - technical requirement]

### 📚 REFERENCE MATERIALS
**Documentation:**
- [Documentation Link 1]
- [Documentation Link 2]

**Code Examples:**
- [Code Reference 1]
- [Implementation Pattern 2]

**External Resources:**
- [External Article/Resource 1]
- [Tool/Library Documentation 2]

### 🔄 SESSION NOTES
**Notes from [YYYY-MM-DD HH:MM] Session:**
- **สิ่งที่คุยกันใน session นี้:**
  - [Topic 1 - สิ่งที่ discuss]
  - [Topic 2 - ข้อมูลที่ได้]
- **Decisions ที่ทำใน session นี้:**
  - [Decision 1]
  - [Decision 2]
- **Questions ที่ยังไม่ตอบ:**
  - [Question 1]
  - [Question 2]

**Action Items:**
- [ ] [Action item 1 - ทำต่อใน session หน้า]
- [ ] [Action item 2 - ตรวจสอบ/validate]

**Next Session Focus:**
- [สิ่งที่จะคุยต่อใน session หน้า]
- [ข้อมูลที่ต้องเตรียมมา]
- [Decisions ที่ต้องทำใน session หน้า]

### 📋 PLANNING READINESS CHECKLIST
✅ **Requirements are clear and complete**
- [ ] All functional requirements are documented
- [ ] Non-functional requirements are identified
- [ ] User stories/use cases are clear

✅ **Technical approach is validated**
- [ ] Architecture decisions are confirmed
- [ ] Technology stack is selected
- [ ] Implementation patterns are defined

✅ **Dependencies are identified**
- [ ] External dependencies are listed
- [ ] Internal dependencies are mapped
- [ ] Blocking factors are acknowledged

✅ **Scope boundaries are defined**
- [ ] IN SCOPE items are clearly listed
- [ ] OUT OF SCOPE items are explicitly excluded
- [ ] Success criteria are measurable

✅ **Risk areas are acknowledged**
- [ ] Technical risks are identified
- [ ] Mitigation strategies are discussed
- [ ] Timeline constraints are realistic

**Overall Planning Status**:
**[Ready for Planning]** - เมื่อ checklist ครบทุกข้อ
**[Not Ready Yet]** - ต้องมีการ discuss เพิ่มเติม

### 🔗 RELATED ISSUES
- **Parent Issue**: # (ถ้ามี)
- **Related Context Issues**: # (ถ้ามี)
- **Technical Dependencies**: # (ถ้ามี)

**Task Issues Generated from this Context:**
- [TASK-XXX-X] - [task title] (generated)
- [TASK-XXX-Y] - [task title] (generated)
- [เพิ่ม task issues ที่ถูก generate จาก context นี้]

---

## 📝 Instructions for Using This Template

### Initial Context Creation (=fcs > [context title])
1. **Fill basic sections**: CONTEXT OBJECTIVE, เริ่ม DISCUSSION LOG, CURRENT STATUS = Planning
2. **Add initial requirements**: สิ่งที่คุยกันใน session แรก
3. **Update SESSION NOTES**: บันทึกสิ่งสำคัญจากการคุย
4. **Check Planning Readiness**: ดูว่าพร้อม =plan หรือยัง

### Context Updates (=fcs > [ISSUE-XXX])
1. **Add to DISCUSSION LOG**: เพิ่ม session ใหม่พร้อม timestamp
2. **Update ACCUMULATED CONTEXT**: เพิ่ม requirements/decisions ใหม่
3. **Modify TECHNICAL ARCHITECTURE**: อัพเดทข้อมูลที่ได้จากการคุย
4. **Update SESSION NOTES**: บันทึกสิ่งที่คุยใน session ล่าสุด
5. **Check Planning Readiness**: ประเมินว่าพร้อมสำหรับ =plan หรือไม่

### When Ready for Planning (=plan > [task description])
- Ensure **Context Phase** = `[Ready for Planning]`
- All **PLANNING READINESS CHECKLIST** items are ✅
- Use this context to generate atomic tasks following the Task Issue Template in `/docs/TASK-ISSUE-TEMP.md`

### Context Evolution Principles
- **Incremental**: เพิ่มข้อมูลทีละน้อยตามการ discuss
- **Transparent**: บันทึกว่าทำไมถึงตัดสินใจแบบนั้น
- **Flexible**: สามารถปรับ decisions ได้ (พร้อมการอธิบาย)
- **Living Document**: Context เติบโตไปพร้อมกับความเข้าใจ

---

*This template is designed for iterative discussion-based context creation where understanding evolves through multiple sessions.*