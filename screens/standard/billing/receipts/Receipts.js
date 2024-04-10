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

    const WS = "com.arahant.services.standard.billing.receipts";
    let allExpenseAccounts;

    let columnDefs = [
        {headerName: 'Worker', field: 'person_name', width: 40  },
        {headerName: 'Project', field: 'project_description', width: 80 },
        {headerName: 'Type', field: 'expense_account', width: 20 },
        {headerName: 'Date', field: 'receipt_date2', type: "numericColumn", width: 20 },
        {headerName: 'Amount', field: 'expense_amount2', type: "numericColumn", width: 20 }
    ];

    const receiptGrid = new AGGrid('receipt-grid', columnDefs, 'expense_receipt_id');
    receiptGrid.multiSelect();
    receiptGrid.show();

    $$('project').forceSelect().setSelectFunction(async function () {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok")
            $$('project').setValue(res.projectId, res.summary);
    });
    $$('worker').forceSelect().setSelectFunction(async function () {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            let name = res.lname + ", " + res.fname;
            if (res.mname)
                name += " " + res.mname;
            $$('worker').setValue(res.employeeid, name);
        }
    });

    receiptGrid.setOnSelectionChanged(function (rows) {
        $$('details').enable(rows);
        $$('approve').enable(rows);
        $$('view-download').enable(rows);
        $$('report').enable(rows);
        $$('unapprove').enable(rows);
    });

    $$('reset').onclick(function () {
        $$('project').clear();
        $$('worker').clear();
        $('#expense').val('');
        $$('start-date').setValue(null);
        $$('end-date').setValue(null);
        $$('expense-account').setValue('');
    });
    
    Server.call(WS, "GetExpenseAccounts", {}).then(function (res) {
        if (res._Success) {
            allExpenseAccounts = res.expense_accounts;
            let ctl = $$('expense-account');
            ctl.clear();
            ctl.add('', '(select)');
            for (let i = 0; i < res.expense_accounts.length; i++)
                ctl.add(res.expense_accounts[i].expense_account_id, res.expense_accounts[i].description);
        }
    });

    function makeString(v) {
        return v ? v : '';
    }

    const updateReceiptGrid = function () {
        receiptGrid.clear();
        $$('details').disable();
        $$('approve').disable();
        $$('view-download').disable();
        $$('report').disable();
        $$('unapprove').disable();
        let data = {
            person_id: makeString($$('worker').getValue()),
            project_id: makeString($$('project').getValue()),
            start_date: $$('start-date').getIntValue(),
            end_date: $$('end-date').getIntValue(),
            expense_account_id: $$('expense-account').getValue()
        };
        Server.call(WS, "SearchReceipts", data).then(function (res) {
            if (res._Success) {
                const r = res.expense_receipts;
                for (let i=0 ; i < r.length ; i++) {
                    r[i].receipt_date2 = DateUtils.intToStr4(r[i].receipt_date);
                    r[i].expense_amount2 = Utils.format(r[i].expense_amount, "CD", 0, 2);
                }
                receiptGrid.addRecords(r);
            }
        });
    };

    $$('search').onclick(function () {
        updateReceiptGrid();
    });

    $$('view-download').onclick(function () {
        const rows = receiptGrid.getSelectedRows();
        if (rows.length === 1) {
            let row = rows[0];
            let data = {
                expense_receipt_id: row.expense_receipt_id
            };
            Server.call(WS, "GetPicture", data).then(function (res) {
                if (res._Success) {
                    Utils.showReport(res.url);
                }
            });
        } else if (rows.length > 1)
            Utils.showMessage('Error', 'Can only view one row at a time.');
        else
            Utils.showMessage('Error', 'Must select a row first.');
    });

    $$('report').onclick(function () {
        const rows = receiptGrid.getSelectedRows();
        if (rows.length) {
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                ids.push(row.expense_receipt_id);
            }
            let data = {
                expense_receipt_ids: ids
            };
            Utils.waitMessage("Generating report; please wait.");
            Server.call(WS, "CreateReport", data).then(function (res) {
                if (res._Success) {
                    Utils.showReport(res.url);
                }
                Utils.waitMessageEnd();
            });
        } else
            Utils.showMessage('Error', 'Must select a row first.');
    });

    $$('approve').onclick(function () {
        const rows = receiptGrid.getSelectedRows();
        if (rows.length) {
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                ids.push(row.expense_receipt_id);
            }
            let data = {
                expense_receipt_ids: ids,
                approve: true
            };
            Server.call(WS, "ApproveReceipts", data).then(function (res) {
                if (res._Success) {
                    updateReceiptGrid();
                }
            });
        } else
            Utils.showMessage('Error', 'No rows selected for approval.');
    });

    $$('unapprove').onclick(function () {
        const rows = receiptGrid.getSelectedRows();
        if (rows.length) {
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                ids.push(row.expense_receipt_id);
            }
            let data = {
                expense_receipt_ids: ids,
                approve: false
            };
            Server.call(WS, "ApproveReceipts", data).then(function (res) {
                if (res._Success) {
                    updateReceiptGrid();
                }
            });
        } else
            Utils.showMessage('Error', 'No rows selected for unapproval.');
    });

    $$('details').onclick(function () {
        const rows = receiptGrid.getSelectedRows();
        if (rows.length === 1) {
            let row = rows[0];
            $$('dp-worker').setValue(row.person_name);
            $$('dp-project').setValue(row.project_description);

            let account = $$('dp-account');
            account.clear();
            for (let i = 0; i < allExpenseAccounts.length; i++)
                account.add(allExpenseAccounts[i].expense_account_id, allExpenseAccounts[i].description);
            account.setValue(row.expense_account_id);

            $$('dp-date').setValue(row.receipt_date);
            $$('dp-amount').setValue(row.expense_amount);
            $$('dp-purpose').setValue(row.business_purpose);
            $$('dp-who-uploaded').setValue(row.who_uploaded);
            $$('dp-when-uploaded').setValue(row.when_uploaded);
            $$('dp-payment-method').setValue(row.payment_method);
            $$('dp-approved').setValue(row.approved === 'Y');

            Utils.popup_open('detail-popup');
        } else if (rows.length > 1)
            Utils.showMessage('Error', 'Can only see details of one row at a time.');
        else
            Utils.showMessage('Error', 'Must select a row first.');
    });

    $$('dp-cancel').onclick(function () {
        Utils.popup_close();
    });

    $$('dp-ok').onclick(function () {
        let error = $$('dp-date').isError('Date');
        if (!error)
            error = $$('dp-amount').isError('Amount');
        if (!error) {
            const row = receiptGrid.getSelectedRow();
            let data = {
                expense_receipt_id: row.expense_receipt_id,
                expense_account_id: $$('dp-account').getValue(),
                receipt_date: $$('dp-date').getIntValue(),
                expense_amount: $$('dp-amount').getValue(),
                business_purpose: $('dp-purpose').getValue(),
                person_id: row.person_id,
                project_id: row.project_id,
                payment_method: $$('dp-payment-method').getValue(),
                approved: $$('dp-approved').getValue() ? 'Y' : 'N'
            };
            Server.call(WS, "SaveReceipt", data).then(function (res) {
                Utils.popup_close();
                updateReceiptGrid();
            });
        }
    });

})();
