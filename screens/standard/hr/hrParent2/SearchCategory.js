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

Component.SearchCategory = {};

Component.SearchCategory.run = async () => {

    Component.SearchCategory.searchCategoryGrid = null;

    let reset = () => {
        $$('categorySearchTypeGrp').setValue('true');

        $$('categoryCodeCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('categoryCodeCriteria').enable();
        $$('categoryCodeSearch').clear();
        $$('categoryCodeSearch').enable();

        $$('categoryDescCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('categoryDescCriteria').enable();
        $$('categoryDescSearch').clear();
        $$('categoryDescSearch').enable();

        $$('searchCategoryReset').enable();
        $$('searchCategorySearch').enable();

        $$('categoryOK').disable();

        Component.SearchCategory.searchCategoryGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('catCount', `Displaying ${count} Project Categories`);
    };

    let ok = () => {
        let category = Component.SearchCategory.searchCategoryGrid.getSelectedNodes()[0];

        if (!category)
            category = null;

        reset();
        Component.SearchCategory.searchCategoryGrid.destroy();
        Utils.popup_close1('categorySelection', category);
    };

    let cancel = () => {
        reset();
        Component.SearchCategory.searchCategoryGrid.destroy();
        Utils.popup_close1('categorySelection');
    };

    // Setup drop downs.
    bindToEnum('categoryCodeCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('categoryDescCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: 'Category ID', field: 'projectCategoryId', hide: true},
            {headerName: 'Code', field: 'code', maxWidth: 125},
            {headerName: 'Description', field: 'description'}
        ];

        Component.SearchCategory.searchCategoryGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.SearchCategory.searchCategoryGrid.build('searchCategoryResultsGrid');
    };

    let toggleControls = disabled => {
        if (disabled) {
            $$('categoryCodeCriteria').disable();
            $$('categoryCodeSearch').disable();
            $$('categoryDescCriteria').disable();
            $$('categoryDescSearch').disable();
            $$('searchCategoryReset').disable();
            $$('searchCategorySearch').disable();

            $$('categoryOK').enable();
        } else {
            $$('categoryCodeCriteria').enable();
            $$('categoryCodeSearch').enable();
            $$('categoryDescCriteria').enable();
            $$('categoryDescSearch').enable();
            $$('searchCategoryReset').enable();
            $$('searchCategorySearch').enable();

            $$('categoryOK').disable();
        }
    };

    if (!Component.SearchCategory.searchCategoryGrid)
        initDataGrid();

    // Fit the columns to the grid.
    Component.SearchCategory.searchCategoryGrid.sizeColumnsToFit();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    $$('categorySearchTypeGrp').onChange(() => {
        if ($$('categorySearchTypeGrp').getValue() === 'false') {
            Component.SearchCategory.searchCategoryGrid.clear();
            toggleControls(true);
            changeCount(0);
        } else {
            toggleControls(false);
        }
    });

    Component.SearchCategory.searchCategoryGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.SearchCategory.searchCategoryGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('categoryOK').enable(rows);
    });

    Component.SearchCategory.searchCategoryGrid.setOnRowDoubleClicked(ok);

    $$('searchCategoryReset').onclick(reset);

    $$('searchCategorySearch').onclick(async () => {
        let inParams = {
            code: $$('categoryCodeSearch').getValue(),
            categoryCodeSearchType: $$('categoryCodeCriteria').getValue(),
            description: $$('categoryDescSearch').getValue(),
            descriptionSearchType: $$('categoryDescCriteria').getValue(),
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchProjectCategories', inParams);

        // Clear the grid.
        Component.SearchCategory.searchCategoryGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.SearchCategory.searchCategoryGrid.addRecords(records);

            let count = records.length;
            changeCount(count);
        } else {
            changeCount(0);
        }
    });

    $$('categoryOK').onclick(ok);

    $$('categoryCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};