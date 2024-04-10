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

    const WS = "com.arahant.services.standard.project.inventoryEmail";
    const project_id = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    let refresh_list = function () {
        const data = {
            project_id: project_id
        };
        Server.call(WS, "GetAllEmail", data).then(function (res) {
            const list = $$('email-list');
            list.clear();
            if (res._Success) {
                for (let i=0 ; i < res.list.length ; i++)
                    list.add(res.list[i].pie_id, res.list[i].name + " <" + res.list[i].email + ">")
            }
        });
    };

    refresh_list();

    $('#project-description').html('Project: ' + projectName + ' - ' + projectSummary);

    $$('add-staff').onclick(async function () {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            if (!res.email) {
                Utils.showMessage('Error', 'Worker does not have an email address.');
                return;
            }
            const arg = {
                project_id: project_id,
                person_id: res.employeeid
            };
            Server.call(WS, "AddEmail", arg).then(function (res) {
                if (res._Success) {
                    refresh_list();
                }
            });
        }
    });

    $$('add-client').onclick(async function () {
        const indata = {
            project_id: project_id,
            flag_no_email: true
        };
        let res = await Utils.component('clientContactSelection/ClientContactSelection', 'component-client-contact-selection', indata);
        if (res._status === "ok") {
            if (!res.email) {
                Utils.showMessage('Error', 'Contact has no email address');
                return;
            }
            const arg = {
                project_id: project_id,
                person_id: res.person_id
            };
            Server.call(WS, "AddEmail", arg).then(function (res) {
                if (res._Success) {
                    refresh_list();
                }
            });
        }

    });

    $$('remove').onclick(function () {
        let selected = $$('email-list').getValue();
        if (!selected.length) {
            Utils.showMessage("Error", "You must first select the people to remove.");
            return;
        }
        Server.call(WS, "DeleteEmail", { pie_ids: selected }).then(function (res) {
            if (res._Success) {
                refresh_list();
            }
        });

    });

})();

