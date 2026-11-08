import sys,re,time
from openpyxl import load_workbook
t=time.time()
wb=load_workbook("/mnt/user-data/uploads/1794138558208_Dữ_liệu_Golden_Bee.xlsx",read_only=True,data_only=True)
def fmt(v):
    if v is None: return ''
    if isinstance(v,float):
        return ('%g'%v)
    return str(v).replace('\t',' ').replace('\r',' ').replace('\n',' / ')
for i,ws in enumerate(wb.worksheets):
    name=re.sub(r'[^0-9A-Za-z]+','_',ws.title.encode('ascii','ignore').decode() or 'x').strip('_') or 'x'
    fn=f"{i:02d}_{name}.tsv"
    n=0;ne=0
    with open(fn,'w') as f:
        for ri,row in enumerate(ws.iter_rows(values_only=True),1):
            cells=[fmt(c) for c in row]
            while cells and cells[-1]=='': cells.pop()
            n+=1
            if cells:
                ne+=1
                f.write(str(ri)+'\t'+'\t'.join(cells)+'\n')
    print(i,repr(ws.title),fn,'rows',n,'nonempty',ne,flush=True)
print('secs',round(time.time()-t,1))
