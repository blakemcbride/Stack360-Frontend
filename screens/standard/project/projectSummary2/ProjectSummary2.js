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
    const SWS = 'StandardProjectProjectSummary';
    const WS = 'com.arahant.services.standard.project.projectSummary';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    let managerId, active;

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    const data = {
        projectId: projectId
    };
    const rights = await AWS.callSoap(SWS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('save').show(rights.accessLevel === '2');
    $$('reset').show(rights.accessLevel === '2');
    $$('summary').enable(rights.accessLevel === '2');
    $$('external-reference').enable(rights.accessLevel === '2');
    $$('show-all-employees').enable(rights.accessLevel === '2');
    $$('requesting-person').enable(rights.accessLevel === '2');
    $$('managing-employee').enable(rights.accessLevel === '2');
    $$('select-manager').enable(rights.accessLevel === '2');
    $$('project-code').enable(rights.accessLevel === '2');
    $$('start-date').enable(rights.accessLevel === '2');
    $$('end-date').enable(rights.accessLevel === '2');
    $$('street1').enable(rights.accessLevel === '2');
    $$('street2').enable(rights.accessLevel === '2');
    $$('city').enable(rights.accessLevel === '2');
    $$('state').enable(rights.accessLevel === '2');
    $$('zip-code').enable(rights.accessLevel === '2');
    $$('required-workers').enable(rights.accessLevel === '2');
    $$('shift').enable(rights.accessLevel === '2');
    $$('retailer').enable(rights.accessLevel === '2');
    $$('project-status').enable(rights.accessLevel === '2');
    $$('subtype-code').enable(rights.accessLevel === '2');
    $$('store-number').enable(rights.accessLevel === '2');

    const subtypeCtl = $$('subtype-code');
    subtypeCtl.clear();
    const p1 = Server.call(WS, 'GetSubtype', data);

    const statusCtl = $$('project-status');
    statusCtl.clear().add('', '(choose)');
    const p2 = Server.call(WS, 'GetStatus', data);

    // fill the list of shifts
    const p3 = Server.call(WS, 'GetShifts', data);
    const shiftCtl = $$('shift');
    shiftCtl.clear().triggerGlobalChange(false);

    await Server.callAll([p1, p2, p3],
        function (res) {
            if (res._Success) {
                subtypeCtl.addItems(res.projectSubtypes, 'project_subtype_id', 'code');
                subtypeCtl.setValue(res.project_subtype_id);
            }
        },
        function (res) {
            if (res._Success) {
                statusCtl.addItems(res.projectStatus, 'project_status_id', 'code');
                statusCtl.setValue(res.project_status_id);
                active = statusCtl.getData().active;
            }
        },
        function (res) {
            if (res._Success) {
                if (res.shifts.length === 1) {
                    const shift = res.shifts[0];
                    shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
                } else
                    shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable(rights.accessLevel === '2');
            }
        });

    async function shiftChange() {
        const projectShiftId = shiftCtl.getValue();
        if (projectShiftId) {
            const data = shiftCtl.getData();
            $$('required-workers').setValue(data.required_workers);
        } else {
            const data = shiftCtl.getAllData();
            let rw = 0;
            for (let prop in data) {
                let itm = data[prop];
                rw += itm.required_workers;
            }
            $$('required-workers').setValue(rw);
        }

        const data = {
            projectId: projectId,
            shiftId: $$('shift').getValue()
        };
        const res = await Server.call(WS, 'GetShiftTotalAssignedWorkers', data);
        if (res._Success) {
            $$('assigned-workers').setValue(res.assignedWorkers);
        }
    }

    shiftCtl.onChange(shiftChange);
    shiftChange();

    async function loadSummary() {
        const data = {
            projectId: projectId,
            projectShiftId: $$('shift').getValue()
        };
        const res = await AWS.callSoap(SWS, 'loadSummary', data);
        if (res.wsStatus === "0") {
            //           $$('summary').setValue(res.description);
            $$('category-code').setValue(res.projectCategoryCode);
            $$('type-code').setValue(res.projectTypeCode);
            $$('external-reference').setValue(res.reference);
            $$('date-created').setValue(Utils.toNumber(res.dateReported));
            $$('time-created').setValue(Math.trunc(Utils.toNumber(res.timeReported) / 100000));
            $$('created-by').setValue(res.sponsorNameFormatted);
            $$('show-all-employees').setValue(res.accessibleToAll === "true");
            $$('client').setValue(res.requestingCompanyName);
            $$('org-group').setValue(res.orgGroupName);
            $$('requesting-person').setValue(res.requesterName);
            $$('managing-employee').setValue(res.managerName);
            $$('retailer').setValue(res.locationDescription);
            managerId = res.managerId;
            switch (res.billable) {
                case "Y":
                case "I":
                    $$('billable').setValue('Y');
                    break;
                case 'N':
                    $$('billable').setValue('N');
                    break;
                default:
                    $$('billable').setValue('U');
                    break;
            }
            $$('project-code').setValue(res.projectCode);
            $$('start-date').setValue(Utils.toNumber(res.estimatedFirstDate));
            $$('end-date').setValue(Utils.toNumber(res.estimatedLastDate));
            $$('street1').setValue(res.projectStreet1);
            $$('street2').setValue(res.projectStreet2);
            $$('city').setValue(res.projectCity);
            $$('state').setValue(res.projectState);
            $$('zip-code').setValue(res.projectZipCode);
            $$('project-id').setValue(projectId);
            res.item = Utils.assureArray(res.item);
            $$('assigned-workers').setValue(res.item.length);
            $$('save').disable();
            $$('reset').disable();
            $$('store-number').setValue(res.storeNumber);
            Utils.clearSomeControlValueChanged(false);
            Framework.askBeforeLeaving = false;
            calcSummary();
        } else
            return true;  // exit
        return false;  // don't exit
    }

    loadSummary();

    function val(summary, lbl) {
        let r = $$(lbl).getValue();
        if (r)
            r = r.trim();
        return r ? summary + ' ' + r : summary;
    }

    function calcSummary() {
        let summary;

        summary = $$('retailer').getValue().trim();
        summary = val(summary, 'store-number');
        summary = val(summary, 'city');
        summary = val(summary, 'state');
        if (subtypeCtl.getValue())
            summary += ' ' + subtypeCtl.getLabel();
        $$('summary').setValue(summary);
    }

    $$('retailer').onChange(calcSummary);
    $$('store-number').onChange(calcSummary);
    $$('city').onChange(calcSummary);
    $$('state').onChange(calcSummary);
    subtypeCtl.onChange(calcSummary);

    Utils.setSomeControlValueChangeFunction(function () {
        $$('save').enable(rights.accessLevel === '2');
        $$('reset').enable(rights.accessLevel === '2');
        $$('project-info').setValue(projectName + " - " + projectSummary + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    });

    $$('reset').onclick(function () {
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        loadSummary();
    });

    $$('save').onclick(async function () {
//        if ($$('summary').isError('Summary'))
//            return;
        if (subtypeCtl.isError('Sub-type Code'))
            return;
        if ($$('external-reference').isError('External Reference'))
            return;
        if ($$('requesting-person').isError('Requesting Person'))
            return;
        if ($$('project-code').isError('Project Code'))
            return;
        if ($$('street1').isError('Street 1'))
            return;
        if ($$('street2').isError('Street 2'))
            return;
        if ($$('city').isError('City'))
            return;
        if ($$('state').isError('State'))
            return;
        if ($$('zip-code').isError('Zip Code'))
            return;
        if (statusCtl.isError('Project Status'))
            return;
        const active2 = statusCtl.getData().active;
        let autoUnassign = false;
        if (active === 'Y'  &&  active2 === 'N')
            await Utils.yesNo('Query', 'Shall we auto-unassign all workers and generate travel pay?', () => {
                autoUnassign = true;
            });
        const data = {
            projectId: projectId,
            projectShiftId: $$('shift').getValue(),
            description: $$('summary').getValue(),
            reference: $$('external-reference').getValue(),
            accessibleToAll: $$('show-all-employees').getValue(),
            requesterName: $$('requesting-person').getValue(),
            projectCode: $$('project-code').getValue(),
            estimatedFirstDate: $$('start-date').getIntValue(),
            estimatedLastDate: $$('end-date').getIntValue(),
            projectStreet1: $$('street1').getValue(),
            projectStreet2: $$('street2').getValue(),
            projectCity: $$('city').getValue(),
            projectState: $$('state').getValue(),
            projectZipCode: $$('zip-code').getValue(),
            managerId: managerId,
            requiredWorkers: $$('required-workers').getValue(),
            employeeId: null,
            projectName: null,
            storeNumber: $$('store-number').getValue(),
            subTypeId: subtypeCtl.getValue(),
            projectStatusId: statusCtl.getValue(),
            locationDescription: $$('retailer').getValue(),
            autoUnassign: autoUnassign
        };
        AWS.callSoap(SWS, 'saveSummary', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('save').disable();
                $$('reset').disable();
                $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
                Utils.saveData("CURRENT_PROJECT_SUMMARY", projectSummary = $$('summary').getValue());
                Utils.clearSomeControlValueChanged(false);
                Framework.askBeforeLeaving = false;
                active = active2;
                Utils.showMessage('Information', 'Save completed successfully.');
            }
        });
    });

    $$('select-manager').onclick(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', {title: 'Supervisor Selection'});
        if (res._status === "ok") {
            let name = res.lname + ", " + res.fname + " " + res.mname;
            $$('managing-employee').setValue(name);
            managerId = res.employeeid;
            Utils.someControlValueChanged();
        }
    });

})();
