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
    const WS = 'StandardMiscCompanySearch';

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });

    let companiesGrid;

    const companiesColumnDefs = [
        {headerName: "Name", field: "companyName", width: 400},
        {headerName: "ID", field: "companyIdentifier", width: 200},
        {headerName: "Phone", field: "companyPhone", width: 200},
        {headerName: "Contact Last Name", field: "companyContactLastName", width: 200},
        {headerName: "Contact First Name", field: "companyContactFirstName", width: 200},
        {headerName: "Contact Phone", field: "companyContactPhone", width: 200}
    ];

    companiesGrid = new AGGrid('companiesGrid', companiesColumnDefs);

    companiesGrid.show();

    function searchCompany() {
        const params = {
            id: $$('id-search').getValue(),
            idSearchType: $$('id-criteria').getValue(),
            mainContactFirstName: $$('pcfName-search').getValue(),
            mainContactFirstNameSearchType: $$('pcfName-criteria').getValue(),
            mainContactLastName: $$('pclName-search').getValue(),
            mainContactLastNameSearchType: $$('pclName-criteria').getValue(),
            name: $$('name-search').getValue(),
            nameSearchType: $$('name-criteria').getValue(),
            sortAsc: false,
            sortOn: '',
        }

        AWS.callSoap(WS, 'searchCompany', params).then(data => {
            companiesGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                companiesGrid.addRecords(data.item);     
                companiesGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                companiesGrid.setOnRowDoubleClicked(edit);
                $$('companies-label').setValue('Displaying ' + data.item.length + ' Companies');
            }     
        });
    }
    
    bindToEnum('name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('id-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('pcfName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('pclName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    $$('search').onclick(searchCompany);
    $$('reset').onclick(() => {
        $$('name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('name-search').clear();

        $$('id-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('id-search').clear();

        $$('pcfName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('pcfName-search').clear();

        $$('pclName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('pclName-search').clear();

        $$('reset').enable();
        $$('search').enable();

        companiesGrid.clear();
        $$('companies-label').setValue(`Displaying 0 Companies`);
    });

    $$('add').onclick(() => {
        const searchGLAccounts = (selectUsingType) => {
            let formSearchGrid;
            
            Utils.popup_open('GLAccount-search');
                
            const reset = () => {
                $$('GLAccount-number-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('GLAccount-number-search').clear();

                $$('GLAccount-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('GLAccount-name-search').clear();
    
                $$('GLAccount-reset').enable();
                $$('GLAccount-search').enable();
    
                $$('GLAccount-ok').disable();
    
                formSearchGrid.clear();
                $$('GLAccount-count').setValue(`Displaying 0 GL Accounts`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('csp-account' + selectUsingType).setValue(row.id, row.accountName);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('GLAccount-number-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('GLAccount-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                const columnDefs = [
                    {headerName: 'Number', field: 'accountNumber', width: 70},
                    {headerName: 'Name', field: 'accountName', width: 80},
                    {headerName: 'Type', field: 'accountTypeFormatted', width: 90},
                ];
    
                formSearchGrid = new AGGrid('GLAccount-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    accountName: '',
                    accountNameSearchType: 0,
                    accountNumber: '',
                    accountNumberSearchType: 0,
                    selectUsingCompanyId: '',
                    selectUsingType: selectUsingType,
                    showOnlyARAccounts: selectUsingType !== 3
                };
    
                AWS.callSoap(WS, 'searchGLAccounts', inParams).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('GLAccount-count').setValue(`Displaying ${records.length} GL Accounts`);
                        } else {
                            $$('GLAccount-count').setValue(`Displaying 0 GL Accounts`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('GLAccount-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                })
            };
    
            $$('GLAccount-reset').onclick(reset);
            $$('GLAccount-search').onclick(search);
            $$('GLAccount-ok').onclick(ok);
            $$('GLAccount-cancel').onclick(cancel);
    
            search();
        };
        const container = new TabContainer('cs-tab-container');

        $$('company-popup-label').setValue('Add');

        for (let i = 1; i < 4; i++) {
            const GLAParams = {
                accountName: '',
                accountNameSearchType: 0,
                accountNumber: '',
                accountNumberSearchType: 0,
                selectUsingCompanyId: '',
                selectUsingType: i,
                showOnlyARAccounts: i !== 3
            }                
            $$('csp-account' + i).clear().add('', '(choose)');
            AWS.callSoap(WS, "searchGLAccounts", GLAParams).then(function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('csp-account' + i);
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length === 1) {
                        ctl.setValue(res.item[0].id, res.item[0].accountName)
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].id, res.item[i].accountName);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchGLAccounts(i);
                    });
                }
            });
        }
        AWS.callSoap(WS, "loadDefaultBillingRate").then(function (res) {
            if (res.wsStatus === '0') {
                $$('csp-defaultbillingRate').setValue(res.defaultBillingRateFormatted);
            }
        });                     
        Utils.popup_open('company-popup');
        
        $$('cs-companyName').onChange(() => {
            if ($$('cs-companyName').getValue() === 'C') {
                $$('csp-account1').disable().setValue('');
            } else {
                $$('csp-account1').enable();
            }
        });
        $$('cs-ok').onclick(() => {
            if ($$('cs-companyName').isError('Company Name')) {
                return;
            }
            const params = {
               accountingBasis: $$('csp-accountingType').getValue(),
               accrualsUseTimeOffRequest: $$('csp-timeOffAutoAccrual').getValue(),
               addressLine1: $$('csp-address').getValue(),
               addressLine2: $$('csp-address2').getValue(),
               arahantUrl: $$('csp-arahantUrl').getValue(),
               billingRate: $$('csp-billingRate').getValue(),
               city: $$('csp-city').getValue(),
               country: $$('csp-country').getValue(),
               county: $$('csp-county').getValue(),
               dunBradstreet: $$('csp-dunBradstreetNumber').getValue(),
               eeoCompanyNumber: $$('csp-eeo1CompanyNumber').getValue(),
               eeoUnitNumber: $$('csp-eeo1UnitNumber').getValue(),
               externalId: $$('cs-membershipId').getValue(),
               federalEmployerId: $$('csp-federalEmployerId').getValue(),
               glCashAccountId: $$('csp-account3').getValue(),
               glEmployeeAdvanceAccountId: $$('csp-account2').getValue(),
               mainFaxNumber: $$('csp-fax').getValue(),
               mainPhoneNumber: $$('csp-phone').getValue(),
               naics: $$('csp-naicsCode').getValue(),
               name: $$('cs-companyName').getValue(),
               stateProvince: $$('csp-state').getValue(),
               zipPostalCode: $$('csp-zip').getValue(),
            }

            if ($$('csp-accountingType').getValue() === 'A') {
                params.glARAccountId = $$('csp-account1').getValue();
            }

            AWS.callSoap(WS, "newCompany", params).then(data => {
                if (data.wsStatus === '0') {
                    searchCompany();
                }
            });     
        });

        $$('cs-cancel').onclick(Utils.popup_close);
    });
    function edit() {
        const searchGLAccounts = (selectUsingType) => {
            let formSearchGrid;
            
            Utils.popup_open('GLAccount-search');
                
            const reset = () => {
                $$('GLAccount-number-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('GLAccount-number-search').clear();

                $$('GLAccount-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('GLAccount-name-search').clear();
    
                $$('GLAccount-reset').enable();
                $$('GLAccount-search').enable();
    
                $$('GLAccount-ok').disable();
    
                formSearchGrid.clear();
                $$('GLAccount-count').setValue(`Displaying 0 GL Accounts`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('csp-account' + selectUsingType).setValue(row.id, row.accountName);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('GLAccount-number-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('GLAccount-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                const columnDefs = [
                    {headerName: 'Number', field: 'accountNumber', width: 70},
                    {headerName: 'Name', field: 'accountName', width: 80},
                    {headerName: 'Type', field: 'accountTypeFormatted', width: 90},
                ];
    
                formSearchGrid = new AGGrid('GLAccount-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    accountName: '',
                    accountNameSearchType: 0,
                    accountNumber: '',
                    accountNumberSearchType: 0,
                    selectUsingCompanyId: '',
                    selectUsingType: selectUsingType,
                    showOnlyARAccounts: selectUsingType !== 3
                };
    
                AWS.callSoap(WS, 'searchGLAccounts', inParams).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('GLAccount-count').setValue(`Displaying ${records.length} GL Accounts`);
                        } else {
                            $$('GLAccount-count').setValue(`Displaying 0 GL Accounts`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('GLAccount-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                })
            };
    
            $$('GLAccount-reset').onclick(reset);
            $$('GLAccount-search').onclick(search);
            $$('GLAccount-ok').onclick(ok);
            $$('GLAccount-cancel').onclick(cancel);
    
            search();
        };
        const row = companiesGrid.getSelectedRow();
        const container = new TabContainer('cs-tab-container');

        $$('company-popup-label').setValue('Edit');

        $$('cs-companyName').onChange(() => {
            if ($$('cs-companyName').getValue() === 'C') {
                $$('csp-account1').disable().setValue('');
            } else {
                $$('csp-account1').enable();
            }
        });
        
        for (let i = 1; i < 4; i++) {
            const GLAParams = {
                accountName: '',
                accountNameSearchType: 0,
                accountNumber: '',
                accountNumberSearchType: 0,
                selectUsingCompanyId: '',
                selectUsingType: i,
                showOnlyARAccounts: i !== 3
            }                
            $$('csp-account' + i).clear().add('', '(choose)')
            AWS.callSoap(WS, "searchGLAccounts", GLAParams).then(function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('csp-account' + i);
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length === 1) {
                        ctl.setValue(res.item[0].id, res.item[0].accountName)
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].id, res.item[i].accountName);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchGLAccounts(i);
                    });
                }
            });
        }
        const companyId = {
            companyId: row.companyId
        }
        AWS.callSoap(WS, "loadCompany", companyId).then((data) => {
            if (data.wsStatus === '0') {
                $$('csp-accountingType').setValue(data.accountingBasis);
                $$('csp-timeOffAutoAccrual').setValue(data.accrualsUseTimeOffRequest);
                $$('csp-address').setValue(data.addressLine1);
                $$('csp-address2').setValue(data.addressLine2);
                $$('csp-arahantUrl').setValue(data.arahantUrl);
                $$('csp-billingRate').setValue(data.billingRate);
                $$('csp-city').setValue(data.city);
                $$('csp-country').setValue(data.country);
                $$('csp-county').setValue(data.county);
                $$('csp-dunBradstreetNumber').setValue(data.dunBradstreet);
                $$('csp-eeo1CompanyNumber').setValue(data.eeoCompanyNumber);
                $$('csp-eeo1UnitNumber').setValue(data.eeoUnitNumber);
                $$('cs-membershipId').setValue(data.externalId);
                $$('csp-federalEmployerId').setValue(data.federalEmployerId);
                data.accountingBasis === 'C' ? $$('csp-account1').disable().setValue('') : $$('csp-account1').enable().setValue(data.glARAccountId);
                $$('csp-account3').setValue(data.glCashAccountId);
                $$('csp-account2').setValue(data.glEmployeeAdvanceAccountId);
                $$('csp-fax').setValue(data.mainFaxNumber);
                $$('csp-phone').setValue(data.mainPhoneNumber);
                $$('csp-naicsCode').setValue(data.naics);
                $$('cs-companyName').setValue(data.name);
                $$('csp-state').setValue(data.stateProvince);
                $$('csp-zip').setValue(data.zipPostalCode);
                $$('csp-defaultbillingRate').setValue(data.defaultBillingRateFormatted);
            }
        });                     
        Utils.popup_open('company-popup');

        $$('cs-ok').onclick(() => {
            if ($$('cs-companyName').isError('Company Name')) {
                return;
            }
            const params = {
                accountingBasis: $$('csp-accountingType').getValue(),
                accrualsUseTimeOffRequest: $$('csp-timeOffAutoAccrual').getValue(),
                addressLine1: $$('csp-address').getValue(),
                addressLine2: $$('csp-address2').getValue(),
                arahantUrl: $$('csp-arahantUrl').getValue(),
                billingRate: $$('csp-billingRate').getValue(),
                city: $$('csp-city').getValue(),
                country: $$('csp-country').getValue(),
                county: $$('csp-county').getValue(),
                dunBradstreet: $$('csp-dunBradstreetNumber').getValue(),
                eeoCompanyNumber: $$('csp-eeo1CompanyNumber').getValue(),
                eeoUnitNumber: $$('csp-eeo1UnitNumber').getValue(),
                externalId: $$('cs-membershipId').getValue(),
                federalEmployerId: $$('csp-federalEmployerId').getValue(),                
                glCashAccountId: $$('csp-account3').getValue(),
                glEmployeeAdvanceAccountId: $$('csp-account2').getValue(),
                mainFaxNumber: $$('csp-fax').getValue(),
                mainPhoneNumber: $$('csp-phone').getValue(),
                naics: $$('csp-naicsCode').getValue(),
                name: $$('cs-companyName').getValue(),
                stateProvince: $$('csp-state').getValue(),
                zipPostalCode: $$('csp-zip').getValue(),
            }

            if ($$('csp-accountingType').getValue() === 'A') {
                params.glARAccountId = $$('csp-account1').getValue();
            }

            AWS.callSoap(WS, "saveCompany", params).then(data => {
                if (data.wsStatus === '0') {
                    searchCompany();
                }
            });     
        });

        $$('cs-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Company?', () => {
            const row = companiesGrid.getSelectedRow();
            const data = {
                companyIds: row.companyId
            };
            AWS.callSoap(WS, 'deleteCompany', data).then(function (res) {
                if (res.wsStatus === "0") {
                    searchCompany();
                }
            });
        });
    });
})();
