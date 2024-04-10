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

'use strict';

(function () {

    const WS = "com.arahant.services.standard.time.trainingTime";

    let trainingTimeGrid;
    let selectedWorker;
    let projectId;
    let mode;
    let trainingId;
    let timesheetId;

    function initGrid() {
        const columnDefs = [
            {headerName: 'Training Date', field: 'trainingDate2', width: 10 },
            {headerName: 'Begin', field: 'begin2', width: 7 },
            {headerName: 'End', field: 'end2', width: 7 },
            {headerName: 'Hours', field: 'hours2', width: 5 },
            {headerName: 'Expires', field: 'expires2', width: 10 },
            {headerName: 'Company', field: 'company', width: 20 },
            {headerName: 'Training', field: 'training', width: 41 }
        ];

        // Initialize grid with the above fields and columns.
        trainingTimeGrid = new AGGrid('training-time-grid', columnDefs, 'trainingId');
        trainingTimeGrid.show();

        trainingTimeGrid.setOnSelectionChanged((rows) => {
            $$('edit').enable(rows);
            $$('delete').enable(rows);
        });

        trainingTimeGrid.setOnRowDoubleClicked(editTimesheet);
    }

    initGrid();

    $$('searchWorker').onclick(async () => {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            selectedWorker = res;
            getTimesheets();

            const name = res.lname + ', ' + res.fname + ' ' + res.mname;
            $$('worker').setValue(name);
            $$('add').enable();
        }
    });

    $$('searchProject').onclick(async () => {
        let data = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (data._status === "ok") {
            if (data.projectId)
                projectId = data ? data.projectId : "";

            if (data.reference)
                $$('project-name').setValue(data ? data.reference.trim() : "");

            if (data.summary)
                $$('summary').setValue(data ? data.summary : "");

            if (data.client)
                $$('company').setValue(data ? data.client : "");

            // Load the trainings for the project.
            getProjectTrainings(data);
        }
    });

    document.getElementById('begin-time').onchange = calculateHours;

    document.getElementById('end-time').onchange = calculateHours;

    $$('add').onclick(addTimesheet);

    $$('edit').onclick(editTimesheet);

    $$('delete').onclick(deleteTimesheet);

    $$('popup-ok').onclick(() => {
        if ($$('training-date').isError('Date'))
            return;
        if ($$('hours').isError('Hours'))
            return;
        if (!projectId) {
            Utils.showMessage('Error', 'A valid project must be selected.');
            return;
        }
        if ($$('category').isError('Training Category'))
            return;

        let trainingDate = $$('training-date').getIntValue();
        let beginTime = $$('begin-time').getValue();
        let endTime = $$('end-time').getValue();
        let hours = $$('hours').getValue();
        let trainingCategoryId = $$('category').getValue();
        let billable = $$('billable-status').getValue();
        let expiration = $$('expiration').getIntValue();

        let employeeId = "";
        if (selectedWorker.employeeid)
            employeeId = selectedWorker.employeeid;

        let methodClass, successMsg;

        if (mode === 'add') {
            methodClass = "NewTrainingTime";
            successMsg = 'Training time added.';
        } else if (mode === 'edit') {
            methodClass = "UpdateTrainingTime";
            successMsg = 'Training time updated.';
        } else {
            Utils.showMessage('Error', "Unknown mode.");
        }

        const data = {
            'training-id': trainingId ? trainingId : "",
            'timesheet-id': timesheetId ? timesheetId : "",
            'employee-id': employeeId,
            'training-date': trainingDate,
            'begin-time': beginTime,
            'end-time': endTime,
            'hours': hours,
            'project-id': projectId ? projectId : "",
            'training-category-id': trainingCategoryId,
            'billable': billable,
            'expiration': expiration
        };

        // Send the data to the web service class.
        Server.call(WS, methodClass, data).then(res => {
            if (res._Success) {
                Utils.showMessage('Success', successMsg);
                Utils.popup_close();
                getTimesheets();
            }
        });
    });

    $$('popup-cancel').onclick(() => {
        Utils.popup_close();
    });


    /**
     * Get timesheets for a specific worker.
     */
    function getTimesheets() {
        if (selectedWorker.employeeid) {
            let data = {
                "worker_id": selectedWorker.employeeid
            };

            Server.call(WS, "GetTrainingTime", data).then(res => {
                if (res._Success && res.workerTrainingTimesheets) {
                    trainingTimeGrid.clear();
                    res.workerTrainingTimesheets = Utils.assureArray(res.workerTrainingTimesheets);
                    for (let i=0 ; i < res.workerTrainingTimesheets.length ; i++) {
                        let r = res.workerTrainingTimesheets[i];
                        r.trainingDate2 = DateUtils.intToStr4(r.trainingDate);
                        r.begin2 = TimeUtils.format(r.begin, true);
                        r.end2 = TimeUtils.format(r.end, true);
                        r.hours2 = Utils.format(r.hours, "", 0, 2);
                        r.expires2 = DateUtils.intToStr4(r.expires);
                    }
                    trainingTimeGrid.addRecords(res.workerTrainingTimesheets);
                }
            });
        }
    }

    /**
     * Add a new timesheet.
     */
    function addTimesheet() {

        $$('popup-header').setValue("Add Training Time");

        // Set pop-up mode.
        mode = 'add';

        $$('training-date').clear();
        $$('begin-time').clear();
        $$('end-time').clear();
        $$('hours').clear();
        $$('project-name').clear();
        $$('summary').clear();
        $$('company').clear();
        $$('category').clear().add(null, "(select)");
        $$('expiration').clear();

        // Enable the controls if disabled.
        enablePopUpControls();

        Utils.popup_open("add-edit-training-time", "training-date");
    }

    /**
     * Edit an existing timesheet.
     */
    function editTimesheet() {
        $$('popup-header').setValue("Edit Training Time");

        // Set pop-up mode.
        mode = 'edit';

        // Get the selected row index.
        let row = trainingTimeGrid.getSelectedRow();
        if (!row) {
            Utils.showMessage('Error', 'No row selected.');  // should never happen
            return;
        }

        $$('training-date').setValue(row.trainingDate);
        $$('begin-time').setValue(row.begin);
        $$('end-time').setValue(row.end);
        $$('hours').setValue(row.hours);
        $$('project-name').setValue(row.projectName.trim());
        $$('summary').setValue(row.summary);
        $$('company').setValue(row.client);
        $$('billable-status').setValue(row.billable);
        $$('expiration').setValue(row.expires);

        trainingId = row.trainingId;

        if (row.timesheetId)
            timesheetId = row.timesheetId;

        // Get get training categories for the project.
        if (row.projectId) {
            projectId = row.projectId;

            let data = {
                'project_id': row.projectId
            };

            getProjectTrainings(data, () => {
                $$('category').setValue(row.trainingCategoryId);
            });
        }

        Utils.popup_open("add-edit-training-time", "popup-ok");

        // If record is not editable disable the controls.
        if (row.state === 'A' || row.state === 'I') {
            $$('training-date').disable();
            $$('begin-time').disable();
            $$('end-time').disable();
            $$('hours').disable();
            $$('searchProject').disable();
            $$('category').disable();

            document.getElementById('rd-yes').disabled = true;
            document.getElementById('rd-no').disabled = true;
            document.getElementById('rd-unknown').disabled = true;

            $$('expiration').disable();
            $$('popup-ok').disable();
        } else {
            enablePopUpControls();
        }
    }

    function deleteTimesheet() {
        // Get the selected row index.
        let row = trainingTimeGrid.getSelectedRow();
        if (!row) {
            Utils.showMessage('Error', 'No row selected.');  // should never happen
            return;
        }


        // Check whether the row is changeable.
        if (row.state === 'A' || row.state === 'I') {
            Utils.showMessage("Error", "This record cannot be changed.");
        } else {
            let trainingId, timesheetId;
            trainingId = row.trainingId;
            timesheetId = row.timesheetId;

            Utils.yesNo('Query', 'Is it okay to delete this record?', () => {
                let data = {
                    'trainingId': trainingId,
                    'timesheetId': timesheetId
                };

                Server.call(WS, "DeleteTrainingTime", data).then(res => {
                    if (res._Success) {
                        Utils.showMessage('Success', 'Training time deleted.');
                        getTimesheets();
                    }
                });
            });
        }
    }

    function getProjectTrainings(inp, afterFn) {
        // Load the training categories for the project.
        const data = {
            project_id: inp.project_id ?  inp.project_id : inp.projectId
        };
        Server.call(WS, "GetProjectTrainings", data).then(res => {
            if (res._Success) {
                let categoryCtl = $$('category');
                categoryCtl.clear();

                categoryCtl.add("", "(select)");

                // Add the categories to the drop down control.
                if (res.trainingCategories) {
                    res.trainingCategories.forEach(category => {
                        categoryCtl.add(category.categoryId, category.categoryName, category);
                    });
                }

                if (afterFn)
                    afterFn();
            }
        });
    }

    /**
     * Set the value of the hours number input.
     */
    function calculateHours() {
        // Clear the text box.
        $$('hours').setValue('');

        let begin = $$('begin-time').getValue();
        let end = $$('end-time').getValue();

        let hours = (end - begin) / 100;

        if (hours > 0)
            $$('hours').setValue(hours);
    }

    function enablePopUpControls() {
        $$('training-date').enable();
        $$('begin-time').enable();
        $$('end-time').enable();
        $$('hours').enable();
        $$('searchProject').enable();
        $$('category').enable();

        document.getElementById('rd-yes').disabled = false;
        document.getElementById('rd-no').disabled = false;
        document.getElementById('rd-unknown').disabled = false;

        $$('expiration').enable();
        $$('popup-ok').enable();
    }

})();
