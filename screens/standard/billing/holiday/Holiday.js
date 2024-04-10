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

    const WS = 'StandardBillingHoliday';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const columnDefs = [
        {headerName: 'Date', field: 'dateFormatted', width: '25'},
        {headerName: 'Name', field: 'name', width: '75'},
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        
        AWS.callSoap(WS, "listHolidays").then(function (res) {
            if (res.wsStatus === '0') {
                res.holidays = Utils.assureArray(res.holidays);
                grid.addRecords(res.holidays);
            }
        });
    }

    updateGrid();

    function reset() {
        $$('dp-name').clear();
        $$('dp-date').clear();
        $$('dp-type').setValue("F");
    }

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Date');
        reset();

        Utils.popup_open('detail-popup', 'dp-race');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-date').isError('Date'))
                return;

            const data = {
                name: $$('dp-name').getValue(),
                date: $$('dp-date').getIntValue(),
                partOfDay: $$('dp-type').getValue()
            };
            AWS.callSoap(WS, "addHoliday", data).then(function (res) {
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

        reset();

        $$('dp-title').setValue('Edit Date');
        $$('dp-name').setValue(row.name);
        $$('dp-date').setValue(row.date);
        $$('dp-type').setValue(row.partOfDay);

        Utils.popup_open('detail-popup', 'dp-race');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-date').isError('Date'))
                return;

            const data = {
                name: $$('dp-name').getValue(),
                date: $$('dp-date').getIntValue(),
                partOfDay: $$('dp-type').getValue(),
                id: row.id
            };
            AWS.callSoap(WS, "saveHoliday", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Holiday?', () => {
            const data = {
                holidayId: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteHoliday", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('default').onclick(() => {
        AWS.callSoap(WS, "resetHolidays").then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
            }
        });
    });
})();
