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
    const WS = 'StandardCrmClientStatusDetailList';

    const columnDefs = [
        {headerName: 'Client Name', field: 'clientName', width: 25},
        {headerName: 'Status', field: 'statusCode', width: 15},
        {headerName: 'Last Contact', field: 'lastContactDate2', width: 15},
        {headerName: 'Comments', field: 'comments', width: 50}
    ];
    const grid = new AGGrid('grid', columnDefs, 'clientId');
    grid.show();

    function updateGrid() {
        grid.clear();
        AWS.callSoap(WS, 'listClientStatusDetail').then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    res.item[i].lastContactDate2 = DateUtils.intToStr4(Number(res.item[i].lastContactDate));
                grid.addRecords(res.item);
            }
        });
    }

    updateGrid();

    function edit() {
        const row = grid.getSelectedRow();
        $$('sp-client').setValue(row.clientName);
        $$('sp-last-contact').setValue(Number(row.lastContactDate));
        $$('sp-comment').setValue(row.comments);
        AWS.callSoap(WS, 'listClientStatuses').then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('sp-status');
                ctl.clear().add('', '(select)');
                for (let i=0 ; i < res.item.length ; i++) {
                    let r = res.item[i];
                    ctl.add(r.id, r.name + " - " + r.description);
                }
                ctl.setValue(row.statusId);
            }
        });
        Utils.popup_open('status-popup');

        $$('sp-ok').onclick(() => {
            if ($$('sp-status').isError('Status'))
                return;
            const data = {
                comments: $$('sp-comment').getValue(),
                id: row.clientId,
                lastContactDate: $$('sp-last-contact').getIntValue(),
                statusId: $$('sp-status').getValue()
            };
            AWS.callSoap(WS, 'saveClientStatus', data).then(function (res) {
                if (res.wsStatus === "0") {
                   Utils.popup_close();
                   updateGrid();
                }
            });
        });

        $$('sp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
    });

    grid.setOnRowDoubleClicked(edit);

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getClientDetailReport').then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    })

})();
