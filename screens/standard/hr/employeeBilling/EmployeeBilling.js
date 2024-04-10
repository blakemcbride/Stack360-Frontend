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
    const WS = 'StandardHrEmployeeBilling';

    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);

    $$('worker-name').setValue(personName);

    const container = new TabContainer('eb-tab-container');
    container.selectTab('eb-invoices-TabButton');


    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    let invoicesGrid;
    let paymentsGrid;
    let adjustmentsGrid;

    const invoicesColumnDefs = [
        {headerName: "Date", field: "date", type: 'numericColumn', width: 150},
        {headerName: "Total", field: "total", type: 'numericColumn', width: 180},
        {headerName: "Balance", field: "balance", type: 'numericColumn', width: 180},
        {headerName: "Invoice ID", field: "invoiceId", type: 'numericColumn', width: 180},
        {headerName: "Description", field: "description", width: 500},
    ];

    const paymentsColumnDefs = [
        {headerName: "Date", field: "dateFormatted", type: 'numericColumn', width: 100},
        {headerName: "Type", field: "typeFormatted", width: 180},
        {headerName: "Amount", field: "amountFormatted", type: 'numericColumn', width: 180},
        {headerName: "Un-Applied", field: "balanceFormatted", type: 'numericColumn', width: 180},
        {headerName: "Invoice ID", field: "accountingInvoiceId", type: 'numericColumn', width: 180},
        {headerName: "Description", field: "description", width: 500},
    ];

    const adjustmentsColumnDefs = [
        {headerName: "Date", field: "date", type: 'numericColumn', width: 150},
        {headerName: "Amount", field: "amount", type: 'numericColumn', width: 180},
        {headerName: "Invoice ID", field: "invoiceId", type: 'numericColumn', width: 180},
        {headerName: "Description", field: "description", width: 500},
    ];
    invoicesGrid = new AGGrid('invoicesGrid', invoicesColumnDefs);
    paymentsGrid = new AGGrid('paymentsGrid', paymentsColumnDefs);
    adjustmentsGrid = new AGGrid('adjustmentsGrid', adjustmentsColumnDefs);

    invoicesGrid.show();
    paymentsGrid.show();
    adjustmentsGrid.show();

    function searchBillingStatuses() {
        let formSearchGrid;
        Utils.popup_open('billingStatus-search');

        const reset = () => {
            $$('billingStatus-chooseSpecific').setValue('S');

            $$('eb-billingStatusName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('eb-billingStatusName-search').clear();

            $$('billingStatusReset').enable();
            $$('billingStatusSearch').enable();

            $$('billingStatusSearchOk').disable();

            formSearchGrid.clear();
            $$('billingStatus-count').setValue(`Displaying 0 Billing Statuses`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {  
                $$('eb-billingStatusSC').setValue(row.id, row.name);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('eb-billingStatusName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                {headerName: 'Name', field: 'name', width: 210}
            ];

            formSearchGrid = new AGGrid('billingStatusSearchGrid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const params = {
                id: '',
                name: $$('eb-billingStatusName-search').getValue(),
                nameSearchType: $$('eb-billingStatusName-criteria').getValue()
            }
            AWS.callSoap(WS, 'searchBillingStatuses', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('billingStatus-count').setValue(`Displaying ${records.length} Billing Statuses`);
                    } else {
                        $$('billingStatus-count').setValue(`Displaying 0 Billing Statuses`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('billingStatusSearchOk').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });           
        };

        $$('billingStatusReset').onclick(reset);
        $$('billingStatusSearch').onclick(search);
        $$('billingStatusSearchOk').onclick(ok);
        $$('billingStatusSearchCancel').onclick(cancel);

        $$('billingStatus-chooseSpecific').onChange(() => {
            if ($$('billingStatus-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('eb-billingStatusName-criteria').disable();
                $$('eb-billingStatusName-search').disable();
                $$('billingStatusReset').disable();
                $$('billingStatusSearch').disable();
                $$('billingStatus-count').setValue(`Displaying 0 Billing Statuses`);

                $$('billingStatusSearchOk').enable().onclick(() => {
                    $$('eb-billingStatusSC').setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('eb-billingStatusName-criteria').enable();
                $$('eb-billingStatusName-search').enable();
                $$('billingStatusReset').enable();
                $$('billingStatusSearch').enable();
                $$('billingStatusSearchOk').disable().onclick(ok);
            }
        });

        search();
    }

    function getTypeFormatted(type) {
        switch (type) {
            case 'C':
                return 'Check';
            
            case 'D':
                return 'Bank Draft';
        
            default:
                return '';
        }
    }

    function loadBilling() {
        const params = {
            personId: personId
        }

        AWS.callSoap(WS, 'loadBilling', params).then(data => {
            if (data.wsStatus === "0") {
                $$('eb-balance').setValue(Utils.format(data.balance, 'D', 0, 2));
                $$('eb-billingStatus').setValue(data.billingStatusName);
                $$('eb-paymentMethod').setValue('Check');
            }     
        });
    }

    function searchInvoices() {
        $$('invoicesEdit').disable();
        $$('invoicesDelete').disable();

        const params = {
            excludeZeroBalance: $$('eb-invoicesLimit').getValue(),
            fromDate: $$('eb-invoicesFromDate').getIntValue(),
            personId: personId,
            toDate: $$('eb-invoicesToDate').getIntValue(),
        }

        AWS.callSoap(WS, 'searchInvoices', params).then(data => {
            invoicesGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                invoicesGrid.addRecords(data.item);     

                $$('invoices-label').setValue('Displaying ' + data.item.length + ' Invoices');
                invoicesGrid.setOnRowDoubleClicked();

                invoicesGrid.setOnSelectionChanged(() => {
                    $$('invoicesEdit').enable();
                    $$('invoicesDelete').enable();
                });
            }     
        });
    }

    function searchPayments() {
        $$('paymentsEdit').disable();
        $$('paymentsDelete').disable();

        const params = {
            excludeZeroBalance: $$('eb-paymentsLimit').getValue(),
            fromDate: $$('eb-paymentsFromDate').getIntValue(),
            personId: personId,
            toDate: $$('eb-paymentsToDate').getIntValue(),
        }

        AWS.callSoap(WS, 'searchPayments', params).then(data => {
            paymentsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dateFormatted = data.item[i].date !== '0' ? DateUtils.intToStr4(data.item[i].date) : '';
                    data.item[i].typeFormatted = getTypeFormatted(data.item[i].type);
                    data.item[i].amountFormatted = Utils.format(data.item[i].amount, 'D', 0, 2);
                    data.item[i].balanceFormatted = Utils.format(data.item[i].balance, 'D', 0, 2);
                }
                paymentsGrid.addRecords(data.item);     

                $$('payments-label').setValue('Displaying ' + data.item.length + ' Payments');
                paymentsGrid.setOnRowDoubleClicked(editPayment);

                paymentsGrid.setOnSelectionChanged((x) => {
                    $$('paymentsEdit').enable(x);
                    $$('paymentsDelete').enable(x);
                });
            }     
        });
    }

    function searchAdjustments() {
        $$('adjustmentsView').disable();

        const params = {
            fromDate: $$('eb-adjustmentsFromDate').getIntValue(),
            personId: personId,
            toDate: $$('eb-adjustmentsToDate').getIntValue(),
        }

        AWS.callSoap(WS, 'searchAdjustments', params).then(data => {
            adjustmentsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                adjustmentsGrid.addRecords(data.item);     

                $$('adjustments-label').setValue('Displaying ' + data.item.length + ' Adjustments');
                adjustmentsGrid.setOnRowDoubleClicked();

                adjustmentsGrid.setOnSelectionChanged(() => {
                    $$('adjustmentsView').enable();
                });
            }     
        });
    }

    loadBilling();
    searchInvoices();
    searchPayments();
    searchAdjustments();

    let billingStatusHistoryGrid;
    const billingStatusHistoryColumnDefs = [
        {headerName: "Name", field: "name", width: 300},
        {headerName: "Start Date", field: "startDateFormatted", type: 'numericColumn', width: 80},
        {headerName: "Final Date", field: "finalDateFormatted", type: 'numericColumn', width: 80}
    ];
    billingStatusHistoryGrid = new AGGrid('billingStatusHistoryGrid', billingStatusHistoryColumnDefs);
    billingStatusHistoryGrid.show();

    $$('editBillingStatus').onclick(() => {
        const params = {
            personId: personId
        }
        $$('billingStatusHistoryEdit').disable();
        $$('billingStatusHistoryDelete').disable();

        function getListBillingStatusHistory() {
            AWS.callSoap(WS, 'listBillingStatusHistory', params).then(data => {
                billingStatusHistoryGrid.clear();
    
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        data.item[i].startDateFormatted = data.item[i].startDate !== '0' ? DateUtils.intToStr4(data.item[i].startDate) : '';
                        data.item[i].finalDateFormatted = data.item[i].finalDate !== '0' ? DateUtils.intToStr4(data.item[i].finalDate) : '';
                    }
                    billingStatusHistoryGrid.addRecords(data.item);     
    
                    $$('billingStatusHistory-label').setValue('Displaying ' + data.item.length + ' Billing Statuses');
                    billingStatusHistoryGrid.setOnRowDoubleClicked(editBillingStatusHistory);
    
                    billingStatusHistoryGrid.setOnSelectionChanged(() => {
                        $$('billingStatusHistoryEdit').enable();
                        $$('billingStatusHistoryDelete').enable();
                    });
                }     
            });
        }

        getListBillingStatusHistory();

        Utils.popup_open('billingStatusHistory-popup');

        $$('billingStatusHistoryAdd').onclick(() => {
            $$('eb-billingStatusFinalDate').clear();
            $$('eb-billingStatusStartDate').clear();
            const params = {
                id: '',
                name: '',
                nameSearchType: 0
            }
            AWS.callSoap(WS, 'searchBillingStatuses', params).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('eb-billingStatusSC');
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].id, res.item[i].name);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchBillingStatuses();
                    });
                }
            });

            Utils.popup_open('billingStatus-popup');

            $$('billingStatusOk').onclick(() => {
                if ($$('eb-billingStatusSC').isError('Billing Status'))
                    return;
                if ($$('eb-billingStatusStartDate').isError('Billing Status'))
                    return;
                
                const params = {
                    billingStatusId: $$('eb-billingStatusSC').getValue(),
                    finalDate: $$('eb-billingStatusFinalDate').getIntValue(),
                    personId: personId,
                    startDate: $$('eb-billingStatusStartDate').getIntValue()
                }
                AWS.callSoap(WS, 'newBillingStatusHistory', params).then(res => {
                    if (res.wsStatus === "0") {
                        getListBillingStatusHistory();
                        Utils.popup_close();
                    }
                });
            });

            $$('billingStatusCancel').onclick(Utils.popup_close);
        });

        function editBillingStatusHistory() {
            const row = billingStatusHistoryGrid.getSelectedRow();
            const params = {
                id: row.id,
                name: '',
                nameSearchType: 0
            }

            $$('eb-billingStatusFinalDate').setValue(row.finalDate);
            $$('eb-billingStatusStartDate').setValue(row.startDate);

            AWS.callSoap(WS, 'searchBillingStatuses', params).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('eb-billingStatusSC');
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].id, res.item[i].name);
                        ctl.setValue(res.selectedItem.id);
                    } else {
                        ctl.forceSelect();
                        ctl.setValue(res.selectedItem.id);
                    }
                    ctl.setSelectFunction(() => {
                        searchBillingStatuses();
                    });
                }
            });

            Utils.popup_open('billingStatus-popup');

            $$('billingStatusOk').onclick(() => {
                if ($$('eb-billingStatusSC').isError('Billing Status'))
                    return;
                if ($$('eb-billingStatusStartDate').isError('Billing Status'))
                    return;
                
                const params = {
                    billingStatusId: $$('eb-billingStatusSC').getValue(),
                    finalDate: $$('eb-billingStatusFinalDate').getIntValue(),
                    id: row.id,
                    startDate: $$('eb-billingStatusStartDate').getIntValue()
                }
                AWS.callSoap(WS, 'saveBillingStatusHistory', params).then(res => {
                    if (res.wsStatus === "0") {
                        getListBillingStatusHistory();
                        Utils.popup_close();
                    }
                });
            });

            $$('billingStatusCancel').onclick(Utils.popup_close);
        }
        $$('billingStatusHistoryEdit').onclick(editBillingStatusHistory);
        $$('billingStatusHistoryDelete').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Billing Status?', () => {
                const params = {
                    ids: billingStatusHistoryGrid.getSelectedRow().id
                };
                AWS.callSoap(WS, "deleteBillingStatusHistories", params).then(data => {
                    if (data.wsStatus === '0') {
                        getListBillingStatusHistory();
                    }
                });
            });
        });
        $$('billingStatusHistoryClose').onclick(() => {
            loadBilling();
            Utils.popup_close();
        });
    });

    $$('eb-invoicesLimit').onChange(searchInvoices);

    let invoiceLineItemsGrid;
    const invoiceLineItemsColumnDefs = [
        {headerName: "Product/Service", field: "product", width: 120},
        {headerName: "Amount", field: "amountFormatted", type: 'numericColumn', width: 120},
        {headerName: "Description", field: "description", width: 250}
    ];
    invoiceLineItemsGrid = new AGGrid('invoiceLineItemsGrid', invoiceLineItemsColumnDefs);
    invoiceLineItemsGrid.show();

    let invoiceAdjustmentsGrid;
    const invoiceAdjustmentsColumnDefs = [
        {headerName: "Date", field: "dateFormatted", type: 'numericColumn', width: 120},
        {headerName: "Amount", field: "amountFormatted", type: 'numericColumn', width: 120},
        {headerName: "Description", field: "description", width: 250}
    ];
    invoiceAdjustmentsGrid = new AGGrid('invoiceAdjustmentsGrid', invoiceAdjustmentsColumnDefs);
    invoiceAdjustmentsGrid.show();

    let invoicePaymentsGrid;
    const invoicePaymentsColumnDefs = [
        {headerName: "Date", field: "dateFormatted", type: 'numericColumn', width: 120},
        {headerName: "Type", field: "type", width: 120},
        {headerName: "Amount", field: "amount", type: 'numericColumn', width: 120},
        {headerName: "Available", field: "available", type: 'numericColumn', width: 120},
        {headerName: "Applied", field: "applied", type: 'numericColumn', width: 120},
        {headerName: "Description", field: "description", width: 250}
    ];
    invoicePaymentsGrid = new AGGrid('invoicePaymentsGrid', invoicePaymentsColumnDefs);
    invoicePaymentsGrid.show();

    $$('invoicesAdd').onclick(() => {
        invoiceLineItemsGrid.setOnSelectionChanged(() => {
            $$('invoiceLineItemsEdit').enable();
            $$('invoiceLineItemsDelete').enable();
        });

        invoiceAdjustmentsGrid.setOnSelectionChanged(() => {
            $$('invoiceAdjustmentsEdit').enable();
            $$('invoiceAdjustmentsDelete').enable();
        });

        const container = new TabContainer('invoice-tab-container');
        container.selectTab('invoiceLineItems-TabButton');

        $$('eb-invoiceDescription').clear();
        $$('eb-invoiceInvoiceId').setValue('(generate on save)');
        $$('eb-invoiceDate').clear();
        $$('eb-invoiceTotal').clear();
        $$('eb-invoiceBalance').clear();
        
        Utils.popup_open('invoice-popup');

        const params = {
            accountName: '',
            accountNameSearchType: 0,
            accountNumber: '',
            accountNumberSearchType: 0,
            selectFromCompanyDefault: true,
            selectFromId: '',
            selectFromInvoiceId: '',
            selectFromProductServiceId: '',
            showOnlyARAccounts: true
        }
        AWS.callSoap(WS, 'searchGLAccounts', params).then(res => {    
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('eb-invoiceARAccount');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].accountName);
                } else {
                    ctl.forceSelect();
                }
                ctl.setSelectFunction(() => {
                    searchGLAccounts();
                });
            }
        });

        function searchGLAccounts() {
            let formSearchGrid;
            Utils.popup_open('invoiceGLAccount-search');
    
            const reset = () => {
                $$('invoiceGLAccount-chooseSpecific').setValue('S');
    
                $$('eb-invoiceGLAccountNumber-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('eb-invoiceGLAccountNumber-search').clear();

                $$('eb-invoiceGLAccountName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('eb-invoiceGLAccountName-search').clear();
    
                $$('invoiceGLAccountReset').enable();
                $$('invoiceGLAccountSearch').enable();
    
                $$('invoiceGLAccountSearchOk').disable();
    
                formSearchGrid.clear();
                $$('invoiceGLAccount-count').setValue(`Displaying 0 GL Accounts`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {  
                    $$('eb-invoiceARAccount').setValue(row.id, row.accountName);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('eb-invoiceGLAccountNumber-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('eb-invoiceGLAccountName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Number', field: 'accountNumber', width: 70},
                    {headerName: 'Name', field: 'accountName', width: 70},
                    {headerName: 'Type', field: 'accountTypeFormatted', width: 70}
                ];
    
                formSearchGrid = new AGGrid('invoiceGLAccountSearchGrid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const params = {
                    accountNumber: $$('eb-invoiceGLAccountNumber-search').getValue(),
                    accountNumberSearchType: $$('eb-invoiceGLAccountNumber-criteria').getValue(),
                    accountName: $$('eb-invoiceGLAccountName-search').getValue(),
                    accountNameSearchType: $$('eb-invoiceGLAccountName-criteria').getValue(),
                    selectFromCompanyDefault: true,
                    selectFromId: '',
                    selectFromInvoiceId: '',
                    selectFromProductServiceId: '',
                    showOnlyARAccounts: true
                }
                AWS.callSoap(WS, 'searchGLAccounts', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('invoiceGLAccount-count').setValue(`Displaying ${records.length} GL Accounts`);
                        } else {
                            $$('invoiceGLAccount-count').setValue(`Displaying 0 GL Accounts`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('invoiceGLAccountSearchOk').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });           
            };
    
            $$('invoiceGLAccountReset').onclick(reset);
            $$('invoiceGLAccountSearch').onclick(search);
            $$('invoiceGLAccountSearchOk').onclick(ok);
            $$('invoiceGLAccountSearchCancel').onclick(cancel);
    
            $$('invoiceGLAccount-chooseSpecific').onChange(() => {
                if ($$('invoiceGLAccount-chooseSpecific').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('eb-invoiceGLAccountNumber-criteria').disable();
                    $$('eb-invoiceGLAccountNumber-search').disable();
                    $$('eb-invoiceGLAccountName-criteria').disable();
                    $$('eb-invoiceGLAccountName-search').disable();
                    $$('invoiceGLAccountReset').disable();
                    $$('invoiceGLAccountSearch').disable();
                    $$('invoiceGLAccount-count').setValue(`Displaying 0 Billing Statuses`);
    
                    $$('invoiceGLAccountSearchOk').enable().onclick(() => {
                        $$('eb-invoiceARAccount').setValue('');                         
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('eb-invoiceGLAccountNumber-criteria').enable();
                    $$('eb-invoiceGLAccountNumber-search').enable();
                    $$('eb-invoiceGLAccountName-criteria').enable();
                    $$('eb-invoiceGLAccountName-search').enable();
                    $$('invoiceGLAccountReset').enable();
                    $$('invoiceGLAccountSearch').enable();
                    $$('invoiceGLAccountSearchOk').disable().onclick(ok);
                }
            });
    
            search();
        }

        $$('invoiceLineItemsAdd').onclick(() => {
            $$('eb-invoiceLineItemAmount').clear();
            $$('eb-invoiceLineItemDescription').clear();

            const params = {
                accountingSystemId: '',
                accountingSystemIdSearchType: 0,
                description: '',
                descriptionSearchType: 0
            }
            AWS.callSoap(WS, 'searchProductsAndServices', params).then(res => {    
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('eb-invoiceLineItemProduct');
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length === 1) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        ctl.add(res.item[0].productId, res.item[0].description);
                        ctl.setValue(res.item[0].productId);
                        
                        $$('eb-invoiceLineItemGLExpense').setValue(res.item[0].glExpenseAccountName);
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].productId, res.item[i].description);
                    } else {
                        ctl.forceSelect();
                    }
                }
            });

            Utils.popup_open('invoiceLineItem-popup');

            $$('invoiceLineItemOk').onclick(() => {
                if ($$('eb-invoiceLineItemAmount').isError('Amount'))
                    return;
                if ($$('eb-invoiceLineItemProduct').isError('Product/Service'))
                    return;
                if ($$('eb-invoiceLineItemDescription').isError('Description'))
                    return;

                const item = {
                    product: $$('eb-invoiceLineItemProduct').getLabel(),
                    productServiceId: $$('eb-invoiceLineItemProduct').getValue(),
                    amount: $$('eb-invoiceLineItemAmount').getValue(),
                    amountFormatted: Utils.format($$('eb-invoiceLineItemAmount').getValue(), 'D', 0, 2),
                    description: $$('eb-invoiceLineItemDescription').getValue(),
                    id: ''
                }
                invoiceLineItemsGrid.addRecord(item);
                Utils.popup_close();
            });
            $$('invoiceLineItemCancel').onclick(Utils.popup_close);
        });
        $$('invoiceLineItemsEdit').onclick(() => {
            const row = invoiceLineItemsGrid.getSelectedRow();

            $$('eb-invoiceLineItemAmount').setValue(row.amount);
            $$('eb-invoiceLineItemDescription').setValue(row.description);

            const params = {
                accountingSystemId: '',
                accountingSystemIdSearchType: 0,
                description: '',
                descriptionSearchType: 0
            }
            AWS.callSoap(WS, 'searchProductsAndServices', params).then(res => {    
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('eb-invoiceLineItemProduct');
                    ctl.clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length === 1) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        ctl.add(res.item[0].productId, res.item[0].description);
                        ctl.setValue(res.item[0].productId);
                        
                        $$('eb-invoiceLineItemGLExpense').setValue(res.item[0].glExpenseAccountName);
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].productId, res.item[i].description);
                            ctl.setValue(row.productId);
                            $$('eb-invoiceLineItemGLExpense').setValue(row.product);
                    } else {
                        ctl.forceSelect();
                    }
                }
            });

            Utils.popup_open('invoiceLineItem-popup');

            $$('invoiceLineItemOk').onclick(() => {
                if ($$('eb-invoiceLineItemAmount').isError('Amount'))
                    return;
                if ($$('eb-invoiceLineItemProduct').isError('Product/Service'))
                    return;
                if ($$('eb-invoiceLineItemDescription').isError('Description'))
                    return;

                const item = {
                    product: $$('eb-invoiceLineItemProduct').getLabel(),
                    productServiceId: $$('eb-invoiceLineItemProduct').getValue(),
                    amount: $$('eb-invoiceLineItemAmount').getValue(),
                    amountFormatted: Utils.format($$('eb-invoiceLineItemAmount').getValue(), 'D', 0, 2),
                    description: $$('eb-invoiceLineItemDescription').getValue(),
                    id: ''
                }
                invoiceLineItemsGrid.updateSelectedRecord(item);
                Utils.popup_close();
            });
            $$('invoiceLineItemCancel').onclick(Utils.popup_close);
        });
        $$('invoiceLineItemsDelete').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Line Item?', () => {
                invoiceLineItemsGrid.deleteSelectedRows();
            });
        });

        $$('invoiceAdjustmentsAdd').onclick(() => {
            $$('eb-invoiceAdjustmentsDate').clear();
            $$('eb-invoiceAdjustmentsAmount').clear();
            $$('eb-invoiceAdjustmentsInvoiceId').setValue('generate on save)');
            $$('eb-invoiceAdjustmentsDescription').clear();
            Utils.popup_open('invoiceAdjustments-popup');

            $$('invoiceAdjustmentsUseInvoiceDescription').onclick(() => {
                $$('eb-invoiceAdjustmentsDescription').setValue( $$('eb-invoiceDescription').getValue());
            });

            $$('invoiceAdjustmentsOk').onclick(() => {
                if ($$('eb-invoiceAdjustmentsDate').isError('Date'))
                    return;
                if ($$('eb-invoiceAdjustmentsAmount').isError('Amount'))
                    return;
                if ($$('eb-invoiceAdjustmentsDescription').isError('Description'))
                    return;

                const item = {
                    date: $$('eb-invoiceAdjustmentsDate').getIntValue(),
                    dateFormatted: DateUtils.intToStr4($$('eb-invoiceAdjustmentsDate').getIntValue()),
                    amount: $$('eb-invoiceAdjustmentsAmount').getValue(),
                    amountFormatted: Utils.format($$('eb-invoiceAdjustmentsAmount').getValue(), 'D', 0, 2),
                    description: $$('eb-invoiceAdjustmentsDescription').getValue(),
                    id: ''
                }
                invoiceAdjustmentsGrid.addRecord(item);
                Utils.popup_close();
            });
            $$('invoiceAdjustmentsCancel').onclick(Utils.popup_close);

        });
        $$('invoiceAdjustmentsEdit').onclick(() => {
            const row = invoiceAdjustmentsGrid.getSelectedRow();
            $$('eb-invoiceAdjustmentsDate').setValue(row.dateFormatted);
            $$('eb-invoiceAdjustmentsAmount').setValue(row.amount);
            $$('eb-invoiceAdjustmentsInvoiceId').setValue('generate on save)');
            $$('eb-invoiceAdjustmentsDescription').setValue(row.description);
            Utils.popup_open('invoiceAdjustments-popup');

            $$('invoiceAdjustmentsOk').onclick(() => {
                if ($$('eb-invoiceAdjustmentsDate').isError('Date'))
                    return;
                if ($$('eb-invoiceAdjustmentsAmount').isError('Amount'))
                    return;
                if ($$('eb-invoiceAdjustmentsDescription').isError('Description'))
                    return;

                const item = {
                    date: $$('eb-invoiceAdjustmentsDate').getIntValue(),
                    dateFormatted: DateUtils.intToStr4($$('eb-invoiceAdjustmentsDate').getIntValue()),
                    amount: $$('eb-invoiceAdjustmentsAmount').getValue(),
                    amountFormatted: Utils.format($$('eb-invoiceAdjustmentsAmount').getValue(), 'D', 0, 2),
                    description: $$('eb-invoiceAdjustmentsDescription').getValue(),
                    id: ''
                }
                invoiceAdjustmentsGrid.updateSelectedRecord(item);
                Utils.popup_close();
            });
        });
        $$('invoiceAdjustmentsDelete').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Adjustment?', () => {
                invoiceAdjustmentsGrid.deleteSelectedRows();
            });
        });

        $$('invoiceOk').onclick(() => {
            if ($$('eb-invoiceDescription').isError('Description'))
                    return;
            if ($$('eb-invoiceDate').isError('Date'))
                return;
            if ($$('eb-invoiceARAccount').isError('A/R Account'))
                return;

            const params = {
                date: $$('eb-invoiceDate').getIntValue(),
                description: $$('eb-invoiceDescription').getValue(),
                glAccountId: $$('eb-invoiceARAccount').getValue(),
                lines: invoiceLineItemsGrid.getAllRows(),
                adjustments: invoiceAdjustmentsGrid.getAllRows(),
                personId: personId
            }
            AWS.callSoap(WS, 'newInvoice', params).then(function (res) {
                if (res.wsStatus === "0") {
                    loadBilling();
                    searchInvoices();
                    searchPayments();
                    searchAdjustments();
                    Utils.popup_close();
                }
            });
        });
        $$('invoiceCancel').onclick(Utils.popup_close)
    });
    $$('invoicesReport').onclick(() => {
        const params = {
            excludeZeroBalance: $$('eb-invoicesLimit').getValue(),
            fromDate: $$('eb-invoicesFromDate').getIntValue(),
            personId: personId,
            toDate: $$('eb-invoicesToDate').getIntValue(),
        } 
        AWS.callSoap(WS, 'getInvoiceReport', params).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });



    let paymentApplicationsGrid;
    const paymentApplicationsColumnDefs = [
        {headerName: "Date", field: "dateFormatted", type: 'numericColumn', width: 80},
        {headerName: "Total", field: "total", type: 'numericColumn', width: 120},
        {headerName: "Applied", field: "applied", type: 'numericColumn', width: 120},
        {headerName: "Balance", field: "balance", type: 'numericColumn', width: 120},
        {headerName: "Invoice ID", field: "invoiceId", type: 'numericColumn', width: 120},
        {headerName: "Description", field: "description", width: 140}
    ];
    paymentApplicationsGrid = new AGGrid('paymentApplicationsGrid', paymentApplicationsColumnDefs);
    paymentApplicationsGrid.show();

    let paymentApplicationInvoicesGrid;
    const paymentApplicationInvoicesColumnDefs = [
        {headerName: "Date", field: "dateFormatted", type: 'numericColumn', width: 80},
        {headerName: "Total", field: "total", type: 'numericColumn', width: 80},
        {headerName: "Invoice ID", field: "invoiceId", type: 'numericColumn', width: 120},
        {headerName: "Balance", field: "balance", type: 'numericColumn', width: 100},
        {headerName: "Description", field: "description", width: 160}
    ];
    paymentApplicationInvoicesGrid = new AGGrid('paymentApplicationInvoicesGrid', paymentApplicationInvoicesColumnDefs);
    paymentApplicationInvoicesGrid.show();

    
    $$('paymentsAdd').onclick(() => {
        $$('paymentAction').setValue('Add');

        $$('eb-paymentDate').clear();
        $$('eb-paymentAmount').clear();
        $$('eb-paymentApplied').clear();
        $$('eb-paymentUnapplied').clear();
        $$('eb-paymentSource').setValue('C');
        $$('eb-paymentCheckNumber').enable().clear();
        $$('eb-paymentDescription').disable().clear();

        $$('paymentApplicationsEdit').disable();
        $$('paymentApplicationsDelete').disable();
        
        Utils.popup_open('payment-popup');

        $$('eb-paymentSource').onChange(() => {
            if ($$('eb-paymentSource').getValue() === 'C') {
                $$('eb-paymentCheckNumber').enable();
                $$('eb-paymentDescription').disable();
            } else {
                $$('eb-paymentCheckNumber').disable();
                $$('eb-paymentDescription').enable();
            }   
        });

        function searchInvoicesForPayment() {
            const params = {
                fromDate: $$('paymentApplicationFromDate').getIntValue(),
                paymentId: '',
                toDate: $$('paymentApplicationToDate').getIntValue(),
                personId: personId
            }
            AWS.callSoap(WS, 'searchInvoicesForPayment', params).then(data => {    
                paymentApplicationInvoicesGrid.clear();

                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        data.item[i].dateFormatted = data.item[i].date !== '0' ? DateUtils.intToStr4(data.item[i].date) : '';
                    }
                    paymentApplicationInvoicesGrid.addRecords(data.item);     
                }     
            });
        }

        $$('paymentApplicationsAdd').onclick(() => {
            searchInvoicesForPayment();

            $$('paymentApplicationFromDate').clear();
            $$('paymentApplicationToDate').clear();
            $$('paymentApplicationInvoiceId').clear();
            $$('paymentApplicationTotal').clear();
            $$('paymentApplicationBalance').clear();
            $$('paymentApplicationAmount').clear();
            $$('paymentApplicationAvailable').clear();
            $$('paymentApplicationToApply').clear();
            
            Utils.popup_open('paymentApplication-popup');

            $$('paymentApplicationsCancel').onclick(Utils.popup_close);
        });
        function editPaymentApplications() {
            
        }
        $$('paymentApplicationsEdit').onclick(editPaymentApplications);
        $$('paymentApplicationsDelete').onclick();

        $$('paymentOk').onclick(() => {
            if ($$('eb-paymentDate').isError('Date'))
                return;
            if ($$('eb-paymentAmount').isError('Amount'))
                return;
            if ($$('eb-paymentSource').getValue() === 'C') {
                if ($$('eb-paymentCheckNumber').isError('Check Number'))
                    return;
            } else {
                if ($$('eb-paymentDescription').isError('Description'))
                    return;
            }   

            const params = {
                amount: $$('eb-paymentAmount').getValue(),
                date: $$('eb-paymentDate').getIntValue(),
                description: $$('eb-paymentSource').getValue() === 'C' ? $$('eb-paymentCheckNumber').getValue() : $$('eb-paymentDescription').getValue(),
                personId: personId,
                type: $$('eb-paymentSource').getValue()
            }
            AWS.callSoap(WS, 'newPayment', params).then(data => {    
                if (data.wsStatus === "0") {
                    loadBilling();
                    searchInvoices();
                    searchPayments();
                    searchAdjustments();
                    Utils.popup_close();
                }     
            });
        });

        $$('paymentCancel').onclick(() => {
            loadBilling();
            Utils.popup_close();
        });
    });    
    function editPayment() {
        const row = paymentsGrid.getSelectedRow();

        $$('paymentAction').setValue('Edit');

        $$('eb-paymentDate').setValue(row.date);
        $$('eb-paymentAmount').setValue(row.amount);
        $$('eb-paymentApplied').clear();
        $$('eb-paymentUnapplied').setValue(row.balance);
        $$('eb-paymentSource').setValue(row.type);
        $$('eb-paymentCheckNumber').setValue(row.type === 'C' ? row.description : '');
        $$('eb-paymentDescription').setValue(row.type === 'D' ? row.description : '');

        if (row.type === 'C') {
            $$('eb-paymentCheckNumber').enable();
            $$('eb-paymentDescription').disable();
        } else {
            $$('eb-paymentCheckNumber').disable();
            $$('eb-paymentDescription').enable();
        }   

        $$('paymentApplicationsEdit').disable();
        $$('paymentApplicationsDelete').disable();
        
        Utils.popup_open('payment-popup');

        $$('eb-paymentSource').onChange(() => {
            if ($$('eb-paymentSource').getValue() === 'C') {
                $$('eb-paymentCheckNumber').enable();
                $$('eb-paymentDescription').disable();
            } else {
                $$('eb-paymentCheckNumber').disable();
                $$('eb-paymentDescription').enable();
            }   
        });

        $$('paymentOk').onclick(() => {
            if ($$('eb-paymentDate').isError('Date'))
                return;
            if ($$('eb-paymentAmount').isError('Amount'))
                return;
            if ($$('eb-paymentSource').getValue() === 'C') {
                if ($$('eb-paymentCheckNumber').isError('Check Number'))
                    return;
            } else {
                if ($$('eb-paymentDescription').isError('Description'))
                    return;
            }   

            const params = {
                amount: $$('eb-paymentAmount').getValue(),
                date: $$('eb-paymentDate').getIntValue(),
                description: $$('eb-paymentSource').getValue() === 'C' ? $$('eb-paymentCheckNumber').getValue() : $$('eb-paymentDescription').getValue(),
                id: row.id,
                personId: personId,
                type: $$('eb-paymentSource').getValue()
            }
            AWS.callSoap(WS, 'savePayment', params).then(data => {    
                if (data.wsStatus === "0") {
                    loadBilling();
                    searchInvoices();
                    searchPayments();
                    searchAdjustments();
                    Utils.popup_close();
                }     
            });
        });

        $$('paymentCancel').onclick(() => {
            loadBilling();
            Utils.popup_close();
        });
    }
    $$('paymentsEdit').onclick(editPayment);
    $$('paymentsDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Payment?', () => {
            const params = {
                ids: paymentsGrid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deletePayments", params).then(data => {
                if (data.wsStatus === '0') {
                    loadBilling();
                    searchInvoices();
                    searchPayments();
                    searchAdjustments();
                }
            });
        });
    });
    $$('paymentsReport').onclick(() => {
        const params = {
            excludeZeroBalance: $$('eb-paymentsLimit').getValue(),
            fromDate: $$('eb-paymentsFromDate').getIntValue(),
            personId: personId,
            toDate: $$('eb-paymentsToDate').getIntValue(),
        }
        AWS.callSoap(WS, 'getPaymentReport', params).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('adjustmentsReport').onclick(() => {
        const params = {
            fromDate: $$('eb-adjustmentsFromDate').getIntValue(),
            personId: personId,
            toDate: $$('eb-adjustmentsToDate').getIntValue(),
        }

        AWS.callSoap(WS, 'getAdjustmentReport', params).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });
    
})();
