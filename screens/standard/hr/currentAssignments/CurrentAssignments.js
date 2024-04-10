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
    const WS = 'com.arahant.services.standard.hr.currentAssignments';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Project First Date', field: 'projFirstDate2', type: 'numericColumn', width: 15  },
        {headerName: 'Project Last Date', field: 'projLastDate2', type: 'numericColumn', width: 15 },
        {headerName: 'Worker Start Date', field: 'startDate2', type: 'numericColumn', width: 15 },
        {headerName: 'Project ID', field: 'projectName', width: 15 },
        {headerName: 'Ext Reference', field: 'extRef', width: 15 },
        {headerName: 'Summary', field: 'summary', width: 70 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'shiftId');

    grid.show();

    let i9Part1;

    function updateGrid() {
        grid.clear();
        $$('move').disable();
        $$('remove').disable();
        $$('start-date').disable();
        const data = {
            personId: personId
        };
        Server.call(WS, 'GetAssignments', data).then(function (res) {
            if (res._Success) {
                for (let i = 0; i < res.allProjects.length; i++) {
                    let row = res.allProjects[i];
                    row.projFirstDate2 = DateUtils.intToStr4(row.projFirstDate);
                    row.projLastDate2 = DateUtils.intToStr4(row.projLastDate);
                    row.startDate2 = DateUtils.intToStr4(row.startDate);
                }
                grid.addRecords(res.allProjects);
                $$('status').setValue("Displaying " + res.allProjects.length + " rows");
                i9Part1 = res.i9_part1;
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('move').enable(rows);
        $$('remove').enable(rows);
        $$('start-date').enable(rows);
    });

    $$('add').onclick(() => {

        function doAdd() {
            $$('ap-title').setValue('Add Additional Project Assignment');
            $$('ap-project').forceSelect();
            $$('ap-start-date').setValue(0);
            Utils.popup_open('assignment-popup');

            $$('ap-ok').disable();

            $$('ap-project').setSelectFunction(async function () {
                let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
                if (res._status === "ok") {
                    $$('ap-project').setValue(res.projectId, res.summary, res);
                    $$('ap-ok').enable();
                }
            });

            $$('ap-ok').onclick(() => {
                if ($$('ap-project').isError("Project selection"))
                    return;
                const d = $$('ap-project').getData();
                const data = {
                    personId: personId,
                    shiftId: d.shiftId,
                    projectId: $$('ap-project').getValue(),
                    startDate: $$('ap-start-date').getIntValue()
                };
                Server.call(WS, 'AddAssignment', data).then(function (res) {
                    if (res._Success) {
                        updateGrid();
                        Utils.popup_close();
                    }
                });

            });

            $$('ap-cancel').onclick(() => {
                Utils.popup_close();
            });
        }
        if (i9Part1)
            doAdd();
        else
            Utils.yesNo('Query', "This employee hasn't completed their I9 Part 1.  Assign them anyway?", doAdd);
    });

    $$('remove').onclick(() => {
       Utils.yesNo('Query', 'Remove worker from selected project?', () => {
           const row = grid.getSelectedRow();
           const data = {
               personId: personId,
               shiftId: row.shiftId,
               projectId: row.projectId
           };
           Server.call(WS, 'RemoveAssignment', data).then(function (res) {
               if (res._Success) {
                   updateGrid();
               }
           });
       });
    });

    $$('start-date').onclick(() => {
        const row = grid.getSelectedRow();

        $$('sdp-project').setValue(row.summary);
        $$('sdp-project-start-date').setValue(row.projFirstDate2);
        $$('sdp-project-end-date').setValue(row.projLastDate2);
        $$('sdp-start-date').setValue(row.startDate);

        Utils.popup_open('start-date-popup');

        $$('sdp-ok').onclick(() => {
            const startDate = $$('sdp-start-date').getIntValue();

            if (startDate && row.projFirstDate && startDate < row.projFirstDate) {
                Utils.showMessage('Error', "Worker start date can't be before the project start date.");
                return;
            }
            if (startDate && row.projLastDate && startDate > row.projLastDate) {
                Utils.showMessage('Error', "Worker start date can't be after the project end date.");
                return;
            }

            const data = {
                personId: personId,
                shiftId: row.shiftId,
                startDate: startDate
            };
            Server.call(WS, 'SaveStartDate', data).then(function (res) {
                if (res._Success) {
                    updateGrid();
                }
                Utils.popup_close();
            });

        });

        $$('sdp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('move').onclick(() => {
        $$('ap-title').setValue('Change Project Assignment');
        $$('ap-project').forceSelect();
        Utils.popup_open('assignment-popup');

        $$('ap-ok').disable();

        $$('ap-project').setSelectFunction(async function () {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok") {
                $$('ap-project').setValue(res.projectId, res.summary, res);
                $$('ap-ok').enable();
            }
        });

        $$('ap-ok').onclick(async () => {
            if ($$('ap-project').isError("Project selection"))
                return;
            const d = $$('ap-project').getData();
            let data = {
                personId: personId,
                shiftId: d.shiftId,
                projectId: $$('ap-project').getValue()
            };
            let res = await Server.call(WS, 'AddAssignment', data);
            if (!res._Success)
                return;

            const row = grid.getSelectedRow();
            data = {
                personId: personId,
                shiftId: d.shiftId,
                projectId: row.projectId
            };
            res = await Server.call(WS, 'RemoveAssignment', data);
                if (res._Success) {
                    updateGrid();
                    Utils.popup_close();
                }
        });

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

})();
