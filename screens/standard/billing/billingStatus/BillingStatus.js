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
    const WS = 'StandardBillingBillingStatus';
    let resultsGrid;

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus !== "0") {
            return;
        }
    });

    const columnDefs = [
        {headerName: "Name", field: "name", width: 500}
    ];
    resultsGrid = new AGGrid('resultsGrid', columnDefs);
    resultsGrid.show();
    
    $$('add').onclick(() => {
        $$('bs-status').clear();

        Utils.popup_open("bs-popup", "bs-status");
        $$('bs-title').setValue('Add');

        $$('bs-ok').onclick(() => {
            if ($$('bs-status').isError('Status Name'))
                return;

            const params = {
                name: $$('bs-status').getValue()
            };
            AWS.callSoap(WS, 'newBillingStatus', params).then(data => {
                if (data.wsStatus === '0') {
                    getListBillingStatuses();   
                    Utils.popup_close();
                }
            });        
        });

        $$('bs-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(edit);

    function edit () {
        const row = resultsGrid.getSelectedRow();
        $$('bs-status').setValue(row.name)
   

        Utils.popup_open("bs-popup", "bs-status");
        $$('bs-title').setValue('Edit');

        $$('bs-ok').onclick(() => {
            if ($$('bs-status').isError('Status Name'))
                return;

            const params = {
                id: row.id,
                name: $$('bs-status').getValue()
            };
            AWS.callSoap(WS, 'saveBillingStatus', params).then(data => {
                if (data.wsStatus === '0') {
                    getListBillingStatuses();   
                    Utils.popup_close();
                }
            });        
        });

        $$('bs-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('delete').onclick(() => {
        const row = resultsGrid.getSelectedRow();      
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Employee/Dependent Billing Status?', () => {
            const params = {
                ids: row.id
            };
            AWS.callSoap(WS, "deleteBillingStatuses", params).then(data => {
                if (data.wsStatus === '0') {
                    getListBillingStatuses();
                }
            });
        });
    });

    $$('report').onclick(() => {     
        AWS.callSoap(WS, 'getReport').then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl);
            }
        });
    });

    const getListBillingStatuses = () => {
        $$('edit').disable();
        $$('delete').disable();
        resultsGrid.clear();

        AWS.callSoap(WS, 'listBillingStatuses').then(data => {
            if (data.wsStatus === "0") {
                const rowData = Utils.assureArray(data.item);
                $$('status').setValue('Displaying '+ rowData.length +' Employee/Dependent Billing Statuses')
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnSelectionChanged(() => {
                    $$('edit').enable();
                    $$('delete').enable();
                });   
                resultsGrid.setOnRowDoubleClicked(edit);
            }            
        });        
    }
    getListBillingStatuses();
})();
