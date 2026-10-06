/* Dependent location selectors. Town geocodes never overwrite mountain coordinates. */
(()=>{
 const regions={"US":[["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["DC","District of Columbia"],["FL","Florida"],["GA","Georgia"],["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"]],"CA":[["AB","Alberta"],["BC","British Columbia"],["MB","Manitoba"],["NB","New Brunswick"],["NL","Newfoundland and Labrador"],["NS","Nova Scotia"],["NT","Northwest Territories"],["NU","Nunavut"],["ON","Ontario"],["PE","Prince Edward Island"],["QC","Quebec"],["SK","Saskatchewan"],["YT","Yukon"]]};
 const $=id=>document.getElementById(id),val=id=>$(id)?.value||'';
 let emitting=false,serial=0,controller,timer;
 const countryCode=()=>{const n=val('country').trim().toLowerCase();return ['us','usa','united states','united states of america','u.s.','u.s.a.'].includes(n)?'US':['ca','can','canada'].includes(n)?'CA':'';};
 const regionEntry=()=>regions[countryCode()]?.find(([code,name])=>code.toLowerCase()===val('state').toLowerCase()||name.toLowerCase()===val('state').toLowerCase());
 const option=(select,value,label)=>{const o=document.createElement('option');o.value=value;o.textContent=label;select.appendChild(o);return o;};
 const notify=e=>{emitting=true;e.dispatchEvent(new Event('change',{bubbles:true}));emitting=false;};
 const report=text=>{$('locationSearchStatus').textContent=text;};
 function citiesReset(clear){const current=clear?'':val('city');$('city').replaceChildren();option($('city'),'','Search or select nearest town');if(current&&current!=='__manual__')option($('city'),current,current+' (saved location)');option($('city'),'__manual__','Enter town manually…');$('city').value=current==='__manual__'?'':current;$('manualCityPanel').classList.add('hide');}
 function updateRegions(clear){
  const current=clear?'':val('state'),list=regions[countryCode()]||[];
  $('state').replaceChildren();option($('state'),'','Select state / province');
  list.forEach(([code,name])=>option($('state'),code,name+' ('+code+')'));
  const match=list.find(([code,name])=>code.toLowerCase()===current.toLowerCase()||name.toLowerCase()===current.toLowerCase());
  if(current&&!match&&current!=='__manual__')option($('state'),current,current+' (saved location)');
  option($('state'),'__manual__','Enter state / province manually…');$('state').value=match?match[0]:current==='__manual__'?'':current;
  $('manualStatePanel').classList.add('hide');citiesReset(clear);
  notify($('state'));notify($('city'));
 }
 const distance=(lat,lon)=>{const a=val('latitude'),b=val('longitude');if(a===''||b===''||!Number.isFinite(+a)||!Number.isFinite(+b))return null;const rad=x=>x*Math.PI/180,dl=rad(lat-+a),dn=rad(lon-+b),h=Math.sin(dl/2)**2+Math.cos(rad(+a))*Math.cos(rad(lat))*Math.sin(dn/2)**2;return 6371*2*Math.asin(Math.sqrt(Math.min(1,h)));};
 function invalidate(){++serial;controller?.abort();clearTimeout(timer);$('locationSearchButton').disabled=false;}
 async function search(){
  invalidate();const request=serial,code=countryCode(),region=regionEntry()?.[1]||val('state');
  const query=(val('locationCitySearch').trim()||val('city')||val('loc')).split(',')[0].trim();
  if(!code){report('Select United States or Canada for town search, or use manual entry.');return;}
  if(!region||region==='__manual__'){report('Select state / province first.');return;}
  if(query.length<2){report('Enter at least two characters of a town name or postal code. Range / Mountain can also be searched.');return;}
  controller=new AbortController();$('locationSearchButton').disabled=true;report('Searching towns in '+region+'…');
  try{
   const response=await fetch('/api/location-search?'+new URLSearchParams({name:query,country:code,region}),{signal:controller.signal});
   const data=await response.json();if(!response.ok)throw Error(data.error||'Town search unavailable.');if(request!==serial)return;
   const current=val('city');citiesReset(false);const manual=$('city').querySelector('option[value="__manual__"]');manual.remove();
   const results=(data.results||[]).map(p=>({...p,distance:distance(p.latitude,p.longitude)})).sort((a,b)=>(a.distance??0)-(b.distance??0));
   const duplicateNames=new Set();results.forEach(p=>{const text=p.name+(p.county?' — '+p.county:'')+' — '+p.region+(p.distance===null?'':' (~'+Math.round(p.distance)+' km from objective)');
    const value=p.name+(results.filter(x=>x.name===p.name).length>1&&p.county?' — '+p.county:'');if(duplicateNames.has(value))return;duplicateNames.add(value);
    if(value!==current)option($('city'),value,text);
   });option($('city'),'__manual__','Enter town manually…');$('city').value=current;
   report(results.length?'Select a matching town. Distances rank search results; they do not establish forecast coverage.':'No matching towns found in '+region+'. Try the town name/postal code or enter it manually.');
  }catch(e){if(e.name!=='AbortError'&&request===serial)report(e.message+' Use manual entry if needed.');}
  finally{if(request===serial)$('locationSearchButton').disabled=false;}
 }
 function manualField(inputId,selectId){$(inputId).addEventListener('input',()=>{const text=val(inputId).trim(),select=$(selectId);if(text&&!Array.from(select.options).some(o=>o.value===text))option(select,text,text+' (manual)');select.value=text;notify(select);});}
 function setup(){
  if(!val('country').trim()){const saved=val('state').trim().toLowerCase(),canadian=regions.CA.some(([c,n])=>c.toLowerCase()===saved||n.toLowerCase()===saved);$('country').value=canadian?'Canada':'United States';notify($('country'));}
  updateRegions(false);
  $('country').addEventListener('change',()=>{invalidate();updateRegions(true);$('locationCitySearch').value='';report('Choose state / province, then search for a town.');});
  $('country').addEventListener('input',()=>{invalidate();updateRegions(true);report('Select state / province for the chosen country.');});
  $('state').addEventListener('change',()=>{if(emitting)return;invalidate();if(val('state')==='__manual__'){$('manualStatePanel').classList.remove('hide');$('locationManualState').value='';$('state').value='';citiesReset(true);notify($('city'));return;}$('manualStatePanel').classList.add('hide');citiesReset(true);notify($('city'));if(val('locationCitySearch')||val('loc'))search();else report('Enter a town name or postal code to load town choices.');});
  $('city').addEventListener('change',()=>{if(emitting)return;if(val('city')==='__manual__'){$('city').value='';$('manualCityPanel').classList.remove('hide');$('locationManualCity').value='';notify($('city'));}else $('manualCityPanel').classList.add('hide');});
  manualField('locationManualState','state');manualField('locationManualCity','city');
  $('locationSearchButton').onclick=search;
  $('locationCitySearch').addEventListener('input',()=>{invalidate();timer=setTimeout(search,500);});
  $('locationCitySearch').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();search();}});
  $('loc').addEventListener('change',()=>{if(!val('locationCitySearch'))search();});
  document.addEventListener('change',e=>{if(e.target?.id==='env'&&!emitting){invalidate();updateRegions(false);report('Location selections ready. Search to update town choices.');}});
  ['latitude','longitude'].forEach(id=>$(id).addEventListener('change',()=>{if(val('locationCitySearch')){invalidate();timer=setTimeout(search,500);}}));
  report('Select a state / province, then search. Towns are filtered by country and region.');
  if(val('state')&&(val('city')||val('loc')))search();
 }
 window.addEventListener('DOMContentLoaded',()=>setTimeout(setup,900));
})();
