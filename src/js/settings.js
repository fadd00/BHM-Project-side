// Settings Management
class SettingsManager {
    constructor(browserApp) {
        this.browserApp = browserApp;
        this.defaultSettings = {
            homepage: 'https://www.google.com',
            searchEngine: 'google',
            popupBlocker: true,
            darkMode: false,
            downloadPath: '',
            clearDataOnExit: false,
            autoUpdates: true,
            showBookmarksBar: true,
            tabPreview: true,
            notifications: true,
            zoom: 100
        };
        
        this.loadSettings();
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Settings form elements
        const settingsElements = {
            homepage: document.getElementById('homepage-input'),
            searchEngine: document.getElementById('search-engine-select'),
            popupBlocker: document.getElementById('popup-blocker'),
            darkMode: document.getElementById('dark-mode'),
            downloadPath: document.getElementById('download-path'),
            clearDataOnExit: document.getElementById('clear-data-on-exit'),
            autoUpdates: document.getElementById('auto-updates'),
            showBookmarksBar: document.getElementById('show-bookmarks-bar'),
            tabPreview: document.getElementById('tab-preview'),
            notifications: document.getElementById('notifications'),
            zoom: document.getElementById('zoom-level')
        };

        // Add event listeners for all settings
        Object.entries(settingsElements).forEach(([key, element]) => {
            if (element) {
                const eventType = element.type === 'checkbox' ? 'change' : 'input';
                element.addEventListener(eventType, () => {
                    this.updateSetting(key, this.getElementValue(element));
                });
            }
        });

        // Special handlers
        const clearDataBtn = document.getElementById('clear-data-btn');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }

        const resetSettingsBtn = document.getElementById('reset-settings-btn');
        if (resetSettingsBtn) {
            resetSettingsBtn.addEventListener('click', () => {
                this.resetSettings();
            });
        }

        const exportSettingsBtn = document.getElementById('export-settings-btn');
        if (exportSettingsBtn) {
            exportSettingsBtn.addEventListener('click', () => {
                this.exportSettings();
            });
        }

        const importSettingsBtn = document.getElementById('import-settings-btn');
        if (importSettingsBtn) {
            importSettingsBtn.addEventListener('click', () => {
                this.importSettings();
            });
        }

