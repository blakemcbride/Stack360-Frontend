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

    const WS = 'com.arahant.services.standard.project.shifts';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary);

    const columnDefs = [
        {headerName: 'Shift', field: 'description', width: 400  },
        {headerName: 'Shift Start', field: "shift_start", valueFormatter:  AGGrid.time, width: 100 },
        {headerName: 'Required Workers', field: 'required_workers', width: 140, type: "numericColumn" }
    ];
    const grid = new AGGrid('shift-grid', columnDefs, 'project_shift_id');
    grid.show();
    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    const rights = await Server.call(WS, 'CheckRight');
    if (!rights._Success || rights.accessLevel === 0)
        return;
    $$('add').show(rights.accessLevel === 2);
    $$('edit').show(rights.accessLevel === 2);
    $$('delete').show(rights.accessLevel === 2);
    grid.enable(rights.accessLevel === 2);

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            projectId: projectId
        };
        Server.call(WS, 'GetShifts', data).then(res => {
            if (res._Success) {
                grid.addRecords(res.shifts);
            }
        });
    }

    updateGrid();

    $$('add').onclick(() => {
        $$('sp-title').setValue('New Shift');
        $$('sp-description').clear();
        $$('sp-shift-start').clear();
        $$('sp-required-workers').clear();
        Utils.popup_open('shift-popup', 'sp-description');

        $$('sp-ok').onclick(() => {
            if ($$('sp-description').isError('Description'))
                return;
            if ($$('sp-shift-start').isError('Shift start'))
                return;
            const data = {
                projectId: projectId,
                description: $$('sp-description').getValue(),
                shiftStart: $$('sp-shift-start').getValue(),
                requiredWorkers: $$('sp-required-workers').getValue()
            };
            Server.call(WS, 'NewShift', data).then(res => {
                if (res._Success) {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('sp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const shift = grid.getSelectedRow();
        $$('sp-title').setValue('Edit Shift');
        $$('sp-description').setValue(shift.description);
        $$('sp-shift-start').setValue(shift.shift_start);
        $$('sp-required-workers').setValue(shift.required_workers);
        Utils.popup_open('shift-popup', 'sp-description');

        $$('sp-ok').onclick(async () => {
            if ($$('sp-description').isError('Description'))
                return;
            if ($$('sp-shift-start').isError('Shift start'))
                return;
            const data = {
                shiftId: shift.project_shift_id,
                description: $$('sp-description').getValue(),
                shiftStart: $$('sp-shift-start').getValue(),
                requiredWorkers: $$('sp-required-workers').getValue()
            };
            Server.call(WS, 'EditShift', data).then(res => {
                if (res._Success) {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('sp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Query', 'Ok to delete selected shift?', () => {
            const shift = grid.getSelectedRow();
            const data = {
                shiftId: shift.project_shift_id
            };
            Server.call(WS, 'DeleteShift', data).then(res => {
                if (res._Success) {
                    updateGrid();
                }
            });
        });
    });

})();
