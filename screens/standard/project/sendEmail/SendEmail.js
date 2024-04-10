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
    const WS = 'com.arahant.services.standard.project.sendEmail';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

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

    function updateWorkerList() {
        Server.call(WS, "GetWorkers", {project_id: projectId, shift_id: $$('shift').getValue()}).then(function (res) {
            if (res._Success) {
                const ctl = $$('workers');
                ctl.clear();
                for (var i = 0; i < res.workers.length; i++)
                    ctl.add(i + 1, res.workers[i]);
            }
        });
    }
    updateWorkerList();

    $$('shift').onChange(updateWorkerList);

    $$('title').focus();

    $('#project-description').html('Project: ' + projectName + ' - ' + projectSummary);

    $$('send').onclick(function () {
        if ($$('title').isError("Email title"))
            return;
        if ($$('detail').isError("Message detail"))
            return;
        if (!$$('workers').size()) {
            Utils.showMessage('Error', 'There are no workers to send the message to.');
            return;
        }

        const data = {
            project_id: projectId,
            shift_id: $$('shift').getValue(),
            title: $$('title').getValue(),
            detail: $$('detail').getValue()
        };
        Server.fileUploadSend(WS, "SendEmail", 'select-file', data, "Sending email; please wait.");
    });

})();
