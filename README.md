# **Dopamine Gate 🧠**

> A behavioral firewall for your brain. Think before you scroll.

**Dopamine Gate** is a Chrome extension that adds cognitive friction before accessing addictive websites (TikTok, Facebook, etc.).
Instead of blocking instantly, it forces reflection and uses AI to decide whether your visit is justified.

---

## 🚀 Why Dopamine Gate?

Most blockers are easy to bypass.
Dopamine Gate targets the **root problem: unconscious dopamine-driven behavior**.

It interrupts impulsive scrolling and forces your brain to switch from **autopilot mode → conscious decision mode**.

---

## ✨ Features

### 🔒 Domain Blocking

Manage a custom list of distracting websites (e.g., `tiktok.com`, `facebook.com`, `youtube.com`, ...).

---

### 🧠 Reflection Form

Before entering a blocked site, you must answer:

* **What is your purpose for visiting this site?**
* **Does this help your current goal?** (Yes / No / Unsure)
* **How long will you stay?** (2 min / 5 min / 10 min / Unlimited)
* **If you don’t visit, what will you do in the next 10 minutes?**
* **Would your mentor / future self approve this action?**

---

### 🤖 AI Decision Engine (Gemini)

Your answers are analyzed by Gemini AI, which classifies your intent and decides:

* ✅ Allow access
* ❌ Block and close the tab

---

### 📊 History & Logs

Track past decisions, visit attempts, and behavior patterns.

---

## 🧩 How It Works

1. Add distracting domains to the blocklist.
2. When you open a blocked site, a full-screen reflection form appears.
3. You answer the questions.
4. Gemini AI evaluates your intent.
5. The extension either:

   * Allows access
   * Blocks and closes the tab

---

## 🔑 Gemini API Key Setup

1. Get your API key from Google AI Studio
2. Open Dopamine Gate popup
3. Paste the key into **Settings → Gemini API Key**
4. Save

> If no API key is provided, the extension will block all flagged sites by default.

---

## 🧠 Philosophy

Dopamine Gate is based on behavioral psychology principles:

* **Cognitive friction** reduces impulsive actions
* **Self-reflection prompts** activate rational thinking
* **Future-self accountability** increases discipline

---

## 🛠 Tech Stack

* Chrome Extension Manifest V3
* TypeScript
* Vanilla JS + HTML + CSS
* Gemini AI API
* Chrome Storage Sync

---

## 🧪 Disclaimer

Dopamine Gate is **not a strict blocker**.
It’s designed to **train self-awareness and discipline**, not enforce it blindly.

---

## 💜 Enjoy mindful browsing!

> *“You don’t quit dopamine. You control it.”*
