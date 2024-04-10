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

    const WS = 'StandardCrmProspectStatus';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: '15'},
        {headerName: 'Description', field: 'description', width: '35'},
        {headerName: 'Certainty', field: 'certainty', width: '10'},
        {headerName: 'Status', field: 'status', width: '13'},
        {headerName: 'In Pipeline', field: 'includeInPipeline2', width: '13'},
        {headerName: 'Last Active Date', field: 'lastActiveDate2', width: '13'},
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        
        AWS.callSoap(WS, "listProspectStatuses").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.status = row.active === 'Y' ? 'Active' : 'Inactive';
                    row.includeInPipeline2 = row.includeInPipeline === true ? 'Yes' : 'No';
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);

                $$('status').setValue('Displaying ' + res.item.length + ' Prospect Statuses');
            }
        });
    }

    updateGrid();

    function reset() {
        $$('dp-code').clear();
        $$('dp-description').clear();
        $$('dp-certainty-ctl').setValue(0);
        $$('dp-status').clear();
        $$('dp-all-company').clear();
        $$('dp-pipeline').clear();
        $$('dp-fallback-time').setValue(0).disable();
        $$('dp-sales-points').setValue(0).disable();
        $$('dp-date').clear();
    }

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        $$('moveup').enable(rows);
        $$('movedown').enable(rows);
    });

    $$('dp-pipeline').onChange(() => {
        if ($$('dp-pipeline').getValue()) {
            $$('dp-fallback-time').enable();
            $$('dp-sales-points').enable();
        } else {
            $$('dp-fallback-time').disable();
            $$('dp-sales-points').disable();
        }
    })

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Prospect Status');
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
                certainty: $$('dp-certainty-ctl').getValue(),
                active: $$('dp-status').getValue(),
                initialSequence: grid.getSelectedRow() ? grid.getSelectedRow().id + 1 : -1,
                includeInPipeline: $$('dp-pipeline').getValue(),
                salesPoints: $$('dp-sales-points').getValue(),
                fallbackTime: $$('dp-fallback-time').getValue(),
                lastActiveDate: $$('dp-date').getIntValue(),
                allCompanies: $$('dp-all-company').getValue()
            };
            AWS.callSoap(WS, "newProspectStatus", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Prospect Status');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-status').setValue(row.active);
        $$('dp-certainty-ctl').setValue(row.certainty);
        $$('dp-pipeline').setValue(row.includeInPipeline);
        $$('dp-fallback-time').setValue(row.fallbackTime);
        $$('dp-sales-points').setValue(row.salesPoints);
        $$('dp-all-company').setValue(row.allCompanies);

        Utils.popup_open('detail-popup', 'dp-race');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;

            const data = {
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                certainty: $$('dp-certainty-ctl').getValue(),
                active: $$('dp-status').getValue(),
                includeInPipeline: $$('dp-pipeline').getValue(),
                salesPoints: $$('dp-sales-points').getValue(),
                fallbackTime: $$('dp-fallback-time').getValue(),
                lastActiveDate: $$('dp-date').getIntValue(),
                allCompanies: $$('dp-all-company').getValue(),
                id: row.id
            };
            AWS.callSoap(WS, "saveProspectStatus", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Prospect Status?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteProspectStatuses", data).then(function (res) {
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

    $$('moveup').onclick(() => {
        let id = grid.getSelectedRow().id;
        AWS.callSoap(WS, "moveProspectStatus", { id: grid.getSelectedRow().id, moveUp: true}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(id), 100);
            }
        });
    });

    $$('movedown').onclick(() => {
        let id = grid.getSelectedRow().id;
        AWS.callSoap(WS, "moveProspectStatus", { id: grid.getSelectedRow().id, moveUp: false}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(id), 100);
            }
        });
    });
})();
