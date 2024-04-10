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
    const WS = 'StandardHrWorkHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Date Worked', field: 'dateLastWorked', width: 25  },
        {headerName: 'Project ID', field: 'projectId', width: 25 },
        {headerName: 'Ext Reference', field: 'extRef', width: 30 },
        {headerName: 'Summary', field: 'summary', width: 70 },
        {headerName: 'Billable Hours', field: 'billableHours', type: 'numericColumn', width: 20 },
        {headerName: 'Nonbillable Hours', field: 'nonbillableHours', type: 'numericColumn', width: 20 },
        {headerName: '', field: '', width: 1 }
    ];
    const grid = new AGGrid('history-grid', columnDefs, 'id');

    grid.show();

    /*
    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });
     */

    function updateGrid() {
        const allDates = $$('all-dates').getValue();
        const firstDate = allDates ? 0 : $$('first-date').getIntValue();
        const lastDate = allDates ? 22000101 : $$('last-date').getIntValue();
        const data = {
            employeeId: personId,
            firstDate: firstDate,
            lastDate: lastDate
        };
        //Utils.waitMessage("Getting records; Please wait.")
        AWS.callSoap(WS, 'workerHistoryItems', data).then(function (res) {
            //Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                for (let i = 0; i < res.item.length; i++) {
                    let row = res.item[i];
                    row.dateLastWorked = DateUtils.intToStr4(Number(row.dateLastWorked));
                    row.billableHours = Utils.format(Number(row.billableHours), "B", 0, 2);
                    row.nonbillableHours = Utils.format(Number(row.nonbillableHours), "B", 0, 2);
                }
                grid.clear().addRecords(res.item);
                $$('status').setValue("Displaying " + res.item.length + " rows");
            }
        });
    }

    $$('search').onclick(updateGrid);

    $$('all-dates').onChange((val) => {
        if (val) {
            $$('first-date').disable().clear();
            $$('last-date').disable().clear();
        } else {
            $$('first-date').enable();
            $$('last-date').enable();
        }
    });

    $$('report').onclick(() => {
        const allDates = $$('all-dates').getValue();
        const firstDate = allDates ? 0 : $$('first-date').getIntValue();
        const lastDate = allDates ? 22000101 : $$('last-date').getIntValue();
        const data = {
            employeeId: personId,
            firstDate: firstDate,
            lastDate: lastDate
        };
        //Utils.waitMessage("Creating report; Please wait.")
        AWS.callSoap(WS, 'workerHistoryReport', data).then(function (res) {
            //Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
               Utils.showReport(res.fileName);
            }
        });
    });

})();
