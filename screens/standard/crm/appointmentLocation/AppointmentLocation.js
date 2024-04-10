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

    const WS = 'StandardCrmAppointmentLocation';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: '25'},
        {headerName: 'Description', field: 'description', width: '55'},
        {headerName: 'Last Active Date', field: 'lastActiveDate2', width: '20'},
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        
        AWS.callSoap(WS, "listLocations").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);

                $$('status').setValue('Displaying ' + res.item.length + ' Appointment Locations');
            }
        });
    }

    updateGrid();

    function reset() {
        $$('dp-code').clear();
        $$('dp-description').clear();
        $$('dp-date').clear();
        $$('dp-all-company').setValue(false);
    }

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Appointment Location');
        reset();

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;

            const data = {
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-date').getIntValue(),
                allCompanies: $$('dp-all-company').getValue()
            };
            AWS.callSoap(WS, "newLocation", data).then(function (res) {
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

        $$('dp-title').setValue('Edit Appointment Location');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-date').setValue(row.lastActiveDate);
        $$('dp-all-company').setValue(row.allCompanies);

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;

            const data = {
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-date').getIntValue(),
                allCompanies: $$('dp-all-company').getValue(),
                id: row.id
            };
            AWS.callSoap(WS, "saveLocation", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Appointment Location?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteLocations", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });
})();
