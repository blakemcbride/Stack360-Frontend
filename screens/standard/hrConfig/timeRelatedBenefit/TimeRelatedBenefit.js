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

window.TimeRelatedBenefit = {};

(async function () {

    const WS = 'StandardHrConfigTimeRelatedBenefit';

    let screenStack = [];
    let nameStack = [];

    let excludeIds = [];

    let columnDefs = [
        {headerName: 'name', field: 'name' },
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    columnDefs = [
        {headerName: 'Organizational Group', field: 'name', width: 100 },
        {headerName: 'ID', field: 'externalId', width: 45 },
    ];
    const orgGroupGrid = new AGGrid('org-groups-grid', columnDefs, 'orgGroupId');
    orgGroupGrid.show();

    columnDefs = [
        {headerName: 'Last Name', field: 'lname', width: 100 },
        {headerName: 'First Name', field: 'fname', width: 100 },
    ];
    const employeesGrid = new AGGrid('employees-grid', columnDefs, 'personId');
    employeesGrid.show();

    columnDefs = [
        {headerName: 'Last Name', field: 'lname', width: 100 },
        {headerName: 'First Name', field: 'fname', width: 100 },
    ];
    const selectedGrid = new AGGrid('selected-grid', columnDefs, 'personId');
    selectedGrid.show();

    TimeRelatedBenefit.goBack = function (lvl) {
        while (lvl--) {
            screenStack.pop();
            nameStack.pop();
        }
        updateOrgGroupGrid(screenStack[screenStack.length - 1]);
    }

    function updateBreadCrumb() {
        const levels = screenStack.length
        const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
        let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="TimeRelatedBenefit.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
        let i = 1;

        for (; i < levels; i++)
            bc += separator + '<a class="" onclick="TimeRelatedBenefit.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';

        let str = nameStack[levels-1];
        if ( nameStack[levels-1] === 'Top') {
            str += ' level';
            $$('org-group-label').setValue(`Organizational Groups at the ${str}`);
            $$('employees-label').setValue(`Employees at the ${str}`);
        } else {
            $$('org-group-label').setValue(`Organizational Groups inside ${str}`);
            $$('employees-label').setValue(`Employees inside ${str}`);
        }

        bc += '</div>';
        $('#bread-crumb-2').html(bc);
    }

    function updateOrgGroupGrid( orgGroupId, name, selectId ) {
        if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== orgGroupId) {
            screenStack.push(orgGroupId);
            nameStack.push(name ? name : "Top");
        }
        orgGroupId ? $$('org-group-up').enable() : $$('org-group-up').disable();
        orgGroupGrid.clear();
        $$('org-group-open').disable();
        const data = {
            groupId: orgGroupId
        };
        AWS.callSoap(WS, "listAssociatedOrgGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.orgGroups = Utils.assureArray(res.orgGroups);
                orgGroupGrid.addRecords(res.orgGroups);

                if (selectId)
                    orgGroupGrid.selectId(selectId);

                updateBreadCrumb();
                updateEmployeesGrid();

            }
        });
    }

    function descend() {
        const row = orgGroupGrid.getSelectedRow();
        updateOrgGroupGrid(row.orgGroupId, row.name);
    }

    orgGroupGrid.setOnRowDoubleClicked(descend);
    orgGroupGrid.setOnSelectionChanged((rows) => {
        $$('org-group-open').enable(rows);
    });

    $$('org-group-up').onclick(() => {
        screenStack.pop();
        nameStack.pop();
        updateOrgGroupGrid(screenStack.pop(), nameStack.pop());
    });

    $$('org-group-open').onclick(descend);

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        $$('assignment').disable();

        AWS.callSoap(WS, "listTimeRelatedBenefits").then((res) => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Time Related Benefits');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        $$('assignment').enable(rows);
    });

    const addBenefitPopup = () => {
        $$('bp-title').setValue('Add Time Related Benefit');
        $$('bp-name').clear();

        Utils.popup_open('benefit-popup', 'bp-name');

        $$('bp-ok').onclick(() => {
            if ($$('bp-name').isError('Name')) {
                return;
            }

            const data = {
                name: $$('bp-name').getValue()
            };
            AWS.callSoap(WS, "newTimeRelatedBenefit", data).then((res) => {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('bp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('add').onclick(addBenefitPopup);

    const editBenefitPopup = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }

        $$('bp-title').setValue('Edit Time Related Benefit');
        $$('bp-name').setValue(row.name);

        Utils.popup_open('benefit-popup', 'bp-name');

        $$('bp-ok').onclick(() => {
            if ($$('bp-name').isError('Name')) {
                return;
            }

            const data = {
                benefitId: row.id,
                name: $$('bp-name').getValue()
            };
            AWS.callSoap(WS, "saveTimeRelatedBenefit", data).then((res) => {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('bp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(editBenefitPopup);

    grid.setOnRowDoubleClicked(editBenefitPopup);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Time Related Benefit?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteTimeRelatedBenefits", data).then((res) => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    function updateEmployeesGrid() {
        employeesGrid.clear();
        $$('select').disable();
        
        const data = {
            lastName: '',
            lastNameSearchType: 0,
            excludeIds: excludeIds,
            supvervisor: false,
            groupId: screenStack[screenStack.length-1]
        };
        AWS.callSoap(WS, "listEmployeesForOrgGroup", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.employees = Utils.assureArray(res.employees);
                employeesGrid.addRecords(res.employees);
                $$('employees-status').setValue(`Displaying ${res.employees.length} Employee` + (res.employees.length > 1 ? 's' : ''));
            }
        });
    }

    const assignmentPopup = () => {
        const benefit = grid.getSelectedRow();
        if (!benefit) {
            return;
        }

        screenStack = [];
        nameStack = [];
        excludeIds = [];
        selectedGrid.clear();

        updateOrgGroupGrid(null);

        $$('org-group-open').disable();
        $$('org-group-up').disable();
        $$('select').disable();
        $$('remove').disable();
        
        $$('ap-ok').disable();

        Utils.popup_open('assignment-popup');

        const select = () => {
            const row = employeesGrid.getSelectedRow();
            if (!row) {
                return;
            }
            
            excludeIds.push(row.personId);
            employeesGrid.deleteSelectedRows();
            selectedGrid.addRecord(row);

            if (selectedGrid.getNumberOfRows() > 0) {
                $$('ap-ok').enable();
            } else {
                $$('ap-ok').disable();
            }
        }

        $$('select').onclick(select);

        const remove = () => {
            const row = selectedGrid.getSelectedRow();
            if (!row) {
                return;
            }
    
            const index = excludeIds.findIndex(e => e === row.personId);
            excludeIds.splice(index, 1);
    
            selectedGrid.deleteSelectedRows();
            $$('remove').disable();
    
            if (selectedGrid.getNumberOfRows() > 0) {
                $$('ap-ok').enable();
            } else {
                $$('ap-ok').disable();
            }
        };
    
        $$('remove').onclick(remove);

        employeesGrid.setOnSelectionChanged((rows) => {
            $$('select').enable(rows);
        });
        employeesGrid.setOnRowDoubleClicked(select);

        selectedGrid.setOnSelectionChanged((rows) => {
            $$('remove').enable(rows);
        });
        selectedGrid.setOnRowDoubleClicked(remove);

        $$('ap-ok').onclick(() => {
            const data = {
                benefitId: benefit.id,
                employeeIds: excludeIds
            };
            AWS.callSoap(WS, "enrollEmployeesInBenefit", data).then((res) => {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('assignment').onclick(assignmentPopup);

})();
