import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { jobQueue } from './queue';

export type GoalStatus = 'active' | 'paused' | 'completed' | 'failed';
export interface AutonomousGoal { id:string; name:string; objective:string; intervalMinutes:number; status:GoalStatus; autoApproveSafeTools:boolean; provider?:'gemini'|'ollama'|'agentrouter'; model?:string; nextRunAt:string; lastRunAt?:string; lastJobId?:string; consecutiveFailures:number; createdAt:string; updatedAt:string; }

const DATA_DIR = process.env.AGENTSTATION_DATA_DIR || path.join(process.cwd(), 'data');
const FILE = path.join(DATA_DIR, 'autonomy_goals.json');
const TICK_MS = Number(process.env.AUTONOMY_TICK_MS || 15000);
const MAX_CONCURRENCY = Number(process.env.AUTONOMY_MAX_CONCURRENCY || 2);

class AutonomyScheduler {
 private goals: AutonomousGoal[]=[]; private timer?:NodeJS.Timeout;
 constructor(){
  this.load();
  jobQueue.on('completed', (job:any) => {
    if (job.type !== 'autonomous_mission') return;
    const goalId = job.payload?.goalId;
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;
    goal.consecutiveFailures = 0;
    goal.updatedAt = new Date().toISOString();
    this.save();
  });
  jobQueue.on('failed', (job:any) => {
    if (job.type !== 'autonomous_mission') return;
    const goalId = job.payload?.goalId;
    const goal = this.goals.find(g => g.id === goalId);
    if (!goal) return;
    goal.consecutiveFailures += 1;
    if (goal.consecutiveFailures >= 3) goal.status = 'failed';
    goal.updatedAt = new Date().toISOString();
    this.save();
  });
}
 private load(){try{fs.mkdirSync(DATA_DIR,{recursive:true});if(fs.existsSync(FILE))this.goals=JSON.parse(fs.readFileSync(FILE,'utf8'));}catch(e){console.warn('[AUTONOMY] load failed:',(e as Error).message);this.goals=[];}}
 private save(){fs.mkdirSync(DATA_DIR,{recursive:true});const tmp=FILE+'.tmp';fs.writeFileSync(tmp,JSON.stringify(this.goals,null,2));fs.renameSync(tmp,FILE);}
 start(){if(process.env.AUTONOMY_ENABLED!=='true'||process.env.VERCEL==='1'||this.timer)return;this.tick();this.timer=setInterval(()=>this.tick(),TICK_MS);console.log('[AUTONOMY] scheduler started');}
 stop(){if(this.timer)clearInterval(this.timer);this.timer=undefined;}
 status(){return {enabled:process.env.AUTONOMY_ENABLED==='true'&&process.env.VERCEL!=='1',running:Boolean(this.timer),activeGoals:this.goals.filter(g=>g.status==='active').length,runningJobs:jobQueue.getStats().active,maxConcurrency:MAX_CONCURRENCY,heartbeatAt:new Date().toISOString()};}
 list(){return this.goals;}
 create(input:Partial<AutonomousGoal>){const now=new Date();const objective=(input.objective||'').trim();if(!objective)throw new Error('objective is required');const goal:AutonomousGoal={id:input.id||('goal-'+Date.now()+'-'+crypto.randomBytes(3).toString('hex')),name:input.name||'Autonomous Objective',objective,intervalMinutes:Math.max(1,Number(input.intervalMinutes||60)),status:'active',autoApproveSafeTools:input.autoApproveSafeTools!==false,provider:input.provider||'agentrouter',model:input.model,nextRunAt:new Date(now.getTime()+1000).toISOString(),consecutiveFailures:0,createdAt:now.toISOString(),updatedAt:now.toISOString()};this.goals.push(goal);this.save();return goal;}
 update(id:string,patch:Partial<AutonomousGoal>){const goal=this.goals.find(g=>g.id===id);if(!goal)return undefined;Object.assign(goal,patch,{updatedAt:new Date().toISOString()});this.save();return goal;}
 remove(id:string){const n=this.goals.length;this.goals=this.goals.filter(g=>g.id!==id);this.save();return this.goals.length<n;}
 public async tickOnce(){ await this.tick(); return this.status(); }
 private async tick(){const due=this.goals.filter(g=>g.status==='active'&&Date.parse(g.nextRunAt)<=Date.now());for(const goal of due){if(jobQueue.getStats().active>=MAX_CONCURRENCY)break;this.dispatch(goal);}}
 private dispatch(goal:AutonomousGoal){const job=jobQueue.enqueue('autonomous_mission',{goalId:goal.id,objective:goal.objective,autoApproveSafeTools:goal.autoApproveSafeTools,provider:goal.provider,model:goal.model},{maxAttempts:3});goal.lastJobId=job.id;goal.lastRunAt=new Date().toISOString();goal.nextRunAt=new Date(Date.now()+goal.intervalMinutes*60000).toISOString();goal.updatedAt=new Date().toISOString();this.save();}
}
export const autonomy=new AutonomyScheduler();