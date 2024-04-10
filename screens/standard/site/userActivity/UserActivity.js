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
    const WS = 'StandardSiteUserActivity';

    let employeeGrid;
 
    const employeeColumnDefs = [
        {headerName: "Last Name", field: "lname", width: 600},
        {headerName: "First Name", field: "fname", width: 600}
    ];
    employeeGrid = new AGGrid('employeeGrid', employeeColumnDefs);
    employeeGrid.show();

    AWS.callSoap(WS, "getSubordinates").then(data => {
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item); 
            employeeGrid.addRecords(data.item);
            employeeGrid.setOnSelectionChanged($$('report').enable);
        }
    });

    $$('include-yourself').onChange(() => {
        if ($$('include-yourself').getValue() || employeeGrid.getSelectedRows().length > 0) {
            $$('report').enable();
        } else {
            $$('report').disable();
        }
    })

    $$('report').onclick(async function () {
        const params = {
            endingDate: $$('to-date').getIntValue(),
            includeUser: $$('include-yourself').getValue(),
            startingDate: $$('from-date').getIntValue()
        }
        AWS.callSoap(WS, "getUserActivity", params).then(data => {
            if (data.wsStatus === '0') {
                console.log(data)
                Utils.showReport(data.reportUrl);
            }
        });
    });
})();
