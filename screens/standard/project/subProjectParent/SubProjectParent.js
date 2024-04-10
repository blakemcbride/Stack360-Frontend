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

    const WS = 'StandardProjectSubProjectParent';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary);

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
                    $$('project-info-summary').setValue(params.data.description);
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
        span.innerText = params.data.description;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    let subProjectsGrid;
    let parentProjectsGrid;
 
    const projectsColumnDefs = [
        {headerName: "ID", field: "projectName", type: "numericColumn", width: 150},
        {headerName: "Summary", field: "description", cellRenderer: "projectInfo", width: 560},
        {headerName: "Date Created", field: "dateReportedFormatted", width: 200},
        {headerName: "External Reference", field: "reference", width: 300},
        {headerName: "Requesting Company (Group)", field: "requestingNameFormatted", width: 400}
    ];
    subProjectsGrid = new AGGrid('subProjectsGrid', projectsColumnDefs);
    subProjectsGrid.addComponent('projectInfo', ProjectInfo);
    subProjectsGrid.show();  

    parentProjectsGrid = new AGGrid('parentProjectsGrid', projectsColumnDefs);
    parentProjectsGrid.addComponent('projectInfo', ProjectInfo);
    parentProjectsGrid.show();

    function getListSubProjectsForProject() {
        const param = {
            parentId: projectId
        }
        AWS.callSoap(WS, 'listSubProjectsForProject', param).then(data => {
            $$('open').disable();
            $$('disassociate').disable();
            if (data.wsStatus === '0') {     
                subProjectsGrid.clear();
                data.item = Utils.assureArray(data.item);
                subProjectsGrid.addRecords(data.item);
                $$('spp-statusSub').setValue('Displaying ' + data.item.length + ' Sub-Projects');
                subProjectsGrid.setOnSelectionChanged((x) => {
                    $$('open').enable(x);
                    $$('disassociate').enable(x);
                });
                subProjectsGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    function getListParentProjectsForProject() {
        const param = {
            subProjectId: projectId
        }
        AWS.callSoap(WS, 'listParentProjectsForProject', param).then(data => {
            if (data.wsStatus === '0') {     
                parentProjectsGrid.clear();
                data.item = Utils.assureArray(data.item);
                parentProjectsGrid.addRecords(data.item);
                $$('spp-statusParent').setValue('Displaying ' + data.item.length + ' Sub-Projects');
            }
        });   
    }

    getListSubProjectsForProject();
    getListParentProjectsForProject();

    const searchData = (searchData) => {
        let formSearchGrid;
        switch (searchData) {
            case 'orgGroup':
                $$('ogpl-data-search-type').setValue('Organizational Group');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;

            case 'client':
                $$('ogpl-data-search-type').setValue('Requesting Company');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;
            
            case 'category':
                $$('ogpl-data-search-type').setValue('Project Category');

                $$('ogpl-first-label').setValue('Code:');

                $$('ogpl-second-label').show().setValue('Description');
                $$('ogpl-second-criteria').show();
                $$('ogpl-second-search').show();
                break;
            
            case 'type':
                $$('ogpl-data-search-type').setValue('Project Type');

                $$('ogpl-first-label').setValue('Code:');

                $$('ogpl-second-label').show().setValue('Description');
                $$('ogpl-second-criteria').show();
                $$('ogpl-second-search').show();
                break;
            default:
                break;
        }
        
        Utils.popup_open('ogpl-data-search');
            
        const reset = () => {
            $$('ogpl-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ogpl-first-search').clear();

            $$('ogpl-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ogpl-second-search').clear();

            $$('ogpl-reset').enable();
            $$('ogpl-search').enable();

            $$('ogpl-ok').disable();

            formSearchGrid.clear();
            $$('ogpl-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchData) {
                    case 'client':
                        $$('ogpl-add-proj-client').setValue(row.orgGroupId, row.name);
                        break;
            
                    case 'orgGroup':
                        $$('ogpl-add-proj-orgGroup').setValue(row.id, row.name);
                        break;
        
                    case 'category':
                        $$('ogpl-add-proj-category').setValue(row.projectCategoryId, row.code + ' - ' + row.description);
                        break;

                    case 'type':
                        $$('ogpl-add-proj-type').setValue(row.projectTypeId, row.code + ' - ' + row.description);
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

        bindToEnum('ogpl-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('ogpl-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs;

            switch (searchData) {                    
                case "orgGroup":
                    columnDefs = [
                        {headerName: 'Organizational Group Name', field: 'name', width: 210}
                    ];
                    break;

                case "client":
                    columnDefs = [
                        {headerName: 'Company Name', field: 'name', width: 170},
                        {headerName: 'Type', field: 'orgGroupTypeName', width: 40},
                    ];
                    break;

                case "category":
                    columnDefs = [
                        {headerName: 'Code', field: 'code', width: 70},
                        {headerName: 'Description', field: 'description', width: 140}
                    ];
                    break;

                case "type":
                    columnDefs = [
                        {headerName: 'Code', field: 'code', width: 70},
                        {headerName: 'Description', field: 'description', width: 140}
                    ];
                    break;
                default:
                    columnDefs = [];
                    break;
            }

            formSearchGrid = new AGGrid('ogpl-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();
            
        const search = () => {
            if (searchData === "client") {
                const params = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    companyId: '',
                    autoDefault: false
                }
                AWS.callSoap(WS, 'searchCompanyByType', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.companies) {
                            const records = Utils.assureArray(data.companies);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "orgGroup") {
                const orgGroupParams = {
                    autoDefault: true,
                    companyId: $$('ogpl-add-proj-client').getValue(),
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    projectId: ''
                };
                AWS.callSoap(WS, 'searchOrgGroupsForCompany', orgGroupParams).then(function (data) {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Organizational Groups`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Organizational Groups`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "category") {
                const params = {
                    description: $$('ogpl-second-search').getValue(),
                    descriptionSearchType: $$('ogpl-second-criteria').getValue(),
                    code: $$('ogpl-first-search').getValue(),
                    codeSearchType: $$('ogpl-first-criteria').getValue(),
                    parentId: ''
                }
                AWS.callSoap(WS, 'searchProjectCategories', params).then(function (data) {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.projectCategories) {
                            const records = Utils.assureArray(data.projectCategories);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Project Categories`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Project Categories`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "type") {
                const typesParams = {
                    code: $$('ogpl-first-search').getValue(),
                    codeSearchType: $$('ogpl-first-criteria').getValue(),
                    description: $$('ogpl-second-search').getValue(),
                    descriptionSearchType: $$('ogpl-second-criteria').getValue(),
                    parentId: '',
                    typeId: ''
                }
                AWS.callSoap(WS, 'searchProjectTypes', typesParams).then(function (data) {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.projectTypes) {
                            const records = Utils.assureArray(data.projectTypes);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Project Types`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Project Types`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            }
        };

        $$('ogpl-reset').onclick(reset);
        $$('ogpl-search').onclick(search);
        $$('ogpl-ok').onclick(ok);
        $$('ogpl-cancel').onclick(cancel);
        search();
    };
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
                autoDefault: false,
                name: '',
                nameSearchType: 0
            }
            AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
                if (res.wsStatus === "0") {
                    res.companies = Utils.assureArray(res.companies);
                    const ctl = $$('bdr-proj-companyId');
                    ctl.clear();
                    if (res.companies.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.companies.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.companies.length; i++)
                            ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchData('client');
                    });
                }
            });

            const params = {
                code: '',
                codeSearchType: 2,
                description: '',
                descriptionSearchType: 2,
                parentId: ''
            }
            AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
                if (res.wsStatus === "0") {
                    res.projectCategories = Utils.assureArray(res.projectCategories);
                    const ctl = $$('bdr-proj-category');
                    ctl.clear();
                    if (res.projectCategories.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.projectCategories.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.projectCategories.length; i++)
                            ctl.add(res.projectCategories[i].projectCategoryId, res.projectCategories[i].code);
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
                    res.projectTypes = Utils.assureArray(res.projectTypes);
                    const ctl = $$('bdr-proj-type');
                    ctl.clear();
                    if (res.projectTypes.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.projectTypes.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.projectTypes.length; i++)
                            ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].code);
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
                            ctl.add(res.item[i].id, res.item[i].code);
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
            const rows = formSearchGrid.getSelectedRows();
            if (rows) {
                let subProjectIds = [];
                for (let i = 0; i < rows.length; i++) {
                    subProjectIds.push(rows[i].projectId);
                }
                const params = {
                    parentId: projectId,
                    subProjectIds: subProjectIds
                }
                AWS.callSoap(WS, 'associateSubProjectsToParentProject', params).then(function (res) {
                    if (res.wsStatus === "0") {
                        getListSubProjectsForProject();
                    }
                });
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
            formSearchGrid.multiSelect();
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        reset();
        const search = () => {
            const params = {
                category: $$('bdr-proj-category').getValue(),
                companyId: $$('bdr-proj-companyId').getValue(),
                parentId: projectId,
                projectName: $$('bdr-proj-projectName').getValue(),
                projectNameSearchType: $$('bdr-proj-projectNameSearchType').getValue(),
                status: $$('bdr-proj-status').getValue(),
                summary: $$('bdr-proj-summary').getValue(),
                summarySearchType: $$('bdr-proj-summarySearchType').getValue(),
                type: $$('bdr-proj-type').getValue()
            }
            AWS.callSoap(WS, 'searchForProjectsToAssociate', params).then(data => {
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
        search();
    }

    $$('add').onclick(async () => {
        const companyParams = {
            autoDefault: true,
            name: '',
            nameSearchType: 0
        };
        await AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.companies = Utils.assureArray(res.companies);
                const ctl = $$('ogpl-add-proj-client');
                ctl.clear();
                if (res.companies.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.companies.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.companies.length; i++)
                        ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
                } else {
                    ctl.forceSelect();
                }
                if (res.selectedItem) {
                    ctl.setValue(res.selectedItem.orgGroupId);   
                }
                ctl.setSelectFunction(() => {
                    searchData('client');
                });
            }
        });
        const orgGroupParams = {
            autoDefault: true,
            companyId: $$('ogpl-add-proj-client').getValue(),
            name: '',
            nameSearchType: 0
        }
        AWS.callSoap(WS, 'searchOrgGroupsForCompany', orgGroupParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-add-proj-orgGroup');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].name);
                } else {
                    ctl.forceSelect();
                }
                if (res.selectedItem) {
                    ctl.setValue(res.selectedItem.id);
                }
                ctl.setSelectFunction(() => {
                    searchData('orgGroup');
                });
            }
        });

        const categoriesParams = {
            categoryId: '',
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            parentId: projectId
        }
        AWS.callSoap(WS, 'searchProjectCategories', categoriesParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.projectCategories = Utils.assureArray(res.projectCategories);
                const ctl = $$('ogpl-add-proj-category');
                ctl.clear();
                if (res.projectCategories.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.projectCategories.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.projectCategories.length; i++)
                        ctl.add(res.projectCategories[i].projectCategoryId, res.projectCategories[i].code + ' - ' + res.projectCategories[i].description);
                } else {
                    ctl.forceSelect();
                }
                ctl.setSelectFunction(() => {
                    searchData('category');
                });
                if (res.selectedItem) {
                    ctl.setValue(res.selectedItem.projectCategoryId);
                }
            }
        });

        const typesParams = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            parentId: projectId,
            typeId: ''
        }
        AWS.callSoap(WS, 'searchProjectTypes', typesParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.projectTypes = Utils.assureArray(res.projectTypes);
                const ctl = $$('ogpl-add-proj-type');
                ctl.clear();
                if (res.projectTypes.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.projectTypes.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.projectTypes.length; i++)
                        ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].code + ' - ' + res.projectTypes[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                if (res.selectedItem) {
                    ctl.setValue(res.selectedItem.projectTypeId);
                }
                ctl.setSelectFunction(() => {
                    searchData('type');
                });
            }
        });

        function getDefaultsForCategoryAndType() {
            const params = {
                projectCategoryId: $$('ogpl-add-proj-category').getValue(),
                projectTypeId: $$('ogpl-add-proj-type').getValue()
            };
            AWS.callSoap(WS, 'getDefaultsForCategoryAndType', params).then(res => {
                if (res.wsStatus === "0") {
                    if (!res.routeId) {
                        Utils.showMessage('Error', 'There is not a valid Project Route associated to the selected Category/Type combination.  Please note that if there is a Project Route associated to this combination, ensure that the Project Route has an Initial Route Stop and Project Status.  Projects can not be created from a Standard Project when it has an invalid Project Route.');
                    }
                }
            });
        }
        $$('ogpl-add-proj-category').onChange(() => {
            if ($$('ogpl-add-proj-category').getValue() && $$('ogpl-add-proj-type').getValue()) {
                getDefaultsForCategoryAndType();                
            }
        });
        $$('ogpl-add-proj-type').onChange(() => {
            if ($$('ogpl-add-proj-category').getValue() && $$('ogpl-add-proj-type').getValue()) {
                getDefaultsForCategoryAndType();                
            }
        });

        Utils.popup_open('ogpl-add-project');

        $$('ogpl-add-proj-ok').onclick(() => {
            const params = {
                description: $$('ogpl-add-proj-summary').getValue(),
                detail: $$('ogpl-add-proj-detail').getValue(),
                parentId: projectId,
                projectCategoryId: $$('ogpl-add-proj-category').getValue(),
                projectTypeId: $$('ogpl-add-proj-type').getValue(),
                requestingOrgGroupId: $$('ogpl-add-proj-orgGroup').getValue(),
                routeId: $$('ogpl-add-proj-client').getValue()
            }

            AWS.callSoap(WS, 'newSubProjectForParentProject', params).then(data => {
                if (data.wsStatus === "0") {
                    if ($$('ogpl-add-proj-openDetail').getValue()) {
                        Utils.saveData(CURRENT_PROJECT_ID, data.projectId);
                        Utils.saveData(CURRENT_PROJECT_NAME, data.projectName);
                        Framework.getChild();
                    } else {
                        Utils.popup_close();
                    }
                }  
            });
        });

        $$('ogpl-add-proj-cancel').onclick(() => {
            Utils.popup_close();
        });
    });
    function edit() {
        const row = subProjectsGrid.getSelectedRow();
        Utils.saveData(CURRENT_PROJECT_ID, row.projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, row.projectName);
        Framework.getChild();
    }
    $$('open').onclick(edit);
    $$('associate').onclick(searchProject);
    $$('disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to disassociate the selected Sub-Project?', function () {
            const row = subProjectsGrid.getSelectedRow();
            const params = {
                parentId: projectId,
                subProjectIds: row.projectId
            }
            AWS.callSoap(WS, 'dissassociateSubProjectsFromParentProject', params).then(function (res) {
                if (res.wsStatus === "0") {
                    getListSubProjectsForProject();
                }
            });
        });
    });
    $$('report').onclick(() => {
        const params = {
            id: projectId
        }
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === "0") {
                Utils.showReport(data.reportUrl);
            }  
        });
    });
})();
