# Academic Conference Check - Chrome Extension

A Chrome browser extension designed to help researchers identify suspicious and potentially predatory academic conferences.

## Overview

Academic Conference Check is a Manifest V3 Chrome extension that analyzes conference websites and flags potential red flags commonly associated with predatory conferences. It helps researchers avoid wasting time and money on low-quality or fraudulent academic events.

## Features

### Current Features (v1.0.0)

- **Comprehensive Page Scanning**: Extracts and analyzes actual page content including:
  - Email addresses (detects generic vs institutional emails)
  - Phone numbers
  - WhatsApp mentions and links
  - Conference deadlines
  - All links on the page
  - Page headings and structure

- **ML-Inspired Multi-Signal Analysis**: Advanced scoring system that evaluates:
  - Domain quality (academic TLDs, legitimate organizers)
  - Content quality (professionalism, completeness)
  - Legitimacy markers (organizing institution, peer review process, past proceedings, established series, academic partnerships)
  - Contact information (institutional vs generic emails, WhatsApp usage)
  - Suspicious patterns (guaranteed acceptance, rapid review, urgency language)

- **Risk Spectrum Display**: 6-level granular risk assessment:
  - 80-100: Highly Trustworthy
  - 70-79: Likely Legitimate
  - 55-69: Moderate - Verify Carefully
  - 40-54: Concerning - Exercise Caution
  - 25-39: High Risk - Likely Predatory
  - 0-24: Critical Risk - Avoid

- **Smart Features**:
  - Auto-injection of content script for page analysis
  - Conference information extraction (fees, deadlines, committees)
  - Google search integration for conference verification
  - Color-coded warnings (red/yellow/green)
  - Visual spectrum bar showing risk level
  - Detailed positive and negative signal reporting

- **Popup Interface**: Clean, user-friendly popup for manual conference checking
- **URL Analysis**: Check any conference website URL for suspicious patterns
- **Current Page Analysis**: Full content extraction and analysis
- **Auto-Detection**: Automatically scans conference pages and displays warning banners
- **Trust Score**: Neutral-based scoring (50 baseline) with comprehensive signals

### Planned Features

- Integration with known predatory conference databases
- Community reporting system
- Detailed analysis reports export
- Historical tracking of conferences
- Browser notifications for flagged sites

## Installation

### For Development/Testing

1. **Clone or download this repository**

2. **Generate icon files** (required before loading):
   ```bash
   pip install pillow
   python3 generate_icons.py
   ```
   See `ICONS_SETUP.md` for alternative options.

3. **Load the extension in Chrome**:
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the extension directory

4. **Start using**:
   - Click the extension icon in your toolbar
   - Enter a conference URL or check the current page

### For End Users

*Not yet available on Chrome Web Store - coming soon*

## Project Structure

```
Academic-Conference-Check/
├── manifest.json           # Extension manifest (Manifest V3)
├── background.js          # Background service worker
├── content.js            # Content script (page data extraction)
├── analyzer/
│   └── mlAnalyzer.js     # ML-inspired multi-signal analyzer
├── popup/
│   ├── popup.html        # Popup interface
│   ├── popup.css         # Popup styling
│   └── popup.js          # Popup functionality with risk spectrum
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
├── generate_icons.py     # Icon generator script
├── ICONS_SETUP.md        # Icon setup documentation
└── README.md            # This file
```

## How It Works

### Detection Methods

The extension uses a sophisticated multi-signal analysis approach:

1. **Domain Quality Analysis** (30% weight):
   - Academic TLDs (.edu, .ac.uk): +35 points
   - Legitimate organizers (IEEE, ACM, Springer): +30 points
   - Suspicious TLDs (.club, .xyz, .site): -25 points
   - Generic naming patterns: -20 points
   - Registration subdomains: Red flag

2. **Content Quality Analysis** (25% weight):
   - Organizing institution mentioned: +15 points
   - Peer review process described: +12 points
   - Past proceedings/publications: +18 points
   - Established series (e.g., "15th Annual"): +20 points
   - Academic partnerships: +25 points
   - Missing conference title: -25 points
   - Registration page as landing: -30 points
   - Urgency language: -20 points

3. **Contact Information Analysis** (15% weight):
   - Institutional emails (.edu, @ieee.org): +20 points
   - Generic emails (gmail, yahoo): -25 points (HIGH RISK)
   - WhatsApp mentions: -40 points (CRITICAL)

4. **Suspicious Pattern Detection** (30% weight):
   - Guaranteed acceptance: -35 points
   - Fast track publication: -20 points
   - Rapid acceptance language: -18 points
   - Identical/close deadlines: -25 points
   - Broad scope (5+ unrelated fields): -25 points

