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

    const WS = 'StandardMiscVendorReport';

    $$('chk-client-id').setValue(true);
    $$('chk-primary-contact').setValue(true);
    $$('chk-company-phone').setValue(true);
    $$('chk-address').setValue(true);
    $$('chk-contract-date').setValue(true);

    $$('sort-column').setValue('1');
    $$('sort-direction').setValue('true');

    $$('btn-report').onclick(() => {
        const data = {
            address: $$('chk-address').getValue(),
            companyPhone: $$('chk-company-phone').getValue(),
            identifier: $$('chk-client-id').getValue(),
            primaryContact: $$('chk-primary-contact').getValue(),
            sortAsc: $$('sort-direction').getValue(),
            sortType: $$('sort-column').getValue(),
        }
        AWS.callSoap(WS, 'getVendorReport', data).then(ret => {
            if (ret.wsStatus === '0') {
                Utils.showReport(ret.fileName);
            }
        })
    });

})();
