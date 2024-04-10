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
    const WS = 'com.arahant.services.standard.hr.adpExport';

    $$('export').onclick(function () {

        if ($$('beg-period').isError('Beginning Period'))
            return;
        if ($$('end-period').isError('Ending Period'))
            return;

        Utils.waitMessage('Please wait; Generating export.');
        const data = {
            beginning_period: $$('beg-period').getIntValue(),
            ending_period: $$('end-period').getIntValue()
        };
        Server.call(WS, "CreateExport", data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success)
                Utils.showReport(res.filename);
        });
    });

})();
