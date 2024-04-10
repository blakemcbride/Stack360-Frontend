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

    const WS = "com.arahant.services.standard.project.myTasks";

    $$('date').setValue(new Date());

    const columnDefs = [
        {headerName: 'Task', field: 'title', width: 300},
        {headerName: 'Description', field: 'description', width: 500},
        {headerName: 'Date', field: 'task_date', valueFormatter:  AGGrid.date, width: 100},
        {headerName: 'Status', field: 'status2', width: 150},
        {headerName: 'Recurring', field: 'recurring2', width: 100}
    ];
    const grid = new AGGrid('grid', columnDefs, 'project_task_assignment_id');

    grid.show();

    function listTasks() {
        const data = {
            date: $$('date').getIntValue()
        };
        Server.call(WS, "ListTasks", data).then(function (res) {
            grid.clear();
            if (res._Success) {
                for (let i = 0; i < res.tasks.length; i++) {
                    let task = res.tasks[i];
                    switch (task.status) {
                        case 0:
                            task.status2 = "Open";
                            break;
                        case 1:
                            task.status2 = "Complete";
                            break;
                        case 2:
                            task.status2 = "Cancelled";
                            break;
                        case 3:
                            task.status2 = "Incomplete - time";
                            break;
                        case 4:
                            task.status2 = "Incomplete - missing items";
                            break;
                        case 5:
                            task.status2 = "Incomplete - reassigned";
                            break;
                        case 6:
                            task.status2 = "Incomplete - see comments";
                            break;
                    }
                    if (task.recurring === 'Y') {
                        task.recurring2 = "Yes";
                    }
                }
                grid.addRecords(res.tasks);
                if (!res.tasks.length)
                    $$('status').setValue('No tasks found');
                else if (res.tasks.length === 1)
                    $$('status').setValue('1 task found');
                else
                    $$('status').setValue(res.tasks.length + ' tasks found');
            }
        });
    }

    listTasks();
    $$('date').onChange(listTasks);

    function edit() {
        Utils.popup_open('task-detail-popup');
        $$('tdp-title').setValue("Task Edit");

        const task = grid.getSelectedRow();
        $$('tdp-task').setValue(task.title);
        $$('tdp-description').setValue(task.description);
        $$('tdp-comments').setValue(task.comments);
        $$('tdp-status').setValue(task.status+"");
        $$('tdp-date-assigned').setValue(task.task_date);
        $$('tdp-date-completed').setValue(task.completion_date);
        $$('tdp-assigned').setValue(task.number_assigned);
        $$('tdp-recurring').setValue(task.recurring === 'Y');
        $$('tdp-missing-items').setValue(task.missing_items);
        $$('tdp-assignments').onclick(function () {
            displayAssignments(task);
        });

        $$('tdp-ok').onclick(function () {
            if ($$('tdp-task').isError('Task'))
                return;
            task.title = $$('tdp-task').getValue();
            task.status = Number($$('tdp-status').getValue());
            task.description = $$('tdp-description').getValue();
            task.comments = $$('tdp-comments').getValue();
            task.missing_items = $$('tdp-missing-items').getValue();
            task.recurring = $$('tdp-recurring').getValue() ? 'Y' : 'N';
            const data = {
                projectTaskDetailId: task.project_task_detail_id,
                workDate: $$('date').getIntValue(),
                title: task.title,
                status: task.status,
                description: task.description,
                comments: task.comments,
                missingItems: task.missing_items,
                recurring: task.recurring
            };
            Server.call(WS, 'UpdateTask', data).then(function (res) {
                if (res._Success) {
                    Utils.popup_close();
                    listTasks();
                }
            });
        });

        $$('tdp-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    grid.setOnRowDoubleClicked(edit);

    grid.setOnSelectionChanged((row) => {
        $$('edit').enable(row);
    });

    function displayAssignments(task) {
        Utils.popup_open('task-assignments-popup');
        $$('tap-task').setValue(task.title);

        const columnDefs = [
            {headerName: 'Lead', field: 'team_lead2', width: 75  },
            {headerName: 'Assigned', field: 'assigned', width: 90  },
            {headerName: 'Position', field: 'position_name', width: 135  },
            {headerName: 'Worker', field: 'name', width: 300 },
            {headerName: 'Hours *', field: 'total_hours', type: 'numericColumn', valueFormatter:  AGGrid.numericFormat, mask: 'C', decimalPlaces: 0, width: 100 }
        ];
        const grid = new AGGrid('tap-grid', columnDefs, 'person_id');
        grid.show();

        function listTaskWorkers() {
            grid.clear();
            const data = {
                shiftId: task.project_shift_id,
                taskId: task.project_task_detail_id,
                workDate: $$('date').getIntValue()
            };
            Server.call(WS, 'ListTaskWorkers', data).then((res) => {
                if (res._Success) {
                    let numberAssigned = 0;
                    for (let i=0 ; i < res.workers.length ; i++) {
                        const worker = res.workers[i];
                        let name = worker.lname + ", " + worker.fname;
                        if (worker.mname)
                            name += " " + worker.mname;
                        worker.name = name;
                        if (worker.project_task_assignment_id) {
                            worker.assigned = "Yes";
                            numberAssigned++;
                        } else
                            worker.assigned = "";
                        worker.team_lead2 = worker.team_lead === 'Y' ? "Yes" : "";                }
                    grid.addRecords(res.workers);
                    $$('tdp-assigned').setValue(numberAssigned);
                }
            });
        }

        listTaskWorkers();

        $$('tap-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

})();