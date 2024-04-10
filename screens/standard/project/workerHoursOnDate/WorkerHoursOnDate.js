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

    const WS = 'com.arahant.services.standard.project.workerHoursOnDate';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary);

    const columnDefs = [
        {headerName: 'Worker', field: 'worker', width: 60},
        {headerName: 'Hours Worked', field: 'hours2', type: 'numericColumn', width: 20}
    ];
    const grid = new AGGrid('grid', columnDefs, '');
    grid.show();

    function updateGrid() {
        if (!$$('date').getIntValue())
            return;
        grid.clear();
        const data = {
            projectId: projectId,
            date: $$('date').getIntValue(),
            onlyZero: $$('only-zero').getValue()
        };
        Server.call(WS, "GetWorkerHours", data).then(function (res) {
            if (res._Success) {
                for (let i=0 ; i < res.list.length; i++)
                    res.list[i].hours2 = Utils.format(res.list[i].hours, "C", 0, 2);
                grid.addRecords(res.list);
                $$('assigned-workers').setValue(res.workersWithoutHours + res.workersWithHours);
                $$('workers-with-hours').setValue(res.workersWithHours);
                $$('workers-without-hours').setValue(res.workersWithoutHours);
                $$('total-hours-worked').setValue(res.totalHours);
            }
        });
    }

    $$('date').onChange(updateGrid);
    $$('only-zero').onChange(updateGrid);

})();
