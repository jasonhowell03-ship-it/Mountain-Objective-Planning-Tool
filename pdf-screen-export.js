/* Visual PDF exporter: capture the LIVE Plan tab exactly as displayed. */
(()=>{
 async function loadHtml2Canvas(){if(window.html2canvas)return window.html2canvas;await new Promise((ok,bad)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';s.onload=ok;s.onerror=bad;document.head.appendChild(s)});return window.html2canvas}
 function collectLinks(src){return[...src.querySelectorAll('a[href],input[type="url"]')].map(a=>({href:a.href||a.value||'',text:a.textContent?.trim()||a.value||''})).filter(x=>/^https?:/i.test(x.href))}
 async function visualPdf(finalMode){if(typeof save==='function')save();if(typeof note==='function')note('Building exact planning-sheet PDF…');if(!window.jspdf)return alert('PDF engine did not load. Refresh while online and try again.');const src=document.getElementById('plan');if(!src)return alert('Plan tab not found.');let hidden=[];try{
   /* Force every assessment to recalculate on the live DOM before capture. */
   src.querySelectorAll('input,select,textarea').forEach(e=>{try{e.dispatchEvent(new Event('change',{bubbles:true}));e.dispatchEvent(new Event('input',{bubbles:true}))}catch(_){}});
   await new Promise(r=>setTimeout(r,250));
   const riskCount=src.querySelectorAll('#riskSummary,.mopOverall,.mopRisk,.mopChip,[id^="riskCard_"],#avalancheCard,#rockAssessmentCard,#iceAssessmentCard,#skiAssessmentCard,#skiMountaineeringAssessmentCard').length;
   if(!riskCount)throw new Error('Risk assessment blocks are not loaded on the Plan tab. Refresh the planner once, allow the risk matrix to appear, then export.');
   /* Capture the live planner—not a clone—so dynamically injected risk cards, inline risk colors, conditional blocks, and their exact order are retained. */
   hidden=[...src.querySelectorAll('.actions,button,input[type="button"],input[type="submit"],input[type="file"]')].map(e=>({e,display:e.style.display}));hidden.forEach(x=>x.e.style.display='none');
   const h2c=await loadHtml2Canvas();
   const canvas=await h2c(src,{scale:2,useCORS:true,backgroundColor:'#eef3f5',logging:false,scrollX:0,scrollY:-window.scrollY,windowWidth:document.documentElement.clientWidth,windowHeight:src.scrollHeight,onclone:doc=>{const p=doc.getElementById('plan');if(p){p.classList.remove('hide');p.querySelectorAll('textarea').forEach(t=>{t.style.height=Math.max(t.scrollHeight,t.offsetHeight)+'px';t.style.overflow='visible'});p.querySelectorAll('.mopRisk,.mopOverall,.mopChip,[id^="riskCard_"]').forEach(x=>{x.style.breakInside='avoid';x.style.pageBreakInside='avoid'})}}});
   hidden.forEach(x=>x.e.style.display=x.display);hidden=[];
   const {jsPDF}=window.jspdf,d=new jsPDF({unit:'pt',format:'letter',compress:true}),PW=612,PH=792,margin=20,usableW=PW-margin*2,usableH=PH-margin*2,scale=usableW/canvas.width,pagePx=Math.floor(usableH/scale);let sy=0,page=0;
   while(sy<canvas.height){const sliceH=Math.min(pagePx,canvas.height-sy),part=document.createElement('canvas');part.width=canvas.width;part.height=sliceH;part.getContext('2d').drawImage(canvas,0,sy,canvas.width,sliceH,0,0,canvas.width,sliceH);if(page++)d.addPage();d.addImage(part.toDataURL('image/jpeg',.94),'JPEG',margin,margin,usableW,sliceH*scale,undefined,'FAST');sy+=sliceH}
   const o=typeof data==='function'?data():{},pack=typeof mopPack==='function'?mopPack(o,!!finalMode):'';if(pack)d.setProperties({title:o.name||'Mountain Objective Plan',subject:'MOPDATA:'+pack,author:'Mountain Objective Planner',creator:'Mountain Objective Planner'});
   const links=collectLinks(src);if(links.length){d.setPage(1);links.forEach((x,i)=>d.link(0,PH-5-(i*.05),1,.04,{url:x.href}))}
   const blob=d.output('blob'),base=typeof safe==='function'?safe():'Mountain_Objective',fn=base+(finalMode?'_FINAL_Plan_Execution_AAR.pdf':'_Plan.pdf'),file=new File([blob],fn,{type:'application/pdf'});
   if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){try{await navigator.share({title:o.name||'Mountain Objective',files:[file]});if(typeof note==='function')note('PDF ready — live planning sheet captured with risk matrix.');return}catch(e){if(e.name==='AbortError')return}}
   const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);if(typeof note==='function')note('PDF downloaded — live planning sheet captured with risk matrix.');
 }catch(e){hidden.forEach(x=>x.e.style.display=x.display);console.error(e);alert('PDF could not be created: '+e.message)}}
 function install(){window.mopPdf=visualPdf;window.mopPdfVisualMirror='live-dom-risk-v35'}
 if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(install,800));else setTimeout(install,800);
})();