# Microsoft Rewards Bot

<p align="center">
	<img src="assets/logo.png" alt="Microsoft Rewards Bot logo" width="180" />
</p>

<p align="center">
	<a href="https://github.com/LightZirconite/Microsoft-Rewards-Bot/releases"><img src="https://img.shields.io/badge/version-3.5.0-blue?style=flat-square" alt="Version 3.5.0" /></a>
	<a href="https://nodejs.org/"><img src="https://img.shields.io/badge/node-≥20-brightgreen?style=flat-square&logo=nodedotjs" alt="Node.js 20+" /></a>
	<a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript" alt="TypeScript" /></a>
	<a href="https://discord.gg/k5uHkx9mne"><img src="https://img.shields.io/badge/Discord-Join-5865F2?style=flat-square&logo=discord&logoColor=white" alt="Discord" /></a>
	<a href="https://github.com/LightZirconite/Microsoft-Rewards-Bot/stargazers"><img src="https://img.shields.io/github/stars/LightZirconite/Microsoft-Rewards-Bot?style=flat-square&color=gold" alt="Stars" /></a>
</p>

<p align="center">
	<b>v3.5 Remaster</b> — The most advanced Microsoft Rewards automation tool.<br />
	Human-like behavior · Anti-detection · Multi-account · Dashboard · Scheduling
</p>

---

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/LightZirconite/Microsoft-Rewards-Bot.git
cd Microsoft-Rewards-Bot

# 2. Setup accounts
cp src/accounts.example.jsonc src/accounts.jsonc
# Edit src/accounts.jsonc with your Microsoft account(s)

# 3. Run
npm start
```

## Features

| Feature | Description |
|---------|-------------|
| 🤖 **Full Automation** | Daily Set, More Promotions, Punch Cards, Read to Earn, Daily Check-in |
| 🔍 **Smart Searches** | Desktop & Mobile with diverse query sources (Google Trends, Reddit) |
| 🛡️ **Anti-Detection** | Advanced fingerprinting, humanized delays, natural mouse movements |
| 📊 **Web Dashboard** | Real-time monitoring panel for all accounts |
| ⏰ **Built-in Scheduler** | Run automatically at specified times with jitter |
| 📱 **Multi-Account** | Process multiple accounts in parallel clusters |
| 🐳 **Docker Ready** | Production-ready containerization |
| 🔔 **Notifications** | Discord webhooks, NTFY push notifications |
| 🛠️ **Account Creator** | Automated Microsoft account registration |
| 💾 **Job State** | Resume-on-crash, skip completed accounts |

## Documentation

📚 **[Full Documentation](docs/index.md)** — Setup guides, configuration, scheduling, troubleshooting.

## Commands

| Command | Description |
|---------|-------------|
| `npm start` | Build and run the bot |
| `npm run dashboard` | Start web monitoring panel |
| `npm run creator` | Account creation wizard |
| `npm run dev` | Development mode with hot reload |
| `npm run docker:compose` | Run in Docker container |

## Account Creation Warning

⚠️ New accounts may be flagged if they earn points immediately. Let fresh accounts age 2-4 weeks before using them.

---

## 🔥 Why Choose This Bot?

This fork is the **most feature-complete and actively maintained** Microsoft Rewards automation tool. Here's how we compare to the original [TheNetsky/Microsoft-Rewards-Script](https://github.com/TheNetsky/Microsoft-Rewards-Script):

| Feature | **This Bot (v3.5 Remaster)** | Original Script |
|---------|:----------------------------:|:---------------:|
| **Anti-Detection System** | ✅ Advanced (fingerprints, humanization, gestures) | ⚠️ Basic |
| **Query Diversity Engine** | ✅ Multi-source (Google Trends, Reddit, News) | ❌ Google Trends only |
| **Web Dashboard** | ✅ Real-time monitoring | ❌ None |
| **Built-in Scheduler** | ✅ Internal scheduler with jitter | ❌ External cron only |
| **Account Creator** | ✅ Full automation wizard | ❌ None |
| **Job State Management** | ✅ Resume-on-crash, skip completed | ❌ None |
| **Error Reporting** | ✅ Automatic (helps improve project) | ❌ None |
| **Vacation Mode** | ✅ Natural usage patterns | ❌ None |
| **Risk Management** | ✅ Adaptive delays, ban prediction | ❌ None |
| **Documentation** | ✅ Comprehensive guides | ⚠️ Minimal (TODO) |
| **NTFY Push Notifications** | ✅ Supported | ❌ None |
| **Semantic Deduplication** | ✅ Smart query filtering | ❌ Basic dedup |
| **Human Typing Simulation** | ✅ Variable speed, typos | ⚠️ Fixed delay |
| **Compromised Mode Recovery** | ✅ Auto-handles security prompts | ❌ None |
| **Multi-Pass Runs** | ✅ Configurable passes per run | ❌ Single pass |

### Why the Remaster?

The original script served as a solid foundation, but lacked the sophisticated anti-detection measures required for long-term reliability. This remaster addresses:

1. **Detection Risk** — Microsoft actively monitors for bot behavior. Our advanced humanization (random delays, mouse gestures, scroll patterns) significantly reduces ban risk.

2. **Reliability** — Job state management means crashed runs resume where they left off. No more re-running completed accounts.

3. **Usability** — Web dashboard, comprehensive documentation, and built-in scheduling make this accessible to everyone—not just developers.

4. **Maintenance** — Active development with regular updates, bug fixes, and community support via Discord.

### Migration from Original Script

Already using TheNetsky's script? Migration is simple:

```bash
# Your accounts.jsonc format is compatible!
# Just copy your accounts file to src/accounts.jsonc
```

---

## Disclaimer

> ⚠️ **Use at your own risk.** Automation of Microsoft Rewards may lead to account suspension. This software is for educational purposes only. The authors are not responsible for any actions taken by Microsoft.

---

<p align="center">
	<a href="https://discord.gg/k5uHkx9mne">Discord</a> · 
	<a href="docs/index.md">Documentation</a> · 
	<a href="https://github.com/LightZirconite/Microsoft-Rewards-Bot/issues">Report Bug</a>
</p>
