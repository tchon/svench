# Svench

> A lightweight workbench to develop your Svelte components in isolation.

---

<p align="center">
  <strong>WORK IN PROGRESS</strong>
</p>

---

## Status

This is very much a work in progress. Actually, it's still little more than a POC for now.

You're welcome to reach to me via Svelte's Discord channel or issue to contribute ideas (or more)!

Docs are currently being rewritten for v0.2. You can find previous docs in the [legacy README](https://github.com/rixo/svench/tree/v0.1#readme).

## v0.2

### Usage

```bash
yarn init -y
yarn add -D vite rollup-plugin-svelte-hot@next svench@beta
mkdir src
echo '# Hello' > src/hello.md
echo '<h1>Hi!</h1>' > src/Hi.svench
yarn svench
```
