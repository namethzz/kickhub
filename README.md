# Kickhub — football starts with people

แอพหาเพื่อนเตะบอลและค้นหาสนาม สำหรับผู้เล่น (`user`) และเจ้าของสนาม (`owner`)

## Step 1: Frontend discovery redesign

ปรับ `/`, `/home`, `/team`, `/field` และ navigation ใหม่ โทนเขียวเข้ม/ไลม์ รองรับมือถือและ desktop ใช้รูปจากโปรเจกต์เดิม ไม่มี dependency ใหม่

- ค้นหาชื่อแมตช์/สนาม/พื้นที่ และกรองจังหวัด ระดับการเล่น วันเตะ
- รายละเอียดแสดงราคา เวลา จำนวนผู้เล่น และตำแหน่งที่เปิดรับ
- Native HTML dialog รองรับ Escape และคืน focus เมื่อปิด
- แยกทางเข้าเจ้าของสนามจากงานหลักของผู้เล่น
- หน้าเก่าอยู่ที่ `/legacy/team`, `/legacy/field`; login/owner/สร้างปาร์ตี้เดิมยังอยู่

**รายการใหม่เป็นข้อมูลสาธิตทั้งหมด** (`frontend/src/data/discovery.js`) ไม่ได้ดึง MongoDB ไม่มีการจอง/เข้าร่วมจริง วันที่ใช้เพียงวันในสัปดาห์ ไม่อ้างว่าเป็นแมตช์วันนี้

## Run frontend

ใช้ Node.js 20.19+ หรือ 22.12+

```bash
cd frontend
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดง แล้วเข้าหน้า `/`

```bash
npm run build
```

## Backend เดิม

Express + MongoDB/Mongoose โค้ดเดิมใช้ `mongodb://localhost:27017/kickhub`, API port 3000 รัน frontend step นี้ได้โดยไม่เปิด backend

```bash
cd Backend
npm ci
npm start
```

ต้องเปิด MongoDB และตั้ง `SECRET_KEY` ใน `Backend/.env` ก่อนใช้ authentication ไม่รวม `.env` ใน zip ที่ปรับใหม่; นำค่าเดิมบนเครื่องของคุณกลับมาใช้ได้ ห้าม commit secret

Backend ยังไม่ได้ปรับใน step นี้: frontend เดิมเรียกหลาย IP, login token ไม่มี role และ ProtectedRoute ปิดการ redirect เมื่อไม่มี token จึงยังไม่ได้ตรวจสิทธิ์เจ้าของสนามครบ การมีทางเข้าหน้า owner ไม่ใช่การให้สิทธิ์

## Changed files

- `frontend/src/components/home.jsx`: discovery, filters, cards, details
- `frontend/src/components/Navbar.jsx`: desktop/mobile navigation
- `frontend/src/discovery.css`: visual system
- `frontend/src/data/discovery.js`: preview fixtures
- `frontend/src/App.jsx`: default/discovery/legacy routes
- `frontend/index.html`: Thai language/title
- `.gitignore`, `README.md`

## Next steps

2. รีโนเวท Login/Register ตรวจ role ฝั่ง server รวม API URL และตั้ง MongoDB ด้วย environment
3. เชื่อมแมตช์/สนามจาก MongoDB พร้อม loading/error/empty states และเข้าร่วมจริง
4. รีโนเวทสร้างแมตช์ การจอง ประวัตินัด และ dashboard เจ้าของสนาม
5. ตรวจ flow user/owner และ mobile ก่อน deploy

## Verification

`npm run build` ผ่าน; React server-rendering ของ `/`, `/home`, `/team`, `/field` ผ่าน (3 cards และ preview label ทุกหน้า) ยังไม่ได้ตรวจภาพ/interactions ใน browser เพราะไม่มี browser QA ที่รองรับ และยังไม่ได้ตรวจ MongoDB หรือการจองจริง

## Repository

เป้าหมายจากภาพคือ https://github.com/namethzz/kickhub โค้ด frontend ที่ปรับใหม่และ backend เดิมอยู่ใน repository นี้ ไม่รวม `.git` เก่า, node_modules, build output หรือ .env

## Hero update: layered parallax

ใช้รูปที่แนบ `frontend/public/hero-kickhub.jpg` แบบไม่แก้ไขไฟล์ภาพ ครอปด้วย CSS เฉพาะส่วนลูกบอล/สนามเพื่อหลีกเลี่ยงข้อความ BORCELLE ในภาพ โค้ด JSX เหมาะกับ React/Vite เดิม ไม่ต้องเปลี่ยนโปรเจกต์ทั้งหมดเป็น TypeScript

- `frontend/src/components/ui/parallax-scrolling.jsx`: component ที่ดัดแปลงจากตัวอย่าง GSAP/ScrollTrigger + Lenis
- `frontend/src/components/ui/parallax-scrolling.css`: desktop, iPad, iPhone และ landscape
- `home.jsx`: เรียก Hero ใหม่และกำหนด target ของปุ่มเลือกแมตช์; dialog ป้องกัน Lenis จัดการ scroll ภายใน
- `package.json`/`package-lock.json`: เพิ่ม `gsap` และ `lenis` (ชื่อปัจจุบันของแพ็กเกจในตัวอย่าง)

Touch scrolling คงเป็น native; parallax บน touch เบากว่า desktop ไม่มี pin หรือบังคับหน้าจอเต็ม ปิด animation และ smooth scrolling เมื่อเลือก reduced motion ใช้ GSAP matchMedia เพื่อ cleanup เฉพาะ animation ของ Hero และถอด ticker/Lenis เมื่อ unmount หรือเปลี่ยน breakpoint ไม่ฆ่า ScrollTrigger ของ component อื่น

หลังแทนไฟล์ ให้รัน `npm ci` แล้ว `npm run dev` ใหม่ ยังไม่ได้ทดสอบภาพ/interaction บนอุปกรณ์จริงหรือ browser ใน environment นี้
