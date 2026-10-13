import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin, Plus, RefreshCw, Users } from 'lucide-react';
import { api, type LiveParty } from '@/lib/api';
import { modeInfo, positions } from '../parties/party-model';
import { ApiError, when } from './LiveParties';
import './my-parties.css';

type Scope = 'host' | 'joined' | 'requested';
type Feed = { actor_id: string; counts: Record<Scope, number>; total: number; page: number; pageSize: number; parties: LiveParty[] };
const tabs: { value: Scope; title: string }[] = [{ value: 'host', title: 'ฉันเป็นหัวตี้' }, { value: 'joined', title: 'ฉันเข้าร่วม' }, { value: 'requested', title: 'คำขอของฉัน' }];
const requestLabels = { pending: 'รอหัวตี้อนุมัติ', approved: 'อนุมัติแล้ว', declined: 'ไม่ได้รับอนุมัติ', cancelled: 'ยกเลิกคำขอแล้ว' };

export default function MyParties() {
  const [params, setParams] = useSearchParams();
  const scope: Scope = ['host', 'joined', 'requested'].includes(params.get('scope') || '') ? params.get('scope') as Scope : 'host';
  const history = params.get('period') === 'history';
  const rawPage = Number(params.get('page') || 1);
  const page = Number.isInteger(rawPage) && rawPage > 0 && rawPage <= 10000 ? rawPage : 1;
  const [feed, setFeed] = useState<Feed | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true; setLoading(true); setError('');
    api<Feed>(`/api/v2/my-parties?scope=${scope}&period=${history ? 'history' : 'upcoming'}&page=${page}`).then(data => { if (active) setFeed(data); }).catch(error => { if (active) setError(error.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [scope, history, page, reload]);
  useEffect(() => {
    const refresh = () => { if (document.visibilityState === 'visible') setReload(value => value + 1); };
    document.addEventListener('visibilitychange', refresh);
    return () => document.removeEventListener('visibilitychange', refresh);
  }, []);
  // Opened without an explicit tab: if the user hosts nothing but has joined games, show those first.
  useEffect(() => {
    if (!feed || params.get('scope') || history || scope !== 'host') return;
    if (feed.counts.host === 0 && feed.counts.joined > 0) setParams({ scope: 'joined', period: 'upcoming', page: '1' }, { replace: true });
  }, [feed, params, history, scope, setParams]);
  function select(nextScope: Scope, nextHistory = history, nextPage = 1) {
    setParams({ scope: nextScope, period: nextHistory ? 'history' : 'upcoming', page: String(nextPage) });
  }
  const now = Date.now();
  const currentTitle = tabs.find(tab => tab.value === scope)!.title;
  const pages = feed ? Math.max(1, Math.ceil(feed.total / feed.pageSize)) : 1;
  return <main className="party-app kh-my-parties">
    <Link className="party-back" to="/team"><ArrowLeft size={16} />ค้นหาปาร์ตี้</Link>
    <div className="party-page-head"><div><span className="party-kicker">YOUR GAMES, ONE PLACE</span><h1>ปาร์ตี้ของฉัน</h1><p>เกมที่คุณนัดไว้ และเพื่อนร่วมสนามของคุณ</p></div><Link className="party-add-button" to="/create-party" aria-label="สร้างปาร์ตี้"><Plus /></Link></div>
    <div className="kh-my-toolbar"><div className="kh-my-period" aria-label="ช่วงเวลาปาร์ตี้">{[[false, 'นัดที่กำลังจะถึง'], [true, 'ประวัติ']] .map(([value, label]) => <button key={String(value)} type="button" aria-pressed={history === value} className={history === value ? 'active' : ''} onClick={() => select(scope, value as boolean)}>{label}</button>)}</div><button className="kh-my-refresh" disabled={loading} aria-label="อัปเดตสถานะปาร์ตี้" onClick={() => setReload(value => value + 1)}><RefreshCw size={17} className={loading ? 'animate-spin' : ''} /></button></div>
    <div className="kh-my-tabs" aria-label="ปาร์ตี้ที่เกี่ยวข้องกับคุณ">{tabs.map(tab => <button key={tab.value} aria-pressed={scope === tab.value} className={scope === tab.value ? 'active' : ''} onClick={() => select(tab.value)}><span>{tab.title}</span>{!loading && !error && feed && <b>{feed.counts[tab.value]}</b>}</button>)}</div>
    <div className="kh-my-section-title"><h2>{history ? 'ประวัติ' : 'นัดของคุณ'} · {currentTitle}</h2><span>รวมบุฟเฟต์และล็อคตำแหน่ง</span></div>
    {loading ? <div className="kh-my-skeletons" role="status" aria-label="กำลังโหลดปาร์ตี้ของคุณ">{[1, 2, 3].map(key => <div key={key} className="kh-my-skeleton"><div /><div /><div /></div>)}</div> : error ? <ApiError message={error} retry={() => setReload(value => value + 1)} /> : feed && <>
      <div className="kh-my-list">{feed.parties.map(party => {
        const host = party.user_id === feed.actor_id;
        const member = party.participants.find(member => member.user_id === feed.actor_id);
        const request = party.join_requests.find(request => request.user_id === feed.actor_id);
        const started = new Date(party.start_datetime).getTime() <= now;
        const ended = new Date(party.end_datetime).getTime() <= now;
        const pendingCount = host ? party.join_requests.filter(request => request.status === 'pending').length : 0;
        const cancelled = party.status === 'cancelled';
        const status = cancelled ? 'หัวตี้ยกเลิกปาร์ตี้' : ended ? 'จบแล้ว' : scope === 'requested' && request ? request.status === 'pending' && started ? 'หมดเวลาเข้าร่วม' : requestLabels[request.status] : started ? 'กำลังเตะ' : host ? 'คุณเป็นหัวตี้' : 'เข้าร่วมแล้ว';
        const position = positions.find(position => position.code === member?.position)?.name;
        return <article className="kh-my-card" key={party._id}>
          <div className="kh-my-card-top"><span className="kh-my-mode" data-mode={party.mode}>{modeInfo[party.mode].title}</span><span className={`kh-my-status ${cancelled || ended || (scope === 'requested' && request && ['declined', 'cancelled'].includes(request.status)) ? 'ended' : request?.status === 'pending' && scope === 'requested' ? 'pending' : ''}`}>{status}</span></div>
          <h3><Link to={`/parties/${party._id}`}>{party.party_name}</Link></h3>
          <p className="kh-my-location"><MapPin size={15} /><span>{party.field_name} · {party.address}</span></p>
          <div className="kh-my-date"><CalendarDays size={17} /><span>{when(party.start_datetime)}</span></div>
          <div className="kh-my-meta"><span><Users size={14} />{party.participants.length}/{party.capacity} คน</span>{position && <span>ตำแหน่ง {position}</span>}<strong>฿{party.price.toLocaleString('th-TH')}<small> / คน</small></strong></div>
          {scope === 'requested' && request && <p className="kh-my-request"><Clock3 size={14} />{requestLabels[request.status]}{request.status === 'pending' && started ? ' · หมดเวลาเข้าร่วมแล้ว' : request.status === 'approved' && !member ? ' · คุณออกจากปาร์ตี้แล้ว' : ''}</p>}
          <div className="kh-my-actions"><Link className="kh-button kh-dark" to={`/parties/${party._id}`}>{history ? 'ดูรายละเอียด' : 'ดูปาร์ตี้'}<ArrowUpRight size={16} /></Link>{host && !cancelled && party.access === 'approval' && !started && <Link className="kh-my-review" to={`/party-requests/${party._id}`}>คำขอรออนุมัติ <b>{pendingCount}</b></Link>}</div>
        </article>;
      })}</div>
      {!feed.parties.length && <div className="party-empty kh-my-empty"><div><CalendarDays size={26} /></div><h3>{history ? 'ยังไม่มีประวัติในหมวดนี้' : scope === 'host' ? 'ตี้แรกของคุณ เริ่มได้เลย' : scope === 'joined' ? 'ยังไม่มีนัดเตะบอล' : 'ยังไม่มีคำขอเข้าร่วม'}</h3><p>{history ? 'ปาร์ตี้ที่จบแล้วหรือถูกหัวตี้ยกเลิกจะอยู่ที่นี่' : scope === 'host' ? 'เลือกสนาม ชวนเพื่อน แล้วเปิดรับคนร่วมเกม' : 'ลองหาปาร์ตี้ที่ตรงกับวันและตำแหน่งที่คุณชอบ'}</p><Link className="kh-button kh-primary" to={scope === 'host' && !history ? '/create-party' : '/team'}>{scope === 'host' && !history ? 'สร้างปาร์ตี้' : 'ค้นหาปาร์ตี้'}</Link>{page > 1 && <button className="kh-my-review" onClick={() => select(scope, history)}>กลับหน้าแรก</button>}</div>}
      {feed.total > feed.pageSize && <nav className="kh-my-pagination" aria-label="หน้าปาร์ตี้"><button disabled={page <= 1} onClick={() => select(scope, history, page - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft size={18} /></button><span>หน้า {page} / {pages}</span><button disabled={page >= pages} onClick={() => select(scope, history, page + 1)} aria-label="หน้าถัดไป"><ChevronRight size={18} /></button></nav>}
    </>}
  </main>;
}
