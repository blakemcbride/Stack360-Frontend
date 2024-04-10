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

    const WS = 'StandardCrmClientLog';
    const TimeMultiplier = 100000;
    const clientId = Utils.getData("CURRENT_CLIENT_ID");
    const clientName = Utils.getData("CURRENT_CLIENT_NAME");

    $$('client-name').setValue(clientName);

    const columnDefs = [
        {headerName: 'Date', field: 'contactDate2', width: 10  },
        {headerName: 'Time', field: 'contactTime2', width: 10 },
        {headerName: 'Log Entry', field: 'contactText', width: 80 }
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
        const data = {
            id: clientId
        };
        AWS.callSoap(WS, "listLogs", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    res.item[i].contactDate2 = DateUtils.intToStr4(Number(res.item[i].contactDate));
                    res.item[i].contactTime2 = TimeUtils.format(Number(res.item[i].contactTime)/TimeMultiplier);
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Client Log Entries');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Client Log');
        $$('dp-contact-date').setValue(DateUtils.today());
        $$('dp-contact-time').setValue(TimeUtils.current());
        $$('dp-detail').clear();
        $$('dp-company-employees').clear();
        $$('dp-client-employees').clear();
        Utils.popup_open('detail-popup', 'dp-detail');

        $$('dp-ok').onclick(() => {
            if ($$('dp-detail').isError('Detail'))
                return;
            const data = {
                contactDate: $$('dp-contact-date').getIntValue(),
                contactText: $$('dp-detail').getValue(),
                contactTime: $$('dp-contact-time').getValue() * TimeMultiplier,
                employees: $$('dp-company-employees').getValue(),
                id: clientId,
                prospectEmployees: $$('dp-client-employees').getValue()
            };
            AWS.callSoap(WS, "newLog", data).then(function (res) {
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
        const data = {
            id: row.id
        };
        const log = await AWS.callSoap(WS, "loadLog", data);
        if (log.wsStatus !== '0')
            return;
        $$('dp-title').setValue('Edit Client Log');
        $$('dp-contact-date').setValue(Number(row.contactDate));
        $$('dp-contact-time').setValue(Number(row.contactTime)/TimeMultiplier);
        $$('dp-detail').setValue(log.contactText);
        $$('dp-company-employees').setValue(log.employees);
        $$('dp-client-employees').setValue(log.prospectEmployees);
        Utils.popup_open('detail-popup', 'dp-detail');

        $$('dp-ok').onclick(() => {
            if ($$('dp-detail').isError('Detail'))
                return;
            const data = {
                contactDate: $$('dp-contact-date').getIntValue(),
                contactText: $$('dp-detail').getValue(),
                contactTime: $$('dp-contact-time').getValue() * 100000,
                employees: $$('dp-company-employees').getValue(),
                id: row.id,
                prospectEmployees: $$('dp-client-employees').getValue()
            };
            AWS.callSoap(WS, "saveLog", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Client Log?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteLogs", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            id: clientId
        };
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
