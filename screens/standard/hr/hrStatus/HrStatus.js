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

    const WS = 'StandardHrHrStatus';

    const columnDefs = [
        {headerName: 'Status', field: 'name', width: 20  },
        {headerName: 'Type', field: 'typeFormatted', width: 10 },
        {headerName: 'When assigned this Status to an Employee', field: 'dateTypeFormatted', width: 35 },
        {headerName: 'Benefit Restrictions', field: 'benefitTypeFormatted', width: 35 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'employeeStatusId');
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
        AWS.callSoap(WS, "listEmployeeStatuses", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Employee Statuses');
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
        $$('dp-title').setValue('Add Status');
        $$('dp-status').clear();
        $$('dp-last-active').clear();

        Utils.popup_open('detail-popup', 'dp-status');

        $$('dp-ok').onclick(() => {
            if ($$('dp-status').isError('Status'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            const data = {
                name: $$('dp-status').getValue(),
                type: $$('dp-type').getValue(),
                benefitType: $$('dp-benefit-restrictions').getValue(),
                dateType: $$('dp-when-assigning').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "newEmployeeStatus", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Status');
        $$('dp-status').setValue(row.name);
        $$('dp-type').setValue(row.type);
        $$('dp-when-assigning').setValue(row.dateType);
        $$('dp-benefit-restrictions').setValue(row.benefitType);
        $$('dp-last-active').setValue(Number(row.lastActiveDate));

        Utils.popup_open('detail-popup', 'dp-status');

        $$('dp-ok').onclick(() => {
            if ($$('dp-status').isError('Status'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            const data = {
                id: row.employeeStatusId,
                name: $$('dp-status').getValue(),
                type: $$('dp-type').getValue(),
                benefitType: $$('dp-benefit-restrictions').getValue(),
                dateType: $$('dp-when-assigning').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "saveEmployeeStatus", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Employee Status?', () => {
            const data = {
                ids: grid.getSelectedRow().employeeStatusId
            };
            AWS.callSoap(WS, "deleteEmployeeStatuses", data).then(function (res) {
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
        AWS.callSoap(WS, "getEmployeeStatusesReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
