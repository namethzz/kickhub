# Deploy KickHub: Render + MongoDB Atlas

ไฟล์ `render.yaml` เตรียม Backend (Node Web Service แผน free) และ frontend (Static Site) จาก repository นี้ ยังไม่ได้สร้างบริการหรือฐานข้อมูลด้วยการเพิ่มไฟล์นี้ ต้องสร้าง Blueprint ในบัญชี Render ก่อน

## 1. MongoDB Atlas

1. สร้าง cluster แบบ Free ใน Atlas เลือก region ใกล้โฮสต์ API
2. สร้าง database user สำหรับแอป ให้สิทธิ์ `readWrite` เฉพาะ database `kickhub` ใช้รหัสผ่านสุ่ม และเก็บใน password manager
3. Connect → Drivers → คัดลอก `mongodb+srv://...` ใส่ชื่อ database `kickhub` ก่อนเครื่องหมาย `?` และแทนรหัสผ่านโดย percent-encode อักขระพิเศษ
4. หลังสร้าง API ใน Render เปิด Connect → Outbound เพื่อดูช่วง IP ของบริการ แล้วเพิ่มเฉพาะช่วงเหล่านั้นใน Atlas Network Access อย่าสับสนกับ IP ของมือถือ เพราะแอปเชื่อม DB ผ่าน API
5. ไม่ต้องโหลด sample data หรือรัน `db:reset` กับฐานข้อมูลออนไลน์ บัญชีและสนาม local จะไม่ถูกย้ายขึ้น Atlas อัตโนมัติ

## 2. สร้างบริการใน Render

รวม branch ที่มีไฟล์นี้เข้า `main` แล้วเปิด Render → New → Blueprint → เลือก `namethzz/kickhub` และ branch `main`

| Service | Root Directory | Build | Start/Publish |
| --- | --- | --- | --- |
| kickhub-api | `Backend` (ตัว B ใหญ่) | `npm ci --omit=dev --ignore-scripts` | `npm start` |
| kickhub-web | `frontend` | `npm ci && npm run build` | `dist` |

Blueprint สร้าง `SECRET_KEY` ให้โดยอัตโนมัติ ไม่ใส่ secrets ใน Git หรือส่งในแชต ใช้ Environment ของ Backend เท่านั้น

ระหว่างสร้างให้กรอก `MONGODB_URI` จริง หากยังไม่ทราบ URL ให้ใช้ origin ชั่วคราว `https://placeholder.invalid` สำหรับ `CLIENT_ORIGIN` และ `VITE_API_URL` เพื่อสร้างบริการก่อน **เว็บยังใช้งานจริงไม่ได้ในช่วงนี้** จากนั้นคัดลอก URL ที่ Render ออกให้จริง และเปลี่ยนค่าทันทีตามตาราง ไม่เดาชื่อ subdomain เพราะ Render อาจเติม suffix

| Service | Variable | ค่า |
| --- | --- | --- |
| Backend | `NODE_ENV` | `production` (Blueprint ตั้งให้) |
| Backend | `SECRET_KEY` | สุ่มอย่างน้อย 32 ตัวอักษร (Blueprint สร้างให้) |
| Backend | `MONGODB_URI` | Atlas URI ของ database `kickhub` |
| Backend | `CLIENT_ORIGIN` | HTTPS origin ของ frontend ไม่มี `/` ท้าย ไม่มี path; หลาย origin คั่น comma |
| frontend | `VITE_API_URL` | HTTPS origin ของ Backend ไม่มี `/` ท้าย ไม่มี `/api` |

ตัวอย่างรูปแบบเท่านั้น: frontend `https://your-web.onrender.com`, API `https://your-api.onrender.com` ต้องแทนด้วย URL จริงที่ได้รับ

เพิ่มช่วง outbound IP ใน Atlas แล้ว deploy Backend อีกครั้งถ้าการเชื่อมครั้งแรกไม่สำเร็จ เปลี่ยน `VITE_API_URL` แล้วต้อง **rebuild frontend** เพราะ Vite ฝังค่าในไฟล์ build เปลี่ยน `CLIENT_ORIGIN` แล้วต้อง redeploy Backend

ตรวจ `https://<API-host>/api/health` ต้องได้ HTTP 200 และ `{"status":"ok"}` ก่อนทดสอบฟังก์ชันอื่น หากฐานข้อมูลหลุดจะได้ 503

Blueprint ตั้ง rewrite `/*` → `/index.html` ให้ refresh หน้า `/login` หรือ `/parties/:id` ได้ และตั้ง `Cross-Origin-Opener-Policy: same-origin-allow-popups` สำหรับ social login

## 3. Google

Google Cloud Console → Google Auth Platform → Clients → OAuth client ชนิด Web application ที่ใช้อยู่

- Authorized JavaScript origins: เพิ่ม **HTTPS origin ของ frontend จริง** ไม่มี path หรือ `/` ท้าย
- Backend Environment: เพิ่ม `GOOGLE_CLIENT_ID` ของ client เดียวกัน แล้ว redeploy Backend
- implementation นี้ใช้ Google Identity Services callback ส่ง ID token ไป `/api/auth/google` ไม่ต้องสร้าง redirect URI ของ Backend หรือ Google client secret
- ตรวจ Branding/Audience ให้ตรงกับเว็บและกลุ่มผู้ใช้งาน หากยังเป็น Testing ให้เพิ่มบัญชีทดสอบตามการตั้งค่าของ project
- GET `/api/auth/google/config` ต้องคืน `enabled: true` และ client ID ที่เลือก ห้ามใส่ client secret ใน frontend

