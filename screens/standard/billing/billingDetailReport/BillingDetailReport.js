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
    const WS = 'StandardBillingBillingDetailReport';
    
    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const searchData = (searchData) => {
        Utils.popup_set_height('bdr-data-search', '455px');
        let formSearchGrid;
        switch (searchData) {
            case 'clientCompanyId':
                $$('bdr-data-search-type').setValue('Requesting Company');
                $$('bdr-chooseSpecificLabelAll').setValue('Companies');
                $$('bdr-chooseSpecificLabelSearch').setValue('Company');

                $$('bdr-first-label').setValue('Name:');

                $$('bdr-second-label').hide();
                $$('bdr-second-criteria').hide();
                $$('bdr-second-search').hide();

                $$('bdr-third-label').hide();
                $$('bdr-third-search').hide();
                break;

            case 'employeeId':
                $$('bdr-data-search-type').setValue('Employee');
                $$('bdr-chooseSpecificLabelAll').setValue('Employees');
                $$('bdr-chooseSpecificLabelSearch').setValue('Employee');

                $$('bdr-first-label').setValue('Last Name:');

                $$('bdr-second-label').show().setValue('First Name:');
                $$('bdr-second-criteria').show();
                $$('bdr-second-search').show();

                $$('bdr-third-label').show().setValue('SSN:');
                $$('bdr-third-search').show();
                break;
        
            default:
                break;
        }
        
        Utils.popup_open('bdr-data-search');
            
        const reset = () => {
            $$('bdr-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('bdr-first-search').clear();

            $$('bdr-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('bdr-second-search').clear();

            $$('bdr-third-search').clear();

            $$('bdr-reset').enable();
            $$('bdr-search').enable();

            $$('bdr-ok').disable();

            formSearchGrid.clear();
            $$('bdr-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchData) {        
                    case 'clientCompanyId':
                        $$('bdr-clientCompanyId').setValue(row.companyId, row.name);
                        break;
        
                    case 'employeeId':
                        $$('bdr-employeeId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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

        bindToEnum('bdr-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('bdr-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs;

            switch (searchData) {               
                case "clientCompanyId":
                    columnDefs = [
                        {headerName: 'Company Name', field: 'name', width: 170},
                        {headerName: 'Type', field: 'orgGroupTypeName', width: 40}
                    ];
                    break;
            
                case "employeeId":
                    columnDefs = [
                        {headerName: 'Last Name', field: 'lname', width: 70},
                        {headerName: 'First Name', field: 'fname', width: 70},
                        {headerName: 'Middle Name', field: 'middleName', width: 70}
                    ];
                    Utils.popup_set_height('bdr-data-search', '520px');
                    break;

                default:
                    columnDefs = [];
                    break;
            }

            formSearchGrid = new AGGrid('bdr-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            if (searchData === "clientCompanyId") {
                const params = {
                    name: $$('bdr-first-search').getValue(),
                    nameSearchType: $$('bdr-first-criteria').getValue(),
                    companyId: ''
                }
                AWS.callSoap(WS, 'searchCompany', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('bdr-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('bdr-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "employeeId") {
                const params = {
                    firstName: $$('bdr-second-search').getValue(),
                    firstNameSearchType: $$('bdr-second-criteria').getValue(),
                    lastName: $$('bdr-first-search').getValue(),
                    lastNameSearchType: $$('bdr-first-criteria').getValue(),
                    ssn: $$('bdr-third-search').getValue(),
                    autoDefault: false
                }
                AWS.callSoap(WS, 'searchEmployees', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.employees) {
                            const records = Utils.assureArray(data.employees);
                            formSearchGrid.addRecords(records);
                            $$('bdr-count').setValue(`Displaying ${records.length} Employees`);
                        } else {
                            $$('bdr-count').setValue(`Displaying 0 Employees`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            }                
        };

        $$('bdr-reset').onclick(reset);
        $$('bdr-search').onclick(search);
        $$('bdr-ok').onclick(ok);
        $$('bdr-cancel').onclick(cancel);

        $$('bdr-chooseSpecific').onChange(() => {
            if ($$('bdr-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('bdr-first-criteria').disable();
                $$('bdr-first-search').disable();

                $$('bdr-second-criteria').disable();
                $$('bdr-second-search').disable();

                $$('bdr-third-search').disable();

                switch (searchData) {                    
                    case 'clientCompanyId':
                        $$('bdr-count').setValue(`Displaying 0 Companies`);
                        break;

                    case 'employeeId':
                        $$('bdr-count').setValue(`Displaying 0 Employees`);
                        break;
                
                    default:
                        break;
                }
                $$('bdr-ok').enable().onclick(() => {
                    $$('bdr-' + searchData).setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('bdr-first-criteria').enable();
                $$('bdr-first-search').enable();

                $$('bdr-second-criteria').enable();
                $$('bdr-second-search').enable();

                $$('bdr-third-search').enable();

                $$('bdr-ok').enable().onclick(ok);
            }
        });

        search();
    }; 

    const companyParams = {
        name: '',
        nameSearchType: 0,
        companyId: ''
    }
    AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('bdr-clientCompanyId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].companyId, res.item[i].name);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(() => {
                searchData('clientCompanyId');
            });
        }
    });
    
    const employeesParams = {
        firstName: '',
        firstNameSearchType: 0,
        lastName: '',
        lastNameSearchType: 0,
        ssn: '',
        autoDefault: false
    }
    AWS.callSoap(WS, 'searchEmployees', employeesParams).then(res => {
        if (res.wsStatus === "0") {
            res.employees = Utils.assureArray(res.employees);
            const ctl = $$('bdr-employeeId');
            ctl.clear();
            if (res.employees.length === 0) {
                ctl.nothingToSelect();
            } else if (res.employees.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.employees.length; i++)
                    ctl.add(res.employees[i].personId, makeName(res.employees[i].fname, res.employees[i].middleName, res.employees[i].lname));
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(() => {
                searchData('employeeId');
            });
        }
    });

    const projectParams = {
        category: '',
        companyId: '',
        projectName: '',
        projectNameSearchType: 0,
        status: '',
        summary: '',
        summarySearchType: 0,
        type: ''
    }
    AWS.callSoap(WS, 'searchProjects', projectParams).then(res => {
        if (res.wsStatus === '0') {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('bdr-projectId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectId, res.item[i].projectName + ' - ' + res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProject();
                });
            }
        }
    });        

    function searchProject() {
        let formSearchGrid;        
        Utils.popup_open('bdr-search-project');

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
                            $$('bdr-proj-category').setValue(row.projectCategoryId, row.code);
                            break;
            
                        case 'type':
                            $$('bdr-proj-type').setValue(row.projectTypeId, row.code);
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
            
        const reset = () => {
            $$('bdr-proj-projectName').clear();
            $$('bdr-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('bdr-proj-summary').clear();
            $$('bdr-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);

            $$('bdr-proj-reset').enable();
            $$('bdr-proj-search').enable();

            $$('bdr-proj-ok').disable();

            formSearchGrid.clear();
            $$('bdr-proj-count').setValue(`Displaying 0 item`);

            $$('bdr-proj-category').clear();
            $$('bdr-proj-companyId').clear();
            $$('bdr-proj-status').clear();
            $$('bdr-proj-type').clear();

            const companyParams = {
                companyId: '',
                name: '',
                nameSearchType: 2
            }
            AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('bdr-proj-companyId');
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].companyId, res.item[i].name);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchData('clientCompanyId');
                    });
                }
            });

            const params = {
                code: '',
                codeSearchType: 2,
                description: '',
                descriptionSearchType: 2
            }
            AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('bdr-proj-category');
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
                    const ctl = $$('bdr-proj-type');
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

            AWS.callSoap(WS, 'searchProjectStatuses', params).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('bdr-proj-status');
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].projectStatusId, res.item[i].code);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchProjectCode('status');
                    });
                }
            });
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('bdr-projectId').setValue(row.projectId, row.projectName + ' - ' + row.description);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('bdr-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('bdr-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                    {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                    {headerName: 'Summary', field: 'description', width: 100},
                    {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                    {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                    {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                    {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                ];

            formSearchGrid = new AGGrid('bdr-proj-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        reset();
        const search = () => {
            const params = {
                category: $$('bdr-proj-category').getValue(),
                companyId: $$('bdr-proj-companyId').getValue(),
                projectName: $$('bdr-proj-projectName').getValue(),
                projectNameSearchType: $$('bdr-proj-projectNameSearchType').getValue(),
                status: $$('bdr-proj-status').getValue(),
                summary: $$('bdr-proj-summary').getValue(),
                summarySearchType: $$('bdr-proj-summarySearchType').getValue(),
                type: $$('bdr-proj-type').getValue()
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('bdr-proj-count').setValue(`Displaying ${records.length} Projects`);
                    } else {
                        $$('bdr-proj-count').setValue(`Displaying 0 Projects`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('bdr-proj-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });        
        };

        $$('bdr-proj-reset').onclick(reset);
        $$('bdr-proj-search').onclick(search);
        $$('bdr-proj-ok').onclick(ok);
        $$('bdr-proj-cancel').onclick(cancel);

        $$('bdr-proj-chooseProject').onChange(() => {
            if ($$('bdr-proj-chooseProject').getValue() === "A") {
                formSearchGrid.clear();
                $$('bdr-proj-category').disable();
                $$('bdr-proj-companyId').disable();
                $$('bdr-proj-projectName').disable();
                $$('bdr-proj-projectNameSearchType').disable();
                $$('bdr-proj-status').disable();
                $$('bdr-proj-summary').disable();
                $$('bdr-proj-summarySearchType').disable();
                $$('bdr-proj-type').disable();

                $$('bdr-proj-count').setValue(`Displaying 0 Projects`);

                $$('bdr-proj-ok').enable().onclick(() => {
                    $$('bdr-projectId').clear();
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('bdr-proj-category').enable();
                $$('bdr-proj-companyId').enable();
                $$('bdr-proj-projectName').enable();
                $$('bdr-proj-projectNameSearchType').enable();
                $$('bdr-proj-status').enable();
                $$('bdr-proj-summary').enable();
                $$('bdr-proj-summarySearchType').enable();
                $$('bdr-proj-type').enable();

                $$('bdr-proj-ok').enable().onclick(ok);
            }
        });

        search();
    }

    $$('report').onclick(() => {
        const params = {
            approved: $$('bdr-approved').getValue(),
            billable: $$('bdr-billable').getValue(),
            clientId: $$('bdr-clientCompanyId').getValue(),
            employeeId: $$('bdr-employeeId').getValue(),
            endDate: $$('bdr-toDate').getIntValue(),
            invoiced: $$('bdr-invoiced').getValue(),
            nonApproved: $$('bdr-notApproved').getValue(),
            nonBillable: $$('bdr-notBillable').getValue(),
            projectId: $$('bdr-projectId').getValue(),
            startDate: $$('bdr-fromDate').getIntValue()
        };
        
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });
})();
