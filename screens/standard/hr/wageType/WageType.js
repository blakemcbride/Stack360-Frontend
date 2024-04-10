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

    const WS = 'StandardHrWageType';

    const columnDefs = [
        {headerName: 'Name', field: 'name', width: 75  },
        {headerName: 'Type', field: 'typeName', width: 15 },
        {headerName: 'Period Type', field: 'periodTypeName', width: 15 },
        {headerName: 'Deduction', field: 'deductionName', width: 15 },
        {headerName: 'Payroll Code', field: 'payrollInterfaceCode', width: 20 },
        {headerName: 'First Active', field: 'firstActiveDate2', type: 'numericColumn', width: 15 },
        {headerName: 'Last Active', field: 'lastActiveDate2', type: 'numericColumn', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "listWageTypes", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    switch (row.type) {
                        case '1':
                            row.typeName = 'Regular';
                            break;
                        case '2':
                            row.typeName = 'Overtime';
                            break;
                        case '3':
                            row.typeName = 'Commission';
                            break;
                        case '4':
                            row.typeName = 'Vacation';
                            break;
                        case '5':
                            row.typeName = 'Sick';
                            break;
                        case '6':
                            row.typeName = 'Bonus';
                            break;
                        case '101':
                            row.typeName = 'FIT (Federal Income Tax)';
                            break;
                        case '102':
                            row.typeName = 'FICA (Social Security)';
                            break;
                        case '103':
                            row.typeName = 'Medicare';
                            break;
                        case '201':
                            row.typeName = 'State Income Tax';
                            break;
                        case '999':
                            row.typeName = 'Unknown';
                            break;
                    }
                    switch (row.periodType) {
                        case '1':
                            row.periodTypeName = 'Hourly';
                            break;
                        case '2':
                            row.periodTypeName = 'Salary';
                            break;
                        case '3':
                            row.periodTypeName = 'One Time';
                            break;
                    }
                    switch (row.deduction) {
                        case 'false':
                            row.deductionName = 'No';
                            break;
                        default:
                            row.deductionName = 'Yes';
                            break;
                    }
                    row.firstActiveDate2 = row.firstActiveDate !== '0' ? DateUtils.intToStr4(Number(row.firstActiveDate)) : '';
                    row.lastActiveDate2 = row.lastActiveDate !== '0' ? DateUtils.intToStr4(Number(row.lastActiveDate)) : '';
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Wage Types');
            }
        });
    }

    updateGrid();

    $$('show').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Wage Type');
        $$('dp-name').clear();
        $$('dp-type').setValue('');
        $$('dp-period-type').setValue('');
        $$('dp-payroll-code').clear();
        $$('dp-deduction').clear();
        $$('dp-expense-account').clear();
        $$('dp-liability-account').clear();
        $$('dp-first-active').clear();
        $$('dp-last-active').clear();
        Utils.popup_open('detail-popup', 'dp-name');

        let data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            id: null,
            selectFromId: null,
            selectFromProductServiceId: null
        };
        AWS.callSoap(WS, "searchGLAccounts", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-expense-account').add('', '(select)').addItems(res.item, 'id', 'accountName');
                $$('dp-liability-account').add('', '(select)').addItems(res.item, 'id', 'accountName');
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            if ($$('dp-period-type').isError('Period Type'))
                return;
            const data = {
                deduction: $$('dp-deduction').getValue(),
                expenseAccountId: $$('dp-expense-account').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                liabilityAccountId: $$('dp-liability-account').getValue(),
                name: $$('dp-name').getValue(),
                payrollInterfaceCode: $$('dp-payroll-code').getValue(),
                periodType: Number($$('dp-period-type').getValue()),
                typex: Number($$('dp-type').getValue())
            };
            AWS.callSoap(WS, "newWageType", data).then(function (res) {
                if (res.wsStatus === '0') {
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
        $$('dp-title').setValue('Edit Wage Type');
        $$('dp-name').setValue(row.name);
        $$('dp-type').setValue(row.type);
        $$('dp-period-type').setValue(row.periodType);
        $$('dp-payroll-code').setValue(row.payrollInterfaceCode);
        $$('dp-deduction').setValue(row.deduction === 'true');
        $$('dp-expense-account').clear();
        $$('dp-liability-account').clear();
        $$('dp-first-active').setValue(Number(row.firstActiveDate));
        $$('dp-last-active').setValue(Number(row.lastActiveDate));
        Utils.popup_open('detail-popup', 'dp-name');

        let data = {
            accountName: null,
            accountNameSearchType: 0,
            accountNumber: null,
            accountNumberSearchType: 0,
            id: null,
            selectFromId: null,
            selectFromProductServiceId: null
        };
        AWS.callSoap(WS, "searchGLAccounts", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-expense-account').add('', '(select)').addItems(res.item, 'id', 'accountName');
                $$('dp-liability-account').add('', '(select)').addItems(res.item, 'id', 'accountName');
                $$('dp-expense-account').setValue(row.expenseAccountId);
                $$('dp-liability-account').setValue(row.liabilityAccountId);
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            if ($$('dp-period-type').isError('Period Type'))
                return;
            const data = {
                id: row.id,
                deduction: $$('dp-deduction').getValue(),
                expenseAccountId: $$('dp-expense-account').getValue(),
                firstActiveDate: $$('dp-first-active').getIntValue(),
                lastActiveDate: $$('dp-last-active').getIntValue(),
                liabilityAccountId: $$('dp-liability-account').getValue(),
                name: $$('dp-name').getValue(),
                payrollInterfaceCode: $$('dp-payroll-code').getValue(),
                periodType: Number($$('dp-period-type').getValue()),
                typex: Number($$('dp-type').getValue())
            };
            AWS.callSoap(WS, "saveWageType", data).then(function (res) {
                if (res.wsStatus === '0') {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Wage Type?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteWageTypes", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            activeType: Number($$('show').getValue())
        };
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
