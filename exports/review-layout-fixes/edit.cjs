const fs=require('fs');
function edit(p,fn){fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('lib/dailyRc/useReview.js',s=>s.replace('import { supabase }', 'import { fetchWithTimeout, withTimeout } from "@/lib/mobile/request"\nimport { supabase }').replace('await supabase.auth.getSession()', 'await withTimeout(supabase.auth.getSession())').replace('if (!session) throw', 'if (controller.signal.aborted) return\n        if (!session) throw').replace('await fetch(`/api/', 'await fetchWithTimeout(`/api/').replace('await response.json()', 'await withTimeout(response.json())'));
edit('tests/daily-rc-review.test.mjs',s=>s.replace('fetchWithTimeout:()=>{}','fetchWithTimeout:(...args)=>globals.fetch(...args)'));
edit('app/daily-challenge/test/page.jsx',s=>s.replace('Suspense, useEffect, useMemo','Suspense, useEffect, useLayoutEffect, useMemo').replace('  function changePane(next){paneScroll.current[pane]=window.scrollY;setPane(next);requestAnimationFrame(()=>window.scrollTo(0,paneScroll.current[next]));}',`  const restorePaneScroll = useRef(false);
  useLayoutEffect(() => {
    if (restorePaneScroll.current) {
      window.scrollTo(0, paneScroll.current[pane]);
      restorePaneScroll.current = false;
    }
  }, [pane]);
  function changePane(next) {
    if (next === pane) return;
    paneScroll.current[pane] = window.scrollY;
    restorePaneScroll.current = true;
    setPane(next);
  }`));
