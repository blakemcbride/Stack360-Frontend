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


/* global AWS, $$, Utils, Server, DateUtils, TimeUtils, HR_PERSON_ID, CURRENT_PROJECT_DATE, HR_PERSON_NAME */

'use strict';

(async function () {
    const SWS = 'StandardTimeTimesheetEntry';
    const WS = 'com.arahant.services.standard.time.timesheetEntry';
    const descriptions = [];
    function ProjectInfo() {}
    const shiftCtl = $$('ep-shift');
    const timeTypeCtl = $$('ep-time-type');
    let rejectMode = false;
    
    const FORWARD = 1;
    const BACKWARD = 2;
    let direction = FORWARD;
    
    // in cases where this screen is called as a child screen
    const parentPersonId = Utils.getData(HR_PERSON_ID);
    const parentPersonName = Utils.getData(HR_PERSON_NAME);
    const parentProjectDate = Utils.getData(CURRENT_PROJECT_DATE);

    shiftCtl.clear();
    $$('timesheet-date').clear();

    AWS.callSoap(SWS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            const projectId = params.data.projectId;
            const data = {
                projectId: projectId
            };
            AWS.callSoap(SWS, 'getProjectDetail', data).then(function (res) {
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
        const span = document.createElement('span');
        span.style = 'vertical-align: top; float: right;';
        span.innerText = params.data.projectName.trim();
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };
    const columnDefs = [
        {headerName: 'S', field: 'state', width: 100  },
        {headerName: 'Begin', field: 'beginTimeFormatted', type: 'numericColumn', width: 180 },
        {headerName: 'End', field: 'endTimeFormatted', type: 'numericColumn', width: 180 },
        {headerName: 'Hours', field: 'totalHoursFormatted', type: 'numericColumn', width: 150 },
        {headerName: 'Type', field: 'timeType', width: 200 },
        {headerName: 'B', field: 'billable', width: 100 },
        {headerName: 'Company', field: 'companyName', width: 400 },
        {headerName: 'Project ID', field: 'projectName', cellRenderer: 'projectInfo', width: 250 },
        {headerName: 'Description Preview', field: 'timeDescription', width: 800 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'timesheetId');
    grid.multiSelect();
    grid.addComponent('projectInfo', ProjectInfo);
    grid.show();

    grid.setOnSelectionChanged((rows) => {
       $$('delete').enable();
       if (rows.length === 1)
           $$('edit').enable();
       else
           $$('edit').disable();
    });

    if (parentPersonId && parentPersonName && parentProjectDate)
        $$('timesheet-date').setValue(parentProjectDate);
    else
        $$('timesheet-date').setValue(new Date());

    if (parentPersonId) {
        $$('worker').clear().singleValue(parentPersonId, parentPersonName);
        updateGrid();
    } else {
        const data = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            ssn: null
        };
        AWS.callSoap(SWS, 'searchEmployees', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('worker');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    const name = res.item[0].lname + ", " + res.item[0].fname + " " + res.item[0].middleName;
                    ctl.singleValue(res.item[0].personId, name);
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i=0 ; i < res.item.length ; i++) {
                        const name = res.item[i].lname + ", " + res.item[i].fname + " " + res.item[i].middleName;
                        ctl.add(res.item[i].personId, name);
                    }
                    if (res.selectedItem)
                        ctl.setValue(res.selectedItem.personId);
                } else {
                    ctl.forceSelect();
                    if (res.selectedItem) {
                        const name = res.selectedItem.lname + ", " + res.selectedItem.fname + " " + res.selectedItem.middleName;
                        ctl.setValue(res.selectedItem.personId, name);
                    }
                }
                updateGrid();
            }
        });
    }

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
        
    function updateGrid() {
        $$('edit').disable();
        $$('delete').disable();
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const personId = $$('worker').getValue();
        const date = $$('timesheet-date').getIntValue();
        if (!personId || !date) {
            $$('finalize-date').clear();
            $$('billable-hours').clear();
            $$('total-hours').clear();
            $$('add').disable();
        } else {
            const data = {
                personId: personId,
                timesheetDate: date
            };
            AWS.callSoap(SWS, 'listTimesheetsForPersonOnDate', data).then(async function (res) {
                if (res.wsStatus === "0") {
                    if (res.mode !== "0") {
                        // rejections exist
                        rejectMode = true;
                        $('#normal-section').hide();
                        $('#reject-section').show();
                        $$('mark-day-corrected').show();
                        
                        const data2 = {
                            personId: personId,
                            date: $$('timesheet-date').getIntValue()
                        };
                        const res2 = await AWS.callSoap(SWS, direction === FORWARD ? 'getNextRejectedDate' : 'getPreviousRejectedDate', data2);
                        if (res2.wsStatus === "0") {
                            data.timesheetDate = Number(res2.date);
                            res = await AWS.callSoap(SWS, 'listTimesheetsForPersonOnDate', data);
                            if (res.wsStatus !== "0")
                                return;
                            let date = Number(res2.date);
                            let rejectDays = Number(res.remainingRejectedDays);
                            $$('number-rejected-days').setValue(rejectDays);
                            $$('grid-label').setValue('Timesheet entries for ' + res2.dateFormatted + ' (day is rejected)').setColor('red');
                            $$('timesheet-date').setValue(date);
                        } else {
                            $$('grid-label').clear();
                            $$('number-rejected-days').clear();
                        }
                    } else {
                        rejectMode = false;
                        $('#reject-section').hide();
                        $('#normal-section').show();
                        $$('mark-day-corrected').hide();
                        $$('grid-label').setValue('Timesheet Entries:').setColor('black');
                    }
                    const finalizedDate = Number(res.employeeFinalizedDate);
                    $$('finalize-date').setValue(finalizedDate);
                    $$('billable-hours').setValue(res.totalBillableHours);
                    $$('total-hours').setValue(res.totalHours);
                    res.timesheetTransmit = Utils.assureArray(res.timesheetTransmit);
                    for (let i=0 ; i < res.timesheetTransmit.length ; i++)
                        res.timesheetTransmit[i].totalHoursFormatted = Utils.format(Number(res.timesheetTransmit[i].totalHours), '', 0, 2);
                    grid.addRecords(res.timesheetTransmit);
                    $$('add').enable();
                    if (finalizedDate >= date  &&  !rejectMode) {
                        $$('finalize').disable();
                        $$('add').disable();
                    } else {
                        $$('finalize').enable();
                        $$('add').enable();
                    }
                }
            });
        }
    }

    let timeTypeCache;
    let activeTimeTypeCache;
    
    /*
     * This is made especially complicated because we must handle out-of-date time types.
     */
    async function updateTimeTypes(selected) {
        timeTypeCtl.clear();
        if (!timeTypeCache) {
            const res = await Server.call(WS, 'GetTimeTypes');
            if (res._Success) {
                timeTypeCache = res.timeTypes;
                activeTimeTypeCache = [];
                const today = DateUtils.today();
                for (let i=0 ; i < timeTypeCache.length ; i++) 
                    if (timeTypeCache[i].last_active_date === 0  ||  timeTypeCache[i].last_active_date >= today)
                        activeTimeTypeCache.push(timeTypeCache[i]);
            }
        }
        if (!selected)
            for (let i=0 ; i < activeTimeTypeCache.length ; i++)
                if (activeTimeTypeCache[i].default_type === 'Y') {
                    selected = activeTimeTypeCache[i].time_type_id;
                    break;
                }
        if (!selected)
            timeTypeCtl.add('', '(select)').addItems(activeTimeTypeCache, 'time_type_id', 'description').enable(activeTimeTypeCache.length > 1);
        else {
            timeTypeCtl.addItems(activeTimeTypeCache, 'time_type_id', 'description');
            let nitems = activeTimeTypeCache.length;
            let found = false;
            for (let i=0 ; i < activeTimeTypeCache.length ; i++)
                if (activeTimeTypeCache[i].time_type_id === selected) {
                    found = true;
                    break;
                }
            if (!found)
                for (let i=0 ; i < timeTypeCache.length ; i++)
                    if (timeTypeCache[i].time_type_id === selected) {
                        timeTypeCtl.add(timeTypeCache[i].time_type_id, timeTypeCache[i].description, timeTypeCache[i]);
                        nitems++;
                        break;
                    }
            timeTypeCtl.setValue(selected).enable(nitems > 1);
        }
    }

    $$('worker').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok") {
            let name = res.lname + ", " + res.fname + " " + res.mname;
            $$('worker').setValue(res.employeeid, name);
            updateGrid();
        }
    });
    
    $$('worker').onChange(async () => {
        const personId = $$('worker').getValue();
        if (!personId) {
            updateGrid();
            return;
        }
        updateGrid();
    });

    $$('previous').onclick(() => {
        const ctl = $$('timesheet-date');
        let dt = ctl.getIntValue();
        if (dt) {
            dt = DateUtils.calendar(DateUtils.julian(dt)-1);
            ctl.setValue(dt);
        }
        direction = BACKWARD;
        updateGrid();
    });
    
    function nextDate() {
        const ctl = $$('timesheet-date');
        let dt = ctl.getIntValue();
        if (dt) {
            dt = DateUtils.calendar(DateUtils.julian(dt)+1);
            ctl.setValue(dt);
        }
        direction = FORWARD;
        updateGrid();        
    }

    $$('next').onclick(nextDate);

    $$('timesheet-date').onChange(() => {
       updateGrid();
    });

    $$('finalize').onclick(() => {
        const dt = $$('timesheet-date').getIntValue();
        const msg = "Timesheets on or before " + DateUtils.dayOfWeekName(dt) + ", " + DateUtils.intToStr4(dt) +
            " will be finalized and will no longer be changeable. Finalize timesheet?";
        Utils.yesNo('Confirmation', msg, () => {
            const data = {
                personId: $$('worker').getValue(),
                date: dt
            };
            AWS.callSoap(SWS, 'finalizeTime', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                }
            });
        });
    });

    $$('legend').onclick(function () {
        Utils.popup_open('legend-popup');

        $$('legend-close').onclick(function () {
            Utils.popup_close();
        });
    });
    
    $$('ep-time-type').onChange(() => {
        $$('ep-billable').setValue($$('ep-time-type').getData().default_billable);
    });

    $$('add').onclick(() => {
        updateTimeTypes(null);
        shiftCtl.clear();
        const dt = $$('timesheet-date').getIntValue();
        $$('ep-title').setValue('Add Timesheet Entry - ' + DateUtils.dayOfWeekName(dt) + ", " + DateUtils.intToStr4(dt));

        // estimate the start time
        let startTime = null;
        const rows = grid.getAllRows();
        for (let i=0 ; i < rows.length ; i++) {
            let endTime = rows[i].endTime / 100000;
            if (startTime === null  ||  endTime > startTime)
                startTime = endTime;
        }
        if (startTime !== null)
            $$('ep-begin-time').setValue(startTime);
        else
            $$('ep-begin-time').clear();

        let projectId = null;

        $$('ep-end-time').clear();
        $$('ep-hours').clear();
        $$('ep-project-id').clear();
        $$('ep-summary').clear();
        $$('ep-company').clear();
        const bdata = $$('ep-time-type').getData();
        $$('ep-billable').setValue(bdata ? bdata.default_billable : 'U');
        $$('ep-description').clear();
        const dctl = $$('ep-descriptions');
        dctl.clear();
        if (descriptions.length) {
            dctl.enable().add('', '(select)');
            for (let i = 0; i < descriptions.length; i++)
                dctl.add('val', descriptions[i]);
        } else
            dctl.disable();

        const data = {
            personId: $$('worker').getValue()
        };
        AWS.callSoap(SWS, 'getQuickList', data).then(function (res) {
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

        Utils.popup_open('edit-popup', 'ep-begin-time');

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
            AWS.callSoap(SWS, 'searchProjects', data).then(function (res) {
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

        function stripId(id) {
            return String(Number(Utils.drop(id, 6)));
        }

        $$('ep-choose').onclick(async () => {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok") {
                $$('ep-project-id').setValue(stripId(res.projectId));
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
                $$('ep-company').setValue(data.companyName);
                $$('ep-billable').setValue(data.billable);
                $$('ep-project-id').setValue(data.projectName.trim());
                projectId = data.projectId;
                updateShifts(projectId);
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
            let res = await AWS.callSoap(SWS, 'searchProjects', data);
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

            //--------

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
                personId: $$('worker').getValue(),
                workDate: $$('timesheet-date').getIntValue(),
                beginningTime: $$('ep-begin-time').getValue() * 100000,
                billable: $$('ep-billable').getValue(),
                description: description,
                endTime: $$('ep-end-time').getValue() * 100000,
                projectId: projectId,
                shiftId: shiftCtl.getValue(),
                totalHours: $$('ep-hours').getValue()
            };
            AWS.callSoap(SWS, 'addTimeEntry', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('ep-cancel').onclick(() => {
            Utils.popup_close();
        });

    });

    $$('ep-begin-time').onChange(() => {
        const bt = $$('ep-begin-time').getValue();
        const et = $$('ep-end-time').getValue();
        if (bt === null  ||  et === null || bt > et)
            return;
        const diff = TimeUtils.diff(et, bt);
        $$('ep-hours').setValue(diff / 60);
    });

    $$('ep-end-time').onChange(() => {
        const bt = $$('ep-begin-time').getValue();
        const et = $$('ep-end-time').getValue();
        if (bt === null  ||  et === null || bt > et)
            return;
        const diff = TimeUtils.diff(et, bt);
        $$('ep-hours').setValue(diff / 60);
    });

    function canEdit(row) {
        const state = row.state;
        return (state === 'N' || state === 'F'  ||  state === 'C'  ||  state === 'R');
    }

    $$('delete').onclick(() => {
        const rows = grid.getSelectedRows();
        const timesheetIds = [];
        for (let i=0 ; i < rows.length ; i++) {
            if (!canEdit(rows[i])) {
                Utils.showMessage('Error', 'Approved timesheets cannot be deleted.');
                return;
            }
            timesheetIds.push(rows[i].timesheetId);
        }
        Utils.yesNo('Confirmation', 'Are you sure you with to delete the selected Timesheet Entries?', () => {
            const data = {
                timesheetIds: timesheetIds
            };
            AWS.callSoap(SWS, 'deleteTimesheet', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                }
            });
        });
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
        updateTimeTypes(row.timeTypeId);

        const data = {
            personId: row.personId
        };
        AWS.callSoap(SWS, 'getQuickList', data).then(function (res) {
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
            AWS.callSoap(SWS, 'searchProjects', data).then(function (res) {
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
            const res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
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
            const res = await AWS.callSoap(SWS, 'searchProjects', data);
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
                totalHours: $$('ep-hours').getValue(),
                personId: row.personId,
                workDate: Number(row.workDate),
                timeTypeId: $$('ep-time-type').getValue()
            };
            AWS.callSoap(SWS, 'saveTimeEntry', data).then(function (res) {
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
    
    $$('mark-day-corrected').onclick(() => {
        const data = {
            date: $$('timesheet-date').getIntValue(),
            personId: $$('worker').getValue()
        };
        AWS.callSoap(SWS, 'markRejectionCorrected', data).then(async (res) => {
            if (res.wsStatus === "0") {
                await Utils.showMessage('Status', 'Day has been marked corrected.');
                nextDate();
            }
        });
    });

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

})();
