#!/usr/bin/env python3
from pathlib import Path
import json
ROOT=Path(__file__).resolve().parents[1]
EXTS={'.js','.html','.css'}
rows=[]
for p in ROOT.rglob('*'):
    if not p.is_file() or p.suffix.lower() not in EXTS: continue
    txt=p.read_text('utf-8',errors='ignore')
    rel=p.relative_to(ROOT).as_posix()
    lines=txt.count('\n')+1
    size=p.stat().st_size
    risk='critical' if lines>=8000 else 'high' if lines>=3000 else 'medium' if lines>=1000 else 'normal'
    rows.append({'path':rel,'type':p.suffix[1:].upper(),'lines':lines,'bytes':size,'kb':round(size/1024,1),'risk':risk})
rows.sort(key=lambda x:x['lines'],reverse=True)
families={}
for r in rows:
    path=r['path']
    if path.startswith('runtime/showcase/runtime-v'): key='runtime/showcase 歷史版本'
    elif path.startswith('runtime/foundation/'): key='runtime/foundation'
    elif path.startswith('services/'): key='/'.join(path.split('/')[:2])
    else: continue
    families.setdefault(key,[]).append(r)
summary={'version':'V5.1.3.27','generated':'2026-08-08','totalFiles':len(rows),'totalLines':sum(r['lines'] for r in rows),'critical':sum(r['risk']=='critical' for r in rows),'high':sum(r['risk']=='high' for r in rows),'medium':sum(r['risk']=='medium' for r in rows),'runtimeShowcaseCount':sum(r['path'].startswith('runtime/showcase/runtime-v') for r in rows)}
recommendations=[
 {'priority':1,'area':'runtime/showcase','title':'3D 主 Runtime 拆分','reason':'單檔超過 11,000 行，且同目錄保留大量歷史 runtime 版本。','target':'scene / device / interaction / wiring / simulation / overlay'},
 {'priority':2,'area':'simulation','title':'接線與連動引擎獨立','reason':'DI/DO、Relay、Timer、設備動作互相耦合時最容易造成回歸。','target':'signal-bus / wiring-engine / timer-engine / simulation-clock'},
 {'priority':3,'area':'devices','title':'設備行為逐台模組化','reason':'設備模型、端子、設定、行為拆開後，修單一設備不需要碰主 Runtime。','target':'model / ports / behavior / config'},
 {'priority':4,'area':'2D/3D sync','title':'統一座標資料模型','reason':'2D、3D各自計算會造成位置、比例及平板旋轉後錯位。','target':'world-coordinate / projection / viewport-sync'},
 {'priority':5,'area':'css/style.css','title':'UI CSS 分區','reason':'主樣式檔接近 9,000 行，平板、手機、桌面規則容易互相覆蓋。','target':'layout / sidebar / responsive / dialogs / workspace / devices'},
 {'priority':6,'area':'features','title':'新功能禁止再塞主核心','reason':'影片輸出、簡報、環境特效、針球3D都適合獨立 feature。','target':'features/video-export / presentation / environment / needle-ball'},
]
out={'summary':summary,'files':rows,'families':{k:{'count':len(v),'lines':sum(x['lines'] for x in v),'top':v[:5]} for k,v in families.items()},'recommendations':recommendations}
out_path=ROOT/'diagnostics/project-metrics.json';out_path.parent.mkdir(exist_ok=True);out_path.write_text(json.dumps(out,ensure_ascii=False,indent=2),'utf-8')
print(json.dumps(summary,ensure_ascii=False))
