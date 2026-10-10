# KickHub

แอพหาเพื่อนเตะบอลสำหรับผู้เล่นและเจ้าของสนาม ใช้ React + Vite + Tailwind + TypeScript ฝั่ง frontend และ Express + MongoDB/Mongoose ฝั่ง backend

## ฟังก์ชันที่เชื่อม MongoDB แล้ว

- สมัคร/เข้าสู่ระบบด้วยบัญชี `user` หรือ `owner`
- ค้นหาปาร์ตี้บุฟเฟต์และล็อคตำแหน่ง ดูปาร์ตี้ที่ตนจัด เข้าร่วม และส่งคำขอรออนุมัติ
- เผยแพร่ปาร์ตี้จากสนามที่เปิดใช้งาน กำหนดเวลา จำนวนผู้เล่น ตำแหน่ง และราคาต่อคน
- บุฟเฟต์ไม่กำหนดตำแหน่ง; ล็อคตำแหน่งเลือก GK/DF/MF/FW
- เลือกเปิดรับทันทีหรือให้หัวตี้อนุมัติก่อน คำขอรออนุมัติยังไม่ถือเป็นสมาชิกและไม่กันที่ว่าง
- หัวตี้ดูโปรไฟล์ผู้ขอ อนุมัติ/ปฏิเสธได้ ระบบตรวจจำนวนรวมและตำแหน่งอีกครั้งตอนอนุมัติ
- ผู้เล่นยกเลิกคำขอหรือออกจากทีมได้ก่อนเวลาเริ่ม หัวตี้ออกจากปาร์ตี้ของตนเองไม่ได้
- โปรไฟล์สาธารณะแสดงชื่อ พื้นที่ แนะนำตัว ตำแหน่งและระดับฝีเท้า อีเมลแสดงเฉพาะหน้าเจ้าของบัญชี
- แก้ไขโปรไฟล์ตนเองได้ ไม่รับการแก้ role/email/password ผ่าน API โปรไฟล์
- API เพิ่ม/แก้ไข/ลบสนามเดิมตรวจ role เจ้าของสนามและความเป็นเจ้าของแล้ว

สมาชิก/คำขออยู่ในเอกสาร Post เดียวกัน ใช้ Mongoose optimistic concurrency และ retry จากข้อมูลล่าสุด เพื่อไม่ให้การเข้าร่วมหรืออนุมัติพร้อมกันรับคนเกินจำนวน API ปาร์ตี้เดิมใช้กฎเดียวกัน จึงไม่สามารถข้ามการอนุมัติผ่าน endpoint เก่าได้

**การเผยแพร่ปาร์ตี้ไม่ใช่การจองหรือชำระค่าสนาม** ยังต้องตกลงการจองกับเจ้าของสนาม ระบบชำระเงินจริงและการยืนยันจองยังไม่ได้ปรับในรอบนี้ การค้นหาดึงไม่เกิน 100 ปาร์ตี้ที่ยังไม่สิ้นสุดในแต่ละโหมด

## รันบนเครื่อง

ใช้ Node.js 20.19+ (แนะนำ Node 22) และ MongoDB Community หรือ MongoDB Atlas

1. คัดลอก `Backend/.env.example` เป็น `Backend/.env` แล้วตั้ง `MONGODB_URI` และ `SECRET_KEY` ที่เป็นค่าสุ่มของคุณ
2. เปิด MongoDB สำหรับเครื่อง local หากใช้ URI ค่าเริ่มต้น
3. รัน API:

```bash
cd Backend
npm ci
npm run dev
```

4. เปิดอีก terminal แล้วรัน frontend:

```bash
cd frontend
npm ci
npm run dev
```

Vite proxy ส่ง `/api` ไป `http://127.0.0.1:3000` หน้า login/register จึงเปิดตรงหรือ refresh ได้โดยไม่ชน endpoint ของ backend บนมือถือที่อยู่ Wi-Fi เดียวกัน เปิด URL Network ที่ Vite แสดง; `localhost` ของ API จะถูกเรียกจาก proxy บนคอม ไม่ใช่จากโทรศัพท์

สำหรับ production ตั้ง `VITE_API_URL` ตาม `frontend/.env.example` เป็น HTTPS origin ของ API และตั้ง `CLIENT_ORIGIN` ใน backend ให้ตรง origin ของ frontend (หลาย origin คั่นด้วย comma) ต้องมี SPA fallback สำหรับ routes ฝั่ง frontend

