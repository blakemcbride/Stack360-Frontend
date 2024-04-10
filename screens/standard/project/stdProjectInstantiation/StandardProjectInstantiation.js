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
    const WS = 'StandardProjectStdProjectInstantiation';

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    const searchCompany = () => {
        let formSearchGrid;
        
        Utils.popup_open('spi-data-search');
            
        const reset = () => {
            $$('spi-companyName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('spi-companyName').clear();

            $$('spi-reset').enable();
            $$('spi-search').enable();

            $$('spi-ok').disable();

            formSearchGrid.clear();
            $$('spi-count').setValue(`Displaying 0 Companies`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('spi-clientCompanyId').setValue(row.id, row.name);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('spi-companyName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                {headerName: 'Company Name', field: 'name', width: 470}
            ];

            formSearchGrid = new AGGrid('spi-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const params = {
                name: $$('spi-companyName').getValue(),
                nameSearchType: $$('spi-companyName-criteria').getValue()
            }
            AWS.callSoap(WS, 'searchCompany', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('spi-count').setValue(`Displaying ${records.length} Companies`);
                    } else {
                        $$('spi-count').setValue(`Displaying 0 Companies`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('spi-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });
        };

        $$('spi-reset').onclick(reset);
        $$('spi-search').onclick(search);
        $$('spi-ok').onclick(ok);
        $$('spi-cancel').onclick(cancel);

        search();
    }; 

    const companyParams = {
        name: '',
        nameSearchType: 0
    }
    AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('spi-clientCompanyId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, res.item[i].name);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(() => {
                searchCompany();
            });
        }
    });
    
    let resultsGrid;

    const resultsColumnDefs = [
        {headerName: "Summary", field: "description", width: 1200}
    ];
    resultsGrid = new AGGrid('resultsGrid', resultsColumnDefs);
    resultsGrid.show();

    AWS.callSoap(WS, 'listStandardProjects').then(data => {
        if (data.wsStatus === "0") {
            data.projects = Utils.assureArray(data.projects);
            resultsGrid.addRecords(data.projects);
            $$('spi-status').setValue('Displaying ' + data.projects.length + ' Standard Projects');
            resultsGrid.setOnSelectionChanged($$('create').enable);
            resultsGrid.setOnRowDoubleClicked(create);
        }
    });

    function create() {
        if ($$('spi-clientCompanyId').isError('Requesting Company'))
            return;

        const params = {
            companyId: $$('spi-clientCompanyId').getValue(),
            projectId: resultsGrid.getSelectedRow().projectId
        };
        
        AWS.callSoap(WS, 'createProjectFromStandard', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    }

    $$('create').onclick(create);
})();
