// pm2 config สำหรับ daily-7 AUTO-GEN worker [Phase 2b]
// รัน: pm2 start ecosystem.gen.config.cjs ; persist: pm2 save && pm2 startup
//
// ⚠️ worker นี้ไม่แตะ Facebook — gen daily-7 ทิ้งไว้ GENERATED ให้ฟีมโพสต์เอง (manual workflow)
// publish-worker เดิม (ecosystem.daily7.config.cjs) = LEGACY ไม่ใช้แล้ว — อย่า start คู่กัน
//
// env ที่ต้องมี: CONTENT_DB_PATH (sqlite จริง path เต็ม) + Gemini key (ผ่าน --env-file=.env.local)
//   optional: CONTENT_GEN_DAYS="0,1,2,3,4,5,6", CONTENT_GEN_SLOT="00:00", CONTENT_GEN_TICK_MS=600000
//   ❌ ไม่ต้องมี CONTENT_FB_PAGE_ID / CONTENT_FB_PAGE_ACCESS_TOKEN (gen-only ไม่ยิง FB)
module.exports = {
  apps: [
    {
      name: "mmv-daily7-gen",
      script: "scripts/gen-worker.ts",
      cwd: __dirname, // รันจาก project root → CONTENT_DB_PATH default + FONT_PATH (assets/fonts) + bg manifest ตรง
      interpreter: "node",
      interpreter_args: "--import tsx --env-file=.env.local",
      autorestart: true,
      max_restarts: 20,
      env: {
        NODE_ENV: "production",
        // CONTENT_DB_PATH: "/abs/path/content.db",
      },
    },
  ],
};
