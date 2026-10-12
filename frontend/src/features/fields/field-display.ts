import type { LiveField } from '@/lib/api';

export const hasFieldPrice = (field: Pick<LiveField, 'price'>) => typeof field.price === 'number' && Number.isFinite(field.price);
export const fieldPrice = (field: Pick<LiveField, 'price' | 'price_note'>) => field.price_note || (hasFieldPrice(field) ? `฿${field.price!.toLocaleString('th-TH')} / ชั่วโมง` : 'สอบถามราคากับสนาม');
export const fieldHours = (field: Pick<LiveField, 'open' | 'close' | 'hours_note'>) => field.hours_note || (field.open && field.close ? `${field.open}–${field.close}` : 'ยังไม่ทราบเวลาเปิด–ปิด');
export const fieldAddress = (field: Pick<LiveField, 'address'>) => field.address || 'ดูตำแหน่งจากแผนที่';
