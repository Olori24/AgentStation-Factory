import { SquadMission } from '../types';
import { INITIAL_MISSION } from './defaults';

export const SAMPLE_MISSIONS: SquadMission[] = [
  INITIAL_MISSION,
  {
    id: 'mission-002',
    prompt: 'Build a Real-Time WebSocket Telemetry Dashboard with HTML5 Canvas visualizer and dark cyber theme',
    createdAt: 'Yesterday, 18:42',
    status: 'completed',
    currentStage: 'Mission Completed & Verified',
    progressPercent: 100,
    gitBranch: 'main',
    gitCommitMessage: 'feat(telemetry): add streaming canvas visualizer, ws client, and launch media',
    files: [
      {
        name: 'index.html',
        path: 'public/index.html',
        language: 'html',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>AgentStation Real-Time Telemetry</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-slate-950 text-slate-100 p-6 font-mono">
  <div class="max-w-4xl mx-auto space-y-6">
    <div class="flex items-center justify-between border-b border-slate-800 pb-4">
      <div>
        <h1 class="text-xl font-bold text-blue-400">AgentStation // Pulse Monitor</h1>
        <p class="text-xs text-slate-500">Autonomous Telemetry & Throughput Analyzer</p>
      </div>
      <div class="flex items-center gap-2 text-xs">
        <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
        <span class="text-emerald-400 font-bold">STREAM ONLINE</span>
      </div>
    </div>

    <div class="grid grid-cols-3 gap-4 text-center">
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400 uppercase">Packets / Sec</div>
        <div id="metric-pps" class="text-2xl font-black text-blue-400 mt-1">4,820</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400 uppercase">P99 Latency</div>
        <div id="metric-lat" class="text-2xl font-black text-emerald-400 mt-1">1.2ms</div>
      </div>
      <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div class="text-xs text-slate-400 uppercase">Cluster Load</div>
        <div id="metric-load" class="text-2xl font-black text-purple-400 mt-1">24.5%</div>
      </div>
    </div>

    <div class="p-4 rounded-xl bg-slate-900 border border-slate-800">
      <canvas id="telemetryCanvas" width="800" height="260" class="w-full h-64 rounded-lg bg-slate-950 border border-slate-800"></canvas>
    </div>
  </div>

  <script>
    const canvas = document.getElementById('telemetryCanvas');
    const ctx = canvas.getContext('2d');
    const dataPoints = Array.from({ length: 60 }, () => Math.random() * 80 + 20);

    function draw() {
      dataPoints.shift();
      dataPoints.push(Math.random() * 80 + 20);

      ctx.fillStyle = '#090d16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1;
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const step = canvas.width / (dataPoints.length - 1);
      dataPoints.forEach((val, i) => {
        const x = i * step;
        const y = canvas.height - (val / 100) * canvas.height;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();
      requestAnimationFrame(draw);
    }
    draw();
  </script>
</body>
</html>`,
      },
      {
        name: 'telemetry_server.py',
        path: 'src/telemetry_server.py',
        language: 'python',
        content: `#!/usr/bin/env python3
"""
Real-Time Telemetry Ingest Server
Built by Cypher (Lead Engineer) and Sentinel (QA Auditor).
"""
import time
import random
from typing import Dict

class TelemetryCollector:
    def __init__(self, node_id: str = "cluster-01"):
        self.node_id = node_id
        self.is_active = True

    def sample_metrics(self) -> Dict[str, float]:
        return {
            "node_id": self.node_id,
            "timestamp": time.time(),
            "cpu_percent": round(random.uniform(15.0, 45.0), 2),
            "memory_mb": round(random.uniform(256.0, 512.0), 2),
            "requests_per_sec": round(random.uniform(3200, 5400), 1),
            "error_rate": 0.0001
        }

if __name__ == "__main__":
    collector = TelemetryCollector()
    print("Telemetry collector initialized:", collector.sample_metrics())`,
      },
      {
        name: 'test_telemetry.py',
        path: 'tests/test_telemetry.py',
        language: 'python',
        content: `import pytest
from src.telemetry_server import TelemetryCollector

def test_sample_metrics_structure():
    collector = TelemetryCollector()
    metrics = collector.sample_metrics()
    assert "cpu_percent" in metrics
    assert "memory_mb" in metrics
    assert metrics["cpu_percent"] >= 0
    assert metrics["error_rate"] < 0.01

def test_node_id():
    collector = TelemetryCollector(node_id="worker-99")
    assert collector.sample_metrics()["node_id"] == "worker-99"`,
      },
    ],
    execution: {
      command: 'pytest -v tests/test_telemetry.py',
      stdout: `============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-7.4.3
rootdir: /app/workspace
collected 2 items

tests/test_telemetry.py::test_sample_metrics_structure PASSED            [ 50%]
tests/test_telemetry.py::test_node_id PASSED                             [100%]

============================== 2 passed in 0.08s ===============================`,
      exitCode: 0,
      testsPassed: 2,
      testsFailed: 0,
      durationMs: 82,
    },
    video: {
      title: 'TELEMETRY PULSE 2.0',
      hook: 'Zero-overhead infrastructure observability with kinetic canvas visualization.',
      subtitle: 'Stream 100K+ metrics/sec with sub-millisecond overhead.',
      totalDurationSec: 16,
      audioScript: 'Introducing Telemetry Pulse. Real-time streaming metrics engine built for high-throughput distributed clusters.',
      soundtrackMood: 'cyberpunk',
      scenes: [
        {
          id: 'scene-1',
          sceneIndex: 0,
          durationSec: 4,
          badge: 'ARCHITECTURE',
          heading: 'TELEMETRY PULSE',
          subheading: 'High-frequency streaming observability',
          bulletPoints: ['Sub-millisecond latency', 'Native WebSocket ingest', 'Lightweight memory footprint'],
          accentColor: '#38bdf8',
        },
        {
          id: 'scene-2',
          sceneIndex: 1,
          durationSec: 4,
          badge: 'PERFORMANCE',
          heading: '4,800+ PACKETS / SEC',
          subheading: 'Zero-overhead buffer pooling',
          bulletPoints: ['Non-blocking event loop', 'Zero GC stutter', 'Dynamic batching'],
          accentColor: '#10b981',
        },
        {
          id: 'scene-3',
          sceneIndex: 2,
          durationSec: 4,
          badge: 'VISUALIZER',
          heading: 'KINETIC CANVAS HUD',
          subheading: 'Hardware-accelerated rendering',
          bulletPoints: ['60 FPS smooth playback', 'Responsive canvas scaling', 'Multi-tenant metrics'],
          accentColor: '#8b5cf6',
        },
        {
          id: 'scene-4',
          sceneIndex: 3,
          durationSec: 4,
          badge: 'PRODUCTION READY',
          heading: 'VERIFIED & TESTED',
          subheading: 'Docker containerized with GitHub CI/CD',
          bulletPoints: ['100% PyTest assertion coverage', 'Pre-configured Dockerfile', 'GitHub Actions workflow'],
          accentColor: '#f59e0b',
        },
      ],
    },
    logs: [
      {
        id: 'log-tel-1',
        timestamp: '18:42:01',
        role: 'architect',
        agentName: 'Atlas (Architect)',
        type: 'status',
        message: 'Engineered real-time telemetry architecture with low-overhead canvas stream.',
      },
      {
        id: 'log-tel-2',
        timestamp: '18:42:04',
        role: 'developer',
        agentName: 'Cypher (Lead Engineer)',
        type: 'code_gen',
        message: 'Generated index.html, telemetry_server.py, and automated test suite.',
      },
      {
        id: 'log-tel-3',
        timestamp: '18:42:08',
        role: 'qa',
        agentName: 'Sentinel (QA Auditor)',
        type: 'terminal',
        message: 'Ran test suite: 2/2 tests passed in 82ms.',
      },
      {
        id: 'log-tel-4',
        timestamp: '18:42:10',
        role: 'creative',
        agentName: 'Vesper (Creative Director)',
        type: 'thought',
        message: 'Framed launch video angle: High-throughput telemetry for modern cloud native engineering.',
      },
      {
        id: 'log-tel-5',
        timestamp: '18:42:12',
        role: 'video_producer',
        agentName: 'Nova (Motion Producer)',
        type: 'video',
        message: 'Rendered cyberpunk kinetic canvas video with multi-aspect ratio support.',
      },
    ],
  },
  {
    id: 'mission-003',
    prompt: 'Build a secure cryptographic AES-256 File Vault with PBKDF2 key derivation and compliance report',
    createdAt: '2 days ago',
    status: 'completed',
    currentStage: 'Mission Completed & Verified',
    progressPercent: 100,
    gitBranch: 'main',
    gitCommitMessage: 'feat(vault): implement AES-256-GCM encryption with PBKDF2 and integrity assertions',
    files: [
      {
        name: 'vault.py',
        path: 'src/vault.py',
        language: 'python',
        content: `#!/usr/bin/env python3
"""
AgentStation Secure Vault
Cryptographic storage with AES-256 and HMAC verification.
"""
import hashlib
import os
import hmac
import base64
from typing import Tuple

class CryptoVault:
    def __init__(self, passphrase: str, salt: bytes = None):
        self.salt = salt or os.urandom(16)
        self.key = hashlib.pbkdf2_hmac('sha256', passphrase.encode(), self.salt, 100000)

    def encrypt_string(self, plaintext: str) -> str:
        data = plaintext.encode('utf-8')
        # XOR keystream simulation for portable sandbox execution
        keystream = hashlib.sha256(self.key).digest()
        cipher_bytes = bytes([b ^ keystream[i % len(keystream)] for i, b in enumerate(data)])
        sig = hmac.new(self.key, cipher_bytes, hashlib.sha256).digest()
        payload = self.salt + sig + cipher_bytes
        return base64.b64encode(payload).decode('utf-8')

    def decrypt_string(self, token: str) -> str:
        payload = base64.b64decode(token.encode('utf-8'))
        salt, sig, cipher_bytes = payload[:16], payload[16:48], payload[48:]
        computed_sig = hmac.new(self.key, cipher_bytes, hashlib.sha256).digest()
        if not hmac.compare_digest(sig, computed_sig):
            raise ValueError("Integrity check failed: invalid signature")
        keystream = hashlib.sha256(self.key).digest()
        plain_bytes = bytes([b ^ keystream[i % len(keystream)] for i, b in enumerate(cipher_bytes)])
        return plain_bytes.decode('utf-8')

if __name__ == "__main__":
    vault = CryptoVault("super-secret-passphrase")
    enc = vault.encrypt_string("Top secret cluster credentials")
    dec = vault.decrypt_string(enc)
    print("Decrypted successfully:", dec)`,
      },
      {
        name: 'test_vault.py',
        path: 'tests/test_vault.py',
        language: 'python',
        content: `import pytest
from src.vault import CryptoVault

def test_encryption_decryption_roundtrip():
    vault = CryptoVault("master-key-12345")
    secret = "Confidential API Token: sk-live-999"
    encrypted = vault.encrypt_string(secret)
    decrypted = vault.decrypt_string(encrypted)
    assert decrypted == secret

def test_tamper_detection():
    vault = CryptoVault("master-key-12345")
    encrypted = vault.encrypt_string("Tamper test payload")
    # Mutate string
    tampered = encrypted[:-2] + "AA"
    with pytest.raises(Exception):
        vault.decrypt_string(tampered)`,
      },
    ],
    execution: {
      command: 'pytest -v tests/test_vault.py',
      stdout: `============================= test session starts ==============================
platform linux -- Python 3.11.8, pytest-7.4.3
rootdir: /app/workspace
collected 2 items

tests/test_vault.py::test_encryption_decryption_roundtrip PASSED        [ 50%]
tests/test_vault.py::test_tamper_detection PASSED                       [100%]

============================== 2 passed in 0.09s ===============================`,
      exitCode: 0,
      testsPassed: 2,
      testsFailed: 0,
      durationMs: 94,
    },
    video: {
      title: 'CRYPTO VAULT 256',
      hook: 'Zero-knowledge encryption for mission-critical environment keys.',
      subtitle: 'PBKDF2 key derivation with HMAC tamper resistance.',
      totalDurationSec: 16,
      audioScript: 'Introducing Crypto Vault. Modern cryptographic data security engine designed with AES-256 and HMAC verification.',
      soundtrackMood: 'ambient-clean',
      scenes: [
        {
          id: 'scene-1',
          sceneIndex: 0,
          durationSec: 4,
          badge: 'SECURITY AUDIT',
          heading: 'CRYPTO VAULT 256',
          subheading: 'Zero-knowledge environment key storage',
          bulletPoints: ['PBKDF2 100,000 rounds', 'HMAC SHA-256 tamper checks', 'Zero plaintext leakage'],
          accentColor: '#10b981',
        },
        {
          id: 'scene-2',
          sceneIndex: 1,
          durationSec: 4,
          badge: 'COMPLIANCE',
          heading: 'FIPS 140-2 READY',
          subheading: 'Engineered for strict enterprise compliance',
          bulletPoints: ['Constant-time comparison', 'Cryptographic salt isolation', 'Deterministic verification'],
          accentColor: '#3b82f6',
        },
        {
          id: 'scene-3',
          sceneIndex: 2,
          durationSec: 4,
          badge: 'QA CERTIFIED',
          heading: '100% PASSING TESTS',
          subheading: 'Validated in sandboxed Linux containers',
          bulletPoints: ['Tamper detection assertions', 'Roundtrip integrity checks', 'Memory wipe on exit'],
          accentColor: '#f59e0b',
        },
        {
          id: 'scene-4',
          sceneIndex: 3,
          durationSec: 4,
          badge: 'DEPLOYMENT',
          heading: 'PRODUCTION READY',
          subheading: 'Push to GitHub with automated CI/CD pipeline',
          bulletPoints: ['Docker containerized', 'Ready for Kubernetes', 'Olori24/AgentStation'],
          accentColor: '#ec4899',
        },
      ],
    },
    logs: [
      {
        id: 'log-vault-1',
        timestamp: '11:15:02',
        role: 'architect',
        agentName: 'Atlas (Architect)',
        type: 'status',
        message: 'Designed cryptographic specification with PBKDF2 and HMAC SHA-256 tamper detection.',
      },
      {
        id: 'log-vault-2',
        timestamp: '11:15:05',
        role: 'developer',
        agentName: 'Cypher (Lead Engineer)',
        type: 'code_gen',
        message: 'Implemented vault.py and comprehensive test_vault.py integrity suite.',
      },
      {
        id: 'log-vault-3',
        timestamp: '11:15:09',
        role: 'qa',
        agentName: 'Sentinel (QA Auditor)',
        type: 'terminal',
        message: 'Verified tamper-resistance tests: 2/2 tests passed.',
      },
    ],
  },
];
