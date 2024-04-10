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

    const WS = 'com.arahant.services.standard.project.dailyReportSetup';

    const columnDefs = [
        {headerName: 'Employee', field: 'full_name', width: 600  }
    ];
    const grid = new AGGrid('grid', columnDefs, 'person_id');
    grid.show();

    async function selectFunction () {
        const dat = {
            includeClients: true,
            includeVendors: false,
            includeCompanies: false
        };
        let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection', dat);
        if (res._status === "ok")
            $$('client').setValue(res.id, res.name);
        return res;
    }

    Server.call(WS, 'GetClients').then((res) => {
        if (res._Success) {
            const clientChooser = $$('client');
            clientChooser.setup(res.maxrecs, true);
            clientChooser.setupItems(res.clients, 'org_group_id', 'group_name');
            clientChooser.setupSelectFunction(selectFunction, 'id', 'name');
            clientChooser.onChange((val) => {
                $$('add').enable(val);
                $$('delete').disable();
                updateGrid();
            });
            clientChooser.run();
        }
    });

    $$('add').onclick(async () => {
        const res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok") {
            const dat = {
                clientId: $$('client').getValue(),
                employeeId: res.employeeid
            };
            Server.call(WS, 'AddEmployee', dat).then((res) => {
                if (res._Success) {
                    updateGrid();
                }
            });
        }
    });

    function updateGrid() {
        grid.clear();
        const clientId = $$('client').getValue();
        if (!clientId)
            return;
        const dat = {
            clientId: clientId
        };
        Server.call(WS, 'GetEmployees', dat).then((res) => {
            if (res._Success) {
                for (let i=0 ; i < res.employees.length ; i++) {
                    let emp = res.employees[i];
                    emp.full_name = Utils.makeName(emp.fname, emp.mname, emp.lname);
                }
                grid.addRecords(res.employees);
            }
        });
    }

    grid.setOnSelectionChanged((rows) => {
        $$('delete').enable(rows);
    });

    $$('delete').onclick(() => {
        const row = grid.getSelectedRow();
        Utils.yesNo('Query', 'Is it okay to delete ' + row.full_name + ' from this report?', () => {
            const clientId = $$('client').getValue();
            const employeeId = row.person_id;
            const dat = {
                clientId: clientId,
                employeeId: employeeId
            };
            Server.call(WS, 'DeleteEmployee', dat).then((res) => {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });

})();

