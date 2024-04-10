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
    const WS = 'com.arahant.services.standard.hr.assignmentHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    const columnDefs = [
        {headerName: 'Project', field: 'ProjectId', width: 50  },
        {headerName: 'Description', field: 'ProjectDescription', width: 210 },
        {headerName: 'Project First Date', field: 'first_date', width: 60 },
        {headerName: 'Project Last Date', field: 'last_date', width: 60 },
        {headerName: 'Active', field: 'active', width: 40 },
        {headerName: 'Type', field: 'type', width: 50 },
        {headerName: 'When Changed', field: 'date', type: 'numericColumn', width: 80 },
        {headerName: 'Assigner', field: 'supervisor', width: 140 }
    ];
    const grid = new AGGrid('grid', columnDefs, '');
    grid.show();

    function search() {
        const project = $$('project').getValue();
        const worker = personId;
        const editor = null;
        grid.clear();

        let data = {
            project_id: project,
            worker: worker,
            editor: editor
        };
        Server.call(WS, "ListAssignmentHistory", data).then(function (res) {
            res.list = Utils.assureArray(res.list);
            if (res._Success) {
                grid.addRecords(res.list);
                if (res.overmax)
                    $$('status').setColor('red').setValue(res.list.length + ' records (limit)');
                else
                    $$('status').setColor('black').setValue(res.list.length + ' records');
            }
        });
    }

    $$('project').forceSelect();

    $$('reset').onclick(() => {
        $$('project').clear();
        search();
    });

    search();

    $$('project').setSelectFunction(async () => {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok") {
            $$('project').setValue(res.projectId, res.id + '-' + res.summary);
            search();
        }
    });

})();
