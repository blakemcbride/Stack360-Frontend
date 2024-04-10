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
    const WS = 'StandardHrPayHistory';

    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);

    $$('worker-name').setValue(personName);

    let date = new Date();
    $$('ph-fromDate').setValue(new Date(date.getFullYear(), 0, 1));
    $$('ph-toDate').setValue(new Date(date.getFullYear() + 1, 0, 0));

    let paymentsGrid;
 
    const paymentsColumnDefs = [
        {headerName: "Payment Date", field: "paymentDateFormatted", type: "numericColumn", width: 120},
        {headerName: "Payment Method", field: "paymentMethod", width: 120},
        {headerName: "Check Number", field: "checkNumber", type: "numericColumn", width: 120},
        {headerName: "Total", field: "total", type: "numericColumn", width: 240}
    ];
    paymentsGrid = new AGGrid('paymentsGrid', paymentsColumnDefs);
    paymentsGrid.show();  

    function searchPayHistory() {

        const params = {           
            checkNumber: $$('searchType').getValue() === '1' ? $$('ph-checkNumber').getValue() : 0,
            personId: personId,
            fromPayDate: $$('searchType').getValue() === '2' ? 0 :$$('ph-fromDate').getIntValue(),
            toPayDate: $$('searchType').getValue() === '2' ? 0 : $$('ph-toDate').getIntValue()
        };
        AWS.callSoap(WS, 'searchPayHistory', params).then(data => {
            if (data.wsStatus === '0') {     
                paymentsGrid.clear();
                data.item = Utils.assureArray(data.item);
                $$('ph-status').setValue('Displaying ' + data.item.length + ' Payments');
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].paymentDateFormatted = DateUtils.intToStr4(Number(data.item[i].paymentDate));
                }
                paymentsGrid.addRecords(data.item);
                paymentsGrid.setOnSelectionChanged((x) => {
                    $$('view').enable(x);
                });
                paymentsGrid.setOnRowDoubleClicked(view);
            }
        });   
    }

    searchPayHistory();

    $$('searchType').onChange(() => {
        if ($$('searchType').getValue() === '1') {
            $$('ph-checkNumber').enable();
            $$('checkNumberSearch').enable();

            $$('ph-fromDate').disable();
            $$('ph-toDate').disable();
            $$('datesSearch').disable();
        } else {
            $$('ph-checkNumber').disable();
            $$('checkNumberSearch').disable();

            $$('ph-fromDate').enable();
            $$('ph-toDate').enable();
            $$('datesSearch').enable();
        }
    });

    function view() {
      
    }

    $$('view').onclick(view);

    $$('report').onclick(() => {
        const params = {
            checkNumber: $$('searchType').getValue() === '1' ? $$('ph-checkNumber').getValue() : 0,
            personId: personId,
            fromPayDate: $$('searchType').getValue() === '2' ? 0 : $$('ph-fromDate').getIntValue(),
            toPayDate: $$('searchType').getValue() === '2' ? 0 : $$('ph-toDate').getIntValue()
        };

        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.reportUrl); 
            }
        });  
    });
})();
