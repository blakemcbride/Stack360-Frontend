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

Component.SearchProjectType = {};

Component.SearchProjectType.run = () => {

    Component.SearchProjectType.searchProjectTypeGrid = null;

    let reset = () => {
        $$('projectTypeSearchTypeGrp').setValue('true');

        $$('projectTypeCodeCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('projectTypeCodeCriteria').enable();
        $$('projectTypeCodeSearch').clear();
        $$('projectTypeCodeSearch').enable();

        $$('projectTypeDescCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('projectTypeDescCriteria').enable();
        $$('projectTypeDescSearch').clear();
        $$('projectTypeDescSearch').enable();

        $$('searchTypeReset').enable();
        $$('searchTypeSearch').enable();

        $$('projectTypeOK').disable();

        Component.SearchProjectType.searchProjectTypeGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('typeCount', `Displaying ${count} Project Types`);
    };

    let ok = () => {
        let type = Component.SearchProjectType.searchProjectTypeGrid.getSelectedNodes()[0];

        if (!type)
            type = null;

        reset();
        Component.SearchProjectType.searchProjectTypeGrid.destroy();
        Utils.popup_close1('projectTypeSelection', type);
    };

    let cancel = () => {
        reset();
        Component.SearchProjectType.searchProjectTypeGrid.destroy();
        Utils.popup_close1('projectTypeSelection');
    };

    // Setup drop downs.
    bindToEnum('projectTypeCodeCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('projectTypeDescCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: 'Project Type ID', field: 'projectTypeId', hide: true},
            {headerName: 'Code', field: 'code', maxWidth: 125},
            {headerName: 'Description', field: 'description'}
        ];

        Component.SearchProjectType.searchProjectTypeGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.SearchProjectType.searchProjectTypeGrid.build('searchTypeResultsGrid');
    };

    let toggleControls = disabled => {
        if (disabled) {
            $$('projectTypeCodeCriteria').disable();
            $$('projectTypeCodeSearch').disable();
            $$('projectTypeDescCriteria').disable();
            $$('projectTypeDescSearch').disable();
            $$('searchTypeReset').disable();
            $$('searchTypeSearch').disable();

            $$('projectTypeOK').enable();
        } else {
            $$('projectTypeCodeCriteria').enable();
            $$('projectTypeCodeSearch').enable();
            $$('projectTypeDescCriteria').enable();
            $$('projectTypeDescSearch').enable();
            $$('searchTypeReset').enable();
            $$('searchTypeSearch').enable();

            $$('projectTypeOK').disable();
        }
    };

    if (!Component.SearchProjectType.searchProjectTypeGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchProjectType.searchProjectTypeGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    $$('projectTypeSearchTypeGrp').onChange(() => {
        if ($$('projectTypeSearchTypeGrp').getValue() === 'false') {
            Component.SearchProjectType.searchProjectTypeGrid.clear();
            toggleControls(true);
            changeCount(0);
        } else {
            toggleControls(false);
        }
    });

    Component.SearchProjectType.searchProjectTypeGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.SearchProjectType.searchProjectTypeGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('projectTypeOK').enable(rows);
    });

    Component.SearchProjectType.searchProjectTypeGrid.setOnRowDoubleClicked(ok);

    $$('searchTypeReset').onclick(reset);

    $$('searchTypeSearch').onclick(async () => {
        let inParams = {
            code: $$('projectTypeCodeSearch').getValue(),
            projectTypeCodeSearchType: $$('projectTypeCodeCriteria').getValue(),
            description: $$('projectTypeDescSearch').getValue(),
            descriptionSearchType: $$('projectTypeDescCriteria').getValue(),
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchProjectTypes', inParams);

        // Clear the grid.
        Component.SearchProjectType.searchProjectTypeGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.SearchProjectType.searchProjectTypeGrid.addRecords(records);

            let count = Utils.assureArray(data.item).length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('projectTypeOK').onclick(ok);

    $$('projectTypeCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};