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
    const WS = 'StandardHrHrEvent';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Event Date', field: 'eventDateFormatted', type: 'numericColumn', width: 200},
        {headerName: 'Supervisor', field: 'supervisorName', width: 400},
        {headerName: 'Worker Notified', field: 'employeeNotified', width: 250},
        {headerName: 'Date Notified', field: 'employeeNotifiedDateFormatted', type: 'numericColumn', width: 200},
        {headerName: 'Summary', field: 'summary', width: 800},
    ];
    const grid = new AGGrid('event-grid', columnDefs, 'id');

    grid.show();


    let data = {
    };
    AWS.callSoap(WS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    function updateEventList() {
        const data = {
            personId: personId,
            includeAssignments: $$('include-assignments').getValue(),
            includeStatusChanges: $$('include-status-changes').getValue(),
            includeCheckins: $$('include-checkins').getValue()
        };
        grid.clear();
        AWS.callSoap(WS, 'listEvents', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                $$('delete').disable();
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                if (res.item.length === res.maxSearch)
                    $$('status').setValue("Displaying " + res.item.length + " Worker Events (max)").setColor('red');
                else
                    $$('status').setValue("Displaying " + res.item.length + " Worker Events").setColor('black');
            }
        });
    }

    updateEventList();

    $$('include-assignments').onChange(updateEventList);
    $$('include-status-changes').onChange(updateEventList);
    $$('include-checkins').onChange(updateEventList);

    $$('add').onclick(function () {

        $('#event-popup-title').text('Add Event');

        $$('event-popup-date').setValue(new Date()).enable();
        $$('event-popup-summary').clear().enable();
        $$('event-popup-notified').clear().enable();
        $$('event-popup-notified-date').clear().enable();
        $$('event-popup-detail').clear().enable();
        $$('event-popup-supervisor').setValue(AWS.lname + ", " + AWS.fname); // default to the currently logged in person

        Utils.popup_open('event-popup');

        $$('event-popup-ok').onclick(function () {
            if ($$("event-popup-date").isError('Event date'))
                return;
            if ($$("event-popup-summary").isError('Summary'))
                return;
            if ($$('event-popup-notified').getValue()  &&  !$$('event-popup-notified-date').getIntValue()) {
                Utils.showMessage('Error', 'Notified Date is required if the worker was notified.');
                return;
            }
            if (!$$('event-popup-notified').getValue()  &&  $$('event-popup-notified-date').getIntValue()) {
                Utils.showMessage('Error', 'Notification date given when not notified.');
                return;
            }
            let data = {
                employeeId: personId,
                employeeNotified: !!$$('event-popup-notified').getValue(),
                employeeNotifiedDate:  $$('event-popup-notified-date').getIntValue(),
                eventDate:  $$('event-popup-date').getIntValue(),
                summary: $$('event-popup-summary').getValue(),
                supervisorId: AWS.personId,
                detail: $$('event-popup-detail').getValue()
            };
            AWS.callSoap(WS, 'newEvent', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateEventList();
                }
            });
            Utils.popup_close();
        });


        $$('event-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    async function edit() {
        const row = grid.getSelectedRow();

        if (!row)
            return;

        const checkIn = row.summary === "Worker check in";

        if (row.id.length < 16 && !checkIn) {
            Utils.showMessage('Error', 'Assignment records cannot be edited.');
            return;
        }
        $('#event-popup-title').text('Edit Event');
        $$('event-popup-supervisor').setValue(AWS.lname + ", " + AWS.fname); // default to the currently logged in person

        // we need these so the popup doesn't blink with old data
        $$('event-popup-date').clear();
        $$('event-popup-summary').clear();
        $$('event-popup-notified').clear();
        $$('event-popup-notified-date').clear();
        $$('event-popup-detail').clear();

        Utils.popup_open('event-popup');

        if (checkIn) {
            let x = 1;
            $$('event-popup-summary').setValue(row.summary);
            $$('event-popup-detail').setValue(row.detail);
            $$('event-popup-notified').setValue(false);
            $$('event-popup-notified-date').setValue(0);
            $$('event-popup-date').setValue();
        } else {
            const data = {
                id: row.id
            };
            const res = await AWS.callSoap(WS, 'loadEvent', data);
            if (res.wsStatus === "0") {
                $$('event-popup-detail').setValue(res.detail);
                $$('event-popup-notified').setValue(res.employeeNotified === "true");
                $$('event-popup-notified-date').setValue(Number(res.employeeNotifiedDate));
                $$('event-popup-date').setValue(Number(res.eventDate));
                $$('event-popup-summary').setValue(res.summary);
            }
        }
        Utils.clearSomeControlValueChanged();
        if (AWS.personId !== row.supervisorId || checkIn) {
            $$('event-popup-detail').disable();
            $$('event-popup-notified').disable();
            $$('event-popup-notified-date').disable();
            $$('event-popup-date').disable();
            $$('event-popup-summary').disable();
        } else {
            $$('event-popup-detail').enable();
            $$('event-popup-notified').enable();
            $$('event-popup-notified-date').enable();
            $$('event-popup-date').enable();
            $$('event-popup-summary').enable();
        }

        $$('event-popup-ok').onclick(function () {
            if (checkIn) {
                Utils.popup_close();
                return;
            }

            if ($$("event-popup-date").isError('Event date'))
                return;
            if ($$("event-popup-summary").isError('Summary'))
                return;
            if ($$('event-popup-notified').getValue()  &&  !$$('event-popup-notified-date').getIntValue()) {
                Utils.showMessage('Error', 'Notified Date is required if the worker was notified.');
                return;
            }
            if (!$$('event-popup-notified').getValue()  &&  $$('event-popup-notified-date').getIntValue()) {
                Utils.showMessage('Error', 'Notification date given when not notified.');
                return;
            }
            // if nothing has changed, act like cancel was hit
            if (Utils.didSomeControlValueChange()) {
                const data = {
                    id: row.id,
                    employeeNotified: !!$$('event-popup-notified').getValue(),
                    employeeNotifiedDate: $$('event-popup-notified-date').getIntValue(),
                    eventDate: $$('event-popup-date').getIntValue(),
                    summary: $$('event-popup-summary').getValue(),
                    supervisorId: row.supervisorId,
                    detail: $$('event-popup-detail').getValue()
                };

                AWS.callSoap(WS, 'saveEvent', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        updateEventList();
                    }
                });
            }
            Utils.popup_close();
        });

        $$('event-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(function () {
        const row = grid.getSelectedRow();
        if (row.id.length < 16) {
            Utils.showMessage('Error', 'Assignment records cannot be deleted.');
            return;
        }
        Utils.yesNo('Query', 'Is it okay to delete the selected event?', function () {
            let data = {
                ids: row.id
            };

            AWS.callSoap(WS, 'deleteEvent', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateEventList();
                }
            });

        });
    });

    $$('report').onclick(function () {
        Utils.popup_open('report-popup');

        $$('report-popup-start-date').clear();
        $$('report-popup-end-date').clear();
        $$('report-popup-sort-group').setValue("true");

        $$('report-popup-ok').onclick(function () {
            Utils.popup_close();
            let data = {
                personId: personId,
                startDate: $$('report-popup-start-date').getIntValue(),
                endDate: $$('report-popup-end-date').getIntValue(),
                asc: $$('report-popup-sort-group').getValue() === "true"
            };

            AWS.callSoap(WS, 'getReport', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showReport(res.fileName);
                }
            });
        });

        $$('report-popup-cancel').onclick(function () {
           Utils.popup_close();
        });
    });

})();
