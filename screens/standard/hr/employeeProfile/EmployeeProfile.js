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
    const WS = 'StandardHrEmployeeProfile';

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const container = new TabContainer('ep-tab-container');
    container.selectTab('ep-basic-TabButton');

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };



    $$('ep-person').singleValue(Framework.userInfo.personId, Framework.userInfo.personLName + ", " + Framework.userInfo.personFName);

    /*

    AWS.callSoap(WS, 'searchEmployees', params).then(res => {
        if (res.wsStatus === "0") {
            res.employees = Utils.assureArray(res.employees);
            const ctl = $$('ep-person');
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

    $$('ep-person').onChange(getEmployeeData);

    $$('ep-person').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok")
            $$('ep-person').setValue(res.employeeid, res.lname + ", " +res.fname);
    });
     */

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
                $$('ep-person').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
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

    let accuredTimeOffTable;
    let dependentsTable;
    let payHistoryTable;
 
    const accuredTimeOffColumnDefs = [
        {headerName: "Type", field: "accrualAccountName", width: 150},
        {headerName: "Remaining", field: "hours", type: "numericColumn", width: 100}
    ];
    accuredTimeOffTable = new AGGrid('accuredTimeOffTable', accuredTimeOffColumnDefs);
    accuredTimeOffTable.show();

    const dependentsColumnDefs = [
        {headerName: "First Name", field: "firstName", width: 150},
        {headerName: "Last Name", field: "lastName", width: 150},
        {headerName: "SSN", field: "ssn", width: 150},
        {headerName: "Relationship", field: "relationship", width: 150},
        {headerName: "Current Status", field: "currentStatus", width: 160}
    ];
    dependentsTable = new AGGrid('dependentsTable', dependentsColumnDefs);
    dependentsTable.show();

    $$('ep-toPayDate').setValue(new Date());
    $$('ep-fromPayDate').setValue(DateUtils.dateAddDays(new Date(), -30));

    const payHistoryColumnDefs = [
        {headerName: "Payment Date", type: "numericColumn", field: "firstName", width: 140},
        {headerName: "Payment Method", field: "lastName", width: 150},
        {headerName: "Check Number", field: "ssn", type: "numericColumn", width: 140},
        {headerName: "Total", field: "relationship", type: "numericColumn", width: 140}
    ];
    payHistoryTable = new AGGrid('payHistoryTable', payHistoryColumnDefs);
    payHistoryTable.show();

    getEmployeeData();

    $$("ep-search1").onclick(getEmployeePayHistory);
    $$("ep-search2").onclick(getEmployeePayHistory);

    $$('ep-payHistorySearchType').onChange(() => {
        if ($$('ep-payHistorySearchType').getValue() === "1") {
            $$('ep-checkNumber').disable();
            $$('ep-search1').disable();

            $$('ep-fromPayDate').enable();
            $$('ep-toPayDate').enable();
            $$('ep-search2').enable();
        } else {
            $$('ep-checkNumber').enable();
            $$('ep-search1').enable();

            $$('ep-fromPayDate').disable();
            $$('ep-toPayDate').disable();
            $$('ep-search2').disable();
        }
    });

    async function getEmployeeData() {
        $$("ep-first").clear();
        $$("ep-ssn").clear();
        $$("ep-middleName").clear();
        $$("ep-extRef").clear();
        $$("ep-last").clear();
        $$("ep-dob").clear();
        $$("ep-nickName").clear();
        $$("ep-email").clear();
        $$("ep-sex").clear();

        $$("ep-addressLine1").clear();
        $$("ep-homePhone").clear();
        $$("ep-addressLine2").clear();
        $$("ep-workPhone").clear();
        $$("ep-country").clear();
        $$("ep-mobilePhone").clear();
        $$("ep-city").clear();
        $$("ep-fax").clear();
        $$("ep-stateProvince").clear();
        $$("ep-zipPostalCode").clear();
        $$("ep-county").clear();

        $$("ep-position").clear();
        $$("ep-citizenship").clear();
        $$("ep-jobTitle").clear();
        $$("ep-visa").clear();
        $$("ep-status").clear();
        $$("ep-visaStatusDate").clear();
        $$("ep-i9Completed").clear();
        $$("ep-statusDate").clear();
        $$("ep-visaExpirationDate").clear();
        $$("ep-eeoCategory").clear();
        $$("ep-wageType").clear();
        $$("ep-eeoRace").clear();

        $$("ep-loginId").clear();
        $$("ep-loginStatus").clear();

        if (accuredTimeOffTable !== undefined) {
            accuredTimeOffTable.clear();            
        } 

        $$("ep-timeLog").clear();
        $$("ep-overtimeLogout").clear();
        $$("ep-breakHours").clear();
        $$("ep-workHours").clear();

        if (dependentsTable !== undefined) {
            dependentsTable.clear();            
        } 

        if ($$('ep-person').isError('Employee')) 
            return;

        if ($$('ep-person').getValue()) {
            getEmployeePayHistory();

            const params = {
                employeeId: $$('ep-person').getValue()
            };
            // The following must be an await or the screen will hand on the admin user
            let data = await AWS.callSoap(WS, 'loadEmployeeProfile', params);
            if (data.wsStatus === '0') {
                for (const key in data) {
                    if ($$('ep-' + key)) {
                        $$('ep-' + key).setValue(data[key])
                    }
                }

                // $$("ep-first").setValue(data.first);
                // $$("ep-ssn").setValue(data.ssn);
                // $$("ep-middleName").setValue(data.middleName);
                // $$("ep-extRef").setValue(data.extRef);
                // $$("ep-last").setValue(data.last);
                // $$("ep-dob").setValue(data.dob);
                // $$("ep-nickName").setValue(data.nickName);
                // $$("ep-email").setValue(data.email);
                // $$("ep-sex").setValue(data.sex);

                // $$("ep-addressLine1").setValue(data.addressLine1);
                // $$("ep-homePhone").setValue(data.homePhone);
                // $$("ep-addressLine2").setValue(data.addressLine2);
                // $$("ep-workPhone").setValue(data.workPhone);
                // $$("ep-country").setValue(data.country);
                // $$("ep-mobilePhone").setValue(data.mobilePhone);
                // $$("ep-city").setValue(data.city);
                // $$("ep-fax").setValue(data.fax);
                // $$("ep-stateProvince").setValue(data.stateProvince);
                // $$("ep-zipPostalCode").setValue(data.zipPostalCode);
                // $$("ep-county").setValue(data.county);

                // $$("ep-position").setValue(data.position);
                // $$("ep-citizenship").setValue(data.citizenship);
                // $$("ep-jobTitle").setValue(data.jobTitle);
                // $$("ep-visa").setValue(data.visa);
                // $$("ep-status").setValue(data.status);
                // $$("ep-visaStatusDate").setValue(data.visaStatusDate);
                // $$("ep-i9Completed").setValue(data.i9Completed);
                // $$("ep-statusDate").setValue(data.statusDate);
                // $$("ep-visaExpirationDate").setValue(data.visaExpirationDate);
                // $$("ep-eeoCategory").setValue(data.eeoCategory);
                // $$("ep-wageType").setValue(data.wageType);
                // $$("ep-eeoRace").setValue(data.eeoRace);

                // $$("ep-tabaccoUse").setValue(data.tabaccoUse);
                // $$("ep-automotiveInsuranceCarrier").setValue(data.automotiveInsuranceCarrier);
                // $$("ep-automotiveInsuranceCoverage").setValue(data.automotiveInsuranceCoverage);
                // $$("ep-automotiveInsuranceExpirationDate").setValue(data.automotiveInsuranceExpirationDate);
                // $$("ep-automotiveInsurancePolicyNumber").setValue(data.automotiveInsurancePolicyNumber);
                // $$("ep-automotiveInsuranceStartDate").setValue(data.automotiveInsuranceStartDate);
                // $$("ep-driversLicenseExpirationDate").setValue(data.driversLicenseExpirationDate);
                // $$("ep-driversLicenseNumber").setValue(data.driversLicenseNumber);
                // $$("ep-driversLicenseState").setValue(data.driversLicenseState);

                // $$("ep-loginId").setValue(data.loginId);
                // $$("ep-loginStatus").setValue(data.loginStatus);

                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].hours = Utils.format(Utils.toNumber(data.item[i].hours), "Z", 0, 2);
                }
                accuredTimeOffTable.addRecords(data.item);

                // $$("ep-timeLog").setValue(data.timeLog);
                // $$("ep-overtimeLogout").setValue(data.overtimeLogout);
                // $$("ep-breakHours").setValue(Utils.format(Utils.toNumber(data.breakHours), "Z", 0, 2));
                // $$("ep-workHours").setValue(Utils.format(Utils.toNumber(data.workHours), "Z", 0, 2));

                AWS.callSoap(WS, 'listEmployeeDependents', params).then(data => {
                    if (data.wsStatus === '0') {
                        data.dependents = Utils.assureArray(data.dependents);
                        dependentsTable.addRecords(data.dependents);
                    }
                });
            }
        }        
    }

    function viewPayHistory() {
        //
    }

    function getEmployeePayHistory() {
        if (payHistoryTable !== undefined) {
            payHistoryTable.clear();            
        } 

        if ($$('ep-person').isError('Employee')) 
            return;
        if ($$('ep-checkNumber').isError('specific Check Number'))
            return;
        if ($$('ep-fromPayDate').isError('Payment Dates From'))
            return;
        if ($$('ep-toPayDate').isError('Payment Dates To'))
            return;
        
        const params = {
            checkNumber: $$('ep-payHistorySearchType').getValue() === "1" ? 0 : $$('ep-checkNumber').getValue(),
            fromPayDate: $$('ep-payHistorySearchType').getValue() === "1" ? $$('ep-fromPayDate').getIntValue() : 0,
            toPayDate: $$('ep-payHistorySearchType').getValue() === "1" ? $$('ep-toPayDate').getIntValue() : 0,
            personId: $$('ep-person').getValue()
        };
        if ($$('ep-person').getValue()) {
            AWS.callSoap(WS, 'searchPayHistory', params).then(data => {
                if (data.wsStatus === '0') {     
                    // 
                }
            });

            payHistoryTable.setOnRowDoubleClicked(viewPayHistory);
            payHistoryTable.setOnSelectionChanged($$('view').enable);
        }        
    }

    $$('view').onclick(viewPayHistory);

    $$('report').onclick(() => {
        if ($$('ep-person').isError('Employee')) 
            return;
        if ($$('ep-checkNumber').isError('specific Check Number'))
            return;
        if ($$('ep-fromPayDate').isError('Payment Dates From'))
            return;
        if ($$('ep-toPayDate').isError('Payment Dates To'))
            return;
            
        if ($$('ep-person').getValue()) {
            const params = {
                checkNumber: $$('ep-payHistorySearchType').getValue() === "1" ? 0 : $$('ep-checkNumber').getValue(),
                fromPayDate: $$('ep-payHistorySearchType').getValue() === "1" ? $$('ep-fromPayDate').getIntValue() : 0,
                toPayDate: $$('ep-payHistorySearchType').getValue() === "1" ? $$('ep-toPayDate').getIntValue() : 0,
                personId: $$('ep-person').getValue()
            };
            AWS.callSoap(WS, 'getReport', params).then(data => {
                if (data.wsStatus === '0') {     
                    Utils.showReport(data.reportUrl); 
                }
            });     
        }
    });
})();
