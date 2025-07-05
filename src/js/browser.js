// Main Browser Application
const { ipcRenderer } = require('electron');

class BrowserApp {
    constructor() {
        this.tabs = new Map();
        this.activeTabId = null;
        this.tabCounter = 0;
        this.isLoading = false;
        this.sidebarOpen = false;
        this.homepage = 'https://www.google.com';
        
        this.initializeApp();
        this.setupEventListeners();
        this.loadSettings();
    }

    initializeApp() {
        // Initialize Arc theme if present
        if (document.body.classList.contains('arc-theme')) {
            this.arcTheme = new ArcBrowserTheme(this);
        }

        // Create the first tab
        this.createNewTab();
        
        // Initialize components
        this.navigation = new NavigationManager(this);
        this.bookmarks = new BookmarksManager(this);
        this.settings = new SettingsManager(this);
    }

    setupEventListeners() {
        // IPC event listeners
        ipcRenderer.on('new-tab', () => this.createNewTab());
        ipcRenderer.on('close-tab', () => this.closeActiveTab());
        ipcRenderer.on('add-bookmark', () => this.addCurrentPageToBookmarks());
        ipcRenderer.on('show-bookmarks', () => this.showBookmarks());
        ipcRenderer.on('show-history', () => this.showHistory());
        ipcRenderer.on('history-cleared', () => this.onHistoryCleared());

        // Window controls
        this.setupWindowControls();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }

