import crypto from "crypto";
type Sql={query:<T=any>(q:string,p?:any[])=>Promise<T[]>};
type Actor={id:string;organizationId:string;role:"admin"|"engineer"|"reviewer"};
let sql:Sql|null=null,initialized=false;
async function getSql(){if(initialized)return sql;initialized=true;const url=(process.env.DATABASE_URL||process.env.POSTGRES_URL||process.env.NEON_DATABASE_URL||"").trim();if(!url)return null;try{const m=await import("@neondatabase/serverless");sql=m.neon(url) as unknown as Sql;return sql;}catch(e){console.warn("[COMPANY] DB unavailable:",(e as Error).message);return null;}}
const id=(p:string)=>p+"-"+Date.now()+"-"+crypto.randomBytes(4).toString("hex");
const scope=(actor:Actor)=>actor.role==="admin" ? [actor.organizationId] : [actor.organizationId,actor.id];

export async function listCompanies(actor:Actor){
  const db=await getSql(); if(!db)return null;
  return actor.role==="admin"
    ? db.query("SELECT * FROM companies WHERE organization_id=$1 ORDER BY created_at DESC LIMIT 100",[actor.organizationId])
    : db.query("SELECT * FROM companies WHERE organization_id=$1 AND owner_user_id=$2 ORDER BY created_at DESC LIMIT 100",[actor.organizationId,actor.id]);
}
export async function createCompany(x:any,actor:Actor){
  const db=await getSql();if(!db)return null;
  const rows=await db.query("INSERT INTO companies(id,name,description,mission,monthly_budget,governance,owner_user_id,organization_id) VALUES($1,$2,$3,$4,$5,$6::jsonb,$7,$8) RETURNING *",[id("company"),String(x.name||"Unnamed Company"),String(x.description||""),String(x.mission||""),Number(x.monthlyBudget||0),JSON.stringify(x.governance||{}),actor.id,actor.organizationId]);
  return rows[0];
}
export async function listMissions(actor:Actor,companyId?:string){
  const db=await getSql();if(!db)return null;
  const params:any[]=[actor.organizationId];
  let q=actor.role==="admin" ? "SELECT m.* FROM missions m WHERE m.organization_id=$1" : "SELECT m.* FROM missions m WHERE m.organization_id=$1 AND m.owner_user_id=$2";
  if(actor.role!=="admin") params.push(actor.id);
  if(companyId){q+=" AND m.company_id=$"+(params.length+1);params.push(companyId);}
  return db.query(q+" ORDER BY m.created_at DESC LIMIT 100",params);
}
export async function createMission(x:any,actor:Actor){
  const db=await getSql();if(!db)return null;
  const rows=await db.query("INSERT INTO missions(id,company_id,name,objective,status,success_criteria,budget,metadata,owner_user_id,organization_id) SELECT $1,c.id,$3,$4,'queued',$5,$6,$7::jsonb,$8,$9 FROM companies c WHERE c.id=$2 AND c.organization_id=$9 AND ($8=c.owner_user_id OR $10='admin') RETURNING *",[id("mission"),String(x.companyId),String(x.name||"Mission"),String(x.objective||""),String(x.successCriteria||""),Number(x.budget||0),JSON.stringify(x.metadata||{}),actor.id,actor.organizationId,actor.role]);
  return rows[0]||null;
}
export async function getMission(id:string,actor:Actor){
  const db=await getSql();if(!db)return null;
  const rows=await db.query(actor.role==="admin" ? "SELECT * FROM missions WHERE id=$1 AND organization_id=$2" : "SELECT * FROM missions WHERE id=$1 AND organization_id=$2 AND owner_user_id=$3",[id,actor.organizationId,...(actor.role==="admin"?[]:[actor.id])]);
  return rows[0]||null;
}
export async function startMission(id:string,actor:Actor){
  const db=await getSql();if(!db)return null;
  const rows=await db.query(actor.role==="admin" ? "UPDATE missions SET status='running',started_at=COALESCE(started_at,now()),updated_at=now() WHERE id=$1 AND organization_id=$2 RETURNING *" : "UPDATE missions SET status='running',started_at=COALESCE(started_at,now()),updated_at=now() WHERE id=$1 AND organization_id=$2 AND owner_user_id=$3 RETURNING *",actor.role==="admin"?[id,actor.organizationId]:[id,actor.organizationId,actor.id]);
  return rows[0]||null;
}
