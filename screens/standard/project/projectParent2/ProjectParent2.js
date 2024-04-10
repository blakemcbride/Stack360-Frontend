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

    const SWS = 'StandardProjectProjectParent';
    const RWS = 'com.arahant.services.standard.project.projectParent';

    function ProjectInfo() {}

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            let projectId = params.data.project_id;
            let data = {
                projectId: projectId
            };
            AWS.callSoap(SWS, 'getProjectDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-info-popup");
                    $$('project-info-project-id').setValue(params.data.project_name);
                    $$('project-info-summary').setValue(params.data.description);
                    $$('project-info-requesting-person').setValue(res.requestingPersonOrCreatedBy);
                    $$('project-info-status').setValue(res.statusFormatted);
                    $$('project-info-details').setValue(res.detail);
                    $$('project-info-site-manager').setValue(params.data.site_manager);
                    $$('project-info-manager-phone').setValue(params.data.manager_phone);
                    $$('project-info-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        let span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.client_name;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    ProjectInfo.prototype.getGui = function() {
        return this.eGui;
    };

    const columnDefs = [
        {headerName: 'ID', field: 'project_name', type: 'numericColumn', width: 150 },
        {headerName: 'Client', field: 'client_name', cellRenderer: 'projectInfo', width: 550 },
        {headerName: 'Retailer', field: 'location_description', width: 300 },
        {headerName: 'Sub-Type', field: 'subtype', width: 300 },
        {headerName: 'Store', field: 'store_number', width: 150 },
        {headerName: 'Shift', field: 'shift_start', width: 150 },
        {headerName: 'City', field: 'city', width: 300 },
        {headerName: 'State', field: 'state', width: 150 },
        {headerName: 'Start Date', field: 'startDate', width: 150 },
        {headerName: 'End Date', field: 'endDate', width: 150 },
        {headerName: 'Req', field: 'required_workers', type: "numericColumn", width: 100 },
        {headerName: 'Sch', field: 'scheduled2', type: "rightAligned", width: 100 },
        {headerName: 'Act', field: 'actual_workers', type: "numericColumn", width: 100 },
        {headerName: 'Net', field: 'net', type: "numericColumn", width: 100 },
//        {headerName: 'Hours Remaining', field: 'remainingHours', type: "numericColumn", width: 200 }
        {headerName: 'Status %', field: 'statusPercent', type: "numericColumn", valueFormatter: AGGrid.numericFormat, mask: 'PRB', decimalPlaces: 0, width: 200 }
    ];
    const grid = new AGGrid('project-grid', columnDefs, 'shift_id');

    grid.addComponent('projectInfo', ProjectInfo);

    grid.rowStyleFunction((params) => {
        const data = params.data
        if (data.scheduledNow < data.required_workers)
            return { background: 'pink' };
        else
            return null;
    });

    grid.show();

    AWS.callSoap(SWS, 'checkRight');

    $$('work-date').setValue(DateUtils.today());

    {
        let data = {
            autoDefault: false,
            nameSearchType: 0,
            projectId: null
        };
        const p1 = AWS.callSoap(SWS, 'searchCompanyByType', data);

        /*
        data = {
            categoryId: null,
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            projectId: null
        };
        const p2 = AWS.callSoap(SWS, 'searchProjectCategories', data);

        data = {
            typeId: null,
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            projectId: null
        };
        const p3 = AWS.callSoap(SWS, 'searchProjectTypes', data);
*/
        data = {
            statusId: null,
            code: null,
            codeSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            projectId: null,
            excluseAlreadyUsed: false
        };
        const p4 = AWS.callSoap(SWS, 'searchProjectStatuses', data);

        const p5 = AWS.callSoap(SWS, 'searchProjectSubTypes');

        AWS.callAll([p1, p4, p5],
            function (res) {
                if (res.wsStatus === "0") {
                    res.companies = Utils.assureArray(res.companies);
                    if (res.companies.length > res.lowCap) {
                        $$('client-select').forceSelect();
                    } else {
                        let ctl = $$('client-select');
                        ctl.clear();
                        ctl.add('', '(choose)');
                        for (let i = 0; i < res.companies.length; i++)
                            ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
                    }
                }
            },
            /*
            function (res) {
                if (res.wsStatus === "0") {
                    res.projectCategories = Utils.assureArray(res.projectCategories);
                    const ctl = $$('category-select');
                    ctl.clear();
                    ctl.add('', '(choose)');
                    for (let i = 0; i < res.projectCategories.length; i++)
                        ctl.add(res.projectCategories[i].projectCategoryId, res.projectCategories[i].code);
                }
            },
            function (res) {
                if (res.wsStatus === "0") {
                    res.projectTypes = Utils.assureArray(res.projectTypes);
                    const ctl = $$('type-select');
                    ctl.clear();
                    ctl.add('', '(choose)');
                    for (let i = 0; i < res.projectTypes.length; i++)
                        ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].code);
                }
            },
             */
            function (res) {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        let ctl = $$('status-select');
                        ctl.clear();
                        ctl.add('', '(choose)');
                        for (let i = 0; i < res.item.length; i++)
                            ctl.add(res.item[i].id, res.item[i].code);
                    }
            },
            function (res) {  // project sub-types
                    if (res.wsStatus === "0") {
                        res.projectSubTypes = Utils.assureArray(res.projectSubTypes);
                        let ctl = $$('subtype-select');
                        ctl.clear();
                        ctl.add('', '(choose)');
                        for (let i = 0; i < res.projectSubTypes.length; i++)
                            ctl.add(res.projectSubTypes[i].projectSubTypeId, res.projectSubTypes[i].code);
                    }
            }).then(function () {
            if (searchData = Utils.getData(PROJECT_SEARCH_DATA)) {
                const d = searchData;
                //$$('category-select').setValue(d.category);
                $$('client-select').setValue(d.companyId);
                $$('reference-search').setValue(d.extReference);
                $$('reference-select-type').setValue(d.extReferenceSearchType + '');
                $$('from-date').setValue(d.fromDate);
                $$('id-search').setValue(d.projectName);
                $$('id-select-type').setValue(d.projectNameSearchType+'');
                $$('summary-search').setValue(d.projectSummary);
                $$('summary-select-type').setValue(d.projectSummarySearchType+'');
                $$('status-select').setValue(d.status);
                $$('status-type').setValue(d.statusType+'');
                $$('to-date').setValue(d.toDate);
                //$$('type-select').setValue(d.type);
                $$('work-date').setValue(d.workDate);
                $$('date-type').setValue(d.dateType);
                performSearch(searchData);
            }
        });
    }

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
        //$$('category-select').setValue('');
        //$$('type-select').setValue('');
        $$('subtype-select').setValue('');
        $$('status-type').setValue('1');
        $$('status-select').setValue('');
        $$('status-select').disable();
        $$('from-date').clear();
        $$('to-date').clear();
        $$('client-select').setValue('');
        $$('work-date').setValue(DateUtils.today());
        $$('date-type').setValue('A');
        grid.clear();
        $$('info').clear();
    });

    let searchData;

    const performSearch = function (sd) {
        if (!sd)
            searchData = {
                category: '', // $$('category-select').getValue(),
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
                type: '', // $$('type-select').getValue(),
                subType: $$('subtype-select').getValue(),
                workDate: $$('work-date').getIntValue(),
                dateType: $$('date-type').getValue(),
                sortType: $$('sort-type').getValue(),
                export: false
            };
        else
            searchData = sd;
        Server.call(RWS, 'SearchProjects', searchData).then(function (res) {
            if (res._Success) {
                grid.clear();
                $$('info').clear();
                $$('add-sub-project').disable();
                $$('edit').disable();
                $$('delete').disable();

                res.projects.forEach(p => {
                   p.startDate = DateUtils.intToStr2(p.estimated_first_date);
                   p.endDate   = DateUtils.intToStr2(p.estimated_last_date);
                   p.net = Utils.format(p.actual_workers - p.required_workers, "P", 0, 0);
                   if (p.scheduled === p.scheduledNow)
                       /*
                              The following must be converted to a string because ag-grid looks at the columns of the first row to determine the type.
                              Since this field is sometimes a string, we must be sure the first record shows to ag-grid as a string.
                        */
                       p.scheduled2 = String(p.scheduled);
                   else
                       p.scheduled2 = p.scheduledNow + " (" + p.scheduled + ")";
                    p.remainingHours = Utils.format(p.estimate_hours - p.total_hours, "CP", 0, 0);
                });

                grid.addRecords(res.projects);
                if (res.cap <= res.projects.length) {
                    $$('info').setValue('Displaying ' + res.projects.length + ' Projects (Limit)');
                    $$('info').setColor('red');
                } else {
                    $$('info').setValue('Displaying ' + res.projects.length + ' Projects');
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

    $$('export-list').onclick(function () {
        const searchData = {
            category: '', // $$('category-select').getValue(),
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
            type: '', // $$('type-select').getValue(),
            workDate: $$('work-date').getIntValue(),
            dateType: $$('date-type').getValue(),
            sortType: $$('sort-type').getValue(),
            export: true
        };
        Server.call(RWS, 'SearchProjects', searchData).then(function (res) {
            if (res._Success) {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('report').onclick(function () {
        const data = {
            category: '', // $$('category-select').getValue(),
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
            type: '', // $$('type-select').getValue()
        };
        AWS.callSoap(SWS, 'getReport', data).then(function (res) {
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

    function trim(s) {
        return s ? s.trim() : '';
    }


    $$('edit-previous-project').onclick(function () {
        let id = $$('recent-projects').getValue();
        if (!id)
            return;
        Utils.saveData(PROJECT_SEARCH_DATA, searchData);
        Utils.saveData(CURRENT_PROJECT_ID, $$('recent-projects').getValue());
        Utils.saveData(CURRENT_PROJECT_SUMMARY, $$('recent-projects').getLabel());
        Utils.saveData(CURRENT_PROJECT_NAME, trim($$('recent-projects').getData()));
        Framework.getChild();
    });

    const editProject = function () {
        const row = grid.getSelectedRow();
        Utils.saveData(PROJECT_SEARCH_DATA, searchData);
        Utils.saveData(CURRENT_PROJECT_ID, row.project_id);
        Utils.saveData(CURRENT_PROJECT_NAME, trim(row.project_name));
        Utils.saveData(CURRENT_PROJECT_SUMMARY, row.description);
        rememberVisitedProject(grid.getSelectedRow().project_id, row.project_name, row.description);
        Framework.getChild();
    };

    $$('edit').onclick(editProject);

    grid.setOnRowDoubleClicked(editProject);

    $$('delete').onclick(function () {
        Utils.yesNo('Question', 'Are you sure you wish to delete this project?', function () {
            const data = {
                projectIds: grid.getSelectedRow().project_id
            };
            AWS.callSoap(SWS, 'deleteProject', data).then(function (res) {
                if (res.wsStatus === "0")
                    Utils.showMessage("Information", "The project has been deleted.");
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
            let idx = lbl.indexOf(' ');
            if (idx < 0)
                idx = lbl.length - 1;
            $$('add-project-retailer').setValue(Utils.take(lbl, idx+1));
            calcSummary();
        });
    });

    const addProjectPopup = function (isSubProject) {
        let routeId;
        let title = isSubProject ? 'Add Sub-Project' : 'Add Project';
        $$('add-project-title').setValue(title);
        $$('add-project-detail').clear();
        $$('add-project-client').clear();
        $$('add-project-category').clear();
        $$('add-project-type').clear();
        $$('add-project-state').clear();
        $$('add-project-store').clear();
        $$('add-project-shift').clear();
        $$('add-project-city').clear();
        $$('add-project-zipcode').clear();
        $$('add-project-summary').clear();
        $$('add-project-retailer').clear();

        Utils.popup_open("add-project-popup");
        let data = {
            autoDefault: false,
            nameSearchType: 0,
            projectId: null
        };
        AWS.callSoap(SWS, 'searchCompanyByType', data).then(function (res) {
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

        Server.call(RWS, 'GetProjectSubtypes').then(function (res) {
            const ctl = $$('add-project-subtype');
            ctl.clear();
            if (res._Success) {
                ctl.add('', '(choose)');
                ctl.addItems(res.subtypes, 'project_subtype_id', 'code');
            }
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
            AWS.callSoap(SWS, 'getDefaultsForCategoryAndType', data).then(function (res) {
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
        AWS.callSoap(SWS, 'searchProjectCategories', data).then(function (res) {
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
        AWS.callSoap(SWS, 'searchProjectTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.projectTypes = Utils.assureArray(res.projectTypes);
                const ctl = $$('add-project-type');
                ctl.clear();
                ctl.add('', '(choose)');
                for (let i = 0; i < res.projectTypes.length; i++)
                    ctl.add(res.projectTypes[i].projectTypeId, res.projectTypes[i].code);
            }
        });

        $$('add-project-category').onChange(updateRouteId);
        $$('add-project-type').onChange(updateRouteId);

        $$('add-project-cancel').onclick(function () {
            Utils.popup_close();
        });
        $$('add-project-ok').onclick(function () {
            if ($$('add-project-client').isError('Client'))
                return;
            if ($$('add-project-retailer').isError('Retailer'))
                return;
            if ($$('add-project-store').isError('Store Number'))
                return;
            if ($$('add-project-shift').isError('Shift'))
                return;
            if ($$('add-project-city').isError('City'))
                return;
            if ($$('add-project-state').isError('State'))
                return;
            if ($$('add-project-zipcode').isError('Zip Code'))
                return;
            if ($$('add-project-category').isError('Category'))
                return;
            if ($$('add-project-type').isError('Type'))
                return;
            if ($$('add-project-subtype').isError('Subtype'))
                return;
            if (!routeId) {
                Utils.showMessage("Error", "You have not selected a project type and category with a valid route.");
                return;
            }
            Utils.popup_close();

            Utils.saveData(PROJECT_SEARCH_DATA, searchData);

            const data = {
                description: $$('add-project-summary').getValue(),
                locationDescription: $$('add-project-retailer').getValue(),
                detail: $$('add-project-detail').getValue(),
                parentId: isSubProject ? grid.getSelectedRow().project_id : null,
                projectCategoryId: $$('add-project-category').getValue(),
                projectName: '',
                projectTypeId: $$('add-project-type').getValue(),
                rateTypeId: null,  // Blake
                requestingOrgGroupId: $$('add-project-client').getValue(),
                routeId: routeId,
                state: $$('add-project-state').getValue(),
                store: $$('add-project-store').getValue(),
                shift: $$('add-project-shift').getValue(),
                city: $$('add-project-city').getValue(),
                zipcode: $$('add-project-zipcode').getValue(),
                subtype: $$('add-project-subtype').getValue()
            };
            AWS.callSoap(SWS, 'newProject', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', "New Project '" + res.projectName + "' has been created").then(function () {
                        if ($$('add-project-open-project').getValue()) {
                            Utils.saveData(CURRENT_PROJECT_ID, res.projectId);
                            Utils.saveData(CURRENT_PROJECT_NAME, trim(res.projectName));
                            Utils.saveData(CURRENT_PROJECT_SUMMARY, $$('add-project-summary').getValue());
                            rememberVisitedProject(res.projectId, trim(res.projectName), '');
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

    function val(summary, lbl) {
        let r = $$(lbl).getValue();
        if (r)
            r = r.trim();
        return r ? summary + ' ' + r : summary;
    }

    function calcSummary() {
        let summary;

        summary = $$('add-project-retailer').getValue();
        summary = summary ? summary.trim() : '';
        summary = val(summary, 'add-project-store');
        summary = val(summary, 'add-project-city');
        summary = val(summary, 'add-project-state');
        if ($$('add-project-subtype').getValue())
            summary += ' ' + $$('add-project-subtype').getLabel();
        summary = val(summary, 'add-project-shift');
        $$('add-project-summary').setValue(summary);
    }

    $$('add-project-retailer').onChange(calcSummary);
    $$('add-project-store').onChange(calcSummary);
    $$('add-project-city').onChange(calcSummary);
    $$('add-project-state').onChange(calcSummary);
    $$('add-project-subtype').onChange(calcSummary);
    $$('add-project-shift').onChange(calcSummary);
})();

