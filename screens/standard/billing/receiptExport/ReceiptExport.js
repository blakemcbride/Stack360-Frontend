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

    let selected_project;
    let selected_worker;
    let selected_client;


    $$('search-project').onclick(async function () {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok") {
            selected_project = res;
            $$('project').setValue(res ? res.summary : '');
        }
    });

    $$('search-worker').onclick(async function () {
        let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
        if (res._status === "ok") {
            selected_worker = res;
            const name = res.lname + ", " + res.fname + " " + res.mname;
            $$('worker').setValue(name);
        }
    });

    $$('search-client').onclick(async function () {
        let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
        if (res._status === "ok") {
            selected_client = res;
            $$('client').setValue(res ? res.name : '');
        }
    });

    $$('export').onclick(function () {
        Utils.waitMessage('Please wait; Generating export.');
        const data = {
            project_id: selected_project ? selected_project.projectId : '',
            worker_id: selected_worker ? selected_worker.employeeid : '',
            client_id: selected_client ? selected_client.id : '',
            expense_account_id: $$('expense-account').getValue(),
            payment_method: $$('payment-method').getValue(),
            receipt_start_date: $$('end-date').getIntValue(),
            receipt_end_date: $$('start-date').getIntValue(),
            upload_start_date: $$('upload-start-date').getIntValue(),
            upload_end_date: $$('upload-end-date').getIntValue()
        };
        Server.call("com.arahant.services.standard.billing.receiptExport", "CreateExport", data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success)
                Utils.showReport(res.filename);
        });
    });

    $$('reset').onclick(function () {
        selected_project = null;
        $$('project').clear();
        selected_worker = null;
        $$('worker').clear();
        $('#expense').val('');
        selected_client = null;
        $$('client').setValue('');
        $$('start-date').setValue(null);
        $$('end-date').setValue(null);
        $$('upload-start-date').setValue(null);
        $$('upload-end-date').setValue(null);
        $$('expense-account').setValue('');
        $$('payment-method').setValue('Z');
    });

    Server.call("com.arahant.services.standard.billing.receipts", "GetExpenseAccounts", {}).then(function (res) {
        if (res._Success) {
            const ctl = $$('expense-account');
            ctl.clear();
            ctl.add('', '(select)');
            for (let i = 0; i < res.expense_accounts.length; i++)
                ctl.add(res.expense_accounts[i].expense_account_id, res.expense_accounts[i].description);
        }
    });

})();
