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

    const WS = 'StandardHrEmployeePayroll';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });

    const tabs = new TabContainer('ep-payroll-tab');
    tabs.selectTab('general-TabButton');

    const transferColumnDefs = [
        { headerName: 'Account Type', field: 'accountTypeFormatted', width: 120 },
        { headerName: 'Bank Routing Code', field: 'routingTransitNumber' },
        { headerName: 'Account Number', field: 'accountNumber' },
        { headerName: 'Amount', field: 'amountFormatted', type: 'numericColumn', width: 120 }
    ];
    const transferGrid = new AGGrid('transfer-grid', transferColumnDefs, 'gridId');

    transferGrid.show();
    transferGrid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });
    transferGrid.clear();

    statesToDropDown('tax-state', US_STATE_ABBREVIATIONS);
    statesToDropDown('unemployment-state', US_STATE_ABBREVIATIONS);

    function reset() {
        $$('worker-name').setValue(personName).setColor('black');
        $$('save').disable();
        $$('reset').disable();
        $$('edit').disable();
        $$('delete').disable();

        AWS.callSoap(WS, 'listW4Statuses').then(res => {
            if (res.wsStatus === '0') {
                let statusCtrl = $$('w4-status');
                statusCtrl.clear();
    
                statusCtrl.add("U", "(select)");
    
                // Add the sources to the drop down control.
                res.item = Utils.assureArray(res.item);
    
                if (res.item) {
                    res.item.forEach(item => {
                        statusCtrl.add(item.id, item.description, item);
                    });
                }
            }
        });
    
        AWS.callSoap(WS, 'listBankAccounts', {
            personId: personId
        }).then(res => {
            if (res.wsStatus === '0') {
                let bankCtrl = $$('payroll-bank-account');
                bankCtrl.clear();
    
                bankCtrl.add("", "(select)");
    
                // Add the sources to the drop down control.
                res.item = Utils.assureArray(res.item);
    
                if (res.item) {
                    res.item.forEach(item => {
                        bankCtrl.add(item.id, (item.code + ' (' + item.name + ')'), item);
                    });
                }
            }
        });
    
        AWS.callSoap(WS, 'loadPayroll', {
            personId: personId
        }).then(res => {
            if (res.wsStatus === '0') {
                $$('federal-extra-withheld').setValue(res.federalExtraWithheld);
                $$('federal-exemptions').setValue(res.federalExemptions);
                $$('state-extra-withheld').setValue(res.stateExtraWithheld);
                $$('state-exemptions').setValue(res.stateExemptions);
                $$('tax-state').setValue(res.taxState);
                $$('unemployment-state').setValue(res.unemploymentState);
                $$('w4-status').setValue(res.w4StatusId);
                $$('federal-income-tax').setValue(res.addFederalIncomeTaxType);
                if (res.addFederalIncomeTaxType === 'N') {
                    $$('federal-income-text').setValue('Amount');
                    $$('federal-income-amount').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount').disable();
                    $$('federal-income-amount').show();
                    $$('federal-income-amount-percent').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount-percent').hide();
                    $$('federal-income-amount-percent').disable();
                } else if (res.addFederalIncomeTaxType === 'P') {
                    $$('federal-income-text').setValue('Percentage');
                    $$('federal-income-amount').hide();
                    $$('federal-income-amount').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount').enable();
                    $$('federal-income-amount-percent').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount-percent').enable();
                    $$('federal-income-amount-percent').show();
                } else if (res.addFederalIncomeTaxType === 'F') {
                    $$('federal-income-text').setValue('Amount');
                    $$('federal-income-amount').show();
                    $$('federal-income-amount').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount').enable();
                    $$('federal-income-amount-percent').hide();
                    $$('federal-income-amount-percent').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount-percent').enable();
                } else if (res.addFederalIncomeTaxType === 'A') {
                    $$('federal-income-text').setValue('Amount');
                    $$('federal-income-amount').show();
                    $$('federal-income-amount').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount').enable();
                    $$('federal-income-amount-percent').hide();
                    $$('federal-income-amount-percent').setValue(res.addFederalIncomeTaxAmount);
                    $$('federal-income-amount-percent').enable();
                }
                $$('local-income-tax').setValue(res.addLocalIncomeTaxType);
                if (res.addLocalIncomeTaxType === 'N') {
                    $$('local-income-text').setValue('Amount');
                    $$('local-income-amount').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount').disable();
                    $$('local-income-amount').show();
                    $$('local-income-amount-percent').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount-percent').hide();
                    $$('local-income-amount-percent').disable();
                } else if (res.addLocalIncomeTaxType === 'P') {
                    $$('local-income-text').setValue('Percentage');
                    $$('local-income-amount').hide();
                    $$('local-income-amount').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount').enable();
                    $$('local-income-amount-percent').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount-percent').enable();
                    $$('local-income-amount-percent').show();
                } else if (res.addLocalIncomeTaxType === 'F') {
                    $$('local-income-text').setValue('Amount');
                    $$('local-income-amount').show();
                    $$('local-income-amount').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount').enable();
                    $$('local-income-amount-percent').hide();
                    $$('local-income-amount-percent').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount-percent').enable();
                } else if (res.addLocalIncomeTaxType === 'A') {
                    $$('local-income-text').setValue('Amount');
                    $$('local-income-amount').show();
                    $$('local-income-amount').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount').enable();
                    $$('local-income-amount-percent').hide();
                    $$('local-income-amount-percent').setValue(res.addLocalIncomeTaxAmount);
                    $$('local-income-amount-percent').enable();
                }
                $$('state-income-tax').setValue(res.addStateIncomeTaxType);
                if (res.addStateIncomeTaxType === 'N') {
                    $$('state-income-text').setValue('Amount');
                    $$('state-income-amount').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount').disable();
                    $$('state-income-amount').show();
                    $$('state-income-amount-percent').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount-percent').hide();
                    $$('state-income-amount-percent').disable();
                } else if (res.addStateIncomeTaxType === 'P') {
                    $$('state-income-text').setValue('Percentage');
                    $$('state-income-amount').hide();
                    $$('state-income-amount').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount').enable();
                    $$('state-income-amount-percent').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount-percent').enable();
                    $$('state-income-amount-percent').show();
                } else if (res.addStateIncomeTaxType === 'F') {
                    $$('state-income-text').setValue('Amount');
                    $$('state-income-amount').show();
                    $$('state-income-amount').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount').enable();
                    $$('state-income-amount-percent').hide();
                    $$('state-income-amount-percent').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount-percent').enable();
                } else if (res.addStateIncomeTaxType === 'A') {
                    $$('state-income-text').setValue('Amount');
                    $$('state-income-amount').show();
                    $$('state-income-amount').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount').enable();
                    $$('state-income-amount-percent').hide();
                    $$('state-income-amount-percent').setValue(res.addStateIncomeTaxAmount);
                    $$('state-income-amount-percent').enable();
                }
                $$('state-disability-tax').setValue(res.addStateDisabilityTaxType);
                if (res.addStateDisabilityTaxType === 'N') {
                    $$('state-disability-text').setValue('Amount');
                    $$('state-disability-amount').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount').disable();
                    $$('state-disability-amount').show();
                    $$('state-disability-amount-percent').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount-percent').hide();
                    $$('state-disability-amount-percent').disable();
                } else if (res.addStateDisabilityTaxType === 'P') {
                    $$('state-disability-text').setValue('Percentage');
                    $$('state-disability-amount').hide();
                    $$('state-disability-amount').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount').enable();
                    $$('state-disability-amount-percent').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount-percent').enable();
                    $$('state-disability-amount-percent').show();
                } else if (res.addStateDisabilityTaxType === 'F') {
                    $$('state-disability-text').setValue('Amount');
                    $$('state-disability-amount').show();
                    $$('state-disability-amount').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount').enable();
                    $$('state-disability-amount-percent').hide();
                    $$('state-disability-amount-percent').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount-percent').enable();
                } else if (res.addStateDisabilityTaxType === 'A') {
                    $$('state-disability-text').setValue('Amount');
                    $$('state-disability-amount').show();
                    $$('state-disability-amount').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount').enable();
                    $$('state-disability-amount-percent').hide();
                    $$('state-disability-amount-percent').setValue(res.addStateDisabilityTaxAmount);
                    $$('state-disability-amount-percent').enable();
                }
                $$('payroll-bank-account').setValue(res.bankAccountId);
                $$('earned-income-credit').setValue(res.earnedIncomeCreditStatus);
                $$('overtime').setValue(res.exempt);
                $$('expected-period').setValue(res.expectedHoursPerPayPeriod);
                $$('local-tax-code').setValue(res.localTaxCode);
                $$('marital-status').setValue(res.maritalStatus);
                $$('pay-period').setValue(res.payPeriodsPerYear);
                if (res.item) {
                    transferGrid.clear();

                    res.item = Utils.assureArray(res.item);

                    for (let i = 0; i < res.item.length; i ++) {
                        res.item[i].accountTypeFormatted = res.item[i].accountType === 'C' ? 'Checking' : 'Saving';
                        res.item[i].amountFormatted = res.item[i].amountType === 'P' ?
                                                      Utils.format(res.item[i].amount, "CR", 0, 2) :
                                                      Utils.format(res.item[i].amount, "CD", 0, 2);
                        res.item[i].gridId = i;
                    }
                    
                    transferGrid.addRecords(res.item);
    
                    $$('transfer-count').setValue('Displaying ' + res.item.length + ' Transfers');
                }
                Utils.clearSomeControlValueChanged(false);
                Framework.askBeforeLeaving = false;
            }
        });
    }

    reset();

    Utils.setSomeControlValueChangeFunction(function () {
        $$('save').enable();
        $$('reset').enable();
        $$('worker-name').setValue(personName + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    });

    $$('reset').onclick(reset);

    const addTransfer = () => {
        $$('ap-title').setValue('Add Transfer');
        $$('ap-type').setValue('C');
        $$('ap-code').clear();
        $$('ap-account-number').clear();
        $$('wage-type').clear();
        $$('amount-type').setValue('P');
        $$('ap-amount-flat').clear();
        $$('ap-amount-flat').disable();
        $$('ap-amount-percentage').clear();
        $$('ap-amount-percentage').enable();

        AWS.callSoap(WS, 'listWageTypes').then(res => {
            if (res.wsStatus === '0') {
                let wageCtrl = $$('wage-type');
                wageCtrl.clear();
    
                wageCtrl.add("", "(select)");
    
                // Add the sources to the drop down control.
                res.item = Utils.assureArray(res.item);
    
                if (res.item) {
                    res.item.forEach(item => {
                        wageCtrl.add(item.id, item.description, item);
                    });
                }
            }
        });
        
        Utils.popup_open('add-popup', 'ap-type');

        $$('ap-ok').onclick(() => {
            if ($$('ap-code').isError('Routing Code'))
                return;
            if ($$('ap-account-number').isError('Account Number'))
                return;
            if ($$('wage-type').isError('Wage Type'))
                return;
            let amountType = $$('amount-type').getValue();
            if (amountType === 'F') {
                if ($$('ap-amount-flat').isError("Flat Amount"))
                    return;
            } else {
                if ($$('ap-amount-percentage').isError("Percentage Amount"))
                    return;
            }
    
            let amount = amountType === 'F' ?
                         $$('ap-amount-flat').getValue() :
                         $$('ap-amount-percentage').getValue();
            const data = {
                gridId: transferGrid.getNumberOfRows(),
                accountType: $$('ap-type').getValue(),
                accountTypeFormatted: $$('ap-type').getValue() === 'C' ? 'Checking' : 'Saving',
                routingTransitNumber: $$('ap-code').getValue(),
                accountNumber: $$('ap-account-number').getValue(),
                wageTypeId: $$('wage-type').getValue(),
                amountType: amountType,
                amount: amount,
                amountFormatted: amountType === 'P' ?
                                 Utils.format(amount, "CR", 0, 2) :
                                 Utils.format(amount, "CD", 0, 2)
            };
            transferGrid.addRecord(data);
            $$('transfer-count').setValue('Displaying ' + transferGrid.getNumberOfRows() + ' Transfers');
            Utils.popup_close();
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    $$('add').onclick(addTransfer);

    const editTransfer = () => {
        const row = transferGrid.getSelectedRow();

        $$('ap-title').setValue('Edit Transfer');
        $$('ap-type').setValue(row.accountType);
        $$('ap-code').setValue(row.routingTransitNumber);
        $$('ap-account-number').setValue(row.accountNumber);
        $$('amount-type').setValue(row.amountType);
        if (row.amountType === 'F') {
            $$('ap-amount-flat').setValue(row.amount);
            $$('ap-amount-flat').enable();
            $$('ap-amount-percentage').clear();
            $$('ap-amount-percentage').disable();
        } else {
            $$('ap-amount-flat').clear();
            $$('ap-amount-flat').disable();
            $$('ap-amount-percentage').setValue(row.amount);
            $$('ap-amount-percentage').enable();
        }

        AWS.callSoap(WS, 'listWageTypes').then(res => {
            if (res.wsStatus === '0') {
                let wageCtrl = $$('wage-type');
                wageCtrl.clear();
    
                wageCtrl.add("", "(select)");
    
                // Add the sources to the drop down control.
                res.item = Utils.assureArray(res.item);
    
                if (res.item) {
                    res.item.forEach(item => {
                        wageCtrl.add(item.id, item.description, item);
                    });
                }

                $$('wage-type').setValue(row.wageTypeId);

            }
        });
        
        Utils.popup_open('add-popup', 'ap-type');

        $$('ap-ok').onclick(() => {
            if ($$('ap-code').isError('Routing Code'))
                return;
            if ($$('ap-account-number').isError('Account Number'))
                return;
            if ($$('wage-type').isError('Wage Type'))
                return;
            let amountType = $$('amount-type').getValue();
            if (amountType === 'F') {
                if ($$('ap-amount-flat').isError("Flat Amount"))
                    return;
            } else {
                if ($$('ap-amount-percentage').isError("Percentage Amount"))
                    return;
            }
    
            let amount = amountType === 'F' ?
                         $$('ap-amount-flat').getValue() :
                         $$('ap-amount-percentage').getValue();
            const data = {
                gridId: row.gridId,
                accountType: $$('ap-type').getValue(),
                accountTypeFormatted: $$('ap-type').getValue() === 'C' ? 'Checking' : 'Saving',
                routingTransitNumber: $$('ap-code').getValue(),
                accountNumber: $$('ap-account-number').getValue(),
                wageTypeId: $$('wage-type').getValue(),
                amountType: amountType,
                amount: amount,
                amountFormatted: amountType === 'P' ?
                                 Utils.format(amount, "CR", 0, 2) :
                                 Utils.format(amount, "CD", 0, 2)
            };
            transferGrid.updateSelectedRecord(data);
            $$('transfer-count').setValue('Displaying ' + transferGrid.getNumberOfRows() + ' Transfers');
            Utils.popup_close();
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    $$('edit').onclick(editTransfer);
    transferGrid.setOnRowDoubleClicked(editTransfer);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Transfer?', () => {
            transferGrid.deleteSelectedRows();
            $$('transfer-count').setValue('Displaying ' + transferGrid.getNumberOfRows() + ' Transfers');
        });
    });

    $$('federal-income-tax').onChange((v) => {
        if (v === 'N') {
            $$('federal-income-text').setValue('Amount');
            $$('federal-income-amount').clear();
            $$('federal-income-amount').disable();
            $$('federal-income-amount').show();
            $$('federal-income-amount-percent').clear();
            $$('federal-income-amount-percent').hide();
            $$('federal-income-amount-percent').disable();
        } else if (v === 'P') {
            $$('federal-income-text').setValue('Percentage');
            $$('federal-income-amount').hide();
            $$('federal-income-amount').clear();
            $$('federal-income-amount').enable();
            $$('federal-income-amount-percent').clear();
            $$('federal-income-amount-percent').enable();
            $$('federal-income-amount-percent').show();
        } else if (v === 'F') {
            $$('federal-income-text').setValue('Amount');
            $$('federal-income-amount').show();
            $$('federal-income-amount').clear();
            $$('federal-income-amount').enable();
            $$('federal-income-amount-percent').hide();
            $$('federal-income-amount-percent').clear();
            $$('federal-income-amount-percent').enable();
        } else if (v === 'A') {
            $$('federal-income-text').setValue('Amount');
            $$('federal-income-amount').show();
            $$('federal-income-amount').clear();
            $$('federal-income-amount').enable();
            $$('federal-income-amount-percent').hide();
            $$('federal-income-amount-percent').clear();
            $$('federal-income-amount-percent').enable();
        }
    });

    $$('state-income-tax').onChange((v) => {
        if (v === 'N') {
            $$('state-income-text').setValue('Amount');
            $$('state-income-amount').clear();
            $$('state-income-amount').disable();
            $$('state-income-amount').show();
            $$('state-income-amount-percent').clear();
            $$('state-income-amount-percent').hide();
            $$('state-income-amount-percent').disable();
        } else if (v === 'P') {
            $$('state-income-text').setValue('Percentage');
            $$('state-income-amount').hide();
            $$('state-income-amount').clear();
            $$('state-income-amount').enable();
            $$('state-income-amount-percent').clear();
            $$('state-income-amount-percent').enable();
            $$('state-income-amount-percent').show();
        } else if (v === 'F') {
            $$('state-income-text').setValue('Amount');
            $$('state-income-amount').show();
            $$('state-income-amount').clear();
            $$('state-income-amount').enable();
            $$('state-income-amount-percent').hide();
            $$('state-income-amount-percent').clear();
            $$('state-income-amount-percent').enable();
        } else if (v === 'A') {
            $$('state-income-text').setValue('Amount');
            $$('state-income-amount').show();
            $$('state-income-amount').clear();
            $$('state-income-amount').enable();
            $$('state-income-amount-percent').hide();
            $$('state-income-amount-percent').clear();
            $$('state-income-amount-percent').enable();
        }
    });

    $$('local-income-tax').onChange((v) => {
        if (v === 'N') {
            $$('local-income-text').setValue('Amount');
            $$('local-income-amount').clear();
            $$('local-income-amount').disable();
            $$('local-income-amount').show();
            $$('local-income-amount-percent').clear();
            $$('local-income-amount-percent').hide();
            $$('local-income-amount-percent').disable();
        } else if (v === 'P') {
            $$('local-income-text').setValue('Percentage');
            $$('local-income-amount').hide();
            $$('local-income-amount').clear();
            $$('local-income-amount').enable();
            $$('local-income-amount-percent').clear();
            $$('local-income-amount-percent').enable();
            $$('local-income-amount-percent').show();
        } else if (v === 'F') {
            $$('local-income-text').setValue('Amount');
            $$('local-income-amount').show();
            $$('local-income-amount').clear();
            $$('local-income-amount').enable();
            $$('local-income-amount-percent').hide();
            $$('local-income-amount-percent').clear();
            $$('local-income-amount-percent').enable();
        } else if (v === 'A') {
            $$('local-income-text').setValue('Amount');
            $$('local-income-amount').show();
            $$('local-income-amount').clear();
            $$('local-income-amount').enable();
            $$('local-income-amount-percent').hide();
            $$('local-income-amount-percent').clear();
            $$('local-income-amount-percent').enable();
        }
    });

    $$('state-disability-tax').onChange((v) => {
        if (v === 'N') {
            $$('state-disability-text').setValue('Amount');
            $$('state-disability-amount').clear();
            $$('state-disability-amount').disable();
            $$('state-disability-amount').show();
            $$('state-disability-amount-percent').clear();
            $$('state-disability-amount-percent').hide();
            $$('state-disability-amount-percent').disable();
        } else if (v === 'P') {
            $$('state-disability-text').setValue('Percentage');
            $$('state-disability-amount').hide();
            $$('state-disability-amount').clear();
            $$('state-disability-amount').enable();
            $$('state-disability-amount-percent').clear();
            $$('state-disability-amount-percent').enable();
            $$('state-disability-amount-percent').show();
        } else if (v === 'F') {
            $$('state-disability-text').setValue('Amount');
            $$('state-disability-amount').show();
            $$('state-disability-amount').clear();
            $$('state-disability-amount').enable();
            $$('state-disability-amount-percent').hide();
            $$('state-disability-amount-percent').clear();
            $$('state-disability-amount-percent').enable();
        } else if (v === 'A') {
            $$('state-disability-text').setValue('Amount');
            $$('state-disability-amount').show();
            $$('state-disability-amount').clear();
            $$('state-disability-amount').enable();
            $$('state-disability-amount-percent').hide();
            $$('state-disability-amount-percent').clear();
            $$('state-disability-amount-percent').enable();
        }
    });

    $$('amount-type').onChange((v) => {
        if (v === 'F') {
            $$('ap-amount-flat').clear();
            $$('ap-amount-flat').enable();
            $$('ap-amount-percentage').clear();
            $$('ap-amount-percentage').disable();
        } else {
            $$('ap-amount-flat').clear();
            $$('ap-amount-flat').disable();
            $$('ap-amount-percentage').clear();
            $$('ap-amount-percentage').enable();
        }
    });

    $$('save').onclick(() => {
        let transferData = transferGrid.getAllRows();
        let item = [];
        for (let i = 0; i < transferData.length; i ++) {
            const transferItem = {
                accountNumber: transferData[i].accountNumber,
                accountType: transferData[i].accountType,
                amount: transferData[i].amount,
                amountType: transferData[i].amountType,
                id: transferData[i].id ? transferData[i].id : '',
                routingTransitNumber: transferData[i].routingTransitNumber,
                wageTypeId: transferData[i].wageTypeId
            };
            item.push(transferItem);
        }
        const data = {
            addFederalIncomeTaxAmount: $$('federal-income-tax').getValue() === "P" ? $$('federal-income-amount-percent').getValue() : $$('federal-income-amount').getValue(),
            addFederalIncomeTaxType: $$('federal-income-tax').getValue(),
            addLocalIncomeTaxAmount: $$('local-income-tax').getValue() === "P" ? $$('local-income-amount-percent').getValue() : $$('local-income-amount').getValue(),
            addLocalIncomeTaxType: $$('local-income-tax').getValue(),
            addStateDisabilityTaxAmount: $$('state-disability-tax').getValue() === "P" ? $$('state-disability-amount-percent').getValue() : $$('state-disability-amount').getValue(),
            addStateDisabilityTaxType: $$('state-disability-tax').getValue(),
            addStateIncomeTaxAmount: $$('state-income-tax').getValue() === "P" ? $$('state-income-amount-percent').getValue() : $$('state-income-amount').getValue(),
            addStateIncomeTaxType: $$('state-income-tax').getValue(),
            bankAccountId: $$('payroll-bank-account').getValue(),
            earnedIncomeCreditStatus: $$('earned-income-credit').getValue(),
            exempt: $$('overtime').getValue() === 'true',
            expectedHoursPerPayPeriod: $$('expected-period').getValue(),
            federalExemptions: $$('federal-exemptions').getValue(),
            federalExtraWithheld: $$('federal-extra-withheld').getValue(),
            item: item,
            localTaxCode: $$('local-tax-code').getValue(),
            maritalStatus: $$('marital-status').getValue(),
            payPeriodsPerYear: $$('pay-period').getValue(),
            payrollBankCode: '',
            personId: personId,
            stateExemptions: $$('state-exemptions').getValue(),
            stateExtraWithheld: $$('state-extra-withheld').getValue(),
            taxState: $$('tax-state').getValue(),
            unemploymentState: $$('unemployment-state').getValue(),
            w4StatusId: $$('w4-status').getValue()
        };
        AWS.callSoap(WS, 'savePayroll', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showMessage('Information', 'Save completed successfully.');
                reset();
            }
        });
    });
    
    $$('report').onclick(() => {
        const data = {
            personId: personId,
        };

        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('export').onclick(() => {
        const data = {
            id: personId,
        };

        Utils.yesNo('Confirmation', 'This will export all relevant Employee data for \'' + personName + '\' to the Payroll system.  Are you sure?', function () {
            AWS.callSoap(WS, "runPayrollExport", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.showMessage('Information', 'Export completed successfully.');
                }
            });
        });        
    });

})();