5. **Page Data Extraction**:
   - All emails and phone numbers
   - WhatsApp links and mentions
   - Conference deadlines
   - Registration fees
   - Committee information
   - All page links and headings

### Scoring System

- **Baseline**: 50 (neutral - assumes nothing)
- **Range**: 0-100
- **Approach**: Penalties for bad signals, bonuses for legitimacy markers
- **Final Score**: Weighted combination of all feature categories

### Risk Spectrum (6 Levels)

- **80-100** (Dark Green): Highly Trustworthy - Strong legitimacy indicators
- **70-79** (Green): Likely Legitimate - Positive signals outweigh concerns
- **55-69** (Yellow): Moderate - Verify Carefully - Mixed signals
- **40-54** (Orange): Concerning - Exercise Caution - Warning signs detected
- **25-39** (Red): High Risk - Likely Predatory - Strong indicators
- **0-24** (Dark Red): Critical Risk - Avoid - Severe red flags

## Usage Examples

### Check a Specific URL

1. Click the extension icon
2. Paste the conference website URL
3. Click "Check Conference"
4. Review the analysis results

### Check Current Page

1. Navigate to a conference website
2. Click the extension icon
3. Click "Analyze This Page"
4. Review the results

### Automatic Detection

- The extension automatically scans pages that appear to be conference websites
- If suspicious content is detected, a warning banner appears at the top of the page
- The banner shows detected red flags and provides additional information

## Red Flags to Watch For

The extension helps identify these common warning signs:

- ✓ Guaranteed or easy acceptance promises
- ✓ Unusually short review periods
- ✓ Broad or unfocused conference scope
- ✓ Unclear or fake organizer affiliations
- ✓ Excessive registration or publication fees
- ✓ Poor website quality or grammar
- ✓ Lack of previous conference history
- ✓ Missing editorial board information

## Development

### Technologies Used

- **Manifest V3**: Latest Chrome extension standard
- **Vanilla JavaScript**: No external dependencies
- **Chrome APIs**: Storage, Tabs, Runtime, Context Menus

### Key Files

- `manifest.json`: Extension configuration and permissions
- `background.js`: Service worker for background tasks
- `content.js`: Injected script for page analysis
- `popup/*`: User interface components

### Adding New Features

The codebase is structured to make additions straightforward:

1. **New detection patterns**: Add to `SUSPICIOUS_KEYWORDS` or `WARNING_KEYWORDS` in `content.js`
2. **Enhanced analysis**: Extend `performBasicAnalysis()` in `popup.js`
3. **UI improvements**: Modify `popup.html` and `popup.css`
4. **Background tasks**: Add functionality to `background.js`

## Privacy & Permissions

### Required Permissions

- **activeTab**: Access the current tab's URL and content for analysis
- **storage**: Save analysis results and user preferences
- **contextMenus**: Right-click menu integration
- **scripting**: Inject content script to extract page data
- **host_permissions**: Analyze conference websites across all URLs

### Privacy Commitment

- **Zero Data Collection**: No user data or browsing history is collected
- **100% Local Analysis**: All processing happens in your browser
- **No External Transmission**: Page data never leaves your computer
- **No Tracking**: No analytics, cookies, or user tracking
- **Open Source**: Full transparency - audit the code yourself
- **No Server Required**: Works completely offline after installation

## Contributing

Contributions welcome! Areas where help is needed:

- Building a database of known predatory conferences
- Improving detection algorithms
- Adding internationalization support
- Designing better icons and UI
- Writing documentation

## Known Limitations

- Icon files need to be generated separately before loading
- No database of known predatory conferences (manual pattern detection only)
- Chrome-only (Firefox/Edge support planned)
- Scoring weights are manually tuned (not trained on labeled data)
- Limited to text-based analysis (no image/PDF analysis)
- Cannot analyze conferences behind login walls

## Roadmap

- [ ] Integration with Beall's List and similar databases
- [ ] Machine learning-based analysis
- [ ] Community reporting and rating system
- [ ] Export analysis reports
- [ ] Browser action badge indicators
- [ ] Settings panel for customization
- [ ] Firefox and Edge support

## Resources

