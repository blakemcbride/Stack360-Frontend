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
    const WS = 'com.arahant.services.standard.project.dailyTaskReport';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary);

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
            } else {
                shiftCtl.addItems(res.shifts, 'project_shift_id', 'shift_start').enable();
            }
        }
    }
    await getShifts(projectId);

    $$('work-date').setValue(new Date());

    $$('run-report').onclick(async () => {
        const data = {
            shiftId: $$('shift').getValue(),
            workDate: $$('work-date').getIntValue()
        }
        Server.call(WS, 'RunReport', data).then(res => {
            if (res._Success) {
                Utils.showReport(res.reportName);
            }
        });
    });

})();
