(() => {
  'use strict';

  const SUPABASE_URL='https://katkzrlbxrllspcgdxew.supabase.co';
  const SUPABASE_KEY='sb_publishable_DF8nS5ZdH97_kTe32U_O1w_xZP8Qh52';
  const WORKER='https://bioglow.robootikaring.workers.dev';
  const sb=window.supabase?.createClient ? window.supabase.createClient(SUPABASE_URL,SUPABASE_KEY) : null;
  const $=id=>document.getElementById(id);
  const esc=value=>String(value??'').replace(/[&<>\"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[ch]));
  const i18n=()=>window.BioGlowI18n;
  const t=key=>i18n()?.t(key)||key;
  let heatMap=null;
  let installPrompt=null;
  let privacyGuard=false;

  function parseCoords(text=$('coordText')?.textContent||''){
    const m=String(text).match(/(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
    return m ? {lat:Number(m[1]),lon:Number(m[2])} : null;
  }
  function currentCoords(){
    const node=$('coordText');
    if(node?.dataset.exactCoords){
      const c=parseCoords(node.dataset.exactCoords); if(c) return c;
    }
    return parseCoords();
  }
  function publicCoords(){
    const c=currentCoords(); if(!c) return null;
    if(localStorage.getItem('bioglow_privacy')==='1') return {lat:Number(c.lat.toFixed(2)),lon:Number(c.lon.toFixed(2))};
    return c;
  }
  function selectedPlant(){
    return {
      common:$('chosen')?.querySelector('b')?.textContent?.trim()||$('plantInput')?.value?.trim()||'',
      scientific:$('chosen')?.querySelector('em')?.textContent?.trim()||''
    };
  }
  function currentVerdict(){return $('verdict')?.querySelector('h3')?.textContent?.trim()||'';}
  function currentScore(){
    const chips=[...($('verdict')?.querySelectorAll('.result-chip')||[])].map(x=>x.textContent);
    const hit=chips.find(x=>/%/.test(x));
    const n=Number(hit?.match(/(\d+)%/)?.[1]);
    if(Number.isFinite(n)) return n;
    const v=currentVerdict();
    if(/sobib$/i.test(v)) return 75;
    if(/võib sobida/i.test(v)) return 50;
    if(/ei sobi/i.test(v)) return 25;
    return 50;
  }
  function env(){
    const read=(id,detail)=>({value:$(id)?.textContent?.trim()||'',detail:$(detail)?.textContent?.trim()||''});
    return {elevation:read('elevationValue','elevationDetail'),land:read('landValue','landDetail'),soil:read('soilValue','soilDetail'),moisture:read('moistureValue','moistureDetail'),light:read('lightValue','lightDetail')};
  }
  function resultReady(){return !$('resultContent')?.classList.contains('hidden') && !!currentVerdict();}
  async function user(){if(!sb)return null;const {data}=await sb.auth.getSession();return data?.session?.user||null;}
  function setStatus(root,message,bad=false){if(root)root.innerHTML=`<div class="lab-note${bad?' warning':''}">${esc(message)}</div>`;}

  function buildHeaderActions(){
    const nav=document.querySelector('.nav-actions'); if(!nav||$('labOpenBtn')) return;
    const demo=document.createElement('button'); demo.id='demoOpenBtn'; demo.className='btn ghost compact demo-open-btn'; demo.type='button'; demo.innerHTML='▶ <span data-i18n="nav.demo">Demo</span>';
    const lab=document.createElement('button'); lab.id='labOpenBtn'; lab.className='btn ghost compact lab-open-btn'; lab.type='button'; lab.innerHTML='⚗ <span data-i18n="nav.lab">BioGlow Lab</span>';
    nav.insertBefore(lab,$('accountWrap')); nav.insertBefore(demo,lab);
    demo.onclick=()=>openLab('demo'); lab.onclick=()=>openLab('heatmap');
    i18n()?.apply(document);
  }

  function buildLab(){
    if($('labModal')) return;
    const modal=document.createElement('div');
    modal.id='labModal'; modal.className='lab-modal hidden'; modal.setAttribute('role','dialog'); modal.setAttribute('aria-modal','true'); modal.setAttribute('aria-labelledby','labTitle');
    modal.innerHTML=`<div class="lab-shell">
      <button id="labClose" class="lab-close" type="button" aria-label="Sulge">×</button>
      <div class="lab-head"><div><span class="eyebrow">BIOGLOW LAB</span><h2 id="labTitle" data-i18n="lab.title">BioGlow Lab</h2><p>Eksperimentaalsed tööriistad, läbipaistvus ja projekti diagnostika. Prototüübi hinnangud on alati eraldi märgistatud.</p></div><span id="privacyPill" class="privacy-pill hidden">◌ Privaatsus</span></div>
      <div class="lab-tabs" role="tablist">
        <button class="lab-tab active" data-lab-tab="heatmap" data-i18n="lab.heatmap">Sobivuskaart</button>
        <button class="lab-tab" data-lab-tab="whatif" data-i18n="lab.whatif">Mis siis kui…?</button>
        <button class="lab-tab" data-lab-tab="quality" data-i18n="lab.quality">Andmekvaliteet</button>
        <button class="lab-tab" data-lab-tab="expert" data-i18n="lab.expert">Eksperdi kontroll</button>
        <button class="lab-tab" data-lab-tab="demo" data-i18n="lab.demo">Näita demo</button>
        <button class="lab-tab advanced-only" data-lab-tab="diagnostics" data-i18n="lab.diagnostics">Diagnostika</button>
        <button class="lab-tab advanced-only" data-lab-tab="stats" data-i18n="lab.stats">Statistika</button>
        <button class="lab-tab" data-lab-tab="settings" data-i18n="lab.settings">Seaded</button>
      </div>
      <section class="lab-view" data-lab-view="heatmap"><div class="lab-card"><h3 data-i18n="lab.heatmap">Sobivuskaart</h3><p data-i18n="lab.heatmap.note"></p><div class="lab-toolbar"><button id="runHeatmap" class="mini-btn primary">Koosta kaart</button><span id="heatmapPlant"></span></div><div id="heatmapStatus"></div><div id="heatmapMap" class="lab-map"></div><div class="lab-map-legend"><span><i class="legend-swatch legend-low"></i> vähe vaatlusi</span><span><i class="legend-swatch legend-mid"></i> keskmine</span><span><i class="legend-swatch legend-high"></i> rohkem vaatlusi</span></div></div></section>
      <section class="lab-view hidden" data-lab-view="whatif"><div class="lab-card"><h3 data-i18n="lab.whatif">Mis siis kui…?</h3><p data-i18n="lab.whatif.note"></p><div class="whatif-row"><b>Kastmine</b><input id="whatWater" type="range" min="-2" max="2" step="1" value="0"><output id="whatWaterOut">0</output></div><div class="whatif-row"><b>Varjulisus</b><input id="whatShade" type="range" min="-2" max="2" step="1" value="0"><output id="whatShadeOut">0</output></div><div class="whatif-row"><b>Mulla parandamine</b><input id="whatSoil" type="range" min="0" max="2" step="1" value="0"><output id="whatSoilOut">0</output></div><div class="whatif-row"><b>Drenaaž</b><input id="whatDrain" type="range" min="0" max="2" step="1" value="0"><output id="whatDrainOut">0</output></div><div id="whatIfResult"></div></div></section>
      <section class="lab-view hidden" data-lab-view="quality"><div class="lab-grid"><div class="lab-card"><h3 data-i18n="lab.quality">Andmekvaliteet</h3><p data-i18n="lab.quality.note"></p><div id="qualityList" class="quality-list"></div></div><div class="lab-card"><h3>Tulemuse tundlikkus</h3><p>Millised tegurid mõjutavad prototüübi hinnangut kõige rohkem?</p><div id="sensitivityList" class="sensitivity-list"></div></div></div></section>
      <section class="lab-view hidden" data-lab-view="expert"><div class="lab-grid"><div class="lab-card"><h3 data-i18n="lab.expert">Eksperdi kontroll</h3><p data-i18n="lab.expert.note"></p><div id="expertReviews"></div></div><div class="lab-card"><h3>Küsi kontrolli</h3><p>Saad saata analüüsi eksperdi kontrolli järjekorda. Täpne asukoht hägustatakse, kui privaatsusrežiim on sees.</p><textarea id="expertRequestNote" class="feature-textarea" placeholder="Mida soovid eksperdilt küsida?"></textarea><div class="lab-toolbar"><button id="requestExpert" class="mini-btn primary">Saada kontrolli</button></div><div id="expertRequestStatus"></div><div id="myExpertRequests"></div></div></div></section>
      <section class="lab-view hidden" data-lab-view="demo"><div class="lab-card"><div class="demo-stage"><div class="demo-visual"><span class="demo-ribbon">FLL DEMO · töötab ka ilma API-ta</span><div><small>NÄIDISANALÜÜS</small><h3>Harilik kadakas</h3><p><i>Juniperus communis</i></p></div><div><div class="demo-score">78%</div><b>Võib hästi sobida</b><p>Kohalikud vaatlused ja kuiva-poolse kasvukoha tingimused toetavad valikut.</p></div></div><div><h3>Mida BioGlow näitab?</h3><div class="demo-list"><div>✓ Kohalik vaatlusandmestik: tugev</div><div>✓ Valgus: sobiv</div><div>✓ Muld: mõõdukas kuni kuiv</div><div>◌ Niiskus: kontrolli kohapeal</div><div>✓ Kaitsestaatus: tavapärane liik</div><div>⚗ Usaldusaste: keskmine-kõrge</div></div><p class="lab-note">See on demonstratsioon, mitte päris selle koha analüüs. Demo on mõeldud esitluseks juhuks, kui internet või mõni API ei tööta.</p></div></div></div></section>
      <section class="lab-view hidden" data-lab-view="diagnostics"><div class="lab-card"><div class="lab-toolbar"><h3 style="margin-right:auto">Teenuste diagnostika</h3><button id="runDiagnostics" class="mini-btn primary" data-i18n="lab.refresh">Värskenda</button></div><div id="diagList" class="diag-list"></div><h3>Lehe enesetest</h3><div id="selfTest" class="lab-selftest"></div></div></section>
      <section class="lab-view hidden" data-lab-view="stats"><div class="lab-card"><h3>BioGlow projekti koondstatistika</h3><p data-i18n="lab.stats.note"></p><div id="statsGrid" class="stats-grid"></div></div></section>
      <section class="lab-view hidden" data-lab-view="settings"><div class="lab-card"><h3 data-i18n="lab.settings">Seaded</h3><div class="settings-list"><div class="setting-row"><div><b data-i18n="lab.privacy">Privaatsusrežiim</b><p>Hägustab kasutajale kuvatava ja jagatava GPS-asukoha umbes kilomeetri täpsuseni.</p></div><label class="switch"><input id="privacyToggle" type="checkbox"><span></span></label></div><div class="setting-row"><div><b data-i18n="lab.contrast">Kõrge kontrast</b><p>Tugevam visuaalne eristus.</p></div><label class="switch"><input id="contrastToggle" type="checkbox"><span></span></label></div><div class="setting-row"><div><b data-i18n="lab.text">Suurem tekst</b><p>Suurendab teksti kogu BioGlow lehel.</p></div><label class="switch"><input id="textToggle" type="checkbox"><span></span></label></div><div class="setting-row"><div><b>Liikumisefektid</b><p>Sujuvad ilmumised ja üleminekud; süsteemi reduced-motion seadistus on alati ülimuslik.</p></div><label class="switch"><input id="motionToggle" type="checkbox" checked><span></span></label></div><div class="setting-row"><div><b data-i18n="lab.install">Paigalda äpp</b><p id="pwaStatus" class="pwa-status">Kontrollin paigaldusvõimalust…</p></div><button id="installApp" class="mini-btn primary" data-i18n="lab.install">Paigalda äpp</button></div></div></div></section>
    </div>`;
    document.body.appendChild(modal);
    $('labClose').onclick=closeLab;
    modal.addEventListener('click',e=>{if(e.target===modal)closeLab();});
    modal.querySelectorAll('[data-lab-tab]').forEach(btn=>btn.onclick=()=>switchLab(btn.dataset.labTab));
    $('runHeatmap').onclick=renderHeatmap;
    ['whatWater','whatShade','whatSoil','whatDrain'].forEach(id=>$(id).addEventListener('input',renderWhatIf));
    $('requestExpert').onclick=requestExpertReview;
    $('runDiagnostics').onclick=runDiagnostics;
    $('privacyToggle').onchange=()=>setPrivacy($('privacyToggle').checked);
    $('contrastToggle').onchange=()=>setContrast($('contrastToggle').checked);
    $('textToggle').onchange=()=>setLargeText($('textToggle').checked);
    $('motionToggle').onchange=()=>setMotion($('motionToggle').checked);
    $('installApp').onclick=installApp;
    i18n()?.apply(modal);
    syncSettings();
  }

  function openLab(tab='heatmap'){
    buildLab();
    $('labModal').classList.remove('hidden'); document.body.classList.add('modal-open'); switchLab(tab);
  }
  function closeLab(){ $('labModal')?.classList.add('hidden'); document.body.classList.remove('modal-open'); }
  function switchLab(tab){
    document.querySelectorAll('[data-lab-tab]').forEach(x=>x.classList.toggle('active',x.dataset.labTab===tab));
    document.querySelectorAll('[data-lab-view]').forEach(x=>x.classList.toggle('hidden',x.dataset.labView!==tab));
    if(tab==='whatif')renderWhatIf();
    if(tab==='quality')renderQuality();
    if(tab==='expert')loadExpertPanel();
    if(tab==='diagnostics'){runSelfTest();runDiagnostics();}
    if(tab==='stats')loadStats();
    if(tab==='settings')syncSettings();
    if(tab==='heatmap'&&heatMap)setTimeout(()=>heatMap.invalidateSize(),80);
  }

  async function speciesKey(){
    const p=selectedPlant(); const name=p.scientific||p.common; if(!name)return null;
    const r=await fetch(`https://api.gbif.org/v1/species/match?name=${encodeURIComponent(name)}`); if(!r.ok)throw new Error('Liiki ei leitud');
    const d=await r.json(); return {key:d.usageKey||d.speciesKey,name:d.canonicalName||d.scientificName||name};
  }
  async function renderHeatmap(){
    const root=$('heatmapStatus'); const c=currentCoords(); const p=selectedPlant();
    if(!c){setStatus(root,'Vali kõigepealt koht põhikaardilt.',true);return;}
    if(!p.common&&!p.scientific){setStatus(root,'Vali kõigepealt taim.',true);return;}
    setStatus(root,'Koostan vaatlustiheduse kihti…'); $('heatmapPlant').textContent=`🌱 ${p.common||p.scientific}`;
    try{
      const taxon=await speciesKey(); if(!taxon?.key)throw new Error('Liigi GBIF võtit ei leitud.');
      const spanLat=.32,spanLon=.50;
      const url=new URL('https://api.gbif.org/v1/occurrence/search');
      url.searchParams.set('taxon_key',taxon.key); url.searchParams.set('country','EE'); url.searchParams.set('hasCoordinate','true'); url.searchParams.set('limit','300');
      url.searchParams.set('decimalLatitude',`${c.lat-spanLat},${c.lat+spanLat}`); url.searchParams.set('decimalLongitude',`${c.lon-spanLon},${c.lon+spanLon}`);
      const r=await fetch(url); if(!r.ok)throw new Error('GBIF ei vastanud.'); const data=await r.json();
      if(!window.L)throw new Error('Kaarditeeki ei saanud laadida.');
      if(heatMap){heatMap.remove();heatMap=null;}
      heatMap=L.map('heatmapMap').setView([c.lat,c.lon],9);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap'}).addTo(heatMap);
      const rows=6,cols=6,bins=Array.from({length:rows},()=>Array(cols).fill(0));
      for(const occ of data.results||[]){
        const lat=Number(occ.decimalLatitude),lon=Number(occ.decimalLongitude); if(!Number.isFinite(lat)||!Number.isFinite(lon))continue;
        const ry=Math.min(rows-1,Math.max(0,Math.floor((lat-(c.lat-spanLat))/(spanLat*2)*rows)));
        const cx=Math.min(cols-1,Math.max(0,Math.floor((lon-(c.lon-spanLon))/(spanLon*2)*cols)));
        bins[ry][cx]++;
      }
      const max=Math.max(1,...bins.flat());
      for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
        const south=c.lat-spanLat+(y/rows)*spanLat*2,north=c.lat-spanLat+((y+1)/rows)*spanLat*2;
        const west=c.lon-spanLon+(x/cols)*spanLon*2,east=c.lon-spanLon+((x+1)/cols)*spanLon*2;
        const count=bins[y][x],ratio=count/max;
        const color=ratio>.66?'#4d8d5d':ratio>.25?'#a7c98d':'#e9e0b8';
        L.rectangle([[south,west],[north,east]],{color,weight:1,fillColor:color,fillOpacity:.36+.38*ratio}).addTo(heatMap).bindPopup(`${count} avalikku vaatlust selles ruudus`);
      }
      L.marker([c.lat,c.lon]).addTo(heatMap).bindPopup('Sinu analüüsitav koht');
      setStatus(root,`Leidsin piirkonnast ${Number(data.count||0)} kirjet; kaardil kasutati kuni ${(data.results||[]).length} avalikku koordinaadiga vaatlust.`);
      setTimeout(()=>heatMap.invalidateSize(),80);
    }catch(err){console.error('[BioGlow heatmap]',err);setStatus(root,err.message||'Kaarti ei saanud koostada.',true);}
  }

  function renderWhatIf(){
    if(!$('whatIfResult'))return;
    const water=Number($('whatWater').value),shade=Number($('whatShade').value),soil=Number($('whatSoil').value),drain=Number($('whatDrain').value);
    $('whatWaterOut').value=water>0?`+${water}`:String(water); $('whatShadeOut').value=shade>0?`+${shade}`:String(shade); $('whatSoilOut').value=`+${soil}`; $('whatDrainOut').value=`+${drain}`;
    let score=currentScore(),reasons=[]; const e=env();
    const moisture=`${e.moisture.value} ${e.moisture.detail}`.toLowerCase(); const light=`${e.light.value} ${e.light.detail}`.toLowerCase(); const soilText=`${e.soil.value} ${e.soil.detail}`.toLowerCase();
    if(water){
      if(/kuiv|dry/.test(moisture)){score+=water*6;reasons.push(water>0?'Rohkem kastmist võiks kuiva koha puudujääki vähendada.':'Vähem kastmist suurendaks kuiva koha riski.');}
      else if(/märg|niisk|wet/.test(moisture)){score-=water*4;reasons.push(water>0?'Niiskes kohas võib lisakastmine sobivust vähendada.':'Vähem kastmist võib niiskes kohas olla neutraalne või kasulik.');}
      else {score+=water*2;reasons.push('Niiskusandmed pole piisavalt selged; mõju on hinnatud nõrgalt.');}
    }
    if(shade){
      if(/päike|sun|kõrge/.test(light)){score+=shade>0?2:-2;reasons.push('Valguse muutuse mõju sõltub liigist; siin rakendati ainult väikest prototüübi korrigeerimist.');}
      else if(/vari|shade|madal/.test(light)){score+=shade>0?-5:5;reasons.push(shade>0?'Veel rohkem varju võib vähese valgusega kohas olla ebasoodne.':'Varju vähendamine võib vähese valguse korral aidata.');}
    }
    if(soil){score+=soilText&& !/pole|saadaval/.test(soilText)?soil*3:soil*2;reasons.push('Mulla parandamine lisab prototüübis väikese positiivse mõju, kuid tegelik mõju sõltub liigist ja mullast.');}
    if(drain){if(/märg|niisk|wet/.test(moisture)){score+=drain*5;reasons.push('Drenaaž võib liigniiskuse korral aidata.');}else{score+=drain;reasons.push('Drenaaži mõju hinnati väikeseks, sest tugevat liigniiskuse signaali ei leitud.');}}
    score=Math.max(0,Math.min(100,Math.round(score)));
    const legal=/kaitse|invasiiv|ära istuta/i.test(`${currentVerdict()} ${$('verdict')?.textContent||''}`);
    $('whatIfResult').innerHTML=`<div class="whatif-score"><strong>${score}%</strong><span>stsenaariumi prototüübi skoor</span></div><div class="whatif-reasons">${(reasons.length?reasons:['Muuda liugureid, et näha võimalikku mõju.']).map(x=>`<div class="whatif-reason">${esc(x)}</div>`).join('')}</div>${legal?'<p class="lab-note">Keskkonnamuudatus ei tühista kaitse- või invasiivsusega seotud hoiatust.</p>':''}<p class="lab-note">See on “mis siis kui” simulatsioon, mitte uus teaduslik mõõtmine.</p>`;
  }

  function qualityRows(){
    const e=env(); const obs=[...($('evidenceList')?.querySelectorAll('.evidence-row')||[])].find(x=>/Kohalikud vaatlused/i.test(x.textContent));
    const c=currentCoords(); const rows=[];
    rows.push({name:'Asukoht',q:c?95:15,source:'GPS / kaart',fresh:'praegune valik'});
    rows.push({name:'Kõrgus',q:e.elevation.value&&!/pole|–|…/i.test(e.elevation.value)?85:25,source:'Copernicus DEM',fresh:'mudel'});
    rows.push({name:'Maastik',q:e.land.value&&!/pole|–|…/i.test(e.land.value)?78:25,source:'kaardiandmed',fresh:'andmekiht'});
    rows.push({name:'Muld',q:e.soil.value&&!/pole|–|…/i.test(e.soil.value)?70:20,source:'SoilGrids / MaRu',fresh:'mudel, mitte reaalajas'});
    rows.push({name:'Niiskus',q:e.moisture.value&&!/pole|–|…/i.test(e.moisture.value)?68:20,source:'Open-Meteo mudel',fresh:'analüüsi ajal'});
    rows.push({name:'Valgus',q:e.light.value&&!/pole|–|…/i.test(e.light.value)?68:20,source:'Open-Meteo mudel',fresh:'analüüsi ajal'});
    rows.push({name:'Vaatlused',q:obs?82:25,source:'GBIF',fresh:'kirjed võivad olla eri aastatest'});
    return rows;
  }
  function sensitivity(){
    const factors=[]; const text=`${currentVerdict()} ${$('verdict')?.textContent||''}`.toLowerCase(); const e=env();
    if(/invasiiv|ära istuta/.test(text))factors.push({name:'Invasiivsuse hoiatus',impact:100,label:'väga tugev'});
    if(/kaitse/.test(text))factors.push({name:'Kaitsestaatus',impact:95,label:'väga tugev'});
    const score=currentScore(); factors.push({name:'Kohalik vaatlusandmestik',impact:score>=65?85:score>=35?65:45,label:score>=65?'tugev':'keskmine'});
    const moisture=`${e.moisture.value} ${e.moisture.detail}`.toLowerCase(); if(/kuiv|märg|niisk|dry|wet/.test(moisture))factors.push({name:'Niiskus',impact:62,label:'keskmine'});
    if(e.soil.value&&!/pole|–|…/i.test(e.soil.value))factors.push({name:'Muld',impact:55,label:'keskmine'});
    if(e.light.value&&!/pole|–|…/i.test(e.light.value))factors.push({name:'Valgus',impact:48,label:'keskmine'});
    if(e.land.value&&!/pole|–|…/i.test(e.land.value))factors.push({name:'Maastik',impact:38,label:'nõrgem'});
    return factors.sort((a,b)=>b.impact-a.impact).slice(0,6);
  }
  function renderQuality(){
    const root=$('qualityList'),sens=$('sensitivityList'); if(!root||!sens)return;
    root.innerHTML=qualityRows().map(x=>{const cls=x.q>=75?'quality-high':x.q>=50?'quality-medium':'quality-low';const label=x.q>=75?'kõrge':x.q>=50?'keskmine':'madal';return `<div class="quality-row ${cls}"><div><b>${esc(x.name)}</b><div class="quality-meta">${esc(x.source)} · ${esc(x.fresh)}</div></div><div class="quality-track"><div class="quality-fill" style="width:${x.q}%"></div></div><div class="quality-badge">${label} · ${x.q}%</div></div>`;}).join('');
    sens.innerHTML=sensitivity().map(x=>`<div class="sensitivity-item"><span>${esc(x.name)}</span><span class="${x.impact>=80?'impact-high':x.impact>=50?'impact-medium':'impact-low'}">${esc(x.label)}</span></div>`).join('')||'<div class="lab-note">Tee enne analüüs, et näha tundlikkust.</div>';
  }

  async function loadExpertPanel(){
    const p=selectedPlant(); const reviews=$('expertReviews'),mine=$('myExpertRequests');
    reviews.innerHTML='<div class="lab-note">Kontrollin ekspertarvamusi…</div>';
    if(!p.scientific){reviews.innerHTML='<div class="lab-note">Vali enne täpne liik, et ekspertarvamusi otsida.</div>';}
    else if(sb){
      const {data,error}=await sb.from('expert_reviews').select('*').eq('scientific_name',p.scientific).order('reviewed_at',{ascending:false}).limit(10);
      if(error)reviews.innerHTML='<div class="lab-note">Ekspertarvamusi ei saanud laadida.</div>';
      else if(!data?.length)reviews.innerHTML='<div class="lab-note">Selle liigi kohta pole BioGlow ekspertide tabelis veel kinnitatud arvamust.</div>';
      else reviews.innerHTML=data.map(r=>`<article class="lab-card expert-review"><span class="expert-badge">✓ kontrollitud ekspertarvamus</span><h3>${esc(r.reviewer_name)}</h3><small>${esc(r.affiliation||'')}</small><p><b>${esc(r.verdict||'')}</b></p><p>${esc(r.comment||'')}</p><small>${new Date(r.reviewed_at).toLocaleDateString('et-EE')}</small></article>`).join('');
    }
    const u=await user();
    if(!u){mine.innerHTML='<div class="lab-note">Oma kontrollipäringute nägemiseks logi sisse.</div>';return;}
    const {data}=await sb.from('expert_review_requests').select('*').eq('user_id',u.id).order('created_at',{ascending:false}).limit(10);
    mine.innerHTML=data?.length?`<h3>Sinu kontrollipäringud</h3>${data.map(r=>`<div class="sensitivity-item"><span>${esc(r.plant_name)} · ${new Date(r.created_at).toLocaleDateString('et-EE')}</span><span class="request-status">${esc(r.status)}</span></div>`).join('')}`:'<div class="lab-note">Sa pole veel kontrollipäringut saatnud.</div>';
  }
  async function requestExpertReview(){
    const root=$('expertRequestStatus'),u=await user(); if(!u){setStatus(root,'Logi kõigepealt sisse.',true);return;}
    const p=selectedPlant(),c=publicCoords(); if(!p.common&&!p.scientific){setStatus(root,'Vali enne taim.',true);return;}
    const {error}=await sb.from('expert_review_requests').insert({user_id:u.id,plant_name:p.common||p.scientific,scientific_name:p.scientific||null,latitude:c?.lat||null,longitude:c?.lon||null,verdict:currentVerdict()||null,note:$('expertRequestNote').value.trim()||null});
    if(error){console.error(error);setStatus(root,'Kontrollipäringu saatmine ebaõnnestus.',true);return;}
    setStatus(root,'Kontrollipäring lisati järjekorda.'); $('expertRequestNote').value=''; loadExpertPanel();
  }

  async function ping(name,url,options={}){
    const start=performance.now(),controller=new AbortController(),timer=setTimeout(()=>controller.abort(),6500);
    try{const r=await fetch(url,{...options,signal:controller.signal});return{name,ok:r.ok||r.status<500,status:r.status,ms:Math.round(performance.now()-start)};}catch(e){return{name,ok:false,status:'—',ms:Math.round(performance.now()-start),error:e.name==='AbortError'?'timeout':'võrguviga'};}finally{clearTimeout(timer);}
  }
  async function runDiagnostics(){
    const root=$('diagList'); if(!root)return; root.innerHTML='<div class="lab-note">Kontrollin teenuseid…</div>';
    const tests=await Promise.all([
      ping('GBIF','https://api.gbif.org/v1/species/match?name=Juniperus%20communis'),
      ping('Open-Meteo','https://api.open-meteo.com/v1/forecast?latitude=59.4&longitude=24.7&current=temperature_2m'),
      ping('SoilGrids','https://rest.isric.org/soilgrids/v2.0/properties/query?lat=59.4&lon=24.7&property=phh2o&depth=0-5cm&value=Q0.5'),
      ping('BioGlow Worker',WORKER)
    ]);
    if(sb){const start=performance.now();try{const {error}=await sb.auth.getSession();tests.push({name:'Supabase',ok:!error,status:error?'viga':'OK',ms:Math.round(performance.now()-start)});}catch{tests.push({name:'Supabase',ok:false,status:'viga',ms:Math.round(performance.now()-start)});}}
    root.innerHTML=tests.map(x=>`<div class="diag-row"><span><i class="diag-dot ${x.ok?'ok':'bad'}"></i> <b>${esc(x.name)}</b></span><span>${x.ok?'töötab':'probleem'} · ${esc(x.status)}</span><span class="diag-time">${x.ms} ms</span></div>`).join('');
  }
  function runSelfTest(){
    const tests=[
      ['Põhikaart',!!$('map')],['Analüüsi nupp',!!$('analyzeBtn')],['Tulemuse ala',!!$('resultContent')],['Konto moodul',!!$('accountButton')],['BioGlow+ moodul',!!$('featurePanel')],['Leaflet',!!window.L],['Supabase JS',!!window.supabase],['PDF teek',!!window.jspdf],['Service Worker','serviceWorker' in navigator],['Manifest',!!document.querySelector('link[rel="manifest"]')]
    ];
    const passed=tests.filter(x=>x[1]).length;
    $('selfTest').textContent=`BioGlow self-test: ${passed}/${tests.length}\n`+tests.map(([n,ok])=>`${ok?'PASS':'FAIL'}  ${n}`).join('\n');
  }
  async function loadStats(){
    const root=$('statsGrid'); if(!root||!sb)return; root.innerHTML='<div class="lab-note">Laadin…</div>';
    const {data,error}=await sb.rpc('bioglow_public_stats');
    if(error){console.error(error);root.innerHTML='<div class="lab-note">Statistikat ei saanud laadida.</div>';return;}
    const d=data||{}; const cards=[['Analüüse',d.analyses||0],['Kasutajaid',d.users||0],['Lemmikuid',d.favorite_plants||0],['Tagasisidet',d.feedback||0],['Eri taimi',d.distinct_plants||0]];
    root.innerHTML=cards.map(([k,v])=>`<div class="stat-card"><small>${esc(k)}</small><b>${Number(v).toLocaleString('et-EE')}</b></div>`).join('');
  }

  function setPrivacy(on){localStorage.setItem('bioglow_privacy',on?'1':'0');applyPrivacy();syncSettings();}
  function applyPrivacy(){
    const node=$('coordText'); if(!node||privacyGuard)return;
    privacyGuard=true;
    try{
      const on=localStorage.getItem('bioglow_privacy')==='1';
      const raw=node.textContent||''; const c=parseCoords(raw);
      if(on){
        if(c && !node.dataset.exactCoords)node.dataset.exactCoords=raw;
        const exact=parseCoords(node.dataset.exactCoords||raw);
        if(exact)node.textContent=`${exact.lat.toFixed(2)}, ${exact.lon.toFixed(2)} · privaatsusrežiim`;
        $('privacyPill')?.classList.remove('hidden');
      }else{
        if(node.dataset.exactCoords){node.textContent=node.dataset.exactCoords;delete node.dataset.exactCoords;}
        $('privacyPill')?.classList.add('hidden');
      }
    }finally{privacyGuard=false;}
  }
  function setContrast(on){document.body.classList.toggle('bioglow-high-contrast',on);localStorage.setItem('bioglow_contrast',on?'1':'0');}
  function setLargeText(on){document.body.classList.toggle('bioglow-large-text',on);localStorage.setItem('bioglow_large_text',on?'1':'0');}
  function setMotion(on){localStorage.setItem('bioglow_motion',on?'1':'0');document.body.classList.toggle('motion-disabled',!on);if(!on)document.querySelectorAll('.motion-reveal').forEach(x=>x.classList.add('is-visible'));}
  function syncSettings(){
    if($('privacyToggle'))$('privacyToggle').checked=localStorage.getItem('bioglow_privacy')==='1';
    if($('contrastToggle'))$('contrastToggle').checked=localStorage.getItem('bioglow_contrast')==='1';
    if($('textToggle'))$('textToggle').checked=localStorage.getItem('bioglow_large_text')==='1';
    if($('motionToggle'))$('motionToggle').checked=localStorage.getItem('bioglow_motion')!=='0';
    setContrast(localStorage.getItem('bioglow_contrast')==='1'); setLargeText(localStorage.getItem('bioglow_large_text')==='1');
    const install=$('installApp'),status=$('pwaStatus');
    if(install&&status){if(window.matchMedia('(display-mode: standalone)').matches){install.disabled=true;status.textContent='BioGlow töötab juba installitud äpina.';}else if(installPrompt){install.disabled=false;status.textContent='Brauser lubab BioGlow installida.';}else{install.disabled=false;status.textContent='Kui paigaldusnupp ei avane, kasuta brauseri “Install app / Add to Home Screen” valikut.';}}
  }
  async function installApp(){
    if(!installPrompt){$('pwaStatus').textContent='Brauser ei pakkunud automaatset installiakent. Ava brauseri menüü ja vali “Install app” või “Add to Home Screen”.';return;}
    installPrompt.prompt(); await installPrompt.userChoice; installPrompt=null; syncSettings();
  }

  function setupPrivacyObserver(){
    const node=$('coordText'); if(!node)return;
    const obs=new MutationObserver(()=>{if(localStorage.getItem('bioglow_privacy')==='1'&&!privacyGuard){const raw=node.textContent||'';const c=parseCoords(raw);if(c&&!/privaatsusrežiim/.test(raw)){node.dataset.exactCoords=raw;applyPrivacy();}}});
    obs.observe(node,{childList:true,characterData:true,subtree:true}); applyPrivacy();
  }
  function setupMotion(){
    if(localStorage.getItem('bioglow_motion')==='0')return;
    document.body.classList.add('motion-ready');
    const selector='.hero,.hero-stat,.workspace>.panel,#results,.section-block,.env-card,.plant-card,#how,.how-grid article';
    const mark=()=>document.querySelectorAll(selector).forEach((el,i)=>{if(!el.classList.contains('motion-reveal')){el.classList.add('motion-reveal');el.style.setProperty('--reveal-delay',`${Math.min(i%5,4)*55}ms`);observer.observe(el);}});
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.08,rootMargin:'0px 0px -35px'});
    mark(); new MutationObserver(mark).observe(document.body,{childList:true,subtree:true});
  }
  function setupAccessibility(){
    if(!$('skipLink')){const a=document.createElement('a');a.id='skipLink';a.className='skip-link';a.href='#analyze';a.dataset.i18n='a11y.skip';a.textContent='Liigu põhisisu juurde';document.body.prepend(a);}
    document.querySelectorAll('.feature-tab,.lab-tab').forEach(x=>x.setAttribute('role','tab'));
    i18n()?.apply(document);
  }

  function init(){
    buildHeaderActions(); buildLab(); setupAccessibility(); setupPrivacyObserver(); setupMotion();
    window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;syncSettings();});
    window.addEventListener('appinstalled',()=>{installPrompt=null;syncSettings();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('labModal')?.classList.contains('hidden'))closeLab();});
    document.addEventListener('bioglow:language',()=>{i18n()?.apply(document);});
    setContrast(localStorage.getItem('bioglow_contrast')==='1'); setLargeText(localStorage.getItem('bioglow_large_text')==='1');
    window.BioGlowLab={open:openLab,heatmap:renderHeatmap,diagnostics:runDiagnostics,selfTest:runSelfTest};
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
