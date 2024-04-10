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
    const SWS = 'StandardProjectProjectCurrentStatus';
    const WS = 'com.arahant.services.standard.project.projectCurrentStatus';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    let requestingCompanyId, requestingOrgGroupId;
    let deletedWorkers = [];
    let currentShift = '';

    Framework.askBeforeLeaving = false;

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    const columnDefs = [
        {headerName: '', field: 'personId', hide: true},
        {headerName: 'Last Name', field: 'lastName' },
        {headerName: 'First Name', field: 'firstName' },
        {headerName: 'Middle', field: 'middleName', width: 120 }
    ];
    const grid = new AGGrid('assigned-people-grid', columnDefs, 'personId');

    grid.show();

    let data = {
        projectId: projectId
    };
    const rights = await AWS.callSoap(SWS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('company-priority').enable(rights.accessLevel === '2');
    $$('client-priority').enable(rights.accessLevel === '2');
    $$('org-group-priority').enable(rights.accessLevel === '2');
    $$('edit-worker').show(rights.accessLevel === '2');
    $$('assignments').show(rights.accessLevel === '2');
    $$('save').show(rights.accessLevel === '2');
    $$('reset').show(rights.accessLevel === '2');
    grid.enable(rights.accessLevel === '2');
    $$('category-code').enable(rights.accessLevel === '2');
    $$('type-code').enable(rights.accessLevel === '2');
    $$('route').enable(rights.accessLevel === '2');
    $$('company').enable(rights.accessLevel === '2');
    $$('org-group').enable(rights.accessLevel === '2');
    $$('decision-point').enable(rights.accessLevel === '2');
    $$('status-code').enable(rights.accessLevel === '2');
    $$('shift').enable(rights.accessLevel === '2');
    $$('required-workers').enable(rights.accessLevel === '2');


    // fill the list of shifts
    let res = await Server.call(WS, 'GetShifts', data);
    const shiftCtl = $$('shift');
    shiftCtl.clear().triggerGlobalChange(false);
    if (res._Success) {
        if (res.shifts.length === 1) {
            const shift = res.shifts[0];
            shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
            $$('required-workers').enable(rights.accessLevel === '2');
        } else {
            shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable(rights.accessLevel === '2');
            $$('required-workers').disable();
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

    async function searchDecisionPoint(companyId, orgGroupId, routeId, routeStopId) {
        data = {
            companyId: companyId,
            companyName: null,
            companyNameSearchType: 0,
            orgGroupId: orgGroupId,
            orgGroupName: null,
            orgGroupNameSearchType: 0,
            orgGroupType: 0,
            routeId: routeId,
            routeStopId: routeStopId,
            routeStopName: null,
            routeStopNameSearchType: 0,
            searchType: companyId === "ReqCo" || orgGroupId === "ReqOrg" ? 1 : 2
        };
        let res = await AWS.callSoap(SWS, 'searchRouteStops', data);
        if (res.wsStatus === "0") {
            let ctl = $$('decision-point');
            ctl.clear();
            res.item = Utils.assureArray(res.item);
            if (!res.item.length) {
                ctl.disable();
                ctl.add(null, '(nothing to choose)');  // use NULL to mean "nothing to choose"
            } else {
                if (res.item.length === 1)
                    ctl.disable();
                else {
                    ctl.add('', '(choose)');
                    ctl.enable(rights.accessLevel === '2');
                }
                ctl.addItems(res.item, 'routeStopId', 'routeStopNameFormatted');
                if (!routeStopId  &&  res.item.length === 1)
                    ctl.setValue(res.item[0].routeStopId);
                else
                    ctl.setValue(routeStopId);
            }
        }
        return res;
    }

    async function updateStatus(routeStopId, statusId) {
        if (!routeStopId) {
            // no decision point possible
            $$('status-code').clear().disable().add(null, '(nothing to choose)');
            return;
        }
        data = {
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            excludeAlreadyUsed: false,
            projectId: projectId,
            routePathId: null,
            routeStopId: routeStopId,
            statusId: statusId
        };
        let res = await AWS.callSoap(SWS, 'searchProjectStatuses', data);
        if (res.wsStatus === "0") {
            let ctl = $$('status-code');
            ctl.clear();
            res.item = Utils.assureArray(res.item);
            if (!res.item.length) {
                ctl.add('', '(nothing to choose)');
                ctl.disable();
            } else {
                if (res.item.length === 1)
                    ctl.disable();
                else {
                    ctl.add('', '(choose)');
                    ctl.enable(rights.accessLevel === '2');
                }
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].id, res.item[i].code + " - " + res.item[i].description);
            }
            if (!statusId  &&  res.item.length === 1)
                ctl.setValue(res.item[0].id);
            else
                ctl.setValue(statusId);
        }
    }

    function routeChange() {
        data = {
            projectCategoryId: $$('category-code').getValue(),
            projectTypeId: $$('type-code').getValue()
        };
        AWS.callSoap(SWS, 'listPossibleRoutes', data).then(async function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                let ctl = $$('route');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.add('', '(nothing to select)');
                    ctl.disable();
                    $$('company').clear().disable().add('', '(select route first)');
                    $$('org-group').clear().disable().add('', '(select route first)');
                    $$('decision-point').clear().disable().add('', '(select route first)');
                    $$('status-code').clear().disable().add('', '(select route first)');
                } else if (res.item.length === 1) {
                    ctl.add(res.item[0].routeId, res.item[0].routeName);
                    ctl.disable();
                    if ($$('company').getValue())
                        companyChange();
                    else {
                        await searchCompany();
                        $$('org-group').clear().disable().add('', '(select company first)');
                        $$('decision-point').clear().disable().add('', '(select company first)');
                        $$('status-code').clear().disable().add('', '(select company first)');
                    }
                } else {
                    ctl.add('', '(choose)');
                    ctl.addItems(res.item, 'routeId', 'routeName');
                    ctl.enable(rights.accessLevel === '2');
                    $$('company').clear().disable().add('', '(select route first)');
                    $$('org-group').clear().disable().add('', '(select route first)');
                    $$('decision-point').clear().disable().add('', '(select route first)');
                    $$('status-code').clear().disable().add('', '(select route first)');
                }
            }
        });
    }

    /*  allow any route
    $$('type-code').onChange(routeChange);
    $$('category-code').onChange(routeChange);
*/

    $$('route').onChange(async function () {
        let data = {
            routeId: $$('route').getValue()
        };
        let res = await AWS.callSoap(SWS, 'getDefaultsForRoute', data);
        if (res.wsStatus === "0") {
            let res2 = await searchCompany(res.companyId);
            if (res2.wsStatus === "0") {
                let res3 = await searchOrgGroups(res.companyId, res.orgGroupId);
                if (res3.wsStatus === "0") {
                    let res3 = await searchDecisionPoint(res.companyId, res.orgGroupId, $$('route').getValue(), res.routeStopId);
                    if (res3.wsStatus === "0")
                        updateStatus(res.routeStopId, res.projectStatusId)
                }
            }
        }
    });

    async function companyChange() {
        const company = $$('company').getValue();
        if (!company) {
            $$('org-group').clear();
            $$('decision-point').clear();
            $$('status-code').clear();
            return;
        }
        searchOrgGroups(company, '');
        await searchDecisionPoint($$('company').getValue(), $$('org-group').getValue(), $$('route').getValue(), '');
        updateStatus($$('decision-point').getValue(), '');
    }

    $$('company').onChange(companyChange);

    const orgGroupChanged = async function () {
        await searchDecisionPoint($$('company').getValue(), $$('org-group').getValue(), $$('route').getValue(), '');
        updateStatus($$('decision-point').getValue(), '');
    };

    const decisionPointChanged = function () {
        updateStatus($$('decision-point').getValue(), '');
    };

    $$('decision-point').onChange(decisionPointChanged);

    $$('org-group').onChange(orgGroupChanged);

    async function searchOrgGroups(companyId, orgGroupId) {
        data = {
            companyId: companyId,
            name: null,
            nameSearchType: 0,
            orgGroupId: null,
            routeId: null
        };
        let res = await AWS.callSoap(SWS, 'searchOrgGroupsForCompany', data);
        if (res.wsStatus === "0") {
            let ctl = $$('org-group');
            ctl.clear();
            let lbl = $$('company').getLabel();
            ctl.add('', $$('company').getLabel());
            res.item = Utils.assureArray(res.item);
            if (!res.item.length)
                ctl.disable();
            else {
                ctl.enable(rights.accessLevel === '2');
                ctl.addItems(res.item, 'id', 'name');
            }
            ctl.setValue(orgGroupId ? orgGroupId : '');
        }
        return res;
    }

    async function searchCompany(companyId) {
        data = {
            companyId: companyId,
            includeRequesting: true,
            name: null,
            nameSearchType: 0,
            routeId: null
        };
        let res = await AWS.callSoap(SWS, 'searchCompanyByType', data);
        if (res.wsStatus === "0") {
            requestingCompanyId = companyId;
            requestingOrgGroupId = res.selectedItem ? res.selectedItem.orgGroupId : '';
            let ctl = $$('company');
            res.companies = Utils.assureArray(res.companies);
//            if (res.companies.length > res.lowCap) {
            if (false) {
                ctl.forceSelect();
            } else {
                ctl.clear();
                ctl.add('', '(choose)');
                ctl.addItems(res.companies, "orgGroupId", "name");
            }
            ctl.setValue(res.selectedItem ? res.selectedItem.orgGroupId : '');
        }
        return res;
    }

    function setSomeValueChanged() {
        $$('save').enable(rights.accessLevel === '2');
        $$('reset').enable(rights.accessLevel === '2');
        $$('project-info').setValue(projectName + " - " + projectSummary + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    }

    $$('assignments').onclick(function () {
        let addedWorkers = [];
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

        /*
        const data = {
        };
        AWS.callSoap(WS, 'searchAssignablePersonsForProject', data).then(function (res) {
            if (res.wsStatus === "0") {
                grid.clear();
                $$('company-search-message').clear();
                grid.addRecords(res.companies);
                if (res.moreFound === "true") {
                    $$('company-search-message').setValue('Displaying ' + res.companies.length + ' Companies (Limit)');
                    $$('company-search-message').setColor('red');
                } else {
                    $$('company-search-message').setValue('Displaying ' + res.companies.length + ' Companies');
                    $$('company-search-message').setColor('black');
                }
            }
        });

         */

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
                        let name = rows[i].firstName;
                        if (rows[i].middleName)
                            name += ' ' + rows[i].middleName;
                        name += ' ' + rows[i].lastName;
                        let ans = await Utils.yesNo('Confirmation', name + ' has not completed their I9 Part 1.  Continue with assignment?');
                        if (!ans)
                            return;
                    }
                    if (res.hasConflict === 'true') {
                        let name = rows[i].firstName;
                        if (rows[i].middleName)
                            name += ' ' + rows[i].middleName;
                        name += ' ' + rows[i].lastName;
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
                    for (let k = deletedWorkers[j].personIds.length - 1; k >= 0; k--)
                        if (deletedWorkers[j].personIds[k] === rows[i].personId)
                            deletedWorkers[j].personIds.splice(k, 1);
                    if (!deletedWorkers[j].personIds.length)
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
                for (let j=0 ; j < addedWorkers.length ; j++)
                    if (addedWorkers[j].personId === rows[i].personId) {
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
                grid.addRecords(addedWorkers);
                setSomeValueChanged();
                Utils.someControlValueChanged();
            }
            if(deletedWorkers.length) {
                deletedWorkers.forEach(function (rsn) {
                    rsn.personIds.forEach(function (personId) {
                        grid.deleteRow(personId);
                        setSomeValueChanged();
                        Utils.someControlValueChanged();
                    });
                });
            }
            Utils.popup_close();
            Utils.setSomeControlValueChangeFunction(setSomeValueChanged);
        });

        $$('assigned-people-cancel').onclick(function () {
            Utils.popup_close();
            Utils.setSomeControlValueChangeFunction(setSomeValueChanged);
        });
    });

    const selectClientPopup = function (afterfun) {
        Utils.popup_open("company-search-popup");

        const columnDefs = [
            {headerName: '', field: 'orgGroupId', hide: true},
            {headerName: 'Company Name', field: 'name', width: 450 },
            {headerName: 'Type', field: 'orgGroupTypeName'}
        ];
        let grid = new AGGrid('company-search-grid', columnDefs, 'orgGroupId');
        grid.show();
        $$('company-search-message').clear();


        $$('company-search-search').onclick(function() {
            const data = {
                autoDefault: false,
                id: null,
                name: $$('company-search-text').getValue(),
                nameSearchType: parseInt($$('company-search-search-type').getValue()),
                projectId: null
            };
            AWS.callSoap(SWS, 'searchCompanyByType', data).then(function (res) {
                if (res.wsStatus === "0") {
                    grid.clear();
                    res.companies = Utils.assureArray(res.companies);
                    $$('company-search-message').clear();
                    grid.addRecords(res.companies);
                    if (res.moreFound === "true") {
                        $$('company-search-message').setValue('Displaying ' + res.companies.length + ' Companies (Limit)');
                        $$('company-search-message').setColor('red');
                    } else {
                        $$('company-search-message').setValue('Displaying ' + res.companies.length + ' Companies');
                        $$('company-search-message').setColor('black');
                    }
                }
            });
        });

        grid.setOnSelectionChanged($$('company-search-ok').enable);

        $$('company-search-cancel').onclick(function () {
            Utils.popup_close();
        });

        const okfun = function () {
            afterfun(grid.getSelectedRow().orgGroupId, grid.getSelectedRow().name);
            Utils.popup_close();
        };

        $$('company-search-ok').disable().onclick(okfun);
        grid.setOnRowDoubleClicked(okfun);
    };

    $$('company').setSelectFunction(function () {
        selectClientPopup(function (val, lbl) {
            $$('company').setValue(val, lbl);
            companyChange();
        });
    });

    async function reset() {
        grid.clear();
        deletedWorkers = [];
        let data = {
            projectId: projectId,
            shiftId: shiftCtl.getValue()
        };
        let res = await AWS.callSoap(SWS, 'loadCurrentStatus', data);
        if (res.wsStatus === "0") {
            $$('company-priority').setValue(res.companyPriority === "10000" ? "0" : res.companyPriority);
            $$('client-priority').setValue(res.clientPriority === "10000" ? "0" : res.clientPriority);
            $$('org-group-priority').setValue(res.orgGroupPriority === "10000" ? "0" : res.orgGroupPriority);
            projectStatusId = res.projectStatusId;
            routeStopCompanyId = res.routeStopCompanyId;
            routeStopId = res.routeStopId;
            routeStopOrgGroup = res.routeStopOrgGroup;
            res.item = Utils.assureArray(res.item);
            grid.clear();
            grid.addRecords(res.item);
            $$('grid-status').setValue(Utils.assureArray(res.item).length + ' workers assigned');
            $$('required-workers').setValue(res.requiredWorkers);
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
                let ctl = $$('category-code');
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
        res = await AWS.callSoap(SWS, 'searchForRoute', data);
        if (res.wsStatus === "0") {
            let ctl = $$('route');
            ctl.clear();
            res.item = Utils.assureArray(res.item);
            for (let i=0 ; i < res.item.length ; i++)
                ctl.add(res.item[i].routeId, res.item[i].routeName);
            ctl.setValue(res.selectedItem.routeId);
            routeId = res.selectedItem.routeId;
            if (res.item.length < 2)
                ctl.disable();
            else
                ctl.enable(rights.accessLevel === '2');
        }

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

        await searchCompany(routeStopCompanyId);
        await searchOrgGroups(routeStopCompanyId, routeStopOrgGroup);
        await searchDecisionPoint(routeStopCompanyId, routeStopOrgGroup, routeId, routeStopId);
        updateStatus(routeStopId, projectStatusId);
        $$('save').disable();
        $$('reset').disable();
        Utils.clearSomeControlValueChanged(false);
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        Framework.askBeforeLeaving = false;
    }

    $$('reset').onclick(reset);

    reset();

    function saveCurrentStatus(billable, billingRate, estimatedHours) {
        if ($$('category-code').isError('Category Code'))
            return;
        if ($$('type-code').isError('Type Code'))
            return;
        if ($$('route').isError('Route'))
            return;
        if ($$('company').isError('Company'))
            return;
        if ($$('decision-point').isError('Decision Point (Phase)'))
            return;
        if ($$('status-code').isError('Status Code'))
            return;
        const data = {
            projectId: projectId,
            shiftId: shiftCtl.getValue(),
            billable: billable,
            billingRate: billingRate,
            clientPriority: $$('client-priority').getValue() ? $$('client-priority').getValue() : 10000,
            companyPriority: $$('company-priority').getValue() ? $$('company-priority').getValue() : 10000,
            orgGroupPriority: $$('org-group-priority').getValue() ? $$('org-group-priority').getValue() : 10000,
            estimatedHours: estimatedHours,
            assigned: [],
            primaryParentId: null,
            projectCategoryId: $$('category-code').getValue(),
            projectStatusId: $$('status-code').getValue(),
            projectTypeId: $$('type-code').getValue(),
            routeStopId: $$('decision-point').getValue(),
            unassignedItems: [],
            requiredWorkers: $$('required-workers').getValue()
        };
        let rows = grid.getDataItems();
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
            dw.personIds.forEach(function (personId) {
                data.unassignedItems.push({
                    date: dw.date,
                    time: dw.time * 100000,
                    personId: personId,
                    projectEmployeeJoin: dw.projectEmployeeJoinId,
                    reason: dw.reason,
                    comment: dw.comments
                });
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
        let name = row.lastName + ', ' + row.firstName;
        if (row.middleName)
            name += ' ' + row.middleName;
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

    grid.setOnRowDoubleClicked(editWorkerRecord);

    $$('edit-worker').onclick(editWorkerRecord);


})();
