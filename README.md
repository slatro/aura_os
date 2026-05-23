# AURA_OS 🔮

A SocialFi dApp built on **Monad** — the highest performance EVM-compatible blockchain.

## Features

- 🪪 **On-Chain Identity** — Mint your profile with a real Aura Score based on Monad Mainnet activity
- 📡 **On-Chain Stream** — Post and like broadcasts directly on the blockchain
- 🏆 **Global Radar** — Leaderboard of top Aura holders
- 💼 **Portfolio** — Track cards you own and holders of your card
- 💬 **Token-Gated Rooms** — Private on-chain chat, only for card holders
- 🎯 **New Cards (Sniper Mode)** — Discover and snipe newly minted profiles
- 📈 **Bonding Curve Trading** — Buy and sell profile cards with dynamic pricing

## Tech Stack

- **Frontend:** React + TypeScript + Vite
- **Styling:** Vanilla CSS (Cyberpunk dark theme)
- **Auth:** Privy (wallet + Twitter)
- **Web3:** Wagmi + viem
- **Router:** React Router v7
- **Smart Contract:** Solidity 0.8.20 (Monad Testnet)

## Scoring Formula

| Metric | Points |
|--------|--------|
| 1 Mainnet Tx | 5 pts |
| 1 MON | 0.01 pts |
| 1 X Follower | 1 pt |

## Tier System

| Tier | Threshold |
|------|-----------|
| 🟣 Aura God | 150,000+ |
| 🔵 Whale | 50,000+ |
| 🟠 Shark | 15,000+ |
| 🟡 Node | 5,000+ |
| 🟢 Operator | 1,000+ |
| ⚪ Initiate | < 1,000 |

## Contract

**Monad Testnet:** `0x40374c8ae39c36c456d45d9E2390bb5639F4302e`

## Security

- ReentrancyGuard on all ETH-transferring functions
- Checks-Effects-Interactions (CEI) pattern
- Input validation & length limits
- Frontend XSS sanitization
- Content Security Policy headers
