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

window.CompanyOrgGroup = {};

(async function () {

    const WS = 'StandardMiscCompanyOrgGroup';

    async function executeSelectFunc(element, fn, id, name) {
        const selectedNode = await fn();
        if (selectedNode)
            $$(element).setValue(selectedNode[id], selectedNode[name]);
    }

    const listSmartChooser = (data) => {
        const elements = Utils.assureArray(data);

        elements.map(element => {
            $$(element.tag).clear();

            AWS.callSoap(WS, element.url, element.param).then( res => {
                if (res.wsStatus === '0') {
                    if (!res.item) {
                        $$(element.tag).clear();
                        $$(element.tag).forceSelect();
                        return;
                    }
        
                    if (res.item.length > res.lowCap) {
                        $$(element.tag).forceSelect();
                    }
        
                    $$(element.tag).addItems(Utils.assureArray(res.item), element.ID, element.label);

                    if (res.selectedItem) {
                        $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
                        $$(element.tag).setValue(res.selectedItem[element.ID]);
                    }

                    if (element.selected) {
                        $$(element.tag).setValue(element.selected);
                    }
                }
            });
        })
    };

    const screenStack = [];
    const nameStack = [];

    CompanyOrgGroup.goBack = function (lvl) {
        while (lvl--) {
            screenStack.pop();
            nameStack.pop();
        }
        updateOrgGroupGrid(screenStack[screenStack.length - 1]);
    }

    function updateBreadCrumb() {
        const levels = screenStack.length
        const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
        let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="CompanyOrgGroup.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
        let i = 1;

        for (; i < levels; i++)
            bc += separator + '<a class="" onclick="CompanyOrgGroup.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';

        let str = nameStack[levels-1];
        if (nameStack[levels-1] === 'Top')
            str += ' level';
        $$('org-group-label').setValue(`Organizational Groups inside ${str}`);
        $$('employees-label').setValue(`Employees inside ${str}`);

        bc += '</div>';
        $('#bread-crumb-2').html(bc);
    }

    const orgGroupGrid = new AGGrid('org-groups-grid', [
        {headerName: 'Company Organizational Unit Name', field: 'name', width: 55 },
        {headerName: 'ID', field: 'externalId', width: 25 },
        {headerName: 'Type', field: 'type', width: 25 }
    ], 'orgGroupId');
    orgGroupGrid.show();

    function updateOrgGroupGrid( orgGroupId, name, selectId ) {
        if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== orgGroupId) {
            screenStack.push(orgGroupId);
            nameStack.push(name ? name : "Top");
        }
        if (orgGroupId) {
            $$('org-group-up').enable();
            $$('org-group-add').enable();
            $$('org-group-delete').enable();
        } else {
            $$('org-group-up').disable();
            $$('org-group-add').disable();
            $$('org-group-delete').disable();
        }
        orgGroupGrid.clear();
        $$('org-group-edit').disable();
        $$('org-group-delete').disable();
        $$('org-group-disassociate').disable();
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

                if (screenStack.length > 1) {
                    $$('employee-add').enable();
                    $$('org-group-associate').enable();
                    $$('employee-associate').enable();
                } else { 
                    $$('employee-add').disable();
                    $$('org-group-associate').disable();
                    $$('employee-associate').disable();
                }
            }
        });
    }

    updateOrgGroupGrid(null);

    function descend() {
        const row = orgGroupGrid.getSelectedRow();
        updateOrgGroupGrid(row.orgGroupId, row.name);
    }

    $$('search-org-group').onclick(() => {
        const data = {
            name: $$('filter-org-group').getValue(),
            nameSearchType: $$('filter-org-group-type').getValue(),
            groupId: screenStack[screenStack.length-1]
        };
        AWS.callSoap(WS, "searchAssociatedOrgGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.orgGroups = Utils.assureArray(res.orgGroups);
                orgGroupGrid.clear().addRecords(res.orgGroups);
            }
        });        
    });

    orgGroupGrid.setOnRowDoubleClicked(descend);
    orgGroupGrid.setOnSelectionChanged((rows) => {
        $$('org-group-open').enable(rows);
        $$('org-group-edit').enable(rows);
        if (screenStack.length > 1) {
            $$('org-group-disassociate').enable(rows);
            $$('org-group-delete').enable(rows);
        } else {
            $$('org-group-disassociate').disable();
            $$('org-group-delete').disable();
        }
    });

    $$('org-group-up').onclick(() => {
        screenStack.pop();
        nameStack.pop();
        updateOrgGroupGrid(screenStack.pop(), nameStack.pop());
    });

    $$('org-group-open').onclick(descend);

    const employeesGrid = new AGGrid('employees-grid', [
        {headerName: 'Last Name', field: 'lname', width: 50 },
        {headerName: 'First Name', field: 'fname', width: 50 },
        {headerName: 'Middle Name', field: 'middleName', width: 35 },
        {headerName: 'Supervisor', field: 'primary2', width: 55 },
    ], 'personId');
    employeesGrid.show();

    function updateEmployeesGrid() {
        employeesGrid.clear();

        const data = {
            lastNameSearchType: $$('filter-last-name-type').getValue(),
            lastName: $$('filter-last-name').getValue(),
            supervisor: '',
            groupId: screenStack[screenStack.length-1]
        };
        AWS.callSoap(WS, "listEmployeesForOrgGroup", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.employees = Utils.assureArray(res.employees);
                for (let i=0 ; i < res.employees.length ; i++) {
                    let row = res.employees[i];
                    row.primary2 = row.primary === 'Y' ? 'Yes' : 'No';
                }
                employeesGrid.addRecords(res.employees);
                $$('employees-status').setValue(`Displaying ${res.employees.length} Employees`);
            }
        });

        $$('employee-edit').disable();
        $$('employee-disassociate').disable();
    }

    employeesGrid.setOnSelectionChanged((rows) => {
        $$('employee-edit').enable(rows);
        $$('employee-disassociate').enable(rows);
    });

    $$('search-last-name').onclick(() => {
        const data = {
            name: $$('filter-last-name').getValue(),
            nameSearchType: $$('filter-last-name-type').getValue(),
            groupId: screenStack[screenStack.length-1]
        };
        AWS.callSoap(WS, "searchAssociatedEmployees", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.persons = Utils.assureArray(res.persons);
                employeesGrid.clear().addRecords(res.persons);
                $$('employees-status').setValue(`Displaying ${res.persons.length} Employees`);
            }
        });      

    });

    const companySelection = () => {

        let formSearchGrid;
        
        Utils.popup_open('company-selection');

        return new Promise(async function (resolve, reject) {
            const reset = () => {
                $$('csp-company-search-type').setValue('true');
        
                $$('csp-company-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('csp-company-name-criteria').enable();
        
                $$('csp-company-name-search').clear();
                $$('csp-company-name-search').enable();
        
                $$('csp-search-company-reset').enable();
                $$('csp-search-company-search').enable();
        
                $$('csp-ok').disable();
        
                formSearchGrid.clear();
                changeCount(0);
            };
        
            const changeCount = count => {
                if (count === 70)
                    Utils.setHTML('csp-comp-count', `<span style="color: var(--error-color);">Displaying ${count} Companies (Limit)</span>`);
                else
                    Utils.setText('csp-comp-count', `Displaying ${count} Companies`)
            };
        
            const ok = () => {
                let company = formSearchGrid.getSelectedRow();
        
                if (!company)
                    company = null;
        
                resolve(company);
                reset();
                Utils.popup_close();
            };
        
            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
        
            // Setup drop downs.
            bindToEnum('csp-company-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
            const initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Company ID', field: 'companyId', hide: true},
                    {headerName: 'Company Name', field: 'name'},
                    {headerName: 'Type', field: 'orgGroupTypeName', maxWidth: 100}
                ];
        
                formSearchGrid = new AGGrid('csp-search-company-results', columnDefs, 'companyId');
                formSearchGrid.show();
            };
        
            const toggleControls = disabled => {
                if (disabled) {
                    $$('csp-company-name-criteria').disable();
                    $$('csp-company-name-search').disable();
                    $$('csp-search-company-reset').disable();
                    $$('csp-search-company-search').disable();
        
                    $$('csp-ok').enable();
                } else {
                    $$('csp-company-name-criteria').enable();
                    $$('csp-company-name-search').enable();
                    $$('csp-search-company-reset').enable();
                    $$('csp-search-company-search').enable();
        
                    $$('csp-ok').disable();
                }
            };

            initDataGrid();
        
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
        
            $$('csp-company-search-type').onChange(() => {
                if ($$('csp-company-search-type').getValue() === 'false') {
                    formSearchGrid.clear();
                    toggleControls(true);
                    changeCount(0);
                } else {
                    toggleControls(false);
                }
            });
        
            formSearchGrid.setOnSelectionChanged($$('csp-ok').enable);
        
            formSearchGrid.setOnRowDoubleClicked(ok);
        
            $$('csp-search-company-reset').onclick(reset);
        
            $$('csp-search-company-search').onclick(async () => {
                const inParams = {
                    name: $$('csp-company-name-search').getValue(),
                    companyNameSearchType: $$('csp-company-name-criteria').getValue(),
                };
        
                const data = await AWS.callSoap(WS, 'searchCompany', inParams);
                // Clear the grid.
                formSearchGrid.clear();
        
                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);
        
                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });
        
            $$('csp-ok').onclick(ok);
        
            $$('csp-cancel').onclick(cancel);
        
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const categorySelection = () => {

        let formSearchGrid;
        
        Utils.popup_open('category-selection');

        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('ctg-category-search-type').setValue('true');

                $$('ctg-category-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ctg-category-code-criteria').enable();
                $$('ctg-category-code-search').clear();
                $$('ctg-category-code-search').enable();

                $$('ctg-category-desc-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ctg-category-desc-criteria').enable();
                $$('ctg-category-desc-search').clear();
                $$('ctg-category-desc-search').enable();

                $$('ctg-reset').enable();
                $$('ctg-search').enable();

                $$('ctg-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('ctg-cat-count', `Displaying ${count} Project Categories`);
            };

            const ok = () => {
                let category = formSearchGrid.getSelectedRow();

                if (!category)
                    category = null;

                resolve(category);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('ctg-category-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ctg-category-desc-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Category ID', field: 'projectCategoryId', hide: true},
                    {headerName: 'Code', field: 'code', maxWidth: 125},
                    {headerName: 'Description', field: 'description'}
                ];

                formSearchGrid = new AGGrid('ctg-search-category-results', columnDefs, 'projectCategoryId');
                formSearchGrid.show();
            };

            const toggleControls = disabled => {
                if (disabled) {
                    $$('ctg-category-code-criteria').disable();
                    $$('ctg-category-code-search').disable();
                    $$('ctg-category-desc-criteria').disable();
                    $$('ctg-category-desc-search').disable();
                    $$('ctg-reset').disable();
                    $$('ctg-search').disable();

                    $$('ctg-ok').enable();
                } else {
                    $$('ctg-category-code-criteria').enable();
                    $$('ctg-category-code-search').enable();
                    $$('ctg-category-desc-criteria').enable();
                    $$('ctg-category-desc-search').enable();
                    $$('ctg-reset').enable();
                    $$('ctg-search').enable();

                    $$('ctg-ok').disable();
                }
            };

            initDataGrid();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            $$('ctg-category-search-type').onChange(() => {
                if ($$('ctg-category-search-type').getValue() === 'false') {
                    formSearchGrid.clear();
                    changeCount(0);

                    toggleControls(true);
                } else {
                    toggleControls(false);
                }
            });

            formSearchGrid.setOnSelectionChanged($$('ctg-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('ctg-reset').onclick(reset);

            $$('ctg-search').onclick(async () => {
                const inParams = {
                    code: $$('ctg-category-code-search').getValue(),
                    categoryCodeSearch: $$('ctg-category-code-criteria').getValue(),
                    description: $$('ctg-category-desc-search').getValue(),
                    descriptionSearchType: $$('ctg-category-desc-criteria').getValue(),
                };

                const data = await AWS.callSoap(WS, 'searchProjectCategories', inParams);

                // Clear the grid.
                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    let count = records.length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });

            $$('ctg-ok').onclick(ok);

            $$('ctg-cancel').onclick(cancel);

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const projectTypeSelection = () => {

        let formSearchGrid;
        
        Utils.popup_open('project-type-selection');

        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('ptp-project-type-search-type').setValue('true');

                $$('ptp-project-type-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptp-project-type-code-criteria').enable();
                $$('ptp-project-type-code-search').clear();
                $$('ptp-project-type-code-search').enable();

                $$('ptp-project-type-desc-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptp-project-type-desc-criteria').enable();
                $$('ptp-project-type-desc-search').clear();
                $$('ptp-project-type-desc-search').enable();

                $$('ptp-reset').enable();
                $$('ptp-search').enable();

                $$('ptp-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('ptp-type-count', `Displaying ${count} Project Types`);
            };

            const ok = () => {
                let type = formSearchGrid.getSelectedRow();

                if (!type)
                    type = null;

                resolve(type);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('ptp-project-type-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ptp-project-type-desc-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Project Type ID', field: 'projectTypeId', hide: true},
                    {headerName: 'Code', field: 'code', maxWidth: 125},
                    {headerName: 'Description', field: 'description'}
                ];

                formSearchGrid = new AGGrid('ptp-search-type-results', columnDefs, 'projectTypeId');
                formSearchGrid.show();
            };

            const toggleControls = disabled => {
                if (disabled) {
                    $$('ptp-project-type-code-criteria').disable();
                    $$('ptp-project-type-code-search').disable();
                    $$('ptp-project-type-desc-criteria').disable();
                    $$('ptp-project-type-desc-search').disable();
                    $$('ptp-reset').disable();
                    $$('ptp-search').disable();

                    $$('ptp-ok').enable();
                } else {
                    $$('ptp-project-type-code-criteria').enable();
                    $$('ptp-project-type-code-search').enable();
                    $$('ptp-project-type-desc-criteria').enable();
                    $$('ptp-project-type-desc-search').enable();
                    $$('ptp-reset').enable();
                    $$('ptp-search').enable();

                    $$('ptp-ok').disable();
                }
            };

            initDataGrid();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            $$('ptp-project-type-search-type').onChange(() => {
                if ($$('ptp-project-type-search-type').getValue() === 'false') {
                    formSearchGrid.clear();
                    toggleControls(true);
                    changeCount(0);
                } else {
                    toggleControls(false);
                }
            });

            formSearchGrid.setOnSelectionChanged($$('ptp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('ptp-reset').onclick(reset);

            $$('ptp-search').onclick(async () => {
                const inParams = {
                    code: $$('ptp-project-type-code-search').getValue(),
                    projectTypeCodeSearch: $$('ptp-project-type-code-criteria').getValue(),
                    description: $$('ptp-project-type-desc-search').getValue(),
                    descriptionSearchType: $$('ptp-project-type-desc-criteria').getValue(),
                };

                const data = await AWS.callSoap(WS, 'searchProjectTypes', inParams);
                // Clear the grid.
                formSearchGrid.clear();

                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });

            $$('ptp-ok').onclick(ok);

            $$('ptp-cancel').onclick(cancel);

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const projectStatusSelection = () => {

        let formSearchGrid;
        
        Utils.popup_open('project-status-selection');

        return new Promise(async function (resolve, reject) {
            
            const reset = () => {
                $$('psp-search-type').setValue('true');

                $$('psp-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-code-criteria').enable();

                $$('psp-code-search').clear();
                $$('psp-code-search').enable();

                $$('psp-desc-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-desc-criteria').enable();
                $$('psp-desc-search').clear();
                $$('psp-desc-search').enable();

                $$('psp-reset').enable();
                $$('psp-search').enable();

                $$('psp-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('psp-stat-count', `Displaying ${count} Project Statuses`);
            };

            const ok = () => {
                let status = formSearchGrid.getSelectedRow();

                if (!status)
                    status = null;

                resolve(status);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('psp-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-desc-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Status ID', field: 'projectStatusId', hide: true},
                    {headerName: 'Code', field: 'code', maxWidth: 125},
                    {headerName: 'Description', field: 'description'}
                ];

                formSearchGrid = new AGGrid('psp-search-project-status-results', columnDefs, 'projectStatusId');
                formSearchGrid.show();
            };

            const toggleControls = disabled => {
                if (disabled) {
                    $$('psp-code-criteria').disable();
                    $$('psp-code-search').disable();
                    $$('psp-desc-criteria').disable();
                    $$('psp-desc-search').disable();
                    $$('psp-reset').disable();
                    $$('psp-search').disable();

                    $$('psp-ok').enable();
                } else {
                    $$('psp-code-criteria').enable();
                    $$('psp-code-search').enable();
                    $$('psp-desc-criteria').enable();
                    $$('psp-desc-search').enable();
                    $$('psp-reset').enable();
                    $$('psp-search').enable();

                    $$('psp-ok').disable();
                }
            };

            initDataGrid();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            $$('psp-search-type').onChange(() => {
                if ($$('psp-search-type').getValue() === 'false') {
                    formSearchGrid.clear();
                    toggleControls(true);
                    changeCount(0);
                } else {
                    toggleControls(false);
                }
            });

            formSearchGrid.setOnSelectionChanged($$('psp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('psp-reset').onclick(reset);

            $$('psp-search').onclick(async () => {
                const inParams = {
                    code: $$('psp-code-search').getValue(),
                    codeSearch: $$('psp-code-criteria').getValue(),
                    description: $$('psp-desc-search').getValue(),
                    descriptionSearchType: $$('psp-desc-criteria').getValue(),
                };

                const data = await AWS.callSoap(WS, 'searchProjectStatuses', inParams);
                // Clear the grid.
                formSearchGrid.clear();

                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });

            $$('psp-ok').onclick(ok);

            $$('psp-cancel').onclick(cancel);

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const chooseProject = () => {

        let chooseProjectGrid;
        
        Utils.popup_open('choose-project');

        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('cpp-project-choose-type').setValue('false');
        
                $$('cpp-projectId-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('cpp-projectId-criteria').enable();
                $$('cpp-projectId-search').clear();
                $$('cpp-projectId-search').enable();
        
                $$('cpp-project-summary-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('cpp-project-summary-criteria').enable();
                $$('cpp-project-summary-search').clear();
                $$('cpp-project-summary-search').enable();
        
                $$('cpp-project-company').setValue('');
                $$('cpp-project-category').setValue('');
                $$('cpp-project-type').setValue('');
                $$('cpp-project-status').setValue('');
        
                $$('cpp-reset').enable();
                $$('cpp-search').enable();
        
                $$('cpp-ok').disable();
        
                if (chooseProjectGrid)
                    chooseProjectGrid.clear();
                changeCount(0);
            };
        
            const changeCount = count => {
                Utils.setText('cpp-proj-count', `Displaying ${count} Projects`);
            };

            // Setup drop downs.
            bindToEnum('cpp-projectId-criteria', StringCriteriaMatcher, StringCriteriaMatcher.EXACT_MATCH);
            bindToEnum('cpp-project-summary-criteria', StringCriteriaMatcher, StringCriteriaMatcher.CONTAINS);

            const initDataGrid = () => {
                const columnDefs = [
                    {headerName: '', field: 'projectId', hide: true},
                    {headerName: 'ID', field: 'projectName', maxWidth: 75},
                    {headerName: 'Summary', field: 'description'},
                    {headerName: 'Requesting Company', field: 'requestingCompanyName', maxWidth: 150},
                    {headerName: 'Category Code', field: 'projectCategoryCode', maxWidth: 115},
                    {headerName: 'Type Code', field: 'projectTypeCode', maxWidth: 115},
                    {headerName: 'Status Code', field: 'projectStatusCode', maxWidth: 100},
                    {headerName: '', field: 'projectSponsorName', hide: true},
                    {headerName: '', field: 'billable', hide: true},
                    {headerName: '', field: 'externalReference', hide: true}
                ];
                chooseProjectGrid = new AGGrid('cpp-projects-grid', columnDefs, 'projectId');
                chooseProjectGrid.show();
            };

            initDataGrid();
        
            reset();

            const toggleControls = disabled => {
                if (disabled) {
                    $$('cpp-projectId-criteria').disable();
                    $$('cpp-projectId-search').disable();
                    $$('cpp-project-summary-criteria').disable();
                    $$('cpp-project-summary-search').disable();
                    $$('cpp-reset').disable();
                    $$('cpp-search').disable();
        
                    $$('cpp-ok').enable();
                } else {
                    $$('cpp-projectId-criteria').enable();
                    $$('cpp-projectId-search').enable();
                    $$('cpp-project-summary-criteria').enable();
                    $$('cpp-project-summary-search').enable();
                    $$('cpp-reset').enable();
                    $$('cpp-search').enable();
        
                    $$('cpp-ok').disable();
                }
            };

            listSmartChooser([
                {tag: 'cpp-project-company', url: 'searchCompany', ID: 'id', label: 'name'},
                {tag: 'cpp-project-category', url: 'searchProjectCategories', ID: 'id', label: 'code'},
                {tag: 'cpp-project-type', url: 'searchProjectTypes', ID: 'id', label: 'code'},
                {tag: 'cpp-project-status', url: 'searchProjectStatuses', ID: 'id', label: 'code'},
            ]);
            $$('cpp-project-company').setSelectFunction(() => executeSelectFunc('cpp-project-company', companySelection, 'companyId', 'name'));
            $$('cpp-project-category').setSelectFunction(() => executeSelectFunc('cpp-project-category', categorySelection, 'projectCategoryId', 'code'));
            $$('cpp-project-type').setSelectFunction(() => executeSelectFunc('cpp-project-type', projectTypeSelection, 'projectTypeId', 'code'));
            $$('cpp-project-status').setSelectFunction(() => executeSelectFunc('cpp-project-status', projectStatusSelection, 'projectStatusId', 'code'));
            
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            $$('cpp-project-choose-type').onChange(async () => {
                if ($$('cpp-project-choose-type').getValue() === 'true') {
                    chooseProjectGrid.clear();
                    changeCount(0);

                    toggleControls(true);
                } else {
                    toggleControls(false);
                }
            });

            $$('cpp-reset').onclick(reset);
            $$('cpp-search').onclick(async () => {
                const inParams = {
                    projectName: $$('cpp-projectId-search').getValue(),
                    projectNameSearchType: $$('cpp-projectId-criteria').getValue(),
                    summary: $$('cpp-project-summary-search').getValue(),
                    projectSummarySearchType: $$('cpp-project-summary-criteria').getValue(),
                    category: $$('cpp-project-category').getValue(),
                    companyId: $$('cpp-project-company').getValue(),
                    personId: '',
                    quickList: $$('cpp-project-choose-type').getValue(),
                    status: $$('cpp-project-status').getValue(),
                    typex: $$('cpp-project-type').getValue()
                };
        
                const data = await AWS.callSoap(WS, 'searchProjects', inParams);
        
                // Clear the grid.
                chooseProjectGrid.clear();
        
                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    chooseProjectGrid.addRecords(records);
        
                    const projCount = Utils.assureArray(data.item).length;
                    changeCount(projCount);
                } else {
                    changeCount(0);
                }
            });
            
            const ok = async () => {
                let project = chooseProjectGrid.getSelectedRow();

                if (!project)
                    project = null;

                resolve(project);
                Utils.popup_close();
            };
        
            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };
        
            chooseProjectGrid.setOnSelectionChanged($$('cpp-ok').enable);
            chooseProjectGrid.setOnRowDoubleClicked(ok);

            $$('cpp-ok').onclick(ok);
            $$('cpp-cancel').onclick(cancel);

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const orgGroupPopup = (parentId, groupId, name = "") => {

        const tabContainer = new TabContainer('ogp-tab-container');
        tabContainer.selectTab('ogp-address-TabButton');

        let data = {};

        countriesToDropDown('ogp-country');
        statesToDropDown('ogp-states', getStatesForCountry($$('ogp-country').getValue()));

        $$('ogp-default-project').forceSelect();
        $$('ogp-default-project').setSelectFunction(() => executeSelectFunc('ogp-default-project', chooseProject, 'projectId', 'description'));

        function handleTimesheetPeriodType() {
            let val = $$('ogp-timesheet-period-type').getValue();
            if (val === 'W' || val === 'B') {
                $('.weekly-option').show();
            } else {
                $('.weekly-option').hide();
            }
        }
        $$('ogp-timesheet-period-type').onChange(handleTimesheetPeriodType);

        function setSelectedDays(value, enabled) {
            if (value && value.length === 5)
            {
                $$('ogp-evaluation-monday').setValue( value[0] === 'Y' );
                $$('ogp-evaluation-tuesday').setValue( value[1] === 'Y' );
                $$('ogp-evaluation-wednesday').setValue( value[2] === 'Y' );
                $$('ogp-evaluation-thursday').setValue( value[3] === 'Y' );
                $$('ogp-evaluation-friday').setValue( value[4] === 'Y' );
            }

            if (enabled) {
                $$('ogp-evaluation-monday').enable();
                $$('ogp-evaluation-tuesday').enable();
                $$('ogp-evaluation-wednesday').enable();
                $$('ogp-evaluation-thursday').enable();
                $$('ogp-evaluation-friday').enable();
            } else {
                $$('ogp-evaluation-monday').disable();
                $$('ogp-evaluation-tuesday').disable();
                $$('ogp-evaluation-wednesday').disable();
                $$('ogp-evaluation-thursday').disable();
                $$('ogp-evaluation-friday').disable();
            }
        }

        function getSelectedDays()
        {
            let ret = "";
            ret += $$('ogp-evaluation-monday').getValue() ? 'Y' : 'N';
            ret += $$('ogp-evaluation-tuesday').getValue() ? 'Y' : 'N';
            ret += $$('ogp-evaluation-wednesday').getValue() ? 'Y' : 'N';
            ret += $$('ogp-evaluation-thursday').getValue() ? 'Y' : 'N';
            ret += $$('ogp-evaluation-friday').getValue() ? 'Y' : 'N';

            return ret;
        }

        function handleEmailNotification() {
            let val = $$('ogp-email-notifications').getValue();
            if (val === 'I' && Object.keys(data).length) {
                if (data.evalEmailNotifyInherited === 'Y') {
                    $$('ogp-evaluation-label').setValue('Inherited:  Evaluation Notifications are ON.  Values displayed below.');
                    setSelectedDays(data.evalEmailNotifySendDaysInherited, true);
                } else {
                    $$('ogp-evaluation-label').setValue('Inherited:  Evaluation Notifications are OFF.');
                    setSelectedDays('NNNNN', false);
                }
                $$('ogp-evaluation-label').show();
            } else {
                if (data) {
                    setSelectedDays(data.evalEmailNotifySendDays, true);
                }
                
                $$('ogp-evaluation-label').hide();
            }
        }
        $$('ogp-email-notifications').onChange(handleEmailNotification);

        Utils.popup_open('org-group-popup', 'ogp-name');

        return new Promise(async function (resolve, reject) {

            let calls = [];

            let p1 = AWS.callSoap(WS, 'listPaySchedules', {});
            calls.push(p1);
            let p2 = AWS.callSoap(WS, 'listBenefitClasses', {});
            calls.push(p2);
            let p3 = AWS.callSoap(WS, 'getInheritedPaySchedule', {orgGroupId: parentId});
            calls.push(p3);
            let p4 = AWS.callSoap(WS, 'searchProjects', {orgGroupId: parentId});
            calls.push(p4);
            let p5 = AWS.callSoap(WS, 'getInheritedDefaultProject', {orgGroupId: parentId});
            calls.push(p5);
            let p6 = AWS.callSoap(WS, 'getParentPayPeriods', {id: parentId});
            calls.push(p6);

            if (!groupId) {
                $$('ogp-title').setValue('Add Company Organizational Group');
            } else {
                $$('ogp-title').setValue('Edit Company Organizational Group');

                let p7 = AWS.callSoap(WS, 'loadGroup', {groupId: groupId});
                calls.push(p7);
            }

            $$('ogp-name').clear();
            $$('ogp-id').clear();
            $$('ogp-address-line1').clear();
            $$('ogp-address-line2').clear();
            $$('ogp-city').clear();
            $$('ogp-zip-code').clear();
            $$('ogp-county').clear();
            $$('ogp-phone').clear();
            $$('ogp-fax').clear();
            $$('ogp-pay-schedule').clear();
            $$('ogp-week').setValue("");
            $$('ogp-pay-periods-per-year').clear();
            $$('ogp-show-billable').setValue("I");
            $$('ogp-timesheet-period-type').setValue("I");
            $$('ogp-email-notifications').setValue("I");
            $$('ogp-eval-email-first-days').setValue(0);
            $$('ogp-eval-email-notify-days').setValue(0);
            $$('ogp-evaluation-monday').clear();
            $$('ogp-evaluation-tuesday').clear();
            $$('ogp-evaluation-wednesday').clear();
            $$('ogp-evaluation-thursday').clear();
            $$('ogp-evaluation-friday').clear();
            $$('ogp-eeo-establishment').clear();
            $$('ogp-eeo-HQ').clear();
            $$('ogp-eeo-filed-last-year').clear();
            $$('ogp-eeo-unit-number').clear();
            $$('ogp-evaluation-label').hide();

            handleTimesheetPeriodType();
            handleEmailNotification();

            $$('ogp-name').setValue(name);

            await AWS.callAll(calls,
                function (ret) {
                    fillDropDownFromService('ogp-pay-schedule', ret, 'id', 'name');
                },
                function (ret) {
                    fillDropDownFromService('ogp-default-benefit-class', ret, 'id', 'name');
                },
                function (ret) {
                    // getInheritedPaySchedule
                    $$('ogp-parent-pay-schedule').setValue(ret.payScheduleName);
                },
                function (ret) {
                    // searchProjects
                },
                function (ret) {
                    // getInheritedDefaultProject
                    $$('ogp-parent-default-project').setValue(ret.projectFormatted);
                    $$('ogp-inherited-day').setValue(ret.inheritedNewWeekBeginDay);                    
                },
                function (ret) {
                    // getParentPayPeriods
                    $$('ogp-parent-pay-periods-per-year').setValue(ret.payPeriodsPerYear);
                },
                function (ret) {
                    // loadGroup
                    $$('ogp-address-line1').setValue(ret.addressLine1);
                    $$('ogp-address-line2').setValue(ret.addressLine2);
                    $$('ogp-city').setValue(ret.city);
                    $$('ogp-country').setValue(ret.country);
                    $$('ogp-county').setValue(ret.county);
                    $$('ogp-eeo-establishment').setValue(ret.eeoEstablishment);
                    $$('ogp-eeo-filed-last-year').setValue(ret.eeoFiledLastYear);
                    $$('ogp-eeo-HQ').setValue(ret.eeoHQ);
                    $$('ogp-eeo-unit-number').setValue(ret.eeoUnitNumber);
                    $$('ogp-eval-email-first-days').setValue(ret.evalEmailFirstDays);
                    $$('ogp-email-notifications').setValue(ret.evalEmailNotify);
                    $$('ogp-eval-email-notify-days').setValue(ret.evalEmailNotifyDays);
                    $$('ogp-fax').setValue(ret.mainFaxNumber);
                    $$('ogp-phone').setValue(ret.mainPhoneNumber);
                    $$('ogp-week').setValue(ret.newWeekBeginDay);
                    $$('ogp-parent-default-benefit-class').setValue(ret.parentBenefitClassFormatted);
                    $$('ogp-parent-pay-periods-per-year').setValue(ret.parentPayPeriodsPerYear);
                    $$('ogp-pay-periods-per-year').setValue(ret.payPeriodsPerYear);
                    $$('ogp-pay-schedule').setValue(ret.payScheduleId);
                    $$('ogp-states').setValue(ret.stateProvince);
                    $$('ogp-period-start-date').setValue(ret.timesheetPeriodStartDate);
                    $$('ogp-timesheet-period-type').setValue(ret.timesheetPeriodType);
                    $$('ogp-show-billable').setValue(ret.timesheetShowBillable);
                    $$('ogp-zip-code').setValue(ret.zipPostalCode);

                    data = ret;

                    handleTimesheetPeriodType();
                    handleEmailNotification();
                }
            );

            const ok = () => {
                if ($$('ogp-name').isError('Name'))
                    return;

                let data = {
                    addressLine1: $$('ogp-address-line1').getValue(),
                    addressLine2: $$('ogp-address-line2').getValue(),
                    city: $$('ogp-city').getValue(),
                    country: $$('ogp-country').getValue(),
                    county: $$('ogp-county').getValue(),
                    defaultProjectId: $$('ogp-default-project').getValue(),
                    benefitClassId: $$('ogp-default-benefit-class').getValue(),
                    eeoEstablishment: $$('ogp-eeo-establishment').getValue(),
                    eeoHQ: $$('ogp-eeo-HQ').getValue(),
                    eeoFiledLastYear: $$('ogp-eeo-filed-last-year').getValue(),
                    eeoUnitNumber: $$('ogp-eeo-unit-number').getValue(),
                    name: $$('ogp-name').getValue(),
                    mainFaxNumber: $$('ogp-fax').getValue(),
                    mainPhoneNumber: $$('ogp-phone').getValue(),
                    payPeriodsPerYear: $$('ogp-pay-periods-per-year').getValue(),
                    payScheduleId: $$('ogp-pay-schedule').getValue(),
                    stateProvince: $$('ogp-states').getValue(),
                    zipPostalCode: $$('ogp-zip-code').getValue(),
                    evalEmailNotify: $$('ogp-email-notifications').getValue(),
                    evalEmailNotifyDays: $$('ogp-eval-email-notify-days').getValue(),
                    evalEmailFirstDays: $$('ogp-eval-email-first-days').getValue(),
                    evalEmailNotifySendDays: getSelectedDays(),
                    newWeekBeginDay: $$('ogp-week').getValue(),
                    timesheetPeriodType: $$('ogp-timesheet-period-type').getValue(),
                    timesheetPeriodStartDate: $$('ogp-period-start-date').getIntValue(),
                    timesheetShowBillable: $$('ogp-show-billable').getValue(),
                };
                
                resolve(data);
                Utils.popup_close();
            };
        
            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };
        
            $$('ogp-ok').onclick(ok);
            $$('ogp-cancel').onclick(cancel);
        });
    };

    const associateGroup = (orgGroupId) => {
        let formSearchGrid;
        
        Utils.popup_open('associate-group');

        return new Promise(async function (resolve, reject) {
            
            const reset = () => {
                $$('agp-associate-indicator-type').setValue('2');

                $$('agp-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('agp-name-criteria').enable();

                $$('agp-name-search').clear();
                $$('agp-name-search').enable();

                $$('agp-reset').enable();
                $$('agp-search').enable();

                $$('agp-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('agp-count', `Displaying ${count} Company Organizational Units`);
            };

            const ok = () => {
                let data = {
                    parentGroupID: orgGroupId,
                    childGroupID: [formSearchGrid.getSelectedRow().orgGroupId]
                };

                AWS.callSoap(WS, 'addGroupToGroup', data).then(res => {
                    if (res.wsStatus === '0') {
                        resolve(null);
                        reset();
                        Utils.popup_close();
                    }
                });
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('agp-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Company Organizational Unit Name', field: 'name', width: 80},
                    {headerName: 'ID', field: 'externalId', width: 30},
                    {headerName: 'Type', field: 'typex', width: 25},
                ];

                formSearchGrid = new AGGrid('agp-grid', columnDefs, 'orgGroupId');
                formSearchGrid.show();
            };

            initDataGrid();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('agp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('agp-reset').onclick(reset);

            $$('agp-search').onclick(async () => {
                let inParams = {
                    name: $$('agp-name-search').getValue(),
                    nameSearchType: $$('agp-name-criteria').getValue(),
                    associatedIndicator: $$('agp-associate-indicator-type').getValue(),
                    orgGroupId: orgGroupId
                };

                let data = await AWS.callSoap(WS, 'searchOrgGroups', inParams);
                // Clear the grid.
                formSearchGrid.clear();

                if (data.orgGroups) {
                    let records = Utils.assureArray(data.orgGroups);
                    formSearchGrid.addRecords(records);

                    let count = Utils.assureArray(data.orgGroups).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });

            $$('agp-ok').onclick(ok);

            $$('agp-cancel').onclick(cancel);

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    $$('org-group-add').onclick(async () => {
        let parentGroupId = screenStack[screenStack.length-1];
        let data = await orgGroupPopup(parentGroupId);
        if (data) {
            AWS.callSoap(WS, 'newGroup', { ...data, parentGroupId: parentGroupId}).then(res => {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
                }
            });
        }
    });

    $$('org-group-edit').onclick(async () => {
        let parentGroupId = screenStack[screenStack.length-1];
        let row = orgGroupGrid.getSelectedRow();
        let data = await orgGroupPopup(parentGroupId, row.orgGroupId, row.name);
        if (data) {
            AWS.callSoap(WS, 'saveGroup', { ...data, orgGroupId: row.orgGroupId}).then(res => {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
                }
            })
        }
    });

    $$('org-group-delete').onclick(async () => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Company Organizational Group?', () => {
            const data = {
                groupIds: [orgGroupGrid.getSelectedRow().orgGroupId]
            };
            
            AWS.callSoap(WS, "deleteGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(screenStack[screenStack.length-1], nameStack[nameStack.length-1]);
                }
            });            
        });
    });

    $$('org-group-associate').onclick(async () => {
        let parentGroupId = screenStack[screenStack.length-1];
        await associateGroup(parentGroupId);  
        updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
    });

    $$('org-group-disassociate').onclick(async () => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to disassociate the selected Company Organizational Group?', () => {
            const data = {
                childGroupIDs: [orgGroupGrid.getSelectedRow().orgGroupId],
                parentGroupID: screenStack[screenStack.length-1]
            };
            
            AWS.callSoap(WS, "removeGroupFromGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(screenStack[screenStack.length-1], nameStack[nameStack.length-1]);
                }
            });            
        });
    });

    const workerPopup = (groupId, personId) => {

        const editMode = !!personId;

        let addWorkerTabContainer = null;
        let newPersonDefaultExternalId = null;
        let screenGroupId, securityGroupId;

        /**
         * Show a drop down or a text input for entering state, depending on the value of the country drop down.
         */
        const filterState = () => {
            let states = getStatesForCountry($$('countries').getValue());

            if (states != null) {
                statesToDropDown('stateDropDown', states);

                $$('stateDropDown').show();
                $$('state').hide();
            } else {
                $$('stateDropDown').hide();
                $$('state').show();
            }
        };

        const toggleAssignLogin = disabled => {
            if (disabled) {
                $$('loginId').disable();
                $$('screenGroup').disable();
                // $$('scrGrpSearch').disable();

                $$('passwordzz').disable();
                $$('securityGroup').disable();
                // $$('secGrpSearch').disable();

                $$('confirmPassword').disable();
                $$('loginStatusGrp').disable('loginStatusActive');
                $$('loginStatusGrp').disable('loginStatusInactive');

                $$('showPasswords').disable();
            } else {
                $$('loginId').enable();
                $$('screenGroup').enable();
                // $$('scrGrpSearch').enable();

                $$('passwordzz').enable();  // This line is doing it
                $$('securityGroup').enable();
                // $$('secGrpSearch').enable();

                $$('confirmPassword').enable().clear();
                $$('loginStatusGrp').enable('loginStatusActive');
                $$('loginStatusGrp').enable('loginStatusInactive');

                $$('showPasswords').enable();
            }
        };

        const resetDialog = () => {
            // Basic tab.
            $$('firstName').clear();
            $('#ssn').val('');
            $$('middleName').clear();
            $$('workerId').clear();
            $$('lastName').clear();
            $$('dob').clear();
            $$('nickName').clear();
            $$('email').clear();
            $$('sexGrp').setValue('M');
            $$('workerTypeGrp').setValue('E');
    
            // Address tab.
            $$('addrLine1').clear();
            $$('homePhone').clear();
            $$('addrLine2').clear();
            $$('workPhone').clear();
            $$('countries').clear();
            $$('mobilePhone').clear();
            $$('city').clear();
            $$('fax').clear();
            $$('stateDropDown').clear();
            $$('state').clear();
            $$('zipCode').clear();
            $$('county').clear();
    
            // Position tab.
            $$('status').clear().disable(editMode);
            $$('benefitClass').clear();
            $$('statusDate').clear().disable(editMode);
            $$('hrAdmin').clear();
            $$('citizenOf').clear();
            $$('position').clear().disable(editMode);
            $$('visa').clear();
            $$('jobTitle').clear();
            $$('visaStatus').clear();
            $$('i9Completed').clear();
            $$('wageType').clear().disable(editMode);
            $$('visaExpiration').clear();
            $$('wage').clear().disable(editMode);
            $$('eeoCat').clear();
            $$('eeoRace').clear();
    
            // Misc tab.
            $$('tobUseGrp').setValue('U');
            $$('driversLicenseNumber').clear();
            $$('driversLicenseState').clear();
            $$('driversLicenseExpiry').clear();
            $$('autoInsCarrier').clear();
            $$('autoInsPolicyNo').clear();
            $$('autoInsBegin').clear();
            $$('autoInsExpire').clear();
            $$('autoInsCoverage').clear();
            $$('projectInheritedFrom').clear();
            // $$('employeeOverride').clear();
    
            // Login tab.
            $$('assignLogin').clear();
            $$('loginId').clear();
            $$('passwordzz').clear();
            $$('confirmPassword').clear();
            $$('showPasswords').clear();
            $$('screenGroup').clear();
            $$('securityGroup').clear();
            $$('loginStatusGrp').setValue('true');
    
            // Disable the login tab content.
            toggleAssignLogin(true);
    
            // Select the first tab.
            addWorkerTabContainer.selectTab('basicTabButton');
        };

        /**
         * Initialize the new worker dialog.
         */
        const initDialog = async () => {
            // Setup tab layout.
            addWorkerTabContainer = new TabContainer('addWorkerTabContainer');

            resetDialog();

            // Populate the countries and state drop downs.
            countriesToDropDown('countries');
            countriesToDropDown('citizenOf');

            // Force state filter according to country. This is necessary because the countries drop down
            // initial value change does not trigger an event.
            filterState();

            statesToDropDown('driversLicenseState', US_STATE_ABBREVIATIONS);

            let data = await AWS.callSoap(WS, 'loadMeta');

            newPersonDefaultExternalId = data.newPersonDefaultExternalId;

            $$('employeeOverride').forceSelect();
            $$('employeeOverride').setSelectFunction(() => executeSelectFunc('employeeOverride', chooseProject, 'projectId', 'description'));

            let p1 = AWS.callSoap(WS, 'listEEOCategories', {});
            let p2 = AWS.callSoap(WS, 'listEEORaces', {});
            let p3 = AWS.callSoap(WS, 'listEmployeeStatuses', {});
            let p4 = AWS.callSoap(WS, 'listPositions', {});
            let p5 = AWS.callSoap(WS, 'listWageTypes', {});
            let p6 = AWS.callSoap(WS, 'listBenefitClasses', {});
            let p7 = AWS.callSoap(WS, 'getInheritedDefaultProject', {});

            await AWS.callAll([p1, p2, p3, p4, p5, p6, p7],
                data => fillDropDownFromService('eeoCat', data, 'eeoCategoryId', 'name'),
                data => fillDropDownFromService('eeoRace', data, 'EEORaceId', 'name'),
                data => fillDropDownFromService('status', data, 'employeeStatusId', 'name'),
                data => fillDropDownFromService('position', data, 'positionId', 'positionName'),
                data => fillDropDownFromService('wageType', data, 'id', 'name'),
                data => fillDropDownFromService('benefitClass', data, 'id', 'name'),
                data => $$('projectInheritedFrom').setValue(data.projectFormatted)
            );

            /**
             * The functionality to load screen and security groups are put in a function for multiple access, which will
             * also be called after loading dependant and applicant data.
             */
            const loadScreenAndSecurityGroups = async () => {
                let inData = {
                    searchTopLevelOnly: true,
                    screenGroupId: screenGroupId
                };
                let data = await AWS.callSoap(WS, 'searchScreenGroups', inData);

                fillDropDownFromService('screenGroup', data, 'id', 'title', '(choose)',
                    'screenDef', item => {
                        return `${item.extId} - ${item.title}`;
                    });

                inData = {
                    securityGroupId: securityGroupId
                };
                data = await AWS.callSoap(WS, 'searchSecurityGroups', inData);
                fillDropDownFromService('securityGroup', data, 'groupId', 'name', '(choose)');
            };

            // Initial call.
            await loadScreenAndSecurityGroups();

            if (personId) {
                const inData = {
                    groupId: groupId,
                    personId: personId
                };
                const data = await AWS.callSoap(WS, 'loadEmployee', inData);

                $$('addrLine1').setValue(data.addressLine1);
                $$('addrLine2').setValue(data.addressLine2);
                $$('autoInsCarrier').setValue(data.automotiveInsuranceCarrier);
                $$('autoInsCoverage').setValue(data.automotiveInsuranceCoverage);
                $$('autoInsExpire').setValue(data.automotiveInsuranceExpirationDate);
                $$('autoInsPolicyNo').setValue(data.automotiveInsurancePolicyNumber);
                $$('autoInsBegin').setValue(data.automotiveInsuranceStartDate);
                $$('benefitClass').setValue(data.benefitClassId);
                $$('loginStatusGrp').setValue(data.canLogin);
                $$('city').setValue(data.city);
                $$('countries').setValue(data.country);
                $$('county').setValue(data.county);
                $$('dob').setValue(data.dob);
                $$('driversLicenseExpiry').setValue(data.driversLicenseExpirationDate);
                $$('driversLicenseNumber').setValue(data.driversLicenseNumber);
                $$('driversLicenseState').setValue(data.driversLicenseState);
                $$('workerId').setValue(data.extRef);
                $$('status').setValue(data.employeeStatusId);
                $$('statusDate').setValue(data.employeeStatusDate);
                $$('eeoCat').setValue(data.eeoCategoryId);
                $$('eeoRace').setValue(data.eeoRaceId);
                $$('firstName').setValue(data.fname);
                $$('homePhone').setValue(data.homePhone);
                $$('jobTitle').setValue(data.jobTitle);
                $$('lastName').setValue(data.lname);
                $$('loginId').setValue(data.login);
                $$('middleName').setValue(data.middleName);
                $$('mobilePhone').setValue(data.mobilePhone);
                $$('nickName').setValue(data.nickName);
                $$('passwordzz').setValue(data.password);
                $$('position').setValue(data.positionId);
                $$('email').setValue(data.personalEmail);
                $$('workerTypeGrp').setValue(data.workerType);
                $$('supervisor').setValue(data.primaryIndicator);
                $$('visa').setValue(data.visa);
                $$('visaExpiration').setValue(data.visaExpirationDate);
                $$('visaStatus').setValue(data.visaStatusDate);
                $$('i9Completed').setValue(data.i9Completed);
                $$('wage').setValue(data.wageAmount);
                $$('wageType').setValue(data.wageTypeId);

                screenGroupId = data.screenGroupId;
                securityGroupId = data.securityGroupId;
                $$('screenGroup').setValue(data.screenGroupId);
                $$('securityGroup').setValue(data.securityGroupId);

                $$('sexGrp').setValue(data.sex);
                $('#ssn').val(data.ssn);
                $$('tobUseGrp').setValue(data.tabaccoUse);
                $$('fax').setValue(data.workFax);
                $$('workPhone').setValue(data.workPhone);
                $$('zipCode').setValue(data.zipPostalCode);
                $$('state').setValue(data.stateProvince);
                $$('stateDropDown').setValue(data.stateProvince);

                // Check whether there is an assigned login and enable the fields.
                if ($$('loginId').getValue().length > 0) {
                    $$('assignLogin').setValue(true);
                    toggleAssignLogin(false);
                    // Reload screen and security groups.
                    //loadScreenAndSecurityGroups();
                } else {
                    toggleAssignLogin(true);
                }

 //               filterState();
            }

            // Set the dialog title.
            if ( !personId ) {
                Utils.setText('wp-title', 'Add Worker');
            } else {
                Utils.setText('wp-title', 'Edit Worker');
            }
        };

        initDialog();

        Utils.popup_open('worker-popup');

        return new Promise(async function (resolve, reject) {
            //==================================================================================================================
            // Event handlers start.
            //==================================================================================================================

            $$('countries').onChange(filterState);

            $$('assignLogin').onChange(() => toggleAssignLogin(!$$('assignLogin').getValue()));

            $('#ssn').on('focusout', () => {
                const ctl = $('#ssn');
                ctl.val(Utils.formatSsn(ctl.val()));
            });
        
            $('#ssn').on('input', () => {
                const ctl = $('#ssn');
                let val = ctl.val().trim();
                val = val.replace(/[^0-9-]/g, '');  // remove characters
                let ndigits = 0;
                let ndash = 0;
                for (let i = 0; i < val.length; i++)
                    if (val.charAt(i) === '-')
                        ndash++;
                    else
                        ndigits++;
                if (ndash > 2 || ndigits > 9)
                    val = Utils.drop(val, -1);
                ctl.val(val);
            });

            $$('position').onChange(() => {
                if ($$('position').getValue() === '')
                    $$('benefitClass').setValue('');
                else {
                    let position = $$('position').getData();
                    $$('benefitClass').setValue(position.benefitClassId);
                }
            });

            $$('showPasswords').onChange(v => {
                Utils.togglePwdVisibility('passwordzz', v);
                Utils.togglePwdVisibility('confirmPassword', v);
            });
            
            $$('addWorkerOK').onclick(() => {
        
                if ($$('firstName').isError('First name')) {
                    return addWorkerTabContainer.selectTab('basicTabButton');
                }
        
                if ($$('lastName').isError('Last name')) {
                    return addWorkerTabContainer.selectTab('basicTabButton');
                }

                if ($$('status').isError('Status')) {
                    return addWorkerTabContainer.selectTab('posTabButton');
                }

                if ($$('statusDate').isError('Status Date')) {
                    return addWorkerTabContainer.selectTab('posTabButton');
                }

                if ($$('wageType').isError('Wage Type')) {
                    return addWorkerTabContainer.selectTab('posTabButton');
                }
        
                // See if the user requested a login.
                if ($$('assignLogin').getValue() === true) {
                    if ($$('loginId').isError('Login ID')) {
                        return addWorkerTabContainer.selectTab('loginTabButton');
                    }
                    if ($$('passwordzz').isError('Password')) {
                        return addWorkerTabContainer.selectTab('loginTabButton');
                    }
                    if ($$('passwordzz').getValue() !== $$('confirmPassword').getValue()) {
                        Utils.showMessage('Error', 'Passwords must match');
                        addWorkerTabContainer.selectTab('loginTabButton');
                        $$('confirmPassword').clear();
                        return;
                    }
        
                    if ($$('screenGroup').getValue() === '') {
                        Utils.showMessage('Error', 'Screen group is required');
                        addWorkerTabContainer.selectTab('loginTabButton');
                        return;
                    }
        
                    if ($$('securityGroup').getValue() === '') {
                        Utils.showMessage('Error', 'Security group is required');
                        addWorkerTabContainer.selectTab('loginTabButton');
                        $$('securityGroup').focus();
                        return;
                    }
                }
        
                let assignLogin = $$('assignLogin').getValue();
                let stateSelection = Utils.isVisible('stateDropDown');
        
                const resData = {
                    hrAdmin: $$('hrAdmin').getValue(),
                    addressLine1: $$('addrLine1').getValue(),
                    addressLine2: $$('addrLine2').getValue(),
                    automotiveInsuranceCarrier: $$('autoInsCarrier').getValue(),
                    automotiveInsuranceCoverage: $$('autoInsCoverage').getValue(),
                    automotiveInsuranceExpirationDate: $$('autoInsExpire').getIntValue(),
                    automotiveInsurancePolicyNumber: $$('autoInsPolicyNo').getValue(),
                    automotiveInsuranceStartDate: $$('autoInsBegin').getIntValue(),
                    benefitClass: $$('benefitClass').getValue(),
                    canLogin: assignLogin ? $$('loginStatusGrp').getValue() : null,
                    citizenship: $$('citizenOf').getValue(),
                    city: $$('city').getValue(),
                    country: $$('countries').getValue(),
                    county: $$('county').getValue(),
                    defaultProjectId: $$('employeeOverride').getValue(),
                    dob: $$('dob').getIntValue(),
                    driversLicenseExpirationDate: $$('driversLicenseExpiry').getIntValue(),
                    driversLicenseNumber: $$('driversLicenseNumber').getValue(),
                    driversLicenseState: $$('driversLicenseState').getValue(),
                    eeoCategoryId: $$('eeoCat').getValue(),
                    eeoRaceId: $$('eeoRace').getValue(),
                    empPassword: assignLogin ? $$('passwordzz').getValue() : null,
                    employeeStatusDate: $$('statusDate').getIntValue(),
                    employeeStatusId: $$('status').getValue(),
                    extRef: $$('workerId').getValue(),
                    fname: $$('firstName').getValue(),
                    homePhone: $$('homePhone').getValue(),
                    i9Completed: $$('i9Completed').getValue(),
                    primaryIndicator: $$('supervisor').getValue(),
                    jobTitle: $$('jobTitle').getValue(),
                    lname: $$('lastName').getValue(),
                    login: assignLogin ? $$('loginId').getValue() : null,
                    middleName: $$('middleName').getValue(),
                    mobilePhone: $$('mobilePhone').getValue(),
                    nickName: $$('nickName').getValue(),
                    noCompanyScreenGroupId: null, // assignLogin && HrParent.multiCompSupport ? $$('noCompScreenGroup').getValue() : null,
                    personalEmail: $$('email').getValue(),
                    positionId: $$('position').getValue(),
                    screenGroupId: assignLogin ? $$('screenGroup').getValue() : null,
                    securityGroupId: assignLogin ? $$('securityGroup').getValue() : null,
                    sex: $$('sexGrp').getValue(),
                    ssn: $('#ssn').val(),
                    stateProvince: stateSelection ? $$('stateDropDown').getValue() : $$('state').getValue(),
                    tabaccoUse: $$('tobUseGrp').getValue(),
                    visa: $$('visa').getValue(),
                    visaExpirationDate: $$('visaExpiration').getIntValue(),
                    visaStatusDate: $$('visaStatus').getIntValue(),
                    wageAmount: $$('wage').getValue(),
                    wageTypeId: $$('wageType').getValue(),
                    workFax: $$('fax').getValue(),
                    workPhone: $$('workPhone').getValue(),
                    zipPostalCode: $$('zipCode').getValue(),
                    workerType: $$('workerTypeGrp').getValue()
                };
        
                resolve(resData);
                Utils.popup_close();
            });

            $$('addWorkerCancel').onclick(() => {
                resolve(null);
                Utils.popup_close();
            });
        
            //==================================================================================================================
            // Handlers end.
            //==================================================================================================================
        });
    };

    const associateEmployee = (orgGroupId) => {
        let formSearchGrid;
        
        Utils.popup_open('associate-employee');

        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('aep-associate-indicator-type').setValue('2');

                $$('aep-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('aep-fname-search').clear();

                $$('aep-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('aep-lname-search').clear();

                $$('aep-ssn').clear();

                $$('aep-reset').enable();
                $$('aep-search').enable();

                $$('aep-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('aep-count', `Displaying ${count} Employees`);
            };

            const ok = () => {
                let data = {
                    groupId: orgGroupId,
                    personIds: [formSearchGrid.getSelectedRow().personId]
                };

                AWS.callSoap(WS, 'assignPersonToOrgGroup', data).then(res => {
                    if (res.wsStatus === '0') {
                        resolve(null);
                        reset();
                        Utils.popup_close();
                    }
                });
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('aep-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('aep-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lname', width: 80},
                    {headerName: 'First Name', field: 'fname', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 60},
                ];

                formSearchGrid = new AGGrid('aep-grid', columnDefs, 'personId');
                formSearchGrid.show();
            };

            initDataGrid();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('aep-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('aep-reset').onclick(reset);

            $$('aep-search').onclick(() => {
                let inParams = {
                    firstName: $$('aep-fname-search').getValue(),
                    firstNameSearchType: $$('aep-fname-criteria').getValue(),
                    lastName: $$('aep-lname-search').getValue(),
                    lastNameSearchType: $$('aep-lname-criteria').getValue(),
                    ssn: $$('aep-ssn').getValue(),
                    associatedIndicator: $$('aep-associate-indicator-type').getValue(),
                    orgGroupId: orgGroupId
                };

                AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                    if (data.wsStatus === '0') {

                        // Clear the grid.
                        formSearchGrid.clear();

                        if (data.employees) {
                            let records = Utils.assureArray(data.employees);
                            formSearchGrid.addRecords(records);

                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            });

            $$('aep-ok').onclick(ok);

            $$('aep-cancel').onclick(cancel);

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    $$('employee-add').onclick(async () => {
        const parentGroupId = screenStack[screenStack.length-1];
        const data = await workerPopup();
        if (data) {
            AWS.callSoap(WS, 'newEmployee', { ...data, orgGroupId: parentGroupId}).then(res => {
                updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
            });
        }
    });

    async function editEmployee() {
        const parentGroupId = screenStack[screenStack.length-1];
        let row = employeesGrid.getSelectedRow();
        let data = await workerPopup(screenStack[screenStack.length-1], row.personId);;
        if (data) {
            AWS.callSoap(WS, 'saveEmployee', { ...data, orgGroupId: parentGroupId, personId: row.personId}).then(res => {
                updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
            });
        }
    }

    $$('employee-edit').onclick(editEmployee);
    employeesGrid.setOnRowDoubleClicked(editEmployee);

    $$('employee-associate').onclick(async () => {
        let parentGroupId = screenStack[screenStack.length-1];
        await associateEmployee(parentGroupId);
        updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
    });

    $$('employee-disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to disassociate the selected Company Employee?', () => {
            const data = {
                personIds: [employeesGrid.getSelectedRow().personId],
                groupId: screenStack[screenStack.length-1]
            };
            
            AWS.callSoap(WS, "removePersonFromOrgGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(screenStack[screenStack.length-1], nameStack[nameStack.length-1]);
                }
            });            
        });
    });

})();
