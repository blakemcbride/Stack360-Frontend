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

(function () {
    const WS = 'StandardTimeEmployeeTimesheetByClockReport';

    $$('etbcr-from_date').setValue(new Date());
    $$('etbcr-to_date').setValue(new Date());

    const params = {
        nameSearchType: 0,
        name: null
    };
    AWS.callSoap(WS, 'searchSubordinateOrgGroups', params).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('etbcr-org_group');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].orgGroupId, res.item[0].name);
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].orgGroupId, res.item[i].name);
            } else {
                ctl.forceSelect();
            }
        }
    });

    $$('etbcr-org_group').setSelectFunction(async function () {
        let res = await Utils.component('orgGroupSelection/OrgGroupSelection', 'component-orggroup-selection');
        if (res._status === "ok")
            $$('etbcr-org_group').setValue(res.orgGroupId, res.orgGroupName);
    });

    $$('report').onclick(() => {
        const params = {
            fromDate: $$('etbcr-from_date').getIntValue(),
            toDate: $$('etbcr-to_date').getIntValue(),
            orgGroupId: $$('etbcr-org_group').getValue()
        }
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });     
    });    
})();
