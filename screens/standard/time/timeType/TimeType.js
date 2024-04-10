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

/* global Server, $$, Utils, AGGrid */

'use strict';

(async function () {

    const WS = 'com.arahant.services.standard.time.timeType';

    const columnDefs = [
        {headerName: 'Type', field: 'description', width: 40 },
        {headerName: 'Default Billable', field: 'default_billable', width: 10 },
        {headerName: 'Default Type', field: 'default_type', width: 10 },
        {headerName: 'Last Active Date', field: 'last_active_date', valueFormatter:  AGGrid.date, width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'time_type_id');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        Server.call(WS, "GetTimeTypes").then(function (res) {
            if (res._Success) {
                grid.addRecords(res.timeTypes);
                $$('status').setValue('Displaying ' + res.timeTypes.length + ' Time Types');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Time Type');
        $$('dp-time-type').clear();
        $$('dp-last-active-date').clear();
        $$('dp-default-billable').clear();
        $$('dp-default-type').clear();
      
        Utils.popup_open('detail-popup', 'dp-time-type');

        $$('dp-ok').onclick(() => {
            if ($$('dp-time-type').isError('Time type'))
                return;
            if ($$('dp-default-billable').isError('Billable default'))
                return;
            if ($$('dp-default-type').isError('Default type'))
                return;
            const data = {
                description: $$('dp-time-type').getValue(),
                last_active_date: $$('dp-last-active-date').getIntValue(),
                default_billable: $$('dp-default-billable').getValue(),
                default_type: $$('dp-default-type').getValue()
            };
            Server.call(WS, "NewTimeType", data).then(function (res) {
                if (res._Success) {
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
        $$('dp-title').setValue('Edit Time Type');
        $$('dp-time-type').setValue(row.description);
        $$('dp-last-active-date').setValue(row.last_active_date);
        $$('dp-default-billable').setValue(row.default_billable);
        $$('dp-default-type').setValue(row.default_type);

        Utils.popup_open('detail-popup', 'dp-time-type');

        $$('dp-ok').onclick(() => {
            if ($$('dp-time-type').isError('Time type'))
                return;
            if ($$('dp-default-billable').isError('Billable default'))
                return;
            if ($$('dp-default-type').isError('Default type'))
                return;
            const data = {
                time_type_id: row.time_type_id,
                description: $$('dp-time-type').getValue(),
                last_active_date: $$('dp-last-active-date').getIntValue(),
                default_billable: $$('dp-default-billable').getValue(),
                default_type: $$('dp-default-type').getValue()
            };
            Server.call(WS, "SaveTimeType", data).then(function (res) {
                if (res._Success) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Time Type?', () => {
            const row = grid.getSelectedRow();
            const data = {
                time_type_id: row.time_type_id
            };
            Server.call(WS, "DeleteTimeType", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });


})();
