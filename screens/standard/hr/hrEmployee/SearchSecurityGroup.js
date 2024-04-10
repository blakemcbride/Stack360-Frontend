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

Component.SearchSecurityGroup = {};

Component.SearchSecurityGroup.run = () => {

    Component.SearchSecurityGroup.searchSecurityGroupGrid = null;

    let reset = () => {
        $$('securityGroupNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('securityGroupNameSearch').clear();

        $$('searchSecurityGroupOK').disable();

        Component.SearchSecurityGroup.searchSecurityGroupGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('secGrpCount', `Displaying ${count} Security Groups`);
    };

    let ok = () => {
        let securityGroup = Component.SearchSecurityGroup.searchSecurityGroupGrid.getSelectedNodes()[0];

        if (!securityGroup)
            securityGroup = null;

        reset();
        Component.SearchSecurityGroup.searchSecurityGroupGrid.destroy();
        Utils.popup_close1('securityGroupSelection', securityGroup)
    };

    let cancel = () => {
        reset();
        Component.SearchSecurityGroup.searchSecurityGroupGrid.destroy();
        Utils.popup_close1('securityGroupSelection');
    };

    // Setup drop downs.
    bindToEnum('securityGroupNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: 'Security Group ID', field: 'groupId', hide: true},
            {headerName: 'Security Group Name', field: 'name'}
        ];

        Component.SearchSecurityGroup.searchSecurityGroupGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.SearchSecurityGroup.searchSecurityGroupGrid.build('searchSecurityGroupsResultsGrid');
    };

    if (!Component.SearchSecurityGroup.searchSecurityGroupGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchSecurityGroup.searchSecurityGroupGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    Component.SearchSecurityGroup.searchSecurityGroupGrid.setOnSelectionChanged(() => {
        //  Remember.  This is a Grid and not an AGGrid.
        const grid = Component.SearchSecurityGroup.searchSecurityGroupGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('searchSecurityGroupOK').enable(rows);
    });

    Component.SearchSecurityGroup.searchSecurityGroupGrid.setOnRowDoubleClicked(ok);

    $$('searchSecurityGroupReset').onclick(reset);

    $$('searchSecurityGroupSearch').onclick(async () => {
        let inParams = {
            name: $$('securityGroupNameSearch').getValue(),
            securityGroupNameSearchType: $$('securityGroupNameCriteria').getValue()
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchSecurityGroups', inParams);
        // Clear the grid.
        Component.SearchSecurityGroup.searchSecurityGroupGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.SearchSecurityGroup.searchSecurityGroupGrid.addRecords(records);

            let count = Utils.assureArray(data.item).length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('searchSecurityGroupOK').onclick(ok);

    $$('searchSecurityGroupCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};