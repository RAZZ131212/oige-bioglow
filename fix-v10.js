// BioGlow V10 — non-blocking media + resilient cards
(function(){
  const safe=id=>document.getElementById(id);
  const timeout=(promise,ms=3500)=>Promise.race([
    Promise.resolve(promise),
    new Promise(resolve=>setTimeout(()=>resolve(null),ms))
  ]);

  function placeholder(label='🌿'){
    return `<div class="plant-media-placeholder"><span>${label}</span><small>Pilt laadib…</small></div>`;
  }
  function plantBadge(i){
    if(i<2) return '<span class="alt-badge strong">Tugev kandidaat</span>';
    if(i<4) return '<span class="alt-badge medium">Hea kandidaat</span>';
    return '<span class="alt-badge light">Võimalik</span>';
  }
  function imageCredit(x){
    const bits=['GBIF'];
    if(x.creator) bits.push(esc(x.creator));
    if(x.license) bits.push(esc(x.license));
    return bits.join(' · ');
  }

  async function hydratePlantImage(id,x){
    try{
      await timeout(mediaFor(x),3500);
      const holder=safe(id);
      if(!holder) return;
      if(x.media){
        holder.innerHTML=`<img src="${esc(x.media)}" alt="${esc(x.name||x.scientific)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.parentElement.innerHTML='<div class=&quot;plant-media-placeholder static&quot;><span>🌿</span><small>Pilt pole saadaval</small></div>'">`;
        const credit=safe(id+'-credit');
        if(credit) credit.textContent=imageCredit(x);
      }else{
        holder.innerHTML='<div class="plant-media-placeholder static"><span>🌿</span><small>Pilt pole saadaval</small></div>';
      }
    }catch(e){
      const holder=safe(id);
      if(holder) holder.innerHTML='<div class="plant-media-placeholder static"><span>🌿</span><small>Pilt pole saadaval</small></div>';
    }
  }

  renderAlternatives = async function(list){
    const root=safe('plants');
    if(!root) return;
    const good=(list||[])
      .filter(x=>!isInvasive(x.scientific)&&!protectedInfo(x.scientific)&&(!chosenPlant||x.key!==chosenPlant.key))
      .slice(0,6);

    if(!good.length){
      root.innerHTML='<div class="alt-empty"><span>🌱</span><div><b>Alternatiive ei leitud piisavalt</b><p>Proovi teist lähedast punkti või suurema vaatlusandmestikuga piirkonda.</p></div></div>';
      return;
    }

    root.innerHTML=good.map((x,i)=>{
      const id=`alt-media-${i}-${x.key}`;
      return `<article class="plant modern-plant-card">
        <div id="${id}" class="plant-media">${x.media?`<img src="${esc(x.media)}" alt="${esc(x.name)}" loading="lazy" referrerpolicy="no-referrer">`:placeholder()}</div>
        <div class="pb modern-plant-copy">
          <div class="alt-topline">${plantBadge(i)}<span class="alt-count">${x.count} vaatlust</span></div>
          <h3>${esc(x.name)}</h3>
          <div class="latin">${esc(x.scientific)}</div>
          <p class="alt-reason">Sellel liigil on sinu valitud koha ümbruses tugevam kohalik esinemistõend.</p>
          <div id="${id}-credit" class="meta image-credit">${x.media?imageCredit(x):'GBIF pilt laadib taustal'}</div>
        </div>
      </article>`;
    }).join('');

    good.forEach((x,i)=>{
      if(!x.media) hydratePlantImage(`alt-media-${i}-${x.key}`,x);
    });
  };

  renderConservation = async function(list){
    const root=safe('conservation');
    if(!root) return;
    const hits=(list||[]).map(x=>({x,info:protectedInfo(x.scientific)})).filter(z=>z.info?.category==='III');
    if(!hits.length){
      root.innerHTML=`<div class="conservation-card calm modern-conservation"><div class="conservation-symbol">🛡️</div><div><small>LOODUSKAITSE</small><b>Avalikest lähivaatlustest ei leitud III kaitsekategooria taime</b><p>See ei tähenda, et kaitsealuseid liike piirkonnas pole. BioGlow ei kuva I–II kategooria tundlikke täpseid kasvukohti.</p></div></div>`;
      return;
    }
    hits.sort((a,b)=>a.x.count-b.x.count);
    const h=hits[0],id=`conservation-media-${h.x.key}`;
    root.innerHTML=`<div class="conservation-card modern-conservation">
      <div id="${id}" class="conservation-image">${h.x.media?`<img src="${esc(h.x.media)}" alt="${esc(h.info.common||h.x.name)}" loading="lazy" referrerpolicy="no-referrer">`:placeholder('🛡️')}</div>
      <div><small>LOODUSKAITSE VÕIMALUS</small><b>${esc(h.info.common||h.x.name)}</b><span>${esc(h.x.scientific)} · III kaitsekategooria</span><p>Avalikus lähiala päringus oli ${h.x.count} vaatlust. BioGlow soovitab pigem toetada selle liigi kasvukohta kui võtta taimi loodusest.</p><div id="${id}-credit" class="meta">${h.x.media?imageCredit(h.x):'GBIF pilt laadib taustal'}</div></div>
    </div>`;
    if(!h.x.media) hydratePlantImage(id,h.x);
  };

  const oldRun=runCheck;
  runCheck=async function(){
    let guard=setTimeout(()=>{
      const p=safe('plants');
      if(p&&/Otsin sobivamaid taimi/.test(p.textContent||'')){
        p.innerHTML='<div class="alt-empty"><span>🌱</span><div><b>Soovituste pildid võtavad liiga kaua</b><p>Analüüs ise töötab; proovi uuesti või vali teine punkt. Pildid ei blokeeri enam järgmisi analüüse.</p></div></div>';
      }
    },7000);
    try{return await oldRun();}finally{clearTimeout(guard);}
  };
})();