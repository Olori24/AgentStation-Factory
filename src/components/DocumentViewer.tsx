import React, { useState, useMemo } from 'react';
import {
  FileText,
  Download,
  Copy,
  Check,
  Printer,
  Clock,
  User,
  Tag,
  BookOpen,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { DocumentArtifact } from '../types';

interface DocumentViewerProps {
  document?: DocumentArtifact;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({ document: doc }) => {
  const [copied, setCopied] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string>('');

  if (!doc || !doc.markdownContent) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400 bg-slate-950">
        <FileText className="w-12 h-12 text-slate-600 mb-3" />
        <h3 className="text-base font-semibold text-slate-200 mb-1">No Executive Document Generated</h3>
        <p className="text-xs text-slate-500 max-w-md">
          When an objective requires market research, strategic briefs, whitepapers, or legal specs, AgentStation's Creative Director (Vesper) drafts a comprehensive dossier here.
        </p>
      </div>
    );
  }

  // Extract table of contents from headers
  const headers = useMemo(() => {
    const lines = doc.markdownContent.split('\n');
    const list: { id: string; title: string; level: number }[] = [];
    lines.forEach((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const rawTitle = match[2].trim();
        const cleanTitle = rawTitle.replace(/\*\*/g, '').replace(/\[(.*?)\]\(.*?\)/g, '$1');
        const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        list.push({ id, title: cleanTitle, level });
      }
    });
    return list;
  }, [doc.markdownContent]);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(doc.markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([doc.markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${doc.title.toLowerCase().replace(/\s+/g, '_')}_agentstation.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const scrollToSection = (id: string) => {
    setActiveSectionId(id);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-text">
      {/* Top Header Bar */}
      <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800/90 shrink-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <FileText className="w-4 h-4" />
              </span>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{doc.title}</h2>
              <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-mono uppercase tracking-wider">
                {doc.category.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-mono text-[11px]">
              <span className="flex items-center gap-1">
                <User className="w-3 h-3 text-slate-500" />
                <span>Author: {doc.author}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" />
                <span>{doc.readTimeMin || 6} min read</span>
              </span>
              <span>•</span>
              <span>Compiled: {doc.createdAt}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              title="Copy markdown text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700/60 transition"
              title="Print document"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-600/20 transition"
              title="Download Markdown document"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download (.md)</span>
            </button>
          </div>
        </div>

        {/* Tags if available */}
        {doc.tags && doc.tags.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {doc.tags.map((t, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-slate-400 text-[10px] font-mono"
              >
                <Tag className="w-2.5 h-2.5 text-slate-500" />
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Main Layout: Table of Contents & Formatted Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* TOC Sidebar on larger screens */}
        {headers.length > 0 && (
          <div className="hidden lg:block w-64 bg-slate-900/40 border-r border-slate-800/70 p-3 overflow-y-auto shrink-0 scrollbar-thin">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 font-mono">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Table of Contents</span>
            </div>
            <nav className="space-y-1">
              {headers.map((h, i) => (
                <button
                  key={i}
                  onClick={() => scrollToSection(h.id)}
                  className={`w-full text-left text-xs py-1 px-2 rounded-md transition truncate block ${
                    h.level === 1
                      ? 'font-bold text-slate-200'
                      : h.level === 2
                      ? 'pl-3 text-slate-400 hover:text-slate-200'
                      : 'pl-5 text-slate-500 hover:text-slate-300 text-[11px]'
                  } ${activeSectionId === h.id ? 'bg-cyan-500/10 text-cyan-400 border-l-2 border-cyan-400' : 'hover:bg-slate-800/40'}`}
                >
                  {h.title}
                </button>
              ))}
            </nav>
          </div>
        )}

        {/* Document Content Renderer */}
        <div className="flex-1 min-h-0 p-4 sm:p-8 overflow-y-auto scrollbar-thin bg-slate-950/60">
          <div className="max-w-4xl mx-auto space-y-4 font-sans text-slate-300 leading-relaxed">
            {renderMarkdown(doc.markdownContent)}
          </div>
        </div>
      </div>
    </div>
  );
};

// Robust Markdown-to-JSX Parser without external dependency issues
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inList = false;
  let listItems: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const flushList = () => {
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="my-3 space-y-1.5 pl-5 list-disc text-slate-300 text-sm">
          {listItems.map((item, idx) => (
            <li key={idx} className="leading-normal">{parseInlineMarkdown(item)}</li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  const flushTable = () => {
    if (inTable && tableRows.length > 0) {
      const [headerRow, ...bodyRows] = tableRows;
      elements.push(
        <div key={`table-${elements.length}`} className="my-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60">
          <table className="w-full text-xs text-left border-collapse font-mono">
            <thead className="bg-slate-850 border-b border-slate-800 text-slate-300 font-semibold">
              <tr>
                {headerRow.map((col, i) => (
                  <th key={i} className="py-2 px-3">{col.trim()}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {bodyRows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-800/30">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-slate-300">{cell.trim()}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }
  };

  lines.forEach((line, lineIdx) => {
    // Check table row
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      flushList();
      // Skip markdown separator row |---|---|
      if (/^\|[\s\-:|]+\|$/.test(line.trim())) {
        return;
      }
      const cols = line.trim().slice(1, -1).split('|');
      inTable = true;
      tableRows.push(cols);
      return;
    } else if (inTable) {
      flushTable();
    }

    // Check list item
    const listMatch = line.match(/^(\s*)[-*+]\s+(.+)$/);
    if (listMatch) {
      inList = true;
      listItems.push(listMatch[2]);
      return;
    } else if (inList) {
      flushList();
    }

    // Check headings
    const h1 = line.match(/^#\s+(.+)$/);
    if (h1) {
      const id = h1[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h1 id={id} key={lineIdx} className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-6 pb-2 border-b border-slate-800">
          {parseInlineMarkdown(h1[1])}
        </h1>
      );
      return;
    }

    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      const id = h2[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h2 id={id} key={lineIdx} className="text-lg sm:text-xl font-bold text-white tracking-tight pt-5 pb-1 text-cyan-300">
          {parseInlineMarkdown(h2[1])}
        </h2>
      );
      return;
    }

    const h3 = line.match(/^###\s+(.+)$/);
    if (h3) {
      const id = h3[1].toLowerCase().replace(/[^a-z0-9]+/g, '-');
      elements.push(
        <h3 id={id} key={lineIdx} className="text-base font-semibold text-slate-100 pt-3 pb-1">
          {parseInlineMarkdown(h3[1])}
        </h3>
      );
      return;
    }

    // Callout blockquote
    if (line.startsWith('>')) {
      elements.push(
        <blockquote key={lineIdx} className="my-2 p-3 pl-4 rounded-r-xl border-l-4 border-cyan-500 bg-cyan-500/10 text-cyan-200 text-xs italic">
          {parseInlineMarkdown(line.replace(/^>\s*/, ''))}
        </blockquote>
      );
      return;
    }

    // Normal paragraph
    if (line.trim()) {
      elements.push(
        <p key={lineIdx} className="text-sm leading-relaxed text-slate-300 font-sans">
          {parseInlineMarkdown(line)}
        </p>
      );
    }
  });

  flushList();
  flushTable();

  return elements;
}

function parseInlineMarkdown(text: string): React.ReactNode {
  // Replace bold, italics, code, links
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`|\[.*?\]\(.*?\))/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={idx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={idx} className="text-slate-200 italic">{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={idx} className="px-1.5 py-0.5 rounded bg-slate-900 text-cyan-400 font-mono text-xs">{part.slice(1, -1)}</code>;
    }
    const linkMatch = part.match(/^\[(.*?)\]\((.*?)\)$/);
    if (linkMatch) {
      return (
        <a
          key={idx}
          href={linkMatch[2]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline font-medium"
        >
          {linkMatch[1]}
        </a>
      );
    }
    return part;
  });
}
