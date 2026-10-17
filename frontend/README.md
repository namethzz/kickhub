# KickHub frontend

เว็บของ KickHub สร้างด้วย React 19, Vite, TypeScript/JavaScript, Tailwind CSS และ React Router ภาพรวมโปรเจกต์ วิธีตั้งค่า Backend และรายการหน้าทั้งหมดอยู่ใน [README หลัก](../README.md)

## คำสั่ง

| คำสั่ง | ใช้ทำอะไร |
| --- | --- |
| `npm run dev` | เปิด dev server ที่ `http://localhost:5173` และส่ง `/api` ไปที่ `http://127.0.0.1:3000` |
| `npm run build` | typecheck, build ลง `dist/` แล้วสร้างหน้า `/privacy`, `/terms`, `/data-deletion` เป็น HTML |
| `npm run preview` | เปิดดูผล build ในเครื่อง |
| `npm run lint` | ตรวจโค้ดด้วย ESLint |
| `npm test` | รัน test ใน `test/` ด้วย `node --test` |

## ค่า Environment

| ตัวแปร | ค่า |
| --- | --- |
| `VITE_API_URL` | เว้นว่างตอนพัฒนาในเครื่อง เพื่อใช้ Vite proxy ตอน deploy ให้ใส่ HTTPS origin ของ API ไม่มี `/` ท้ายและไม่มี `/api` |

Vite ฝังค่า `VITE_API_URL` ลงในไฟล์ตอน build ถ้าเปลี่ยนค่า ต้อง build ใหม่

## โครงสร้าง `src/`

- `features/live/` ค้นหาปาร์ตี้ รายละเอียดปาร์ตี้ คำขอ แชต แจ้งเตือน ปาร์ตี้ของฉัน และหน้าเข้าสู่ระบบ
- `features/parties/` ขั้นตอนสร้างปาร์ตี้และการเลือกรูปแบบการเล่น
- `features/fields/` รายการสนามและหน้ารายละเอียดสนาม
- `features/profiles/` แก้ไขโปรไฟล์และรูปภาพ
- `features/owner/` หน้าจัดการสนามสำหรับเจ้าของสนาม
- `features/policies/` หน้านโยบายและการลบบัญชี
- `lib/api.ts` ฟังก์ชันเรียก API ที่แนบ JWT ให้อัตโนมัติ
- `components/ui/` คอมโพเนนต์พื้นฐาน (ปุ่ม ฟอร์ม การ์ด)
- `data/discovery.js` ข้อมูลตัวอย่างสำหรับหน้า `/demo/*`
- `demos/default.tsx` ตัวอย่าง parallax ที่ยังไม่มี route ใดเรียกใช้

## Dark mode

ผู้ใช้เลือกธีมได้สามแบบ: สว่าง มืด หรือตามอุปกรณ์ (`system`) ระบบเก็บเฉพาะตัวเลือกสว่างหรือมืดไว้ใน `localStorage` คีย์ `kh-theme` แล้วตั้ง `data-theme` บนแท็ก `<html>`

- `src/lib/theme.js` อ่าน บันทึก และติดตามการเปลี่ยนธีม รวมถึงซิงก์ระหว่างแท็บ
- `index.html` มีสคริปต์สั้นที่ตั้งธีมก่อนหน้าเว็บแสดงผล เพื่อไม่ให้หน้าจอกะพริบขาว ถ้าแก้ `theme.js` ต้องแก้สคริปต์นี้ให้ตรงกันด้วย
- `vite-plugins/dark-theme.js` เป็นปลั๊กอิน PostCSS ที่อ่านทุกกฎสีในไฟล์ CSS ของ `src/` แล้วสร้างกฎคู่กันภายใต้ `html[data-theme="dark"]` ตอน build คุณจึงเขียนสีโหมดสว่างอย่างเดียว ไม่ต้องเขียน CSS โหมดมืดเอง และไม่มีไฟล์ที่สร้างขึ้นถูก commit
- `vite-plugins/dark-colors.js` เก็บสูตรแปลงสี ปรับโทนสีโหมดมืดได้ที่ไฟล์นี้
