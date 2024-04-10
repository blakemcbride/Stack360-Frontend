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

    const WS = 'com.arahant.services.standard.hr.removeFromRoster';
    
    const columnDefs = [
        {headerName: 'Worker', field: 'worker', width: 200},
        {headerName: 'Project', field: 'project_description', width: 300},
        {headerName: 'Shift', field: 'shift_start', width: 100},
        {headerName: 'Date', field: 'when_removed', valueFormatter:  AGGrid.dateTime, width: 150},
        {headerName: 'Supervisor', field: 'supervisor', width: 200},
        {headerName: 'Summary', field: 'description', width: 800}
    ];
    const grid = new AGGrid('grid', columnDefs, 'rfr_id');
    grid.show();

    Server.call(WS, "GetRecords").then(function (res) {
        if (res._Success) {
            const recs = res.records;
            for (let i = 0; i < recs.length; i++) {
                let rec = recs[i];
                rec.worker = rec.w_lname + ', ' + rec.w_fname;
                rec.supervisor = rec.s_lname + ', ' + rec.s_fname;
            }
            grid.addRecords(recs);
        }
    });

    grid.setOnSelectionChanged((r) => {
        $$('delete').enable(r);
        $$('view').enable(r);
    });

    function view() {
        const rec = grid.getSelectedRow();
        $$('vp-worker').setValue(rec.worker);
        $$('vp-project').setValue(rec.project_description + ' (' + rec.shift_start + ')');
        $$('vp-date').setValue(DateTimeUtils.formatDate(rec.when_removed));
        $$('vp-supervisor').setValue(rec.supervisor);
        $$('vp-summary').setValue(rec.description);
        $$('vp-detail').setValue(rec.comments);
        Utils.popup_open('view-popup');

        $$('vp-ok').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('view').onclick(view);
    grid.setOnRowDoubleClicked(view);

    $$('delete').onclick(() => {
        const rec = grid.getSelectedRow();
        $$('dp-worker').setValue(rec.worker);
        $$('dp-project').setValue(rec.project_description + ' (' + rec.shift_start + ')');
        $$('dp-date').setValue(DateTimeUtils.formatDate(rec.when_removed));
        $$('dp-supervisor').setValue(rec.supervisor);
        $$('dp-summary').setValue(rec.description);
        $$('dp-detail').setValue(rec.comments);
        $$('dp-term-review').setValue(true);
        Utils.popup_open('delete-popup');

        $$('dp-delete').onclick(() => {
            const data = {
                rfrId: rec.rfr_id,
                termReview: $$('dp-term-review').getValue()
            }
            Server.call(WS, "DeleteRecord", data).then(function (res) {
                if (res._Success) {
                    grid.deleteRow(rec.rfr_id);
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

})();

