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

- **🔒 Domain Blocking**: Manage a custom list of distracting websites (e.g., `tiktok.com`, `facebook.com`, `youtube.com`, ...).
- **📝 Reflection Form**: Before entering a blocked site, you must answer 6 mindfulness questions to activate your rational thinking.
- **🤖 AI Decision Engine (Gemini)**: Your answers are analyzed by Gemini AI, which classifies your intent and decides whether to allow or block access.
- **📊 History & Logs**: Track past decisions, visit attempts, and behavior patterns.

---

## � Reflection Questions

The extension uses 6 specific questions designed to break the dopamine loop:

1. **Purpose**: What are you here for? (Information? Replying? Or just escaping work?)
2. **Specific Goal**: What is the specific target of this scroll? (e.g., watch 3 videos, find 1 idea)
3. **Alternative**: If you don't use social media, what will you do instead?
4. **Outcome**: What do you want to receive in 10 minutes? (Knowledge? Real entertainment? Or just emptiness?)
5. **Need Type**: Do you need dopamine or information?
6. **Future Feeling**: If you scroll for 30 mins, how will you feel? ("Good/Worth it" or "Waste of time")

---

## 🚀 Installation (Individual Use - Free)

1. **Download Code**: Download this project folder or use `git clone`.
2. **Install & Build**:
   - Open a terminal in the project folder.
   - Run: `npm install` then `npm run build`.
3. **Add to Chrome**:
   - Go to `chrome://extensions/` in your browser.
   - Enable **Developer mode** in the top right.
   - Click **Load unpacked**.
   - Select the `dist` folder within this project.
4. **AI Configuration**:
   - Click the extension icon on the toolbar.
   - Go to the **Settings** tab.
   - Enter your [Gemini API Key](https://aistudio.google.com/apikey) (Free) and click **Save**.

---

## 🧩 How It Works

1. Add distracting domains to the blocklist.
2. When you open a blocked site, a full-screen reflection form appears.
3. You answer the questions honestly.
4. AI evaluates your intent.
5. The extension either allows access or blocks and closes the tab after 5 seconds.

---

## 🔑 Gemini API Key Setup

1. Get your API key from [Google AI Studio](https://aistudio.google.com/apikey).
2. Open Dopamine Gate popup by clicking the extension icon.
3. Paste the key into **Settings → Gemini API Key**.
4. Click **Save**.

> Note: If no API key is provided, the extension will show a warning and block access to flagged sites by default.

---

## 🧠 Philosophy

Dopamine Gate is based on behavioral psychology principles:
- **Cognitive friction** reduces impulsive actions.
- **Self-reflection prompts** activate rational thinking.
- **Future-self accountability** increases discipline.

---

## 🛠 Tech Stack

- Chrome Extension Manifest V3
- TypeScript
- Vanilla HTML + CSS
- Gemini AI API
- Chrome Storage Sync

---

## 🧪 Disclaimer

Dopamine Gate is **not a strict blocker**. 
It’s designed to **train self-awareness and discipline**, not enforce it blindly.

---

## 💜 Enjoy mindful browsing!

> *“You don’t quit dopamine. You control it.”*
