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

    const WS = 'StandardHrEmployeeGarnishment';

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== '0') {
            return;
        }
    });

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        { headerName: 'Start Date', field: 'startDateFormatted', width: 30 },
        { headerName: 'Final Date', field: 'finalDateFormatted', width: 30 },
        { headerName: 'Type', field: 'typeDescription', width: 30 },
        { headerName: 'Deduct Type', field: 'deductTypeFormatted', width: 40 },
        { headerName: 'Amount', field: 'amountFormatted', type: 'numericColumn', width: 40 },
        { headerName: 'Max Amount', field: 'maxAmountFormatted', type: 'numericColumn', width: 40 },
        { headerName: 'Docket Number', field: 'docketNumber'},
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');

    grid.show();
    grid.setOnSelectionChanged(function () {
        $$('edit').enable();
        $$('delete').enable();
        $$('moveUp').enable();
        $$('moveDown').enable();
    });

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        $$('moveUp').disable();
        $$('moveDown').disable();

        let data = {
            personId: personId
        };
        
        AWS.callSoap(WS, "listGarnishments", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);

                for (let i = 0; i < res.item.length; i ++) {
                    res.item[i].startDateFormatted = DateUtils.intToStr4(res.item[i].startDate);
                    res.item[i].finalDateFormatted = DateUtils.intToStr4(res.item[i].finalDate);
                    res.item[i].deductTypeFormatted = res.item[i].deductType === 'N' ? 'Net' : 'Gross';
                    res.item[i].amountFormatted = res.item[i].amountType === 'P' ?
                                                 Number(res.item[i].amount).toFixed(2) + '%' :
                                                 '$' + Number(res.item[i].amount).toFixed(2);
                    res.item[i].maxAmountFormatted = res.item[i].amountType === 'P' ?
                                                    '$' + Number(res.item[i].maxAmount).toFixed(2) :
                                                    Number(res.item[i].maxAmount).toFixed(2) + '%';
                }
                
                grid.addRecords(res.item);

                $$('status').setValue('Displaying ' + res.item.length + ' Wage Garnishments');
            }
        });
    }

    updateGrid();

    async function executeSelectFunc(element, fn, id, name) {
        let selectedNode = await fn();
        if (selectedNode) {
            $$(element).setValue(selectedNode[id], selectedNode[name]);
        }
    }

    const addWageGarnishments = () => {
        $$('ap-title').setValue('Add Wage Garnishment');
        $$('start-date').clear();
        $$('final-date').clear();
        $$('ap-type').setValue('');
        $$('ap-deduction-type').setValue('1');
        $$('ap-amount-type').setValue('2');
        $$('ap-amount-percent').setValue(0);
        $$('ap-amount-flat').setValue(0);
        $$('ap-max-amount-percent').setValue(0);
        $$('ap-max-amount-flat').setValue(0);
        $$('ap-max-amount-span').setValue('(Percent)');

        $$('ap-amount-flat').hide();
        $$('ap-amount-percent').show();
        $$('ap-max-amount-flat').hide();
        $$('ap-max-amount-percent').show();

        $$('docket-number').clear();
        $$('fips-code').clear();
        $$('issue-state').setValue('');
        $$('collecting-state').setValue('');
        $$('ap-name').clear();
        $$('ap-address1').clear();
        $$('ap-address2').clear();
        $$('ap-country').setValue('US');
        $$('ap-city').clear();
        $$('ap-state-input').clear();
        $$('ap-state-drop').setValue('');
        $$('ap-postal-code').clear();
        $$('ap-county').clear();
        
        Utils.popup_open('add-popup', 'ap-description');

        $$('ap-ok').onclick(() => {
            if ($$('ap-type').isError('Type'))
                return;
    
            let amount = $$('ap-amount-type').getValue() === '1' ?
                         $$('ap-amount-flat').getValue() :
                         $$('ap-amount-percent').getValue();
            let maxAmount = $$('ap-amount-type').getValue() === '1' ?
                         $$('ap-max-amount-flat').getValue() :
                         $$('ap-max-amount-percent').getValue();
            let remitToStateProvince = $$('ap-country').getValue() === 'US' ? 
                                       $$('ap-state-drop').getValue() : 
                                       $$('ap-state-input').getValue();
            const data = {
                amount: amount,
                amountType: $$('ap-amount-type').getValue() === '1' ? 'F' : 'P',
                collectingState: $$('collecting-state').getValue(),
                deductType: $$('ap-deduction-type').getValue() === '1' ? 'N' : 'G',
                docketNumber: $$('docket-number').getValue(),
                finalDate: $$('final-date').getIntValue(),
                fipsCode: $$('fips-code').getValue(),
                issueState: $$('issue-state').getValue(),
                maxAmount: maxAmount,
                personId: personId,
                remitToAddressLine1: $$('ap-address1').getValue(),
                remitToAddressLine2: $$('ap-address2').getValue(),
                remitToCity: $$('ap-city').getValue(),
                remitToCountry: $$('ap-country').getValue(),
                remitToCounty: $$('ap-county').getValue(),
                remitToName: $$('ap-name').getValue(),
                remitToStateProvince: remitToStateProvince, 
                remitToZipPostalCode: $$('ap-postal-code').getValue(),
                startDate: $$('start-date').getIntValue(),
                typeId: $$('ap-type').getValue()
            };
            AWS.callSoap(WS, 'newGarnishment', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    const editWageGarnishments = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }
        $$('ap-title').setValue('Edit Wage Garnishment');
        AWS.callSoap(WS, 'loadGarnishment', {
            id: row.id
        }).then(res => {
            $$('start-date').setValue(row.startDate);
            $$('final-date').setValue(row.finalDate);
            // $$('ap-type').setValue(row.typeId, row.typeDescription);
            $$('ap-type').setValue(row.typeId);
            if (row.deductType === "N") {
                $$('ap-deduction-type').setValue('1');
            } else {
                $$('ap-deduction-type').setValue('2');
            }
            if (row.amountType === "F") {
                $$('ap-amount-type').setValue('1');
                $$('ap-max-amount-span').setValue('(Flat)');
                $$('ap-amount-percent').setValue(0);
                $$('ap-amount-flat').setValue(row.amount);
                $$('ap-max-amount-flat').setValue(row.maxAmount);
                $$('ap-max-amount-percent').setValue(0);
                $$('ap-amount-flat').show();
                $$('ap-amount-percent').hide();
                $$('ap-max-amount-flat').show();
                $$('ap-max-amount-percent').hide();
            } else {
                $$('ap-amount-type').setValue('2');
                $$('ap-max-amount-span').setValue('(Percent)');
                $$('ap-amount-percent').setValue(row.amount);
                $$('ap-amount-flat').setValue(0);
                $$('ap-max-amount-flat').setValue(0);
                $$('ap-max-amount-percent').setValue(row.maxAmount);
                $$('ap-amount-flat').hide();
                $$('ap-amount-percent').show();
                $$('ap-max-amount-flat').hide();
                $$('ap-max-amount-percent').show();
            }
            $$('docket-number').setValue(row.docketNumber);
            $$('fips-code').setValue(res.fipsCode);
            $$('issue-state').setValue(res.issueState);
            $$('collecting-state').setValue(res.collectingState);
            $$('ap-name').setValue(res.remitToName);
            $$('ap-address1').setValue(res.remitToAddressLine1);
            $$('ap-address2').setValue(res.remitToAddressLine2);
            $$('ap-country').setValue(res.remitToCountry);
            if (res.remitToCountry === 'US') {
                $$('ap-state-drop').setValue(res.remitToStateProvince);
                $$('ap-state-input').setValue('');
            } else {
                $$('ap-state-drop').setValue('');
                $$('ap-state-input').setValue(res.remitToStateProvince);
            }
            $$('ap-city').setValue(res.remitToCity);
            $$('ap-postal-code').setValue(res.remitToZipPostalCode);
            $$('ap-county').setValue(res.remitToCounty);
        });
        
        Utils.popup_open('add-popup', 'ap-description');

        $$('ap-ok').onclick(() => {
            if ($$('ap-type').isError('Type'))
                return;
    
            let amount = $$('ap-amount-type').getValue() === '1' ?
                         $$('ap-amount-flat').getValue() :
                         $$('ap-amount-percent').getValue();
            let maxAmount = $$('ap-amount-type').getValue() === '1' ?
                         $$('ap-max-amount-flat').getValue() :
                         $$('ap-max-amount-percent').getValue();
            let remitToStateProvince = $$('ap-country').getValue() === 'US' ? 
                                       $$('ap-state-drop').getValue() : 
                                       $$('ap-state-input').getValue();
            const data = {
                id: row.id,
                amount: amount,
                amountType: $$('ap-amount-type').getValue() === '1' ? 'F' : 'P',
                collectingState: $$('collecting-state').getValue(),
                deductType: $$('ap-deduction-type').getValue() === '1' ? 'N' : 'G',
                docketNumber: $$('docket-number').getValue(),
                finalDate: $$('final-date').getIntValue(),
                fipsCode: $$('fips-code').getValue(),
                issueState: $$('issue-state').getValue(),
                maxAmount: maxAmount,
                personId: personId,
                remitToAddressLine1: $$('ap-address1').getValue(),
                remitToAddressLine2: $$('ap-address2').getValue(),
                remitToCity: $$('ap-city').getValue(),
                remitToCountry: $$('ap-country').getValue(),
                remitToCounty: $$('ap-county').getValue(),
                remitToName: $$('ap-name').getValue(),
                remitToStateProvince: remitToStateProvince, 
                remitToZipPostalCode: $$('ap-postal-code').getValue(),
                startDate: $$('start-date').getIntValue(),
                typeId: $$('ap-type').getValue()
            };
            AWS.callSoap(WS, 'saveGarnishment', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    };

    let reset = () => {
        let param = {
            codeSearchType: 2,
            descriptionSearchType: 2
        };
        AWS.callSoap(WS, 'searchGarnishmentTypes', param).then(res => {
            
            if (res.wsStatus === '0') {
                let typeCtrl = $$('ap-type');
                typeCtrl.clear();

                typeCtrl.add("", "(choose)");

                // Add the sources to the drop down control.
                res.item = Utils.assureArray(res.item);

                if (res.item) {
                    res.item.forEach(item => {
                        typeCtrl.add(item.id, item.description, item);
                    });
                }
                // if (!res.item) {
                //     $$('ap-type').clear();
                //     $$('ap-type').forceSelect();
                //     return;
                // }
        
                // if (res.item.length > res.lowCap) {
                //     $$('ap-type').forceSelect();
                // }
        
                // $$('ap-type').addItems(Utils.assureArray(res.item), 'id', 'description');
        
                // if (res.selectedItem) {
                //     $$('ap-type').addItems(Utils.assureArray(res.selectedItem), 'id', 'description');
                //     $$('ap-type').setValue(res.selectedItem['id'], res.selectedItem['description']);
                // }
            }

        });

        // $$('ap-type').forceSelect();
        countriesToDropDown('ap-country');
        statesToDropDown('ap-state-drop', US_STATE_ABBREVIATIONS);
        statesToDropDown('issue-state', US_STATE_ABBREVIATIONS);
        statesToDropDown('collecting-state', US_STATE_ABBREVIATIONS);
    };    

    reset();

    $$('add').onclick(addWageGarnishments);
    $$('edit').onclick(editWageGarnishments);
    grid.setOnRowDoubleClicked(editWageGarnishments);

    // $$('ap-type').setSelectFunction(() => executeSelectFunc('ap-type', searchGarnishmentType, 'id', 'description'));

    const searchGarnishmentType = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('garnishment-type-search');
    
        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('gt-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('gt-code-search').clear();
    
                $$('gt-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('gt-description-search').clear();
    
                $$('gt-reset').enable();
                $$('gt-search').enable();
    
                $$('gt-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };
    
            let changeCount = count => {
                Utils.setText('gt-count', `Displaying ${count} Garnishment Types`);
            };
    
            let ok = () => {    
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('gt-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('gt-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120},
                ];
    
                formSearchGrid = new AGGrid('gt-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('gt-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
                let inParams = {
                    code: $$('gt-code-search').getValue(),
                    codeSearchType: $$('gt-code-criteria').getValue(),
                    description: $$('gt-description-search').getValue(),
                    descriptionSearchType: $$('gt-description-criteria').getValue(),
                };
    
                AWS.callSoap(WS, 'searchGarnishmentTypes', inParams).then(data => {
                    if (data.wsStatus === '0') {
    
                        // Clear the grid.
                        formSearchGrid.clear();
    
                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('gt-reset').onclick(reset);
            $$('gt-search').onclick(search);
            $$('gt-ok').onclick(ok);
            $$('gt-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    $$('ap-amount-type').onChange((v) => {
        if (v === '1') {
            $$('ap-amount-flat').show();
            $$('ap-amount-percent').hide();
            $$('ap-max-amount-flat').show();
            $$('ap-max-amount-percent').hide();
            $$('ap-max-amount-span').setValue('(Flat)');
        } else {
            $$('ap-amount-flat').hide();
            $$('ap-amount-percent').show();
            $$('ap-max-amount-flat').hide();
            $$('ap-max-amount-percent').show();
            $$('ap-max-amount-span').setValue('(Percent)');
        }
    });

    $$('ap-country').onChange((v) => {
        if (v === 'US') {
            $$('ap-state-drop').show();
            $$('ap-state-input').hide();
            $$('ap-state-input').setValue('');
        } else {
            $$('ap-state-drop').hide();
            $$('ap-state-input').show();
            $$('ap-state-drop').setValue('');
        }
    });

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Wage Garnishment?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteGarnishments", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            personId: personId
        };

        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('moveUp').onclick(() => {
        const row = grid.getSelectedRow();

        if (!row) {
            return;
        }

        const data = {
            id: row.id,
            moveUp: true
        };

        AWS.callSoap(WS, "moveGarnishment", data).then(res => {
            if (res.wsStatus === '0') {
                updateGrid();
                
                setTimeout(() => grid.selectId(row.id), 100);
            }
        });
    });

    $$('moveDown').onclick(() => {
        const row = grid.getSelectedRow();

        if (!row) {
            return;
        }

        const data = {
            id: row.id,
            moveUp: false
        };

        AWS.callSoap(WS, "moveGarnishment", data).then(res => {
            if (res.wsStatus === '0') {
                updateGrid();
                
                setTimeout(() => grid.selectId(row.id), 100);
            }
        });
    });

})();
