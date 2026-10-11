import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Flag, MapPin, SlidersHorizontal, Users, Check, Search } from 'lucide-react';
import './owner.css';

export default function OwnerWelcome({ playerName }: { playerName?: string }) {
  return <main className="owner-start">
    <Link className="owner-start-back" to="/home">← กลับหน้าหลัก</Link>
    <section className="owner-start-hero" aria-labelledby="owner-start-title">
      <div className="owner-start-copy"><span className="party-kicker">KICKHUB FOR FIELD OWNERS</span><h1 id="owner-start-title">ให้สนามของคุณ<br /><em>เป็นจุดนัดพบทีมใหม่.</em></h1><p>รวมข้อมูลสนาม ราคา และช่องทางติดต่อไว้ที่เดียว ให้ผู้เล่นค้นพบและเลือกสนามของคุณตอนสร้างปาร์ตี้</p><div className="owner-start-actions"><Link className="kh-button kh-primary" to="/register?role=owner&next=%2FOwner">สมัครบัญชีเจ้าของสนาม <ArrowRight size={18} /></Link><Link className="owner-start-login" to="/login?next=%2FOwner">มีบัญชีเจ้าของสนามแล้ว? เข้าสู่ระบบ <ArrowUpRight size={16} /></Link></div></div>
      <div className="owner-start-visual" aria-hidden="true"><div className="owner-pitch"><div className="owner-pitch-circle" /><div className="owner-pitch-box owner-pitch-box--top" /><div className="owner-pitch-box owner-pitch-box--bottom" /><Flag className="owner-pitch-flag" size={36} /><span className="owner-pitch-dot owner-pitch-dot--one" /><span className="owner-pitch-dot owner-pitch-dot--two" /><span className="owner-pitch-dot owner-pitch-dot--three" /></div><div className="owner-pitch-label"><span><MapPin size={18} /> สนามของคุณ</span><small>จุดเริ่มต้นของเกมถัดไป</small></div></div>
    </section>
    {playerName && <aside className="owner-account-note"><Users size={22} /><div><strong>ตอนนี้คุณใช้บัญชีผู้เล่น · {playerName}</strong><p>ค้นหาและสร้างปาร์ตี้ได้ตามปกติ หากคุณมีสนาม ให้สมัครบัญชีเจ้าของสนามด้วยอีเมลอีกบัญชี หรือเข้าสู่ระบบด้วยบัญชีเจ้าของสนามที่มีอยู่</p></div><Link to="/my-parties">ปาร์ตี้ของฉัน <ArrowRight size={16} /></Link></aside>}
    <section className="owner-start-benefits" aria-label="สิ่งที่จัดการได้"><article><MapPin /><h2>ให้ผู้เล่นหาสนามเจอ</h2><p>บอกชื่อ ย่าน และแผนที่ เพื่อให้ผู้เล่นดูสถานที่ก่อนนัดเตะ</p></article><article><SlidersHorizontal /><h2>ข้อมูลพร้อมตัดสินใจ</h2><p>ใส่รูป ราคา เวลาเปิด และสิ่งอำนวยความสะดวกที่สนามมีจริง</p></article><article><Users /><h2>เป็นสนามของปาร์ตี้ใหม่</h2><p>เปิดหรือพักสนามได้เอง สนามที่เปิดจะอยู่ในตัวเลือกสร้างปาร์ตี้</p></article></section>
    <section className="owner-start-guide"><div><span className="party-kicker">GET YOUR FIELD READY</span><h2>พร้อมเปิดสนามใน 3 ขั้นตอน</h2><p>เตรียมรูปสนาม เบอร์ติดต่อ และลิงก์แผนที่ไว้ก่อนเริ่ม</p></div><ol><li><span>01</span><div><strong>เลือกบัญชีเจ้าของสนาม</strong><p>สมัครสมาชิก หรือเข้าสู่ระบบด้วยบัญชีเจ้าของสนาม</p></div></li><li><span>02</span><div><strong>เพิ่มรายละเอียดสนาม</strong><p>ระบุสถานที่ ราคาต่อชั่วโมง เวลาเปิด และช่องทางติดต่อ</p></div></li><li><span><Check size={18} /></span><div><strong>เปิดให้ผู้เล่นค้นพบ</strong><p>ตรวจสอบข้อมูล แล้วเปิดให้เลือกสนามตอนสร้างปาร์ตี้</p></div></li></ol></section>
    <div className="owner-start-footer"><p>การจองและชำระค่าสนามยังติดต่อกับสนามโดยตรงผ่านช่องทางในหน้ารายละเอียด</p><Link to="/field"><Search size={17} /> ดูหน้าสนามที่ผู้เล่นเห็น <ArrowUpRight size={16} /></Link></div>
  </main>;
}
