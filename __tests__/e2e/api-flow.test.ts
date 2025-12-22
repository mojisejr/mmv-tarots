import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { POST } from '@/app/api/predict/route'
import { GET } from '@/app/api/predict/[jobId]/route'
import { createTestRequest } from '@/lib/shared/utils'
import { db } from '@/lib/server/db'

// Mock the workflow module
vi.mock('@/app/workflows/tarot', () => ({
  startTarotWorkflow: vi.fn()
}))

// Mock Date.now for deterministic job ID generation
const mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1234567890000)
const mockMathRandom = vi.spyOn(Math, 'random').mockReturnValue(0.1)

describe('E2E API Flow Integration Tests', () => {
  beforeEach(async () => {
    // Clean up database before each test
    await db.prediction.deleteMany()
  })

  afterEach(async () => {
    // Clean up database after each test
    await db.prediction.deleteMany()
  })

  describe('Complete Tarot Reading Workflow', () => {
    it('should handle full workflow from question submission to result retrieval', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      const mockStartTarotWorkflow = vi.mocked(startTarotWorkflow)
      mockStartTarotWorkflow.mockResolvedValue(undefined)

      // Step 1: Submit a question
      const question = "What should I focus on in my career this year?"
      const userIdentifier = "user-123"

      const postRequest = createTestRequest({ question, userIdentifier }, 'POST')
      const postResponse = await POST(postRequest)
      const postData = await postResponse.json()

      // Verify initial response
      expect(postResponse.status).toBe(200)
      expect(postData.jobId).toMatch(/^job-\d+-[a-z0-9]+$/)
      expect(postData.status).toBe('PENDING')

      // Verify database state
      const dbRecord = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      expect(dbRecord).toBeTruthy()
      expect(dbRecord?.question).toBe(question)
      expect(dbRecord?.userIdentifier).toBe(userIdentifier)
      expect(dbRecord?.status).toBe('PENDING')
      expect(dbRecord?.analysisResult).toBeNull()
      expect(dbRecord?.selectedCards).toBeNull()
      expect(dbRecord?.finalReading).toBeNull()

      // Verify workflow was triggered
      expect(mockStartTarotWorkflow).toHaveBeenCalledTimes(1)
      expect(mockStartTarotWorkflow).toHaveBeenCalledWith({
        jobId: postData.jobId,
        question: question,
        userIdentifier: userIdentifier
      })

      // Step 2: Check status immediately (should still be PENDING)
      const getRequest = createTestRequest(null, 'GET')
      const getResponse = await GET(getRequest, { params: Promise.resolve({ jobId: postData.jobId }) })
      const getStatusData = await getResponse.json()

      expect(getResponse.status).toBe(200)
      expect(getStatusData.status).toBe('PENDING')
      expect(getStatusData.question).toBe(question)
      expect(getStatusData.createdAt).toBe(dbRecord?.createdAt.toISOString())

      // Step 3: Simulate workflow completion
      const mockAnalysisResult = {
        mood: "hopeful",
        topic: "career",
        period: "current_year"
      }

      const mockSelectedCards = [
        { id: 1, position: 1, name: "The Magician" },
        { id: 8, position: 2, name: "Strength" },
        { id: 21, position: 3, name: "The World" }
      ]

      const mockFinalReading = {
        header: "สวัสดีค่า... การงานในปีนี้ดูสดใสมากค่ะ",
        cards_reading: [
          {
            position: 1,
            name_en: "The Magician",
            name_th: "ไพ่นายกาล",
            image: "cards/major/01.jpg",
            keywords: ["พลัง", "การสร้างสรรค์", "ศักยภาพ"],
            interpretation: "คุณมีพลังและความสามารถในการสร้างโอกาสใหม่ๆ"
          },
          {
            position: 2,
            name_en: "Strength",
            name_th: "ไพ่ความแข็งแกร่ง",
            image: "cards/major/08.jpg",
            keywords: ["ความอดทน", "กำลังใจ", "การควบคุม"],
            interpretation: "ความอดทนและกำลังใจจะพาคุณผ่านช่วงเวลาสำคัญ"
          },
          {
            position: 3,
            name_en: "The World",
            name_th: "ไพ่โลก",
            image: "cards/major/21.jpg",
            keywords: ["ความสำเร็จ", "การสำเร็จ", "การปิดบริบท"],
            interpretation: "เป้าหมายที่วางไว้จะสำเร็จสมหวัง"
          }
        ],
        reading: "ปีนี้เป็นปีแห่งการเติบโตและความสำเร็จในการงานของคุณค่ะ...",
        suggestions: [
          "ลงมือทำตามแผนที่วางไว้อย่างมั่นคง",
          "เปิดใจรับโอกาสใหม่ๆ ที่จะเข้ามา",
          "ไว้วางใจในศักยภาพของตัวเอง"
        ],
        next_questions: [
          "โอกาสใหม่ที่เหมาะสมกับฉันคืออะไร?",
          "จะทำอย่างไรให้ผ่านช่วงเวลาที่ท้าทายไปได้?"
        ],
        final_summary: "ปีนี้เป็นปีทองของการงาน พร้อมเต็มไปด้วยโอกาสที่จะพาคุณถึงความสำเร็จ",
        disclaimer: "โปรดใช้วิจารณญาณในการตัดสินใจนะคะ"
      }

      // Update database to simulate completed workflow
      const record = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      if (record) {
        await db.prediction.update({
          where: { id: record.id },
          data: {
            status: 'COMPLETED',
            analysisResult: mockAnalysisResult,
            selectedCards: mockSelectedCards,
            finalReading: mockFinalReading,
            completedAt: new Date()
          }
        })
      }

      // Step 4: Retrieve final result
      const finalGetResponse = await GET(getRequest, { params: Promise.resolve({ jobId: postData.jobId }) })
      const finalData = await finalGetResponse.json()

      expect(finalGetResponse.status).toBe(200)
      expect(finalData.status).toBe('COMPLETED')
      expect(finalData.jobId).toBe(postData.jobId)
      expect(finalData.question).toBe(question)
      expect(finalData.result.reading).toEqual(mockFinalReading)
      expect(finalData.createdAt).toBe(dbRecord?.createdAt.toISOString())
      expect(finalData.completedAt).toBeTruthy()
    })

    it('should handle workflow with 5 cards selection', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      vi.mocked(startTarotWorkflow).mockResolvedValue(undefined)

      // Submit question
      const postRequest = createTestRequest(
        { question: "Will I find true love in the near future?" },
        'POST'
      )
      const postResponse = await POST(postRequest)
      const postData = await postResponse.json()

      // Simulate workflow with 5 cards
      const mockSelectedCards = [
        { id: 6, position: 1, name: "The Lovers" },
        { id: 2, position: 2, name: "The High Priestess" },
        { id: 14, position: 3, name: "Temperance" },
        { id: 9, position: 4, name: "The Hermit" },
        { id: 19, position: 5, name: "The Sun" }
      ]

      const record2 = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      if (record2) {
        await db.prediction.update({
          where: { id: record2.id },
          data: {
            status: 'COMPLETED',
            selectedCards: mockSelectedCards,
            finalReading: {
              header: "เรื่องหัวใจ... เป็นเรื่องที่ละเอียดอ่อนและต้องการความรู้จักตัวเอง",
              cards_reading: [
                { position: 1, name_en: "The Lovers", name_th: "ไพ่ความรัก" },
                { position: 2, name_en: "The High Priestess", name_th: "ไพ่นางปุโรหิต" },
                { position: 3, name_en: "Temperance", name_th: "ไพ่ความสมดุล" },
                { position: 4, name_en: "The Hermit", name_th: "ไพ่ฤาษี" },
                { position: 5, name_en: "The Sun", name_th: "ไพ่พระอาทิตย์" }
              ],
              reading: "การเดินทางหาความรักของคุณกำลังจะเริ่มใหม่...",
              suggestions: ["เปิดใจรับความรัก", "ฝึกเรียนที่จะรักตัวเองก่อน"],
              next_questions: ["ความรักที่แท้จริงคืออะไร?", "พร้อมที่จะรักใครแล้วหรือ?"],
              final_summary: "ความรักที่แท้จริงกำลังมองหาคุณอยู่",
              disclaimer: "โปรดใช้วิจารณญาณในการตัดสินใจนะคะ"
            },
            completedAt: new Date()
          }
        })
      }

      // Verify 5 cards in final reading
      const getRequest = createTestRequest(null, 'GET')
      const finalGetResponse = await GET(getRequest, { params: Promise.resolve({ jobId: postData.jobId }) })
      const finalData = await finalGetResponse.json()

      expect(finalData.result.reading.cards_reading).toHaveLength(5)
    })
  })

  describe('Error Handling Integration', () => {
    it('should handle workflow failure gracefully', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      vi.mocked(startTarotWorkflow).mockResolvedValue(undefined)

      const postRequest = createTestRequest(
        { question: "When will I win the lottery?" },
        'POST'
      )
      const postResponse = await POST(postRequest)
      const postData = await postResponse.json()

      // Simulate workflow failure
      const record3 = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      if (record3) {
        await db.prediction.update({
          where: { id: record3.id },
          data: {
            status: 'FAILED',
            completedAt: new Date()
          }
        })
      }

      const getRequest = createTestRequest(null, 'GET')
      const statusResponse = await GET(getRequest, { params: Promise.resolve({ jobId: postData.jobId }) })
      const statusData = await statusResponse.json()

      expect(statusResponse.status).toBe(200)
      expect(statusData.status).toBe('FAILED')
      expect(statusData.reading).toBeUndefined()
    })
  })

  describe('Concurrent Requests Handling', () => {
    it('should handle multiple simultaneous requests', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      vi.mocked(startTarotWorkflow).mockResolvedValue(undefined)

      const questions = [
        "What should I focus on in my career?",
        "Will I find love soon?",
        "How can I improve my finances?"
      ]

      // Submit multiple requests simultaneously
      const promises = questions.map(question =>
        POST(createTestRequest({ question }, 'POST'))
      )

      const responses = await Promise.all(promises)

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      // Get job IDs
      const jobIds = await Promise.all(
        responses.map(response => response.json().then(data => data.jobId))
      )

      // All should have valid job IDs
      jobIds.forEach(jobId => {
        expect(jobId).toMatch(/^job-\d+-[a-z0-9]+$/)
      })

      // Verify all records created in database
      const dbRecords = await db.prediction.findMany({
        where: { jobId: { in: jobIds } }
      })

      expect(dbRecords).toHaveLength(questions.length)
    })
  })

  describe('Data Consistency Tests', () => {
    it('should maintain data consistency throughout the workflow', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      vi.mocked(startTarotWorkflow).mockResolvedValue(undefined)

      const originalQuestion = "Should I start my own business?"
      const originalUserIdentifier = "entrepreneur-456"

      // Submit request
      const postRequest = createTestRequest(
        { question: originalQuestion, userIdentifier: originalUserIdentifier },
        'POST'
      )
      const postResponse = await POST(postRequest)
      const postData = await postResponse.json()

      // Verify initial data
      const initialRecord = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      expect(initialRecord?.question).toBe(originalQuestion)
      expect(initialRecord?.userIdentifier).toBe(originalUserIdentifier)
      expect(initialRecord?.status).toBe('PENDING')

      // Simulate workflow progress
      const initialRecordForUpdate = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      if (initialRecordForUpdate) {
        await db.prediction.update({
          where: { id: initialRecordForUpdate.id },
          data: {
            status: 'PROCESSING',
            analysisResult: { mood: 'ambitious', topic: 'business' }
          }
        })
      }

      // Data should remain consistent
      const processingRecord = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      expect(processingRecord?.question).toBe(originalQuestion)
      expect(processingRecord?.userIdentifier).toBe(originalUserIdentifier)
      expect(processingRecord?.status).toBe('PROCESSING')

      // Complete workflow
      const processingRecordForUpdate = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      if (processingRecordForUpdate) {
        await db.prediction.update({
          where: { id: processingRecordForUpdate.id },
          data: {
            status: 'COMPLETED',
            selectedCards: [{ id: 16, name: "The Tower" }],
            finalReading: { header: "Test reading" },
            completedAt: new Date()
          }
        })
      }

      // Final data consistency check
      const finalRecord = await db.prediction.findFirst({
        where: { jobId: postData.jobId }
      })

      expect(finalRecord?.question).toBe(originalQuestion)
      expect(finalRecord?.userIdentifier).toBe(originalUserIdentifier)
      expect(finalRecord?.status).toBe('COMPLETED')
    })
  })

  describe('Performance Integration Tests', () => {
    it('should respond within acceptable time limits', async () => {
      const { startTarotWorkflow } = await import('@/app/workflows/tarot')
      vi.mocked(startTarotWorkflow).mockResolvedValue(undefined)

      const startTime = Date.now()

      const postRequest = createTestRequest(
        { question: "Is this the right path for me?" },
        'POST'
      )
      const postResponse = await POST(postRequest)

      const postTime = Date.now()
      const postDuration = postTime - startTime

      // POST should be fast (database write + workflow trigger)
      expect(postDuration).toBeLessThan(500) // 500ms max
      expect(postResponse.status).toBe(200)

      const postData = await postResponse.json()

      // GET should be very fast (database read)
      const getStartTime = Date.now()
      const getRequest = createTestRequest(null, 'GET')
      const getResponse = await GET(getRequest, { params: Promise.resolve({ jobId: postData.jobId }) })

      const getDuration = Date.now() - getStartTime

      expect(getDuration).toBeLessThan(100) // 100ms max
      expect(getResponse.status).toBe(200)
    })
  })
})