"""Generate the editable class roster as a one-page, selectable-text A4 PDF."""
import json, os
from pathlib import Path
from collections import Counter
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle

root=Path(__file__).resolve().parents[1]
data=json.loads((root/'src/content/documents/leaving-registration.json').read_text(encoding='utf-8'))
rows=data['rows']
assert len(rows)==21 and [r[0] for r in rows]==list(range(1,22))
assert Counter(r[3] for r in rows)=={'已归档':17,'未归档':3,'延期答辩':1}
assert sum(r[4]=='迁出' for r in rows)==14
assert next(r[2] for r in rows if r[1]=='林琛')=='202210300522'
assert len({r[2] for r in rows})==21 and all(isinstance(r[2],str) and len(r[2])==12 for r in rows)
font=os.environ.get('ROSTER_FONT', 'C:/Windows/Fonts/simsun.ttc')
pdfmetrics.registerFont(TTFont('RosterSong',font,subfontIndex=0))
target=root/'public/assets/documents'/data['fileName']
target.parent.mkdir(parents=True,exist_ok=True)
c=canvas.Canvas(str(target),pagesize=A4,pageCompression=1)
c.setTitle(data['title']);c.setAuthor('东澜大学')
w,h=A4
c.setFont('RosterSong',16);c.drawCentredString(w/2,h-55,data['title'])
c.setFont('RosterSong',10.5);c.drawCentredString(w/2,h-80,data['subtitle'])
t=Table([data['columns']]+rows,colWidths=[38,75,135,155,100],rowHeights=[30]+[28]*21)
t.setStyle(TableStyle([('FONTNAME',(0,0),(-1,-1),'RosterSong'),('FONTSIZE',(0,0),(-1,-1),10.5),('ALIGN',(0,0),(-1,-1),'CENTER'),('VALIGN',(0,0),(-1,-1),'MIDDLE'),('GRID',(0,0),(-1,-1),.5,(0,0,0)),('TEXTCOLOR',(0,0),(-1,-1),(0,0,0))]))
tw,th=t.wrap(w,h);t.drawOn(c,(w-tw)/2,h-100-th)
c.showPage();c.save()
print('PASS 21 rows, 17 archived, 3 pending, 1 deferred, 14 moved; PDF generated')
