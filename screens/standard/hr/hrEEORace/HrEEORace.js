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

    const WS = 'StandardHrHrEEORace';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const columnDefs = [
        {headerName: 'EEO Race', field: 'name'},
    ];
    const grid = new AGGrid('grid', columnDefs, 'EEORaceId');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        
        AWS.callSoap(WS, "listEEORaces").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' EEO Races');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add EEO Race');
        $$('dp-race').clear();

        Utils.popup_open('detail-popup', 'dp-race');

        $$('dp-ok').onclick(() => {
            if ($$('dp-race').isError('Race'))
                return;

            const data = {
                name: $$('dp-race').getValue()
            };
            AWS.callSoap(WS, "newEEORace", data).then(function (res) {
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

        $$('dp-title').setValue('Edit EEO Race');
        $$('dp-race').setValue(row.name);

        Utils.popup_open('detail-popup', 'dp-race');

        $$('dp-ok').onclick(() => {
            if ($$('dp-race').isError('Race'))
                return;

            const data = {
                name: $$('dp-race').getValue(),
                id: row.EEORaceId
            };
            AWS.callSoap(WS, "saveEEORace", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected EEO Races?', () => {
            const data = {
                ids: [grid.getSelectedRow().EEORaceId]
            };
            
            AWS.callSoap(WS, "deleteEEORaces", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getEEORacesReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });
})();
