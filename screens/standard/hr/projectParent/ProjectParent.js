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

(function () {

    const WS = 'StandardHrProjectParent';

    AWS.callSoap(WS, 'checkRight').then(res => {
        if (res.wsStatus !== '0') {
            return;
        }
    });
    let personId = '';
    let acpPersonId = '';
    let columnDefs = [
        { headerName: 'Last Name', field: 'personLastName', width: 80 },
        { headerName: 'First Name', field: 'personFirstName', width: 80 },
        { headerName: 'Person Status', field: 'personStatus', width: 100 },
        { headerName: 'Summary', field: 'summary', width: 300},
        { headerName: 'Request Date/Time', field: 'dateTimeRequestedFormatted', type: 'numericColumn', width: 150 },
        { headerName: 'Status', field: 'statusCode'}
    ];
    const grid = new AGGrid('project-grid', columnDefs, 'projectId');

    grid.show();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
    });

    columnDefs = [
        { headerName: 'Last Name', field: 'lastName', width: 150 },
        { headerName: 'First Name', field: 'firstName', width: 150 },
        { headerName: 'Middle Name', field: 'middleName', width: 150 },
        { headerName: 'SSN', field: 'ssn', type: 'numericColumn', width: 150},
    ];
    const personGrid = new AGGrid('person-grid', columnDefs, 'personId');

    personGrid.show();

    const rememberVisitedProject = function (id, summary) {
        let visitedProjects = Utils.getData(VISITED_PROJECTS);
        if (!visitedProjects)
            visitedProjects = {};
        if (visitedProjects[id])
            return;
        visitedProjects[id] = {};
        visitedProjects[id].summary = summary;
        Utils.saveData(VISITED_PROJECTS, visitedProjects);
    };

    const visitedProjects = Utils.getData(VISITED_PROJECTS);
    const rp = $$('recent-project');
    rp.clear();
    rp.add('', '(select)');
    $$('edit-previous-project').disable();
    if (visitedProjects  &&  Utils.countProperties(visitedProjects)) {
        for (let id in visitedProjects) {
            rp.add(id, visitedProjects[id].summary.split(" ").pop() + ' - ' + visitedProjects[id].summary);
            rp.setValue(id);
        }
        $$('edit-previous-project').enable();
    }
        

    $$('edit-previous-project').onclick(function () {
        let id = $$('recent-project').getValue();
        if (!id)
            return;
        Utils.saveData(CURRENT_PROJECT_ID, $$('recent-project').getValue());
        Utils.saveData(CURRENT_PROJECT_SUMMARY, $$('recent-project').getLabel());
        Framework.getChild();
    });

    const editProject = function () {
        Utils.saveData(CURRENT_PROJECT_ID, grid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_SUMMARY, grid.getSelectedRow().summary);
        rememberVisitedProject(grid.getSelectedRow().projectId, grid.getSelectedRow().summary);
        Framework.getChild();
    };

    $$('edit').onclick(editProject);
    grid.setOnRowDoubleClicked(editProject);

    let data = {
        personId: '',
        projectTypeId: '',
    };
    AWS.callSoap(WS, 'listStatuses', data).then(function (res) {
        if (res.wsStatus === "0") {
            let ctl = $$('project-status');
            ctl.clear();
            ctl.add('', '(select)');
            res.item = Utils.assureArray(res.item);
            for (let i = 0 ; i < res.item.length ; i ++) {
                ctl.add(res.item[i].id, res.item[i].code);
            }
        }
    });

    const reset = () => {
        personId = '';
        $$('project-status').setValue('');
        $$('person-name').clear();
        $$('ssn').clear();
        $$('project-select-type').setValue('2');
        $$('project-search-value').clear();
    };

    $$('reset').onclick(reset);    

    const search = () => {
        data = {
            personId: personId,
            projectName: $$('project-search-value').getValue(),
            projectNameSearchType: $$('project-select-type').getValue(),
            dateRequested: 0,
            timeRequested: 0,
            statusId: $$('project-status').getValue()
        };
        grid.clear();
        $$('edit').disable();
        AWS.callSoap(WS, 'searchProjects', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                let count = res.item.length;
                if (count >= res.cap) {
                    $$('status').setValue(`Displaying ${count} Project` + (count > 1 ? 's' : '') + (' (Limit)')).setColor('red');
                } else {
                    $$('status').setValue(`Displaying ${count} Project` + (count > 1 ? 's' : '')).setColor('black');
                }
            }
        });
    };

    $$('search').onclick(search);

    const searchPersonPopup = (flag) => {
        $$('spp-title').setValue('Search for Person');
        personGrid.clear();
        $$('spp-ok').disable();

        const reset = () => {
            $$('spp-search-type').setValue('E');
            $$('spp-last-name-search-type').setValue('2');
            $$('spp-lname').clear();
            $$('spp-first-name-search-type').setValue('2');
            $$('spp-fname').clear();
            $$('spp-ssn').clear();
        };
        reset();

        const search = () => {
            personGrid.clear();
            $$('spp-ok').disable();
            const data = {
                firstName: $$('spp-fname').getValue(),
                firstNameSearchType: $$('spp-first-name-search-type').getValue(),
                lastName: $$('spp-lname').getValue(),
                lastNameSearchType: $$('spp-last-name-search-type').getValue(),
                searchType: $$('spp-search-type').getValue(),
                ssn: $$('spp-ssn').getValue()
            };
            AWS.callSoap(WS, 'searchPersons', data).then(res => {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    personGrid.addRecords(res.item);
                    $$('spp-status').setValue('Displaying ' + res.item.length + (data.searchType === 'E' ? ' Employees' : ' Dependents'));
                }
            });
        };

        $$('spp-search').onclick(search);
        $$('spp-reset').onclick(reset);

        Utils.popup_open('search-person-popup');

        const ok = () => {
            const row = personGrid.getSelectedRow();
            if (!row) {
                return;
            }
            if (flag === true) {
                $$('person-name').setValue(row.lastName + ', ' + row.firstName);
                $$('ssn').setValue(row.ssn);
                personId = row.personId;
            } else {
                $$('acp-person-name').setValue(row.lastName + ', ' + row.firstName);
                $$('acp-ssn').setValue(row.ssn);
                acpPersonId = row.personId;
            }
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('spp-ok').onclick(ok);
        $$('spp-cancel').onclick(cancel);

        personGrid.setOnSelectionChanged((rows) => {
            $$('spp-ok').enable(rows);
        });
        personGrid.setOnRowDoubleClicked(ok);
    };

    $$('choose').onclick(() => {
        searchPersonPopup(true)
    });

    const addProjectPopup = () => {
        $$('acp-title').setValue('Add Project');
        $$('acp-person-name').clear();
        $$('acp-ssn').clear();
        $$('acp-type').setValue('');
        $$('acp-summary').clear();
        $$('acp-detail').clear();
        $$('acp-date').setValue(DateUtils.today());
        $$('acp-time').setValue(TimeUtils.current());
        acpPersonId = '';

        AWS.callSoap(WS, 'listProjectTypes').then(res => {
            if (res.wsStatus === '0') {
                let ctl = $$('acp-type');
                ctl.clear();
                ctl.add('', '(select)');
                res.projectTypes = Utils.assureArray(res.projectTypes);
                for (let i = 0 ; i < res.projectTypes.length ; i ++) {
                    ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].description);
                }
            }
        });

        AWS.callSoap(WS, 'listEmployeesForAssignment').then(res => {
            if (res.wsStatus === '0') {
                let ctl = $$('acp-assigned');
                ctl.clear();
                ctl.add('', '(select)');
                res.item = Utils.assureArray(res.item);
                for (let i = 0 ; i < res.item.length ; i ++) {
                    ctl.add(res.item[i].employeeId, res.item[i].displayName);
                }
            }
        });

        Utils.popup_open('add-project-popup');

        $$('acp-choose').onclick(() => {
            searchPersonPopup(false);
        });

        const ok = () => {
            if ($$('acp-person-name').isError('Person Name')) {
                return;
            }
            if ($$('acp-ssn').isError('SSN')) {
                return;
            }
            if ($$('acp-type').isError('Type')) {
                return;
            }
            if ($$('acp-summary').isError('Summary')) {
                return;
            }
            if ($$('acp-assigned').isError('Assigned To')) {
                return;
            }

            const data = {
                personId: acpPersonId,
                type: $$('acp-type').getValue(),
                summary: $$('acp-summary').getValue(),
                detail: $$('acp-detail').getValue(),
            };
            // Backend API 
            // AWS.callSoap(WS, '', data).then(res => {
            //     if (res.wsStatus === '0') {

            //     }
            // });
            
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('acp-ok').onclick(ok);
        $$('acp-cancel').onclick(cancel);
    };

    $$('add').onclick(addProjectPopup);

})();

