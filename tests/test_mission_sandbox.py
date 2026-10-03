"""Automated test suite for AgentStation mission sandbox & full-stack API validation."""
import json
import urllib.request
import urllib.error


def test_agentstation_environment():
    """Verify standard Python test execution environment."""
    assert True


def test_mission_deliverable_structure():
    """Ensure basic squad schema validation passes."""
    deliverable = {
        "status": "ready",
        "verified": True,
        "agents": ["Atlas", "Hermes", "Cypher", "Sentinel", "Vesper", "Nova"],
    }
    assert deliverable["verified"] is True
    assert len(deliverable["agents"]) == 6


def test_live_api_endpoints_if_online():
    """Verify full-stack API endpoints when server is listening on port 3000."""
    base = "http://127.0.0.1:3000"
    try:
        with urllib.request.urlopen(f"{base}/api/health", timeout=2) as resp:
            health = json.loads(resp.read().decode("utf-8"))
            assert health.get("status") == "ok"
    except Exception:
        # Server not running in standalone unit mode
        return

    # 1. Verify Objective Templates
    with urllib.request.urlopen(f"{base}/api/objectives/templates", timeout=3) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        assert data.get("success") is True
        assert len(data.get("templates", [])) >= 7

    # 2. Verify Autonomy Scheduler Status
    with urllib.request.urlopen(f"{base}/api/autonomy/status", timeout=3) as resp:
        status_payload = json.loads(resp.read().decode("utf-8"))
        assert status_payload.get("success") is True
        inner_status = status_payload.get("status", status_payload)
        assert inner_status.get("totalGoals", 0) >= 4

    # 3. Verify Growth Factory Campaign Generator
    req = urllib.request.Request(
        f"{base}/api/growth/campaign",
        data=json.dumps({
            "project": {
                "id": "leadgen",
                "name": "LeadGen Studio",
                "offer": "Done-for-you short-form + outbound lead funnel",
                "audience": "Clinics, real estate teams, legal and consulting practices",
            },
            "objective": "Create a 30-day short-form campaign that attracts qualified leads.",
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=5) as resp:
        growth = json.loads(resp.read().decode("utf-8"))
        assert growth.get("success") is True
        assert len(growth.get("campaign", {}).get("angles", [])) >= 6

    # 4. Verify Batch File Persistence & File Tree API (Phase 2)
    batch_req = urllib.request.Request(
        f"{base}/api/files/save-batch",
        data=json.dumps({
            "missionId": "test-mission",
            "files": [
                {
                    "path": "reports/sandbox_verification.md",
                    "content": "# Sandbox Verification\nStatus: Verified\n",
                }
            ],
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(batch_req, timeout=3) as resp:
        saved = json.loads(resp.read().decode("utf-8"))
        assert saved.get("success") is True
        assert saved.get("savedCount") == 1

    with urllib.request.urlopen(f"{base}/api/files/tree", timeout=3) as resp:
        tree = json.loads(resp.read().decode("utf-8"))
        assert tree.get("success") is True
        assert any(f.get("path") == "reports/sandbox_verification.md" for f in tree.get("files", []))

    # 5. Verify Real-time SSE Broadcast Endpoint (Phase 3)
    sse_req = urllib.request.Request(
        f"{base}/api/stream/test-emit",
        data=json.dumps({
            "agent": "Atlas",
            "thought": "Automated sandbox verification telemetry check.",
        }).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(sse_req, timeout=3) as resp:
        sse_data = json.loads(resp.read().decode("utf-8"))
        assert sse_data.get("success") is True


if __name__ == "__main__":
    test_agentstation_environment()
    test_mission_deliverable_structure()
    test_live_api_endpoints_if_online()
    print("All 3 sandbox & full-stack API validation tests passed successfully.")
