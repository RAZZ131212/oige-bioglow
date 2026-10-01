import fs from 'node:fs';

const required=['index.html','style.css','auth.css','features.css','lab.css','plant-data.js','app.js','auth.js','features.js','i18n.js','lab.js','manifest.webmanifest','sw.js'];
const missing=required.filter(file=>!fs.existsSync(file));
if(missing.length){console.error('Missing required files:',missing.join(', '));process.exit(1);}

const index=fs.readFileSync('index.html','utf8');
for(const ref of ['features.js','i18n.js','lab.js','lab.css','manifest.webmanifest']){
  if(!index.includes(ref)){console.error(`index.html is missing ${ref}`);process.exit(1);}
}
for(const id of ['analyzeBtn','resultContent','accountButton','coordText']){
  if(!index.includes(`id="${id}"`)){console.error(`index.html is missing #${id}`);process.exit(1);}
}

const sw=fs.readFileSync('sw.js','utf8');
for(const asset of ['lab.js','i18n.js','lab.css']){
  if(!sw.includes(asset)){console.error(`sw.js does not cache ${asset}`);process.exit(1);}
}

console.log('BioGlow smoke tests passed.');
