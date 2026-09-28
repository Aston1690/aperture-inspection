from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Paragraph
from reportlab.lib.styles import ParagraphStyle
from fontTools.ttLib import TTFont as Font
root=Path(__file__).resolve().parents[2]
fonts=root/'Design/fonts';fonts.mkdir(exist_ok=True)
src=root/'Source/node_modules/@fontsource-variable/geist/files/geist-latin-wght-normal.woff2'
f=Font(src);f.flavor=None;f.save(fonts/'GeistVariable.ttf')
from fontTools.varLib.instancer import instantiateVariableFont
for name,weight in [('Geist',400),('GeistMedium',550)]:
 ff=instantiateVariableFont(Font(fonts/'GeistVariable.ttf'),{'wght':weight},inplace=False);ff.save(fonts/(name+'.ttf'));pdfmetrics.registerFont(TTFont(name,str(fonts/(name+'.ttf'))))
out=root/'Deliverables/Aperture_Product_Overview.pdf'
c=canvas.Canvas(str(out),pagesize=(595.28,841.89));c.setTitle('Aperture - Inspection Review | Akhil');c.setAuthor('Akhil')
ink='#182b20';muted='#5d6c5a';paper='#f7f8f3'
c.setFillColor(HexColor(paper));c.rect(0,0,595.28,841.89,fill=1,stroke=0)
def text(x,y,s,size=12,font='Geist',colour=ink):c.setFillColor(HexColor(colour));c.setFont(font,size);c.drawString(x,y,s)
def para(x,y,s,w=510,size=10,leading=15,colour=muted):
 p=Paragraph(s,ParagraphStyle('p',fontName='Geist',fontSize=size,leading=leading,textColor=HexColor(colour)));_,h=p.wrap(w,200);p.drawOn(c,x,y-h);return h
text(40,795,'Aperture',23,'GeistMedium');text(379,800,'INSPECTION REVIEW',8,'Geist',muted)
c.setStrokeColor(HexColor('#d6dfce'));c.line(40,776,555,776)
text(40,731,'A closer look.',37,'GeistMedium');text(40,688,'A clearer record.',37,'GeistMedium')
para(40,664,'A local workspace for calibrated image measurements and review notes. From the first inspection to an exportable record.',485,11,17)
c.drawImage(str(root/'Design/screen-10.png'),40,260,width=515,height=359,preserveAspectRatio=True,anchor='c',mask='auto')
text(40,248,'Actual application interface. Synthetic image and illustrative scale.',7.5,'Geist',muted)
for x,number,title,copy in [(40,'01','Calibrate','Connect a known distance to the image pixels. Keep the original coordinates.'),(219,'02','Inspect & review','Measure distances and angles. Add context and mark findings reviewed.'),(398,'03','Take it with you','Export measurements as CSV, back up the workspace or print a report.')]:
 text(x,216,number,9,'GeistMedium','#6c824e');text(x,193,title,13,'GeistMedium');para(x,179,copy,155,9,14)
c.setFillColor(HexColor('#173f34'));c.roundRect(40,69,515,54,6,fill=1,stroke=0)
text(57,100,'Open the working product',11,'GeistMedium','#ffffff');text(57,83,'aston1690.github.io/aperture-inspection/',9,'Geist','#d5eac5');c.linkURL('https://aston1690.github.io/aperture-inspection/',(40,69,555,123),relative=0)
text(40,42,'Independent project by Akhil. Designed and built with AI assistance.',8,'Geist',muted)
text(40,28,'2D images only. No scientific validation or affiliation with Raynetics.',7.5,'Geist',muted)
c.save();print(out)
