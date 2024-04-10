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
    const WS = 'StandardTimeAdpTimeExport';

    const personName = Framework.userInfo.personName;
    const personId = Framework.userInfo.personId;

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
    let selectedOrgGroupGrid;
 
    const orgGroupColumnDefs = [
        {headerName: "Group Name", field: "name", width: 260},
        {headerName: "ID", field: "groupId", width: 100},
    ];
    orgGroupGrid = new AGGrid('orgGroupGrid', orgGroupColumnDefs);
    orgGroupGrid.show();

    selectedOrgGroupGrid = new AGGrid('selectedOrgGroupGrid', orgGroupColumnDefs);
    selectedOrgGroupGrid.show();
    selectedOrgGroupGrid.setOnRowDoubleClicked(unselect);
    selectedOrgGroupGrid.setOnSelectionChanged($$('remove').enable);

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
                orgGroupGrid.setOnSelectionChanged((x) => {
                    $$('open-orgGroup').enable(x);
                    $$('selectOrgGroup').enable(x);
                });
                orgGroupGrid.setOnRowDoubleClicked(openOrgGroup);
            }
        });
    }

    getListAssociatedOrgGroups('');

    function openOrgGroup() {
        const row = orgGroupGrid.getSelectedRow();
        locationGrid.addRecord(row);
        getListAssociatedOrgGroups(row.orgGroupId);
        $$('open-orgGroup').disable();
        $$('selectOrgGroup').disable();
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
        $$('open-location').disable();
        $$('selectOrgGroup').disable();

        // for (let i = 0; i < locationGrid.getAllRows().length; i++) {
        //     if (i > locationGrid.getSelectedRowIndex()) {
        //         locationGrid.deleteRowIndex(i);
        //     }
        // }
    }

    $$('open-location').onclick(openLocation);
    $$('open-orgGroup').onclick(openOrgGroup);

    $$('selectOrgGroup').onclick(() => {
        selectedOrgGroupGrid.addRecord(orgGroupGrid.getSelectedRow());
        $$('selectOrgGroup').disable();
    });

    function unselect() {
        selectedOrgGroupGrid.deleteSelectedRows();
    }
    $$('remove').onclick(unselect);

    $$('export').onclick(async function () {
        if (selectedOrgGroupGrid.getAllRows().length === 0)
            return Utils.showMessage('Error', 'You must select at least 1 organizational group to run the export.');
        if($$('to-date').isError('End Date'))
            return;
        if($$('from-date').isError('From Date'))
            return;

        let orgGroupIds = [];
        for (let i = 0; i < selectedOrgGroupGrid.getAllRows().length; i++) {
            orgGroupIds.push(selectedOrgGroupGrid.getAllRows()[i].orgGroupId)
        }

        const params = {
            exportType: $$('ate-type').getValue(),
            toDate: $$('to-date').getIntValue(),
            fromDate: $$('from-date').getIntValue(),
            orgGroupIds: orgGroupIds
        }
        AWS.callSoap(WS, "getExport", params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });
    });
})();
