import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ChevronRight, ArrowLeft, ShieldCheck } from 'lucide-react';
import { api, type LiveParty, type PublicPlayer } from '@/lib/api';
import { modeInfo, positions } from '../parties/party-model';
import PartyQuickActions from './PartyQuickActions';
import HostPartyActions from './HostPartyActions';
import PartyChat from './PartyChat';
import { PartyCover } from './PartyCover';
import './party-detail-cover.css';
import { markPartyActivityRead } from './notifications-api';
import { ApiError, when } from './LiveParties';
export default function LivePartyDetail() {
  const { partyId } = useParams();
  const [params] = useSearchParams();
  const linkedTab = params.get('tab');
  const [party, setParty] = useState<LiveParty | null>(null);
  const [me, setMe] = useState<PublicPlayer | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [position, setPosition] = useState('');
  const [tab, setTab] = useState(linkedTab === 'chat' ? 'chat' : 'details');
  useEffect(() => { setTab(linkedTab === 'chat' ? 'chat' : 'details'); }, [partyId, linkedTab]);
  const [confirm, setConfirm] = useState<'join'|'leave'|null>(null);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    if (!party?.activity_read_through) return;
    let active = true, done = false, running = false;
    const acknowledge = async () => {
      if (done || running || document.visibilityState !== 'visible') return;
      running = true;
      try { await markPartyActivityRead(party._id, party.activity_read_through!); done = true; }
      catch { if (active) setNotice('เปิดปาร์ตี้แล้ว แต่บันทึกสถานะอ่านแจ้งเตือนไม่สำเร็จ ลองเปิดหน้านี้อีกครั้ง'); }
      finally { running = false; }
    };
    void acknowledge(); document.addEventListener('visibilitychange', acknowledge);
    return () => { active = false; document.removeEventListener('visibilitychange', acknowledge); };
  }, [party?._id, party?.activity_read_through]);
  useEffect(() => { let active=true; setLoading(true); setError(''); Promise.all([api<LiveParty>(`/api/v2/parties/${partyId}`),api<PublicPlayer>('/api/v2/me')]).then(([data,user]) => { if(active){setParty(data);setMe(user);} }).catch(error => {if(active)setError(error.message);}).finally(()=>{if(active)setLoading(false);});return()=>{active=false;}; },[partyId]);
  const mutate = async () => { if(!confirm||busy)return; const action=confirm; setBusy(true);setError('');setNotice('');try{const data=await api<LiveParty>(`/api/v2/parties/${partyId}/${action}`,{method:'POST',body:JSON.stringify({position})});setParty(data);if(action==='leave')setTab('details');setConfirm(null);setNotice(action==='leave'?'ยกเลิกการเข้าร่วมหรือคำขอแล้ว':data.join_requests.some(request=>request.user_id===me?._id&&request.status==='pending')?'ส่งคำขอแล้ว รอหัวตี้อนุมัติ':'เข้าร่วมปาร์ตี้สำเร็จ');}catch(error){setError((error as Error).message);setConfirm(null);}finally{setBusy(false);} };
  if(loading)return <main className="party-app"><p role="status">กำลังโหลดปาร์ตี้…</p></main>;
  if(!party||!me)return <main className="party-app"><ApiError message={error||'ไม่พบปาร์ตี้'} /></main>;
  const host=me._id===party.user_id;
  const joined=party.participants.some(member=>member.user_id===me._id);
  const pending=party.join_requests.find(request=>request.user_id===me._id&&request.status==='pending');
  const ended=new Date(party.start_datetime)<=new Date();
  const cancelled=party.status==='cancelled';
  const full=party.participants.length>=party.capacity;
  return <main className="party-app party-create-page"><Link className="party-back" to="/team"><ArrowLeft size={18}/>กลับไปค้นหาปาร์ตี้</Link><section className="party-detail-cover" aria-labelledby="party-detail-title"><PartyCover key={party.cover_url || party._id} src={party.cover_url} loading="eager"><div className="party-detail-cover-meta"><span className="party-pill">{modeInfo[party.mode].title}</span><span className="party-card-chip"><ShieldCheck size={14} />{party.access === 'approval' ? 'หัวตี้อนุมัติ' : 'เปิดรับทุกคน'}</span></div><div className="party-detail-cover-title"><span>YOUR NEXT GAME</span><h1 id="party-detail-title">{party.party_name}</h1></div></PartyCover></section>{cancelled&&<section className="party-cancelled-banner" role="status"><strong>หัวตี้ยกเลิกปาร์ตี้นี้แล้ว</strong><p>{party.cancellation_reason||'หัวตี้ไม่ได้ระบุเหตุผล'}{party.cancelled_at&&` · ${when(party.cancelled_at)}`}</p><Link to="/team">ค้นหาปาร์ตี้อื่น →</Link></section>}<p className="party-location">{party.field_name} · {party.address}</p><div className="party-price-panel"><div><small>ราคา / คน · ตามที่หัวตี้กำหนด</small><strong>฿{party.price}</strong></div><span>{party.participants.length}/{party.capacity} คน</span></div><PartyQuickActions party={party} joined={joined||host}/><div className="party-main-tabs party-chat-tabs"><button className={tab==='details'?'active':''} onClick={()=>setTab('details')}>รายละเอียด</button><button className={tab==='people'?'active':''} onClick={()=>setTab('people')}>ผู้เข้าร่วม ({party.participants.length})</button>{(host||joined)&&<button className={tab==='chat'?'active':''} onClick={()=>setTab('chat')}>แชตทีม</button>}</div>{tab==='chat'&&(host||joined)?<PartyChat key={party._id} partyId={party._id} actorId={me._id}/>:tab==='details'?<section className="party-form-section"><p className="player-caption">{when(party.start_datetime)} – {new Date(party.end_datetime).toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}</p><p className="player-bio">{party.description||'หัวตี้ยังไม่ได้เพิ่มรายละเอียด'}</p><Link className="player-row" to={`/players/${party.user_id}`} state={{from:`/parties/${partyId}`}}><span className="player-mini-avatar">{party.host_name.slice(0,1)}</span><span><strong>{party.host_name}</strong><small>หัวตี้ · ดูโปรไฟล์</small></span></Link>{party.mode==='fixed'&&<fieldset className="party-position-field"><legend>เลือกตำแหน่งของคุณ</legend><div className="party-position-grid">{positions.map(item=>{const available=(party.required_positions.find(slot=>slot.position===item.code)?.amount||0)-party.participants.filter(member=>member.position===item.code).length;return <button type="button" key={item.code} disabled={available<=0||joined||!!pending||ended||cancelled} aria-pressed={position===item.code} className={position===item.code?'selected':''} onClick={()=>setPosition(item.code)}><b>{item.code}</b><span>{item.name}</span><small>{available>0?`ว่าง ${available} คน`:'เต็มแล้ว'}</small></button>;})}</div></fieldset>}<div className="party-access-note"><ShieldCheck size={20}/><p>{cancelled?'ปาร์ตี้ถูกยกเลิก ไม่เปิดรับผู้เล่นแล้ว':party.access==='approval'?'ต้องรอหัวตี้อนุมัติ คำขอยังไม่ถือเป็นการจองตำแหน่ง':'เข้าร่วมได้ทันทีเมื่อมีที่ว่าง'}</p></div></section>:<section className="party-form-section">{party.participants.map(member=><Link key={member.user_id} className="player-row" to={`/players/${member.user_id}`} state={{from:`/parties/${partyId}`}}><span className="player-mini-avatar">{member.name.slice(0,1)}</span><span><strong>{member.name}</strong><small>{positions.find(position=>position.code===member.position)?.name||'บุฟเฟต์'}{member.user_id===party.user_id?' · หัวตี้':''}</small></span><span className="player-view">ดูโปรไฟล์ <ChevronRight size={16} strokeWidth={1.8} aria-hidden="true" /></span></Link>)}</section>}{tab!=='chat'&&host&&!cancelled&&!ended&&party.access==='approval'&&<Link className="kh-button kh-dark kh-full" to={`/party-requests/${party._id}`}>จัดการคำขอเข้าร่วม ({party.join_requests.filter(request=>request.status==='pending').length})</Link>}{tab!=='chat'&&host&&<HostPartyActions key={party._id} party={party} onUpdated={setParty}/>} {notice&&<p className="party-draft-note" role="status">{notice}</p>}{error&&<p className="party-error" role="alert">{error}</p>}{confirm?<div className="party-form-section"><h2>{confirm==='join'?'ยืนยันการเข้าร่วม':'ยืนยันการยกเลิก'}</h2><p className="player-caption">{confirm==='join'&&party.access==='approval'?'ส่งคำขอให้หัวตี้พิจารณา คุณจะยังไม่เป็นสมาชิกจนกว่าอนุมัติ':party.party_name}</p><div className="request-actions"><button disabled={busy} onClick={()=>setConfirm(null)}>กลับ</button><button disabled={busy} onClick={mutate}>{busy?'กำลังบันทึก…':'ยืนยัน'}</button></div></div>:!host&&tab!=='chat'&&<div className="party-form-actions"><button className="kh-button kh-primary" disabled={cancelled||host||ended||(!joined&&!pending&&(full||(party.mode==='fixed'&&!position)))} onClick={()=>setConfirm(joined||pending?'leave':'join')}>{cancelled?'ปาร์ตี้ถูกยกเลิกแล้ว':host?'คุณเป็นหัวตี้':ended?'ปาร์ตี้เริ่มแล้ว':pending?'ยกเลิกคำขอที่รออนุมัติ':joined?'ออกจากปาร์ตี้':full?'ผู้เล่นครบแล้ว':party.access==='approval'?'ส่งคำขอเข้าร่วม':'เข้าร่วมปาร์ตี้'}</button></div>}</main>;
}
