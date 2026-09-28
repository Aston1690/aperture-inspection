import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
const names=['Library','Empty library','Search results','No results','Import image','Import error','Image details','Uncalibrated viewer','Calibration','Calibrated viewer','Distance measurement','Angle measurement','Add finding','Finding details','Review queue','Comparison','Report builder','Report preview','Export','Preferences','Keyboard help','Mobile library','Mobile viewer','Mobile finding']
const browser=await chromium.launch();const page=await browser.newPage();const screens=[];const images={}
for(let i=1;i<=24;i++){
 await page.setViewportSize({width:i>=22?390:1440,height:1000});await page.goto(`http://127.0.0.1:5173/?screen=${i}`);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(100)
 const scene=await page.evaluate(async()=>{
 const assets={};const nodes=[];let order=0;
 const color=s=>{if(!s||s==='transparent')return null;const a=s.match(/[\d.]+/g)?.map(Number);return a&&a.length>=3?{r:a[0]/255,g:a[1]/255,b:a[2]/255,a:a[3]??1}:null}
 const pos=r=>({x:r.x+scrollX,y:r.y+scrollY,w:r.width,h:r.height})
 async function imageData(url){if(assets[url])return;const b=await(await fetch(url)).blob();assets[url]=await new Promise(resolve=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.readAsDataURL(b)})}
 async function walk(el){if(!(el instanceof Element))return;const s=getComputedStyle(el),r=el.getBoundingClientRect();if(s.display==='none'||s.visibility==='hidden'||r.width<1||r.height<1||r.x<-50||r.y<-50||el.closest('.sr-only')||['SCRIPT','STYLE','LINK','OPTION'].includes(el.tagName))return;const name=el.getAttribute('data-slot')||el.classList[0]||el.tagName.toLowerCase();const base={...pos(r),name,order:order++};const bg=color(s.backgroundColor),border=color(s.borderTopColor);if(bg?.a||parseFloat(s.borderTopWidth)>0)nodes.push({...base,type:'rect',fill:bg,stroke:parseFloat(s.borderTopWidth)>0?border:null,strokeWidth:parseFloat(s.borderTopWidth),radius:parseFloat(s.borderTopLeftRadius)||0});
 if(el instanceof HTMLImageElement){await imageData(el.src);nodes.push({...base,type:'image',src:el.src,fit:s.objectFit});return}
 if(el instanceof SVGSVGElement){const copy=el.cloneNode(true);copy.setAttribute('xmlns','http://www.w3.org/2000/svg');copy.setAttribute('width',String(r.width));copy.setAttribute('height',String(r.height));copy.removeAttribute('class');copy.removeAttribute('tabindex');for(const image of el.querySelectorAll('image')){const url=new URL(image.getAttribute('href'),location.href).href;await imageData(url);nodes.push({...pos(image.getBoundingClientRect()),name:'Specimen image',order:order++,type:'image',src:url,fit:'contain'})}copy.querySelectorAll('image,title,.keyboard-crosshair').forEach(n=>n.remove());let svg=copy.outerHTML.replaceAll('currentColor',s.color);nodes.push({...base,order:order++,type:'svg',svg});return}
 const addText=(text,box,style)=>{if(text.trim())nodes.push({...pos(box),name:text.trim().slice(0,55),order:order++,type:'text',text:text.trim(),font:style.fontFamily.includes('Mono')?'Geist Mono':'Geist',size:parseFloat(style.fontSize),weight:Number(style.fontWeight)||400,lineHeight:parseFloat(style.lineHeight)||parseFloat(style.fontSize)*1.3,color:color(style.color),letterSpacing:parseFloat(style.letterSpacing)||0})}
 if(el instanceof HTMLInputElement||el instanceof HTMLTextAreaElement||el instanceof HTMLSelectElement){let text=el instanceof HTMLSelectElement?el.selectedOptions[0]?.text:el.value||el.placeholder;const pad=parseFloat(s.paddingLeft);addText(text||'',{x:r.x+pad,y:r.y+parseFloat(s.paddingTop),width:r.width-pad-8,height:r.height-parseFloat(s.paddingTop)},s);return}
 for(const n of el.childNodes){if(n.nodeType===Node.TEXT_NODE&&n.textContent.trim()){const range=document.createRange();range.selectNode(n);const rr=range.getBoundingClientRect();addText(n.textContent,rr,s)}else if(n instanceof Element)await walk(n)}
 }
 await walk(document.body);return{width:innerWidth,height:Math.max(innerHeight,document.documentElement.scrollHeight),nodes,assets}
 });
 for(const [url,data] of Object.entries(scene.assets)){const key=url.split('/').pop();images[key]=data;scene.nodes.forEach(n=>{if(n.src===url)n.src=key})}delete scene.assets;screens.push({name:`${String(i).padStart(2,'0')} · ${names[i-1]}`,...scene});await page.screenshot({path:`../Design/screen-${String(i).padStart(2,'0')}.png`,fullPage:true})
}
await fs.writeFile('../Design/Figma-import/scenes.json',JSON.stringify({screens,images}));await browser.close();console.log(`Captured ${screens.length} native-layer scenes`)
