// Arc Browser Theme Management
class ArcBrowserTheme {
    constructor(browserApp) {
        this.browserApp = browserApp;
        this.currentSection = 'tabs';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeTheme();
    }

    setupEventListeners() {
        // Navigation buttons
        const navButtons = document.querySelectorAll('.arc-nav-btn');
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchSection(btn.dataset.nav);
            });
        });

        // New tab button
        const newTabBtn = document.getElementById('arc-new-tab-btn');
        if (newTabBtn) {
            newTabBtn.addEventListener('click', () => {
                this.browserApp.createNewTab();
            });
        }

        // Add bookmark button
        const addBookmarkBtn = document.getElementById('arc-add-bookmark-btn');
        if (addBookmarkBtn) {
            addBookmarkBtn.addEventListener('click', () => {
                this.browserApp.bookmarks.showAddBookmarkModal();
            });
        }

        // Clear history button
        const clearHistoryBtn = document.getElementById('arc-clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('arc-settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Tab list clicks
        const tabsList = document.getElementById('arc-tabs-list');
        if (tabsList) {
            tabsList.addEventListener('click', (event) => {
                const tabItem = event.target.closest('.arc-tab-item');
                if (!tabItem) return;

                const tabId = tabItem.dataset.tabId;
                
                if (event.target.classList.contains('arc-tab-close')) {
                    event.stopPropagation();
                    this.browserApp.closeTab(tabId);
                } else {
                    this.browserApp.activateTab(tabId);
                }
            });
        }

        // Bookmarks list clicks
        const bookmarksList = document.getElementById('arc-bookmarks-list');
        if (bookmarksList) {
            bookmarksList.addEventListener('click', (event) => {
                const bookmarkItem = event.target.closest('.arc-bookmark-item');
                if (!bookmarkItem) return;

                const bookmarkUrl = bookmarkItem.dataset.url;
                this.browserApp.navigateTab(this.browserApp.activeTabId, bookmarkUrl);
            });
        }

        // History list clicks
        const historyList = document.getElementById('arc-history-list');
        if (historyList) {
            historyList.addEventListener('click', (event) => {
                const historyItem = event.target.closest('.arc-history-item');
                if (!historyItem) return;

                const historyUrl = historyItem.dataset.url;
                this.browserApp.navigateTab(this.browserApp.activeTabId, historyUrl);
            });
        }
    }

    initializeTheme() {
        // Apply Arc theme
        document.body.classList.add('arc-theme');
        
        // Load sections
        this.loadTabs();
        this.loadBookmarks();
        this.loadHistory();
    }

    switchSection(section) {
        // Update navigation buttons
        const navButtons = document.querySelectorAll('.arc-nav-btn');
        navButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.nav === section);
        });

        // Update sections
        const sections = ['tabs', 'bookmarks', 'history'];
        sections.forEach(sec => {
            const sectionElement = document.getElementById(`arc-${sec}-section`);
            if (sectionElement) {
                sectionElement.style.display = sec === section ? 'flex' : 'none';
            }
        });

        this.currentSection = section;

        // Load section content
        switch (section) {
            case 'tabs':
                this.loadTabs();
                break;
            case 'bookmarks':
                this.loadBookmarks();
                break;
            case 'history':
                this.loadHistory();
                break;
        }
    }

    loadTabs() {
        const tabsList = document.getElementById('arc-tabs-list');
        if (!tabsList) return;

        tabsList.innerHTML = '';

        this.browserApp.tabs.forEach((tab, tabId) => {
            const tabElement = this.createTabElement(tab);
            tabsList.appendChild(tabElement);
        });
    }

    onTabCreated(tab) {
        // This is called when a new tab is created
        const tabsList = document.getElementById('arc-tabs-list');
        if (!tabsList) return;

        const tabElement = this.createTabElement(tab);
        tabsList.appendChild(tabElement);
        
        // Set up event listeners for the new tab
        this.setupTabEventListeners(tabElement, tab);
    }

    onTabUpdated(tab) {
        // This is called when a tab is updated
        const existingTabElement = document.querySelector(`[data-tab-id="${tab.id}"]`);
        if (existingTabElement) {
            const titleElement = existingTabElement.querySelector('.arc-tab-title');
            const faviconElement = existingTabElement.querySelector('.arc-tab-favicon');
            
            if (titleElement) {
                titleElement.textContent = tab.title;
            }
            
            if (faviconElement) {
                faviconElement.innerHTML = this.getFaviconContent(tab);
            }
            
            // Update active state
            existingTabElement.classList.toggle('active', tab.id === this.browserApp.activeTabId);
        }
    }

    onTabClosed(tabId) {
        // This is called when a tab is closed
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.remove();
        }
    }

    createTabElement(tab) {
        const tabElement = document.createElement('div');
        tabElement.className = 'arc-tab-item';
        tabElement.dataset.tabId = tab.id;
        
        if (tab.id === this.browserApp.activeTabId) {
            tabElement.classList.add('active');
        }

        if (tab.loading) {
            tabElement.classList.add('loading');
        }

        tabElement.innerHTML = `
            <div class="arc-tab-favicon">${this.getFaviconContent(tab)}</div>
            <div class="arc-tab-title">${tab.title}</div>
            <button class="arc-tab-close">×</button>
        `;

        this.setupTabEventListeners(tabElement, tab);
        return tabElement;
    }

    setupTabEventListeners(tabElement, tab) {
        // Click to activate tab
        tabElement.addEventListener('click', (e) => {
            if (!e.target.classList.contains('arc-tab-close')) {
                this.browserApp.activateTab(tab.id);
                this.updateTabActiveStates();
            }
        });

        // Close tab button
        const closeBtn = tabElement.querySelector('.arc-tab-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.browserApp.closeTab(tab.id);
            });
        }
    }

    updateTabActiveStates() {
        const tabElements = document.querySelectorAll('.arc-tab-item');
        tabElements.forEach(tabElement => {
            const tabId = tabElement.dataset.tabId;
            tabElement.classList.toggle('active', tabId === this.browserApp.activeTabId);
        });
    }

    getFaviconContent(tab) {
        if (tab.favicon) {
            return `<img src="${tab.favicon}" alt="" width="16" height="16">`;
        }
        return '🌐';
    }

    async loadBookmarks() {
        const bookmarksList = document.getElementById('arc-bookmarks-list');
        if (!bookmarksList) return;

        try {
            const bookmarks = await ipcRenderer.invoke('get-bookmarks');
            
            if (bookmarks.length === 0) {
                bookmarksList.innerHTML = `
                    <div class="arc-empty-state">
                        <div class="arc-empty-icon">📚</div>
                        <div class="arc-empty-text">No bookmarks yet</div>
                    </div>
                `;
                return;
            }

            bookmarksList.innerHTML = bookmarks.map(bookmark => `
                <div class="arc-bookmark-item" data-url="${bookmark.url}">
                    <div class="arc-bookmark-favicon">🔖</div>
                    <div class="arc-bookmark-content">
                        <div class="arc-bookmark-title">${this.escapeHtml(bookmark.title)}</div>
                        <div class="arc-bookmark-url">${this.escapeHtml(bookmark.url)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading bookmarks:', error);
        }
    }

    async loadHistory() {
        const historyList = document.getElementById('arc-history-list');
        if (!historyList) return;

        try {
            const history = await ipcRenderer.invoke('get-history');
            
            if (history.length === 0) {
                historyList.innerHTML = `
                    <div class="arc-empty-state">
                        <div class="arc-empty-icon">📋</div>
                        <div class="arc-empty-text">No history yet</div>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = history.slice(0, 50).map(item => `
                <div class="arc-history-item" data-url="${item.url}">
                    <div class="arc-history-favicon">🌐</div>
                    <div class="arc-history-content">
                        <div class="arc-history-title">${this.escapeHtml(item.title)}</div>
                        <div class="arc-history-url">${this.escapeHtml(item.url)}</div>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading history:', error);
        }
    }

    // Tab management methods
    onTabCreated(tab) {
        if (this.currentSection === 'tabs') {
            this.loadTabs();
        }
    }

    onTabClosed(tabId) {
        if (this.currentSection === 'tabs') {
            this.loadTabs();
        }
    }

    onTabActivated(tabId) {
        if (this.currentSection === 'tabs') {
            // Update active tab in sidebar
            const tabItems = document.querySelectorAll('.arc-tab-item');
            tabItems.forEach(item => {
                item.classList.toggle('active', item.dataset.tabId === tabId);
            });
        }
    }

    onTabUpdated(tabId, changes) {
        if (this.currentSection === 'tabs') {
            const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
            if (tabElement) {
                if (changes.title) {
                    const titleElement = tabElement.querySelector('.arc-tab-title');
                    if (titleElement) {
                        titleElement.textContent = changes.title;
                    }
                }

                if (changes.favicon) {
                    const faviconElement = tabElement.querySelector('.arc-tab-favicon');
                    if (faviconElement) {
                        faviconElement.innerHTML = `<img src="${changes.favicon}" alt="" width="16" height="16">`;
                    }
                }

                if (changes.loading !== undefined) {
                    tabElement.classList.toggle('loading', changes.loading);
                }
            }
        }
    }

    // Utility methods
    async clearHistory() {
        try {
            const result = await ipcRenderer.invoke('show-message-box', {
                type: 'warning',
                buttons: ['Clear', 'Cancel'],
                defaultId: 1,
                title: 'Clear History',
                message: 'Are you sure you want to clear all browsing history?'
            });

            if (result.response === 0) {
                await ipcRenderer.invoke('clear-history');
                this.loadHistory();
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    showSettingsModal() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.classList.add('active');
        }
    }

    hideSettingsModal() {
        const settingsModal = document.getElementById('settings-modal');
        if (settingsModal) {
            settingsModal.classList.remove('active');
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Theme toggle
    toggleTheme() {
        document.body.classList.toggle('light');
        localStorage.setItem('arc-theme', document.body.classList.contains('light') ? 'light' : 'dark');
    }

    // Refresh sections
    refreshBookmarks() {
        if (this.currentSection === 'bookmarks') {
            this.loadBookmarks();
        }
    }

    refreshHistory() {
        if (this.currentSection === 'history') {
            this.loadHistory();
        }
    }

    // Animation helpers
    animateTabSwitch(fromTabId, toTabId) {
        const fromTab = document.querySelector(`[data-tab-id="${fromTabId}"]`);
        const toTab = document.querySelector(`[data-tab-id="${toTabId}"]`);

        if (fromTab && toTab) {
            fromTab.style.transform = 'translateX(-10px)';
            toTab.style.transform = 'translateX(10px)';
            
            setTimeout(() => {
                fromTab.style.transform = '';
                toTab.style.transform = '';
            }, 200);
        }
    }

    // Keyboard shortcuts
    handleKeyboardShortcuts(event) {
        if (event.ctrlKey || event.metaKey) {
            switch (event.key) {
                case '1':
                    event.preventDefault();
                    this.switchSection('tabs');
                    break;
                case '2':
                    event.preventDefault();
                    this.switchSection('bookmarks');
                    break;
                case '3':
                    event.preventDefault();
                    this.switchSection('history');
                    break;
            }
        }
    }
}

// Initialize Arc theme when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait for browserApp to be initialized
    setTimeout(() => {
        if (window.browserApp) {
            window.arcTheme = new ArcBrowserTheme(window.browserApp);
            
            // Add keyboard shortcuts
            document.addEventListener('keydown', (event) => {
                window.arcTheme.handleKeyboardShortcuts(event);
            });
        }
    }, 100);
});