        // Download path browser
        const browseDownloadBtn = document.getElementById('browse-download-path');
        if (browseDownloadBtn) {
            browseDownloadBtn.addEventListener('click', () => {
                this.browseDownloadPath();
            });
        }

        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        const zoomResetBtn = document.getElementById('zoom-reset');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.adjustZoom(10);
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.adjustZoom(-10);
            });
        }

        if (zoomResetBtn) {
            zoomResetBtn.addEventListener('click', () => {
                this.setZoom(100);
            });
        }
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('browserSettings');
            if (savedSettings) {
                this.settings = { ...this.defaultSettings, ...JSON.parse(savedSettings) };
            } else {
                this.settings = { ...this.defaultSettings };
            }
            
            this.applySettings();
        } catch (error) {
            console.error('Error loading settings:', error);
            this.settings = { ...this.defaultSettings };
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('browserSettings', JSON.stringify(this.settings));
        } catch (error) {
            console.error('Error saving settings:', error);
        }
    }

    updateSetting(key, value) {
        this.settings[key] = value;
        this.applySettings();
        this.saveSettings();
    }

    applySettings() {
        // Apply homepage
        if (this.settings.homepage) {
            this.browserApp.homepage = this.settings.homepage;
        }

        // Apply dark mode
        document.body.classList.toggle('dark-mode', this.settings.darkMode);

        // Apply other visual settings
        this.applyZoom();
        this.applyBookmarksBar();
        this.applyTabPreview();

        // Update UI elements
        this.updateSettingsUI();
    }

    updateSettingsUI() {
        const settingsMap = {
            'homepage-input': this.settings.homepage,
            'search-engine-select': this.settings.searchEngine,
            'popup-blocker': this.settings.popupBlocker,
            'dark-mode': this.settings.darkMode,
            'download-path': this.settings.downloadPath,
            'clear-data-on-exit': this.settings.clearDataOnExit,
            'auto-updates': this.settings.autoUpdates,
            'show-bookmarks-bar': this.settings.showBookmarksBar,
            'tab-preview': this.settings.tabPreview,
            'notifications': this.settings.notifications,
            'zoom-level': this.settings.zoom
        };

        Object.entries(settingsMap).forEach(([elementId, value]) => {
            const element = document.getElementById(elementId);
            if (element) {
                this.setElementValue(element, value);
            }
        });
    }

    getElementValue(element) {
        switch (element.type) {
            case 'checkbox':
                return element.checked;
            case 'number':
                return parseFloat(element.value);
            case 'range':
                return parseFloat(element.value);
            default:
                return element.value;
        }
    }

    setElementValue(element, value) {
        switch (element.type) {
            case 'checkbox':
                element.checked = value;
                break;
            case 'number':
            case 'range':
                element.value = value;
                break;
            default:
                element.value = value;
        }
    }

    // Zoom management
    applyZoom() {
        const zoomLevel = this.settings.zoom / 100;
        document.body.style.zoom = zoomLevel;
    }

    adjustZoom(delta) {
        const newZoom = Math.max(25, Math.min(500, this.settings.zoom + delta));
        this.setZoom(newZoom);
    }

    setZoom(zoom) {
        this.updateSetting('zoom', zoom);
        
        // Update zoom display
        const zoomDisplay = document.getElementById('zoom-display');
        if (zoomDisplay) {
            zoomDisplay.textContent = `${zoom}%`;
        }
    }

    // Bookmarks bar
    applyBookmarksBar() {
        const bookmarksBar = document.getElementById('bookmarks-bar');
        if (bookmarksBar) {
            bookmarksBar.style.display = this.settings.showBookmarksBar ? 'flex' : 'none';
        }
    }

    // Tab preview
    applyTabPreview() {
        // Apply tab preview settings
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer) {
            tabsContainer.classList.toggle('tab-preview-enabled', this.settings.tabPreview);
        }
    }

    // Download path management
    async browseDownloadPath() {
        try {
            const { dialog } = require('electron').remote;
            const result = await dialog.showOpenDialog({
                title: 'Select Download Folder',
                properties: ['openDirectory']
            });

            if (!result.canceled && result.filePaths.length > 0) {
                this.updateSetting('downloadPath', result.filePaths[0]);
            }
        } catch (error) {
            console.error('Error browsing download path:', error);
        }
    }

    // Search engine management
    getSearchEngines() {
        return [
            { name: 'Google', value: 'google', url: 'https://www.google.com/search?q=' },
            { name: 'Bing', value: 'bing', url: 'https://www.bing.com/search?q=' },
            { name: 'DuckDuckGo', value: 'duckduckgo', url: 'https://duckduckgo.com/?q=' },
            { name: 'Yahoo', value: 'yahoo', url: 'https://search.yahoo.com/search?p=' },
            { name: 'Yandex', value: 'yandex', url: 'https://yandex.com/search/?text=' }
        ];
    }

    getSearchUrl(query) {
        const searchEngines = this.getSearchEngines();
        const engine = searchEngines.find(e => e.value === this.settings.searchEngine);
        return engine ? engine.url + encodeURIComponent(query) : 
               `https://www.google.com/search?q=${encodeURIComponent(query)}`;
    }

    // Clear all data
    async clearAllData() {
        try {
            const result = await ipcRenderer.invoke('show-message-box', {
                type: 'warning',
                buttons: ['Clear All', 'Cancel'],
                defaultId: 1,
                title: 'Clear All Data',
                message: 'This will clear all browsing data including history, bookmarks, cookies, and cache. Are you sure?'
            });

            if (result.response === 0) {
                // Clear history
                await ipcRenderer.invoke('clear-history');
                
                // Clear bookmarks
                const bookmarks = await ipcRenderer.invoke('get-bookmarks');
                for (const bookmark of bookmarks) {
                    await ipcRenderer.invoke('remove-bookmark', bookmark.id);
                }

                // Clear settings
                localStorage.clear();
                
                // Reset to defaults
                this.settings = { ...this.defaultSettings };
                this.applySettings();
                this.saveSettings();

                // Clear webview data
                const webviews = document.querySelectorAll('webview');
                webviews.forEach(webview => {
                    webview.clearData({
                        appcache: true,
                        cookies: true,
                        filesystem: true,
                        indexedDB: true,
                        localStorage: true,
                        shadercache: true,
                        websql: true,
                        serviceworkers: true,
                        cachestorage: true
                    });
                });

                // Show success message
                this.showNotification('All data cleared successfully!');
            }
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data. Please try again.');
        }
    }

    // Reset settings
    async resetSettings() {
        try {
            const result = await ipcRenderer.invoke('show-message-box', {
                type: 'warning',
                buttons: ['Reset', 'Cancel'],
                defaultId: 1,
                title: 'Reset Settings',
                message: 'This will reset all settings to their default values. Are you sure?'
            });

            if (result.response === 0) {
                this.settings = { ...this.defaultSettings };
                this.applySettings();
                this.saveSettings();
                this.showNotification('Settings reset successfully!');
            }
        } catch (error) {
            console.error('Error resetting settings:', error);
        }
    }

    // Export settings
    async exportSettings() {
        try {
            const { dialog } = require('electron').remote;
            const result = await dialog.showSaveDialog({
                title: 'Export Settings',
                defaultPath: 'browser-settings.json',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                ]
            });

            if (!result.canceled) {
                const settingsData = {
                    version: '1.0.0',
                    settings: this.settings,
                    exportDate: new Date().toISOString()
                };

                require('fs').writeFileSync(result.filePath, JSON.stringify(settingsData, null, 2));
                this.showNotification('Settings exported successfully!');
            }
        } catch (error) {
            console.error('Error exporting settings:', error);
            alert('Error exporting settings. Please try again.');
        }
    }

    // Import settings
    async importSettings() {
        try {
            const { dialog } = require('electron').remote;
            const result = await dialog.showOpenDialog({
                title: 'Import Settings',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] }
                ],
                properties: ['openFile']
            });

            if (!result.canceled) {
                const fileContent = require('fs').readFileSync(result.filePaths[0], 'utf-8');
                const settingsData = JSON.parse(fileContent);
                
                if (settingsData.settings) {
                    this.settings = { ...this.defaultSettings, ...settingsData.settings };
                    this.applySettings();
                    this.saveSettings();
                    this.showNotification('Settings imported successfully!');
                } else {
                    throw new Error('Invalid settings file format');
                }
            }
        } catch (error) {
            console.error('Error importing settings:', error);
            alert('Error importing settings. Please check the file format.');
        }
    }

    // Notification helper
    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #2ecc71;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            z-index: 10000;
            font-size: 14px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Get setting value
    getSetting(key) {
        return this.settings[key];
    }

    // Check if setting exists
    hasSetting(key) {
        return key in this.settings;
    }

    // Get all settings
    getAllSettings() {
        return { ...this.settings };
    }
}
