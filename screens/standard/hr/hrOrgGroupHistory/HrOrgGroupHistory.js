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
    const WS = "StandardHrHrOrgGroupHistory";
    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);
    $$('worker-name').setValue(personName);

    let resultsGrid;

    const showTable = () => {
        const columnDefs = [
            {headerName: "Date/Time", field: "datetime", width: 40},
            {headerName: "Type", field: "type", width: 30},
            {headerName: "Organizational Group", field: "orgGroup", width: 100},
            {headerName: "ID", field: "id", width: 30},
            {headerName: "Start", field: "start", width: 30},
            {headerName: "Final", field: "final", width: 30},
            {headerName: "Supervisor", field: "supervisor", width: 30},
            {headerName: "Changed By", field: "description", width: 50}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
        getListOrgGroupHistory();
    } 

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Organizational Group History Item?', () => {
            const params = {
                ids: resultsGrid.getSelectedRow().historyId
            };
            AWS.callSoap(WS, "deleteHistory", params).then(data => {
                if (data.wsStatus === '0') {
                    getListOrgGroupHistory();
                }
            });
        });
    });

    const getListOrgGroupHistory = () => {
        $$('delete').disable();
        
        const rowData = [];  
        resultsGrid.clear();

        const params = {
            personId: personId
        }

        AWS.callSoap(WS, 'listOrgGroupHistory', params).then(orgGroupHistory => {
            if (orgGroupHistory.wsStatus === "0") {
                orgGroupHistory.item = Utils.assureArray(orgGroupHistory.item);
                for (let item of orgGroupHistory.item) {
                    if (item !== null) {
                        rowData.push({
                            "id": item.externalId,
                            'datetime': item.dateTimeFormatted,
                            'type': item.changeType,
                            "orgGroup": item.orgGroupName,
                            "historyId": item.historyId,
                            'start': item.startDate !== "0" ? DateUtils.intToStr4(Number(item.startDate)) : '',
                            'final': item.finalDate !== "0" ? DateUtils.intToStr4(Number(item.finalDate)) : '',
                            'supervisor': item.supervisor,
                            'description': item.personName
                        });
                    }
                }      
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnSelectionChanged($$('delete').enable);
            }  
        });
    }

    showTable();
})();
