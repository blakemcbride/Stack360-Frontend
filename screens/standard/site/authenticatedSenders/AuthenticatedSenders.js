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

    const WS = 'com.arahant.services.standard.site.authenticatedSenders';

    const columnDefs = [
        {headerName: 'Type', field: 'address_type2', width: 60 },
        {headerName: 'Address', field: 'address', width: 200}
    ];
    const grid = new AGGrid('grid', columnDefs, 'auth_send_id');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        Server.call(WS, "ListSenders").then(function (res) {
            if (res._Success) {
                for (let i=0 ; i < res.addresses.length ; i++) {
                    let rec = res.addresses[i];
                    if (rec.address_type === 'D')
                        rec.address_type2 = "Domain";
                    else
                        rec.address_type2 = "Email Address";
                }
                grid.addRecords(res.addresses);
                $$('status').setValue('Displaying ' + res.addresses.length + ' Authenticated Addresses');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Authenticated Address');
        $$('dp-type').clear();
        $$('dp-address').clear();
        Utils.popup_open('detail-popup');

        $$('dp-ok').onclick(() => {
            if ($$('dp-type').isError('Type'))
                return;
            if ($$('dp-address').isError('Address'))
                return;
            const type = $$('dp-type').getValue();
            const address = $$('dp-address').getValue();
            if (type === 'D' && !Utils.isValidDomain(address)) {
                Utils.showMessage('Error', address + ' is not a valid domain.');
                return;
            } else if (type === 'E' && !Utils.isValidEmailAddress(address)) {
                Utils.showMessage('Error', address + ' is not a valid email address.');
                return;
            }

            const data = {
                type: type,
                address: address
            };
            Server.call(WS, "NewSender", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                    Utils.popup_close();
                }
            });

        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();

        $$('dp-title').setValue('Edit Authenticated Address');
        $$('dp-type').setValue(row.address_type);
        $$('dp-address').setValue(row.address);

        Utils.popup_open('detail-popup');

        $$('dp-ok').onclick(() => {
            if ($$('dp-type').isError('Type'))
                return;
            if ($$('dp-address').isError('Address'))
                return;
            const type = $$('dp-type').getValue();
            const address = $$('dp-address').getValue();
            if (type === 'D' && !Utils.isValidDomain(address)) {
                Utils.showMessage('Error', address + ' is not a valid domain.');
                return;
            } else if (type === 'E' && !Utils.isValidEmailAddress(address)) {
                Utils.showMessage('Error', address + ' is not a valid email address.');
                return;
            }

            const data = {
                authSendId: row.auth_send_id,
                type: type,
                address: address
            };
            Server.call(WS, "SaveSender", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Authenticated Sender?', () => {
            const data = {
                authSendId: grid.getSelectedRow().auth_send_id
            };
            Server.call(WS, "DeleteSender", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });

})();
