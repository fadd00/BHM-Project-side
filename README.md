# BHM Browser

A modern, customizable web browser built with Electron and Chromium. BHM Browser offers a clean, intuitive interface with powerful features for an enhanced browsing experience.

## Features

### Core Browsing
- **Tabbed Browsing**: Multiple tabs with drag-and-drop reordering
- **Modern UI**: Clean, responsive interface with customizable themes
- **Navigation Controls**: Back, forward, refresh, and home buttons
- **Address Bar**: Smart address bar with search suggestions and history
- **Security Indicators**: Visual SSL/HTTPS security status

### Bookmarks & History
- **Bookmark Management**: Add, remove, and organize bookmarks
- **Browsing History**: Track and revisit your browsing history
- **Quick Access**: Sidebar with bookmarks and history
- **Import/Export**: Import and export bookmarks in JSON/HTML format

### Customization
- **Dark Mode**: Toggle between light and dark themes
- **Homepage Setting**: Set your preferred homepage
- **Zoom Control**: Adjust page zoom levels
- **Pop-up Blocker**: Block unwanted pop-ups
- **Settings Panel**: Comprehensive settings management

### Advanced Features
- **Search Engine Selection**: Choose from multiple search engines
- **Keyboard Shortcuts**: Comprehensive keyboard navigation
- **Tab Context Menu**: Right-click tab options
- **Data Management**: Clear browsing data and cache
- **Settings Import/Export**: Backup and restore browser settings

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bhm-browser.git
   cd bhm-browser
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the browser:
   ```bash
   npm start
   ```

## Development

To run the browser in development mode:
```bash
npm run dev
```

To build the browser for distribution:
```bash
npm run build
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+T` | New Tab |
| `Ctrl+W` | Close Tab |
| `Ctrl+N` | New Window |
| `Ctrl+L` | Focus Address Bar |
| `Ctrl+R` | Refresh Page |
| `Ctrl+D` | Add Bookmark |
| `Ctrl+H` | Show History |
| `Ctrl+Shift+O` | Show Bookmarks |
| `Ctrl+Q` | Quit Browser |

## Project Structure

```
bhm-browser/
├── main.js                 # Main Electron process
├── package.json           # Project dependencies and scripts
├── src/                   # Source files
│   ├── index.html         # Main HTML file
│   ├── css/               # Stylesheets
│   │   ├── styles.css     # Main styles
│   │   ├── tabs.css       # Tab styles
│   │   ├── navigation.css # Navigation styles
│   │   └── sidebar.css    # Sidebar styles
│   └── js/                # JavaScript files
│       ├── browser.js     # Main browser logic
│       ├── tabs.js        # Tab management
│       ├── navigation.js  # Navigation management
│       ├── sidebar.js     # Sidebar management
│       ├── bookmarks.js   # Bookmark management
│       └── settings.js    # Settings management
├── assets/                # Static assets
│   └── icon.png          # Application icon
└── README.md             # This file
```

## Technologies Used

- **Electron**: Cross-platform desktop application framework
- **Chromium**: Web rendering engine
- **HTML5**: Modern web standards
- **CSS3**: Styling and animations
- **JavaScript**: Application logic and interactivity

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with [Electron](https://www.electronjs.org/)
- Powered by [Chromium](https://www.chromium.org/)
- Icons and UI inspired by modern browser designs

## Support

For support, please open an issue on the GitHub repository or contact the development team.

## Version History

- **1.0.0**: Initial release with core browsing features
- **1.1.0**: Added bookmarks and history management
- **1.2.0**: Implemented settings and customization options
- **1.3.0**: Added keyboard shortcuts and improved UI

## Building from Source

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn package manager

### Build Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run in development mode:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

4. Create distributable packages:
   ```bash
   npm run dist
   ```

## Troubleshooting

### Common Issues

1. **Browser won't start**: Check if Node.js and Electron are properly installed
2. **Tabs not working**: Ensure all JavaScript files are loaded correctly
3. **Bookmarks not saving**: Check file permissions and user data directory
4. **Dark mode not working**: Clear browser cache and restart

### Debug Mode

To run in debug mode with developer tools:
```bash
npm run dev
```

This will open the browser with DevTools enabled for debugging.

## Future Enhancements

- [ ] Extension support
- [ ] Sync across devices
- [ ] Advanced privacy controls
- [ ] Performance monitoring
- [ ] Custom themes
- [ ] Voice commands
- [ ] Screen capture tools
- [ ] PDF viewer integration
- [ ] Ad blocker
- [ ] Password manager integration
