/**
 * Behavioral test: mission-scoped SSE events must only reach clients that are
 * authorized for that mission. Run with:
 *
 *   npx tsx tests/streaming_isolation.ts
 *
 * Exits 0 on success, 1 on failure.
 */
import { streaming } from '../server/streaming';
import { db, UserRecord } from '../server/db';

const OWNER: UserRecord = {
  id: 'sec-owner-01',
  email: 'sec-owner@example.invalid',
  name: 'Owner',
  role: 'engineer',
  avatar: '',
  organizationId: 'org-sec-a',
  createdAt: new Date().toISOString(),
};

const OTHER: UserRecord = {
  id: 'sec-other-01',
  email: 'sec-other@example.invalid',
  name: 'Other Tenant',
  role: 'engineer',
  avatar: '',
  organizationId: 'org-sec-b',
  createdAt: new Date().toISOString(),
};

const MISSION_ID = 'sec-mission-isolation-01';

function fakeResponse() {
  const writes: string[] = [];
  const res: any = {
    writes,
    setHeader() {},
    flushHeaders() {},
    write(chunk: string) {
      writes.push(chunk);
      return true;
    },
    on() {},
  };
  return res;
}

function main() {
  db.addUser(OWNER);
  db.addUser(OTHER);
  db.upsertMission({
    id: MISSION_ID,
    userId: OWNER.id,
    organizationId: OWNER.organizationId,
    prompt: 'isolation test',
    status: 'running',
    createdAt: new Date().toISOString(),
  });

  const ownerRes = fakeResponse();
  const otherRes = fakeResponse();
  const anonRes = fakeResponse();

  streaming.registerClient('c-owner', ownerRes, OWNER);
  streaming.registerClient('c-other', otherRes, OTHER);
  streaming.registerClient('c-anon', anonRes); // no authenticated user

  ownerRes.writes.length = 0;
  otherRes.writes.length = 0;
  anonRes.writes.length = 0;

  streaming.streamAgentThought(MISSION_ID, 'Atlas', 'secret-plan-for-owner-only');

  const ownerGot = ownerRes.writes.join('').includes('secret-plan-for-owner-only');
  const otherGot = otherRes.writes.join('').includes('secret-plan-for-owner-only');
  const anonGot = anonRes.writes.join('').includes('secret-plan-for-owner-only');

  const failures: string[] = [];
  if (!ownerGot) failures.push('authorized owner did NOT receive the mission event');
  if (otherGot) failures.push('CROSS-TENANT LEAK: another tenant received the mission event');
  if (anonGot) failures.push('LEAK: an unauthenticated client received the mission event');

  // Broadcast events without a channel (global heartbeats) must still reach all.
  ownerRes.writes.length = 0;
  otherRes.writes.length = 0;
  ownerRes.writes.length = 0;
  streaming.broadcast({ type: 'heartbeat', data: { n: 1 }, timestamp: new Date().toISOString() } as any);
  const ownerGotGlobal = ownerRes.writes.join('').includes('heartbeat');
  const otherGotGlobal = otherRes.writes.join('').includes('heartbeat');
  if (!ownerGotGlobal) failures.push('owner did not receive the global heartbeat');
  if (!otherGotGlobal) failures.push('other client did not receive the global heartbeat');

  if (failures.length) {
    console.error('FAIL: streaming isolation');
    for (const f of failures) console.error('  -', f);
    process.exit(1);
  }

  console.log('PASS: streaming isolation — mission events reach only the authorized owner;');
  console.log('      cross-tenant and unauthenticated clients received nothing;');
  console.log('      global (channel-less) events still broadcast to everyone.');
  process.exit(0);
}

main();
