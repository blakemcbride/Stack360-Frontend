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
    const WS = 'StandardBillingBankAccount';
    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);
    let resultsGrid;

    const showTable = () => {
        if (resultsGrid != undefined) {
            resultsGrid.destroy();            
        }
        const columnDefs = [
            {headerName: "Type", field: "typeFormatted", width: 30},
            {headerName: "Bank", field: "name", width: 100},
            {headerName: "Routing Code", field: "routingNumber", width: 30},
            {headerName: "Accounting Number", field: "accountNumber", width: 40},
            {headerName: "Code", field: "code", width: 30},
            {headerName: "Organizational Group", field: "orgGroupName", width: 60},
            {headerName: "Last Active", field: "inactiveDate", width: 50, hide: $$('show').getValue() == 1},
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
        getListBankAccounts();
    }        
    
    $$('add').onclick(() => {
        $$('ba-acc_type').clear();
        $$('ba-bank').clear();
        $$('ba-rout_code').clear();
        $$('ba-acc_number').clear();
        $$('ba-code').clear();
        $$('ba-last_act_date').clear();

        AWS.callSoap(WS, 'listCompanyOrgGroups').then(listCompanyOrgGroups => {
            if (listCompanyOrgGroups.wsStatus === "0") {
                listCompanyOrgGroups.item = Utils.assureArray(listCompanyOrgGroups.item);

                const baog = $$('ba-org_group');
                baog.clear().add('', '(select)');
                baog.addItems(listCompanyOrgGroups.item, "id", "name");    
            }
        });

        Utils.popup_open("ba-popup");
        $$('ba-title').setValue('Add Bank Account');

        $$('ba-ok').onclick(() => {
            if ($$('ba-acc_type').isError('Account Type'))
                return;
            if($$('ba-bank').isError('Bank'))
                return;
            if($$('ba-rout_code').isError('Routing Code'))
                return;
            if($$('ba-acc_number').isError('Account Number'))
                return;
            if($$('ba-code').isError('Code'))
                return;
            if($$('ba-last_act_date').isError('Last Active Date'))
                return;
            
            if($$('ba-org_group').isError('Organizational Group'))
                return;

            const params = {
                accountNumber: $$('ba-acc_number').getValue(),
                code: $$('ba-code').getValue(),
                inactiveDate: $$('ba-last_act_date').getIntValue(),
                name: $$('ba-bank').getValue(),
                orgGroupId: $$('ba-org_group').getValue(),
                routingNumber: $$('ba-rout_code').getValue(),
                type: $$('ba-acc_type').getValue()
            };
            AWS.callSoap(WS, 'newBankAccount', params).then(data => {
                if (data.wsStatus === '0') {
                    getListBankAccounts();   
                    Utils.popup_close();
                }
            });        
        });

        $$('ba-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(edit);

    function edit () {
        const row = resultsGrid.getSelectedRow();
        $$('ba-acc_type').setValue(row.type);
        $$('ba-bank').setValue(row.name);
        $$('ba-rout_code').setValue(row.routingNumber);
        $$('ba-acc_number').setValue(row.accountNumber);
        $$('ba-code').setValue(row.code);
        $$('ba-last_act_date').setValue(row.inactiveDate);

        AWS.callSoap(WS, 'listCompanyOrgGroups').then(listCompanyOrgGroups => {
            if (listCompanyOrgGroups.wsStatus === "0") {
                listCompanyOrgGroups.item = Utils.assureArray(listCompanyOrgGroups.item);

                const baog = $$('ba-org_group');
                baog.clear().add('', '(select)');
                baog.addItems(listCompanyOrgGroups.item, "id", "name");    
                baog.setValue(row.orgGroupId);
            }
        });

        Utils.popup_open("ba-popup");
        $$('ba-title').setValue('Edit Bank Account');

        $$('ba-ok').onclick(() => {
            if ($$('ba-acc_type').isError('Account Type'))
                return;
            if($$('ba-bank').isError('Bank'))
                return;
            if($$('ba-rout_code').isError('Routing Code'))
                return;
            if($$('ba-acc_number').isError('Account Number'))
                return;
            if($$('ba-code').isError('Code'))
                return;
            if($$('ba-last_act_date').isError('Last Active Date'))
                return;
            
            if($$('ba-org_group').isError('Organizational Group'))
                return;

            const params = {
                id: row.id,
                accountNumber: $$('ba-acc_number').getValue(),
                code: $$('ba-code').getValue(),
                inactiveDate: $$('ba-last_act_date').getIntValue(),
                name: $$('ba-bank').getValue(),
                orgGroupId: $$('ba-org_group').getValue(),
                routingNumber: $$('ba-rout_code').getValue(),
                type: $$('ba-acc_type').getValue()
            };
            AWS.callSoap(WS, 'saveBankAccount', params).then(data => {
                if (data.wsStatus === '0') {
                    getListBankAccounts();   
                    Utils.popup_close();
                }
            });        
        });

        $$('ba-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('delete').onclick(() => {
        const row = resultsGrid.getSelectedRow();      
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Bank Account?', () => {
            const params = {
                ids: row.id
            };
            AWS.callSoap(WS, "deleteBankAccounts", params).then(data => {
                if (data.wsStatus === '0') {
                    getListBankAccounts();
                }
            });
        });
    });

    /*
    $$('report').onclick(() => {     
        const params = {
            activeType: $$('show').getValue()
        };
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {     
                Utils.showReport(data.fileName);
            }
        });
    });
*/

    const getTypeFormatted = (t) => {
        switch(t) {
            case 'S':  return "Savings";
            case 'C':  return "Checking";
            default:   return "";
        }              
    }
    const getListBankAccounts = () => {
        $$('edit').disable();
        $$('delete').disable();
        resultsGrid.clear();
        const params = {
            activeType: $$('show').getValue()
        }
        AWS.callSoap(WS, 'listBankAccounts', params).then(listBankAccounts => {
            if (listBankAccounts.wsStatus === "0") {
                const rowData = Utils.assureArray(listBankAccounts.item);
                for (let i = 0; i < rowData.length; i++) {
                    rowData[i].typeFormatted = getTypeFormatted(rowData[i].type);
                }
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('delete').enable(rows);
                });   
                resultsGrid.setOnRowDoubleClicked(edit);
            }            
        });        
    }
    $$('show').onChange(showTable);
    showTable();
})();
