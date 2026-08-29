#!/usr/bin/env python3
from pathlib import Path
import sys

LIMIT = 95

root = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
violations = []

for folder in [root, *sorted(path for path in root.rglob("*") if path.is_dir())]:
    files = [path for path in folder.iterdir() if path.is_file()]
    if len(files) > LIMIT:
        violations.append((folder, len(files)))

if violations:
    print("檢查失敗：以下資料夾超過95個檔案")
    for folder, count in violations:
        print(f"- {folder.relative_to(root)}：{count}個")
    raise SystemExit(1)

print("檢查通過：每一層資料夾均不超過95個檔案")
