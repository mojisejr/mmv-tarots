-- per-day business fence [S4b ตู๋ P1]: daily-7 โพสต์ได้ ≤1 ครั้งต่อ targetDate
-- row-level claim (APPROVED→PUBLISHING) กันแค่ row เดิมยิงซ้ำ — ไม่กัน "2 row คนละ id วันเดียวกัน".
-- partial unique index บน json_extract(input_data,'$.targetDate') เฉพาะ daily-7 ที่ PUBLISHING/POSTED
-- → sqlite enforce atomic: row ที่ 2 วันเดียวกันจะ UPDATE→PUBLISHING ไม่ผ่าน (constraint) → claim ล้ม.
CREATE UNIQUE INDEX `uniq_daily7_per_day` ON `content_posts` (json_extract(`input_data`, '$.targetDate'))
WHERE `template_id` = 'daily-7' AND `status` IN ('PUBLISHING', 'POSTED');
