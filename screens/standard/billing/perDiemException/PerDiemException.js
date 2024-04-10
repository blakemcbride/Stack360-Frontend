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

    const WS = "com.arahant.services.standard.billing.perDiemException";
    let selected_project;
    let mode;
    let editRow;

    const columnDefs = [
        {headerName: 'Worker', field: 'worker_name', width: 30  },
        {headerName: 'Position', field: 'position_name', width: 15  },
        {headerName: 'Type', field: 'exception_type_formatted', width: 10 },
        {headerName: 'Amount', field: 'exception_amount_formatted', type: "numericColumn", width: 10 },
        {headerName: 'Notes', field: 'notes', width: 60 }
    ];

    const detailGrid = new AGGrid('detail-grid', columnDefs, 'person_id');
    detailGrid.show();

    $$('do-search-project').onclick(async function () {
        $$('project').clear();
        detailGrid.clear();
        $$('add').disable();
        $$('edit').disable();
        $$('delete').disable();

        let data = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection', null);
        selected_project = data;
        $$('project').setValue(data ? data.summary : '');
        refresh_exceptions();
        $$('add').enable();
    });

    $$('ep-cancel').onclick(function() {
        Utils.popup_close();
    });

    function refresh_exceptions() {
        $$('edit').disable();
        $$('delete').disable();
        detailGrid.clear();
        let data = {
            project_id: selected_project.projectId
        };
        Server.call(WS, "GetExceptions", data).then(function (res) {
            if (res._Success) {
                detailGrid.addRecords(res.exceptions)
            }
        });
    }

    detailGrid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    detailGrid.setOnRowDoubleClicked(function (event) {
        $$('edit').click();
    });

    $$('do-search-project').onclick(async function () {
        $$('project').clear();
        detailGrid.clear();
        $$('add').disable();
        $$('edit').disable();
        $$('delete').disable();
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection', null);
        if (res._status === "ok") {
            selected_project = res;
            $$('project').setValue(res ? res.summary : '');
            refresh_exceptions();
            $$('add').enable();
        }
    });

    $$('add').onclick(function () {
        mode = 'add';
        $('#ep-title').text('Add Per Diem Exception');

        $$('ep-type').setValue('');
        $$('ep-amount').clear();
        $$('ep-person').clear().enable();
        $$('ep-position').clear();
        $$('ep-notes').clear();

        $$('ep-project').setValue(selected_project.summary);

        const data = { project_id: selected_project.projectId };
        Server.call(WS, "GetWorkers", data).then(function (res) {
            if (res._Success) {
                const ctl = $$('ep-person');
                ctl.add('', '(select)');
                res.workers.forEach( w => {
                    let name = w.lname + ', ' + w.fname;
                    if (w.mname)
                        name += ' ' + w.mname;
                    ctl.add(w.person_id, name, w);
                });
            }
        });

        $$('ep-person').onChange((val, lbl, data) => {
            $$('ep-position').setValue(data ? data.position : '');
        });

        Utils.popup_open('exception-popup');
    });

    $$('edit').onclick(function () {
        mode = 'edit';
        $('#ep-title').text('Edit Per Diem Exception');

        const row = detailGrid.getSelectedRow();
        editRow = row;

        $$('ep-project').setValue(selected_project.summary);
        $$('ep-type').setValue(row.exception_type);
        $$('ep-amount').setValue(row.exception_amount);
        $$('ep-person').clear().add(row.person_id, row.worker_name).disable();
        $$('ep-position').setValue(row.position_name);
        $$('ep-notes').setValue(row.notes);
        Utils.popup_open('exception-popup');
    });

    $$('delete').onclick(function () {
        Utils.yesNo('Query', 'Is it okay to delete this Per Diem Exception?', function () {
            let row = detailGrid.getSelectedRow();

            let data = {
                per_diem_exception_id: row.per_diem_exception_id
            };
            Server.call(WS, "DeleteException", data).then(function (res) {
                if (res._Success) {
                    refresh_exceptions();
                }
            });
        });
    });

    $$('ep-ok').onclick(function () {
        if ($$('ep-person').isError('Worker'))
            return;
        if ($$('ep-type').isError('Exception Type'))
            return;

        let data = {
            person_id: $$('ep-person').getValue(),
            project_id: selected_project.projectId,
            exception_type: $$('ep-type').getValue(),
            amount: $$('ep-amount').getValue(),
            notes: $$('ep-notes').getValue()
        };
        if (mode === 'edit' && editRow.per_diem_exception_id) {
            data.per_diem_exception_id = editRow.per_diem_exception_id;
            Server.call(WS, "UpdateException", data).then(function (res) {
                if (res._Success) {
                    Utils.popup_close();
                    refresh_exceptions();
                }
            });
        } else
            Server.call(WS, "NewException", data).then(function (res) {
                if (res._Success) {
                    Utils.popup_close();
                    refresh_exceptions();
                }
            });
    });

})();



