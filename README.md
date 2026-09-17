# 強化學習互動教學

一份可互動、可動手跑的強化學習（Reinforcement Learning, RL）課程教材，涵蓋完整 18 週課綱：從動態規劃與表格型 TD 方法，到 DQN/Rainbow、PPO、Actor-Critic、逆強化學習、多智能體與基於模型的 RL。

[![Lessons](https://img.shields.io/badge/lessons-18%20weeks-4ADE80)](lessons/)
[![Stack](https://img.shields.io/badge/HTML%20·%20CSS%20·%20JS-零建置-38BDF8)]()
[![License](https://img.shields.io/badge/License-free%20for%20learning-A78BFA)]()

**在 GitHub Pages 上瀏覽：** 啟用 Pages 後開啟專案首頁。

```bash
cd rl-interactive-tutorial
python3 -m http.server 8080
# 瀏覽器開啟 http://localhost:8080
```

<p align="center">
  <img src="assets/course-map.svg" alt="強化學習互動教學課程地圖：從表格型基礎到深度 RL、進階方法與專題" width="100%">
</p>

---

## 課程內容

| 週次 | 主題 | 互動 |
|------|------|------|
| 1 | 課程導覽與環境設定 | 清單 |
| 2 | 策略迭代與價值迭代 | **GridWorld DP 演示** |
| 3 | SARSA 與 Q-learning | **懸崖世界演示** |
| 4 | 函數近似（線性 FA） | **Tile coding TD** |
| 5 | DQN 與 Rainbow | **目標網路示範** |
| 6 | 無梯度策略搜尋（ERL、CEM-RL） | — |
| 7 | REINFORCE 與 PPO | **PPO clip 目標** |
| 8–9 | 學期專題提案 | 規劃 |
| 10 | Actor-Critic（DDPG、TD3、SAC、REDQ） | **雙 Q 取最小演示** |
| 11 | 逆強化學習與人類偏好 | — |
| 12 | 多智能體強化學習（MADDPG、MAML） | — |
| 13 | 基於模型的 RL（ME-TRPO、Dreamer） | — |
| 14 | 實驗設計 | 清單 |
| 15–18 | 專題報告與寫作 | — |

每課包含：公式說明、可逐步執行的 Canvas 演示、比較表、工程實務建議，以及小測驗（進度存在瀏覽器 `localStorage`）。

---

## 建議學習路徑

1. 安裝 `gymnasium`、`numpy`，可選 `torch`
2. 讀第 1 週，把第 2–3 週演示跑到策略穩定
3. 自行在 `CliffWalking-v0` 實作 Q-learning
4. 續學策略梯度 / Actor-Critic
5. 用第 14 週的實驗清單做學期專題

---

## 技術

- 純 HTML / CSS / JS，無需建置
- Canvas 視覺化位於 `js/`
- 可離線使用，適合 GitHub Pages

---

## 授權

自由使用於學習與教學。
