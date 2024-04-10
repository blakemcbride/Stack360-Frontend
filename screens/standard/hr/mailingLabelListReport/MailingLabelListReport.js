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

    const WS = 'StandardHrMailingLabelListReport';

    let employeeStatusesGrid;
    const employeeStatusesColumnDefs = [
        {headerName: "Employee Status", field: "statusName", width: 200},
    ];
    employeeStatusesGrid = new AGGrid('employeeStatusesGrid', employeeStatusesColumnDefs);
    employeeStatusesGrid.multiSelect();
    employeeStatusesGrid.show();
    
    let employeeBenefitsGrid;
    const employeeBenefitsColumnDefs = [
        {headerName: "Benefit Category", field: "categoryName", width: 200},
        {headerName: "Benefit", field: "name", width: 600},
    ];
    employeeBenefitsGrid = new AGGrid('employeeBenefitsGrid', employeeBenefitsColumnDefs);
    employeeBenefitsGrid.multiSelect();
    employeeBenefitsGrid.show();


    let employeeGroupsGrid;
    const employeeGroupsColumnDefs = [
        {headerName: "Organizational Group", field: "name", width: 200},
    ];
    employeeGroupsGrid = new AGGrid('employeeGroupsGrid', employeeGroupsColumnDefs);
    employeeGroupsGrid.multiSelect();
    employeeGroupsGrid.show();

    AWS.callSoap(WS, "listStatuses").then(data => {
        employeeStatusesGrid.clear();
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
            employeeStatusesGrid.addRecords(data.item);
        }
    });

    AWS.callSoap(WS, "listBenefits").then(data => {
        employeeBenefitsGrid.clear();
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
            employeeBenefitsGrid.addRecords(data.item);
        }
    });

    AWS.callSoap(WS, "listOrgGroups").then(data => {
        employeeGroupsGrid.clear();
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
            employeeGroupsGrid.addRecords(data.item);
        }
    });

    $$('export').onclick(() => {
        if (employeeStatusesGrid.numberOfSelectedRows() === 0) {
            Utils.showMessage('Error', 'At least one Employee Status must be selected');
            return;
        }
        
        if (employeeGroupsGrid.numberOfSelectedRows() === 0) {
            Utils.showMessage('Error', 'At least one Organizational Group must be selected');
            return;
        }

        const params = {
            includeEmployeeId: $$('includeEmployeeId').getValue()
        }
        if (employeeStatusesGrid.numberOfSelectedRows() > 0) {
            let statusIds = [];

            const rows = employeeStatusesGrid.getSelectedRows();
            for (let i = 0; i < rows.length; i++) {
                statusIds.push(rows[i].statusId);
            }
            params.statusIds = statusIds;
        }
        if (employeeBenefitsGrid.numberOfSelectedRows() > 0) {
            let benefitIds = [];

            const rows = employeeBenefitsGrid.getSelectedRows();
            for (let i = 0; i < rows.length; i++) {
                benefitIds.push(rows[i].id);
            }
            params.benefitIds = benefitIds;
        }
        if (employeeGroupsGrid.numberOfSelectedRows() > 0) {
            let orgGroupIds = [];

            const rows = employeeGroupsGrid.getSelectedRows();
            for (let i = 0; i < rows.length; i++) {
                orgGroupIds.push(rows[i].id);
            }
            params.orgGroupIds = orgGroupIds;
        }
        AWS.callSoap(WS, "getReport", params).then(res => {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('import').onclick(async () => {
        
        if ($$('file').isError('File'))
            return;
        if ($$('columnEmployeeID').isError('Column for Employee ID'))
            return;
        if ($$('columnOrder').isError('Column for Order'))
            return;
                
        const params = {
            uploadType: "employeeOrderUpload",
            orderColumn: $$('columnOrder').getValue(),
            employeeIdColumn: $$('columnEmployeeID').getValue()
        }
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('file', 'FileUploadServlet', params);
        Utils.waitMessageEnd();
        Utils.showMessage('Information', 'Employee Ordering import succesfully. A system Message will be sent to you when processing has ended (success or fail).');
    });
})();
