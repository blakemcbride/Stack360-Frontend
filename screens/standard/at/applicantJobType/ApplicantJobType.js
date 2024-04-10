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

    There is no back-end for this screen.  It must have never been completed.

*/

'use strict';

(async function () {

    const WS = 'StandardAtApplicantJobType';
    let allRows;

    const columnDefs = [
        {headerName: 'Description', field: 'description', width: 80 },
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
        $$('status').setValue('Displaying ' + rows.length + ' Applicant Job Types');
    }

    function updateGrid() {
        const data = {
            activeType: 0
        };
        AWS.callSoap(WS, "listJobTypes").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    res.item[i].inactiveDate2 = DateUtils.intToStr4(Number(res.item[i].inactiveDate));
                allRows = res.item;
                updateDisplay();
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
        $$('dp-title').setValue('Add Applicant Job Type');
        $$('dp-description').clear();
        $$('dp-inactive-date').clear();

        Utils.popup_open('detail-popup', 'dp-description');

        $$('dp-ok').onclick(() => {
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                description: $$('dp-description').getValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue()
            };
            AWS.callSoap(WS, "newJobType", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Applicant Job Type');
        $$('dp-description').setValue(row.description);
        $$('dp-inactive-date').setValue(Number(row.inactiveDate));

        Utils.popup_open('detail-popup', 'dp-description');

        $$('dp-ok').onclick(() => {
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                id: row.id,
                description: $$('dp-description').getValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue()
            };
            AWS.callSoap(WS, "saveJobType", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Applicant Job Type?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteJobTypes", data).then(function (res) {
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
