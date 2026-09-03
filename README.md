# SolaEver Chrome Extension Wallet (SLE)

[![Build and Package Extension](https://github.com/makewalletfirst/SolaEver-wallet-extension/actions/workflows/build-extension.yml/badge.svg)](https://github.com/makewalletfirst/SolaEver-wallet-extension/actions/workflows/build-extension.yml)

A powerful, light-weight, and secure Chrome Extension wallet tailored specifically for the **SolaEver (SLE)** blockchain network. Developed using **Vite**, **React**, and **TypeScript**, it translates the robust security and fluid interface of a mobile application directly into the desktop web browser.

---

## 🌌 SolaEver Architecture & The Extension's Role

**SolaEver (SLE)** is an independent, high-performance L1 blockchain benchmarked from the **Agave (Solana v4.0)** architecture. It inherits Solana mainnet's core features — Tower BFT consensus, Gulf Stream, Sealevel runtime, and Proof of History (PoH) — while offering a low-cost developer playground.

The **SolaEver Chrome Extension Wallet** is the essential desktop portal of the ecosystem. It bridges browser-based DApps (such as Solana Playground or custom token minters) with the SolaEver chain by:
* **Managing Digital Assets**: Seamlessly supporting native SLE and custom SPL tokens.
* **On-Chain DApp Connector**: Enabling web DApps to request transactions, check balances, and sign data with secure, user-authorized approvals.
* **Keystore Provider**: Storing BIP39 seed phrases securely on-device behind password-protected encryption blocks.

---

## 🛠 Tech Stack

* **Frontend Framework**: React 19, TypeScript, Vite
* **Styling & UI**: Tailwind CSS, Lucide React (vector icons)
* **Blockchain Integrations**: `@solana/web3.js` (v1.98.4), `@solana/spl-token` (v0.4.14)
* **Cryptographic Foundation**: BIP39, `ed25519-hd-key`, `buffer` Polyfill, `crypto-browserify`, `stream-browserify`
* **Chrome Extension Compiler**: **CRXJS Vite Plugin** (modern bundler for seamless Manifest V3 extensions)
* **Vite Plugins**: `vite-plugin-node-polyfills` (injects standard Node modules automatically to prevent browser compilation errors)

---

## ⚡ Key Features

### 1. Secure Wallet Administration
* **BIP39 Seed Phrases**: Support for generating new 12-word seed phrases or restoring existing wallets.
* **Multi-Account Structuring**: Create and switch between multiple sub-accounts easily.
* **Asset Personalization**: Assign custom aliases to accounts and toggle view details.
* **Authorization Locks**: Set master passwords to lock/unlock the wallet interface, terminating active sessions automatically.

### 2. Streamlined Asset & Metadata Tracking
* **Native SLE Operations**: Send and receive native SLE assets in real-time.
* **SPL Token Support**: Add custom token mint addresses manually to track balances and transfer custom tokens.
* **Dynamic Metaplex Metadata Resolution**: Resolves custom token names and symbols dynamically by querying the Metaplex Metadata Program PDA on-chain, eliminating static registry limits.
* **Recent Activity Feed**: Easily view recent transaction logs with direct links to the block explorer.

### 3. Desktop Optimized Experience
* **Auto-Sync Engine**: Balance states, token inventories, and transaction statuses are re-fetched every 5 seconds using `processed` commitment level logic.
* **Expand View Interface**: Supports opening the extension in a full-sized browser tab for a more comfortable desktop dashboard.
* **Interactive Modals & Toasts**: Real-time notifications and automatic address-copying tools with QR code generation.

---

## 📦 How to Install (Local Build)

You can build and sideload the extension into your Chrome-based browser.

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Extension
Compile the React frontend and bundle Chrome extension assets:
```bash
npm run build
```
This command compiles the TypeScript codebase and outputs a Manifest V3 compliant extension into the `dist/` directory.

### 3. Package the Extension (Optional)
If you want to package the extension into a single zip file for sharing:
```bash
cd dist
zip -r ../solaever-wallet-extension.zip .
cd ..
```

### 4. Load into Chrome
1. Open Google Chrome or any Chromium-based browser (e.g., Brave, Edge).
2. Go to the Extensions settings page by navigating to `chrome://extensions/`.
3. Enable the **"Developer mode"** toggle in the top-right corner.
4. Click **"Load unpacked"** in the top-left corner.
5. Select the generated `dist/` directory inside your local repository.

---

Developed with 💚 for the **SolaEver Network** ecosystem.
