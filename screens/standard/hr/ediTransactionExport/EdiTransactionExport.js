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
    const WS = 'StandardHrEdiTransactionExport';

    let vendorsGrid;

    const vendorsColumnDefs = [
        {headerName: "Vendor", field: "vendorName", width: 350}
    ];

    vendorsGrid = new AGGrid('vendorsGrid', vendorsColumnDefs);
    vendorsGrid.multiSelect();
    vendorsGrid.show();

    function searchVendorCompany() {
        const params = {
            accountNumber: '',
            accountNumberSearchType: 0,
            expenseGLAccountId: '',
            identifier: '',
            identifierSearchType: 0,
            mainContactFirstName:'',
            mainContactFirstNameSearchType: 0,
            mainContactLastName: '',
            mainContactLastNameSearchType: 0,
            name: '',
            nameSearchType: 0
        }
        
        $$('export').disable();

        AWS.callSoap(WS, 'searchVendorCompany', params).then(data => {
            vendorsGrid.clear();
            if (data.wsStatus === "0") {
                data.vendorList = Utils.assureArray(data.vendorList);
                vendorsGrid.addRecords(data.vendorList);     
                vendorsGrid.setOnSelectionChanged((x) => {
                    $$('export').enable(x);
                });
            }     
        });
    }

    searchVendorCompany();

    $$('export').onclick(() => {
        if ($$('fromDate').isError('From Date'))
            return;

        if ($$('toDate').isError('To Date'))
            return;

        if (!$$('typeAdd').getValue() && !$$('typeEdit').getValue() && !$$('typeDelete').getValue()) {
            Utils.showMessage('Error', 'At least 1 transaction type is required.');
            return;
        }

        let transactionTypes = [];
        if ($$('typeAdd').getValue()) {
            transactionTypes.push('N');
        }
        if ($$('typeEdit').getValue()) {
            transactionTypes.push('M');
        }
        if ($$('typeDelete').getValue()) {
            transactionTypes.push('D');
        }
        const rows = vendorsGrid.getSelectedRows();
        let ids = [];
        for (let i = 0; i < rows.length; i++) {
            ids.push(rows[i].vendorId);
        }
        const params = {
            fromDate: $$('fromDate').getIntValue(),
            toDate: $$('toDate').getIntValue(),
            transactionTypes: transactionTypes,
            vendorIds: ids
        }
        AWS.callSoap(WS, 'getExport', params).then(data => {
            if (data.wsStatus === "0") {
                Utils.showReport(data.exportUrl);
            }     
        });

    });
})();
