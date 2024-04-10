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
    const WS = 'StandardTimeTimeOffRequest';
    const personId = Framework.userInfo.personId;

    function EventHour() {}

    EventHour.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        if (params.data.hour[params.colDef.field.substring(4)] !== "") {
            switch (params.data.eventName.split("(")[1].split(")")[0]) {
                case "Pending":
                    this.eGui.style.backgroundColor = "yellow";                    
                    break;

                case "Approved":
                    this.eGui.style.backgroundColor = "green";                    
                    break;

                case "Entered":
                    this.eGui.style.backgroundColor = "green";                    
                    break;

                case "Rejected":
                    this.eGui.style.backgroundColor = "red";                    
                    break;

                default:
                    break;
            }
            this.eGui.style.height = "100%";
            if (params.colDef.field.substring(4) !== 0 && params.data.hour[params.colDef.field.substring(4) - 1] === "" || params.colDef.field.substring(4) === 0) {

                this.eGui.style.marginLeft = params.data.hour[params.colDef.field.substring(4)].eventDetail.startMinute * 100 / 59 + "%";
            } else if (params.colDef.field.substring(4) !== 23 && params.data.hour[Number((params.colDef.field.substring(4))) + 1] === "" || params.colDef.field.substring(4) === 23) {
                this.eGui.style.marginRight = 100 - params.data.hour[params.colDef.field.substring(4)].eventDetail.finalMinute * 100 / 59 + "%";
            }      
        }
    };

    EventHour.prototype.getGui = function() {
        return this.eGui;
    };
    
    let resultsGrid;

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };

    AWS.callSoap(WS, 'searchEmployees', params).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('tor-person');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].personId, makeName(res.item[0].fname, res.item[0].middleName, res.item[0].lname));
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                ctl.setValue(res.selectedItem.personId, res.selectedItem.personLName + ", " + res.selectedItem.personFName);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(searchEmployee);
        }
    });

    $$('tor-person').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('tor-person').setValue(res.employeeid, res.lname + ", " +res.fname);
    });

    const showTable = () => {
        const columnDefs = [
            {headerName: "First Day Off", field: "firstDate", type: 'numericColumn', width: 40},
            {headerName: "Last Day Off", field: "lastDate", type: 'numericColumn', width: 40},
            {headerName: "Status", field: "statusFormatted", width: 20},
            {headerName: "Status Date", field: "statusDate", type: 'numericColumn', width: 30},
            {headerName: "Reviewer Comments", field: "approvingComment", width: 150}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
        getTimeOffRequests();
    }            

    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('tor-person').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lname', width: 80},
                {headerName: 'First Name', field: 'fname', width: 80},
                {headerName: 'Middle Name', field: 'middleName', width: 80},
            ];

            formSearchGrid = new AGGrid('esp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const inParams = {
                firstName: $$('esp-fname-search').getValue(),
                firstNameSearchType: $$('esp-fname-criteria').getValue(),
                lastName: $$('esp-lname-search').getValue(),
                lastNameSearchType: $$('esp-lname-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('esp-count').setValue(`Displaying ${records.length} Employees`);
                    } else {
                        $$('esp-count').setValue(`Displaying 0 Employees`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            })
        };

        $$('esp-reset').onclick(reset);
        $$('esp-search').onclick(search);
        $$('esp-ok').onclick(ok);
        $$('esp-cancel').onclick(cancel);

        search();
    };

    let viewResults;
    
    $$('view').onclick(() => {

        const showViewTable = () => {
            if (viewResults !== undefined) {
                viewResults.destroy();            
            }  
            const columnDefs = [
                {headerName: "Type", field: "name", width: 60},
                {headerName: "Total", field: "hours", type: "numericColumn", width: 40}
            ];
            viewResults = new AGGrid('viewResults', columnDefs);
            viewResults.show();
        }       

        showViewTable();
        $$('tor-view_title').setValue('Accured Time Off');

        const data = {
            personId: $$('tor-person').getValue()
        };

        AWS.callSoap(WS, 'listAccruedTimeOff', data).then(listAccruedTimeOff => {
            if (listAccruedTimeOff.wsStatus === "0") {
                const res = Utils.assureArray(listAccruedTimeOff.item);
                for (let i = 0; i < res.length; i++) {
                    res[i].hours = Utils.format(Utils.toNumber(res[i].hours), "Z", 0, 2);                    
                }
                viewResults.addRecords(res);
            }
        });

        Utils.popup_open('tor-veiw_popup');

        $$('tor-view_cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    let eventGrid;
    $$('add').onclick(() => {
        $$('tor-title').setValue('Add Time Off Request');
        $$('tor-category').enable();
        $$('tor-category').enable();
        $$('tor-comment').enable();
        $$('tor-first_day').enable();
        $$('tor-last_day').enable();
        $$('tor-specify_end_time').enable();
        $$('tor-specify_start_time').enable();
        $$('tor-on').clear();
        $$('tor-category').clear();
        $$('tor-comment').clear();
        $$('tor-comment_review').clear();
        $$('tor-reviewer').clear();
        $$('tor-first_day').clear();
        $$('tor-last_day').clear();
        $$('tor-end_time').clear();
        $$('tor-start_time').clear();
        $$('tor-status').setValue("Pending");
        $$('tor-event_day').setValue(new Date());

        $$('tor-specify_end_time').setValue(false);
        $$('tor-specify_start_time').setValue(false);

        $$('tor-specify_end_time').onChange(() => {
            $$('tor-specify_start_time').setValue($$('tor-specify_end_time').getValue());
            if ($$('tor-specify_end_time').getValue()) {
                $$('tor-end_time').enable();
                $$('tor-start_time').enable();
                $$('tor-last_day').disable().setValue($$('tor-first_day').getIntValue());
            } else {
                $$('tor-end_time').disable();
                $$('tor-start_time').disable();
                $$('tor-last_day').enable();
            }
        });
        $$('tor-specify_start_time').onChange(() => {
            $$('tor-specify_end_time').setValue($$('tor-specify_start_time').getValue());
            if ($$('tor-specify_start_time').getValue()) {
                $$('tor-end_time').enable();
                $$('tor-start_time').enable();
                $$('tor-last_day').disable().setValue($$('tor-first_day').getIntValue());
            } else {
                $$('tor-end_time').disable();
                $$('tor-start_time').disable();
                $$('tor-last_day').enable();
            }
        });

        $$('tor-next_day').onclick(() => {
            $$('tor-event_day').setValue(DateUtils.dateAddDays($$('tor-event_day').getDateValue(), 1));
            getListEvents();
        });

        $$('tor-prev_day').onclick(() => {
            $$('tor-event_day').setValue(DateUtils.dateAddDays($$('tor-event_day').getDateValue(), -1));
            getListEvents();
        });

        const container = new TabContainer('tor-tab-container');
        container.selectTab('tor-events-TabButton');

        const data = {
            personId: $$('tor-person').getValue()
        };

        $$('tor-category').add('', "(select)");
        AWS.callSoap(WS, 'searchTimeOffProjects', data).then(timeOffProjects => {
            if (timeOffProjects.wsStatus === "0") {
                timeOffProjects.item = Utils.assureArray(timeOffProjects.item);
                $$('tor-category').addItems(timeOffProjects.item, "id", "name");
            }
        });

        const getListEvents = () => {
            const params = {
                currentEventId: "",
                date: $$('tor-event_day').getIntValue(),
                personId: $$('tor-person').getValue()
            }
            eventGrid.clear();
    
            AWS.callSoap(WS, 'listEvents', params).then(listEvents => {
                if (listEvents.wsStatus === '0') {   
                    listEvents.item = Utils.assureArray(listEvents.item);
                    eventGrid.addRecords(listEvents.item);     
                }
            });     
        }      

        if (eventGrid !== undefined) {
            eventGrid.destroy();            
        }  
        const columnDefs = [
            {headerName: "Event", field: "eventName", width: 50}            
        ];
        for (let i = 0; i < 24; i++) {
            columnDefs.push({headerName: TimeUtils.format(Number(String(i) + "00")), field: "hour" + i, cellRenderer: 'eventHour', width: 20})        
        }
        eventGrid = new AGGrid('eventGrid', columnDefs);
        eventGrid.addComponent('eventHour', EventHour);
        eventGrid.show();
        getListEvents();

        $$('tor-event_day').onChange(getListEvents);
        
        Utils.popup_open('tor-popup');

        $$('tor-ok').onclick(() => {
            if ($$('tor-first_day').isError('Requested First Day Off')) 
                return;
            if ($$('tor-last_day').isError('Requested Last Day Off'))
                return;
            if ($$('tor-start_time').isError('Specify Starting Time'))
                return;
            if ($$('tor-end_time').isError('Specify Ending Time'))
                return;
            if ($$('tor-category').isError('Time Off Type (Project)'))
                return;

            const params = {
                firstDateOff: $$('tor-first_day').getIntValue(),
                firstTimeOff: $$('tor-specify_start_time').getValue() ? $$('tor-start_time').getValue() : -1,
                lastDateOff: $$('tor-last_day').getIntValue(),
                lastTimeOff: $$('tor-specify_end_time').getValue() ? $$('tor-end_time').getValue() : -1,
                personId: $$('tor-person').getValue(),
                projectId: $$('tor-category').getValue(),
                requestingComment: $$('tor-comment').getValue()
            }
            AWS.callSoap(WS, 'newTimeOffRequest', params).then(data => {
                if (data.wsStatus === '0') {   
                    getTimeOffRequests();
                    Utils.popup_close();
                }
            });     
        });

        $$('tor-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('report').onclick(() => {
        const params = {
            fromDate: $$('tor-from_date').getIntValue(),
            toDate: $$('tor-to_date').getIntValue(),
            personId: $$('tor-person').getValue()
        };
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });     
    });

    function edit() {
        $$('tor-title').setValue('Edit Time Off Request');
        $$('tor-category').clear();
        $$('tor-comment_review').clear();
        $$('tor-category').enable();
        $$('tor-comment').enable();
        $$('tor-first_day').enable();
        $$('tor-last_day').enable();
        $$('tor-end_time').enable();
        $$('tor-start_time').enable();
        $$('tor-reviewer').clear();

        $$('tor-specify_end_time').enable();
        $$('tor-specify_start_time').enable();
        $$('tor-ok').show();

        const row = resultsGrid.getSelectedRow();
        
        const id = {
            id: row.id
        }

        let timeOffRequestData;

        const data = {
            personId: $$('tor-person').getValue()
        };
        $$('tor-category').add('', "(select)");
        AWS.callSoap(WS, 'searchTimeOffProjects', data).then(timeOffProjects => {
            if (timeOffProjects.wsStatus === "0") {
                timeOffProjects.item = Utils.assureArray(timeOffProjects.item);
                $$('tor-category').addItems(timeOffProjects.item, "id", "name");
            }
        });

        AWS.callSoap(WS, 'loadTimeOffRequest', id).then(timeOffRequest => {
            if (timeOffRequest.wsStatus === "0") {
                timeOffRequestData = timeOffRequest;
                $$('tor-first_day').setValue(timeOffRequestData.firstDateOff);
                $$('tor-last_day').setValue(timeOffRequestData.lastDateOff);
                $$('tor-end_time').setValue(timeOffRequestData.lastTimeOff);
                $$('tor-start_time').setValue(timeOffRequestData.firstTimeOff);
                $$('tor-status').setValue(row.statusFormatted);
                $$('tor-on').setValue(timeOffRequestData.requestDateFormatted);

                $$('tor-specify_end_time').setValue(timeOffRequestData.lastTimeOff !== -1);
                $$('tor-specify_start_time').setValue(timeOffRequestData.firstTimeOff !== -1);
                $$('tor-comment').setValue(timeOffRequestData.requestingComment);
                $$('tor-event_day').setValue(timeOffRequestData.firstDateOff);                
                $$('tor-reviewer').setValue(timeOffRequestData.approvingPersonFormatted);   
                $$('tor-category').setValue(timeOffRequestData.projectId);
                getListEvents();
            }
        });     
        

        $$('tor-specify_end_time').onChange(() => {
            $$('tor-specify_start_time').setValue($$('tor-specify_end_time').getValue());
            if ($$('tor-specify_end_time').getValue()) {
                $$('tor-end_time').enable();
                $$('tor-start_time').enable();
                $$('tor-last_day').disable().setValue($$('tor-first_day').getIntValue());
            } else {
                $$('tor-end_time').disable();
                $$('tor-start_time').disable();
                $$('tor-last_day').enable();
            }
        });
        $$('tor-specify_start_time').onChange(() => {
            $$('tor-specify_end_time').setValue($$('tor-specify_start_time').getValue());
            if ($$('tor-specify_start_time').getValue()) {
                $$('tor-end_time').enable();
                $$('tor-start_time').enable();
                $$('tor-last_day').disable().setValue($$('tor-first_day').getIntValue());
            } else {
                $$('tor-end_time').disable();
                $$('tor-start_time').disable();
                $$('tor-last_day').enable();
            }
        });

        $$('tor-next_day').onclick(() => {
            $$('tor-event_day').setValue(DateUtils.dateAddDays($$('tor-event_day').getDateValue(), 1));
            getListEvents();
        });

        $$('tor-prev_day').onclick(() => {
            $$('tor-event_day').setValue(DateUtils.dateAddDays($$('tor-event_day').getDateValue(), -1));
            getListEvents();
        });

        const container = new TabContainer('tor-tab-container');
        container.selectTab('tor-events-TabButton');

        const getListEvents = () => {
            const params = {
                currentEventId: "",
                date: $$('tor-event_day').getIntValue(),
                personId: $$('tor-person').getValue()
            }
            eventGrid.clear();
    
            AWS.callSoap(WS, 'listEvents', params).then(listEvents => {
                if (listEvents.wsStatus === '0') {   
                    listEvents.item = Utils.assureArray(listEvents.item);
                    eventGrid.addRecords(listEvents.item);     
                }
            });     
        }      

        if (eventGrid !== undefined) {
            eventGrid.destroy();            
        }  
        let columnDefs = [
            {headerName: "Event", field: "eventName", width: 50}            
        ];
        for (let i = 0; i < 24; i++) {
            columnDefs.push({headerName: TimeUtils.format(Number(String(i) + "00")), field: "hour" + i, cellRenderer: 'eventHour', width: 20})        
        }
        eventGrid = new AGGrid('eventGrid', columnDefs);
        eventGrid.addComponent('eventHour', EventHour);
        eventGrid.show();

        $$('tor-event_day').onChange(getListEvents);
        
        Utils.popup_open('tor-popup');

        if (row.status !== "O") {
            $$('tor-title').setValue('View Time Off Request');
            $$('tor-category').disable();
            $$('tor-comment').disable();
            $$('tor-first_day').disable();
            $$('tor-last_day').disable();
            $$('tor-end_time').disable();
            $$('tor-start_time').disable();

            $$('tor-specify_end_time').disable();
            $$('tor-specify_start_time').disable();
            $$('tor-ok').hide();

            $$('tor-comment_review').setValue(row.approvingComment);

        }
        $$('tor-ok').onclick(() => {
            if ($$('tor-first_day').isError('Requested First Day Off')) 
                return;
            if ($$('tor-last_day').isError('Requested Last Day Off'))
                return;
            if ($$('tor-start_time').isError('Specify Starting Time'))
                return;
            if ($$('tor-end_time').isError('Specify Ending Time'))
                return;
            if ($$('tor-category').isError('Time Off Type (Project)'))
                return;

            const params = {
                firstDateOff: $$('tor-first_day').getIntValue(),
                firstTimeOff: $$('tor-specify_start_time').getValue() ? $$('tor-start_time').getValue() : -1,
                lastDateOff: $$('tor-last_day').getIntValue(),
                lastTimeOff: $$('tor-specify_end_time').getValue() ? $$('tor-end_time').getValue() : -1,
                personId: $$('tor-person').getValue(),
                projectId: $$('tor-category').getValue(),
                requestingComment: $$('tor-comment').getValue()
            }
            AWS.callSoap(WS, 'saveTimeOffRequest', params).then(data => {
                if (data.wsStatus === '0') {   
                    getTimeOffRequests();
                    Utils.popup_close();
                }
            });     
        });

        $$('tor-cancel').onclick(() => {
            Utils.popup_close();
        });
    } 
    
    $$('edit').onclick(edit);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Request?', () => {
            const data = {
                ids: resultsGrid.getSelectedRow().id
            };
            
            AWS.callSoap(WS, "deleteTimeOffRequests", data).then(data => {
                if (data.wsStatus === '0') {
                    getTimeOffRequests();
                }
            });            
        });
    });

    const getStatusFormatted = (status) => {
        switch (status) {
            case "A":
                return "Approved";
            case "O":
                return "Pending";

            case "R":
                return "Rejected";
                
            case 'E':  
                return "Entered";
            default:
                return;
        }
    }

    const getTimeOffRequests = () => {
        const params = {
            fromDate: $$('tor-from_date').getIntValue(),
            toDate: $$('tor-to_date').getIntValue(),
            personId: $$('tor-person').getValue()
        }
        resultsGrid.clear();
        AWS.callSoap(WS, 'searchTimeOffRequests', params).then(timeOffRequests => {
            if (timeOffRequests.wsStatus === "0") {
                timeOffRequests.item = Utils.assureArray(timeOffRequests.item);
                for (let i = 0; i < timeOffRequests.item.length; i++) {
                    timeOffRequests.item[i].statusFormatted = getStatusFormatted(timeOffRequests.item[i].status);                    
                    timeOffRequests.item[i].firstDate = timeOffRequests.item[i].firstDate !== "0" ? 
                        Number(timeOffRequests.item[i].firstTime) !== -1 ?
                            DateTimeUtils.formatDateTime(Number(timeOffRequests.item[i].firstDate), Number(timeOffRequests.item[i].firstTime)) :
                            DateUtils.intToStr4(Number(timeOffRequests.item[i].firstDate)) : '';

                    timeOffRequests.item[i].lastDate = timeOffRequests.item[i].lastDate !== "0" ? 
                        Number(timeOffRequests.item[i].lastTime) !== -1 ?
                            DateTimeUtils.formatDateTime(Number(timeOffRequests.item[i].lastDate), Number(timeOffRequests.item[i].lastTime)) :
                            DateUtils.intToStr4(Number(timeOffRequests.item[i].lastDate)) : '';

                    timeOffRequests.item[i].statusDate = timeOffRequests.item[i].statusDate !== "0" ? 
                        DateUtils.intToStr4(Number(timeOffRequests.item[i].statusDate)) : '';
                }
                resultsGrid.addRecords(timeOffRequests.item);                 
            }            
        });      
        resultsGrid.setOnRowDoubleClicked(edit);
        resultsGrid.setOnSelectionChanged((rows) => {
           $$('edit').enable(rows);
           if (rows.length)
               $$('edit').setValue(rows[0].status === "O" ? "Edit" : "View");
           $$('delete').enable(rows);
        });  
    }
    $$('tor-person').onChange(getTimeOffRequests);
    $$('tor-from_date').onChange(getTimeOffRequests);
    $$('tor-to_date').onChange(getTimeOffRequests);
    showTable();
})();
