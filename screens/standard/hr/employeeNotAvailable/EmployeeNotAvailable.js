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

(function () {
    const WS = 'com.arahant.services.standard.hr.employeeNotAvailable';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Start Date', field: 'startDate2', type: 'numericColumn', width: 20},
        {headerName: 'End Date', field: 'endDate2', type: 'numericColumn', width: 20},
        {headerName: 'Reason', field: 'reason', width: 200}
    ];
    const grid = new AGGrid('grid', columnDefs, 'employee_not_available_id');
    grid.show();

    function updateGrid() {
        let data = {
            employeeId: personId
        };
        grid.clear();
        Server.call(WS, 'GetRecords', data).then(function (res) {
            if (res._Success) {
                $$('edit').disable();
                $$('delete').disable();
                for (let i=0 ; i < res.item.length ; i++) {
                    let rec = res.item[i];
                    rec.startDate2 = DateUtils.intToStr4(rec.start_date)
                    rec.endDate2 = DateUtils.intToStr4(rec.end_date)
                }
                grid.addRecords(res.item);
                $$('status').setValue("Displaying " + res.item.length + " Record" + (res.item.length === 1 ? '' : 's'));
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(function () {
        $('#record-popup-title').text('Add Worker Unavailability');
        $$('record-popup-start-date').clear();
        $$('record-popup-end-date').clear();
        $$('record-popup-reason').clear();

        Utils.popup_open('record-popup');

        $$('record-popup-ok').onclick(function () {
            if ($$('record-popup-start-date').isError('Start Date'))
                return;
            if ($$('record-popup-end-date').isError('End Date'))
                return;
            if ($$('record-popup-reason').isError('Reason'))
                return;
            const data = {
                employeeId: personId,
                startDate: $$('record-popup-start-date').getIntValue(),
                endDate: $$('record-popup-end-date').getIntValue(),
                reason: $$('record-popup-reason').getValue()
            };
            Server.call(WS, 'AddRecord', data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
                Utils.popup_close();
            });
        });

        $$('record-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    async function edit() {
        $('#record-popup-title').text('Edit Worker Unavailability');
        const row = grid.getSelectedRow();

        $$('record-popup-start-date').setValue(row.start_date);
        $$('record-popup-end-date').setValue(row.end_date);
        $$('record-popup-reason').setValue(row.reason);

        Utils.popup_open('record-popup');

        $$('record-popup-cancel').onclick(function () {
            Utils.popup_close();
        });

        $$('record-popup-ok').onclick(function () {
            if ($$('record-popup-start-date').isError('Start Date'))
                return;
            if ($$('record-popup-end-date').isError('End Date'))
                return;
            if ($$('record-popup-reason').isError('Reason'))
                return;
            const data = {
                id: row.employee_not_available_id,
                startDate: $$('record-popup-start-date').getIntValue(),
                endDate: $$('record-popup-end-date').getIntValue(),
                reason: $$('record-popup-reason').getValue()
            };
            Server.call(WS, 'EditRecord', data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
                Utils.popup_close();
            });
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected record?', function () {
            const row = grid.getSelectedRow();
            const data = {
                id: row.employee_not_available_id
            };
            Server.call(WS, 'DeleteRecord', data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });

})();
