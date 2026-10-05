/* Mountain Objective Planner — clean PDF baseline */
async function mopImageData(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve({data:r.result,name:file.name,w:0,h:0});r.onerror=reject;r.readAsDataURL(file)})}
function mopPack(o){const copy={version:5,kind:'plan',data:{}};if(typeof ids!=='undefined')ids.forEach(k=>copy.data[k]=o[k]||'');return btoa(unescape(encodeURIComponent(JSON.stringify(copy))))}
let mopPendingImport=null;
async function mopReadPdfData(file){const bytes=new Uint8Array(await file.arrayBuffer());let raw='';for(let i=0;i<bytes.length;i+=32768)raw+=String.fromCharCode.apply(null,bytes.subarray(i,Math.min(i+32768,bytes.length)));const m=raw.match(/MOPDATA:([A-Za-z0-9+/=]+)/);if(!m)throw new Error('No reusable plan data found');const pack=JSON.parse(decodeURIComponent(escape(atob(m[1]))));if(!pack?.data)throw new Error('Invalid plan data');return pack}
function mopApplyPdfImport(){if(!mopPendingImport)return;const x=mopPendingImport.data||{};if(typeof ids!=='undefined')ids.forEach(k=>{const e=document.getElementById(k);if(e&&x[k]!=null&&!['sustain','improve','lessons'].includes(k))e.value=x[k]});if(typeof logs!=='undefined')logs=[];if(typeof render==='function')render();if(typeof save==='function')save();if(typeof tab==='function')tab('plan');document.getElementById('mopImportChoices')?.classList.add('hide');mopPendingImport=null}
async function mopPdf(){
 try{
  if(typeof save==='function')save();
  if(!window.jspdf)throw new Error('PDF engine did not load. Refresh while online and try again.');
  const {jsPDF}=window.jspdf,d=new jsPDF({unit:'pt',format:'letter'}),H=792,M=44,R=568,B=48;let y=44,p=1;
  const v=id=>document.getElementById(id)?.value?.trim?.()||'';
  const s=id=>{const e=document.getElementById(id);return e?.options?.[e.selectedIndex]?.text||v(id)||'—'};
  const footer=()=>{d.setFont('helvetica','normal');d.setFontSize(7);d.setTextColor(100);d.text('Mountain Objective Plan',M,H-20);d.text('Page '+p,R,H-20,{align:'right'})};
  const page=()=>{footer();d.addPage();p++;y=44};
  const ensure=h=>{if(y+h>H-B)page()};
  const heading=t=>{ensure(30);d.setFont('helvetica','bold');d.setFontSize(12);d.setTextColor(23,55,77);d.text(t,M,y);y+=18;d.setDrawColor(190);d.line(M,y,R,y);y+=10};
  const field=(label,value)=>{const lines=d.splitTextToSize(String(value||'—'),R-M),lh=11;ensure(18+lines.length*lh);d.setFont('helvetica','bold');d.setFontSize(8);d.setTextColor(90);d.text(label.toUpperCase(),M,y);y+=11;d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(30);d.text(lines,M,y);y+=lines.length*lh+10};
  d.setFont('helvetica','bold');d.setFontSize(20);d.setTextColor(23,55,77);d.text('MOUNTAIN OBJECTIVE PLAN',M,y);y+=28;d.setFontSize(14);d.text(v('name')||'Untitled Objective',M,y);y+=20;d.setFont('helvetica','normal');d.setFontSize(9);d.text(s('env')+' | '+(v('loc')||'—')+' | '+(v('sd')||'—')+' to '+(v('ed')||'—'),M,y);y+=24;
  heading('Objective & Team');field('Team Lead',v('lead'));field('Team Members',v('team'));
  heading('Risk');field('Overall Risk',document.getElementById('overallRisk')?.textContent?.trim()||'Assessment pending');
  heading('Weather & Conditions');field('Forecast / Conditions',v('weather'));field('Weather Source',v('weatherlink'));field('Additional Weather Links',v('weatherlinks'));
  heading('Route & Decisions');field('Primary Route / Map',v('maplink'));field('Alternate / Bail Route',v('altmaplink'));field('Route / Map Notes',v('mapnotes'));field('Route & Decision Plan',v('route'));field('Abort Criteria / Turnaround',v('abort'));field('Contingency / Retreat',v('cont'));
  heading('Hazards');field('Most Dangerous Part',s('haz')+(v('danger')?' — '+v('danger'):''));
  heading('Medical & Communications');field('Medical / Rescue Plan',v('med'));field('PACE','Primary: '+s('paceP')+'\nAlternate: '+s('paceA')+'\nContingency: '+s('paceC')+'\nEmergency: '+s('paceE'));field('Communications Notes',v('comms'));
  heading('Equipment');field('Individual',v('gearIndividual'));field('Team',v('gearTeam'));field('Specialty',v('gearSpecialty'));
  footer();
  const o=typeof data==='function'?data():{};try{d.setProperties({title:o.name||'Mountain Objective Plan',subject:'MOPDATA:'+mopPack(o),author:'Mountain Objective Planner'})}catch(_){}
  d.save((typeof safe==='function'?safe():'Mountain_Objective')+'_Plan.pdf');
  if(typeof note==='function')note('Plan PDF downloaded.');
 }catch(e){console.error(e);alert('PDF could not be created: '+e.message)}
}
