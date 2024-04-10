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

    const WS = 'StandardHrGarnishmentType';

    const columnDefs = [
        {headerName: 'Wage Type', field: 'wageType', width: 15  },
        {headerName: 'Description', field: 'description', width: 45 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "listTypes", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Employee Wage Garnishment Type');
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Garnishment Type');
        $$('dp-wage-type').clear();
        $$('dp-description').clear();
        $$('dp-last-active').clear();

        AWS.callSoap(WS, "listWageTypes").then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-wage-type').clear().addItems(res.item, 'id', 'description');
            }
        });

        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-wage-type').isError('Wage Type'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                wageTypeId: $$('dp-wage-type').getValue(),
                description: $$('dp-description').getValue(),
                inactiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "newType", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Garnishment Type');
        $$('dp-description').setValue(row.description);
        $$('dp-last-active').setValue(Number(row.lastActiveDate));
        Utils.popup_open('detail-popup', 'dp-category');

        AWS.callSoap(WS, "listWageTypes", {wageTypeId: row.id}).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-wage-type').clear().addItems(res.item, 'id', 'description').setValue(res.selectedItem.id);
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-wage-type').isError('Wage Type'))
                return;
            if ($$('dp-description').isError('Category'))
                return;
            const data = {
                id: row.id,
                wageTypeId: $$('dp-wage-type').getValue(),
                description: $$('dp-description').getValue(),
                inactiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "saveType", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Employee Wage Garnishment Type?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteTypes", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
