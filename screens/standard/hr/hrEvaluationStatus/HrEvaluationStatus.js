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
    const WS = 'StandardHrHrEvaluationStatus';
    
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
            res.employees = Utils.assureArray(res.employees);
            const ctl = $$('es-supervisorId');
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

    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-ssn-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('es-supervisorId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
            }
            reset();
            Utils.popup_close();
            searchEvaluations();
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
                ssn: $$('esp-ssn-search').getValue(),
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

    function StatusInfo() {}

    StatusInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            Utils.popup_open("info-popup");
            $$('es-info-comments').setValue(params.data.comments);
            $$('es-info-employeeComments').setValue(params.data.employeeComments);
            $$('es-info-privateComments').setValue(params.data.privateComments);
            $$('info-ok').onclick(function () {
                Utils.popup_close();
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.description;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    StatusInfo.prototype.getGui = function() {
        return this.eGui;
    };

    function StatusCheckbox() {}

    StatusCheckbox.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let checkbox = document.createElement('input');
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", 'es-status-' +  params.data.evaluationId);
        checkbox.setAttribute("style", "vertical-align: middle;");
        checkbox.checked = params.data.completed === "true";
        this.eGui.appendChild(checkbox);
    };

    StatusCheckbox.prototype.getGui = function() {
        return this.eGui;
    };

    let searchResGrid;
 
    const searchResColumnDefs = [
        {headerName: "", field: "completed", cellRenderer: "statusCheckbox", width: 20},
        {headerName: "Employee", field: "employeeName", width: 120},
        {headerName: "Supervisor", field: "supervisorName", width: 120},
        {headerName: "Evaluation Date", field: "evalDate", type: "numericColumn", width: 120},
        {headerName: "Finalized Date", field: "finalDate", type: "numericColumn", width: 120},
        {headerName: "Next Evaluation", field: "nextDate", type: "numericColumn", width: 120},
        {headerName: "State", field: "state", width: 80},
        {headerName: "Description", field: "description", cellRenderer: "statusInfo", width: 240}
    ];
    searchResGrid = new AGGrid('searchResGrid', searchResColumnDefs);
    searchResGrid.addComponent('statusCheckbox', StatusCheckbox);
    searchResGrid.addComponent('statusInfo', StatusInfo);
    searchResGrid.show();

    function searchEvaluations() {
        searchResGrid.clear();

        const params = {
            finalized: $$('es-finalized').getValue(),
            fromDate: $$('es-fromDate').getIntValue(),
            supervisorId: $$('es-supervisorId').getValue(),
            toDate: $$('es-toDate').getIntValue()
        };
        AWS.callSoap(WS, 'searchEvaluations', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].evalDate = DateUtils.intToStr4(Number(data.item[i].evalDate));
                    data.item[i].finalDate = DateUtils.intToStr4(Number(data.item[i].finalDate));
                    data.item[i].nextDate = DateUtils.intToStr4(Number(data.item[i].nextDate));
                }
                $$('es-count').setValue('Displaying ' + data.item.length + ' Employee Evaluations');
                searchResGrid.addRecords(data.item);
            }
        });   
    }

    searchEvaluations();

    $$('es-finalized').onChange(searchEvaluations);
    $$('es-fromDate').onChange(searchEvaluations);
    $$('es-supervisorId').onChange(searchEvaluations);
    $$('es-toDate').onChange(searchEvaluations);
    
    $$('search').onclick(searchEvaluations);
})();
