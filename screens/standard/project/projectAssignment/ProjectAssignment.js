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
     Copyright © 2020 STACK360 LLC
     All rights reserved.


     Notes

     There are 4 states each dropdown can have (not accounting for the smart chooser option)
         A.  disabled / blank             -  we don't know what the choices are OR there are no choices
         B.  disabled / one selected      -  there is only one choice
         C.  enabled  / pre-selected      -  show current value / can change
         D.  enabled  / (choose)          -  no current value / can set
 */

'use strict';

(async function () {
    const SWS = 'StandardProjectProjectAssignment';
    const WS = 'com.arahant.services.standard.project.projectAssignment';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    const deletedWorkers = [];
    let currentShift = '';

    Framework.askBeforeLeaving = false;

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    const columnDefs = [
        {headerName: '', field: 'personId', hide: true},
        {headerName: 'Name', field: 'name', width: 70  },
        {headerName: 'Manager', field: "manager2", width: 30 },  // Yes/No field
        {headerName: 'Report Hours', field: 'reportHours2', width: 40 },  //  Yes/No field not number of hours
        {headerName: 'Position', field: 'position', width: 50 },
        {headerName: 'Shift', field: 'shiftStart', width: 40 },
        {headerName: 'Start Date', field: 'startDate2', width: 40 },
        {headerName: 'Last Checkin', field: 'checkinDateTime', valueFormatter:  AGGrid.dateTime, width: 50 },
        {headerName: 'Checkin Distance', field: 'checkinDistance', valueFormatter: AGGrid.numericFormat, mask: 'BC', decimalPlaces: 0, width: 40},
 //       {headerName: 'Confirmed', field: 'confirmed2', width: 40 },
 //       {headerName: 'Verified', field: 'verified2', width: 30 },
        {headerName: 'Proj Hours', field: 'projectHours2', width: 40, type: "numericColumn" },
        {headerName: 'All Hours', field: 'allHours2', width: 40, type: "numericColumn" },
        {headerName: 'Total Distance', field: 'milesFromProject', width: 40, type: "numericColumn" }
    ];
    const grid = new AGGrid('assigned-people-grid', columnDefs, 'projectEmployeeJoinId');

    grid.rowStyleFunction(params => {
       if (params.data.milesFromProject <= 50  &&  params.data.milesFromProject >= 0)
           return { background: 'lightgreen' };
       else
           return {background: 'white' };
    });

    grid.show();
    grid.setOnSelectionChanged((rows) => {
        $$('edit-worker').enable(rows);
        $$('edit').enable(rows);
 //       $$('confirmation').enable(rows);
 //       $$('verification').enable(rows);
    });

    let data = {
        projectId: projectId
    };

    const rights = await AWS.callSoap(SWS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('edit-worker').show(rights.accessLevel === '2');
    $$('edit').show(rights.accessLevel === '2');
    $$('assignments').show(rights.accessLevel === '2');
    $$('save').show(rights.accessLevel === '2');
    $$('reset').show(rights.accessLevel === '2');
    $$('category-code').enable(rights.accessLevel === '2');
    $$('type-code').enable(rights.accessLevel === '2');
    $$('sub-type').enable(rights.accessLevel === '2');
    grid.enable(rights.accessLevel === '2');
    $$('required-workers').enable(rights.accessLevel === '2');
    $$('shift').enable(rights.accessLevel === '2');

    // fill the list of shifts
    let res = await Server.call(WS, 'GetShifts', data);
    const shiftCtl = $$('shift');
    shiftCtl.clear().triggerGlobalChange(false);
    if (res._Success) {
        if (res.shifts.length === 1) {
            const shift = res.shifts[0];
            shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
            $$('required-workers').enable(rights.accessLevel === '2');
            $$('assignments').enable(rights.accessLevel === '2');
        } else {
            shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable(rights.accessLevel === '2');
            $$('required-workers').disable();
            $$('assignments').disable();
        }
    }

    async function shiftChange() {
        const projectShiftId = shiftCtl.getValue();

        if (Utils.didSomeControlValueChange()) {
            Utils.showMessage('Error', 'Data has changed.  You should save before changing the shift.');
            shiftCtl.setValue(currentShift);
            return;
        }
        if (projectShiftId) {
            const data = shiftCtl.getData();
            $$('required-workers').setValue(data.required_workers).enable(rights.accessLevel === '2');
            $$('assignments').enable(rights.accessLevel === '2');
        } else {
            const data = shiftCtl.getAllData();
            let rw = 0;
            for (let prop in data) {
                let itm = data[prop];
                rw += itm.required_workers;
            }
            $$('required-workers').setValue(rw).disable();
            $$('assignments').disable();
        }
        reset();  //  fill grid
        updateWorkersNeeded();
        currentShift = projectShiftId;
    }

    shiftCtl.onChange(shiftChange);

    let projectStatusId, routeStopCompanyId, routeStopId, routeStopOrgGroup, routeId;

    function setSomeValueChanged() {
        $$('save').enable(rights.accessLevel === '2');
        $$('reset').enable(rights.accessLevel === '2');
        $$('project-info').setValue(projectName + " - " + projectSummary + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    }

    function updateWorkersNeeded() {
        const n = $$('required-workers').getValue();
        const a = grid.getNumberOfRows();
        $$('assigned-workers').setValue(a);
        $$('workers-needed').setValue(n-a);
    }

    $$('required-workers').onChange(updateWorkersNeeded);

    $$('assignments').onclick(function () {
        const addedWorkers = [];
        let didSearch = false;

        Utils.popup_open("assigned-people-popup");

        Utils.setSomeControlValueChangeFunction(null);

        $$('assigned-people-unassign').disable();
        $$('assigned-people-assign').disable();

        const ucolumnDefs = [
            {headerName: '', field: 'personId', hide: true},
            {headerName: 'Last Name', field: 'lastName' },
            {headerName: 'First Name', field: 'firstName' },
            {headerName: 'Middle', field: 'middleName', width: 120 }
        ];
        const ugrid = new AGGrid('assigned-people-unassigned-grid', ucolumnDefs, 'personId');
        ugrid.multiSelect();
        ugrid.show();

        const acolumnDefs = [
            {headerName: '', field: 'personId', hide: true},
            {headerName: 'Last Name', field: 'lastName' },
            {headerName: 'First Name', field: 'firstName' },
            {headerName: 'Middle', field: 'middleName', width: 120 }
        ];
        const agrid = new AGGrid('assigned-people-assigned-grid', acolumnDefs, 'personId');
        agrid.multiSelect();

        agrid.show();

        const assignedPeople = grid.getDataItems();
        for (let i=0 ; i < assignedPeople.length ; i++)
            agrid.addRecord(assignedPeople[i]);
        $$('assigned-people-assigned-status').setValue(assignedPeople.length + " workers assigned");

        function updateAssignablePersonsList() {
            const data = {
                firstName: $$('assigned-people-fname').getValue(),
                firstNameSearchType: $$('assigned-people-fname-type').getValue(),
                lastName: $$('assigned-people-lname').getValue(),
                lastNameSearchType: $$('assigned-people-lname-type').getValue(),
                orgGroupId: null,
                projectId: projectId,
                excludePersonIds: [],
                companyId: AWS.companyId
            };
            let workers = agrid.getDataItems();
            for (let i=0 ; i < workers.length ; i++)
                data.excludePersonIds.push(workers[i].personId);
            AWS.callSoap(SWS, 'searchAssignablePersonsForProject', data).then(function (res) {
                if (res.wsStatus === "0") {
                    ugrid.clear();
                    res.item = Utils.assureArray(res.item);
                    ugrid.addRecords(res.item);
                    if (res.more === "false")
                        $$('assigned-people-unassigned-status').setColor('black').setValue('Showing ' + res.item.length + ' records');
                    else
                        $$('assigned-people-unassigned-status').setColor('red').setValue('Showing ' + res.item.length + ' records (limit)');
                }
            });
        }

        $$('assigned-people-search').onclick(function () {
            updateAssignablePersonsList();
            didSearch = true;
        });

        $$('assigned-people-reset').onclick(function () {
            didSearch = false;
            ugrid.clear();
            $$('assigned-people-lname').clear();
            $$('assigned-people-fname').clear();
            $$('assigned-people-unassigned-status').clear();
            $$('assigned-people-assign').disable();
        });

        agrid.setOnSelectionChanged($$('assigned-people-unassign').enable);

        ugrid.setOnSelectionChanged($$('assigned-people-assign').enable);

        async function makeAssignment() {
            const rows = ugrid.getSelectedRows();

            // warn if worker is already assigned to an overlapping project
            for (let i=0 ; i < rows.length ; i++) {
                let data = {
                  personId: rows[i].personId,
                  projectId: projectId
                };
                const res = await AWS.callSoap(SWS, 'checkForWorkerCollision', data);
                if (res.wsStatus === "0") {
                    if (res.i9part1Complete !== 'true') {
                        let name = Utils.makeName(rows[i].firstName, rows[i].middleName, rows[i].lastName);
                        let ans = await Utils.yesNo('Confirmation', name + ' has not completed their I9 Part 1.  Continue with assignment?');
                        if (!ans)
                            return;
                    }
                    if (res.hasConflict === 'true') {
                        let name = Utils.makeName(rows[i].firstName, rows[i].middleName, rows[i].lastName);
                        let ans = await Utils.yesNo('Confirmation', name + ' is assigned to another concurrently running project.  Continue with assignment?');
                        if (!ans)
                            return;
                    }
                }
            }

            agrid.addRecords(rows);
            ugrid.deleteSelectedRows();
            for (let i=0 ; i < rows.length ; i++) {
                addedWorkers.push(rows[i]);
                for (let j=deletedWorkers.length-1 ; j >= 0 ; j--) {
                    for (let k = deletedWorkers[j].projectEmployeeJoinId.length - 1; k >= 0; k--)
                        if (deletedWorkers[j].projectEmployeeJoinId[k] === rows[i].projectEmployeeJoinId)
                            deletedWorkers[j].projectEmployeeJoinId.splice(k, 1);
                    if (!deletedWorkers[j].projectEmployeeJoinId.length)
                        deletedWorkers.splice(j, 1);
                }
            }
            $$('assigned-people-assign').disable();
        }

        function getUnassignmentReason() {
            return new Promise(function (resolve, reject) {
                Utils.popup_open('unassignment-reason-popup');

                $$('unassignment-reason-date').setValue(new Date());
                $$('unassignment-reason-time').setValue(new Date());
                $$('unassignment-reason-reason').setValue('');
                $$('unassignment-reason-comments').setValue('');

                $$('unassignment-reason-cancel').onclick(function () {
                    Utils.popup_close();
                    resolve({return: false});
                });

                $$('unassignment-reason-ok').onclick(function () {
                    if ($$('unassignment-reason-date').isError('Date unassigned'))
                        return;
                    if ($$('unassignment-reason-time').isError('Time unassigned'))
                        return;
                    if ($$('unassignment-reason-reason').isError('Reason'))
                        return;
                    Utils.popup_close();
                    resolve({
                        return: true,
                        date: $$('unassignment-reason-date').getIntValue(),
                        time: $$('unassignment-reason-time').getValue(),
                        reason: $$('unassignment-reason-reason').getValue(),
                        comments: $$('unassignment-reason-comments').getValue()
                    });
                });
            });
        }

        async function makeUnassignment() {
            let reason = await getUnassignmentReason();
            if (!reason.return)
                return null;

            let rows = agrid.getSelectedRows();
            agrid.deleteSelectedRows();
            let nd = 0;  // number of deletions
            reason.personIds = [];
            for (let i=0 ; i < rows.length ; i++) {
                reason.personIds.push(rows[i].personId);
                reason.projectEmployeeJoinId = rows[i].projectEmployeeJoinId;
                for (let j=0 ; j < addedWorkers.length ; j++)
                    if (addedWorkers[j].projectEmployeeJoinId === rows[i].projectEmployeeJoinId) {
                        addedWorkers.splice(j, 1);
                        break;
                    }
            }
            deletedWorkers.push(reason);
            $$('assigned-people-unassign').disable();
            if (didSearch)
                updateAssignablePersonsList();
            return reason;
        }

        ugrid.setOnRowDoubleClicked(makeAssignment);
        $$('assigned-people-assign').onclick(makeAssignment);

        agrid.setOnRowDoubleClicked(makeUnassignment);
        $$('assigned-people-unassign').onclick(makeUnassignment);

        $$('assigned-people-ok').onclick(function () {
            if (addedWorkers.length) {
                const startDate = $$('assigned-people-start-date').getIntValue();
                addedWorkers.forEach(w => {
                    w.startDate = startDate;
                    w.startDate2 = DateUtils.intToStr2(startDate);
                    w.name = w.lastName + ', ' + w.firstName + ' ' + (w.middleName ? w.middleName : '');
                    w.reportHours = 'true';
                });
                grid.addRecords(addedWorkers);
                setSomeValueChanged();
                Utils.someControlValueChanged();
            }
            if (deletedWorkers.length) {
                deletedWorkers.forEach(function (rsn) {
                    grid.deleteRow(rsn.projectEmployeeJoinId);
                    setSomeValueChanged();
                    Utils.someControlValueChanged();
                });
            }
            updateWorkersNeeded();
            Utils.popup_close();
            Utils.setSomeControlValueChangeFunction(setSomeValueChanged);
        });

        $$('assigned-people-cancel').onclick(function () {
            Utils.popup_close();
            Utils.setSomeControlValueChangeFunction(setSomeValueChanged);
        });
    });

    function updateProjectStatus() {
        const data = {
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            excludeAlreadyUsed: false,
            projectId: projectId,
            routePathId: null,
            routeStopId: routeStopId,
            statusId: projectStatusId
        };
        AWS.callSoap(SWS, 'searchProjectStatuses', data).then(res => {
            if (res.wsStatus === "0") {
                const ctl = $$('project-status');
                ctl.clear();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].id, res.item[i].code + " - " + res.item[i].description);
                ctl.setValue(projectStatusId);
            }
        });
    }

    async function reset() {
        grid.clear();
        $$('edit-worker').disable();
        $$('edit').disable();
//        $$('confirmation').disable();
//        $$('verification').disable();
        deletedWorkers.length = 0;
        let data = {
            projectId: projectId,
            shiftId: shiftCtl.getValue()
        };
        const res = await AWS.callSoap(SWS, 'loadCurrentStatus', data);
        if (res.wsStatus === "0") {
            projectStatusId = res.projectStatusId;
            routeStopCompanyId = res.routeStopCompanyId;
            routeStopId = res.routeStopId;
            routeStopOrgGroup = res.routeStopOrgGroup;
            res.item = Utils.assureArray(res.item);
            res.item.forEach(i => {
                i.name = Utils.makeName(i.firstName, i.middleName, i.lastName);
                i.startDate2 = DateUtils.intToStr2(i.startDate);
                i.projectHours2 = Utils.format(i.projectHours, "C", 0, 0);
                i.allHours2 = Utils.format(i.allHours, "C", 0, 0);
                i.confirmed2 = i.confirmed === 'true' ? 'Yes' : '';
                i.verified2 = i.verified === 'true' ? 'Yes' : '';
                if (i.manager === "true")
                    i.manager2 = "Yes";
                if (i.reportHours === "false")
                    i.reportHours2 = "No";
                i.originalProjectShiftId = i.projectShiftId;
            });
            grid.addRecords(res.item);
            $$('required-workers').setValue(res.requiredWorkers);
            let fd = Number(res.projectFirstDate);
            let ld = Number(res.projectLastDate);
            $$('project-first-date').setValue(DateUtils.longFormat(res.projectFirstDate));
            $$('project-last-date').setValue(DateUtils.longFormat(res.projectLastDate));
            if (!fd || !ld)
                $$('project-length').clear();
            else {
                const diff = 1 + DateUtils.daysDifference(ld, fd);
                const s = diff + (diff === 1 ? ' day' : ' days');
                $$('project-length').setValue(s);
            }
 //           updateProjectStatus();
            updateWorkersNeeded();
        }

        data = {
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            projectId: projectId
        };
        AWS.callSoap(SWS, 'searchProjectCategories', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('category-code');
                ctl.clear();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].projectCategoryId, res.item[i].code);
                ctl.setValue(res.selectedItem.projectCategoryId);
            }
        });

        data = {
            name: null,
            nameSearchType: 0,
            projectId: projectId
        };

        data = {
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            projectId: projectId
        };
        AWS.callSoap(SWS, 'searchProjectTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('type-code');
                ctl.clear();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].projectTypeId, res.item[i].code);
                ctl.setValue(res.selectedItem.projectTypeId);
            }
        });

        data = {
            projectId: projectId
        };
        AWS.callSoap(SWS, 'searchProjectSubtypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('sub-type');
                ctl.clear();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].projectSubtypeId, res.item[i].code);
                ctl.setValue(res.selectedSubtypeId);
            }
        });

        $$('save').disable();
        $$('reset').disable();
        Utils.clearSomeControlValueChanged(false);
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        Framework.askBeforeLeaving = false;
    }

    $$('reset').onclick(reset);

    reset();

    function saveCurrentStatus(billable, billingRate, estimatedHours) {
        if ($$('category-code').isError('Category'))
            return;
        if ($$('type-code').isError('Type'))
            return;
        if ($$('sub-type').isError('Sub-type'))
            return;
        const data = {
            projectId: projectId,
            shiftId: shiftCtl.getValue(),
            billable: billable,
            billingRate: billingRate,
            clientPriority: 10000,
            companyPriority: 10000,
            orgGroupPriority: 10000,
            estimatedHours: estimatedHours,
            assigned: [],
            primaryParentId: null,
            projectCategoryId: $$('category-code').getValue(),
            projectTypeId: $$('type-code').getValue(),
            projectSubtypeId: $$('sub-type').getValue(),
            unassignedItems: [],
            requiredWorkers: $$('required-workers').getValue(),
            projectStatusId: projectStatusId
        };
        const rows = grid.getDataItems();
        rows.forEach(function(row) {
            let obj = {
                projectEmployeeJoinId: row.projectEmployeeJoinId,
                personId: row.personId,
                shiftId: row.projectEmployeeJoinId ? row.projectShiftId : shiftCtl.getValue(),
                originalShiftId: row.originalProjectShiftId,
                startDate: row.startDate,
                startDateChanged: row.startDateChanged,
                manager: row.manager === 'true',
                reportsHours: row.reportHours === 'true'
            };
            data.assigned.push(obj);
        });
        deletedWorkers.forEach(function (dw) {
            data.unassignedItems.push({
                personId: dw.personIds[0],
                date: dw.date,
                time: dw.time * 100000,
                projectEmployeeJoin: dw.projectEmployeeJoinId,
                reason: dw.reason,
                comment: dw.comments
            });
        });
        AWS.callSoap(SWS, 'saveCurrentStatus', data).then(async function (res) {
            if (res.wsStatus === "0") {
                if (res.needsBillable === 'true') {
                    let res = await getBillable();
                    if (res)
                        saveCurrentStatus(res.billable, res.billingRate, res.estimatedHours);
                    return;
                }
                Utils.clearSomeControlValueChanged(false);
                $$('save').disable();
                $$('reset').disable();
                Utils.showMessage('Information', 'Save completed successfully');
                reset();
            }
        });
    }

    $$('save').onclick(function () {
        saveCurrentStatus(null, 0, 0);
    });

    function getBillable() {
        return new Promise(function (resolve, reject) {
            $$('bs-billable').setValue('U');

            data = {
                projectId: projectId
            };
            AWS.callSoap(SWS, 'loadBilling', data).then(function (res) {
                if (res.wsStatus === "0") {
                    $$('bs-billing-rate').setValue(res.billingRate);
                    $$('bs-default-billing-rate').setValue(res.defaultBillingRateFormatted);
                }
            });

            Utils.popup_open('billable-status-popup');

            $$('bs-billable').onChange(() => {
                const val = $$('bs-billable').getValue();
                if (val === 'Y')
                    $$('bs-billing-rate').enable(rights.accessLevel === '2');
                else
                    $$('bs-billing-rate').clear().disable();
            });

            $$('bs-ok').onclick(async () => {
                const billable = $$('bs-billable').getValue();
                if (billable === 'U') {
                    await Utils.showMessage('Error', 'The Billable status must be set to Yes or No to proceed.');
                } else {
                    let obj = {
                        billable: $$('bs-billable').getValue(),
                        billingRate: $$('bs-billing-rate').getValue(),
                        estimatedHours: $$('bs-estimated-hours').getValue()
                    };
                    Utils.popup_close();
                    resolve(obj);
                }
            });

            $$('bs-cancel').onclick(() => {
                Utils.popup_close();
                resolve(null);
            });

        });
    }

    Utils.setSomeControlValueChangeFunction(setSomeValueChanged);

    function editWorker2() {
        const row = grid.getSelectedRow();
        if (!row) {
            Utils.showMessage('Error', 'You must first select the worker to edit.');
            return;
        }
        Utils.saveData(HR_PERSON_ID, row.personId);
        const name = Utils.makeName(row.firstName, row.middleName, row.lastName);
        Utils.saveData(HR_PERSON_NAME, name);
        Framework.getChild();
    }

    function editWorkerRecord() {
        if (Utils.didSomeControlValueChange())
            Utils.yesNo('Query', "Data on this screen has changed.  If you exit without saving you'll lose those changes. " +
                "Do you wish to continue to go to the worker record and lose your changes?", editWorker2);
        else
            editWorker2();
    }

    function editAssignment() {
        const row = grid.getSelectedRow();
        const name = Utils.makeName(row.firstName, row.middleName, row.lastName);
        $$('ew-worker').setValue(name);
        $$('ew-start-date').setValue(row.startDate);
        $$('ew-manager').setValue(row.manager === 'true');
        $$('ew-reports-hours').setValue(row.reportHours === 'true');

        const eshiftCtl = $$('ew-shift');
        eshiftCtl.clear();
        const shiftData = $$('shift').getAllData();
        for (const shiftId in shiftData) {
            let shiftStart = shiftData[shiftId].shift_start;
            eshiftCtl.add(shiftId, shiftStart);
        }
        eshiftCtl.setValue(row.projectShiftId);
        eshiftCtl.enable(Object.keys(shiftData).length > 1);

        Utils.popup_open('edit-worker-popup', "ew-start-date");

        $$('ew-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('ew-ok').onclick(() => {
            row.startDate = $$('ew-start-date').getIntValue();
            row.startDate2 = DateUtils.intToStr2(row.startDate);
            row.startDateChanged = true;
            row.manager = $$('ew-manager').getValue() ? 'true' : 'false';
            row.reportHours = $$('ew-reports-hours').getValue() ? 'true' : 'false';
            row.manager2 = row.manager === "true" ? "Yes" : "";
            row.reportHours2 = row.reportHours === "false" ? "No" : "";
            row.projectShiftId = eshiftCtl.getValue();
            row.shiftStart = eshiftCtl.getLabel();
            grid.updateSelectedRecord(row);
            Utils.popup_close();
        });
    }

    grid.setOnRowDoubleClicked(editAssignment);

    $$('edit-worker').onclick(editWorkerRecord);

    $$('edit').onclick(editAssignment);

    /*
    $$('confirmation').onclick(() => {
        const row = grid.getSelectedRow();
        const chgflg = Utils.watchControlValueChanges(false);
        if (row.confirmed === 'true') {
            $$('cp-confirmed').setValue(true);
            $$('cp-date').setValue(row.confirmedDate);
            $$('cp-person').setValue(row.confirmedPerson);
        } else {
            $$('cp-confirmed').setValue(false);
            $$('cp-date').clear();
            $$('cp-person').clear();
        }

        Utils.popup_open('confirmation-popup');

        $$('cp-ok').onclick(() => {
            if ((row.confirmed === 'true') !== $$('cp-confirmed').getValue()) {
                const data = {
                    personId: row.personId,
                    projectId: projectId,
                    confirmed: $$('cp-confirmed').getValue()
                };
                Server.call(WS, 'SaveConfirmation', data).then(() => {
                    reset();
                });
            }
            Utils.watchControlValueChanges(chgflg);
            Utils.popup_close();
        });

        $$('cp-cancel').onclick(() => {
            Utils.watchControlValueChanges(chgflg);
            Utils.popup_close();
        });
    });

    $$('verification').onclick(() => {
        const row = grid.getSelectedRow();
        const chgflg = Utils.watchControlValueChanges(false);
        if (row.verified === 'true') {
            $$('vp-verified').setValue(true);
            $$('vp-date').setValue(row.verifiedDate);
            $$('vp-person').setValue(row.verifiedPerson);
        } else {
            $$('vp-verified').setValue(false);
            $$('vp-date').clear();
            $$('vp-person').clear();
        }

        Utils.popup_open('verification-popup');

        $$('vp-ok').onclick(() => {
            if ((row.verified === 'true') !== $$('vp-verified').getValue()) {
                const data = {
                    personId: row.personId,
                    projectId: projectId,
                    verified: $$('vp-verified').getValue()
                };
                Server.call(WS, 'SaveVerification', data).then(() => {
                    reset();
                });
            }
            Utils.watchControlValueChanges(chgflg);
            Utils.popup_close();
        });

        $$('vp-cancel').onclick(() => {
            Utils.watchControlValueChanges(chgflg);
            Utils.popup_close();
        });
    });
     */

})();
