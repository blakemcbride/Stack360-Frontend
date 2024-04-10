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


/* global AWS, Utils, $$, Server, DateUtils, TimeUtils */

'use strict';

(async function () {
    const WS = 'StandardTimeTimesheetReview';
    let finalizedDate;
    const descriptions = [];
    const shiftCtl = $$('shift');

    shiftCtl.clear();

    function ProjectInfo() {}

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            let projectId = params.data.projectId;
            let data = {
                projectId: projectId
            };
            AWS.callSoap(WS, 'getProjectDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-info-popup");
                    $$('project-info-project-id').setValue(params.data.projectName.trim());
                    $$('project-info-requesting-person').setValue(res.requestingPersonOrCreatedBy);
                    $$('project-info-summary').setValue(params.data.projectDescription);
                    $$('project-info-phase').setValue(res.phaseFormatted);
                    $$('project-info-requesting-company').setValue(params.data.companyName);
                    $$('project-info-status').setValue(res.statusFormatted);
                    $$('project-info-details').setValue(res.detail);
                    $$('project-info-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        let span = document.createElement('span');
        span.style = 'vertical-align: top; float: right;';
        span.innerText = params.data.projectName.trim();
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };

    const columnDefs = [
        {headerName: 'S', field: 'state', width: 10  },
        {headerName: 'Date', field: 'workDateFormatted', type: 'numericColumn', width: 20 },
        {headerName: 'Day', field: 'dayOfWeek', width: 15 },
        {headerName: 'Begin', field: 'beginTimeFormatted', type: 'numericColumn', width: 20 },
        {headerName: 'End', field: 'endTimeFormatted', type: 'numericColumn', width: 20 },
        {headerName: 'Hours', field: 'totalHoursFormatted', type: 'numericColumn', width: 20 },
        {headerName: 'B', field: 'billable', width: 10 },
        {headerName: 'Company', field: 'companyName', width: 40 },
        {headerName: 'Project ID', field: 'projectName', cellRenderer: 'projectInfo', width: 20 },
        {headerName: 'Description Preview', field: 'timeDescription', width: 80 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'timesheetId');
    grid.multiSelect();
    grid.addComponent('projectInfo', ProjectInfo);
    grid.show();

    let data = {
        firstName: null,
        firstNameSearchType: 0,
        hasTimeReadyForApproval: false,
        includeSelected: true,
        lastName: null,
        lastNameSearchType: 0,
        ssn: null
    };
    AWS.callSoap(WS, 'searchEmployees', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.employees = Utils.assureArray(res.employees);
            const ctl = $$('worker');
            ctl.clear();
            if (res.employees.length === 0) {
                ctl.nothingToSelect();
            } else if (res.employees.length === 1) {
                let name = res.employees[0].lname + ", " + res.employees[0].fname + " " + res.employees[0].middleName;
                ctl.singleValue(res.employees[0].personId, name);
            } else if (res.employees.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i=0 ; i < res.employees.length ; i++) {
                    let name = res.employees[i].lname + ", " + res.employees[i].fname + " " + res.employees[i].middleName;
                    ctl.add(res.employees[i].personId, name);
                }
            } else {
                ctl.forceSelect();
            }
        }
    });

    async function updateShifts(projectId, shiftId) {
        shiftCtl.clear();
        if (!projectId)
            return;
        const data = {
            projectId: projectId
        };
        let res = await Server.call('com.arahant.services.standard.project.projectAssignment', 'GetShifts', data);
        if (res._Success) {
            if (res.shifts.length === 1) {
                const shift = res.shifts[0];
                shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
            } else {
                shiftCtl.add('', '(select)').addItems(res.shifts, 'project_shift_id', 'shift_start').enable();
                if (shiftId)
                    shiftCtl.setValue(shiftId);
            }
        }
    }

    async function updateGrid() {
        const employeeId = $$('worker').getValue();
        if (!employeeId)
            return;
        const data = {
            approvedFlag: $$('approved').getValue(),
            begDateRange: 0,
            billableFlag: $$('billable').getValue(),
            employeeId: employeeId,
            endDateRange: 0,
            finalizedFlag: $$('finalized').getValue(),
            nonApprovedFlag: $$('non-approved').getValue(),
            nonBillableFlag: $$('non-billable').getValue(),
            nonFinalizedFlag: $$('non-finalized').getValue()
        };
        AWS.callSoap(WS, 'listTimesheetsForReview', data).then(function (res) {
            grid.clear();
            if (res.wsStatus === "0") {
                res.timesheetTransmit = Utils.assureArray(res.timesheetTransmit);
                for (let i=0 ; i < res.timesheetTransmit.length ; i++)
                    res.timesheetTransmit[i].totalHoursFormatted = Utils.format(Utils.toNumber(res.timesheetTransmit[i].totalHours), "C", 0, 2);
                grid.addRecords(res.timesheetTransmit);
                $$('total-hours').setValue(res.total);
                $$('finalized-date').setValue(res.employeeFinalizedDate).enable();
                $$('dates').enable();
                finalizedDate = Number(res.employeeFinalizedDate);
            }
            $$('reject').disable();
            $$('approve').disable();
            $$('edit').disable();
        });
    }

    $$('worker').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok") {
            let name = res.lname + ", " + res.fname + " " + res.mname;
            $$('worker').setValue(res.employeeid, name);
            updateGrid();
        }
    });
    $$('finalized').onChange(updateGrid);
    $$('non-finalized').onChange(updateGrid);
    $$('billable').onChange(updateGrid);
    $$('non-billable').onChange(updateGrid);
    $$('approved').onChange(updateGrid);
    $$('non-approved').onChange(updateGrid);
    $$('worker').onChange(updateGrid);

    $$('finalized-date').onChange(() => {
        let fromDate;
        if (!finalizedDate)
            fromDate = 'No Date';
        else
            fromDate = DateUtils.intToStr4(finalizedDate);
        let toDate = DateUtils.intToStr4($$('finalized-date').getIntValue());
        Utils.yesNo('Confirmation', "Change employee's finalized timesheet date from " + fromDate + " to " + toDate + "?", function () {
            const data = {
                personId: $$('worker').getValue(),
                date: $$('finalized-date').getIntValue()
            };
            AWS.callSoap(WS, 'finalizeTime', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();  // this updates finalizedDate
                } else {
                    $$('finalized-date').setValue(finalizedDate);
                }
            });
        }, function () {
            $$('finalized-date').setValue(finalizedDate);
        });
    });

    function updateRejectList() {
        const data = {
            personId: $$('worker').getValue()
        };
        AWS.callSoap(WS, 'getRejectedDays', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('dp-list');
                ctl.clear();
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add('', res.item[i].dateFormatted);
            }
        });
    }

    $$('dates').onclick(function () {
        Utils.popup_open('dates-popup');
        updateRejectList();
        $$('dp-close').onclick(function () {
            Utils.popup_close();
            updateGrid();
        });
    });

    $$('dp-add').onclick(() => {
        Utils.popup_open('add-reject-date-popup');

        $$('ard-ok').onclick(() => {
            if ($$('ard-date').isError('Reject date'))
                return;
            if ($$('ard-reason').isError('Reject reason'))
                return;
            const data = {
                personId: $$('worker').getValue(),
                date: $$('ard-date').getIntValue(),
                message: $$('ard-reason').getValue()
            };
            AWS.callSoap(WS, 'rejectDay', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateRejectList();
                }
                Utils.popup_close();
            });
        });

        $$('ard-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('legend').onclick(function () {
        Utils.popup_open('legend-popup');

        $$('legend-close').onclick(function () {
            Utils.popup_close();
        });
    });

    function canApprove(row) {
        let state = row.state;
        return row.finalized === 'Y'  &&  (state === 'N' || state === 'F'  ||  state === 'C');
    }

    function canEdit(row) {
        let state = row.state;
        return (state === 'N' || state === 'F'  ||  state === 'C'  ||  state === 'R' || state === 'P');
    }

    grid.setOnSelectionChanged((rows) => {
        let canApproveFlag = true;
        let canEditFlag = true;

        for (let i=0 ; i < rows.length ; i++) {
            if (!canApproveFlag || !canApprove(rows[i]))
                canApproveFlag = false;
            if (!canEditFlag || !canEdit(rows[i]))
                canEditFlag = false;
            if (!canEditFlag && !canApproveFlag)
                break;
        }
        if (canApproveFlag) {
            $$('approve').enable();
        } else {
            $$('approve').disable();
        }
        if (canEditFlag) {
            $$('edit').enable(rows.length === 1);
            $$('reject').enable();
        } else {
            $$('edit').disable();
            $$('reject').disable();
        }
    });

    $$('reject').onclick(() => {
        const rows = grid.getSelectedRows();

        for (let i=0 ; i < rows.length ; i++) {
            if (rows[i].finalized === 'N') {
                Utils.showMessage('Error', 'Only Finalized Timesheets can be rejected.');
                return;
            }
            /*
            if (!canApprove(rows[i])) {
                Utils.showMessage('Error', 'Only Unapproved Timesheets can be rejected.');
                return;
            }
             */
            $$('rr-title').setValue('Reject ' + rows.length + ' Timesheet Entry');
            Utils.popup_open('reject-reason-popup', 'rr-reason');

            $$('rr-ok').onclick(() => {
                if ($$('rr-reason').isError('Reason'))
                    return;
                const ids = [];
                rows.forEach(r => ids.push(r.timesheetId));
                const data = {
                    message: $$('rr-reason').getValue(),
                    timesheetId: ids
                };
                AWS.callSoap(WS, 'rejectTime', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        Utils.popup_close();
                        updateGrid();
                    }
                });
            });

            $$('rr-cancel').onclick(() => {
                Utils.popup_close();
            });
        }
    });

    $$('approve').onclick(() => {
        const rows = grid.getSelectedRows();

        for (let i=0 ; i < rows.length ; i++) {
            if (rows[i].finalized === 'N') {
                Utils.showMessage('Error', 'Only Finalized Timesheets can be approved.');
                return;
            }
            if (!canApprove(rows[i])) {
                Utils.showMessage('Error', 'Only Unapproved Timesheets can be approved.');
                return;
            }
            Utils.yesNo('Confirmation', 'Are you sure you want to approve the selected ' + rows.length + ' timesheet entries?', () => {
                const ids = [];
                rows.forEach(r => ids.push(r.timesheetId));
                const data = {
                    timesheetIds: ids
                };
                AWS.callSoap(WS, 'approveTimes', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        updateGrid();
                    }
                });
            });
        }
    });

    function edit() {
        const row = grid.getSelectedRow();
        let projectId = row.projectId;

        if (!canEdit(row)) {
            Utils.showMessage('Error', 'Only non-approved Timesheets can be edited.');
            return;
        }

        $$('ep-title').setValue('Edit Timesheet Entry - ' + DateUtils.dayOfWeekName(Number(row.workDate)) + ", " + row.workDateFormatted);
        $$('ep-begin-time').setValue(row.beginningTime / 100000);
        $$('ep-end-time').setValue(row.endTime / 100000);
        $$('ep-hours').setValue(row.totalHours);
        $$('ep-project-id').setValue(row.projectName.trim());
        $$('ep-summary').setValue(row.projectDescription);
        $$('ep-company').setValue(row.companyName);
        $$('ep-billable').setValue(row.billable);
        $$('ep-description').setValue(row.timeDescription);
        const dctl = $$('ep-descriptions');
        dctl.clear();
        if (descriptions.length) {
            dctl.enable().add('', '(select)');
            for (let i = 0; i < descriptions.length; i++)
                dctl.add('val', descriptions[i]);
        } else
            dctl.disable();

        updateShifts(projectId, row.shiftId);

        const data = {
            personId: row.personId
        };
        AWS.callSoap(WS, 'getQuickList', data).then(function (res) {
            const ctl = $$('ep-quick-list');
            ctl.clear().add('', '(select)');
            if (res.wsStatus === "0") {
               res.item = Utils.assureArray(res.item);
               for (let i=0 ; i < res.item.length ; i++) {
                   let name = res.item[i].projectName.trim() + ' - ' + res.item[i].description + ' (' + res.item[i].companyName + ')';
                   ctl.add(res.item[i].projectId, name, res.item[i]);
               }
            }
        });

        Utils.popup_open('edit-popup');

        $$('ep-verify').onclick(() => {
            const data = {
                category: null,
                companyId: null,
                personId: null,
                projectName: $$('ep-project-id').getValue(),
                projectNameSearchType: 5,
                quickList: false,
                status: null,
                summary: null,
                summarySearchType: 0,
                type: null
            };
            AWS.callSoap(WS, 'searchProjects', data).then(function (res) {
                if (res.wsStatus === "0") {
                    if (!res.item) {
                        Utils.showMessage('Error', 'No matching Project IDs were found.');
                        $$('ep-summary').clear();
                        $$('ep-company').clear();
                        $$('ep-billable').clear();
                        projectId = null;
                    } else {
                        $$('ep-summary').setValue(res.item.description);
                        $$('ep-company').setValue(res.item.requestingCompanyName);
                        $$('ep-billable').setValue(res.item.billable);
                        projectId = res.item.projectId;
                    }
                    updateShifts(projectId);
                }
            });
        });

        $$('ep-choose').onclick(async () => {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok") {
                $$('ep-summary').setValue(res.summary);
                $$('ep-company').setValue(res.client);
                $$('ep-billable').setValue(res.billable);
                projectId = res.projectId;
                updateShifts(projectId);
            }
        });

        $$('ep-quick-list').onChange((val, lbl, data) => {
            if (val) {
                $$('ep-summary').setValue(data.description);
                $$('ep-company').setValue(data.client);
                $$('ep-billable').setValue(data.billable);
                $$('ep-project-id').setValue(data.projectName.trim());
                projectId = data.projectId;
            }
        });

        $$('ep-descriptions').onChange((val, lbl, data) => {
            if (val)
                $$('ep-description').setValue(lbl);
        });

        $$('ep-ok').onclick(async () => {
            if ($$('ep-hours').isError("Hours"))
                return;
            if ($$('ep-project-id').isError("Project selection"))
                return;
            if (!shiftCtl.getValue()) {
                Utils.showMessage('Error', 'Please select a valid shift.');
                return;
            }
            let data = {
                category: null,
                companyId: null,
                personId: null,
                projectName: $$('ep-project-id').getValue(),
                projectNameSearchType: 5,
                quickList: false,
                status: null,
                summary: null,
                summarySearchType: 0,
                type: null
            };
            let res = await AWS.callSoap(WS, 'searchProjects', data);
            if (res.wsStatus === "0") {
                if (!res.item) {
                    Utils.showMessage('Error', 'Invalid Project ID.');
                    projectId = null;
                    $$('ep-project-id').focus();
                    return;
                } else {
                    projectId = res.item.projectId;
                }
            } else
                return;

            let found = false;
            const description = $$('ep-description').getValue();
            if (description) {
                for (let i = 0; i < descriptions.length; i++)
                    if (descriptions[i] === description) {
                        found = true;
                        break;
                    }
                if (!found)
                    descriptions.push(description);
            }

            data = {
                beginningTime: $$('ep-begin-time').getValue() * 100000,
                billable: $$('ep-billable').getValue(),
                description: description,
                endTime: $$('ep-end-time').getValue() * 100000,
                projectId: projectId,
                shiftId: shiftCtl.getValue(),
                timesheetId: row.timesheetId,
                totalHours: $$('ep-hours').getValue()
            };
            AWS.callSoap(WS, 'saveTimeEntry', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                    Utils.popup_close();
                }
            });

        });

        $$('ep-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('ep-begin-time').onChange(() => {
        const bt = $$('ep-begin-time').getValue();
        const et = $$('ep-end-time').getValue();
        if (bt === null  ||  et === null || bt > et)
            return;
        const diff = TimeUtils.diff(et, bt);
        $$('ep-hours').setValue(diff / 60);
    });

    $$('ep-end-time').onChange(() => {
        let bt = $$('ep-begin-time').getValue();
        let et = $$('ep-end-time').getValue();
        if (bt === null  ||  et === null || bt > et)
            return;
        const diff = TimeUtils.diff(et, bt);
        $$('ep-hours').setValue(diff / 60);
    });

})();
