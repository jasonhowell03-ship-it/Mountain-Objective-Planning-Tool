/* Clean PDF export v1 — single renderer, single source: the rendered planning sheet. */
(()=>{
  async function html2canvasReady(){
    if(window.html2canvas)return window.html2canvas;
    await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';s.onload=resolve;s.onerror=reject;document.head.appendChild(s)});
    return window.html2canvas;
  }
  function copyFormState(src,dst){
    const a=src.querySelectorAll('input,select,textarea'),b=dst.querySelectorAll('input,select,textarea');
    a.forEach((el,i)=>{const c=b[i];if(!c)return;if(el.type==='checkbox'||el.type==='radio')c.checked=el.checked;else c.value=el.value;if(el.tagName==='TEXTAREA')c.textContent=el.value;if(el.tagName==='SELECT')[...c.options].forEach(o=>o.selected=(o.value===el.value))});
  }
  function makeStatic(root){
    root.querySelectorAll('button,input[type="button"],input[type="submit"]').forEach(e=>e.remove());
    root.querySelectorAll('input[type="file"]').forEach(e=>{const d=document.createElement('div');d.style.cssText='padding:10px;border:1px solid #bccbd2;border-radius:9px;margin:5px 0 10px;background:#fff;color:#1f2933;font-size:14px';d.textContent=e.files?.length?[...e.files].map(f=>f.name).join(', '):'No file selected';e.replaceWith(d)});
    root.querySelectorAll('textarea').forEach(e=>{const d=document.createElement('div');const cs=getComputedStyle(e);d.style.cssText=`box-sizing:border-box;width:100%;min-height:${Math.max(e.scrollHeight,e.offsetHeight,60)}px;padding:${cs.padding};border:${cs.border};border-radius:${cs.borderRadius};background:${cs.backgroundColor};font:${cs.font};color:${cs.color};white-space:pre-wrap;overflow-wrap:anywhere;margin:${cs.margin};`;d.textContent=e.value||' ';e.replaceWith(d)});
    root.querySelectorAll('select').forEach(e=>{const d=document.createElement('div');const cs=getComputedStyle(e);d.style.cssText=`box-sizing:border-box;width:100%;min-height:${e.offsetHeight||42}px;padding:${cs.padding};border:${cs.border};border-radius:${cs.borderRadius};background:${cs.backgroundColor};font:${cs.font};color:${cs.color};margin:${cs.margin};`;d.textContent=e.options[e.selectedIndex]?.text||' ';e.replaceWith(d)});
    root.querySelectorAll('input:not([type="checkbox"]):not([type="radio"])').forEach(e=>{const d=document.createElement('div');const cs=getComputedStyle(e);d.style.cssText=`box-sizing:border-box;width:100%;min-height:${e.offsetHeight||42}px;padding:${cs.padding};border:${cs.border};border-radius:${cs.borderRadius};background:${cs.backgroundColor};font:${cs.font};color:${cs.color};margin:${cs.margin};white-space:pre-wrap;overflow-wrap:anywhere;`;d.textContent=e.value||' ';e.replaceWith(d)});
  }
  async function exportPdf(finalMode=false){
    try{
      if(typeof save==='function')save();
      if(typeof note==='function')note('Building PDF from planning sheet…');
      if(!window.jspdf)throw new Error('PDF engine is not loaded.');
      try{window.mopRiskAssessment?.()}catch(_){}
      await new Promise(r=>setTimeout(r,250));
      const source=document.getElementById(finalMode?'exec':'plan');
      if(!source)throw new Error('Planning sheet not found.');
      const wrap=document.createElement('div');wrap.style.cssText=`position:absolute;left:-12000px;top:0;width:${Math.max(source.offsetWidth,720)}px;background:#eef3f5;padding:0;margin:0;`;
      const clone=source.cloneNode(true);clone.classList.remove('hide');clone.style.cssText+=';display:block!important;height:auto!important;max-height:none!important;overflow:visible!important;';copyFormState(source,clone);wrap.appendChild(clone);document.body.appendChild(wrap);makeStatic(clone);
      await new Promise(r=>setTimeout(r,100));
      const h2c=await html2canvasReady();
      const canvas=await h2c(clone,{scale:2,backgroundColor:'#eef3f5',useCORS:true,logging:false,width:clone.scrollWidth,height:clone.scrollHeight,windowWidth:clone.scrollWidth,windowHeight:clone.scrollHeight,scrollX:0,scrollY:0});
      wrap.remove();
      const {jsPDF}=window.jspdf;const pdf=new jsPDF({unit:'pt',format:'letter',compress:true});const PW=612,PH=792,M=18,W=PW-M*2,H=PH-M*2,s=W/canvas.width,slice=Math.floor(H/s);let y=0,page=0;
      while(y<canvas.height){const sh=Math.min(slice,canvas.height-y),c=document.createElement('canvas');c.width=canvas.width;c.height=sh;c.getContext('2d').drawImage(canvas,0,y,canvas.width,sh,0,0,canvas.width,sh);if(page++)pdf.addPage();pdf.addImage(c.toDataURL('image/jpeg',.95),'JPEG',M,M,W,sh*s,undefined,'FAST');y+=sh}
      const o=typeof data==='function'?data():{};try{if(typeof mopPack==='function')pdf.setProperties({title:o.name||'Mountain Objective Plan',subject:'MOPDATA:'+mopPack(o,finalMode),author:'Mountain Objective Planner',creator:'Mountain Objective Planner'})}catch(_){}
      const blob=pdf.output('blob'),fn=(typeof safe==='function'?safe():'Mountain_Objective')+(finalMode?'_FINAL_Plan_Execution_AAR.pdf':'_Plan.pdf'),file=new File([blob],fn,{type:'application/pdf'});
      if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){try{await navigator.share({title:o.name||'Mountain Objective',files:[file]});if(typeof note==='function')note('PDF ready.');return}catch(e){if(e.name==='AbortError')return}}
      const u=URL.createObjectURL(blob),a=document.createElement('a');a.href=u;a.download=fn;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),10000);if(typeof note==='function')note('PDF downloaded.');
    }catch(e){console.error(e);alert('PDF could not be created: '+e.message)}
  }
  function install(){window.mopPdf=exportPdf;window.mopPdfExporter='clean-v1'}
  if(document.readyState==='loading')window.addEventListener('DOMContentLoaded',()=>setTimeout(install,700));else setTimeout(install,700);
})();