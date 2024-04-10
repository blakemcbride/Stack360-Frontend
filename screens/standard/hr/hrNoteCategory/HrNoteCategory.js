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

    const WS = 'StandardHrHrNoteCategory';

    const columnDefs = [
        {headerName: 'ID', field: 'catCode', width: 25  },
        {headerName: 'Note Category', field: 'name', width: 75 },
        {headerName: 'First Active', field: 'firstActiveDate2', type: 'numericColumn', width: 15 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'noteCategoryId');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "listNoteCategories", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.firstActiveDate2 = row.firstActiveDate !== '0' ? DateUtils.intToStr4(Number(row.firstActiveDate)) : '';
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Note Categories');
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Note Category');
        $$('dp-category').clear();
        $$('dp-id').clear();
        $$('dp-first-active').clear();
        $$('dp-last-active').clear();
        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            const data = {
                name: $$('dp-category').getValue(),
                catCode: $$('dp-id').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "newNoteCategory", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();
        $$('dp-title').setValue('Edit Note Category');
        $$('dp-category').setValue(row.name);
        $$('dp-id').setValue(row.catCode);
        $$('dp-first-active').setValue(Number(row.firstActiveDate));
        $$('dp-last-active').setValue(Number(row.lastActiveDate));
        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            const data = {
                id: row.noteCategoryId,
                name: $$('dp-category').getValue(),
                catCode: $$('dp-id').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "saveNoteCategory", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Note Category?', () => {
            const data = {
                ids: grid.getSelectedRow().noteCategoryId
            };
            AWS.callSoap(WS, "deleteNoteCategories", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "getNoteCategoriesReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
