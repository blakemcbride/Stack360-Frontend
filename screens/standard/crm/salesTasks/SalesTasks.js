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
    const WS = 'StandardCrmSalesTasks';

    AWS.callSoap(WS, 'listSalesTasks').then(res => {
        if (res.wsStatus === '0') {
            $$('st-task').clear();
            $$('st-task').add("", "(select)");
            res.item = Utils.assureArray(res.item);
            $$('st-task').addItems(res.item, 'id', 'name');
        }
    });

    let salesTasksGrid;

    const salesTasksColumnDefs = [
        {headerName: "Prospect", field: "prospectName", width: 450},
        {headerName: "Task", field: "taskName", width: 450},
        {headerName: "Date Completed", field: "date", type: 'numericColumn', width: 150}
    ];

    salesTasksGrid = new AGGrid('salesTasksGrid', salesTasksColumnDefs);

    salesTasksGrid.show();

    function searchProspectLogsByTask() {
        const params = {
            viewCompleted: $$('st-viewCompleted').getValue(),
            viewIncomplete: $$('st-viewIncomplete').getValue(),
            taskName: $$('st-task').getValue(),
        }
        
        $$('detail').disable();
        $$('view').disable();
        $$('complete').disable();

        AWS.callSoap(WS, 'searchProspectLogsByTask', params).then(data => {
            salesTasksGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                salesTasksGrid.addRecords(data.item);     
                salesTasksGrid.setOnSelectionChanged((x) => {
                    $$('detail').enable(x);
                    $$('view').enable(x);
                    $$('complete').enable(x);
                });
                $$('salesTasks-label').setValue('Displaying ' + data.item.length + ' Sales Tasks');
            }     
        });
    }

    searchProspectLogsByTask();

    $$('st-viewCompleted').onChange(searchProspectLogsByTask);
    $$('st-viewIncomplete').onChange(searchProspectLogsByTask);
    $$('st-task').onChange(searchProspectLogsByTask);
})();
