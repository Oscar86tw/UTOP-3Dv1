# UTOP-3D Architecture

版本：V5.1.3.28

本版新增「模組分工與隔離藍圖」，建立公開 Contract、Service Container、Facade 規劃與跨模組禁止規則。

- `architecture-diagnostic.html`：現況診斷
- `architecture-blueprint.html`：未來責任分工與隔離藍圖
- `diagnostics/architecture-plan.json`：分工資料
- `core/contracts/`：跨模組資料與事件契約
- `core/service-container.js`：未來依賴注入容器，不直接綁定舊 Runtime
- `tools_01/check_architecture_boundaries.py`：邊界違規掃描工具

目前仍保留舊 Runtime，採漸進式遷移，不一次重寫。
