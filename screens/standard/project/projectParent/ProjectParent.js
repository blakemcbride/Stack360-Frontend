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

    const WS = 'StandardProjectProjectParent';

    function ProjectInfo() {}

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            let projectId = params.data.projectId;
            let data = {
                projectId: projectId
            };
            AWS.callSoap(WS, 'getProjectDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-info-popup");
                    $$('project-info-project-id').setValue(params.data.projectName);
                    $$('project-info-requesting-person').setValue(res.requestingPersonOrCreatedBy);
                    $$('project-info-summary').setValue(params.data.description);
                    $$('project-info-phase').setValue(res.phaseFormatted);
                    $$('project-info-requesting-company').setValue(params.data.requestingNameFormatted);
                    $$('project-info-status').setValue(res.statusFormatted);
                    $$('project-info-details').setValue(res.detail);
                    $$('project-info-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        let span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.description;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };

    const columnDefs = [
        {headerName: '', field: 'projectId', hide: true},
        {headerName: 'ID', field: 'projectName', type: 'numericColumn', width: 50 },
        {headerName: 'Summary', field: 'description', cellRenderer: 'projectInfo', width: 175 },
        {headerName: 'Status', field: 'status', width: 175 },
        {headerName: 'Start Date', field: 'startDate', width: 80 },
        {headerName: 'End Date', field: 'endDate', width: 80 },
        {headerName: 'External Ref.', field: 'reference', width: 90 },
        {headerName: 'Client (Group)', field: 'requestingNameFormatted', width: 200 }
    ];
    const grid = new AGGrid('project-grid', columnDefs, 'projectId');

    grid.addComponent('projectInfo', ProjectInfo);

    grid.show();

    AWS.callSoap(WS, 'checkRight');

    //  I am using "then" rather than "await" because I want the services to run in parallel.
    let data = {
        autoDefault: false,
        nameSearchType: 0,
        projectId: null
    };
    AWS.callSoap(WS, 'searchCompanyByType', data).then(function (res) {
        if (res.wsStatus === "0") {
            if (res.companies.length > res.lowCap) {
                $$('client-select').forceSelect();
            } else {
                let ctl = $$('client-select');
                ctl.clear();
                ctl.add('', '(choose)');
                res.companies = Utils.assureArray(res.companies);
                for (let i=0 ; i < res.companies.length ; i++)
                    ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
            }
        }
    });

    data = {
        categoryId: null,
        code: null,
        codeSearchType: 0,
        description: null,
        descriptionSearchType: 0,
        projectId: null
    };
    AWS.callSoap(WS, 'searchProjectCategories', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.projectCategories = Utils.assureArray(res.projectCategories);
            const ctl = $$('category-select');
            ctl.clear();
            ctl.add('', '(choose)');
            for (let i=0 ; i < res.projectCategories.length ; i++)
                ctl.add(res.projectCategories[i].projectCategoryId, res.projectCategories[i].code);
        }
    });


    data = {
        typeId: null,
        code: null,
        codeSearchType: 0,
        description: null,
        descriptionSearchType: 0,
        projectId: null
    };
    AWS.callSoap(WS, 'searchProjectTypes', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.projectTypes = Utils.assureArray(res.projectTypes);
            const ctl = $$('type-select');
            ctl.clear();
            ctl.add('', '(choose)');
            for (let i=0 ; i < res.projectTypes.length ; i++)
                ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].code);
        }
    });


    data = {
        statusId: null,
        code: null,
        codeSearchType: 0,
        description: null,
        descriptionSearchType: 0,
        projectId: null,
        excluseAlreadyUsed: false
    };
    AWS.callSoap(WS, 'searchProjectStatuses', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            let ctl = $$('status-select');
            ctl.clear();
            ctl.add('', '(choose)');
            for (let i=0 ; i < res.item.length ; i++)
                ctl.add(res.item[i].id, res.item[i].code);
        }
    });

    $$('status-type').onChange(function () {
        let isSpecific = $$('status-type').getValue();
        if (isSpecific === "3")
            $$('status-select').enable();
        else {
            $$('status-select').setValue('');
            $$('status-select').disable();
        }
    });

    $$('reset').onclick(function () {
        $$('summary-select-type').setValue('4');
        $$('summary-search').clear();
        $$('id-select-type').setValue('5');
        $$('id-search').clear();
        $$('reference-select-type').setValue('2');
        $$('reference-search').clear();
        $$('category-select').setValue('');
        $$('type-select').setValue('');
        $$('status-type').setValue('1');
        $$('status-select').setValue('');
        $$('status-select').disable();
        $$('from-date').clear();
        $$('to-date').clear();
        $$('client-select').setValue('');
        grid.clear();
        $$('info').clear();
    });

    let searchData;

    const performSearch = function (sd) {
        if (!sd)
            searchData = {
                category: $$('category-select').getValue(),
                companyId: $$('client-select').getValue(),
                excludeId: null,
                extReference: $$('reference-search').getValue(),
                extReferenceSearchType: parseInt($$('reference-select-type').getValue()),
                fromDate: $$('from-date').getIntValue(),
                projectName: $$('id-search').getValue(),
                projectNameSearchType: parseInt($$('id-select-type').getValue()),
                projectSummary: $$('summary-search').getValue(),
                projectSummarySearchType: parseInt($$('summary-select-type').getValue()),
                searchMeta: {
                    firstItemIndexPaging: 0,
                    sortAsc: true,
                    sortField: null,
                    usingPaging: false
                },
                status: $$('status-select').getValue(),
                statusType: parseInt($$('status-type').getValue()),
                toDate: $$('to-date').getIntValue(),
                type: $$('type-select').getValue()
            };
        else
            searchData = sd;
        AWS.callSoap(WS, 'searchProjects', searchData).then(function (res) {
            if (res.wsStatus === "0") {
                grid.clear();
                $$('info').clear();
                $$('add-sub-project').disable();
                $$('edit').disable();
                $$('delete').disable();
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                if (res.moreFound === "true") {
                    $$('info').setValue('Displaying ' + res.item.length + ' Projects (Limit)');
                    $$('info').setColor('red');
                } else {
                    $$('info').setValue('Displaying ' + res.item.length + ' Projects');
                    $$('info').setColor('black');
                }
            }
        });
    };

    $$('search').onclick(function () {
        performSearch(null);
    });

    Utils.globalEnterHandler(function () {
        performSearch(null);
    });

    if (searchData = Utils.getData(PROJECT_SEARCH_DATA))
        performSearch(searchData);

    $$('export-list').onclick(function () {
        const data = {
            category: $$('category-select').getValue(),
            companyId: $$('client-select').getValue(),
            excludeId: null,
            extReference: $$('reference-search').getValue(),
            extReferenceSearchType: parseInt($$('reference-select-type').getValue()),
            fromDate: $$('from-date').getIntValue(),
            projectName: $$('id-search').getValue(),
            projectNameSearchType: parseInt($$('id-select-type').getValue()),
            projectSummary: $$('summary-search').getValue(),
            projectSummarySearchType: parseInt($$('summary-select-type').getValue()),
            status: $$('status-select').getValue(),
            statusType: parseInt($$('status-type').getValue()),
            toDate: $$('to-date').getIntValue(),
            type: $$('type-select').getValue()
        };
        AWS.callSoap(WS, 'exportList', data).then(function (res) {
            if (res.wsStatus === "0")
                Utils.showReport("/" + res.reportUrl);
        });
    });

    $$('report').onclick(function () {
        const data = {
            category: $$('category-select').getValue(),
            companyId: $$('client-select').getValue(),
            extReference: $$('reference-search').getValue(),
            extReferenceSearchType: parseInt($$('reference-select-type').getValue()),
            fromDate: $$('from-date').getIntValue(),
            projectName: $$('id-search').getValue(),
            projectNameSearchType: parseInt($$('id-select-type').getValue()),
            projectSummary: $$('summary-search').getValue(),
            projectSummarySearchType: parseInt($$('summary-select-type').getValue()),
            status: $$('status-select').getValue(),
            statusType: parseInt($$('status-type').getValue()),
            toDate: $$('to-date').getIntValue(),
            type: $$('type-select').getValue()
        };
        AWS.callSoap(WS, 'getReport', data).then(function (res) {
            if (res.wsStatus === "0")
                Utils.showReport("/" + res.reportUrl);
        });
    });

    $$('add-sub-project').disable();
    $$('edit').disable();
    $$('delete').disable();

    grid.setOnSelectionChanged(function (rows) {
        $$('add-sub-project').enable(rows);
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    const rememberVisitedProject = function (id, name, summary) {
        let visitedProjects = Utils.getData(VISITED_PROJECTS);
        if (!visitedProjects)
            visitedProjects = {};
        if (visitedProjects[id])
            return;
        visitedProjects[id] = {};
        visitedProjects[id].name = name;
        visitedProjects[id].summary = summary;
        Utils.saveData(VISITED_PROJECTS, visitedProjects);
    };

    {
        const visitedProjects = Utils.getData(VISITED_PROJECTS);
        const rp = $$('recent-projects');
        rp.clear();
        if (visitedProjects  &&  Utils.countProperties(visitedProjects))
            for (let id in visitedProjects)
                rp.add(id, visitedProjects[id].summary, visitedProjects[id].name);
    }

    $$('edit-previous-project').onclick(function () {
        let id = $$('recent-projects').getValue();
        if (!id)
            return;
        Utils.saveData(PROJECT_SEARCH_DATA, searchData);
        Utils.saveData(CURRENT_PROJECT_ID, $$('recent-projects').getValue());
        Utils.saveData(CURRENT_PROJECT_SUMMARY, $$('recent-projects').getLabel());
        Utils.saveData(CURRENT_PROJECT_NAME, $$('recent-projects').getData());
        Framework.getChild();
    });

    const editProject = function () {
        Utils.saveData(PROJECT_SEARCH_DATA, searchData);
        Utils.saveData(CURRENT_PROJECT_ID, grid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, grid.getSelectedRow().projectName);
        Utils.saveData(CURRENT_PROJECT_SUMMARY, grid.getSelectedRow().description);
        rememberVisitedProject(grid.getSelectedRow().projectId, grid.getSelectedRow().projectName, grid.getSelectedRow().description);
        Framework.getChild();
    };

    $$('edit').onclick(editProject);

    grid.setOnRowDoubleClicked(editProject);

    $$('delete').onclick(function () {
        Utils.yesNo('Question', 'Are you sure you wish to delete this project?', function () {
            const data = {
                projectIds: grid.getSelectedRow().projectId
            };
            AWS.callSoap(WS, 'deleteProject', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage("Information", "The project has been deleted.");
                    performSearch(null);
                }
            });
        });
    });

    const selectClientPopup = async function (afterfun) {
        let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
        if (res._status === "ok") {
            afterfun(res.id, res.name);
        }
    };

    $$('client-select').setSelectFunction(function () {
        selectClientPopup(function (val, lbl) {
            $$('client-select').setValue(val, lbl);
        });
    });

    $$('add-project-client').setSelectFunction(function () {
        selectClientPopup(function (val, lbl) {
            $$('add-project-client').setValue(val, lbl);
        });
    });

    const addProjectPopup = function (isSubProject) {
        let routeId;
        let title = isSubProject ? 'Add Sub-Project' : 'Add Project';
        $$('add-project-title').setValue(title);
        $$('add-project-summary').clear();
        $$('add-project-detail').clear();
        $$('add-project-client').clear();
        $$('add-project-org-group').clear();
        $$('add-project-category').clear();
        $$('add-project-type').clear();
        $$('add-project-rate').clear();
        $$('add-project-state').clear();

        Utils.popup_open("add-project-popup");
        let data = {
            autoDefault: false,
            nameSearchType: 0,
            projectId: null
        };
        AWS.callSoap(WS, 'searchCompanyByType', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.companies = Utils.assureArray(res.companies);
                let ctl = $$('add-project-client');
                if (res.companies.length > res.lowCap) {
                    ctl.forceSelect();
                } else {
                    ctl.clear();
                    ctl.add('', '(choose)');
                    ctl.addItems(res.companies, "orgGroupId", "name");
                }
            }
        });

        $$('add-project-org-group').disable();
        $$('add-project-client').onChange(function (val, lbl) {
            data = {
                autoDefault: true,
                companyId: val,
                name: '',
                nameSearchType: 0,
                projectId: ''
            };
            AWS.callSoap(WS, 'searchOrgGroupsForCompany', data).then(function (res) {
                if (res.wsStatus === "0") {
                    let ctl = $$('add-project-org-group');
                    ctl.clear();
                    if (res.item) {
                        $$('add-project-org-group').enable();
                        ctl.add('', '(choose)');
                        for (let i = 0; i < res.item.length; i++)
                            ctl.add(res.item[i].id, res.item[i].name);
                    } else
                        $$('add-project-org-group').disable();
                }
            });
        });

        const updateRouteId = function () {
            let categoryId = $$('add-project-category').getValue();
            let projectTypeId = $$('add-project-type').getValue();
            routeId = undefined;
            if (!categoryId  ||  !projectTypeId)
                return;
            data = {
                projectCategoryId: categoryId,
                projectTypeId: projectTypeId
            };
            AWS.callSoap(WS, 'getDefaultsForCategoryAndType', data).then(function (res) {
                if (res.wsStatus === "0") {
                    if (res.routeId)
                        routeId = res.routeId;
                    else
                        Utils.showMessage("Error", "There is not a valid Project Route associated to the selected Category/Type combination.  Please note that if there is a Project Route associated to this combination, ensure that the Project Route has an Initial Route Stop and Project Status.");
                }
            })
        };

        data = {
            categoryId: null,
            code: null,
            codeSearchType: 0,
            description: null,
            projectId: null
        };
        AWS.callSoap(WS, 'searchProjectCategories', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.projectCategories = Utils.assureArray(res.projectCategories);
                const ctl = $$('add-project-category');
                ctl.clear();
                ctl.add('', '(choose)');
                for (let i = 0; i < res.projectCategories.length; i++)
                    ctl.add(res.projectCategories[i].projectCategoryId, res.projectCategories[i].code);
            }
        });

        data = {
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            projectId: null,
            typeId: null
        };
        AWS.callSoap(WS, 'searchProjectTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.projectTypes = Utils.assureArray(res.projectTypes);
                const ctl = $$('add-project-type');
                ctl.clear();
                ctl.add('', '(choose)');
                for (let i = 0; i < res.projectTypes.length; i++)
                    ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].code);
            }
        });

        data = {
        };
        AWS.callSoap(WS, 'loadBillingRateTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('add-project-rate');
                ctl.clear();
                ctl.add('', '(choose)');
                res.item = Utils.assureArray(res.item);
                for (let i = 0; i < res.item.length; i++)
                    ctl.add(res.item[i].rateTypeId, res.item[i].rateCode);
            }
        });

        $$('add-project-category').onChange(updateRouteId);
        $$('add-project-type').onChange(updateRouteId);

        $$('add-project-cancel').onclick(function () {
            Utils.popup_close();
        });
        $$('add-project-ok').onclick(function () {
            if ($$('add-project-summary').isError('Summary'))
                return;
            if ($$('add-project-client').isError('Client'))
                return;
            if ($$('add-project-category').isError('Category'))
                return;
            if ($$('add-project-type').isError('Type'))
                return;
            if ($$('add-project-rate').isError('Rate Type'))
                return;
            if ($$('add-project-state').isError('Project State'))
                return;
            if (!routeId) {
                Utils.showMessage("Error", "You have not selected a project type and category with a valid route.");
                return;
            }
            Utils.popup_close();

            Utils.saveData(PROJECT_SEARCH_DATA, searchData);

            const data = {
                description: $$('add-project-summary').getValue(),
                detail: $$('add-project-detail').getValue(),
                shift: "Main",
                parentId: isSubProject ? grid.getSelectedRow().projectId : null,
                projectCategoryId: $$('add-project-category').getValue(),
                projectName: '',
                projectTypeId: $$('add-project-type').getValue(),
                rateTypeId: $$('add-project-rate').getValue(),
                requestingOrgGroupId: $$('add-project-client').getValue(),
                routeId: routeId,
                state: $$('add-project-state').getValue()
            };
            AWS.callSoap(WS, 'newProject', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', "New Project '" + res.projectName + "' has been created").then(function () {
                        if ($$('add-project-open-project').getValue()) {
                            Utils.saveData(CURRENT_PROJECT_ID, res.projectId);
                            Utils.saveData(CURRENT_PROJECT_NAME, res.projectName);
                            Utils.saveData(CURRENT_PROJECT_SUMMARY, $$('add-project-summary').getValue());
                            rememberVisitedProject(res.projectId, res.projectName, $$('add-project-summary').getValue());
                            Framework.getChild();
                        }
                    });
                }
            });
        });

    };

    $$('add-project').onclick(function () {
        addProjectPopup(false);
    });

    $$('add-sub-project').onclick(function () {
        addProjectPopup(true);
    });

})();

