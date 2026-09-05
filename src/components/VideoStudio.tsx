import React, { useRef, useEffect, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Video,
  Layers,
  Sparkles,
  Github,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { VideoProject } from '../types';

interface VideoStudioProps {
  video: VideoProject;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({ video }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordProgress, setRecordProgress] = useState<number>(0);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);

  const requestRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const totalDuration = video.totalDurationSec || 16;
  const scenes = video.scenes || [];
  const scenesCount = scenes.length;

  // Determine current active scene based on time
  const currentSceneIndex = scenesCount > 0
    ? Math.max(0, Math.min(Math.floor((currentTime / totalDuration) * scenesCount), scenesCount - 1))
    : 0;

  // Synchronized voiceover speech
  useEffect(() => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      if (!isAudioEnabled || !isPlaying || scenesCount === 0 || !scenes[currentSceneIndex]) {
        return;
      }
      const activeScene = scenes[currentSceneIndex];
      const utterance = new SpeechSynthesisUtterance(
        `${activeScene.badge || ''}. ${activeScene.heading || ''}. ${activeScene.subheading || ''}`
      );
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis might be restricted in some iframes
    }
  }, [currentSceneIndex, isPlaying, isAudioEnabled, scenesCount]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
      } catch {
        // Ignored
      }
    };
  }, []);

  // Main 60fps render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * 1280,
      y: Math.random() * 720,
      size: Math.random() * 2 + 1,
      speed: Math.random() * 0.8 + 0.2,
      opacity: Math.random() * 0.6 + 0.2,
    }));

    const render = () => {
      if (isPlaying) {
        const elapsed = (Date.now() - startTimeRef.current) / 1000;
        if (elapsed >= totalDuration) {
          startTimeRef.current = Date.now();
          setCurrentTime(0);
        } else {
          setCurrentTime(elapsed);
        }
      }

      const defaultScene = {
        id: 'scene-default',
        sceneIndex: 0,
        durationSec: 4,
        badge: 'ACTIVE RUN',
        heading: video?.title || 'AUTONOMOUS SQUAD',
        subheading: video?.subtitle || 'Processing project parameters...',
        bulletPoints: ['Architecting specifications', 'Executing unit test assertions', 'Bundling for GitHub'],
        accentColor: '#3b82f6',
      };

      const activeScene = (scenes && scenes.length > 0 && scenes[currentSceneIndex])
        ? scenes[currentSceneIndex]
        : defaultScene;
      const accent = activeScene.accentColor || '#3b82f6';
      const bulletList = Array.isArray(activeScene.bulletPoints) && activeScene.bulletPoints.length > 0
        ? activeScene.bulletPoints
        : ['Autonomous multi-agent execution', 'Sandboxed container verification', 'Production ready code'];

      // 1. Clear background
      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, 1280, 720);

      // 2. Animated Particle Grid / Background Glow
      particles.forEach((p) => {
        p.y -= p.speed;
        if (p.y < 0) p.y = 720;
        ctx.fillStyle = `rgba(147, 197, 253, ${p.opacity * 0.4})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Ambient radial glow behind content
      const radialGrad = ctx.createRadialGradient(640, 360, 50, 640, 360, 550);
      radialGrad.addColorStop(0, `${accent}18`);
      radialGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = radialGrad;
      ctx.fillRect(0, 0, 1280, 720);

      // 3. Futuristic HUD Frame
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(60, 60, 1160, 600);

      // Glowing corner accents
      const cornerSize = 25;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3;

      // Top Left
      ctx.beginPath();
      ctx.moveTo(60, 60 + cornerSize);
      ctx.lineTo(60, 60);
      ctx.lineTo(60 + cornerSize, 60);
      ctx.stroke();

      // Top Right
      ctx.beginPath();
      ctx.moveTo(1220 - cornerSize, 60);
      ctx.lineTo(1220, 60);
      ctx.lineTo(1220, 60 + cornerSize);
      ctx.stroke();

      // Bottom Left
      ctx.beginPath();
      ctx.moveTo(60, 660 - cornerSize);
      ctx.lineTo(60, 660);
      ctx.lineTo(60 + cornerSize, 660);
      ctx.stroke();

      // Bottom Right
      ctx.beginPath();
      ctx.moveTo(1220 - cornerSize, 660);
      ctx.lineTo(1220, 660);
      ctx.lineTo(1220, 660 - cornerSize);
      ctx.stroke();

      // 4. Header Bar: System Brand & Scene Progress
      ctx.font = 'bold 15px monospace';
      ctx.fillStyle = '#64748b';
      ctx.fillText('AGENTSTATION VIDEO STUDIO // AUTONOMOUS MULTI-AGENT CLUSTER', 90, 105);

      ctx.fillStyle = activeScene.accentColor;
      ctx.font = 'bold 13px monospace';
      ctx.fillText(
        `SCENE ${currentSceneIndex + 1} OF ${scenes.length} • [${activeScene.badge}]`,
        1220 - 320,
        105
      );

      // 5. Active Scene Badge Pill
      ctx.fillStyle = `${activeScene.accentColor}25`;
      ctx.strokeStyle = activeScene.accentColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(90, 140, 220, 32, 8);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 13px monospace';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(activeScene.badge, 110, 161);

      // 6. Kinetic Title (Animated Slide & Fade)
      ctx.font = '900 44px sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.shadowColor = `${activeScene.accentColor}40`;
      ctx.shadowBlur = 12;
      ctx.fillText(activeScene.heading, 90, 225);
      ctx.shadowBlur = 0;

      // 7. Subheading
      ctx.font = '500 20px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(activeScene.subheading, 90, 268);

      // 8. Content Body: Bullet Points or Code Preview
      if (activeScene.codePreview) {
        // Render 2-column layout: Bullets on left, Code box on right
        // Bullets
        bulletList.forEach((point, idx) => {
          const y = 330 + idx * 46;
          // Checkmark
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(104, y - 6, 7, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '600 18px sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(point, 125, y);
        });

        // Code Box HUD
        const codeX = 660;
        const codeY = 300;
        const codeW = 500;
        const codeH = 220;

        ctx.fillStyle = '#050811';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(codeX, codeY, codeW, codeH, 12);
        ctx.fill();
        ctx.stroke();

        // Header
        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(codeX, codeY, codeW, 36, [12, 12, 0, 0]);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(codeX + 20, codeY + 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(codeX + 36, codeY + 18, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#10b981';
        ctx.beginPath();
        ctx.arc(codeX + 52, codeY + 18, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.fillText('autonomous_engine.py', codeX + 72, codeY + 22);

        // Code Lines
        ctx.font = '15px monospace';
        ctx.fillStyle = '#38bdf8';
        const lines = (activeScene.codePreview || '').split('\n');
        lines.forEach((line, lIdx) => {
          ctx.fillText(line, codeX + 24, codeY + 70 + lIdx * 28);
        });
      } else {
        // Large 3 bullet points with visual icons
        bulletList.forEach((point, idx) => {
          const y = 340 + idx * 56;
          // Accent pill box
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(90, y - 28, 950, 44, 8);
          ctx.fill();
          ctx.stroke();

          // Dot
          ctx.fillStyle = accent;
          ctx.beginPath();
          ctx.arc(115, y - 6, 6, 0, Math.PI * 2);
          ctx.fill();

          ctx.font = '600 18px sans-serif';
          ctx.fillStyle = '#e2e8f0';
          ctx.fillText(point, 138, y);
        });
      }

      // 9. Bottom Banner: Call To Action & Repository Link
      ctx.fillStyle = '#0a1020';
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(90, 560, 1100, 68, 12);
      ctx.fill();
      ctx.stroke();

      ctx.font = 'bold 15px sans-serif';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText('TARGET REPOSITORY:', 120, 600);

      ctx.font = 'bold 18px monospace';
      ctx.fillStyle = '#60a5fa';
      ctx.fillText('https://github.com/Olori24/AgentStation.git', 300, 600);

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 13px monospace';
      ctx.fillText('● 100% PASSING', 1040, 600);

      // 10. Scrub Timeline Bar at Bottom
      const timelineW = 1100;
      const progressW = (currentTime / totalDuration) * timelineW;

      ctx.fillStyle = '#1e293b';
      ctx.fillRect(90, 642, timelineW, 4);

      ctx.fillStyle = activeScene.accentColor;
      ctx.fillRect(90, 642, progressW, 4);

      requestRef.current = requestAnimationFrame(render);
    };

    requestRef.current = requestAnimationFrame(render);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isPlaying, currentTime, currentSceneIndex, scenes, totalDuration]);

  const togglePlay = () => {
    if (isPlaying) {
      pausedTimeRef.current = currentTime;
      setIsPlaying(false);
    } else {
      startTimeRef.current = Date.now() - currentTime * 1000;
      setIsPlaying(true);
    }
  };

  const handleRestart = () => {
    startTimeRef.current = Date.now();
    setCurrentTime(0);
    setIsPlaying(true);
  };

  const handleSelectScene = (index: number) => {
    const sceneTime = (index / scenes.length) * totalDuration;
    startTimeRef.current = Date.now() - sceneTime * 1000;
    setCurrentTime(sceneTime);
    setSelectedSceneIndex(index);
  };

  // One-click MediaRecorder Video Exporter
  const handleExportVideo = async () => {
    const canvas = canvasRef.current;
    if (!canvas || isRecording) return;

    try {
      setIsRecording(true);
      setRecordProgress(0);
      handleRestart();

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
      });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AgentStation_${video.title.replace(/\s+/g, '_')}_Promo.webm`;
        a.click();
        URL.revokeObjectURL(url);
        setIsRecording(false);
        setRecordProgress(100);
      };

      recorder.start();

      const durationMs = totalDuration * 1000;
      const intervalMs = 200;
      let recordedMs = 0;

      const progressTimer = setInterval(() => {
        recordedMs += intervalMs;
        const pct = Math.min(Math.round((recordedMs / durationMs) * 100), 99);
        setRecordProgress(pct);

        if (recordedMs >= durationMs) {
          clearInterval(progressTimer);
          recorder.stop();
        }
      }, intervalMs);
    } catch (err: any) {
      console.error('Video recording failed:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
      {/* Studio Header */}
      <div className="px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-950/50">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Motion Video Producer (Nova)
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
            1080p Kinetic Canvas
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Audio toggle */}
          <button
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className={`p-1.5 rounded-md border text-xs flex items-center gap-1.5 transition ${
              isAudioEnabled
                ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                : 'bg-slate-800 border-slate-700 text-slate-500'
            }`}
            title="Toggle Voiceover Narration"
          >
            {isAudioEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px] font-mono hidden sm:inline">Voiceover</span>
          </button>

          {/* Export Video Button */}
          <button
            onClick={handleExportVideo}
            disabled={isRecording}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/20 transition disabled:opacity-50"
          >
            {isRecording ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Recording {recordProgress}%</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Export Video (.webm)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Display Viewport */}
      <div className="relative flex-1 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 min-h-[300px]">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          className="w-full max-w-3xl aspect-video rounded-xl border border-slate-800 shadow-2xl bg-[#090d16]"
        />

        {/* Recording Overlay Indicator */}
        {isRecording && (
          <div className="absolute top-6 right-6 flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-300 font-mono text-xs backdrop-blur">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span>REC // {recordProgress}%</span>
          </div>
        )}
      </div>

      {/* Playback Controls & Scene Navigation */}
      <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Play / Pause buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-md transition"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={handleRestart}
              title="Restart Video"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="text-xs font-mono text-slate-400 pl-2">
              {Math.floor(currentTime)}s / {totalDuration}s
            </span>
          </div>

          {/* Scene selector jump buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-thin">
            <span className="text-[11px] font-mono text-slate-500 uppercase">Scenes:</span>
            {scenes.map((s, idx) => (
              <button
                key={s.id}
                onClick={() => handleSelectScene(idx)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition border ${
                  currentSceneIndex === idx
                    ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 font-bold'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {idx + 1}. {s.badge}
              </button>
            ))}
          </div>
        </div>

        {/* Narrative Voiceover Script Box */}
        <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-xs">
          <div className="flex items-center justify-between text-slate-400 font-mono text-[10px] uppercase mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" />
              Creative Director Script
            </span>
            <span>Mood: {video.soundtrackMood}</span>
          </div>
          <p className="text-slate-300 leading-relaxed italic">
            "{video.audioScript}"
          </p>
        </div>
      </div>
    </div>
  );
};
