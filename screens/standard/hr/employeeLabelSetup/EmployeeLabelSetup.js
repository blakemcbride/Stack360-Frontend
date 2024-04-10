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

    const WS = 'com.arahant.services.standard.hr.employeeLabelSetup';

    const columnDefs = [
        {headerName: 'Employee Label', field: 'name', width: 20 },
        {headerName: 'Description', field: 'description', width: 40},
        {headerName: 'Auto-add to new W-2 employees', field: 'auto_add_new_employee', width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'employee_label_id');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        Server.call(WS, "ListEmployeeLabels").then(function (res) {
            if (res._Success) {
                grid.addRecords(res.labels);
                $$('status').setValue('Displaying ' + res.labels.length + ' Employee Labels');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Employee Label');
        $$('dp-label').clear();
        $$('dp-description').clear();
        Utils.popup_open('detail-popup', 'dp-label');

        $$('dp-ok').onclick(() => {
            if ($$('dp-label').isError('Label'))
                return;

            const data = {
                name: $$('dp-label').getValue(),
                description: $$('dp-description').getValue(),
                autoAddNewEmployee: $$('dp-add-new-employee').getValue()
            };
            Server.call(WS, "NewEmployeeLabel", data).then(function (res) {
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

        $$('dp-title').setValue('Edit Employee Label');
        $$('dp-label').setValue(row.name);
        $$('dp-description').setValue(row.description);
        $$('dp-add-new-employee').setValue(row.auto_add_new_employee === 'Y');

        Utils.popup_open('detail-popup', 'dp-label');

        $$('dp-ok').onclick(() => {
            if ($$('dp-label').isError('Label'))
                return;

            const data = {
                employeeLabelId: row.employee_label_id,
                name: $$('dp-label').getValue(),
                description: $$('dp-description').getValue(),
                autoAddNewEmployee: $$('dp-add-new-employee').getValue()
            };
            Server.call(WS, "SaveEmployeeLabel", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Employee Label?', () => {
            const data = {
                employeeLabelId: grid.getSelectedRow().employee_label_id
            };
            Server.call(WS, "DeleteEmployeeLabel", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });

})();
