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
    const WS = 'StandardHrHrCheckListDetail';
    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);

    $$('worker-name').setValue(personName);
    let resultsGrid;

    const showTable = () => {
        const columnDefs = [
            {headerName: "Check List Item", field: "item", width: 50},
            {headerName: "Date Completed", field: "date", width: 20},
            {headerName: "Supervisor Last Name", field: "s_last_name", width: 30},
            {headerName: "Supervisor First Name", field: "s_first_name", width: 30}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
    }            

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }
    
    $$('checkListDropDown').add('', "(select)");
    AWS.callSoap(WS, 'listEmployeeStatuses').then(employeeStatuses => {
        if (employeeStatuses.wsStatus === "0") {
            employeeStatuses.item = Utils.assureArray(employeeStatuses.item);
            $$('checkListDropDown').addItems(employeeStatuses.item, "employeeStatusId", "name");
        }  
    });

    $$('checkListDropDown').onChange(() => {
        $$('report').disable()
        if ($$('checkListDropDown').getValue()) {
            getCheckListDetails();
            $$('report').enable();
        } else {
            resultsGrid.clear();
        }
    });

    $$('edit').onclick(edit);

    $$('complete').onclick(complete);

    $$('report').onclick(() => {
        const params = {
            employeeStatusId: $$('checkListDropDown').getValue(),
            employeeId: personId
        };
        AWS.callSoap(WS, 'getChecklistDetailsReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.fileName); 
            }
        });     
    });

    function complete() {
        const row = resultsGrid.getSelectedRow();
        const params = {
            checklistItemId: row.itemId,
            checklistDetailId: row.detailId,    
            employeeId: personId,
            dateCompleted: row.date !== "" ? DateUtils.strToInt(row.date) : DateUtils.dateToInt(new Date()),
            supervisorId: row.supervisorId !== "" ? row.supervisorId : personId
        };
        const meth = row.detailId ? 'saveChecklistDetail' : 'newChecklistDetail';
        AWS.callSoap(WS, meth, params).then(data => {
            if (data.wsStatus === '0') {       
                getCheckListDetails();   
            }
        });        
    }

    function edit() {
        const row = resultsGrid.getSelectedRow();
        $$('cld-title').setValue('Edit Check List Details');
        $$('cld-item').setValue(row.item).readOnly();
        $$('cld-date').setValue(row.date !== "" ? DateUtils.strToInt(row.date) : DateUtils.dateToInt(new Date()));

        Utils.popup_open("cld-popup");

        const params = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            personId: personId,
            searchType: 'E',
            ssn: null
        };
        AWS.callSoap(WS, 'searchEmployees', params).then(res => {
            if (res.wsStatus === "0") {
                res.employees = Utils.assureArray(res.employees);
                const ctl = $$('cld-person');
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
                    ctl.setValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);
                }
            }
        });

        $$('cld-person').setSelectFunction(async function () {
            let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
            if (res._status === "ok")
                $$('cld-person').setValue(res.employeeid, makeName(res.fname, res.mname, res.lname));
        });

        $$('cld-ok').onclick(() => {
            if ($$('cld-date').isError('Completed Date'))
                return;
            if ($$('cld-person').isError('Supervisor'))
                return;
                
            const row = resultsGrid.getSelectedRow();
            const params = {
                checklistItemId: row.itemId,
                checklistDetailId: row.detailId,         
                employeeId: personId,
                dateCompleted: $$('cld-date').getIntValue(),
                supervisorId:  $$('cld-person').getValue()
            };
            const meth = row.detailId ? 'saveChecklistDetail' : 'newChecklistDetail';
            AWS.callSoap(WS, meth, params).then(data => {
                if (data.wsStatus === '0') {
                    getCheckListDetails();   
                    Utils.popup_close();
                }
            });        
        });
    
        $$('cld-cancel').onclick(() => {
            Utils.popup_close();
        });
    } 
    
    const getCheckListDetails = () => {
        $$('complete').disable();
        $$('edit').disable();
        const rowData = [];  
        const params = {
            employeeStatusId: $$('checkListDropDown').getValue(),
            employeeId: personId
        }
        resultsGrid.clear();
        AWS.callSoap(WS, 'listChecklistDetails', params).then(checkListDetails => {
            if (checkListDetails.wsStatus === "0") {
                checkListDetails.detail = Utils.assureArray(checkListDetails.detail);
                for (let item of checkListDetails.detail) {
                    if (item !== null) {
                        rowData.push({
                            "itemId": item.checklistItemId,
                            "detailId": item.checklistDetailId,
                            "supervisorId": item.supervisorId,
                            'item': item.name,
                            'date': item.dateCompleted !== "0" ? DateUtils.intToStr4(Number(item.dateCompleted)) : '',
                            's_last_name': item.supervisorLName,
                            's_first_name': item.supervisorFName
                        });
                    }
                }
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnRowDoubleClicked(edit);
            }            
        });      
        resultsGrid.setOnSelectionChanged((rows) => {
            $$('complete').enable(rows);
            $$('edit').enable(rows);
        });  
    }
    showTable();
})();
