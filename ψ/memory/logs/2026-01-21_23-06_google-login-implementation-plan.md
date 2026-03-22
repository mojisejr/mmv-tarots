# Snapshot: แผนการเพิ่ม Google Login (MMV Tarots)

**Time**: 2026-01-21 23:06
**Context**: เตรียมแผนงานสำหรับเพิ่มช่องทาง Login ด้วย Google เพื่อให้คุณนนท์เตรียม Credentials และผมจะได้เริ่มงานได้อย่างรวดเร็ว

## 🛠️ รายการที่ต้องทำ (Implementation Steps)

1.  **Backend Config**: อัปเดต `projects/mmv-tarots/lib/server/auth.ts` เพื่อเปิดใช้งาน Google Social Provider
2.  **Environment Variables**: เพิ่มค่าที่จำเป็นใน `.env`
3.  **UI Updates**: เพิ่มปุ่ม "เข้าสู่ระบบด้วย Google" ในหน้าแรก (`app/page.tsx`) โดยใช้ดีไซน์ Glassmorphism
4.  **Provider Integration**: แก้ไข `navigation-provider.tsx` ให้รองรับการเรียก `signIn` หลายรูปแบบ

## 🔑 สิ่งที่คุณนนท์ต้องเตรียม (.env)

ต้องนำค่าเหล่านี้ไปใส่ใน `projects/mmv-tarots/.env`:

```env
GOOGLE_CLIENT_ID="[ได้จาก Google Cloud Console]"
GOOGLE_CLIENT_SECRET="[ได้จาก Google Cloud Console]"
```

### วิธีการหา (How to get them):
1.  เข้าสู่ [Google Cloud Console](https://console.cloud.google.com/)
2.  สร้าง Project ใหม่ หรือเลือก Project เดิมที่มีอยู่
3.  ไปที่ **APIs & Services** > **OAuth consent screen**
    - ตั้งชื่อ App และระบุ Support Email
    - ในส่วน Scopes ให้มั่นใจว่ามี `openid`, `.../auth/userinfo.email`, และ `.../auth/userinfo.profile`
4.  ไปที่ **Credentials** > **Create Credentials** > **OAuth client ID**
    - Application type: **Web application**
    - **Authorized JavaScript origins**: `http://localhost:3000` (Dev) และ Production URL
    - **Authorized redirect URIs**: `http://localhost:3000/api/auth/callback/google` และ `[Prod URL]/api/auth/callback/google`
5.  กด Create แล้วคัดลอก **Client ID** และ **Client Secret**

## 💡 Apply When
เมื่อคุณนนท์เตรียม Credentials เรียบร้อยแล้ว ให้พิมพ์สั่ง `/impl เพิ่ม Google Login` ได้เลยครับ

## 🏷️ Tags
`mmv-tarots` `auth` `google-login` `better-auth` `roadmap`
