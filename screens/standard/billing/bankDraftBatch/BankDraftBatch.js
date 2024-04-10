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
    const WS = 'StandardBillingBankDraftBatch';

    function checkRight() {
        AWS.callSoap(WS, 'checkRight').then(function (res) {
            if (res.wsStatus === "0") {
            }
        });
    }

    checkRight();

    let batchesGrid;

    let employeeGrid;

    const batchesColumnDefs = [
        {headerName: "People", field: "personCount", type: 'numericColumn', width: 250},
        {headerName: "Description", field: "description", width: 1000},
    ];

    const employeeColumnDefs = [
        {headerName: "Last Name", field: "lastName", width: 250},
        {headerName: "First Name", field: "firstName", width: 250},
        {headerName: "Middle Name", field: "middleName", width: 250},
        {headerName: "SSN", field: "ssn", type: 'numericColumn', width: 250},
        {headerName: "Type", field: "type", width: 1000},
    ];

    batchesGrid = new AGGrid('batchesGrid', batchesColumnDefs);
    employeeGrid = new AGGrid('employeeGrid', employeeColumnDefs);

    batchesGrid.show();
    employeeGrid.show();

    function getListBatches() {
        $$('edit').disable();
        $$('delete').disable();
        $$('history').disable();
        $$('post').disable();
        $$('report').disable();
        $$('filter').disable();

        AWS.callSoap(WS, 'listBatches').then(data => {
            batchesGrid.clear();
            $$('empAdd').disable();
            employeeGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                batchesGrid.addRecords(data.item);     

                $$('batches-label').setValue('Displaying ' + data.item.length + ' Bank Draft Batches');

                batchesGrid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('delete').enable(rows);
                    $$('history').enable(rows);
                    $$('post').enable(rows);
                    $$('report').enable(rows);
                    $$('filter').enable(rows);
                    $$('empAdd').enable(rows);
                    searchPersonsForBatch();
                });
                batchesGrid.setOnRowDoubleClicked(editBatch);
            }     
        });
    }

    function searchPersonsForBatch() {
        $$('empRemove').disable();
        employeeGrid.clear();

        const params = filters;
        const row = batchesGrid.getSelectedRow();
        if (!row)
            return;
        params.id = row.id;

        AWS.callSoap(WS, 'searchPersonsForBatch', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                employeeGrid.addRecords(data.item);     

                $$('employees-label').setValue('Displaying ' + data.item.length + ' Employees/Dependents');

                employeeGrid.setOnSelectionChanged(() => {
                    $$('empRemove').enable();
                });
            }     
        });
    }

    getListBatches();

    $$('add').onclick(() => {
        $$('bdb-description').clear();
        $$('bdb-applyToAll').clear();
        $$('batches-action-label').setValue('Add');

        checkRight();

        Utils.popup_open('batch-popup', 'bdb-description');

        $$('batchOk').onclick(() => {
            if ($$('bdb-description').isError('Description'))
                return;

            const params = {
                description: $$('bdb-description').getValue(),
                allCompanies: $$('bdb-applyToAll').getValue()
            } 
            AWS.callSoap(WS, 'newBatch', params).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_close();
                    getListBatches();
                }
            });
            
        });

        $$('batchCancel').onclick(Utils.popup_close);
    });

    function editBatch() {
        const row = batchesGrid.getSelectedRow();
        $$('bdb-description').setValue(row.description);
        $$('bdb-applyToAll').setValue(row.allCompanies === 'true');

        $$('batches-action-label').setValue('Edit');

        Utils.popup_open('batch-popup', 'bdb-description');

        $$('batchOk').onclick(() => {
            if ($$('bdb-description').isError('Description'))
                return;

            const params = {
                id: row.id,
                description: $$('bdb-description').getValue(),
                allCompanies: $$('bdb-applyToAll').getValue()
            } 
            AWS.callSoap(WS, 'saveBatch', params).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.popup_close();
                    getListBatches();
                }
            });
            
        });

        $$('batchCancel').onclick(Utils.popup_close);
    }
    $$('edit').onclick(editBatch);
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Bank Draft Batch?', () => {
            const data = {
                ids: batchesGrid.getSelectedRow().id
            };
            
            AWS.callSoap(WS, "deleteBatches", data).then(function (res) {
                if (res.wsStatus === '0') {
                    getListBatches();
                }
            });            
        });
    });

    let batchHistoryGrid;

    const batchHistoryColumnDefs = [
        {headerName: "Date", field: "date", type: 'numericColumn', width: 100},
        {headerName: "Amount", field: "amount", type: 'numericColumn', width: 100},
        {headerName: "Description", field: "description", width: 400},
    ];
    batchHistoryGrid = new AGGrid('batchHistoryGrid', batchHistoryColumnDefs);
    batchHistoryGrid.show();

    $$('history').onclick(() => {
        const row = batchesGrid.getSelectedRow();
        $$('bdb-historyDescription').setValue(row.description);

        const params = {
            id: row.id
        }

        AWS.callSoap(WS, "listBatchHistory", params).then(function (data) {
            batchHistoryGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                batchHistoryGrid.addRecords(data.item);     

                $$('batchHistory-label').setValue('Displaying ' + data.item.length + ' Posts');
            }   
        });  
        Utils.popup_open('history-popup');

        $$('batchHistoryCancel').onclick(Utils.popup_close);
    });

    $$('post').onclick(() => {
        const row = batchesGrid.getSelectedRow();
        $$('bdb-postDescription').setValue(row.description);
        $$('bdb-postDate').setValue(DateUtils.today());
        $$('bdb-postPeople').setValue(row.personCount);
        $$('bdb-postAmount').clear();
        $$('bdb-postRefNumber').clear();

        const params = {
            id: row.id
        }

        AWS.callSoap(WS, "getBatchAmount", params).then(function (data) {
            batchHistoryGrid.clear();
            if (data.wsStatus === "0") {                
                $$('bdb-postAmount').setValue(data.amount);
            }   
        });  

        Utils.popup_open('post-popup');

        $$('postOk').onclick(() => {
            if ($$('bdb-postDate').isError('Date'))
                return;
            Utils.yesNo('Confirmation', 'You are about to Post Batch ' + row.description + ' on ' + $$('bdb-postDate').getIntValue() + 
                ' in the amount of $' + $$('bdb-postAmount').getValue() + '. ' + row.personCount + 
                ' Employees/Dependents will be affected. Are you sure?', () => {
                const data = {
                    amountCheck: $$('bdb-postAmount').getValue(),
                    confirmationNumber: $$('bdb-postRefNumber').getValue(),
                    date: $$('bdb-postDate').getIntValue(),
                    id: row.id
                };
                
                AWS.callSoap(WS, "postBatch", data).then(function (res) {
                    if (res.wsStatus === '0') {
                        getListBatches();
                        Utils.showMessage('Information', 'Batch Posted successfully.');
                    }
                });            
            });
        });

        $$('postCancel').onclick(Utils.popup_close);
    });
    $$('report').onclick(() => {
        const params = {
            id: batchesGrid.getSelectedRow().id
        } 
        AWS.callSoap(WS, 'getReport', params).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    let filters = {
        firstName: '',
        firstNameSearchType: 2,
        lastName: '',
        lastNameSearchType: 2,
        searchType: 0
    }

    $$('filter').onclick(() => {
        bindToEnum('bdb-filter-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('bdb-filter-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        function resetFilters() {
            $$('bdb-filter-lname-criteria').setValue('2');
            $$('bdb-filter-fname-criteria').setValue('2');
            $$('bdb-filter-lname-search').clear();
            $$('bdb-filter-fname-search').clear();
            $$('bdb-filter-search-type').setValue('0');
        }

        $$('bdb-filter-lname-criteria').setValue(filters.lastNameSearchType);
        $$('bdb-filter-fname-criteria').setValue(filters.firstNameSearchType);
        $$('bdb-filter-lname-search').setValue(filters.lastName);
        $$('bdb-filter-fname-search').setValue(filters.firstName);
        $$('bdb-filter-search-type').setValue(filters.searchType);

        $$('filterReset').onclick(resetFilters);

        Utils.popup_open('filter-popup');

        $$('filterOk').onclick(() => {
            let tmp = '';
            if ($$('bdb-filter-lname-search').getValue() !== '') 
                tmp += '<strong>Last Name:</strong> *' + $$('bdb-filter-lname-search').getValue() + '*,';

            if ($$('bdb-filter-fname-search').getValue() !== '') 
                tmp += '<strong>First Name:</strong> *' + $$('bdb-filter-fname-search').getValue() + '*,';

            if ($$('bdb-filter-search-type').getValue() !== '0') 
                tmp += '<strong>Search Type:</strong> *' + $$('bdb-filter-search-type-label' + $$('bdb-filter-search-type').getValue()).getValue() + '*,';

            if (tmp === '') {
                $$('filter-label').setValue('(not filtered)');
            } else {
                $$('filter-label').setHTMLValue(tmp.substring(0, tmp.length - 1));
            }

            filters.lastNameSearchType = $$('bdb-filter-lname-criteria').getValue();
            filters.firstNameSearchType = $$('bdb-filter-fname-criteria').getValue();
            filters.lastName = $$('bdb-filter-lname-search').getValue();
            filters.firstName = $$('bdb-filter-fname-search').getValue();
            filters.searchType = $$('bdb-filter-search-type').getValue();

            Utils.popup_close();

            searchPersonsForBatch();
        });

        $$('filterCancel').onclick(Utils.popup_close);        
    });

    let employeeAddGrid;

    const employeeAddColumnDefs = [
        {headerName: "Last Name", field: "lastName", width: 150},
        {headerName: "First Name", field: "firstName", width: 150},
        {headerName: "Middle Name", field: "middleName", width: 150},
        {headerName: "SSN", field: "ssn", type: 'numericColumn', width: 100},
        {headerName: "Type", field: "type", width: 50},
        {headerName: "In Another Batch", field: "existsInOtherBatchFormatted", width: 150},
    ];
    employeeAddGrid = new AGGrid('employeeAddGrid', employeeAddColumnDefs);
    employeeAddGrid.multiSelect();
    employeeAddGrid.show();

    function searchEmployees() {
        bindToEnum('bdb-addEmployee-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('bdb-addEmployee-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        function resetSearch() {
            $$('bdb-addEmployee-lname-criteria').setValue('2');
            $$('bdb-addEmployee-fname-criteria').setValue('2');
            $$('bdb-addEmployee-lname-search').clear();
            $$('bdb-addEmployee-fname-search').clear();
            $$('bdb-addEmployee-search-type').setValue('0');
            $$('addEmployeeOk').disable();
        }
        $$('addEmployeeReset').onclick(resetSearch);

        $$('addEmployeeSearch').onclick(() => {
            $$('addEmployeeOk').disable();
            const params = {
                lastNameSearchType: $$('bdb-filter-lname-criteria').getValue(),
                firstNameSearchType: $$('bdb-filter-fname-criteria').getValue(),
                lastName: $$('bdb-filter-lname-search').getValue(),
                firstName: $$('bdb-filter-fname-search').getValue(),
                searchType: $$('bdb-filter-search-type').getValue(),
                id: batchesGrid.getSelectedRow().id
            }

            AWS.callSoap(WS, "searchPersonsNotForBatch", params).then(function (data) {
                employeeAddGrid.clear();
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        data.item[i].existsInOtherBatchFormatted = data.item[i].existsInOtherBatch === 'true' ? 'Yes' : 'No';

                    }
                    employeeAddGrid.addRecords(data.item);

                    employeeAddGrid.setOnSelectionChanged($$('addEmployeeOk').enable);

                    $$('employeeAdd-label').setValue('Displaying ' + data.item.length + ' Employyes/Dependents');
                }
            });
        });

        function addEmployee() {
            const rows = employeeAddGrid.getSelectedRows();
            const ids = [];
            for (let i = 0; i < rows.length; i++) {
                ids.push(rows[i].id);
            }
            const params = {
                id: batchesGrid.getSelectedRow().id,
                ids: ids
            }

            AWS.callSoap(WS, "addPersonsToBatch", params).then(function (data) {
                if (data.wsStatus === "0") {
                    Utils.showMessage('Information', ids.length + ' Employee/Dependent added to Bank Draft Batch successfully.');
                    searchPersonsForBatch();
                    Utils.popup_close();
                }
            });
        }

        $$('addEmployeeOk').onclick(addEmployee);

        $$('addEmployeeCancel').onclick(Utils.popup_close);

        Utils.popup_open('addEmployee-popup');
    }

    $$('empAdd').onclick(searchEmployees);

    $$('empRemove').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to remove the Employee/Dependent?', () => {
            const data = {
                id: batchesGrid.getSelectedRow().id,
                ids: employeeGrid.getSelectedRow().id
            };
            
            AWS.callSoap(WS, "removePersonsFromBatch", data).then(function (res) {
                if (res.wsStatus === '0') {
                    searchPersonsForBatch();
                }
            });            
        });
    });
})();
