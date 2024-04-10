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
    const WS = 'StandardProjectProjectBilling';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    let originalBillingStatus;
    let hasTimesheets;

    function setBilling() {
        let val = $$('billable').getValue();
        if (val === 'Y') {
            $$('billing-rate').enable();
            $$('dollar-cap').enable();
            $$('service-items').enable();
        } else {
            $$('billing-rate').disable().setValue(0);
            $$('dollar-cap').disable();
            $$('service-items').disable().setValue('');
        }
    }

    async function loadData() {
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

        let data = {
            projectId: projectId
        };
        let p1 = AWS.callSoap(WS, 'checkRight', data);

        data = {
            projectId: projectId
        };
        let p2 = AWS.callSoap(WS, 'searchServices', data);

        data = {};
        let p3 = AWS.callSoap(WS, 'loadBillingRateTypes', data);

        data = {
            projectId: projectId
        };
        let p4 = AWS.callSoap(WS, 'loadBilling', data);

        if (await AWS.callAll([p1, p2, p3, p4],
            null,
            function (ret) {
                let ctl = $$('service-items').clear();
                ctl.add('', '(choose)');
                let items = Utils.assureArray(ret.item);
                for (let i = 0; i < items.length; i++)
                    ctl.add(items[i].serviceId, items[i].description);
                if (ret.selectedItem)
                    $$('service-items').setValue(ret.selectedItem.serviceId);
            },
            function (ret) {
                let ctl = $$('rate-type').clear();
                ctl.add('', '(choose)');
                ret.item = Utils.assureArray(ret.item);
                for (let i = 0; i < ret.item.length; i++)
                    ctl.add(ret.item[i].rateTypeId, ret.item[i].rateCode);
            },
            function (ret) {
                $$('billable').setValue(originalBillingStatus=ret.billable);
                $$('billing-rate').setValue(Utils.toNumber(ret.billingRate));
                $$('dollar-cap').setValue(Utils.toNumber(ret.dollarCap));
                $$('rate-type').setValue(ret.rateTypeId);
                $$('default-billing-rate').setValue(Utils.toNumber(ret.defaultBillingRateFormatted));
                $$('purchase-order').setValue(ret.purchaseOrder);
                $$('estimated-billable').setValue(Utils.toNumber(ret.estimate));
                $$('billable-units').setValue(ret.estimateMeasurement);
                $$('actual-billable').setValue(Utils.toNumber(ret.actualBillable));
                $$('actual-non-billable').setValue(Utils.toNumber(ret.actualNonBillable));
                $$('estimated-time-span').setValue(Utils.toNumber(ret.estimateTimeSpan));
                $$('estimated-time-units').setValue(ret.estimateMeasurement);
                $$('estimated-on').setValue(Utils.toNumber(ret.estimateOnDate));
                $$('date-promised').setValue(Utils.toNumber(ret.promisedDate));
                $$('approved-by').setValue(ret.approvedBy);
                $$('approval-entered-by').setValue(ret.approvalEnteredByFormatted);
                $$('approval-date').setValue(Utils.toNumber(ret.approvalDate));
                $$('approval-time').setValue(Utils.toNumber(ret.approvalTime) / 100000);
                $$('save').disable();
                $$('reset').disable();
                hasTimesheets = ret.hasTimesheets;
                Utils.clearSomeControlValueChanged(false);
                Framework.askBeforeLeaving = false;
                setBilling();
            }))
            return; // error exit
    }

    loadData();

    $$('billable').onChange(function () {
        setBilling();
    });

    Utils.setSomeControlValueChangeFunction(function () {
        $$('save').enable();
        $$('reset').enable();
        $$('project-info').setValue(projectName + " - " + projectSummary + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    });

    $$('reset').onclick(function () {
        loadData();
    });

    function billingStatusChange() {
        return new Promise(function (resolve, reject) {
            Utils.popup_open('billing-status-change-popup');

            $$('billing-status-change-true').onclick(function () {
                Utils.popup_close();
                resolve(true);
            });
            $$('billing-status-change-false').onclick(function () {
                Utils.popup_close();
                resolve(false);
            });
            $$('billing-status-change-cancel').onclick(function () {
                Utils.popup_close();
                resolve('cancel');  // abort
            });
        });
    }

    $$('save').onclick(async function () {
        if ($$('rate-type').isError('Rate Type'))
            return;
        if ($$('purchase-order').isError('Purchase Order'))
            return;
        let changeTimesheets = false;
        let newBillingStatus = $$('billable').getValue();
        if (newBillingStatus !== originalBillingStatus  &&  hasTimesheets === 'true') {
            changeTimesheets = await billingStatusChange();
            if (changeTimesheets === 'cancel')
                return;  //  abort
        }

        const data = {
            projectId: projectId,
            billable: newBillingStatus,
            billingRate: $$('billing-rate').getValue(),
            dollarCap: $$('dollar-cap').getValue(),
            rateTypeId: $$('rate-type').getValue(),
            purchaseOrder: $$('purchase-order').getValue(),
            estimate: $$('estimated-billable').getValue(),
            estimateMeasurement: $$('billable-units').getValue(),
            estimateTimeSpan: $$('estimated-time-span').getValue(),
            estimateTimeSpanMeasurement: $$('estimated-time-units').getValue(),
            estimateOnDate: $$('estimated-on').getIntValue(),
            promisedDate: $$('date-promised').getIntValue(),
            approvedBy: $$('approved-by').getValue(),
            serviceId: $$('service-items').getValue(),
            changeTimesheets: changeTimesheets,
            primaryParentId: null
        };
        AWS.callSoap(WS, 'saveBilling', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showMessage('Information', 'Save completed successfully.');
                loadData();
            }
        });
    });

    $$('approve-estimate').onclick(function () {
        Utils.popup_open('approval-popup', 'approval-popup-approved-by');

        $$('approval-popup-approved-by').clear();

        $$('approval-popup-ok').onclick(function () {
            if ($$('approval-popup-approved-by').isError('Approved By'))
                return;
            $$('approved-by').setValue($$('approval-popup-approved-by').getValue());
            $$('approval-entered-by').setValue('(generated on save)');
            $$('approval-date').setValue(0);
            $$('approval-time').setValue(-1);
            Utils.popup_close();
        });

        $$('approval-popup-cancel').onclick(function () {
            Utils.popup_close();
        });

    });

})();
