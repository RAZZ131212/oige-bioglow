// BioGlow V13 — show alternative recommendations with simple general plant names
(function(){
  const GENERAL_BY_GENUS={
    Quercus:'tamm',Juniperus:'kadakas',Betula:'kask',Salix:'paju',Pinus:'mänd',Picea:'kuusk',
    Acer:'vaher',Tilia:'pärn',Sorbus:'pihlakas',Alnus:'lepp',Populus:'haab',Corylus:'sarapuu',
    Prunus:'toomingas',Malus:'õunapuu',Pyrus:'pirnipuu',Rosa:'kibuvits',Fraxinus:'saar',Ulmus:'jalakas',
    Frangula:'paakspuu',Viburnum:'lodjapuu',Lonicera:'kuslapuu',Calluna:'kanarbik',Vaccinium:'mustikas / pohl',
    Achillea:'raudrohi',Trifolium:'ristik',Fragaria:'maasikas',Primula:'nurmenukk',Hepatica:'sinilill',
    Chamaenerion:'põdrakanep',Epilobium:'põdrakanep',Allium:'lauk',Myrica:'porss',Iris:'võhumõõk',
    Platanthera:'käokeel',Dactylorhiza:'sõrmkäpp',Epipactis:'neiuvaip',Orchis:'käpp',Pulsatilla:'karukell',
    Nymphaea:'vesiroos',Nuphar:'vesikupp',Potamogeton:'penikeel',Carex:'tarn',Juncus:'luga',
    Festuca:'aruhein',Poa:'nurmikas',Rubus:'murakas / vaarikas',Viola:'kannike',Geranium:'kurereha',
    Artemisia:'puju',Hypericum:'naistepuna',Lathyrus:'seahernes',Vicia:'hiirehernes',Lotus:'nõiahammas',
    Thalictrum:'ängelhein',Potentilla:'maran',Dasiphora:'maran',Cornus:'kukits',Euonymus:'kikkapuu',
    Lycopodium:'kold',Huperzia:'kold',Goodyera:'öövilge',Gymnadenia:'käoraamat',Neottia:'käopõll / pesajuur'
  };

  function generalName(scientific,shown){
    const sci=String(scientific||'').trim();
    const genus=sci.split(/\s+/)[0];
    if(GENERAL_BY_GENUS[genus]) return GENERAL_BY_GENUS[genus];

    // Fallback for Estonian names already supplied by GBIF/DISPLAY.
    let name=String(shown||'').trim().toLowerCase();
    const removePrefixes=['harilik ','aru','soo','hall ','sanglepp'];
    if(name.startsWith('harilik ')) name=name.slice(8);
    // Keep useful simple names when the exact species adjective is unnecessary.
    const endings=[
      ['arukask','kask'],['sookask','kask'],['sanglepp','lepp'],['hall lepp','lepp'],
      ['harilik haab','haab'],['harilik sarapuu','sarapuu'],['harilik toomingas','toomingas'],
      ['harilik vaher','vaher'],['harilik pärn','pärn'],['harilik pihlakas','pihlakas']
    ];
    const hit=endings.find(([a])=>name===a);
    return hit?hit[1]:(name||shown||scientific||'taim');
  }

  function simplifyAlternativeCards(){
    const root=document.getElementById('plants');
    if(!root) return;
    const seen=new Set();
    root.querySelectorAll('.modern-plant-card,.plant').forEach(card=>{
      const title=card.querySelector('h3');
      const latin=card.querySelector('.latin');
      if(!title||!latin) return;
      const exactTitle=title.textContent.trim();
      const scientific=latin.textContent.trim();
      const simple=generalName(scientific,exactTitle);
      const key=simple.toLowerCase();
      if(seen.has(key)){
        card.style.display='none';
        return;
      }
      seen.add(key);
      title.textContent=simple;
      latin.textContent=exactTitle && exactTitle.toLowerCase()!==simple.toLowerCase()
        ? `${exactTitle} · ${scientific}`
        : scientific;
    });
  }

  const plants=document.getElementById('plants');
  if(plants){
    new MutationObserver(()=>simplifyAlternativeCards()).observe(plants,{childList:true,subtree:true});
  }

  const base=window.runCheck;
  window.runCheck=async function(){
    const out=await base.apply(this,arguments);
    simplifyAlternativeCards();
    return out;
  };
})();
