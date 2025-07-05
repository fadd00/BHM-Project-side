// Navigation Management
class NavigationManager {
    constructor(browserApp) {
        this.browserApp = browserApp;
        this.setupEventListeners();
        this.setupSearchSuggestions();
    }

    setupEventListeners() {
        // Navigation buttons
        const backButton = document.getElementById('nav-back');
        const forwardButton = document.getElementById('nav-forward');
        const refreshButton = document.getElementById('nav-reload');
        const addressInput = document.getElementById('address-bar');

        if (backButton) {
            backButton.addEventListener('click', () => {
                this.browserApp.goBack();
            });
        }

        if (forwardButton) {
            forwardButton.addEventListener('click', () => {
                this.browserApp.goForward();
            });
        }

        if (refreshButton) {
            refreshButton.addEventListener('click', () => {
                this.browserApp.refreshActiveTab();
            });
        }

        if (addressInput) {
            addressInput.addEventListener('keypress', (event) => {
                if (event.key === 'Enter') {
                    this.navigateToUrl(addressInput.value);
                    addressInput.blur();
                }
            });

            addressInput.addEventListener('focus', () => {
                addressInput.select();
            });

            addressInput.addEventListener('input', () => {
                this.handleAddressInput(addressInput.value);
            });

            addressInput.addEventListener('blur', () => {
                this.hideSuggestions();
            });
        }

        // Menu button
        const menuButton = document.getElementById('menu-button');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.browserApp.sidebar.toggleSidebar();
            });
        }
    }

    setupSearchSuggestions() {
        this.suggestions = [];
        this.currentSuggestionIndex = -1;
        
        // Create suggestions container
        const addressBarContainer = document.querySelector('.address-bar-container');
        if (addressBarContainer) {
            const suggestionsContainer = document.createElement('div');
            suggestionsContainer.className = 'search-suggestions';
            suggestionsContainer.id = 'search-suggestions';
            addressBarContainer.appendChild(suggestionsContainer);
        }

        // Handle keyboard navigation for suggestions
        document.addEventListener('keydown', (event) => {
            if (document.activeElement === document.getElementById('address-bar')) {
                this.handleSuggestionKeyboard(event);
            }
        });
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            // Check for domain-like patterns without a protocol
            if (string.includes('.') && !string.includes(' ')) {
                return true;
            }
            return false;
        }
    }

    navigateToUrl(input) {
        if (!input.trim()) return;

        this.hideSuggestions();

        let url;
        if (this.isValidUrl(input)) {
            // Prepend http:// if no protocol is present
            url = input.startsWith('http') ? input : `http://${input}`;
        } else {
            // Treat as a search query
            url = `https://www.google.com/search?q=${encodeURIComponent(input)}`;
        }

        if (this.browserApp.activeTabId) {
            this.browserApp.navigateTab(this.browserApp.activeTabId, url);
        } else {
            this.browserApp.createNewTab(url);
        }
    }

    navigateToHomepage() {
        this.navigateToUrl(this.browserApp.homepage);
    }

    handleAddressInput(input) {
        if (!input.trim()) {
            this.hideSuggestions();
            return;
        }

        this.generateSuggestions(input);
    }

    async generateSuggestions(input) {
        const suggestions = [];
        
        // Add URL suggestion if it looks like a URL
        if (this.isValidUrl(input)) {
            suggestions.push({
                type: 'url',
                title: input,
                url: input,
                icon: '🌐'
            });
        }

        // Add search suggestion
        suggestions.push({
            type: 'search',
            title: `Search for "${input}"`,
            url: `https://www.google.com/search?q=${encodeURIComponent(input)}`,
            icon: '🔍'
        });

        // Add history suggestions
        try {
            const history = await ipcRenderer.invoke('get-history');
            const historyMatches = history
                .filter(item => 
                    item.title.toLowerCase().includes(input.toLowerCase()) ||
                    item.url.toLowerCase().includes(input.toLowerCase())
                )
                .slice(0, 5);

            historyMatches.forEach(item => {
                suggestions.push({
                    type: 'history',
                    title: item.title,
                    url: item.url,
                    icon: '📋'
                });
            });
        } catch (error) {
            console.error('Error fetching history:', error);
        }

        // Add bookmark suggestions
        try {
            const bookmarks = await ipcRenderer.invoke('get-bookmarks');
            const bookmarkMatches = bookmarks
                .filter(item =>
                    item.title.toLowerCase().includes(input.toLowerCase()) ||
                    item.url.toLowerCase().includes(input.toLowerCase())
                )
                .slice(0, 3);

            bookmarkMatches.forEach(item => {
                suggestions.push({
                    type: 'bookmark',
                    title: item.title,
                    url: item.url,
                    icon: '⭐'
                });
            });
        } catch (error) {
            console.error('Error fetching bookmarks:', error);
        }

        this.showSuggestions(suggestions);
    }

    showSuggestions(suggestions) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer) return;

        this.suggestions = suggestions;
        this.currentSuggestionIndex = -1;

        if (suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        suggestionsContainer.innerHTML = '';

        suggestions.forEach((suggestion, index) => {
            const suggestionElement = document.createElement('div');
            suggestionElement.className = 'suggestion-item';
            suggestionElement.dataset.index = index;
            
            suggestionElement.innerHTML = `
                <div class="suggestion-icon">${suggestion.icon}</div>
                <div class="suggestion-content">
                    <div class="suggestion-title">${this.escapeHtml(suggestion.title)}</div>
                    <div class="suggestion-url">${this.escapeHtml(suggestion.url)}</div>
                </div>
            `;

            suggestionElement.addEventListener('click', () => {
                this.selectSuggestion(index);
            });

            suggestionsContainer.appendChild(suggestionElement);
        });

        suggestionsContainer.classList.add('show');
    }

    hideSuggestions() {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (suggestionsContainer) {
            suggestionsContainer.classList.remove('show');
        }
        this.currentSuggestionIndex = -1;
    }

    handleSuggestionKeyboard(event) {
        const suggestionsContainer = document.getElementById('search-suggestions');
        if (!suggestionsContainer || !suggestionsContainer.classList.contains('show')) {
            return;
        }

        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.highlightNextSuggestion();
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.highlightPreviousSuggestion();
                break;
            case 'Enter':
                event.preventDefault();
                if (this.currentSuggestionIndex >= 0) {
                    this.selectSuggestion(this.currentSuggestionIndex);
                } else {
                    this.navigateToUrl(document.getElementById('address-bar').value);
                }
                break;
            case 'Escape':
                this.hideSuggestions();
                break;
        }
    }

    highlightNextSuggestion() {
        const suggestionElements = document.querySelectorAll('.suggestion-item');
        if (suggestionElements.length === 0) return;

        // Remove current highlight
        if (this.currentSuggestionIndex >= 0) {
            suggestionElements[this.currentSuggestionIndex].classList.remove('active');
        }

        // Move to next suggestion
        this.currentSuggestionIndex++;
        if (this.currentSuggestionIndex >= suggestionElements.length) {
            this.currentSuggestionIndex = 0;
        }

        // Add highlight
        suggestionElements[this.currentSuggestionIndex].classList.add('active');
        
        // Update address input
        const suggestion = this.suggestions[this.currentSuggestionIndex];
        if (suggestion) {
            document.getElementById('address-bar').value = suggestion.url;
        }
    }

    highlightPreviousSuggestion() {
        const suggestionElements = document.querySelectorAll('.suggestion-item');
        if (suggestionElements.length === 0) return;

        // Remove current highlight
        if (this.currentSuggestionIndex >= 0) {
            suggestionElements[this.currentSuggestionIndex].classList.remove('active');
        }

        // Move to previous suggestion
        this.currentSuggestionIndex--;
        if (this.currentSuggestionIndex < 0) {
            this.currentSuggestionIndex = suggestionElements.length - 1;
        }

        // Add highlight
        suggestionElements[this.currentSuggestionIndex].classList.add('active');
        
        // Update address input
        const suggestion = this.suggestions[this.currentSuggestionIndex];
        if (suggestion) {
            document.getElementById('address-bar').value = suggestion.url;
        }
    }

    selectSuggestion(index) {
        if (index >= 0 && index < this.suggestions.length) {
            const suggestion = this.suggestions[index];
            this.navigateToUrl(suggestion.url);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Security indicator management
    updateSecurityIndicator(url) {
        const securityIndicator = document.getElementById('security-indicator');
        if (!securityIndicator) return;

        securityIndicator.classList.remove('secure', 'insecure', 'warning');

        if (url.startsWith('https://')) {
            securityIndicator.classList.add('secure');
            securityIndicator.textContent = '🔒';
            securityIndicator.title = 'This site is secure (HTTPS)';
        } else if (url.startsWith('http://')) {
            securityIndicator.classList.add('insecure');
            securityIndicator.textContent = '⚠️';
            securityIndicator.title = 'This site is not secure (HTTP)';
        } else if (url.startsWith('file://')) {
            securityIndicator.classList.add('warning');
            securityIndicator.textContent = '📁';
            securityIndicator.title = 'Local file';
        } else {
            securityIndicator.textContent = '🌐';
            securityIndicator.title = 'Unknown protocol';
        }
    }

    // Progress bar management
    showProgressBar() {
        let progressBar = document.querySelector('.progress-bar');
        if (!progressBar) {
            progressBar = document.createElement('div');
            progressBar.className = 'progress-bar';
            document.querySelector('.navigation-bar').appendChild(progressBar);
        }
        
        progressBar.style.width = '0%';
        progressBar.style.display = 'block';
    }

    updateProgressBar(percentage) {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.width = percentage + '%';
        }
    }

    hideProgressBar() {
        const progressBar = document.querySelector('.progress-bar');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }
}
