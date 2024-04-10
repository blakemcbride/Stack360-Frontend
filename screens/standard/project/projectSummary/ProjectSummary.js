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
    const WS = 'StandardProjectProjectSummary';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    let managerId;

    const columnDefs = [
        {headerName: '', field: 'personId', hide: true },
        {headerName: 'Last Name', field: 'lastName', width: 50  },
        {headerName: 'First Name', field: 'firstName', width: 35 },
        {headerName: 'Middle', field: 'middleName', width: 30 }
    ];
    const grid = new AGGrid('worker-grid', columnDefs);
    grid.show();
    grid.clear();

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    let data = {
        projectId: projectId
    };
    const rights = await AWS.callSoap(WS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('save').show(rights.accessLevel === '2');
    $$('reset').show(rights.accessLevel === '2');
    $$('summary').enable(rights.accessLevel === '2');
    $$('external-reference').enable(rights.accessLevel === '2');
    $$('show-all-employees').enable(rights.accessLevel === '2');
    grid.enable(rights.accessLevel === '2');
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

    async function loadData() {
        const data = {
            projectId: projectId
        };
        const res = await AWS.callSoap(WS, 'loadSummary', data);
        if (res.wsStatus === "0") {
            $$('summary').setValue(res.description);
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
            $$('required-workers').setValue(res.requiredWorkers);
            res.item = Utils.assureArray(res.item);
            grid.clear();
            grid.addRecords(res.item);
            $('#status').text('Displaying ' + res.item.length + ' people');
            $$('save').disable();
            $$('reset').disable();
            Utils.clearSomeControlValueChanged(false);
            Framework.askBeforeLeaving = false;
        } else
            return true;  // exit
        return false;  // don't exit
    }

    loadData();

    Utils.setSomeControlValueChangeFunction(function () {
        $$('save').enable(rights.accessLevel === '2');
        $$('reset').enable(rights.accessLevel === '2');
        $$('project-info').setValue(projectName + " - " + projectSummary + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    });

    $$('reset').onclick(function () {
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        loadData();
    });

    $$('save').onclick(function () {
        if ($$('summary').isError('Summary'))
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
        /*
        if ($$('state').isError('State'))
            return;
        if ($$('zip-code').isError('Zip Code'))
            return;
         */
        const data = {
            projectId: projectId,
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
            projectName: null
        };
        AWS.callSoap(WS, 'saveSummary', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('save').disable();
                $$('reset').disable();
                $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
                Utils.saveData("CURRENT_PROJECT_SUMMARY", projectSummary = $$('summary').getValue());
                Utils.clearSomeControlValueChanged(false);
                Framework.askBeforeLeaving = false;
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
