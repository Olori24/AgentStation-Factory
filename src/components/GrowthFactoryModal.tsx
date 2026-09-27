import React, { useMemo, useState } from 'react';
import { Film, Sparkles, Target, MessageCircle, TrendingUp, Play, RefreshCw, X, ChevronRight, Users, BarChart3 } from 'lucide-react';

type Project = { id:string; name:string; audience:string; offer:string; color:string };
const PROJECTS: Project[] = [
  { id:'personal', name:'Bolaji / AI Education', audience:'Creators, founders, students & job seekers', offer:'AI building + automation education', color:'from-blue-600 to-cyan-500' },
  { id:'nsos', name:'NSOS', audience:'School owners & administrators', offer:'School operating system + CBT', color:'from-indigo-600 to-violet-500' },
  { id:'nsms', name:'NSMS', audience:'Neighbourhoods & security teams', offer:'Incident coordination + command centre', color:'from-emerald-600 to-teal-500' },
  { id:'samura', name:'Samura Estate', audience:'Property buyers, renters & investors', offer:'Property intelligence + lead qualification', color:'from-amber-600 to-orange-500' },
  { id:'operra', name:'Operra', audience:'Founders, operators & businesses', offer:'Business operating system + automation', color:'from-fuchsia-600 to-pink-500' },
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
    } catch(e:any) { setResult({error:e?.message||'Unable to generate campaign'}); }
    finally { setBusy(false); }
  };

  return <div className="fixed inset-0 z-[100] bg-slate-950/95 sm:bg-black/70 sm:backdrop-blur-sm flex items-end sm:items-center justify-center">
    <div className="w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-5xl overflow-hidden sm:rounded-3xl border-0 sm:border border-slate-700 bg-slate-950 shadow-2xl flex flex-col">
      <header className="shrink-0 flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-800 bg-slate-950/95">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-white font-bold text-base sm:text-lg"><span className="w-8 h-8 rounded-xl bg-cyan-500/15 flex items-center justify-center"><Film className="w-4 h-4 text-cyan-400"/></span><span>Growth Factory</span></div>
          <div className="hidden sm:block text-xs text-slate-500 mt-1">Turn strategy into production-ready content, then connect it to leads and revenue.</div>
        </div>
        <button onClick={onClose} aria-label="Close Growth Factory" className="p-2.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"><X className="w-5 h-5"/></button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 mb-3"><span>1</span><span className="h-px w-8 bg-slate-800"/><span>Choose a revenue project</span></div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 snap-x scrollbar-thin">
            {PROJECTS.map(p=><button key={p.id} onClick={()=>setProjectId(p.id)} className={`min-w-[210px] sm:min-w-0 sm:flex-1 snap-start text-left p-3 rounded-2xl border transition ${projectId===p.id?'bg-slate-800 border-cyan-500/50 ring-1 ring-cyan-500/20':'bg-slate-900/70 border-slate-800 hover:border-slate-700'}`}>
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${p.color} flex items-center justify-center mb-2`}><Target className="w-4 h-4 text-white"/></div>
              <div className="text-sm font-semibold text-white truncate">{p.name}</div>
              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.audience}</div>
            </button>)}
          </div>
        </div>

        <div className="px-4 sm:px-6 py-4 sm:py-5 grid lg:grid-cols-[1.15fr_.85fr] gap-4">
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div><div className="text-sm font-semibold text-white flex items-center gap-2"><Sparkles className="w-4 h-4 text-amber-400"/> Campaign objective</div><p className="text-[11px] text-slate-500 mt-1">Tell the factory what outcome you want.</p></div>
              <span className="hidden sm:block px-2 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">30 days</span>
            </div>
            <textarea value={objective} onChange={e=>setObjective(e.target.value)} className="w-full min-h-32 sm:min-h-36 resize-y rounded-xl bg-slate-950 border border-slate-800 p-3.5 text-sm leading-6 text-slate-200 outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/10" placeholder="e.g. Generate qualified school-owner leads for NSOS CBT..." />
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">Facebook</span><span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">Instagram</span><span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] text-slate-400">TikTok</span><span className="px-2.5 py-1 rounded-full bg-slate-800 text-[10px] text-cyan-300">9:16 video</span>
            </div>
            <button onClick={generate} disabled={busy || !objective.trim()} className="mt-5 w-full py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 disabled:opacity-50 text-slate-950 text-sm font-extrabold flex items-center justify-center gap-2 transition">{busy?<RefreshCw className="w-4 h-4 animate-spin"/>:<Play className="w-4 h-4"/>}{busy?'Building campaign...':'Generate campaign'}<ChevronRight className="w-4 h-4"/></button>
          </section>

          <section className="grid grid-cols-3 lg:grid-cols-1 gap-2.5">
            {[
              [Film,'Content factory','MoneyPrinterTurbo','Production'],
              [Users,'Lead engine','WhatsApp / web','Capture + qualify'],
              [BarChart3,'Revenue loop','Attribution','Measure + learn'],
            ].map(([Icon,title,main,sub]:any)=><div key={title} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-3 sm:p-4">
              <Icon className="w-4 h-4 text-cyan-400 mb-2"/><div className="text-[9px] uppercase tracking-wider text-slate-500">{title}</div><div className="text-xs sm:text-sm text-white font-semibold mt-1 truncate">{main}</div><div className="text-[10px] text-emerald-400 mt-1">{sub}</div>
            </div>)}
          </section>
        </div>

        {result && <section className="mx-4 sm:mx-6 mb-5 rounded-2xl border border-slate-800 bg-slate-900 p-4 sm:p-5">
          {result.error ? <div className="text-red-400 text-sm">{result.error}</div> : <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3"><div className="font-semibold text-white">{result.campaign?.name||'Campaign ready'}</div><div className="text-xs text-emerald-400 flex items-center gap-1"><TrendingUp className="w-3 h-3"/> Revenue loop ready</div></div>
            <div className="grid sm:grid-cols-2 gap-2.5">{(result.campaign?.angles||[]).slice(0,6).map((a:any,i:number)=><div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800"><div className="text-xs text-cyan-400 font-semibold leading-5">{a.hook||a.title||`Angle ${i+1}`}</div><div className="text-[11px] text-slate-500 mt-1">{a.cta||'Drive qualified conversation'}</div></div>)}</div>
            <div className="mt-4 p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/50 text-xs leading-5 text-emerald-300 flex gap-2"><MessageCircle className="w-4 h-4 shrink-0 mt-0.5"/> Approved scripts can be sent to MoneyPrinterTurbo with a trackable campaign ID.</div>
          </>}
        </section>}
      </div>
    </div>
  </div>;
}
