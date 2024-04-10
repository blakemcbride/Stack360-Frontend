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

    const WS = 'StandardAtApplicantStatus';
    let allRows;

    const columnDefs = [
        {headerName: 'Name', field: 'name', width: 80 },
        {headerName: 'Consider for Hire', field: 'considerForHire2', width: 20 },
        {headerName: 'Send Email', field: 'sendEmail2', width: 20 },
        {headerName: 'Inactive', field: 'inactiveDate2', width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateDisplay() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        $$('move-up').disable();
        $$('move-down').disable();
        const type = $$('show').getValue();
        const today = DateUtils.today();
        const rows = [];
        for (let i=0 ; i < allRows.length ; i++) {
            let inactiveDate = Number(allRows[i].inactiveDate);
            if (type === '1') {
                if (!inactiveDate || inactiveDate > today)
                    rows.push(allRows[i]);
            } else if (type === '2') {
                if (inactiveDate && inactiveDate < today)
                    rows.push(allRows[i]);
            } else
                rows.push(allRows[i]);
        }
        grid.addRecords(rows);
        $$('status').setValue('Displaying ' + rows.length + ' Applicant Statuses');
    }

    function updateGrid() {
        return new Promise((resolve, reject) => {
            const data = {
                activeType: 0
            };
            AWS.callSoap(WS, "listStatuses").then(function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    for (let i = 0; i < res.item.length; i++) {
                        res.item[i].inactiveDate2 = DateUtils.intToStr4(Number(res.item[i].inactiveDate));
                        res.item[i].considerForHire2 = res.item[i].considerForHire === 'true' ? 'Yes' : 'No';
                        res.item[i].sendEmail2 = res.item[i].sendEmail === 'true' ? 'Yes' : 'No';
                    }
                    allRows = res.item;
                    updateDisplay();
                    resolve();
                }
            });
        });
    }

    updateGrid();

    $$('show').onChange(updateDisplay);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        $$('move-up').enable(rows);
        $$('move-down').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Applicant Status');
        $$('dp-name').clear();
        $$('dp-inactive-date').clear();
        $$('dp-consider-for-hire').setValue(true);
        $$('dp-send-response-email').setValue(false);

        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            const data = {
                name: $$('dp-name').getValue(),
                addAfterId: null,
                considerForHire: $$('dp-consider-for-hire').getValue(),
                emailAddress: null,
                emailBody: null,
                emailSubject: null,
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                sendEmail: $$('dp-send-response-email').getValue()
            };
            AWS.callSoap(WS, "newStatus", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Applicant Status');
        $$('dp-name').setValue(row.name);
        $$('dp-inactive-date').setValue(Number(row.inactiveDate));
        $$('dp-consider-for-hire').setValue(row.considerForHire === 'true');
        $$('dp-send-response-email').setValue(row.sendEmail === 'true');

        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            const data = {
                id: row.id,
                name: $$('dp-name').getValue(),
                addAfterId: null,
                considerForHire: $$('dp-consider-for-hire').getValue(),
                emailAddress: null,
                emailBody: null,
                emailSubject: null,
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                sendEmail: $$('dp-send-response-email').getValue()
            };
            AWS.callSoap(WS, "saveStatus", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Applicant Status?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteStatuses", data).then(function (res) {
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

    $$('move-up').onclick(() => {
        const row = grid.getSelectedRow();
        const data = {
            id: row.id,
            moveUp: true
        };
        AWS.callSoap(WS, "moveStatus", data).then(async function (res) {
            if (res.wsStatus === '0') {
                await updateGrid();
                grid.selectId(row.id);
            }
        });
    });

    $$('move-down').onclick(() => {
        const row = grid.getSelectedRow();
        const data = {
            id: row.id,
            moveUp: false
        };
        AWS.callSoap(WS, "moveStatus", data).then(async function (res) {
            if (res.wsStatus === '0') {
                await updateGrid();
                grid.selectId(row.id);
            }
        });
    });

})();
