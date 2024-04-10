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

Component.SearchCompany = {};

Component.SearchCompany.run = () => {

    Component.SearchCompany.searchCompanyGrid = null;

    let reset = () => {
        $$('companySearchTypeGrp').setValue('true');

        $$('companyNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('companyNameCriteria').enable();

        $$('companyNameSearch').clear();
        $$('companyNameSearch').enable();

        $$('searchCompanyReset').enable();
        $$('searchCompanySearch').enable();

        $$('companyOK').disable();

        Component.SearchCompany.searchCompanyGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        if (count === 70)
            Utils.setHTML('compCount', `<span style="color: var(--error-color);">Displaying ${count} Companies (Limit)</span>`);
        else
            Utils.setText('compCount', `Displaying ${count} Companies`);
    };

    let ok = () => {
        let company = Component.SearchCompany.searchCompanyGrid.getSelectedNodes()[0];

        if (!company)
            company = null;

        reset();
        Component.SearchCompany.searchCompanyGrid.destroy();
        Utils.popup_close1('companySelection', company);
    };

    let cancel = () => {
        reset();
        Component.SearchCompany.searchCompanyGrid.destroy();
        Utils.popup_close1('companySelection');
    };

    // Setup drop downs.
    bindToEnum('companyNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: 'Company ID', field: 'companyId', hide: true},
            {headerName: 'Company Name', field: 'name'},
            {headerName: 'Type', field: 'orgGroupTypeName', maxWidth: 100}
        ];

        Component.SearchCompany.searchCompanyGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.SearchCompany.searchCompanyGrid.build('searchCompanyResultsGrid');
    };

    let toggleControls = disabled => {
        if (disabled) {
            $$('companyNameCriteria').disable();
            $$('companyNameSearch').disable();
            $$('searchCompanyReset').disable();
            $$('searchCompanySearch').disable();

            $$('companyOK').enable();
        } else {
            $$('companyNameCriteria').enable();
            $$('companyNameSearch').enable();
            $$('searchCompanyReset').enable();
            $$('searchCompanySearch').enable();

            $$('companyOK').disable();
        }
    };

    if (!Component.SearchCompany.searchCompanyGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchCompany.searchCompanyGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    $$('companySearchTypeGrp').onChange(() => {
        if ($$('companySearchTypeGrp').getValue() === 'false') {
            Component.SearchCompany.searchCompanyGrid.clear();
            toggleControls(true);
            changeCount(0);
        } else {
            toggleControls(false);
        }
    });

    Component.SearchCompany.searchCompanyGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.SearchCompany.searchCompanyGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('companyOK').enable(rows);
    });

    Component.SearchCompany.searchCompanyGrid.setOnRowDoubleClicked(ok);

    $$('searchCompanyReset').onclick(reset);

    $$('searchCompanySearch').onclick(async () => {
        let inParams = {
            name: $$('companyNameSearch').getValue(),
            companyNameSearchType: $$('companyNameCriteria').getValue(),
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchCompany', inParams);
        // Clear the grid.
        Component.SearchCompany.searchCompanyGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.SearchCompany.searchCompanyGrid.addRecords(records);

            let count = Utils.assureArray(data.item).length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('companyOK').onclick(ok);

    $$('companyCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};