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

    const WS = 'StandardHrConfigBenefitConfigVariant';

    let res = await AWS.callSoap(WS, "listBenefitConfigs");
    if (res.wsStatus === '0') {
        $$('benefit-config-list').clear().addItems(res.item, 'id', 'name');
    } else
        return;

    const variantGrid = new AGGrid('variant-data-grid', [
        {headerName: 'Allotment', field: 'method', width: 18  },
        {headerName: 'First Active Date', field: 'firstActive', width: 16, hide: true  },
        {headerName: 'Last Active Date', field: 'lastActive', width: 16, hide: true  },
        {headerName: 'Trial Period (days)', field: 'trialPeriod', width: 16  },
        {headerName: 'Start', field: 'startFlag', width: 16 },
        {headerName: 'Type', field: 'accrualType1', width: 16 },
        {headerName: 'Max Carry Over Hours', field: 'carryOverAmount', width: 16 },
        {headerName: 'Carry Over Percentage', field: 'carryOverPercentage', width: 16 }
    ], 'id');
    variantGrid.show();

    const seniorityGrid = new AGGrid('seniority-data-grid', [
        {headerName: 'Years of Service', field: 'yearsOfService1', width: 50  },
        {headerName: 'Hours Accrued', field: 'hoursAccrued', width: 50  },
    ], 'id');
    seniorityGrid.show();

    function updateVariantGrid() {
        variantGrid.clear();

        if ($$('benefit-config-list').getValue() == "") 
            return;

        $$('variant-add').enable();
        $$('variant-edit').disable();
        $$('variant-delete').disable();

        AWS.callSoap(WS, "listBenefitConfigVariants", {id: $$('benefit-config-list').getValue()}).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.accrualType1 = row.accrualType === 'R' ?  'Arrears' : 'Advance';
                }
                variantGrid.addRecords(res.item);
                $$('variant-grid-status').setValue('Displaying ' + res.item.length + ' Time Off Configurations');
            }
        });
    }
    
    function updateSeniorityGrid() {
        seniorityGrid.clear();

        if (!variantGrid.getSelectedRow())
            return;
        
        $$('seniority-add').enable();
        $$('seniority-edit').disable();
        $$('seniority-delete').disable();

        const data = {
            id : variantGrid.getSelectedRow().id
        };

        AWS.callSoap(WS, "listBenefitConfigsVariantsSeniority", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.yearsOfService1 = `Starting at ${row.yearsOfService} years of experience`;
                }
                seniorityGrid.addRecords(res.item);
                $$('seniority-grid-status').setValue('Displaying ' + res.item.length + ' Tiers');
            }
        });
    }

    $$('benefit-config-list').onChange(updateVariantGrid);

    variantGrid.setOnSelectionChanged((rows) => {
        $$('variant-edit').enable(rows);
        $$('variant-delete').enable(rows);

        updateSeniorityGrid();
    });

    seniorityGrid.setOnSelectionChanged((rows) => {
        $$('seniority-edit').enable(rows);
        $$('seniority-delete').enable(rows);
    });

    /////////////////////////////////////////////////////////////////////////////////
    // time off configuration popup
    /////////////////////////////////////////////////////////////////////////////////
    const timeoffConfigPopup = async (row) => {

        Utils.popup_open('timeoff-config-popup');

        return new Promise(function (resolve, reject) {

            if (!row) {
                $$('tcp-title').setValue('Add Time Off Configuration');

                $$('tcp-allotment').setValue('A');
                $$('tcp-start-flag').setValue('C');
                $$('tcp-accrual-type').setValue('D');
                $$('tcp-accrual-type').enable();

                $$('tcp-carry-over-amount').setValue(0);
                $$('tcp-carry-over-percentage').setValue(0);
                $$('tcp-trial-period').setValue(0);
                
                $$('tcp-start-month-day').clear();                
            } else {
                $$('tcp-title').setValue('Edit Time Off Configuration');

                $$('tcp-allotment').setValue(row.method.substr(0, 1));
                $$('tcp-start-flag').setValue(row.startFlag.substr(0,1));
                $$('tcp-accrual-type').setValue(row.accrualType);

                if (row.method.substr(0,1) === 'H') {
                    $$('tcp-accrual-type').setValue('R');
                    $$('tcp-accrual-type').disable();
                }

                if (row.startFlag.substr(0,1) === 'S') {
                    $$('tcp-start-month-day').enable();
                }

                $$('tcp-carry-over-amount').setValue(row.carryOverAmount);
                $$('tcp-carry-over-percentage').setValue(row.carryOverPercentage);
                $$('tcp-trial-period').setValue(row.trialPeriod);
                
                $$('tcp-start-month-day').setValue(row.periodStartDate);
            }

            $$('tcp-start-flag').onChange((v) => {
                if (v === 'S') {
                    $$('tcp-start-month-day').enable();
                } else {
                    $$('tcp-start-month-day').disable();
                }
            });

            $$('tcp-allotment').onChange((v) => {
                if (v === 'H') {
                    $$('tcp-accrual-type').setValue('R');
                    $$('tcp-accrual-type').disable();
                } else {
                    $$('tcp-accrual-type').enable();
                }
            })
        
            let ok = () => {
                if ($$('tcp-allotment').isError('Allotment'))
                    return;
                if ($$('tcp-start-flag').isError('Start Field'))
                    return;
                if ($$('tcp-accrual-type').isError('Accrual Method'))
                    return;

                const data = {
                    method: $$('tcp-allotment').getValue(),
                    carryOverAmount: $$('tcp-carry-over-amount').getValue(),
                    carryOverPercentage: $$('tcp-carry-over-percentage').getValue(),
                    trialPeriod: $$('tcp-trial-period').getValue(),
                    startFlag: $$('tcp-start-flag').getValue(),
                    accrualType: $$('tcp-accrual-type').getValue(),
                    periodStartDate: $$('tcp-start-month-day').getValue()
                };
                
                resolve(data);
                Utils.popup_close();
            };
        
            let cancel = () => {
                resolve();
                Utils.popup_close();
            };
        
            $$('tcp-ok').onclick(ok);        
            $$('tcp-cancel').onclick(cancel);
        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // time off configuration popup
    /////////////////////////////////////////////////////////////////////////////////
    const tierPopup = async (name, row) => {

        Utils.popup_open('tier-popup');

        return new Promise(function (resolve, reject) {

            if (!row) {
                $$('tp-title').setValue('Add Tier');
                $$('tp-years-of-service').clear();
                $$('tp-hours-accrued').clear();
            } else {
                $$('tp-title').setValue('Edit Tier');
                $$('tp-years-of-service').setValue(row.yearsOfService);
                $$('tp-hours-accrued').setValue(row.hoursAccrued);
            }

            $$('tp-hours-label').setValue(`${name} hours annually.`);

            let ok = () => {
                if ($$('tp-years-of-service').isError('Years of Service field'))
                    return;
                if ($$('tp-hours-accrued').isError('Hours accrued field'))
                    return;

                const data = {
                    yearsOfService: $$('tp-years-of-service').getValue(),
                    hoursAccrued: $$('tp-hours-accrued').getValue()
                };
                
                resolve(data);
                Utils.popup_close();
            };
        
            let cancel = () => {
                resolve();
                Utils.popup_close();
            };
        
            $$('tp-ok').onclick(ok);        
            $$('tp-cancel').onclick(cancel);
        });
    };
    
    $$('variant-add').onclick(async () => {
        let data = await timeoffConfigPopup();

        if (!data)
            return;
        
        AWS.callSoap(WS, "newBenefitConfigVariant", {...data, configId: $$('benefit-config-list').getValue()}).then( res => {
            if (res.wsStatus === '0') {
                updateVariantGrid();
            }
        });
    });
    $$('variant-edit').onclick(async () => {
        let row = variantGrid.getSelectedRow();
        let data = await timeoffConfigPopup(row);

        if (!data)
            return;

        AWS.callSoap(WS, "saveBenefitConfigVariant", {...data, id: row.id}).then( res => {
            if (res.wsStatus === '0') {
                updateVariantGrid();
            }
        });
    });
    $$('variant-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Time Off Configuration?', () => {
            const data = {
                ids: [variantGrid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteBenefitConfigVariants", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateVariantGrid();
                    updateSeniorityGrid();
                }
            });
        });
    });

    $$('seniority-add').onclick(async () => {
        let data = await tierPopup($$('benefit-config-list').getLabel());

        if (!data)
            return;

        AWS.callSoap(WS, "newBenefitConfigVariantSeniority", {...data, variantId: variantGrid.getSelectedRow().id}).then( res => {
            if (res.wsStatus === '0') {
                updateSeniorityGrid();
            }
        })
    });

    $$('seniority-edit').onclick(async () => {
        let row = seniorityGrid.getSelectedRow();
        let data = await tierPopup($$('benefit-config-list').getLabel(), row);

        if (!data)
            return;

        AWS.callSoap(WS, "saveBenefitConfigVariantSeniority", {...data, id: row.id}).then( res => {
            if (res.wsStatus === '0') {
                updateSeniorityGrid();
            }
        })
    });

    $$('seniority-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Tier?', () => {
            const data = {
                ids: [seniorityGrid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteBenefitConfigVariantSeniority", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateSeniorityGrid();
                }
            });
        });
    });

})();
