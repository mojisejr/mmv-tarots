// pm2 config สำหรับ daily-7 publish scheduler worker [S4b]
// รัน: pm2 start ecosystem.daily7.config.cjs  (ตั้ง env ก่อน หรือใส่ใน env ด้านล่าง/ใช้ --env-file)
// persist ข้าม reboot: pm2 save && pm2 startup
//
// env ที่ต้องมี: CONTENT_DB_PATH (sqlite จริง path เต็ม), CONTENT_FB_PAGE_ID,
//   CONTENT_FB_PAGE_ACCESS_TOKEN ; optional CONTENT_SCHEDULE_DAYS="0,1,2,3,4,5,6",
//   CONTENT_SCHEDULE_SLOTS="09:00", CONTENT_SCHEDULE_TICK_MS=600000
module.exports = {
  apps: [
    {
      name: "mmv-daily7-scheduler",
      script: "scripts/publish-worker.ts",
      interpreter: "node",
      interpreter_args: "--import tsx",
      autorestart: true, // ดับ/crash → ฟื้นเอง (จุดอ่อน worker downtime แก้ด้วย pm2 + reconcile catch-up)
      max_restarts: 20,
      env: {
        NODE_ENV: "production",
        // CONTENT_DB_PATH: "/abs/path/content.db",
        // CONTENT_FB_PAGE_ID: "...",
        // CONTENT_FB_PAGE_ACCESS_TOKEN: "...",
      },
    },
  ],
};
