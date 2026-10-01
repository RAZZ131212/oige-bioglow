(() => {
  'use strict';

  const dict = {
    et: {
      'nav.results':'Tulemused','nav.analyze':'Analüüsi','nav.account':'Konto','nav.demo':'Demo','nav.lab':'BioGlow Lab',
      'hero.title':'Kas see taim sobib siia?','hero.subtitle':'Vali taim ja koht. BioGlow ühendab kohaliku leviku, looduskaitse staatuse ja keskkonnaandmed üheks lihtsaks hinnanguks.','hero.start':'Alusta analüüsi →','hero.how':'Kuidas see töötab?',
      'plant.title':'Vali taim','plant.help':'Kirjuta lihtne nimi, näiteks kadakas, tamm, kask või nurmenukk.','plant.placeholder':'Otsi taime…',
      'place.title':'Vali koht','place.help':'Klõpsa kaardil, kasuta seadme asukohta või lisa GPS-andmetega JPG/JPEG foto.','place.device':'◎ Kasuta minu asukohta','place.map':'⌖ Vali kaardilt','place.analyze':'Analüüsi sobivust →',
      'result.title':'BioGlow hinnang','result.reset':'↻ Uus analüüs','how.title':'Neli lihtsat sammu',
      'lab.title':'BioGlow Lab','lab.heatmap':'Sobivuskaart','lab.whatif':'Mis siis kui…?','lab.quality':'Andmekvaliteet','lab.expert':'Eksperdi kontroll','lab.diagnostics':'Diagnostika','lab.stats':'Statistika','lab.settings':'Seaded',
      'lab.demo':'Näita demo','lab.close':'Sulge','lab.run':'Arvuta','lab.refresh':'Värskenda','lab.install':'Paigalda äpp','lab.privacy':'Privaatsusrežiim','lab.contrast':'Kõrge kontrast','lab.text':'Suurem tekst',
      'lab.heatmap.note':'Prototüübi sobivuskiht põhineb valitud liigi avalike GBIF-vaatluste tihedusel. See ei ole kasvugarantii.','lab.whatif.note':'Muuda tingimusi ja vaata, kuidas BioGlow prototüübi hinnang võiks liikuda.','lab.quality.note':'Iga andmekihi juures on eraldi kvaliteedi- ja värskuse hinnang.','lab.expert.note':'Eksperdi kinnitused on eraldi süsteemis. Tavakasutaja ei saa end eksperdiks märkida.','lab.stats.note':'Kuvatakse ainult koondarvud, mitte kasutajate isikuandmeid ega täpseid asukohti.',
      'a11y.skip':'Liigu põhisisu juurde'
    },
    en: {
      'nav.results':'Results','nav.analyze':'Analyze','nav.account':'Account','nav.demo':'Demo','nav.lab':'BioGlow Lab',
      'hero.title':'Will this plant suit this place?','hero.subtitle':'Choose a plant and a location. BioGlow combines local occurrence, conservation status and environmental data into one clear assessment.','hero.start':'Start analysis →','hero.how':'How does it work?',
      'plant.title':'Choose a plant','plant.help':'Type a simple plant name, for example juniper, oak, birch or cowslip.','plant.placeholder':'Search for a plant…',
      'place.title':'Choose a place','place.help':'Click the map, use your device location or add a JPG/JPEG photo with GPS metadata.','place.device':'◎ Use my location','place.map':'⌖ Choose on map','place.analyze':'Analyze suitability →',
      'result.title':'BioGlow assessment','result.reset':'↻ New analysis','how.title':'Four simple steps',
      'lab.title':'BioGlow Lab','lab.heatmap':'Suitability map','lab.whatif':'What if…?','lab.quality':'Data quality','lab.expert':'Expert review','lab.diagnostics':'Diagnostics','lab.stats':'Statistics','lab.settings':'Settings',
      'lab.demo':'Show demo','lab.close':'Close','lab.run':'Calculate','lab.refresh':'Refresh','lab.install':'Install app','lab.privacy':'Privacy mode','lab.contrast':'High contrast','lab.text':'Larger text',
      'lab.heatmap.note':'The prototype suitability layer is based on the density of public GBIF observations for the selected species. It is not a growth guarantee.','lab.whatif.note':'Change conditions and see how the BioGlow prototype assessment might move.','lab.quality.note':'Each data layer gets its own quality and freshness estimate.','lab.expert.note':'Expert confirmations are stored separately. Regular users cannot mark themselves as experts.','lab.stats.note':'Only aggregate counts are shown, never personal user data or precise locations.','a11y.skip':'Skip to main content'
    }
  };

  let lang = localStorage.getItem('bioglow_lang') === 'en' ? 'en' : 'et';
  const t = key => dict[lang]?.[key] || dict.et[key] || key;

  const staticBindings = [
    ['[data-scroll="results"]','nav.results'],['[data-scroll="analyze"].compact','nav.analyze'],
    ['.hero-copy h1','hero.title'],['.hero-copy > p','hero.subtitle'],['.hero-actions [data-scroll="analyze"]','hero.start'],['.hero-actions [data-scroll="how"]','hero.how'],
    ['.controls-panel .panel-head:nth-of-type(1) h2','plant.title'],['#plantInput','plant.placeholder','placeholder'],
    ['#useLocation','place.device'],['#pickMap','place.map'],['#analyzeBtn','place.analyze'],
    ['#results .results-head h2','result.title'],['#resetBtn','result.reset'],['#how .how-intro h2','how.title']
  ];

  function apply(root=document){
    root.documentElement && (root.documentElement.lang = lang);
    if(document.documentElement) document.documentElement.lang = lang;
    staticBindings.forEach(([selector,key,kind]) => {
      const node = document.querySelector(selector);
      if(!node) return;
      if(kind === 'placeholder') node.setAttribute('placeholder', t(key));
      else node.textContent = t(key);
    });
    root.querySelectorAll?.('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
    root.querySelectorAll?.('[data-i18n-placeholder]').forEach(node => { node.setAttribute('placeholder',t(node.dataset.i18nPlaceholder)); });
    const toggle=document.getElementById('languageToggle');
    if(toggle){ toggle.textContent = lang === 'et' ? 'EN' : 'ET'; toggle.setAttribute('aria-label',lang === 'et' ? 'Switch to English' : 'Lülita eesti keelele'); }
  }

  function setLang(next){
    lang = next === 'en' ? 'en' : 'et';
    localStorage.setItem('bioglow_lang',lang);
    apply(document);
    document.dispatchEvent(new CustomEvent('bioglow:language',{detail:{lang}}));
  }

  function buildToggle(){
    if(document.getElementById('languageToggle')) return;
    const nav=document.querySelector('.nav-actions'); if(!nav) return;
    const button=document.createElement('button');
    button.id='languageToggle'; button.type='button'; button.className='btn ghost compact language-toggle';
    button.addEventListener('click',()=>setLang(lang === 'et' ? 'en' : 'et'));
    nav.insertBefore(button,nav.firstChild);
    apply(document);
  }

  window.BioGlowI18n={t,apply,setLang,getLang:()=>lang};
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',buildToggle); else buildToggle();
})();
