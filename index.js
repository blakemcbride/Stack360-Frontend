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
 * index.html is the first most loaded web page. This file loads the required Kiss components and sets the server port.
 *
 * Copyright STACK360 LLC 2019.
 */

'use strict';

Utils.afterComponentsLoaded(function () {
    /*  In Stack360, this is already done.  Also, this code doesn't work there.
    let href = window.location.href;
    let url = href.substr(0, href.lastIndexOf('/'));
    url = url.replace('8000', '8080');

    Server.setURL(url);
*/
    //Utils.forceASCII = true;
    Utils.loadPage('login', "");
});

(function () {
    Utils.useComponent('Popup');
    Utils.useComponent('CheckBox');
    Utils.useComponent('DateInput');
    Utils.useComponent('NativeDateInput');
    Utils.useComponent('DropDown');
    Utils.useComponent('ListBox');
    Utils.useComponent('NumericInput');
    Utils.useComponent('PushButton');
    Utils.useComponent("RadioButton");
    Utils.useComponent("TextboxInput");
    Utils.useComponent("TextInput");
    Utils.useComponent("TextLabel");
    Utils.useComponent("TimeInput");
    Utils.useComponent("SmartChooser");
    Utils.useComponent("FileUpload");
})();