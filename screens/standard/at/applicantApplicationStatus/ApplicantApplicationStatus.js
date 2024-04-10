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

    const WS = 'StandardAtApplicantApplicationStatus';
    let allRows;

    const columnDefs = [
        {headerName: 'Name', field: 'name', width: 150 },
        {headerName: 'Phase', field: 'phase2', width: 100 },
        {headerName: 'Active', field: 'active2', width: 40 },
        {headerName: 'Inactive Date', field: 'inactiveDate2', width: 40 }
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
        $$('status').setValue('Displaying ' + rows.length + ' Applicant Application Statuses');
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
                        res.item[i].active2 = res.item[i].active === 'true' ? 'Yes' : 'No';
                        switch (res.item[i].phase) {
                            case '0':
                                res.item[i].phase2 = 'No application';
                                break;
                            case '1':
                                res.item[i].phase2 = 'Application made';
                                break;
                            case '2':
                                res.item[i].phase2 = 'Offer extended';
                                break;
                            case '3':
                                res.item[i].phase2 = 'Offer accepted';
                                break;
                            case '4':
                                res.item[i].phase2 = 'Hired';
                                break;
                            case '5':
                                res.item[i].phase2 = 'Offer rejected';
                                break;
                            case '6':
                                res.item[i].phase2 = 'Offer retracted';
                                break;
                            default:
                                res.item[i].phase2 = '';
                                break;
                        }
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
        $$('dp-title').setValue('Add Applicant Application Status');
        $$('dp-name').clear();
        $$('dp-inactive-date').clear();
        $$('dp-active').setValue(true);
        $$('dp-phase').setValue('');

        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-phase').isError('Phase'))
                return;
            const data = {
                name: $$('dp-name').getValue(),
                active: $$('dp-active').getValue(),
                addAfterId: null,
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                phase: Number($$('dp-phase').getValue())
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
        $$('dp-title').setValue('Edit Applicant Application Status');
        $$('dp-name').setValue(row.name);
        $$('dp-inactive-date').setValue(Number(row.inactiveDate));
        $$('dp-active').setValue(row.active === 'true');
        $$('dp-phase').setValue(row.phase + '');

        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-phase').isError('Phase'))
                return;
            const data = {
                id: row.id,
                name: $$('dp-name').getValue(),
                addAfterId: null,
                active: $$('dp-active').getValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                phase: Number($$('dp-phase').getValue())
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Applicant Application Status?', () => {
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
