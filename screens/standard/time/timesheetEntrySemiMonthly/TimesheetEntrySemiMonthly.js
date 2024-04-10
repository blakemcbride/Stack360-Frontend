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
    const WS = 'StandardTimeTimesheetEntrySemiMonthly';

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }
    const descriptions = [];
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

    function descriptionPreview() {}

    descriptionPreview.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            const timesheetId = params.data.timesheetId;
            const data = {
                timesheetId: timesheetId
            };
            AWS.callSoap(WS, 'getTimesheetDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-description-popup");
                    $$('project-description').setValue(res.description);
                    $$('project-description-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.timeDescription;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    descriptionPreview.prototype.getGui = function() {
        return this.eGui;
    };
    const columnDefs = [
        {headerName: 'S', field: 'state', width: 100  },
        {headerName: 'Begin', field: 'startDateFormatted', type: 'numericColumn', width: 180 },
        {headerName: 'End', field: 'endDateFormatted', type: 'numericColumn', width: 180 },
        {headerName: 'Hours', field: 'totalHoursFormatted', type: 'numericColumn', width: 150 },
        {headerName: 'B', field: 'billable', width: 100 },
        {headerName: 'Company', field: 'companyName', width: 400 },
        {headerName: 'Project ID', field: 'projectName', cellRenderer: 'projectInfo', width: 250 },
        {headerName: 'Project Name', field: 'description', width: 250 },
        {headerName: 'Description Preview', field: 'timeDescription', cellRenderer: 'descriptionPreview', width: 800 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'timesheetId');
    grid.multiSelect();
    grid.addComponent('projectInfo', ProjectInfo);
    grid.addComponent('descriptionPreview', descriptionPreview);
    grid.show();

    grid.setOnSelectionChanged((rows) => {
    $$('delete').enable(rows);
    if (rows.length === 1)
        $$('edit').enable();
    else
        $$('edit').disable();
    });

    const rights = await AWS.callSoap(WS, 'checkRight');

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };

    if (rights.accessLevel === 0) {
        const ctl = $$('worker');
        ctl.clear();
        ctl.singleValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
        getCurrentStatus();
    } else
        AWS.callSoap(WS, 'searchEmployees', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('worker');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].fname, res.item[0].middleName, res.item[0].lname));
                    getNextRejectedDate();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                    ctl.setValue(Framework.userInfo.personId);
                    getNextRejectedDate();
                } else {
                    ctl.forceSelect();
                    ctl.setValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
                    getNextRejectedDate();
                }
                ctl.setSelectFunction(searchEmployee);
            }
        });

    $$('worker').onChange(() => {
        getNextRejectedDate();
    });

    $$('worker').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('worker').setValue(res.employeeid, res.lname + ", " +res.fname);
    });

    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('worker').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lname', width: 80},
                {headerName: 'First Name', field: 'fname', width: 80},
                {headerName: 'Middle Name', field: 'middleName', width: 80},
            ];

            formSearchGrid = new AGGrid('esp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const inParams = {
                firstName: $$('esp-fname-search').getValue(),
                firstNameSearchType: $$('esp-fname-criteria').getValue(),
                lastName: $$('esp-lname-search').getValue(),
                lastNameSearchType: $$('esp-lname-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('esp-count').setValue(`Displaying ${records.length} Employees`);
                    } else {
                        $$('esp-count').setValue(`Displaying 0 Employees`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            })
        };

        $$('esp-reset').onclick(reset);
        $$('esp-search').onclick(search);
        $$('esp-ok').onclick(ok);
        $$('esp-cancel').onclick(cancel);

        search();
    };

    let rejectedDate;
    function getNextRejectedDate() {
        const params = {
            personId: $$('worker').getValue(),
            date: $$('date').getIntValue()
        };
        AWS.callSoap(WS, 'getNextRejectedDate', params).then(res => {
            if (res.wsStatus === "0") {
                rejectedDate = Number(res.date);

                if (Number(res.date) !== 0) {
                    $$('date').setValue(Number(res.date));
                    $$('status').setValue('Timesheet Entries for week of ' + DateUtils.dayOfWeekName(Number(res.date)) + ', ' + res.dateFormatted + ' (Day is Rejected):');
                } else {
                    $$('date').hide();
                    $$('status').setValue('Timesheet Entries for week of ' +  DateUtils.dayOfWeekName(Number(res.startDate)) + ', ' + DateUtils.intToStr4(Number(res.startDate)) + ' (Period is Not Yet Finalized):').setColor('black');
                    $$('previous1').hide();
                    $$('next1').hide();
                    $$('remaining').setValue('Timesheets Currently Final Up To Date:').setColor('black');
                    $$('rejectedDays').hide();
                    $$('finalizedDate').show();
                    $$('mark').hide();
                    $$('add').enable();
                    $$('period').setValue(DateUtils.intToStr4(Number(res.startDate)) + ' to ' + DateUtils.intToStr4(Number(res.endDate)));
                    $$('finalize').show().onclick(() => {
                        const dt = $$('date').getIntValue();
                        const msg = "Timesheets on or before " + DateUtils.dayOfWeekName(dt) + ", " + DateUtils.intToStr4(dt) +
                            " will be finalized and will no longer be changeable. Finalize timesheet?";
                        Utils.yesNo('Confirmation', msg, () => {
                            const data = {
                                personId: $$('worker').getValue(),
                                date: dt
                            };
                            AWS.callSoap(WS, 'finalizeTime', data).then(function (res) {
                                if (res.wsStatus === "0") {
                                    updateGrid();
                                }
                            });
                        });
                    })
                }
                
                updateGrid();
            }
        });
    }

    function updateGrid() {
        $$('edit').disable();
        $$('delete').disable();

        const personId = $$('worker').getValue();
        const date = $$('date').getIntValue();
        
        const data = {
            personId: personId,
            timesheetDate: date
        };
        AWS.callSoap(WS, 'listTimesheetsForPersonOnDate', data).then(function (res) {
            if (res.wsStatus === "0") {
                grid.clear();
                const finalizedDate = Number(res.employeeFinalizedDate);
                $$('billable-hours').setValue(res.totalBillableHours);
                $$('total-hours').setValue(res.totalHours);
                $$('rejectedDays').setValue(Number(res.remainingRejectedDays));
                $$('finalizedDate').setValue(Number(res.employeeFinalizedDate));
                res.timesheetTransmit = Utils.assureArray(res.timesheetTransmit);
                for (let i = 0 ; i < res.timesheetTransmit.length; i++) {
                    res.timesheetTransmit[i].totalHoursFormatted = Utils.format(Number(res.timesheetTransmit[i].totalHours), '', 0, 2);
                }
                grid.addRecords(res.timesheetTransmit);
            }
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

    $$('previous').onclick(() => {
        const data = {
            startDate: $$('date').getIntValue(),
            forward: false
        };
        AWS.callSoap(WS, 'getNextWeek', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('date').setValue(Number(res.endDate));
                $$('status').setValue('Timesheet Entries for week of ' + DateUtils.dayOfWeekName(Number(res.endDate)) + ', ' + DateUtils.intToStr4(Number(res.endDate)) + (rejectedDate === Number(res.endDate) ? ' (Day is Rejected):' : ' (Open Rejected Days Remain):'));
                updateGrid();
            }
        });
    });

    $$('next').onclick(() => {
        const data = {
            startDate: $$('date').getIntValue(),
            forward: true
        };
        AWS.callSoap(WS, 'getNextWeek', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('date').setValue(Number(res.endDate));
                $$('status').setValue('Timesheet Entries for week of ' + DateUtils.dayOfWeekName(Number(res.endDate)) + ', ' + DateUtils.intToStr4(Number(res.endDate)) + (rejectedDate === Number(res.endDate) ? ' (Day is Rejected):' : ' (Open Rejected Days Remain):'));
                updateGrid();
            }
        });
    });

    $$('previous1').onclick(() => {
        const data = {
            startDate: $$('date').getIntValue(),
            personId: $$('worker').getValue()
        };
        AWS.callSoap(WS, 'getPreviousRejectedDate', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('date').setValue(Number(res.date));
                rejectedDate = Number(res.date);
                $$('status').setValue('Timesheet Entries for week of ' + DateUtils.dayOfWeekName(Number(res.date)) + ', ' + res.dateFormatted + ' (Day is Rejected):');
                updateGrid();
            }
        });
    });

    $$('next1').onclick(() => {
        const data = {
            startDate: $$('date').getIntValue(),
            personId: $$('worker').getValue()
        };
        AWS.callSoap(WS, 'getNextRejectedDate', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('date').setValue(Number(res.date));
                rejectedDate = Number(res.date);
                $$('status').setValue('Timesheet Entries for week of ' + DateUtils.dayOfWeekName(Number(res.date)) + ', ' + res.dateFormatted + ' (Day is Rejected):');
                updateGrid();
            }
        });
    });


    $$('date').onChange(() => {
        updateGrid();
        $$('status').setValue('Timesheet Entries for week of ' + DateUtils.dayOfWeekName(Number(res.endDate)) + ', ' + DateUtils.intToStr4(Number(res.endDate)) + (rejectedDate === $$('date').getIntValue() ? ' (Day is Rejected):' : ' (Open Rejected Days Remain):'));
    });


    $$('legend').onclick(function () {
        Utils.popup_open('legend-popup');

        $$('legend-close').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('add').onclick(() => {
        const dt = $$('date').getIntValue();
        $$('tesm-title').setValue('Add Timesheet Entry - ' + DateUtils.dayOfWeekName(dt) + ", " + DateUtils.intToStr4(dt));

        let projectId = null;

        $$('tesm-startDate').clear();
        $$('tesm-endDate').clear();
        $$('tesm-end-time').clear();
        $$('tesm-hours').clear();
        $$('tesm-project-id').clear();
        $$('tesm-summary').clear();
        $$('tesm-company').clear();
        $$('tesm-billable').clear();
        $$('tesm-description').clear();
        const dctl = $$('tesm-descriptions');
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
        AWS.callSoap(WS, 'getQuickList', data).then(function (res) {
            const ctl = $$('tesm-quick-list');
            ctl.clear().add('', '(select)');
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let name = res.item[i].projectName.trim() + ' - ' + res.item[i].description + ' (' + res.item[i].companyName + ')';
                    ctl.add(res.item[i].projectId, name, res.item[i]);
                }
            }
        });

        Utils.popup_open('edit-popup', 'tesm-begin-time');

        $$('tesm-verify').onclick(() => {
            const data = {
                category: null,
                companyId: null,
                personId: null,
                projectName: $$('tesm-project-id').getValue(),
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
                        $$('tesm-summary').clear();
                        $$('tesm-company').clear();
                        $$('tesm-billable').clear();
                        projectId = null;
                    } else {
                        $$('tesm-summary').setValue(res.item.description);
                        $$('tesm-company').setValue(res.item.requestingCompanyName);
                        $$('tesm-billable').setValue(res.item.billable);
                        projectId = res.item.projectId;
                    }
                }
            });
        });

        function stripId(id) {
            return String(Number(Utils.drop(id, 6)));
        }

        $$('tesm-choose').onclick(async () => {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok") {
                $$('tesm-project-id').setValue(stripId(res.projectId));
                $$('tesm-summary').setValue(res.summary);
                $$('tesm-company').setValue(res.client);
                $$('tesm-billable').setValue(res.billable);
                projectId = res.projectId;
            }
        });

        $$('tesm-quick-list').onChange((val, lbl, data) => {
            if (val) {
                $$('tesm-summary').setValue(data.description);
                $$('tesm-company').setValue(data.companyName);
                $$('tesm-billable').setValue(data.billable);
                $$('tesm-project-id').setValue(data.projectName.trim());
                projectId = data.projectId;
            }
        });

        $$('tesm-descriptions').onChange((val, lbl, data) => {
            if (val)
                $$('tesm-description').setValue(lbl);
        });

        $$('tesm-ok').onclick(async () => {

            if ($$('tesm-hours').isError("Hours"))
                return;
            if ($$('tesm-project-id').isError("Project selection"))
                return;
            let data = {
                category: null,
                companyId: null,
                personId: null,
                projectName: $$('tesm-project-id').getValue(),
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
                    $$('tesm-project-id').focus();
                    return;
                } else {
                    projectId = res.item.projectId;
                }
            } else
                return;

            //--------

            let found = false;
            const description = $$('tesm-description').getValue();
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
                endDate: $$('tesm-endDate').getIntValue(),
                workDate: $$('tesm-startDate').getIntValue(),
                beginningTime: $$('tesm-begin-time').getValue() * 100000,
                billable: $$('tesm-billable').getValue(),
                description: description,
                endTime: $$('tesm-end-time').getValue() * 100000,
                projectId: projectId,
                totalHours: $$('tesm-hours').getValue()
            };
            AWS.callSoap(WS, 'addTimeEntry', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('tesm-cancel').onclick(() => {
            Utils.popup_close();
        });

    });

    $$('tesm-begin-time').onChange(() => {
        const bt = $$('tesm-begin-time').getValue();
        const et = $$('tesm-end-time').getValue();
        if (bt === null  ||  et === null || bt > et)
            return;
        const diff = TimeUtils.diff(et, bt);
        $$('tesm-hours').setValue(diff / 60);
    });

    $$('tesm-end-time').onChange(() => {
        let bt = $$('tesm-begin-time').getValue();
        let et = $$('tesm-end-time').getValue();
        if (bt === null  ||  et === null || bt > et)
            return;
        const diff = TimeUtils.diff(et, bt);
        $$('tesm-hours').setValue(diff / 60);
    });

    function canEdit(row) {
        let state = row.state;
        return (state === 'N' || state === 'F'  ||  state === 'C'  ||  state === 'R');
    }

    $$('delete').onclick(() => {
        const rows = grid.getSelectedRows();
        let timesheetIds = [];
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
            AWS.callSoap(WS, 'deleteTimesheet', data).then(function (res) {
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

        $$('tesm-title').setValue('Edit Timesheet Entry - ' + DateUtils.dayOfWeekName(Number(row.workDate)) + ", " + row.workDateFormatted);
        $$('tesm-project-id').setValue(row.projectName.trim());
        $$('tesm-summary').setValue(row.projectDescription);
        $$('tesm-company').setValue(row.companyName);
        $$('tesm-billable').setValue(row.billable);
        $$('tesm-description').setValue(row.timeDescription);
        const dctl = $$('tesm-descriptions');
        dctl.clear();
        if (descriptions.length) {
            dctl.enable().add('', '(select)');
            for (let i = 0; i < descriptions.length; i++)
                dctl.add('val', descriptions[i]);
        } else
            dctl.disable();

        const data = {
            personId: row.personId
        };
        AWS.callSoap(WS, 'getQuickList', data).then(function (res) {
            const ctl = $$('tesm-quick-list');
            ctl.clear().add('', '(select)');
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let name = res.item[i].projectName.trim() + ' - ' + res.item[i].description + ' (' + res.item[i].companyName + ')';
                    ctl.add(res.item[i].projectId, name, res.item[i]);
                }
            }
        });

        const params = {
            timesheetId: row.timesheetId
        };
        AWS.callSoap(WS, 'loadTimeEntry', params).then(function (res) {
            const ctl = $$('tesm-quick-list');
            ctl.clear().add('', '(select)');
            if (res.wsStatus === "0") {
                $$('tesm-begin-time').setValue(res.beginningTime / 100000);
                $$('tesm-end-time').setValue(res.endTime / 100000);
                $$('tesm-hours').setValue(res.totalHours);
                $$('tesm-startDate').setValue(res.workDate);
                $$('tesm-endDate').setValue(res.endDate);
            }
        });

        Utils.popup_open('edit-popup');

        $$('tesm-verify').onclick(() => {
            const data = {
                category: null,
                companyId: null,
                personId: null,
                projectName: $$('tesm-project-id').getValue(),
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
                        $$('tesm-summary').clear();
                        $$('tesm-company').clear();
                        $$('tesm-billable').clear();
                        projectId = null;
                    } else {
                        $$('tesm-summary').setValue(res.item.description);
                        $$('tesm-company').setValue(res.item.requestingCompanyName);
                        $$('tesm-billable').setValue(res.item.billable);
                        projectId = res.item.projectId;
                    }
                }
            });
        });

        $$('tesm-choose').onclick(async () => {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok") {
                $$('tesm-summary').setValue(res.summary);
                $$('tesm-company').setValue(res.client);
                $$('tesm-billable').setValue(res.billable);
                projectId = res.projectId;
            }
        });

        $$('tesm-quick-list').onChange((val, lbl, data) => {
            if (val) {
                $$('tesm-summary').setValue(data.description);
                $$('tesm-company').setValue(data.client);
                $$('tesm-billable').setValue(data.billable);
                $$('tesm-project-id').setValue(data.projectName.trim());
                projectId = data.projectId;
            }
        });

        $$('tesm-descriptions').onChange((val, lbl, data) => {
            if (val)
                $$('tesm-description').setValue(lbl);
        });

        $$('tesm-ok').onclick(async () => {

            if ($$('tesm-hours').isError("Hours"))
                return;
            if ($$('tesm-project-id').isError("Project selection"))
                return;
            let data = {
                category: null,
                companyId: null,
                personId: null,
                projectName: $$('tesm-project-id').getValue(),
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
                    $$('tesm-project-id').focus();
                    return;
                } else {
                    projectId = res.item.projectId;
                }
            } else
                return;

            let found = false;
            const description = $$('tesm-description').getValue();
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
                endDate: $$('tesm-endDate').getIntValue(),
                workDate: $$('tesm-startDate').getIntValue(),
                beginningTime: $$('tesm-begin-time').getValue() * 100000,
                billable: $$('tesm-billable').getValue(),
                description: description,
                endTime: $$('tesm-end-time').getValue() * 100000,
                projectId: projectId,
                totalHours: $$('tesm-hours').getValue(),
                timesheetId: row.timesheetId
            };
            AWS.callSoap(WS, 'saveTimeEntry', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                    Utils.popup_close();
                }
            });

        });

        $$('tesm-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

})();
