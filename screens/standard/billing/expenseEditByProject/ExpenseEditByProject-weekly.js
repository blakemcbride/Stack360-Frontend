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
        {headerName: 'Worker', field: 'worker_name', width: 20  },
        {headerName: 'Start of Week', field: 'week_paid_for_fmt', type: "numericColumn", width: 10 },
        {headerName: 'Per Diem', field: 'per_diem_amount_fmt', type: "numericColumn", width: 10 },
        {headerName: 'Payment Method', field: 'payment_method_fmt', width: 10 },
        {headerName: 'Payroll Comments', field: 'comments', width: 25 },
        {headerName: 'Scheduling Comments', field: 'scheduling_comments', width: 25 }
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
        if (status && dateIsSaturday('project-week')) {
            refresh_expenses();
            $$('add').enable();
            $$('add-worker').enable();
        }
    });

    $$('exp-cancel').onclick(function() {
        Utils.popup_close();
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

    const dateIsSaturday = function (fld) {
        let dt = $$(fld).getDateValue();
        let day = dt.getDay();
        return day === 6;  // Saturday
    };

    const dateIsFriday = function (fld) {
        let dt = $$(fld).getDateValue();
        let day = dt.getDay();
        return day === 5;  // Friday
    };

    const clear_per_diem_screen = function () {
        $$('pd-method').setValue('');
        $$('pd-date-week-paid-for').clear();
        $$('pd-date-paid').clear();
        $$('pd-per-diem').clear();
        $$('pd-expense').clear();
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
            if (dateIsSaturday('project-week')) {
                refresh_expenses();
                $$('add').enable();
                $$('add-worker').enable();
            }
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
        let data = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection', null);
        if (data._status === "ok") {
            let arg = {
                project_id: selected_project.projectId,
                employee_id: data.employeeid
            };
            Server.call(WS, "AddWorker", arg).then(function (res) {
                if (res._Success) {
                    refresh_expenses();
                }
            });
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
            if (!dateIsSaturday('pd-date-week-paid-for')) {
                error = true;
                Utils.showMessage('Error', 'First day of week being paid for must be a Saturday');
            }

        if (!error)
            error = $$('pd-date-paid').isError('Date paid');
        if (!error)
            error = $$('pd-expense').isError('Expense');
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

    $$('project-week').onChange(function () {
        updateWhatDay();
        if (!$$('project-week').getIntValue()) {
            detailGrid.clear();
            $$('add').disable();
            $$('add-worker').disable();
            return;
        }
        if (!dateIsSaturday('project-week')) {
            detailGrid.clear();
            Utils.showMessage('Error', 'Beginning project week must be a Saturday');
            $$('add').disable();
            $$('edit').disable();
            $$('delete').disable();
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

    $$("exp-ok").onclick(function() {

        const bd = $$('exp-beginning-date').getIntValue();
        const ed = $$('exp-ending-date').getIntValue();

        if (!bd) {
            Utils.showMessage('Error', 'Missing begging date');
            return;
        }
        if (!ed) {
            Utils.showMessage('Error', 'Missing ending date');
            return;
        }
        if (ed < bd) {
            Utils.showMessage('Error', 'Ending date before beginning date');
            return;
        }
        if (!dateIsSaturday('exp-beginning-date')) {
            Utils.showMessage('Error', 'Beginning date must be a Saturday');
            return;
        }
        if (!dateIsFriday('exp-ending-date')) {
            Utils.showMessage('Error', 'Ending date must be a Friday');
            return;
        }

        const data = {
            beginning_date: bd,
            ending_date: ed
        };
        Server.call(WS, "Export", data).then(function (res) {
            if (res._Success)
                Utils.showReport(res.filename);
            Utils.popup_close();
        });
    });

    const currentWeek = function () {
        return $$('project-week').getIntValue();
    };

    function updateWhatDay() {
        const dt = $$('project-week').getIntValue();
        const ctl = $$('what-day');
        if (!dt) {
            ctl.setColor('red').setValue('(date required)');
            $$('export').disable();
            $$('auto-generate').disable();
            date = 0;
        } else if (DateUtils.dayOfWeek(dt) !== 6) {
            ctl.setColor('red').setValue('(date must be a Saturday)');
            if (!date) {
                $$('export').disable();
                $$('auto-generate').disable();
            }
            $$('project-week').setValue(date);
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
        let dow = DateUtils.dayOfWeek(ival);
        if (dow === 6)
            ival = DateUtils.intAddDays(ival, forward ? 7 : -7);
        else if (forward)
            ival = DateUtils.intAddDays(ival, 6 - dow);
        else
            ival = DateUtils.intAddDays(ival, -(dow+1));
        ctl.setValue(ival);
        updateWhatDay();
    }

    $$('nextWeek').onclick(function () {
        if (!$$('project-week').getIntValue())
            return;
        nextDate('project-week', true);
        if (selected_project)
            refresh_expenses();
    });

    $$('prevWeek').onclick(function () {
        if (!$$('project-week').getIntValue())
            return;
        nextDate('project-week', false);
        if (selected_project)
            refresh_expenses();
    });

    $$('export').onclick(function () {
        const date = currentWeek();

        $$('exp-beginning-date').setValue(date);
        $$('exp-ending-date').setValue(DateUtils.intAddDays(date, 6));

        Utils.popup_open('export-popup');
    });

    $$('auto-generate').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you wish to auto-generate per diem payments for all active projects on this date?', () => {
            const data = {
                currentWeek: currentWeek()
            };
            Server.call(WS, "AutoGenerate", data).then(function (res) {
                if (res._Success) {
                    refresh_expenses();
                }
            });
        });
    });

    $$('exp-beginning-date').onChange(function () {
        if (!dateIsSaturday('exp-beginning-date')) {
            Utils.showMessage('Error', 'Beginning date must be a Saturday');
        }
    });

    $$('exp-ending-date').onChange(function () {
        if (!dateIsFriday('exp-ending-date')) {
            Utils.showMessage('Error', 'Ending date must be a Friday');
        }
    });

})();



