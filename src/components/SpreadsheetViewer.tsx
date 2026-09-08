import React, { useState, useMemo } from 'react';
import {
  Download,
  Search,
  Filter,
  ArrowUpDown,
  Copy,
  Check,
  Table,
  ExternalLink,
  Mail,
  Phone,
  Building,
  User,
  MapPin,
  Sparkles,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { SpreadsheetDataset, SpreadsheetColumn } from '../types';

interface SpreadsheetViewerProps {
  dataset?: SpreadsheetDataset;
  title?: string;
}

export const SpreadsheetViewer: React.FC<SpreadsheetViewerProps> = ({
  dataset,
  title = 'Normalized Dataset',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRow, setSelectedRow] = useState<Record<string, any> | null>(null);
  const [copied, setCopied] = useState(false);

  if (!dataset || !dataset.rows || dataset.rows.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950">
        <FileSpreadsheet className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">No Tabular Dataset Available</h3>
        <p className="text-xs text-slate-500 max-w-md">
          When you execute a research, lead generation, or data collection mission, AgentStation's Data Analyst (Nexus) normalizes the results into an interactive spreadsheet here.
        </p>
      </div>
    );
  }

  // Extract unique categories if 'category' column exists
  const hasCategoryCol = dataset.columns.some((c) => c.key === 'category' || c.key === 'sector');
  const categoryKey = dataset.columns.find((c) => c.key === 'category' || c.key === 'sector')?.key || '';
  const categories = useMemo(() => {
    if (!categoryKey) return [];
    const set = new Set<string>();
    dataset.rows.forEach((r) => {
      if (r[categoryKey]) set.add(String(r[categoryKey]));
    });
    return Array.from(set);
  }, [dataset, categoryKey]);

  // Filter and Sort rows
  const filteredRows = useMemo(() => {
    let list = [...dataset.rows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) =>
        Object.values(r).some((val) => String(val).toLowerCase().includes(q))
      );
    }

    if (selectedCategory !== 'all' && categoryKey) {
      list = list.filter((r) => String(r[categoryKey]) === selectedCategory);
    }

    if (sortKey) {
      list.sort((a, b) => {
        const aVal = a[sortKey] ?? '';
        const bVal = b[sortKey] ?? '';
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }
        return sortDirection === 'asc'
          ? String(aVal).localeCompare(String(bVal))
          : String(bVal).localeCompare(String(aVal));
      });
    }

    return list;
  }, [dataset.rows, searchQuery, selectedCategory, categoryKey, sortKey, sortDirection]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortDirection === 'asc') {
        setSortDirection('desc');
      } else {
        setSortKey(null);
        setSortDirection('asc');
      }
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const handleDownloadCsv = () => {
    const csvData = dataset.csvContent;
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.title.toLowerCase().replace(/\s+/g, '_')}_agentstation.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(dataset.rows, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dataset.title.toLowerCase().replace(/\s+/g, '_')}_agentstation.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopyCsv = () => {
    navigator.clipboard.writeText(dataset.csvContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-text">
      {/* Top Header & Summary Stats */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800/90 shrink-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Table className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{dataset.title}</h2>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[11px] font-mono font-medium">
                {dataset.totalCount} Records Verified
              </span>
            </div>
            {dataset.description && (
              <p className="text-xs text-slate-400 mt-1 max-w-3xl line-clamp-1">{dataset.description}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyCsv}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              title="Copy CSV to clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy CSV'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              title="Export as JSON"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">JSON</span>
            </button>

            <button
              onClick={handleDownloadCsv}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs shadow-md shadow-teal-600/20 transition"
              title="Download CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>

        {/* Metric Badges if present */}
        {dataset.summaryMetrics && dataset.summaryMetrics.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-800/60 text-xs">
            {dataset.summaryMetrics.map((m, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 font-mono text-[11px]"
              >
                <span className="text-slate-500">{m.label}:</span>
                <span className="text-teal-400 font-semibold">{m.value}</span>
              </div>
            ))}
          </div>
        )}

        {/* Search & Category Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies, decision makers, projects, emails..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950/90 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition"
            />
          </div>

          {categories.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
              <span className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">Sector:</span>
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-2 py-1 rounded-md text-xs font-medium transition ${
                  selectedCategory === 'all'
                    ? 'bg-teal-600 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                All ({dataset.rows.length})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap transition ${
                    selectedCategory === cat
                      ? 'bg-teal-600 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Table Grid Container */}
      <div className="flex-1 min-h-0 overflow-auto scrollbar-thin relative">
        <table className="w-full border-collapse text-left text-xs font-sans">
          <thead className="sticky top-0 bg-slate-900/98 backdrop-blur-md z-10 border-b border-slate-800 select-none shadow-sm">
            <tr>
              <th className="py-2.5 px-3 font-mono text-[11px] text-slate-500 w-10 text-center">#</th>
              {dataset.columns.map((col) => {
                const isSorted = sortKey === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className="py-2.5 px-3 font-semibold text-slate-300 hover:text-white cursor-pointer transition whitespace-nowrap group"
                    style={{ width: col.width }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.label}</span>
                      <ArrowUpDown
                        className={`w-3 h-3 transition ${
                          isSorted ? 'text-teal-400 opacity-100' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                        }`}
                      />
                    </div>
                  </th>
                );
              })}
              <th className="py-2.5 px-3 font-mono text-[11px] text-slate-500 text-right">Inspect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-950/70 font-mono text-slate-300">
            {filteredRows.map((row, idx) => (
              <tr
                key={idx}
                onClick={() => setSelectedRow(row)}
                className="hover:bg-slate-900/80 transition-colors cursor-pointer group"
              >
                <td className="py-2 px-3 text-slate-500 text-center text-[11px] font-mono select-none">
                  {idx + 1}
                </td>
                {dataset.columns.map((col) => {
                  const val = row[col.key];
                  return (
                    <td key={col.key} className="py-2 px-3 whitespace-nowrap text-xs">
                      {renderCellContent(col, val)}
                    </td>
                  );
                })}
                <td className="py-2 px-3 text-right">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedRow(row);
                    }}
                    className="text-[11px] font-mono text-teal-400 hover:text-teal-300 underline underline-offset-2"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={dataset.columns.length + 2} className="py-12 text-center text-slate-500 font-sans">
                  No records match your search filter "{searchQuery}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Row Details Modal / Drawer */}
      {selectedRow && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-teal-400" />
                  <h3 className="text-base font-bold text-white">
                    {selectedRow.company || selectedRow.name || 'Record Details'}
                  </h3>
                </div>
                {selectedRow.category && (
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-mono">
                    {selectedRow.category}
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="text-slate-400 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800 text-sm"
              >
                ✕ Close
              </button>
            </div>

            {/* Grid of Attributes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {Object.entries(selectedRow).map(([k, v]) => (
                <div key={k} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider block mb-1">
                    {k.replace(/_/g, ' ')}
                  </span>
                  <div className="text-slate-200 font-sans break-words">{renderDetailValue(k, v)}</div>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(selectedRow, null, 2));
                  setSelectedRow(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-slate-950 font-bold text-xs shadow-md transition"
              >
                Copy JSON Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function renderCellContent(col: SpreadsheetColumn, val: any) {
  if (val === null || val === undefined || val === '') {
    return <span className="text-slate-600 italic">—</span>;
  }

  if (col.type === 'email' || (typeof val === 'string' && val.includes('@') && !val.includes(' '))) {
    return (
      <span className="flex items-center gap-1 text-teal-400 font-mono text-xs">
        <Mail className="w-3 h-3 shrink-0 text-teal-500" />
        <span className="truncate">{val}</span>
      </span>
    );
  }

  if (col.type === 'link' || (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://')))) {
    return (
      <a
        href={val}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        className="flex items-center gap-1 text-blue-400 hover:text-blue-300 font-mono text-xs underline truncate"
      >
        <ExternalLink className="w-3 h-3 shrink-0" />
        <span>{val.replace(/^https?:\/\/(www\.)?/, '')}</span>
      </a>
    );
  }

  if (col.type === 'badge' || col.key === 'category' || col.key === 'tier' || col.key === 'status') {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60 text-[10px] font-mono">
        {String(val)}
      </span>
    );
  }

  if (col.key === 'decision_maker' || col.key === 'contact_person' || col.key === 'executive') {
    return (
      <span className="flex items-center gap-1.5 font-medium text-slate-100 font-sans">
        <User className="w-3 h-3 text-cyan-400 shrink-0" />
        <span>{String(val)}</span>
      </span>
    );
  }

  if (col.key === 'company' || col.key === 'name') {
    return (
      <span className="font-semibold text-white font-sans">
        {String(val)}
      </span>
    );
  }

  return <span className="text-slate-300 font-sans">{String(val)}</span>;
}

function renderDetailValue(key: string, val: any) {
  if (val === null || val === undefined) return <span className="text-slate-600 italic">None</span>;
  if (typeof val === 'string' && val.includes('@')) {
    return (
      <a href={`mailto:${val}`} className="text-teal-400 hover:underline flex items-center gap-1">
        <Mail className="w-3 h-3" />
        {val}
      </a>
    );
  }
  if (typeof val === 'string' && (val.startsWith('http://') || val.startsWith('https://'))) {
    return (
      <a href={val} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline flex items-center gap-1">
        <ExternalLink className="w-3 h-3" />
        {val}
      </a>
    );
  }
  return String(val);
}
