import React, { useState } from 'react';
import {
  Send,
  Mail,
  User,
  Building,
  Copy,
  Check,
  Download,
  Clock,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { OutreachCampaign, OutreachEmail } from '../types';

interface OutreachCampaignViewerProps {
  campaign?: OutreachCampaign;
}

export const OutreachCampaignViewer: React.FC<OutreachCampaignViewerProps> = ({ campaign }) => {
  const [selectedEmailIndex, setSelectedEmailIndex] = useState<number>(0);
  const [copied, setCopied] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [activeStepTab, setActiveStepTab] = useState<number>(1); // 1 = initial, 2 = follow-up 1, 3 = soft close

  if (!campaign || !campaign.emails || campaign.emails.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950">
        <Send className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">No Outreach Campaign Prepared</h3>
        <p className="text-xs text-slate-500 max-w-md">
          When an objective includes personalized outreach, cold email copywriting, or campaign preparation, AgentStation's Outreach Specialist (Sterling) crafts a complete multi-touch sequence here.
        </p>
      </div>
    );
  }

  const currentEmail: OutreachEmail = campaign.emails[selectedEmailIndex] || campaign.emails[0];

  const handleCopy = () => {
    const fullText = `Subject: ${currentEmail.subject}\n\n${currentEmail.body}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportCampaign = () => {
    const jsonStr = JSON.stringify(campaign, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${campaign.campaignName.toLowerCase().replace(/\s+/g, '_')}_campaign.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSendTest = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-text">
      {/* Campaign Header & Strategy Overview */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800/90 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                <Send className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{campaign.campaignName}</h2>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-mono font-semibold">
                {campaign.totalContacts} Decision Makers Targeted
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl line-clamp-1">
              <span className="text-slate-500">Audience:</span> {campaign.targetAudience} • <span className="text-slate-500">Strategy:</span> {campaign.strategy}
            </p>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              title="Copy active email to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Email'}</span>
            </button>

            <button
              onClick={handleExportCampaign}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              title="Download all emails as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export All</span>
            </button>

            <button
              onClick={handleSendTest}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-slate-950 font-bold text-xs shadow-md shadow-orange-600/20 transition"
              title="Simulate test dispatch"
            >
              {testSent ? <Check className="w-3.5 h-3.5 text-slate-950" /> : <Send className="w-3.5 h-3.5" />}
              <span>{testSent ? 'Test Dispatched' : 'Send Test'}</span>
            </button>
          </div>
        </div>

        {/* 3-Step Follow-Up Cadence Bar */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60">
          <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-500" />
            Cadence:
          </span>
          {campaign.cadenceSteps?.map((step, idx) => (
            <button
              key={idx}
              onClick={() => setActiveStepTab(step.day)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition ${
                activeStepTab === step.day
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40 font-semibold'
                  : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span className="text-orange-400">Day {step.day}:</span>
              <span>{step.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area: Left Lead List Rail & Right Email Preview */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left: Lead Directory Rail */}
        <div className="w-72 sm:w-80 bg-slate-900/40 border-r border-slate-800/80 flex flex-col shrink-0 overflow-hidden">
          <div className="p-2.5 bg-slate-900/80 border-b border-slate-800/60 text-xs font-mono text-slate-400 flex items-center justify-between">
            <span>Decision Makers ({campaign.emails.length})</span>
            <span className="text-[10px] text-orange-400">Personalized</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 scrollbar-thin">
            {campaign.emails.map((email, idx) => {
              const isSelected = selectedEmailIndex === idx;
              return (
                <button
                  key={email.id || idx}
                  onClick={() => setSelectedEmailIndex(idx)}
                  className={`w-full text-left p-3 transition flex flex-col gap-1 ${
                    isSelected
                      ? 'bg-orange-500/10 border-l-2 border-orange-400 text-white'
                      : 'hover:bg-slate-850/60 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-100 flex items-center gap-1.5 truncate">
                      <User className="w-3 h-3 text-cyan-400 shrink-0" />
                      {email.recipientName}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0">#{idx + 1}</span>
                  </div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate font-mono">
                    <Building className="w-2.5 h-2.5 text-slate-500 shrink-0" />
                    <span className="truncate">{email.company}</span>
                  </div>

                  <div className="text-[10px] text-slate-500 truncate">
                    {email.recipientRole}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Active Personalized Email Preview */}
        <div className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto scrollbar-thin bg-slate-950 flex flex-col">
          <div className="max-w-3xl mx-auto w-full space-y-4">
            {/* Email Metadata Card */}
            <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 font-sans text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-medium">
                    Verified Direct Contact
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Cadence: {currentEmail.followUpCadence || 'Day 1 — Initial Partnership Hook'}
                  </span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  Status: Ready to Dispatch
                </span>
              </div>

              {/* To / Company Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase">To:</span>
                  <div className="text-slate-200 font-medium">
                    {currentEmail.recipientName} ({currentEmail.recipientRole})
                  </div>
                  <div className="text-orange-400 font-mono text-[11px]">{currentEmail.email}</div>
                </div>

                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Organization:</span>
                  <div className="text-slate-200 font-medium">{currentEmail.company}</div>
                  <div className="text-slate-400 text-[11px]">Commercial & Luxury Real Estate</div>
                </div>
              </div>

              {/* Subject Line */}
              <div className="pt-2 border-t border-slate-800">
                <span className="text-slate-500 font-mono text-[10px] uppercase block mb-1">Subject Line:</span>
                <div className="text-white font-semibold text-sm bg-slate-950 p-2.5 rounded-lg border border-slate-800 font-sans select-all">
                  {currentEmail.subject}
                </div>
              </div>
            </div>

            {/* Email Body Preview Container */}
            <div className="rounded-xl bg-slate-900/60 border border-slate-800/80 p-5 font-sans space-y-4 select-all shadow-inner">
              <div className="text-xs text-slate-400 font-mono uppercase tracking-wider pb-2 border-b border-slate-800 flex items-center justify-between">
                <span>Personalized Email Body</span>
                <span className="text-[10px] text-teal-400">Dynamic Tokens Injected</span>
              </div>

              <div className="text-sm leading-relaxed text-slate-200 space-y-3 whitespace-pre-line font-sans">
                {currentEmail.body}
              </div>

              {/* Call to action badge */}
              {currentEmail.callToAction && (
                <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-400 shrink-0" />
                    <span><strong>Call To Action:</strong> {currentEmail.callToAction}</span>
                  </div>
                  <button
                    onClick={handleCopy}
                    className="text-[11px] font-mono text-orange-300 hover:text-white underline"
                  >
                    Copy
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
