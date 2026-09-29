// BioGlow V12 — final resilient analysis pipeline
(function(){
  const el=id=>document.getElementById(id);
  const safeSet=(id,text)=>{const x=el(id);if(x)x.textContent=text};

  function renderMainResult(n,best,total,aiText){
    const root=el('verdict'), evidence=el('evidenceList');
    if(!root||!evidence) return;
    const strength=best>0?Math.max(0,Math.min(100,Math.round(n/best*100))):0;
    const p=protectedInfo(chosenPlant.scientific), invasive=isInvasive(chosenPlant.scientific);
    let cls='bad',title='Ei sobi hästi',label='NÕRK SOBIVUS',copy='Selle taime kohta ei leitud siin piisavalt kohalikku vaatlustõendit. Vaata allpool paremini toetatud alternatiive.';
    if(invasive){title='Ära istuta loodusesse';label='HOIATUS';copy='See liik on BioGlow invasiivsete/võõrliikide kontrollnimekirjas.'}
    else if(strength>=50){cls='good';title='Sobib';label='SOBIB';copy=`Valitud liigi kohta leiti lähialalt ${n} vaatlust. Kohalik levik toetab seda valikut.`}
    else if(n>0){cls='maybe';title='Võib sobida';label='VAJAB KONTROLLI';copy=`Valitud liigi kohta leiti ${n} vaatlust, kuid teistel liikidel on tugevam kohalik andmetugi.`}
    root.className=`verdict-card ${cls}`;
    root.innerHTML=`<div class="verdict-top"><div class="verdict-icon">${cls==='good'?'✓':cls==='maybe'?'?':'!'}</div><div><small>${label}</small><h3>${title}</h3></div></div><div class="selected-result"><b>${esc(chosenPlant.common)}</b><span>${esc(chosenPlant.scientific)}</span></div><p>${copy}</p><div class="result-chips"><span class="result-chip">${n} vaatlust</span><span class="result-chip">andmetugi ${strength}%</span>${p?`<span class="result-chip protect">🛡 ${p.category} kaitsekategooria</span>`:''}</div>${p?'<div class="safety-note">Kaitsealust taime ei käsitleta tavapärase istutussoovitusena. Ära võta taimi loodusest.</div>':''}`;
    evidence.innerHTML=`<div class="evidence-row"><span>⌖</span><div><small>Kohalikud vaatlused</small><b>${n} valitud liigi vaatlust</b><p>${total} kirjet ümbruses</p></div></div><div class="evidence-row"><span>◎</span><div><small>Foto AI</small><b>${esc(aiText)}</b><p>Visuaalne lisakontekst</p></div></div><div class="evidence-row"><span>🛡</span><div><small>Kaitsestaatus</small><b>${p?p.category+' kaitsekategooria':'Ei tuvastatud'}</b><p>${invasive?'Võõr-/invasiivse liigi hoiatus':'Kontrollitud'}</p></div></div>`;
  }

  async function imageForCard(x,id){
    if(x.media){const h=el(id);if(h)h.innerHTML=`<img src="${esc(x.media)}" alt="${esc(x.name)}" loading="lazy" referrerpolicy="no-referrer">`;return}
    try{
      const ctrl=new AbortController(), timer=setTimeout(()=>ctrl.abort(),2500);
      const r=await fetch(`https://api.gbif.org/v1/occurrence/search?taxon_key=${x.key}&media_type=StillImage&limit=4`,{signal:ctrl.signal});clearTimeout(timer);
      if(!r.ok)return;
      const d=await r.json();
      const m=(d.results||[]).flatMap(o=>o.media||[]).find(m=>m.identifier);
      const h=el(id);
      if(h&&m?.identifier)h.innerHTML=`<img src="${esc(m.identifier)}" alt="${esc(x.name)}" loading="lazy" referrerpolicy="no-referrer">`;
      else if(h)h.innerHTML='<div class="plant-media-placeholder static"><span>🌿</span><small>Pilt pole saadaval</small></div>';
    }catch(e){const h=el(id);if(h)h.innerHTML='<div class="plant-media-placeholder static"><span>🌿</span><small>Pilt pole saadaval</small></div>'}
  }

  function renderAlternativesNow(list){
    const root=el('plants');if(!root)return;
    const good=(list||[]).filter(x=>!isInvasive(x.scientific)&&!protectedInfo(x.scientific)&&x.key!==chosenPlant.key).slice(0,6);
    if(!good.length){root.innerHTML='<div class="alt-empty"><span>🌱</span><div><b>Alternatiive ei leitud piisavalt</b><p>Proovi teist lähedast punkti.</p></div></div>';return}
    root.innerHTML=good.map((x,i)=>`<article class="plant modern-plant-card"><div id="v12-img-${i}" class="plant-media">${x.media?`<img src="${esc(x.media)}" alt="${esc(x.name)}" loading="lazy" referrerpolicy="no-referrer">`:'<div class="plant-media-placeholder static"><span>🌿</span><small>Pilt laadib</small></div>'}</div><div class="plant-body"><span class="plant-rank">${i===0?'TUGEVAM KANDIDAAT':`KANDIDAAT ${i+1}`}</span><h3>${esc(x.name)}</h3><div class="latin">${esc(x.scientific)}</div><div class="plant-evidence"><span>⌖</span><span>Kohalikke vaatlusi <b>${x.count}</b></span></div></div></article>`).join('');
    good.forEach((x,i)=>imageForCard(x,`v12-img-${i}`));
  }

  function renderConservationNow(list){
    const root=el('conservation');if(!root)return;
    const hits=(list||[]).map(x=>({x,info:protectedInfo(x.scientific)})).filter(z=>z.info?.category==='III');
    if(!hits.length){root.innerHTML='<div class="conservation-card calm"><div class="conservation-symbol">🛡️</div><div><small>LOODUSKAITSE</small><b>III kaitsekategooria taime ei leitud</b><p>Avalikest lähivaatlustest ei leitud sobivat III kategooria liiki.</p></div></div>';return}
    hits.sort((a,b)=>a.x.count-b.x.count);const h=hits[0];
    root.innerHTML=`<div class="conservation-card calm"><div class="conservation-symbol">🛡️</div><div><small>LOODUSKAITSE VÕIMALUS</small><b>${esc(h.info.common||h.x.name)}</b><span>${esc(h.x.scientific)} · III kaitsekategooria</span><p>Avalikus lähiala päringus oli ${h.x.count} vaatlust. Pigem toeta kasvukohta, mitte ära võta taime loodusest.</p></div></div>`;
  }

  async function loadEnv(lat,lon){
    ['elevationValue','landValue','soilValue','moistureValue','lightValue'].forEach(id=>safeSet(id,'…'));
    try{const d=await(await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`)).json();const v=Number(d.elevation?.[0]);safeSet('elevationValue',Number.isFinite(v)?`${Math.round(v)} m`:'Pole saadaval');safeSet('elevationDetail','Copernicus DEM')}catch(e){safeSet('elevationValue','Pole saadaval')}
    try{const u=new URL('https://api.open-meteo.com/v1/forecast');u.searchParams.set('latitude',lat);u.searchParams.set('longitude',lon);u.searchParams.set('hourly','soil_moisture_0_to_7cm,shortwave_radiation');u.searchParams.set('past_days','7');u.searchParams.set('forecast_days','1');const d=await(await fetch(u)).json();const avg=a=>{const v=(a||[]).map(Number).filter(Number.isFinite);return v.length?v.reduce((s,x)=>s+x,0)/v.length:null};const m=avg(d.hourly?.soil_moisture_0_to_7cm),r=avg((d.hourly?.shortwave_radiation||[]).filter(x=>Number(x)>0));safeSet('moistureValue',m==null?'Pole saadaval':m<.18?'Pigem kuiv':m<.30?'Keskmine':'Pigem niiske');safeSet('moistureDetail',m==null?'':`${m.toFixed(2)} m³/m³`);safeSet('lightValue',r==null?'Pole saadaval':r<120?'Vähe valgust':r<260?'Keskmine':'Palju valgust');safeSet('lightDetail',r==null?'':`${Math.round(r)} W/m²`)}catch(e){}
    safeSet('soilValue','MaRu mullakiht');safeSet('soilDetail','Vaata kaardi kihtidest');
    safeSet('landValue','Kaardikiht');safeSet('landDetail','MaRu / OpenStreetMap');
  }

  window.runCheck=async function(){
    const btn=el('analyzeBtn');
    try{
      if(!await resolveTypedPlant()){setStatus('Ma ei leidnud seda taime. Proovi näiteks „kadakas”.','error');return}
      if(!chosenLocation){setStatus('Vali asukoht kaardilt, seadmest või GPS-iga fotost.','error');return}
      if(btn){btn.disabled=true;btn.textContent='Analüüsin…'}
      setStatus('Kogun andmeid…');
      el('resultEmpty')?.classList.add('hidden');el('resultContent')?.classList.remove('hidden');
      if(el('plants'))el('plants').innerHTML='<div class="alt-empty"><span>🌱</span><div><b>Otsin soovitusi…</b><p>See peaks kestma vaid hetke.</p></div></div>';
      const [list,aiText]=await Promise.all([nearby(chosenLocation.lat,chosenLocation.lon),photoAI(chosenFile,chosenLocation)]);
      if(!list.length)throw Error('Selle koha ümbrusest ei leitud piisavalt taimevaatlusi.');
      const n=await selectedCount(chosenPlant.key,chosenLocation.lat,chosenLocation.lon).catch(()=>0),best=list[0]?.count||0,total=list.reduce((s,x)=>s+x.count,0);
      renderMainResult(n,best,total,aiText);
      renderAlternativesNow(list);
      renderConservationNow(list);
      loadEnv(chosenLocation.lat,chosenLocation.lon);
      setStatus('Analüüs valmis.','ready');go('results');
    }catch(e){console.error('V12 analysis',e);setStatus(e.message||'Analüüs ebaõnnestus.','error');if(el('plants'))el('plants').innerHTML='<div class="alt-empty"><span>!</span><div><b>Soovitusi ei saanud laadida</b><p>Proovi uuesti või vali teine punkt.</p></div></div>'}
    finally{if(btn){btn.disabled=false;btn.innerHTML='Analüüsi sobivust <span>→</span>'}}
  };
})();