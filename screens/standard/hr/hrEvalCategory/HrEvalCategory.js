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

    const WS = 'StandardHrHrEvalCategory';

    const columnDefs = [
        {headerName: 'Category', field: 'name', width: 15  },
        {headerName: 'Weight', field: 'weight', width: 10 },
        {headerName: 'Description Preview', field: 'descriptionPreview', width: 45 },
        {headerName: 'First Active', field: 'firstActiveDate2', type: 'numericColumn', width: 15 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'evalCategoryId');
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
        AWS.callSoap(WS, "listEvalCategories", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.firstActiveDate2 = row.firstActiveDate !== '0' ? DateUtils.intToStr4(Number(row.firstActiveDate)) : '';
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Evaluation Categories');
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
        $$('dp-title').setValue('Add Evaluation Category');
        $$('dp-category').clear();
        $$('dp-weight').clear();
        $$('dp-description').clear();
        $$('dp-first-active').clear();
        $$('dp-last-active').clear();
        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            const data = {
                name: $$('dp-category').getValue(),
                description: $$('dp-description').getValue(),
                weight: $$('dp-weight').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "newEvalCategory", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Evaluation Category');
        $$('dp-category').setValue(row.name);
        $$('dp-weight').setValue(row.weight);
        $$('dp-description').setValue(row.descriptionPreview);
        if (row.firstActiveDate) {
            $$('dp-first-active').setValue(Number(row.firstActiveDate));
        }
        if (row.lastActiveDate) {
            $$('dp-last-active').setValue(Number(row.lastActiveDate));
        }
        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            const data = {
                id: row.evalCategoryId,
                name: $$('dp-category').getValue(),
                description: $$('dp-description').getValue(),
                weight: $$('dp-weight').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "saveEvalCategory", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Evaluation Category?', () => {
            const data = {
                ids: grid.getSelectedRow().evalCategoryId
            };
            AWS.callSoap(WS, "deleteEvalCategories", data).then(function (res) {
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
        AWS.callSoap(WS, "getEvalCategoriesReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
