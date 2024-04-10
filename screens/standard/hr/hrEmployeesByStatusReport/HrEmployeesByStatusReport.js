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

window.HrEmployeesByStatusReport = {};

(async function () {

    const WS = 'StandardHrHrEmployeesByStatusReport';

    $$('ebsr-empl_status').add('', "(select)");
    AWS.callSoap(WS, 'listEmployeeStatuses').then(employeeStatuses => {
        if (employeeStatuses.wsStatus === "0") {
            employeeStatuses.item = Utils.assureArray(employeeStatuses.item);
            $$('ebsr-empl_status').addItems(employeeStatuses.item, "id", "description");
        }  
    });
    $$('ebsr-date').setValue(new Date());

    $$('ebsr-include_suborg_group').onChange(() => {
        if ($$('ebsr-include_suborg_group').getValue()) {
            $$('ebsr-depth').enable();
        } else {
            $$('ebsr-depth').disable();
        }
    });

    const orgGroupGrid = new AGGrid('cop-grid', [
        {headerName: 'Organizational Group', field: 'orgGroupName', width: 55 },
        {headerName: 'ID', field: 'externalId', width: 25 }
    ], 'orgGroupId');
    orgGroupGrid.show();
    
    const chooseOrgGroupPopup = () => {

        const screenStack = [];
        const nameStack = [];

        orgGroupGrid.clear();

        Utils.popup_open('choose-org-group-popup');

        HrEmployeesByStatusReport.goBack = function (lvl) {
            while (lvl--) {
                screenStack.pop();
                nameStack.pop();
            }
            updateGrid(screenStack[screenStack.length - 1]);
        }

        function updateBreadCrumb() {
            const levels = screenStack.length
            const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
            let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="HrEmployeesByStatusReport.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
            let i = 1;
    
            for (; i < levels; i++)
                bc += separator + '<a class="" onclick="HrEmployeesByStatusReport.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';
    
            bc += '</div>';
            $('#cop-bread-crumb-2').html(bc);
        }

        function updateGrid( orgGroupId, name, selectId ) {
            if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== orgGroupId) {
                screenStack.push(orgGroupId);
                nameStack.push(name ? name : "Top");
            }
            orgGroupId ? $$('cop-go-up').enable() : $$('cop-go-up').disable();
            orgGroupGrid.clear();
            $$('cop-open').disable();
            $$('cop-ok').disable();
            const data = {
                orgGroupId: orgGroupId
            };
            AWS.callSoap(WS, "listOrgGroupsForGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('cop-status').setValue(`Displaying ${res.item.length} Organizational Groups`)
                    orgGroupGrid.addRecords(res.item);
                    if (selectId)
                        orgGroupGrid.selectId(selectId);
                    updateBreadCrumb();
                }
            });
        }

        updateGrid(null);

        function descend() {
            const row = orgGroupGrid.getSelectedRow();
            updateGrid(row.orgGroupId, row.orgGroupName);
        }

        orgGroupGrid.setOnRowDoubleClicked(descend);
        orgGroupGrid.setOnSelectionChanged((rows) => {
            $$('cop-open').enable(rows);
            $$('cop-ok').enable(rows);
        });

        $$('cop-go-up').onclick(() => {
            screenStack.pop();
            nameStack.pop();
            updateGrid(screenStack.pop(), nameStack.pop());
        });

        $$('cop-open').onclick(descend);

        const ok = () => {
            const row = orgGroupGrid.getSelectedRow();
            $$('ebsr-org_group').setValue(row.orgGroupName);
            orgGroupId = row.orgGroupId;
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('cop-ok').onclick(ok);
        $$('cop-cancel').onclick(cancel);

    };
    let orgGroupId = null;
    $$('choose').onclick(() => {
        chooseOrgGroupPopup();
    });

    $$('report').onclick(() => {
        if ($$('ebsr-empl_status').isError('Show Employees with Status'))
            return;
        if ($$('ebsr-date').isError('As of'))
            return;
        if ($$('ebsr-org_group').isError('Filter by Organizational Group'))
            return;
        if ($$('ebsr-depth').isError('Maximum Depth'))
            return;
            
        const params = {
            date: $$('ebsr-date').getIntValue(),
            depth: $$('ebsr-depth').getValue(),
            includeSubOrgGroups: $$('ebsr-include_suborg_group').getValue(),
            orgGroupId: orgGroupId,
            statusId: $$('ebsr-empl_status').getValue()
        }
        AWS.callSoap(WS, "getReport", params).then(res => {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
