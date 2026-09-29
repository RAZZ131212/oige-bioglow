// BioGlow V14 — alternative recommendations use simple Estonian general names
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
    Lycopodium:'kold',Huperzia:'kold',Goodyera:'öövilge',Gymnadenia:'käoraamat',Neottia:'käopõll / pesajuur',

    // Common herbaceous plants that appeared in BioGlow recommendations
    Lamium:'iminõges',Ficaria:'kanakoole',Anemone:'ülane',Bellis:'kirikakar',Chelidonium:'vereurmarohi',
    Urtica:'nõges',Ranunculus:'tulikas',Taraxacum:'võilill',Plantago:'teeleht',Galium:'madar',
    Veronica:'mailane',Stellaria:'tähthein',Cerastium:'kadakkaer',Myosotis:'meelespea',Geum:'maajalg',
    Glechoma:'maajalg',Aegopodium:'naat',Anthriscus:'harakputk',Heracleum:'karuputk',Daucus:'porgand',
    Rumex:'oblikas',Polygonum:'kirburohi',Persicaria:'kirburohi',Chenopodium:'hanemalts',Atriplex:'malts',
    Cirsium:'ohakas',Carduus:'ohakas',Sonchus:'piimohakas',Leontodon:'seanupp',Hypochaeris:'seanupp',
    Crepis:'koeratubakas',Hieracium:'hunditubakas',Pilosella:'karutubakas',Arctium:'takjas',
    Centaurea:'rukkilill / jumikas',Matricaria:'kummel',Tripleurospermum:'kummel',Achillea:'raudrohi',
    Tanacetum:'soolikarohi',Artemisia:'puju',Tussilago:'paiseleht',Solidago:'kuldvits',
    Campanula:'kellukas',Knautia:'äiatar',Scabiosa:'tähtpea',Succisa:'peetrileht',
    Vicia:'hiirehernes',Lathyrus:'seahernes',Medicago:'lutsern',Melilotus:'mesikas',Lotus:'nõiahammas',
    Trifolium:'ristik',Astragalus:'hundihammas',Oxytropis:'hundihammas',
    Epilobium:'pajulill',Chamaenerion:'põdrakanep',Oenothera:'kuningakepp',
    Filipendula:'angervaks',Alchemilla:'kortsleht',Potentilla:'maran',Geum:'maajalg',Fragaria:'maasikas',
    Rubus:'murakas / vaarikas',Sanguisorba:'punnpea',Agrimonia:'maarjalepp',
    Primula:'nurmenukk',Lysimachia:'metstarn',Lythrum:'kukesaba',Mentha:'münt',Thymus:'liivatee',
    Origanum:'pune',Prunella:'käbihein',Ajuga:'akakapsas',Salvia:'salvei',Stachys:'nõianõges',
    Lamium:'iminõges',Galeopsis:'kõrvik',Scutellaria:'kilbuk',
    Viola:'kannike',Geranium:'kurereha',Erodium:'kurereha',Oxalis:'jänesekapsas',
    Anemone:'ülane',Ranunculus:'tulikas',Caltha:'varsakabi',Ficaria:'kanakoole',
    Aquilegia:'kurekell',Thalictrum:'ängelhein',Aconitum:'käoking',
    Convallaria:'maikelluke',Maianthemum:'laanelill',Paris:'ussilakk',Polygonatum:'kuutõverohi',
    Asarum:'metspipar',Pulmonaria:'kopsurohi',Myosotis:'meelespea',Symphytum:'varemerohi',
    Digitalis:'sõrmkübar',Linaria:'käokannus',Melampyrum:'härghein',Rhinanthus:'robirohi',
    Euphrasia:'silmarohi',Pedicularis:'kuuskjalg',Orobanche:'soomukas',
    Equisetum:'osi',Dryopteris:'sõnajalg',Athyrium:'sõnajalg',Gymnocarpium:'kolmissõnajalg',
    Pteridium:'kilpjalg',Polypodium:'kiviürt',Asplenium:'raunjalg',
    Luzula:'piiphein',Eriophorum:'villpea',Eleocharis:'alss',Scirpus:'kõrkjas',Schoenoplectus:'kõrkjas',
    Typha:'hundinui',Phragmites:'pilliroog',Phalaris:'paelrohi',Deschampsia:'kastik',Agrostis:'kastehein',
    Dactylis:'kerahein',Phleum:'timut',Alopecurus:'rebasesaba',Bromus:'luste',Elymus:'orashein'
  };

  function generalName(scientific,shown){
    const sci=String(scientific||'').trim();
    const genus=sci.split(/\s+/)[0];
    if(GENERAL_BY_GENUS[genus]) return GENERAL_BY_GENUS[genus];

    let name=String(shown||'').trim().toLowerCase();
    if(name.startsWith('harilik ')) name=name.slice(8);
    const exact=[
      ['arukask','kask'],['sookask','kask'],['sanglepp','lepp'],['hall lepp','lepp'],
      ['harilik haab','haab'],['harilik sarapuu','sarapuu'],['harilik toomingas','toomingas'],
      ['harilik vaher','vaher'],['harilik pärn','pärn'],['harilik pihlakas','pihlakas']
    ].find(([a])=>name===a);
    if(exact) return exact[1];

    // If GBIF only gave us a Latin binomial, use the genus as a clean fallback rather than repeating it twice.
    if(/^[A-Z][a-z-]+\s+[a-z]/.test(String(shown||''))) return genus || 'taim';
    return name||shown||scientific||'taim';
  }

  function simplifyAlternativeCards(){
    const root=document.getElementById('plants');
    if(!root) return;
    const seen=new Set();
    root.querySelectorAll('.modern-plant-card,.plant').forEach(card=>{
      const title=card.querySelector('h3');
      const latin=card.querySelector('.latin');
      if(!title||!latin) return;

      const originalTitle=title.dataset.originalTitle||title.textContent.trim();
      const scientific=latin.dataset.scientific||latin.textContent.trim().split(' · ').pop().trim();
      title.dataset.originalTitle=originalTitle;
      latin.dataset.scientific=scientific;

      const simple=generalName(scientific,originalTitle);
      const key=simple.toLowerCase();
      if(seen.has(key)){
        card.style.display='none';
        return;
      }
      seen.add(key);
      card.style.display='';
      title.textContent=simple;

      const originalLooksLatin=/^[A-Z][a-z-]+\s+[a-z]/.test(originalTitle);
      latin.textContent=(!originalLooksLatin && originalTitle.toLowerCase()!==simple.toLowerCase())
        ? `${originalTitle} · ${scientific}`
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