    setupWindowControls() {
        const minimizeBtn = document.getElementById('minimize-btn');
        const maximizeBtn = document.getElementById('maximize-btn');
        const closeBtn = document.getElementById('close-btn');

        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', () => {
                ipcRenderer.send('minimize-window');
            });
        }

        if (maximizeBtn) {
            maximizeBtn.addEventListener('click', () => {
                ipcRenderer.send('maximize-window');
            });
        }

        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                ipcRenderer.send('close-window');
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey || e.metaKey) {
                switch (e.key) {
                    case 't':
                        e.preventDefault();
                        this.createNewTab();
                        break;
                    case 'w':
                        e.preventDefault();
                        this.closeActiveTab();
                        break;
                    case 'n':
                        e.preventDefault();
                        this.createNewWindow();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.focusAddressBar();
                        break;
                    case 'r':
                        e.preventDefault();
                        this.refreshActiveTab();
                        break;
                    case 'd':
                        e.preventDefault();
                        this.addCurrentPageToBookmarks();
                        break;
                    case 'h':
                        e.preventDefault();
                        this.showHistory();
                        break;
                }
            }
        });
    }

    createNewTab(url = this.homepage) {
        const tabId = `tab-${++this.tabCounter}`;
        const tab = {
            id: tabId,
            title: 'New Tab',
            url: url,
            favicon: null,
            loading: false,
            canGoBack: false,
            canGoForward: false,
            webview: null
        };

        this.tabs.set(tabId, tab);
        this.activeTabId = tabId;
        
        // Create tab UI
        this.createTabElement(tab);
        this.createWebviewElement(tab);
        
        // Navigate to URL
        if (url && url !== 'about:blank') {
            this.navigateTab(tabId, url);
        }

        return tabId;
    }

    createTabElement(tab) {
        // Check if we're using Arc theme
        if (document.body.classList.contains('arc-theme')) {
            // Arc theme handles tab creation differently
            if (this.arcTheme) {
                this.arcTheme.onTabCreated(tab);
            }
            return;
        }

        const tabsContainer = document.getElementById('tabs-container');
        const tabElement = document.createElement('div');
        tabElement.className = 'tab';
        tabElement.dataset.tabId = tab.id;
        
        tabElement.innerHTML = `
            <div class="tab-favicon"></div>
            <div class="tab-title">${tab.title}</div>
            <button class="tab-close" data-tab-id="${tab.id}"></button>
        `;

        tabsContainer.appendChild(tabElement);
        this.activateTab(tab.id);
    }

    createWebviewElement(tab) {
        const webviewContainer = document.getElementById('webview-container');
        if (!webviewContainer) {
            console.error("'webview-container' not found in the DOM.");
            return;
        }

        const webview = document.createElement('webview');
        webview.dataset.tabId = tab.id;
        webview.src = tab.url;

        webviewContainer.appendChild(webview);

        tab.webview = webview;
        this.setupWebviewEvents(tab);
    }

    setupWebviewEvents(tab) {
        const webview = tab.webview;
        
        webview.addEventListener('dom-ready', () => {
            this.onTabLoaded(tab.id);
        });

        webview.addEventListener('did-start-loading', () => {
            this.onTabStartLoading(tab.id);
        });

        webview.addEventListener('did-stop-loading', () => {
            this.onTabStopLoading(tab.id);
        });

        webview.addEventListener('did-fail-load', (event) => {
            this.onTabFailedLoad(tab.id, event.errorDescription);
        });

        webview.addEventListener('page-title-updated', (event) => {
            this.updateTabTitle(tab.id, event.title);
        });

        webview.addEventListener('page-favicon-updated', (event) => {
            this.updateTabFavicon(tab.id, event.favicons[0]);
        });

        webview.addEventListener('did-navigate', (event) => {
            this.onTabNavigated(tab.id, event.url);
        });

        webview.addEventListener('did-navigate-in-page', (event) => {
            this.onTabNavigated(tab.id, event.url);
        });

        webview.addEventListener('new-window', (event) => {
            this.createNewTab(event.url);
        });
    }

    navigateTab(tabId, url) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Normalize URL
        if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
            if (url.includes('.') && !url.includes(' ')) {
                url = 'https://' + url;
            } else {
                url = `https://www.google.com/search?q=${encodeURIComponent(url)}`;
            }
        }

        tab.url = url;
        if (tab.webview) {
            tab.webview.src = url;
        }
    }

    activateTab(tabId) {
        if (!this.tabs.has(tabId)) return;

        this.activeTabId = tabId;

        // Update tab UI (delegated to Arc theme)
        if (this.arcTheme) {
            this.arcTheme.onTabActivated(tabId);
        }

        // Update webview visibility
        const webviews = document.querySelectorAll('#webview-container webview');
        webviews.forEach(wv => {
            if (wv.dataset.tabId === tabId) {
                wv.classList.add('active');
            } else {
                wv.classList.remove('active');
            }
        });

        // Update navigation state
        const tab = this.tabs.get(tabId);
        this.navigation.update(tab);
    }

    closeTab(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Remove tab element
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }

        // Remove webview container
        const webviewContainer = document.querySelector(`.webview-container[data-tab-id="${tabId}"]`);
        if (webviewContainer) {
            webviewContainer.remove();
        }

        // Remove from tabs map
        this.tabs.delete(tabId);

        // Notify Arc theme if active
        if (this.arcTheme) {
            this.arcTheme.onTabClosed(tabId);
        }

        // If this was the active tab, activate another one
        if (this.activeTabId === tabId) {
            const remainingTabs = Array.from(this.tabs.keys());
            if (remainingTabs.length > 0) {
                this.activateTab(remainingTabs[remainingTabs.length - 1]);
            } else {
                this.createNewTab();
            }
        }

        // If no tabs left, close the window
        if (this.tabs.size === 0) {
            window.close();
        }
    }

    closeActiveTab() {
        if (this.activeTabId) {
            const tabToClose = this.tabs.get(this.activeTabId);
            if (tabToClose) {
                // Remove webview
                if (tabToClose.webview) {
                    tabToClose.webview.remove();
                }

                // Remove tab from internal state
                this.tabs.delete(this.activeTabId);

                // Update UI
                if (this.arcTheme) {
                    this.arcTheme.onTabClosed(tabToClose.id);
                }

                // Activate another tab
                const remainingTabs = Array.from(this.tabs.keys());
                if (remainingTabs.length > 0) {
                    this.activateTab(remainingTabs[remainingTabs.length - 1]);
                } else {
                    // No tabs left, maybe close window or show welcome screen
                    this.activeTabId = null;
                    this.navigation.update(null); // Clear navigation state
                }
            }
        }
    }

    // Tab event handlers
    onTabStartLoading(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.loading = true;
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.classList.add('loading');
        }

        if (tabId === this.activeTabId) {
            this.updateNavigationState();
        }
    }

    onTabStopLoading(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.loading = false;
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.classList.remove('loading');
        }

        if (tabId === this.activeTabId) {
            this.updateNavigationState();
        }
    }

    onTabLoaded(tabId) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        // Update navigation state
        if (tab.webview) {
            tab.canGoBack = tab.webview.canGoBack();
            tab.canGoForward = tab.webview.canGoForward();
        }

        // Add to history
        this.addToHistory(tab.title, tab.url);

        if (tabId === this.activeTabId) {
            this.updateNavigationState();
        }
    }

    onTabNavigated(tabId, url) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.url = url;
        
        if (tabId === this.activeTabId) {
            this.updateAddressBar(url);
        }
    }

    onTabFailedLoad(tabId, error) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        console.error(`Failed to load tab ${tabId}:`, error);
        this.updateTabTitle(tabId, 'Failed to load');
    }

    updateTabTitle(tabId, title) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.title = title;
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"] .tab-title`);
        if (tabElement) {
            tabElement.textContent = title;
        }

        // Notify Arc theme if active
        if (this.arcTheme) {
            this.arcTheme.onTabUpdated(tab);
        }
    }

    updateTabFavicon(tabId, favicon) {
        const tab = this.tabs.get(tabId);
        if (!tab) return;

        tab.favicon = favicon;
        const faviconElement = document.querySelector(`[data-tab-id="${tabId}"] .tab-favicon`);
        if (faviconElement && favicon) {
            faviconElement.style.backgroundImage = `url(${favicon})`;
        }

        // Notify Arc theme if active
        if (this.arcTheme) {
            this.arcTheme.onTabUpdated(tab);
        }
    }

    updateNavigationState() {
        const activeTab = this.tabs.get(this.activeTabId);
        if (!activeTab) return;

        const backButton = document.getElementById('back-button');
        const forwardButton = document.getElementById('forward-button');
        const refreshButton = document.getElementById('refresh-button');

        if (backButton) {
            backButton.disabled = !activeTab.canGoBack;
        }

        if (forwardButton) {
            forwardButton.disabled = !activeTab.canGoForward;
        }

        if (refreshButton) {
            refreshButton.classList.toggle('loading', activeTab.loading);
        }

        this.updateAddressBar(activeTab.url);
    }

    updateAddressBar(url) {
        const addressInput = document.getElementById('address-input');
        if (addressInput && url) {
            addressInput.value = url;
        }
    }

    focusAddressBar() {
        const addressInput = document.getElementById('address-input');
        if (addressInput) {
            addressInput.focus();
            addressInput.select();
        }
    }

    refreshActiveTab() {
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab && activeTab.webview) {
            activeTab.webview.reload();
        }
    }

    goBack() {
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab && activeTab.webview && activeTab.canGoBack) {
            activeTab.webview.goBack();
        }
    }

    goForward() {
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab && activeTab.webview && activeTab.canGoForward) {
            activeTab.webview.goForward();
        }
    }

    // Utility methods
    addToHistory(title, url) {
        ipcRenderer.invoke('add-history', { title, url });
    }

    addCurrentPageToBookmarks() {
        const activeTab = this.tabs.get(this.activeTabId);
        if (activeTab) {
            this.bookmarks.showAddBookmarkModal(activeTab.title, activeTab.url);
        }
    }

    showBookmarks() {
        this.sidebar.showPanel('bookmarks');
    }

    showHistory() {
        this.sidebar.showPanel('history');
    }

    onHistoryCleared() {
        this.sidebar.refreshHistory();
    }

    loadSettings() {
        const savedHomepage = localStorage.getItem('homepage');
        if (savedHomepage) {
            this.homepage = savedHomepage;
        }

        const darkMode = localStorage.getItem('darkMode') === 'true';
        if (darkMode) {
            document.body.classList.add('dark-mode');
        }
    }

    saveSettings() {
        localStorage.setItem('homepage', this.homepage);
        localStorage.setItem('darkMode', document.body.classList.contains('dark-mode'));
    }
}

// Initialize the browser when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.browserApp = new BrowserApp();
});
