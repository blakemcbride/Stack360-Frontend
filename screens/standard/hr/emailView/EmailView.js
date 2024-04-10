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
    const WS = 'com.arahant.services.standard.hr.emailView';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker').setValue(personName);

    let id = 1;
    let columnDefs = [
        {headerName: '', field: 'person_email_id', hide: true},
        {headerName: 'Date Sent', field: 'date_sent'},
        {headerName: 'Sent To', field: 'sent_to'},
        {headerName: 'Subject', field: 'subject'}
    ];
    let grid = new AGGrid('email-grid', columnDefs, 'person_email_id');

    let data = {
        person_id: personId
    };
    let ret = await Server.call(WS, 'GetEmailList', data);
    let email_address = null;
    if (ret._Success) {
        email_address = ret.email_address;
        grid.addRecords(ret.emailList);
    }

    grid.show();

    grid.setOnSelectionChanged(function (rows) {
        $$('view').enable(rows);
        $$('resend').enable(rows);
        $$('delete').enable(rows);
    });

    const view = async function () {
        let row = grid.getSelectedRow();
        Utils.popup_open('view-email');

        $$('view-email-subject').setValue(row.subject);

        let data = {
            person_email_id: row.person_email_id
        };
        let ret = await Server.call(WS, 'GetMessage', data)
        if (ret._Success)
            $$('view-email-message').setValue(ret.message);

        $$('view-email-ok').onclick(function () {
            Utils.popup_close();
        });
    };

    $$('view').onclick(view);

    grid.setOnRowDoubleClicked(view);

    $$('new').onclick(function () {
        grid.clearSelection();
        $$('view').disable();
        $$('resend').disable();
        $$('delete').disable();

        if (email_address === null  ||  email_address === "") {
            Utils.showMessage('Message', 'This person has no email address set.');
            return;
        }

        Utils.popup_open('new-email', 'subject');

        $$('new-email-cancel').onclick(function () {
            Utils.popup_close();
        });

        $$('new-email-ok').onclick(async function () {
            if ($$('new-email-subject').isError("Subject"))
                return;
            let subject = $$('new-email-subject').getValue();
            let message = $$('new-email-message').getValue();
            Utils.popup_close();
            Utils.waitMessage("Message sending.  Please wait.");
            let data = {
                person_id: personId,
                subject: subject,
                message: message
            };
            let ret = await Server.call(WS, 'SendEmail', data);
            if (ret._Success)
                grid.addRecord({ person_email_id: ret.person_email_id, date_sent: "now", sent_to: email_address, subject: subject});
            Utils.waitMessageEnd();
        });

    });

    $$('delete').onclick(function () {
        Utils.yesNo('Delete Message', 'Are you sure you want to delete this message?', async function () {
            let data = {
                person_email_id: grid.getSelectedRow().person_email_id
            };
            let ret = await Server.call(WS, 'DeleteMessage', data)
            if (ret._Success) {
                grid.deleteSelectedRows();
                $$('view').disable();
                $$('resend').disable();
                $$('delete').disable();
            }
        });
    });

    $$('resend').onclick(function () {
        if (email_address === null  ||  email_address === "") {
            Utils.showMessage('Message', 'This person has no email address set.');
            return;
        }
        Utils.yesNo('Re-send Message', 'Are you sure you want to re-send this message?', async function () {
            let row = grid.getSelectedRow();
            let data = {
                person_email_id: row.person_email_id
            };
            Utils.waitMessage("Sending.  Please wait.");
            let ret = await Server.call(WS, 'ResendMessage', data);
            Utils.waitMessageEnd();
            if (ret._Success)
                grid.addRecord({ person_email_id: ret.person_email_id, date_sent: "now", sent_to: email_address, subject: row.subject});
        });
    });

})();
