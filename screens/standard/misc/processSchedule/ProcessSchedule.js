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
    const WS = 'StandardMiscProcessSchedule';

    let processSchedulesGrid;
 
    const processSchedulesColumnDefs = [
        {headerName: "Process", field: "process", width: 400},
        {headerName: "Schedule", field: "schedule", width: 1000},
        {headerName: "Last Run", field: "lastRun", type: "numericColumn", width: 200},
        {headerName: "Last Result", field: "lastResult", width: 200}
    ];
    processSchedulesGrid = new AGGrid('processSchedulesGrid', processSchedulesColumnDefs);
    processSchedulesGrid.show();  

    function getListProcessSchedules() {
        AWS.callSoap(WS, 'listProcessSchedules').then(data => {
            if (data.wsStatus === '0') {     
                processSchedulesGrid.clear();
                data.item = Utils.assureArray(data.item);                
                processSchedulesGrid.addRecords(data.item);
                processSchedulesGrid.setOnSelectionChanged(() => {
                    $$('edit').enable();                    
                    $$('delete').enable();                    
                });
                processSchedulesGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    getListProcessSchedules(); 

    $$('add').onclick(() => {
        $$('ps-label').setValue('Add');
        $$('ps-schedule').clear();
        $$('ps-process').clear().add('', '(select)');

        Utils.popup_open("ps-popup");

        AWS.callSoap(WS, 'listProcesses').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ps-process').addItems(data.item, "id", "description");
            }  
        });

        $$('ps-ok').onclick(() => {
        
        });
        $$('ps-cancel').onclick(Utils.popup_close);
    });

    function edit() {
        const row = processSchedulesGrid.getSelectedRow();

        $$('task-label').setValue('Edit');

        $$('ps-schedule').clear();
        $$('ps-process').clear().add('', '(select)');

        Utils.popup_open("ps-popup");

        AWS.callSoap(WS, 'listProcesses').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ps-process').addItems(data.item, "id", "description");
            }  
        });

        $$('ps-ok').onclick(() => {
        
        });
        $$('ps-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }  
        });
    });
})();
