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
    const WS = 'StandardCrmClientParent';
    let gridFilled = false;

    const columnDefs = [
        {headerName: 'Name', field: 'clientName', width: 200},
        {headerName: 'ID', field: 'clientIdentifier', width: 100},
        {headerName: 'Status', field: 'clientStatus', width: 125},
        {headerName: 'Phone', field: 'clientPhone', width: 150},
        {headerName: 'Contact Last Name', field: 'clientContactLastName', width: 150},
        {headerName: 'Contact First Name', field: 'clientContactFirstName', width: 150},
        {headerName: 'Contact Phone', field: 'clientContactPhone', width: 150}
    ];
    const grid = new AGGrid('grid', columnDefs, 'clientId');
    //grid.multiSelect();
    grid.show();

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {
        const data = {
            id: $$('id').getValue(),
            idSearchType: $$('id-search-type').getValue(),
            mainContactFirstName: $$('contact-first-name').getValue(),
            mainContactFirstNameSearchType: $$('first-name-type').getValue(),
            mainContactLastName: $$('contact-last-name').getValue(),
            mainContactLastNameSearchType: $$('last-name-type').getValue(),
            name: $$('name').getValue(),
            nameSearchType: $$('name-search-type').getValue(),
            sortAsc: false,
            sortOn: null,
            status: $$('login-status').getValue()
        };
        grid.clear();
        AWS.callSoap(WS, 'searchClientCompany', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                $$('delete').disable();
                res.clientList = Utils.assureArray(res.clientList);
                grid.addRecords(res.clientList);
                const cap = Number(res.cap);
                if (res.clientList.length >= cap)
                    $$('status').setValue("Displaying " + res.clientList.length + " Clients (limit)").setColor('red');
                else
                    $$('status').setValue("Displaying " + res.clientList.length + " Clients").setColor('black');
                gridFilled = true;
            }
        });
    }

    const rememberVisitedClient = function (id, name) {
        let visitedClients = Utils.getData(VISITED_CLIENTS);
        if (!visitedClients)
            visitedClients = {};
        if (visitedClients[id])
            return;
        visitedClients[id] = {};
        visitedClients[id].name = name;
        Utils.saveData(VISITED_CLIENTS, visitedClients);
    };

    {
        const visitedClients = Utils.getData(VISITED_CLIENTS);
        const rp = $$('client-history');
        rp.clear();
        if (visitedClients && Utils.countProperties(visitedClients))
            for (let id in visitedClients)
                rp.add(id, visitedClients[id].name);
    }

    $$('reset').onclick(() => {
        $$('name').clear();
        $$('id').clear();
        $$('contact-first-name').clear();
        $$('contact-last-name').clear();
        $$('id-search-type').setValue(5);
        $$('name-search-type').setValue(2);
        $$('first-name-type').setValue(2);
        $$('last-name-type').setValue(2);
        $$('login-status').setValue(1);
    });

    $$('search').onclick(updateGrid);

    function clearNewClientFields() {
        $$('acp-name').clear();
        $$('acp-street-1').clear();
        $$('acp-street-2').clear();
        $$('acp-city').clear();
        $$('acp-state').setValue('');
        $$('acp-zip').clear();
        $$('acp-phone').clear();
        $$('acp-fax').clear();
        $$('acp-id').clear();
        $$('acp-fei').clear();
        $$('acp-sales-account').clear();
        $$('acp-billing-rate').clear();
        $$('acp-default-billing-rate').clear();
        $$('acp-client-status').clear();
        $$('acp-contract-date').clear();
        $$('acp-inactive-date').clear();

        $$('acp-contact-first-name').clear();
        $$('acp-contact-last-name').clear();
        $$('acp-contact-email').clear();
        $$('acp-contact-job-title').clear();
        $$('acp-contact-phone').clear();
        $$('acp-contact-fax').clear();

        $$('acp-login-assign-login').clear();
        $$('acp-login-id').clear();
        $$('acp-login-password').clear();
        $$('acp-login-confirm-password').clear();
        $$('acp-login-screen-group').clear();
        $$('acp-login-security-group').clear();
        $$('acp-login-status').clear();
    }

    function addNewClient() {
        clearNewClientFields();
        Utils.popup_open('add-client-popup');
        const tabContainer = new TabContainer('acp-tab-container');
        tabContainer.selectTab('acp-client-detail-TabButton');

        AWS.callSoap(WS, 'listGLSalesAccounts').then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('acp-sales-account');
                ctl.add('', '(select)');
                ctl.addItems(res.glAccountTransmit, 'glAccountId', 'accountName');
            }
        });

        AWS.callSoap(WS, 'listClientStatuses').then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('acp-client-status');
                ctl.add('', '(select)');
                ctl.addItems(res.item, 'id', 'description');
            }
        });

        let data = {
            extId: null,
            name: null,
            nameSearchType: 0,
            searchTopLevelOnly: true
        };
        AWS.callSoap(WS, 'searchScreenGroups', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('acp-login-screen-group');
                ctl.add('', '(select)');
                ctl.addItems(res.screenDef, 'id', 'title');
            }
        });

        data = {
            name: null,
            nameSearchType: 0
        };
        AWS.callSoap(WS, 'searchSecurityGroups', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('acp-login-security-group');
                ctl.add('', '(select)');
                ctl.addItems(res.item, 'groupId', 'name');
            }
        });

        AWS.callSoap(WS, 'getDefaults').then(function (res) {
            if (res.wsStatus === "0") {
                $$('acp-default-billing-rate').setValue(res.billingRate);
            }
        });

        $$('acp-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('acp-login-assign-login').onChange((val) => {
            if (val) {
                $$('acp-login-id').enable();
                $$('acp-login-screen-group').enable();
                $$('acp-login-password').enable();
                $$('acp-login-security-group').enable();
                $$('acp-login-confirm-password').enable();
                $$('acp-login-status').enable();
                $$('acp-login-status').enable();
            } else {
                $$('acp-login-id').disable();
                $$('acp-login-screen-group').disable();
                $$('acp-login-password').disable();
                $$('acp-login-security-group').disable();
                $$('acp-login-confirm-password').disable();
                $$('acp-login-status').disable();
                $$('acp-login-status').disable();
            }
        });

        $$('acp-ok').onclick(() => {
            if ($$('acp-name').isError('Client name')) {
                tabContainer.selectTab('acp-client-detail-TabButton');
                return;
            }
            if ($$('acp-client-status').isError('Client status')) {
                tabContainer.selectTab('acp-client-detail-TabButton');
                return;
            }
            if ($$('acp-login-password').getValue() !== $$('acp-login-confirm-password').getValue()) {
                Utils.showMessage('Error', 'Login passwords do not match.');
                tabContainer.selectTab('acp-login-detail-TabButton');
                return;
            }
            const data = {
                billingRate: $$('acp-billing-rate').getValue(),
                city: $$('acp-city').getValue(),
                contractDate: $$('acp-contract-date').getIntValue(),
                federalEmployerId: $$('acp-fei').getValue(),
                glSalesAccount: $$('acp-sales-account').getValue(),
                id: null,
                identifier: null,
                inactiveDate: 0,
                mainContactCanLogin: $$('acp-login-assign-login').getValue(),
                mainContactFname: $$('acp-contact-first-name').getValue(),
                mainContactJobTitle: $$('acp-contact-job-title').getValue(),
                mainContactLname: $$('acp-contact-last-name').getValue(),
                mainContactLogin: $$('acp-login-id').getValue(),
                mainContactPassword: $$('acp-login-password').getValue(),
                mainContactPersonalEmail: $$('acp-contact-email').getValue(),
                mainContactScreenGroupId: $$('acp-login-screen-group').getValue(),
                mainContactSecurityGroupId: $$('acp-login-security-group').getValue(),
                mainContactWorkFax: $$('acp-contact-fax').getValue(),
                mainContactWorkPhone: $$('acp-contact-phone').getValue(),
                mainFaxNumber: $$('acp-fax').getValue(),
                mainPhoneNumber: $$('acp-phone').getValue(),
                name: $$('acp-name').getValue(),
                state: $$('acp-state').getValue(),
                statusId: $$('acp-client-status').getValue(),
                street: $$('acp-street-1').getValue(),
                street2: $$('acp-street-2').getValue(),
                zip: $$('acp-zip').getValue()
            };
            AWS.callSoap(WS, 'newClientCompany', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'New Client created successfully.');
                    Utils.popup_close();
                    if (gridFilled)
                        updateGrid();
                }
            });
        });
    }

    $$('add').onclick(() => {
        Utils.popup_open('add-type-popup');

        $$('atp-add-type').setValue('N').onChange((val) => {
            if (val === 'N')
                $$('atp-prospect').clear().disable();
            else {
                const data = {
                    name: '%',
                    identifier: '%'
                };
                AWS.callSoap(WS, 'searchProspects', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        const ctl = $$('atp-prospect');
                        ctl.enable();
                        ctl.setup(Number(res.lowCap), true);
                        ctl.setupItems(res.item, 'id', 'name', null);
                        ctl.setupSelectFunction(async () => {
                            return await Utils.component('prospectSelection/ProspectSelection', 'component-prospect-selection');
                        }, 'id', 'name', null);
                        ctl.testMode(true);
                        ctl.run();
                    }
                });
            }
        });
        $$('atp-prospect').clear().disable();

        $$('atp-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('atp-ok').onclick(() => {
            if ($$('atp-add-type').getValue() === 'N') {
                Utils.popup_close();
                addNewClient();
            } else {
                if ($$('atp-prospect').isError('Prospect'))
                    return;
                const data = {
                    id: $$('atp-prospect').getValue()
                };
                AWS.callSoap(WS, 'newClientCompany', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        Utils.showMessage('Information', 'Prospect successfully promoted to a client.');
                        Utils.popup_close();
                        if (gridFilled)
                            updateGrid();
                    }
                });
            }
        });
    });

    $$('delete').onclick(() => {
        const row = grid.getSelectedRow();
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected client?', () => {
            const data = {
                clientCompanyId: row.clientId
            };
            AWS.callSoap(WS, 'deleteCompany', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'The selected client has been deleted.');
                    if (gridFilled)
                        updateGrid();
                }
            });

        });
    });

    $$('edit-history').onclick(() => {
        const ctl = $$('client-history');
        Utils.saveData(CURRENT_CLIENT_ID, ctl.getValue());
        Utils.saveData(CURRENT_CLIENT_NAME, ctl.getLabel());
        Framework.getChild();
    });

    function editClient() {
        const row = grid.getSelectedRow();
        rememberVisitedClient(row.clientId, row.clientName);
        Utils.saveData(CURRENT_CLIENT_ID, row.clientId);
        Utils.saveData(CURRENT_CLIENT_NAME, row.clientName);
        Framework.getChild();
    }

    grid.setOnRowDoubleClicked(editClient);
    $$('edit').onclick(editClient);

})();
