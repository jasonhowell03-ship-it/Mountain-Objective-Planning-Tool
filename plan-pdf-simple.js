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
   const visible=e=>{for(let n=e;n&&n!==el('plan');n=n.parentElement)if(n.hidden||n.style?.display==='none'||n.classList?.contains('hide'))return false;return true};
   const cards=[...el('plan').children].filter(e=>e.classList.contains('card')||e.id==='riskSummary').filter(visible);
   let assessment=typeof window.mopRiskAssessment==='function'?window.mopRiskAssessment():null;
   const colors={GREEN:'#2f6b46',AMBER:'#b97812',RED:'#a33b32',BLACK:'#1f2328',PENDING:'#60717a'};
   const rank={GREEN:0,AMBER:1,RED:2,BLACK:3};
   const riskCards=cards.filter(c=>c.querySelector('.mopRisk'));
   const ratings=riskCards.map(card=>{
    const flag=card.querySelector('.mopRisk'),key=flag.id.replace('risk_',''),item=assessment?.items?.[key==='smTechnical'?'skiMountaineeringTechnical':key];
    const required=[...card.querySelectorAll('select')].filter(e=>visible(e)&&!e.id.startsWith('res_'));
    const complete=required.every(e=>e.value),any=required.some(e=>e.value);
    const label=any?(item?.label||flag.querySelector('b')?.textContent||'PENDING'):'PENDING — INPUTS NOT ENTERED';
    return{card,key,label,complete,color:colors[(label.match(/GREEN|AMBER|RED|BLACK/)||['PENDING'])[0]],why:item?.why||flag.querySelector('div')?.textContent||''};
   });
   const box=(text,color,width=W,x=M)=>{
    font(true,9);const lines=d.splitTextToSize(text,width-16),h=lines.length*12+12;need(h+5);d.setFillColor(color);d.rect(x,y,width,h,'F');d.setTextColor('#ffffff');d.text(lines,x+8,y+15);y+=h+6;
   };
   const riskSummary=()=>{
    heading('Objective Risk Matrix / Overview');
    let overall=(assessment?.overall?.match(/GREEN|AMBER|RED|BLACK/)||['PENDING'])[0];
    for(const c of riskCards)for(const e of c.querySelectorAll('select[id^="res_"]')){const r=(e.value.match(/GREEN|AMBER|RED|BLACK/)||[])[0];if(r&&(rank[r]??-1)>(rank[overall]??-1))overall=r;}
    const incomplete=ratings.some(r=>!r.complete);
    if(ratings.every(r=>r.label.startsWith('PENDING')))overall='PENDING';
    box('OVERALL: '+overall+(incomplete?' — assessment incomplete':''),colors[overall]);
    font(false,8);d.text('Green = Low | Amber = Medium | Red = High | Black = Extreme',M,y);y+=15;
    for(let i=0;i<ratings.length;i+=2){
     const pair=ratings.slice(i,i+2),width=(W-8)/2;
     const cells=pair.map(r=>{font(true,8);const name=r.card.querySelector('h3')?.textContent||r.key;const text=name+'\n'+r.label+(!r.complete&&!r.label.startsWith('PENDING')?'\nSelected inputs; incomplete':'');const lines=text.split('\n').flatMap(t=>d.splitTextToSize(t,width-16));return{r,lines}});
     const h=Math.max(...cells.map(c=>c.lines.length*11+14));need(h+6);
     cells.forEach(({r,lines},j)=>{const x=M+j*(width+8);d.setFillColor(r.color);d.rect(x,y,width,h,'F');d.setTextColor('#ffffff');d.text(lines,x+8,y+15);});y+=h+6;
    }
    row('Reassessment','Reassess whenever conditions or the plan change. Critical Black conditions override lower categories.');
   };
   const fallback={name:'Objective',env:'Environment',sd:'Start Date',ed:'End Date',loc:'Location',lead:'Team Lead',team:'Team Members',haz:'Primary Hazard',danger:'Hazard Assessment',route:'Route / Decision Plan',photonotes:'Photo Notes',paceP:'Primary',paceA:'Alternate',paceC:'Contingency',paceE:'Emergency'};
   const labelFor=e=>{const label=e.previousElementSibling;if(label?.tagName==='LABEL')return label.textContent.trim();return fallback[e.id]||e.id.replace(/_/g,' ')};
   const renderFile=async e=>{for(const file of e.files||[]){row(labelFor(e)+' File',file.name);if(!file.type.startsWith('image/'))continue;
    const url=URL.createObjectURL(file);try{const image=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Unsupported image'));im.src=url});
     const scale=Math.min(1,1200/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.round(image.width*scale);canvas.height=Math.round(image.height*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);
     const s=Math.min(W/canvas.width,190/canvas.height),w=canvas.width*s,h=canvas.height*s;need(h+8);d.addImage(canvas.toDataURL('image/jpeg',.85),'JPEG',M,y,w,h,undefined,'FAST');y+=h+8;
    }catch(_){row('Image Reference','Preview unavailable; retain the original file: '+file.name);}finally{URL.revokeObjectURL(url);}
   }};
   for(const card of cards){
    if(card.querySelector('button[onclick="openOffline()"]'))continue;
    if(card.id==='riskSummary'){riskSummary();continue;}
    heading(card.querySelector('h3')?.textContent?.trim()||'Objective & Team');
    const rating=ratings.find(r=>r.card===card);
    if(rating){box(rating.label+(!rating.complete&&!rating.label.startsWith('PENDING')?' — incomplete inputs':''),rating.color);if(!rating.label.startsWith('PENDING'))row('Assessment Basis',rating.why);}
    for(const e of card.querySelectorAll('input[id],select[id],textarea[id]')){
     if(!visible(e)||used.has(e.id))continue;used.add(e.id);
     if(e.type==='file'){await renderFile(e);continue;}
     const label=labelFor(e),text=value(e.id)||'Not entered';
     if(rating)pack.riskData[e.id]=e.value;
     if(e.id.startsWith('res_'))box('RESIDUAL RISK: '+text,colors[(text.match(/GREEN|AMBER|RED|BLACK/)||['PENDING'])[0]]);
     else row(label,text);
    }
   }
   const pages=d.getNumberOfPages();for(let i=1;i<=pages;i++){d.setPage(i);d.setDrawColor('#bccbd2');d.line(M,758,R,758);font(false,7);d.text('Mountain Objective Planner • Complete Plan Brief',M,772);d.text('Page '+i+' of '+pages,R,772,{align:'right'});}
   const encoded=btoa(unescape(encodeURIComponent(JSON.stringify(pack))));d.setProperties({title:raw('name')||'Mountain Objective Plan',subject:'MOPDATA:'+encoded,author:'Mountain Objective Planner'});
   const filename=(raw('name')||'Mountain_Objective').replace(/[^a-z0-9_-]+/gi,'_')+'_Plan_Brief.pdf';
   const encodedPdf=d.output('datauristring').split(',')[1];
   // A same-window form response with Content-Disposition: attachment avoids blob preview tabs.
   let panel=el('mopPdfDownload');
   if(!panel){panel=document.createElement('div');panel.id='mopPdfDownload';panel.style.cssText='margin:12px 0;padding:14px;background:#fff;border-radius:12px;border:1px solid #bccbd2';el('plan').appendChild(panel);}
   panel.replaceChildren();
   const message=document.createElement('p');message.className='small';message.textContent='Your complete PDF is ready: '+filename;panel.appendChild(message);
   const form=document.createElement('form');form.method='POST';form.action='/api/download-plan';form.target='_self';
   for(const [name,value] of Object.entries({pdf:encodedPdf,filename})){const input=document.createElement('input');input.type='hidden';input.name=name;input.value=value;form.appendChild(input);}
   const button=document.createElement('button');button.type='submit';button.className='btn';button.style.width='100%';button.textContent='DOWNLOAD PDF';form.appendChild(button);panel.appendChild(form);
   if(typeof note==='function')note('PDF download requested. Confirm Download if your phone asks.');
   form.requestSubmit();
  }catch(e){console.error(e);alert('PDF could not be created: '+e.message);}finally{exporting=false;buttons.forEach(b=>b.disabled=false);}
 };
})();
