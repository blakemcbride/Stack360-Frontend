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
    const WS = 'StandardHrHrStatusHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        {headerName: 'Effective Date', field: 'effectiveDateFormatted', type: 'numericColumn', width: 20},
        {headerName: 'Status', field: 'statusName', width: 30},
        {headerName: 'Notes Preview', field: 'notePreview', width: 100}
    ];
    const grid = new AGGrid('status-grid', columnDefs, 'statusHistoryItemId');

    grid.show();

    let data = {
    };
    AWS.callSoap(WS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    function updateStatusList() {
        let data = {
            employeeId: personId
        };
        grid.clear();
        AWS.callSoap(WS, 'listStatusHistoryItems', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('edit').disable();
                $$('delete').disable();
                res.item = Utils.assureArray(res.item);
                if (res.item.length) {
                    let date = res.item[res.item.length-1].effectiveDateFormatted;
                    let dt = DateUtils.strToInt(date);
                    let nm = DateUtils.monthsDifference(dt, new Date());
                    let years = Math.trunc(nm / 12);
                    nm -= years * 12;
                    $$('seniority').setValue(years + "y," + nm + "m");
                }
                grid.addRecords(res.item);
                $$('status').setValue("Displaying " + res.item.length + " Status History");
            }
        });
    }

    updateStatusList();

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('add').onclick(function () {
        $('#status-popup-title').text('Add Status');
        $$('status-popup-start-date').clear();
        $$('status-popup-notes').clear();
        $$('status-popup-status').clear();

        Utils.popup_open('status-popup');

        let data = {
            historyId: null
        };
        AWS.callSoap(WS, 'listEmployeeStatuses', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                let ctl = $$('status-popup-status');
                ctl.add('', '(choose)');
                for (let i=0 ; i < res.item.length ; i++)
                    ctl.add(res.item[i].employeeStatusId, res.item[i].name, res.item[i]);
            }
        });

        $$('status-popup-ok').onclick(function () {
            if ($$('status-popup-status').isError('Status'))
                return;
            if ($$('status-popup-start-date').isError('Start Date'))
                return;

            function addStatus() {
                const data = {
                    employeeId: personId,
                    statusId: $$('status-popup-status').getValue(),
                    effectiveDate: $$('status-popup-start-date').getIntValue(),
                    note: $$('status-popup-notes').getValue(),
                    confirmed: false
                };
                AWS.callSoap(WS, 'newStatusHistoryItem', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        updateStatusList();
                    }
                    Utils.popup_close();
                });
            }

            const active = $$('status-popup-status').getData().active;
            if (active === 'N')
                Utils.yesNo('Confirmation', 'This will de-assign the worker from any projects they are assigned to and terminate their login into the system.  Is that okay?', addStatus);
            else
                addStatus();
        });

        $$('status-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    async function edit() {
        $('#status-popup-title').text('Edit Status');

        let data = {
            historyId: null
        };
        let res = await AWS.callSoap(WS, 'listEmployeeStatuses', data);
        if (res.wsStatus !== "0")
            return;
        res.item = Utils.assureArray(res.item);
        let ctl = $$('status-popup-status');
        ctl.clear().add('', '(choose)');
        for (let i=0 ; i < res.item.length ; i++)
            ctl.add(res.item[i].employeeStatusId, res.item[i].name);

        const row = grid.getSelectedRow();
        data = {
            id: row.statusHistoryItemId
        };
        res = await AWS.callSoap(WS, 'loadStatusHistory', data);
        if (res.wsStatus !== "0")
            return;
        $$('status-popup-status').setValue(res.statusId);
        $$('status-popup-start-date').setValue(Number(res.effectiveDate));
        $$('status-popup-notes').setValue(res.note);

        Utils.popup_open('status-popup');

        $$('status-popup-ok').onclick(function () {
            if ($$('status-popup-status').isError('Status'))
                return;
            if ($$('status-popup-start-date').isError('Start Date'))
                return;
            let data = {
                statusHistoryItemId: row.statusHistoryItemId,
                employeeId: personId,
                statusId: $$('status-popup-status').getValue(),
                effectiveDate: $$('status-popup-start-date').getIntValue(),
                note: $$('status-popup-notes').getValue(),
                confirmed: false
            };
            AWS.callSoap(WS, 'saveStatusHistoryItem', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateStatusList();
                }
                Utils.popup_close();
            });
        });

        $$('status-popup-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected status history?', function () {
            const row = grid.getSelectedRow();
            let data = {
                ids: row.statusHistoryItemId,
                confirmed: false
            };
            AWS.callSoap(WS, 'deleteStatusHistoryItem', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateStatusList();
                }
            });
        });
    });

    $$('report').onclick(function () {
        let data = {
            employeeId: personId
        };
        AWS.callSoap(WS, 'getStatusHistoryItemReport', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.fileName);
            }
        });
    });

})();
