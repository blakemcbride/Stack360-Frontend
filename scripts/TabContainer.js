/*
    STACK360 - Web-based Business Management System
    Copyright (C) 2024 Arahant LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see https://www.gnu.org/licenses.
*/

/**
 * Used to create a tab layout. The HTML elements must adhere to the following template for the constructor to generate
 * the tab layout from the HTML. Note the HTML id naming pattern used.
 *
 *  <div id='addWorkerTabContainer'>
 *      <ul class="tab-header">
 *          <li id='tabOneTabButton' class=active></li>
 *          <li id='tabTwoTabButton'></li>
 *      </ul>
 *
 *      <div id="tabOneTabContent" class="tab-content"></div>
 *      <div id="tabTwoTabContent" class="tab-content" hidden></div>
 *  </div>
 *
 * All rights reserved.
 */

'use strict';

class TabContainer {

    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            console.error("DOM element " + containerId + " does not exist.");
            return;
        }
        this.headerContainer = [].slice.call(this.container.children)
            .filter(el => el.className === 'tab-header' && el.nodeName === 'UL')[0];

        this.selectedTabButton = null;
        this.onTabChangeEventHandler = null;

        this.init();
    }

    get tabButtons() {
        return [].slice.call(this.headerContainer.children).filter(el => el.nodeName === 'LI');
    }

    get tabContent() {
        return [].slice.call(this.container.children)
            .filter(el => el.classList.contains('tab-content') && el.nodeName === 'DIV');
    }

    init() {
        // Set tab change event for all the tab buttons.
        for (let tabButton of this.tabButtons) {
            let buttonId = tabButton.id;
            let contentId = buttonId.replace('TabButton', 'TabContent');
            let content = document.getElementById(contentId);
            if (window.getComputedStyle(content).display !== 'none')
                this.selectedTabButton = tabButton;

            tabButton.onclick = event => {
                this.selectedTabButton = event.target;

                // Enable and disable tab buttons styles.
                for (let temp of this.tabButtons) {
                    if (temp !== this.selectedTabButton) {
                        temp.classList.remove('active');
                    } else {
                        temp.classList.add('active');
                    }
                }

                // Show the relevant tab content pane and hide the rest.
                let selContent = this.getSelectedTabContent();
                for (let tab of this.tabContent) {
                    if (tab === selContent) {
                        tab.removeAttribute('hidden');
                        tab.style.display = "";
                    } else {
                        tab.setAttribute('hidden', '');
                        tab.style.display = "none";
                    }
                }

                // Handle any user events.
                if (this.onTabChangeEventHandler != null)
                    this.onTabChangeEventHandler(event);
            };
        }
    }

    /**
     * Get the currently selected tab button's content pane.
     *
     * @returns {HTMLElement} Tab element with corresponding content ID.
     */
    getSelectedTabContent() {
        return this.selectedTabButton ? document.getElementById(this.selectedTabButton.id.replace('TabButton', 'TabContent')) : null;
    }

    /**
     * Retrieves the ID of the currently selected tab button.
     *
     * @return {string|null} The ID of the selected tab button, or null if no tab is currently selected.
     */
    getSelectedTabButtonId() {
        return this.selectedTabButton ? this.selectedTabButton.id : null;
    }

    /**
     * Select a specific tab.
     *
     * @param tabId Tab ID to be selected.
     */
    selectTab(tabId) {
        document.getElementById(tabId).click();
    }

    /**
     * Set a custom event handler for tab changes. This will be executed after the standard event execution. (Refer to init()).
     *
     * @param fn Function to handle tab change events. A standard DOM event object will be passed to this function handler.
     */
    setOnTabChangeEventHandler(fn) {
        this.onTabChangeEventHandler = fn;
    }

    /**
     * Check whether the given tab content is hidden.
     * @param tabId
     * @returns {boolean}
     */
    isVisible(tabId) {
        return ![].slice.call(this.tabContent).filter(el => el.id === tabId)[0].hidden;
    }
}