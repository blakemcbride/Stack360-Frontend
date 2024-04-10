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
    const WS = 'com.arahant.services.standard.project.timesheet';
    const SWS = 'StandardProjectTimesheet';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    const columnDefs = [
        {headerName: 'S', field: 'state', width: 10  },
        {headerName: 'Date', field: 'workDate2', type: 'numericColumn', width: 25 },
        {headerName: 'Begin', field: 'beginTime2', type: 'numericColumn', width: 20 },
        {headerName: 'End', field: 'endTime2', type: 'numericColumn', width: 20 },
        {headerName: 'Hours', field: 'totalHours2', type: 'numericColumn', width: 20 },
        {headerName: 'B', field: 'billable', width: 10 },
        {headerName: 'Description', field: 'timeDescription', width: 100 },
        {headerName: 'Last Name', field: 'lastName', width: 30 },
        {headerName: 'First Name', field: 'firstName', width: 30 }
    ];
    const grid = new AGGrid('grid', columnDefs);
    grid.show();

    async function getShifts(projectId) {
        // fill the list of shifts
        const data = {
            projectId: projectId
        };
        const res = await Server.call(WS, 'GetShifts', data);
        const shiftCtl = $$('shift');
        shiftCtl.clear().triggerGlobalChange(false);
        if (res._Success) {
            if (res.shifts.length === 1) {
                const shift = res.shifts[0];
                shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
            } else
                shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable();
        }
    }
    await getShifts(projectId);

    function updateGrid() {
        const data = {
            projectId: projectId,
            shiftId: $$('shift').getValue(),
            notApproved: $$('not-yet-approved').getValue(),
            approved: $$('approved').getValue(),
            invoiced: $$('invoiced').getValue(),
            startDate: $$('start-date').getIntValue(),
            finalDate: $$('end-date').getIntValue()
        };
        grid.clear();
        AWS.callSoap(SWS, 'searchTimesheetsForProject', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                for (let i = 0; i < res.item.length; i++) {
                    let row = res.item[i];
                    row.workDate2 = DateUtils.intToStr4(Utils.toNumber(row.workDate));
                    //row.beginTime2 = TimeUtils.format(Utils.toNumber(row.beginTime));
                    row.beginTime2 = TimeUtils.format(Math.floor(row.beginTime / 100000));
                    // row.endTime2 = TimeUtils.format(Utils.toNumber(row.endTime));
                    row.endTime2 = TimeUtils.format(Math.floor(row.endTime / 100000));
                    row.totalHours2 = Utils.format(Utils.toNumber(row.totalHours), "C", 0, 2);
                }
                grid.addRecords(res.item);
                if (res.item.length < Utils.toNumber(res.cap))
                    $$('status').setColor('black').setValue('Displaying ' + res.item.length + ' Timeheets');
                else
                    $$('status').setColor('red').setValue('Displaying ' + res.item.length + ' Timeheets (limit)');
                $$('total-hours').setValue(Utils.toNumber(res.totalHours));
            }
        });
    }
    updateGrid();
    $$('not-yet-approved').onChange(updateGrid);
    $$('approved').onChange(updateGrid);
    $$('invoiced').onChange(updateGrid);
    $$('start-date').onChange(updateGrid);
    $$('end-date').onChange(updateGrid);

    $$('shift').onChange(updateGrid);

    $$('report').onclick(function () {
        const data = {
            projectId: projectId,
            notApproved: $$('not-yet-approved').getValue(),
            approved: $$('approved').getValue(),
            invoiced: $$('invoiced').getValue(),
            startDate: $$('start-date').getIntValue(),
            finalDate: $$('end-date').getIntValue()
        };
        AWS.callSoap(SWS, 'getReport', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('legend').onclick(function () {
        Utils.popup_open('legend-popup');

        $$('legend-close').onclick(function () {
            Utils.popup_close();
        });
    });
    // $$('legend').onclick(null);

})();
