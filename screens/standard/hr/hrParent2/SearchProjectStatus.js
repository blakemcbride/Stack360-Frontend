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

Component.SearchProjectStatus = {};

Component.SearchProjectStatus.run = () => {

    Component.SearchProjectStatus.searchProjectStatusGrid = null;

    let reset = () => {
        $$('projectStatusSearchTypeGrp').setValue('true');

        $$('projectStatusCodeCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('projectStatusCodeCriteria').enable();

        $$('projectStatusCodeSearch').clear();
        $$('projectStatusCodeSearch').enable();

        $$('projectStatusDescCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('projectStatusDescCriteria').enable();
        $$('projectStatusDescSearch').clear();
        $$('projectStatusDescSearch').enable();

        $$('searchStatusReset').enable();
        $$('searchStatusSearch').enable();

        $$('projectStatusOK').disable();

        Component.SearchProjectStatus.searchProjectStatusGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('statCount', `Displaying ${count} Project Statuses`);
    };

    let ok = () => {
        let status = Component.SearchProjectStatus.searchProjectStatusGrid.getSelectedNodes()[0];

        if (!status)
            status = null;

        reset();
        Component.SearchProjectStatus.searchProjectStatusGrid.destroy();
        Utils.popup_close1('projectStatusSelection', status);
    };

    let cancel = () => {
        reset();
        Component.SearchProjectStatus.searchProjectStatusGrid.destroy();
        Utils.popup_close1('projectStatusSelection');
    };

    // Setup drop downs.
    bindToEnum('projectStatusCodeCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('projectStatusDescCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: 'Status ID', field: 'projectStatusId', hide: true},
            {headerName: 'Code', field: 'code', maxWidth: 125},
            {headerName: 'Description', field: 'description'}
        ];

        Component.SearchProjectStatus.searchProjectStatusGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.SearchProjectStatus.searchProjectStatusGrid.build('searchProjectStatusResultsGrid');
    };

    let toggleControls = disabled => {
        if (disabled) {
            $$('projectStatusCodeCriteria').disable();
            $$('projectStatusCodeSearch').disable();
            $$('projectStatusDescCriteria').disable();
            $$('projectStatusDescSearch').disable();
            $$('searchStatusReset').disable();
            $$('searchStatusSearch').disable();

            $$('projectStatusOK').enable();
        } else {
            $$('projectStatusCodeCriteria').enable();
            $$('projectStatusCodeSearch').enable();
            $$('projectStatusDescCriteria').enable();
            $$('projectStatusDescSearch').enable();
            $$('searchStatusReset').enable();
            $$('searchStatusSearch').enable();

            $$('projectStatusOK').disable();
        }
    };

    if (!Component.SearchProjectStatus.searchProjectStatusGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchProjectStatus.searchProjectStatusGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    $$('projectStatusSearchTypeGrp').onChange(() => {
        if ($$('projectStatusSearchTypeGrp').getValue() === 'false') {
            Component.SearchProjectStatus.searchProjectStatusGrid.clear();
            toggleControls(true);
            changeCount(0);
        } else {
            toggleControls(false);
        }
    });

    Component.SearchProjectStatus.searchProjectStatusGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.SearchProjectStatus.searchProjectStatusGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('projectStatusOK').enable(rows);
    });

    Component.SearchProjectStatus.searchProjectStatusGrid.setOnRowDoubleClicked(ok);

    $$('searchStatusReset').onclick(reset);

    $$('searchStatusSearch').onclick(async () => {
        let inParams = {
            code: $$('projectStatusCodeSearch').getValue(),
            projectStatusCodeSearchType: $$('projectStatusCodeCriteria').getValue(),
            description: $$('projectStatusDescSearch').getValue(),
            descriptionSearchType: $$('projectStatusDescCriteria').getValue(),
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchProjectStatuses', inParams);

        // Clear the grid.
        Component.SearchProjectStatus.searchProjectStatusGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.SearchProjectStatus.searchProjectStatusGrid.addRecords(records);

            let count = Utils.assureArray(data.item).length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('projectStatusOK').onclick(ok);

    $$('projectStatusCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};