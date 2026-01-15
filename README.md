<div align="center">
  <img src="src/assets/icon.png" alt="Animated LLM Logo" width="50" />

  <h1>AnimatedLLM</h1>

  <p>
    <strong>Understand the mechanics of LLMs.</strong>
  </p>

  <p>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT" />
    </a>
    <a href="http://makeapullrequest.com">
      <img src="https://img.shields.io/badge/PRs-welcome-yellow.svg" alt="PRs Welcome" />
    </a>
    <a href="https://animatedllm.github.io">
      <img src="https://img.shields.io/website?url=https%3A%2F%2Fanimatedllm.github.io&label=animatedllm.github.io" alt="Website" />
    </a>
    <a href="#">
      <img src="https://img.shields.io/badge/arXiv-TBD-red.svg" alt="arXiv" />
    </a>
  </p>

  <br />

  <img src="public/peek.gif" alt="Animated LLM Preview" width="100%" />
</div>

<br />

## 🎓 What is this?

An educational web application designed to teach the how large language models (LLMs) work.

👉 **Try it yourself at** **[animatedllm.github.io](https://animatedllm.github.io)**

Instead of static diagrams or abstract equations, it provides a dynamic, step-by-step visualizations of the Transformer architecture in action.

The application runs **entirely in your browser** using pre-computed data.

## ⌨️ Controls

Navigate the animation using your keyboard:

| Key       | Action                    |
| :-------- | :------------------------ |
| `Space`   | Play / Pause animation    |
| `→` / `←` | Step forward / backward   |
| `N`       | Skip to next token        |
| `G`       | Skip to end of generation |
| `R`       | Reset animation           |
| `T`       | Toggle theme (Light/Dark) |
| `L`       | Switch language           |
| `H`       | Show shortcuts help       |

## 🚀 Running locally

For running the app on your own device, you will need [Node.js](https://nodejs.org/) (version 20.9.0 or higher) and npm installed.

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests to us.

## 📚 Cite Us

If you use AnimatedLLM in your research or teaching, please cite our [paper](https://arxiv.org/abs/2601.04213):

```bibtex
@misc{kasner2025animated,
      title={AnimatedLLM: Explaining LLMs with Interactive Visualizations},
      author={Zdeněk Kasner and Ondřej Dušek},
      year={2025},
      eprint={2601.04213},
      archivePrefix={arXiv},
      primaryClass={cs.CL},
      url={https://arxiv.org/abs/2601.04213},
}
```
