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

/*
    All rights reserved.

*/

'use strict';

(async function () {

    const WS = 'StandardSiteScreenGroupAccess';

    let formGrid;
    
    let reset = () => {
        
        $$('filter-last-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-last-name').clear();
        $$('filter-first-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-first-name').clear();
        
        AWS.callSoap(WS, 'listScreenGroups').then(res => {
            if (res.wsStatus === '0') {
                fillDropDownFromService('filter-screen-group', res, 'id', 'name', '(select)', 'screenGroups');
            }
        });

        AWS.callSoap(WS, 'listSecurityGroups').then(res => {
            if (res.wsStatus === '0') {
                fillDropDownFromService('filter-security-group', res, 'id', 'name', '(select)', 'securityGroups');
            }
        });

        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('data-count', `Displaying ${count} Users`);
    };

    bindToEnum('filter-last-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('filter-first-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
    function ViewProfileButton() {}

    ViewProfileButton.prototype.init = function(params) {
        const e = document.createElement('INPUT');
        e.setAttribute('type', 'button');
        e.setAttribute('value', 'View Profile');
        e.setAttribute('id', 'view' + params.data.personId);
        e.style.fontSize = '8px';
        this.eGui = e;
    };

    ViewProfileButton.prototype.getGui = function() {
        return this.eGui;
    };

    const columnDefs = [
        {headerName: 'Last Name', field: 'lName'},
        {headerName: 'First Name', field: 'fName'},
        {headerName: 'Last Signed In', field: 'signInDate', width: 130},
        {headerName: 'Screen Group', field: 'screenGroupName'},
        {headerName: 'Security Group', field: 'securityGroupName'},
        {headerName: '', field: '', cellRenderer: 'viewProfileButton', width: 110},
    ];

    formGrid = new AGGrid('data-grid', columnDefs, 'personId');
    formGrid.addComponent('viewProfileButton', ViewProfileButton);
    formGrid.show();

    const updateGrid = () => {
        const data = {
            firstName: $$('filter-first-name').getValue(),
            firstNameSearchType: $$('filter-first-name-type').getValue(),
            lastName: $$('filter-last-name').getValue(),
            lastNameSearchType: $$('filter-last-name-type').getValue(),
            screenGroupId: $$('filter-screen-group').getValue(),
            securityGroupId: $$('filter-security-group').getValue()
        };

        AWS.callSoap(WS, 'searchScreenAndSecurityGroups', data).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                formGrid.clear().addRecords(res.item);
                changeCount(res.item.length);
            }
        });
    };

    reset();
    updateGrid();

    $$('filter-reset').onclick(reset);
    $$('filter-search').onclick(updateGrid);

    $$('data-report').onclick(() => {
        const data = {
            firstName: $$('filter-first-name').getValue(),
            firstNameSearchType: $$('filter-first-name-type').getValue(),
            lastName: $$('filter-last-name').getValue(),
            lastNameSearchType: $$('filter-last-name-type').getValue(),
            screenGroupId: $$('filter-screen-group').getValue(),
            securityGroupId: $$('filter-security-group').getValue()
        };

        AWS.callSoap(WS, 'getReport', data).then(res => {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();