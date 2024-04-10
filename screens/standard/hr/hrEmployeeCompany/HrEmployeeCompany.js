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
    const WS = 'StandardHrHrEmployeeCompany';

    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);

    $$('worker-name').setValue(personName);

    let companiesGrid;

    const companiesColumnDefs = [
        {headerName: "Company Name", field: "companyName", width: 300},
        {headerName: "Company Id", field: "companyExternalId", width: 200},
        {headerName: "Company Phone", field: "companyPhone", width: 250},
        {headerName: "Company Address", field: "companyAddress", width: 600}
    ];
    companiesGrid = new AGGrid('companiesGrid', companiesColumnDefs);
    companiesGrid.multiSelect();
    companiesGrid.show();

    function getListAssCompanies() {
        const params = {
            employeeId: personId
        }
        AWS.callSoap(WS, 'listAssCompanies', params).then(data => {
            companiesGrid.clear();
            $$('disassociate').disable();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                companiesGrid.addRecords(data.item);

                $$('status-label').setValue('Displaying ' + data.item.length + ' Companies');

                companiesGrid.setOnSelectionChanged((x) => {
                    $$('disassociate').enable(x);
                });
            }
        });
    }
    getListAssCompanies();

    function searchCompanies() {
        let formSearchGrid;
        Utils.popup_open('company-search');

        const reset = () => {
            $$('companyName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('companyName-search').clear();

            $$('reset').enable();
            $$('search').enable();

            $$('searchOk').disable();

            formSearchGrid.clear();
            $$('companies-count').setValue(`Displaying 0 Companies`);
        };

        const ok = () => {    
            addStatusForNewCompany(formSearchGrid.getSelectedRow().companyId);
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('companyName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                {headerName: 'Company Name', field: 'companyName', width: 140},
                {headerName: 'ID', field: 'companyExternalId', width: 70},
            ];

            formSearchGrid = new AGGrid('searchResultsGrid', columnDefs);
            formSearchGrid.show();
        };

        initDataGrid();

        reset();
        const search = () => {
            const params = {
                employeeId: personId,
                name: $$('companyName-search').getValue(),
                nameSearchType: $$('companyName-criteria').getValue()
            }
            AWS.callSoap(WS, 'searchCompanies', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('companies-count').setValue(`Displaying ${records.length} Companies`);
                    } else {
                        $$('companies-count').setValue(`Displaying 0 Companies`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('searchOk').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });           
        };

        $$('reset').onclick(reset);
        $$('search').onclick(search);
        $$('searchOk').onclick(ok);
        $$('searchCancel').onclick(cancel);
        search();
    }

    function addStatusForNewCompany(selectedCompany) {
        if (selectedCompany !== undefined) {
            if (selectedCompany === '') {
                Utils.popup_close();
            } else {
                $$('statusId').clear().add('', '(choose)');
                $$('notes').clear();
                $$('effectiveDate').clear();
    
                const params = {
                    companyId: selectedCompany
                };
                AWS.callSoap(WS, 'listEmployeeStatuses', params).then(data => {
                    if (data.wsStatus === "0") {
                        for (let i = 0 ; i < data.item.length; i++) {
                            $$('statusId').add(data.item[i].employeeStatusId, data.item[i].name);
                        }
                    }
                });
                
                Utils.popup_open('addStatus-popup');
    
                $$('addStatusOk').onclick(() => {
                    if ($$('statusId').isError('Status Id'))
                        return;
                    if ($$('effectiveDate').isError('Effective Date'))
                        return;
    
                    const params = {
                        agencyId: '',
                        companyId: selectedCompany,
                        companyStatus: $$('statusId').getValue(),
                        companyStatusDate: $$('effectiveDate').getIntValue(),
                        companyStatusNote: $$('notes').getValue(),
                        employeeId: personId
                    }
    
                    AWS.callSoap(WS, 'addCompanyToEmployee', params).then(data => {
                        if (data.wsStatus === "0") {
                            getListAssCompanies();
                            Utils.popup_close();
                            Utils.popup_close();
                        }
                    });
                });
                $$('addStatusCancel').onclick(() => {
                    Utils.popup_close();
                    Utils.popup_close();
                });
            }        
        }
    }
    $$('associate').onclick(searchCompanies);
    $$('disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to disassociate the selected Company?', () => {
            const rows = companiesGrid.getSelectedRows();
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                ids.push(rows[i].companyId);
            }
            const params = {
                ids: ids,
                employeeId: personId
            };
            AWS.callSoap(WS, "removeCompaniesFromEmployee", params).then(data => {
                if (data.wsStatus === '0') {
                    getListAssCompanies();
                }
            });
        });
    });
})();
