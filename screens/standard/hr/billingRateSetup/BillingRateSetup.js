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
    const WS = 'StandardHrBillingRateSetup';

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    let billingRateTypesGrid;
    const billingRateTypesDefs = [
        {headerName: "Type", field: "type2", width: 40},
        {headerName: "Code", field: "code", width: 40},
        {headerName: "Description", field: "description", width: 200}
    ];
    billingRateTypesGrid = new AGGrid('billingRateTypesGrid', billingRateTypesDefs);
    billingRateTypesGrid.show();

    const getBillingRateTypes = () => {
        $$('edit').disable();
        $$('delete').disable();

        AWS.callSoap(WS, 'list').then(data => {
            billingRateTypesGrid.clear();

            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i=0 ; i < data.item.length ; i++) {
                    let r = data.item[i];
                    switch (r.type) {
                        case "P":
                            r.type2 = "Project";
                            break;
                        case "E":
                            r.type2 = "Employee";
                            break;
                        case "B":
                            r.type2 = "Both";
                            break;
                    }
                }

                billingRateTypesGrid.addRecords(data.item);
                $$('status-label').setValue('Displaying ' + data.item.length + ' Billing Rate Types');
                billingRateTypesGrid.setOnRowDoubleClicked(edit);

                billingRateTypesGrid.setOnSelectionChanged(() => {
                    $$('edit').enable();
                    $$('delete').enable();
                });
            }
        });
    }

    $$('add').onclick(() => {
        $$('brs-description').clear();
        $$('brs-code').clear();

        Utils.popup_open("brs-popup", "brs-code");
        $$('brs-title').setValue('Add');

        $$('brs-ok').onclick(() => {
            if($$('brs-type').isError('Billing Rate Type'))
                return;
            if($$('brs-code').isError('Billing Rate Code'))
                return;
            if($$('brs-description').isError('Billing Rate Description'))
                return;

            const params = {
                type: $$('brs-type').getValue(),
                code: $$('brs-code').getValue(),
                description: $$('brs-description').getValue()
            };
            AWS.callSoap(WS, 'newBillingRate', params).then(data => {
                if (data.wsStatus === '0') {
                    getBillingRateTypes();   
                    Utils.popup_close();
                }
            });        
        });

        $$('brs-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Billing Rate Type?', () => {
            const params = {
                ids: billingRateTypesGrid.getSelectedRow().rateTypeId
            };
            AWS.callSoap(WS, "deleteBillingRate", params).then(data => {
                if (data.wsStatus === '0') {
                    getBillingRateTypes();
                }
            });
        });
    });

    function edit() {
        const row = billingRateTypesGrid.getSelectedRow();
        $$('brs-title').setValue('Edit');
        $$('brs-type').setValue(row.type);
        $$('brs-code').setValue(row.code);
        $$('brs-description').setValue(row.description);

        Utils.popup_open("brs-popup", "brs-code");

        $$('brs-ok').onclick(() => {
            if($$('brs-type').isError('Billing Rate Type'))
                return;
            if($$('brs-code').isError('Billing Rate Code'))
                return;
            if($$('brs-description').isError('Billing Rate Description'))
                return;
            const params = {
                id: row.rateTypeId,
                type: $$('brs-type').getValue(),
                code: $$('brs-code').getValue(),
                description: $$('brs-description').getValue()
            };
            AWS.callSoap(WS, 'save', params).then(data => {
                if (data.wsStatus === '0') {
                    getBillingRateTypes();   
                    Utils.popup_close();
                }
            });        
        });

        $$('brs-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    getBillingRateTypes();
})();
