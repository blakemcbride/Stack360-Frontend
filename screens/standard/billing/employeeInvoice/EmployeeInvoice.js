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
    const WS = 'StandardBillingEmployeeInvoice';

    let invoicesGrid;

    const invoicesColumnDefs = [
        {headerName: "Date", field: "date", type: 'numericColumn', width: 150},
        {headerName: "Total", field: "total", type: 'numericColumn', width: 180},
        {headerName: "Balance", field: "balance", type: 'numericColumn', width: 180},
        {headerName: "Invoice ID", field: "invoiceId", type: 'numericColumn', width: 180},
        {headerName: "Person", field: "invoicePerson", width: 180},
        {headerName: "Description", field: "description", width: 500},
    ];

    invoicesGrid = new AGGrid('invoicesGrid', invoicesColumnDefs);

    invoicesGrid.show();

    function searchInvoices() {
        const params = {
            excludeZeroBalance: $$('ei-invoicesLimit').getValue(),
            fromDate: $$('ei-from-Date').getIntValue(),
            toDate: $$('ei-to-Date').getIntValue(),
        }

        AWS.callSoap(WS, 'searchInvoices', params).then(data => {
            invoicesGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                invoicesGrid.addRecords(data.item);     

                $$('invoices-label').setValue('Displaying ' + data.item.length + ' Invoices');
            }     
        });
    }

    searchInvoices();

    $$('ei-from-Date').onChange(searchInvoices)
    $$('ei-to-Date').onChange(searchInvoices)

    $$('ei-invoicesLimit').onChange(searchInvoices);

    $$('generate').onclick(() => {
        $$('ei-invoiceDate').clear();
        Utils.popup_open('generate-popup');

        $$('generateOk').onclick(() => {
            if ($$('ei-invoiceDate').isError('Invoice Date'))
                return;

            const params = {
                date: $$('ei-invoiceDate').getIntValue()
            } 
            AWS.callSoap(WS, 'generateInvoices', params).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_close();
                    Utils.showMessage('Information', 'Invoice Generation was started successfully. A system Message will be sent to you when processing completes on success or failure.');
                }
            });
            
        });

        $$('generateCancel').onclick(Utils.popup_close);
    });

    $$('report').onclick(() => {
        const params = {
            excludeZeroBalance: $$('ei-invoicesLimit').getValue(),
            fromDate: $$('ei-from-Date').getIntValue(),
            toDate: $$('ei-to-Date').getIntValue(),
        } 
        AWS.callSoap(WS, 'getReport', params).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });
})();
