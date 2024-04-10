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

    const WS = "StandardBillingCreateTimesheetInvoice";
    let gridLimit = 0;
    let billable = '1';  // 1=Billable / 2=Non-billable / 0=Either
    let selectedCompany;
    let timesheetStartDate = 0;
    let timesheetEndDate = 0;
    let selectedProjectId = '';
    let selectedPersonId = '';
    let selectedProjectName = '';
    let selectedPersonName = '';
    let getAll = false;
    let invoiceLines = [];  // each element is an array of timesheet rows that apply to the line
    let lineNumber = 1;

    let columnDefs = [
        {headerName: 'Reference', field: 'externalReference', sortable: true, width: 130  },
        {headerName: 'Project ID', field: 'projectName', type: "numericColumn", sortable: true, width: 120 },
        {headerName: 'Billing', field: 'billable2', sortable: true, width: 120 },
        {headerName: 'Rate', field: 'billingRate2', type: "numericColumn", sortable: true, width: 100 },
        {headerName: 'Date', field: 'workDate2', type: "numericColumn", sortable: true, width: 130 },
        {headerName: 'Hours', field: 'totalHours2', type: "numericColumn", sortable: true, width: 100 },
        {headerName: 'Description', field: 'timeDescription', sortable: true, width: 400 },
        {headerName: 'Last Name', field: 'lastName', sortable: true, width: 200 },
        {headerName: 'First Name', field: 'firstName', sortable: true, width: 200 }
    ];

    const tsGrid = new AGGrid('timesheet-grid', columnDefs, 'timesheetId');
    tsGrid.multiSelect();
    tsGrid.show();
    tsGrid.setOnSelectionChanged(function (rows) {
        $$('add').enable(rows);
        $$('reject').enable(rows);
        $$('defer').enable(rows);
    });

    columnDefs = [
        {headerName: 'Service', field: 'service', sortable: true, width: 150  },
        {headerName: 'Hours', field: 'hours2', type: "numericColumn", sortable: true, width: 180 },
        {headerName: 'Rate', field: 'rate2', type: "numericColumn", sortable: true, valueFormatter:  AGGrid.numericFormat, mask:  'CBPD', decimalPlaces: 2, width: 180 },
        {headerName: 'Amt', field: 'amount2', type: "numericColumn", sortable: true, valueFormatter:  AGGrid.numericFormat, mask:  'CBPD', decimalPlaces: 2, width: 230 },
        {headerName: 'Adj Hours', field: 'adjustedHours2', type: "numericColumn", sortable: true, valueFormatter:  AGGrid.numericFormat, mask:  'CBPD', decimalPlaces: 2, width: 180 },
        {headerName: 'Adj Rate', field: 'adjustedRate2', type: "numericColumn", sortable: true, valueFormatter:  AGGrid.numericFormat, mask:  'CBPD', decimalPlaces: 2, width: 180 },
        {headerName: 'Adj Amt', field: 'adjustedAmount2', type: "numericColumn", sortable: true, valueFormatter:  AGGrid.numericFormat, mask:  'CBPD', decimalPlaces: 2, width: 230 },
        {headerName: 'Description', field: 'description', sortable: true, width: 1000 }
    ];

    const lineGrid = new AGGrid('line-grid', columnDefs, 'lineNumber');
    lineGrid.show();
    updateLineTotals();

    function getExcludedInvoiceIds() {
        const eids = [];
        for (let i=0 ; i < invoiceLines.length ; i++) {
            let timesheets = invoiceLines[i].timesheets;
            for (let j=0 ; j < timesheets.length ; j++)
                eids.push(timesheets[j].timesheetId);
        }
        return eids;
    }

    function updateTimesheetGrid() {
        $$('add').disable();
        $$('reject').disable();
        $$('defer').disable();
        tsGrid.clear();
        if (!selectedCompany) {
            $$('get-all').disable();
            $$('refresh').disable();
            $$('add-manual-line').disable();
            return;
        }
        $$('get-all').enable();
        $$('refresh').enable();
        $$('add-manual-line').enable();
        const data = {
            billableItemsIndicator: Utils.toNumber(billable),
            companyId: selectedCompany,
            getAll: getAll,
            personId: selectedPersonId,
            projectId: selectedProjectId,
            searchMeta: {
                firstItemIndexPaging: 0,
                sortAsc: true,
                sortField: 'projectName',
                usingPaging: !getAll
            },
            timesheetEndDate: timesheetEndDate,
            timesheetStartDate: timesheetStartDate,
            excludedTimesheetIds: getExcludedInvoiceIds()
        };
        if (getAll)
            Utils.waitMessage('Downloading Timesheets; Please wait.');
        AWS.callSoap(WS, 'searchBillableTimesheets', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const rows = [];
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.billingRate2 = Utils.format(Utils.toNumber(row.billingRate), "DCB", 0, 2);
                    row.workDate2 = DateUtils.intToStr4(Utils.toNumber(row.workDate));
                    row.totalHours2 = Utils.format(Utils.toNumber(row.totalHours), "C", 0, 2);
                    row.billable2 = row.billable === 'N' ? 'Non-billable' : (row.billingType === 'H' ? 'Hourly' : 'Project');
                    rows.push(row);
                }
                tsGrid.addRecords(rows);
                if (!getAll  &&  res.item.length === res.searchMeta.itemsPerPage)
                    $$('record-status').setValue(Utils.format(res.item.length, "C", 0 , 0) + " records (incomplete)");
                else
                    $$('record-status').setValue(Utils.format(res.item.length, "C", 0 , 0) + " records (complete)");
                $$('refresh').enable();
                if (res.item.length) {
                    $$('filter').enable();
                    $$('get-all').enable();
                }
                if (getAll)
                    Utils.waitMessageEnd();
            }
        });
    }

    $$('get-all').onclick(function () {
        getAll = !getAll;
        if (getAll)
            $$('get-all').setValue('Get Page');
        else
            $$('get-all').setValue('Get All');
        updateTimesheetGrid();
    });

    $$('refresh').onclick(updateTimesheetGrid);

    $$('company-selection').setSelectFunction(function () {
        $$('cs-ok').disable();
        Utils.popup_open('company-search-popup');

        const columnDefs = [
            {headerName: 'Company Name', field: 'name', width: 200  },
            {headerName: 'ID', field: 'identifier', type: "numericColumn", width: 100 },
            {headerName: 'Type', field: 'type', width: 75 },
            {headerName: 'Billable', field: 'billable', width: 75 }
        ];
        const grid = new AGGrid('cs-company-grid', columnDefs, 'orgGroupId');
        grid.show();
        reset();

        $$('cs-search').onclick(() => {
            Utils.waitMessage('Retrieving clients; Please wait.')
            const data = {
                billableFromDate: $$('billable-date').getIntValue(),
                billableItemsIndicator: $$('outstanding-billables').getValue(),
                identifier: $$('cs-id').getValue(),
                identifierSearchType: $$('cs-id-type').getValue(),
                name: $$('cs-name').getValue(),
                nameSearchType: $$('cs-name-type').getValue()
            };
            AWS.callSoap(WS, 'searchCompanies', data).then(function (res) {
                Utils.waitMessageEnd();
                if (res.wsStatus === "0") {
                    const lst = res.item = Utils.assureArray(res.item);
                    grid.clear();
                    grid.addRecords(lst);
                    $$('cs-status').setValue('Displaying ' + lst.length + ' companies.').setColor('black');
                }
            });
        });

        function reset() {
            $$('cs-name-type').setValue("2");
            $$('cs-name').clear();
            $$('cs-id').clear();
            $$('cs-id-type').setValue("2");
            $$('outstanding-billables').clear();
            grid.clear();
            $$('cs-ok').disable();
        }

        $$('cs-reset').onclick(reset);
        reset();

        grid.setOnSelectionChanged(function (rows) {
            $$('cs-ok').enable(rows);
        });

        function select() {
            let row = grid.getSelectedRow();
            $$('company-selection').setValue(row.orgGroupId, row.name);
            selectedCompany = row.orgGroupId;
            updateTimesheetGrid();
            Utils.popup_close();
        }
        grid.setOnRowDoubleClicked(select);
        $$('cs-ok').onclick(select);

        $$('cs-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    function updateFilteredMessage() {
        let msg = billable !== '0' || timesheetStartDate || timesheetEndDate
        ? '(filtered)' : '(unfiltered)';
        $$('filter-status').setValue(msg);
    }

    function searchCompanies() {
        Utils.waitMessage('Retrieving clients; Please wait.');
        const data = {
                billableFromDate: $$('billable-date').getIntValue(),
                billableItemsIndicator: 0,
                identifier: "",
                identifierSearchType: 0,
                name: "",
                nameSearchType: 0
            };
        AWS.callSoap(WS, 'searchCompanies', data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                gridLimit = res.highCap;
                const ctl = $$('company-selection');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].orgGroupId, res.item[0].name);
                } else if (res.item.length <= res.lowCap) {
                    ctl.add('', '(choose)').useDropdown(res.item, 'orgGroupId', 'name');
                } else {
                    ctl.forceSelect();
                }
                updateFilteredMessage();
            }
        });
    }

    searchCompanies();

    $$('billable-date').onChange(searchCompanies);

    $$('filter').onclick(function () {
        Utils.popup_open('filter-popup');
        $$('project-selection').forceSelect();
        let data = {
            firstName: null,
            firstNameSearchType: 0,
            lastName: null,
            lastNameSearchType: 0,
            personId: null
        };
        AWS.callSoap(WS, 'searchEmployees', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('person-selection');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    let name = res.item[0].lastName + ", " + res.item[0].firstName + " " + res.item[0].middleName;
                    ctl.singleValue(res.item[0].employeeId, name);
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i=0 ; i < res.item.length ; i++) {
                        let name = res.item[i].lastName + ", " + res.item[i].firstName + " " + res.item[i].middleName;
                        ctl.add(res.item[i].employeeId, name);
                    }
                    $$('person-selection').setValue(selectedPersonId);
                } else {
                    ctl.forceSelect();
                    $$('person-selection').setValue(selectedPersonId, selectedPersonName);
                }
            }
        });

        $$('fp-billable').setValue(billable);
        $$('fp-start-date').setValue(timesheetStartDate);
        $$('fp-end-date').setValue(timesheetEndDate);
        $$('project-selection').setValue(selectedProjectId, selectedProjectName);

        $$('person-selection').setSelectFunction(async function () {
            let res = await Utils.component('workerSelection/WorkerSelection', 'component-worker-selection');
            if (res._status === "ok") {
                let name = res.lname + ", " + res.fname + " " + res.mname;
                $$('person-selection').setValue(res.employeeId, name);
            }
        });
        $$('project-selection').setSelectFunction(async function () {
            let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
            if (res._status === "ok") {
                $$('project-selection').setValue(res.projectId, res.summary);
            }
        });

        $$('fp-ok').onclick(function () {
            Utils.popup_close();
            billable = $$('fp-billable').getValue();
            timesheetStartDate = $$('fp-start-date').getIntValue();
            timesheetEndDate = $$('fp-end-date').getIntValue();
            selectedProjectId = $$('project-selection').getValue();
            selectedPersonId = $$('person-selection').getValue();
            selectedProjectName = $$('project-selection').getLabel();
            selectedPersonName = $$('person-selection').getLabel();
            updateFilteredMessage();
            updateTimesheetGrid();
        });

        $$('fp-cancel').onclick(function () {
            Utils.popup_close();
        });

        $$('fp-reset').onclick(function () {
            $$('fp-billable').setValue('1');
            $$('fp-start-date').setValue(0);
            $$('fp-end-date').setValue(0);
            $$('person-selection').setValue('', '(choose)');
            $$('project-selection').setValue('', '(choose)');
        });
    });

    function updateLineTotals() {
        let otot = 0;
        let atot = 0;
        let rows = lineGrid.getAllRows();
        for (let i=0 ; i < rows.length ; i++) {
            const r = rows[i];
            if (r.type !== 'P') {
                otot += r.amount;
                atot += r.adjustedAmount;
            } else {
                otot += r.lineAmount;
                atot += r.lineAmount;
            }
        }
        $$('original-total').setValue(otot);
        $$('adjusted-total').setValue(atot);
        if (rows.length)
            $$('invoice').enable();
        else
            $$('invoice').disable();
        if (!lineGrid.getSelectedRow()) {
            $$('edit-line').disable();
            $$('remove-line').disable();
        }
    }

    lineGrid.setOnSelectionChanged(function (rows) {
        $$('edit-line').enable(rows);
        $$('remove-line').enable(rows);
    });

    /**
     *
     * @param rows from top grid (timesheets)
     * @param line from bottom grid (invoice line)
     */
    function addInvoiceSame(rows, line) {
        if (line  &&  !rows)
            rows = line.timesheets;
        if (!rows.length) {
            Utils.showMessage('Error', 'You must select the rows to add to the invoice first.');
            return;
        }
        Utils.popup_open('add-invoice-same-popup');
        const columnDefs = [
            {headerName: 'Reference', field: 'externalReference', width: 90  },
            {headerName: 'Project ID', field: 'projectName', type: "numericColumn", width: 90 },
            {headerName: 'B', field: 'billable', width: 50 },
            {headerName: 'Rate', field: 'billingRate2', type: "numericColumn", width: 80 },
            {headerName: 'Date', field: 'workDate2', width: 100 },
            {headerName: 'Hours', field: 'totalHours2', type: "numericColumn", width: 80 },
            {headerName: 'Description', field: 'timeDescription', width: 250 }
        ];
        const grid = new AGGrid('ais-line-grid', columnDefs, 'timesheetId');
        grid.show();
        grid.addRecords(rows);
        let data;
        if (!line) {
            data = {
                projectId: rows[0].projectId
            };
            AWS.callSoap(WS, 'getProjectSummary', data).then(function (res) {
                if (res.wsStatus === "0") {
                    $$('ais-description').setValue(res.summary);
                }
            });
        } else
            $$('ais-description').setValue(line.description);
        data = {
            accountingSystemId: null,
            accountingSystemIdSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            serviceId: null
        };
        AWS.callSoap(WS, 'searchServices', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('ais-service-items');
                res.item = Utils.assureArray(res.item);
                if (res.item.length === 1) {
                    ctl.clear().add(res.item[0].serviceId, res.item[0].description, res.item[0].glExpenseAccountName).disable();
                } else {
                    ctl.clear().add('', '(choose)');
                    ctl.addItems(res.item, 'serviceId', 'description', 'glExpenseAccountName').enable();
                    ctl.onChange(function (val, lbl, data) {
                        $$('ais-expense-account').setValue(data);
                    });
                }
                if (line) {
                    ctl.setValue(line.serviceId);
                    $$('ais-expense-account').setValue(ctl.getData());
                }
            }
        });
        data = {
            projectIds: rows[0].projectId
        };
        AWS.callSoap(WS, 'getProjectDetail', data).then(function (res) {
            if (res.wsStatus === "0") {
                let eh = Utils.toNumber(res.estimatedHours);
                let ih = Utils.toNumber(res.invoicedHours);
                $$('ais-estimated-hours').setValue(eh);
                $$('ais-invoiced-hours').setValue(ih);
                let diff = eh - ih;
                if (diff < 0)
                    diff = 0;
                $$('ais-remaining-hours').setValue(diff);
                $$('ais-remaining-est-hours').setValue(res.remainingEstimatedHours);
                $$('ais-remaining-est-rate').setValue(res.remainingEstimatedRate);
                $$('ais-remaining-est-amount').setValue(res.remainingEstimatedAmount);
            }
        });
        let thours = 0;
        let tamount = 0;
        for (let i=0 ; i < rows.length ; i++) {
            let hours = Utils.toNumber(rows[i].totalHours);
            let rate = Utils.toNumber(rows[i].billingRate);
            let amount = hours * rate;
            thours += hours;
            tamount += amount;
        }
        $$('ais-ts-hours').setValue(thours);
        $$('ais-ts-rate').setValue(tamount / thours);
        $$('ais-ts-amount').setValue(tamount);
        $$('ais-adj-hours').setValue(thours);
        $$('ais-adj-rate').setValue(tamount / thours);
        $$('ais-adj-amount').setValue(tamount);
        $$('ais-project-id').setValue(rows[0].projectName);
        function updateAmount() {
            $$('ais-adj-amount').setValue($$('ais-adj-hours').getValue() * $$('ais-adj-rate').getValue());
        }
        $$('ais-adj-hours').onChange(updateAmount);
        $$('ais-adj-rate').onChange(updateAmount);
        $$('ais-ok').onclick(function () {
            if ($$('ais-service-items').isError('Service Item'))
                return;
            if (!line) {
                const line2 = {
                    type: 'H',
                    lineAmount: 0,
                    projectId: null,
                    lineNumber: lineNumber,
                    serviceId: $$('ais-service-items').getValue(),
                    service: $$('ais-expense-account').getValue(),
                    hours: $$('ais-ts-hours').getValue(),
                    hours2: Utils.format($$('ais-ts-hours').getValue(), "C", 0, 2),
                    rate: $$('ais-ts-rate').getValue(),
                    rate2: Utils.format($$('ais-ts-rate').getValue(), "CD", 0, 2),
                    amount: $$('ais-ts-amount').getValue(),
                    amount2: Utils.format($$('ais-ts-amount').getValue(), "CD", 0, 2),
                    adjustedHours: $$('ais-adj-hours').getValue(),
                    adjustedHours2: Utils.format($$('ais-adj-hours').getValue(), "C", 0, 2),
                    adjustedRate: $$('ais-adj-rate').getValue(),
                    adjustedRate2: Utils.format($$('ais-adj-rate').getValue(), "CD", 0, 2),
                    adjustedAmount: $$('ais-adj-amount').getValue(),
                    adjustedAmount2: Utils.format($$('ais-adj-amount').getValue(), "CD", 0, 2),
                    description: $$('ais-description').getValue(),
                    timesheets: rows
                };
                lineNumber++;
                invoiceLines.push(line2);
                lineGrid.addRecord(line2);
                Utils.popup_close();
                updateLineTotals();
                updateTimesheetGrid();
            } else {
                line.type = 'H';
                line.lineAmount = 0;
                line.projectId = null;
                line.service = $$('ais-expense-account').getValue();
                line.serviceId = $$('ais-service-items').getValue();
                line.hours = $$('ais-ts-hours').getValue();
                line.hours2 = Utils.format($$('ais-ts-hours').getValue(), "C", 0, 2);
                line.rate = $$('ais-ts-rate').getValue();
                line.rate2 = Utils.format($$('ais-ts-rate').getValue(), "CD", 0, 2);
                line.amount = $$('ais-ts-amount').getValue();
                line.amount2 = Utils.format($$('ais-ts-amount').getValue(), "CD", 0, 2);
                line.adjustedHours = $$('ais-adj-hours').getValue();
                line.adjustedHours2 = Utils.format($$('ais-adj-hours').getValue(), "C", 0, 2);
                line.adjustedRate = $$('ais-adj-rate').getValue();
                line.adjustedRate2 = Utils.format($$('ais-adj-rate').getValue(), "CD", 0, 2);
                line.adjustedAmount = $$('ais-adj-amount').getValue();
                line.adjustedAmount2 = Utils.format($$('ais-adj-amount').getValue(), "CD", 0, 2);
                line.description = $$('ais-description').getValue();
                lineGrid.updateSelectedRecord(line);
                Utils.popup_close();
                updateLineTotals();
            }
        });
        $$('ais-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    /**
     *
     * @param rows from top grid (timesheets)
     * @param line from bottom grid (invoice line)
     */
    function addInvoiceDifferent(rows, line) {
        if (line  &&  !rows)
            rows = line.timesheets;
        Utils.popup_open('add-invoice-different-popup');
        const columnDefs = [
            {headerName: 'Reference', field: 'externalReference', width: 90  },
            {headerName: 'Project ID', field: 'projectName', type: "numericColumn", width: 90 },
            {headerName: 'B', field: 'billable', width: 50 },
            {headerName: 'Rate', field: 'billingRate2', type: "numericColumn", width: 80 },
            {headerName: 'Date', field: 'workDate2', width: 100 },
            {headerName: 'Hours', field: 'totalHours2', type: "numericColumn", width: 80 },
            {headerName: 'Description', field: 'timeDescription', width: 250 }
        ];
        const grid = new AGGrid('aid-line-grid', columnDefs, 'timesheetId');
        grid.show();
        grid.addRecords(rows);
        if (!line)
            $$('aid-description').clear();
        else
            $$('aid-description').setValue(line.description);
        let data = {
            accountingSystemId: null,
            accountingSystemIdSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            serviceId: null
        };
        AWS.callSoap(WS, 'searchServices', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('aid-service-items');
                res.item = Utils.assureArray(res.item);
                if (res.item.length === 1) {
                    ctl.clear().add(res.item[0].serviceId, res.item[0].description, res.item[0].glExpenseAccountName).disable();
                } else {
                    ctl.clear().add('', '(choose)');
                    ctl.addItems(res.item, 'serviceId', 'description', 'glExpenseAccountName').enable();
                    ctl.onChange(function (val, lbl, data) {
                        $$('aid-expense-account').setValue(data);
                    });
                }
                if (line) {
                    ctl.setValue(line.serviceId);
                    $$('aid-expense-account').setValue(ctl.getData());
                }
            }
        });
        if (!line) {
            let thours = 0;
            let tamount = 0;
            for (let i = 0; i < rows.length; i++) {
                let hours = Utils.toNumber(rows[i].totalHours);
                let rate = Utils.toNumber(rows[i].billingRate);
                let amount = hours * rate;
                thours += hours;
                tamount += amount;
            }
            $$('aid-ts-hours').setValue(thours);
            $$('aid-ts-rate').setValue(tamount / thours);
            $$('aid-ts-amount').setValue(tamount);
            $$('aid-adj-hours').setValue(thours);
            $$('aid-adj-rate').setValue(tamount / thours);
            $$('aid-adj-amount').setValue(tamount);
        } else {
            $$('aid-ts-hours').setValue(line.hours);
            $$('aid-ts-rate').setValue(line.rate);
            $$('aid-ts-amount').setValue(line.amount);
            $$('aid-adj-hours').setValue(line.adjustedHours);
            $$('aid-adj-rate').setValue(line.adjustedRate);
            $$('aid-adj-amount').setValue(line.adjustedAmount);
        }
        function updateAmount() {
            $$('aid-adj-amount').setValue($$('aid-adj-hours').getValue() * $$('aid-adj-rate').getValue());
        }
        $$('aid-adj-hours').onChange(updateAmount);
        $$('aid-adj-rate').onChange(updateAmount);
        $$('aid-ok').onclick(function () {
            if ($$('aid-service-items').isError('Service Item'))
                return;
            if (!line) {
                const line2 = {
                    type: 'H',
                    lineAmount: 0,
                    projectId: null,
                    lineNumber: lineNumber,
                    service: $$('aid-expense-account').getValue(),
                    serviceId: $$('aid-service-items').getValue(),
                    hours: $$('aid-ts-hours').getValue(),
                    hours2: Utils.format($$('aid-ts-hours').getValue(), "C", 0, 2),
                    rate: $$('aid-ts-rate').getValue(),
                    rate2: Utils.format($$('aid-ts-rate').getValue(), "CD", 0, 2),
                    amount: $$('aid-ts-amount').getValue(),
                    amount2: Utils.format($$('aid-ts-amount').getValue(), "CD", 0, 2),
                    adjustedHours: $$('aid-adj-hours').getValue(),
                    adjustedHours2: Utils.format($$('aid-adj-hours').getValue(), "C", 0, 2),
                    adjustedRate: $$('aid-adj-rate').getValue(),
                    adjustedRate2: Utils.format($$('aid-adj-rate').getValue(), "CD", 0, 2),
                    adjustedAmount: $$('aid-adj-amount').getValue(),
                    adjustedAmount2: Utils.format($$('aid-adj-amount').getValue(), "CD", 0, 2),
                    description: $$('aid-description').getValue(),
                    timesheets: rows
                };
                lineNumber++;
                invoiceLines.push(line2);
                lineGrid.addRecord(line2);
                Utils.popup_close();
                updateLineTotals();
                updateTimesheetGrid();
            } else {
                line.type = 'H';
                line.lineAmount = 0;
                line.projectId = null;
                line.service = $$('aid-expense-account').getValue();
                line.serviceId = $$('aid-service-items').getValue();
                line.hours = $$('aid-ts-hours').getValue();
                line.hours2 = Utils.format($$('aid-ts-hours').getValue(), "C", 0, 2);
                line.rate = $$('aid-ts-rate').getValue();
                line.rate2 = Utils.format($$('aid-ts-rate').getValue(), "CD", 0, 2);
                line.amount = $$('aid-ts-amount').getValue();
                line.amount2 = Utils.format($$('aid-ts-amount').getValue(), "CD", 0, 2);
                line.adjustedHours = $$('aid-adj-hours').getValue();
                line.adjustedHours2 = Utils.format($$('aid-adj-hours').getValue(), "C", 0, 2);
                line.adjustedRate = $$('aid-adj-rate').getValue();
                line.adjustedRate2 = Utils.format($$('aid-adj-rate').getValue(), "CD", 0, 2);
                line.adjustedAmount = $$('aid-adj-amount').getValue();
                line.adjustedAmount2 = Utils.format($$('aid-adj-amount').getValue(), "CD", 0, 2);
                line.description = $$('aid-description').getValue();
                lineGrid.updateSelectedRecord(line);
                Utils.popup_close();
                updateLineTotals();
            }
        });

        $$('aid-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    /**
     *
     * @param rows from top grid (timesheets)
     * @param line from bottom grid (invoice line)
     */
    function addInvoiceProject(rows, line) {
        if (line  &&  !rows)
            rows = line.timesheets;
        Utils.popup_open('add-invoice-project-popup');
        const columnDefs = [
            {headerName: 'Reference', field: 'externalReference', width: 90  },
            {headerName: 'Project ID', field: 'projectName', type: "numericColumn", width: 90 },
            {headerName: 'B', field: 'billable', width: 50 },
            {headerName: 'Rate', field: 'billingRate2', type: "numericColumn", width: 80 },
            {headerName: 'Date', field: 'workDate2', width: 100 },
            {headerName: 'Hours', field: 'totalHours2', type: "numericColumn", width: 80 },
            {headerName: 'Description', field: 'timeDescription', width: 250 }
        ];
        const grid = new AGGrid('aip-line-grid', columnDefs, 'timesheetId');
        grid.show();
        grid.addRecords(rows);
        let data;
        if (!line) {
            $$('aip-line-amount').clear();
            data = {
                projectId: rows[0].projectId
            };
            AWS.callSoap(WS, 'getProjectSummary', data).then(function (res) {
                if (res.wsStatus === "0") {
                    $$('aip-description').setValue(res.summary);
                }
            });
        } else {
            $$('aip-line-amount').setValue(line.lineAmount);
            $$('aip-description').setValue(line.description);
        }
        data = {
            accountingSystemId: null,
            accountingSystemIdSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            serviceId: null
        };
        AWS.callSoap(WS, 'searchServices', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('aip-service-items');
                res.item = Utils.assureArray(res.item);
                if (res.item.length === 1) {
                    ctl.clear().add(res.item[0].serviceId, res.item[0].description, res.item[0].glExpenseAccountName).disable();
                } else {
                    ctl.clear().add('', '(choose)');
                    ctl.addItems(res.item, 'serviceId', 'description', 'glExpenseAccountName').enable();
                    ctl.onChange(function (val, lbl, data) {
                        $$('aip-expense-account').setValue(data);
                    });
                }
                if (line) {
                    ctl.setValue(line.serviceId);
                    $$('aip-expense-account').setValue(ctl.getData());
                }
            }
        });
        data = {
            projectIds: rows[0].projectId
        };
        AWS.callSoap(WS, 'getProjectDetail', data).then(function (res) {
            if (res.wsStatus === "0") {
                const price = Number(res.fixedPrice);
                const invoiced = Number(res.invoicedAmount);
                const remaining = price - invoiced;
                $$('aip-project-amount').setValue(price);
                $$('aip-invoiced-amount').setValue(invoiced);
                $$('aip-remaining-amount').setValue(remaining);
            }
        });
        let thours = 0;
        let tamount = 0;
        for (let i=0 ; i < rows.length ; i++) {
            let hours = Utils.toNumber(rows[i].totalHours);
            let rate = Utils.toNumber(rows[i].billingRate);
            let amount = hours * rate;
            thours += hours;
            tamount += amount;
        }
        $$('aip-ts-hours').setValue(thours);
        $$('aip-ts-rate').setValue(tamount / thours);
        $$('aip-ts-amount').setValue(tamount);

        $$('aip-project-id').setValue(rows[0].projectName);
        function updateAmount() {
            $$('aip-adj-amount').setValue($$('aip-adj-hours').getValue() * $$('aip-adj-rate').getValue());
        }
        $$('aip-ok').onclick(function () {
            if ($$('aip-service-items').isError('Service Item'))
                return;
            if (!line) {
                const line2 = {
                    type: 'P',
                    lineNumber: lineNumber,
                    serviceId: $$('aip-service-items').getValue(),
                    service: $$('aip-expense-account').getValue(),
                    hours: 0,
                    hours2: '',
                    rate: 0,
                    rate2: '',
                    amount: $$('aip-line-amount').getValue(),
                    amount2: Utils.format($$('aip-line-amount').getValue(), "CD", 0, 2),
                    lineAmount: $$('aip-line-amount').getValue(),
                    projectId: rows[0].projectId,
                    description: $$('aip-description').getValue(),
                    adjustedHours: 0,
                    adjustedRate: 0,
                    adjustedAmount2: Utils.format($$('aip-line-amount').getValue(), "CD", 0, 2),
                    timesheets: rows
                };
                lineNumber++;
                invoiceLines.push(line2);
                lineGrid.addRecord(line2);
                Utils.popup_close();
                updateLineTotals();
                updateTimesheetGrid();
            } else {
                line.type = 'P';
                line.service = $$('aip-expense-account').getValue();
                line.serviceId = $$('aip-service-items').getValue();
                line.hours = 0;
                line.hours2 = '';
                line.rate = 0;
                line.rate2 = '';
                line.amount = $$('aip-line-amount').getValue();
                line.amount2 = Utils.format($$('aip-line-amount').getValue(), "CD", 0, 2);
                line.lineAmount = $$('aip-line-amount').getValue();
                line.projectId = rows[0].projectId;
                line.adjustedHours = 0;
                line.adjustedRate = 0;
                line.adjustedAmount2 = Utils.format($$('aip-line-amount').getValue(), "CD", 0, 2);
                line.description = $$('aip-description').getValue();
                lineGrid.updateSelectedRecord(line);
                Utils.popup_close();
                updateLineTotals();
            }
        });
        $$('aip-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('add').onclick(function () {
        const rows = tsGrid.getSelectedRows();

        // Don't allow them to mix hourly and project-based billing
        let projectType = null;
        for (let i = 0; i < rows.length; i++)
            if (!projectType && rows[i].billable2 !== 'N')
                projectType = rows[i].billable2;
            else if (rows[i].billable2 !== projectType && rows[i].billable2 !== 'N') {
                Utils.showMessage('Error', "Can't combine Hourly with Project-based billing.");
                return;
            }

        let allSameProjects = true;
        let lastProjectId = null;
        for (let i = 0; i < rows.length; i++)
            if (!lastProjectId)
                lastProjectId = rows[i].projectId;
            else if (lastProjectId !== rows[i].projectId) {
                allSameProjects = false;
                break;
            }
        if (projectType === "Project")
            if (!allSameProjects)
                Utils.showMessage('Error', 'Project-based billing must be added on a sigle-project basis.');
            else
                addInvoiceProject(rows, null);
        else if (allSameProjects)
            addInvoiceSame(rows, null);
        else
            addInvoiceDifferent(rows, null);
    });

    $$('reject').onclick(function () {
        let rows = tsGrid.getSelectedRows();
        $$('rtp-info').setValue('Reject ' + rows.length + ' selected timesheet(s) due to:');
        Utils.popup_open('reject-timesheets-popup', 'rtp-reject-reason');
        $$('rtp-ok').onclick(function () {
            if ($$('rtp-reject-reason').isError('Reject reason'))
                return;
            Utils.popup_close();
            let ids = [];
            for (let i=0 ; i < rows.length ; i++)
                ids.push(rows[i].timesheetId);
            let data = {
                timesheetId: ids,
                message: $$('rtp-reject-reason').getValue()
            };
            AWS.callSoap(WS, 'rejectTime', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateTimesheetGrid();
                }
            });
        });
        $$('rtp-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('defer').onclick(function () {
        Utils.yesNo('Confirmation', 'Marking timesheet entries as Deferred will cause them to no longer show up in this list for invoicing.  These can be reclaimed at a later time if necessary.  Are you sure you want to Defer the selected timesheet entries?', function () {
            let rows = tsGrid.getSelectedRows();
            let ids = [];
            for (let i=0 ; i < rows.length ; i++)
                ids.push(rows[i].timesheetId);
            let data = {
                timesheetIds: ids
            };
            AWS.callSoap(WS, 'markTimesheetsDeferred', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'Timesheet entries deferred successfully.');
                    updateTimesheetGrid();
                }
            });
        });
    });

    function manualLine(line) {
        if (!line) {
            $$('mlp-hours').clear();
            $$('mlp-rate').clear();
            $$('mlp-amount').clear();
            $$('mlp-description').clear();
            $$('mlp-expense-account').clear();
        } else {
            $$('mlp-hours').setValue(line.hours);
            $$('mlp-rate').setValue(line.rate);
            $$('mlp-amount').setValue(line.amount);
            $$('mlp-description').setValue(line.description);
            $$('mlp-expense-account').clear();
        }
        Utils.popup_open('manual-line-popup', 'mlp-hours');
        let data = {
            accountingSystemId: null,
            accountingSystemIdSearchType: 0,
            description: null,
            descriptionSearchType: 0,
            serviceId: null
        };
        AWS.callSoap(WS, 'searchServices', data).then(function (res) {
            if (res.wsStatus === "0") {
                const ctl = $$('mlp-service-item');
                res.item = Utils.assureArray(res.item);
                if (res.item.length === 1) {
                    ctl.clear().add(res.item[0].serviceId, res.item[0].description, res.item[0].glExpenseAccountName).disable();
                } else {
                    ctl.clear().add('', '(choose)');
                    ctl.addItems(res.item, 'serviceId', 'description', 'glExpenseAccountName').enable();
                    ctl.onChange(function (val, lbl, data) {
                        $$('mlp-expense-account').setValue(data);
                    });
                }
                if (line) {
                    ctl.setValue(line.serviceId);
                    $$('mlp-expense-account').setValue(ctl.getData());
                }
            }
        });

        function updateAmount() {
            let hours = $$('mlp-hours').getValue();
            let rate = $$('mlp-rate').getValue();
            $$('mlp-amount').setValue(hours * rate);
        }

        $$('mlp-hours').onChange(updateAmount);
        $$('mlp-rate').onChange(updateAmount);

        $$('mlp-ok').onclick(function () {
            if ($$('mlp-hours').isError('Hours'))
                return;
            if ($$('mlp-service-item').isError('Service item'))
                return;
            if ($$('mlp-description').isError('Description'))
                return;
            if (!line) {
                const newLine = {
                    type: 'D',
                    lineAmount: 0,
                    projectId: null,
                    lineNumber: lineNumber,
                    service: $$('mlp-service-item').getLabel(),
                    serviceId: $$('mlp-service-item').getValue(),
                    hours: $$('mlp-hours').getValue(),
                    hours2: Utils.format($$('mlp-hours').getValue(), "C", 0, 2),
                    rate: $$('mlp-rate').getValue(),
                    rate2: Utils.format($$('mlp-rate').getValue(), "CD", 0, 2),
                    amount: $$('mlp-amount').getValue(),
                    amount2: Utils.format($$('mlp-amount').getValue(), "CD", 0, 2),
                    adjustedHours: $$('mlp-hours').getValue(),
                    adjustedHours2: Utils.format($$('mlp-hours').getValue(), "C", 0, 2),
                    adjustedRate: $$('mlp-rate').getValue(),
                    adjustedRate2: Utils.format($$('mlp-rate').getValue(), "CD", 0, 2),
                    adjustedAmount: $$('mlp-amount').getValue(),
                    adjustedAmount2: Utils.format($$('mlp-amount').getValue(), "CD", 0, 2),
                    description: $$('mlp-description').getValue(),
                    timesheets: []
                };
                lineNumber++;
                invoiceLines.push(newLine);
                lineGrid.addRecord(newLine);
            } else {
                line.type = 'D';
                line.lineAmount = 0;
                line.projectId = null;
                line.service = $$('mlp-service-item').getLabel();
                line.hours = $$('mlp-hours').getValue();
                line.hours2 = Utils.format($$('mlp-hours').getValue(), "C", 0, 2);
                line.rate = $$('mlp-rate').getValue();
                line.rate2 = Utils.format($$('mlp-rate').getValue(), "CD", 0, 2);
                line.amount = $$('mlp-amount').getValue();
                line.amount2 = Utils.format($$('mlp-amount').getValue(), "CD", 0, 2);
                line.adjustedHours = $$('mlp-hours').getValue();
                line.adjustedHours2 = Utils.format($$('mlp-hours').getValue(), "C", 0, 2);
                line.adjustedRate = $$('mlp-rate').getValue();
                line.adjustedRate2 = Utils.format($$('mlp-rate').getValue(), "CD", 0, 2);
                line.adjustedAmount = $$('mlp-amount').getValue();
                line.adjustedAmount2 = Utils.format($$('mlp-amount').getValue(), "CD", 0, 2);
                line.description = $$('mlp-description').getValue();
                lineGrid.updateSelectedRecord(line);
            }
            updateLineTotals();
            Utils.popup_close();
        });

        $$('mlp-cancel').onclick(function () {
            Utils.popup_close();
        });
    }

    $$('add-manual-line').onclick(function () {
        manualLine(null);
    });

    function editLine() {
        let line = lineGrid.getSelectedRow();
        let ts = line.timesheets;
        if (line.type === 'P')
            addInvoiceProject(null, line);
        else if (!ts.length) {
            // manual line
            manualLine(line);
        } else {
            let different = false;
            let projectId = ts[0].projectId;
            for (let i = 1; i < ts.length; i++) {
                if (ts[i].projectId !== projectId) {
                    different = true;
                    break;
                }
            }
            if (different)
                addInvoiceDifferent(null, line);
            else
                addInvoiceSame(null, line);
        }
    }

    $$('edit-line').onclick(editLine);
    lineGrid.setOnRowDoubleClicked(editLine);

    $$('remove-line').onclick(function () {
        let row = lineGrid.getSelectedRow();
        lineGrid.deleteSelectedRows();
        for (let i=0 ; i < invoiceLines.length ; i++) {
            if (invoiceLines[i].lineNumber === row.lineNumber) {
                invoiceLines.splice(i,1);
                break;
            }
        }
        updateLineTotals();
        updateTimesheetGrid();
    });

    $$('invoice').onclick(function () {
        Utils.popup_open('invoice-popup');

        $$('ip-company').setValue($$('company-selection').getLabel());
        $$('ip-invoice-total').setValue($$('adjusted-total').getValue());
        $$('ip-invoice-date').setValue(new Date());
        $$('ip-purchase-order').clear();
        if (invoiceLines.length === 1)
            $$('ip-description').clear(invoiceLines[0].description);
        else
            $$('ip-description').clear();
        const data = {
            clientCompanyId: selectedCompany,
            type: 0
        };
        AWS.callSoap(WS, 'listARAccounts', data).then(function (res) {
            if (res.wsStatus === "0") {
                let ctl = $$('ip-ar-account');
                ctl.clear().add('', '(select)');
                if (res.companyUsesAR !== "false") {

                } else
                    ctl.disable();
                $$('ip-payment-terms').setValue(res.paymentTerms);
            }
        });

        $$('ip-ok').onclick(function () {
            const data = {
                arAccount: $$('ip-ar-account').getValue(),
                customerProphetId: selectedCompany,
                description: $$('ip-description').getValue(),
                invoiceDate: $$('ip-invoice-date').getIntValue(),
                invoiceLineItemTransmit: [],
                paymentTerms: $$('ip-payment-terms').getValue(),
                purchaseOrder: $$('ip-purchase-order').getValue()
            };
            for (let i=0 ; i < invoiceLines.length ; i++) {
                const il = {
                    type: invoiceLines[i].type,
                    lineAmount: invoiceLines[i].lineAmount,
                    projectId: invoiceLines[i].projectId,
                    adjHours: invoiceLines[i].adjustedHours,
                    adjRate: invoiceLines[i].adjustedRate,
                    description: invoiceLines[i].description,
                    serviceId: invoiceLines[i].serviceId,
                    timesheetIds: []
                };
                const ts = invoiceLines[i].timesheets;
                for (let i=0 ; i < ts.length ; i++)
                    il.timesheetIds.push(ts[i].timesheetId);
                data.invoiceLineItemTransmit.push(il);
            }
            AWS.callSoap(WS, 'newCompleteInvoice', data).then(function (res) {
                if (res.wsStatus === "0") {
                    lineGrid.clear();
                    invoiceLines = [];
                    $$('original-total').setValue(0);
                    $$('adjusted-total').setValue(0);
                    $$('edit-line').disable();
                    $$('remove-line').disable();
                    $$('invoice').disable();
                    Utils.showMessage('Information', 'Invoice has been created.');
                }
            });
            Utils.popup_close();
        });

        $$('ip-cancel').onclick(function () {
            Utils.popup_close();
        });
    });

})();
