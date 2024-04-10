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
    const WS = 'StandardHrHrNote';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Note', field: 'noteCategoryName', width: 40},
        {headerName: 'Detail Preview', field: 'note', width: 150}
    ];
    const grid = new AGGrid('grid', columnDefs, 'noteCategoryId');

    grid.show();

    let data = {
    };
    AWS.callSoap(WS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    function updateNoteList() {
        let data = {
            personId: personId
        };
        grid.clear();
        AWS.callSoap(WS, 'listPersonNotes', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue("Displaying " + res.item.length + " Employee Notes");
            }
        });
    }

    updateNoteList();

    grid.setOnSelectionChanged($$('edit').enable);
    
    async function edit() {
        $('#note-popup-title').text('Edit Event');

        Utils.popup_open('note-popup');

        const row = grid.getSelectedRow();
        const newNote = !row.noteId;

        $$('note-popup-note').setValue(row.noteCategoryName);
        if (newNote)
            $$('note-popup-detail').clear();
        else {
            let data = {
                id: row.noteId
            };

            let res = await AWS.callSoap(WS, 'loadNote', data);
            if (res.wsStatus === "0") {
                $$('note-popup-detail').setValue(res.note);
            }
        }

        $$('note-popup-ok').onclick(async function () {
            if (newNote) {
                let data = {
                    personId: personId,
                    noteCategoryId: row.noteCategoryId,
                    note: $$('note-popup-detail').getValue(),
                };

                await AWS.callSoap(WS, 'newNote', data);
                updateNoteList();
            } else {
                let data = {
                    personId: personId,
                    noteId: row.noteId,
                    noteCategoryId: row.noteCategoryId,
                    note: $$('note-popup-detail').getValue(),
                };
                await AWS.callSoap(WS, 'saveNote', data);
                updateNoteList();
            }
            Utils.popup_close();
        });

        $$('note-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    grid.setOnRowDoubleClicked(edit);

    $$('report').onclick(async function () {
        let data = {
            personId: personId,
            showAsDependent: false
        };
        const res = await AWS.callSoap(WS, 'getNotesReport', data);
        Utils.showReport(res.fileName);
    });
    
})();
