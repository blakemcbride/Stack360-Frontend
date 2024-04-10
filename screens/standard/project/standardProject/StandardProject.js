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
    const WS = 'StandardProjectStandardProject';

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    let projectsGrid;
 
    const projectsColumnDefs = [
        {headerName: "Summary", field: "description", width: 560},
        {headerName: "External Reference", field: "reference", width: 300},
        {headerName: "Managing Employee", field: "employeeName", width: 300}
    ];
    projectsGrid = new AGGrid('projectsGrid', projectsColumnDefs);
    projectsGrid.show();  

    function getListStandardProjects() {
        AWS.callSoap(WS, 'listStandardProjects').then(data => {
            $$('edit').disable();
            $$('delete').disable();
            if (data.wsStatus === '0') {     
                projectsGrid.clear();
                data.projects = Utils.assureArray(data.projects);
                projectsGrid.addRecords(data.projects);
                $$('sp-projectsCount').setValue('Displaying ' + data.projects.length + ' Projects');
                projectsGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                projectsGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    getListStandardProjects(); 

    const searchProjectCode = (searchType) => {
        let formSearchGrid;
        switch (searchType) {
            case 'category':
                $$('bdr-project-data-search-type').setValue('Category');
                $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Categories');
                $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Category');
                break;

            case 'type':
                $$('bdr-project-data-search-type').setValue('Type');
                $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Types');
                $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Type');
                break;

            case 'status':
                $$('bdr-project-data-search-type').setValue('Status');
                $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Status');
                break;
        
            default:
                break;
        }
        
        Utils.popup_open('bdr-project-data-search');
            
        const reset = () => {
            $$('bdr-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('bdr-proj-code-search').clear();

            $$('bdr-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('bdr-proj-descr-search').clear();

            $$('bdr-projD-reset').enable();
            $$('bdr-projD-search').enable();

            $$('bdr-projD-ok').disable();

            formSearchGrid.clear();
            $$('bdr-projD-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchType) {
                    case 'category':
                        $$('project-categoryId').setValue(row.projectCategoryId, row.code);
                        break;
        
                    case 'type':
                        $$('project-typeId').setValue(row.projectTypeId, row.code);
                        break;
        
                    case 'status':
                        $$('bdr-proj-status').setValue(row.projectStatusId, row.code);
                        break;
                
                    default:
                        break;
                }
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('bdr-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('bdr-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                {headerName: 'Code', field: 'code', width: 60},
                {headerName: 'Description', field: 'description', width: 210}
            ];

            formSearchGrid = new AGGrid('bdr-projRes-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const params = {
                code: $$('bdr-proj-code-search').getValue(),
                codeSearchType: $$('bdr-proj-code-criteria').getValue(),
                description: $$('bdr-proj-descr-search').getValue(),
                descriptionSearchType: $$('bdr-proj-descr-criteria').getValue()
            }
            if (searchType === "category") {                    
                AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                        } else {
                            $$('bdr-projD-count').setValue(`Displaying 0 Project Categories`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchType === "type") {
                AWS.callSoap(WS, 'searchProjectTypes', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Types`);
                        } else {
                            $$('bdr-projD-count').setValue(`Displaying 0 Project Types`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchType === "status") {
                AWS.callSoap(WS, 'searchProjectStatuses', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                        } else {
                            $$('bdr-projD-count').setValue(`Displaying 0 Project Statuses`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            }                
        };

        $$('bdr-projD-reset').onclick(reset);
        $$('bdr-projD-search').onclick(search);
        $$('bdr-projD-ok').onclick(ok);
        $$('bdr-projD-cancel').onclick(cancel);

        $$('bdr-project-specific').onChange(() => {
            if ($$('bdr-project-specific').getValue() === "A") {
                formSearchGrid.clear();
                $$('bdr-proj-code-criteria').disable();
                $$('bdr-proj-code-search').disable();

                $$('bdr-proj-descr-criteria').disable();
                $$('bdr-proj-descr-search').disable();

                switch (searchType) {
                    case 'category':
                        $$('bdr-proj-category').setValue(`Displaying 0 Project Categories`);
                        break;
                    
                    case 'status':
                        $$('bdr-proj-status').setValue(`Displaying 0 Project Statuses`);
                        break;

                    case 'type':
                        $$('bdr-proj-type').setValue(`Displaying 0 Project Types`);
                        break;
                
                    default:
                        break;
                }
                $$('bdr-projD-ok').enable().onclick(() => {
                    $$('bdr-proj-' + searchType).setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('bdr-proj-code-criteria').enable();
                $$('bdr-proj-code-search').enable();

                $$('bdr-proj-descr-criteria').enable();
                $$('bdr-proj-descr-search').enable();

                $$('bdr-projD-ok').enable().onclick(ok);
            }
        });

        search();
    }
    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-ssn-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('project-employeeId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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
                ssn: $$('esp-ssn-search').getValue(),
                standardProjectId: ''
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
    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    
    $$('add').onclick(() => {
        const container = new TabContainer('sp-tab-container');

        $$('project-summary').clear();
        $$('project-categoryId').clear();
        $$('project-typeId').clear();
        $$('project-applyToAll').clear();
        $$('project-detail').clear();
        $$('project-requestingPerson').clear();
        $$('project-employeeId').clear();
        $$('project-externalRef').clear();
        $$('project-billable').setValue('U');
        $$('project-billingRate').clear().disable();
        $$('project-dollarCap').clear().disable();
        $$('project-serviceItem').clear().disable();
        $$('project-showForAll').clear();

        let canSeeAllCompanies;
        AWS.callSoap(WS, 'checkRight').then(function (res) {
            if (res.wsStatus === "0") {
                canSeeAllCompanies = res.canSeeAllCompanies;
            }
        });

        const params = {
            code: '',
            codeSearchType: 2,
            description: '',
            descriptionSearchType: 2,
            standardProjectId: ''
        }
        AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-categoryId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectCategoryId, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProjectCode('category');
                });
            }
        });

        AWS.callSoap(WS, 'searchProjectTypes', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-typeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectTypeId, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProjectCode('type');
                });
            }
        });

        const employeeParams = {
            firstName: '',
            firstNameSearchType: 0,
            lastName: '',
            lastNameSearchType: 0,
            ssn: '',
            standardProjectId: ''
        };
    
        AWS.callSoap(WS, 'searchEmployees', employeeParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-employeeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].fname, res.item[0].middleName, res.item[0].lname));
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(searchEmployee);
            }
        });

        const servicesParams = {
            accountingSystemId: '',
            accountingSystemIdSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            standardProjectId: ''
        };
    
        AWS.callSoap(WS, 'searchServices', servicesParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-serviceItem');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].serviceId, res.description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
            }
        });
        Utils.popup_open('project-popup');

        function getDefaultsForCategoryAndType() {
            const params = {
                projectCategoryId: $$('project-categoryId').getValue(),
                projectTypeId: $$('project-typeId').getValue()
            };
            AWS.callSoap(WS, 'getDefaultsForCategoryAndType', params).then(res => {
                if (res.wsStatus === "0") {
                    if (!res.routeId) {
                        Utils.showMessage('Error', 'There is not a valid Project Route associated to the selected Category/Type combination.  Please note that if there is a Project Route associated to this combination, ensure that the Project Route has an Initial Route Stop and Project Status.  Projects can not be created from a Standard Project when it has an invalid Project Route.');
                    }
                }
            });
        }
        $$('project-categoryId').onChange(() => {
            if ($$('project-categoryId').getValue() && $$('project-typeId').getValue()) {
                getDefaultsForCategoryAndType();                
            }
        });
        $$('project-typeId').onChange(() => {
            if ($$('project-categoryId').getValue() && $$('project-typeId').getValue()) {
                getDefaultsForCategoryAndType();                
            }
        });

        $$('project-billable').onChange(() => {
            if ($$('project-billable').getValue() === 'Y') {
                $$('project-billingRate').enable();
                $$('project-dollarCap').enable();
                $$('project-serviceItem').enable();
            } else {
                $$('project-billingRate').disable();
                $$('project-dollarCap').disable();
                $$('project-serviceItem').disable();
            }
        });

        $$('project-save').onclick(() => {
            if ($$('project-summary').isError('Summary'))
                return;

            if ($$('project-categoryId').isError('Category Code'))
                return;

            if ($$('project-typeId').isError('Type Code'))
                return;

            const params = {
                accessibleToAll: $$('project-showForAll').getValue(),
                allCompanies: $$('project-applyToAll').getValue(),
                billable: $$('project-billable').getValue(),
                billingRate: $$('project-billingRate').getValue(),
                description: $$('project-summary').getValue(),
                detailDesc: $$('project-detail').getValue(),
                dollarCap: $$('project-dollarCap').getValue(),
                employeeId: $$('project-employeeId').getValue(),
                projectCategoryId: $$('project-categoryId').getValue(),
                projectTypeId: $$('project-typeId').getValue(),
                reference: $$('project-externalRef').getValue(),
                requesterName: $$('project-requestingPerson').getValue(),
                serviceId: $$('project-serviceItem').getValue()
            }

            AWS.callSoap(WS, 'newStandardProject', params).then(data => {
                if (data.wsStatus === '0') {     
                    getListStandardProjects();
                    Utils.popup_close();
                }
            });
        });

        $$('project-cancel').onclick(Utils.popup_close);
    });

    function edit() {
        const container = new TabContainer('sp-tab-container');

        const row = projectsGrid.getSelectedRow();

        $$('project-summary').clear();
        $$('project-categoryId').clear();
        $$('project-typeId').clear();
        $$('project-applyToAll').clear();
        $$('project-detail').clear();
        $$('project-requestingPerson').clear();
        $$('project-employeeId').clear();
        $$('project-externalRef').clear();
        $$('project-billable').setValue('U');
        $$('project-billingRate').clear().disable();
        $$('project-dollarCap').clear().disable();
        $$('project-serviceItem').clear().disable();
        $$('project-showForAll').clear();

        let canSeeAllCompanies;
        AWS.callSoap(WS, 'checkRight').then(function (res) {
            if (res.wsStatus === "0") {
                canSeeAllCompanies = res.canSeeAllCompanies;
            }
        });

        const params = {
            code: '',
            codeSearchType: 2,
            description: '',
            descriptionSearchType: 2,
            standardProjectId: row.projectId
        }
        AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-categoryId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectCategoryId, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProjectCode('category');
                });
                if (res.selectedItem) { 
                    ctl.setValue(res.selectedItem.projectCategoryId);
                }
            }
        });

        AWS.callSoap(WS, 'searchProjectTypes', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-typeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectTypeId, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProjectCode('type');
                });
                if (res.selectedItem) { 
                    ctl.setValue(res.selectedItem.projectTypeId);
                }
            }
        });

        const employeeParams = {
            firstName: '',
            firstNameSearchType: 0,
            lastName: '',
            lastNameSearchType: 0,
            ssn: '',
            standardProjectId: row.projectId
        };
    
        AWS.callSoap(WS, 'searchEmployees', employeeParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-employeeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].fname, res.item[0].middleName, res.item[0].lname));
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(searchEmployee);
                if (res.selectedItem) { 
                    ctl.setValue(res.selectedItem.personId);
                }
            }
        });

        const servicesParams = {
            accountingSystemId: '',
            accountingSystemIdSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            standardProjectId: row.projectId
        };
    
        AWS.callSoap(WS, 'searchServices', servicesParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('project-serviceItem');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].serviceId, res.description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                if (res.selectedItem) {                    
                    ctl.setValue(res.selectedItem.serviceId);
                }
            }
        });

        const projectId = {
            projectId: row.projectId
        };
        AWS.callSoap(WS, 'loadStandardProject', projectId).then(data => {
            if (data.wsStatus === "0") {
                $$('project-summary').setValue(data.description);
                $$('project-applyToAll').setValue(data.allCompanies);
                $$('project-detail').setValue(data.detailDesc);
                $$('project-requestingPerson').setValue(data.requesterName);
                $$('project-externalRef').setValue(data.reference);
                $$('project-billable').setValue(data.billable);
                $$('project-billingRate').setValue(data.billingRate);
                $$('project-dollarCap').setValue(data.dollarCap);
                $$('project-showForAll').setValue(data.accessibleToAll);
                
                if (data.billable === 'Y') {
                    $$('project-billingRate').enable();
                    $$('project-dollarCap').enable();
                    $$('project-showForAll').enable();
                }
            }
        });

        Utils.popup_open('project-popup');

        function getDefaultsForCategoryAndType() {
            const params = {
                projectCategoryId: $$('project-categoryId').getValue(),
                projectTypeId: $$('project-typeId').getValue()
            };
            AWS.callSoap(WS, 'getDefaultsForCategoryAndType', params).then(res => {
                if (res.wsStatus === "0") {
                    if (!res.routeId) {
                        Utils.showMessage('Error', 'There is not a valid Project Route associated to the selected Category/Type combination.  Please note that if there is a Project Route associated to this combination, ensure that the Project Route has an Initial Route Stop and Project Status.  Projects can not be created from a Standard Project when it has an invalid Project Route.');
                    }
                }
            });
        }
        $$('project-categoryId').onChange(() => {
            if ($$('project-categoryId').getValue() && $$('project-typeId').getValue()) {
                getDefaultsForCategoryAndType();                
            }
        });
        $$('project-typeId').onChange(() => {
            if ($$('project-categoryId').getValue() && $$('project-typeId').getValue()) {
                getDefaultsForCategoryAndType();                
            }
        });

        $$('project-billable').onChange(() => {
            if ($$('project-billable').getValue() === 'Y') {
                $$('project-billingRate').enable();
                $$('project-dollarCap').enable();
                $$('project-serviceItem').enable();
            } else {
                $$('project-billingRate').disable();
                $$('project-dollarCap').disable();
                $$('project-serviceItem').disable();
            }
        });

        $$('project-save').onclick(() => {
            if ($$('project-summary').isError('Summary'))
                return;

            if ($$('project-categoryId').isError('Category Code'))
                return;

            if ($$('project-typeId').isError('Type Code'))
                return;

            const params = {
                projectId: row.projectId,
                accessibleToAll: $$('project-showForAll').getValue(),
                allCompanies: $$('project-applyToAll').getValue(),
                billable: $$('project-billable').getValue(),
                billingRate: $$('project-billingRate').getValue(),
                description: $$('project-summary').getValue(),
                detailDesc: $$('project-detail').getValue(),
                dollarCap: $$('project-dollarCap').getValue(),
                employeeId: $$('project-employeeId').getValue(),
                projectCategoryId: $$('project-categoryId').getValue(),
                projectTypeId: $$('project-typeId').getValue(),
                reference: $$('project-externalRef').getValue(),
                requesterName: $$('project-requestingPerson').getValue(),
                serviceId: $$('project-serviceItem').getValue()
            }

            AWS.callSoap(WS, 'saveStandardProject', params).then(data => {
                if (data.wsStatus === '0') {     
                    getListStandardProjects();
                    Utils.popup_close();
                }
            });
        });

        $$('project-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Project?', function () {
            const params = {
                projectIds: projectsGrid.getSelectedRow().projectId
            }
            AWS.callSoap(WS, 'deleteStandardProject', params).then(data => {
                if (data.wsStatus === "0") {
                    getListStandardProjects();
                }  
            });
        });     
    });
})();
