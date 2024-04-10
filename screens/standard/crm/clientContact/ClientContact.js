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

    const WS = 'StandardCrmClientContact';
    const clientId = Utils.getData("CURRENT_CLIENT_ID");
    const clientName = Utils.getData("CURRENT_CLIENT_NAME");

    $$('client-name').setValue(clientName);

    const columnDefs = [
        {headerName: 'Last Name', field: 'lastName', width: 30  },
        {headerName: 'First Name', field: 'firstName', width: 30 },
        {headerName: 'Primary', field: 'primary', width: 15 },
        {headerName: 'Job Title', field: 'jobTitle', width: 25 },
        {headerName: 'Work Phone', field: 'workPhone', type: 'numericColumn', width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const data = {
        companyId: clientId,
        orgGroupName: null,
        orgGroupNameSearchType: 0
    };
    res = await AWS.callSoap(WS, "searchOrgGroupsForCompany", data);
    if (res.wsStatus !== '0')
        return;
    $$('organizational-group').addItems(res.item, 'id', 'name').setValue(res.selectedItem.id);
    if (Utils.assureArray(res.item).length < 2)
        $$('organizational-group').disable();
    const orgGroupId = res.selectedItem.id;

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            orgGroupId: orgGroupId
        };
        AWS.callSoap(WS, "listContacts", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Client Contacts');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function editQuestion(grid) {
        const row = grid.getSelectedRow();
        $$('qp-entered').setValue(row.whenAddedFormatted ? row.whenAddedFormatted : '(generated on save)');
        $$('qp-question').setValue(row.question);
        $$('qp-response').setValue(row.response);

        Utils.popup_open('question-popup', 'qp-response');

        $$('qp-ok').onclick(() => {
            row.response = $$('qp-response').getValue();
            grid.updateSelectedRecord(row);
            Utils.popup_close();
        });

        $$('qp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('add').onclick(() => {
        Utils.popup_open('detail-popup');  // since we have a grid, this popup context must be setup before we initialize any grids
        const tabs = new TabContainer('dp-tab-container');
        tabs.selectTab('dp-summary-TabButton');

        $$('dp-first-name').clear();
        $$('dp-job-title').clear();
        $$('dp-last-name').clear();
        $$('dp-email').clear();
        $$('dp-primary').clear();
        $$('dp-street1').clear();
        $$('dp-home-phone').clear();
        $$('dp-street2').clear();
        $$('dp-work-phone').clear();
        $$('dp-mobile-phone').clear();
        $$('dp-city').clear();
        $$('dp-fax').clear();
        $$('dp-state').setValue('');
        $$('dp-zip').clear();
        $$('dp-country').setValue('US');

        $$('dp-assign-login').clear();
        $$('dp-login-id').clear().disable();
        $$('dp-password').clear().disable();
        $$('dp-confirm-password').clear().disable();
        $$('dp-login-status').disable();
        $$('dp-title').setValue('Add Client Contact');
        $$('dp-edit').disable();

        let data = {
            extId: null,
            name: null,
            nameSearchType: 0,
            personId: null,
            searchTopLevelOnly: true
        };
        AWS.callSoap(WS, "searchScreenGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-screen-group').clear().add('', '(choose)').addItems(res.screenDef, 'id', 'title');
            }
        });

        data = {
            name: null,
            nameSearchType: 0,
            personId: null
        };
        AWS.callSoap(WS, "searchSecurityGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-security-group').clear().add('', '(choose)').addItems(res.item, 'groupId', 'name');
            }
        });

        const columnDefs = [
            {headerName: 'Question', field: 'question', width: 300  },
            {headerName: 'Response', field: 'response', width: 300 },
            {headerName: 'Entered', field: 'whenAddedFormatted', width: 100 }
        ];
        const dgrid = new AGGrid('dp-detail-grid', columnDefs, 'questionId');
        dgrid.show();

        data = {
            id: null
        };
        AWS.callSoap(WS, "listContactQuestions", data).then(function (res) {
            if (res.wsStatus === '0') {
                dgrid.clear().addRecords(res.item);
                $$('dp-status').setValue('Displaying ' + Utils.assureArray(res.item).length + ' Contact Questions');
            }
        });

        dgrid.setOnRowDoubleClicked(() => {
            editQuestion(dgrid);
        });

        dgrid.setOnSelectionChanged((rows) => {
            $$('dp-edit').enable(rows);
        });

        $$('dp-edit').onclick(() => {
            editQuestion(dgrid);
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-first-name').isError('First Name')) {
                tabs.selectTab('dp-summary-TabButton');
                return;
            }
            if ($$('dp-last-name').isError('Last Name')) {
                tabs.selectTab('dp-summary-TabButton');
                return;
            }
            if ($$('dp-assign-login').getValue()) {
                if ($$('dp-login-id').isError('Login ID')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-password').isError('Password')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-confirm-password').isError('Confirm Password')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-screen-group').isError('Screen Group')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-security-group').isError('Security Group')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
            }
            const questions = [];
            const qrows = dgrid.getAllRows();
            for (let i=0 ; i < qrows.length ; i++) {
                let qrow = qrows[i];
                let obj = {
                    detailId: null,
                    questionId: qrow.questionId,
                    response: qrow.response
                };
                questions.push(obj);
            }
            const data = {
                canLogin: $$('dp-assign-login').getValue(),
                city: $$('dp-city').getValue(),
                contactPassword: $$('dp-password').getValue(),
                country: $$('dp-country').getValue(),
                fname: $$('dp-first-name').getValue(),
                homePhone: $$('dp-home-phone').getValue(),
                jobTitle: $$('dp-job-title').getValue(),
                lname: $$('dp-last-name').getValue(),
                login: $$('dp-login-id').getValue(),
                mobilePhone: $$('dp-mobile-phone').getValue(),
                orgGroupId: clientId,
                personalEmail: $$('dp-email').getValue(),
                primaryIndicator: $$('dp-primary').getValue(),
                screenGroupId: $$('dp-screen-group').getValue(),
                securityGroupId: $$('dp-security-group').getValue(),
                state: $$('dp-state').getValue(),
                street: $$('dp-street1').getValue(),
                street2: $$('dp-street2').getValue(),
                workFax: $$('dp-fax').getValue(),
                workPhone: $$('dp-work-phone').getValue(),
                zip: $$('dp-zip').getValue(),
                item: questions
            };
            AWS.callSoap(WS, "newClientContact", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

    });

    function edit() {
        const row = grid.getSelectedRow();

        Utils.popup_open('detail-popup');  // since we have a grid, this popup context must be setup before we initialize any grids
        const tabs = new TabContainer('dp-tab-container');
        tabs.selectTab('dp-summary-TabButton');

        $$('dp-title').setValue('Edit Client Contact');
        $$('dp-first-name').setValue(row.firstName);
        $$('dp-job-title').setValue(row.jobTitle);
        $$('dp-last-name').setValue(row.lastName);
        $$('dp-primary').setValue(row.primary !== 'No');
        $$('dp-work-phone').setValue(row.workPhone);
        $$('dp-edit').disable();

        let data = {
            extId: null,
            name: null,
            nameSearchType: 0,
            personId: row.id,
            searchTopLevelOnly: true
        };
        AWS.callSoap(WS, "searchScreenGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-screen-group').clear().add('', '(choose)').addItems(res.screenDef, 'id', 'title');
                if (res.selectedItem)
                    $$('dp-screen-group').setValue(res.selectedItem.id);
            }
        });

        data = {
            name: null,
            nameSearchType: 0,
            personId: row.id
        };
        AWS.callSoap(WS, "searchSecurityGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-security-group').clear().add('', '(choose)').addItems(res.item, 'groupId', 'name');
                if (res.selectedItem)
                    $$('dp-security-group').setValue(res.selectedItem.groupId);
            }
        });

        const columnDefs = [
            {headerName: 'Question', field: 'question', width: 300  },
            {headerName: 'Response', field: 'response', width: 300 },
            {headerName: 'Entered', field: 'whenAddedFormatted', width: 100 }
        ];
        const dgrid = new AGGrid('dp-detail-grid', columnDefs, 'questionId');
        dgrid.show();

        data = {
            id: row.id
        };
        AWS.callSoap(WS, "listContactQuestions", data).then(function (res) {
            if (res.wsStatus === '0') {
                dgrid.clear().addRecords(res.item);
                $$('dp-status').setValue('Displaying ' + Utils.assureArray(res.item).length + ' Contact Questions');
            }
        });

        dgrid.setOnRowDoubleClicked(() => {
            editQuestion(dgrid);
        });

        dgrid.setOnSelectionChanged((rows) => {
            $$('dp-edit').enable(rows);
        });

        $$('dp-edit').onclick(() => {
            editQuestion(dgrid);
        });

        data = {
            id: row.id
        };
        AWS.callSoap(WS, "loadContact", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-email').setValue(res.personalEmail);
                $$('dp-street1').setValue(res.street);
                $$('dp-home-phone').setValue(res.homePhone);
                $$('dp-street2').setValue(res.street2);
                $$('dp-city').setValue(res.city);
                $$('dp-fax').setValue(res.workFax);
                $$('dp-state').setValue(res.state);
                $$('dp-zip').setValue(res.zip);
                $$('dp-country').setValue(res.country);
                $$('dp-mobile-phone').setValue(res.mobilePhone);

                if (res.login || res.calLogin === 'true') {
                    $$('dp-assign-login').setValue(true);
                    $$('dp-login-id').setValue(res.login).enable();
                    $$('dp-password').setValue(res.password).enable();
                    $$('dp-confirm-password').setValue(res.password).enable();
                    $$('dp-login-status').setValue(res.calLogin === 'true' ? 'active' : 'inactive').disable();
                } else {
                    $$('dp-assign-login').setValue(false);
                    $$('dp-login-id').setValue(res.login).disable();
                    $$('dp-password').setValue(res.password).disable();
                    $$('dp-confirm-password').setValue(res.password).disable();
                    $$('dp-login-status').setValue(res.calLogin === 'true' ? 'active' : 'inactive').disable();
                }

                $$('dp-assign-login').onChange((val) => {
                    if (val) {
                        $$('dp-login-id').enable();
                        $$('dp-password').enable();
                        $$('dp-confirm-password').enable();
                        $$('dp-screen-group').enable();
                        $$('dp-security-group').enable();
                        $$('dp-login-status').enable();
                    } else {
                        $$('dp-login-id').disable();
                        $$('dp-password').disable();
                        $$('dp-confirm-password').disable();
                        $$('dp-screen-group').disable();
                        $$('dp-security-group').disable();
                        $$('dp-login-status').setValue('inactive').disable();
                    }
                });
            }
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-first-name').isError('First Name')) {
                tabs.selectTab('dp-summary-TabButton');
                return;
            }
            if ($$('dp-last-name').isError('Last Name')) {
                tabs.selectTab('dp-summary-TabButton');
                return;
            }
            if ($$('dp-assign-login').getValue()) {
                if ($$('dp-login-id').isError('Login ID')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-password').isError('Password')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-confirm-password').isError('Confirm Password')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-screen-group').isError('Screen Group')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
                if ($$('dp-security-group').isError('Security Group')) {
                    tabs.selectTab('dp-login-TabButton');
                    return;
                }
            }
            const questions = [];
            const qrows = dgrid.getAllRows();
            for (let i=0 ; i < qrows.length ; i++) {
                let qrow = qrows[i];
                let obj = {
                    detailId: null,
                    questionId: qrow.questionId,
                    response: qrow.response
                };
                questions.push(obj);
            }
            const data = {
                personId: row.id,
                canLogin: $$('dp-assign-login').getValue(),
                city: $$('dp-city').getValue(),
                contactPassword: $$('dp-password').getValue(),
                country: $$('dp-country').getValue(),
                fname: $$('dp-first-name').getValue(),
                homePhone: $$('dp-home-phone').getValue(),
                jobTitle: $$('dp-job-title').getValue(),
                lname: $$('dp-last-name').getValue(),
                login: $$('dp-login-id').getValue(),
                mobilePhone: $$('dp-mobile-phone').getValue(),
                orgGroupId: clientId,
                personalEmail: $$('dp-email').getValue(),
                primaryIndicator: $$('dp-primary').getValue(),
                screenGroupId: $$('dp-screen-group').getValue(),
                securityGroupId: $$('dp-security-group').getValue(),
                state: $$('dp-state').getValue(),
                street: $$('dp-street1').getValue(),
                street2: $$('dp-street2').getValue(),
                workFax: $$('dp-fax').getValue(),
                workPhone: $$('dp-work-phone').getValue(),
                zip: $$('dp-zip').getValue(),
                item: questions
            };
            AWS.callSoap(WS, "saveClientContact", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Client Contact?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteClientContact", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            id: clientId
        };
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
