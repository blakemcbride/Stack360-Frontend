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
    const WS = 'StandardTimeTimesheetEntryByClockSimple';

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const rights = await AWS.callSoap(WS, 'checkRight');

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };

    if (rights.accessLevel === 0) {
        const ctl = $$('tebcs-employeeId');
        ctl.clear();
        ctl.singleValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
        getCurrentStatus();

        getListAllTimesheets();
    } else
        AWS.callSoap(WS, 'searchEmployees', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('tebcs-employeeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].personId, makeName(res.item[0].fname, res.item[0].middleName, res.item[0].lname));
                    getCurrentStatus();
                    getListAllTimesheets();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].personId, makeName(res.item[i].fname, res.item[i].middleName, res.item[i].lname));
                    ctl.setValue(Framework.userInfo.personId);
                    getCurrentStatus();
                    getListAllTimesheets();
                } else {
                    ctl.forceSelect();
                    ctl.setValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
                    getCurrentStatus();
                    getListAllTimesheets();
                }
                ctl.setSelectFunction(searchEmployee);
            }
        });

    $$('tebcs-employeeId').onChange(() => {
        getCurrentStatus();
        getListAllTimesheets();
    });

    $$('tebcs-employeeId').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('tebcs-employeeId').setValue(res.employeeid, res.lname + ", " +res.fname);

        getListAllTimesheets();
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
                $$('tebcs-employeeId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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

    function getCurrentStatus() {
        if ($$('tebcs-employeeId').isError('Employee')) 
            return;
            
        const params = {
            personId: $$('tebcs-employeeId').getValue()
        }
        AWS.callSoap(WS, 'getCurrentStatus', params).then(data => {
            if (data.wsStatus === '0') {     
                $$('tebcs-currentStatus').setHTMLValue('<strong style="font-size: 24px; font-weight: 800;">' + data.currentStatus +
                    '</strong> since <strong style="font-size: 24px; font-weight: 800;">' + data.currentStatusSince +
                    '</strong>');

                if (data.currentStatus === "IN") {
                    $$('tebcs-setIn').disable();
                    $$('tebcs-setOut').enable();
                } else if (data.currentStatus === "OUT") {
                    $$('tebcs-setIn').enable();
                    $$('tebcs-setOut').disable(); 
                }

                $$('tebcs-currentDate').setValue(DateUtils.intToStr4(Number(data.currentDate)));
                $$('tebcs-currentTime').setValue(TimeUtils.format(Math.floor(data.currentTime / 100000)));
            }
        });   
    }

    let allTimesheetsGrid;

    const allTimesheetsColumnDefs = [
        {headerName: "Date/Time In", field: "dateTimeIn", type: "numericColumn", width: 200},
        {headerName: "Date/Time Out", field: "dateTimeOut", type: "numericColumn", width: 200},
        {headerName: "Hours", field: "hoursFormatted", type: "numericColumn", width: 150},
        {headerName: "Day", field: "dayOfWeek", width: 150},
        {headerName: "Description", field: "description", width: 600},
        {headerName: "Project Name", field: "projectDescription", width: 300}
    ];
    allTimesheetsGrid = new AGGrid('allTimesheetsGrid', allTimesheetsColumnDefs);
    allTimesheetsGrid.show();

    function getListAllTimesheets() {
        if (allTimesheetsGrid !== undefined) {
            allTimesheetsGrid.clear();            
        } 
        if ($$('tebcs-employeeId').isError('Employee')) 
            return;

        const params = {
            fromDate: $$('tebcs-fromDateTimesheets').getIntValue(),
            toDate: $$('tebcs-toDateTimesheets').getIntValue(),
            employeeId: $$('tebcs-employeeId').getValue()
        };
        AWS.callSoap(WS, 'listAllTimesheets', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dateTimeIn = DateUtils.intToStr4(Number(data.item[i].startDate)) + ' ' + TimeUtils.format(Math.floor(data.item[i].startTime / 100000));
                    data.item[i].dateTimeOut = DateUtils.intToStr4(Number(data.item[i].finalDate)) + ' ' + TimeUtils.format(Math.floor(data.item[i].finalTime / 100000));
                }
                $$('tebcs-fromDateTimesheets').setValue(Number(data.begDateRange));
                $$('tebcs-toDateTimesheets').setValue(Number(data.endDateRange));
                $$('tebcs-totalTime').setValue(Number(data.totalHours));
                allTimesheetsGrid.addRecords(data.item);
            }
        });   
    }

    $$('tebcs-setIn').onclick(() => {
        if ($$('tebcs-employeeId').isError('Employee'))
            return;
        const params = {
            personId: $$('tebcs-employeeId').getValue(),
            setToIn: true
        };
        
        AWS.callSoap(WS, "saveCurrentStatus", params).then(function (res) {
            if (res.wsStatus === '0') {
                getCurrentStatus();
                getListAllTimesheets();
            }
        });
    });

    $$('tebcs-setOut').onclick(() => {
        if ($$('tebcs-employeeId').isError('Employee'))
            return;
        const params = {
            personId: $$('tebcs-employeeId').getValue(),
            setToIn: false
        };
        
        AWS.callSoap(WS, "saveCurrentStatus", params).then(function (res) {
            if (res.wsStatus === '0') {
                getCurrentStatus();
                getListAllTimesheets();
            }
        });
    });
})();
