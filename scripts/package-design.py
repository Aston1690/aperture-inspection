from pathlib import Path
import json,html
root=Path(__file__).resolve().parents[2]
p=root/'Design/Figma-import/scenes.json'
data=json.loads(p.read_text())
def wire(name,kind):
 nodes=[]
 def rect(x,y,w,h,fill='#eeeeee',label='Container'):
  fill=fill if len(fill)==7 else '#'+''.join(v*2 for v in fill[1:])
  c=lambda h:{'r':int(h[1:3],16)/255,'g':int(h[3:5],16)/255,'b':int(h[5:7],16)/255,'a':1}
  nodes.append(dict(type='rect',name=label,x=x,y=y,w=w,h=h,fill=c(fill),stroke=c('#c7c7c7'),strokeWidth=1,radius=4))
 def text(x,y,t,size=16,w=700):nodes.append(dict(type='text',name=t,x=x,y=y,w=w,h=size*1.5,text=t,font='Geist',size=size,weight=400,lineHeight=size*1.5,letterSpacing=0,color={'r':.2,'g':.2,'b':.2,'a':1}))
 rect(0,0,1440,900,'#fafafa');rect(0,0,205,900,'#e8e8e8');text(28,35,'APERTURE',22,160)
 for j,t in enumerate(['Library','Review queue','Compare','Reports']):text(28,160+j*50,t,15,150)
 text(245,35,'Workspace / '+name,14);text(245,100,name,30)
 if kind=='library':
  rect(245,170,1150,225,'#f2f2f2');text(270,200,'Explore a sample or import an image',21,300)
  for j in range(3):rect(635+j*250,190,225,140,'#d7d7d7','Sample image');text(635+j*250,345,'Sample image',14,200)
  rect(245,435,350,44,'#fff');text(260,445,'Search images',14)
  for j in range(3):rect(245,510+j*90,1150,78,'#fff');text(270,530+j*90,'Image name',16);text(720,530+j*90,'Scale',14);text(1000,530+j*90,'Findings',14)
 elif kind in ['viewer','finding']:
  rect(245,170,850,50,'#fff');text(265,184,'Select    Pan    Distance    Angle    Calibrate',14)
  rect(245,235,850,560,'#d5d5d5','Image viewport');text(520,480,'IMAGE / MEASUREMENT CANVAS',20,500)
  rect(1115,170,280,625,'#fff');text(1135,190,'Measurements',17,250);text(1135,245,'Selected value',24,245)
  for j,t in enumerate(['Finding name','Review note','Mark reviewed','All measurements']):rect(1135,315+j*100,240,65,'#f0f0f0');text(1150,332+j*100,t,14,220)
  if kind=='finding':rect(475,235,490,440,'#fff');text(510,265,'Add a measurement',24,420);text(510,320,'Name and original pixel coordinates',14,420);rect(510,370,420,55,'#eee');rect(510,450,420,100,'#eee');text(510,570,'Cancel                          Add finding',15,420)
 elif kind=='import':
  rect(475,225,490,450,'#fff');text(510,260,'Import an image',26,420);rect(510,330,420,170,'#eee');text(565,390,'Choose or drop an image',19,360);text(510,535,'1  Import a 2D image',16,420);text(510,580,'2  Calibrate, then measure',16,420)
 elif kind=='compare':
  for j in range(2):rect(245+j*585,170,560,55,'#fff');text(270+j*585,185,'Select image',15,500);rect(245+j*585,245,560,500,'#d5d5d5');text(440+j*585,480,'IMAGE',25,200)
  text(245,780,'Images have independent scales. Compare features, not display sizes.',14)
 else:
  rect(245,170,800,650,'#fff');text(280,195,'APERTURE / INSPECTION REPORT',14);text(280,245,'Report title',28);rect(280,310,730,230,'#d5d5d5');text(280,565,'Finding                 Measurement                 Status',15)
  for j in range(3):rect(280,605+j*48,730,40,'#f2f2f2')
  rect(1070,170,325,360,'#fff');text(1095,195,'Report options',20,280);text(1095,255,'Title / image / notes',15,270);rect(1095,370,270,48,'#ddd');text(1110,382,'Print / save PDF',15,245)
 return dict(name='Wireframe · '+name,width=1440,height=900,nodes=nodes)
data['wireframes']=[wire(n,k) for n,k in [('Library','library'),('Import','import'),('Image viewer','viewer'),('Add finding','finding'),('Comparison','compare'),('Report','report')]]
for i,s in enumerate(data['wireframes']):
 out=['<svg xmlns="http://www.w3.org/2000/svg" width="1440" height="900" viewBox="0 0 1440 900">']
 for n in s['nodes']:
  if n['type']=='rect':
   c=n['fill'];fill='#'+''.join(f'{round(c[v]*255):02x}' for v in ['r','g','b']);out.append(f'<rect x="{n["x"]}" y="{n["y"]}" width="{n["w"]}" height="{n["h"]}" fill="{fill}" stroke="#c7c7c7" rx="4"/>')
  else:out.append(f'<text x="{n["x"]}" y="{n["y"]+n["size"]}" font-family="Arial,sans-serif" font-size="{n["size"]}" fill="#333">{html.escape(n["text"])}</text>')
 out.append('</svg>');(root/f'Design/wireframes/{i+1:02d}-{s["name"].split(" · ")[1].replace(" ","-").lower()}.svg').write_text(''.join(out))
p.write_text(json.dumps(data,separators=(',',':')))
payload=json.dumps(data,separators=(',',':')).replace('</','<\\/')
ui='''<!doctype html><meta charset="utf-8"><style>body{font:13px system-ui;padding:20px;color:#183425;background:#f7f8f5}h2{font-size:20px}p{line-height:1.6}button{background:#173f34;color:white;border:0;padding:12px 20px;border-radius:6px;cursor:pointer}#status{font-size:12px}</style><h2>Aperture design system</h2><p>24 editable screens, 6 wireframes, component instances and colour tokens. Builds new pages in this file.</p><button id="run">Import design</button><p id="status">Requires Geist and Geist Mono.</p><script id="payload" type="application/json">'''+payload+'''</script><script>document.getElementById('run').onclick=()=>{document.getElementById('run').disabled=true;parent.postMessage({pluginMessage:{type:'import',data:JSON.parse(document.getElementById('payload').textContent)}},'*')};onmessage=e=>{const m=e.data.pluginMessage;if(m)document.getElementById('status').textContent=m.text}</script>'''
(root/'Design/Figma-import/ui.html').write_text(ui)
items=''.join(f'<a href="screen-{i:02d}.png"><img src="screen-{i:02d}.png" alt="{html.escape(s["name"])}"><b>{html.escape(s["name"])}</b></a>' for i,s in enumerate(data['screens'],1))
(root/'Design/index.html').write_text('<!doctype html><meta charset="utf-8"><title>Aperture / screen catalogue</title><style>body{font:14px system-ui;background:#f7f8f5;color:#183425;padding:40px}h1{font-size:32px}main{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:30px}a{color:inherit;text-decoration:none}img{width:100%;height:270px;object-fit:contain;object-position:top;background:#e6ebdf;border:1px solid #d6dfcd}b{display:block;padding:12px 0}@media(max-width:700px){main{grid-template-columns:1fr}}</style><h1>Aperture / interface catalogue</h1><p>24 browser-rendered states. Native Figma import prepared; editor verification pending.</p><main>'+items+'</main>')
print('Packaged native layers, six editable SVG wireframes and screen catalogue')
