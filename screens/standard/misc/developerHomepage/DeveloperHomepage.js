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
    const WS = 'StandardMiscDeveloperHomepage';

    function ProjectInfo() {}

    ProjectInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let a = document.createElement('a');
        a.style = "cursor: pointer; float: left;";
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
    function TimesheetDescription() {}

    TimesheetDescription.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            const timesheetId = params.data.timesheetId;
            const data = {
                timesheetId: timesheetId
            };
            AWS.callSoap(WS, 'getTimesheetDetail', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_open("project-description-popup");
                    $$('project-description').setValue(res.description);
                    $$('project-description-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.timeDescription;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    TimesheetDescription.prototype.getGui = function() {
        return this.eGui;
    };

    $$('onDate').setValue(DateUtils.today());

    $$('timesheet-status').setValue('Timesheet Entries for ' + DateUtils.dayOfWeekName($$('onDate').getIntValue()) + ', ' + DateUtils.intToStr4($$('onDate').getIntValue()));

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });
    let personId;

    const params = {
        firstName: '',
        firstNameSearchType: 0,
        lastName: '',
        lastNameSearchType: 0,
        ssn: ''
    }
    await AWS.callSoap(WS, 'searchEmployees', params).then(function (res) {
        if (res.wsStatus === "0") {
            personId = res.selectedItem.personId;
        }
    });

    let timesheetEntriesGrid;
    let projectsGrid;

    const timesheetEntriesColumnDefs = [
        {headerName: "S", field: "state", width: 50},
        {headerName: "Begin", field: "beginTimeFormatted", type: 'numericColumn', width: 100},
        {headerName: "End", field: "endTimeFormatted", type: 'numericColumn', width: 100},
        {headerName: "Hours", field: "totalHours", type: 'numericColumn', width: 100},
        {headerName: "B", field: "billable", width: 50},
        {headerName: "Company", field: "companyName", width: 200},
        {headerName: "Project ID", field: "projectName", type: 'numericColumn', cellRenderer: 'projectInfo', width: 200},
        {headerName: "Description Preview", field: "timeDescription", cellRenderer: 'timesheetDescription', width: 400}
    ];

    const projectsColumnDefs = [
        {headerName: "Id", field: "externalId", width: 100},
        {headerName: "Title", field: "title", width: 400},
        {headerName: "Status", field: "status", width: 200}
    ];

    timesheetEntriesGrid = new AGGrid('timesheetEntriesGrid', timesheetEntriesColumnDefs);
    projectsGrid = new AGGrid('projectsGrid', projectsColumnDefs);

    timesheetEntriesGrid.addComponent('projectInfo', ProjectInfo);
    timesheetEntriesGrid.addComponent('timesheetDescription', TimesheetDescription);

    timesheetEntriesGrid.show();
    projectsGrid.show();

    function getListTimesheetsForPersonOnDate() {
        const params = {
            personId: personId,
            timesheetDate: $$('onDate').getIntValue()
        }

        AWS.callSoap(WS, 'listTimesheetsForPersonOnDate', params).then(data => {
            timesheetEntriesGrid.clear();
            $$('edit').disable();
            $$('delete').disable();
            if (data.wsStatus === "0") {
                data.timesheetTransmit = Utils.assureArray(data.timesheetTransmit);
                $$('toDate').setValue(data.employeeFinalizedDate !== '0' ? data.employeeFinalizedDate : '');
                if (Number(data.employeeFinalizedDate) >= $$('onDate').getIntValue()) {
                    $$('finalize').disable();
                    $$('add').disable();
                    $$('edit').setValue('View');
                } else {
                    $$('finalize').enable();
                    $$('add').enable();
                    $$('edit').setValue('Edit');
                }
                $$('timesheet-status').setValue('Timesheet Entries for ' + DateUtils.dayOfWeekName($$('onDate').getIntValue()) + ', ' + DateUtils.intToStr4($$('onDate').getIntValue()) + (Number(data.employeeFinalizedDate) >= $$('onDate').getIntValue() ? ' (Day is Finalized)' : ' (Day is Not Yet Finalized)'));
                $$('billableHours').setValue(data.totalBillableHours);
                $$('totalHours').setValue(data.totalHours);
                timesheetEntriesGrid.addRecords(data.timesheetTransmit);     
                timesheetEntriesGrid.setOnSelectionChanged(() => {
                    $$('edit').enable();
                    if ($$('toDate').getIntValue() < $$('onDate').getIntValue()) {
                        $$('delete').enable();                        
                    }
                });
            }     
        });
    }

    function getListAssignedProjects() {
        const params = {
            employeeId: personId
        }
        AWS.callSoap(WS, 'listAssignedProjects', params).then(data => {
            projectsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                projectsGrid.addRecords(data.item);  
                projectsGrid.setOnSelectionChanged(() => {
                    const row = projectsGrid.getSelectedRow();
                    $$('project-title').setValue(row.title);
                    $$('project-id').setValue(row.externalId);
                    $$('project-description').setValue(row.description);
                    $$('project-company').setValue(row.company);
                    $$('project-created').setValue(row.createdDate);
                    $$('project-logged').setValue(row.loggedHours);
                    $$('project-status').setValue(row.status);
                    $$('project-estimated').setValue(row.estimatedHours);
                });
            }
        });
    }
    getListTimesheetsForPersonOnDate();
    getListAssignedProjects();

    $$('onDate').onChange(() => {
        getListTimesheetsForPersonOnDate();
        getListAssignedProjects();
    });
    $$('previous').onclick(() => {
        $$('onDate').setValue(DateUtils.intAddDays($$('onDate').getIntValue(), -1));
        getListTimesheetsForPersonOnDate();
        getListAssignedProjects();
    });

    $$('next').onclick(() => {
        $$('onDate').setValue(DateUtils.intAddDays($$('onDate').getIntValue(), 1));
        getListTimesheetsForPersonOnDate();
        getListAssignedProjects();
    });

    $$('finalize').onclick(() => {
        Utils.yesNo('Confirmation', 'Timesheet on or before ' + DateUtils.dayOfWeekName($$('onDate').getIntValue()) + ', ' + DateUtils.intToStr4($$('onDate').getIntValue()) + 
        ' will be finalized and will no longer be changeable. Finalize timesheet?', () => {
            const params = {
                date: $$('onDate').getIntValue(),
                personId: personId
            };
            AWS.callSoap(WS, 'finalizeTime', params).then(function (res) {
                if (res.wsStatus === "0") {
                    getListTimesheetsForPersonOnDate();
                }
            });
        });
    });

    function edit() {
        $$('dh-edit-timeBegin').clear();
        $$('dh-edit-timeEnd').clear();
        $$('dh-edit-hours').clear();
        $$('dh-edit-quickList').clear();
        $$('dh-edit-projectId').clear();
        $$('dh-edit-projectName').clear();
        $$('dh-edit-summary').clear();
        $$('dh-edit-company').clear();
        $$('dh-edit-billable').clear();
        $$('dh-edit-description').clear();
        $$('dh-edit-descriptions').clear();
        $$('dh-edit-reason').clear();

        if ($$('toDate').getIntValue() >= $$('onDate').getIntValue()) {
            $$('dh-edit-timeBegin').disable();
            $$('dh-edit-timeEnd').disable();
            $$('dh-edit-hours').disable();
            $$('dh-edit-quickList').disable();
            $$('dh-edit-projectId').disable();
            $$('dh-edit-projectName').disable();
            $$('dh-edit-summary').disable();
            $$('dh-edit-company').disable();
            $$('dh-edit-billable').disable();
            $$('dh-edit-description').disable();
            $$('dh-edit-descriptions').disable();
            $$('dh-edit-reason').disable();
            $$('dh-edit-verify').disable();
            $$('dh-edit-choose').disable();
            $$('edit-entry-ok').disable().hide();
            $$('edit-entry-cancel').setValue('Close');
        } else {
            $$('dh-edit-timeBegin').enable();
            $$('dh-edit-timeEnd').enable();
            $$('dh-edit-hours').enable();
            $$('dh-edit-quickList').enable();
            $$('dh-edit-projectId').enable();
            $$('dh-edit-projectName').enable();
            $$('dh-edit-summary').enable();
            $$('dh-edit-company').enable();
            $$('dh-edit-billable').enable();
            $$('dh-edit-description').enable();
            $$('dh-edit-descriptions').enable();
            $$('dh-edit-reason').enable();
            $$('dh-edit-verify').enable();
            $$('dh-edit-choose').enable();
            $$('edit-entry-ok').enable().show();
            $$('edit-entry-cancel').setValue('Cancel');
        }

        const params = {
            personId: personId
        }

        $$('dh-edit-quickList').add('', "(select)");
        AWS.callSoap(WS, 'getQuickList', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].nameFormatted = data.item[i].projectName + " - " + data.item[i].companyAndDescription;
                }
               
                $$('dh-edit-quickList').addItems(data.item, "projectId", "nameFormatted");
            }  
        });

        const timesheetId = {
            timesheetId: timesheetEntriesGrid.getSelectedRow().timesheetId
        }

        AWS.callSoap(WS, 'loadTimeEntry', timesheetId).then(data => {
            if (data.wsStatus === "0") {
                $$('dh-edit-timeBegin').setValue(Math.floor(data.beginningTime / 100000));
                $$('dh-edit-timeEnd').setValue(Math.floor(data.endTime / 100000));
                $$('dh-edit-hours').setValue(data.totalHours);
                $$('dh-edit-projectId').setValue(data.projectId);
                $$('dh-edit-projectName').setValue(data.projectName);
                $$('dh-edit-summary').setValue(data.projectDescription);
                $$('dh-edit-company').setValue(data.companyName);
                $$('dh-edit-billable').setValue(data.billable);
                $$('dh-edit-description').setValue(data.timeDescription);
            }  
        });

        $$('dh-edit-quickList').onChange(() => {
            if ($$('dh-edit-quickList').getValue() !== "") {
                const quickData = $$('dh-edit-quickList').getData();
                $$('dh-edit-projectId').setValue(quickData.projectId);
                $$('dh-edit-projectName').setValue(quickData.projectName);
                $$('dh-edit-summary').setValue(quickData.description);
                $$('dh-edit-company').setValue(quickData.companyName);
                $$('dh-edit-billable').setValue(quickData.billable);
            }
        });

        const calcElapsed = () => {
            if ($$('dh-edit-timeBegin').getValue() !== null && $$('dh-edit-timeEnd').getValue() !== null) {
                $$('dh-edit-hours').setValue(
                    TimeUtils.hours(TimeUtils.minutesToTime(TimeUtils.diff($$('dh-edit-timeEnd').getValue(), $$('dh-edit-timeBegin').getValue()))) + ":" +
                    TimeUtils.minutes(TimeUtils.minutesToTime(TimeUtils.diff($$('dh-edit-timeEnd').getValue(), $$('dh-edit-timeBegin').getValue())))
                );
            }
        }

        $$('dh-edit-timeBegin').onChange(calcElapsed);

        $$('dh-edit-timeEnd').onChange(calcElapsed);

        $$('dh-edit-verify').onclick(() => {
            if ($$('dh-edit-projectName').getValue() === '') {
                Utils.showMessage('Error', 'Please enter the Project ID to verify.');
                return;
            }
            const params = {
                category: '',
                companyId: '',
                projectName: $$('dh-edit-projectName').getValue(),
                projectNameSearchType: 5,
                quickList: false,
                status: '',
                summary: '',
                summarySearchType: 0,
                type: ''
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    if (data.item) {
                        $$('dh-edit-projectId').setValue(data.item.projectId);
                        $$('dh-edit-projectName').setValue(data.item.projectName);
                        $$('dh-edit-summary').setValue(data.item.description);
                        $$('dh-edit-company').setValue(data.item.requestingCompanyName);
                        $$('dh-edit-billable').setValue(data.item.billable);
                    } else {
                        Utils.showMessage('Error', 'No matching Project IDs were found.')
                    }
                }
            });        
        });

        $$('dh-edit-choose').onclick(() => {
            let formSearchGrid;        
            Utils.popup_open('dh-search-project');
    
            const searchProjectCode = (searchType) => {
                let formSearchGrid;
                switch (searchType) {
                    case 'category':
                        $$('dh-project-data-search-type').setValue('Category');
                        $$('dh-proj-chooseSpecificLabelAll').setValue('Project Categories');
                        $$('dh-proj-chooseSpecificLabelSearch').setValue('Project Category');
                        break;
        
                    case 'type':
                        $$('dh-project-data-search-type').setValue('Type');
                        $$('dh-proj-chooseSpecificLabelAll').setValue('Project Types');
                        $$('dh-proj-chooseSpecificLabelSearch').setValue('Project Type');
                        break;
        
                    case 'status':
                        $$('dh-project-data-search-type').setValue('Status');
                        $$('dh-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                        $$('dh-proj-chooseSpecificLabelSearch').setValue('Project Status');
                        break;
                
                    default:
                        break;
                }
                
                Utils.popup_open('dh-project-data-search');
                    
                const reset = () => {
                    $$('dh-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('dh-proj-code-search').clear();
        
                    $$('dh-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('dh-proj-descr-search').clear();
        
                    $$('dh-projD-reset').enable();
                    $$('dh-projD-search').enable();
        
                    $$('dh-projD-ok').disable();
        
                    formSearchGrid.clear();
                    $$('dh-projD-count').setValue(`Displaying 0 item`);
                };
        
                const ok = () => {    
                    const row = formSearchGrid.getSelectedRow();
                    if (row) {
                        switch (searchType) {
                            case 'category':
                                $$('dh-proj-category').setValue(row.projectCategoryId, row.code);
                                break;
                
                            case 'type':
                                $$('dh-proj-type').setValue(row.projectTypeId, row.code);
                                break;
                
                            case 'status':
                                $$('dh-proj-status').setValue(row.projectStatusId, row.code);
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
        
                bindToEnum('dh-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
                bindToEnum('dh-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
                const initDataGrid = () => {
                    let columnDefs = [
                        {headerName: 'Code', field: 'code', width: 60},
                        {headerName: 'Description', field: 'description', width: 210}
                    ];
        
                    formSearchGrid = new AGGrid('dh-projRes-grid', columnDefs);
                    formSearchGrid.show();
                };
        
                if (!formSearchGrid)
                    initDataGrid();
        
                const search = () => {
                    const params = {
                        code: $$('dh-proj-code-search').getValue(),
                        codeSearchType: $$('dh-proj-code-criteria').getValue(),
                        description: $$('dh-proj-descr-search').getValue(),
                        descriptionSearchType: $$('dh-proj-descr-criteria').getValue()
                    }
                    if (searchType === "category") {                    
                        AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('dh-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                                } else {
                                    $$('dh-projD-count').setValue(`Displaying 0 Project Categories`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('dh-projD-ok').enable);
                        
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
                                    $$('dh-projD-count').setValue(`Displaying ${records.length} Project Types`);
                                } else {
                                    $$('dh-projD-count').setValue(`Displaying 0 Project Types`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('dh-projD-ok').enable);
                        
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
                                    $$('dh-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                                } else {
                                    $$('dh-projD-count').setValue(`Displaying 0 Project Statuses`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('dh-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    }                
                };
        
                $$('dh-projD-reset').onclick(reset);
                $$('dh-projD-search').onclick(search);
                $$('dh-projD-ok').onclick(ok);
                $$('dh-projD-cancel').onclick(cancel);
        
                $$('dh-project-specific').onChange(() => {
                    if ($$('dh-project-specific').getValue() === "A") {
                        formSearchGrid.clear();
                        $$('dh-proj-code-criteria').disable();
                        $$('dh-proj-code-search').disable();
        
                        $$('dh-proj-descr-criteria').disable();
                        $$('dh-proj-descr-search').disable();
        
                        switch (searchType) {
                            case 'category':
                                $$('dh-proj-category').setValue(`Displaying 0 Project Categories`);
                                break;
                            
                            case 'status':
                                $$('dh-proj-status').setValue(`Displaying 0 Project Statuses`);
                                break;
        
                            case 'type':
                                $$('dh-proj-type').setValue(`Displaying 0 Project Types`);
                                break;
                        
                            default:
                                break;
                        }
                        $$('dh-projD-ok').enable().onclick(() => {
                            $$('dh-proj-' + searchType).setValue('');                         
                            reset();
                            Utils.popup_close();
                        });
                    } else {
                        $$('dh-proj-code-criteria').enable();
                        $$('dh-proj-code-search').enable();
        
                        $$('dh-proj-descr-criteria').enable();
                        $$('dh-proj-descr-search').enable();
        
                        $$('dh-projD-ok').enable().onclick(ok);
                    }
                });
        
                search();
            }
                
            const reset = () => {
                $$('dh-proj-projectName').clear();
                $$('dh-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('dh-proj-summary').clear();
                $$('dh-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
    
                $$('dh-proj-reset').enable();
                $$('dh-proj-search').enable();
    
                $$('dh-proj-ok').disable();
    
                formSearchGrid.clear();
                $$('dh-proj-count').setValue(`Displaying 0 item`);
    
                $$('dh-proj-category').clear();
                $$('dh-proj-companyId').clear();
                $$('dh-proj-status').clear();
                $$('dh-proj-type').clear();
    
                const companyParams = {
                    companyId: '',
                    name: '',
                    nameSearchType: 2
                }
                AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('dh-proj-companyId');
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
                        const ctl = $$('dh-proj-category');
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
                        const ctl = $$('dh-proj-type');
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
                        const ctl = $$('dh-proj-status');
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
                    $$('dh-edit-projectId').setValue(row.projectId);
                    $$('dh-edit-projectName').setValue(row.projectName);
                    $$('dh-edit-summary').setValue(row.description);
                    $$('dh-edit-company').setValue(row.requestingCompanyName);
                    $$('dh-edit-billable').setValue(row.billable);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('dh-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('dh-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                        {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                        {headerName: 'Summary', field: 'description', cellRenderer: 'projectInfo', width: 100},
                        {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                        {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                        {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                        {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                    ];
                    
                formSearchGrid = new AGGrid('dh-proj-grid', columnDefs);
                formSearchGrid.addComponent('projectInfo', ProjectInfo);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            reset();
            const search = () => {
                const params = {
                    category: $$('dh-proj-category').getValue(),
                    companyId: $$('dh-proj-companyId').getValue(),
                    projectName: $$('dh-proj-projectName').getValue(),
                    projectNameSearchType: $$('dh-proj-projectNameSearchType').getValue(),
                    status: $$('dh-proj-status').getValue(),
                    summary: $$('dh-proj-summary').getValue(),
                    summarySearchType: $$('dh-proj-summarySearchType').getValue(),
                    type: $$('dh-proj-type').getValue()
                }
                AWS.callSoap(WS, 'searchProjects', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('dh-proj-count').setValue(`Displaying ${records.length} Projects`);
                        } else {
                            $$('dh-proj-count').setValue(`Displaying 0 Projects`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('dh-proj-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('dh-proj-reset').onclick(reset);
            $$('dh-proj-search').onclick(search);
            $$('dh-proj-ok').onclick(ok);
            $$('dh-proj-cancel').onclick(cancel);
    
            $$('dh-proj-chooseProject').onChange(() => {
                if ($$('dh-proj-chooseProject').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('dh-proj-category').disable();
                    $$('dh-proj-companyId').disable();
                    $$('dh-proj-projectName').disable();
                    $$('dh-proj-projectNameSearchType').disable();
                    $$('dh-proj-status').disable();
                    $$('dh-proj-summary').disable();
                    $$('dh-proj-summarySearchType').disable();
                    $$('dh-proj-type').disable();
    
                    $$('dh-proj-count').setValue(`Displaying 0 Projects`);
    
                    $$('dh-proj-ok').enable().onclick(() => {
                        $$('dh-edit-projectId').clear();
                        $$('dh-edit-projectName').clear();
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('dh-proj-category').enable();
                    $$('dh-proj-companyId').enable();
                    $$('dh-proj-projectName').enable();
                    $$('dh-proj-projectNameSearchType').enable();
                    $$('dh-proj-status').enable();
                    $$('dh-proj-summary').enable();
                    $$('dh-proj-summarySearchType').enable();
                    $$('dh-proj-type').enable();
    
                    $$('dh-proj-ok').enable().onclick(ok);
                }
            });
    
            search();
        });
        
        Utils.popup_open('edit-entry-popup');

        $$('edit-entry-ok').onclick(() => {
            const params = {
                beginningTime: $$('dh-edit-timeBegin').getValue(),
                billable: $$('dh-edit-billable').getValue(),
                description: $$('dh-edit-description').getValue(),
                endTime: $$('dh-edit-timeEnd').getValue(),
                projectId: $$('dh-edit-projectId').getValue(),
                timesheetId: timesheetEntriesGrid.getSelectedRow().timesheetId,
                totalHours: Number($$('dh-edit-hours').getValue())
            }
            AWS.callSoap(WS, 'saveTimeEntry', params).then(data => {
                if (data.wsStatus === "0") {
                    getListTimesheetsForPersonOnDate();
                    getListAssignedProjects();
                    Utils.popup_close();
                }  
            });
        });
        
        $$('edit-entry-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('add').onclick(() => {
        $$('dh-edit-timeBegin').clear();
        $$('dh-edit-timeEnd').clear();
        $$('dh-edit-hours').clear();
        $$('dh-edit-quickList').clear();
        $$('dh-edit-projectId').clear();
        $$('dh-edit-projectName').clear();
        $$('dh-edit-summary').clear();
        $$('dh-edit-company').clear();
        $$('dh-edit-billable').clear();
        $$('dh-edit-description').clear();
        $$('dh-edit-descriptions').clear();
        $$('dh-edit-reason').clear();

        const params = {
            personId: personId
        }

        $$('dh-edit-quickList').add('', "(select)");
        AWS.callSoap(WS, 'getQuickList', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].nameFormatted = data.item[i].projectName + " - " + data.item[i].companyAndDescription;
                }
               
                $$('dh-edit-quickList').addItems(data.item, "projectId", "nameFormatted");
            }  
        });

        $$('dh-edit-quickList').onChange(() => {
            if ($$('dh-edit-quickList').getValue() !== "") {
                const quickData = $$('dh-edit-quickList').getData();
                $$('dh-edit-projectId').setValue(quickData.projectId);
                $$('dh-edit-projectName').setValue(quickData.projectName);
                $$('dh-edit-summary').setValue(quickData.description);
                $$('dh-edit-company').setValue(quickData.companyName);
                $$('dh-edit-billable').setValue(quickData.billable);
            }
        });

        const calcElapsed = () => {
            if ($$('dh-edit-timeBegin').getValue() !== null && $$('dh-edit-timeEnd').getValue() !== null) {
                $$('dh-edit-hours').setValue(
                    TimeUtils.hours(TimeUtils.minutesToTime(TimeUtils.diff($$('dh-edit-timeEnd').getValue(), $$('dh-edit-timeBegin').getValue()))) + ":" +
                    TimeUtils.minutes(TimeUtils.minutesToTime(TimeUtils.diff($$('dh-edit-timeEnd').getValue(), $$('dh-edit-timeBegin').getValue())))
                );
            }
        }

        $$('dh-edit-timeBegin').onChange(calcElapsed);

        $$('dh-edit-timeEnd').onChange(calcElapsed);

        $$('dh-edit-verify').onclick(() => {
            $$('dh-edit-projectId').clear();
            $$('dh-edit-summary').clear();
            $$('dh-edit-company').clear();
            $$('dh-edit-billable').clear();

            if ($$('dh-edit-projectName').getValue() === '') {
                Utils.showMessage('Error', 'Please enter the Project ID to verify.');
                return;
            }
            const params = {
                category: '',
                companyId: '',
                projectName: $$('dh-edit-projectName').getValue(),
                projectNameSearchType: 5,
                quickList: false,
                status: '',
                summary: '',
                summarySearchType: 0,
                type: ''
            }
            AWS.callSoap(WS, 'searchProjects', params).then(data => {
                if (data.wsStatus === '0') {
                    if (data.item) {
                        $$('dh-edit-projectId').clear().setValue(data.item.projectId);
                        $$('dh-edit-summary').clear().setValue(data.item.description);
                        $$('dh-edit-company').clear().setValue(data.item.requestingCompanyName);
                        $$('dh-edit-billable').clear().setValue(data.item.billable);
                    } else {
                        Utils.showMessage('Error', 'No matching Project IDs were found.')
                    }
                }
            });        
        });

        $$('dh-edit-choose').onclick(() => {
            let formSearchGrid;        
            Utils.popup_open('dh-search-project');
    
            const searchProjectCode = (searchType) => {
                let formSearchGrid;
                switch (searchType) {
                    case 'category':
                        $$('dh-project-data-search-type').setValue('Category');
                        $$('dh-proj-chooseSpecificLabelAll').setValue('Project Categories');
                        $$('dh-proj-chooseSpecificLabelSearch').setValue('Project Category');
                        break;
        
                    case 'type':
                        $$('dh-project-data-search-type').setValue('Type');
                        $$('dh-proj-chooseSpecificLabelAll').setValue('Project Types');
                        $$('dh-proj-chooseSpecificLabelSearch').setValue('Project Type');
                        break;
        
                    case 'status':
                        $$('dh-project-data-search-type').setValue('Status');
                        $$('dh-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                        $$('dh-proj-chooseSpecificLabelSearch').setValue('Project Status');
                        break;
                
                    default:
                        break;
                }
                
                Utils.popup_open('dh-project-data-search');
                    
                const reset = () => {
                    $$('dh-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('dh-proj-code-search').clear();
        
                    $$('dh-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('dh-proj-descr-search').clear();
        
                    $$('dh-projD-reset').enable();
                    $$('dh-projD-search').enable();
        
                    $$('dh-projD-ok').disable();
        
                    formSearchGrid.clear();
                    $$('dh-projD-count').setValue(`Displaying 0 item`);
                };
        
                const ok = () => {    
                    const row = formSearchGrid.getSelectedRow();
                    if (row) {
                        switch (searchType) {
                            case 'category':
                                $$('dh-proj-category').setValue(row.projectCategoryId, row.code);
                                break;
                
                            case 'type':
                                $$('dh-proj-type').setValue(row.projectTypeId, row.code);
                                break;
                
                            case 'status':
                                $$('dh-proj-status').setValue(row.projectStatusId, row.code);
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
        
                bindToEnum('dh-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
                bindToEnum('dh-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
                const initDataGrid = () => {
                    let columnDefs = [
                        {headerName: 'Code', field: 'code', width: 60},
                        {headerName: 'Description', field: 'description', width: 210}
                    ];
        
                    formSearchGrid = new AGGrid('dh-projRes-grid', columnDefs);
                    formSearchGrid.show();
                };
        
                if (!formSearchGrid)
                    initDataGrid();
        
                const search = () => {
                    const params = {
                        code: $$('dh-proj-code-search').getValue(),
                        codeSearchType: $$('dh-proj-code-criteria').getValue(),
                        description: $$('dh-proj-descr-search').getValue(),
                        descriptionSearchType: $$('dh-proj-descr-criteria').getValue()
                    }
                    if (searchType === "category") {                    
                        AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('dh-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                                } else {
                                    $$('dh-projD-count').setValue(`Displaying 0 Project Categories`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('dh-projD-ok').enable);
                        
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
                                    $$('dh-projD-count').setValue(`Displaying ${records.length} Project Types`);
                                } else {
                                    $$('dh-projD-count').setValue(`Displaying 0 Project Types`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('dh-projD-ok').enable);
                        
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
                                    $$('dh-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                                } else {
                                    $$('dh-projD-count').setValue(`Displaying 0 Project Statuses`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('dh-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    }                
                };
        
                $$('dh-projD-reset').onclick(reset);
                $$('dh-projD-search').onclick(search);
                $$('dh-projD-ok').onclick(ok);
                $$('dh-projD-cancel').onclick(cancel);
        
                $$('dh-project-specific').onChange(() => {
                    if ($$('dh-project-specific').getValue() === "A") {
                        formSearchGrid.clear();
                        $$('dh-proj-code-criteria').disable();
                        $$('dh-proj-code-search').disable();
        
                        $$('dh-proj-descr-criteria').disable();
                        $$('dh-proj-descr-search').disable();
        
                        switch (searchType) {
                            case 'category':
                                $$('dh-proj-category').setValue(`Displaying 0 Project Categories`);
                                break;
                            
                            case 'status':
                                $$('dh-proj-status').setValue(`Displaying 0 Project Statuses`);
                                break;
        
                            case 'type':
                                $$('dh-proj-type').setValue(`Displaying 0 Project Types`);
                                break;
                        
                            default:
                                break;
                        }
                        $$('dh-projD-ok').enable().onclick(() => {
                            $$('dh-proj-' + searchType).setValue('');                         
                            reset();
                            Utils.popup_close();
                        });
                    } else {
                        $$('dh-proj-code-criteria').enable();
                        $$('dh-proj-code-search').enable();
        
                        $$('dh-proj-descr-criteria').enable();
                        $$('dh-proj-descr-search').enable();
        
                        $$('dh-projD-ok').enable().onclick(ok);
                    }
                });
        
                search();
            }
                
            const reset = () => {
                $$('dh-proj-projectName').clear();
                $$('dh-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('dh-proj-summary').clear();
                $$('dh-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
    
                $$('dh-proj-reset').enable();
                $$('dh-proj-search').enable();
    
                $$('dh-proj-ok').disable();
    
                formSearchGrid.clear();
                $$('dh-proj-count').setValue(`Displaying 0 item`);
    
                $$('dh-proj-category').clear();
                $$('dh-proj-companyId').clear();
                $$('dh-proj-status').clear();
                $$('dh-proj-type').clear();
    
                const companyParams = {
                    companyId: '',
                    name: '',
                    nameSearchType: 2
                }
                AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('dh-proj-companyId');
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
                        const ctl = $$('dh-proj-category');
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
                        const ctl = $$('dh-proj-type');
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
                        const ctl = $$('dh-proj-status');
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
                    $$('dh-edit-projectId').setValue(row.projectId);
                    $$('dh-edit-projectName').setValue(row.projectName);
                    $$('dh-edit-summary').setValue(row.description);
                    $$('dh-edit-company').setValue(row.requestingCompanyName);
                    $$('dh-edit-billable').setValue(row.billable);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('dh-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('dh-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                        {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                        {headerName: 'Summary', field: 'description', cellRenderer: 'projectInfo', width: 100},
                        {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                        {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                        {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                        {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                    ];
                    
                formSearchGrid = new AGGrid('dh-proj-grid', columnDefs);
                formSearchGrid.addComponent('projectInfo', ProjectInfo);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            reset();
            const search = () => {
                const params = {
                    category: $$('dh-proj-category').getValue(),
                    companyId: $$('dh-proj-companyId').getValue(),
                    projectName: $$('dh-proj-projectName').getValue(),
                    projectNameSearchType: $$('dh-proj-projectNameSearchType').getValue(),
                    status: $$('dh-proj-status').getValue(),
                    summary: $$('dh-proj-summary').getValue(),
                    summarySearchType: $$('dh-proj-summarySearchType').getValue(),
                    type: $$('dh-proj-type').getValue()
                }
                AWS.callSoap(WS, 'searchProjects', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('dh-proj-count').setValue(`Displaying ${records.length} Projects`);
                        } else {
                            $$('dh-proj-count').setValue(`Displaying 0 Projects`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('dh-proj-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('dh-proj-reset').onclick(reset);
            $$('dh-proj-search').onclick(search);
            $$('dh-proj-ok').onclick(ok);
            $$('dh-proj-cancel').onclick(cancel);
    
            $$('dh-proj-chooseProject').onChange(() => {
                if ($$('dh-proj-chooseProject').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('dh-proj-category').disable();
                    $$('dh-proj-companyId').disable();
                    $$('dh-proj-projectName').disable();
                    $$('dh-proj-projectNameSearchType').disable();
                    $$('dh-proj-status').disable();
                    $$('dh-proj-summary').disable();
                    $$('dh-proj-summarySearchType').disable();
                    $$('dh-proj-type').disable();
    
                    $$('dh-proj-count').setValue(`Displaying 0 Projects`);
    
                    $$('dh-proj-ok').enable().onclick(() => {
                        $$('dh-edit-projectId').clear();
                        $$('dh-edit-projectName').clear();
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('dh-proj-category').enable();
                    $$('dh-proj-companyId').enable();
                    $$('dh-proj-projectName').enable();
                    $$('dh-proj-projectNameSearchType').enable();
                    $$('dh-proj-status').enable();
                    $$('dh-proj-summary').enable();
                    $$('dh-proj-summarySearchType').enable();
                    $$('dh-proj-type').enable();
    
                    $$('dh-proj-ok').enable().onclick(ok);
                }
            });
    
            search();
        });
        
        Utils.popup_open('edit-entry-popup');

        $$('edit-entry-ok').onclick(() => {
            if ($$('dh-edit-hours').isError('Hours'))
                return;
            if ($$('dh-edit-projectName').isError('Project ID'))
                return;
            const params = {
                beginningTime: $$('dh-edit-timeBegin').getValue(),
                billable: $$('dh-edit-billable').getValue(),
                description: $$('dh-edit-description').getValue(),
                endTime: $$('dh-edit-timeEnd').getValue(),
                projectId: $$('dh-edit-projectId').getValue(),
                timesheetId: timesheetEntriesGrid.getSelectedRow().timesheetId,
                totalHours: Number($$('dh-edit-hours').getValue())
            }
            AWS.callSoap(WS, 'addTimeEntry', params).then(data => {
                if (data.wsStatus === "0") {
                    getListTimesheetsForPersonOnDate();
                    getListAssignedProjects();
                    Utils.popup_close();
                }  
            });
        });
        
        $$('edit-entry-cancel').onclick(() => {
            Utils.popup_close();
        });
    });
    $$('edit').onclick(edit);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Timesheet Entry?', () => {
            const params = {
                timesheetIds: timesheetEntriesGrid.getSelectedRow().timesheetId
            };
            AWS.callSoap(WS, 'deleteTimesheet', params).then(function (res) {
                if (res.wsStatus === "0") {
                    getListTimesheetsForPersonOnDate();
                }
            });
        });
    });
})();
