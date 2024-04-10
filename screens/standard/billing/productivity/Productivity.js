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
    const WS = 'StandardBillingProductivity';

    let grid;
    const columnDefs = [
        {headerName: "Name", field: "name", width: 500},
        {headerName: "Billable Hours", field: "hours2", type: 'numericColumn', width: 300},
        {headerName: "Percentage", field: "percentage2", type: 'numericColumn', width: 200}
    ];
    grid = new AGGrid('viewingGrid', columnDefs);
    grid.show();

    function fillAllGrid() {
        const params = {
            fromDate: $$('fromDate').getIntValue(),
            toDate: $$('toDate').getIntValue()
        }
        AWS.callSoap(WS, "getProductivityData").then(data => {
            if (data.wsStatus === '0') {
                $$('show-all').disable();
                grid.clear();
                $$('viewing').setValue('All');

                data.items = Utils.assureArray(data.items);
                for (let i=0 ; i < data.items.length ; i++) {
                    let item = data.items[i];
                    item.hours2 = Utils.format(item.hours, "C", 0, 2);
                    item.percentage2 = Utils.format(item.percentage, "C", 0, 1);
                }
                grid.addRecords(data.items);
            }
        });
    }

    $$('search').onclick(fillAllGrid);

    grid.setOnRowDoubleClicked(() => {
        const row = grid.getSelectedRow();
        const params = {
            personId: row.personId,
            fromDate: $$('fromDate').getIntValue(),
            toDate: $$('toDate').getIntValue()
        };
        AWS.callSoap(WS, "getDetail", params).then(data => {
            if (data.wsStatus === '0') {
                grid.clear();
                data.items = Utils.assureArray(data.items);
                for (let i=0 ; i < data.items.length ; i++) {
                    let item = data.items[i];
                    item.hours2 = Utils.format(item.hours, "C", 0, 2);
                    item.percentage2 = Utils.format(item.percentage, "C", 0, 1);
                }
                grid.addRecords(data.items);
                $$('show-all').enable();
            }
        });
    });

    $$('show-all').onclick(fillAllGrid);

})();
