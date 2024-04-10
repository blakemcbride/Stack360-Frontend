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
    const WS = 'StandardTimeTimesheetEntryWeeklySummary';
    let activeSeen = false;
    let inactiveSeen = false;
    const shiftCtl = $$('shift');

    shiftCtl.clear();

    Utils.setGridHeight('screen-start', 'grid', 'bottom-start', 'bottom-end', 'screen-end');

    const columnDefs = [
        {headerName: 'Status', field: 'state', width: 10  },
        {headerName: 'Worker ID', field: 'workerId', width: 20 },
        {headerName: 'Worker Name', field: 'workerName', width: 70 },
        {headerName: 'Per Diem', field: 'totalHours2', type: 'numericColumn', width: 30 },
        {headerName: 'Expenses', field: 'totalExpenses2', type: 'numericColumn', width: 30 },
        {headerName: 'Advances', field: 'totalPay2', type: 'numericColumn', width: 30 }
    ];
    // must use 'id' because the incoming id's are not uniques (they're often just 'New')
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let data = {
    };
    AWS.callSoap(WS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    data = {
        category: null,
        companyId: null,
        personId: null,
        ProjectName: null,
        projectNameSearchType: 0,
        quickList: false,
        status: null,
        summary: null,
        summarySearchType: 0,
        type: null
    };
    AWS.callSoap(WS, 'searchProjects', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('project');

            async function select() {
                const res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
                if (res._status === "ok") {
                    return res;
                } else
                    return null;
            }


            for (let i=0 ; i < res.item.length ; i++)
                res.item[i].name = res.item[i].description + ' (' + res.item[i].requestingCompanyName + ')';
            ctl.setup(res.lowCap, true);
            ctl.setupItems(res.item, 'projectId', 'name');
            ctl.setupSelectFunction(select, 'projectId', (res) => {
                return res.summary + ' (' + res.client + ')';
            });
            ctl.run();
        }
    });

    function updateGrid () {
        grid.clear();
        const projectId = $$('project').getValue();
        const shiftId = shiftCtl.getValue();
        if (!projectId || !shiftId) {
            $$('add').disable();
            $$('approve-entire-week').disable();
        } else
            $$('add').enable();
        $$('edit').disable();
        $$('delete').disable();
        if (!projectId)
            return;
        const data = {
            projectId: projectId,
            shiftId: shiftId,
            showAll: $$('show-all').getValue(),
            workDate: $$('week-ending').getIntValue()
        };
        AWS.callSoap(WS, 'listTimesheetsForProjectOnDate', data).then(function (res) {
            if (res.wsStatus === "0") {
                let totalHours = 0;
                let id = 0;
                activeSeen = inactiveSeen = false;
                res.timesheetTransmit = Utils.assureArray(res.timesheetTransmit);
                for (let i=0 ; i < res.timesheetTransmit.length ; i++) {
                    res.timesheetTransmit[i].id = id++;
                    res.timesheetTransmit[i].totalPay2 = Utils.format(Number(res.timesheetTransmit[i].totalPay), "CB", 0, 2);
                    res.timesheetTransmit[i].totalHours2 = Utils.format(Number(res.timesheetTransmit[i].totalHours), "CB", 0, 2);
                    res.timesheetTransmit[i].totalExpenses2 = Utils.format(Number(res.timesheetTransmit[i].totalExpenses), "CB", 0, 2);
                    totalHours += Number(res.timesheetTransmit[i].totalHours);
                    if (res.timesheetTransmit[i].state === 'A')
                        activeSeen = true;
                    else if (res.timesheetTransmit[i].state === 'N'  &&  Number(res.timesheetTransmit[i].totalHours) >= .01)
                        inactiveSeen = true;
                }
                grid.clear(); // this is needed
                grid.addRecords(res.timesheetTransmit);
                $$('total-hours').setValue(totalHours);
                if (totalHours > .01) {
                    const ctl = $$('approve-entire-week');
                    if (inactiveSeen)
                        ctl.setValue('Approve Entire Week');
                    else
                        ctl.setValue('Unapprove Entire Week');
                    ctl.show();
                } else
                    $$('approve-entire-week').hide();
            }
        });
    }

    $$('project').onChange(async () => {
        await updateShifts();
        updateGrid();
    });

    shiftCtl.onChange(updateGrid);

    async function updateShifts() {
        shiftCtl.clear();
        const projectId = $$('project').getValue();
        if (!projectId)
            return;
        const data = {
            projectId: projectId
        };
        let res = await Server.call('com.arahant.services.standard.project.projectAssignment', 'GetShifts', data);
        if (res._Success) {
            if (res.shifts.length === 1) {
                const shift = res.shifts[0];
                shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
            } else {
                shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable();
            }
        }
    }

    function findFriday(dt) {
        let dow = DateUtils.dayOfWeek(dt);
        if (dow === 5)
            return dt;
        let jd = DateUtils.julian(dt);
        if (dow === 6)
            jd += 6;
        else
            jd += 5 - dow;
        return DateUtils.calendar(jd);
    }

    $$('week-ending').setValue(findFriday(DateUtils.dateToInt(new Date())));

    $$('previous').onclick(function () {
        const ctl = $$('week-ending');
        let val = ctl.getIntValue();
        val = DateUtils.intAddDays(val, -7);
        ctl.setValue(findFriday(val));
        updateGrid();
    });

    $$('next').onclick(function () {
        const ctl = $$('week-ending');
        let val = ctl.getIntValue();
        let f = findFriday(val);
        if (f === val)
            ctl.setValue(DateUtils.intAddDays(val, 7));
        else
            ctl.setValue(findFriday(val));
        updateGrid();
    });

    $$('show-all').onChange(function () {
        updateGrid();
    });

    $$('column-legend').onclick(function () {
        Utils.popup_open('column-legend-popup', 'clp-close');
        $$('clp-close').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('approve-entire-week').onclick(function () {
        const timesheetIds = [];
        const rows = grid.getAllRows();
        for (let i=0 ; i < rows.length ; i++) {
            if (inactiveSeen) {
                // approve
                if (rows[i].state === 'N'  &&  Number(rows[i].totalHours) >= .01)
                    timesheetIds.push(rows[i].timesheetId);
            } else {
                // unapprove
                if (rows[i].state === 'A')
                    timesheetIds.push(rows[i].timesheetId);
            }
        }
        if (timesheetIds.length) {
            const data = {
                direction: inactiveSeen ? 'A' : 'U',
                timesheetIds: timesheetIds
            };
            AWS.callSoap(WS, 'approveTime', data).then(function (res) {
                if (res.wsStatus === "0") {

                }
                updateGrid();
            });
        }
    });

    grid.setOnSelectionChanged(function (rows) {
        const projectId = $$('project').getValue();
        const shiftId = shiftCtl.getValue();
        if (!projectId || !shiftId || !rows.length) {
            $$('add').disable();
            $$('edit').disable();
            $$('delete').disable();
            $$('approve-entire-week').disable();
        } else {
            let row = rows[0];
            if (row.state === 'A' || row.state === 'I') {
                $$('edit').disable();
                $$('delete').disable();
            } else {
                $$('edit').enable(rows);
                $$('delete').enable(rows);
            }
        }
    });

    $$('add').onclick(function () {
        $('#tep-title').text('Add Timesheet Entry - Week Ending Friday, ' + DateUtils.intToStr4($$('week-ending').getIntValue()));
        const rec = $$('project').getData();
        $$('tep-company').setValue(rec.requestingCompanyName);
        $$('tep-project').setValue(rec.description);
        $$('tep-shift').setValue(shiftCtl.getLabel());
        Utils.popup_open('timesheet-entry-popup');
        $$('tep-worker').clear().forceSelect().setSelectFunction(async function () {
            let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', { needPhoneNumbers: true });
            if (res._status === "ok") {
                let name = res.lname + ", " + res.fname +" " + res.mname;
                $$('tep-worker').setValue(res.employeeid, name, res);
                $$('tep-home').setValue(res.homephone);
                $$('tep-cell').setValue(res.cellphone);
            }
        });
        $$('tep-home').clear();
        $$('tep-cell').clear();
        $$('tep-hours').clear();
        $$('tep-expenses').clear();
        $$('tep-pay').clear();

        $$('tep-ok').onclick(function () {
            if ($$('tep-worker').isError('Worker'))
                return;
            const data = {
                beginningTime: 0,
                billable: null,
                description: null,
                endTime: 0,
                personId: $$('tep-worker').getValue(),
                projectId: $$('project').getValue(),
                shiftId: shiftCtl.getValue(),
                totalExpenses: $$('tep-expenses').getValue(),
                totalHours: $$('tep-hours').getValue(),
                totalPay: $$('tep-pay').getValue(),
                workDate: $$('week-ending').getIntValue()
            };
            AWS.callSoap(WS, 'addTimeEntry', data).then(function (res) {
                updateGrid();  //  update regardless of wsStatus!
                Utils.popup_close();
            });
        });

        $$('tep-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    function edit() {
        $('#tep-title').text('Edit Timesheet Entry - Week Ending Friday, ' + DateUtils.intToStr4($$('week-ending').getIntValue()));
        Utils.popup_open('timesheet-entry-popup');
        const rec = $$('project').getData();
        $$('tep-company').setValue(rec.requestingCompanyName);
        $$('tep-project').setValue(rec.description);
        $$('tep-shift').setValue(shiftCtl.getLabel());
        const row = grid.getSelectedRow();
        $$('tep-worker').clear().singleValue(row.personId, row.workerName, row);
        $$('tep-home').setValue(row.homePhone);
        $$('tep-cell').setValue(row.cellPhone);

        $$('tep-hours').setValue(Number(row.totalHours));
        $$('tep-expenses').setValue(Number(row.totalExpenses));
        $$('tep-pay').setValue(Number(row.totalPay));
        $$('tep-ok').onclick(function () {
            const data = {
                beginningTime: 0,
                billable: null,
                description: null,
                endTime: 0,
                personId: $$('tep-worker').getValue(),
                projectId: $$('project').getValue(),
                shiftId: shiftCtl.getValue(),
                timesheetId: row.timesheetId,
                totalExpenses: $$('tep-expenses').getValue(),
                totalHours: $$('tep-hours').getValue(),
                totalPay: $$('tep-pay').getValue(),
                workDate: $$('week-ending').getIntValue()
            };
            AWS.callSoap(WS, 'saveTimeEntry', data).then(function (res) {
                updateGrid();  // update grid regardless of wsStatus!
                Utils.popup_close();
            });
        });

        $$('tep-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected timesheet entry?', function () {
            const row = grid.getSelectedRow();
            const data = {
                personID: row.personId,
                projectID: $$('project').getValue(),
                shiftId: shiftCtl.getValue(),
                timesheetIds: row.timesheetId
            };
            AWS.callSoap(WS, 'deleteTimesheet', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateGrid();
                }
            });
        });
    });

})();
