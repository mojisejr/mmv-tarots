-- daily-7 active fence [PR#101 ตู๋ P1.1]: daily-7 มี publication artifact ได้ ≤1 row ต่อ targetDate
-- เดิม 0006 ครอบแค่ PUBLISHING/POSTED → ยังสร้าง 2 row (PENDING/GENERATED) วันเดียวกันได้
-- แล้วไปชนตอน manual mark posted / auto-gen. ขยายเป็น "non-canceled" (รวม FAILED) = invariant 1/วัน.
--
-- step 1: resolve duplicate ที่มีอยู่ใน db จริง ก่อนสร้าง unique index (ไม่งั้น CREATE INDEX fail)
--   เก็บ row สถานะก้าวหน้าสุด/ใหม่สุด ต่อ targetDate, cancel ที่เหลือ. (no-op ถ้า db สะอาด)
UPDATE `content_posts` SET `status` = 'CANCELED', `updated_at` = unixepoch()
WHERE `id` IN (
  SELECT `id` FROM (
    SELECT `id`, row_number() OVER (
      PARTITION BY json_extract(`input_data`, '$.targetDate')
      ORDER BY CASE `status`
        WHEN 'POSTED' THEN 7 WHEN 'PUBLISHING' THEN 6 WHEN 'APPROVED' THEN 5
        WHEN 'GENERATED' THEN 4 WHEN 'GENERATING' THEN 3 WHEN 'PENDING' THEN 2
        WHEN 'FAILED' THEN 1 ELSE 0 END DESC,
        `created_at` DESC
    ) AS rn
    FROM `content_posts`
    WHERE `template_id` = 'daily-7' AND `status` != 'CANCELED'
      AND json_extract(`input_data`, '$.targetDate') IS NOT NULL
  ) WHERE `rn` > 1
);--> statement-breakpoint
-- step 2: drop fence เดิม (narrow) แล้วสร้าง fence ใหม่ (broad: non-canceled) แทน
-- targetDate IS NOT NULL: invariant คือ "1 row ต่อ targetDate" — malformed row ที่ไม่มี targetDate
-- ไม่ถูกบังคับ (และ data-fix ข้างบนก็ไม่ collapse partition NULL) [ตู๋ P2]
DROP INDEX IF EXISTS `uniq_daily7_per_day`;--> statement-breakpoint
CREATE UNIQUE INDEX `uniq_daily7_active` ON `content_posts` (json_extract(`input_data`, '$.targetDate'))
WHERE `template_id` = 'daily-7' AND `status` != 'CANCELED' AND json_extract(`input_data`, '$.targetDate') IS NOT NULL;
