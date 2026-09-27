import React, { useMemo, useState } from 'react';
import { Film, Sparkles, Target, MessageCircle, TrendingUp, Play, RefreshCw, X } from 'lucide-react';

type Project = { id:string; name:string; audience:string; offer:string; color:string };
const PROJECTS: Project[] = [
  { id:'personal', name:'Bolaji / AI Education', audience:'Nigerian creators, founders, students & job seekers', offer:'AI building + automation education', color:'from-blue-600 to-cyan-500' },
  { id:'nsos', name:'NSOS', audience:'School owners, principals & administrators', offer:'School operating system + CBT', color:'from-indigo-600 to-violet-500' },
  { id:'nsms', name:'NSMS', audience:'Neighbourhoods, estates & security teams', offer:'Incident coordination + command centre', color:'from-emerald-600 to-teal-500' },
  { id:'samura', name:'Samura Estate', audience:'Property buyers, renters & investors', offer:'Property intelligence + lead qualification', color:'from-amber-600 to-orange-500' },
  { id:'operra', name:'Operra', audience:'Founders, operators & growing businesses', offer:'Business operating system + automation', color:'from-fuchsia-600 to-pink-500' },
];

export function GrowthFactoryModal({ onClose }: { onClose:()=>void }) {
  const [projectId,setProjectId]=useState('personal');
  const [objective,setObjective]=useState('Create a 30-day short-form campaign that attracts qualified leads.');
  const [busy,setBusy]=useState(false);
  const [result,setResult]=useState<any>(null);
  const project=useMemo(()=>PROJECTS.find(p=>p.id===projectId)!,[projectId]);

  const generate=async()=>{
    setBusy(true); setResult(null);
    try {
      const r=await fetch('/api/growth/campaign',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({project,objective,platforms:['facebook','instagram','tiktok'],durationDays:30})});
      const data=await r.json();
      if(!r.ok) throw new Error(data.error||'Campaign generation failed');
      setResult(data);
    } catch(e:any) {
      setResult({error:e?.message||'Unable to generate campaign'});
    } finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
    <div className="w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
        <div><div className="flex items-center gap-2 text-white font-bold"><Film className="w-5 h-5 text-cyan-400"/> Growth Factory</div><div className="text-xs text-slate-500 mt-1">MoneyPrinterTurbo becomes the production engine. This layer connects content to leads and revenue.</div></div>
        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-800 text-slate-400"><X className="w-5 h-5"/></button>
      </div>
      <div className="grid md:grid-cols-[280px_1fr] min-h-[620px]">
        <div className="p-4 border-r border-slate-800 space-y-2 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-widest text-slate-500 mb-3">Revenue projects</div>
          {PROJECTS.map(p=><button key={p.id} onClick={()=>setProjectId(p.id)} className={`w-full text-left p-3 rounded-xl border transition ${projectId===p.id?'bg-slate-800 border-slate-600':'bg-slate-900/60 border-slate-800 hover:border-slate-700'}`}>
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center mb-2`}><Target className="w-4 h-4 text-white"/></div>
            <div className="text-sm font-semibold text-white">{p.name}</div><div className="text-[11px] text-slate-500 mt-1">{p.audience}</div>
          </button>)}
        </div>
        <div className="p-5 overflow-y-auto">
          <div className="grid md:grid-cols-3 gap-3 mb-5">
            {[['Content factory','MoneyPrinterTurbo','Video production'],['Lead engine','WhatsApp / web','Capture & qualify'],['Revenue loop','Attribution','Learn what converts']].map(([a,b,c])=><div key={a} className="rounded-xl bg-slate-900 border border-slate-800 p-3"><div className="text-[10px] uppercase tracking-widest text-slate-500">{a}</div><div className="text-sm text-white font-semibold mt-1">{b}</div><div className="text-[11px] text-emerald-400 mt-1">{c}</div></div>)}
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-white mb-3"><Sparkles className="w-4 h-4 text-amber-400"/> Campaign objective</div>
            <textarea value={objective} onChange={e=>setObjective(e.target.value)} className="w-full h-24 resize-none rounded-lg bg-slate-950 border border-slate-800 p-3 text-sm text-slate-200 outline-none focus:border-cyan-500" />
            <div className="flex flex-wrap gap-2 mt-3"><span className="px-2 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">30 days</span><span className="px-2 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">3 platforms</span><span className="px-2 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">9:16</span></div>
            <button onClick={generate} disabled={busy} className="mt-4 w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-bold flex items-center justify-center gap-2">{busy?<RefreshCw className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>}{busy?'Building campaign...':'Generate revenue campaign'}</button>
          </div>
          {result && <div className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
            {result.error ? <div className="text-red-400 text-sm">{result.error}</div> : <>
              <div className="flex items-center justify-between mb-3"><div className="font-semibold text-white">{result.campaign?.name||'Campaign ready'}</div><div className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> revenue loop ready</div></div>
              <div className="grid md:grid-cols-2 gap-3">{(result.campaign?.angles||[]).slice(0,6).map((a:any,i:number)=><div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800"><div className="text-xs text-cyan-400 font-semibold">{a.hook||a.title||`Angle ${i+1}`}</div><div className="text-[11px] text-slate-500 mt-1">{a.cta||'Drive qualified conversation'}</div></div>)}</div>
              <div className="mt-4 p-3 rounded-lg bg-emerald-950/30 border border-emerald-900/50 text-xs text-emerald-300 flex gap-2"><MessageCircle className="w-4 h-4 shrink-0"/> Next adapter: send approved scripts to MoneyPrinterTurbo, then attach a trackable campaign ID to every published asset.</div>
            </>}
          </div>}
        </div>
      </div>
    </div>
  </div>;
}
