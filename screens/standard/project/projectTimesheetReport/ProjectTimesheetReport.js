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
    const WS = 'StandardProjectProjectTimesheetReport';
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

    $$('ptr-showIn').onChange(updateProjectReportData);

    const searchData = (searchData) => {
        Utils.popup_set_height('ptr-data-search', '455px');
        let formSearchGrid;
        switch (searchData) {
            case 'orgGroupId':
                $$('ptr-data-search-type').setValue('Organizational Group');
                $$('ptr-chooseSpecificLabelAll').setValue('Organizational Groups');
                $$('ptr-chooseSpecificLabelSearch').setValue('Organizational Group');

                $$('ptr-first-label').setValue('Name:');

                $$('ptr-second-label').hide();
                $$('ptr-second-criteria').hide();
                $$('ptr-second-search').hide();

                $$('ptr-third-label').hide();
                $$('ptr-third-search').hide();
                break;

            case 'clientCompanyId':
                $$('ptr-data-search-type').setValue('Requesting Company');
                $$('ptr-chooseSpecificLabelAll').setValue('Companies');
                $$('ptr-chooseSpecificLabelSearch').setValue('Company');

                $$('ptr-first-label').setValue('Name:');

                $$('ptr-second-label').hide();
                $$('ptr-second-criteria').hide();
                $$('ptr-second-search').hide();

                $$('ptr-third-label').hide();
                $$('ptr-third-search').hide();
                break;

            case 'employeeId':
                $$('ptr-data-search-type').setValue('Employee');
                $$('ptr-chooseSpecificLabelAll').setValue('Employees');
                $$('ptr-chooseSpecificLabelSearch').setValue('Employee');

                $$('ptr-first-label').setValue('Last Name:');

                $$('ptr-second-label').show().setValue('First Name:');
                $$('ptr-second-criteria').show();
                $$('ptr-second-search').show();

                $$('ptr-third-label').show().setValue('SSN:');
                $$('ptr-third-search').show();
                break;
        
            default:
                break;
        }
        
        Utils.popup_open('ptr-data-search');
            
        const reset = () => {
            $$('ptr-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ptr-first-search').clear();

            $$('ptr-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ptr-second-search').clear();

            $$('ptr-third-search').clear();

            $$('ptr-reset').enable();
            $$('ptr-search').enable();

            $$('ptr-ok').disable();

            formSearchGrid.clear();
            $$('ptr-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchData) {
                    case 'orgGroupId':
                        $$('ptr-orgGroupId').setValue(row.orgGroupId, row.name);
                        break;
        
                    case 'clientCompanyId':
                        $$('ptr-clientCompanyId').setValue(row.companyId, row.name);
                        break;
        
                    case 'employeeId':
                        $$('ptr-employeeId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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

        bindToEnum('ptr-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('ptr-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

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
                    Utils.popup_set_height('ptr-data-search', '520px');
                    break;

                default:
                    columnDefs = [];
                    break;
            }

            formSearchGrid = new AGGrid('ptr-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            if (searchData === "orgGroupId") {
                const params = {
                    name: $$('ptr-first-search').getValue(),
                    nameSearchType: $$('ptr-first-criteria').getValue(),
                    orgGroupId: ''
                }
                AWS.callSoap(WS, 'searchSubordinateOrgGroups', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ptr-count').setValue(`Displaying ${records.length} Organizational Groups`);
                        } else {
                            $$('ptr-count').setValue(`Displaying 0 Organizational Groups`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ptr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "clientCompanyId") {
                const params = {
                    name: $$('ptr-first-search').getValue(),
                    nameSearchType: $$('ptr-first-criteria').getValue(),
                    companyId: ''
                }
                AWS.callSoap(WS, 'searchCompany', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ptr-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('ptr-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ptr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "employeeId") {
                const params = {
                    firstName: $$('ptr-second-search').getValue(),
                    firstNameSearchType: $$('ptr-second-criteria').getValue(),
                    lastName: $$('ptr-first-search').getValue(),
                    lastNameSearchType: $$('ptr-first-criteria').getValue(),
                    orgGroupId: '',
                    personId: '',
                    ssn: $$('ptr-third-search').getValue()
                }
                AWS.callSoap(WS, 'searchSubordinateEmployees', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ptr-count').setValue(`Displaying ${records.length} Employees`);
                        } else {
                            $$('ptr-count').setValue(`Displaying 0 Employees`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ptr-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            }                
        };

        $$('ptr-reset').onclick(reset);
        $$('ptr-search').onclick(search);
        $$('ptr-ok').onclick(ok);
        $$('ptr-cancel').onclick(cancel);

        $$('ptr-chooseSpecific').onChange(() => {
            if ($$('ptr-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('ptr-first-criteria').disable();
                $$('ptr-first-search').disable();

                $$('ptr-second-criteria').disable();
                $$('ptr-second-search').disable();

                $$('ptr-third-search').disable();

                switch (searchData) {
                    case 'orgGroupId':
                        $$('ptr-count').setValue(`Displaying 0 Organizational Groups`);
                        break;
                    
                    case 'clientCompanyId':
                        $$('ptr-count').setValue(`Displaying 0 Companies`);
                        break;

                    case 'employeeId':
                        $$('ptr-count').setValue(`Displaying 0 Employees`);
                        break;
                
                    default:
                        break;
                }
                $$('ptr-ok').enable().onclick(() => {
                    $$('ptr-' + searchData).setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('ptr-first-criteria').enable();
                $$('ptr-first-search').enable();

                $$('ptr-second-criteria').enable();
                $$('ptr-second-search').enable();

                $$('ptr-third-search').enable();

                $$('ptr-ok').enable().onclick(ok);
            }
        });

        search();
    };

    const reset = () => {
        $$('ptr-startDate').clear();
        $$('ptr-endDate').clear();
        $$('ptr-notApproved').setValue(true);
        $$('ptr-approved').setValue(true);
        $$('ptr-invoiced').setValue(false);
        $$('ptr-projectId').clear();
        $$('ptr-projectName').clear();

        const orgGroupParams = {
            name: '',
            nameSearchType: 0,
            orgGroupId: ''
        }
        AWS.callSoap(WS, 'searchSubordinateOrgGroups', orgGroupParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ptr-orgGroupId');
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
                const ctl = $$('ptr-clientCompanyId');
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
                const ctl = $$('ptr-employeeId');
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
                approved: $$('ptr-approved').getValue(),
                clientCompanyId: $$('ptr-clientCompanyId').getValue(),
                employeeId: $$('ptr-employeeId').getValue(),
                endDate: $$('ptr-endDate').getIntValue(),
                invoiced: $$('ptr-invoiced').getValue(),
                notApproved: $$('ptr-notApproved').getValue(),
                orgGroupId: $$('ptr-orgGroupId').getValue(),
                projectId: $$('ptr-projectId').getValue(),
                sortAsc: false,
                sortOn: '',
                startDate: $$('ptr-startDate').getIntValue()
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
        const type = $$('ptr-showIn').getValue();

        for (let i = 0; i < detailData.projectDetail.length; i++) {
            let row = detailData.projectDetail[i];
            if (type === 'h') {
                // hours
                row.estimate = Utils.format(Number(row.estimatedHours), "C", 0, 2);
                row.invoiced = Utils.format(Number(row.invoicedHours), "C", 0, 2);
                row.remaining = Utils.format(Number(row.remainingEstimatedHours), "C", 0, 2);
                row.billable = Utils.format(Number(row.billableHours), "C", 0, 2);
                row.nonBillable = Utils.format(Number(row.nonBillableHours), "C", 0, 2);
                row.unknown = Utils.format(Number(row.unknownHours), "C", 0, 2);
            } else {
                // dollars
                row.estimate = Utils.format(Number(row.estimateAmount), "DC", 0, 2);
                row.invoiced = Utils.format(Number(row.invoicedAmount), "DC", 0, 2);
                row.remaining = Utils.format(Number(row.remainingEstimatedAmount), "DC", 0, 2);
                row.billable = Utils.format(Number(row.billableAmount), "DC", 0, 2);
                row.nonBillable = Utils.format(Number(row.nonBillableAmount), "DC", 0, 2);
                row.unknown = Utils.format(Number(row.unknownAmount), "DC", 0, 2);
            }
        }

        $$('ptr-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects");
        if (detailData.projectDetail.length === detailData.cap)
            $$('ptr-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects (Limit)").setColor("red");
        else
            $$('ptr-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects").setColor("black");
        $$('ptr-billHours').setValue(detailData.billableHours);
        $$('ptr-nonBillHours').setValue(detailData.nonBillableHours);
        $$('ptr-unknHours').setValue(detailData.unknownHours);
        $$('ptr-busHours').setValue(detailData.totalBusinessHours);
        $$('ptr-totalHours').setValue(detailData.totalHours);
        $$('ptr-totalDollars').setValue(detailData.billableAmount);
        $$('ptr-estDollars').setValue(detailData.dollarsWithinEstimate);

        searchResGrid.addRecords(detailData.projectDetail);
    }

    function detail() {
        Utils.saveData(CURRENT_PROJECT_ID, searchResGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, searchResGrid.getSelectedRow().projectName);
        Framework.getChild();
    }

    $$('chooseProjId').onclick(() => {
        let formSearchGrid;        
        Utils.popup_open('ptr-search-project');

        const searchProjectCode = (searchType) => {
            let formSearchGrid;
            switch (searchType) {
                case 'category':
                    $$('ptr-project-data-search-type').setValue('Category');
                    $$('ptr-proj-chooseSpecificLabelAll').setValue('Project Categories');
                    $$('ptr-proj-chooseSpecificLabelSearch').setValue('Project Category');
                    break;
    
                case 'type':
                    $$('ptr-project-data-search-type').setValue('Type');
                    $$('ptr-proj-chooseSpecificLabelAll').setValue('Project Types');
                    $$('ptr-proj-chooseSpecificLabelSearch').setValue('Project Type');
                    break;
    
                case 'status':
                    $$('ptr-project-data-search-type').setValue('Status');
                    $$('ptr-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                    $$('ptr-proj-chooseSpecificLabelSearch').setValue('Project Status');
                    break;
            
                default:
                    break;
            }
            
            Utils.popup_open('ptr-project-data-search');
                
            const reset = () => {
                $$('ptr-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptr-proj-code-search').clear();
    
                $$('ptr-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptr-proj-descr-search').clear();
    
                $$('ptr-projD-reset').enable();
                $$('ptr-projD-search').enable();
    
                $$('ptr-projD-ok').disable();
    
                formSearchGrid.clear();
                $$('ptr-projD-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    switch (searchType) {
                        case 'category':
                            $$('ptr-proj-category').setValue(row.projectCategoryId, row.code);
                            break;
            
                        case 'type':
                            $$('ptr-proj-type').setValue(row.projectTypeId, row.code);
                            break;
            
                        case 'status':
                            $$('ptr-proj-status').setValue(row.projectStatusId, row.code);
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
    
            bindToEnum('ptr-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ptr-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 60},
                    {headerName: 'Description', field: 'description', width: 210}
                ];
    
                formSearchGrid = new AGGrid('ptr-projRes-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const params = {
                    code: $$('ptr-proj-code-search').getValue(),
                    codeSearchType: $$('ptr-proj-code-criteria').getValue(),
                    description: $$('ptr-proj-descr-search').getValue(),
                    descriptionSearchType: $$('ptr-proj-descr-criteria').getValue()
                }
                if (searchType === "category") {                    
                    AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('ptr-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                            } else {
                                $$('ptr-projD-count').setValue(`Displaying 0 Project Categories`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptr-projD-ok').enable);
                    
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
                                $$('ptr-projD-count').setValue(`Displaying ${records.length} Project Types`);
                            } else {
                                $$('ptr-projD-count').setValue(`Displaying 0 Project Types`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptr-projD-ok').enable);
                    
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
                                $$('ptr-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                            } else {
                                $$('ptr-projD-count').setValue(`Displaying 0 Project Statuses`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptr-projD-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                
            };
    
            $$('ptr-projD-reset').onclick(reset);
            $$('ptr-projD-search').onclick(search);
            $$('ptr-projD-ok').onclick(ok);
            $$('ptr-projD-cancel').onclick(cancel);
    
            $$('ptr-project-specific').onChange(() => {
                if ($$('ptr-project-specific').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('ptr-proj-code-criteria').disable();
                    $$('ptr-proj-code-search').disable();
    
                    $$('ptr-proj-descr-criteria').disable();
                    $$('ptr-proj-descr-search').disable();
    
                    switch (searchType) {
                        case 'category':
                            $$('ptr-proj-category').setValue(`Displaying 0 Project Categories`);
                            break;
                        
                        case 'status':
                            $$('ptr-proj-status').setValue(`Displaying 0 Project Statuses`);
                            break;
    
                        case 'type':
                            $$('ptr-proj-type').setValue(`Displaying 0 Project Types`);
                            break;
                    
                        default:
                            break;
                    }
                    $$('ptr-projD-ok').enable().onclick(() => {
                        $$('ptr-proj-' + searchType).setValue('');                         
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('ptr-proj-code-criteria').enable();
                    $$('ptr-proj-code-search').enable();
    
                    $$('ptr-proj-descr-criteria').enable();
                    $$('ptr-proj-descr-search').enable();
    
                    $$('ptr-projD-ok').enable().onclick(ok);
                }
            });
    
            search();
        }
            
        const reset = () => {
            $$('ptr-proj-projectName').clear();
            $$('ptr-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ptr-proj-summary').clear();
            $$('ptr-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);

            $$('ptr-proj-reset').enable();
            $$('ptr-proj-search').enable();

            $$('ptr-proj-ok').disable();

            formSearchGrid.clear();
            $$('ptr-proj-count').setValue(`Displaying 0 item`);

            $$('ptr-proj-category').clear();
            $$('ptr-proj-companyId').clear();
            $$('ptr-proj-status').clear();
            $$('ptr-proj-type').clear();

            const companyParams = {
                companyId: '',
                name: '',
                nameSearchType: 2
            }
            AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('ptr-proj-companyId');
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
                    const ctl = $$('ptr-proj-category');
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
                    const ctl = $$('ptr-proj-type');
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
                    const ctl = $$('ptr-proj-status');
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
                $$('ptr-projectId').setValue(row.projectId);
                $$('ptr-projectName').setValue(Number(row.projectName));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('ptr-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('ptr-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                    {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                    {headerName: 'Summary', field: 'description', width: 100},
                    {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                    {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                    {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                    {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                ];

            formSearchGrid = new AGGrid('ptr-proj-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        reset();
        const search = () => {
            const params = {
                category: $$('ptr-proj-category').getValue(),
                companyId: $$('ptr-proj-companyId').getValue(),
                projectName: $$('ptr-proj-projectName').getValue(),
                projectNameSearchType: $$('ptr-proj-projectNameSearchType').getValue(),
                status: $$('ptr-proj-status').getValue(),
                summary: $$('ptr-proj-summary').getValue(),
                summarySearchType: $$('ptr-proj-summarySearchType').getValue(),
                type: $$('ptr-proj-type').getValue()
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('ptr-proj-count').setValue(`Displaying ${records.length} Projects`);
                    } else {
                        $$('ptr-proj-count').setValue(`Displaying 0 Projects`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('ptr-proj-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });        
        };

        $$('ptr-proj-reset').onclick(reset);
        $$('ptr-proj-search').onclick(search);
        $$('ptr-proj-ok').onclick(ok);
        $$('ptr-proj-cancel').onclick(cancel);

        $$('ptr-proj-chooseProject').onChange(() => {
            if ($$('ptr-proj-chooseProject').getValue() === "A") {
                formSearchGrid.clear();
                $$('ptr-proj-category').disable();
                $$('ptr-proj-companyId').disable();
                $$('ptr-proj-projectName').disable();
                $$('ptr-proj-projectNameSearchType').disable();
                $$('ptr-proj-status').disable();
                $$('ptr-proj-summary').disable();
                $$('ptr-proj-summarySearchType').disable();
                $$('ptr-proj-type').disable();

                $$('ptr-proj-count').setValue(`Displaying 0 Projects`);

                $$('ptr-proj-ok').enable().onclick(() => {
                    $$('ptr-projectId').clear();
                    $$('ptr-projectName').clear();
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('ptr-proj-category').enable();
                $$('ptr-proj-companyId').enable();
                $$('ptr-proj-projectName').enable();
                $$('ptr-proj-projectNameSearchType').enable();
                $$('ptr-proj-status').enable();
                $$('ptr-proj-summary').enable();
                $$('ptr-proj-summarySearchType').enable();
                $$('ptr-proj-type').enable();

                $$('ptr-proj-ok').enable().onclick(ok);
            }
        });

        search();
    });

    $$('reset').onclick(reset);
    $$('search').onclick(async () => {
        await getProjectReportData();
        updateProjectReportData();
    });

    $$('detail').onclick(detail);
    $$('report').onclick(() => {
        const params = {
            approved: $$('ptr-approved').getValue(),
            clientCompanyId: $$('ptr-clientCompanyId').getValue(),
            employeeId: $$('ptr-employeeId').getValue(),
            endDate: $$('ptr-endDate').getIntValue(),
            invoiced: $$('ptr-invoiced').getValue(),
            notApproved: $$('ptr-notApproved').getValue(),
            orgGroupId: $$('ptr-orgGroupId').getValue(),
            projectId: $$('ptr-projectId').getValue(),
            showInDollars: $$('ptr-showIn') === "d",
            startDate: $$('ptr-startDate').getIntValue()
        };
        
        AWS.callSoap(WS, 'getProjectReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });
})();
