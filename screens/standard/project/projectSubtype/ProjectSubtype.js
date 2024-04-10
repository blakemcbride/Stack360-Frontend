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

    const SWS = 'StandardProjectProjectType';
    const WS = 'com.arahant.services.standard.project.projectSubtype';
    let allRows;

    const columnDefs = [
        {headerName: 'Code', field: 'code', width: 30  },
        {headerName: 'Description', field: 'description', width: 40 },
        {headerName: 'Scope', field: 'scope2', width: 20 },
        {headerName: 'Last Active Date', field: 'lastActiveDate2', width: 20 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'project_subtype_id');
    grid.show();

    let res = await AWS.callSoap(SWS, "checkRight");
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
            let lastActiveDate = Number(allRows[i].last_active_date);
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
        $$('status').setValue('Displaying ' + rows.length + ' Project Sub-Types');
    }

    function updateGrid() {
        Server.call(WS, "ListProjectSubtypes").then(function (res) {
            if (res._Success) {
                for (let i=0 ; i < res.projectSubtypes.length ; i++) {
                    res.projectSubtypes[i].lastActiveDate2 = DateUtils.intToStr4(Number(res.projectSubtypes[i].last_active_date));
                    res.projectSubtypes[i].scope2 = res.projectSubtypes[i].scope === 'G' ? 'Global' : 'Internal';
                }
                allRows = res.projectSubtypes;
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
        $$('dp-title').setValue('Add Project Sub-Type');
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
            Server.call(WS, "NewProjectSubtype", data).then(function (res) {
                if (res._Success) {
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
        $$('dp-title').setValue('Edit Project Sub-Type');
        $$('dp-code').setValue(row.code);
        $$('dp-description').setValue(row.description);
        $$('dp-scope').setValue(row.scope);
        $$('dp-all-companies').setValue(!row.company_id);
        $$('dp-last-active').setValue(Number(row.last_active_date));

        Utils.popup_open('detail-popup', 'dp-code');

        $$('dp-ok').onclick(() => {
            if ($$('dp-code').isError('Code'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            const data = {
                projectSubtypeId: row.project_subtype_id,
                allCompanies: $$('dp-all-companies').getValue(),
                code: $$('dp-code').getValue(),
                description: $$('dp-description').getValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                scope: $$('dp-scope').getValue()
            };
            Server.call(WS, "SaveProjectSubtype", data).then(function (res) {
                if (res._Success) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Project Sub-Type?', () => {
            const data = {
                projectSubtypeId: grid.getSelectedRow().project_subtype_id
            };
            Server.call(WS, "DeleteProjectSubtype", data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });

})();
