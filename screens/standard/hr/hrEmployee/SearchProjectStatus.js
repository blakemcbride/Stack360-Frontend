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
        $$('searchTypeGrp').setValue('true');

        $$('codeCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('codeCriteria').enable();

        $$('codeSearch').clear();
        $$('codeSearch').enable();

        $$('descCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('descCriteria').enable();
        $$('descSearch').clear();
        $$('descSearch').enable();

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
    bindToEnum('codeCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('descCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

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
            $$('codeCriteria').disable();
            $$('codeSearch').disable();
            $$('descCriteria').disable();
            $$('descSearch').disable();
            $$('searchStatusReset').disable();
            $$('searchStatusSearch').disable();

            $$('projectStatusOK').enable();
        } else {
            $$('codeCriteria').enable();
            $$('codeSearch').enable();
            $$('descCriteria').enable();
            $$('descSearch').enable();
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

    $$('searchTypeGrp').onChange(() => {
        if ($$('searchTypeGrp').getValue() === 'false') {
            Component.SearchProjectStatus.searchProjectStatusGrid.clear();
            toggleControls(true);
            changeCount(0);
        } else {
            toggleControls(false);
        }
    });

    Component.SearchProjectStatus.searchProjectStatusGrid.setOnSelectionChanged(() => {
        //  Remember.  This is a Grid and not an AGGrid.
        const grid = Component.SearchProjectStatus.searchProjectStatusGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('projectStatusOK').enable(rows);
    });

    Component.SearchProjectStatus.searchProjectStatusGrid.setOnRowDoubleClicked(ok);

    $$('searchStatusReset').onclick(reset);

    $$('searchStatusSearch').onclick(async () => {
        let inParams = {
            code: $$('codeSearch').getValue(),
            codeSearchType: $$('codeCriteria').getValue(),
            description: $$('descSearch').getValue(),
            descriptionSearchType: $$('descCriteria').getValue(),
        };

        let data = await AWS.callSoap('StandardHrHrEmployee', 'searchProjectStatuses', inParams);
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