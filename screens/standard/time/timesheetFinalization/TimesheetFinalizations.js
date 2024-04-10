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
    const WS = 'StandardTimeTimesheetFinalization';

    let resultsGrid;

    function makeName(fn, ln, lid = "") {
        return ln + ", " + fn + ' (' + lid + ')';
    }
    const personName = makeName(Framework.userInfo.personFName, Framework.userInfo.personLName);

    $$('tf-from_date').setValue(new Date());
    
    const showTable = () => {
        const columnDefs = [
            {headerName: "Last Name", field: "lname", width: 50},
            {headerName: "First Name", field: "fname", width: 50},
            {headerName: "Date Last Time Entered", field: "lastEnteredTimeDate", width: 50},
            {headerName: "Hours", field: "hoursLastEntered", type: 'numericColumn', width: 40},
            {headerName: "Finalization Date", field: "finalizationDate", width: 50}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
    }            

    $$('report').onclick(() => {
        const params = {
            cutoffDate: $$('tf-from_date').getIntValue(),
            includeSelf: $$('tf-exclude').getValue()
        }
        AWS.callSoap(WS, 'getFinalizeReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });     
    });    

    const sendMessage = () => {
        const row = resultsGrid.getSelectedRow();
        $$('tf-sender').setValue(personName);
        $$('tf-receiver').setValue(makeName(row.fname, row.lname, row.loginId));
        $$('tf-subject').setValue("Finalized Timesheet Entries Reminder");
        $$('tf-message').setValue("This is a reminder to complete your Timesheet Entries and finalize your time.");  

        Utils.popup_open("tf-popup");
        $$('tf-title').setValue('Message');

        $$('tf-ok').onclick(() => {
            if ($$('tf-sender').isError('Sender'))
                return;
            if ($$('tf-receiver').isError('Receiver'))
                return;
            if ($$('tf-subject').isError('Subject'))
                return;
            if ($$('tf-message').isError('Message'))
                return;

            const params = {
                message: $$('tf-message').getValue(),
                subject: $$('tf-subject').getValue(),
                toPersonId: row.personId,
                
            };
            AWS.callSoap(WS, 'createMessage', params).then(data => {
                if (data.wsStatus === '0') {
                    Utils.popup_close();
                }
            });        
        });

        $$('tf-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('message').onclick(sendMessage);

    const getListEmployeesForFinalizedReport = () => {
        $$('message').disable();

        const params = {
            cutoffDate: $$('tf-from_date').getIntValue(),
            includeSelf: $$('tf-exclude').getValue()
        }
        resultsGrid.clear();
        AWS.callSoap(WS, 'listEmployeesForFinalizedReport', params).then(res => {
            if (res.wsStatus === "0") {
                const rowData = Utils.assureArray(res.item);
                for (let i = 0; i < rowData.length; i++) {
                    rowData[i].hoursLastEntered = Utils.format(Utils.toNumber(rowData[i].hoursLastEntered), "C", 0, 2);                            
                }
                resultsGrid.addRecords(rowData);
                $$('status').setValue('Displaying ' + rowData.length + ' Employees');
                resultsGrid.setOnRowDoubleClicked(sendMessage);
            }            
        });      
        resultsGrid.setOnSelectionChanged($$('message').enable);
    }
    $$('show').onclick(getListEmployeesForFinalizedReport);
    showTable();
})();
