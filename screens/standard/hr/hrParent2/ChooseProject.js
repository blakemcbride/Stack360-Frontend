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

Component.ChooseProject = {};

Component.ChooseProject.run = async () => {

    Component.ChooseProject.chooseProjectGrid = null;

    let reset = () => {
        $$('projectChooseTypeGrp').setValue('false');

        $$('projectIdCriteria').setValue(StringCriteriaMatcher.EXACT_MATCH.value);
        $$('projectIdCriteria').enable();
        $$('projectIdSearch').clear();
        $$('projectIdSearch').enable();

        $$('projectSummaryCriteria').setValue(StringCriteriaMatcher.CONTAINS.value);
        $$('projectSummaryCriteria').enable();
        $$('projectSummarySearch').clear();
        $$('projectSummarySearch').enable();

        $$('projectCompanyCriteria').setValue('');
        $$('projectCategoryCriteria').setValue('');
        $$('projectTypeCriteria').setValue('');
        $$('projectStatusCriteria').setValue('');

        $$('chooseProjectReset').enable();
        $$('chooseProjectSearch').enable();

        $$('chooseProjectOK').disable();

        Component.ChooseProject.chooseProjectGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('projCount', `Displaying ${count} Projects`);
    };

    let ok = () => {
        let project = Component.ChooseProject.chooseProjectGrid.getSelectedNodes()[0];

        if (!project)
            project = null;

        reset();
        Component.ChooseProject.chooseProjectGrid.destroy();
        Utils.popup_close1('projectSelection', project);
    };

    let cancel = () => {
        reset();
        Component.ChooseProject.chooseProjectGrid.destroy();
        Utils.popup_close1('projectSelection');
    };

    // Setup drop downs.
    bindToEnum('projectIdCriteria', StringCriteriaMatcher, StringCriteriaMatcher.EXACT_MATCH);
    bindToEnum('projectSummaryCriteria', StringCriteriaMatcher, StringCriteriaMatcher.CONTAINS);

    let loadData = async () => {
        let data = await AWS.callSoap('StandardHrHrParent', 'searchCompany');
        data.item.forEach(company => $$('projectCompanyCriteria').add(company.companyId, company.name, company));

        data = await AWS.callSoap('StandardHrHrParent', 'searchProjectCategories');
        data.item.forEach(category => $$('projectCategoryCriteria').add(category.projectCategoryId, category.code, category));

        data = await AWS.callSoap('StandardHrHrParent', 'searchProjectTypes');
        data.item.forEach(type => $$('projectTypeCriteria').add(type.projectTypeId, type.code, type));

        data = await AWS.callSoap('StandardHrHrParent', 'searchProjectStatuses');
        data.item.forEach(status => $$('projectStatusCriteria').add(status.projectStatusId, status.code, status));
    };

    let initDataGrid = () => {
        // Setup data grid.
        let columnDefs = [
            {headerName: '', field: 'projectId', hide: true},
            {headerName: 'ID', field: 'projectName', maxWidth: 75},
            {headerName: 'Summary', field: 'description'},
            {headerName: 'Requesting Company', field: 'requestingCompanyName', maxWidth: 150},
            {headerName: 'Category Code', field: 'projectCategoryCode', maxWidth: 115},
            {headerName: 'Type Code', field: 'projectTypeCode', maxWidth: 115},
            {headerName: 'Status Code', field: 'projectStatusCode', maxWidth: 100},
            {headerName: '', field: 'projectSponsorName', hide: true},
            {headerName: '', field: 'billable', hide: true},
            {headerName: '', field: 'externalReference', hide: true}
        ];

        Component.ChooseProject.chooseProjectGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
        Component.ChooseProject.chooseProjectGrid.build('chooseProjectResultsGrid');
    };

    let toggleControls = disabled => {
        if (disabled) {
            $$('projectIdCriteria').disable();
            $$('projectIdSearch').disable();
            $$('projectSummaryCriteria').disable();
            $$('projectSummarySearch').disable();
            $$('chooseProjectReset').disable();
            $$('chooseProjectSearch').disable();

            $$('chooseProjectOK').enable();
        } else {
            $$('projectIdCriteria').enable();
            $$('projectIdSearch').enable();
            $$('projectSummaryCriteria').enable();
            $$('projectSummarySearch').enable();
            $$('chooseProjectReset').enable();
            $$('chooseProjectSearch').enable();

            $$('chooseProjectOK').disable();
        }
    };

    if (!Component.ChooseProject.chooseProjectGrid) {
        $$('projectCompanyCriteria').clear();
        $$('projectCompanyCriteria').add('', '(choose)');

        $$('projectCategoryCriteria').clear();
        $$('projectCategoryCriteria').add('', '(choose)');

        $$('projectTypeCriteria').clear();
        $$('projectTypeCriteria').add('', '(choose)');

        $$('projectStatusCriteria').clear();
        $$('projectStatusCriteria').add('', '(choose)');

        initDataGrid();
    }

    // Fit the columns to the grid.
    Component.ChooseProject.chooseProjectGrid.sizeColumnsToFit();

    loadData();

    //==========================================================================================================
    // Event handlers start.
    //==========================================================================================================

    $$('projectChooseTypeGrp').onChange(async () => {
        if ($$('projectChooseTypeGrp').getValue() === 'true') {
            Component.ChooseProject.chooseProjectGrid.clear();
            changeCount(0);

            toggleControls(true);
        } else {
            toggleControls(false);
        }
    });

    Component.ChooseProject.chooseProjectGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = Component.ChooseProject.chooseProjectGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('chooseProjectOK').enable(rows);
    });

    Component.ChooseProject.chooseProjectGrid.setOnRowDoubleClicked(ok);

    $$('chooseProjectReset').onclick(reset);

    $$('chooseProjectSearch').onclick(async () => {
        let inParams = {
            projectName: $$('projectIdSearch').getValue(),
            projectNameSearchType: $$('projectIdCriteria').getValue(),
            summary: $$('projectSummarySearch').getValue(),
            projectSummarySearchType: $$('projectSummaryCriteria').getValue(),
            category: $$('projectCategoryCriteria').getValue(),
            companyId: $$('projectCompanyCriteria').getValue(),
            personId: '',
            quickList: $$('projectChooseTypeGrp').getValue(),
            status: $$('projectStatusCriteria').getValue(),
            typex: $$('projectTypeCriteria').getValue()
        };

        let data = await AWS.callSoap('StandardHrHrParent', 'searchProjects', inParams);

        // Clear the grid.
        Component.ChooseProject.chooseProjectGrid.clear();

        if (data.item) {
            let records = Utils.assureArray(data.item);
            Component.ChooseProject.chooseProjectGrid.addRecords(records);

            let projCount = Utils.assureArray(data.item).length;
            changeCount(projCount);
        } else {
            changeCount(0);
        }
    });

    $$('projectCompanySearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchCompany', 'companySelection', null);
        if (result && result.data)
            $$('projectCompanyCriteria').setValue(result.data.companyId);
        else if (result === null)
            $$('projectCompanyCriteria').setValue('');
    });

    $$('projectCategorySearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchCategory', 'categorySelection', null);
        if (result && result.data)
            $$('projectCategoryCriteria').setValue(result.data.projectCategoryId);
        else if (result === null)
            $$('projectCategoryCriteria').setValue('');
    });

    $$('projectTypeSearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchProjectType', 'projectTypeSelection', null);
        if (result && result.data)
            $$('projectTypeCriteria').setValue(result.data.projectTypeId);
        else if (result === null)
            $$('projectTypeCriteria').setValue('');
    });

    $$('projectStatusSearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchProjectStatus', 'projectStatusSelection', null);
        if (result)
            $$('projectStatusCriteria').setValue(result.data.projectStatusId);
        else if (result === null)
            $$('projectStatusCriteria').setValue('');
    });

    $$('chooseProjectOK').onclick(ok);

    $$('chooseProjectCancel').onclick(cancel);

    //==========================================================================================================
    // Event handlers end.
    //==========================================================================================================
};
