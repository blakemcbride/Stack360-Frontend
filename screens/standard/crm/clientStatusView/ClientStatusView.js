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

    const WS = 'StandardCrmClientStatusView';
    
    const clientId = Utils.getData("CURRENT_CLIENT_ID");
    const clientName = Utils.getData("CURRENT_CLIENT_NAME");

    $$('client-info').setValue(clientName).setColor('black');
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    await AWS.callSoap(WS, "listClientStatuses").then(res => {
        if (res.wsStatus === '0') {
            let statusList = $$('status-list');
            statusList.clear();

            statusList.add("", "(select)");

            // Add the categories to the drop down control.
            res.item = Utils.assureArray(res.item);
            if (res.item) {
                res.item.forEach(status => {
                    statusList.add(status.id, status.name + ' - ' + status.description);
                });
            }

            if (res.item.length > 0) {
                statusList.selectIndex(1);
            }

        }
    });

    const request = {
        id: clientId
    };

    await AWS.callSoap(WS, "loadClientStatus", request).then(res => {
        if (res.wsStatus === '0') {
            let statusList = $$('status-list');
            statusList.setValue(res.statusId);

            $$('status-comment').setValue(res.comments);
            $$('dp-last-contact').setValue(res.lastContactDate);
        }
    });
        
    Framework.askBeforeLeaving = true;  //  make sure changes are not lost when changing screens
    Utils.setSomeControlValueChangeFunction(function (status) {
        if (Utils.popup_context.length) {
            return;
        }
        if (status) {
            $$('save').enable();
            $$('reset').enable();
            $$('client-info').setValue(clientName + " (unsaved changes)").setColor('red');
        } else {
            $$('save').disable();
            $$('reset').disable();
            $$('client-info').setValue(clientName).setColor('black');
        }
        Framework.askBeforeLeaving = status;
    });

    $$('save').onclick(function () {
        if ($$('status-list').isError('Current Status'))
            return;

        if ($$('dp-last-contact').isError('Last Contact'))
            return;

        const data = {
            id: clientId,
            lastContactDate: $$('dp-last-contact').getIntValue(),
            comments: $$('status-comment').getValue(),
            statusId: $$('status-list').getValue()
        };
        AWS.callSoap(WS, 'saveClientStatus', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('save').disable();
                $$('reset').disable();
                $$('client-info').setValue(clientName).setColor('black');
                Utils.clearSomeControlValueChanged(false);
                Framework.askBeforeLeaving = false;
                Utils.showMessage('Information', 'Save completed successfully.');
            }
        });

    });

    $$('reset').onclick(function () {
        $$('client-info').setValue(clientName).setColor('black');
        Utils.clearSomeControlValueChanged(true);
        
        const request = {
            id: clientId
        };
    
        AWS.callSoap(WS, "loadClientStatus", request).then(res => {
            if (res.wsStatus === '0') {
                let statusList = $$('status-list');
                statusList.setValue(res.statusId);
    
                $$('status-comment').setValue(res.comments);
                $$('dp-last-contact').setValue(res.lastContactDate);
            }
        });
    });

})();
