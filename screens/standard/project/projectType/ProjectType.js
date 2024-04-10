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

    const WS = 'StandardProjectProjectType';
    let allRows;

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: 30  },
        {headerName: 'Description', field: 'description', width: 40 },
        {headerName: 'Scope', field: 'scope2', width: 20 },
        {headerName: 'Last Active Date', field: 'lastActiveDate2', width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'projectTypeId');
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
            let lastActiveDate = Number(allRows[i].lastActiveDate);
            if (type === '1') {
                if (!lastActiveDate || lastActiveDate > today)
                    rows.push(allRows[i]);
            } else if (type === '2') {
                if (lastActiveDate && lastActiveDate < today)
                    rows.push(allRows[i]);
            } else
                rows.push(allRows[i]);
        }
        grid.addRecords(rows);
        $$('status').setValue('Displaying ' + rows.length + ' Project Types');
    }

    function updateGrid() {
        AWS.callSoap(WS, "listProjectTypes").then(function (res) {
            if (res.wsStatus === '0') {
                res.projectTypes = Utils.assureArray(res.projectTypes);
                for (let i=0 ; i < res.projectTypes.length ; i++) {
                    res.projectTypes[i].lastActiveDate2 = DateUtils.intToStr4(Number(res.projectTypes[i].lastActiveDate));
                    res.projectTypes[i].scope2 = res.projectTypes[i].scope === 'G' ? 'Global' : 'Internal';
                }
                allRows = res.projectTypes;
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
        $$('dp-title').setValue('Add Project Type');
        $$('dp-code').clear();
        $$('dp-description').clear();
        $$('dp-last-active').clear();
        $$('dp-all-companies').clear();

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                allCompanies: $$('dp-all-companies').getValue(),
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                scope: $$('dp-scope').getValue()
            };
            AWS.callSoap(WS, "newProjectType", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Project Type');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-scope').setValue(row.scope);
        $$('dp-all-companies').setValue(row.allCompanies !== 'false');
        $$('dp-last-active').setValue(Number(row.lastActiveDate));

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                projectTypeId: row.projectTypeId,
                allCompanies: $$('dp-all-companies').getValue(),
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                scope: $$('dp-scope').getValue()
            };
            AWS.callSoap(WS, "saveProjectType", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Project Type?', () => {
            const data = {
                projectTypeIds: grid.getSelectedRow().projectTypeId
            };
            AWS.callSoap(WS, "deleteProjectType", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getProjectTypeReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
