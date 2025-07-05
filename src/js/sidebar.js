// Sidebar Management
class SidebarManager {
    constructor(browserApp) {
        this.browserApp = browserApp;
        this.isOpen = false;
        this.activePanel = 'bookmarks';
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Sidebar tab navigation
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        sidebarTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.showPanel(tab.dataset.tab);
            });
        });

        // Settings button
        const settingsButton = document.getElementById('settings-button');
        if (settingsButton) {
            settingsButton.addEventListener('click', () => {
                this.toggleSidebar();
            });
        }

        // Close sidebar when clicking outside
        document.addEventListener('click', (event) => {
            const sidebar = document.getElementById('sidebar');
            const settingsButton = document.getElementById('settings-button');
            
            if (this.isOpen && 
                !sidebar.contains(event.target) && 
                !settingsButton.contains(event.target)) {
                this.closeSidebar();
            }
        });

        // Escape key to close sidebar
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.isOpen) {
                this.closeSidebar();
            }
        });
    }

    toggleSidebar() {
        if (this.isOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
    }

    openSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.add('open');
            this.isOpen = true;
            this.loadPanelContent(this.activePanel);
        }
    }

    closeSidebar() {
        const sidebar = document.getElementById('sidebar');
        if (sidebar) {
            sidebar.classList.remove('open');
            this.isOpen = false;
        }
    }

    showPanel(panelName) {
        this.activePanel = panelName;
        
        // Update tab states
        const sidebarTabs = document.querySelectorAll('.sidebar-tab');
        sidebarTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === panelName);
        });

        // Update panel visibility
        const sidebarPanels = document.querySelectorAll('.sidebar-panel');
        sidebarPanels.forEach(panel => {
            panel.classList.toggle('active', panel.id === `${panelName}-panel`);
        });

        // Load panel content
        this.loadPanelContent(panelName);
        
        // Open sidebar if not already open
        if (!this.isOpen) {
            this.openSidebar();
        }
    }

    loadPanelContent(panelName) {
        switch (panelName) {
            case 'bookmarks':
                this.loadBookmarks();
                break;
            case 'history':
                this.loadHistory();
                break;
            case 'settings':
                this.loadSettings();
                break;
        }
    }

    async loadBookmarks() {
        const bookmarksList = document.getElementById('bookmarks-list');
        if (!bookmarksList) return;

        try {
            const bookmarks = await ipcRenderer.invoke('get-bookmarks');
            
            if (bookmarks.length === 0) {
                bookmarksList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">⭐</div>
                        <div class="empty-state-text">No bookmarks yet</div>
                        <div class="empty-state-subtext">Add your favorite pages to find them quickly</div>
                    </div>
                `;
                return;
            }

            bookmarksList.innerHTML = bookmarks.map(bookmark => `
                <div class="bookmark-item" data-bookmark-id="${bookmark.id}">
                    <div class="bookmark-favicon"></div>
                    <div class="bookmark-content">
                        <div class="bookmark-title">${this.escapeHtml(bookmark.title)}</div>
                        <div class="bookmark-url">${this.escapeHtml(bookmark.url)}</div>
                    </div>
                    <button class="bookmark-remove" data-bookmark-id="${bookmark.id}">×</button>
                </div>
            `).join('');

            // Add event listeners for bookmark items
            this.setupBookmarkEvents();
        } catch (error) {
            console.error('Error loading bookmarks:', error);
            bookmarksList.innerHTML = '<div class="error">Error loading bookmarks</div>';
        }
    }

    setupBookmarkEvents() {
        const bookmarksList = document.getElementById('bookmarks-list');
        if (!bookmarksList) return;

        bookmarksList.addEventListener('click', (event) => {
            const bookmarkItem = event.target.closest('.bookmark-item');
            if (!bookmarkItem) return;

            if (event.target.classList.contains('bookmark-remove')) {
                // Remove bookmark
                const bookmarkId = parseInt(event.target.dataset.bookmarkId);
                this.removeBookmark(bookmarkId);
            } else {
                // Navigate to bookmark
                const bookmarkUrl = bookmarkItem.querySelector('.bookmark-url').textContent;
                this.browserApp.navigateTab(this.browserApp.activeTabId, bookmarkUrl);
                this.closeSidebar();
            }
        });
    }

    async removeBookmark(bookmarkId) {
        try {
            await ipcRenderer.invoke('remove-bookmark', bookmarkId);
            this.loadBookmarks(); // Refresh the list
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    }

    async loadHistory() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        try {
            const history = await ipcRenderer.invoke('get-history');
            
            if (history.length === 0) {
                historyList.innerHTML = `
                    <div class="empty-state">
                        <div class="empty-state-icon">📋</div>
                        <div class="empty-state-text">No history yet</div>
                        <div class="empty-state-subtext">Your browsing history will appear here</div>
                    </div>
                `;
                return;
            }

            historyList.innerHTML = history.map(item => `
                <div class="history-item" data-history-url="${this.escapeHtml(item.url)}">
                    <div class="history-favicon"></div>
                    <div class="history-content">
                        <div class="history-title">${this.escapeHtml(item.title)}</div>
                        <div class="history-url">${this.escapeHtml(item.url)}</div>
                    </div>
                    <div class="history-time">${this.formatDate(item.visitedAt)}</div>
                </div>
            `).join('');

            // Add event listeners for history items
            this.setupHistoryEvents();
        } catch (error) {
            console.error('Error loading history:', error);
            historyList.innerHTML = '<div class="error">Error loading history</div>';
        }
    }

    setupHistoryEvents() {
        const historyList = document.getElementById('history-list');
        if (!historyList) return;

        historyList.addEventListener('click', (event) => {
            const historyItem = event.target.closest('.history-item');
            if (!historyItem) return;

            const historyUrl = historyItem.dataset.historyUrl;
            this.browserApp.navigateTab(this.browserApp.activeTabId, historyUrl);
            this.closeSidebar();
        });

        // Clear history button
        const clearHistoryBtn = document.getElementById('clear-history-btn');
        if (clearHistoryBtn) {
            clearHistoryBtn.addEventListener('click', () => {
                this.clearHistory();
            });
        }
    }

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
                this.loadHistory(); // Refresh the list
            }
        } catch (error) {
            console.error('Error clearing history:', error);
        }
    }

    loadSettings() {
        const homepageInput = document.getElementById('homepage-input');
        const popupBlockerCheckbox = document.getElementById('popup-blocker');
        const darkModeCheckbox = document.getElementById('dark-mode');
        const clearDataBtn = document.getElementById('clear-data-btn');

        // Load current settings
        if (homepageInput) {
            homepageInput.value = this.browserApp.homepage;
            homepageInput.addEventListener('change', () => {
                this.browserApp.homepage = homepageInput.value;
                this.browserApp.saveSettings();
            });
        }

        if (popupBlockerCheckbox) {
            popupBlockerCheckbox.checked = localStorage.getItem('popupBlocker') === 'true';
            popupBlockerCheckbox.addEventListener('change', () => {
                localStorage.setItem('popupBlocker', popupBlockerCheckbox.checked);
            });
        }

        if (darkModeCheckbox) {
            darkModeCheckbox.checked = document.body.classList.contains('dark-mode');
            darkModeCheckbox.addEventListener('change', () => {
                document.body.classList.toggle('dark-mode', darkModeCheckbox.checked);
                this.browserApp.saveSettings();
            });
        }

        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    }

    async clearAllData() {
        try {
            const result = await ipcRenderer.invoke('show-message-box', {
                type: 'warning',
                buttons: ['Clear All', 'Cancel'],
                defaultId: 1,
                title: 'Clear All Data',
                message: 'This will clear all bookmarks, history, and settings. Are you sure?'
            });

            if (result.response === 0) {
                await ipcRenderer.invoke('clear-history');
                
                // Clear bookmarks
                const bookmarks = await ipcRenderer.invoke('get-bookmarks');
                for (const bookmark of bookmarks) {
                    await ipcRenderer.invoke('remove-bookmark', bookmark.id);
                }

                // Clear local storage
                localStorage.clear();

                // Reset settings
                this.browserApp.homepage = 'https://www.google.com';
                document.body.classList.remove('dark-mode');

                // Refresh all panels
                this.loadPanelContent(this.activePanel);
            }
        } catch (error) {
            console.error('Error clearing data:', error);
        }
    }

    refreshBookmarks() {
        if (this.activePanel === 'bookmarks') {
            this.loadBookmarks();
        }
    }

    refreshHistory() {
        if (this.activePanel === 'history') {
            this.loadHistory();
        }
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}
