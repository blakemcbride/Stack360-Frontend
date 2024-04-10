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
    const WS = 'StandardTimeTimesheetApproval';


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

    function TimesheetCheckbox() {}

    TimesheetCheckbox.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        this.eGui.innerHTML = '<input type="checkbox" id="ta-timesheet-' +  params.data.employeeId + '" style="vertical-align: middle;">';
    };

    TimesheetCheckbox.prototype.getGui = function() {
        return this.eGui;
    };

    $$('ta-fromDate').onChange(() => {
        $$('ta-fromDate1').setValue($$('ta-fromDate').getIntValue());
    });

    $$('ta-toDate').onChange(() => {
        $$('ta-toDate1').setValue($$('ta-toDate').getIntValue());
    });

    let employeesGrid;
 
    const employeesColumnDefs = [
        {headerName: "", field: "s", cellRenderer: "timesheetCheckbox", width: 20},
        {headerName: "Name", field: "employeeName", width: 120},
        {headerName: "Hours", field: "totalHours", type: "numericColumn", width: 80}
    ];
    employeesGrid = new AGGrid('employeesGrid', employeesColumnDefs);
    employeesGrid.addComponent('timesheetCheckbox', TimesheetCheckbox);
    employeesGrid.multiSelect();
    employeesGrid.show();
    employeesGrid.setOnSelectionChanged((rows) => {
        if ($$('ta-showDetail').getValue())
            getListTimesheetsForReview();
    });

    function searchTimesheetsByDate() {
        employeesGrid.clear();
        $$('ta-totalHours').clear();
        const params = {
            fromDate: $$('ta-fromDate1').getIntValue(),
            toDate: $$('ta-toDate1').getIntValue(),
            subordinates: $$('ta-subordinates').getValue()
        };
        AWS.callSoap(WS, 'searchTimesheetsByDate', params).then(data => {
            if (data.wsStatus === '0') {     
                data.employees = Utils.assureArray(data.employees);
                for (let i = 0; i < data.employees.length; i++) {
                    data.employees[i].totalHours = Number(data.employees[i].totalHours).toFixed(2);
                }
                employeesGrid.addRecords(data.employees);
            }
        });   
    }

    let entriesGrid;

    const entriesColumnDefs = [
        {headerName: "S", field: "state", width: 20},
        {headerName: "Date", field: "workDateFormatted", type: "numericColumn", width: 60},
        {headerName: "Day", field: "dayOfWeek", width: 40},
        {headerName: "Begin", field: "beginTimeFormatted", type: "numericColumn", width: 50},
        {headerName: "End", field: "endTimeFormatted", type: "numericColumn", width: 50},
        {headerName: "Hours", field: "totalHours", type: "numericColumn", width: 40},
        {headerName: "B", field: "billable", width: 20},
        {headerName: "Company", field: "companyName", width: 120},
        {headerName: "Project ID", field: "projectName", type: "numericColumn", cellRenderer: 'projectInfo', width: 50},
        {headerName: "Project Name", field: "projectDescription", width: 100},
        {headerName: "Description", field: "timeDescription", cellRenderer: 'timesheetDescription', width: 100}
    ];
    entriesGrid = new AGGrid('entriesGrid', entriesColumnDefs);
    entriesGrid.addComponent('projectInfo', ProjectInfo);
    entriesGrid.addComponent('timesheetDescription', TimesheetDescription);
    entriesGrid.multiSelect();
    entriesGrid.show();
    entriesGrid.setOnSelectionChanged((rows) => {
        if (rows.length) {
            $$('ta-reject').enable();
            $$('ta-approve').enable();
        } else {
            $$('ta-reject').disable();
            $$('ta-approve').disable();
        }
        if (rows.length === 1)
            $$('ta-edit').enable();
        else
            $$('ta-edit').disable();
    });

    function getListTimesheetsForReview() {
        entriesGrid.clear();
        const row = employeesGrid.getSelectedRow();
        $$('ta-reject').disable();
        $$('ta-approve').disable();
        $$('ta-edit').disable();

        if (!row)
            return;

        if ($$('ta-fromDate').isError('From Date')) 
            return;
        
        if ($$('ta-toDate').isError('To Date')) 
            return;

        const params = {
            billableFlag: $$('ta-billableFlag').getValue(),
            employeeId: row.employeeId,
            finalizedFlag: $$('ta-finalizedFlag').getValue(),
            nonBillableFlag: $$('ta-nonBillableFlag').getValue(),
            nonFinalizedFlag: $$('ta-nonFinalizedFlag').getValue(),
            fromDate: $$('ta-fromDate').getIntValue(),
            toDate: $$('ta-toDate').getIntValue()
        };
        AWS.callSoap(WS, 'listTimesheetsForReview', params).then(data => {
            if (data.wsStatus === '0') {
                entriesGrid.clear();
                data.timesheetTransmit = Utils.assureArray(data.timesheetTransmit);
                for (let i=0 ; i < data.timesheetTransmit.length ; i++) {
                    let r = data.timesheetTransmit[i];
                    r.totalHours = Utils.format(Number(r.totalHours), "C", 0, 2);
                }
                entriesGrid.addRecords(data.timesheetTransmit);
                $$('ta-totalHours').setValue(data.total);
                $$('ta-upToDate').enable().setValue(data.employeeFinalizedDate);
                $$('ta-dates').enable();

                entriesGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    $$('ta-search').onclick(searchTimesheetsByDate);

    $$('ta-dates').onclick(() => {
        let rejectedDatesGrid;

        const rejectedDatesColumnDefs = [
            {headerName: "Currently Rejected Dates", field: "dateFormatted", type: "numericColumn", width: 180}
        ];
        rejectedDatesGrid = new AGGrid('rejectedDatesGrid', rejectedDatesColumnDefs);
        rejectedDatesGrid.show();

        Utils.popup_open('rejected-dates-popup');

        function getRejectedDays() {
            const params = {
                personId: employeesGrid.getSelectedRow().employeeId
            };
            AWS.callSoap(WS, 'getRejectedDays', params).then(data => {
                if (data.wsStatus === '0') {     
                    if (rejectedDatesGrid !== undefined) {
                        rejectedDatesGrid.clear();            
                    } 
                    data.item = Utils.assureArray(data.item);
                    rejectedDatesGrid.addRecords(data.item);
                }
            });  
        }

        getRejectedDays();
        
        $$('rejected-dates-add').onclick(() => {
            $$('ta-rejectedDate').clear();
            $$('ta-rejectedMessage').clear();

            Utils.popup_open('add-rejected-dates-popup');

            $$('rejected-dates-ok').onclick(() => {
                if ($$('ta-rejectedDate').isError('Rejected Date')) 
                    return;
                
                if ($$('ta-rejectedMessage').isError('Rejected Message')) 
                    return;

                const params = {
                    personId: employeesGrid.getSelectedRow().employeeId,
                    message: $$('ta-rejectedMessage').getValue(),
                    date: $$('ta-rejectedDate').getIntValue()
                };
                AWS.callSoap(WS, 'rejectDay', params).then(data => {
                    if (data.wsStatus === '0') {     
                        getRejectedDays();
                        Utils.popup_close();
                    }
                });  
            });

            $$('rejected-dates-cancel').onclick(() => {
                Utils.popup_close();
            });            
        });

        $$('rejected-dates-close').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('ta-selectAll').onclick(() => {
        $$('ta-selectAll').setValue('DeselectAll');
        const rows = employeesGrid.getAllRows();
        for (let i = 0; i < rows.length; i++) {
            $('#ta-timesheet-' + rows[i].employeeId).prop('checked', true);
        }
    });


    $$('ta-approveSelected').onclick(() => {
        const rows = employeesGrid.getAllRows();
        let employeeIds = [];
        for (let i = 0; i < rows.length; i++) {
            if ($('#ta-timesheet-' + rows[i].employeeId).is(':checked')) {
                employeeIds.push(rows[i].employeeId);
            }
        }

        if (employeeIds.length) {
            if ($$('ta-fromDate').isError('From Date')) 
                return;
            
            if ($$('ta-toDate').isError('To Date')) 
                return;

            const params = {
                employeeIds: employeeIds,
                fromDate: $$('ta-fromDate').getIntValue(),
                toDate: $$('ta-toDate').getIntValue()
            };
            AWS.callSoap(WS, 'approveAllTimesheets', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchTimesheetsByDate();
                }
            });   
        }
    });

    $$('ta-columnLegend').onclick(() => {
        Utils.popup_open('legend-popup');

        $$('legend-close').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        $$('ta-edit-timeBegin').clear();
        $$('ta-edit-timeEnd').clear();
        $$('ta-edit-hours').clear();
        $$('ta-edit-quickList').clear();
        $$('ta-edit-projectId').clear();
        $$('ta-edit-projectName').clear();
        $$('ta-edit-summary').clear();
        $$('ta-edit-company').clear();
        $$('ta-edit-billable').clear();
        $$('ta-edit-description').clear();
        $$('ta-edit-descriptions').clear();
        $$('ta-edit-reason').clear();

        const personId = {
            personId: employeesGrid.getSelectedRow().employeeId
        }

        $$('ta-edit-quickList').add('', "(select)");
        AWS.callSoap(WS, 'getQuickList', personId).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].nameFormatted = data.item[i].projectName + " - " + data.item[i].companyAndDescription;
                }
               
                $$('ta-edit-quickList').addItems(data.item, "projectId", "nameFormatted");
            }  
        });

        const timesheetId = {
            timesheetId: entriesGrid.getSelectedRow().timesheetId
        }

        AWS.callSoap(WS, 'loadTimeEntry', timesheetId).then(data => {
            if (data.wsStatus === "0") {
                $$('ta-edit-timeBegin').setValue(Math.floor(data.beginningTime / 100000));
                $$('ta-edit-timeEnd').setValue(Math.floor(data.endTime / 100000));
                $$('ta-edit-hours').setValue(data.totalHours);
                $$('ta-edit-projectId').setValue(data.projectId);
                $$('ta-edit-projectName').setValue(data.projectName);
                $$('ta-edit-summary').setValue(data.projectDescription);
                $$('ta-edit-company').setValue(data.companyName);
                $$('ta-edit-billable').setValue(data.billable);
                $$('ta-edit-description').setValue(data.timeDescription);
            }  
        });

        $$('ta-edit-quickList').onChange(() => {
            if ($$('ta-edit-quickList').getValue() !== "") {
                const quickData = $$('ta-edit-quickList').getData();
                $$('ta-edit-projectId').setValue(quickData.projectId);
                $$('ta-edit-projectName').setValue(quickData.projectName);
                $$('ta-edit-summary').setValue(quickData.description);
                $$('ta-edit-company').setValue(quickData.companyName);
                $$('ta-edit-billable').setValue(quickData.billable);
            }
        });

        const calcElapsed = () => {
            if ($$('ta-edit-timeBegin').getValue() !== null && $$('ta-edit-timeEnd').getValue() !== null) {
                $$('ta-edit-hours').setValue(
                    TimeUtils.hours(TimeUtils.minutesToTime(TimeUtils.diff($$('ta-edit-timeEnd').getValue(), $$('ta-edit-timeBegin').getValue()))) + ":" +
                    TimeUtils.minutes(TimeUtils.minutesToTime(TimeUtils.diff($$('ta-edit-timeEnd').getValue(), $$('ta-edit-timeBegin').getValue())))
                );
            }
        }

        $$('ta-edit-timeBegin').onChange(calcElapsed);

        $$('ta-edit-timeEnd').onChange(calcElapsed);

        $$('ta-edit-choose').onclick(() => {
            let formSearchGrid;        
            Utils.popup_open('ta-search-project');
    
            const searchProjectCode = (searchType) => {
                let formSearchGrid;
                switch (searchType) {
                    case 'category':
                        $$('ta-project-data-search-type').setValue('Category');
                        $$('ta-proj-chooseSpecificLabelAll').setValue('Project Categories');
                        $$('ta-proj-chooseSpecificLabelSearch').setValue('Project Category');
                        break;
        
                    case 'type':
                        $$('ta-project-data-search-type').setValue('Type');
                        $$('ta-proj-chooseSpecificLabelAll').setValue('Project Types');
                        $$('ta-proj-chooseSpecificLabelSearch').setValue('Project Type');
                        break;
        
                    case 'status':
                        $$('ta-project-data-search-type').setValue('Status');
                        $$('ta-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                        $$('ta-proj-chooseSpecificLabelSearch').setValue('Project Status');
                        break;
                
                    default:
                        break;
                }
                
                Utils.popup_open('ta-project-data-search');
                    
                const reset = () => {
                    $$('ta-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('ta-proj-code-search').clear();
        
                    $$('ta-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('ta-proj-descr-search').clear();
        
                    $$('ta-projD-reset').enable();
                    $$('ta-projD-search').enable();
        
                    $$('ta-projD-ok').disable();
        
                    formSearchGrid.clear();
                    $$('ta-projD-count').setValue(`Displaying 0 item`);
                };
        
                const ok = () => {    
                    const row = formSearchGrid.getSelectedRow();
                    if (row) {
                        switch (searchType) {
                            case 'category':
                                $$('ta-proj-category').setValue(row.projectCategoryId, row.code);
                                break;
                
                            case 'type':
                                $$('ta-proj-type').setValue(row.projectTypeId, row.code);
                                break;
                
                            case 'status':
                                $$('ta-proj-status').setValue(row.projectStatusId, row.code);
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
        
                bindToEnum('ta-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
                bindToEnum('ta-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
                const initDataGrid = () => {
                    let columnDefs = [
                        {headerName: 'Code', field: 'code', width: 60},
                        {headerName: 'Description', field: 'description', width: 210}
                    ];
        
                    formSearchGrid = new AGGrid('ta-projRes-grid', columnDefs);
                    formSearchGrid.show();
                };
        
                if (!formSearchGrid)
                    initDataGrid();
        
                const search = () => {
                    const params = {
                        code: $$('ta-proj-code-search').getValue(),
                        codeSearchType: $$('ta-proj-code-criteria').getValue(),
                        description: $$('ta-proj-descr-search').getValue(),
                        descriptionSearchType: $$('ta-proj-descr-criteria').getValue()
                    }
                    if (searchType === "category") {                    
                        AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('ta-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                                } else {
                                    $$('ta-projD-count').setValue(`Displaying 0 Project Categories`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('ta-projD-ok').enable);
                        
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
                                    $$('ta-projD-count').setValue(`Displaying ${records.length} Project Types`);
                                } else {
                                    $$('ta-projD-count').setValue(`Displaying 0 Project Types`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('ta-projD-ok').enable);
                        
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
                                    $$('ta-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                                } else {
                                    $$('ta-projD-count').setValue(`Displaying 0 Project Statuses`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('ta-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    }                
                };
        
                $$('ta-projD-reset').onclick(reset);
                $$('ta-projD-search').onclick(search);
                $$('ta-projD-ok').onclick(ok);
                $$('ta-projD-cancel').onclick(cancel);
        
                $$('ta-project-specific').onChange(() => {
                    if ($$('ta-project-specific').getValue() === "A") {
                        formSearchGrid.clear();
                        $$('ta-proj-code-criteria').disable();
                        $$('ta-proj-code-search').disable();
        
                        $$('ta-proj-descr-criteria').disable();
                        $$('ta-proj-descr-search').disable();
        
                        switch (searchType) {
                            case 'category':
                                $$('ta-proj-category').setValue(`Displaying 0 Project Categories`);
                                break;
                            
                            case 'status':
                                $$('ta-proj-status').setValue(`Displaying 0 Project Statuses`);
                                break;
        
                            case 'type':
                                $$('ta-proj-type').setValue(`Displaying 0 Project Types`);
                                break;
                        
                            default:
                                break;
                        }
                        $$('ta-projD-ok').enable().onclick(() => {
                            $$('ta-proj-' + searchType).setValue('');                         
                            reset();
                            Utils.popup_close();
                        });
                    } else {
                        $$('ta-proj-code-criteria').enable();
                        $$('ta-proj-code-search').enable();
        
                        $$('ta-proj-descr-criteria').enable();
                        $$('ta-proj-descr-search').enable();
        
                        $$('ta-projD-ok').enable().onclick(ok);
                    }
                });
        
                search();
            }
                
            const reset = () => {
                $$('ta-proj-projectName').clear();
                $$('ta-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ta-proj-summary').clear();
                $$('ta-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
    
                $$('ta-proj-reset').enable();
                $$('ta-proj-search').enable();
    
                $$('ta-proj-ok').disable();
    
                formSearchGrid.clear();
                $$('ta-proj-count').setValue(`Displaying 0 item`);
    
                $$('ta-proj-category').clear();
                $$('ta-proj-companyId').clear();
                $$('ta-proj-status').clear();
                $$('ta-proj-type').clear();
    
                const companyParams = {
                    companyId: '',
                    name: '',
                    nameSearchType: 2
                }
                AWS.callSoap(WS, 'searchCompanyByType', companyParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('ta-proj-companyId');
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
                        const ctl = $$('ta-proj-category');
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
                        const ctl = $$('ta-proj-type');
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
                        const ctl = $$('ta-proj-status');
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
                    $$('ta-projectId').setValue(row.projectId);
                    $$('ta-projectName').setValue(Number(row.projectName));
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('ta-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ta-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                        {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                        {headerName: 'Summary', field: 'description', width: 100},
                        {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                        {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                        {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                        {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                    ];
    
                formSearchGrid = new AGGrid('ta-proj-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            reset();
            const search = () => {
                const params = {
                    category: $$('ta-proj-category').getValue(),
                    companyId: $$('ta-proj-companyId').getValue(),
                    projectName: $$('ta-proj-projectName').getValue(),
                    projectNameSearchType: $$('ta-proj-projectNameSearchType').getValue(),
                    status: $$('ta-proj-status').getValue(),
                    summary: $$('ta-proj-summary').getValue(),
                    summarySearchType: $$('ta-proj-summarySearchType').getValue(),
                    type: $$('ta-proj-type').getValue()
                }
                AWS.callSoap(WS, 'searchProjects', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ta-proj-count').setValue(`Displaying ${records.length} Projects`);
                        } else {
                            $$('ta-proj-count').setValue(`Displaying 0 Projects`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ta-proj-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('ta-proj-reset').onclick(reset);
            $$('ta-proj-search').onclick(search);
            $$('ta-proj-ok').onclick(ok);
            $$('ta-proj-cancel').onclick(cancel);
    
            $$('ta-proj-chooseProject').onChange(() => {
                if ($$('ta-proj-chooseProject').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('ta-proj-category').disable();
                    $$('ta-proj-companyId').disable();
                    $$('ta-proj-projectName').disable();
                    $$('ta-proj-projectNameSearchType').disable();
                    $$('ta-proj-status').disable();
                    $$('ta-proj-summary').disable();
                    $$('ta-proj-summarySearchType').disable();
                    $$('ta-proj-type').disable();
    
                    $$('ta-proj-count').setValue(`Displaying 0 Projects`);
    
                    $$('ta-proj-ok').enable().onclick(() => {
                        $$('ta-projectId').clear();
                        $$('ta-projectName').clear();
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('ta-proj-category').enable();
                    $$('ta-proj-companyId').enable();
                    $$('ta-proj-projectName').enable();
                    $$('ta-proj-projectNameSearchType').enable();
                    $$('ta-proj-status').enable();
                    $$('ta-proj-summary').enable();
                    $$('ta-proj-summarySearchType').enable();
                    $$('ta-proj-type').enable();
    
                    $$('ta-proj-ok').enable().onclick(ok);
                }
            });
    
            search();
        });
        
        Utils.popup_open('edit-entry-popup');

        $$('edit-entry-ok').onclick(() => {
            const params = {
                beginningTime: $$('ta-edit-timeBegin').getValue(),
                billable: $$('ta-edit-billable').getValue(),
                description: $$('ta-edit-description').getValue(),
                endTime: $$('ta-edit-timeEnd').getValue(),
                projectId: $$('ta-edit-projectId').getValue(),
                timesheetId: entriesGrid.getSelectedRow().timesheetId,
                totalHours: Number($$('ta-edit-hours').getValue())
            }
            AWS.callSoap(WS, 'saveTimeEntry', params).then(data => {
                if (data.wsStatus === "0") {
                    getListTimesheetsForReview();
                    Utils.popup_close();
                }  
            });
        });
        
        $$('edit-entry-cancel').onclick(() => {
            Utils.popup_close();
        })
    }

    $$('ta-edit').onclick(edit);
})();
