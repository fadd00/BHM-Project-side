// Bookmarks Management
class BookmarksManager {
    constructor(browserApp) {
        this.browserApp = browserApp;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Add bookmark button in navigation
        const bookmarkButton = document.getElementById('bookmark-button');
        if (bookmarkButton) {
            bookmarkButton.addEventListener('click', () => {
                this.toggleBookmark();
            });
        }

        // Add bookmark button in sidebar
        const addBookmarkBtn = document.getElementById('add-bookmark-btn');
        if (addBookmarkBtn) {
            addBookmarkBtn.addEventListener('click', () => {
                this.showAddBookmarkModal();
            });
        }

        // Modal event listeners
        this.setupModalEvents();
    }

    setupModalEvents() {
        const bookmarkModal = document.getElementById('bookmark-modal');
        const modalClose = document.getElementById('modal-close');
        const cancelBookmark = document.getElementById('cancel-bookmark');
        const saveBookmark = document.getElementById('save-bookmark');

        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.hideAddBookmarkModal();
            });
        }

        if (cancelBookmark) {
            cancelBookmark.addEventListener('click', () => {
                this.hideAddBookmarkModal();
            });
        }

        if (saveBookmark) {
            saveBookmark.addEventListener('click', () => {
                this.saveBookmark();
            });
        }

        // Close modal when clicking outside
        if (bookmarkModal) {
            bookmarkModal.addEventListener('click', (event) => {
                if (event.target === bookmarkModal) {
                    this.hideAddBookmarkModal();
                }
            });
        }

        // Handle Enter key in modal inputs
        const bookmarkTitle = document.getElementById('bookmark-title');
        const bookmarkUrl = document.getElementById('bookmark-url');
        
        if (bookmarkTitle) {
            bookmarkTitle.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.saveBookmark();
                }
            });
        }

        if (bookmarkUrl) {
            bookmarkUrl.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.saveBookmark();
                }
            });
        }
    }

    async toggleBookmark() {
        const activeTab = this.browserApp.tabs.get(this.browserApp.activeTabId);
        if (!activeTab) return;

        const isBookmarked = await this.isCurrentPageBookmarked();
        
        if (isBookmarked) {
            await this.removeCurrentBookmark();
        } else {
            this.showAddBookmarkModal(activeTab.title, activeTab.url);
        }
    }

    async isCurrentPageBookmarked() {
        const activeTab = this.browserApp.tabs.get(this.browserApp.activeTabId);
        if (!activeTab) return false;

        try {
            const bookmarks = await ipcRenderer.invoke('get-bookmarks');
            return bookmarks.some(bookmark => bookmark.url === activeTab.url);
        } catch (error) {
            console.error('Error checking bookmark status:', error);
            return false;
        }
    }

    async removeCurrentBookmark() {
        const activeTab = this.browserApp.tabs.get(this.browserApp.activeTabId);
        if (!activeTab) return;

        try {
            const bookmarks = await ipcRenderer.invoke('get-bookmarks');
            const bookmark = bookmarks.find(b => b.url === activeTab.url);
            
            if (bookmark) {
                await ipcRenderer.invoke('remove-bookmark', bookmark.id);
                this.updateBookmarkButton(false);
                this.browserApp.sidebar.refreshBookmarks();
            }
        } catch (error) {
            console.error('Error removing bookmark:', error);
        }
    }

    showAddBookmarkModal(title = '', url = '') {
        const activeTab = this.browserApp.tabs.get(this.browserApp.activeTabId);
        
        const bookmarkModal = document.getElementById('bookmark-modal');
        const bookmarkTitle = document.getElementById('bookmark-title');
        const bookmarkUrl = document.getElementById('bookmark-url');

        if (bookmarkModal) {
            bookmarkModal.classList.add('active');
        }

        if (bookmarkTitle) {
            bookmarkTitle.value = title || (activeTab ? activeTab.title : '');
            bookmarkTitle.focus();
            bookmarkTitle.select();
        }

        if (bookmarkUrl) {
            bookmarkUrl.value = url || (activeTab ? activeTab.url : '');
        }
    }

    hideAddBookmarkModal() {
        const bookmarkModal = document.getElementById('bookmark-modal');
        if (bookmarkModal) {
            bookmarkModal.classList.remove('active');
        }

        // Clear form
        const bookmarkTitle = document.getElementById('bookmark-title');
        const bookmarkUrl = document.getElementById('bookmark-url');
        
        if (bookmarkTitle) bookmarkTitle.value = '';
        if (bookmarkUrl) bookmarkUrl.value = '';
    }

    async saveBookmark() {
        const bookmarkTitle = document.getElementById('bookmark-title');
        const bookmarkUrl = document.getElementById('bookmark-url');

        if (!bookmarkTitle || !bookmarkUrl) return;

        const title = bookmarkTitle.value.trim();
        const url = bookmarkUrl.value.trim();

        if (!title || !url) {
            alert('Please enter both title and URL');
            return;
        }

        try {
            await ipcRenderer.invoke('add-bookmark', {
                title: title,
                url: url
            });

            this.hideAddBookmarkModal();
            this.updateBookmarkButton(true);
            this.browserApp.sidebar.refreshBookmarks();
            
            // Show success message
            this.showNotification('Bookmark added successfully!');
        } catch (error) {
            console.error('Error saving bookmark:', error);
            alert('Error saving bookmark. Please try again.');
        }
    }

    updateBookmarkButton(isBookmarked) {
        const bookmarkButton = document.getElementById('bookmark-button');
        if (bookmarkButton) {
            bookmarkButton.classList.toggle('bookmarked', isBookmarked);
            bookmarkButton.title = isBookmarked ? 'Remove bookmark' : 'Add bookmark';
        }
    }

    // Check bookmark status when tab changes
    async checkBookmarkStatus() {
        const isBookmarked = await this.isCurrentPageBookmarked();
        this.updateBookmarkButton(isBookmarked);
    }

    // Import bookmarks from file
    async importBookmarks() {
        try {
            const { dialog } = require('electron').remote;
            const result = await dialog.showOpenDialog({
                title: 'Import Bookmarks',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'HTML Files', extensions: ['html', 'htm'] }
                ],
                properties: ['openFile']
            });

            if (result.canceled) return;

            const filePath = result.filePaths[0];
            const fileContent = require('fs').readFileSync(filePath, 'utf-8');
            
            let bookmarks;
            if (filePath.endsWith('.json')) {
                bookmarks = JSON.parse(fileContent);
            } else {
                bookmarks = this.parseHtmlBookmarks(fileContent);
            }

            // Add bookmarks to the system
            for (const bookmark of bookmarks) {
                await ipcRenderer.invoke('add-bookmark', bookmark);
            }

            this.browserApp.sidebar.refreshBookmarks();
            this.showNotification(`Imported ${bookmarks.length} bookmarks successfully!`);
        } catch (error) {
            console.error('Error importing bookmarks:', error);
            alert('Error importing bookmarks. Please check the file format.');
        }
    }

    // Export bookmarks to file
    async exportBookmarks() {
        try {
            const { dialog } = require('electron').remote;
            const bookmarks = await ipcRenderer.invoke('get-bookmarks');
            
            const result = await dialog.showSaveDialog({
                title: 'Export Bookmarks',
                defaultPath: 'bookmarks.json',
                filters: [
                    { name: 'JSON Files', extensions: ['json'] },
                    { name: 'HTML Files', extensions: ['html'] }
                ]
            });

            if (result.canceled) return;

            const filePath = result.filePath;
            let content;

            if (filePath.endsWith('.json')) {
                content = JSON.stringify(bookmarks, null, 2);
            } else {
                content = this.generateHtmlBookmarks(bookmarks);
            }

            require('fs').writeFileSync(filePath, content);
            this.showNotification('Bookmarks exported successfully!');
        } catch (error) {
            console.error('Error exporting bookmarks:', error);
            alert('Error exporting bookmarks. Please try again.');
        }
    }

    parseHtmlBookmarks(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a[href]');
        
        return Array.from(links).map(link => ({
            title: link.textContent || link.href,
            url: link.href
        }));
    }

    generateHtmlBookmarks(bookmarks) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Bookmarks</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .bookmark { margin: 10px 0; }
        .bookmark a { text-decoration: none; color: #0066cc; }
        .bookmark a:hover { text-decoration: underline; }
        .bookmark-url { font-size: 0.9em; color: #666; margin-left: 20px; }
    </style>
</head>
<body>
    <h1>Bookmarks</h1>
    ${bookmarks.map(bookmark => `
        <div class="bookmark">
            <a href="${bookmark.url}">${bookmark.title}</a>
            <div class="bookmark-url">${bookmark.url}</div>
        </div>
    `).join('')}
</body>
</html>`;
        return html;
    }

    // Organize bookmarks into folders
    createBookmarkFolder(name) {
        // Implementation for bookmark folders
        // This would require updating the data structure to support folders
        console.log('Creating bookmark folder:', name);
    }

    // Search bookmarks
    searchBookmarks(query) {
        // Implementation for searching bookmarks
        // This would filter bookmarks based on title or URL
        console.log('Searching bookmarks:', query);
    }

    // Show notification
    showNotification(message) {
        // Create a simple notification
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

    // Bookmark quick access
    getQuickAccessBookmarks() {
        // Return most frequently accessed bookmarks
        // This would require tracking bookmark usage
        return [];
    }

    // Bookmark suggestions
    getSuggestedBookmarks() {
        // Return bookmarks based on current browsing patterns
        // This would require analyzing browsing history
        return [];
    }
}
