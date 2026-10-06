/* PLAN-only PDF exporter: text/vector only; no canvas, screenshots, or images. */
(()=>{window.downloadPlanPdf=function(){try{
 if(typeof save==='function')save();
 if(!window.jspdf)throw Error('PDF engine did not load.');
 const {jsPDF}=window.jspdf,d=new jsPDF({unit:'pt',format:'letter'}),M=42,R=570,H=792,B=748;let y=42,p=1;
 const v=id=>(document.getElementById(id)?.value||'').trim();
 const s=id=>{const e=document.getElementById(id);return e?.options?.[e.selectedIndex]?.text||v(id)||'—'};
 const foot=()=>{d.setFontSize(7);d.setTextColor(100);d.text('Mountain Objective Plan',M,H-20);d.text('Page '+p,R,H-20,{align:'right'})};
 const np=()=>{foot();d.addPage();p++;y=42};
 const row=(label,value)=>{let lines=d.splitTextToSize(String(value||'—'),R-M);if(y+30>B)np();d.setFont('helvetica','bold');d.setFontSize(8);d.setTextColor(80);d.text(label.toUpperCase(),M,y);y+=12;d.setFont('helvetica','normal');d.setFontSize(9);d.setTextColor(25);while(lines.length){const room=Math.max(1,Math.floor((B-y)/11));const chunk=lines.splice(0,room);d.text(chunk,M,y);y+=chunk.length*11+12;if(lines.length)np();}};
 d.setFont('helvetica','bold');d.setFontSize(18);d.setTextColor(23,55,77);d.text('MOUNTAIN OBJECTIVE PLAN',M,y);y+=28;
 row('Objective',v('name'));row('Environment',s('env'));row('Location',v('loc'));row('Dates',(v('sd')||'—')+' to '+(v('ed')||'—'));row('Team Lead',v('lead'));row('Team Members',v('team'));
 row('Weather / Conditions',v('weather'));row('Weather Source',v('weatherlink'));row('Additional Weather Links',v('weatherlinks'));row('Primary Route / Map',v('maplink'));row('Alternate / Bail Route',v('altmaplink'));row('Additional Map Links',v('maplinks'));row('Route / Map Notes',v('mapnotes'));row('Route / Decision Plan',v('route'));row('Abort Criteria / Turnaround',v('abort'));row('Contingency / Retreat',v('cont'));row('Primary Hazard',s('haz')+(v('danger')?' — '+v('danger'):''));row('Medical / Rescue Plan',v('med'));row('PACE','Primary: '+s('paceP')+'\nAlternate: '+s('paceA')+'\nContingency: '+s('paceC')+'\nEmergency: '+s('paceE'));row('Communications',v('comms'));row('Individual Equipment',v('gearIndividual'));row('Team Equipment',v('gearTeam'));row('Specialty Equipment',v('gearSpecialty'));foot();
 const fn=(v('name')||'Mountain_Objective').replace(/[^a-z0-9_-]+/gi,'_')+'_Plan.pdf';
 const blob=d.output('blob'),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=fn;a.style.display='none';document.body.appendChild(a);a.click();setTimeout(()=>{a.remove();URL.revokeObjectURL(url)},30000);if(typeof note==='function')note('Plan PDF ready for download.');
}catch(e){console.error(e);alert('PDF could not be created: '+e.message)}}})();