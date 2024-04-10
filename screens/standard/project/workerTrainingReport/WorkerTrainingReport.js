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

'use strict';

(function () {
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $('#project-details').text(projectName + " - " + projectSummary);

    $$('show-report').onclick(() => {
        let data = {
            project_id: projectId
        };

        Utils.waitMessage("Generating report; please wait.");

        Server.call("com.arahant.services.standard.project.workerTrainingReport", "CreateReport", data).then(res => {
            Utils.waitMessageEnd();

            if (res._Success) {
                Utils.showReport(res.url);
            }
        });
    });

})();