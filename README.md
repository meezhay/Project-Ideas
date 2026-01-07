# Academic Conference Check - Chrome Extension

A Chrome browser extension designed to help researchers identify suspicious and potentially predatory academic conferences.

## Overview

Academic Conference Check is a Manifest V3 Chrome extension that analyzes conference websites and flags potential red flags commonly associated with predatory conferences. It helps researchers avoid wasting time and money on low-quality or fraudulent academic events.

## Features

### Current Features (v1.0.0)

- **Popup Interface**: Clean, user-friendly popup for manual conference checking
- **URL Analysis**: Check any conference website URL for suspicious patterns
- **Current Page Analysis**: Quickly analyze the page you're currently viewing
- **Auto-Detection**: Automatically scans conference pages for suspicious keywords
- **Warning Banner**: Displays in-page warnings when suspicious content is detected
- **Risk Levels**: Classifies conferences as low, medium, or high risk
- **Trust Score**: Provides a numerical score (0-100) indicating trustworthiness

### Planned Features

- Integration with known predatory conference databases
- Machine learning-based analysis
- Community reporting system
- Detailed analysis reports
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
├── content.js            # Content script (runs on web pages)
├── popup/
│   ├── popup.html        # Popup interface
│   ├── popup.css         # Popup styling
│   └── popup.js          # Popup functionality
├── icons/
│   ├── icon16.png        # 16x16 icon
│   ├── icon48.png        # 48x48 icon
│   └── icon128.png       # 128x128 icon
├── generate_icons.py     # Icon generator script
└── README.md            # This file
```

## How It Works

### Detection Methods

The extension uses multiple detection strategies:

1. **Keyword Analysis**: Scans for suspicious phrases like:
   - "Guaranteed acceptance"
   - "Fast track publication"
   - "No peer review"
   - "Easy publication"

2. **Pattern Matching**: Identifies common red flags:
   - Unusually broad conference scope
   - Multiple unrelated topics
   - Vague organizer information

3. **URL Analysis**: Checks domain patterns and structures

4. **Content Analysis**: Examines page content for predatory indicators

### Warning Levels

- **Low Risk** (Green): No immediate red flags detected
- **Medium Risk** (Yellow): Some suspicious indicators found
- **High Risk** (Red): Multiple red flags or known predatory patterns

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

- **activeTab**: Access the current tab's URL for analysis
- **storage**: Save analysis results and user preferences
- **host_permissions**: Analyze conference websites

### Privacy Commitment

- No data collection or external transmission
- All analysis happens locally in your browser
- No tracking or analytics
- Open source for transparency

## Contributing

Contributions welcome! Areas where help is needed:

- Building a database of known predatory conferences
- Improving detection algorithms
- Adding internationalization support
- Designing better icons and UI
- Writing documentation

## Known Limitations

- Currently uses basic pattern matching (ML features planned)
- Icon files need to be generated separately
- Limited to keyword-based detection in v1.0
- No database integration yet

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