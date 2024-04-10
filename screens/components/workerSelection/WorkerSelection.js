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


window.popup_startup = function (inData) {
    return new Promise(function (resolve, reject) {

        const WS = "com.arahant.services.standard.components.searchWorker";

        let workerGrid;

        $$('cm-sw-lname-start').focus();

        const accept_worker = function() {
            const row = workerGrid.getSelectedRow();
            if (row) {
                let name = row.lname + ", " + row.fname;
                if (row.mname)
                    name += ' ' + row.mname;
                let res = {
                    _status: 'ok',
                    employeeid: row.employeeid,
                    fname: row.fname,
                    mname: row.mname,
                    lname: row.lname,
                    nameLFM: name,
                    title: row.title,
                    email: row.email,
                    ssn: row.ssn
                };
                resolve(res);
            } else {
                Utils.showMessage('Error', 'You must first select a worker.');
            }
        };

        {
            const columnDefs = [
                {headerName: '', field: 'employeeid', hide: true},
                {headerName: 'Last Name', field: 'lname', width: 20  },
                {headerName: 'First Name', field: 'fname', width: 20 },
                {headerName: 'Middle Name', field: 'mname', width: 15 },
                {headerName: 'SSN', field: 'ssn', width: 20 },
                {headerName: 'Title', field: 'title', width: 25 }
            ];
            workerGrid = new AGGrid('cm-sw-worker-grid', columnDefs, 'employeeid');

            workerGrid.show();

            workerGrid.setOnRowDoubleClicked(function () {
                accept_worker();
            });
        }


        $$('cm-sw-worker-search').onclick(function () {
            const data = {};
            data.beg_lname = $$('cm-sw-lname-start').getValue();
            data.search_type = $$('cm-sw-search-type').getValue();
            workerGrid.clear();
            Utils.waitMessage("Search in progress; please wait.");
            Server.call(WS, "SearchWorkers", data).then(function (res) {
                Utils.waitMessageEnd();
                if (res._Success) {
                    workerGrid.addRecords(res.employees);
                    workerGrid.clearSelection();
                }
            });
        });

        $$('cm-sw-worker-ok').onclick(accept_worker);

        $$('cm-sw-worker-cancel').onclick(function() {
            resolve({ _status: 'cancel'});
        });


    });
};

