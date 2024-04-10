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

    const WS = 'com.arahant.services.standard.hr.employeeLabel';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Label', field: 'name', width: 120 },
        {headerName: 'Notes', field: 'notes', width: 400},
        {headerName: 'Who Added', field: 'a_name', width: 230},
        {headerName: 'When Added', field: 'whenAdded', valueFormatter:  AGGrid.dateTime, width: 200},
        {headerName: 'Deleted', field: 'completed', width: 100 },
        {headerName: 'Who Deleted', field: 'd_name', width: 230},
        {headerName: 'When Deleted', field: 'whenDeleted', valueFormatter:  AGGrid.dateTime, width: 200}
    ];
    const grid = new AGGrid('grid', columnDefs, 'employee_label_id');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            personId: personId
        }
        Server.call(WS, "ListEmployeeLabels", data).then(function (res) {
            if (res._Success) {
                const showCompleted = $$('show-completed').getValue();
                for (let i=0 ; i < res.labels.length ; i++) {
                    let row = res.labels[i];
                    if (row.completed === 'N'  ||  showCompleted) {
                        if (row.a_lname) {
                            let name = row.a_lname + ', ' + row.a_fname;
                            if (row.a_mname)
                                name += ' ' + row.a_mname;
                            row.a_name = name;
                        }
                        if (row.d_lname) {
                            let name = row.d_lname + ', ' + row.d_fname;
                            if (row.d_mname)
                                name += ' ' + row.d_mname;
                            row.d_name = name;
                        }
                        row.whenAdded = Utils.take(row.when_added, 10);
                        row.whenDeleted = Utils.take(row.when_completed, 10);
                        grid.addRecord(row);
                    }
                }
                $$('status').setValue('Displaying ' + res.labels.length + ' Employee Labels');
            }
        });
    }

    updateGrid();

    $$('show-completed').onChange(() => {
        updateGrid();
    });

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Employee Label');
        $$('dp-label').clear();
        $$('dp-notes').clear();
        Utils.popup_open('detail-popup', 'dp-label');

        const data = {
            personId: personId
        }
        Server.call(WS, "ListUnusedLabels", data).then(function (res) {
            if (res._Success) {
                $$('dp-label').add('', '(select)').addItems(res.labels, 'employee_label_id', 'name').enable();
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-label').isError('Label'))
                return;

            const data = {
                personId: personId,
                labelId: $$('dp-label').getValue(),
                notes: $$('dp-notes').getValue()
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

        if (row.completed === 'Y') {
            Utils.showMessage('Error', "A deleted label can't be edited but you can add it again.");
            return;
        }

        $$('dp-title').setValue('Edit Employee Label');
        $$('dp-label').clear().add(row.employee_label_id, row.name).disable();
        $$('dp-notes').setValue(row.notes);

        Utils.popup_open('detail-popup', 'dp-label');

        $$('dp-ok').onclick(() => {
            if ($$('dp-label').isError('Label'))
                return;

            const data = {
                labelId: row.employee_label_id,
                personId: personId,
                notes: $$('dp-notes').getValue()
            };
            Server.call(WS, "SaveEmployeeLabel", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                    $$('dp-label').clear();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            $$('dp-label').clear();
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        const row = grid.getSelectedRow();
        if (row.completed === 'Y')
            Utils.showMessage('Error', 'That label has already been removed.');
        else
            Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Employee Label?', () => {
                const data = {
                    labelId: row.employee_label_id,
                    personId: personId
                };
                Server.call(WS, "CompleteEmployeeLabel", data).then(function (res) {
                    if (res._Success) {
                        updateGrid();
                    }
                });
            });
    });

})();
