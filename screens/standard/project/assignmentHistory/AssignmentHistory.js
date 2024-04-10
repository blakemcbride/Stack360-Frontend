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
    const WS = 'com.arahant.services.standard.project.assignmentHistory';

    const columnDefs = [
        {headerName: 'Project', field: 'ProjectId', width: 60  },
        {headerName: 'Description', field: 'ProjectDescription', width: 210 },
        {headerName: 'Worker', field: 'worker', width: 170 },
        {headerName: 'Type', field: 'type', width: 70 },
        {headerName: 'Date', field: 'date', type: 'numericColumn', width: 70 },
        {headerName: 'Time', field: 'time', type: 'numericColumn', width: 60 },
        {headerName: 'Editor', field: 'supervisor', width: 155 }
    ];
    const grid = new AGGrid('grid', columnDefs, '');
    grid.show();

    $$('search').onclick(() => {
        const project = $$('project').getValue();
        const worker = $$('worker').getValue();
        const editor = $$('editor').getValue();
        grid.clear();
        if (!project && !worker && !editor) {
            Utils.showMessage('Error', "You must first select at least one of project, worker, or editor.");
            return;
        }

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
    });

    $$('project').forceSelect();
    $$('worker').forceSelect();
    $$('editor').forceSelect();

    $$('reset').onclick(() => {
        grid.clear();
        $$('project').clear();
        $$('worker').clear();
        $$('editor').clear();
    });

    $$('worker').setSelectFunction(async () => {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            $$('worker').setValue(res.employeeid, res.nameLFM);
            grid.clear();
        }
    });

    $$('editor').setSelectFunction(async () => {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            $$('editor').setValue(res.employeeid, res.nameLFM);
            grid.clear();
        }
    });

    $$('project').setSelectFunction(async () => {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok") {
            $$('project').setValue(res.projectId, res.id + '-' + res.summary);
            grid.clear();
        }
    });

})();
