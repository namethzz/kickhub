import { useEffect, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { Plus, Search, MapPin, Users, ArrowUpRight, SlidersHorizontal, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, type LiveParty } from '@/lib/api';
import { ModePicker } from '../parties/ModePicker';
import { modeInfo, positions } from '../parties/party-model';
import './party-search.css';
export const when = (value: string) => new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' });
export function ApiError({ message, retry }: { message: string; retry?: () => void }) { const location = useLocation(); return <div className="party-empty"><p role="alert">{message}</p>{localStorage.getItem('token') ? retry && <button className="kh-button kh-dark" onClick={retry}>ลองใหม่</button> : <Link className="kh-button kh-primary" to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`}>เข้าสู่ระบบ</Link>}</div>; }
type SearchResult = { parties: LiveParty[]; total: number; page: number; pageSize: number };
export default function LiveParties() {
  const [params, setParams] = useSearchParams();
  const mode = params.get('mode') === 'fixed' ? 'fixed' : 'flexible';
  const field = params.get('field') || '';
  const [data, setData] = useState<SearchResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [reload, setReload] = useState(0);
  const request = new URLSearchParams();
  for (const key of ['field', 'q', 'date', 'maxPrice', 'access', 'sort', 'available', 'page']) if (params.has(key)) request.set(key, params.get(key)!);
  request.set('mode', mode);
  if (mode === 'fixed' && params.has('position')) request.set('position', params.get('position')!);
  const requestKey = request.toString();
  useEffect(() => {
    let active = true;
    setLoading(true); setError(''); setData(null);
    api<SearchResult>(`/api/v2/party-search?${requestKey}`).then(result => { if (active) setData(result); }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [requestKey, reload]);
  const createUrl = `/create-party?mode=${mode}${field ? `&field=${encodeURIComponent(field)}` : ''}`;
  const filtered = ['q', 'date', 'maxPrice', 'access', 'position'].some(key => !!params.get(key)) || params.get('available') === '0' || params.get('sort') === 'price';
  function clearFilters() { const next = new URLSearchParams({ mode }); if (field) next.set('field', field); setParams(next); }
  function pageTo(page: number) { const next = new URLSearchParams(params); next.set('page', String(page)); setParams(next); document.getElementById('party-search-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  return <main className="party-app party-search-page">
    <div className="party-page-head"><div><span className="party-kicker">FIND YOUR TEAM</span><h1>หาตี้ที่ใช่ แล้วไปเตะกัน</h1><p>เลือกวัน งบ และสไตล์ที่อยากเล่น</p></div><Link className="party-add-button" to={createUrl} aria-label="สร้างปาร์ตี้"><Plus /></Link></div>
    <div className="party-search-nav"><span>ค้นหาปาร์ตี้</span><Link to="/my-parties">ปาร์ตี้ของฉัน <ArrowUpRight size={16} /></Link></div>
    {field && <p className="party-draft-note">กำลังค้นหาเฉพาะสนามที่เลือก · <Link to={`/team?mode=${mode}`}>ดูทุกสนาม →</Link></p>}
    <ModePicker value={mode} onChange={value => { const next = new URLSearchParams(params); next.set('mode', value); next.delete('position'); next.delete('page'); setParams(next); }} />
    <p className="party-mode-explanation">{modeInfo[mode].detail}</p>
    <form key={requestKey} className="party-search-form" onSubmit={event => {
      event.preventDefault(); const values = new FormData(event.currentTarget); const next = new URLSearchParams({ mode });
      if (field) next.set('field', field);
      for (const key of ['q', 'date', 'maxPrice', 'access', 'position', 'sort']) { const value = String(values.get(key) || '').trim(); if (value) next.set(key, value); }
      next.set('available', values.has('available') ? '1' : '0'); setParams(next);
    }}>
      <div className="party-search-bar"><label className="party-search"><Search size={19} /><input name="q" defaultValue={params.get('q') || ''} maxLength={100} placeholder="ชื่อปาร์ตี้ สนาม หรือย่าน…" aria-label="ค้นหาปาร์ตี้" /></label><button className="kh-button kh-dark" type="submit">ค้นหา</button></div>
      <details className="party-search-filters" open={filtered || undefined}><summary><SlidersHorizontal size={17} /> ตัวกรอง <small>{mode === 'fixed' ? 'วันเล่น · งบ · ตำแหน่ง' : 'วันเล่น · งบ · วิธีเข้าร่วม'}</small></summary>
        <div className="party-search-filter-grid">
          <label>วันเล่น <span className="party-search-help">เวลาไทย</span><input type="date" name="date" defaultValue={params.get('date') || ''} /></label>
          <label>งบสูงสุด / คน (บาท)<input type="number" name="maxPrice" min="0" max="100000" step="0.01" inputMode="decimal" placeholder="ไม่จำกัด" defaultValue={params.get('maxPrice') || ''} /></label>
          <label>วิธีเข้าร่วม<select name="access" defaultValue={params.get('access') || ''}><option value="">ทุกแบบ</option><option value="open">เข้าร่วมได้ทันที</option><option value="approval">หัวตี้อนุมัติก่อน</option></select></label>
          {mode === 'fixed' && <label>ตำแหน่งที่ยังว่าง<select name="position" defaultValue={params.get('position') || ''}><option value="">ทุกตำแหน่ง</option>{positions.map(item => <option key={item.code} value={item.code}>{item.name} · {item.code}</option>)}</select></label>}
          <label>เรียงรายการ<select name="sort" defaultValue={params.get('sort') || 'soon'}><option value="soon">ใกล้เริ่มก่อน</option><option value="price">ราคาต่ำก่อน</option></select></label>
        </div>
        <label className="party-search-check"><input type="checkbox" name="available" defaultChecked={params.get('available') !== '0'} />เฉพาะปาร์ตี้ที่ยังมีที่ว่าง</label>
        <div className="party-search-filter-actions"><button type="button" onClick={event => { event.currentTarget.form?.reset(); clearFilters(); }}>ล้างตัวกรอง</button><button className="kh-button kh-dark" type="submit">ใช้ตัวกรอง</button></div>
      </details>
    </form>
    <section id="party-search-results" aria-busy={loading}>
      {loading ? <p role="status" className="player-caption">กำลังค้นหาปาร์ตี้…</p> : error ? <ApiError message={error} retry={() => setReload(value => value + 1)} /> : data && <>
        <div className="party-results-heading"><h2>ปาร์ตี้{modeInfo[mode].title}</h2><span role="status">{data.total} รายการ</span></div><p className="player-caption">นัดที่ยังไม่เริ่ม{params.get('available') !== '0' ? ' · ยังมีที่ว่าง' : ''} · คำขอรออนุมัติยังไม่ถือว่าจองที่แล้ว</p>
        <div className="party-list">{data.parties.map(party => {
          const remaining = Math.max(0, party.capacity - party.participants.length);
          return <article className="party-list-card" key={party._id}>
            <div className="party-card-banner"><span className="party-pill">{modeInfo[party.mode].title}</span><span>{party.access === 'approval' ? 'หัวตี้อนุมัติก่อน' : 'เข้าร่วมได้ทันที'}</span></div>
            <div className="party-card-body"><h3>{party.party_name}</h3><p className="party-location"><MapPin size={14} />{party.field_name} · {party.address}</p>
              <p className="party-search-time"><Calendar size={16} />{new Date(party.start_datetime).toLocaleString('th-TH', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' })} · เวลาไทย</p>
              {party.mode === 'fixed' && <div className="party-card-tags">{party.required_positions.map(slot => { const free = Math.max(0, slot.amount - party.participants.filter(member => member.position === slot.position).length); return free > 0 && <span key={slot.position}>{positions.find(item => item.code === slot.position)?.name || slot.position} ว่าง {free}</span>; })}</div>}
              <Link className="player-row" to={`/players/${party.user_id}`}><span className="player-mini-avatar">{party.host_name.slice(0, 1)}</span><span><strong>{party.host_name}</strong><small>หัวตี้</small></span><span className="player-view">ดูโปรไฟล์ ↗</span></Link>
              <div className="party-card-progress" aria-hidden="true"><span style={{ width: `${party.capacity ? Math.min(100, party.participants.length / party.capacity * 100) : 0}%` }} /></div>
              <div className="party-player-info"><span><Users size={14} /> {party.participants.length}/{party.capacity} คน</span><strong>{remaining ? `ว่าง ${remaining} คน` : 'เต็มแล้ว'}</strong></div>
              <div className="party-card-bottom"><div><strong>฿{party.price.toLocaleString('th-TH')}</strong><small> / คน</small></div><Link className="kh-button kh-dark" to={`/parties/${party._id}`}>ดูปาร์ตี้ <ArrowUpRight size={16} /></Link></div>
            </div></article>;
        })}</div>
        {!data.parties.length && <div className="party-empty"><Search /><h3>{data.total ? 'หน้านี้ไม่มีรายการแล้ว' : 'ยังไม่มีตี้ตรงกับที่เลือก'}</h3><p>ลองเปลี่ยนวัน เพิ่มงบ หรือล้างตัวกรองเพื่อดูตี้อื่น</p><div className="party-search-empty-actions"><button className="kh-button kh-dark" onClick={clearFilters}>ล้างตัวกรอง</button><Link className="kh-button kh-primary" to={createUrl}>สร้างปาร์ตี้</Link></div></div>}
        {data.total > 0 && <nav className="party-search-pagination" aria-label="หน้าผลการค้นหา"><button disabled={data.page <= 1} onClick={() => pageTo(data.page - 1)} aria-label="หน้าก่อนหน้า"><ChevronLeft size={18} /></button><span>หน้า {data.page} / {Math.ceil(data.total / data.pageSize)}</span><button disabled={data.page * data.pageSize >= data.total} onClick={() => pageTo(data.page + 1)} aria-label="หน้าถัดไป"><ChevronRight size={18} /></button></nav>}
      </>}
    </section>
  </main>;
}
