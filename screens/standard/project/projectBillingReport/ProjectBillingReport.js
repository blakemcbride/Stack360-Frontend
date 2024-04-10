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
    const WS = 'StandardProjectProjectBillingReport';
    let detailData;
    
    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    function ProjectInfo() {}

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            const projectId = params.data.projectId;
            const data = {
                projectId: projectId
            };
            AWS.callSoap(WS, 'getProjectDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-info-popup");
                    $$('project-info-project-id').setValue(params.data.projectName);
                    $$('project-info-requesting-person').setValue(res.requestingPersonOrCreatedBy);
                    $$('project-info-summary').setValue(params.data.projectSummary);
                    $$('project-info-phase').setValue(res.phaseFormatted);
                    $$('project-info-requesting-company').setValue(res.requestingNameFormatted);
                    $$('project-info-status').setValue(res.statusFormatted);
                    $$('project-info-details').setValue(res.detail);
                    $$('project-info-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.summary;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };

    const searchResColumnDefs = [
        {headerName: "Project ID", field: "projectName", type: "numericColumn", width: 50},
        {headerName: "Project Summary", field: "summary", cellRenderer: 'projectInfo', width: 300},
        {headerName: "Estimated", field: "estimate", type: "numericColumn", width: 50},
        {headerName: "Invoiced", field: "invoiced", type: "numericColumn", width: 50},
        {headerName: "Remaining", field: "remaining", type: "numericColumn", width: 50},
        {headerName: "Billable", field: "billable", type: "numericColumn", width: 50},
        {headerName: "Non-Billable", field: "nonBillable", type: "numericColumn", width: 50},
        {headerName: "Unknown", field: "unknown", type: "numericColumn", width: 50}
    ];

    const searchResGrid = new AGGrid('searchResGrid', searchResColumnDefs);
    searchResGrid.addComponent('projectInfo', ProjectInfo);
    searchResGrid.show();
    searchResGrid.setOnSelectionChanged($$('detail').enable);
    searchResGrid.setOnRowDoubleClicked(detail);

    const searchData = (searchData) => {
        Utils.popup_set_height('pbr-data-search', '455px');
        let formSearchGrid;
        switch (searchData) {
            case 'orgGroupId':
                $$('pbr-data-search-type').setValue('Organizational Group');
                $$('pbr-chooseSpecificLabelAll').setValue('Organizational Groups');
                $$('pbr-chooseSpecificLabelSearch').setValue('Organizational Group');

                $$('pbr-first-label').setValue('Name:');

                $$('pbr-second-label').hide();
                $$('pbr-second-criteria').hide();
                $$('pbr-second-search').hide();

                $$('pbr-third-label').hide();
                $$('pbr-third-search').hide();
                break;

            case 'clientCompanyId':
                $$('pbr-data-search-type').setValue('Requesting Company');
                $$('pbr-chooseSpecificLabelAll').setValue('Companies');
                $$('pbr-chooseSpecificLabelSearch').setValue('Company');

                $$('pbr-first-label').setValue('Name:');

                $$('pbr-second-label').hide();
                $$('pbr-second-criteria').hide();
                $$('pbr-second-search').hide();

                $$('pbr-third-label').hide();
                $$('pbr-third-search').hide();
                break;

            case 'employeeId':
                $$('pbr-data-search-type').setValue('Employee');
                $$('pbr-chooseSpecificLabelAll').setValue('Employees');
                $$('pbr-chooseSpecificLabelSearch').setValue('Employee');

                $$('pbr-first-label').setValue('Last Name:');

                $$('pbr-second-label').show().setValue('First Name:');
                $$('pbr-second-criteria').show();
                $$('pbr-second-search').show();

                $$('pbr-third-label').show().setValue('SSN:');
                $$('pbr-third-search').show();
                break;
        
            default:
                break;
        }
        
        Utils.popup_open('pbr-data-search');
            
        const reset = () => {
            $$('pbr-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('pbr-first-search').clear();

            $$('pbr-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('pbr-second-search').clear();

            $$('pbr-third-search').clear();

            $$('pbr-reset').enable();
            $$('pbr-search').enable();

            $$('pbr-ok').disable();

            formSearchGrid.clear();
            $$('pbr-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchData) {
                    case 'orgGroupId':
                        $$('pbr-orgGroupId').setValue(row.orgGroupId, row.name);
                        break;
        
                    case 'clientCompanyId':
                        $$('pbr-clientCompanyId').setValue(row.companyId, row.name);
                        break;
        
                    case 'employeeId':
                        $$('pbr-employeeId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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

        bindToEnum('pbr-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('pbr-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs;

            switch (searchData) {
                case "orgGroupId":
                    columnDefs = [
                        {headerName: 'Organizational Group Name', field: 'name', width: 210}
                    ];
                    break;
                
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
                    Utils.popup_set_height('pbr-data-search', '520px');
                    break;

                default:
                    columnDefs = [];
                    break;
            }

            formSearchGrid = new AGGrid('pbr-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            if (searchData === "orgGroupId") {
                const params = {
                    name: $$('pbr-first-search').getValue(),
                    nameSearchType: $$('pbr-first-criteria').getValue(),
                    orgGroupId: ''
                }
                AWS.callSoap(WS, 'searchSubordinateOrgGroups', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('pbr-count').setValue(`Displaying ${records.length} Organizational Groups`);
                        } else {
                            $$('pbr-count').setValue(`Displaying 0 Organizational Groups`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('pbr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "clientCompanyId") {
                const params = {
                    name: $$('pbr-first-search').getValue(),
                    nameSearchType: $$('pbr-first-criteria').getValue(),
                    companyId: ''
                }
                AWS.callSoap(WS, 'searchCompany', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('pbr-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('pbr-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('pbr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "employeeId") {
                const params = {
                    firstName: $$('pbr-second-search').getValue(),
                    firstNameSearchType: $$('pbr-second-criteria').getValue(),
                    lastName: $$('pbr-first-search').getValue(),
                    lastNameSearchType: $$('pbr-first-criteria').getValue(),
                    orgGroupId: '',
                    personId: '',
                    ssn: $$('pbr-third-search').getValue()
                }
                AWS.callSoap(WS, 'searchSubordinateEmployees', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('pbr-count').setValue(`Displaying ${records.length} Employees`);
                        } else {
                            $$('pbr-count').setValue(`Displaying 0 Employees`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('pbr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            }                
        };

        $$('pbr-reset').onclick(reset);
        $$('pbr-search').onclick(search);
        $$('pbr-ok').onclick(ok);
        $$('pbr-cancel').onclick(cancel);

        $$('pbr-chooseSpecific').onChange(() => {
            if ($$('pbr-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('pbr-first-criteria').disable();
                $$('pbr-first-search').disable();

                $$('pbr-second-criteria').disable();
                $$('pbr-second-search').disable();

                $$('pbr-third-search').disable();

                switch (searchData) {
                    case 'orgGroupId':
                        $$('pbr-count').setValue(`Displaying 0 Organizational Groups`);
                        break;
                    
                    case 'clientCompanyId':
                        $$('pbr-count').setValue(`Displaying 0 Companies`);
                        break;

                    case 'employeeId':
                        $$('pbr-count').setValue(`Displaying 0 Employees`);
                        break;
                
                    default:
                        break;
                }
                $$('pbr-ok').enable().onclick(() => {
                    $$('pbr-' + searchData).setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('pbr-first-criteria').enable();
                $$('pbr-first-search').enable();

                $$('pbr-second-criteria').enable();
                $$('pbr-second-search').enable();

                $$('pbr-third-search').enable();

                $$('pbr-ok').enable().onclick(ok);
            }
        });
    };

    const reset = () => {
        $$('pbr-notApproved').setValue(true);
        $$('pbr-approved').setValue(true);
        $$('pbr-invoiced').setValue(false);
        $$('pbr-projectId').clear();
        $$('pbr-projectName').clear();

        const orgGroupParams = {
            name: '',
            nameSearchType: 0,
            orgGroupId: ''
        }
        AWS.callSoap(WS, 'searchSubordinateOrgGroups', orgGroupParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pbr-orgGroupId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].orgGroupId, res.item[i].name);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchData('orgGroupId');
                });
            }
        });
    
        const companyParams = {
            name: '',
            nameSearchType: 0,
            companyId: ''
        }
        AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pbr-clientCompanyId');
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
            orgGroupId: '',
            personId: '',
            ssn: ''
        }
        AWS.callSoap(WS, 'searchSubordinateEmployees', employeesParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pbr-employeeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchData('employeeId');
                });
            }
        });
    }
    
    reset();

    function getProjectReportData() {
        return new Promise(function(resolve, reject) {
            const params = {
                approved: $$('pbr-approved').getValue(),
                clientCompanyId: $$('pbr-clientCompanyId').getValue(),
                employeeId: $$('pbr-employeeId').getValue(),
                invoiced: $$('pbr-invoiced').getValue(),
                notApproved: $$('pbr-notApproved').getValue(),
                orgGroupId: $$('pbr-orgGroupId').getValue(),
                projectId: $$('pbr-projectId').getValue(),
                sortAsc: false,
                sortOn: ''
            };
            AWS.callSoap(WS, 'getProjectReportData', params).then(data => {
                if (data.wsStatus === '0') {
                    data.projectDetail = Utils.assureArray(data.projectDetail);
                    detailData = data;
                    resolve()
                } else
                    reject();
            });
        });
    }

    function updateProjectReportData() {
        searchResGrid.clear();

        for (let i = 0; i < detailData.projectDetail.length; i++) {
            let row = detailData.projectDetail[i];
                // hours
                row.estimate = Utils.format(Number(row.estimatedHours), "C", 0, 2);
                row.invoiced = Utils.format(Number(row.invoicedHours), "C", 0, 2);
                row.remaining = Utils.format(Number(row.remainingEstimatedHours), "C", 0, 2);
                row.billable = Utils.format(Number(row.billableHours), "C", 0, 2);
                row.nonBillable = Utils.format(Number(row.nonBillableHours), "C", 0, 2);
                row.unknown = Utils.format(Number(row.unknownHours), "C", 0, 2);
            
        }

        $$('pbr-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects");
        if (detailData.projectDetail.length === detailData.cap)
            $$('pbr-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects (Limit)").setColor("red");
        else
            $$('pbr-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects").setColor("black");
        $$('pbr-billHours').setValue(detailData.billableHours);
        $$('pbr-nonBillHours').setValue(detailData.nonBillableHours);
        $$('pbr-unknHours').setValue(detailData.unknownHours);
        $$('pbr-busHours').setValue(detailData.totalBusinessHours);
        $$('pbr-totalHours').setValue(detailData.totalHours);
        $$('pbr-totalDollars').setValue(detailData.billableAmount);
        $$('pbr-estDollars').setValue(detailData.dollarsWithinEstimate);

        searchResGrid.addRecords(detailData.projectDetail);
    }

    function detail() {
        Utils.saveData(CURRENT_PROJECT_ID, searchResGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, searchResGrid.getSelectedRow().projectName);
        Framework.getChild();
    }

    $$('chooseProjId').onclick(() => {
        let formSearchGrid;        
        Utils.popup_open('pbr-search-project');

        const searchProjectCode = (searchType) => {
            let formSearchGrid;
            switch (searchType) {
                case 'category':
                    $$('pbr-project-data-search-type').setValue('Category');
                    $$('pbr-proj-chooseSpecificLabelAll').setValue('Project Categories');
                    $$('pbr-proj-chooseSpecificLabelSearch').setValue('Project Category');
                    break;
    
                case 'type':
                    $$('pbr-project-data-search-type').setValue('Type');
                    $$('pbr-proj-chooseSpecificLabelAll').setValue('Project Types');
                    $$('pbr-proj-chooseSpecificLabelSearch').setValue('Project Type');
                    break;
    
                case 'status':
                    $$('pbr-project-data-search-type').setValue('Status');
                    $$('pbr-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                    $$('pbr-proj-chooseSpecificLabelSearch').setValue('Project Status');
                    break;
            
                default:
                    break;
            }
            
            Utils.popup_open('pbr-project-data-search');
                
            const reset = () => {
                $$('pbr-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pbr-proj-code-search').clear();
    
                $$('pbr-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pbr-proj-descr-search').clear();
    
                $$('pbr-projD-reset').enable();
                $$('pbr-projD-search').enable();
    
                $$('pbr-projD-ok').disable();
    
                formSearchGrid.clear();
                $$('pbr-projD-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    switch (searchType) {
                        case 'category':
                            $$('pbr-proj-category').setValue(row.projectCategoryId, row.code);
                            break;
            
                        case 'type':
                            $$('pbr-proj-type').setValue(row.projectTypeId, row.code);
                            break;
            
                        case 'status':
                            $$('pbr-proj-status').setValue(row.projectStatusId, row.code);
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
    
            bindToEnum('pbr-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pbr-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 60},
                    {headerName: 'Description', field: 'description', width: 210}
                ];
    
                formSearchGrid = new AGGrid('pbr-projRes-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const params = {
                    code: $$('pbr-proj-code-search').getValue(),
                    codeSearchType: $$('pbr-proj-code-criteria').getValue(),
                    description: $$('pbr-proj-descr-search').getValue(),
                    descriptionSearchType: $$('pbr-proj-descr-criteria').getValue()
                }
                if (searchType === "category") {                    
                    AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('pbr-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                            } else {
                                $$('pbr-projD-count').setValue(`Displaying 0 Project Categories`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('pbr-projD-ok').enable);
                    
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
                                $$('pbr-projD-count').setValue(`Displaying ${records.length} Project Types`);
                            } else {
                                $$('pbr-projD-count').setValue(`Displaying 0 Project Types`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('pbr-projD-ok').enable);
                    
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
                                $$('pbr-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                            } else {
                                $$('pbr-projD-count').setValue(`Displaying 0 Project Statuses`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('pbr-projD-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                
            };
    
            $$('pbr-projD-reset').onclick(reset);
            $$('pbr-projD-search').onclick(search);
            $$('pbr-projD-ok').onclick(ok);
            $$('pbr-projD-cancel').onclick(cancel);
    
            $$('pbr-project-specific').onChange(() => {
                if ($$('pbr-project-specific').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('pbr-proj-code-criteria').disable();
                    $$('pbr-proj-code-search').disable();
    
                    $$('pbr-proj-descr-criteria').disable();
                    $$('pbr-proj-descr-search').disable();
    
                    switch (searchType) {
                        case 'category':
                            $$('pbr-proj-category').setValue(`Displaying 0 Project Categories`);
                            break;
                        
                        case 'status':
                            $$('pbr-proj-status').setValue(`Displaying 0 Project Statuses`);
                            break;
    
                        case 'type':
                            $$('pbr-proj-type').setValue(`Displaying 0 Project Types`);
                            break;
                    
                        default:
                            break;
                    }
                    $$('pbr-projD-ok').enable().onclick(() => {
                        $$('pbr-proj-' + searchType).setValue('');                         
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('pbr-proj-code-criteria').enable();
                    $$('pbr-proj-code-search').enable();
    
                    $$('pbr-proj-descr-criteria').enable();
                    $$('pbr-proj-descr-search').enable();
    
                    $$('pbr-projD-ok').enable().onclick(ok);
                }
            });

            search();
        }
            
        const reset = () => {
            $$('pbr-proj-projectName').clear();
            $$('pbr-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('pbr-proj-summary').clear();
            $$('pbr-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);

            $$('pbr-proj-reset').enable();
            $$('pbr-proj-search').enable();

            $$('pbr-proj-ok').disable();

            formSearchGrid.clear();
            $$('pbr-proj-count').setValue(`Displaying 0 item`);

            $$('pbr-proj-category').clear();
            $$('pbr-proj-companyId').clear();
            $$('pbr-proj-status').clear();
            $$('pbr-proj-type').clear();

            const companyParams = {
                companyId: '',
                name: '',
                nameSearchType: 2
            }
            AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('pbr-proj-companyId');
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
                    const ctl = $$('pbr-proj-category');
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
                    const ctl = $$('pbr-proj-type');
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
                    const ctl = $$('pbr-proj-status');
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
                $$('pbr-projectId').setValue(row.projectId);
                $$('pbr-projectName').setValue(Number(row.projectName));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('pbr-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('pbr-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                    {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                    {headerName: 'Summary', field: 'description', width: 100},
                    {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                    {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                    {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                    {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                ];

            formSearchGrid = new AGGrid('pbr-proj-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        reset();
        const search = () => {
            const params = {
                category: $$('pbr-proj-category').getValue(),
                companyId: $$('pbr-proj-companyId').getValue(),
                projectName: $$('pbr-proj-projectName').getValue(),
                projectNameSearchType: $$('pbr-proj-projectNameSearchType').getValue(),
                status: $$('pbr-proj-status').getValue(),
                summary: $$('pbr-proj-summary').getValue(),
                summarySearchType: $$('pbr-proj-summarySearchType').getValue(),
                type: $$('pbr-proj-type').getValue()
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('pbr-proj-count').setValue(`Displaying ${records.length} Projects`);
                    } else {
                        $$('pbr-proj-count').setValue(`Displaying 0 Projects`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('pbr-proj-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });        
        };

        $$('pbr-proj-reset').onclick(reset);
        $$('pbr-proj-search').onclick(search);
        $$('pbr-proj-ok').onclick(ok);
        $$('pbr-proj-cancel').onclick(cancel);

        $$('pbr-proj-chooseProject').onChange(() => {
            if ($$('pbr-proj-chooseProject').getValue() === "A") {
                formSearchGrid.clear();
                $$('pbr-proj-category').disable();
                $$('pbr-proj-companyId').disable();
                $$('pbr-proj-projectName').disable();
                $$('pbr-proj-projectNameSearchType').disable();
                $$('pbr-proj-status').disable();
                $$('pbr-proj-summary').disable();
                $$('pbr-proj-summarySearchType').disable();
                $$('pbr-proj-type').disable();

                $$('pbr-proj-count').setValue(`Displaying 0 Projects`);

                $$('pbr-proj-ok').enable().onclick(() => {
                    $$('pbr-projectId').clear();
                    $$('pbr-projectName').clear();
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('pbr-proj-category').enable();
                $$('pbr-proj-companyId').enable();
                $$('pbr-proj-projectName').enable();
                $$('pbr-proj-projectNameSearchType').enable();
                $$('pbr-proj-status').enable();
                $$('pbr-proj-summary').enable();
                $$('pbr-proj-summarySearchType').enable();
                $$('pbr-proj-type').enable();

                $$('pbr-proj-ok').enable().onclick(ok);
            }
        });
    });

    $$('reset').onclick(reset);
    $$('search').onclick(async () => {
        await getProjectReportData();
        updateProjectReportData();
    });

    $$('detail').onclick(detail);
    $$('report').onclick(() => {

        Utils.popup_open('pbr-report-popup');

        $$('pbr-reportTypeOk').onclick(() => {
            const params = {
                approved: $$('pbr-approved').getValue(),
                clientCompanyId: $$('pbr-clientCompanyId').getValue(),
                employeeId: $$('pbr-employeeId').getValue(),
                invoiced: $$('pbr-invoiced').getValue(),
                notApproved: $$('pbr-notApproved').getValue(),
                orgGroupId: $$('pbr-orgGroupId').getValue(),
                projectId: $$('pbr-projectId').getValue(),
                reportType: $$('pbr-reportType').getValue(),
                showInDollars: false,
                startDate: 0,
                endDate: 0
            };
            
            AWS.callSoap(WS, 'getProjectReport', params).then(data => {
                if (data.wsStatus === '0') {
                    Utils.showReport(data.reportUrl);
                    Utils.popup_close();
                }
            });      
        });
        
        $$('pbr-reportTypeCancel').onclick(Utils.popup_close);
    });
})();
