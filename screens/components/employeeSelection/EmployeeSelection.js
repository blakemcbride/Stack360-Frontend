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

 //       const WS = "com.arahant.services.standard.components.searchWorker";
        const WS = "com.arahant.services.standard.components.employeeSearch";

        let workerGrid;

        if (inData  &&  inData.title)
            $('#cm-se-title').text(inData.title);

        if (inData && inData.allowNullSelection )
            $('#cm-radio-all-selection').show();
        else 
            $('#cm-radio-all-selection').hide();

        $$('cm-se-lname').focus();

        const accept_worker = function() {
            const row = workerGrid.getSelectedRow();
            if (row) {
                let res = {
                    _status: 'ok',
                    employeeid: row.employeeid,
                    fname: row.fname,
                    mname: row.mname,
                    lname: row.lname,
                    title: row.job_title,
                    id: row.ext_ref,
                    email: row.email,
                    homephone: row.home_phone,
                    cellphone: row.cell_phone
                };
                resolve(res);
            } else {
                if ( !$$('cm-all-selection').getValue() ) {
                    Utils.showMessage('Error', 'You must first select an employee.');
                } else {
                    resolve(-1);
                }
            }
        };

        {
            const columnDefs = [
                {headerName: '', field: 'employeeid', hide: true},
                {headerName: 'ID', field: 'ext_ref', width: 10 },
                {headerName: 'Last Name', field: 'lname', width: 20  },
                {headerName: 'First Name', field: 'fname', width: 20 },
                {headerName: 'Middle Name', field: 'mname', width: 15 },
                {headerName: 'Title', field: 'job_title', width: 25 }
            ];
            workerGrid = new AGGrid('cm-se-worker-grid', columnDefs, 'employeeid');

            workerGrid.show();

            workerGrid.setOnSelectionChanged((rows) => {
                $$('cm-se-worker-ok').enable(rows);
            });

            workerGrid.setOnRowDoubleClicked(function () {
                accept_worker();
            });
        }

        function search() {
            const data = {
                lastName: $$('cm-se-lname').getValue(),
                lastNameSearchType: $$('cm-se-last-name-search-type').getValue(),
                firstName: $$('cm-se-first-name').getValue(),
                firstNameSearchType: $$('cm-se-first-name-search-type').getValue(),
                employeeId: $$('cm-se-employee-id').getValue(),
                employeeStatus: $$('cm-se-status-type').getValue(),
                needPhoneNumbers: !!inData?.needPhoneNumbers,
                onlyEmployeesWithLogin: !!inData?.onlyEmployeesWithLogin
            };
            workerGrid.clear();
            Server.call(WS, "EmployeeSearch", data).then(function (res) {
                if (res._Success) {
                    res.employees = Utils.assureArray(res.employees);
                    workerGrid.addRecords(res.employees);
                    if (res.highCap > res.employees.length)
                        $$('cm-se-status').setColor('black').setValue('Displaying ' + res.employees.length + ' employees');
                    else
                        $$('cm-se-status').setColor('red').setValue('Displaying ' + res.employees.length + ' employees (limit)');
                }
            });
        }

        $$('cm-se-worker-search').onclick(search);
        Utils.globalEnterHandler(search);

        $$('cm-se-worker-ok').onclick(accept_worker);

        $$('cm-se-worker-cancel').onclick(function() {
            resolve({ _status: 'cancel'});
        });

        function reset() {
            $$('cm-all-selection').setValue('');
            $$('cm-se-last-name-search-type').setValue('1');
            $$('cm-se-lname').clear();
            $$('cm-se-employee-id').clear();
            $$('cm-se-first-name-search-type').setValue('1');
            $$('cm-se-first-name').clear();
            $$('cm-se-employee-id').clear();
            $$('cm-se-status-type').setValue('active');
        }

        $$('cm-all-selection').onChange(v => {
            if ( v )
                $$('cm-se-worker-ok').enable();
            else
                $$('cm-se-worker-ok').disable();
        });

        $$('cm-se-worker-reset').onclick(reset);
    });
};

