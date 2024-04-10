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
    const WS = 'com.arahant.services.standard.project.noShowReport';

    $$('client').forceSelect();

    Server.call(WS, "ListSubtypes").then(function (res) {
        if (res._Success) {
            $$('sub-type').add('', '(choose)').addItems(res.subtypes, 'project_subtype_id', 'code');
        }
    });

    $$('reset').onclick(() => {
       $$('work-date').clear();
       $$('client').clear();
       $$('sub-type').setValue('');
    });

    $$('client').setSelectFunction( async function () {
        const res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
        if (res._status === "ok")
            $$('client').singleValue(res.id, res.name);
    });

    $$('run-report').onclick(function () {
        if ($$('work-date').isError('Work Date'))
            return;
        Utils.waitMessage("No-Show report in progress; Please wait.");
        const data = {
            workDate: $$('work-date').getIntValue(),
            client: $$('client').getValue(),
            subtype: $$('sub-type').getValue()
        };
        Server.call(WS, "CreateReport", data).then(function (res) {
            Utils.waitMessageEnd()
            if (res._Success)
                Utils.showReport(res.filename);
        });
    });

})();

