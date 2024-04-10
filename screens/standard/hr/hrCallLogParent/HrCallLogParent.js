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
    const WS = 'StandardHrHrCallLogParent';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    let callLogsGrid;

    const callLogsColumnDefs = [
        {headerName: "Type", field: "typeCode", width: 150},
        {headerName: "Summary", field: "summary", width: 480},
        {headerName: "Status", field: "statusCode", width: 150},
        {headerName: "Requested", field: "dateTimeRequested", type: 'numericColumn', width: 180},
        {headerName: "Completed", field: "dateTimeCompleted", type: 'numericColumn', width: 180},
        {headerName: "Assigned To", field: "assignedTo", width: 280}
    ];

    callLogsGrid = new AGGrid('callLogsGrid', callLogsColumnDefs);

    callLogsGrid.show();

    function getListProjectsForPerson() {
        const params = {
            personId: personId
        }
        AWS.callSoap(WS, 'listProjectsForPerson', params).then(data => {
            callLogsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                callLogsGrid.addRecords(data.item);

                callLogsGrid.setOnSelectionChanged($$('edit').enable)
                $$('callLogs-label').setValue('Displaying ' + data.item.length + ' Call Logs');
            }     
        });
    }

    getListProjectsForPerson();

    $$('edit').onclick(() => {
        Utils.saveData(HR_PERSON_ID, personId);
        Utils.saveData(HR_PERSON_NAME, personName);
f
        Framework.getChild();
    });
})();
