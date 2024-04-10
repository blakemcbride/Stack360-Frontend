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
    const WS = 'StandardMiscCompany';

    const columnDefs = [
        {headerName: 'Company Name', field: 'companyName', width: 60},
        {headerName: 'Address', field: 'address', width: 60},
        {headerName: 'Phone', field: 'phone', width: 25},
        {headerName: 'Fax', field: 'fax', width: 25}
    ];
    const grid = new AGGrid('grid', columnDefs, 'companyId');
    grid.show();

    function updateGrid() {
        grid.clear();
        AWS.callSoap(WS, 'listCompany').then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                $$('delete').disable();
                res.companies = Utils.assureArray(res.companies);
                grid.addRecords(res.companies);
                if (res.companies.length)
                    $$('add').disable();  // only support a single company for now
                else
                    $$('add').enable();
                $$('status').setValue("Displaying " + res.companies.length + " Companies");
            }
        });
    }

    updateGrid();

    $$('add').onclick(() => {
        $$('cdp-title').setValue('Add Company');
        $$('cdp-company-name').clear();
        $$('cdp-address-line-1').clear();
        $$('cdp-address-line-2').clear();
        $$('cdp-country').setValue('US');
        $$('cdp-city').clear();
        $$('cdp-state').setValue('');
        $$('cdp-zip').clear();
        $$('cdp-county').clear();
        $$('cdp-phone').clear();
        $$('cdp-fax').clear();
        $$('cdp-fiscal-beginning-month').clear();
        $$('cdp-billing-rate').clear();
        $$('cdp-default-billing-rate').clear();
        $$('cdp-federal-employer-id').clear();
        $$('cdp-eeo-1-company-number').clear();
        $$('cdp-eeo-1-unit-number').clear();
        $$('cdp-duns-number').clear();
        $$('cdp-naics-code').clear();
        $$('cdp-email-from-address').clear();
        $$('cdp-email-from-name').clear();
        $$('cdp-server-login-username').clear();
        $$('cdp-server-login-password').clear();
        $$('cdp-server-type').setValue('');
        $$('cdp-authentication').setValue('');
        $$('cdp-host-url').clear();
        $$('cdp-port').clear();
        $$('cdp-windows-domain').clear();
        $$('cdp-encryption').setValue('');
        $$('cdp-arahant-url').clear();
        $$('cdp-time-off-auto-accrual').clear();
        $$('cdp-logo').clear();
        $$('cdp-new-logo').clear();
        Utils.popup_open('company-detail-popup', 'cdp-company-name');

        const container = new TabContainer('cdp-tab-container');
        container.selectTab('cdp-address-TabButton');

        let data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            selectUsingCompanyId: null,
            selectUsingType: 1,
            showOnlyARAccounts: true
        };
        AWS.callSoap(WS, 'searchGLAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-ar-account').clear().add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            selectUsingCompanyId: null,
            selectUsingType: 2,
            showOnlyARAccounts: true
        };
        AWS.callSoap(WS, 'searchGLAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-employee-advance-account').clear().add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            selectUsingCompanyId: null,
            selectUsingType: 3,
            showOnlyARAccounts: false
        };
        AWS.callSoap(WS, 'searchGLAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-cash-account').clear().add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        AWS.callSoap(WS, 'loadDefaultBillingRate').then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-default-billing-rate').setValue(res.defaultBillingRateFormatted);
            }
        });

        $$('cdp-clear-logo').onclick(() => {
            $$('cdp-logo').clear();
            $$('cdp-new-logo').clear();
        });

        $$('cdp-ok').onclick(() => {
            if ($$('cdp-company-name').isError('Company Name'))
                return;
            if ($$('cdp-fiscal-beginning-month').isError('Fiscal Beginning Month')) {
                container.selectTab('cdp-accounting-TabButton');
                return;
            }
            if ($$('cdp-accounting-type').isError('Accounting Type')) {
                container.selectTab('cdp-accounting-TabButton');
                return;
            }
            const data = {
                accountingBasis: $$('cdp-accounting-type').getValue(),
                accrualsUseTimeOffRequest: $$('cdp-time-off-auto-accrual').getValue(),
                addressLine1: $$('cdp-address-line-1').getValue(),
                addressLine2: $$('cdp-address-line-2').getValue(),
                arahantUrl: $$('cdp-arahant-url').getValue(),
                billingRate: $$('cdp-billing-rate').getValue(),
                city: $$('cdp-city').getValue(),
                country: $$('cdp-country').getValue(),
                county: $$('cdp-county').getValue(),
                dunBradstreet: $$('cdp-duns-number').getValue(),
                eeoCompanyNumber: $$('cdp-eeo-1-company-number').getValue(),
                eeoUnitNumber: $$('cdp-eeo-1-unit-number').getValue(),
                emailAuthentication: $$('cdp-authentication').getValue(),
                emailDomain: $$('cdp-windows-domain').getValue(),
                emailEncryption: $$('cdp-encryption').getValue(),
                emailFromEmail: $$('cdp-email-from-address').getValue(),
                emailFromName: $$('cdp-email-from-name').getValue(),
                emailHost: $$('cdp-host-url').getValue(),
                emailPort: $$('cdp-port').getValue(),
                emailPw: $$('cdp-server-login-password').getValue(),
                emailType: $$('cdp-server-type').getValue(),
                emailUser: $$('cdp-server-login-username').getValue(),
                federalEmployerId: $$('cdp-federal-employer-id').getValue(),
                fiscalBeginningMonth: $$('cdp-fiscal-beginning-month').getValue(),
                glARAccountId: $$('cdp-ar-account').getValue(),
                glCashAccountId: $$('cdp-cash-account').getValue(),
                glEmployeeAdvanceAccountId: $$('cdp-employee-advance-account').getValue(),
                mainFaxNumber: $$('cdp-fax').getValue(),
                mainPhoneNumber: $$('cdp-phone').getValue(),
                naics: $$('cdp-naics-code').getValue(),
                name: $$('cdp-company-name').getValue(),
                stateProvince: $$('cdp-state').getValue(),
                zipPostalCode: $$('cdp-zip').getValue()
            };
            AWS.callSoap(WS, 'newCompany', data).then(function (res) {
                if (res.wsStatus === "0") {
                    const ctl = $$('cdp-new-logo');
                    if (ctl.numberOfUploadFiles()) {
                        const data = {
                            companyId: res.companyId,
                            source: ctl.uploadFilename(0),
                            extension: ctl.uploadFileExtension(0)
                        };
                        AWS.fileUpload('cdp-new-logo', 'companyLogoUpload', data).then(function (res) {
                            if (res.wsStatus === "0") {
                                updateGrid();
                                Utils.popup_close();
                            }
                        });
                    } else {
                        updateGrid();
                        Utils.popup_close();
                    }
                }
            });
        });

        $$('cdp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Company?', () => {
            const row = grid.getSelectedRow();
            const data = {
                companyIds: row.companyId
            };
            AWS.callSoap(WS, 'deleteCompany', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                }
            });
        });
    });

    function edit() {
        let clearLogo = false;
        const row = grid.getSelectedRow();
        $$('cdp-title').setValue('Edit Company');

        const container = new TabContainer('cdp-tab-container');
        container.selectTab('cdp-address-TabButton');

        let data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            selectUsingCompanyId: null,
            selectUsingType: 1,
            showOnlyARAccounts: true
        };
        AWS.callSoap(WS, 'searchGLAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-ar-account').clear().add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            selectUsingCompanyId: null,
            selectUsingType: 2,
            showOnlyARAccounts: true
        };
        AWS.callSoap(WS, 'searchGLAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-employee-advance-account').clear().add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            selectUsingCompanyId: null,
            selectUsingType: 3,
            showOnlyARAccounts: false
        };
        AWS.callSoap(WS, 'searchGLAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-cash-account').clear().add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        AWS.callSoap(WS, 'loadDefaultBillingRate').then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-default-billing-rate').setValue(res.defaultBillingRateFormatted);
            }
        });

        data = {
            companyId: row.companyId
        };
        AWS.callSoap(WS, 'loadCompany', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('cdp-company-name').setValue(res.name);
                $$('cdp-address-line-1').setValue(res.addressLine1);
                $$('cdp-address-line-2').setValue(res.addressLine2);
                $$('cdp-country').setValue(res.country);
                $$('cdp-city').setValue(res.city);
                $$('cdp-state').setValue(res.stateProvince);
                $$('cdp-zip').setValue(res.zipPostalCode);
                $$('cdp-county').setValue(res.county);
                $$('cdp-phone').setValue(row.phone);
                $$('cdp-fax').setValue(row.fax);
                $$('cdp-accounting-type').setValue(res.accountingBasis);
                $$('cdp-fiscal-beginning-month').setValue(Number(res.fiscalBeginningMonth));
                $$('cdp-billing-rate').setValue(Number(res.billingRate));
                $$('cdp-default-billing-rate').setValue(res.defaultBillingRateFormatted);
                $$('cdp-federal-employer-id').setValue(res.federalEmployerId);
                $$('cdp-eeo-1-company-number').setValue(res.eeoCompanyNumber);
                $$('cdp-eeo-1-unit-number').setValue(res.eeoUnitNumber);
                $$('cdp-duns-number').setValue(res.dunBradstreet);
                $$('cdp-naics-code').setValue(res.naics);
                $$('cdp-email-from-address').setValue(res.emailFromEmail);
                $$('cdp-email-from-name').setValue(res.emailFromName);
                $$('cdp-server-login-username').setValue(res.emailUser);
                $$('cdp-server-login-password').setValue(res.emailPw);
                $$('cdp-server-type').setValue(res.emailType);
                $$('cdp-authentication').setValue(res.emailAuthentication);
                $$('cdp-host-url').setValue(res.emailHost);
                $$('cdp-port').setValue(res.emailPort);
                $$('cdp-windows-domain').setValue(res.emailDomain);
                $$('cdp-encryption').setValue(res.emailEncryption);
                $$('cdp-arahant-url').setValue(res.arahantUrl);
                $$('cdp-time-off-auto-accrual').setValue(res.accuralUseTimeOffRequest === 'true');
                $$('cdp-logo').setValue(res.logoSource);
                $$('cdp-new-logo').clear();
            }
        });

        Utils.popup_open('company-detail-popup', 'cdp-company-name');

        $$('cdp-clear-logo').onclick(() => {
            $$('cdp-logo').clear();
            $$('cdp-new-logo').clear();
            clearLogo = true;
        });

        $$('cdp-ok').onclick(() => {
            if ($$('cdp-company-name').isError('Company Name'))
                return;
            if ($$('cdp-fiscal-beginning-month').isError('Fiscal Beginning Month')) {
                container.selectTab('cdp-accounting-TabButton');
                return;
            }
            if ($$('cdp-accounting-type').isError('Accounting Type')) {
                container.selectTab('cdp-accounting-TabButton');
                return;
            }
            const data = {
                orgGroupId: row.companyId,
                accountingBasis: $$('cdp-accounting-type').getValue(),
                accrualsUseTimeOffRequest: $$('cdp-time-off-auto-accrual').getValue(),
                addressLine1: $$('cdp-address-line-1').getValue(),
                addressLine2: $$('cdp-address-line-2').getValue(),
                arahantUrl: $$('cdp-arahant-url').getValue(),
                billingRate: $$('cdp-billing-rate').getValue(),
                city: $$('cdp-city').getValue(),
                country: $$('cdp-country').getValue(),
                county: $$('cdp-county').getValue(),
                dunBradstreet: $$('cdp-duns-number').getValue(),
                eeoCompanyNumber: $$('cdp-eeo-1-company-number').getValue(),
                eeoUnitNumber: $$('cdp-eeo-1-unit-number').getValue(),
                emailAuthentication: $$('cdp-authentication').getValue(),
                emailDomain: $$('cdp-windows-domain').getValue(),
                emailEncryption: $$('cdp-encryption').getValue(),
                emailFromEmail: $$('cdp-email-from-address').getValue(),
                emailFromName: $$('cdp-email-from-name').getValue(),
                emailHost: $$('cdp-host-url').getValue(),
                emailPort: $$('cdp-port').getValue(),
                emailPw: $$('cdp-server-login-password').getValue(),
                emailType: $$('cdp-server-type').getValue(),
                emailUser: $$('cdp-server-login-username').getValue(),
                federalEmployerId: $$('cdp-federal-employer-id').getValue(),
                fiscalBeginningMonth: $$('cdp-fiscal-beginning-month').getValue(),
                glARAccountId: $$('cdp-ar-account').getValue(),
                glCashAccountId: $$('cdp-cash-account').getValue(),
                glEmployeeAdvanceAccountId: $$('cdp-employee-advance-account').getValue(),
                mainFaxNumber: $$('cdp-fax').getValue(),
                mainPhoneNumber: $$('cdp-phone').getValue(),
                naics: $$('cdp-naics-code').getValue(),
                name: $$('cdp-company-name').getValue(),
                stateProvince: $$('cdp-state').getValue(),
                zipPostalCode: $$('cdp-zip').getValue(),
                logo: clearLogo && !$$('cdp-new-logo').numberOfUploadFiles() ? null : 'anything'  // null means erase previous, anything means leave alone
            };
            AWS.callSoap(WS, 'saveCompany', data).then(function (res) {
                const ctl = $$('cdp-new-logo');
                if (ctl.numberOfUploadFiles()) {
                    const data = {
                        companyId: row.companyId,
                        source: ctl.uploadFilename(0),
                        extension: ctl.uploadFileExtension(0)
                    };
                    AWS.fileUpload('cdp-new-logo', 'companyLogoUpload', data).then(function (res) {
                        if (res.wsStatus === "0") {
                            updateGrid();
                            Utils.popup_close();
                        }
                    });
                } else {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('cdp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

})();
