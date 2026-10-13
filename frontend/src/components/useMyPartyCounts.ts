import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from '@/lib/api';

export type MyPartyCounts = { host: number; joined: number; requested: number };

/**
 * Upcoming-party counts for the signed-in user (null when signed out or on error).
 * `host` and `joined` never overlap (the API excludes own parties from `joined`),
 * so host + joined is the number of upcoming games the user is part of.
 */
export default function useMyPartyCounts() {
  const { pathname } = useLocation();
  const [counts, setCounts] = useState<MyPartyCounts | null>(null);
  useEffect(() => {
    let active = true;
    const load = () => {
      if (!localStorage.getItem('token')) { setCounts(null); return; }
      api<{ counts: MyPartyCounts }>('/api/v2/my-parties?scope=joined&page=1')
        .then(data => { if (active) setCounts(data.counts); })
        .catch(() => { if (active) setCounts(null); });
    };
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    load();
    document.addEventListener('visibilitychange', onVisible);
    return () => { active = false; document.removeEventListener('visibilitychange', onVisible); };
  }, [pathname]);
  return counts;
}

export const upcomingTotal = (counts: MyPartyCounts | null) => (counts ? counts.host + counts.joined : 0);
