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
    const WS = 'StandardTimeTimesheetEntryExceptions';

    let resultsGrid;

    function makeName(fn, ln, lid = "") {
        return ln + ", " + fn + ' (' + lid + ')';
    }
    const personName = makeName(Framework.userInfo.personFName, Framework.userInfo.personLName);

    const showTable = () => {
        const columnDefs = [
            {headerName: "Last Name", field: "lname", width: 60},
            {headerName: "First Name", field: "fname", width: 60},
            {headerName: "Missing Timesheet on Date", field: "missingDate", width: 100}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
    }            

    $$('report').onclick(() => {
        const params = {
            fromDate: $$('tee-from_date').getIntValue(),
            toDate: $$('tee-to_date').getIntValue(),
            includeSelf: $$('tee-exclude').getValue()
        }
        AWS.callSoap(WS, 'getTimesheetExceptionReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });     
    });    

    const sendMessage = () => {
        const row = resultsGrid.getSelectedRow();
        $$('tee-sender').setValue(personName);
        $$('tee-receiver').setValue(makeName(row.fname, row.lname, row.loginId));
        $$('tee-subject').setValue("Missing Timesheet Entries Reminder");
        $$('tee-message').setValue("This is a reminder that you are missing Timesheet Entries which you need to complete and finalize.");  

        Utils.popup_open("tee-popup");
        $$('tee-title').setValue('Message');

        $$('tee-ok').onclick(() => {
            if ($$('tee-sender').isError('Sender'))
                return;
            if ($$('tee-receiver').isError('Receiver'))
                return;
            if ($$('tee-subject').isError('Subject'))
                return;
            if ($$('tee-message').isError('Message'))
                return;

            const params = {
                message: $$('tee-message').getValue(),
                subject: $$('tee-subject').getValue(),
                toPersonId: row.personId,
                
            };
            AWS.callSoap(WS, 'createMessage', params).then(data => {
                if (data.wsStatus === '0') { 
                    Utils.popup_close();
                }
            });        
        });

        $$('tee-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('message').onclick(sendMessage);

    const getListEmployeesForTimesheetExceptionReport = () => {
        $$('message').disable();

        const params = {
            fromDate: $$('tee-from_date').getIntValue(),
            toDate: $$('tee-to_date').getIntValue(),
            includeSelf: $$('tee-exclude').getValue()
        }
        resultsGrid.clear();
        AWS.callSoap(WS, 'listEmployeesForTimesheetExceptionReport', params).then(res => {
            if (res.wsStatus === "0") {
                const rowData = Utils.assureArray(res.missingTimes);
                resultsGrid.addRecords(rowData);
                $$('status').setValue('Displaying ' + rowData.length + ' Exceptions');
                resultsGrid.setOnRowDoubleClicked(sendMessage);
            }            
        });      
        resultsGrid.setOnSelectionChanged($$('message').enable);
    }
    $$('show').onclick(getListEmployeesForTimesheetExceptionReport);
    showTable();
})();
