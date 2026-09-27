import React, { useEffect, useMemo, useState } from 'react';
import { Activity, Bot, Clock3, Pause, Play, Plus, RefreshCw, ShieldCheck, Trash2, X, Zap } from 'lucide-react';

type Goal = {
  id: string; name: string; objective: string; intervalMinutes: number; status: 'active'|'paused'|'completed'|'failed';
  autoApproveSafeTools: boolean; provider?: 'gemini'|'ollama'; model?: string; nextRunAt: string; lastRunAt?: string;
  lastMissionId?: string; consecutiveFailures: number;
};

type Runtime = { enabled: boolean; running: boolean; goals: number; activeMissions: number; maxConcurrency: number; tickMs: number };

export function AutonomyCommandCenter({ isOpen, onClose, onToast }: { isOpen: boolean; onClose: () => void; onToast?: (msg:string)=>void }) {
  const [goals,setGoals]=useState<Goal[]>([]);
  const [runtime,setRuntime]=useState<Runtime|null>(null);
  const [loading,setLoading]=useState(false);
  const [draft,setDraft]=useState({name:'',objective:'',intervalMinutes:60,autoApproveSafeTools:false});
  const load=async()=>{try{const [g,s]=await Promise.all([fetch('/api/autonomy/goals'),fetch('/api/autonomy/status')]);const gd=await g.json(),sd=await s.json();if(gd.success)setGoals(gd.goals||[]);if(sd.success)setRuntime(sd);}catch{}};
  useEffect(()=>{if(!isOpen)return;load();const t=setInterval(load,10000);return()=>clearInterval(t)},[isOpen]);
  const active=useMemo(()=>goals.filter(g=>g.status==='active').length,[goals]);
  const create=async()=>{if(!draft.name.trim()||!draft.objective.trim())return;setLoading(true);try{const r=await fetch('/api/autonomy/goals',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(draft)});const d=await r.json();if(d.success){setGoals(g=>[d.goal,...g]);setDraft({name:'',objective:'',intervalMinutes:60,autoApproveSafeTools:false});onToast?.('Autonomous goal created.');}}finally{setLoading(false)}};
  const patch=async(id:string,status:'active'|'paused')=>{const r=await fetch('/api/autonomy/goals/'+id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({status})});const d=await r.json();if(d.success)setGoals(g=>g.map(x=>x.id===id?d.goal:x));};
  const remove=async(id:string)=>{await fetch('/api/autonomy/goals/'+id,{method:'DELETE'});setGoals(g=>g.filter(x=>x.id!==id));};
  if(!isOpen)return null;
  return <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end lg:items-center justify-center p-0 lg:p-6">
    <div className="w-full lg:max-w-5xl h-[94vh] lg:h-[88vh] rounded-t-3xl lg:rounded-3xl border border-slate-700 bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
      <header className="px-4 lg:px-6 py-4 border-b border-slate-800 flex items-center justify-between shrink-0">
        <div><div className="flex items-center gap-2"><div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400"><Zap className="w-4 h-4"/></div><div><h2 className="font-bold text-white">Autonomy Command Center</h2><p className="text-[11px] text-slate-500">24/7 goals, missions and intervention controls</p></div></div></div>
        <div className="flex items-center gap-2"><button onClick={load} className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"><RefreshCw className="w-4 h-4"/></button><button onClick={onClose} className="p-2 rounded-xl border border-slate-800 text-slate-400 hover:text-white"><X className="w-4 h-4"/></button></div>
      </header>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 p-3 lg:p-5 border-b border-slate-800">
        {[
          ['Runtime',runtime?.running?'ONLINE':'OFFLINE',runtime?.running?'emerald':'amber',Activity],
          ['Active goals',String(active),'blue',Bot],
          ['Running missions',String(runtime?.activeMissions??0),'cyan',Zap],
          ['Capacity',runtime?runtime.activeMissions+'/'+runtime.maxConcurrency:'—','violet',ShieldCheck]
        ].map(([label,value,tone,Icon]:any)=><div key={label} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3"><div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-slate-500"><Icon className="w-3.5 h-3.5"/>{label}</div><div className={'mt-1 text-sm font-bold text-'+tone+'-400'}>{value}</div></div>)}
      </div>
      <div className="flex-1 overflow-y-auto p-3 lg:p-5 space-y-5">
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <div className="flex items-center gap-2 mb-3"><Plus className="w-4 h-4 text-emerald-400"/><h3 className="text-sm font-bold">Create autonomous objective</h3></div>
          <div className="grid lg:grid-cols-[1fr_2fr_120px] gap-2">
            <input value={draft.name} onChange={e=>setDraft({...draft,name:e.target.value})} placeholder="Goal name" className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/>
            <input value={draft.objective} onChange={e=>setDraft({...draft,objective:e.target.value})} placeholder="What should AgentStation keep doing?" className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm outline-none focus:border-emerald-500"/>
            <select value={draft.intervalMinutes} onChange={e=>setDraft({...draft,intervalMinutes:Number(e.target.value)})} className="rounded-xl bg-slate-950 border border-slate-800 px-3 py-2.5 text-sm"><option value={15}>Every 15m</option><option value={30}>Every 30m</option><option value={60}>Hourly</option><option value={360}>Every 6h</option><option value={1440}>Daily</option></select>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-400"><input type="checkbox" checked={draft.autoApproveSafeTools} onChange={e=>setDraft({...draft,autoApproveSafeTools:e.target.checked})}/><span>Auto-approve governed safe tools</span></label>
            <button disabled={loading} onClick={create} className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold disabled:opacity-50">Start autonomous loop</button>
          </div>
        </section>
        <section className="space-y-2">
          <div className="flex items-center justify-between"><h3 className="text-sm font-bold">Autonomous workforce</h3><span className="text-[10px] text-slate-500">{goals.length} goals</span></div>
          {goals.length===0?<div className="rounded-2xl border border-dashed border-slate-800 p-8 text-center text-sm text-slate-500">No autonomous objectives yet.</div>:goals.map(g=><article key={g.id} className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
            <div className="flex items-start gap-3"><div className={'mt-1 w-2 h-2 rounded-full '+(g.status==='active'?'bg-emerald-400 animate-pulse':g.status==='failed'?'bg-red-400':'bg-slate-600')}/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-semibold text-white">{g.name}</h4><span className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-full bg-slate-800 text-slate-400">{g.status}</span>{g.autoApproveSafeTools&&<span className="text-[9px] px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">safe auto-approve</span>}</div><p className="mt-1 text-xs text-slate-400">{g.objective}</p><div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500"><span className="flex items-center gap-1"><Clock3 className="w-3 h-3"/>Every {g.intervalMinutes}m</span><span>Next {new Date(g.nextRunAt).toLocaleString()}</span><span>Failures {g.consecutiveFailures}</span></div></div><div className="flex items-center gap-1">{g.status==='active'?<button onClick={()=>patch(g.id,'paused')} title="Pause" className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-amber-300"><Pause className="w-3.5 h-3.5"/></button>:<button onClick={()=>patch(g.id,'active')} title="Resume" className="p-2 rounded-lg border border-slate-800 text-slate-400 hover:text-emerald-300"><Play className="w-3.5 h-3.5"/></button>}<button onClick={()=>remove(g.id)} title="Delete" className="p-2 rounded-lg border border-slate-800 text-slate-500 hover:text-red-300"><Trash2 className="w-3.5 h-3.5"/></button></div></div>
          </article>)}
        </section>
      </div>
    </div>
  </div>;
}
