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


window.popup_startup = function (inData) {
    return new Promise(function (resolve, reject) {

        const WS = "com.arahant.services.standard.components.searchClientContact";

        let workerGrid;

        const accept_worker = function() {
            const row = workerGrid.getSelectedRow();
            if (row) {
                let name = row.lname + ", " + row.fname;
                if (row.mname)
                    name += ' ' + row.mname;
                let res = {
                    _status: 'ok',
                    person_id: row.person_id,
                    name: row.name,
                    email: row.email
                };
                resolve(res);
            } else {
                Utils.showMessage('Error', 'You must first select a client contact.');
            }
        };

        {
            const columnDefs = [
                {headerName: 'Name', field: 'name', width: 100  }
            ];
            workerGrid = new AGGrid('cm-scc-contact-grid', columnDefs, 'person_id');

            workerGrid.show();

            workerGrid.setOnRowDoubleClicked(function () {
                accept_worker();
            });
        }

        $$('cm-scc-contact-ok').onclick(accept_worker);

        $$('cm-scc-contact-cancel').onclick(function() {
            resolve({ _status: 'cancel'});
        });

        Server.call(WS, "SearchClientContact", { project_id: inData.project_id }).then(function (res) {
            if (res._Success) {
                for (let i=0 ; i < res.contacts.length ; i++)
                    if (inData.flag_no_email) {
                        let row = {
                            name: res.contacts[i].name + (res.contacts[i].email ? "" : " *"),
                            email: res.contacts[i].email,
                            person_id: res.contacts[i].person_id
                        };
                        workerGrid.addRecord(row);
                    } else {
                        let row = {
                            name: res.contacts[i].name,
                            email: res.contacts[i].email,
                            person_id: res.contacts[i].person_id
                        };
                        workerGrid.addRecord(row);
                    }
                if (inData.flag_no_email)
                    $('#cm-scc-contact-msg').text('* = has no email address');
            }
        });

    });
};

