# Dopamine Gate 🧠

A Chrome extension that blocks distracting websites with AI-powered reflection prompts. Before accessing blocked sites, you must answer reflection questions - an AI (Google Gemini) evaluates your responses and decides whether to allow or block access.

## Features

- **🚫 Domain Blocklist**: Block distracting websites (Facebook, TikTok, Twitter, etc.)
- **📝 Reflection Form**: Answer 5 mindfulness questions before accessing blocked sites
- **🤖 AI Evaluation**: Gemini AI classifies your intent and makes allow/block decisions
- **📊 Decision Logs**: Track your browsing decisions over time
- **🎨 Beautiful UI**: Modern, dark-themed glassmorphism design

## Installation

### Prerequisites

- Google Chrome browser
- [Gemini API Key](https://aistudio.google.com/apikey) (free)

### Steps

1. **Clone or download this repository**

2. **Install dependencies and build**
   ```bash
   npm install
   npm run build
   ```

3. **Load in Chrome**
   - Open `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `dist` folder

4. **Configure API Key**
   - Click the extension icon
   - Go to "Settings" tab
   - Enter your Gemini API key
   - Click "Save"

## How It Works

### Reflection Questions

When you visit a blocked site, you'll see an overlay with 5 questions:

1. **Purpose**: "Mục đích vào trang này là gì?" (min 20 chars)
2. **Goal Alignment**: "Việc này có giúp goal hiện tại của bạn không?"
3. **Time Budget**: "Bạn định ở đây bao lâu?"
4. **Alternative Action**: "Nếu bạn không vào trang này, bạn sẽ làm gì trong 10 phút tới?" (min 20 chars)
5. **Mentor Approval**: "Nếu mentor / future you nhìn thấy, bạn có đồng ý với hành động này không?"

### Decision Logic

**Client-side rules (instant block):**
- If mentor approval = "No" → Block
- If goal alignment = "No" AND time = "Unlimited" → Block

**AI Classification:**
- `productive` → Allow
- `neutral` → Allow cautiously
- `procrastination` → Block
- `emotional_escape` → Block

### After Decision

- **Allowed**: Overlay disappears, you can browse
- **Blocked**: Message shown, tab closes after 5 seconds

## Project Structure

```
dopamine-gate/
├── src/
│   ├── background.ts      # Service worker - URL monitoring
│   ├── contentScript.ts   # Overlay injection & form handling
│   ├── gemini.ts          # Gemini API client
│   ├── storage.ts         # Chrome storage utilities
│   ├── types.ts           # TypeScript interfaces
│   ├── popup.html         # Settings popup UI
│   ├── popup.css          # Popup styles
│   ├── popup.ts           # Popup logic
│   ├── overlay.css        # Reflection overlay styles
│   └── icons/             # Extension icons
├── dist/                  # Compiled output (load this in Chrome)
├── manifest.json          # Extension manifest (MV3)
├── tsconfig.json          # TypeScript config
└── package.json           # Dependencies
```

## Development

```bash
# Install dependencies
npm install

# Build once
npm run build

# Watch mode (auto-rebuild on changes)
npm run watch
```

After making changes, go to `chrome://extensions/` and click the refresh icon on the extension.

## Tech Stack

- **TypeScript** - Type-safe JavaScript
- **Chrome Manifest V3** - Modern extension API
- **Google Gemini API** - AI decision engine
- **Vanilla CSS** - No frameworks, pure CSS

## Privacy

- Your Gemini API key is stored locally in Chrome's sync storage
- Decision logs are stored locally only
- No data is sent to any server except the Gemini API

## License

MIT License - Feel free to modify and distribute.

---

**Made with 💜 to help you stay focused**
