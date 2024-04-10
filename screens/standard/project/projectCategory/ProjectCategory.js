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

    const WS = 'StandardProjectProjectCategory';
    let allRows;

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: 30  },
        {headerName: 'Description', field: 'description', width: 70 },
        {headerName: 'Scope', field: 'scopeFormatted', width: 15 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'projectCategoryId');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateGridFromMemory() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const rows = [];
        const show = $$('show').getValue();
        const today = DateUtils.today();
        for (let i=0 ; i < allRows.length ; i++) {
            let row = allRows[i];

            if (show === '3')
                // all
                rows.push(row);
            else {
                let lastActiveDate = Number(row.lastActiveDate);
                row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                if (show === '1') {
                    // active
                    if (!lastActiveDate  ||  lastActiveDate >= today)
                        rows.push(row);
                } else {
                    // inactive
                    if (lastActiveDate  &&  lastActiveDate < today)
                        rows.push(row);
                }
            }
        }
        grid.addRecords(rows);
        $$('status').setValue('Displaying ' + rows.length + ' Project Categories');
    }

    function updateGrid() {
        AWS.callSoap(WS, "listProjectCategories").then(function (res) {
            if (res.wsStatus === '0') {
                allRows = Utils.assureArray(res.projectCategories);
                updateGridFromMemory();
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateGridFromMemory);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Project Category');
        $$('dp-code').clear();
        $$('dp-description').setValue('');
        $$('dp-last-active-date').setValue('');
        $$('dp-all-companies').clear();

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            if ($$('dp-scope').isError('Scope'))
                return;
            const data = {
                allCompanies: $$('dp-all-companies').getValue(),
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-last-active-date').getIntValue(),
                scope: $$('dp-scope').getValue()
            };
            AWS.callSoap(WS, "newProjectCategory", data).then(function (res) {
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
        $$('dp-title').setValue('Edit Project Category');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-scope').setValue(row.scope);
        $$('dp-last-active-date').setValue(Number(row.lastActiveDate));
        $$('dp-all-companies').setValue(row.allCompanies === 'true');

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            if ($$('dp-scope').isError('Scope'))
                return;
            const data = {
                projectCategoryId: row.projectCategoryId,
                allCompanies: $$('dp-all-companies').getValue(),
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-last-active-date').getIntValue(),
                scope: $$('dp-scope').getValue()
            };
            AWS.callSoap(WS, "saveProjectCategory", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Project Category?', () => {
            const data = {
                projectCategoryIds: grid.getSelectedRow().projectCategoryId
            };
            AWS.callSoap(WS, "deleteProjectCategory", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getProjectCategoryReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
