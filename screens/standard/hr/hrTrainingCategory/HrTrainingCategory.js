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

    const WS = 'StandardHrHrTrainingCategory';

    const columnDefs = [
        {headerName: 'Category', field: 'name', width: 75  },
        {headerName: 'Category Type', field: 'typeFormatted', width: 15 },
        {headerName: 'Hours', field: 'hours2', width: 15 },
        {headerName: 'Required', field: 'required', width: 15 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'trainingCategoryId');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    res = await AWS.callSoap(WS, "getClientsList");
    if (res.wsStatus === '0') {
        res.getClientsListItems = Utils.assureArray(res.getClientsListItems);
        if (res.getClientsListItems.length && !res.getClientsListItems[0].clientId)
            res.getClientsListItems[0].clientId = '';
        $$('client').clear().addItems(res.getClientsListItems, 'clientId', 'clientName');
    } else
        return;

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            activeType: Number($$('show').getValue()),
            clientId: $$('client').getValue()
        };
        AWS.callSoap(WS, "listTrainingCategories", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.hours2 = Utils.format(Number(row.hours), "", 0, 0);
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Training Categories');
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateGrid);
    $$('client').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(async () => {
        $$('dp-title').setValue('Add Training Category');
        $$('dp-category').clear();
        $$('dp-type').setValue('');
        $$('dp-normal-hours').clear();
        $$('dp-required').clear();
        $$('dp-last-active').clear();

        res = await AWS.callSoap(WS, "getClientsList");
        if (res.wsStatus === '0') {
            res.getClientsListItems = Utils.assureArray(res.getClientsListItems);
            if (res.getClientsListItems.length && !res.getClientsListItems[0].clientId)
                res.getClientsListItems[0].clientId = '';
            $$('dp-client').clear().addItems(res.getClientsListItems, 'clientId', 'clientName').setValue($$('client').getValue());
        } else
            return;

        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            const data = {
                clientId: $$('dp-client').getValue(),
                hours: $$('dp-normal-hours').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                name: $$('dp-category').getValue(),
                required: $$('dp-required').getValue() ? 'Y' : 'N',
                type: $$('dp-type').getValue()
            };
            AWS.callSoap(WS, "newTrainingCategory", data).then(function (res) {
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

    async function edit() {
        const row = grid.getSelectedRow();
        $$('dp-title').setValue('Edit Training Category');

        res = await AWS.callSoap(WS, "getClientsList");
        if (res.wsStatus === '0') {
            res.getClientsListItems = Utils.assureArray(res.getClientsListItems);
            if (res.getClientsListItems.length && !res.getClientsListItems[0].clientId)
                res.getClientsListItems[0].clientId = '';
            $$('dp-client').clear().addItems(res.getClientsListItems, 'clientId', 'clientName').setValue($$('client').getValue());
        } else
            return;

        $$('dp-category').setValue(row.name);
        $$('dp-type').setValue(row.type);
        $$('dp-normal-hours').setValue(Number(row.hours));
        $$('dp-required').setValue(row.required === 'Y');
        $$('dp-last-active').setValue(Number(row.lastActiveDate));
        Utils.popup_open('detail-popup', 'dp-category');

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            const data = {
                id: row.trainingCategoryId,
                clientId: $$('dp-client').getValue(),
                hours: $$('dp-normal-hours').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                name: $$('dp-category').getValue(),
                required: $$('dp-required').getValue() ? 'Y' : 'N',
                type: $$('dp-type').getValue()
            };
            AWS.callSoap(WS, "saveTrainingCategory", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Training Category?', () => {
            const data = {
                ids: grid.getSelectedRow().trainingCategoryId
            };
            AWS.callSoap(WS, "deleteTrainingCategories", data).then(function (res) {
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
        AWS.callSoap(WS, "getTrainingCategoriesReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
