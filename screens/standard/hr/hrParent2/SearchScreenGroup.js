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

Component.SearchScreenGroup = {};

Component.SearchScreenGroup.run = () => {

    Component.SearchScreenGroup.searchScreenGroupGrid = null;

    let reset = () => {
        $$('screenGroupNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('screenGroupNameSearch').clear();

        $$('screenGroupIdSearch').clear();

        $$('screenGroupIncludeGrp').setValue('true');

        $$('searchScreenGroupOK').disable();

        Component.SearchScreenGroup.searchScreenGroupGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('scrGrpCount', `Displaying ${count} Screen Groups`);
    };

    let ok = () => {
        let screenGroup = Component.SearchScreenGroup.searchScreenGroupGrid.getSelectedNodes()[0];

        if (!screenGroup)
            screenGroup = null;

        reset();
        Component.SearchScreenGroup.searchScreenGroupGrid.destroy();
        Utils.popup_close1('screenGroupSelection', screenGroup);
    };

    let cancel = () => {
        reset();
        Component.SearchScreenGroup.searchScreenGroupGrid.destroy();
        Utils.popup_close1('screenGroupSelection');
    };

    // Setup drop downs.
    bindToEnum('screenGroupNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: 'Screen Group ID', field: 'id', hide: true},
            {headerName: 'Screen Group Name', field: 'title'},
            {headerName: 'ID', field: 'extId', maxWidth: 100},
            {headerName: '?', field: 'help', maxWidth: 35}
        ];

        Component.SearchScreenGroup.searchScreenGroupGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.SearchScreenGroup.searchScreenGroupGrid.build('searchScreenGroupsResultsGrid');
    };

    if (!Component.SearchScreenGroup.searchScreenGroupGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchScreenGroup.searchScreenGroupGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    Component.SearchScreenGroup.searchScreenGroupGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.SearchScreenGroup.searchScreenGroupGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('searchScreenGroupOK').enable(rows);
    });

    Component.SearchScreenGroup.searchScreenGroupGrid.setOnRowDoubleClicked(ok);

    $$('searchScreenGroupReset').onclick(reset);

    $$('searchScreenGroupSearch').onclick(async () => {
        let inParams = {
            extId: $$('screenGroupIdSearch').getValue(),
            name: $$('screenGroupNameSearch').getValue(),
            screenGroupNameSearchType: $$('screenGroupNameCriteria').getValue(),
            searchTopLevelOnly: $$('screenGroupIncludeGrp').getValue()
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchScreenGroups', inParams);

        // Clear the grid.
        Component.SearchScreenGroup.searchScreenGroupGrid.clear();

        if (data.screenDef) {
            let records = Utils.assureArray(data.screenDef);
            Component.SearchScreenGroup.searchScreenGroupGrid.addRecords(records);

            let count = Utils.assureArray(data.screenDef).length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('searchScreenGroupOK').onclick(ok);

    $$('searchScreenGroupCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};