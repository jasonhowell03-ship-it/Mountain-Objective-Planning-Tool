/* Complete, compact planning brief. One export path; no legacy PDF injections. */
(()=>{
 let exporting=false;
 window.downloadPlanPdf=async function(){
  if(exporting)return;exporting=true;
  const buttons=[...document.querySelectorAll('button[onclick="downloadPlanPdf()"]')];buttons.forEach(b=>b.disabled=true);
  try{
   if(typeof save==='function')save();
   if(!window.jspdf)throw Error('PDF engine did not load. Refresh while online and try again.');
   const d=new window.jspdf.jsPDF({unit:'pt',format:'letter',compress:true}),M=34,R=578,B=744,W=R-M;let y=36;
   const el=id=>document.getElementById(id),raw=id=>String(el(id)?.value??'').trim();
   const value=id=>{const e=el(id);return e?.tagName==='SELECT'?(e.value?e.options[e.selectedIndex]?.text||e.value:''):raw(id)};
   const used=new Set(),pack={version:5,kind:'plan',data:{},riskData:{}};
   const controls=[...document.querySelectorAll('#plan input[id],#plan select[id],#plan textarea[id]')];
   controls.filter(e=>e.type!=='file').forEach(e=>pack.data[e.id]=e.value);
   const font=(bold=false,size=9)=>{d.setFont('helvetica',bold?'bold':'normal');d.setFontSize(size);d.setTextColor('#243746')};
   const page=()=>{d.addPage();y=36};const need=n=>{if(y+n>B)page()};
   const wrap=(text,width)=>{font();return String(text).split('\n').flatMap(line=>d.splitTextToSize(line||' ',width))};
   const heading=text=>{need(48);y+=5;d.setFillColor('#17374d');d.rect(M,y,W,19,'F');font(true,10);d.setTextColor('#ffffff');d.text(text,M+7,y+13);y+=28};
   const row=(label,text)=>{
    const content=String(text??'').trim();if(!content)return;
    const labels=wrap(label,113),lines=wrap(content,W-129);let offset=0,first=true;
    while(offset<lines.length){need(Math.max(22,first?labels.length*11:22));const count=Math.max(1,Math.floor((B-y-5)/11));const part=lines.slice(offset,offset+count);
     font(true,8);d.text(first?labels:[label+' (cont.)'],M,y);font();d.text(part,M+129,y);
     // Preserve clickable URLs without printing a duplicate link list.
     part.forEach((line,i)=>{for(const m of line.matchAll(/https?:\/\/[^\s<>]+/g)){const url=m[0].replace(/[),.;]+$/,'');d.link(M+129,y+i*11-8,W-129,11,{url});}});
     y+=Math.max(part.length,first?labels.length:1)*11+5;offset+=part.length;first=false;if(offset<lines.length)page();
    }
   };
   const field=(id,label,always=false)=>{used.add(id);row(label,value(id)||(always?'Not entered':''))};
   font(true,17);d.text('MOUNTAIN OBJECTIVE PLAN',M,y);y+=19; font(false,9);d.text('COMPLETE PLAN / BRIEFING COPY',M,y);y+=15;
   heading('1. Objective & Team');field('name','Objective',true);field('env','Environment',true);field('loc','Location',true);
   used.add('sd');used.add('ed');row('Dates',[raw('sd'),raw('ed')].filter(Boolean).join(' to ')||'Not entered');field('lead','Team Lead',true);field('team','Team Members',true);
   heading('2. Route, Timing & Decision Plan');
   for(const [id,label] of [['routeDistance','Distance'],['elevationGain','Elevation Gain']]){const unit=id==='routeDistance'?'routeDistanceUnit':'elevationUnit';used.add(id);used.add(unit);if(raw(id))row(label,raw(id)+' '+(raw(unit)||''));}
   [['maplink','Primary Map / Route'],['altmaplink','Alternate / Bail Map'],['maplinks','Additional Map Links'],['mapnotes','Map / Route Notes'],['route','Route / Decision Plan'],['abort','Abort / Turnaround'],['cont','Contingency / Retreat']].forEach(([id,label])=>field(id,label,['route','abort','cont'].includes(id)));
   heading('3. Weather, Conditions & Objective Hazards');
   [['weatherdate','Forecast Retrieved'],['weathervalid','Valid Through'],['trend','Weather Trend'],['light','Lightning'],['weather','Assessment / So What?'],['weatherlink','Weather Source'],['weatherlinks','Additional Sources'],['haz','Primary Hazard'],['danger','Hazard / Controls']].forEach(([id,label])=>field(id,label,['weather','danger'].includes(id)));
   heading('4. Equipment');[['gearIndividual','Individual'],['gearTeam','Team'],['gearSpecialty','Specialty']].forEach(([id,label])=>field(id,label,true));
   heading('5. Medical, Rescue & Communications');field('med','Medical / Rescue',true);
   const pace=[['paceP','Primary'],['paceA','Alternate'],['paceC','Contingency'],['paceE','Emergency']];pace.forEach(([id])=>used.add(id));row('PACE',pace.map(([id,label])=>label+': '+(value(id)||'Not entered')).join(' | '));field('comms','Frequencies / Contacts',true);
   let assessment=null;if(typeof window.mopRiskAssessment==='function')assessment=window.mopRiskAssessment();
   used.add('photonotes');
   const extras=controls.filter(e=>e.type!=='file'&&!used.has(e.id));
   let stored={};try{stored=JSON.parse(localStorage.getItem('mopRiskData')||'{}')}catch(_){}
   const riskControls=extras.filter(e=>/^(tl_|rd_|wx_|rt_|hz_|med_|cm_|av_|mit_|res_|rock_|ice_|ski_|sm_)/.test(e.id));
   if(assessment||riskControls.length||Object.keys(stored).length){heading('6. Risk Assessment');
    if(assessment){row('Overall Risk',assessment.overall);for(const [name,item] of Object.entries(assessment.items||{}))row(name,item.label+(item.why?' — '+item.why:''));}
    const labelFor=e=>{const prev=e.previousElementSibling;return prev?.tagName==='LABEL'?prev.textContent.trim():e.id.replace(/_/g,' ')};
    for(const e of riskControls){used.add(e.id);pack.riskData[e.id]=e.value;row(labelFor(e),value(e.id));}
    // Include saved controls when their dynamically rendered card is unavailable.
    for(const [id,text] of Object.entries(stored)){if(el(id)||!String(text??'').trim())continue;pack.riskData[id]=text;row(id.replace(/_/g,' '),text);}
   }
   const remaining=extras.filter(e=>!used.has(e.id)&&value(e.id));if(remaining.length){heading('Additional Planning Details');for(const e of remaining)field(e.id,e.previousElementSibling?.textContent?.trim()||e.id);}
   const files=controls.filter(e=>e.type==='file').flatMap(e=>[...(e.files||[])].map(file=>({file,label:e.id==='mapfile'?'Map / Route':e.id==='weatherfile'?'Weather / Conditions':'Planning Photo'})));
   if(raw('photonotes')||files.length){heading('Planning References & Photos');field('photonotes','Photo Notes');}
   for(const {file,label} of files){row(label+' File',file.name);if(!file.type.startsWith('image/'))continue;
    const url=URL.createObjectURL(file);try{const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Unsupported image'));im.src=url});
     const scale=Math.min(1,1200/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
     const s=Math.min(W/canvas.width,190/canvas.height),w=canvas.width*s,h=canvas.height*s;need(h+8);d.addImage(canvas.toDataURL('image/jpeg',.85),'JPEG',M,y,w,h,undefined,'FAST');y+=h+8;
    }catch(_){row('Image Reference','Preview unavailable; retain the original file: '+file.name);}finally{URL.revokeObjectURL(url);}
   }
   const pages=d.getNumberOfPages();for(let i=1;i<=pages;i++){d.setPage(i);d.setDrawColor('#bccbd2');d.line(M,758,R,758);font(false,7);d.text('Mountain Objective Planner • Complete Plan Brief',M,772);d.text('Page '+i+' of '+pages,R,772,{align:'right'});}
   const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(pack))));d.setProperties({title:raw('name')||'Mountain Objective Plan',subject:'MOPDATA:'+encoded,author:'Mountain Objective Planner'});
   d.save((raw('name')||'Mountain_Objective').replace(/[^a-z0-9_-]+/gi,'_')+'_Plan_Brief.pdf');if(typeof note==='function')note('Complete plan briefing PDF downloaded.');
  }catch(e){console.error(e);alert('PDF could not be created: '+e.message);}finally{exporting=false;buttons.forEach(b=>b.disabled=false);}
 };
})();
