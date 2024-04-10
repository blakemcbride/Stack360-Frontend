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

    const WS = 'StandardProjectRoutingAndAssignmentHistory';
    
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    const columnDefs = [
        {headerName: 'Date/Time', field: 'dateTimeChangedFormatted', width: 20  },
        {headerName: 'Change Type', field: 'changeType', width: 60  },
        {headerName: 'Changed By Last Name', field: 'changedByLastName', width: 20  },
        {headerName: 'Changed By First Name', field: 'changedByFirstName', width: 20  },
    ];
    const grid = new AGGrid('grid', columnDefs, 'historyId');
    grid.show();
    grid.clear();

    grid.setOnSelectionChanged($$('view').enable);

    const fromColumns = [
        {headerName: 'Last Name', field: 'lastName'},
        {headerName: 'First Name', field: 'firstName'}
    ];
    const fromGrid = new AGGrid('from-grid', fromColumns);
    fromGrid.show();
    fromGrid.clear();

    const toColumns = [
        {headerName: 'Last Name', field: 'lastName'},
        {headerName: 'First Name', field: 'firstName'}
    ];
    const toGrid = new AGGrid('to-grid', toColumns);
    toGrid.show();
    toGrid.clear();

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        
    async function loadData() {
        const data = {
            projectId: projectId
        };

        const res = await AWS.callSoap(WS, 'listHistory', data);
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            grid.clear();
            grid.addRecords(res.item);
            Utils.setText('status', `Displaying ${res.item.length} History Items`);
        }
    }

    loadData();

    const detailPopup = (row) => {

        let resetDialog = () => {
            $$('dp-date-time').clear();
            $$('dp-changed-by').clear();
            $$('dp-from').clear();
            $$('dp-to').clear();
            $$('dp-org-group-from').clear();
            $$('dp-org-group-to').clear();
            $$('dp-decision-point-from').clear();
            $$('dp-decision-point-to').clear();
            fromGrid.clear();
            toGrid.clear();
        };

        let initDialog = async () => {
            
            resetDialog();

            const request = {
                historyId: row.historyId
            };

            AWS.callSoap(WS, 'loadHistory', request).then(res => {
                if (res.wsStatus === '0') {
                    $$('dp-date-time').setValue(res.dateTimeFormatted);
                    $$('dp-changed-by').setValue(res.changedByFormatted);
                    $$('dp-from').setValue(res.fromStatusCode);
                    $$('dp-to').setValue(res.toStatusCode);
                    $$('dp-org-group-from').setValue(res.fromOrgGroupName);
                    $$('dp-org-group-to').setValue(res.toOrgGroupName);
                    $$('dp-decision-point-from').setValue(res.fromDecisionPointName);
                    $$('dp-decision-point-to').setValue(res.toDecisionPointName);

                    res.assignedFrom = Utils.assureArray(res.assignedFrom);
                    fromGrid.addRecords(res.assignedFrom);

                    res.assignedTo = Utils.assureArray(res.assignedTo);
                    toGrid.addRecords(res.assignedTo);
                }
            });

        };

        initDialog();

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {
            
            const close = () => {
                resolve(null);
                Utils.popup_close();
            };
        
            $$('dp-close').onclick(close);
        });
    };

    async function view(){
        const row = grid.getSelectedRow();
        if (!row) {
            return;
        }

        const data = await detailPopup(row);
        return;
    }
    $$('view').onclick(view);
    grid.setOnRowDoubleClicked(view);

    $$('report').onclick(() => {
        const data = {
            projectId: projectId
        };

        AWS.callSoap(WS, 'getReport', data).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });
})();
