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
    const WS = 'com.arahant.services.standard.project.imageUploadReport';

    $$('run-report').onclick(function () {
        if ($$('date-type').isError('date range type'))
            return;
        if ($$('beginning-date').isError('Beginning date'))
            return;
        if ($$('ending-date').isError('Ending date'))
            return;
        let data = {
            date_type: $$('date-type').getValue(),
            beginning_date: $$('beginning-date').getIntValue(),
            ending_date: $$('ending-date').getIntValue()
        };
        Server.call(WS, "CreateReport", data).then(function (res) {
            if (res._Success)
                Utils.showReport(res.filename);
        });
    });

    $$('run-export').onclick(function () {
        if ($$('date-type').isError('date range type'))
            return;
        if ($$('beginning-date').isError('Beginning date'))
            return;
        if ($$('ending-date').isError('Ending date'))
            return;
        let data = {
            date_type: $$('date-type').getValue(),
            beginning_date: $$('beginning-date').getIntValue(),
            ending_date: $$('ending-date').getIntValue()
        };
        Server.call(WS, "CreateExport", data).then(function (res) {
            if (res._Success)
                Utils.showReport(res.filename);
        });
    });

})();

