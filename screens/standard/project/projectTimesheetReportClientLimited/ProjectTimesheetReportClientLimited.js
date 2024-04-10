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
    const WS = 'StandardProjectProjectTimesheetReportClientLimited';
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
        {headerName: "Project Summary", field: "summary", cellRenderer: 'projectInfo', width: 900},
        {headerName: "Hours", field: "billable", type: "numericColumn", width: 100}
    ];

    const searchResGrid = new AGGrid('searchResGrid', searchResColumnDefs);
    searchResGrid.addComponent('projectInfo', ProjectInfo);
    searchResGrid.show();
    searchResGrid.setOnSelectionChanged($$('detail').enable);
    searchResGrid.setOnRowDoubleClicked(detail);

    const reset = () => {
        $$('ptrcl-notApproved').setValue(true);
        $$('ptrcl-approved').setValue(true);
        $$('ptrcl-invoiced').setValue(false);
        $$('ptrcl-projectId').clear();
        $$('ptrcl-projectName').clear();
        $$('ptrcl-endDate').clear();
        $$('ptrcl-startDate').clear();
    }

    let companyId;
    AWS.callSoap(WS, 'getCompany').then(data => {
        if (data.wsStatus === '0') {
            $$('ptrcl-companyId').setValue(data.name);
            companyId = data.id;
        }
    });
    
    reset();

    function getProjectReportData() {
        return new Promise(function(resolve, reject) {
            const params = {
                approved: $$('ptrcl-approved').getValue(),
                clientCompanyId: companyId,
                endDate: $$('ptrcl-endDate').getIntValue(),
                invoiced: $$('ptrcl-invoiced').getValue(),
                notApproved: $$('ptrcl-notApproved').getValue(),
                projectId: $$('ptrcl-projectId').getValue(),
                sortAsc: false,
                sortOn: '',
                startDate: $$('ptrcl-startDate').getIntValue()
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
            row.remaining = Utils.format(Number(row.remainingEstimatedHours), "C", 0, 2);
            row.billable = Utils.format(Number(row.billableHours), "C", 0, 2);
            
        }

        $$('ptrcl-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects");
        if (detailData.projectDetail.length == detailData.cap)
            $$('ptrcl-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects (Limit)").setColor("red");
        else
            $$('ptrcl-searchResCount').setValue("Displaying " + detailData.projectDetail.length + " Projects").setColor("black");
        $$('ptrcl-billHours').setValue(detailData.billableHours);

        searchResGrid.addRecords(detailData.projectDetail);
    }

    function detail() {
        Utils.saveData(CURRENT_PROJECT_ID, searchResGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, searchResGrid.getSelectedRow().projectName);
        Framework.getChild();
    }

    $$('chooseProjId').onclick(() => {
        let formSearchGrid;        
        Utils.popup_open('ptrcl-search-project');

        const searchProjectCode = (searchType) => {
            let formSearchGrid;
            switch (searchType) {
                case 'category':
                    $$('ptrcl-project-data-search-type').setValue('Category');
                    $$('ptrcl-proj-chooseSpecificLabelAll').setValue('Project Categories');
                    $$('ptrcl-proj-chooseSpecificLabelSearch').setValue('Project Category');
                    break;
    
                case 'type':
                    $$('ptrcl-project-data-search-type').setValue('Type');
                    $$('ptrcl-proj-chooseSpecificLabelAll').setValue('Project Types');
                    $$('ptrcl-proj-chooseSpecificLabelSearch').setValue('Project Type');
                    break;
    
                case 'status':
                    $$('ptrcl-project-data-search-type').setValue('Status');
                    $$('ptrcl-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                    $$('ptrcl-proj-chooseSpecificLabelSearch').setValue('Project Status');
                    break;
            
                default:
                    break;
            }
            
            Utils.popup_open('ptrcl-project-data-search');
                
            const reset = () => {
                $$('ptrcl-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptrcl-proj-code-search').clear();
    
                $$('ptrcl-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ptrcl-proj-descr-search').clear();
    
                $$('ptrcl-projD-reset').enable();
                $$('ptrcl-projD-search').enable();
    
                $$('ptrcl-projD-ok').disable();
    
                formSearchGrid.clear();
                $$('ptrcl-projD-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    switch (searchType) {
                        case 'category':
                            $$('ptrcl-proj-category').setValue(row.projectCategoryId, row.code);
                            break;
            
                        case 'type':
                            $$('ptrcl-proj-type').setValue(row.projectTypeId, row.code);
                            break;
            
                        case 'status':
                            $$('ptrcl-proj-status').setValue(row.projectStatusId, row.code);
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
    
            bindToEnum('ptrcl-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ptrcl-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 60},
                    {headerName: 'Description', field: 'description', width: 210}
                ];
    
                formSearchGrid = new AGGrid('ptrcl-projRes-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const params = {
                    code: $$('ptrcl-proj-code-search').getValue(),
                    codeSearchType: $$('ptrcl-proj-code-criteria').getValue(),
                    description: $$('ptrcl-proj-descr-search').getValue(),
                    descriptionSearchType: $$('ptrcl-proj-descr-criteria').getValue()
                }
                if (searchType === "category") {                    
                    AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('ptrcl-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                            } else {
                                $$('ptrcl-projD-count').setValue(`Displaying 0 Project Categories`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptrcl-projD-ok').enable);
                    
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
                                $$('ptrcl-projD-count').setValue(`Displaying ${records.length} Project Types`);
                            } else {
                                $$('ptrcl-projD-count').setValue(`Displaying 0 Project Types`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptrcl-projD-ok').enable);
                    
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
                                $$('ptrcl-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                            } else {
                                $$('ptrcl-projD-count').setValue(`Displaying 0 Project Statuses`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('ptrcl-projD-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                
            };
    
            $$('ptrcl-projD-reset').onclick(reset);
            $$('ptrcl-projD-search').onclick(search);
            $$('ptrcl-projD-ok').onclick(ok);
            $$('ptrcl-projD-cancel').onclick(cancel);
    
            $$('ptrcl-project-specific').onChange(() => {
                if ($$('ptrcl-project-specific').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('ptrcl-proj-code-criteria').disable();
                    $$('ptrcl-proj-code-search').disable();
    
                    $$('ptrcl-proj-descr-criteria').disable();
                    $$('ptrcl-proj-descr-search').disable();
    
                    switch (searchType) {
                        case 'category':
                            $$('ptrcl-proj-category').setValue(`Displaying 0 Project Categories`);
                            break;
                        
                        case 'status':
                            $$('ptrcl-proj-status').setValue(`Displaying 0 Project Statuses`);
                            break;
    
                        case 'type':
                            $$('ptrcl-proj-type').setValue(`Displaying 0 Project Types`);
                            break;
                    
                        default:
                            break;
                    }
                    $$('ptrcl-projD-ok').enable().onclick(() => {
                        $$('ptrcl-proj-' + searchType).setValue('');                         
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('ptrcl-proj-code-criteria').enable();
                    $$('ptrcl-proj-code-search').enable();
    
                    $$('ptrcl-proj-descr-criteria').enable();
                    $$('ptrcl-proj-descr-search').enable();
    
                    $$('ptrcl-projD-ok').enable().onclick(ok);
                }
            });
    
            search();
        }
            
        const reset = () => {
            $$('ptrcl-proj-projectName').clear();
            $$('ptrcl-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ptrcl-proj-summary').clear();
            $$('ptrcl-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);

            $$('ptrcl-proj-reset').enable();
            $$('ptrcl-proj-search').enable();

            $$('ptrcl-proj-ok').disable();

            formSearchGrid.clear();
            $$('ptrcl-proj-count').setValue(`Displaying 0 item`);

            $$('ptrcl-proj-category').clear();
            $$('ptrcl-proj-companyId').setValue($$('ptrcl-companyId').getValue());
            $$('ptrcl-proj-status').clear();
            $$('ptrcl-proj-type').clear();

            const params = {
                code: '',
                codeSearchType: 2,
                description: '',
                descriptionSearchType: 2
            }
            AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('ptrcl-proj-category');
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
                    const ctl = $$('ptrcl-proj-type');
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
                    const ctl = $$('ptrcl-proj-status');
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
                $$('ptrcl-projectId').setValue(row.projectId);
                $$('ptrcl-projectName').setValue(Number(row.projectName));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('ptrcl-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('ptrcl-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                    {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                    {headerName: 'Summary', field: 'description', width: 100},
                    {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                    {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                    {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                    {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                ];

            formSearchGrid = new AGGrid('ptrcl-proj-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        reset();
        const search = () => {
            const params = {
                category: $$('ptrcl-proj-category').getValue(),
                companyId: companyId,
                projectName: $$('ptrcl-proj-projectName').getValue(),
                projectNameSearchType: $$('ptrcl-proj-projectNameSearchType').getValue(),
                status: $$('ptrcl-proj-status').getValue(),
                summary: $$('ptrcl-proj-summary').getValue(),
                summarySearchType: $$('ptrcl-proj-summarySearchType').getValue(),
                type: $$('ptrcl-proj-type').getValue()
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('ptrcl-proj-count').setValue(`Displaying ${records.length} Projects`);
                    } else {
                        $$('ptrcl-proj-count').setValue(`Displaying 0 Projects`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('ptrcl-proj-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });        
        };

        $$('ptrcl-proj-reset').onclick(reset);
        $$('ptrcl-proj-search').onclick(search);
        $$('ptrcl-proj-ok').onclick(ok);
        $$('ptrcl-proj-cancel').onclick(cancel);

        $$('ptrcl-proj-chooseProject').onChange(() => {
            if ($$('ptrcl-proj-chooseProject').getValue() === "A") {
                formSearchGrid.clear();
                $$('ptrcl-proj-category').disable();
                $$('ptrcl-proj-projectName').disable();
                $$('ptrcl-proj-projectNameSearchType').disable();
                $$('ptrcl-proj-status').disable();
                $$('ptrcl-proj-summary').disable();
                $$('ptrcl-proj-summarySearchType').disable();
                $$('ptrcl-proj-type').disable();

                $$('ptrcl-proj-count').setValue(`Displaying 0 Projects`);

                $$('ptrcl-proj-ok').enable().onclick(() => {
                    $$('ptrcl-projectId').clear();
                    $$('ptrcl-projectName').clear();
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('ptrcl-proj-category').enable();
                $$('ptrcl-proj-projectName').enable();
                $$('ptrcl-proj-projectNameSearchType').enable();
                $$('ptrcl-proj-status').enable();
                $$('ptrcl-proj-summary').enable();
                $$('ptrcl-proj-summarySearchType').enable();
                $$('ptrcl-proj-type').enable();

                $$('ptrcl-proj-ok').enable().onclick(ok);
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
            approved: $$('ptrcl-approved').getValue(),
            clientCompanyId: companyId,
            invoiced: $$('ptrcl-invoiced').getValue(),
            notApproved: $$('ptrcl-notApproved').getValue(),
            projectId: $$('ptrcl-projectId').getValue(),
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
