# Interactive Reinforcement Learning Tutorial

A hands-on, week-by-week interactive course companion covering a full RL syllabus —
from dynamic programming and tabular TD methods to DQN/Rainbow, PPO, actor-critic,
inverse RL, multi-agent RL, and model-based methods.

**Live locally:** open `index.html` in a browser (or serve the folder).

```bash
cd rl-interactive-tutorial
python3 -m http.server 8080
# visit http://localhost:8080
```

## What's inside

| Week | Topic | Interactive |
|------|--------|-------------|
| 1 | Course overview & environment setup | Checklist |
| 2 | Policy Iteration & Value Iteration | **GridWorld DP demo** |
| 3 | SARSA & Q-learning | **Cliff World demo** |
| 4 | Function approximation (linear FA) | **Tile-coding TD demo** |
| 5 | DQN & Rainbow | **Target-network toy** |
| 6 | Gradient-free policy search (ERL, CEM-RL) | — |
| 7 | REINFORCE & PPO | **PPO clip objective** |
| 8–9 | Term project proposals | Planning |
| 10 | Actor-critic (DDPG, TD3, SAC, REDQ) | **Twin-critic min demo** |
| 11 | Inverse RL & human preferences | — |
| 12 | Multi-agent RL (MADDPG, MAML) | — |
| 13 | Model-based RL (ME-TRPO, Dreamer) | — |
| 14 | Design of experiments | Checklist |
| 15–18 | Presentations & report writing | — |

Each lesson includes:

- Clear math (Bellman, TD targets, policy gradient, PPO-clip, …)
- Live canvas demos you can step / train
- Comparison tables and engineering tips
- A short quiz (progress saved in `localStorage`)

## Stack

- Vanilla HTML / CSS / JS — no build step
- Canvas visualizations in `js/`
- Works offline; safe to host on GitHub Pages

## Suggested path

1. Install `gymnasium`, `numpy`, and optionally `torch`.
2. Read Week 1, run the Week 2–3 demos until policies stabilize.
3. Implement Q-learning on `CliffWalking-v0` yourself.
4. Continue through policy gradient / actor-critic weeks.
5. Use Week 14’s experiment checklist for your term project.

## License

Free to use for study and teaching. Contributions welcome.
