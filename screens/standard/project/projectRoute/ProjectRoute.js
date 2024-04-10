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

    const WS = 'StandardProjectProjectRoute';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const updateRoutes = () => {
        AWS.callSoap(WS, 'listProjectRoutes').then(ret => {
            if (ret.wsStatus === '0') {
                fillDropDownFromService('routes', ret, 'routeId', 'routeName');
            }
        });
    };
    updateRoutes();

    const listSmartChooser = (data) => {
        let elements = Utils.assureArray(data);

        elements.map(element => {
            $$(element.tag).clear();

            AWS.callSoap(WS, element.url, element.param).then(res => {
                $$(element.tag).clear();
                
                if (res.selectedItem && !res[element.item]) {
                    $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
                    $$(element.tag).setValue(res.selectedItem[element.ID], res.selectedItem[element.label]);
                }

                if (!res[element.item]) {
                    return;
                }
        
                if (res[element.item].length > res.lowCap) {
                    $$(element.tag).forceSelect();
                }
        
                $$(element.tag).addItems(Utils.assureArray(res[element.item]), element.ID, element.label);

                if (res.selectedItem) {
                    $$(element.tag).setValue(res.selectedItem[element.ID], res.selectedItem[element.label]);
                }
        
                if (element.selected) {
                    $$(element.tag).setValue(element.selected);
                }
            });
        });
    };

    const projectRoutesGrid = new AGGrid('prp-triggers-grid', [
        { headerName: 'Project Category Code', field: 'projectCategoryCode' },
        { headerName: 'Project Type Code', field: 'projectTypeCode' }
    ], 'uuid');
    projectRoutesGrid.show();
    projectRoutesGrid.setOnSelectionChanged((rows) => {
        $$('prp-triggers-edit').enable(rows);
        $$('prp-triggers-delete').enable(rows);
    });

    const projectRoutePopup = (row) => {
        let tabContainer = null;
        let triggers = [];

        let updatePrpGrid = () => {
            projectRoutesGrid.clear();
            projectRoutesGrid.addRecords(triggers);
            $$('prp-triggers-edit').disable();
            $$('prp-triggers-delete').disable();
        };

        let resetDialog = () => {
            if (row) {
                $$('prp-title').setValue(`Edit Project Route`);
                $$('prp-apply-to-all').disable();
            } else {
                $$('prp-title').setValue(`Add Project Route`);
                $$('prp-apply-to-all').disable();
            }

            $$('prp-route').clear();
            $$('prp-route-desc').clear();
            $$('prp-apply-to-all').clear();
            $$('prp-lactive-date').clear();

            projectRoutesGrid.clear();

            $$('prp-company').clear().disable();
            $$('prp-org-group').clear().disable();
            $$('prp-decision-point').clear().disable();
            $$('prp-status').clear().disable();

            tabContainer.selectTab('prpBasicsTabButton');            
        };

        let initDialog = async () => {
            // Setup tab layout.
            tabContainer = new TabContainer('prpTabContainer');

            resetDialog();
            
            if (!row) {
                return;
            }

            let res = await AWS.callSoap(WS, 'loadProjectRoute', {routeId: row.routeId});

            if (res.wsStatus === '0') {
                Utils.assureArray(res.item).map(item => triggers.push({...item, uuid: Utils.uuid()}));

                $$('prp-route').setValue(res.routeName);
                $$('prp-route-desc').setValue(res.routeDescription);
                $$('prp-apply-to-all').setValue(res.allCompanies);
                $$('prp-lactive-date').setValue(res.lastActiveDate);

                row = { ...row, ...res };
            }

            listSmartChooser([
                {tag: 'prp-company', url: 'searchCompanyByType', item: 'companies', ID: 'orgGroupId', label: 'name', param: {routeId: row.routeId, companyId: row.initialRouteStopCompanyId}},
                {tag: 'prp-org-group', url: 'searchOrgGroupsForCompany', item: 'item', ID: 'id', label: 'name', param: {routeId: row.routeId, companyId: row.initialRouteStopCompanyId, orgGroupId: row.initialRouteStopOrgGroupId}},
                {tag: 'prp-decision-point', url: 'searchRouteStops', item: 'item', ID: 'routeStopId', label: 'routeStopNameFormatted', param: { routeId: row.routeId,  companyId: row.initialRouteStopCompanyId, orgGroupId: row.initialRouteStopOrgGroupId, routeStopId: row.initialRouteStopId, searchType: '2' }},
                {tag: 'prp-status', url: 'searchProjectStatuses', item: 'item', ID: 'id', label: 'code', param: { routeStopId: row.initialRouteStopId, statusId: row.initialProjectStatusId }},
            ]);

            $$('prp-company').enable();
            
            updatePrpGrid();
        };

        initDialog();

        Utils.popup_open('project-route-popup');
    
        return new Promise(async function (resolve, reject) {
            $$('prp-company').onChange((v) => {
                if (!row) return;

                if (!v) {
                    $$('prp-org-group').clear().disable();
                    $$('prp-decision-point').clear().disable();
                    $$('prp-status').clear().disable();
                } else {
                    listSmartChooser({
                        tag: 'prp-org-group', 
                        url: 'searchOrgGroupsForCompany', 
                        item: 'item', 
                        ID: 'id', 
                        label: 'name', 
                        param: {
                            routeId: row.routeId, 
                            companyId: v
                        }
                    });
                    $$('prp-org-group').enable();
                }
            });

            $$('prp-org-group').onChange((v) => {
                if (!row) return;
                
                if (!v) {
                    $$('prp-decision-point').clear().disable();
                    $$('prp-status').clear().disable();
                } else {
                    listSmartChooser({
                        tag: 'prp-decision-point', 
                        url: 'searchRouteStops', 
                        item: 'item', 
                        ID: 'routeStopId', 
                        label: 'routeStopNameFormatted', 
                        param: {
                            routeId: row.routeId, 
                            companyId: $$('prp-company').getValue(),
                            orgGroupId: v
                        }
                    });
                    $$('prp-decision-point').enable();
                }
            });

            $$('prp-decision-point').onChange((v) => {
                if (!row) return;
                
                if (!v) {
                    $$('prp-status').clear().disable();
                } else {
                    listSmartChooser({
                        tag: 'prp-status', 
                        url: 'searchProjectStatuses', 
                        item: 'item', 
                        ID: 'id', 
                        label: 'code', 
                        param: {
                            routeStopId: v
                        }
                    });
                    $$('prp-status').enable();
                }
            });

            $$('prp-triggers-add').onclick(async () => {
                let data = await routeAssignmentPopup();
                if (data) {
                    triggers.push({ ...data, uuid: Utils.uuid() });
                    updatePrpGrid();
                }
            });

            $$('prp-triggers-edit').onclick(async () => {
                let row = projectRoutesGrid.getSelectedRow();
                let data = await routeAssignmentPopup(row);
                if (data) {
                    let newTriggers = [];
                    triggers.map(trigger => {
                        if (trigger.uuid == row.uuid) {
                            newTriggers.push({ ...data, uuid: row.uuid });
                        } else {
                            newTriggers.push(trigger);
                        }
                    });
                    triggers = newTriggers;
                    updatePrpGrid();
                }
            });

            $$('prp-triggers-delete').onclick(async () => {
                Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected route trigger?', () => {
                    let row = projectRoutesGrid.getSelectedRow();
                    let newTriggers = [];
                    triggers.map(trigger => {
                        if (trigger.uuid != row.uuid) {
                            newTriggers.push(trigger);
                        }
                    });
                    triggers = newTriggers;
                    updatePrpGrid();
                });
            });

            let ok = () => {
                if ($$('prp-route').isError('Route Name')){
                    tabContainer.selectTab('prpBasicsTabButton');            
                    return;
                }

                const data = {
                    routeName: $$('prp-route').getValue(),
                    routeDescription: $$('prp-route-desc').getValue(),
                    allCompanies: $$('prp-apply-to-all').getValue(),
                    lastActiveDate: $$('prp-lactive-date').getIntValue(),
                    defaultRouteStopId: $$('prp-decision-point').getValue(),
                    defaultStatusId: $$('prp-status').getValue(),
                    item: triggers.map(trigger => {return {projectCategoryId: trigger.projectCategoryId, projectTypeId: trigger.projectTypeId}})
                }
                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('prp-ok').onclick(ok);
            $$('prp-cancel').onclick(cancel);
        });
    
    };

    const routeAssignmentPopup = (row) => {
        let resetDialog = () => {
            if (row) {
                $$('rap-title').setValue(`Edit Matching Criteria`);
            } else {
                $$('rap-title').setValue(`Add Matching Criteria`);
            }

            AWS.callSoap(WS, 'searchProjectCategories', {id: row ? row.projectCategoryId:null}).then(res => {
                $$('rap-project-category').clear().addItems(Utils.assureArray(res.item), 'projectCategoryId', 'code');            
                if (res.selectedItem) {
                    $$('rap-project-category').setValue(res.selectedItem.projectCategoryId, res.selectedItem.code);
                }
            });

            AWS.callSoap(WS, 'searchProjectTypes', {id: row ? row.projectTypeId:null}).then(res => {
                $$('rap-project-type').clear().addItems(Utils.assureArray(res.item), 'projectTypeId', 'code');            
                if (res.selectedItem) {
                    $$('rap-project-type').setValue(res.selectedItem.projectTypeId, res.selectedItem.code);
                }
            });
        };
        
        resetDialog();

        Utils.popup_open('route-assignment-popup');
    
        return new Promise(async function (resolve, reject) {
            let ok = () => {
                if ($$('rap-project-category').isError('Project Category'))
                    return;
                if ($$('rap-project-type').isError('Project Type'))
                    return;
                const data = {
                    projectCategoryId: $$('rap-project-category').getValue(),
                    projectCategoryCode: $$('rap-project-category').getLabel(),                    
                    projectTypeId: $$('rap-project-type').getValue(),
                    projectTypeCode: $$('rap-project-type').getLabel()
                };
                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('rap-ok').onclick(ok);
            $$('rap-cancel').onclick(cancel);
        });
    
    };

    $$('routes').onChange(() => {
        if (!$$('routes').getValue()) {
            $$('routes-edit').disable();
            $$('routes-delete').disable();
            $$('routes-report').disable();

            $$('org-group').disable();
            $$('org-group').setValue('');

            $$('decision-points').disable();
            $$('decision-points').setValue('');
            $$('decision-point-add').disable();
            $$('decision-point-edit').disable();
            $$('decision-point-delete').disable();

            updateGrid();
            return;
        }

        $$('routes-edit').enable();
        $$('routes-delete').enable();
        $$('routes-report').enable();
        $$('org-group').enable();
        $$('decision-point-add').enable();
        $$('decision-point-edit').disable();
        $$('decision-point-delete').disable();

        AWS.callSoap(WS, 'listCompanyAndOrgGroupsForRoute', { routeId: $$('routes').getValue() }).then(ret => {
            if (ret.wsStatus === '0') {
                $$('org-group').clear().addItems(Utils.assureArray(ret.item), 'nameFormatted', 'nameFormatted');
                $$('decision-points').clear();
                updateGrid();
            }
        });
    });

    $$('routes-add').onclick(async () => {
        let data = await projectRoutePopup();
        if (data) {
            AWS.callSoap(WS, 'newProjectRoute', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateRoutes();
                }
            });
        }
    });

    $$('routes-edit').onclick(async () => {
        let row = $$('routes').getData();
        let data = await projectRoutePopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveProjectRoute', {...data, routeId: row.routeId}).then(ret => {
                if (ret.wsStatus === '0') {
                    updateRoutes();
                }
            });
        }
    });

    $$('routes-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Project Route?', () => {
            const data = {
                id: [$$('routes').getData().routeId]
            };
            
            AWS.callSoap(WS, "deleteProjectRoute", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateRoutes();
                }
            });            
        });
    });

    $$('routes-report').onclick(() => {
        const data = {
            routeId: $$('routes').getData().routeId
        };
        AWS.callSoap(WS, 'getReport', data).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });

    const updateRouteStops = () => {
        const data = {
            routeId: $$('routes').getValue(),
            companyId: $$('org-group').getData().companyId,
            orgGroupId: $$('org-group').getData().orgGroupId,
        };

        AWS.callSoap(WS, 'listRouteStopsForRoute', data).then(ret => {
            if (ret.wsStatus === '0') {
                $$('decision-points').clear().addItems(Utils.assureArray(ret.item), 'routeStopId', 'routeStopNameFormatted');
                if (Utils.assureArray(ret.item).length === 1) {
                    $$('decision-points').selectIndex(1);
                    $$('decision-point-edit').enable();
                    $$('decision-point-delete').enable();
                } else {
                    $$('decision-points').selectIndex(0);
                    $$('decision-point-edit').disable();
                    $$('decision-point-delete').disable();
                }
                updateGrid();
            }
        });
    };

    const statusDisassociatedGrid = new AGGrid('rsp-disassociated-grid', [
        { headerName: 'Code', field: 'code' },
        { headerName: 'Description', field: 'description' }
    ], 'id');
    statusDisassociatedGrid.show();
    statusDisassociatedGrid.setOnSelectionChanged($$('rsp-status-associate').enable);

    const statusAssociatedGrid = new AGGrid('rsp-associated-grid', [
        { headerName: 'Code', field: 'code' },
        { headerName: 'Description', field: 'description' }
    ], 'id');
    statusAssociatedGrid.show();
    statusAssociatedGrid.setOnSelectionChanged($$('rsp-status-disassociate').enable);
    
    const checklistGrid = new AGGrid('rsp-checklist-grid', [
        { headerName: 'Active', field: 'activeFormatted', width: 70 },
        { headerName: 'Required', field: 'requiredFormatted', width: 80 },
        { headerName: 'Description', field: 'description', width: 530 }
    ], 'uuid');
    checklistGrid.show();
    checklistGrid.setOnSelectionChanged((rows) => {
        $$('rsp-checklist-edit').enable(rows);
        $$('rsp-checklist-moveup').enable(rows);
        $$('rsp-checklist-movedown').enable(rows);
        $$('rsp-checklist-delete').enable(rows);
    });

    const routeStopPopup = (row) => {
        let tabContainer = null;
        let checklists = [];

        let checklistPopup = (row) => {
            let resetDialog = () => {
                if (row) {
                    $$('clp-title').setValue(`Edit Check List Item`);
                } else {
                    $$('clp-title').setValue(`Add Check List Item`);
                }
    
                $$('clp-summary').clear();
                $$('clp-detail').clear();
                $$('clp-required').clear();
                $$('clp-active-date').clear();
                $$('clp-lactive-date').clear();

                $$('clp-summary').focus();
            };
            
            resetDialog();

            if (row) {
                $$('clp-summary').setValue(row.description);
                $$('clp-detail').setValue(row.detail);
                $$('clp-required').setValue(row.required);
                $$('clp-active-date').setValue(row.activeDate);
                $$('clp-lactive-date').setValue(row.lastActiveDate);
            }
    
            Utils.popup_open('checklist-popup', 'clp-summary');
        
            return new Promise(async function (resolve, reject) {
                let ok = () => {
                    if ($$('clp-summary').isError('Summary'))
                        return;

                    const data = {
                        description: $$('clp-summary').getValue(),
                        detail: $$('clp-detail').getValue(),
                        required: $$('clp-required').getValue(),
                        requiredFormatted: $$('clp-required').getValue() ? 'Yes':'No',
                        activeDate: $$('clp-active-date').getIntValue(),
                        activeFormatted: $$('clp-active-date').getIntValue() ? 'No':'Yes',
                        lastActiveDate: $$('clp-lactive-date').getIntValue(),
                    };

                    resolve(data);
                    Utils.popup_close();
                };
        
                let cancel = () => {
                    resolve(null);
                    Utils.popup_close();
                };
    
                $$('clp-ok').onclick(ok);
                $$('clp-cancel').onclick(cancel);
            });
        };

        let resetDialog = () => {
            if (row) {
                $$('rsp-title').setValue(`Edit Decision Point`);
            } else {
                $$('rsp-title').setValue(`Add Decision Point`);
            }

            statusDisassociatedGrid.clear();
            statusAssociatedGrid.clear();
            checklistGrid.clear();

            $$('rsp-name').clear();
            $$('rsp-auto-assign').clear();

            $$('rsp-status-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('rsp-status-code-search').clear();

            $$('rsp-group').clear();

            tabContainer.selectTab('rspStatusTabButton');            
        };

        let updateAssociation = () => {
            const data = {
                code: $$('rsp-status-code-search').getValue(), 
                codeSearchType: $$('rsp-status-code-criteria').getValue(),
                excludeStatusIds: statusAssociatedGrid.getAllRows().map(d => d.id)
            }
            AWS.callSoap(WS, 'searchStatusesNotForRouteStop', data).then(ret => {
                statusDisassociatedGrid.clear().addRecords(Utils.assureArray(ret.item));
                $$('rsp-disassociated-grid-status').setValue(`Displaying ${statusDisassociatedGrid.getAllRows().length} Project Statuses`);
                $$('rsp-associated-grid-status').setValue(`Displaying ${statusAssociatedGrid.getAllRows().length} Project Statuses`);
            });
        };

        let updateChecklist = () => {
            checklistGrid.clear().addRecords(checklists);
            $$('rsp-checklist-grid-status').setValue(`Displaying ${checklists.length} Check List Items`);
        };

        bindToEnum('rsp-status-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        let initDialog = async () => {
            // Setup tab layout.
            tabContainer = new TabContainer('rspTabContainer');

            resetDialog();

            $$('rsp-company').forceSelect();
            $$('rsp-company').setSelectFunction(async () => {
                let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
                if (res._status === "ok")
                    $$('rsp-company').setValue(res.id, res.name);
            });

            listSmartChooser({
                tag: 'rsp-project-phase', 
                url: 'searchProjectPhases', 
                item: 'item', 
                ID: 'id', 
                label: 'code', 
                param: { phaseId: row ? row.phaseId:null }
            });

            let orgGroupData = $$('org-group').getData();
            if (orgGroupData) {
                $$('rsp-company').setValue(orgGroupData.companyId, orgGroupData.companyName);
                AWS.callSoap(WS, 'searchOrgGroupsForCompany', { companyId: orgGroupData.companyId }).then(ret => {
                    $$('rsp-group').clear().addItems(Utils.assureArray(ret.item), 'id', 'name');
                    $$('rsp-group').setValue(orgGroupData.orgGroupId, orgGroupData.orgGroupName);
                    if (row) {
                        $$('rsp-group').disable();
                        $$('rsp-company').disable();
                    } else {
                        $$('rsp-group').enable();
                        $$('rsp-company').enable();
                    }
                });
            }
        
            if (row) {
                let data = await AWS.callSoap(WS, 'listStatusesForRouteStop', {routeStopId: row.routeStopId});
                statusAssociatedGrid.clear().addRecords(Utils.assureArray(data.item));

                data = await AWS.callSoap(WS, 'listCheckListItemsForRouteStop', {routeStopId: row.routeStopId});
                checklists = Utils.assureArray(data.item).map(item => ({...item, uuid: Utils.uuid()}));


                $$('rsp-name').setValue(row.routeStopName);
                $$('rsp-auto-assign').setValue(row.autoAssignToSupervisors);

                updateChecklist();
            }

            updateAssociation();
            
        };

        initDialog();

        Utils.popup_open('route-stop-popup');

        const swapAssociation = (type) => {
            let row = type == 1 ? statusDisassociatedGrid.getSelectedRow() : statusAssociatedGrid.getSelectedRow();
            let disassociated = [];
            let associated = [];

            statusDisassociatedGrid.getAllRows().map(d => {
                if (d.id == row.id && type == 1) 
                    return;
                disassociated.push(d);
            });

            statusAssociatedGrid.getAllRows().map(d => {
                if (d.id == row.id && type != 1) 
                    return;
                associated.push(d);
            });

            if (type == 1) {
                associated.push(row);
            } else {
                disassociated.push(row);
            }

            statusDisassociatedGrid.clear().addRecords(disassociated);
            $$('rsp-disassociated-grid-status').setValue(`Displaying ${disassociated.length} Project Statuses`);
            statusAssociatedGrid.clear().addRecords(associated);
            $$('rsp-associated-grid-status').setValue(`Displaying ${associated.length} Project Statuses`);
        };
        statusDisassociatedGrid.setOnRowDoubleClicked(() => swapAssociation(1));
        statusAssociatedGrid.setOnRowDoubleClicked(() => swapAssociation(2));
    
        return new Promise(async function (resolve, reject) {
            $$('rsp-status-associate').onclick(() => swapAssociation(1))
            $$('rsp-status-disassociate').onclick(() => swapAssociation(2))

            $$('rsp-company').onChange(v => {
                AWS.callSoap(WS, 'searchOrgGroupsForCompany', { companyId: v }).then(ret => {
                    $$('rsp-group').clear().addItems(Utils.assureArray(ret.item), 'id', 'name');
                    $$('rsp-group').enable();
                });
            });

            $$('rsp-checklist-add').onclick(async () => {
                let data = await checklistPopup();
                if (data) {
                    checklists.push({ ...data, uuid: Utils.uuid() });
                    updateChecklist();
                }
            });

            $$('rsp-checklist-moveup').onclick(async () => {
                let row = checklistGrid.getSelectedRow();
                
                if (!row) {
                    return;
                }

                let index = checklists.findIndex(field => field.uuid === row.uuid);
                let temp = checklists[index];
                let upIndex = index - 1;
                if (index === 0) {
                    upIndex = checklists.length - 1;
                }

                checklists[index] = checklists[upIndex];
                checklists[upIndex] = temp;

                updateChecklist();

                checklistGrid.selectId(row.uuid);
            });

            $$('rsp-checklist-movedown').onclick(async () => {
                let row = checklistGrid.getSelectedRow();
                
                if (!row) {
                    return;
                }

                let index = checklists.findIndex(field => field.uuid === row.uuid);
                let temp = checklists[index];
                let downIndex = index + 1;
                if (index === checklists.length - 1) {
                    downIndex = 0;
                }

                checklists[index] = checklists[downIndex];
                checklists[downIndex] = temp;

                updateChecklist();

                checklistGrid.selectId(row.uuid);
            });

            $$('rsp-checklist-edit').onclick(async () => {
                let row = checklistGrid.getSelectedRow();
                let data = await checklistPopup(row);
                if (data) {
                    let newChecklist = [];
                    checklists.map(checklist => {
                        if (checklist.uuid == row.uuid) {
                            newChecklist.push({ ...data, uuid: row.uuid });
                        } else {
                            newChecklist.push(checklist);
                        }
                    });
                    checklists = newChecklist;
                    updateChecklist();
                }
            });

            $$('rsp-checklist-delete').onclick(async () => {
                let row = checklistGrid.getSelectedRow();
                let newChecklist = [];
                checklists.map(checklist => {
                    if (checklist.uuid != row.uuid) {
                        newChecklist.push(checklist);
                    }
                });
                checklists = newChecklist;
                updateChecklist();
            });

            let ok = () => {
                if ($$('rsp-company').isError('Company') || $$('rsp-name').isError('Decision Point') || $$('rsp-project-phase').isError('Project Phase')) {
                    tabContainer.selectTab('rspStatusTabButton');            
                    return;
                }

                const data = {
                    routeStopName: $$('rsp-name').getValue(),
                    phaseId: $$('rsp-project-phase').getValue(),
                    companyId: $$('rsp-company').getValue(),
                    orgGroupId: $$('rsp-group').getValue(),
                    autoAssignToSupervisors: $$('rsp-auto-assign').getValue(),
                    statusIds: statusAssociatedGrid.getAllRows().map(status => status.id),
                    checkListItems: checklists.map(checklist => checklist)
                };

                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('rsp-ok').onclick(ok);
            $$('rsp-cancel').onclick(cancel);
        });    
    };

    $$('decision-point-add').onclick(async () => {
        let data = await routeStopPopup();
        if (data) {
            AWS.callSoap(WS, 'newRouteStop', {...data, routeId: $$('routes').getValue()}).then(ret => {
                if (ret.wsStatus === '0') {
                    updateRouteStops();
                }
            });
        }
    });

    $$('decision-point-edit').onclick(async () => {
        let row = $$('decision-points').getData();
        let data = await routeStopPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveRouteStop', {...data, routeStopId: row.routeStopId}).then(ret => {
                if (ret.wsStatus === '0') {
                    updateRouteStops();
                }
            });
        }
    });

    $$('decision-point-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Decision Point??', () => {
            const data = {
                id: [$$('decision-points').getData().routeStopId]
            };
            
            AWS.callSoap(WS, "deleteRouteStop", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateRoutes();
                    updateRouteStops();
                }
            });            
        });
    });

    $$('org-group').onChange(() => {
        if (!$$('org-group').getValue()) {
            $$('decision-points').disable();
            $$('decision-points').setValue('');
            $$('decision-point-edit').disable();
            $$('decision-point-delete').disable();
            updateGrid();
            return;
        }

        $$('decision-points').enable();

        const data = {
            routeId: $$('routes').getValue(),
            companyId: $$('org-group').getData().companyId,
            orgGroupId: $$('org-group').getData().orgGroupId,
        };

        AWS.callSoap(WS, 'listRouteStopsForRoute', data).then(ret => {
            if (ret.wsStatus === '0') {
                $$('decision-points').clear().addItems(Utils.assureArray(ret.item), 'routeStopId', 'routeStopNameFormatted');
                if (Utils.assureArray(ret.item).length === 1) {
                    $$('decision-points').selectIndex(1);
                    $$('decision-point-edit').enable();
                    $$('decision-point-delete').enable();
                } else {
                    $$('decision-points').selectIndex(0);
                    $$('decision-point-edit').disable();
                    $$('decision-point-delete').disable();
                }
                updateGrid();
            }
        });
    });

    $$('decision-points').onChange(() => {
        if (!$$('decision-points').getValue()) {
            $$('decision-point-edit').disable();
            $$('decision-point-delete').disable();
            updateGrid();
            return;
        }

        $$('decision-point-edit').enable();
        $$('decision-point-delete').enable();

        updateGrid();
    });

    const columns = [
        { headerName: 'When Status Becomes', field: 'fromStatusCode' },
        { headerName: 'Send To Company (Organizational Group)', field: 'toNameFormatted' },
        { headerName: 'Send To Decision Point', field: 'toRouteStopName' },
        { headerName: 'Change Status To', field: 'toStatusCode' },
    ];    
    const grid = new AGGrid('grid', columns, 'routePathId');
    grid.show();

    function updateGrid() {
        grid.clear();
        
        if ($$('decision-points').getValue()) {
            AWS.callSoap(WS, 'listRoutePaths', { routeStopId: $$('decision-points').getValue() }).then(ret => {
                if (ret.wsStatus === '0') {
                    let records = Utils.assureArray(ret.item);
                    grid.addRecords(records);
                    $$('status').setValue(`Displaying ${records.length} Next Route Stops`);
                    $$('add').enable();
                }
            });
        } else {
            $$('status').setValue(`Displaying 0 Next Route Stops`);
            $$('add').disable();
        }

        $$('edit').disable();
        $$('delete').disable();
    }

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    const routePathPopup = (row) => {
        const routeId = $$('routes').getData() ? $$('routes').getData().routeId : null;
        const fromCompany = $$('org-group').getData();
        const fromRouteStop = $$('decision-points').getData();

        const initSmartChooser = (element, ret, id, name, autoForceOnSingleItem = false) => {
            let items = Utils.assureArray(ret.item);
            
            $$(element).enable();

            $$(element).clear().addItems(items, id, name);
            if (ret.selectedItem) {
                $$(element).setValue(ret.selectedItem[id], ret.selectedItem[name]);
            } else if (items.length === 1 && autoForceOnSingleItem) {
                $$(element).setValue(items[0][id], items[0][name]);
                $$(element).disable();
            }
        }

        const updatedCompany = async (v = true, initial = false) => {
            const companyId = $$('rpp-to-company').getValue();
            
            if (!v) {
                $$('rpp-to-org-group').disable();
                $$('rpp-to-org-group').setValue('');

                $$('rpp-to-decision-point').disable();
                $$('rpp-to-decision-point').setValue('');

                $$('rpp-to-status-code').disable();
                $$('rpp-to-status-code').setValue('');
                return;
            }

            let ret = await AWS.callSoap(WS, 'searchOrgGroupsForCompany', { companyId: initial?(row?row.toCompanyId:null):companyId, orgGroupId: row?row.toOrgGroupId:null, routeId: routeId });
            initSmartChooser('rpp-to-org-group', ret, 'id', 'name');
            $$('rpp-to-org-group').enable();

            await updatedOrgGroup(true, initial);
            await updatedRouteStop(true, initial);
        };

        const updatedOrgGroup = async (v = true, initial = false) => {
            const orgGroupId = $$('rpp-to-org-group').getValue();

            if (!v) {
                $$('rpp-to-decision-point').setValue('');

                $$('rpp-to-status-code').disable();
                $$('rpp-to-status-code').setValue('');
                return;
            }

            let ret = await AWS.callSoap(WS, 'searchRouteStops', { 
                companyId: initial? (row?row.toCompanyId:null):$$('rpp-to-company').getValue(), 
                orgGroupId: orgGroupId,
                routeId: routeId,
                routeStopId: initial ? (row?row.toRouteStopId:null) : null,
                searchType: 2
            });

            initSmartChooser('rpp-to-decision-point', ret, 'routeStopId', 'routeStopNameFormatted', true);

            await updatedRouteStop(true, initial)
        };

        const updatedRouteStop = async (v = true, initial = false) => {
            const routeStopId = $$('rpp-to-decision-point').getValue();

            if (!v) {
                $$('rpp-to-status-code').disable();
                $$('rpp-to-status-code').setValue('');
                return;
            }

            let ret = await AWS.callSoap(WS, 'searchProjectStatuses', { 
                excludeAlreadyUsed: false, 
                routePathId: row?row.routePathId:null, 
                routeStopId: routeStopId,
                statusId: initial ? (row?row.toStatusId:null):null
            });
            initSmartChooser('rpp-to-status-code', ret, 'id', 'code', true);
            $$('rpp-to-status-code').enable(); 
        }


        let resetDialog = () => {
            if (row) {
                $$('rpp-title').setValue(`Edit Next Route Stop`);
            } else {
                $$('rpp-title').setValue(`Add Next Route Stop`);
            }

            $$('rpp-from-company').setValue( fromCompany ? fromCompany.companyName : '' );
            $$('rpp-from-org-group').setValue( fromCompany ? fromCompany.orgGroupName : '' );
            $$('rpp-from-decision-point').setValue( fromRouteStop ? fromRouteStop.routeStopNameFormatted : '' );

            $$('rpp-to-org-group').enable();
            $$('rpp-to-decision-point').enable();
            $$('rpp-to-status-code').enable();
        };

        let initDialog = () => {
            resetDialog();

            AWS.callSoap(WS, 'searchProjectStatuses', {
                excludeAlreadyUsed: true,
                routePathId: row ? row.routePathId : null,
                routeStopId: fromRouteStop ? fromRouteStop.routeStopId : null,
                statusId: row ? row.toStatusId : null
            }).then(ret => {
                if (ret.wsStatus === '0') {
                    let items = Utils.assureArray(ret.item);
                    $$('rpp-from-status-code').clear().addItems(items, 'id', 'code');
                    if (ret.selectedItem) {
                        $$('rpp-from-status-code').setValue(ret.selectedItem.id, ret.selectedItem.code);
                    } else {
                        $$('rpp-from-status-code').setValue(items[0].id, items[0].code);
                    }
                }
            });

            // $$('rpp-to-company').forceSelect();
            $$('rpp-to-company').setSelectFunction(() => {
                Utils.component('companySelection/CompanySelection', 'component-company-selection', {allowNullSelection: false}).then(data => {
                    $$('rpp-to-company').setValue(data.id, data.name);
                });
            });

            AWS.callSoap(WS, 'searchCompanyByType', {includeRequesting: true, routeId: routeId, companyId: row?row.toCompanyId:null}).then(ret => {
                let items = Utils.assureArray(ret.companies);
                $$('rpp-to-company').clear().addItems(items, 'orgGroupId', 'name');
                if (ret.selectedItem) {
                    $$('rpp-to-company').setValue(ret.selectedItem.orgGroupId, ret.selectedItem.name);
                }
            });

            if (!row) {
                $$('rpp-to-org-group').disable();
                $$('rpp-to-decision-point').disable();
                $$('rpp-to-status-code').disable();
            } else {
                $$('rpp-to-company').setValue();
            }

            updatedCompany(true, true);
        };

        Utils.popup_open('routepath-popup');

        initDialog();
    
        return new Promise(async function (resolve, reject) {
            $$('rpp-to-company').onChange((v) => updatedCompany( v?true:false ));
            $$('rpp-to-org-group').onChange((v) => updatedOrgGroup( v?true:false ));
            $$('rpp-to-decision-point').onChange((v) => updatedRouteStop( v?true:false ));

            let ok = () => {
                if ($$('rpp-to-company').isError('Company') || $$('rpp-to-decision-point').isError('Decision Point') || $$('rpp-to-status-code').isError('Status')) {
                    return;
                }
                const data = {
                    fromRouteStopId: fromRouteStop.routeStopId,
                    fromStatusId: $$('rpp-from-status-code').getValue(),
                    toRouteStopId: $$('rpp-to-decision-point').getValue(),
                    toStatusId: $$('rpp-to-status-code').getValue()
                }
                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('rpp-ok').onclick(ok);
            $$('rpp-cancel').onclick(cancel);
        });
    };

    $$('add').onclick(async () => {
        let data = await routePathPopup();
        if (data) {
            AWS.callSoap(WS, 'newRoutePath', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                }
            })
        }
    });

    async function edit() {
        let row = grid.getSelectedRow();
        let data = await routePathPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveRoutePath', {...data, routePathId: row.routePathId}).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                }
            })
        }
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Next Route Stop?', () => {
            const data = {
                ids: [grid.getSelectedRow().routePathId]
            };
            
            AWS.callSoap(WS, "deleteRoutePath", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });            
        });
    });
})();