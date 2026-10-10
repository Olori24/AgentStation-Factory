import React, { useMemo, useState } from 'react';
import { X, Copy, Check, WandSparkles, Palette, Code2, Bookmark, BookmarkCheck, Download, RotateCcw } from 'lucide-react';

type GradientPreset = {
  id: string;
  name: string;
  category: string;
  description: string;
  colors: [string, string, string];
  angle: number;
  speed: number;
};

const PRESETS: GradientPreset[] = [
  { id: 'aurora', name: 'Neon Aurora', category: 'AI / SaaS', description: 'Cinematic violet and cyan atmosphere for AI products.', colors: ['#7657ff', '#48e7ff', '#101b48'], angle: 135, speed: 16 },
  { id: 'prism', name: 'Liquid Prism', category: 'Premium UI', description: 'Iridescent light for polished product showcases.', colors: ['#a78bfa', '#e0f2fe', '#37304f'], angle: 145, speed: 20 },
  { id: 'emerald', name: 'Emerald Reserve', category: 'Real estate / Fintech', description: 'Deep green and champagne for high-trust brands.', colors: ['#087f62', '#d8bc83', '#062c24'], angle: 125, speed: 18 },
  { id: 'solar', name: 'Solar Flare', category: 'Campaigns', description: 'Amber light and warm contrast for launches.', colors: ['#ff6a25', '#ffc36a', '#6f2416'], angle: 135, speed: 14 },
  { id: 'arctic', name: 'Arctic Signal', category: 'Security / Technology', description: 'Cool blue precision for security and analytics.', colors: ['#2878ff', '#7ceaff', '#162d5b'], angle: 140, speed: 22 },
  { id: 'ocean', name: 'Ocean Intelligence', category: 'Analytics', description: 'Teal depth and calm illumination for dashboards.', colors: ['#0f766e', '#38bdf8', '#082f49'], angle: 120, speed: 24 },
  { id: 'rose', name: 'Rose Quartz', category: 'Creator / Portfolio', description: 'Soft coral, peach and plum for editorial experiences.', colors: ['#fb7185', '#fdba74', '#4c1d45'], angle: 150, speed: 20 },
  { id: 'gold', name: 'Solar Gold', category: 'Education / Premium', description: 'Indigo and gold for learning and opportunity.', colors: ['#fbbf24', '#f59e0b', '#312e81'], angle: 130, speed: 17 },
];

type StudioTab = 'presets' | 'prompt' | 'css';

