/* Separate mixed-climbing and steep-snow categories for Mixed Climb / Other. */
(()=>{
 const $=id=>document.getElementById(id),v=id=>$(id)?.value||'';
 const LAB=['GREEN — LOW RISK','AMBER — MEDIUM RISK','RED — HIGH RISK','BLACK — EXTREME RISK'],COL=['#2f6b46','#b97812','#a33b32','#1f2328'];
 const M=Array.from({length:12},(_,i)=>'M'+(i+1)).concat('M13+');
 const SN=['< 30° — Low angle','30–34° — Moderate','35–39° — Steep','40–44° — Very steep','45–49° — Extreme','50–54° — Extreme / highly consequential','55°+ — Extreme / highly consequential'];
 const EXP=['Low consequence / good runout','Moderate consequence','High consequence / no-fall terrain','Extreme consequence / fall likely catastrophic'];
 const MARGIN=['Comfortably exceeds objective','Meets objective with margin','At limit','Below objective requirement'];
 const active=()=>v('env')==='Mixed Climb / Other';
 const sel=(id,label,options)=>`<label>${label}</label><select id="${id}"><option value="">Select…</option>${options.map(s=>`<option>${s.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</option>`).join('')}</select>`;
 const text=(id,label)=>`<label>${label}</label><textarea id="${id}"></textarea>`;
 const residual=key=>`<div class="mopResidual"><b>Mitigation / Residual Risk</b>${text('mit_'+key,'Mitigation / controls')}${sel('res_'+key,'Residual Risk',['GREEN — Low','AMBER — Medium','RED — High','BLACK — Extreme'])}</div>`;
 function calc(key){
  const mixed=key==='mixedClimbing',prefix=mixed?'mx':'ss',scale=mixed?M:SN;
  const route=scale.indexOf(v(prefix+'_route')),crux=scale.indexOf(v(prefix+'_crux')),cap=scale.indexOf(v(prefix+'_team'));
  let n=0,why=[];
  for(const [label,grade] of [['Route',route],['Crux',crux]]){
   if(!mixed&&grade>=0)n=Math.max(n,grade<=1?0:grade===2?1:grade===3?2:3);
   if(grade>=0&&cap>=0){const gap=grade-cap;n=Math.max(n,gap>0?3:gap===0?2:gap===-1?1:0);if(gap>0)why.push(label+' difficulty exceeds demonstrated team capability.');else if(gap===0)why.push(label+' is at demonstrated team capability.');}
  }
  const exposure=EXP.indexOf(v(prefix+'_exposure'));if(exposure>=0){n=Math.max(n,exposure);if(exposure>=2)why.push(exposure===3?'Extreme fall consequence.':'High-consequence / no-fall terrain.');}
  if(mixed){const protection=v('mx_protection');if(protection==='Poor / difficult protection')n=Math.max(n,2);if(protection==='Unprotectable / protection unreliable'){n=3;why.push('Protection is unreliable or unavailable.');}}
  else{const surface=v('ss_surface');if(surface==='Firm / icy / insecure footing')n=Math.max(n,2);if(surface==='Unable to maintain secure movement'){n=3;why.push('Secure movement cannot be maintained.');}}
  if(v(prefix+'_margin')==='At limit')n=Math.max(n,2);
  if(v(prefix+'_margin')==='Below objective requirement'){n=3;why.push('Team capability is below objective requirements.');}
  return{n,label:LAB[n],color:COL[n],why:why.join(' ')||(mixed?'Mixed grades, team capability, protection, and consequence are within the selected margin.':'Snow angle, team capability, footing, and fall consequence are within the selected margin.')};
 }
 function inject(){
  if(!$('riskCard_routeRisk')||$('riskCard_mixedClimbing'))return;
  const bodies={mixedClimbing:sel('mx_route','Maximum sustained mixed climbing grade',M)+sel('mx_crux','Crux mixed climbing grade',M)+sel('mx_team','Least-capable required leader — demonstrated mixed lead capability',M)+sel('mx_protection','Mixed climbing protection',['Good / reliable protection','Generally adequate protection','Poor / difficult protection','Unprotectable / protection unreliable'])+sel('mx_exposure','Mixed climbing fall consequence',EXP)+sel('mx_margin','Mixed climbing team margin',MARGIN)+text('mx_notes','Mixed route / crux notes'),steepSnow:sel('ss_route','Maximum sustained steep-snow angle',SN)+sel('ss_crux','Steepest / crux snow angle',SN)+sel('ss_team','Least-capable member — demonstrated steep-snow climbing angle',SN)+sel('ss_surface','Snow surface / footing',['Secure / predictable footing','Variable footing / localized difficulty','Firm / icy / insecure footing','Unable to maintain secure movement'])+sel('ss_exposure','Steep-snow fall consequence',EXP)+sel('ss_margin','Steep-snow team margin',MARGIN)+text('ss_notes','Steep-snow route / crux notes')};
  for(const [key,body] of Object.entries(bodies)){
   const card=document.createElement('div');card.className='card';card.id='riskCard_'+key;
   card.innerHTML=`<h3>${key==='mixedClimbing'?'Mixed Climbing Difficulty & Team Capability':'Steep Snow Climbing & Team Capability'}</h3><div class="mopRisk" id="risk_${key}"><b>ASSESSMENT PENDING</b></div>${body}${residual(key)}`;
   $('riskCard_routeRisk').before(card);
  }
  const base=window.mopRiskAssessment;
  window.mopRiskAssessment=()=>{const r=base();if(active())for(const key of Object.keys(bodies))r.items[key]=calc(key);return r};
  const show=()=>{for(const key of Object.keys(bodies))$('riskCard_'+key).style.display=active()?'block':'none'};
  $('env').addEventListener('change',show);show();
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(inject,340));
})();
