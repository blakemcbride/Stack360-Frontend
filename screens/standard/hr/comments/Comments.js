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

    const WS = 'com.arahant.services.standard.hr.comments';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName).setColor('black');

    const columnDefs = [
        {headerName: 'Date/Time', field: 'dateTime', width: 180  },
        {headerName: 'Mode', field: 'mode', width: 100  },
        {headerName: 'Employee', field: 'employee', width: 200  },
        {headerName: 'Comment Preview', field: 'description', width: 800  }
    ];
    const grid = new AGGrid('grid', columnDefs, 'applicant_contact_id');
    grid.show();
    grid.clear();

    function getMode(m) {
        switch (m) {
            case 'P':
                return "Phone";
            case 'E':
                return "Email";
            case "G":
                return "In Person";
            default:
                return "Unknown";
        }
    }

    function loadComments() {
        const data = {
            personId: personId
        };
        Server.call(WS, 'GetComments', data).then(res => {
            if (res._Success) {
                $$('detail-comment').setValue(res.general_comments ? res.general_comments : '');
                grid.clear();
                for (let i = 0; i < res.detail_comments.length; i++) {
                    let r = res.detail_comments[i];
                    r.dateTime = DateTimeUtils.formatDateTime(r.contact_date, r.contact_time);
                    r.mode = getMode(r.contact_mode);
                    r.employee = r.lname + ", " + r.fname
                }
                grid.addRecords(res.detail_comments);
                $$('detail-comment').onCChange(() => {
                    $$('worker-name').setColor('red');
                    $$('save').enable();
                    $$('reset').enable();
                    Framework.askBeforeLeaving = true;  //  to make that screen ask before leaving if any fields changed
                });
                $$('worker-name').setColor('black');
                $$('save').disable();
                $$('reset').disable();
                $$('edit').disable();
                $$('view').disable();
                $$('delete').disable();
                grid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('delete').enable(rows);
                    $$('view').enable(rows);
                });
                Framework.askBeforeLeaving = false;
            }
        });
    }

    loadComments();

    $$('reset').onclick(loadComments);

    $$('save').onclick(() => {
        const data = {
            personId: personId,
            globalComment: $$('detail-comment').getValue()
        };
        Server.call(WS, 'SaveComments', data).then(res => {
            if (res._Success) {
                $$('worker-name').setColor('black');
                $$('save').disable();
                $$('reset').disable();
                Framework.askBeforeLeaving = false;
            }
        });
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Comment');
        $$('dp-cancel').show();
        $$('dp-mode').setValue('').enable();
        $$('dp-comment').clear().enable();
        Utils.popup_open('detail-popup');

        $$('dp-ok').onclick(() => {
            if ($$('dp-mode').isError('Mode'))
                return;
            if ($$('dp-comment').isError('Comment'))
                return;
            const data = {
                personId: personId,
                mode: $$('dp-mode').getValue(),
                comment: $$('dp-comment').getValue()
            }
            Server.call(WS, "NewComment", data).then((res) => {
                if (res._Success) {
                    loadComments();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function view() {
        $$('dp-title').setValue('View Comment');
        $$('dp-cancel').hide();
        const row = grid.getSelectedRow();
        $$('dp-mode').setValue(row.contact_mode).disable();
        $$('dp-comment').setValue(row.description).disable();
        Utils.popup_open('detail-popup');

        $$('dp-ok').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('view').onclick(view);
    grid.setOnRowDoubleClicked(view);

    $$('edit').onclick(() => {
        $$('dp-title').setValue('Edit Comment');
        const row = grid.getSelectedRow();
        $$('dp-cancel').show();
        $$('dp-mode').setValue(row.contact_mode).enable();
        $$('dp-comment').setValue(row.description).enable();
        Utils.popup_open('detail-popup');

        $$('dp-ok').onclick(() => {
            if ($$('dp-mode').isError('Mode'))
                return;
            if ($$('dp-comment').isError('Comment'))
                return;
            const data = {
                applicantContactId: row.applicant_contact_id,
                mode: $$('dp-mode').getValue(),
                comment: $$('dp-comment').getValue()
            }
            Server.call(WS, "UpdateComment", data).then((res) => {
                if (res._Success) {
                    loadComments();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected comment?', () => {
            const row = grid.getSelectedRow();
            const data = {
                applicantContactId: row.applicant_contact_id
            };

            Server.call(WS, "DeleteComment", data).then(function (res) {
                if (res._Success)
                    loadComments();
            });
        });
    });

})();
