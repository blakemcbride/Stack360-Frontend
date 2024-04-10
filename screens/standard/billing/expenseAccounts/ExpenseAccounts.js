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

    const WS = 'com.arahant.services.standard.billing.expenseAccounts';
    let expenseGrid;
    let mode;

    function addAccount() {
        $('#popup-header').text('Add Expense Account');
        mode = 'add';

        $$('ep-expense-id').setValue('');
        $$('ep-description').setValue('');

        $$('ep-gl-account').clear();
        $$('ep-gl-account').add('', '(select)');

        Server.call(WS, "GetGLAccounts").then(function (res) {
            if (res._Success) {
                let i = 0;
                const ctl = $$('ep-gl-account');
                for ( ; i < res.gl_accounts.length ; i++)
                    ctl.add(res.gl_accounts[i].gl_account_id, res.gl_accounts[i].account_name);
                if (i === 1)     //  if there is only one item - select it
                    ctl.setValue(res.gl_accounts[0].gl_account_id);
            }
        });

        Utils.popup_open('account-edit-popup', 'ep-expense-id');
    }

    function editAccount() {
        $('#popup-header').text('Edit Expense Account');
        mode = 'edit';

        const row = expenseGrid.getSelectedRow();

        $$('ep-expense-id').setValue(row.expense_id);
        $$('ep-description').setValue(row.description);

        $$('ep-gl-account').clear().add('', '(select)');
        Server.call(WS, "GetGLAccounts").then(function (res) {
            let sidx = -1;
            if (res._Success) {
                const ctl = $$('ep-gl-account');
                for (let i=0 ; i < res.gl_accounts.length ; i++) {
                    ctl.add(res.gl_accounts[i].gl_account_id, res.gl_accounts[i].account_name);
                    if (row.gl_account_id === res.gl_accounts[i].gl_account_id)
                        sidx = i;
                }
                if (sidx !== -1)
                    ctl.setValue(res.gl_accounts[sidx].gl_account_id);
            }
        });

        Utils.popup_open('account-edit-popup');
    }

    function deleteAccount() {
        const row = expenseGrid.getSelectedRow();
        Utils.yesNo('Query', 'Is it okay to delete this record?', function () {
            const data = {
                expense_account_id: row.expense_account_id
            };
            Server.call(WS, "DeleteExpenseAccount", data).then(function (res) {
                if (res._Success) {
                    Utils.showMessage('Success', 'Expense account deleted.');
                    fillAccountGrid();
                }
            });
        });
    }

    function fillAccountGrid() {
        expenseGrid.clear();
        $$('edit').disable();
        $$('delete').disable();
        Server.call(WS, "GetExpenseAccounts").then(function (res) {
            if (res._Success) {
                expenseGrid.addRecords(res.expense_accounts);
            }
        });
    }

    function setupAccountGrid() {
        const columnDefs = [
            {headerName: 'Expense ID', field: 'expense_id', width: 10  },
            {headerName: 'Description', field: 'description', width: 60 },
            {headerName: 'GL Account', field: 'account_name', width: 30 }
        ];
        expenseGrid = new AGGrid("account-grid", columnDefs, 'expense_account_id');
        expenseGrid.show();

        expenseGrid.setOnSelectionChanged(function (rows) {
            $$('edit').enable(rows);
            $$('delete').enable(rows);
        });

        expenseGrid.setOnRowDoubleClicked(editAccount);
    }

    setupAccountGrid();
    fillAccountGrid();

    function cancel_ep_popup() {
        Utils.popup_close();
    }

    function ok_ep_popup() {
        if ($$('ep-expense-id').isError('Expense ID'))
            return;
        if ($$('ep-description').isError('Description'))
            return;
        if ($$('ep-gl-account').isError('GL Account selection'))
            return;
        if (mode === 'add') {
            const data = {
                expense_id: $$('ep-expense-id').getValue(),
                description: $$('ep-description').getValue(),
                gl_account_id: $$('ep-gl-account').getValue()
            };
            Server.call(WS, "NewExpenseAccount", data).then(function (res) {
                if (res._Success) {
                    Utils.showMessage('Success', 'Expense account added.');
                    Utils.popup_close();
                    fillAccountGrid();
                }
            });
        } else {  // edit
            const row = expenseGrid.getSelectedRow();
            const data = {
                expense_account_id: row.expense_account_id,
                expense_id: $$('ep-expense-id').getValue(),
                description: $$('ep-description').getValue(),
                gl_account_id: $$('ep-gl-account').getValue()
            };
            Server.call(WS, "UpdateExpenseAccount", data).then(function (res) {
                if (res._Success) {
                    Utils.showMessage('Success', 'Expense account updated.');
                    Utils.popup_close();
                    fillAccountGrid();
                }
            });
        }
    }

    $$('add').onclick(addAccount);
    $$('edit').onclick(editAccount);
    $$('delete').onclick(deleteAccount);
    $$('ep-ok').onclick(ok_ep_popup);
    $$('ep-cancel').onclick(cancel_ep_popup);

})();

