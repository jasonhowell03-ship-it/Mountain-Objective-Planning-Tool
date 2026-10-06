let mopPendingImport=null;
async function mopLoadPdfJs(){if(window.pdfjsLib)return window.pdfjsLib;await new Promise((res,rej)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';s.onload=res;s.onerror=rej;document.head.appendChild(s)});window.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';return window.pdfjsLib}
async function mopPdfText(file){const lib=await mopLoadPdfJs(),doc=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;let pages=[];for(let p=1;p<=doc.numPages;p++){const page=await doc.getPage(p),tc=await page.getTextContent(),items=tc.items.map(x=>({s:x.str,x:x.transform[4],y:x.transform[5]})).filter(x=>x.s.trim());items.sort((a,b)=>Math.abs(b.y-a.y)>2?b.y-a.y:a.x-b.x);let lines=[];for(const it of items){let l=lines.find(z=>Math.abs(z.y-it.y)<2);if(!l){l={y:it.y,a:[]};lines.push(l)}l.a.push(it)}lines.sort((a,b)=>b.y-a.y);pages.push(lines.map(l=>l.a.sort((a,b)=>a.x-b.x).map(x=>x.s).join(' ').trim()).join('\n'))}return pages.join('\n')}
function mopCleanLegacyText(t){return t.replace(/Mountain Objective Planner\s+Page\s+\d+\s+of\s+\d+/gi,'').replace(/OPEN A FRESH MOUNTAIN OBJECTIVE PLAN/gi,'').replace(/\n{3,}/g,'\n\n').trim()}
function mopSection(t,start,ends){const a=t.toUpperCase().indexOf(start);if(a<0)return'';let from=a+start.length,to=t.length;for(const e of ends){const p=t.toUpperCase().indexOf(e,from);if(p>=0&&p<to)to=p}return t.slice(from,to).trim().replace(/^[-—\s]+$/gm,'').trim()}
function mopParseLegacy(t){t=mopCleanLegacyText(t);if(!/MOUNTAIN OBJECTIVE\s*[—-]\s*(PLAN|FINAL RECORD)/i.test(t))throw new Error('Not planner PDF');const lines=t.split('\n').map(x=>x.trim()).filter(Boolean),titleIdx=lines.findIndex(x=>/MOUNTAIN OBJECTIVE\s*[—-]/i.test(x)),d={};d.name=lines[titleIdx+1]||'';const meta=lines[titleIdx+2]||'',mm=meta.match(/(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})\s*\|\s*(.*?)\s*\|\s*(.+)$/);if(mm){d.sd=mm[1];d.ed=mm[2];d.loc=mm[3];d.env=mm[4]}const team=mopSection(t,'OBJECTIVE & TEAM',['MAPS / PRE-BUILT ROUTE DATA']);d.lead=(team.match(/Team Lead:\s*([^\n]*)/i)||[])[1]||'';d.team=(team.match(/Team Members:\s*([\s\S]*)/i)||[])[1]?.trim()||'';let maps=mopSection(t,'MAPS / PRE-BUILT ROUTE DATA',['WEATHER / CONDITIONS DATA']);const urls=[...maps.matchAll(/https?:\/\/\S+/g)].map(x=>x[0]);d.maplink=urls[0]||'';d.altmaplink=urls[1]||'';d.maplinks=urls.slice(2).join('\n');d.mapnotes=maps.replace(/OPEN PRIMARY ROUTE \/ MAP/gi,'').replace(/OPEN ALTERNATE \/ BAIL ROUTE/gi,'').replace(/ADDITIONAL ROUTE LINK[^\n]*/gi,'').replace(/https?:\/\/\S+/g,'').trim();let w=mopSection(t,'WEATHER / CONDITIONS DATA',['MOST DANGEROUS PART OF OBJECTIVE']);d.weatherdate=(w.match(/Forecast retrieved:\s*([^\n]+)/i)||[])[1]||'';d.weathervalid=(w.match(/Valid through:\s*([^\n]+)/i)||[])[1]||'';const tl=w.match(/\b(Stable|Improving|Deteriorating|Uncertain)\s*\|\s*(Lightning:\s*(?:Low|Possible|Likely))/i);if(tl){d.trend=tl[1];d.light=tl[2]}const wurls=[...w.matchAll(/https?:\/\/\S+/g)].map(x=>x[0]);d.weatherlink=wurls[0]||'';d.weatherlinks=wurls.slice(1).join('\n');d.weather=w.replace(/Forecast retrieved:[^\n]*/i,'').replace(/Valid through:[^\n]*/i,'').replace(/\b(Stable|Improving|Deteriorating|Uncertain)\s*\|\s*Lightning:\s*(Low|Possible|Likely)/i,'').replace(/OPEN PRIMARY WEATHER \/ CONDITIONS SOURCE/gi,'').replace(/ADDITIONAL WEATHER LINK[^\n]*/gi,'').replace(/https?:\/\/\S+/g,'').trim();let danger=mopSection(t,'MOST DANGEROUS PART OF OBJECTIVE',['ROUTE & DECISION PLAN']);const dl=danger.split('\n');d.haz=dl.shift()||'';d.danger=dl.join('\n').trim();let route=mopSection(t,'ROUTE & DECISION PLAN',['ABORT CRITERIA / TURNAROUND']);let dm=route.match(/Distance:\s*([\d.]+)\s*(mi|km)/i),em=route.match(/Elevation Gain:\s*([\d,.]+)\s*(ft|m)/i);if(dm){d.routeDistance=dm[1];d.routeDistanceUnit=dm[2].toLowerCase()}if(em){d.elevationGain=em[1].replace(/,/g,'');d.elevationUnit=em[2].toLowerCase()}d.route=route.replace(/Distance:[^\n]*/i,'').replace(/Elevation Gain:[^\n]*/i,'').replace(/^[-—\s]+$/gm,'').trim();d.abort=mopSection(t,'ABORT CRITERIA / TURNAROUND',['CONTINGENCY / RETREAT']);d.cont=mopSection(t,'CONTINGENCY / RETREAT',['PACKING LIST / EQUIPMENT']);let gear=mopSection(t,'PACKING LIST / EQUIPMENT',['MEDICAL / RESCUE','MEDICAL / RESCUE PLAN']),gm=gear.match(/INDIVIDUAL:\s*([\s\S]*?)\s*TEAM:\s*([\s\S]*?)\s*SPECIALTY:\s*([\s\S]*)/i);if(gm){d.gearIndividual=gm[1].trim();d.gearTeam=gm[2].trim();d.gearSpecialty=gm[3].trim()}else d.gearIndividual=gear;d.med=mopSection(t,t.toUpperCase().includes('MEDICAL / RESCUE PLAN')?'MEDICAL / RESCUE PLAN':'MEDICAL / RESCUE',['COMMUNICATIONS / PACE']);let comm=mopSection(t,'COMMUNICATIONS / PACE',['DOWNLOADED / ATTACHED PLANNING FILES','PLANNING PHOTOS / IMAGES','PLANNING PHOTO NOTES','EXECUTION / FIELD LOG','AAR — SUSTAIN','AAR - SUSTAIN']);const pm=comm.match(/PRIMARY:\s*([^\n]*)[\s\S]*?ALTERNATE:\s*([^\n]*)[\s\S]*?CONTINGENCY:\s*([^\n]*)[\s\S]*?EMERGENCY:\s*([^\n]*)/i);if(pm){d.paceP=pm[1].trim();d.paceA=pm[2].trim();d.paceC=pm[3].trim();d.paceE=pm[4].trim();d.comms=comm.replace(/PRIMARY:[^\n]*/i,'').replace(/ALTERNATE:[^\n]*/i,'').replace(/CONTINGENCY:[^\n]*/i,'').replace(/EMERGENCY:[^\n]*/i,'').trim()}else d.comms=comm;['sustain','improve','lessons'].forEach(k=>d[k]='');return{version:1,kind:'plan',legacy:true,data:d}}
const mopRiskId=id=>/^(tl_|rd_|wx_|rt_|hz_|med_|cm_|av_|mit_|res_|rock_|ice_|ski_|sm_|mx_|ss_)/.test(id);
const mopControls=()=>[...document.querySelectorAll('#plan input[id],#plan select[id],#plan textarea[id]')].filter(e=>e.type!=='file');
const mopNormalize=s=>String(s||'').toLowerCase().replace(/[—–]/g,'-').replace(/[^a-z0-9]+/g,' ').trim();
const mopLabels={name:'Objective',env:'Environment',sd:'Start Date',ed:'End Date',loc:'Location',lead:'Team Lead',team:'Team Members',haz:'Primary Hazard',danger:'Hazard Assessment',route:'Route / Decision Plan',photonotes:'Photo Notes',paceP:'Primary',paceA:'Alternate',paceC:'Contingency',paceE:'Emergency'};
function mopFieldLabel(e){return e.previousElementSibling?.tagName==='LABEL'?e.previousElementSibling.textContent.trim():mopLabels[e.id]||e.id.replace(/_/g,' ')}
async function mopRecoverPrintedFields(file){
 const lib=await mopLoadPdfJs(),pdf=await lib.getDocument({data:new Uint8Array(await file.arrayBuffer())}).promise;
 const cards=[...document.querySelectorAll('#plan > .card')],schema=cards.map(card=>({title:mopNormalize(card.querySelector('h3')?.textContent||'Objective & Team'),fields:[...card.querySelectorAll('input[id],select[id],textarea[id]')].filter(e=>e.type!=='file')}));
 const recovered={};let current=null,active=null,pending='';
 for(let p=1;p<=pdf.numPages;p++){
  const tc=await (await pdf.getPage(p)).getTextContent(),rows=[];
  for(const it of tc.items){if(!it.str?.trim())continue;const y=it.transform[5];let row=rows.find(r=>Math.abs(r.y-y)<2);if(!row){row={y,items:[]};rows.push(row)}row.items.push({text:it.str,x:it.transform[4]});}
  for(const row of rows.sort((a,b)=>b.y-a.y)){
   row.items.sort((a,b)=>a.x-b.x);const text=row.items.map(i=>i.text).join(' '),n=mopNormalize(text);
   if(/mountain objective planner|page \d+ of \d+/i.test(text))continue;
   const section=schema.find(s=>s.title===n);if(section){current=section;active=null;pending='';continue;}
   const left=row.items.filter(i=>i.x<155).map(i=>i.text).join(' ').trim(),right=row.items.filter(i=>i.x>=155).map(i=>i.text).join(' ').trim();
   if(/^(green|amber|red|black|pending|assessment basis|overall|reassessment)/i.test(left)){active=null;pending='';continue;}
   if(/^residual risk\s*:/i.test(text)&&current){const e=current.fields.find(e=>e.id.startsWith('res_'));if(e)recovered[e.id]=text.replace(/^residual risk\s*:/i,'').trim();continue;}
   const fields=current?.fields||mopControls();const combined=mopNormalize([pending,left].filter(Boolean).join(' '));
   const field=fields.find(e=>mopNormalize(mopFieldLabel(e))===combined)||fields.find(e=>mopNormalize(mopFieldLabel(e))===mopNormalize(left));
   if(field){active=field.id;pending='';if(right)recovered[active]=(recovered[active]?recovered[active]+'\n':'')+right;}
   else if(left&&fields.some(e=>mopNormalize(mopFieldLabel(e)).startsWith(combined))){pending=[pending,left].filter(Boolean).join(' ');if(right){const e=fields.find(e=>mopNormalize(mopFieldLabel(e)).startsWith(combined));active=e.id;recovered[active]=right;}}
   else if(right&&active){recovered[active]=(recovered[active]||'')+'\n'+right;}
  }
 }
 await pdf.destroy();return recovered;
}
async function mopReadPdfData(file){
 const bytes=new Uint8Array(await file.arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode(...bytes.subarray(i,i+32768));
 const match=raw.match(/MOPDATA:([A-Za-z0-9+/=]+)/);let pack=null;
 if(match){try{pack=JSON.parse(decodeURIComponent(escape(atob(match[1]))));}catch(_){}}
 if(!pack?.data||!pack.version){const text=await mopPdfText(file);if(!/MOUNTAIN OBJECTIVE/i.test(text))throw Error('This file is not a Mountain Objective Planner PDF.');try{pack=mopParseLegacy(text)}catch(_){pack={version:1,kind:'plan',legacy:true,data:{}}}Object.assign(pack.data,await mopRecoverPrintedFields(file));}
 else if(!Object.keys({...pack.data,...pack.riskData}).some(mopRiskId)){try{Object.assign(pack.data,await mopRecoverPrintedFields(file));}catch(_){pack.incompleteRisk=true;}}
 pack.data={...pack.data,...pack.riskData};return pack;
}
function mopSetValue(e,text){
 text=String(text??'').trim();if(/^(not entered|assessment pending|—|-|select…)$/i.test(text))text='';
 if(e.id==='env'&&text==='Ice')text='Ice Climb';
 if(e.id==='env'&&text==='High Altitude')text='Mountain Expedition';
 if(e.id==='env'&&text==='Mixed / Other')text='Mixed Climb / Other';
 if(e.tagName==='SELECT'){let option=[...e.options].find(o=>o.value===text)||[...e.options].find(o=>mopNormalize(o.text)===mopNormalize(text));if(!option&&text){option=[...e.options].find(o=>mopNormalize(o.text).startsWith(mopNormalize(text)));}if(!option&&text){option=document.createElement('option');option.value=text;option.textContent=text;e.appendChild(option);}e.value=option?.value||'';}
 else e.value=text;
}
function mopSnapshot(){const data={};mopControls().forEach(e=>data[e.id]=e.value);localStorage.setItem('mopCompletePlanDraft',JSON.stringify(data));const risk={};Object.entries(data).filter(([id])=>mopRiskId(id)).forEach(([id,v])=>risk[id]=v);localStorage.setItem('mopRiskData',JSON.stringify(risk));}
function mopApplyPdfImport(){
 if(!mopPendingImport)return;const pack=mopPendingImport,data=pack.data||{};
 mopControls().forEach(e=>{e.tagName==='SELECT'?e.selectedIndex=0:e.value='';if(Object.hasOwn(data,e.id))mopSetValue(e,data[e.id]);else if(mopRiskId(e.id))e.value='';});
 ['sustain','improve','lessons','mapfile','weatherfile','planphoto','photo'].forEach(id=>{const e=document.getElementById(id);if(e)e.value=''});logs=[];render();
 localStorage.removeItem('mopRiskSummary');mopSnapshot();save();tab('plan');
 document.getElementById('env').dispatchEvent(new Event('change',{bubbles:true}));setTimeout(mopSnapshot,100);
 document.getElementById('mopImportChoices').classList.add('hide');document.getElementById('mopPdfDownload')?.remove();
 const count=Object.keys(data).filter(mopRiskId).length;
 note('Historic plan restored with '+count+' risk fields. '+(pack.legacy?'Older PDF: review recovered fields. ':'')+'Execution/AAR starts clean. Reattach source files or photos if needed.');mopPendingImport=null;window.scrollTo({top:0,behavior:'smooth'});
}
window.addEventListener('DOMContentLoaded',()=>{
 setTimeout(()=>{let prior={};try{prior=JSON.parse(localStorage.getItem('mopCompletePlanDraft')||'{}')}catch(_){};mopControls().forEach(e=>{if(Object.hasOwn(prior,e.id))mopSetValue(e,prior[e.id]);});document.getElementById('env')?.dispatchEvent(new Event('change',{bubbles:true}));
 document.addEventListener('input',e=>{if(e.target.closest?.('#plan'))setTimeout(mopSnapshot,0)});document.addEventListener('change',e=>{if(e.target.closest?.('#plan'))setTimeout(mopSnapshot,0)});

 },500);
});