export const GradientStudio: React.FC<{ onClose: () => void; onToast?: (message: string) => void }> = ({ onClose, onToast }) => {
  const [activeId, setActiveId] = useState('aurora');
  const [colors, setColors] = useState<[string, string, string]>(PRESETS[0].colors);
  const [angle, setAngle] = useState(PRESETS[0].angle);
  const [speed, setSpeed] = useState(PRESETS[0].speed);
  const [tab, setTab] = useState<StudioTab>('presets');
  const [copied, setCopied] = useState('');
  const [saved, setSaved] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('agentstation_gradient_favorites_v1') || '[]'); }
    catch { return []; }
  });
  const [query, setQuery] = useState('');

  const css = useMemo(() => `.gradient-studio-background {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background:
    radial-gradient(ellipse at 18% 20%, ${colors[0]}88 0%, transparent 48%),
    radial-gradient(ellipse at 82% 72%, ${colors[1]}66 0%, transparent 46%),
    linear-gradient(${angle}deg, #050711 0%, ${colors[2]} 100%);
  background-size: 140% 140%;
  animation: gradient-studio-drift ${speed}s ease-in-out infinite alternate;
}
@keyframes gradient-studio-drift {
  from { background-position: 0% 0%; }
  to { background-position: 100% 100%; }
}
@media (prefers-reduced-motion: reduce) {
  .gradient-studio-background { animation: none; }
}`, [colors, angle, speed]);

  const prompt = useMemo(() => {
    const preset = PRESETS.find((item) => item.id === activeId);
    return `Create an original premium ${preset?.name || 'custom gradient'} background for a ${preset?.category || 'digital product'} experience. Use ${colors.join(', ')} as the core palette with a ${angle}-degree composition. Blend layered radial light fields into a deep atmospheric base; create a sense of depth through restrained bloom and soft transitions. Animation speed: ${speed} seconds per drift cycle. Keep headline and CTA zones readable, avoid excessive saturation and distracting particles, optimise for mobile performance, and respect prefers-reduced-motion. Deliver reusable production-ready React and CSS with an accessible static fallback.`;
  }, [activeId, colors, angle, speed]);

  const filtered = PRESETS.filter((preset) => (preset.name + ' ' + preset.category).toLowerCase().includes(query.toLowerCase()));

  const applyPreset = (preset: GradientPreset) => {
    setActiveId(preset.id);
    setColors([...preset.colors]);
    setAngle(preset.angle);
    setSpeed(preset.speed);
  };

  const notifyCopy = async (kind: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      window.setTimeout(() => setCopied(''), 1600);
      onToast?.(`${kind === 'css' ? 'CSS' : kind === 'prompt' ? 'Prompt' : 'Gradient'} copied to clipboard.`);
    } catch {
      onToast?.('Clipboard access unavailable. Select and copy the content manually.');
    }
  };

  const toggleSaved = () => {
    const next = saved.includes(activeId) ? saved.filter((id) => id !== activeId) : [...saved, activeId];
    setSaved(next);
    try { localStorage.setItem('agentstation_gradient_favorites_v1', JSON.stringify(next)); } catch {}
    onToast?.(next.includes(activeId) ? 'Gradient saved to favorites.' : 'Gradient removed from favorites.');
  };

  const exportCss = () => {
    const blob = new Blob([css], { type: 'text/css;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'agentstation-gradient.css';
    link.click();
    URL.revokeObjectURL(url);
  };

  const previewStyle: React.CSSProperties = {
    background: `radial-gradient(ellipse at 18% 20%, ${colors[0]}99 0%, transparent 52%), radial-gradient(ellipse at 82% 72%, ${colors[1]}88 0%, transparent 50%), linear-gradient(${angle}deg, #050711 0%, ${colors[2]} 100%)`,
    backgroundSize: '140% 140%',
    animationDuration: `${speed}s`,
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 p-2 sm:p-5 backdrop-blur-md" role="dialog" aria-modal="true" aria-labelledby="gradient-studio-title">
      <div className="gradient-studio-shell flex max-h-[96dvh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl border border-slate-700/80 bg-[#070b12] shadow-2xl shadow-black/60">
        <header className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/25 bg-violet-500/10 text-violet-300"><Palette className="h-5 w-5" /></div>
            <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.24em] text-violet-300">AgentStation / Creative Tools</p><h2 id="gradient-studio-title" className="truncate text-lg font-bold text-white sm:text-xl">Gradient Studio <span className="ml-1 rounded-md border border-emerald-400/20 bg-emerald-400/10 px-1.5 py-0.5 align-middle text-[9px] font-semibold uppercase tracking-wider text-emerald-300">Free vault</span></h2></div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close Gradient Studio" className="rounded-xl border border-white/10 p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X className="h-5 w-5" /></button>
        </header>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,.8fr)] lg:overflow-hidden">
          <section className="flex min-h-0 flex-col border-b border-white/10 p-3 sm:p-5 lg:overflow-y-auto lg:border-b-0 lg:border-r">
            <div className="relative flex min-h-[250px] flex-col justify-between overflow-hidden rounded-2xl border border-white/15 p-5 sm:min-h-[330px] sm:p-8">
              <div className="gradient-studio-preview absolute inset-0" style={previewStyle} />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,.09),transparent_35%,rgba(0,0,0,.28))]" />
              <div className="relative z-10 flex items-center justify-between gap-3"><span className="rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[.2em] text-white/80 backdrop-blur">Live preview</span><span className="font-mono text-[10px] text-white/65">{angle}° / {speed}s</span></div>
              <div className="relative z-10 max-w-xl"><p className="mb-3 text-[10px] font-semibold uppercase tracking-[.25em] text-white/75">AgentStation gradient system</p><h3 className="text-3xl font-semibold leading-tight tracking-tight text-white drop-shadow-lg sm:text-5xl">Design with<br/><span className="text-white/70">atmosphere.</span></h3><p className="mt-4 max-w-sm text-sm leading-6 text-white/75">Original gradient recipes. Ready for production. Yours to adapt.</p><div className="mt-6 flex flex-wrap gap-2"><span className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium text-white backdrop-blur">Accessible motion</span><span className="rounded-lg border border-white/20 bg-black/20 px-3 py-2 text-xs font-medium text-white backdrop-blur">CSS export</span></div></div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm font-semibold text-white">{PRESETS.find((item) => item.id === activeId)?.name || 'Custom gradient'}</p><p className="mt-0.5 text-xs text-slate-400">{PRESETS.find((item) => item.id === activeId)?.description || 'Custom gradient recipe'}</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={toggleSaved} className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/10 px-3 text-xs font-semibold text-slate-200 hover:bg-white/5">{saved.includes(activeId) ? <BookmarkCheck className="h-4 w-4 text-amber-300"/> : <Bookmark className="h-4 w-4"/>}{saved.includes(activeId) ? 'Saved' : 'Save preset'}</button>
                <button type="button" onClick={() => void notifyCopy('css', css)} className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-white px-3 text-xs font-bold text-slate-950 hover:bg-slate-200">{copied === 'css' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}Copy CSS</button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {colors.map((color, index) => <label key={index} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[.025] p-3"><input aria-label={`Gradient color ${index + 1}`} type="color" value={color} onChange={(event) => { const next = [...colors] as [string, string, string]; next[index] = event.target.value; setColors(next); setActiveId('custom'); }} className="h-9 w-9 cursor-pointer rounded-lg border-0 bg-transparent p-0" /><span className="min-w-0"><span className="block text-[10px] uppercase tracking-wider text-slate-500">Color {index + 1}</span><span className="font-mono text-xs text-slate-200">{color.toUpperCase()}</span></span></label>)}
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 rounded-xl border border-white/10 bg-white/[.025] p-4 sm:grid-cols-2">
              <label className="block"><span className="flex justify-between text-xs font-medium text-slate-300">Gradient angle <span className="font-mono text-violet-300">{angle}°</span></span><input aria-label="Gradient angle" type="range" min="0" max="360" value={angle} onChange={(event) => { setAngle(Number(event.target.value)); setActiveId('custom'); }} className="mt-3 w-full accent-violet-400"/></label>
              <label className="block"><span className="flex justify-between text-xs font-medium text-slate-300">Motion cycle <span className="font-mono text-cyan-300">{speed}s</span></span><input aria-label="Animation speed" type="range" min="8" max="36" value={speed} onChange={(event) => { setSpeed(Number(event.target.value)); setActiveId('custom'); }} className="mt-3 w-full accent-cyan-400"/></label>
            </div>
          </section>

          <section className="flex min-h-0 flex-col p-3 sm:p-5 lg:overflow-y-auto">
            <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-black/20 p-1">
              {([{id:'presets',label:'Presets'},{id:'prompt',label:'AI Prompt'},{id:'css',label:'CSS Code'}] as {id:StudioTab;label:string}[]).map((item) => <button key={item.id} type="button" onClick={() => setTab(item.id)} className={`min-h-10 flex-1 rounded-lg px-2 text-xs font-semibold transition ${tab === item.id ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-white'}`}>{item.label}</button>)}
            </div>

            {tab === 'presets' && <div className="mt-4 flex min-h-0 flex-col gap-3">
              <label className="relative block"><span className="sr-only">Search gradient presets</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search 8 original presets..." className="w-full rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-violet-400/60"/></label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                {filtered.map((preset) => <button key={preset.id} type="button" onClick={() => applyPreset(preset)} aria-pressed={activeId === preset.id} className={`rounded-xl border p-2.5 text-left transition hover:border-white/25 ${activeId === preset.id ? 'border-violet-400/60 bg-violet-400/[.07]' : 'border-white/10 bg-white/[.02]'}`}>
                  <span className="mb-2 block h-14 overflow-hidden rounded-lg" style={{background:`radial-gradient(ellipse at 20% 20%, ${preset.colors[0]}, transparent 60%), radial-gradient(ellipse at 80% 80%, ${preset.colors[1]}, transparent 58%), linear-gradient(${preset.angle}deg,#050711,${preset.colors[2]})`}}/>
                  <span className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-white">{preset.name}</span>{saved.includes(preset.id) && <BookmarkCheck className="h-3.5 w-3.5 text-amber-300"/>}</span><span className="mt-1 block text-[10px] text-slate-500">{preset.category}</span>
                </button>)}
              </div>
              {filtered.length === 0 && <p className="rounded-xl border border-dashed border-white/10 p-4 text-sm text-slate-400">No presets match that search.</p>}
            </div>}

            {tab === 'prompt' && <div className="mt-4 flex min-h-0 flex-col gap-3"><div className="flex items-center gap-2 text-xs text-violet-300"><WandSparkles className="h-4 w-4"/>Original AI-builder prompt</div><textarea readOnly value={prompt} className="min-h-[260px] w-full flex-1 resize-y rounded-xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-200 outline-none sm:min-h-[340px]"/><button type="button" onClick={() => void notifyCopy('prompt', prompt)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 text-sm font-bold text-white hover:bg-violet-400">{copied === 'prompt' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}Copy AI prompt</button></div>}

            {tab === 'css' && <div className="mt-4 flex min-h-0 flex-col gap-3"><div className="flex items-center gap-2 text-xs text-cyan-300"><Code2 className="h-4 w-4"/>Framework-free CSS export</div><textarea readOnly value={css} className="min-h-[260px] w-full flex-1 resize-y rounded-xl border border-white/10 bg-black/30 p-4 font-mono text-xs leading-5 text-slate-200 outline-none sm:min-h-[340px]"/><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => void notifyCopy('css', css)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-cyan-400 px-3 text-sm font-bold text-slate-950 hover:bg-cyan-300">{copied === 'css' ? <Check className="h-4 w-4"/> : <Copy className="h-4 w-4"/>}Copy CSS</button><button type="button" onClick={exportCss} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-white/10 px-3 text-sm font-semibold text-slate-200 hover:bg-white/5"><Download className="h-4 w-4"/>Download .css</button></div></div>}

            <div className="mt-auto pt-5"><div className="rounded-xl border border-emerald-400/15 bg-emerald-400/[.04] p-3"><p className="text-xs font-semibold text-emerald-300">Built for real projects</p><p className="mt-1 text-[11px] leading-5 text-slate-400">No API key, subscription, WebGL dependency or third-party prompt extraction. Preset favorites stay in this browser.</p></div><button type="button" onClick={() => { applyPreset(PRESETS[0]); setTab('presets'); setQuery(''); }} className="mt-3 inline-flex min-h-10 items-center gap-2 text-xs text-slate-500 hover:text-slate-200"><RotateCcw className="h-3.5 w-3.5"/>Reset studio</button></div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default GradientStudio;
