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
    const WS = 'StandardTimeUnpaidTime';
    let resultsGrid;
    const showTable = () => {
        const columnDefs = [
            {headerName: "Date", field: "date", width: 20},
            {headerName: "Hours", field: "hours", width: 20},
            {headerName: "First Name", field: "first_name", width: 30},
            {headerName: "Last Name", field: "last_name", width: 30},
            {headerName: "Project ID", field: "id", width: 30},
            {headerName: "Project Description", field: "description", width: 50}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
        getListUnpaidTime();
    }            

    $$('complete').onclick(complete);

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getUnpaidTimeReport').then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.fileName); 
            }
        });     
    });

    function complete() {
        // 
    }

    const getListUnpaidTime = () => {
        $$('complete').disable();
        resultsGrid.clear();
        AWS.callSoap(WS, 'listUnpaidTime').then(listUnpaidTime => {
            if (listUnpaidTime.wsStatus === "0") {
                const rowData = Utils.assureArray(listUnpaidTime.detail);
                resultsGrid.addRecords(rowData); 
            }            
        });      
        resultsGrid.setOnSelectionChanged($$('complete').enable);
    }
    showTable();
})();
