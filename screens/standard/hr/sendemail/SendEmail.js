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

    const WS = 'com.arahant.services.standard.hr.sendemail';

    $$('send-email').onclick(function () {
        if ($$('begdate').isError('Beginning date'))
            return;
        if ($$('enddate').isError('Ending date'))
            return;
        if ($$('subject').isError('Subject'))
            return;
        if ($$('msg').isError('Message'))
            return;
        const data = {
            begdate: $$('begdate').getIntValue(),
            enddate: $$('enddate').getIntValue(),
            subject: $$('subject').getValue(),
            msg: $$('msg').getValue()
        };
        Server.call(WS, "SendEmail", data).then(function (res) {
            if (res._Success) {
                Utils.showMessage('Info', 'Messages sent.');
            }
        });

    });

})();


