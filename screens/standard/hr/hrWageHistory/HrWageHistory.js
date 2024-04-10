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
    const WS = 'StandardHrHrWageHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Effective Date', field: 'effectiveDateFormatted', type: 'numericColumn', width: 25},
        {headerName: 'Wage Amount', field: 'wageAmount2', type: 'numericColumn', width: 25},
        {headerName: 'Wage Type', field: 'wageTypeName', width: 25},
        {headerName: 'Position', field: 'positionName', width: 25},
        {headerName: 'Notes Preview', field: 'notePreview', width: 100}
    ];
    const grid = new AGGrid('status-grid', columnDefs, 'wageId');
    grid.show();

    let data = {
    };
    AWS.callSoap(WS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    function updateWageList() {
        let data = {
            employeeId: personId
        };
        grid.clear();
        AWS.callSoap(WS, 'listWageHistoryItems', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                $$('delete').disable();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    res.item[i].wageAmount2 = Utils.format(res.item[i].wageAmount, "DC", 0, 2);
                    grid.addRecords(res.item[i]);
                }
                $$('status').setValue("Displaying " + res.item.length + " Wage History");
            }
        });
    }

    updateWageList();

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(function () {
        $('#wage-popup-title').text('Add Position History');
        $$('wage-popup-effective-date').clear();
        $$('wage-popup-wage-type').clear();
        $$('wage-popup-amount').clear();
        $$('wage-popup-position').clear();
        $$('wage-popup-notes').clear();

        Utils.popup_open('wage-popup');

        let data = {
            historyId: null
        };
        AWS.callSoap(WS, 'listWageTypes', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                let ctl = $$('wage-popup-wage-type');
                ctl.add('', '(choose)');
                ctl.addItems()
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].id, res.item[i].name);
            }
        });

        data = {
            historyId: null
        };
        AWS.callSoap(WS, 'listPositions', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                let ctl = $$('wage-popup-position');
                ctl.add('', '(choose)');
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].positionId, res.item[i].name);
            }
        });

        data = {
            personId: personId
        };
        AWS.callSoap(WS, 'getLastWage', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('wage-popup-amount').setValue(Utils.toNumber(res.lastWageAmount));
            }
        });

        $$('wage-popup-ok').onclick(function () {
            if ($$('wage-popup-effective-date').isError('Effective Date'))
                return;
            if ($$('wage-popup-wage-type').isError('Wage Type'))
                return;
            if ($$('wage-popup-amount').isError('Amount'))
                return;
            if ($$('wage-popup-position').isError('Position'))
                return;
            let data = {
                employeeId: personId,
                effectiveDate: $$('wage-popup-effective-date').getIntValue(),
                positionId: $$('wage-popup-position').getValue(),
                wageAmount: $$('wage-popup-amount').getValue(),
                wageTypeId: $$('wage-popup-wage-type').getValue(),
                note: $$('wage-popup-notes').getValue()
            };
            AWS.callSoap(WS, 'newWageHistoryItem', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateWageList();
                }
                Utils.popup_close();
            });
        });

        $$('wage-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    async function edit() {
        $('#wage-popup-title').text('Edit Position History');
        const row = grid.getSelectedRow();

        let data = {
            historyId: null
        };
        let res = await AWS.callSoap(WS, 'listWageTypes', data);
        if (res.wsStatus !== "0")
            return;
        res.item = Utils.assureArray(res.item);
        let ctl = $$('wage-popup-wage-type');
        ctl.add('', '(choose)');
        ctl.addItems()
        for (let i=0 ; i < res.item.length ; i++)
            ctl.add(res.item[i].id, res.item[i].name);

        data = {
            historyId: null
        };
        res = await AWS.callSoap(WS, 'listPositions', data);
        if (res.wsStatus !== "0")
            return;
        res.item = Utils.assureArray(res.item);
        ctl = $$('wage-popup-position');
        ctl.add('', '(choose)');
        for (let i=0 ; i < res.item.length ; i++)
            ctl.add(res.item[i].positionId, res.item[i].name);

        data = {
            id: row.wageId
        };
        res = await AWS.callSoap(WS, 'loadWageHistory', data);
        if (res.wsStatus !== "0")
            return;
        $$('wage-popup-effective-date').setValue(Utils.toNumber(res.effectiveDate));
        $$('wage-popup-wage-type').setValue(res.wageTypeId);
        $$('wage-popup-amount').setValue(res.wageAmount);
        $$('wage-popup-position').setValue(res.positionId);
        $$('wage-popup-notes').setValue(res.note);

        $$('wage-popup-cancel').onclick(function () {
            Utils.popup_close();
        });

        Utils.popup_open('wage-popup');

        $$('wage-popup-ok').onclick(function () {
            if ($$('wage-popup-effective-date').isError('Effective Date'))
                return;
            if ($$('wage-popup-wage-type').isError('Wage Type'))
                return;
            if ($$('wage-popup-amount').isError('Amount'))
                return;
            if ($$('wage-popup-position').isError('Position'))
                return;
            let data = {
                id: row.wageId,
                employeeId: personId,
                effectiveDate: $$('wage-popup-effective-date').getIntValue(),
                positionId: $$('wage-popup-position').getValue(),
                wageAmount: $$('wage-popup-amount').getValue(),
                wageTypeId: $$('wage-popup-wage-type').getValue(),
                note: $$('wage-popup-notes').getValue()
            };
            AWS.callSoap(WS, 'saveWageHistoryItem', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateWageList();
                }
                Utils.popup_close();
            });
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected wage history?', function () {
            let row = grid.getSelectedRow();
            let data = {
                ids: row.wageId
            };
            AWS.callSoap(WS, 'deleteWageHistoryItem', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateWageList();
                }
            });
        });
    });

    $$('report').onclick(function () {
        let data = {
            employeeId: personId
        };
        AWS.callSoap(WS, 'getWageHistoryItemReport', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
