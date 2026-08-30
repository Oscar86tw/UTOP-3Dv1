# PIANO LEARNING V6.3.1

## Electronic Score Pipeline 第一階段

本版正式加入：
- MIDI Parser
- MIDI → ScoreModel Converter
- Electronic Score JSON Export

### MIDI 匯入後可取得
- BPM
- 拍號
- 調號
- 每顆音符的音高
- 起始 beat
- duration
- velocity
- 左右手

如果 MIDI 有多條 note tracks：
- 平均音高最高 track 判定為右手
- 其餘 note tracks 判定為左手

如果只有一條：
- C4（MIDI 60）以上預設右手
- C4 以下預設左手

### 套用到練習
按「套用到練習」後，
五線譜、紅線、鋼琴聲與底部琴鍵都改讀同一份 ScoreModel。

### Canon 38031
網路已確認相同版本存在對應 MIDI：
`38031-canon-in-d-sheet-piano-easy-fingering.mid`
但下載頁需購買，因此本專案沒有繞過付款取得檔案。
合法取得後，可直接在本版上傳轉成電子譜。
