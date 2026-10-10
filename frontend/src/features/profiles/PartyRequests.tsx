import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, X, ShieldCheck } from 'lucide-react';
import { findPlayer } from './player-model';
import './profiles.css';
type Status = 'pending' | 'approved' | 'declined';
export default function PartyRequests() {
  const [statuses, setStatuses] = useState<Record<string, Status>>({ beam: 'pending', mint: 'pending' });
  const [notice, setNotice] = useState('');
  const pending = Object.values(statuses).filter(status => status === 'pending').length;
  return <main className="party-app party-create-page"><Link className="party-back" to="/demo/team?party=demo-3"><ArrowLeft size={18} />กลับไปดูปาร์ตี้</Link><div className="party-page-head"><div><span className="party-kicker">HOST DESK · DEMO</span><h1>คำขอเข้าร่วมทีม</h1><p>เติมทีมให้ครบ แล้วลงสนาม</p></div></div><p className="party-draft-note">ทดลองมุมมองหัวตี้ด้วยคำขอตัวอย่างเท่านั้น ผลการอนุมัติอยู่ในหน้านี้และจะรีเซ็ตเมื่อออก ไม่ได้เปลี่ยนสมาชิกจริง</p><div className="request-heading"><ShieldCheck size={20} /><h2>รออนุมัติ {pending} คน</h2></div><div className="request-list">{Object.entries(statuses).map(([id, status]) => { const player = findPlayer(id)!; return <article className="request-card" key={id}><Link className="player-row" to={`/demo/players/${id}`}><span className="player-mini-avatar">{player.initials}</span><span><strong>{player.name}</strong><small>ขอเล่น{player.position}</small></span><span className="player-view">ดูโปรไฟล์ ↗</span></Link><p>{player.bio}</p>{status === 'pending' ? <div className="request-actions"><button onClick={() => { setStatuses(previous => ({ ...previous, [id]: 'declined' })); setNotice(`ปฏิเสธคำขอของ${player.name}แล้ว (สาธิต)`); }}><X size={17} />ปฏิเสธ</button><button onClick={() => { setStatuses(previous => ({ ...previous, [id]: 'approved' })); setNotice(`อนุมัติ${player.name}ในตำแหน่ง${player.position}แล้ว (สาธิต)`); }}><Check size={17} />อนุมัติ</button></div> : <p className="request-status">{status === 'approved' ? 'อนุมัติแล้ว · สาธิต' : 'ปฏิเสธแล้ว · สาธิต'}</p>}</article>; })}</div><p className="player-caption" role="status" aria-live="polite">{notice}</p><button className="kh-button kh-dark kh-full" onClick={() => { setStatuses({ beam: 'pending', mint: 'pending' }); setNotice('รีเซ็ตคำขอตัวอย่างแล้ว'); }}>เริ่มทดลองใหม่</button></main>;
}
