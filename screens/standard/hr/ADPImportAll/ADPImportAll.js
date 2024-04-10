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
    const WS = 'com.arahant.services.standard.hr.ADPInterface';

    $$('run-import').onclick(() => {
        Server.call(WS, "StartImportAll").then(function (res) {
            if (res._Success) {
                Utils.showMessage('Information', 'The ADP import has been started and will complete in about five minutes.');
            }
        });
    });

    $$('get-status').onclick(() => {
        Server.call(WS, "GetStatus").then(function (res) {
            if (res._Success) {
                if (res.isRunning) {
                    Utils.showMessage('Information', 'The ADP import is currently running.');
                } else {
                    if (!res.lastCompletionDate)
                        Utils.showMessage('Information', 'The ADP import has not been run since the last server reboot.');
                    else {
                        $$('is-last-completion-date').setValue(res.lastCompletionDate);
                        $$('is-hired-applicants').setValue(res.hiredApplicants);
                        $$('is-total-workers-received').setValue(res.totalWorkersReceived);
                        $$('is-total-new-workers').setValue(res.totalNewWorkers);
                        $$('is-total-updated-workers').setValue(res.totalUpdatedWorkers);
                        $$('is-skipped-office-workers').setValue(res.skippedOfficeWorkers);
                        $$('is-errors').setValue(res.totalWorkersReceived - res.totalNewWorkers - res.totalUpdatedWorkers - res.skippedOfficeWorkers);
                        Utils.popup_open('import-status');
                         $$('is-ok').onclick(() => {
                             Utils.popup_close();
                         })
                    }
                }
            }
        });
    });

})();
