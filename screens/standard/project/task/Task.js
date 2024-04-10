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
    const WS = 'com.arahant.services.standard.project.task';
    let currentTask = null;

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary);

    const rights = await Server.call(WS, 'CheckRight');
    if (!rights._Success || rights.accessLevel === 0)
        return;
    $$('add').show(rights.accessLevel === 2);
    $$('delete').show(rights.accessLevel === 2);
    $$('rotate-right').show(rights.accessLevel === 2);
    $$('rotate-left').show(rights.accessLevel === 2);
    $$('pic-delete').show(rights.accessLevel === 2);

    $$('tdp-task').enable(rights.accessLevel === 2);
    $$('tdp-description').enable(rights.accessLevel === 2);
    $$('tdp-comments').enable(rights.accessLevel === 2);
    $$('tdp-status').enable(rights.accessLevel === 2);
    $$('tdp-recurring').enable(rights.accessLevel === 2);
    $$('tdp-recurring-schedule').show(rights.accessLevel === 2);
    $$('tdp-missing-items').enable(rights.accessLevel === 2);
    $$('tdp-ok').show(rights.accessLevel === 2);

    $$('tdp-toggle-lead').show(rights.accessLevel === 2);
    $$('tdp-toggle-assignment').show(rights.accessLevel === 2);


    let columnDefs = [
        {headerName: 'Title', field: 'title', width: 300  },
        {headerName: 'Start', field: 'task_date', valueFormatter:  AGGrid.date, width: 100  },
        {headerName: 'Description', field: 'description', width: 300 },
        {headerName: 'Assigned', field: 'number_assigned', width: 80 },
        {headerName: 'Status', field: 'status_text', width: 170 },
        {headerName: 'Date Complete', field: 'completion_date', valueFormatter:  AGGrid.date, width: 150 }
    ];
    const taskGrid = new AGGrid('task-grid', columnDefs, 'project_task_detail_id');
    taskGrid.show();

    columnDefs = [
        {headerName: '#', field: 'picture_number', width: 20, valueFormatter:  AGGrid.numericFormat, mask: 'B', decimalPlaces: 0  },
        {headerName: 'Comment', field: 'comments', width: 300  },
        {headerName: 'Who Uploaded', field: 'who_uploaded', width: 100  },
        {headerName: 'Date', field: 'when_uploaded', valueFormatter:  AGGrid.dateTime, width: 100  }
    ];
    const pictureGrid = new AGGrid('picture-grid', columnDefs, 'project_task_picture_id');
    pictureGrid.show();


    $$('date').setValue(new Date());

    async function getShifts(projectId) {
        // fill the list of shifts
        const data = {
            projectId: projectId
        };
        const res = await Server.call(WS, 'GetShifts', data);
        const shiftCtl = $$('shift');
        shiftCtl.clear().triggerGlobalChange(false);
        if (res._Success) {
            if (res.shifts.length === 1) {
                const shift = res.shifts[0];
                shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
                $$('add').enable(rights.accessLevel === 2);
            } else if (res.shifts.length > 1) {
                shiftCtl.add('', '(select)').addItems(res.shifts, 'project_shift_id', 'shift_start').enable();
                $$('add').disable();
            } else
                $$('add').disable();
        }
    }
    await getShifts(projectId);

    async function listTasks() {
        $$('edit').disable();
        $$('delete').disable();
        taskGrid.clear();
        if (!$$('shift').getValue()) {
            $$('add').disable();
            return;
        }
        let data = {
            projectId: projectId,
            shiftId: $$('shift').getValue(),
            taskDate: $$('date').getIntValue()
        };
        let res = await Server.call(WS, 'ListTasks', data);
        if (res._Success) {
            if (res.tasks.length) {
                for (let i=0 ; i < res.tasks.length ; i++) {
                    let task = res.tasks[i];
                    switch (task.status) {
                        case 0:
                            task.status_text = "Open";
                            break;
                        case 1:
                            task.status_text = "Complete";
                            break;
                        case 2:
                            task.status_text = "Cancelled";
                            break;
                        case 3:
                            task.status_text = "Incomplete - time";
                            break;
                        case 4:
                            task.status_text = "Incomplete - missing items";
                            break;
                        case 5:
                            task.status_text = "Incomplete - reassigned";
                            break;
                        case 6:
                            task.status_text = "Incomplete - see comments";
                            break;
                        default:
                            task.status_text = "Unknown";
                            break;
                    }
                }
                taskGrid.addRecords(res.tasks);
            }
            $$('add').enable(rights.accessLevel === 2);
            if (res.tasks.length === 1)
                $$('status').setValue("Displaying 1 Task");
            else
                $$('status').setValue("Displaying " + res.tasks.length + " Tasks");
        }
    }

    listTasks();

    $$('shift').onChange(listTasks);
    $$('date').onChange(listTasks);

    $$('add').onclick(async function () {
        currentTask = null;
        Utils.popup_open('task-detail-popup', 'tdp-task');
        $$('tdp-title').setValue("Task Add");

        $$('tdp-task').clear();
        $$('tdp-description').clear();
        $$('tdp-comments').clear();
        $$('tdp-status').setValue('0');
        $$('tdp-date-assigned').setValue(new Date());
        $$('tdp-date-completed').clear();
        $$('tdp-assigned').clear();
        $$('tdp-recurring').clear();
        $$('tdp-recurring-schedule').disable();
        $$('tdp-missing-items').clear();
        $$('tdp-assignments').onclick(function () {
            editAssignments(null);
        });

        $$('tdp-recurring').onChange(function (val) {
            $$('tdp-recurring-schedule').enable(val);
        });

        $$('tdp-ok').onclick(function () {
            if ($$('tdp-task').isError('Task'))
                return;
            let data = {
                shiftId: $$('shift').getValue(),
                workDate: $$('date').getIntValue(),
                title: $$('tdp-task').getValue(),
                status: Number($$('tdp-status').getValue()),
                description: $$('tdp-description').getValue(),
                comments: $$('tdp-comments').getValue(),
                missingItems: $$('tdp-missing-items').getValue(),
                recurring: $$('tdp-recurring').getValue() && currentTask && Number(currentTask.type) > 0 ? 'Y' : 'N',
            };
            if (data.recurring === 'Y') {
                data.type = currentTask ? Number(currentTask.type) : 0;
                switch (data.type) {
                    case 1:
                        data.month = currentTask && currentTask.month;
                        data.day = currentTask && currentTask.day;
                        break;
                    case 2:
                        data.day = currentTask && currentTask.day;
                        break;
                    case 3:
                        break;
                    case 4:
                        data.day_of_week = currentTask ? currentTask.day_of_week : 0;
                        data.n = currentTask ? currentTask.n : 1;
                        break;
                    case 5:
                        data.day_of_week = currentTask && currentTask.day_of_week;
                        break;
                    case 6:
                        break;
                    case 7:
                        break;
                    case 8:
                        data.n = currentTask && currentTask.n;
                        break;
                }
            }
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
    });

    $$('tdp-recurring-schedule').onclick(function () {
        Utils.popup_open('recurring-schedule-popup');
        if (!currentTask || !currentTask.type) {
            $$('rsp-recurrence-type').setValue('0');
            $$('rsp-t1-month').setValue('');
            $$('rsp-t1-day').clear();
            $$('rsp-t2-day').clear();
            $$('rsp-t4-week').clear();
            $$('rsp-t4-weekday').setValue('');
            $$('rsp-t5-weekday').setValue('');
            $$('rsp-t8-days').clear();
            $$('rsp-end-date').clear();
        } else {
            $$('rsp-recurrence-type').setValue(currentTask.type + '');
            $$('rsp-t1-month').setValue(currentTask.month + '');
            $$('rsp-t1-day').setValue(currentTask.day);
            $$('rsp-t2-day').setValue(currentTask.day);
            $$('rsp-t4-week').setValue(currentTask.n);
            $$('rsp-t4-weekday').setValue(currentTask.day_of_week + '');
            $$('rsp-t5-weekday').setValue(currentTask.day_of_week + '');
            $$('rsp-t8-days').setValue(currentTask.n);
            $$('rsp-end-date').setValue(currentTask.ending_date);
        }

        function showSelection() {
            for (let i = 1; i <= 8; i++)
                $('#rsp-type-' + i).hide();
            $('#rsp-end-date-div').hide();
            const val = $$('rsp-recurrence-type').getValue();
            if (val !== '0') {
                $('#rsp-type-' + val).show();
                $('#rsp-end-date-div').show();
            }
        }

        showSelection();

        $$('rsp-recurrence-type').onChange(showSelection);

        $$('rsp-ok').onclick(function () {
            switch ($$('rsp-recurrence-type').getValue()) {
                case '0':
                    $$('tdp-recurring').setValue(false);
                    break;
                case '1':
                    if ($$('rsp-t1-month').isError('Month'))
                        return;
                    if ($$('rsp-t1-day').isError('Day'))
                        return;
                    break;
                case '2':
                    if ($$('rsp-t2-day').isError('Day'))
                        return;
                    break;
                case '4':
                    if ($$('rsp-t4-week').isError('Week number'))
                        return;
                    if ($$('rsp-t4-weekday').isError('Weekday'))
                        return;
                    break;
                case '5':
                    if ($$('rsp-t5-weekday').isError('Weekday'))
                        return;
                    break;
                case '8':
                    if ($$('rsp-t8-days').isError('Days in each cycle'))
                        return;
                    break;
            }
            if (!currentTask)
                currentTask = {};
            currentTask.type = 0;  // default
            currentTask.ending_date = $$('rsp-end-date').getIntValue();

            currentTask.type = Number($$('rsp-recurrence-type').getValue());
            switch (currentTask.type) {
                case 1:
                    currentTask.month = Number($$('rsp-t1-month').getValue());
                    currentTask.day = $$('rsp-t1-day').getValue();
                    break;
                case 2:
                    currentTask.day = $$('rsp-t2-day').getValue();
                    break;
                case 3:
                    break;
                case 4:
                    currentTask.day_of_week = Number($$('rsp-t4-weekday').getValue());
                    currentTask.n = $$('rsp-t4-week').getValue();
                    break;
                case 5:
                    currentTask.day_of_week = Number($$('rsp-t5-weekday').getValue());
                    break;
                case 6:
                    break;
                case 7:
                    break;
                case 8:
                    currentTask.n = $$('rsp-t8-days').getValue();
                    break;
            }

            Utils.popup_close();
        });

        $$('rsp-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    function editAssignments(task) {
        if (!task) {
            Utils.showMessage('Status', 'Please complete the task creation before making assignments.');
            return;
        }
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

        grid.setOnSelectionChanged(function (rows) {
            $$('tdp-toggle-lead').enable(rows);
            $$('tdp-toggle-assignment').enable(rows);
        });

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

        $$('tdp-toggle-lead').onclick(function () {
            const row = grid.getSelectedRow();
            const data = {
                taskId: task.project_task_detail_id,
                personId: row.person_id
            };
            Server.call(WS, 'ToggleLead', data).then((res) => {
                if (res._Success) {
                    listTaskWorkers();
                }
            });
        });

        $$('tdp-toggle-assignment').onclick(function () {
            const row = grid.getSelectedRow();
            const data = {
                taskId: task.project_task_detail_id,
                personId: row.person_id
            };
            Server.call(WS, 'ToggleAssignment', data).then((res) => {
                if (res._Success) {
                    listTaskWorkers();
                }
            });
        });

        $$('tap-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    function edit() {
        Utils.popup_open('task-detail-popup');
        $$('tdp-title').setValue("Task Edit");

        const task = taskGrid.getSelectedRow();
        currentTask = task;
        $$('tdp-task').setValue(task.title);
        $$('tdp-description').setValue(task.description);
        $$('tdp-comments').setValue(task.comments);
        $$('tdp-status').setValue(task.status+"");
        $$('tdp-date-assigned').setValue(task.task_date);
        $$('tdp-date-completed').setValue(task.completion_date);
        $$('tdp-assigned').setValue(task.number_assigned);
        $$('tdp-recurring').setValue(task.recurring === 'Y');
        $$('tdp-recurring-schedule').enable(task.recurring === 'Y');
        $$('tdp-missing-items').setValue(task.missing_items);

        $$('tdp-assignments').onclick(function () {
            editAssignments(task);
        });

        $$('tdp-recurring').onChange(function (val) {
            $$('tdp-recurring-schedule').enable(val);
        });

        $$('tdp-ok').onclick(function () {
            if ($$('tdp-task').isError('Task'))
                return;
            if ($$('tdp-recurring').getValue() && !task.type) {
                Utils.showMessage('Error', 'Recurring selected but no schedule defined.');
                return;
            }
            task.title = $$('tdp-task').getValue();
            task.status = Number($$('tdp-status').getValue());
            task.description = $$('tdp-description').getValue();
            task.comments = $$('tdp-comments').getValue();
            task.missing_items = $$('tdp-missing-items').getValue();
            task.recurring = $$('tdp-recurring').getValue() ? 'Y' : 'N';
            const data = {
                shiftId: $$('shift').getValue(),
                projectTaskDetailId: task.project_task_detail_id,
                workDate: $$('date').getIntValue(),
                title: task.title,
                status: task.status,
                description: task.description,
                comments: task.comments,
                missingItems: task.missing_items,
                recurring: task.type > 0 ? task.recurring : 'N',

                type: task.type,
                month: task.month,
                day: task.day,
                day_of_week: task.day_of_week,
                n: task.n,
                ending_date: task.ending_date
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

    taskGrid.setOnRowDoubleClicked(edit);

    function updatePictureList() {
        pictureGrid.clear();
        $$('rotate-left').disable();
        $$('rotate-right').disable();
        $$('pic-get').disable();
        $$('pic-delete').disable();
        const rows = taskGrid.getSelectedRows();
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        if (!rows.length)
            return;
        const task = rows[0];
        Utils.waitMessage("Getting pictures");
        const data = {
            projectTaskDetailId: task.project_task_detail_id
        };
        Server.call(WS, 'ListPictures', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success) {
                for (let i=0 ; i < res.pictures.length ; i++) {
                    let r = res.pictures[i];
                    let name = r.lname ? r.lname : "";
                    if (r.fname)
                        name += ", " + r.fname;
                    if (r.mname)
                        name += " " + r.mname;
                    r.who_uploaded = name;
                }
                pictureGrid.addRecords(res.pictures);
            }
        });
    }

    taskGrid.setOnSelectionChanged(updatePictureList);

    pictureGrid.setOnSelectionChanged((rows) => {
        $$('rotate-left').enable(rows);
        $$('rotate-right').enable(rows);
        $$('pic-get').enable(rows);
        $$('pic-delete').enable(rows);
    });

    function getPicture() {
        const row = pictureGrid.getSelectedRow();
        Utils.waitMessage("Getting picture");
        const data = {
            projectTaskPictureId: row.project_task_picture_id
        };
        Server.call(WS, 'GetPicture', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success) {
                Utils.showReport(res.url);
            }
        });
    }

    $$('pic-get').onclick(getPicture);
    pictureGrid.setOnRowDoubleClicked(getPicture);

    $$('rotate-left').onclick(function () {
        const row = pictureGrid.getSelectedRow();
        Utils.waitMessage("Rotating left");
        const data = {
            projectTaskPictureId: row.project_task_picture_id
        };
        Server.call(WS, 'RotateLeft', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success) {
                Utils.showMessage('Status', 'Picture rotated successfully.');
            }
        });
    });

    $$('rotate-right').onclick(function () {
        const row = pictureGrid.getSelectedRow();
        Utils.waitMessage("Rotating right");
        const data = {
            projectTaskPictureId: row.project_task_picture_id
        };
        Server.call(WS, 'RotateRight', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success) {
                Utils.showMessage('Status', 'Picture rotated successfully.');
            }
        });
    });

    $$('pic-delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected picture?', function () {
            Utils.waitMessage('Picture deletion in progress');
            const data = {
                projectTaskPictureId: pictureGrid.getSelectedRow().project_task_picture_id
            };
            Server.call(WS, 'DeletePicture', data).then(function (res) {
                Utils.waitMessageEnd();
                if (res._Success) {
                    updatePictureList();
                }
            });
        });
    });

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected task?', function () {
            Utils.waitMessage('Task deletion in progress');
            const data = {
                projectTaskDetailId: taskGrid.getSelectedRow().project_task_detail_id
            };
            Server.call(WS, 'DeleteTask', data).then(function (res) {
                Utils.waitMessageEnd();
                if (res._Success) {
                    Utils.popup_close();
                    listTasks();
                }
            });
        });
    });

})();
