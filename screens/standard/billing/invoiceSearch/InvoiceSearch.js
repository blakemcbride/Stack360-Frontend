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

    const WS = "StandardBillingInvoiceSearch";

    const columnDefs = [
        {headerName: 'ID', field: 'accountingInvoiceId', type: "numericColumn", sortable: true, width: 15  },
        {headerName: 'Date', field: 'invoiceDate', type: "numericColumn", sortable: true, width: 18 },
        {headerName: 'Client', field: 'clientName', sortable: true, width: 30 },
        {headerName: 'Amount', field: 'invoiceAmountFormatted', type: "numericColumn", sortable: true, width: 18 },
        {headerName: 'Description', field: 'invoiceDescription', sortable: true, width: 100 },
        {headerName: 'Transmitted Date', field: 'invoiceTransmittedDate', type: "numericColumn", sortable: true, width: 25 }
    ];

    const grid = new AGGrid('invoice-grid', columnDefs, 'invoiceId');
    grid.show();
    grid.setOnSelectionChanged(function (rows) {
        $$('display').enable(rows);
        $$('retransmit').enable(rows);
        $$('delete').enable(rows);
    });

    const data = {
        name: null,
        nameSearchType: 0
    };
    AWS.callSoap(WS, 'searchClientCompany', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('client');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].clientId, res.item[0].clientName);
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown(res.item, 'clientId', 'clientName');
            } else {
                ctl.forceSelect();
            }
        }
    });

    $$('client').setSelectFunction(async function () {
        let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
        if (res._status === "ok")
            $$('client').setValue(res.id, res.name);
    });

    function updateGrid() {
        const data = {
            amount: $$('invoice-amount').getValue(),
            amountSearchType: $$('invoice-amount-type').getValue(),
            clientId: $$('client').getValue(),
            invoiceEndDate: $$('invoice-end-date').getIntValue(),
            invoiceId: $$('invoice-id').getValue(),
            invoiceIdSearchType: $$('invoice-id-type').getValue(),
            invoiceStartDate: $$('invoice-start-date').getIntValue(),
            invoiceStatus: $$('invoice-status').getValue()
        };
        AWS.callSoap(WS, 'searchInvoices', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.invoices = Utils.assureArray(res.invoices);
                grid.clear();
                for (let i=0 ; i < res.invoices.length ; i++) {
                    let id = res.invoices[i].invoiceDate;
                    id = Utils.take(id, 10);
                    id = DateUtils.SQLtoInt(id);
                    res.invoices[i].invoiceDate = DateUtils.intToStr4(id);
                }
                grid.addRecords(res.invoices);
                if (res.invoices.length < Utils.toNumber(res.cap))
                    $$('status').setColor('black').setValue('Displaying ' + res.invoices.length + " Invoices");
                else
                    $$('status').setColor('red').setValue('Displaying ' + res.invoices.length + " Invoices (limit)");
                $$('display').disable();
                $$('retransmit').disable();
                $$('delete').disable();
                $$('report').enable();
            }
        });
    }

    $$('search').onclick(updateGrid);

    function report() {
        const data = {
            amount: $$('invoice-amount').getValue(),
            amountSearchType: $$('invoice-amount-type').getValue(),
            clientId: $$('client').getValue(),
            invoiceEndDate: $$('invoice-end-date').getIntValue(),
            invoiceId: $$('invoice-id').getValue(),
            invoiceIdSearchType: $$('invoice-id-type').getValue(),
            invoiceStartDate: $$('invoice-start-date').getIntValue(),
            invoiceStatus: $$('invoice-status').getValue()
        };
        Utils.waitMessage("Report in progress; please wait.")
        AWS.callSoap(WS, 'report', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    }

    $$('report').onclick(report);

    function display() {
        Utils.popup_open('display-options-popup');

        $$('rop-ok').onclick(function () {
            const data = {
                descriptionIncluded: $$('rop-include-description').getValue(),
                detailIncluded: $$('rop-include-detail').getValue(),
                invoiceIds: grid.getSelectedRow().invoiceId,
                lineItemsIncluded: $$('rop-include-line-items').getValue()
            };
            AWS.callSoap(WS, 'getInvoiceReport', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showReport(res.reportUrl);
                }
            });

            Utils.popup_close();
        });

        $$('rop-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('display').onclick(display);
    grid.setOnRowDoubleClicked(display);

    $$('delete').onclick(function () {
        Utils.yesNo('Confirmation', 'All associated timesheet records will be returned to the system.  Are you sure you want to delete the selected invoice?', function () {
            const data = {
                invoiceIds: grid.getSelectedRow().invoiceId
            };
            AWS.callSoap(WS, 'deleteInvoice', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Status', 'Invoice has been deleted.');
                    updateGrid();
                }
            });
        });
    });

    $$('retransmit').onclick(function () {
        let row = grid.getSelectedRow();
        if (!row.invoiceTransmittedDate)
            Utils.showMessage('Error', "Invoices that haven't been transmitted cannot be marked for re-transmit.");
        else
            Utils.showMessage('Error', "This function is not implemented.");
    });

    $$('reset').onclick(function () {
        $$('client').clear();
        $$('invoice-id').clear();
        $$('invoice-amount').clear();
        $$('invoice-id-type').setValue('5');
        $$('invoice-amount-type').setValue('11');
        $$('invoice-start-date').clear();
        $$('invoice-end-date').clear();
        $$('invoice-status').clear();
    })

})();
