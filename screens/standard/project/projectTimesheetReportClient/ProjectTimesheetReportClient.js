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
    const WS = 'StandardProjectProjectTimesheetReportClient';
    let detailData;

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
                    $$('project-info-summary').setValue(params.data.summary);
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

    const reset = () => {
        $$('ptrc-notApproved').setValue(true);
        $$('ptrc-approved').setValue(true);
        $$('ptrc-invoiced').setValue(false);
        $$('ptrc-projectId').clear();
        $$('ptrc-projectName').clear();
        $$('ptrc-endDate').clear();
        $$('ptrc-startDate').clear();
    }

    let companyId;
    AWS.callSoap(WS, 'getCompany').then(data => {
        if (data.wsStatus === '0') {
            $$('ptrc-companyId').setValue(data.name);
            companyId = data.id;
        }
    });
    
    reset();

    function getProjectReportData() {
        return new Promise(function(resolve, reject) {
            const params = {
                approved: $$('ptrc-approved').getValue(),
                clientCompanyId: companyId,
                endDate: $$('ptrc-endDate').getIntValue(),
                invoiced: $$('ptrc-invoiced').getValue(),
                notApproved: $$('ptrc-notApproved').getValue(),
                projectId: $$('ptrc-projectId').getValue(),
                sortAsc: false,
                sortOn: '',
                startDate: $$('ptrc-startDate').getIntValue()
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

        $$('ptrc-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects");
        if (detailData.projectDetail.length == detailData.cap)
            $$('ptrc-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects (Limit)").setColor("red");
        else
            $$('ptrc-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects").setColor("black");
        $$('ptrc-billHours').setValue(detailData.billableHours);
        $$('ptrc-nonBillHours').setValue(detailData.nonBillableHours);
        $$('ptrc-unknHours').setValue(detailData.unknownHours);
        $$('ptrc-totalHours').setValue(detailData.totalHours);

        searchResGrid.addRecords(detailData.projectDetail);
    }

    function detail() {
        Utils.saveData(CURRENT_PROJECT_ID, searchResGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, searchResGrid.getSelectedRow().projectName);
        Framework.getChild();
    }

    $$('chooseProjId').onclick(() => {
        let formSearchGrid;        
        Utils.popup_open('ptrc-search-project');

        const searchProjectCode = (searchType) => {
            let formSearchGrid;
            switch (searchType) {
                case 'category':
                    $$('ptrc-project-data-search-type').setValue('Category');
                    $$('ptrc-proj-chooseSpecificLabelAll').setValue('Project Categories');
                    $$('ptrc-proj-chooseSpecificLabelSearch').setValue('Project Category');
                    break;
    
                case 'type':
                    $$('ptrc-project-data-search-type').setValue('Type');
                    $$('ptrc-proj-chooseSpecificLabelAll').setValue('Project Types');
                    $$('ptrc-proj-chooseSpecificLabelSearch').setValue('Project Type');
                    break;
    
                case 'status':
                    $$('ptrc-project-data-search-type').setValue('Status');
                    $$('ptrc-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                    $$('ptrc-proj-chooseSpecificLabelSearch').setValue('Project Status');
                    break;
            
                default:
                    break;
            }
            
            Utils.popup_open('ptrc-project-data-search');
                
            const reset = () => {
                $$('ptrc-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptrc-proj-code-search').clear();
    
                $$('ptrc-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptrc-proj-descr-search').clear();
    
                $$('ptrc-projD-reset').enable();
                $$('ptrc-projD-search').enable();
    
                $$('ptrc-projD-ok').disable();
    
                formSearchGrid.clear();
                $$('ptrc-projD-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    switch (searchType) {
                        case 'category':
                            $$('ptrc-proj-category').setValue(row.projectCategoryId, row.code);
                            break;
            
                        case 'type':
                            $$('ptrc-proj-type').setValue(row.projectTypeId, row.code);
                            break;
            
                        case 'status':
                            $$('ptrc-proj-status').setValue(row.projectStatusId, row.code);
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
    
            bindToEnum('ptrc-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ptrc-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 60},
                    {headerName: 'Description', field: 'description', width: 210}
                ];
    
                formSearchGrid = new AGGrid('ptrc-projRes-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const params = {
                    code: $$('ptrc-proj-code-search').getValue(),
                    codeSearchType: $$('ptrc-proj-code-criteria').getValue(),
                    description: $$('ptrc-proj-descr-search').getValue(),
                    descriptionSearchType: $$('ptrc-proj-descr-criteria').getValue()
                }
                if (searchType === "category") {                    
                    AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('ptrc-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                            } else {
                                $$('ptrc-projD-count').setValue(`Displaying 0 Project Categories`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptrc-projD-ok').enable);
                    
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
                                $$('ptrc-projD-count').setValue(`Displaying ${records.length} Project Types`);
                            } else {
                                $$('ptrc-projD-count').setValue(`Displaying 0 Project Types`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptrc-projD-ok').enable);
                    
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
                                $$('ptrc-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                            } else {
                                $$('ptrc-projD-count').setValue(`Displaying 0 Project Statuses`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptrc-projD-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                
            };
    
            $$('ptrc-projD-reset').onclick(reset);
            $$('ptrc-projD-search').onclick(search);
            $$('ptrc-projD-ok').onclick(ok);
            $$('ptrc-projD-cancel').onclick(cancel);
    
            $$('ptrc-project-specific').onChange(() => {
                if ($$('ptrc-project-specific').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('ptrc-proj-code-criteria').disable();
                    $$('ptrc-proj-code-search').disable();
    
                    $$('ptrc-proj-descr-criteria').disable();
                    $$('ptrc-proj-descr-search').disable();
    
                    switch (searchType) {
                        case 'category':
                            $$('ptrc-proj-category').setValue(`Displaying 0 Project Categories`);
                            break;
                        
                        case 'status':
                            $$('ptrc-proj-status').setValue(`Displaying 0 Project Statuses`);
                            break;
    
                        case 'type':
                            $$('ptrc-proj-type').setValue(`Displaying 0 Project Types`);
                            break;
                    
                        default:
                            break;
                    }
                    $$('ptrc-projD-ok').enable().onclick(() => {
                        $$('ptrc-proj-' + searchType).setValue('');                         
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('ptrc-proj-code-criteria').enable();
                    $$('ptrc-proj-code-search').enable();
    
                    $$('ptrc-proj-descr-criteria').enable();
                    $$('ptrc-proj-descr-search').enable();
    
                    $$('ptrc-projD-ok').enable().onclick(ok);
                }
            });
    
            search();
        }
            
        const reset = () => {
            $$('ptrc-proj-projectName').clear();
            $$('ptrc-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ptrc-proj-summary').clear();
            $$('ptrc-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);

            $$('ptrc-proj-reset').enable();
            $$('ptrc-proj-search').enable();

            $$('ptrc-proj-ok').disable();

            formSearchGrid.clear();
            $$('ptrc-proj-count').setValue(`Displaying 0 item`);

            $$('ptrc-proj-category').clear();
            $$('ptrc-proj-companyId').setValue($$('ptrc-companyId').getValue());
            $$('ptrc-proj-status').clear();
            $$('ptrc-proj-type').clear();

            const params = {
                code: '',
                codeSearchType: 2,
                description: '',
                descriptionSearchType: 2
            }
            AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('ptrc-proj-category');
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
                    const ctl = $$('ptrc-proj-type');
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
                    const ctl = $$('ptrc-proj-status');
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
                $$('ptrc-projectId').setValue(row.projectId);
                $$('ptrc-projectName').setValue(Number(row.projectName));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('ptrc-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('ptrc-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                    {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                    {headerName: 'Summary', field: 'description', width: 100},
                    {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                    {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                    {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                    {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                ];

            formSearchGrid = new AGGrid('ptrc-proj-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        reset();
        const search = () => {
            const params = {
                category: $$('ptrc-proj-category').getValue(),
                companyId: companyId,
                projectName: $$('ptrc-proj-projectName').getValue(),
                projectNameSearchType: $$('ptrc-proj-projectNameSearchType').getValue(),
                status: $$('ptrc-proj-status').getValue(),
                summary: $$('ptrc-proj-summary').getValue(),
                summarySearchType: $$('ptrc-proj-summarySearchType').getValue(),
                type: $$('ptrc-proj-type').getValue()
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('ptrc-proj-count').setValue(`Displaying ${records.length} Projects`);
                    } else {
                        $$('ptrc-proj-count').setValue(`Displaying 0 Projects`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('ptrc-proj-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });        
        };

        $$('ptrc-proj-reset').onclick(reset);
        $$('ptrc-proj-search').onclick(search);
        $$('ptrc-proj-ok').onclick(ok);
        $$('ptrc-proj-cancel').onclick(cancel);

        $$('ptrc-proj-chooseProject').onChange(() => {
            if ($$('ptrc-proj-chooseProject').getValue() === "A") {
                formSearchGrid.clear();
                $$('ptrc-proj-category').disable();
                $$('ptrc-proj-projectName').disable();
                $$('ptrc-proj-projectNameSearchType').disable();
                $$('ptrc-proj-status').disable();
                $$('ptrc-proj-summary').disable();
                $$('ptrc-proj-summarySearchType').disable();
                $$('ptrc-proj-type').disable();

                $$('ptrc-proj-count').setValue(`Displaying 0 Projects`);

                $$('ptrc-proj-ok').enable().onclick(() => {
                    $$('ptrc-projectId').clear();
                    $$('ptrc-projectName').clear();
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('ptrc-proj-category').enable();
                $$('ptrc-proj-projectName').enable();
                $$('ptrc-proj-projectNameSearchType').enable();
                $$('ptrc-proj-status').enable();
                $$('ptrc-proj-summary').enable();
                $$('ptrc-proj-summarySearchType').enable();
                $$('ptrc-proj-type').enable();

                $$('ptrc-proj-ok').enable().onclick(ok);
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
            approved: $$('ptrc-approved').getValue(),
            clientCompanyId: companyId,
            invoiced: $$('ptrc-invoiced').getValue(),
            notApproved: $$('ptrc-notApproved').getValue(),
            projectId: $$('ptrc-projectId').getValue(),
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
})();
