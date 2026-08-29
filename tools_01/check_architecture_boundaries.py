#!/usr/bin/env python3
from pathlib import Path
import re, json
ROOT = Path(__file__).resolve().parents[1]
CHECKS = [
    ('device-dom', ROOT/'devices', re.compile(r'\bdocument\.|\bwindow\.|querySelector\s*\('), '設備模組不應直接操作 DOM'),
    ('storage-three', ROOT/'storage', re.compile(r'\bTHREE\.|Object3D|WebGLRenderer'), 'Storage 不應依賴 Three.js'),
    ('simulation-dom', ROOT/'simulation', re.compile(r'\bdocument\.|querySelector\s*\('), 'Simulation 不應直接操作 DOM'),
    ('feature-runtime-private', ROOT/'features', re.compile(r"runtime/showcase/runtime-v"), 'Feature 不應直接依賴歷史 Runtime 私有檔案')
]
issues=[]
for code, folder, pattern, message in CHECKS:
    if not folder.exists():
        continue
    for p in folder.rglob('*.js'):
        text=p.read_text('utf-8', errors='ignore')
        if pattern.search(text):
            issues.append({'rule':code,'file':p.relative_to(ROOT).as_posix(),'message':message})
print(json.dumps({'root':str(ROOT),'issues':issues,'count':len(issues)},ensure_ascii=False,indent=2))
