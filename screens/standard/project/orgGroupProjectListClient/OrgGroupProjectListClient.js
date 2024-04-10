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
/*
    All rights reserved.

*/

'use strict';

(async function () {
    const WS = 'StandardProjectOrgGroupProjectListClient';
    let clientId;
    let clientName;

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
        span.innerText = params.data.projectName;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };


    let appliedFilters = {
        extReference: '', // filter
        extReferenceSearchType: 0, // filter
        fromDate: 0, //filter
        orgGroupId: $$('ogpl-orgGroupId').getValue(),
        projectSummary: '', // filter
        projectSummarySearchType: 0, //filter
        showAssigned: $$('ogpl-showAssigned').getValue(),
        showUnassigned: $$('ogpl-showUnassigned').getValue(),
        toDate: 0, //filter
        categoryIds: '',
        category: '',
        statusIds: '',
        status: '',
        typeIds: '',
        type: '',
        sortAsc: true,
        sortOn: ''
    };

    let appliedFiltersHTML = "(not filtered)";

    const searchData = () => {
        Utils.popup_set_height('ogpl-data-search', '455px');
        let formSearchGrid;
        $$('ogpl-data-search-type').setValue('Organizational Group');
        $$('ogpl-chooseSpecificLabelAll').setValue('Organizational Groups');
        $$('ogpl-chooseSpecificLabelSearch').setValue('Organizational Group');

        $$('ogpl-first-label').setValue('Name:');

        $$('ogpl-second-label').hide();
        $$('ogpl-second-criteria').hide();
        $$('ogpl-second-search').hide();
        
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
                $$('ogpl-orgGroupId').setValue(row.orgGroupId, row.name);
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
            columnDefs = [
                {headerName: 'Organizational Group Name', field: 'name', width: 210}
            ];

            formSearchGrid = new AGGrid('ogpl-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
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

                $$('ogpl-ok').enable().onclick(() => {
                    $$('ogpl-orgGroupId').setValue('');   
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
    AWS.callSoap(WS, 'searchOrgGroups', orgGroupParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('ogpl-orgGroupId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.setValue(res.item[0].id, res.item[0].name);
                clientId = res.item[0].companyId;
                clientName = res.item[0].companyName;
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
                searchData();
            });
            ctl.onChange(() => {
                clientId = ctl.getValue();
                clientName = ctl.getLabel();
            });
        }
    });

    $$('filter').onclick(() => {

        Utils.popup_open('ogpl-project-filter');

        $$('ogpl-extReferenceSearchType').setValue(appliedFilters.extReferenceSearchType);
        bindToEnum('ogpl-extReferenceSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        $$('ogpl-projectSummarySearchType').setValue(appliedFilters.projectSummarySearchType);
        bindToEnum('ogpl-projectSummarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

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
                toDate: $$('ogpl-toDate').getIntValue(),
                categoryIds: $$('ogpl-categoriesIds').getValue().split(","),
                typeIds: $$('ogpl-typesIds').getValue().split(","),
                statusIds: $$('ogpl-statusesIds').getValue().split(","),
                category: $$('ogpl-categories').getValue(),
                type: $$('ogpl-types').getValue(),
                status: $$('ogpl-statuses').getValue(),

                extReference: $$('ogpl-extReference').getValue(),
                extReferenceSearchType: $$('ogpl-extReferenceSearchType').getValue(),
                orgGroupId: $$('ogpl-orgGroupId').getValue(),
                projectSummary: $$('ogpl-projectSummary').getValue(),
                projectSummarySearchType: $$('ogpl-projectSummarySearchType').getValue(),
                showAssigned: $$('ogpl-showAssigned').getValue(),
                showUnassigned: $$('ogpl-showUnassigned').getValue(),
                sortAsc: true,
                sortOn: ''
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
        {headerName: "Summary", field: "summary", cellRenderer: "projectInfo", width: 500},
        {headerName: "Status", field: "statusCode", width: 80},
        {headerName: "Priority", field: "clientPriority", width: 80},
        {headerName: "Assigned", field: "assigned", width: 80}
    ];
    projectsGrid = new AGGrid('projectsGrid', projectsColumnDefs);
    projectsGrid.addComponent('projectInfo', ProjectInfo);
    projectsGrid.show();
    // projectsGrid.setOnSelectionChanged((rows) => {
    //     if ($$('ta-showDetail').getValue())
    //         getListTimesheetsForReview();
    // });

    function searchProjects() {
        projectsGrid.clear();
        const params = appliedFilters;


        AWS.callSoap(WS, 'searchProjects', params).then(data => {
            if (data.wsStatus === '0') {     
                projectsGrid.clear();
                data.item = Utils.assureArray(data.item);

                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].estHours = Number(data.item[i].estHours).toFixed(2);
                    data.item[i].promisedDate = data.item[i].promisedDate !== "0" ? DateUtils.intToDate(Number(data.item[i].promisedDate)) : '';
                }
                projectsGrid.addRecords(data.item);

                projectsGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('addSubProject').enable(x);
                });
                    
                projectsGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    $$('ogpl-showAssigned').onChange(updateFilters);
    $$('ogpl-showUnassigned').onChange(updateFilters);

    function edit() {
        Utils.saveData(CURRENT_PROJECT_ID, projectsGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, projectsGrid.getSelectedRow().projectName);
        Framework.getChild();
    }
    
    $$('refresh').onclick(updateFilters);
    $$('edit').onclick(edit);

    $$('addProject').onclick(() => {
        $$('ogpl-add-proj-client').setValue(clientName);

        const orgGroupParams = {
            autoDefault: true,
            companyId: clientId,
            name: '',
            nameSearchType: 0
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
                    $$('ogpl-add-proj-orgGroup').setValue($$('ogpl-orgGroupId').getValue());
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
                } else if (res.item.length <= res.cap) {
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
                const ctl = $$('ogpl-add-proj-type');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.cap) {
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

        Utils.popup_open('ogpl-add-project');

        $$('ogpl-add-proj-ok').onclick(() => {
            const params = {
                description: $$('ogpl-add-proj-summary').getValue(),
                detail: $$('ogpl-add-proj-detail').getValue(),
                parentId: '',
                projectCategoryId: $$('ogpl-add-proj-category').getValue(),
                projectTypeId: $$('ogpl-add-proj-type').getValue(),
                requestingOrgGroupId: $$('ogpl-add-proj-orgGroup').getValue(),
                routeId: $$('ogpl-add-proj-client').getValue()
            }

            AWS.callSoap(WS, 'newProject', params).then(data => {
                if (data.wsStatus === "0") {
                    if ($$('ogpl-add-proj-openDetail').getValue()) {
                        Utils.saveData(CURRENT_PROJECT_ID, data.projectId);
                        Utils.saveData(CURRENT_PROJECT_NAME, data.projectName);
                        Framework.getChild();
                    } else {
                        updateFilters;
                        Utils.popup_close();
                    }
                }  
            });
        });

        $$('ogpl-add-proj-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('addSubProject').onclick(() => {
        $$('ogpl-add-proj-client').setValue(clientName);

        const orgGroupParams = {
            autoDefault: true,
            companyId: clientId,
            name: '',
            nameSearchType: 0
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
                    $$('ogpl-add-proj-orgGroup').setValue($$('ogpl-orgGroupId').getValue());
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
                } else if (res.item.length <= res.cap) {
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
                const ctl = $$('ogpl-add-proj-type');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.cap) {
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


        Utils.popup_open('ogpl-add-project');

        $$('ogpl-add-proj-ok').onclick(() => {
            const params = {
                description: $$('ogpl-add-proj-summary').getValue(),
                detail: $$('ogpl-add-proj-detail').getValue(),
                parentId: projectsGrid.getSelectedRow().projectId,
                projectCategoryId: $$('ogpl-add-proj-category').getValue(),
                projectTypeId: $$('ogpl-add-proj-type').getValue(),
                requestingOrgGroupId: $$('ogpl-add-proj-orgGroup').getValue(),
                routeId: $$('ogpl-add-proj-client').getValue()
            }

            AWS.callSoap(WS, 'newProject', params).then(data => {
                if (data.wsStatus === "0") {
                    if ($$('ogpl-add-proj-openDetail').getValue()) {
                        Utils.saveData(CURRENT_PROJECT_ID, data.projectId);
                        Utils.saveData(CURRENT_PROJECT_NAME, data.projectName);
                        Framework.getChild();
                    } else {
                        updateFilters;
                        Utils.popup_close();
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

        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });  
    });

    function updateFilters() {
        appliedFilters = {
            fromDate: $$('ogpl-fromDate').getIntValue(),
            toDate: $$('ogpl-toDate').getIntValue(),
            categoryIds: $$('ogpl-categoriesIds').getValue().split(","),
            typeIds: $$('ogpl-typesIds').getValue().split(","),
            statusIds: $$('ogpl-statusesIds').getValue().split(","),
            category: $$('ogpl-categories').getValue(),
            type: $$('ogpl-types').getValue(),
            status: $$('ogpl-statuses').getValue(),

            extReference: $$('ogpl-extReference').getValue(),
            extReferenceSearchType: $$('ogpl-extReferenceSearchType').getValue(),
            orgGroupId: $$('ogpl-orgGroupId').getValue(),
            projectSummary: $$('ogpl-projectSummary').getValue(),
            projectSummarySearchType: $$('ogpl-projectSummarySearchType').getValue(),
            showAssigned: $$('ogpl-showAssigned').getValue(),
            showUnassigned: $$('ogpl-showUnassigned').getValue(),
            sortAsc: true,
            sortOn: ''
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
