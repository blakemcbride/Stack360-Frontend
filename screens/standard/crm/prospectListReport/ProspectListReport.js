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

    const WS = 'StandardCrmProspectListReport';

    $$('chk-prospect-id').setValue(true);
    $$('chk-primary-contact').setValue(false);
    $$('chk-company-phone').setValue(false);
    $$('chk-address').setValue(false);

    $$('sort-column').setValue('1');
    $$('sort-direction').setValue('true');

    $$('btn-report').onclick(() => {
        const data = {
            address: $$('chk-address').getValue(),
            companyPhoneNumber: $$('chk-company-phone').getValue(),
            identifier: $$('chk-prospect-id').getValue(),
            primaryContactName: $$('chk-primary-contact').getValue(),
            sortAsc: $$('sort-direction').getValue(),
            sortType: $$('sort-column').getValue(),
        }
        AWS.callSoap(WS, 'getReport', data).then(ret => {
            if (ret.wsStatus === '0') {
                Utils.showReport(ret.reportUrl);
            }
        })
    });

})();
