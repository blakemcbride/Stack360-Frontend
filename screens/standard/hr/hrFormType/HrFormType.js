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

    const WS = 'StandardHrHrFormType';

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: 30  },
        {headerName: 'Description', field: 'description', width: 100 },
        {headerName: 'Internal', field: 'internal2', width: 20 },
        {headerName: 'Last Active Date', field: 'lastActiveDate2', width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateDisplay(allRows) {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const type = $$('show').getValue();
        const today = DateUtils.today();
        const rows = [];
        for (let i=0 ; i < allRows.length ; i++) {
            let row = allRows[i];
            row.internal2 = row.internal === 'Y' ? "Yes" : "";
            let lastActiveDate = Number(row.lastActiveDate);
            if (type === '1') {
                if (!lastActiveDate || lastActiveDate > today)
                    rows.push(row);
            } else if (type === '2') {
                if (lastActiveDate && lastActiveDate < today)
                    rows.push(row);
            } else
                rows.push(row);
        }
        grid.addRecords(rows);
        $$('status').setValue('Displaying ' + rows.length + ' HR Form Types');
    }

    function updateGrid() {
        AWS.callSoap(WS, "listFormTypes").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    res.item[i].lastActiveDate2 = DateUtils.intToStr4(Number(res.item[i].lastActiveDate));
                updateDisplay(res.item);
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateDisplay);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add HR Form Type');
        $$('dp-code').clear();
        $$('dp-description').clear();
        $$('dp-last-active').clear();
        $$('dp-internal').clear();

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            if ($$('dp-internal').isError('Internal'))
                return;
            const data = {
                applyToAll: false,
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                internal: $$('dp-internal').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "newFormType", data).then(function (res) {
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
        $$('dp-title').setValue('Edit HR Form Type');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-last-active').setValue(Number(row.lastActiveDate));
        $$('dp-internal').setValue(row.internal);

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            if ($$('dp-internal').isError('Internal'))
                return;
            const data = {
                id: row.id,
                applyToAll: false,
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                internal: $$('dp-internal').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue()
            };
            AWS.callSoap(WS, "saveFormType", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected HR Form Type?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteFormTypes", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getFormTypesReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
