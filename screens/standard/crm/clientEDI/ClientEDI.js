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
    const WS = 'StandardCrmClientEDI';

    const clientId = Utils.getData(CURRENT_CLIENT_ID);
    const clientName = Utils.getData(CURRENT_CLIENT_NAME);

    Framework.askBeforeLeaving = true;

    $$('client-name').setValue(clientName).setColor('black');

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    $$('scheme').clear().add('', '(select)');
    let res = await AWS.callSoap(WS, 'listEDICommunicationSchemes');
    if (res.wsStatus === "0") {
        $$('scheme').addItems(res.item, 'id', 'description');
    }

    function schemeChange() {
        if ($$('scheme').getValue() !== '') {
            $$('username').enable();
            $$('host').enable();
            $$('password').enable();
            $$('port').enable().setValue($$('scheme').getData().defaultPort);
            $$('directory').enable();
            $$('publicKeyId').enable();
            $$('publicKeyText').enable();
        } else {
            $$('username').disable().clear();
            $$('host').disable().clear();
            $$('password').disable().clear();
            $$('port').disable().clear();
            $$('directory').disable().clear();
            $$('publicKeyId').disable().clear();
            $$('publicKeyText').disable().clear();
        }
    }

    $$('scheme').onChange(schemeChange);

    function loadEDI() {
        const params = {
            id: clientId
        }    
        AWS.callSoap(WS, 'loadEDI', params).then(function (res) {
            if (res.wsStatus === "0") {
                $$('appSenderId').setValue(res.applicationSenderId);
                $$('interSenderId').setValue(res.interchangeSenderId);
                $$('appReceiverId').setValue(res.applicationReceiverId);
                $$('interReceiverId').setValue(res.interchangeReceiverId);
                $$('scheme').setValue(res.transferSchemeId);
                $$('username').setValue(res.transferUsername);
                $$('host').setValue(res.transferHost);
                $$('password').setValue(res.transferPassword);
                $$('port').setValue(res.transferPort);
                $$('directory').setValue(res.transferDirectory);
                $$('publicKeyId').setValue(res.transferEncryptionKeyIdInHex);
                $$('publicKeyText').setValue(res.transferEncryptionKey);
                $$('reset').disable();
                $$('save').disable();
                $$('client-name').setValue(clientName).setColor('black');
                Utils.clearSomeControlValueChanged(false);
                schemeChange();
            }
        });
    }    
    loadEDI();

    $$('save').onclick(() => {
        if ($$('port').isError('Port'))
            return;
        const params = {
            id: clientId,
            applicationSenderId: $$('appSenderId').getValue(),
            interchangeSenderId: $$('interSenderId').getValue(),
            applicationReceiverId: $$('appReceiverId').getValue(),
            interchangeReceiverId: $$('interReceiverId').getValue(),
            transferSchemeId: $$('scheme').getValue(),
            transferUsername: $$('username').getValue(),
            transferHost: $$('host').getValue(),
            transferPassword: $$('password').getValue(),
            transferPort: $$('port').getValue(),
            transferDirectory: $$('directory').getValue(),
            transferEncryptionKeyIdInHex: $$('publicKeyId').getValue(),
            transferEncryptionKey: $$('publicKeyText').getValue(),
        } 
        AWS.callSoap(WS, 'saveEDI', params).then(function (res) {
            if (res.wsStatus === "0") {
                $$('reset').disable();
                $$('save').disable();
                $$('client-name').setValue(clientName).setColor('black');
                Utils.clearSomeControlValueChanged(false);
            }
        });
    });

    $$('reset').onclick(loadEDI);

    Utils.setSomeControlValueChangeFunction(() => {
        $$('save').enable();
        $$('reset').enable();
        $$('client-name').setValue(clientName + " (unsaved changes)").setColor('red');
    });
})();
