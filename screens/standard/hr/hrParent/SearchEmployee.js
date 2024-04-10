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

'use strict';

Component.SearchEmployee = {};

Component.SearchEmployee.run = async (inData) => {
    let searchType = inData.searchType;
    let cntSuffix, method;

    Component.SearchEmployee.searchEmployeeGrid = null;

    let reset = () => {
        $$('employeeLastNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('employeeLastNameSearch').clear();

        $$('employeeFirstNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('employeeFirstNameSearch').clear();

        $$('employeeSsnSearch').clear();

        $$('searchEmployeeOK').disable();

        Component.SearchEmployee.searchEmployeeGrid.clear();
    };

    let changeCount = (count) => {
        Utils.setText('empCount', `Displaying ${count} ${cntSuffix}.`);
    };

    let ok = () => {
        let employee = Component.SearchEmployee.searchEmployeeGrid.getSelectedNodes()[0];

        if (!employee)
            employee = null;

        reset();
        Component.SearchEmployee.searchEmployeeGrid.destroy();
        Utils.popup_close1('employeeSelection', employee);
    };

    let cancel = () => {
        reset();
        Component.SearchEmployee.searchEmployeeGrid.destroy();
        Utils.popup_close1('employeeSelection');
    };

    // Set dialog title.
    if (searchType === EmployeeSearchTypes.DEPENDANT) {
        Utils.setText('employeeSelectionTitle', `Search for Dependant (Non-Employee)`);
        method = 'searchDependents';
        cntSuffix = 'Dependants';
    } else {
        Utils.setText('employeeSelectionTitle', `Search for Applicant`);
        method = 'searchApplicants';
        cntSuffix = 'Applicants';
    }

    // Set the initial count after setting up the prefix.
    changeCount(0);

    // Setup drop downs.
    bindToEnum('employeeLastNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('employeeFirstNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    // Setup SSN field.
    setSSNFilter('employeeSsnSearch');

    let initDataGrid = () => {
        let idKey;

        if (searchType === EmployeeSearchTypes.DEPENDANT)
            idKey = 'dependantId';
        else if (searchType === EmployeeSearchTypes.APPLICANT)
            idKey = 'id';

        // Setup data grid.
        let columnDefs = [
            {headerName: 'Person ID', field: idKey, hide: true},
            {headerName: 'Last Name', field: 'lastName'},
            {headerName: 'First Name', field: 'firstName'},
            {headerName: 'Middle Name', field: 'middleName'},
            {headerName: 'SSN', field: 'ssn', cellStyle: {'justify-content': 'flex-end'}}
        ];

        Component.SearchEmployee.searchEmployeeGrid = new Grid(columnDefs, []);
        Component.SearchEmployee.searchEmployeeGrid.build('searchEmployeeResultsGrid');
    };

    if (!Component.SearchEmployee.searchEmployeeGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchEmployee.searchEmployeeGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    Component.SearchEmployee.searchEmployeeGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.SearchEmployee.searchEmployeeGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('searchEmployeeOK').enable(rows);
    });

    Component.SearchEmployee.searchEmployeeGrid.setOnRowDoubleClicked(ok);

    $$('employeeSsnSearch').onChange(() => $$('employeeSsnSearch').setValue(Utils.formatSsn($$('employeeSsnSearch').getValue())));

    $$('searchEmployeeReset').onclick(reset);

    $$('searchEmployeeSearch').onclick(async () => {
        let inParams = {
            firstName: $$('employeeFirstNameSearch').getValue(),
            employeeFirstNameSearchType: $$('employeeFirstNameCriteria').getValue(),
            lastName: $$('employeeLastNameSearch').getValue(),
            employeeLastNameSearchType: $$('employeeLastNameCriteria').getValue(),
            ssn: $$('employeeSsnSearch').getValue(),
        };

        let data = await AWS.callSoap('StandardHrHrParent', method, inParams);

        // Clear the grid.
        Component.SearchEmployee.searchEmployeeGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.SearchEmployee.searchEmployeeGrid.addRecords(records);

            let count = records.length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('searchEmployeeOK').onclick(ok);

    $$('searchEmployeeCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};