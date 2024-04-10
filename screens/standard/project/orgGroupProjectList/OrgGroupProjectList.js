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
    const WS = 'StandardProjectOrgGroupProjectList';

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


    let appliedFilters = {
        companyId: $$('ogpl-clientCompanyId').getValue(),
        extReference: '', // filter
        extReferenceSearchType: 0, // filter
        fromDate: 0, //filter
        orgGroupId: $$('ogpl-orgGroupId').getValue(),
        personId: $$('ogpl-employeeId').getValue(),
        projectSummary: '', // filter
        projectSummarySearchType: 0, //filter
        showAssigned: $$('ogpl-showAssigned').getValue(),
        toDate: 0, //filter
        categoryIds: '',
        category: '',
        statusIds: '',
        status: '',
        typeIds: '',
        type: ''
    };

    let appliedFiltersHTML = "(not filtered)";

    const searchData = (searchData) => {
        let formSearchGrid;
        switch (searchData) {
            case 'orgGroupId':
                $$('ogpl-data-search-type').setValue('Organizational Group');
                $$('ogpl-chooseSpecificLabelAll').setValue('Organizational Groups');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Organizational Group');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;

            case 'clientCompanyId':
                $$('ogpl-data-search-type').setValue('Requesting Company');
                $$('ogpl-chooseSpecificLabelAll').setValue('Companies');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Company');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;

            case 'employeeId':
                $$('ogpl-data-search-type').setValue('Person');
                $$('ogpl-chooseSpecific').hide();

                $$('ogpl-first-label').setValue('Last Name:');

                $$('ogpl-second-label').show().setValue('First Name:');
                $$('ogpl-second-criteria').show();
                $$('ogpl-second-search').show();
                break;

            case 'orgGroupIdProject':
                Utils.popup_set_height('ogpl-data-search', '480px');
                $$('ogpl-data-search-type').setValue('Organizational Group');
                $$('ogpl-chooseSpecificLabelAll').setValue('Organizational Groups');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Organizational Group');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;

            case 'clientCompanyIdProject':
                Utils.popup_set_height('ogpl-data-search', '480px');
                $$('ogpl-data-search-type').setValue('Company');
                $$('ogpl-chooseSpecificLabelAll').setValue('Companies');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Company');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;
            
            case 'categoryIdProject':
                Utils.popup_set_height('ogpl-data-search', '480px');
                $$('ogpl-data-search-type').setValue('Project Category');
                $$('ogpl-chooseSpecificLabelAll').setValue('Categories');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Category');

                $$('ogpl-first-label').setValue('Code:');

                $$('ogpl-second-label').show().setValue('Description');
                $$('ogpl-second-criteria').show();
                $$('ogpl-second-search').show();
                break;
            
            case 'typeIdProject':
                Utils.popup_set_height('ogpl-data-search', '480px');
                $$('ogpl-data-search-type').setValue('Project Type');
                $$('ogpl-chooseSpecificLabelAll').setValue('Types');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Type');

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
                    case 'orgGroupId':
                        $$('ogpl-orgGroupId').setValue(row.orgGroupId, row.name);
                        break;
        
                    case 'clientCompanyId':
                        $$('ogpl-clientCompanyId').setValue(row.companyId, row.name);
                        $$('ogpl-clientCompanyIdFilter').setValue(row.companyId, row.name);
                        break;
        
                    case 'employeeId':
                        $$('ogpl-employeeId').setValue(row.personId, row.nameFormatted);
                        $$('ogpl-showAssigned').disable().clear();
                        $$('ogpl-appliedFilters').clear();
                        $$('filter').disable();
                        break;

                    case 'clientCompanyIdProject':
                        $$('ogpl-add-proj-client').setValue(row.orgGroupId, row.name);
                        break;
            
                    case 'orgGroupIdProject':
                        $$('ogpl-add-proj-orgGroup').setValue(row.id, row.name);
                        break;
        
                    case 'categoryIdProject':
                        $$('ogpl-add-proj-category').setValue(row.id, row.code + ' - ' + row.description);
                        break;

                    case 'typeIdProject':
                        $$('ogpl-add-proj-type').setValue(row.id, row.code + ' - ' + row.description);
                        break;
                    default:
                        break;
                }
                updateFilters();
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
                        {headerName: 'Last Name', field: 'lastName', width: 70},
                        {headerName: 'First Name', field: 'firstName', width: 70},
                        {headerName: 'Middle Name', field: 'middleName', width: 70}
                    ];
                    Utils.popup_set_height('ogpl-data-search', '520px');
                    break;
                    
                case "orgGroupIdProject":
                    columnDefs = [
                        {headerName: 'Organizational Group Name', field: 'name', width: 210}
                    ];
                    break;

                case "clientCompanyIdProject":
                    columnDefs = [
                        {headerName: 'Company Name', field: 'name', width: 170},
                        {headerName: 'Type', field: 'type', width: 40},
                    ];
                    break;

                case "categoryIdProject":
                    columnDefs = [
                        {headerName: 'Code', field: 'code', width: 70},
                        {headerName: 'Description', field: 'description', width: 140}
                    ];
                    break;

                case "typeIdProject":
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
            if (searchData === "orgGroupId") {
                const params = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    id: ''
                }
                AWS.callSoap(WS, 'searchOrgGroups', params).then(data => {
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
            } else if (searchData === "clientCompanyId") {
                const params = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    companyId: '',
                    autoDefault: false
                }
                AWS.callSoap(WS, 'searchCompanyByType', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "employeeId") {
                const params = {
                    firstName: $$('ogpl-second-search').getValue(),
                    firstNameSearchType: $$('ogpl-second-criteria').getValue(),
                    lastName: $$('ogpl-first-search').getValue(),
                    lastNameSearchType: $$('ogpl-first-criteria').getValue(),
                    orgGroupId: $$('ogpl-orgGroupId').getValue(),
                    personId: '',
                    projectId: ''
                }
                AWS.callSoap(WS, 'searchPersons', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Peoples`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Peoples`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "orgGroupIdProject") {
                const orgGroupParams = {
                    autoDefault: true,
                    companyId: $$('ogpl-add-proj-client').getValue(),
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    projectId: ''
                };
                AWS.callSoap(WS, 'searchOrgGroupsForCompany', orgGroupParams).then(function (res) {
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
            } else if (searchData === "clientCompanyIdProject") {
                const companyParams = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    companyId: '',
                    autoDefault: false 
                }
                AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "categoryIdProject") {
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
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Project Categories`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Project Categories`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable());
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "typeIdProject") {
                const typesParams = {
                    orgGroupId: $$('ogpl-orgGroupId').getValue(),
                    code: $$('ogpl-first-search').getValue(),
                    codeSearchType: $$('ogpl-first-criteria').getValue(),
                    description: $$('ogpl-second-search').getValue(),
                    descriptionSearchType: $$('ogpl-second-criteria').getValue(),
                    parentId: ''
                }
                AWS.callSoap(WS, 'searchProjectTypes', typesParams).then(function (data) {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
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

        $$('ogpl-chooseSpecific').onChange(() => {
            if ($$('ogpl-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('ogpl-first-criteria').disable();
                $$('ogpl-first-search').disable();

                $$('ogpl-second-criteria').disable();
                $$('ogpl-second-search').disable();

                switch (searchData) {
                    case 'orgGroupId':
                        $$('ogpl-count').setValue(`Displaying 0 Organizational Groups`);
                        break;
                    
                    case 'clientCompanyId':
                        $$('ogpl-count').setValue(`Displaying 0 Companies`);
                        break;

                    case 'employeeId':
                        $$('ogpl-count').setValue(`Displaying 0 Peoples`);
                        break;
                
                    default:
                        break;
                }
                $$('ogpl-ok').enable().onclick(() => {
                    $$('ogpl-' + searchData).setValue('');   
                    if (searchData === "clientCompanyId") {
                        $$('ogpl-clientCompanyIdFilter').setValue('');  
                    }  
                    $$('ogpl-showAssigned').enable().setValue(appliedFilters.showAssigned);
                    $$('ogpl-appliedFilters').setHTMLValue(appliedFiltersHTML);
                    $$('filter').enable();         
                    reset();
                    Utils.popup_close();
                    updateFilters();           
                });
            } else {
                $$('ogpl-first-criteria').enable();
                $$('ogpl-first-search').enable();

                $$('ogpl-second-criteria').enable();
                $$('ogpl-second-search').enable();

                $$('ogpl-ok').enable().onclick(ok);
            }
        });

        search();
    };

    const orgGroupParams = {
        name: '',
        nameSearchType: 0,
        id: ''
    }
    await AWS.callSoap(WS, 'searchOrgGroups', orgGroupParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('ogpl-orgGroupId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.setValue(res.item[0].id, res.item[0].name)
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, res.item[i].name);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setValue(res.selectedItem.id);
            ctl.setSelectFunction(() => {
                searchData('orgGroupId');
            });
        }
    });

    const companyParams = {
        name: '',
        nameSearchType: 0,
        companyId: '',
        autoDefault: false 
    }
    AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('ogpl-clientCompanyId');
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
                searchData('clientCompanyId');
            });
        }
    });
    const rights = await AWS.callSoap(WS, 'checkRight');

    if (rights.accessLevel === 0) {
        const ctl = $$('ogpl-employeeId');
        ctl.clear();
        ctl.singleValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
        getCurrentStatus();
    } else {
        const employeesParams = {
            firstName: '',
            firstNameSearchType: 0,
            lastName: '',
            lastNameSearchType: 0,
            orgGroupId: $$('ogpl-orgGroupId').getValue(),
            personId: '',
            projectId: ''
        }
        AWS.callSoap(WS, 'searchPersons', employeesParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-employeeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(entire org group)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, res.item[i].nameFormatted);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(entire org group)');
                }
                ctl.setSelectFunction(() => {
                    searchData('employeeId');
                });
            }
        });
    }

    $$('filter').onclick(() => {

        Utils.popup_open('ogpl-project-filter');

        $$('ogpl-extReferenceSearchType').setValue(appliedFilters.extReferenceSearchType);
        bindToEnum('ogpl-extReferenceSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        $$('ogpl-projectSummarySearchType').setValue(appliedFilters.projectSummarySearchType);
        bindToEnum('ogpl-projectSummarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const companyParams = {
            name: '',
            nameSearchType: 0,
            companyId: '',
            autoDefault: false 
        }
        AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-clientCompanyIdFilter');
                ctl.clear();
                if (res.companies.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.companies.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.companies.length; i++)
                        ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
                    ctl.setValue(appliedFilters.companyId);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(appliedFilters.companyId);
                }
                ctl.setSelectFunction(() => {
                    searchData('clientCompanyId');
                });
            }
        });

        function resetFilters() {
            $$('ogpl-fromDate').clear();
            $$('ogpl-statuses').clear();
            $$('ogpl-toDate').clear();
            $$('ogpl-categoriesIds').clear();
            $$('ogpl-statusesIds').clear();
            $$('ogpl-typesIds').clear();
            $$('ogpl-categories').clear();
            $$('ogpl-types').clear();
            $$('ogpl-statuses').clear();
            $$('ogpl-projectSummary').clear();
            $$('ogpl-extReference').clear();

            $$('ogpl-extReferenceSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            bindToEnum('ogpl-extReferenceSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            $$('ogpl-projectSummarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            bindToEnum('ogpl-projectSummarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        }

        let searchResGrid;
        let searchAddGrid;

        function searchSpecificProj(prospType) {
            $$('ogpl-prosp_code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            bindToEnum('ogpl-prosp_code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            
            $$('ogpl-prosp_descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            bindToEnum('ogpl-prosp_descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            $$('ogpl-specific_label').setValue(prospType);
            $$('ogpl-specific_label1').setValue(prospType);
            $$('ogpl-specific_label2').setValue(prospType);

            function resetSearchProjectFilters() {
                $$('ogpl-prosp_code').clear();
                $$('ogpl-prosp_code-criteria').setValue(2);
                $$('ogpl-prosp_descr').clear();
                $$('ogpl-prosp_descr-criteria').setValue(2);
            }
            
            function searchProject() {
                const params = {
                    code: $$('ogpl-prosp_code').getValue(),
                    codeSearchType: $$('ogpl-prosp_code-criteria').getValue(),
                    description: $$('ogpl-prosp_descr').getValue(),
                    descriptionSearchType: $$('ogpl-prosp_descr-criteria').getValue(),
                    parentId: '',
                    excludeIds: $$('ogpl-' + prospType.toLowerCase()).getValue().split(', ')
                }
    
                if (prospType === "Statuses") {
                    params.projectId = '';
                    params.routePathId = '';
                    params.routeStopId = '';
                    params.statusId = '';

                } 

                if ($$('ogpl-' + prospType.toLowerCase() + "Ids").getValue() !== '') {
                    params.excludeIds = $$('ogpl-' + prospType.toLowerCase() + "Ids").getValue().split(', ');
                }      

                AWS.callSoap(WS, 'searchProject' + prospType, params).then(data => {
                    if (data.wsStatus === '0') {    
                        data.item = Utils.assureArray(data.item);
                        searchResGrid.addRecords(data.item);
                    }
                    searchResGrid.setOnSelectionChanged($$('search_specific-add').enable());
                    searchAddGrid.setOnSelectionChanged($$('search_specific-remove').enable());
                    searchAddGrid.setOnRowDoubleClicked($$('search_specific-remove').enable());
                });  
            }
            
            searchProject();          

            function addSpecificProj() {
                const rows = searchResGrid.getSelectedRows();
                searchAddGrid.addRecords(rows);
                searchResGrid.deleteSelectedRows();                
            }

            function removeSpecificProj() {
                const rows = searchAddGrid.getSelectedRows();
                searchResGrid.addRecords(rows);
                searchAddGrid.deleteSelectedRows();                
            }

            $$('search_specific-reset').onclick(resetSearchProjectFilters);
            $$('search_specific-search').onclick(searchProject);
            $$('search_specific-add').onclick(addSpecificProj);
            $$('search_specific-remove').onclick(removeSpecificProj);

            Utils.popup_open('ogpl-project-search_specific');

            const searchResColumnDefs = [
                {headerName: "Code", field: "code", width: 150},
                {headerName: "Description", field: "description", width: 350}
            ];

            searchResGrid = new AGGrid('searchResGrid', searchResColumnDefs);
            searchResGrid.multiSelect();
            searchResGrid.show();
            searchResGrid.setOnRowDoubleClicked(addSpecificProj);

            const searchAddColumnDefs = [
                {headerName: "Code", field: "code", width: 150},
                {headerName: "Description", field: "description", width: 350}
            ];

            searchAddGrid = new AGGrid('searchAddGrid', searchAddColumnDefs);
            searchAddGrid.multiSelect();
            searchAddGrid.show();

            $$('search_specific-ok').onclick(() => {
                let addedRows = searchAddGrid.getAllRows();
                let temp = "";
                let tempId = "";
                for (let i = 0; i < addedRows.length; i++) {
                    temp += addedRows[i].code + ", ";
                    tempId += addedRows[i].id + ",";
                }
                $$('ogpl-' + prospType.toLowerCase()).setValue(temp.substring(0, temp.length - 2));
                $$('ogpl-' + prospType.toLowerCase() + 'Ids').setValue(tempId.substring(0, tempId.length - 1));

                Utils.popup_close();
            });

            $$('search_specific-cancel').onclick(() => {
                Utils.popup_close();
            });
        }
        
        $$('chooseCategory').onclick(() => {
            searchSpecificProj("Categories");
        });

        $$('chooseType').onclick(() => {
            searchSpecificProj("Types");
        });

        $$('chooseStatus').onclick(() => {
            searchSpecificProj("Statuses");
        });

        $$('filter-reset').onclick(resetFilters);

        $$('filter-ok').onclick(() => {
            appliedFilters = {
                fromDate: $$('ogpl-fromDate').getIntValue(),
                includeInactiveStatuses: $$('ogpl-statuses').getValue() !== "0",
                toDate: $$('ogpl-toDate').getIntValue(),
                categoryIds: $$('ogpl-categoriesIds').getValue().split(","),
                typeIds: $$('ogpl-typesIds').getValue().split(","),
                statusIds: $$('ogpl-statusesIds').getValue().split(","),
                category: $$('ogpl-categories').getValue(),
                type: $$('ogpl-types').getValue(),
                status: $$('ogpl-statuses').getValue(),

                companyId: $$('ogpl-clientCompanyId').getValue(),
                extReference: $$('ogpl-extReference').getValue(),
                extReferenceSearchType: $$('ogpl-extReferenceSearchType').getValue(),
                orgGroupId: $$('ogpl-orgGroupId').getValue(),
                personId: $$('ogpl-employeeId').getValue(),
                projectSummary: $$('ogpl-projectSummary').getValue(),
                projectSummarySearchType: $$('ogpl-projectSummarySearchType').getValue(),
                showAssigned: $$('ogpl-showAssigned').getValue()
            }

            $$('ogpl-clientCompanyId').setValue($$('ogpl-clientCompanyIdFilter').getValue());

            if (appliedFilters.categoryIds.length === 1 && appliedFilters.categoryIds[0] === "") {
                delete appliedFilters.categoryIds;
                delete appliedFilters.category;
            }

            if (appliedFilters.statusIds.length === 1 && appliedFilters.statusIds[0] === "") {
                delete appliedFilters.statusIds;
                delete appliedFilters.status;
            }

            if (appliedFilters.typeIds.length === 1 && appliedFilters.typeIds[0] === "") {
                delete appliedFilters.typeIds;
                delete appliedFilters.type;
            }
            Utils.popup_close();

            // let showFilters = "";

            // if (appliedFilters.fromDate !== 0 && appliedFilters.toDate === 0) {
            //     showFilters += "<b>First Contact Date After: </b>" + DateUtils.intToStr4(appliedFilters.fromDate) + ", ";
            // } else if (appliedFilters.fromDate !== 0 && appliedFilters.toDate !== 0) {
            //     showFilters += "<b>First Contact Date Between: </b>" + DateUtils.intToStr4(appliedFilters.fromDate) + " - " + DateUtils.intToStr4(appliedFilters.toDate) + ", ";
            // } else if (appliedFilters.fromDate === 0 && appliedFilters.toDate !== 0) {
            //     showFilters += "<b>First Contact Date Before:</b> " + DateUtils.intToStr4(appliedFilters.toDate) + ", ";
            // } 

            // if (appliedFilters.source) {
            //     showFilters += "<b>Source Codes: </b>" + appliedFilters.source + ", ";
            // }

            // if (appliedFilters.includeInactiveStatuses && !appliedFilters.status) {
            //     showFilters += "<b>Any Status: </b>, ";
            // } else if (appliedFilters.includeInactiveStatuses) {
            //     showFilters += "<b>Status Codes: </b>" + appliedFilters.status + ", ";
            // }

            // if (showFilters.length) {
            //     showFilters = showFilters.substring(0, showFilters.length - 2);
            // } else {
            //     showFilters = "(not filtered)";
            // }

            // $$('ogpl-appliedFilters').setHTMLValue(showFilters);
            updateFilters();
        });

        $$('filter-cancel').onclick(() => {
            $$('ogpl-fromDate').setValue(appliedFilters.fromDate);
            $$('ogpl-toDate').setValue(appliedFilters.toDate);
            $$('ogpl-categoriesIds').setValue(appliedFilters.categoryIds);
            $$('ogpl-typesIds').setValue(appliedFilters.typeIds);
            $$('ogpl-statusesIds').setValue(appliedFilters.statusIds);
            $$('ogpl-categories').setValue(appliedFilters.category);
            $$('ogpl-types').setValue(appliedFilters.type);
            $$('ogpl-statuses').setValue(appliedFilters.status);

            Utils.popup_close();
        });
    });
    
    let projectsGrid;
 
    const projectsColumnDefs = [
        {headerName: "ID", field: "projectName", type: "numericColumn", width: 50},
        {headerName: "Summary", field: "summary", cellRenderer: "projectInfo", width: 300},
        {headerName: "Client", field: "requestingClient", width: 80},
        {headerName: "Promised By", field: "promisedDate", type: "numericColumn", width: 80},
        {headerName: "Est. Hours", field: "estHours", type: "numericColumn", width: 80},
        {headerName: "Status", field: "statusCode", width: 80},
        {headerName: "Company", field: "companyName", width: 80},
        {headerName: "Group", field: "", width: 80},
        {headerName: "Client", field: "", width: 80},
    ];
    projectsGrid = new AGGrid('projectsGrid', projectsColumnDefs);
    projectsGrid.addComponent('projectInfo', ProjectInfo);
    projectsGrid.show();
    // projectsGrid.setOnSelectionChanged((rows) => {
    //     if ($$('ta-showDetail').getValue())
    //         getListTimesheetsForReview();
    // });

    let currentPageOffset = {
        firstItemIndexPaging: 0,
        itemsPerPage: 50
    };

    function searchProjects() {
        projectsGrid.clear();
        const params = appliedFilters;
        params.searchMeta= {
            firstItemIndexPaging: currentPageOffset.firstItemIndexPaging,
            sortAsc: true,
            sortField: "orgGroupPriority",
            usingPaging: true
        };

        if ($$('ogpl-employeeId').getValue() !== '') {
            params.extReference = '';
            params.extReferenceSearchType = 0;
            params.fromDate = 0;
            params.projectSummary = '';
            params.projectSummarySearchType = 0;
            params.showAssigned = false;
            params.toDate = 0;
        }
        AWS.callSoap(WS, 'searchProjects', params).then(data => {
            if (data.wsStatus === '0') {     
                projectsGrid.clear();
                data.item = Utils.assureArray(data.item);

                currentPageOffset.itemsPerPage = data.searchMeta.itemsPerPage;
                currentPageOffset.firstItemIndexPaging = data.searchMeta.firstItemIndexPaging;

                $$('projectsPagination_label').setHTMLValue('<b>' + (Number(currentPageOffset.firstItemIndexPaging) + 1) + ' - ' + (data.item.length + Number(currentPageOffset.firstItemIndexPaging)) + '</b> of <b>' + data.searchMeta.totalItemsPaging + '</b>');

                if ((data.searchMeta.totalItemsPaging - data.searchMeta.firstItemIndexPaging) / data.searchMeta.itemsPerPage > 1) {
                    $$("proj-next").enable();
                }

                if (data.searchMeta.firstItemIndexPaging > 0) {
                    $$("proj-prev").enable();
                }

                $$("proj-next").onclick(() => {
                    currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging + currentPageOffset.itemsPerPage;
                    searchProspects();
                });

                $$("proj-prev").onclick(() => {
                    currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging - currentPageOffset.itemsPerPage;
                    searchProspects();
                });

                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].estHours = Number(data.item[i].estHours).toFixed(2);
                    data.item[i].promisedDate = data.item[i].promisedDate !== "0" ? DateUtils.intToDate(Number(data.item[i].promisedDate)) : '';
                }
                projectsGrid.addRecords(data.item);

                projectsGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('detail').enable(x);
                    $$('addSubProject').enable(x);
                });
                    
                projectsGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    $$('ogpl-employeeId').onChange(updateFilters);
    $$('ogpl-showAssigned').onChange(updateFilters);
    $$('ogpl-clientCompanyId').onChange(() => {
        $$('ogpl-clientCompanyIdFilter').setValue($$('ogpl-clientCompanyId').getValue());
        updateFilters();
    });

    $$('ogpl-employeeId').onChange(() => {
        if ($$('ogpl-employeeId').getValue() === '') {
            $$('ogpl-showAssigned').enable().setValue(appliedFilters.showAssigned);
            $$('ogpl-appliedFilters').setHTMLValue(appliedFiltersHTML);
            $$('filter').enable();
        } else {
            $$('ogpl-showAssigned').disable().clear();
            $$('ogpl-appliedFilters').clear();
            $$('filter').disable();
        }
    });


    let editEmployeeAssignedGrid;
    const editEmployeeAssignedColumnDefs = [
        {headerName: "Last Name", field: "lastName", width: 150},
        {headerName: "First Name", field: "firstName", width: 150},
        {headerName: "Middle Name", field: "middleName", width: 150}
    ];

    editEmployeeAssignedGrid = new AGGrid('editEmployeeAssignedGrid', editEmployeeAssignedColumnDefs);
    editEmployeeAssignedGrid.multiSelect();
    editEmployeeAssignedGrid.show();

    
    let editEmployeeGrid;
    editEmployeeGrid = new AGGrid('editEmployeeGrid', editEmployeeAssignedColumnDefs);
    editEmployeeGrid.multiSelect();
    editEmployeeGrid.show();


    function edit() {
        const container = new TabContainer('ogpl-tab-container');
        container.selectTab('ogpl-basic-TabButton');   

        const row = projectsGrid.getSelectedRow();

        $$('ogpl-projectId').clear();
        $$('ogpl-company').clear();
        $$('ogpl-summary').clear();
        $$('ogpl-edit-status').clear();
        $$('ogpl-edit-company').clear();
        $$('ogpl-edit-orgGroup').clear();
        $$('ogpl-edit-client').clear();
        $$('ogpl-employeeId').clear();
        $$('ogpl-edit-person').clear();

        $$('ogpl-projectId').setValue(row.projectName);
        $$('ogpl-company').setValue(row.requestingClient);
        $$('ogpl-summary').setValue(row.summary);
        if ($$('ogpl-employeeId').getValue() !== '') {
            $$('ogpl-edit-person-label').setValue('(' + $$('ogpl-employeeId').getLabel() + ')');
            $$('ogpl-edit-person').enable();
        }

        $$('ogpl-edit-lNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        bindToEnum('ogpl-edit-lNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        $$('ogpl-edit-fNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        bindToEnum('ogpl-edit-fNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        function searchAssignablePersonsForProject(excludePersonIds) {

            const params = {
                companyId: $$("ogpl-orgGroupId").getValue(),
                excludePersonIds: excludePersonIds,
                firstName: '',
                firstNameSearchType: 2,
                lastName: '',
                lastNameSearchType: 2,
                orgGroupId: "00001-0000000006",
                projectId: row.projectId
            }

            AWS.callSoap(WS, 'searchAssignablePersonsForProject', params).then(data => {
                if (data.wsStatus === '0') {    
                    editEmployeeGrid.clear();
                    data.item = Utils.assureArray(data.item);
                    editEmployeeGrid.addRecords(data.item);
                }
                editEmployeeGrid.setOnSelectionChanged($$('ogpl-edit-assign').enable);
                editEmployeeGrid.setOnRowDoubleClicked(assign);
            });  
        }
        
        
        const params = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            excludeAlreadyUsed: false,
            projectId: row.projectId,
            routePathId: '',
            routeStopId: row.routeStopId,
            statusId: row.statusId,
        }

        AWS.callSoap(WS, 'searchProjectStatuses', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-edit-status');
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
                $$('ogpl-edit-status').setValue(row.statusId);
            }
        });

        function getListProjectPersonAssignments() {
            const projectId = {
                projectId: row.projectId
            }
    
            AWS.callSoap(WS, 'listProjectPersonAssignments', projectId).then(data => {
                if (data.wsStatus === '0') {    
                    data.item = Utils.assureArray(data.item);
                    editEmployeeAssignedGrid.addRecords(data.item);
                    let excludePersonIds = [];
                    for (let i = 0; i < data.item.length; i++) {
                        excludePersonIds.push(data.item[i].personId);
                    }
                    searchAssignablePersonsForProject(excludePersonIds);
                }
                editEmployeeAssignedGrid.setOnSelectionChanged($$('ogpl-edit-unassign').enable);
                editEmployeeAssignedGrid.setOnRowDoubleClicked(unassign);
            });  
        }       
        getListProjectPersonAssignments();

        function assign() {
            const rows = editEmployeeGrid.getSelectedRows();
            editEmployeeAssignedGrid.addRecords(rows);
            let excludePersonIds = [];
            let assignedEmployees = editEmployeeAssignedGrid.getAllRows();
            for (let i = 0; i < assignedEmployees.length; i++) {
                excludePersonIds.push(assignedEmployees[i].personId);
            }
            searchAssignablePersonsForProject(excludePersonIds);
        }

        function unassign() {
            const rows = editEmployeeAssignedGrid.getSelectedRows();
            let assignedEmployees = editEmployeeAssignedGrid.getAllRows(); 
            for (let i = 0; i < assignedEmployees.length; i++) {
                for (let j = 0; j < rows.length; j++) {
                    if (assignedEmployees[i].personId === rows[j].personId) {
                        editEmployeeAssignedGrid.deleteRowIndex(i);
                    }                    
                }                
            }
            assignedEmployees = editEmployeeAssignedGrid.getAllRows();
            let excludePersonIds = [];
            for (let i = 0; i < assignedEmployees.length; i++) {
                excludePersonIds.push(assignedEmployees[i].personId);           
            }
            searchAssignablePersonsForProject(excludePersonIds);    
        }
        $$('ogpl-edit-unassign').onclick(unassign);
        $$('ogpl-edit-assign').onclick(assign);

        Utils.popup_open('ogpl-edit-project');

        $$('ogpl-edit-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('ogpl-edit-ok').onclick(() => {
            const assignedEmployees = editEmployeeAssignedGrid.getAllRows();
            let personIds = [];
            for (let i = 0; i < assignedEmployees.length; i++) {
                personIds.push(assignedEmployees[i].personId)                
            }
            const projectId = {
                billable: '',
                billingRate: 0,
                clientPriority: row.clientPriority,
                companyPriority: row.companyPriority,
                id: row.projectId,
                orgGroupPriority: row.orgGroupPriority,
                personId: $$('ogpl-employeeId').getValue(),
                personIdPriority: $$('ogpl-edit-person').getValue(),
                personIds: personIds,
                primaryParentId: '',
                statusId: $$('ogpl-edit-status').getValue()
            }
    
            AWS.callSoap(WS, 'saveProject', projectId).then(data => {
                if (data.wsStatus === '0') {    
                    data.item = Utils.assureArray(data.item);
                    editEmployeeAssignedGrid.addRecords(data.item);
                    let excludePersonIds = [];
                    for (let i = 0; i < data.item.length; i++) {
                        excludePersonIds.push(data.item[i].personId);
                    }
                    searchAssignablePersonsForProject(excludePersonIds);
                }
                editEmployeeAssignedGrid.setOnSelectionChanged($$('ogpl-edit-unassign').enable);
                editEmployeeAssignedGrid.setOnRowDoubleClicked(unassign);
            });  
        });
    }
    
    $$('refresh').onclick(updateFilters);
    $$('edit').onclick(edit);
    $$('detail').onclick(() => {
        Utils.saveData(CURRENT_PROJECT_ID, projectsGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, projectsGrid.getSelectedRow().projectName);
        Framework.getChild();
    });

    $$('addProject').onclick(async () => {

        const companyParams = {
            name: '',
            nameSearchType: 0,
            companyId: '',
            autoDefault: false 
        }
        await AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
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
                    ctl.setValue($$('ogpl-orgGroupId').getValue());
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchData('clientCompanyIdProject');
                });
            }
        });
        
        
        

        const orgGroupParams = {
            autoDefault: true,
            companyId: $$('ogpl-orgGroupId').getValue(),
            name: '',
            nameSearchType: 0,
            projectId: ''
        };
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
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchData('orgGroupIdProject');
                });
            }
        });

        const categoriesParams = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            parentId: ''
        }
        AWS.callSoap(WS, 'searchProjectCategories', categoriesParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-add-proj-category');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code + ' - ' + res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchData('categoryIdProject');
                });
            }
        });

        const typesParams = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            parentId: ''
        }
        AWS.callSoap(WS, 'searchProjectTypes', typesParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-add-proj-type');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code + ' - ' + res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchData('typeIdProject');
                });
            }
        });

        $$('ogpl-add-proj-rateType').add('', "(select)");
        AWS.callSoap(WS, 'loadBillingRateTypes').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ogpl-add-proj-rateType').addItems(data.item, "rateTypeId", "rateCode");
            }  
        });

        Utils.popup_open('ogpl-add-project');

        $$('ogpl-add-proj-ok').onclick(() => {
            const params = {
                description: $$('ogpl-add-proj-summary').getValue(),
                detail: $$('ogpl-add-proj-detail').getValue(),
                parentId: '',
                projectCategoryId: $$('ogpl-add-proj-category').getValue(),
                projectTypeId: $$('ogpl-add-proj-type').getValue(),
                rateTypeId: $$('ogpl-add-proj-rateType').getValue(),
                requestingOrgGroupId: $$('ogpl-add-proj-orgGroup').getValue(),
                routeId: $$('ogpl-add-proj-client').getValue()
            }

            AWS.callSoap(WS, 'newProject', params).then(data => {
                if (data.wsStatus === "0") {
                    if ($$('ogpl-add-proj-openDetail').getValue()) {
                        Utils.saveData(CURRENT_PROJECT_ID, data.projectId);
                        Utils.saveData(CURRENT_PROJECT_NAME, data.projectName);
                        Framework.getChild();
                    }
                }  
            });
        });

        $$('ogpl-add-proj-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('addSubProject').onclick(() => {
        const companyParams = {
            name: '',
            nameSearchType: 0,
            companyId: '',
            autoDefault: false 
        }
        AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-add-proj-client');
                ctl.clear();
                if (res.companies.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.companies.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.companies.length; i++)
                        ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
                    ctl.setValue(Utils.getData("CURRENT_CLIENT_ID"));
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
            }
        });

        const orgGroupParams = {
            autoDefault: true,
            companyId: '',
            name: '',
            nameSearchType: 0,
            projectId: ''
        };
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
                    ctl.setValue('' ,'(choose)');
                }
            }
        });

        const categoriesParams = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            parentId: ''
        }
        AWS.callSoap(WS, 'searchProjectCategories', categoriesParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-add-proj-category');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code + ' - ' + res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
            }
        });

        const typesParams = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            parentId: ''
        }
        AWS.callSoap(WS, 'searchProjectTypes', typesParams).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ogpl-add-proj-category');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code + ' - ' + res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
            }
        });

        $$('ogpl-add-proj-rateType').add('', "(select)");
        AWS.callSoap(WS, 'loadBillingRateTypes').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ogpl-add-proj-rateType').addItems(data.item, "rateTypeId", "rateCode");
            }  
        });

        Utils.popup_open('ogpl-add-project');

        $$('ogpl-add-proj-ok').onclick(() => {
            const params = {
                description: $$('ogpl-add-proj-summary').getValue(),
                detail: $$('ogpl-add-proj-detail').getValue(),
                parentId: projectsGrid.getSelectedRow().projectId,
                projectCategoryId: $$('ogpl-add-proj-category').getValue(),
                projectTypeId: $$('ogpl-add-proj-type').getValue(),
                rateTypeId: $$('ogpl-add-proj-rateType').getValue(),
                requestingOrgGroupId: $$('ogpl-add-proj-orgGroup').getValue(),
                routeId: $$('ogpl-add-proj-client').getValue()
            }

            AWS.callSoap(WS, 'newProject', params).then(data => {
                if (data.wsStatus === "0") {
                    if ($$('ogpl-add-proj-openDetail').getValue()) {
                        Utils.saveData(CURRENT_PROJECT_ID, data.projectId);
                        Utils.saveData(CURRENT_PROJECT_NAME, data.projectName);
                        Framework.getChild();
                    }
                }  
            });
        });

        $$('ogpl-add-proj-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('report').onclick(() => {
        const params = appliedFilters;
        if ($$('ogpl-employeeId').getValue() !== '') {
            params.extReference = '';
            params.extReferenceSearchType = 0;
            params.fromDate = 0;
            params.projectSummary = '';
            params.projectSummarySearchType = 0;
            params.showAssigned = false;
            params.toDate = 0;
        }

        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });  
    });

    function updateFilters() {
        appliedFilters = {
            fromDate: $$('ogpl-fromDate').getIntValue(),
            includeInactiveStatuses: $$('ogpl-statuses').getValue() !== "0",
            toDate: $$('ogpl-toDate').getIntValue(),
            categoryIds: $$('ogpl-categoriesIds').getValue().split(","),
            typeIds: $$('ogpl-typesIds').getValue().split(","),
            statusIds: $$('ogpl-statusesIds').getValue().split(","),
            category: $$('ogpl-categories').getValue(),
            type: $$('ogpl-types').getValue(),
            status: $$('ogpl-statuses').getValue(),

            companyId: $$('ogpl-clientCompanyId').getValue(),
            extReference: $$('ogpl-extReference').getValue(),
            extReferenceSearchType: $$('ogpl-extReferenceSearchType').getValue(),
            orgGroupId: $$('ogpl-orgGroupId').getValue(),
            personId: $$('ogpl-employeeId').getValue(),
            projectSummary: $$('ogpl-projectSummary').getValue(),
            projectSummarySearchType: $$('ogpl-projectSummarySearchType').getValue(),
            showAssigned: $$('ogpl-showAssigned').getValue()
        }

        if (appliedFilters.categoryIds.length === 1 && appliedFilters.categoryIds[0] === "") {
            delete appliedFilters.categoryIds;
            delete appliedFilters.category;
        }

        if (appliedFilters.statusIds.length === 1 && appliedFilters.statusIds[0] === "") {
            delete appliedFilters.statusIds;
            delete appliedFilters.status;
        }

        if (appliedFilters.typeIds.length === 1 && appliedFilters.typeIds[0] === "") {
            delete appliedFilters.typeIds;
            delete appliedFilters.type;
        }
        searchProjects();
    }
})();
