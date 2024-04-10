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
    const WS = 'StandardHrCallLogListParent';

    const personId = Framework.userInfo.personId;
    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    function getSearchCriteria() {
        AWS.callSoap(WS, 'listEmployeesForAssignment').then(res => {
            if (res.wsStatus === '0') {
                $$('clLp-employeeId').clear();
                $$('clLp-employeeId').add("", "(select)");
                res.item = Utils.assureArray(res.item);
                $$('clLp-employeeId').addItems(res.item, 'employeeId', 'displayName').setValue(personId);
                getListProjectTypes();
            }
        });

        AWS.callSoap(WS, 'listLocations').then(res => {
            if (res.wsStatus === '0') {
                $$('clLp-locationId').clear();
                $$('clLp-locationId').add("", "(select)");
                res.item = Utils.assureArray(res.item);
                $$('clLp-locationId').addItems(res.item, 'id', 'name');
            }
        });

        function getListProjectTypes() {
            let selectedType = $$('clLp-projectTypeId').getValue();
            const params = {
                employeeId: $$('clLp-employeeId').getValue()
            }
            AWS.callSoap(WS, 'listProjectTypes', params).then(res => {
                if (res.wsStatus === '0') {
                    $$('clLp-projectTypeId').clear();
                    res.projectTypes = Utils.assureArray(res.projectTypes);
                    $$('clLp-projectTypeId').addItems(res.projectTypes, 'projectTypeId', 'codeAndCount');
                    if (selectedType !== null) {
                        $$('clLp-projectTypeId').setValue(selectedType);
                    }
                    getListProjects();
                }
            });
        }

        $$('clLp-employeeId').onChange(getListProjectTypes);
        $$('clLp-locationId').onChange(getListProjects);
        $$('clLp-projectTypeId').onChange(getListProjects);
    }

    let listProjectsGrid;

    const listProjectsColumnDefs = [
        {headerName: "Last Name", field: "personLastName", width: 250},
        {headerName: "First Name", field: "personFirstName", width: 250},
        {headerName: "Person Status", field: "personStatus", width: 250},
        {headerName: "Summary", field: "summary", width: 450},
        {headerName: "Request Date/Time", field: "dateTimeRequestedFormatted", type: 'numericColumn', width: 150},
        {headerName: "Status", field: "statusCode", width: 100},
    ];

    listProjectsGrid = new AGGrid('listProjectsGrid', listProjectsColumnDefs);

    listProjectsGrid.show();

    function getListProjects() {
        const params = {
            employeeId: $$('clLp-employeeId').getValue(),
            locationId: $$('clLp-locationId').getValue(),
            projectTypeId: $$('clLp-projectTypeId').getValue(),
            start: 0
        }

        $$('add').enable();
        $$('editCallLog').disable();
        $$('editEmployee').disable();

        AWS.callSoap(WS, 'listProjects', params).then(data => {
            listProjectsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                listProjectsGrid.addRecords(data.item);
                listProjectsGrid.setOnSelectionChanged((x) => {
                    $$('editCallLog').enable(x);
                    $$('editEmployee').enable(x);
                });
                $$('listProjects-label').setValue('Displaying ' + data.item.length + ' Call Logs');
            }
        });
    }

    $$('add').onclick(() => {
        $$('summary').clear();


        getSearchCriteria();

        $$('refresh').onclick(getListProjects);

        $$('editCallLog').onclick(() => {
            const row = listProjectsGrid.getSelectedRow();
            Utils.saveData(CURRENT_PROJECT_ID, row.projectId);
            Utils.saveData(CURRENT_CLIENT_NAME, row.projectName);
            Framework.getChild();
        });

        $$('editEmployee').onclick(() => {
            Utils.saveData(HR_PERSON_ID, $$('clLp-employeeId').getValue());
            Utils.saveData(HR_PERSON_NAME, $$('clLp-employeeId').getLabel());
            Framework.getChild();
        });
    });
})();

