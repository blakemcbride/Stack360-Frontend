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
    const WS = 'StandardHrBillingRate';

    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);

    $$('worker-name').setValue(personName);

    /*
    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });
     */

    let grid;
    const colDefs = [
        {headerName: "Rate Type", field: "rateCode", width: 800},
        {headerName: "Rate", field: "rateFormatted", type: 'numericColumn', width: 400},
    ];
    grid = new AGGrid('grid', colDefs);
    grid.show();

    const getBillingRates = () => {
        $$('edit').disable();
        $$('delete').disable();
        const params = {
            personId: personId
        }

        AWS.callSoap(WS, 'loadEmployeeRates', params).then(data => {
            grid.clear();

            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);

                for (let i = 0; i < data.item.length; i++)
                    data.item[i].rateFormatted = Utils.format(data.item[i].rate, 'D', 0, 2);

                grid.addRecords(data.item);
                $$('status-label').setValue('Displaying ' + data.item.length + ' Employee Rates');
            }
        });
    }

    function add() {
        $$('br-amount').clear();

        $$('br-title').setValue('Add');

        const param = {
            personId: personId,
            allowedRateTypeId: ''
        };
        AWS.callSoap(WS, 'listAllRates', param).then(data => {
            if (data.wsStatus === '0') {
                data.items = Utils.assureArray(data.items);
                const ctl = $$('br-type');
                ctl.clear().add('', '(select)');
                ctl.addItems(data.items, 'rateTypeId', 'code');
            }
        });

        Utils.popup_open("br-popup");

        $$('br-ok').onclick(() => {
            if ($$('br-type').isError('Rate Type'))
                return;
            const params = {
                personId: personId,
                rateTypeId: $$('br-type').getValue(),
                rate: $$('br-amount').getValue()
            };
            AWS.callSoap(WS, 'newRate', params).then(data => {
                if (data.wsStatus === '0') {
                    getBillingRates();
                    Utils.popup_close();
                }
            });
        });

        $$('br-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('add').onclick(add);

    function edit() {
        const row = grid.getSelectedRow();
        $$('br-amount').setValue(row.rate);

        $$('br-title').setValue('Edit');

        const param = {
            personId: personId,
            allowedRateTypeId: row.rateTypeId
        };
        AWS.callSoap(WS, 'listAllRates', param).then(data => {
            if (data.wsStatus === '0') {
                data.items = Utils.assureArray(data.items);
                const ctl = $$('br-type');
                ctl.clear().add('', '(select)');
                ctl.addItems(data.items, 'rateTypeId', 'code');
                ctl.setValue(row.rateTypeId);
            }
        });

        Utils.popup_open("br-popup");

        $$('br-ok').onclick(() => {
            if ($$('br-type').isError('Rate Type'))
                return;
            const params = {
                personId: personId,
                employeeRateId: row.employeeRateId,
                rateTypeId: $$('br-type').getValue(),
                rate: $$('br-amount').getValue()
            };
            AWS.callSoap(WS, 'saveRate', params).then(data => {
                if (data.wsStatus === '0') {
                    getBillingRates();
                    Utils.popup_close();
                }
            });
        });

        $$('br-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    grid.setOnRowDoubleClicked(edit);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('delete').onclick(() => {
        const row = grid.getSelectedRow();
        Utils.yesNo('Inquirey', 'Okay to delet this employee rate?', () => {
            const params = {
                ids: [row.employeeRateId]
            };
            AWS.callSoap(WS, 'deleteRates', params).then(data => {
                if (data.wsStatus === '0') {
                    getBillingRates();
                }
            });
        });
    });

    getBillingRates();
})();
