# 🏓 Ping Pong Game .  
This is the ping pong game inspired by AI and how it could challenge the human awareness and observation.

# About

A simple browser-based Ping Pong game built with JavaScript, HTML5, and CSS — with coding assistance from **GitHub Copilot**. This project demonstrates the use of basic game loops, keyboard event handling, collision detection, and rendering using the HTML 5 element.

---

## 🎮 Features

- 🎯 Classic Ping Pong mechanics (2D paddle vs. ball)
- 🧠 AI or 2-player mode (optional)
- 🕹️ Keyboard controls for left and right paddle movement
- 📦 Lightweight and dependency-free (Vanilla JS)
- ⚙️ Built with guides and  suggestions from GitHub Copilot.

---

## 🚀 Getting Started

To run the game locally:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/kechomartin/ping-pong-game-by-copilot.git

   
#prrompts Used

| # | Prompt | Purpose |
|---|--------|---------|
| 1 | "Create a ping pong game in HTML/CSS/JS with two paddles and a bouncing ball" | Initial game scaffold |
| 2 | "Add a scoring system that tracks points for Player 1 and Player 2" | Score tracking |
| 3 | "Make the ball speed increase after each successful hit" | Difficulty progression |
| 4 | "Add keyboard controls — W/S for Player 1, Arrow Up/Down for Player 2" | Player input |
| 5 | "Add a win condition at 10 points and show a restart button" | Game state management |
| 6 | "Make the game responsive and center it on the page" | UI/layout polish |

---

## 💡 Learning Reflections

- **Be specific in prompts.** Vague requests like *"make it better"* yield generic results. Asking *"increase ball speed by 10% per rally"* gets precise output.
- **Iterate in small steps.** Adding one feature at a time (scoring → controls → win screen) made debugging easier.
- **AI doesn't hold state.** Each prompt is independent — always re-share relevant code when refining a feature.
- **Test immediately.** AI-generated game logic (collision detection, boundary checks) often needs small manual tweaks.
- **Prompt for comments.** Adding *"include inline comments"* to prompts made the output far easier to understand and modify.

---

## ⚠️ Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| Ball passes through paddle | Collision detection not accounting for ball radius | Add `ball.radius` offset to hit box check |
| Paddles move off screen | No boundary clamp on paddle Y position | Add `Math.max` / `Math.min` guards |
| Score not updating | `score` variable out of scope | Move score vars to global/module scope |
| Game loop too fast | `setInterval` interval too low | Use `requestAnimationFrame` instead |
| Restart button doesn't reset ball | Only score reset, not ball position | Reset `ball.x`, `ball.y`, and `ball.speed` on restart |
| Controls conflict in browser | Arrow keys scroll the page | Add `e.preventDefault()` in the keydown listener |

---

## 📚 Reference Resources

- **[MDN Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)** — Core rendering for the game
- **[MDN requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)** — Smooth game loop
- **[MDN KeyboardEvent](https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent)** — Keyboard input handling
- **[javascript.info — Game Loop](https://javascript.info/js-animation)** — Animation timing explained simply
- **[Claude.ai](https://claude.ai)** — AI used to generate and iterate on game code

