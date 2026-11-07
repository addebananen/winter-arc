"""Reproducible code-native PWA icon; Python standard library only."""
import math, struct, zlib
from pathlib import Path
root=Path(__file__).resolve().parents[1]/'src'
segments=[((95,174),(163,345)),((163,345),(256,174)),((256,174),(349,345)),((349,345),(417,174))]
stars=[((256,100),(256,126)),((243,113),(269,113))]
def distance(x,y,a,b):
 dx=b[0]-a[0];dy=b[1]-a[1];t=max(0,min(1,((x-a[0])*dx+(y-a[1])*dy)/(dx*dx+dy*dy)))
 return math.hypot(x-a[0]-t*dx,y-a[1]-t*dy)
def chunk(kind,data):return struct.pack('>I',len(data))+kind+data+struct.pack('>I',zlib.crc32(kind+data)&0xffffffff)
for size,name in [(192,'icon-192.png'),(512,'icon-512.png'),(180,'apple-touch-icon.png')]:
 rows=[]
 for py in range(size):
  row=bytearray([0])
  for px in range(size):
   x=(px+.5)*512/size;y=(py+.5)*512/size
   d=min(distance(x,y,*s) for s in segments)-12
   ds=min(distance(x,y,*s) for s in stars)-4.5
   cover=max(0,min(1,.5-d*size/512));sc=max(0,min(1,.5-ds*size/512))
   bg=(16,23,25);fg=(198,231,223);gold=(223,197,148)
   row.extend(round((bg[i]*(1-cover)+fg[i]*cover)*(1-sc)+gold[i]*sc) for i in range(3))
  rows.append(row)
 data=b'\x89PNG\r\n\x1a\n'+chunk(b'IHDR',struct.pack('>IIBBBBB',size,size,8,2,0,0,0))+chunk(b'IDAT',zlib.compress(b''.join(rows),9))+chunk(b'IEND',b'')
 (root/name).write_bytes(data)
