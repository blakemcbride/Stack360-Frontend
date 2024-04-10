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

    const WS = 'StandardBillingService';

    const columnDefs = [
        {headerName: 'ID', field: 'accSysId', width: 20  },
        {headerName: 'Description', field: 'description', width: 40 },
        {headerName: 'Default GL Account', field: 'defaultGLAccountFormatted', width: 30 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'serviceId');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();

        const data = {
            accSysId: null,
            accSysIdSearchType: 2,
            description: null,
            descriptionSearchType: 2
        };
        AWS.callSoap(WS, "searchForServices", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Services');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Service');
        $$('dp-id').clear();
        $$('dp-description').clear();
        $$('dp-default-gl-account').clear();
        Utils.popup_open('detail-popup', 'dp-id');

        const data = {
          serviceId: null
        };
        AWS.callSoap(WS, "listGLAccounts", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-default-gl-account').add('', '(select)').addItems(res.item, 'accountId', 'accountName');
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-id').isError('ID'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                accSysId: $$('dp-id').getValue(),
                description: $$('dp-description').getValue(),
                defaultGLAccountId: $$('dp-default-gl-account').getValue()
            };
            AWS.callSoap(WS, "newService", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Service');
        $$('dp-id').setValue(row.accSysId);
        $$('dp-description').setValue(row.description);
        Utils.popup_open('detail-popup', 'dp-id');

        const data = {
            serviceId: row.serviceId
        };
        AWS.callSoap(WS, "listGLAccounts", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-default-gl-account').add('', '(select)').addItems(res.item, 'accountId', 'accountName');
                if (res.selectedItem  &&  res.selectedItem.accountId)
                    $$('dp-default-gl-account').setValue(res.selectedItem.accountId);
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-id').isError('ID'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                serviceId: row.serviceId,
                accSysId: $$('dp-id').getValue(),
                description: $$('dp-description').getValue(),
                defaultGLAccountId: $$('dp-default-gl-account').getValue()
            };
            AWS.callSoap(WS, "saveService", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Service?', () => {
            const data = {
                serviceIds: grid.getSelectedRow().serviceId
            };
            AWS.callSoap(WS, "deleteServices", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            accSysId: null,
            accSysIdSearchType: 2,
            description: null,
            descriptionSearchType: 2
        };
        AWS.callSoap(WS, "getServicesReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
