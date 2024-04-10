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
    const WS = 'standard.hr.paychexExport';

    $$('run-demo-export').onclick(function () {
        const data = {
        };
        Utils.waitMessage("Export generation in progress.  Please wait.")
        ADWS.callSoap(WS, 'PerformExport', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showReport(res.exportFileName);
            }
        });
    });

    $$('run-time-export').onclick(function () {
        if ($$('time-beg-date').isError('Timesheet export Period Beginning'))
            return;
        if ($$('time-end-date').isError('Timesheet export Period End'))
            return;
        const data = {
            begPeriod: $$('time-beg-date').getIntValue(),
            endPeriod: $$('time-end-date').getIntValue()
        };
        Utils.waitMessage("Export generation in progress.  Please wait.")
        ADWS.callSoap(WS, 'TimeExport', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showReport(res.exportFileName);
            }
        });
    });

    $$('run-per-diem-export').onclick(function () {
        if ($$('per-diem-beg-date').isError('Per Diem Export Period Beginning'))
            return;
        if ($$('per-diem-end-date').isError('Per Diem Export Period End'))
            return;
        const data = {
            begPDPeriod: $$('per-diem-beg-date').getIntValue(),
            endPDPeriod: $$('per-diem-end-date').getIntValue()
        };
        Utils.waitMessage("Export generation in progress.  Please wait.")
        ADWS.callSoap(WS, 'PerDiemExport', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showReport(res.exportFileName);
            }
        });
    });


})();
