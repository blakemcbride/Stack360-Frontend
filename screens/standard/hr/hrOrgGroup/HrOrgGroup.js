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

window.HrOrgGroup = {};

(function () {

    const WS = 'StandardHrHrOrgGroup';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });

    const columnDefs = [
        { headerName: 'Organizational Group', field: 'orgGroupName', width: 100 },
        { headerName: 'ID', field: 'externamId', width: 20 },
        { headerName: 'Parent Organizational Hierarchy', field: 'orgGroupHierarchy' },
        { headerName: 'Supervisor', field: 'supervisorFormatted', width: 40 },
        { headerName: 'Start', field: 'startDateFormatted', type: 'numericColumn', width: 40 },
        { headerName: 'Final', field: 'finalDateFormatted', type: 'numericColumn', width: 40 },
    ];
    const grid = new AGGrid('grid', columnDefs, 'orgGroupId');

    grid.show();

    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {
        grid.clear();
        const data = {
            employeeId: personId
        };

        AWS.callSoap(WS, 'listOrgGroups', data).then(ret => {
            if (ret.wsStatus === '0') {
                const records = Utils.assureArray(ret.item);

                for (let i = 0; i < records.length; i ++) {
                    records[i].startDateFormatted = DateUtils.intToStr4(records[i].startDate);
                    records[i].finalDateFormatted = DateUtils.intToStr4(records[i].finalDate);
                }
                
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Organizational ${records.length > 1 ? 'Groups' : 'Group'}`);

                $$('edit').disable();
                $$('delete').disable();
            }
        });
    }

    updateGrid();

    let orgGroupGrid = null;

    orgGroupGrid = new AGGrid('op-grid', [
        {headerName: 'Organizational Group', field: 'orgGroupName', width: 75 },
        {headerName: 'ID', field: 'externalId', width: 25 }
    ], 'orgGroupId');
    orgGroupGrid.multiSelect();
    orgGroupGrid.show();

    const addOrgGroup = () => {
        $$('op-title').setValue('Associate Employee to Organizational Group');
        let screenStack = [];
        let nameStack = [];

        $$('op-go-up').disable();
        $$('op-open').disable();
        $$('start-date').clear();
        $$('start-date').disable();
        $$('final-date').clear();
        $$('final-date').disable();
        $$('supervisor').setValue(false);
        $$('supervisor').disable();
        $$('op-ok').disable();

        if (orgGroupGrid)
            orgGroupGrid.clear();

        Utils.popup_open('org-group-popup');

        HrOrgGroup.goBack = function (lvl) {
            while (lvl--) {
                screenStack.pop();
                nameStack.pop();
            }
            updatePopupGrid(screenStack[screenStack.length - 1]);
        }

        function updateBreadCrumb() {
            const levels = screenStack.length
            const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
            let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="HrOrgGroup.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
            let i = 1;
    
            for (; i < levels; i++)
                bc += separator + '<a class="" onclick="HrOrgGroup.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';
    
            bc += '</div>';
            $('#op-bread-crumb-2').html(bc);
        }

        function updatePopupGrid( orgGroupId, name, selectId ) {
            if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== orgGroupId) {
                screenStack.push(orgGroupId);
                nameStack.push(name ? name : "Top");
            }
            orgGroupId ? $$('op-go-up').enable() : $$('op-go-up').disable();
            orgGroupGrid.clear();
            $$('op-open').disable();
            $$('start-date').disable();
            $$('final-date').disable();
            $$('supervisor').disable();
            $$('op-ok').disable();
            const data = {
                orgGroupId: orgGroupId,
                employeeId: personId
            };
            AWS.callSoap(WS, "listOrgGroupsForGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('op-status').setValue(`Displaying ${res.item.length} Organizational Groups`)
                    orgGroupGrid.addRecords(res.item);
                    if (selectId)
                        orgGroupGrid.selectId(selectId);
                    updateBreadCrumb();
                }
            });
        }

        updatePopupGrid(null);

        function descend() {
            const row = orgGroupGrid.getSelectedRow();
            updatePopupGrid(row.orgGroupId, row.orgGroupName);
        }

        orgGroupGrid.setOnRowDoubleClicked(descend);
        orgGroupGrid.setOnSelectionChanged((rows) => {
            if (rows === 1) {
                $$('op-open').enable();
            } else {
                $$('op-open').disable();
            }
            $$('start-date').enable(rows);
            $$('final-date').enable(rows);
            $$('supervisor').enable(rows);
            $$('op-ok').enable(rows);
        });

        $$('op-go-up').onclick(() => {
            screenStack.pop();
            nameStack.pop();
            updatePopupGrid(screenStack.pop(), nameStack.pop());
        });

        $$('op-open').onclick(descend);

        let ok = () => {
            const rows = orgGroupGrid.getSelectedRows();
            if (rows.length) {
                const ids = [];
                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    ids.push(row.orgGroupId);
                }
                const data = {
                    employeeId: personId,
                    startDate: $$('start-date').getIntValue(),
                    finalDate: $$('final-date').getIntValue(),
                    orgGroupIds: ids,
                    supervisor: $$('supervisor').getValue()
                }
                AWS.callSoap(WS, 'associateToOrgGroups', data).then(ret => {
                    if (ret.wsStatus === '0') {
                        updateGrid();
                        Utils.popup_close();
                    }
                });
            }
        };

        let cancel = () => {
            Utils.popup_close();
        };

        $$('op-ok').onclick(ok);
        $$('op-cancel').onclick(cancel);
    };

    const editOrgGroup = () => {
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }

        $$('org-group-name').setValue(row.orgGroupName);
        $$('edit-start-date').setValue(row.startDate);
        $$('edit-final-date').setValue(row.finalDate);
        $$('edit-supervisor').setValue(row.supervisorFormatted === 'Yes');

        Utils.popup_open('org-group-edit-popup');

        $$('edit-op-ok').onclick(() => {

            const data = {
                startDate: $$('edit-start-date').getIntValue(),
                finalDate: $$('edit-final-date').getIntValue(),
                personId: personId,
                supervisor: $$('edit-supervisor').getValue(),
                orgGroupId: row.orgGroupId
            }
            
            AWS.callSoap(WS, 'saveOrgGroupAssociation', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('edit-op-cancel').onclick(() => {
            Utils.popup_close();
        });

    };

    $$('add').onclick(addOrgGroup);

    $$('edit').onclick(editOrgGroup);
    grid.setOnRowDoubleClicked(editOrgGroup);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to disassociate the selected Organizational Group?', () => {
            const data = {
                employeeId: personId,
                orgGroupIds: [grid.getSelectedRow().orgGroupId]
            };
            
            AWS.callSoap(WS, "dissassociateFromOrgGroups", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            employeeId: personId
        };

        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
