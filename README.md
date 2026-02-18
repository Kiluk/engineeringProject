# 🛡️ Phishing Detector

AI-powered email security using Claude API to detect phishing attempts.

## Features

- 🤖 Claude AI phishing detection
- 📧 Email analysis with confidence scoring
- 🚩 Flag suspicious emails
- 🌐 Works on web and mobile

## Setup

### Prerequisites

- Node.js 18+
- Anthropic API key (get one at https://console.anthropic.com)

### Installation

```bash
npm install
```

### Running on Web (Browser)

```bash
npm run web
```

This will start the Expo web server and open your browser. 

The app will:
1. Show a list of mock emails (or later your real Gmail messages)
2. Click **Connect Gmail** and grant permission to read your inbox
3. Input your Anthropic API key
4. Analyze each email using Claude
5. Display phishing detection results with confidence scores

### Future: Running on Mobile

```bash
npm run android  # Android device/emulator
npm run ios      # iOS device/simulator
```

## How It Works

1. **Email Input**: The app displays sample emails (mock data for now)
2. **AI Analysis**: Each email is sent to Claude 3.5 Sonnet with a phishing detection prompt
3. **Scoring**: Claude returns a confidence score (0-1) and brief reasoning
4. **User Action**: Flag emails you want to review or block

## API Key Security

The API key is entered at runtime and stored only in the app's memory (not persisted to disk).

## Project Structure

```
src/
  ├── App.js                  # Root component
  ├── screens/
  │   └── HomeScreen.js       # Email list & analysis UI
  ├── components/
  │   └── EmailCard.js        # Email display component
  └── services/
      └── phishingDetector.js # Claude integration
```

## Next Steps

- [x] Real Gmail API integration (OAuth) - currently connects and fetches recent messages from your account
- [ ] Email threading/conversations
- [ ] Custom phishing rules
- [ ] Mobile UI refinements
- [ ] Persistent flagged email storage

## License

MIT
