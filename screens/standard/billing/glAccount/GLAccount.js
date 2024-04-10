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

    const WS = 'StandardBillingGlAccount';

    const columnDefs = [
        {headerName: 'Number', field: 'accountNumber', width: 20  },
        {headerName: 'Name', field: 'accountName', width: 40 },
        {headerName: 'Type', field: 'accountTypeFormatted', width: 30 },
        {headerName: 'Default For Account Type', field: 'defaultForTypeFormatted', width: 30 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'accountId');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();

        AWS.callSoap(WS, "listGLAccounts").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' GL Accounts');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add GL Account');
        $$('dp-number').clear();
        $$('dp-name').clear();
        $$('dp-type').clear();
        $$('dp-default-account').setValue('');
        $$('dp-all-companies').clear();
        Utils.popup_open('detail-popup', 'dp-number');

        AWS.callSoap(WS, "checkRight").then(function (res) {
            if (res.wsStatus === '0') {
            }
        });

        AWS.callSoap(WS, "listGLAccountTypes").then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-type').add('', '(select)').addItems(res.item, 'accountType', 'accountTypeFormatted');
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-number').isError('Number'))
                return;
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            const data = {
                accountName: $$('dp-name').getValue(),
                accountNumber: $$('dp-number').getValue(),
                accountType: $$('dp-type').getValue(),
                allCompanies: $$('dp-all-companies').getValue(),
                defaultForType: $$('dp-default-account').getValue()
            };
            AWS.callSoap(WS, "newGLAccount", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();
        $$('dp-title').setValue('Edit GL Account');
        $$('dp-number').setValue(row.accountNumber);
        $$('dp-name').setValue(row.accountName);
        $$('dp-type').clear();
        $$('dp-default-account').setValue(row.defaultForType === 'true');
        $$('dp-all-companies').setValue(row.allCompanies === 'true');
        Utils.popup_open('detail-popup', 'dp-number');

        AWS.callSoap(WS, "checkRight").then(function (res) {
            if (res.wsStatus === '0') {
            }
        });

        AWS.callSoap(WS, "listGLAccountTypes").then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-type').add('', '(select)').addItems(res.item, 'accountType', 'accountTypeFormatted').setValue(row.accountType);
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-number').isError('Number'))
                return;
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            const data = {
                accountId: row.accountId,
                accountName: $$('dp-name').getValue(),
                accountNumber: $$('dp-number').getValue(),
                accountType: $$('dp-type').getValue(),
                allCompanies: $$('dp-all-companies').getValue(),
                defaultForType: $$('dp-default-account').getValue()
            };
            AWS.callSoap(WS, "saveGLAccount", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected GL Account?', () => {
            const data = {
                accountIds: grid.getSelectedRow().accountId
            };
            AWS.callSoap(WS, "deleteGLAccounts", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getGLAccountsReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
