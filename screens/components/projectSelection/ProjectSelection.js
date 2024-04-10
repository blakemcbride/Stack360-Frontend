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


window.popup_startup = function (inData) {
    return new Promise(function (resolve, reject) {

        const WS = "com.arahant.services.standard.components.projectSearch";

        const columnDefs = [
            {headerName: 'ID', field: 'pid', width: 25  },
            {headerName: 'Company', field: 'company_name', width: 70 },
            {headerName: 'Project', field: 'description', width: 90 },
            {headerName: 'Shift', field: 'shift_start', width: 20 },
            {headerName: 'Category', field: 'cat_code', width: 40 },
            {headerName: 'Type', field: 'typ_code', width: 40 },
            {headerName: 'Status', field: 'stat_code', width: 20 }
        ];
        const grid = new AGGrid('cm-sp-project-grid', columnDefs, 'project_id');

        grid.show();

        function accept_project() {
            const row = grid.getSelectedRow();
            if (row) {
                const res = {
                    _status: 'ok',
                    projectId: row.project_id,
                    shiftId: row.shift_id,
                    shift: row.shift_start,
                    id: row.pid,
                    summary: row.description,
                    reference: row.reference,
                    client: row.company_name,
                    status: row.stat_code,
                    billable: row.billable
                };
                resolve(res);
            } else {
                Utils.showMessage('Error', 'You must first select a project.');
            }
        }

        grid.setOnRowDoubleClicked(accept_project);

        $$('cm-sp-ok').onclick(accept_project);

        $$('cm-sp-cancel').onclick(function () {
            resolve({ _status: 'cancel'});
        });

        $$('cm-sp-company').clear().forceSelect().setSelectFunction(async function () {
            let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
            if (res._status === "ok") {
                $$('cm-sp-company').setValue(res.id, res.name, res);
            }
        });

        let data = {
        };
        Server.call(WS, "ListProjectCategories", data).then(function (res) {
            if (res._Success) {
                $$('cm-sp-category')
                    .clear()
                    .add('', '(choose)')
                    .addItems(res.categories, 'projectCategoryId', 'code');
            }
        });

        Server.call(WS, "ListProjectTypes", data).then(function (res) {
            if (res._Success) {
                $$('cm-sp-type')
                    .clear()
                    .add('', '(choose)')
                    .addItems(res.types, 'projectTypeId', 'code');
            }
        });

        Server.call(WS, "ListProjectStatuses", data).then(function (res) {
            if (res._Success) {
                $$('cm-sp-status')
                    .clear()
                    .add('', '(choose)')
                    .addItems(res.statuses, 'projectStatusId', 'code');
            }
        });

        $$('cm-sp-reset').onclick(function () {
            $$('cm-sp-id').clear();
            $$('cm-sp-summary').clear();
            $$('cm-sp-company').clear().setValue('', '(choose)');
            $$('cm-sp-category').setValue('');
            $$('cm-sp-type').setValue('');
            $$('cm-sp-status').setValue('');
            $$('cm-sp-active').setValue('1');
        });

        function search() {
            const companyId = $$('cm-sp-company').getValue();
            const data = {
                projectId: $$('cm-sp-id').getValue(),
                summary: $$('cm-sp-summary').getValue(),
                summarySearchType: $$('cm-sp-summary-type').getValue(),
                companyId: companyId ? companyId : null,
                categoryId: $$('cm-sp-category').getValue(),
                typeId: $$('cm-sp-type').getValue(),
                statusId: $$('cm-sp-status').getValue(),
                active: $$('cm-sp-active').getValue()
            };
            grid.clear();
            Server.call(WS, "SearchProjects", data).then(function (res) {
                if (res._Success) {
                    res.projects = Utils.assureArray(res.projects);
                    grid.addRecords(res.projects);
                    if (res.projects.length >= res.highCap)
                        $$('#cm-sp-msg').setColor('red').setValue('Display ' + res.projects.length + ' Projects (limit)');
                    else
                        $$('#cm-sp-msg').setColor('black').setValue('Display ' + res.projects.length + ' Projects');
                }
            });
        }

        $$('cm-sp-search').onclick(search);
        Utils.globalEnterHandler(search);

    });
};
