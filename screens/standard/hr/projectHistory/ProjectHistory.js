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
    const WS = 'StandardHrProjectHistory';
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('ph-project').setValue(projectName + " - " + projectSummary);

    let resultsGrid;

    const resultsColumnDefs = [
        {headerName: "Date/Time", field: "dateTimeFormatted", type: "numericColumn", width: 120},
        {headerName: "Assigned To Last Name", field: "toLastName", width: 120},
        {headerName: "Assigned To First Name", field: "toFirstName", width: 120},
        {headerName: "Assigned By Last Name", field: "byLastName", width: 120},
        {headerName: "Assigned By First Name", field: "byFirstName", width: 120}
    ];
    resultsGrid = new AGGrid('resultsGrid', resultsColumnDefs);
    resultsGrid.show();

    function getListProjectHistory() {
        const params = {
            projectId: projectId
        }
        AWS.callSoap(WS, 'listProjectHistory', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
    
                $$('ph-status').setValue('Displaying ' + data.item.length + ' Project Assignment History Items');
                resultsGrid.addRecords(data.item);
            }
        });
    }

    getListProjectHistory();

    $$('report').onclick(function () {
        const params = {
            projectId: projectId
        };
        AWS.callSoap(WS, 'getReport', params).then(res => {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });
})();
