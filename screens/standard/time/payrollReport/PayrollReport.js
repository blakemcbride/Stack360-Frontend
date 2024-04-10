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
    const WS = 'StandardTimePayrollReport';

    $$('report').onclick(async function () {
        if($$('to-date').isError('End Date'))
            return;
        if($$('from-date').isError('Start Date'))
            return;

        const params = {
            end: $$('to-date').getIntValue(),
            start: $$('from-date').getIntValue()
        }
        AWS.callSoap(WS, "getReport", params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });
    });

    $$('export').onclick(async function () {
        if($$('to-date').isError('End Date'))
            return;
        if($$('from-date').isError('Start Date'))
            return;
        const params = {
            end: $$('to-date').getIntValue(),
            start: $$('from-date').getIntValue()
        }
        AWS.callSoap(WS, "getExport", params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.csvUrl);
            }
        });
    });
})();
