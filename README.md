# UTOP-3D V5.1.3.41

本版新增快捷鍵展示管理、3D觸發發光效果與雲端快速索引模式。

## V5.1.3.39

- 雲端專案改為 Google Drive 實體 JSON 檔。
- Google Sheet `Projects` 僅保存索引、Drive File ID、URL、鎖定、刪除狀態與統計。
- `CloudFolders` 與 Google Drive 真實資料夾同步建立。
- `工作表1!A2` 保留 Apps Script `/exec` 連結，不會被後端覆寫。
- 固定 Drive 根資料夾：`1tk-xe-G7_25yioCY1cTfrq_GuR7ajOmJ`。
- 舊 `Projects.data` 可安全搬移到 Drive，轉換後清空大型 JSON 儲存格。

## V5.1.3.34
- 舊版工作表1雲端專案偵測／安全匯入 Projects。
- folderName/name 新舊欄位相容。
- Apps Script 新增 legacyStatus / importLegacyProjects。

# UTOP-3D V5.1.3.33

本版重點：模組分工、責任隔離、公開介面與安全重構藍圖。

不改變既有3D、2D、接線、設備與存檔行為；新增的架構檔案目前主要作為後續重構基礎與診斷工具。

入口：
- 主模擬器：`index.html`
- 架構診斷：`architecture-diagnostic.html`
- 分工藍圖：`architecture-blueprint.html`

## V5.1.3.31 現場狀態與安全控制修正
- 繼電器／地感線圈／紅外線對射改為持續狀態接線，不再固定 450ms 後解除顯示。
- 柵欄機與鐵捲門的防砸／防壓輸入保持期間禁止關閉；解除後依設定秒數自動關閉。
- 雙向／三向號誌主機復歸後為全綠燈。
- 手動 Y 安裝高度改為固定安裝高度，避免被場景貼地同步覆蓋。
- 支架顯示改為共用屬性，切換後立即重建模型。
- World Sync 控制移至左下角。


## V5.1.3.39
- 雲端開啟前強制讀取「工作表1!A2」最新 /exec，不再優先使用寫死舊網址。
- Google Drive 遞迴掃描 .json，缺少 Projects 索引時自動重建。
- Drive 子資料夾缺少 CloudFolders 索引時自動建立對應。
- Projects 實體檔遺失時標記 MISSING，不自動刪除索引。
