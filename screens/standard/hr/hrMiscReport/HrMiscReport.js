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

    const WS = 'StandardHrHrMiscReport';

    $$('mr-rep_name').add('', "(select)");
    AWS.callSoap(WS, 'listReports').then(listReports => {
        if (listReports.wsStatus === "0") {
            listReports.item = Utils.assureArray(listReports.item);
            $$('mr-rep_name').addItems(listReports.item, "reportId", "reportName");
        }  
    });

    $$('report').onclick(() => {
        if ($$('mr-rep_name').isError('Report Name'))
            return;

        const params = {
            reportId: $$('mr-rep_name').getValue()
        }
        AWS.callSoap(WS, "getReport", params).then(res => {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
