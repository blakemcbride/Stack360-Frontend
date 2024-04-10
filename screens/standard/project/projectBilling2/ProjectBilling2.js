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
    const WS = 'com.arahant.services.standard.project.projectBilling2';
    const SWS = 'StandardProjectProjectBilling';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    let originalBillingStatus;
    let hasTimesheets;

    const data = {
        projectId: projectId
    };
    const rights = await AWS.callSoap(SWS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('save').show(rights.accessLevel === '2');
    $$('reset').show(rights.accessLevel === '2');
    $$('billable').enable(rights.accessLevel === '2');
    $$('budget-man-hours').enable(rights.accessLevel === '2');
    $$('calculate').enable(rights.accessLevel === '2');
    $$('project-days').enable(rights.accessLevel === '2');
    $$('rate-type').enable(rights.accessLevel === '2');
    $$('purchase-order').enable(rights.accessLevel === '2');
    $$('service-items').enable(rights.accessLevel === '2');


    function handle_billing_type() {
        const billable = $$('billable').getValue();
        if (billable === 'Y') {
            $('#billing-type-label').show();
            $$('billing-type').show();
            $$('service-items').enable(rights.accessLevel === '2');
            $('#billing-type-div').show();

            const billingType = $$('billing-type').getValue();
            if (billingType === 'H') {
                $('#billing-rate-label').show();
                $$('billing-rate').show();
                $('#dollar-cap-label').show();
                $$('dollar-cap').show();
                $('#fixed-price-label').hide();
                $$('fixed-price').hide();
                $('#default-billing-rate-label').show();
                $$('default-billing-rate').show();
            } else {
                $('#billing-rate-label').hide();
                $$('billing-rate').hide();
                $('#dollar-cap-label').hide();
                $$('dollar-cap').hide();
                $('#fixed-price-label').show();
                $$('fixed-price').show();
                $('#default-billing-rate-label').hide();
                $$('default-billing-rate').hide();
            }
        } else {
            $('#billing-type-label').hide();
            $$('billing-type').hide();
            $$('service-items').enable(rights.accessLevel === '2').setValue('');

            $('#billing-rate-label').hide();
            $('#billing-type-div').hide();
            $$('billing-rate').hide();
            $('#dollar-cap-label').hide();
            $$('dollar-cap').hide();
            $('#fixed-price-label').hide();
            $$('fixed-price').hide();
            $('#default-billing-rate-label').hide();
            $$('default-billing-rate').hide();
        }
    }

    $$('billing-type').onChange(handle_billing_type);
    handle_billing_type();

    async function loadData() {
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

        let data = {
            projectId: projectId
        };
        let p2 = AWS.callSoap(SWS, 'searchServices', data);

        data = {};
        let p3 = AWS.callSoap(SWS, 'loadBillingRateTypes', data);

        await AWS.callAll([p2, p3],
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
            });


        data = {
            projectId: projectId
        };
        Server.call(WS, 'LoadBilling', data).then (function (ret) {
            $$('billable').setValue(originalBillingStatus=ret.billable);
            $$('billing-type').setValue(ret.billing_type);
            $$('billing-rate').setValue(ret.billing_rate);
            $$('dollar-cap').setValue(ret.dollar_cap);
            $$('project-days').setValue(ret.project_days);
            $$('fixed-price').setValue(ret.fixed_price_amount);
            $$('rate-type').setValue(ret.rate_type_id);
            $$('default-billing-rate').setValue(ret.default_billing_rate);
            $$('purchase-order').setValue(ret.purchase_order);
            $$('actual-billable').setValue(ret.billable_hours);
            $$('actual-non-billable').setValue(ret.nonbillable_hours);
            $$('rate-type').setValue(ret.rate_type_id);
            $$('budget-man-hours').setValue(ret.estimate_hours);
            $$('actual-man-hours').setValue(ret.actual_man_hours);
            $$('remaining-man-hours').setValue(ret.estimate_hours - ret.actual_man_hours);

            if (ret.has_been_invoiced)
                $$('billing-type').disable();
            else
                $$('billing-type').enable(rights.accessLevel === '2');

            Utils.clearSomeControlValueChanged(false);
            Framework.askBeforeLeaving = false;
            handle_billing_type();
            $$('save').disable();
            $$('reset').disable();
        });

    }

    loadData();

    $$('budget-man-hours').onChange(() => {
        $$('remaining-man-hours').setValue($$('budget-man-hours').getValue() - $$('actual-man-hours').getValue());
    });

    $$('billable').onChange(function () {
        handle_billing_type();
    });

    Utils.setSomeControlValueChangeFunction(function () {
        $$('save').enable(rights.accessLevel === '2');
        $$('reset').enable(rights.accessLevel === '2');
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
        if ($$('service-items').isError('Default Service Item'))
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
            billingType: $$('billing-type').getValue(),
            billingRate: $$('billing-rate').getValue(),
            dollarCap: $$('dollar-cap').getValue(),
            projectDays: $$('project-days').getValue(),
            fixedPrice: $$('fixed-price').getValue(),
            rateTypeId: $$('rate-type').getValue(),
            purchaseOrder: $$('purchase-order').getValue(),
            serviceId: $$('service-items').getValue(),
            changeTimesheets: changeTimesheets,
            primaryParentId: null,
            estimateHours: $$('budget-man-hours').getValue()
        };
        Server.call(WS, 'SaveBilling', data).then(function (res) {
            if (res._Success) {
                Utils.showMessage('Information', 'Save completed successfully.');
                loadData();
            }
        });
    });

    $$('calculate').onclick(() => {

        function calc() {
            $$('cp-total-man-hours').setValue(
                $$('cp-number-of-weeks').getValue() *
                $$('cp-hours-per-week').getValue() *
                $$('cp-number-of-workers').getValue()
            );
        }
        const ctlChange = Utils.watchControlValueChanges(false);
        $$('cp-number-of-weeks').clear().onChange(calc);
        $$('cp-hours-per-week').clear().onChange(calc);
        $$('cp-number-of-workers').clear().onChange(calc);
        $$('cp-total-man-hours').clear();
        Utils.popup_open('calc-popup', 'cp-number-of-weeks');

        $$('cp-ok').onclick(() => {
            const val = $$('cp-total-man-hours').getValue();
            Utils.watchControlValueChanges(ctlChange);
            if (val) {
                $$('budget-man-hours').setValue(val);
                Utils.someControlValueChanged();
            }
            Utils.popup_close();
         });

        $$('cp-cancel').onclick(() => {
            Utils.popup_close();
            Utils.watchControlValueChanges(ctlChange);
        });

    });

})();