- [Beall's List](https://beallslist.net/) - Predatory journals and conferences
- [Think.Check.Submit](https://thinkchecksubmit.org/) - Conference checklist
- [COPE Guidelines](https://publicationethics.org/) - Publication ethics

## License

MIT License - See LICENSE file for details

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check existing documentation
- Review the red flags guide

## Disclaimer

This extension provides guidance but should not be the sole factor in deciding whether to attend a conference. Always:
- Verify organizer credentials
- Check conference history
- Consult with colleagues
- Review published proceedings
- Be cautious with registration fees

---

**Version**: 1.0.0
**Last Updated**: January 2026
**Status**: Beta - Development Version
# 📰 News Summary App

A modern web application that delivers daily news summaries in simple, easy-to-understand language. Stay informed without the complexity!

## ✨ Features

- **Daily News Summaries**: Get current day's news events summarized in simple language
- **Multi-Language Support**: Choose from 8 languages (English, Spanish, French, German, Italian, Portuguese, Arabic, Chinese)
- **Customizable Categories**: Select your news preferences from:
  - General
  - Business
  - Technology
  - Science
  - Health
  - Sports
  - Entertainment
- **Clean, Responsive UI**: Works beautifully on desktop and mobile devices
- **Easy to Understand**: News is simplified for better comprehension
- **Real-time Updates**: Refresh button to get the latest news anytime

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- (Optional) NewsAPI key for live news data

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Project-Ideas
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```
   This will install dependencies for both the server and client.

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your NewsAPI key (optional):
   ```
   NEWS_API_KEY=your_api_key_here
   PORT=5000
   ```

   > **Note**: You can get a free API key from [NewsAPI.org](https://newsapi.org/). If you don't provide an API key, the app will use mock data for demonstration.

### Running the Application

#### Development Mode

Run both server and client concurrently:
```bash
npm run dev
```

Or run them separately:

**Terminal 1 - Server:**
```bash
npm run server
```

**Terminal 2 - Client:**
```bash
npm run client
```

The application will be available at:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`

## 🎯 How to Use

1. **Open the app** in your browser at `http://localhost:3000`

2. **Select your preferences**:
   - Choose your preferred language from the dropdown
   - Select a news category that interests you

3. **Read the news**: Simplified summaries will be displayed in an easy-to-read card format

4. **Refresh**: Click the "Refresh" button to get the latest news

5. **Read more**: Click "Read full article →" on any card to view the complete story

## 🏗️ Project Structure

```
Project-Ideas/
├── server/                 # Backend Express server
│   ├── index.js           # Server entry point
│   ├── routes/
│   │   └── news.js        # News API routes
│   └── services/
│       ├── newsService.js     # News fetching logic
│       └── summaryService.js  # Text summarization
├── client/                # React frontend
│   ├── public/
│   │   └── index.html
│   └── src/
│       ├── components/    # React components
│       │   ├── Header.js
│       │   ├── PreferencesPanel.js
│       │   ├── NewsList.js
│       │   ├── NewsCard.js
│       │   └── LoadingSpinner.js
│       ├── App.js         # Main App component
│       └── index.js       # React entry point
├── package.json
└── README.md
```

## 🔧 API Endpoints

### Get Today's News
```
GET /api/news/today?language=en&category=general&country=us
```

### Get Available Categories
```
GET /api/news/categories
```

### Get Supported Languages
```
GET /api/news/languages
```

### Health Check
```
GET /api/health
```

## 🌍 Supported Languages

- English (en)
- Spanish (es)
- French (fr)
- German (de)
- Italian (it)
- Portuguese (pt)
- Arabic (ar)
- Chinese (zh)

## 📱 Responsive Design

The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## 🛠️ Technologies Used

### Backend
- Node.js
- Express.js
- Axios
- Node-Cache
- NewsAPI

### Frontend
- React 18
- CSS3 (with modern features)
- Axios

## 🔐 Security Notes

- Never commit your `.env` file
- Keep your API keys secure
- The `.gitignore` file is configured to exclude sensitive files

## 🐛 Troubleshooting

### Port already in use
If port 5000 or 3000 is already in use, you can change them:
- Server: Edit `PORT` in `.env` file
- Client: Create a `.env` file in the `client` folder with `PORT=3001`

### No news appearing
- Check if your NewsAPI key is valid
- Ensure you have an internet connection
- The app will use mock data if NewsAPI is unavailable

### CORS errors
Make sure the `proxy` setting in `client/package.json` matches your server port.

## 📝 Future Enhancements

- Email/SMS notifications for daily summaries
- Save favorite news articles
- Share articles on social media
- Voice reading of summaries
- Offline mode with cached news
- User accounts for personalized experience

## 📄 License

MIT License - feel free to use this project for learning and development!

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 💡 Tips

- The app caches news for 1 hour to reduce API calls
- Mock data is available if you don't have an API key
- News is automatically summarized to be easy to understand
- Complex words are replaced with simpler alternatives

---

**Enjoy staying informed with simple, clear news summaries!** 📰✨