หากฐานข้อมูลใหม่ยังไม่มีสนาม สมัครบัญชีเจ้าของสนาม แล้วเข้าหน้า `/Owner` เพื่อเพิ่มสนามก่อนสร้างปาร์ตี้ ไม่มีการ seed ข้อมูลสาธิตลงฐานข้อมูลจริง

## Routes

| Route | การใช้งาน |
| --- | --- |
| `/home` | Hero และ discovery ตัวอย่าง |
| `/login`, `/signup` | สมัคร/เข้าสู่ระบบจริง |
| `/team` | ค้นหาและจัดการปาร์ตี้จริง |
| `/create-party` | สร้างและเผยแพร่ปาร์ตี้จริง |
| `/parties/:partyId` | รายละเอียด สมาชิก เข้าร่วม/ยกเลิก |
| `/party-requests/:partyId` | เฉพาะหัวตี้: อนุมัติคำขอ |
| `/players/:playerId` | โปรไฟล์สาธารณะ |
| `/profile` | ดูและแก้ไขบัญชีตนเอง |
| `/demo/team`, `/demo/players/:playerId`, `/demo/party-requests` | ข้อมูลสาธิตแยกจากระบบจริง |

ฉบับร่างยังเก็บเฉพาะในเบราว์เซอร์ที่ใช้ (localStorage) และไม่เผยแพร่ให้ผู้อื่นค้นหา หน้า `/home` และ `/field` ยังเป็น discovery ตัวอย่าง ส่วน dashboard เจ้าของสนาม/การจอง/ประวัติเก่ายังต้องรีโนเวทต่อ ไม่มีระบบอัปโหลดรูปโปรไฟล์หรือปาร์ตี้ใหม่ในรอบนี้

## โครงสร้าง UI

- `frontend/src/features/live`: หน้าปาร์ตี้ โปรไฟล์ คำขอ และ authentication ที่เชื่อม API
- `frontend/src/features/parties`: ฟอร์มสร้าง โหมด ฉบับร่าง และ preview
- `frontend/src/features/profiles`: visual styles และ demo profiles
- `frontend/src/lib/api.ts`: API origin, token, errors และ types
- reusable UI: `frontend/src/components/ui`; global styles: `frontend/src/index.css`
- `components.json` และ alias `@/*` รองรับ shadcn structure; Tailwind v4 และ TypeScript strict สำหรับ TS/TSX ใหม่ ส่วน JSX เก่ายังเป็น allowJs

ออกแบบเน้นมือถือ touch target 44–48px, input 16px, safe-area สำหรับเมนูล่าง; iPad/desktop ใช้ความกว้างและสองคอลัมน์ตามพื้นที่ Hero ใช้ GSAP/ScrollTrigger และ component parallax ที่ผู้ใช้ให้มา รูปสนาม `/hero-stadium-v2.png` มาจากรูปอ้างอิงของผู้ใช้ Desktop ใช้ Lenis; touch ใช้ native scroll และรองรับ reduced motion

## ตรวจสอบ

```bash
cd frontend
npm run build

cd ../Backend
npm test
npm run test:integration
```

`npm test` ตรวจตรรกะความจุ ตำแหน่ง สิทธิ์หัวตี้ การซ่อนคำขอ และ retry หลัง version conflict โดยไม่ต้องเปิด MongoDB

`test:integration` เปิด MongoDB ชั่วคราวเพื่อทดสอบ HTTP API, JWT, privacy, การสมัคร, การส่งคำขอ, การยกเลิก และการอนุมัติ/เข้าร่วมพร้อมกัน ชุดนี้ต้องดาวน์โหลดและรัน MongoDB binary ได้ หรือกำหนด `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/kickhub_test` เพื่อใช้ฐานข้อมูล local **สำหรับทดสอบเท่านั้น** ซึ่งจะถูกล้างก่อนและหลังทดสอบ ไม่รองรับ URI ของฐานข้อมูลจริง

GitHub Actions (`.github/workflows/ci.yml`) เปิด MongoDB service แยกและรันทั้ง unit, integration และ frontend build บนทุก push/PR ยังไม่ได้ทดสอบภาพและ interaction ด้วย browser บน iPhone/iPad จริงใน environment นี้

Repository: https://github.com/namethzz/kickhub
