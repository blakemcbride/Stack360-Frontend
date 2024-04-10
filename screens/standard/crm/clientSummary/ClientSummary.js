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
    const WS = 'StandardCrmClientSummary';

    const clientId = Utils.getData("CURRENT_CLIENT_ID");
    const clientName = Utils.getData("CURRENT_CLIENT_NAME");
    let canChange = true;

    Framework.askBeforeLeaving = true;

    $$('client-name').setValue(clientName).setColor('black');

    Utils.setSomeControlValueChangeFunction(() => {
        $$('client-name').setValue(clientName + " (unsaved changes)").setColor('red');
        if (canChange)
            $$('save').enable();
        $$('reset').enable();
    });

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
            canChange = res.accessLevel === '2';
        }
    });

    AWS.callSoap(WS, 'listGLSalesAccounts').then(function (res) {
        if (res.wsStatus === "0") {
            $$('gl-sales-account').add('', '(select)').addItems(res.glAccountTransmit, 'glAccountId', 'accountName');
        }
    });

    let data = {
        id: clientId
    };
    AWS.callSoap(WS, 'listClientStatuses', data).then(function (res) {
        if (res.wsStatus === "0") {
            $$('client-status').add('', '(select)').addItems(res.item, 'id', 'description');
        }
    });

    function loadData() {
        const data = {
            id: clientId
        };
        AWS.callSoap(WS, 'loadSummary', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('name').setValue(res.name);
                $$('street-1').setValue(res.street);
                $$('street-2').setValue(res.street2);
                $$('city').setValue(res.city);
                $$('state').setValue(res.state);
                $$('zip').setValue(res.zip);
                $$('phone').setValue(res.mainPhoneNumber);
                $$('fax').setValue(res.mainFaxNumber);
                $$('id').setValue(res.identifier);
                $$('fei').setValue(res.federalEmployerId);
                $$('gl-sales-account').setValue(res.glSalesAccountId);
                $$('billing-rate').setValue(res.billingRate);
                $$('default-billing-rate').setValue(res.defaultBillingRateFormatted);
                $$('client-status').setValue(res.statusId);
                $$('payment-terms').setValue(res.paymentTerms);
                $$('contract-date').setValue(res.contractDate);
                $$('inactive-date').setValue(res.inactiveDate);
                $$('our-vendor-number').setValue(res.vendorNumber);
                $$('default-project-code').setValue(res.projectCode);
                $$('copy-images-to-disk').setValue(res.copyPicturesToDisk);
                $$('path').setValue(res.pictureDiskPath);
                $$('copy-only-external').setValue(res.copyOnlyExternal);
                $$('copy-inactive-images').setValue(res.copyInactiveProjects);
                $$('client-id').setValue(clientId);
            }
        });
    }
    loadData();

    $$('save').onclick(() => {
        if ($$('name').isError('Client name'))
            return;
        if ($$('gl-sales-account').isError('GL Sales Account'))
            return;
        if ($$('client-status').isError('Client status'))
            return;
        const data = {
            billingRate: $$('billing-rate').getValue(),
            city: $$('city').getValue(),
            contractDate: $$('contract-date').getIntValue(),
            federalEmployerId: $$('fei').getValue(),
            glSalesAccountId: $$('gl-sales-account').getValue(),
            id: clientId,
            identifier: $$('id').getValue(),
            inactiveDate: $$('inactive-date').getIntValue(),
            mainFaxNumber: $$('fax').getValue(),
            mainPhoneNumber: $$('phone').getValue(),
            name: $$('name').getValue(),
            paymentTerms: $$('payment-terms').getValue(),
            projectCode: $$('default-project-code').getValue(),
            state: $$('state').getValue(),
            statusId: $$('client-status').getValue(),
            street: $$('street-1').getValue(),
            street2: $$('street-2').getValue(),
            vendorNumber: $$('our-vendor-number').getValue(),
            zip: $$('zip').getValue()
        };
        AWS.callSoap(WS, 'saveSummary', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showMessage('Information', 'Save completed successfully.');
                $$('client-name').setValue(clientName).setColor('black');
                $$('save').disable();
                $$('reset').disable();
                Utils.clearSomeControlValueChanged(false);
            }
        });
    });

    $$('reset').onclick(() => {
        loadData();
        $$('client-name').setValue(clientName).setColor('black');
        $$('save').disable();
        $$('reset').disable();
        Utils.clearSomeControlValueChanged(false);
    });

    $$('report').onclick(() => {
        Utils.popup_open('report-options-popup');

        $$('rop-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('rop-ok').onclick(() => {
            Utils.popup_close();
            const data = {
                id: clientId,
                includeContactDetail: $$('rop-include-contacts').getValue()
            };
            AWS.callSoap(WS, 'getReport', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showReport(res.reportUrl);
                }
            });
        });
    });

})();

