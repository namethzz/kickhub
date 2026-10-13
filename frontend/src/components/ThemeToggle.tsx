import { useEffect, useState } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { readChoice, saveChoice, watchTheme } from '@/lib/theme';

type Choice = 'light' | 'dark' | 'system';
const currentTheme = () => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function useTheme() {
  const [state, setState] = useState<{ choice: Choice; theme: 'light' | 'dark' }>(() => ({ choice: readChoice() as Choice, theme: currentTheme() }));
  useEffect(() => watchTheme((choice: Choice, theme: 'light' | 'dark') => setState({ choice, theme })), []);
  return state;
}

/** Icon button for the header: flips between light and dark. */
export default function ThemeToggle() {
  const { theme } = useTheme();
  const dark = theme === 'dark';
  return <button type="button" className="kh-theme-toggle" role="switch" aria-checked={dark} aria-label="โหมดมืด" title={dark ? 'เปลี่ยนเป็นโหมดสว่าง' : 'เปลี่ยนเป็นโหมดมืด'} onClick={() => saveChoice(dark ? 'light' : 'dark')}>
    {dark ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
  </button>;
}

const options: { value: Choice; label: string; icon: typeof Sun }[] = [
  { value: 'system', label: 'ตามระบบ', icon: Monitor },
  { value: 'light', label: 'สว่าง', icon: Sun },
  { value: 'dark', label: 'มืด', icon: Moon },
];

/** Three-way choice for the profile page, including "follow my device". */
export function ThemeChoice() {
  const { choice } = useTheme();
  return <fieldset className="kh-theme-choice"><legend>ธีมของเว็บ</legend>
    <div role="radiogroup" aria-label="ธีมของเว็บ">{options.map(({ value, label, icon: Icon }) => <button key={value} type="button" role="radio" aria-checked={choice === value} onClick={() => saveChoice(value)}><Icon size={16} aria-hidden="true" />{label}</button>)}</div>
  </fieldset>;
}
