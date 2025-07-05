// Tab Management
class TabManager {
    constructor(browserApp) {
        this.browserApp = browserApp;
        this.setupEventListeners();
    }

    setupEventListeners() {
        // New tab button
        const newTabButton = document.getElementById('new-tab-button');
        if (newTabButton) {
            newTabButton.addEventListener('click', () => {
                this.browserApp.createNewTab();
            });
        }

        // Tab clicks (using event delegation)
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer) {
            tabsContainer.addEventListener('click', (event) => {
                const tab = event.target.closest('.tab');
                if (!tab) return;

                const tabId = tab.dataset.tabId;
                
                if (event.target.classList.contains('tab-close')) {
                    // Close tab
                    event.stopPropagation();
                    this.browserApp.closeTab(tabId);
                } else {
                    // Activate tab
                    this.browserApp.activateTab(tabId);
                }
            });

            // Middle click to close tab
            tabsContainer.addEventListener('mousedown', (event) => {
                if (event.button === 1) { // Middle mouse button
                    const tab = event.target.closest('.tab');
                    if (tab) {
                        event.preventDefault();
                        this.browserApp.closeTab(tab.dataset.tabId);
                    }
                }
            });
        }

        // Tab drag and drop
        this.setupTabDragAndDrop();
    }

    setupTabDragAndDrop() {
        const tabsContainer = document.getElementById('tabs-container');
        if (!tabsContainer) return;

        let draggedTab = null;
        let draggedTabId = null;

        tabsContainer.addEventListener('dragstart', (event) => {
            const tab = event.target.closest('.tab');
            if (!tab) return;

            draggedTab = tab;
            draggedTabId = tab.dataset.tabId;
            
            event.dataTransfer.effectAllowed = 'move';
            event.dataTransfer.setData('text/html', tab.outerHTML);
            
            tab.style.opacity = '0.5';
        });

        tabsContainer.addEventListener('dragend', (event) => {
            if (draggedTab) {
                draggedTab.style.opacity = '';
                draggedTab = null;
                draggedTabId = null;
            }
        });

        tabsContainer.addEventListener('dragover', (event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
        });

        tabsContainer.addEventListener('dragenter', (event) => {
            event.preventDefault();
        });

        tabsContainer.addEventListener('drop', (event) => {
            event.preventDefault();
            
            if (!draggedTab) return;

            const targetTab = event.target.closest('.tab');
            if (!targetTab || targetTab === draggedTab) return;

            const targetTabId = targetTab.dataset.tabId;
            const rect = targetTab.getBoundingClientRect();
            const insertBefore = event.clientX < rect.left + rect.width / 2;

            if (insertBefore) {
                tabsContainer.insertBefore(draggedTab, targetTab);
            } else {
                tabsContainer.insertBefore(draggedTab, targetTab.nextSibling);
            }

            this.reorderTabs();
        });

        // Make tabs draggable
        tabsContainer.addEventListener('mousedown', (event) => {
            const tab = event.target.closest('.tab');
            if (tab && !event.target.classList.contains('tab-close')) {
                tab.draggable = true;
            }
        });
    }

    reorderTabs() {
        // Update tab order in browserApp.tabs if needed
        // This is a simplified implementation
        const tabElements = document.querySelectorAll('.tab');
        const newOrder = Array.from(tabElements).map(tab => tab.dataset.tabId);
        
        console.log('New tab order:', newOrder);
    }

    // Context menu for tabs
    setupTabContextMenu() {
        const tabsContainer = document.getElementById('tabs-container');
        if (!tabsContainer) return;

        tabsContainer.addEventListener('contextmenu', (event) => {
            event.preventDefault();
            
            const tab = event.target.closest('.tab');
            if (!tab) return;

            const tabId = tab.dataset.tabId;
            this.showTabContextMenu(event.clientX, event.clientY, tabId);
        });
    }

    showTabContextMenu(x, y, tabId) {
        // Remove existing context menu
        const existingMenu = document.querySelector('.tab-context-menu');
        if (existingMenu) {
            existingMenu.remove();
        }

        const menu = document.createElement('div');
        menu.className = 'tab-context-menu';
        menu.style.position = 'fixed';
        menu.style.left = x + 'px';
        menu.style.top = y + 'px';
        menu.style.zIndex = '10000';
        menu.style.backgroundColor = '#ffffff';
        menu.style.border = '1px solid #ccc';
        menu.style.borderRadius = '4px';
        menu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
        menu.style.minWidth = '150px';

        const menuItems = [
            { text: 'New Tab', action: () => this.browserApp.createNewTab() },
            { text: 'Reload Tab', action: () => this.reloadTab(tabId) },
            { text: 'Duplicate Tab', action: () => this.duplicateTab(tabId) },
            { text: 'Pin Tab', action: () => this.pinTab(tabId) },
            { text: 'Close Tab', action: () => this.browserApp.closeTab(tabId) },
            { text: 'Close Other Tabs', action: () => this.closeOtherTabs(tabId) },
            { text: 'Close Tabs to the Right', action: () => this.closeTabsToRight(tabId) }
        ];

        menuItems.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'tab-context-menu-item';
            menuItem.textContent = item.text;
            menuItem.style.padding = '8px 12px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.borderBottom = '1px solid #f0f0f0';
            
            menuItem.addEventListener('click', () => {
                item.action();
                menu.remove();
            });

            menuItem.addEventListener('mouseover', () => {
                menuItem.style.backgroundColor = '#f0f0f0';
            });

            menuItem.addEventListener('mouseout', () => {
                menuItem.style.backgroundColor = '';
            });

            menu.appendChild(menuItem);
        });

        document.body.appendChild(menu);

        // Close menu when clicking outside
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };

        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 0);
    }

    reloadTab(tabId) {
        const tab = this.browserApp.tabs.get(tabId);
        if (tab && tab.webview) {
            tab.webview.reload();
        }
    }

    duplicateTab(tabId) {
        const tab = this.browserApp.tabs.get(tabId);
        if (tab) {
            this.browserApp.createNewTab(tab.url);
        }
    }

    pinTab(tabId) {
        const tabElement = document.querySelector(`[data-tab-id="${tabId}"]`);
        if (tabElement) {
            tabElement.classList.toggle('pinned');
        }
    }

    closeOtherTabs(keepTabId) {
        const tabIds = Array.from(this.browserApp.tabs.keys());
        tabIds.forEach(tabId => {
            if (tabId !== keepTabId) {
                this.browserApp.closeTab(tabId);
            }
        });
    }

    closeTabsToRight(referenceTabId) {
        const tabElements = Array.from(document.querySelectorAll('.tab'));
        const referenceIndex = tabElements.findIndex(tab => tab.dataset.tabId === referenceTabId);
        
        if (referenceIndex !== -1) {
            for (let i = referenceIndex + 1; i < tabElements.length; i++) {
                this.browserApp.closeTab(tabElements[i].dataset.tabId);
            }
        }
    }

    // Tab overflow handling
    handleTabOverflow() {
        const tabsContainer = document.getElementById('tabs-container');
        if (!tabsContainer) return;

        const containerWidth = tabsContainer.clientWidth;
        const tabElements = tabsContainer.querySelectorAll('.tab');
        const tabWidth = 200; // Default tab width
        const maxVisibleTabs = Math.floor(containerWidth / tabWidth);

        if (tabElements.length > maxVisibleTabs) {
            // Implement tab overflow with scroll buttons
            this.showTabScrollButtons();
        } else {
            this.hideTabScrollButtons();
        }
    }

    showTabScrollButtons() {
        // Add scroll buttons implementation
        const tabBar = document.querySelector('.tab-bar');
        if (!tabBar.querySelector('.tab-scroll-left')) {
            const scrollLeft = document.createElement('button');
            scrollLeft.className = 'tab-scroll-left';
            scrollLeft.innerHTML = '←';
            scrollLeft.addEventListener('click', () => this.scrollTabsLeft());
            
            const scrollRight = document.createElement('button');
            scrollRight.className = 'tab-scroll-right';
            scrollRight.innerHTML = '→';
            scrollRight.addEventListener('click', () => this.scrollTabsRight());
            
            tabBar.insertBefore(scrollLeft, tabBar.firstChild);
            tabBar.appendChild(scrollRight);
        }
    }

    hideTabScrollButtons() {
        const scrollButtons = document.querySelectorAll('.tab-scroll-left, .tab-scroll-right');
        scrollButtons.forEach(button => button.remove());
    }

    scrollTabsLeft() {
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer) {
            tabsContainer.scrollLeft -= 200;
        }
    }

    scrollTabsRight() {
        const tabsContainer = document.getElementById('tabs-container');
        if (tabsContainer) {
            tabsContainer.scrollLeft += 200;
        }
    }
}
