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
    const WS = 'StandardTimeTimeDetailReport';

    let locationGrid;
 
    const locationColumnDefs = [
        {headerName: "Organizational Group", field: "name", width: 260},
        {headerName: "ID", field: "orgGroupId", hide: true}
    ];
    locationGrid = new AGGrid('locationGrid', locationColumnDefs);
    locationGrid.show();
    locationGrid.addRecord({name: '(top)', groupId: ''});
    locationGrid.setOnSelectionChanged($$('open-location').enable);
    locationGrid.setOnRowDoubleClicked(openLocation);
    
    let orgGroupGrid;
 
    const orgGroupColumnDefs = [
        {headerName: "Group Name", field: "name", width: 260},
        {headerName: "ID", field: "groupId", width: 100},
    ];
    orgGroupGrid = new AGGrid('orgGroupGrid', orgGroupColumnDefs);
    orgGroupGrid.show();
    
    AWS.callSoap(WS, 'getAvailableReports').then(data => {
        if (data.wsStatus === "0") {
            data.item = Utils.assureArray(data.item);
            $$('reportDropdown').clear().add('', '(select)');
            $$('reportDropdown').addItems(data.item, "reportId", "reportName");    
        }
    });

    function getListAssociatedOrgGroups(id) {
        const groupId = {
            groupId: id
        }
        AWS.callSoap(WS, "listAssociatedOrgGroups", groupId).then(data => {
            if (data.wsStatus === '0') {
                orgGroupGrid.clear();
                $$('open-orgGroup').disable();

                data.orgGroups = Utils.assureArray(data.orgGroups); 
                orgGroupGrid.addRecords(data.orgGroups);
                orgGroupGrid.setOnSelectionChanged($$('open-orgGroup').enable);
                orgGroupGrid.setOnRowDoubleClicked(openOrgGroup);
            }
        });
    }

    getListAssociatedOrgGroups('');

    function openOrgGroup() {
        const row = orgGroupGrid.getSelectedRow();
        locationGrid.addRecord(row);
        getListAssociatedOrgGroups(row.orgGroupId);
    }

    function openLocation() {
        const row = locationGrid.getSelectedRow();
        getListAssociatedOrgGroups(row.orgGroupId);

        for (let i = (locationGrid.getAllRows().length - 1); i >= 0; i--) {
            if (locationGrid.getAllRows()[i].orgGroupId === row.orgGroupId) {
                break;
            }
            locationGrid.deleteRowIndex(i);
        }

        // for (let i = 0; i < locationGrid.getAllRows().length; i++) {
        //     if (i > locationGrid.getSelectedRowIndex()) {
        //         locationGrid.deleteRowIndex(i);
        //     }
        // }
    }

    $$('open-location').onclick(openLocation);
    $$('open-orgGroup').onclick(openOrgGroup);

    $$('report').onclick(async function () {
        if($$('reportDropdown').isError('Report'))
            return;
        if($$('to-date').isError('End Date'))
            return;
        if($$('from-date').isError('From Date'))
            return;

        if(orgGroupGrid.numberOfSelectedRows() === 0)
            return;

        const params = {
            toDate: $$('to-date').getIntValue(),
            fromDate: $$('from-date').getIntValue(),
            reportType: $$('reportDropdown').getValue(),
            orgGroupId: orgGroupGrid.getSelectedRow().orgGroupId
        }
        AWS.callSoap(WS, "getReport", params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });
    });
})();
