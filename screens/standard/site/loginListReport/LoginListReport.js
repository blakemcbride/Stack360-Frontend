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

window.CompanyOrgGroup = {};

(async function () {

    const WS = 'StandardSiteLoginListReport';

    $$('chk-name').setValue(true);
    $$('chk-login-attempt').setValue(false);
    $$('chk-login-name').setValue(false);

    $$('sort-column').setValue('0');
    $$('sort-direction').setValue('true');

    $$('filter-success').setValue(true);
    $$('filter-failed').setValue(false);

    $$('btn-report').onclick(() => {
        Utils.waitMessage('Report in progress; please wait.')
        const data = {
            includeName: $$('chk-name').getValue(),
            includeLoginAttemptStatus: $$('chk-login-attempt').getValue(),
            includeLoginName: $$('chk-login-name').getValue(),
            showSuccessfulLoginAttempts: $$('filter-success').getValue(),
            showFailedLoginAttempts: $$('filter-failed').getValue(),
            loginAttemptDateFrom: $$('date-from').getIntValue(),
            loginAttemptDateTo: $$('date-to').getIntValue(),
            sortAsc: $$('sort-direction').getValue(),
            sortType: $$('sort-column').getValue(),
        }
        AWS.callSoap(WS, 'getReport', data).then(ret => {
            Utils.waitMessageEnd();
            if (ret.wsStatus === '0') {
                Utils.showReport(ret.reportUrl);
            }
        });
    });

})();