อ้างอิง: https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid

## 4. Facebook

ใช้ Meta app เดิมที่มี Facebook Login ตรวจชื่อเมนูใน Dashboard ของแอปนั้น เนื่องจาก UI อาจแตกต่างตามประเภทแอป

- Settings → Basic → App Domains: hostname ของ frontend จริง
- Website Site URL: HTTPS URL ของ frontend จริง
- Facebook Login/Use cases → Settings: เปิด Login with JavaScript SDK และเพิ่มโดเมนเว็บจริงใน Allowed Domains for the JavaScript SDK
- ตรวจ HTTPS และข้อกำหนด Privacy Policy/Data Deletion ของแอปก่อนเปิดให้ผู้ใช้ทั่วไป ใช้เนื้อหาจริงของบริการ
- ใส่ `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` และ `FACEBOOK_GRAPH_VERSION` ใน Backend Environment; secret อยู่ Backend เท่านั้น
- implementation นี้ใช้ `FB.login` ส่ง access token ไป `/api/auth/facebook` ไม่ได้มี server callback endpoint จึงอย่าสร้าง redirect URI ที่ไม่มี route รองรับ
- ถ้า app อยู่ Development mode ใช้บัญชีที่มี role/tester ทดสอบก่อน ต้องผ่านเงื่อนไขของ Meta และเปิด Live สำหรับบุคคลทั่วไป
- GET `/api/auth/facebook/config` ต้องคืน `enabled: true` และ app ID ที่ตรงกับแอป

อ้างอิง: https://developers.facebook.com/docs/facebook-login/web/

## 5. ทดสอบบนเว็บออนไลน์และมือถือจริง

ขั้นตอนนี้ยังต้องทำหลัง deploy สำเร็จ ชุดทดสอบ local ไม่ได้ยืนยันผล iPhone/iPad หรือ provider console

1. เปิด HTTPS URL บน Safari iPhone/iPad และ Chrome Android ผ่านอินเทอร์เน็ตมือถือ เพื่อยืนยันว่าไม่ต้องอยู่ Wi-Fi เดียวกับคอม
2. สมัครบัญชีเจ้าของสนาม → `/Owner` → เพิ่มสนามที่เปิดใช้งาน; ฐานข้อมูลใหม่ไม่มีสนามให้สร้างปาร์ตี้จนกว่าจะเพิ่ม
3. สมัครบัญชีผู้เล่น A และ B ต่างบัญชี/เบราว์เซอร์ ตรวจอีเมลซ้ำ รหัสผิด ล็อกอินถูก และ logout
4. A สร้างปาร์ตี้วันถัดไป เลือกสนามจริง โหมดบุฟเฟต์หรือเลือกตำแหน่ง → B ค้นหาและเข้าร่วม; ถ้าเลือกอนุมัติ ให้ A อนุมัติก่อน
5. A/B เปิดแชตในปาร์ตี้ ส่งข้อความสลับกัน รอ polling สูงสุดประมาณ 10 วินาทีขณะหน้าเว็บอยู่ด้านหน้า ตรวจข้อความภาษาไทยและไม่มีข้อความซ้ำ
6. เปิดข้อความล่าสุดและเลื่อนถึงท้าย ตรวจแจ้งเตือนอ่านแล้ว รอ polling ของกระดิ่งประมาณ 15 วินาที ตรวจ keyboard, scroll, safe-area และการหมุนหน้าจอ
7. Refresh หน้า deep link ของปาร์ตี้ ต้องไม่ 404 และยังโหลดข้อมูลจาก Atlas ได้ ตรวจข้อมูลยังอยู่หลัง redeploy API
8. ทดสอบ Google/Facebook ด้วยบัญชีที่ provider อนุญาต ตรวจ popup บนมือถือและกลับสู่แอป หาก origin mismatch ให้เปรียบเทียบ URL จริงกับ console

แผน free ของ Render พัก API หลังไม่มี inbound traffic 15 นาที การเรียกแรกหลังพักอาจช้า แชตเป็น polling ภายในเว็บ ไม่มี push ขณะปิดเว็บ ไม่ควรใช้ uptime ping เพื่อหลบข้อจำกัด free plan

## ตรวจอัตโนมัติก่อน merge

```bash
cd frontend
npm ci
npm test
npm run build
cd ../Backend
npm ci --ignore-scripts
npm test
npm run test:integration
```

Integration tests ใช้ MongoDB ชั่วคราวหรือ `TEST_MONGODB_URI` local ของ `kickhub_test` เท่านั้น ห้ามใช้ Atlas production ชุด GitHub Actions ที่มีอยู่จะรันฐานข้อมูล MongoDB service แยก

Legacy routes เช่น `/partybuffet/:id`, `/partyrole/:id`, `/legacy/field` ยังมี LAN URL เก่า ให้ทดสอบ live routes `/team`, `/create-party`, `/parties/:id`, `/field`, `/Owner` สำหรับ deployment รอบนี้

อ้างอิงโฮสติ้ง/ฐานข้อมูล:
- https://render.com/docs/blueprint-spec
- https://render.com/docs/monorepo-support
- https://render.com/docs/free
- https://www.mongodb.com/docs/atlas/connect-to-database-deployment/
