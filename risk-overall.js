/* A single overall decision shared by the live matrix and PDF export. */
(()=>{
 const levels=['GREEN — LOW RISK','AMBER — MEDIUM RISK','RED — HIGH RISK','BLACK — EXTREME RISK'];
 const colors=['#2f6b46','#b97812','#a33b32','#1f2328'];
 const names={mixedClimbing:'Mixed Climbing',steepSnow:'Steep Snow',timeline:'Timeline',readiness:'Team Readiness',weatherRisk:'Weather',routeRisk:'Route / Terrain',hazardRisk:'Objective Hazards',medicalRisk:'Medical / Rescue',commsRisk:'Communications',avalanche:'Snow / Avalanche',rockAssessment:'Rock Difficulty / Capability',iceAssessment:'Ice Difficulty / Capability',skiAssessment:'Ski Difficulty / Capability',skiMountaineeringTechnical:'Ski Mountaineering Technical'};
 const number=text=>{const m=String(text||'').match(/GREEN|AMBER|RED|BLACK/i);return m?['GREEN','AMBER','RED','BLACK'].indexOf(m[0].toUpperCase()):-1};
 window.mopOverallDecision=function(items){
  const entries=Object.entries(items),known=entries.filter(([,v])=>v.effectiveN>=0),incomplete=entries.some(([,v])=>!v.complete);
  let n=known.length?Math.max(...known.map(([,v])=>v.effectiveN)):-1;
  const ambers=known.filter(([,v])=>v.effectiveN===1);
  const cumulative=n>=0&&n<2&&ambers.length>=3;if(cumulative)n=2;
  const drivers=known.filter(([,v])=>v.effectiveN===n).map(([key])=>names[key]||key);
  let why=n<0?'PENDING: Complete the applicable category criteria before making an overall decision.':cumulative?'RED: Three or more Amber categories combine to elevate overall risk to High.':n===3?'BLACK: '+drivers.join(', ')+' reaches Extreme risk and overrides lower categories.':n===2?'RED: '+drivers.join(', ')+' reaches High risk.':n===1?'AMBER: '+drivers.join(', ')+' reaches Medium risk; no higher category is identified.':'GREEN: All completed category ratings are Low.';
  if(incomplete&&n>=0)why+=' Assessment incomplete: remaining criteria must be completed; this is the highest identified risk so far.';
  return{overall:n<0?'ASSESSMENT PENDING':levels[n],overallN:n,overallColor:n<0?'#60717a':colors[n],overallWhy:why,incomplete,cumulative,drivers};
 };
 const visible=e=>{for(let x=e;x&&x.id!=='plan';x=x.parentElement)if(x.style?.display==='none'||x.hidden)return false;return true};
 const cardFor=key=>document.getElementById(key==='avalanche'?'avalancheCard':key==='rockAssessment'?'rockAssessmentCard':key==='iceAssessment'?'iceAssessmentCard':key==='skiAssessment'?'skiAssessmentCard':key==='skiMountaineeringTechnical'?'skiMountaineeringTechnicalCard':'riskCard_'+key);
 function install(){
  const original=window.mopRiskAssessment;if(!original)return;
  window.mopRiskAssessment=function(){
   const result=original(),items={};
   for(const [key,item] of Object.entries(result.items||{})){
    const card=cardFor(key);if(!card||!visible(card))continue;
    const selects=[...card.querySelectorAll('select')].filter(e=>visible(e)&&!e.id.startsWith('res_'));
    const complete=selects.length>0&&selects.every(e=>e.value);
    const any=selects.some(e=>e.value)||(key==='weatherRisk'&&item.n>0);
    const residual=card.querySelector('select[id^="res_"]');const residualN=number(residual?.value);
    const assessedN=any?item.n:-1,effectiveN=Math.max(assessedN,residualN);
    const why=assessedN<0?'Complete the applicable criteria.':item.why;
    items[key]={...item,n:assessedN,effectiveN,complete,residualN,label:assessedN<0?'ASSESSMENT PENDING':levels[assessedN],color:assessedN<0?'#60717a':colors[assessedN],why};
   }
   return{...result,items,...window.mopOverallDecision(items)};
  };
  const refresh=()=>{
   const r=window.mopRiskAssessment(),overall=document.getElementById('overallRisk'),grid=document.getElementById('riskGrid');
   if(overall){overall.replaceChildren();const b=document.createElement('b');b.style.fontSize='18px';b.textContent=r.overall+(r.incomplete&&r.overallN>=0?' — INCOMPLETE':'');overall.appendChild(b);overall.parentElement.style.borderLeftColor=r.overallColor;
    let bluf=document.getElementById('overallRiskBluf');if(!bluf){bluf=document.createElement('p');bluf.id='overallRiskBluf';bluf.className='small';overall.after(bluf);}bluf.textContent='BLUF: '+r.overallWhy;
   }
   if(grid){grid.replaceChildren();for(const [key,item] of Object.entries(r.items)){const chip=document.createElement('div');chip.className='mopChip';chip.style.borderLeft='6px solid '+(item.effectiveN<0?'#60717a':colors[item.effectiveN]);chip.textContent=(names[key]||key)+' — '+(item.effectiveN<0?'PENDING':levels[item.effectiveN].split(' — ')[0])+(item.complete?'':' / INCOMPLETE');grid.appendChild(chip);}}
   for(const [key,item] of Object.entries(r.items)){const flag=cardFor(key)?.querySelector('.mopRisk');if(flag){flag.style.borderLeftColor=item.color;flag.replaceChildren();const b=document.createElement('b');b.textContent=item.label+(item.n>=0&&!item.complete?' — INCOMPLETE':'');const detail=document.createElement('div');detail.textContent='BLUF: '+item.why;flag.append(b,detail);}}
   try{localStorage.setItem('mopRiskSummary',JSON.stringify({overall:r.overall,overallWhy:r.overallWhy,incomplete:r.incomplete,assessments:Object.fromEntries(Object.entries(r.items).map(([k,v])=>[k,v.label]))}));}catch(_){}
  };
  let queued=false;const schedule=()=>{if(queued)return;queued=true;setTimeout(()=>{queued=false;refresh();},20)};
  document.addEventListener('input',schedule);document.addEventListener('change',schedule);refresh();
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(install,650));
})();
