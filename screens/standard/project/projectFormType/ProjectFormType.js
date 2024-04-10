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

/* global AWS, $$, Utils */

'use strict';

(async function () {

    const WS = 'StandardProjectProjectFormType';
    let allRows;

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: 30  },
        {headerName: 'Field Downloadable', field: 'fieldDownloadable', width: 20 },
        {headerName: 'Description', field: 'description', width: 40 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        AWS.callSoap(WS, "listFormTypes").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Project Form Types');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Project Form Type');
        $$('dp-code').clear();
        $$('dp-description').clear();
        $$('dp-downloadable').clear();

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                fieldDownloadable: $$('dp-downloadable').getValue() ? 'Y' : 'N'
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
        $$('dp-title').setValue('Edit Project Form Type');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-downloadable').setValue(row.downloadable);

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                id: row.id,
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                fieldDownloadable: $$('dp-downloadable').getValue() ? 'Y' : 'N'
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Project Form Type?', () => {
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
