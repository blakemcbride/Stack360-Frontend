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

    const WS = "com.arahant.services.standard.billing.expenseEditByProject";
    let selected_project;
    let mode;
    let editRow;
    let date = 0;

    const columnDefs = [
        {headerName: '', field: 'employee_id', hide: true},
        {headerName: '', field: 'week_paid_for', hide: true},
        {headerName: '', field: 'per_diem_amount', hide: true},
        {headerName: '', field: 'payment_method', hide: true},
        {headerName: 'Worker', field: 'worker_name', width: 200  },
        {headerName: 'Start of Week', field: 'week_paid_for_fmt', type: "numericColumn", width: 100 },
        {headerName: 'Hotel', field: 'hotel_amount', type: "numericColumn", valueFormatter:  AGGrid.numericFormat, mask: 'CD', decimalPlaces: 2, width: 100 },
        {headerName: 'Expenses', field: 'expense_amount', type: "numericColumn", valueFormatter:  AGGrid.numericFormat, mask: 'CD', decimalPlaces: 2, width: 100 },
        {headerName: 'Per Diem', field: 'per_diem_amount_fmt', type: "numericColumn", width: 100 },
        {headerName: 'Payment Method', field: 'payment_method_fmt', width: 130 },
        {headerName: 'Payroll Comments', field: 'comments', width: 250 },
        {headerName: 'Scheduling Comments', field: 'scheduling_comments', width: 250 }
    ];

    const detailGrid = new AGGrid('detail-grid', columnDefs, 'employee_id');
    detailGrid.show();

    $$('do-search-project').onclick(async function () {
        $$('project').clear();
        detailGrid.clear();
        $$('add').disable();
        $$('edit').disable();
        $$('delete').disable();
        $$('add-worker').disable();

        let data = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection', null);
        selected_project = data;
        $$('project').setValue(data ? data.summary : '');
        if (status) {
            refresh_expenses();
            $$('add').enable();
            $$('add-worker').enable();
        }
    });

    const refresh_expenses = function () {
        $$('edit').disable();
        $$('delete').disable();
        detailGrid.clear();
        if (!selected_project || !currentWeek())
            return;
        let data = {
            project_id: selected_project.projectId,
            project_week: currentWeek()
        };
        Server.call(WS, "GetExpenses", data).then(function (res) {
            if (res._Success) {

                const format_payment_method = function (value) {
                    switch(value) {
                        case 'D':  return "Direct deposit";
                        case 'M':  return "Cash";
                        case 'C':  return "Check";
                        case 'W':  return "Walmart";
                        case 'O':  return "Comdata";
                        default:   return "";
                    }
                };

                res.expenses = Utils.assureArray(res.expenses);
                for (let i=0 ; i < res.expenses.length ; i++) {
                    let row = { ...res.expenses[i]};  // the ... makes JS do a shallow copy
                    row.week_paid_for_fmt = DateUtils.intToStr4(row.week_paid_for);
                    row.per_diem_amount_fmt = Utils.format(row.per_diem_amount, "CD", 0, 2);
                    row.payment_method_fmt = format_payment_method(row.payment_method);
                    detailGrid.addRecord(row);
                }
            }
        });
    };

    detailGrid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    detailGrid.setOnRowDoubleClicked(function (event) {
        $$('edit').click();
    });

    const clear_per_diem_screen = function () {
        $$('pd-method').setValue('');
        $$('pd-date-week-paid-for').clear();
        $$('pd-date-paid').clear();
        $$('pd-per-diem').clear();
        $$('pd-expense').clear();
        $$('pd-hotel').clear();
        $$('pd-advance').clear();
        $$('pd-comments').clear('');
        $$('pd-scheduling-comments').clear('');
        $$('pd-return').setValue('');
    };

    $$('do-search-project').onclick(async function () {
        $$('project').clear();
        detailGrid.clear();
        $$('add').disable();
        $$('edit').disable();
        $$('delete').disable();
        $$('add-worker').disable();
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection', null);
        if (res._status === "ok") {
            selected_project = res;
            $$('project').setValue(res ? res.summary : '');
            refresh_expenses();
            $$('add').enable();
            $$('add-worker').enable();
        }
    });

    $$('add').onclick(function () {
        mode = 'add';
        $('#per-diem-title').text('Add Per Diem');

        clear_per_diem_screen();

        $$('pd-project').setValue(selected_project.summary);
        $$('pd-date-week-paid-for').setValue(currentWeek());
        $$('pd-person').enable();

        let data = { project_id: selected_project.projectId };
        Server.call(WS, "GetWorkers", data).then(function (res) {
            if (res._Success) {
                $$('pd-person').clear();
                $$('pd-person').add('', '(select)');
                for (let i = 0; i < res.workers.length; i++)
                    $$('pd-person').add(res.workers[i].employee_id, res.workers[i].worker_name);
            }
        });

        Utils.popup_open('per-diem-popup');
    });

    $$('add-worker').onclick(async function () {
        const data = {
            projectId: selected_project.projectId
        };
        const res = await Server.call(WS, 'GetShifts', data);
        if (res._Success) {
            const shifts = res.shifts;
            if (!shifts.length)
                Utils.showMessage('Error', 'Project has no shifts.');
            else {
                let data = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection', null);
                if (data._status === "ok") {
                    let shiftId;
                    if (shifts.length === 1)
                        shiftId = shifts[0].project_shift_id;
                    else {
                        const shiftCtl = $$('sp-shift');
                        shiftCtl.clear().addItems(shifts, 'project_shift_id', 'shift_start');
                        Utils.popup_open('shift-popup');
                        $$('sp-ok').onclick(function () {
                            const arg = {
                                project_id: selected_project.projectId,
                                shift_id: shiftCtl.getValue(),
                                employee_id: data.employeeid
                            };
                            Server.call(WS, "AddWorker", arg).then(async function (res) {
                                if (res._Success) {
                                    refresh_expenses();
                                }
                            });
                            Utils.popup_close();
                        });
                        $$('sp-cancel').onclick(function () {
                            Utils.popup_close();
                        });
                    }
                }
            }
        }
    });

    $$('edit').onclick(function () {
        mode = 'edit';
        $('#per-diem-title').text('Edit Per Diem');

        clear_per_diem_screen();

        let row = detailGrid.getSelectedRow();

        $$('pd-person').disable();
        $$('pd-date-week-paid-for').setValue(currentWeek());

        editRow = row;

        let data = {project_id: row.project_id };
        Server.call(WS, "GetWorkers", data).then(function (res) {
            if (res._Success) {
                $$('pd-person').clear();
                let found = false;
                for (let i = 0; i < res.workers.length; i++) {
                    $$('pd-person').add(res.workers[i].employee_id, res.workers[i].worker_name);
                    if (res.workers[i].employee_id === row.employee_id)
                        found = true;
                }

                if (found)
                    $$('pd-person').setValue(row.employee_id);
                else {
                    $$('pd-person').add(row.employee_id, row.worker_name);
                    $$('pd-person').setValue(row.employee_id);
                }

                $$('pd-project').setValue(row.project_name);

                $$('pd-method').setValue(row.payment_method);
                //$('#pd-date-week-paid-for').val(DateUtils.intToSQL(row.week_paid_for));
                $$('pd-date-paid').setValue(row.date_paid);
                $$('pd-per-diem').setValue(row.per_diem_amount);
                $$('pd-expense').setValue(row.expense_amount);
                $$('pd-hotel').setValue(row.hotel_amount);
                $$('pd-advance').setValue(row.advance_amount);
                $$('pd-return').setValue(row.per_diem_return);
                $$('pd-comments').setValue(row.comments);
                $$('pd-scheduling-comments').setValue(row.scheduling_comments);

                Utils.popup_open('per-diem-popup');
            }

        });
    });

    $$('delete').onclick(function () {
        Utils.yesNo('Query', 'Is it okay to delete this record?', function () {
            let row = detailGrid.getSelectedRow();

            let data = {
                expense_id: row.expense_id
            };
            Server.call(WS, "DeleteExpense", data).then(function (res) {
                if (res._Success) {
                    refresh_expenses();
                }
            });
        });
    });

    $$('pd-ok').onclick(function () {
        let error = $$('pd-project').isError('Project selection');
        if (!error)
            error = $$('pd-person').isError('Person');
        if (!error)
            error = $$('pd-date-week-paid-for').isError('First day of week paid for');

        if (!error)
            error = $$('pd-date-paid').isError('Date paid');
        if (!error)
            error = $$('pd-expense').isError('Expense');
        if (!error)
            error = $$('pd-hotel').isError('Hotel');
        if (!error)
            error = $$('pd-advance').isError('Advance');

        if (!error)
            error = $$('pd-method').isError('Payment method');

        if (!error) {

            let data = {
                employee_id: $$('pd-person').getValue(),
                project_id: selected_project.projectId,
                date_paid: $$('pd-date-paid').getIntValue(),
                week_paid_for: $$('pd-date-week-paid-for').getIntValue(),
                per_diem_amount: $$('pd-per-diem').getValue(),
                expense_amount: $$('pd-expense').getValue(),
                hotel_amount: $$('pd-hotel').getValue(),
                advance_amount: $$('pd-advance').getValue(),
                comments: $$('pd-comments').getValue(),
                scheduling_comments: $$('pd-scheduling-comments').getValue(),
                per_diem_return: $$('pd-return').getValue(),
                payment_method: $$('pd-method').getValue()
            };
            if (mode === 'edit'  &&  editRow.expense_id) {
                data.expense_id = editRow.expense_id;
                Server.call(WS, "UpdateExpense", data).then(function (res) {
                    if (res._Success) {
                        Utils.popup_close();
                        refresh_expenses();
                    }
                });

            } else
                Server.call(WS, "NewExpense", data).then(function (res) {
                    if (res._Success) {
                        Utils.popup_close();
                        refresh_expenses();
                    }
                });
        }
    });

    $$('work-date').onChange(function () {
        updateWhatDay();
        if (!$$('work-date').getIntValue()) {
            detailGrid.clear();
            $$('add').disable();
            $$('add-worker').disable();
            return;
        }
        if (selected_project) {
            refresh_expenses();
            $$('add').enable();
            $$('add-worker').enable();
        }
    });

    $$('pd-cancel').onclick(function () {
        Utils.popup_close();
    });

    const currentWeek = function () {
        return $$('work-date').getIntValue();
    };

    function updateWhatDay() {
        const dt = $$('work-date').getIntValue();
        const ctl = $$('what-day');
        if (!dt) {
            ctl.setColor('red').setValue('(date required)');
            $$('export').disable();
            $$('auto-generate').disable();
            date = 0;
        } else {
            ctl.clear();
            $$('export').enable();
            $$('auto-generate').enable();
            date = dt;
        }
    }

    function nextDate(ctlName, forward) {
        const ctl = $$(ctlName);
        let ival = ctl.getIntValue();
        if (!ival)
            return;
        ival = DateUtils.intAddDays(ival, forward ? 1 : -1);
        ctl.setValue(ival);
        updateWhatDay();
    }

    $$('nextDay').onclick(function () {
        if (!$$('work-date').getIntValue())
            return;
        nextDate('work-date', true);
        if (selected_project)
            refresh_expenses();
    });

    $$('prevDay').onclick(function () {
        if (!$$('work-date').getIntValue())
            return;
        nextDate('work-date', false);
        if (selected_project)
            refresh_expenses();
    });

    $$('export').onclick(function () {
        const date = currentWeek();
        const data = {
            beginning_date: date,
            ending_date: date
        };
        Utils.waitMessage('Export in progress; please wait.');
        Server.call(WS, "Export", data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success)
                Utils.showReport(res.filename);
        });
    });

    $$('auto-generate').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you wish to auto-generate per diem payments for all projects on this date?', () => {
            const data = {
                currentWeek: currentWeek()
            };
            Utils.waitMessage('Auto Generate in progress; please wait.');
            Server.call(WS, "AutoGenerate", data).then(function (res) {
                Utils.waitMessageEnd();
                if (res._Success) {
                    refresh_expenses();
                }
            });
        });
    });

})();



