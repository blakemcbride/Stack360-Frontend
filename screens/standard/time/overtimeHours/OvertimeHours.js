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
    const WS = 'StandardTimeOvertimeHours';
    
    let resultsGrid;

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const params = {
        firstName: '',
        firstNameSearchType: 0,
        lastName: '',
        lastNameSearchType: 0,
        hasTimeReadyForApproval: false,
        includeSelected: false,
        ssn: ''
    };

    AWS.callSoap(WS, 'searchEmployees', params).then(res => {
        if (res.wsStatus === "0") {
            res.employees = Utils.assureArray(res.employees);
            const ctl = $$('oh-person');
            ctl.clear();
            if (res.employees.length === 0) {
                ctl.nothingToSelect();
            } else if (res.employees.length === 1) {
                ctl.singleValue(res.employees[0].personId, makeName(res.employees[0].fname, res.employees[0].middleName, res.employees[0].lname));
            } else if (res.employees.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.employees.length; i++)
                    ctl.add(res.employees[i].personId, makeName(res.employees[i].fname, res.employees[i].middleName, res.employees[i].lname));
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(searchEmployee);
        }
    });

    AWS.callSoap(WS, 'loadDate', params).then(res => {
        if (res.wsStatus === "0") {
            $$('oh-fromDate').setValue(res.fromDate);
            $$('oh-toDate').setValue(res.toDate);                
        }
    });

    $$('oh-person').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('oh-person').setValue(res.employeeid, res.lname + ", " +res.fname);
    });

    const showTable = () => {
        const columnDefs = [
            {headerName: "Date", field: "date", type: 'numericColumn', width: 40},
            {headerName: "Approved Hours", field: "approvedHours", type: 'numericColumn', width: 40},
            {headerName: "Hours Taken", field: "hoursTaken", type: 'numericColumn', width: 40},
            {headerName: "", field: "", width: 400}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
    }            

    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-ssn').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('oh-person').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
                getListOvertimeHours();
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
                hasTimeReadyForApproval: false,
                includeSelected: false,
                ssn: $$('esp-ssn').getValue()
            };

            AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.employees) {
                        const records = Utils.assureArray(data.employees);
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

    $$('add').onclick(() => {
        $$('oh-title').setValue('Add');

        for (let i = 0; i < 5; i++) {
            $$('oh-hours' + i).clear();
            $$('oh-date' + i).clear();            
        }

        Utils.popup_open('oh-popup');

        $$('oh-ok').onclick(() => {
            if ($$('oh-date0').isError('Date'))
                return;
            if ($$('oh-hours0').isError('Approved Hours'))
                return;

            let obj = [];
            for (let i = 0; i < 5; i++) {
    //            if ($$('oh-date' + i).getIntValue() !== 0 && $$('oh-date' + i).getDateValue() < new Date()) {
             //       Utils.showMessage('Error', 'Please enter a current or future date.');
           //         return;
        //        }
                if ($$('oh-date' + i).getIntValue() !== 0 && $$('oh-hours' + i).getValue() <= 0) {
                    Utils.showMessage('Error', 'Approved hours cannot be a negative value.');
                    return;
                }       
                if ($$('oh-date' + i).getIntValue() !== 0) {
                    obj.push({date: $$('oh-date' + i).getIntValue(), hours: $$('oh-hours' + i).getValue()});
                }
            }

            const params = {
                obj: obj,
                personId: $$('oh-person').getValue()
            }
            AWS.callSoap(WS, 'newOvertimeHours', params).then(data => {
                if (data.wsStatus === '0') {   
                    getListOvertimeHours();
                    Utils.popup_close();
                }
            });     
        });

        $$('oh-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        $$('oh-title').setValue('Edit');

        const row = resultsGrid.getSelectedRow(); 

        for (let i = 0; i < 5; i++) {
            $$('oh-hours' + i).clear();
            $$('oh-date' + i).clear();            
        }
        $$('oh-hours0').setValue(Number(row.approvedHours));
        $$('oh-date0').setValue(Number(row.intDate));
        
        Utils.popup_open('oh-popup');

        $$('oh-ok').onclick(() => {

            if ($$('oh-date0').isError('Date'))
                return;
            if ($$('oh-hours0').isError('Approved Hours'))
                return;

            let obj = [];
            for (let i = 0; i < 5; i++) {
                if ($$('oh-date' + i).getIntValue() !== 0 && $$('oh-date' + i).getDateValue() < new Date()) {
                    Utils.showMessage('Error', 'Please enter a current or future date.');
                    return;
                } 
                if ($$('oh-date' + i).getIntValue() !== 0 && $$('oh-hours' + i).getValue() <= 0) {
                    Utils.showMessage('Error', 'Approved hours cannot be a negative value.');
                    return;
                }       
                if ($$('oh-date' + i).getIntValue() !== 0) {
                    obj.push({date: $$('oh-date' + i).getIntValue(), hours: $$('oh-hours' + i).getValue()});
                }                
            }

            obj[0].id = row.id;

            const params = {
                obj: obj,
                personId: $$('oh-person').getValue()
            }
            AWS.callSoap(WS, 'newOvertimeHours', params).then(data => {
                if (data.wsStatus === '0') {   
                    getListOvertimeHours();
                    Utils.popup_close();
                }
            });     
        });

        $$('oh-cancel').onclick(() => {
            Utils.popup_close();
        });
    } 
    
    $$('edit').onclick(edit);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Overtime Record?', () => {
            const data = {
                ids: resultsGrid.getSelectedRow().id
            };
            
            AWS.callSoap(WS, "removeOvertimeHours", data).then(data => {
                if (data.wsStatus === '0') {
                    getListOvertimeHours();
                }
            });            
        });
    });

    const getListOvertimeHours = () => {
        const params = {
            fromDate: $$('oh-fromDate').getIntValue(),
            personId: $$('oh-person').getValue(),
            toDate: $$('oh-toDate').getIntValue()
        }
        resultsGrid.clear();
        AWS.callSoap(WS, 'listOvertimeHours', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('oh-approvedHoursTotal').setValue(Utils.format(Utils.toNumber(data.approvedHoursTotal), "Z", 0, 2));
                $$('oh-hoursTakenTotal').setValue(Utils.format(Utils.toNumber(data.hoursTakenTotal), "Z", 0, 2)); 
                resultsGrid.addRecords(data.item);                 
            }            
        });      
        resultsGrid.setOnRowDoubleClicked(edit);
        resultsGrid.setOnSelectionChanged((x) => {
           $$('edit').enable(x);
           $$('delete').enable(x);
        });  
    }
    $$('oh-person').onChange(() => {
        getListOvertimeHours();
        if ($$('oh-person') !== '') {
            $$('oh-fromDate').enable();
            $$('oh-toDate').enable();    
            $$('add').enable();
        } else {
            $$('oh-fromDate').disable();
            $$('oh-toDate').disable(); 
            $$('add').disable();
        }
    });
    $$('oh-fromDate').onChange(getListOvertimeHours);
    $$('oh-toDate').onChange(getListOvertimeHours);
    showTable();
})();
