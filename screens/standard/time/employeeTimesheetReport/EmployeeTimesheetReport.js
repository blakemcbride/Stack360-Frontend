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

(function () {
    const WS = 'StandardTimeEmployeeTimesheetReport';

    const reset = () => {
        $$('etr-from_date').clear();
        $$('etr-to_date').clear();
        $$('etr-sort').setValue(1);
        $$('etr-type').setValue(0);
    
        const params = {
            nameSearchType: 0,
            name: null
        };
        AWS.callSoap(WS, 'searchSubordinateOrgGroups', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('etr-org_group');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].orgGroupId, res.item[0].name);
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].orgGroupId, res.item[i].name);
                } else {
                    ctl.forceSelect();
                }
            }
        });
    }

    $$('etr-org_group').setSelectFunction(async function () {
        let res = await Utils.component('orgGroupSelection/OrgGroupSelection', 'component-orggroup-selection');
        if (res._status === "ok")
            $$('etr-org_group').setValue(res.orgGroupId, res.orgGroupName);
    });

    let resultsGrid;

    const showTable = () => {
        const columnDefs = [
            {headerName: "Last Name", field: "lastName", width: 60},
            {headerName: "First Name", field: "firstName", width: 60},
            {headerName: "Billable", field: "billableHours", type: 'numericColumn', width: 40},
            {headerName: "Non-Billable", field: "nonBillableHours", type: 'numericColumn', width: 40},
            {headerName: "Total", field: "totalHours", type: 'numericColumn', width: 40},
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
    }            

    $$('report').onclick(() => {
        const params = {
            fromDate: $$('etr-from_date').getIntValue(),
            toDate: $$('etr-to_date').getIntValue(),
            orgGroupId: $$('etr-org_group').getValue(),
            sort: $$('etr-sort').getValue(),
            type: $$('etr-type').getValue()
        }
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });     
    });    

    

    const getReportData = () => {
        const params = {
            fromDate: $$('etr-from_date').getIntValue(),
            toDate: $$('etr-to_date').getIntValue(),
            orgGroupId: $$('etr-org_group').getValue(),
            sort: $$('etr-sort').getValue(),
            type: $$('etr-type').getValue()
        }
        resultsGrid.clear();
        AWS.callSoap(WS, 'getReportData', params).then(reportData => {
            if (reportData.wsStatus === "0") {
                const rowData = Utils.assureArray(reportData.item);
                for (let i = 0; i < rowData.length; i++) {
                    rowData[i].billableHours = Utils.format(Utils.toNumber(rowData[i].billableHours), "C", 0, 2);                    
                    rowData[i].nonBillableHours = Utils.format(Utils.toNumber(rowData[i].nonBillableHours), "C", 0, 2);                    
                    rowData[i].totalHours = Utils.format(Utils.toNumber(rowData[i].totalHours), "C", 0, 2);                    
                }
                resultsGrid.addRecords(rowData); 
            }            
        });   
    }
    
    

    $$('search').onclick(getReportData);
    $$('reset').onclick(reset);

    reset();
    showTable();
})();
