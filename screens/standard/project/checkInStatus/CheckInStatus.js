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
    const WS = 'com.arahant.services.standard.project.checkInStatus';

    $$('timezone').setValue(DateTimeUtils.getLocalTimezoneShortText());

    const columnDefs = [
        {headerName: 'Project', field: 'project_description', width: 100  },
        {headerName: 'Proj Start', field: 'project_start_date', valueFormatter: AGGrid.date, width: 50  },
        {headerName: 'Worker', field: 'name', width: 75 },
        {headerName: 'Worker Start', field: 'employee_start_date', valueFormatter: AGGrid.date, width: 50  },
        {headerName: 'Phone', field: 'phone_number', width: 50 },
        {headerName: 'Check In', field: 'confirmation_time2', width: 60 },
        {headerName: 'Location', field: 'location', width: 90 },
        {headerName: 'Miles', field: 'distance', type: 'numericColumn', valueFormatter: AGGrid.numericFormat, mask: 'BC', decimalPlaces: 0, width: 35 },
        {headerName: 'Remaining Travel Time', field: 'time', type: 'rightAligned', width: 35, wrapHeaderText: true },
        {headerName: 'Latitude', field: 'latitude', type: 'numericColumn', valueFormatter: AGGrid.numericFormat, mask: 'B', decimalPlaces: -1, width: 60 },
        {headerName: 'Longitude', field: 'longitude', type: 'numericColumn', valueFormatter: AGGrid.numericFormat, mask: 'B', decimalPlaces: -1, width: 60 }
    ];
    const grid = new AGGrid('grid', columnDefs, '');
    grid.show();

    function isManualCheckin(row) {
        return row.who_added && row.who_added !== row.person_id;
    }

    grid.setOnSelectionChanged((rows) => {
        $$('manual-checkin').enable(rows);
        if (rows.length && isManualCheckin(rows[0]))
            $$('view-manual-checkin').enable();
        else
            $$('view-manual-checkin').disable();
    });

    function search() {
        const project = $$('project').getValue();
        const worker = $$('worker').getValue();
        grid.clear();
        $$('message').disable();

        $$('manual-checkin').disable();
        $$('view-manual-checkin').disable();
        const data = {
            project_id: project,
            worker: worker,
            checkedIn: $$('checked-in').getValue()
        };
        Server.call(WS, "ListCheckInStatus", data).then(function (res) {
            if (res._Success) {
                let numberOfProject = 0;
                let lastProjectId = ''
                let checkedIn = 0;
                let notCheckedIn = 0;
                for (let i=0 ; i < res.checkins.length ; i++) {
                    let r = res.checkins[i];
                    if (r.lname && r.fname)
                        r.name = r.lname + ", " + r.fname;
                    else
                        r.name = '';

                    if (r.minutes)
                        r.time = Math.trunc(r.minutes / 60) + ":" +
                            Utils.format(Math.trunc(r.minutes - Math.trunc(r.minutes / 60) * 60), "Z", 2, 0);
                    else
                        r.time = '';

                    if (r.project_id !== lastProjectId) {
                        numberOfProject++;
                        lastProjectId = r.project_id;
                    }
                    if (r.confirmation_time)
                        checkedIn++;
                    else
                        notCheckedIn++;
                    if (isManualCheckin(r))
                        r.confirmation_time2 = '* ' + DateTimeUtils.formatDate(r.confirmation_time);
                    else
                        r.confirmation_time2 = DateTimeUtils.formatDate(r.confirmation_time);
                }
                grid.addRecords(res.checkins);
                if (res.checkins.length)
                    $$('message').enable();
                $$('number-of-projects').setValue(numberOfProject);
                $$('number-of-workers').setValue(res.checkins.length);
                $$('number-of-workers-checked-in').setValue(checkedIn);
                $$('number-of-workers-not-checked-in').setValue(notCheckedIn);
            }
        });
    }

    $$('search').onclick(search);

    $$('project').forceSelect();
    $$('worker').forceSelect();

    $$('reset').onclick(() => {
        grid.clear();
        $$('message').disable();
        $$('project').clear();
        $$('worker').clear();
        $$('number-of-projects').clear();
        $$('number-of-workers').clear();
        $$('number-of-workers-checked-in').clear();
        $$('number-of-workers-not-checked-in').clear();
        $$('checked-in').setValue('A');
    });

    $$('worker').setSelectFunction(async () => {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            $$('worker').setValue(res.employeeid, res.nameLFM);
            grid.clear();
        }
    });

    $$('project').setSelectFunction(async () => {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok") {
            $$('project').setValue(res.projectId, res.id + '-' + res.summary);
            grid.clear();
        }
    });

    $$('manual-checkin').onclick(() => {
        const rec = grid.getSelectedRow();
        $$('cp-worker').setValue(rec.name);
        $$('cp-project').setValue(rec.project_description);
        $$('cp-notes').setValue(rec.notes);
        Utils.popup_open('checkin-popup', "cp-notes");

        $$('cp-ok').onclick(() => {
            const data = {
                personId: rec.person_id,
                projectId: rec.project_id,
                notes: $$('cp-notes').getValue()
            };
            Server.call(WS, "ManualCheckin", data).then(function (res) {
                if (res._Success) {
                    Utils.popup_close();
                    search();
                }
            });
        });

        $$('cp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('view-manual-checkin').onclick(() => {
        const rec = grid.getSelectedRow();
        $$('vcp-worker').setValue(rec.name);
        $$('vcp-project').setValue(rec.project_description);
        $$('vcp-supervisor').setValue(rec.checkin_lname + ", " + rec.checkin_fname);
        $$('vcp-check-in-time').setValue(DateTimeUtils.formatDate(rec.confirmation_time));
        $$('vcp-notes').setValue(rec.notes);
        Utils.popup_open('view-checkin-popup');

        $$('vcp-ok').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('message').onclick(async () => {
       Utils.popup_open("message-popup");

        const messageTextCtl = await Editor.create('messageText');
        $$('messageSender').setValue(Framework.userInfo.personFName + " " + Framework.userInfo.personLName);

        let to = '';
        const rows = grid.getAllRows();
        for (let i = 0; i < rows.length; i++) {
            if (i)
                to += ", ";
            to += rows[i].fname + " " + rows[i].lname;
        }
        $$('messageReceiver').setValue(to);
        $$('messageEmailCB').clear();
        $$('messageTextCB').clear();
        $$('messageSubject').clear();

        $$('messageSender')

       $$('messageOK').onclick(async () => {
           if (!$$('messageEmailCB').getValue() && !$$('messageTextCB').getValue()) {
               Utils.showMessage('Error', 'You have not selected Email and/or Text.');
               return;
           }

           if ($$('messageSubject').isError("Subject"))
               return;

           if ($$('messageEmailCB') && !await missingEmails(rows))
               return;

           if ($$('messageTextCB') && !await missingPhoneNumbers(rows))
               return;

           let toPersonIds = '';
           for (let i=0 ; i < rows.length; i++) {
               if (toPersonIds)
                   toPersonIds += ",";
               toPersonIds += rows[i].person_id;
           }
           let data = {
               subject: $$('messageSubject').getValue(),
               htmlMessage: messageTextCtl.getHtml(),
               fromPersonId: Framework.userInfo.personId,
               toPersonIds: toPersonIds,
               sendEmail: $$('messageEmailCB').getValue(),
               sendText: $$('messageTextCB').getValue(),
           }
           Utils.waitMessage('Sending messages...');
           Server.call(WS, "CreateMessage", data).then(function (res) {
               Utils.waitMessageEnd();
               Utils.popup_close();
           });
       });

        $$('messageCancel').onclick(() => {
            Utils.popup_close();
       });
    });

    function missingEmails(rows) {
        return new Promise(function (resolve, reject) {
            const a = [];
            for (let i = 0; i < rows.length; ++i) {
                let r = rows[i];
                if (!r.personal_email)
                    a.push(r);
            }
            if (a.length === rows.length) {
                Utils.showMessage('Error', 'No person has a valid email address.');
                resolve(false);
                return;
            }
            if (a.length) {
                $$('missingTitle').setValue('Missing Email');
                $$('missingText').setValue('The following persons do not have an email address:');
                $$('missing-list').clear();
                for (let i = 0; i < a.length; i++)
                    $$('missing-list').add(a[i].person_id, a[i].fname + " " + a[i].lname);
                Utils.popup_open('missing-popup');

                $$('missingOK').onclick(() => {
                    Utils.popup_close();
                    resolve(true);
                });

                $$('missingCancel').onclick(() => {
                    Utils.popup_close();
                    resolve(false);
                })
            } else
                resolve(true);
        });
    }

    function missingPhoneNumbers(rows) {
        return new Promise(function (resolve, reject) {
            const a = [];
            for (let i = 0; i < rows.length; ++i) {
                let r = rows[i];
                if (!r.phone_number)
                    a.push(r);
            }
            if (a.length === rows.length) {
                Utils.showMessage('Error', 'No person has a valid phone number.');
                resolve(false);
                return;
            }
            if (a.length) {
                $$('missingTitle').setValue('Missing Phone Numbers');
                $$('missingText').setValue('The following persons do not have a phone number:');
                $$('missing-list').clear();
                for (let i = 0; i < a.length; i++)
                    $$('missing-list').add(a[i].person_id, a[i].fname + " " + a[i].lname);
                Utils.popup_open('missing-popup');

                $$('missingOK').onclick(() => {
                    Utils.popup_close();
                    resolve(true);
                });

                $$('missingCancel').onclick(() => {
                    Utils.popup_close();
                    resolve(false);
                })
            } else
                resolve(true);
        });
    }

})();
