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

(async function () {
    const WS = 'StandardMiscInterfaceLog';

    const orgGroupParams = {
        id: '',
        name: '',
        nameSearchType: 0,
        projectId: ''
    }
    AWS.callSoap(WS, 'searchCompanyByType', orgGroupParams).then(res => {
        if (res.wsStatus === "0") {
            res.companies = Utils.assureArray(res.companies);
            const ctl = $$('il-orgGroupId');
            ctl.clear();
            if (res.companies.length === 0) {
                ctl.nothingToSelect();
            } else if (res.companies.length === 1) {
                ctl.setValue(res.companies[0].orgGroupId, res.companies[0].name)
            } else if (res.companies.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.companies.length; i++)
                    ctl.add(res.companies[i].orgGroupId, res.companies[i].name);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.onChange(getListInterfaceLogs);
            ctl.setSelectFunction(() => {
                searchCompany();
            });
        }
    });

    const searchCompany = () => {
        let formSearchGrid;
        
        Utils.popup_open('company-search');
            
        const reset = () => {
            $$('csp-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('csp-name-search').clear();

            $$('csp-reset').enable();
            $$('csp-search').enable();

            $$('csp-ok').disable();

            formSearchGrid.clear();
            $$('csp-count').setValue(`Displaying 0 Companies`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('il-orgGroupId').setValue(row.orgGroupId, row.name);
                getListInterfaceLogs();
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('csp-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Company Name', field: 'name', width: 160},
                {headerName: 'Type', field: 'orgGroupTypeName', width: 80},
            ];

            formSearchGrid = new AGGrid('csp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const inParams = {
                id: '',
                name: $$('csp-name-search').getValue(),
                nameSearchType: $$('csp-name-criteria').getValue(),
                projectId: ''
            };

            AWS.callSoap(WS, 'searchCompanyByType', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.companies) {
                        const records = Utils.assureArray(data.companies);
                        formSearchGrid.addRecords(records);
                        $$('csp-count').setValue(`Displaying ${records.length} Companies`);
                    } else {
                        $$('csp-count').setValue(`Displaying 0 Companies`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('csp-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            })
        };

        $$('csp-reset').onclick(reset);
        $$('csp-search').onclick(search);
        $$('csp-ok').onclick(ok);
        $$('csp-cancel').onclick(cancel);

        search();
    };

    let interfaceLogsGrid;

    const interfaceLogsColumnDefs = [
        {headerName: "Run Date", field: "runDateFormatted", type: 'numericColumn', width: 200},
        {headerName: "Company", field: "companyName", width: 200},
        {headerName: "Interface", field: "interface", width: 200},
        {headerName: "Status Code", field: "status", width: 200},
        {headerName: "Status Message", field: "message", width: 400}
    ];

    interfaceLogsGrid = new AGGrid('interfaceLogsGrid', interfaceLogsColumnDefs);

    interfaceLogsGrid.show();

    function getListInterfaceLogs() {
        const params = {
            companyId: $$('il-orgGroupId').getValue()
        }

        AWS.callSoap(WS, 'listInterfaceLogs', params).then(data => {
            interfaceLogsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                interfaceLogsGrid.addRecords(data.item);     
                $$('interfaceLogs-label').setValue('Displaying ' + data.item.length + ' Interface Logs');
            }     
        });
    }

    getListInterfaceLogs();
})();
