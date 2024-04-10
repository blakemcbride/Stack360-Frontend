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

    const WS = 'StandardSiteProperties';

    const columnDefs = [
        {headerName: 'Name', field: 'name', width: 25  },
        {headerName: 'Value', field: 'value', width: 25 },
        {headerName: 'Description', field: 'description', width: 50 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    function updateGrid() {
        grid.clear();
        AWS.callSoap(WS, "listProperties").then(function (res) {
            if (res.wsStatus === '0') {
                grid.addRecords(res.item);
            }
        });
    }
    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('pp-title').setValue('Add Property');
        $$('pp-name').enable();
        $$('pp-name').clear();
        $$('pp-value').clear();
        $$('pp-description').clear();
        Utils.popup_open('property-popup', 'pp-name');

        $$('pp-ok').onclick(() => {
            if ($$('pp-name').isError('Name'))
                return;
            const data = {
                name: $$('pp-name').getValue(),
                value: $$('pp-value').getValue(),
                description: $$('pp-description').getValue()
            };
            AWS.callSoap(WS, "newProperty", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
                Utils.popup_close();
            });
        });

        $$('pp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        $$('pp-title').setValue('Edit Property');
        $$('pp-name').disable();
        const row = grid.getSelectedRow();
        $$('pp-name').setValue(row.name);
        $$('pp-value').setValue(row.value);
        $$('pp-description').setValue(row.description);
        Utils.popup_open('property-popup', 'pp-value');
        $$('pp-ok').onclick(() => {
            const data = {
                id: row.id,
                name: $$('pp-name').getValue(),
                value: $$('pp-value').getValue(),
                description: $$('pp-description').getValue()
            };
            AWS.callSoap(WS, "saveProperty", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
                Utils.popup_close();
            });
        });
        $$('pp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Property?', () => {
            const row = grid.getSelectedRow();
            const data = {
                ids: row.id
            };
            AWS.callSoap(WS, "deleteProperties", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getPropertiesReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
