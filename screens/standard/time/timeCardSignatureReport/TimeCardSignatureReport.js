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
    const WS = 'StandardTimeTimeCardSignatureReport';

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
 
    const orgGroupColumnDefs = [
        {headerName: "Group Name", field: "name", width: 260},
        {headerName: "ID", field: "groupId", width: 100},
    ];
    orgGroupGrid = new AGGrid('orgGroupGrid', orgGroupColumnDefs);
    orgGroupGrid.show();
    
    AWS.callSoap(WS, 'getAvailableReports').then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('reportDropdown');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].reportId, res.item[0].reportName);
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].reportId, res.item[i].reportName);
            } else {
                ctl.forceSelect();
            }
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

    function getCurrentPeriod() {
        const params = {
            personId: personId
        }
        AWS.callSoap(WS, "getCurrentPeriod", params).then(data => {
            if (data.wsStatus === '0') {
               $$('from-date').setValue(data.startDate);
               $$('to-date').setValue(data.endDate);
            }
        });
    }

    $$('prevDate').onclick(() => {
        const data = {
            startDate: $$('from-date').getIntValue(),
            forward: false,
            personId: personId
        };
        AWS.callSoap(WS, 'getNextPeriod', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('from-date').setValue(Number(res.startDate));
                $$('to-date').setValue(Number(res.endDate));
            }
        });
    });

    $$('nextDate').onclick(() => {
        const data = {
            startDate: $$('from-date').getIntValue(),
            forward: true,
            personId: personId
        };
        AWS.callSoap(WS, 'getNextPeriod', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('from-date').setValue(Number(res.startDate));
                $$('to-date').setValue(Number(res.endDate));
            }
        });
    });

    getCurrentPeriod();

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
            return Utils.showMessage("Error", "You must select 1 organizational group to run the report.");

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
