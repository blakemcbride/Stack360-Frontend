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
    const WS = 'StandardTimeTimesheetEntryByClock';

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const rights = await AWS.callSoap(WS, 'checkRight');

    const container = new TabContainer('tebc-tab-container');
    container.selectTab('tebc-byTimesheet-TabButton');

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };

    if (rights.accessLevel === 0) {
        const ctl = $$('tebc-employeeId');
        ctl.clear();
        ctl.singleValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
        getCurrentStatus();
    } else
        AWS.callSoap(WS, 'searchEmployees', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('tebc-employeeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].fname, res.item[0].middleName, res.item[0].lname));
                    getCurrentStatus();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                    ctl.setValue(Framework.userInfo.personId);
                    getCurrentStatus();
                } else {
                    ctl.forceSelect();
                    ctl.setValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
                    getCurrentStatus();
                }
                ctl.setSelectFunction(searchEmployee);
            }
        });

    $$('tebc-employeeId').onChange(() => {
        searchTimesheets();
        searchTimesheetsRolledUp();
        getCurrentStatus();
        getListAllTimesheets();
    });

    $$('tebc-employeeId').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('tebc-employeeId').setValue(res.employeeid, res.lname + ", " +res.fname);
    });

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
                $$('tebc-employeeId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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

    AWS.callSoap(WS, 'getDateMeta').then(data => {
        if (data.wsStatus === '0') {     
            $$('tebc-fromDateTimesheets').setValue(data.fromDate);
            $$('tebc-toDateTimesheets').setValue(data.toDate);

            $$('tebc-fromDate').setValue(data.fromDate);
            $$('tebc-toDate').setValue(data.toDate);

            $$('tebc-fromDate').onChange(() => {
                searchTimesheets();
                searchTimesheetsRolledUp();
            });
            $$('tebc-toDate').onChange(() => {
                searchTimesheets();
                searchTimesheetsRolledUp();
            });

            $$('tebc-fromDateTimesheets').onChange(() => {
                getListAllTimesheets();                
            });
            $$('tebc-toDateTimesheets').onChange(() => {
                getListAllTimesheets();
            });
        }
    });   

    function getCurrentStatus() {
        if ($$('tebc-employeeId').isError('Employee')) 
            return;
            
        const params = {
            personId: $$('tebc-employeeId').getValue()
        }
        AWS.callSoap(WS, 'getCurrentStatus', params).then(data => {
            if (data.wsStatus === '0') {     
                $$('tebc-currentStatus').setHTMLValue('<strong style="font-size: 24px; font-weight: 800;">' + data.currentStatus +
                    '</strong> since <strong style="font-size: 24px; font-weight: 800;">' + data.currentStatusSince +
                    '</strong>');

                if (data.currentStatus === "IN") {
                    $$('tebc-setIn').disable();
                    $$('tebc-setOut').enable();
                } else if (data.currentStatus === "OUT") {
                    $$('tebc-setIn').enable();
                    $$('tebc-setOut').disable(); 
                }

                $$('tebc-currentDate').setValue(DateUtils.intToStr4(Number(data.currentDate)));
                $$('tebc-currentTime').setValue(TimeUtils.format(Math.floor(data.currentTime / 100000)));
            }
        });   
    }

    let byTimesheetGrid;
 
    const byTimesheetColumnDefs = [
        {headerName: "Date/Time In", field: "dateTimeIn", type: "numericColumn", width: 190},
        {headerName: "Date/Time Out", field: "dateTimeOut", type: "numericColumn", width: 190},
        {headerName: "Elapsed Time", field: "elapsedTimeFormatted", type: "numericColumn", width: 190}
    ];
    byTimesheetGrid = new AGGrid('byTimesheetGrid', byTimesheetColumnDefs);
    byTimesheetGrid.show();

    function searchTimesheets() {
        if (byTimesheetGrid !== undefined) {
            byTimesheetGrid.clear();            
        } 
        if ($$('tebc-employeeId').isError('Employee')) 
            return;

        const params = {
            fromDate: $$('tebc-fromDate').getIntValue(),
            toDate: $$('tebc-toDate').getIntValue(),
            personId: $$('tebc-employeeId').getValue()
        };
        AWS.callSoap(WS, 'searchTimesheets', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dateTimeIn = DateUtils.intToStr4(Number(data.item[i].startDate)) + ' ' + TimeUtils.format(Math.floor(data.item[i].startTime / 100000));
                    data.item[i].dateTimeOut = DateUtils.intToStr4(Number(data.item[i].finalDate)) + ' ' + TimeUtils.format(Math.floor(data.item[i].finalTime / 100000));
                }
                $$('tebc-timesheetCount').setValue(`Displaying ${data.item.length} Timesheets`);
                $$('tebc-totalTime').setValue(data.totalFormatted);
                byTimesheetGrid.addRecords(data.item);
                byTimesheetGrid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('delete').enable(rows);
                });
                byTimesheetGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    let byDateGrid;

    const byDateColumnDefs = [
        {headerName: "Date", field: "date", type: "numericColumn", width: 100},
        {headerName: "Elapsed Time", field: "elapsedTimeFormatted", type: "numericColumn", width: 300}
    ];
    byDateGrid = new AGGrid('byDateGrid', byDateColumnDefs);
    byDateGrid.show();

    function searchTimesheetsRolledUp() {
        if (byDateGrid !== undefined) {
            byDateGrid.clear();            
        } 
        if ($$('tebc-employeeId').isError('Employee')) 
            return;

        const params = {
            fromDate: $$('tebc-fromDate').getIntValue(),
            toDate: $$('tebc-toDate').getIntValue(),
            personId: $$('tebc-employeeId').getValue()
        };
        AWS.callSoap(WS, 'searchTimesheetsRolledUp', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].date = DateUtils.intToStr4(Number(data.item[i].date));
                }
                $$('tebc-timesheetCount1').setValue(`Displaying ${data.item.length} Timesheets`);
                $$('tebc-totalTime1').setValue(data.totalFormatted);
                byDateGrid.addRecords(data.item);
            }
        });   
    }

    let allTimesheetsGrid;

    const allTimesheetsColumnDefs = [
        {headerName: "Date/Time In", field: "dateTimeIn", type: "numericColumn", width: 200},
        {headerName: "Date/Time Out", field: "dateTimeOut", type: "numericColumn", width: 200},
        {headerName: "Day", field: "dayOfWeek", width: 150},
        {headerName: "Description", field: "description", width: 300},
        {headerName: "Project ID", field: "projectName", width: 200},
        {headerName: "Project Name", field: "projectDescription", width: 300}
    ];
    allTimesheetsGrid = new AGGrid('allTimesheetsGrid', allTimesheetsColumnDefs);
    allTimesheetsGrid.show();

    function getListAllTimesheets() {
        if (allTimesheetsGrid !== undefined) {
            allTimesheetsGrid.clear();            
        } 
        if ($$('tebc-employeeId').isError('Employee')) 
            return;

        const params = {
            fromDate: $$('tebc-fromDateTimesheets').getIntValue(),
            toDate: $$('tebc-toDateTimesheets').getIntValue(),
            employeeId: $$('tebc-employeeId').getValue()
        };
        AWS.callSoap(WS, 'listAllTimesheets', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dateTimeIn = DateUtils.intToStr4(Number(data.item[i].startDate)) + ' ' + TimeUtils.format(Math.floor(data.item[i].startTime / 100000));
                    data.item[i].dateTimeOut = DateUtils.intToStr4(Number(data.item[i].finalDate)) + ' ' + TimeUtils.format(Math.floor(data.item[i].finalTime / 100000));
                }
                allTimesheetsGrid.addRecords(data.item);
            }
        });   
    }

    $$('tebc-setIn').onclick(() => {
        if ($$('tebc-employeeId').isError('Employee'))
            return;
        const params = {
            personId: $$('tebc-employeeId').getValue(),
            setToIn: true
        };
        
        AWS.callSoap(WS, "saveCurrentStatus", params).then(function (res) {
            if (res.wsStatus === '0') {
                searchTimesheets();
                searchTimesheetsRolledUp();
                getCurrentStatus();
                getListAllTimesheets();
            }
        });
    });

    $$('tebc-setOut').onclick(() => {
        if ($$('tebc-employeeId').isError('Employee'))
            return;
        const params = {
            personId: $$('tebc-employeeId').getValue(),
            setToIn: false
        };
        
        AWS.callSoap(WS, "saveCurrentStatus", params).then(function (res) {
            if (res.wsStatus === '0') {
                searchTimesheets();
                searchTimesheetsRolledUp();
                getCurrentStatus();
                getListAllTimesheets();
            }
        });
    });

    $$('add').onclick(() => {
        if ($$('tebc-employeeId').isError('Employee')) 
            return;        

        $$('tebc-action-label').setValue('Add');
        $$('tebc-action-dateIn').setValue(new Date());
        $$('tebc-action-timeIn').clear();
        $$('tebc-action-dateOut').setValue(new Date());
        $$('tebc-action-timeOut').clear();
        $$('tebc-action-elapsed').clear();

        const calcElapsed = () => {
            if ($$('tebc-action-timeIn').getValue() !== null && $$('tebc-action-timeOut').getValue() !== null) {
                $$('tebc-action-elapsed').setValue(
                    TimeUtils.hours(TimeUtils.minutesToTime(TimeUtils.diff($$('tebc-action-timeOut').getValue(), $$('tebc-action-timeIn').getValue()))) + ":" +
                    TimeUtils.minutes(TimeUtils.minutesToTime(TimeUtils.diff($$('tebc-action-timeOut').getValue(), $$('tebc-action-timeIn').getValue())))
                );
            }
        }

        $$('tebc-action-timeIn').onChange(calcElapsed);
        $$('tebc-action-timeOut').onChange(calcElapsed);
        
        Utils.popup_open('tebc-action');

        $$('tebc-action-ok').onclick(() => {
            if ($$('tebc-action-dateIn').isError('Date In')) 
                return;
            if ($$('tebc-action-timeIn').isError('Time In')) 
                return;
            if ($$('tebc-action-dateOut').isError('Date Out')) 
                return;
            if ($$('tebc-action-timeOut').isError('Time Out')) 
                return;

            const params = {
                finalDate: $$('tebc-action-dateOut').getIntValue(),
                finalTime: $$('tebc-action-timeOut').getValue(),
                personId: $$('tebc-employeeId').getValue(),
                startDate: $$('tebc-action-dateIn').getIntValue(),
                startTime: $$('tebc-action-timeIn').getValue()
            };
            AWS.callSoap(WS, 'newTimesheetEntry', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchTimesheets();
                    searchTimesheetsRolledUp();
                    getCurrentStatus();
                    getListAllTimesheets();
                    Utils.popup_close();
                }
            });   
        });

        $$('tebc-action-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        if ($$('tebc-employeeId').isError('Employee')) 
            return;        

        const row = byTimesheetGrid.getSelectedRow();      
        
        $$('tebc-action-label').setValue('Edit');
        $$('tebc-action-dateIn').setValue(row.startDate);
        $$('tebc-action-timeIn').setValue(Math.floor(row.startTime / 100000));
        $$('tebc-action-dateOut').setValue(row.finalDate);
        $$('tebc-action-timeOut').setValue(Math.floor(row.finalTime / 100000));
        $$('tebc-action-elapsed').setValue(row.elapsedTimeFormatted);

        const calcElapsed = () => {
            if ($$('tebc-action-timeIn').getValue() !== null && $$('tebc-action-timeOut').getValue() !== null) {
                $$('tebc-action-elapsed').setValue(
                    TimeUtils.hours(TimeUtils.minutesToTime(TimeUtils.diff($$('tebc-action-timeOut').getValue(), $$('tebc-action-timeIn').getValue()))) + ":" +
                    TimeUtils.minutes(TimeUtils.minutesToTime(TimeUtils.diff($$('tebc-action-timeOut').getValue(), $$('tebc-action-timeIn').getValue())))
                );
            }
        }

        $$('tebc-action-timeIn').onChange(calcElapsed);
        $$('tebc-action-timeOut').onChange(calcElapsed);
        
        Utils.popup_open('tebc-action');

        $$('tebc-action-ok').onclick(() => {
            if ($$('tebc-action-dateIn').isError('Date In')) 
                return;
            if ($$('tebc-action-timeIn').isError('Time In')) 
                return;
            if ($$('tebc-action-dateOut').isError('Date Out')) 
                return;
            if ($$('tebc-action-timeOut').isError('Time Out')) 
                return;

            const params = {
                id: row.id,
                finalDate: $$('tebc-action-dateOut').getIntValue(),
                finalTime: $$('tebc-action-timeOut').getValue(),
                personId: $$('tebc-employeeId').getValue(),
                startDate: $$('tebc-action-dateIn').getIntValue(),
                startTime: $$('tebc-action-timeIn').getValue()
            };
            AWS.callSoap(WS, 'saveTimesheetEntry', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchTimesheets();
                    searchTimesheetsRolledUp();
                    getCurrentStatus();
                    getListAllTimesheets();
                    Utils.popup_close();
                }
            });   
        });

        $$('tebc-action-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Timesheet?', () => {
            const data = {
                ids: byTimesheetGrid.getSelectedRow().id
            };
            
            AWS.callSoap(WS, "deleteTimesheetEntries", data).then(function (res) {
                if (res.wsStatus === '0') {
                    searchTimesheets();
                    searchTimesheetsRolledUp();
                    getCurrentStatus();
                    getListAllTimesheets();
                }
            });
        });
    });

    $$('edit').onclick(edit);
    
    $$('reportByTimesheet').onclick(() => {
        if ($$('tebc-employeeId').isError('Employee')) 
            return;
        if ($$('tebc-fromDate').isError('From Date'))
            return;
        if ($$('tebc-toDate').isError('To Date'))
            return;
            
        if ($$('tebc-employeeId').getValue()) {
            const params = {
                fromDate: $$('tebc-fromDate').getIntValue(),
                toDate: $$('tebc-toDate').getIntValue(),
                personId: $$('tebc-employeeId').getValue(),
                rolledUp: false
            };
            AWS.callSoap(WS, 'getReport', params).then(data => {
                if (data.wsStatus === '0') {     
                    Utils.showReport(data.reportUrl); 
                }
            });     
        }
    });

    $$('reportByDate').onclick(() => {
        if ($$('tebc-employeeId').isError('Employee')) 
            return;
        if ($$('tebc-fromDate').isError('From Date'))
            return;
        if ($$('tebc-toDate').isError('To Date'))
            return;
            
        if ($$('tebc-employeeId').getValue()) {
            const params = {
                fromDate: $$('tebc-fromDate').getIntValue(),
                toDate: $$('tebc-toDate').getIntValue(),
                personId: $$('tebc-employeeId').getValue(),
                rolledUp: true
            };
            AWS.callSoap(WS, 'getReport', params).then(data => {
                if (data.wsStatus === '0') {     
                    Utils.showReport(data.reportUrl); 
                }
            });     
        }
    });
})();
