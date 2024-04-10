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
    const WS = 'StandardTimeTimesheetAccountingReview';

    const columnDefs = [
        {headerName: '', field: 'timesheetId', hide: true},
        {headerName: 'S', field: 'timesheetState', sortable: true, width: 40  },
        {headerName: 'Invoice ID', field: 'invoiceId', sortable: true, width: 100 },
        {headerName: 'Project ID', field: 'projectName', sortable: true, type: 'numericColumn', width: 100 },
        {headerName: 'Date', field: 'workDate2', type: 'numericColumn', sortable: true, width: 100 },
        {headerName: 'Billable', field: 'billableHours2', type: 'numericColumn', sortable: true, width: 100 },
        {headerName: 'NonBillable', field: 'nonbillableHours2', type: 'numericColumn', sortable: true, width: 100 },
        {headerName: 'Description', field: 'timeDescription', sortable: true, width: 300 },
        {headerName: 'Last Name', field: 'lastName', sortable: true, width: 170 },
        {headerName: 'First Name', field: 'firstName', sortable: true, width: 170 }
    ];
    const grid = new AGGrid('timesheet-grid', columnDefs, 'timesheetId');
    grid.multiSelect();
    grid.show();

    let data = {
        name: null,
        nameSearchType: 0
    };
    AWS.callSoap(WS, 'searchCompanies', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('select-company');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].orgGroupId, res.item[0].name);
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown(res.item, 'orgGroupId', 'name');
            } else {
                ctl.forceSelect();
            }
        }
    });

    data = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };
    AWS.callSoap(WS, 'searchEmployees', data).then(function (res) {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('select-employee');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].orgGroupId, res.item[0].name);
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                for (let i=0 ; i < res.item.length ; i++) {
                    let name = res.item[i].firstName;
                    let mname = res.item[i].middleName;
                    if (mname)
                        name += " " + mname;
                    name += " " + res.item[i].lastName;
                    ctl.add(res.item[i].employeeId, name);
                }
            } else {
                ctl.forceSelect();
            }
        }
    });

    $$('select-company').setSelectFunction(async function () {
        let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection', {});
        if (res._status === "ok") {
            $$('select-company').setValue(res.id, res.name);
        }
    });

    $$('select-project').forceSelect();

    $$('select-project').setSelectFunction(async function () {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection', {});
        if (res._status === "ok") {
            $$('select-project').setValue(res.projectId, res.summary);
        }
    });

    $$('select-employee').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection', {});
        if (res._status === "ok") {
            let name = res.fname;
            let mname = res.mname;
            if (mname)
                name += " " + mname;
            name += " " + res.lname;
            $$('select-employee').setValue(res.employeeid, name);
        }
    });

    async function search() {
        $$('reject').disable();
        $$('defer').disable();
        $$('reclaim').disable();
        let ts_state = $$('timesheet-state').getValue();
        if (ts_state === "any")
            ts_state = null;
        let data = {
            billableItemsIndicator: $$('billable').getValue(),
            companyId: $$('select-company').getValue(),
            invoiceId: $$('invoice-id').getValue(),
            invoiceIdSearchType: $$('invoice-id-search-type').getValue(),
            personId: $$('select-employee').getValue(),
            projectId: $$('select-project').getValue(),
            timesheetStartDate: $$('start-date').getIntValue(),
            timesheetEndDate: $$('end-date').getIntValue(),
            timesheetState: ts_state,
            timesheetStateIndicator: 0
        };
        let res = await AWS.callSoap(WS, 'searchTimesheets', data);
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            grid.clear();
            for (let i=0 ; i < res.item.length ; i++) {
                let rec = res.item[i];
                rec.workDate2 = DateUtils.intToStr4(Utils.toNumber(rec.workDate));
                rec.billableHours2 = Utils.format(Utils.toNumber(rec.billableHours), "B", 0, 2);
                rec.nonbillableHours2 = Utils.format(Utils.toNumber(rec.nonbillableHours), "B", 0, 2);
                grid.addRecord(rec);
            }
            $$('billable-hours').setValue(res.billableHours);
            $$('nonbillable-hours').setValue(res.nonBillableHours);
            $$('total-hours').setValue(res.totalHours);
            if (res.item.length >= Utils.toNumber(res.cap))
                $$('display-count').setValue('Displaying ' + res.item.length + ' Timesheet Entries (Limit)').setColor('red');
            else
                $$('display-count').setValue('Displaying ' + res.item.length + ' Timesheet Entries').setColor('black');
        }
    }

    $$('search').onclick(search);

    $$('column-legend').onclick(function () {
        Utils.popup_open('column-legend-popup');
        $$('column-legend-close').onclick(function () {
            Utils.popup_close();
        });
    });

    $$('reset').onclick(function () {
        $$('select-company').clear();
        $$('select-project').clear();
        $$('select-employee').clear();
        $$('start-date').clear();
        $$('end-date').clear();
        $$('billable').clear();
        $$('timesheet-state').clear();
        $$('invoice-id-search-type').setValue(2);
        $$('invoice-id').clear();
    });

    $$('export').onclick(async function () {
        let ts_state = $$('timesheet-state').getValue();
        if (ts_state === "any")
            ts_state = null;
        let data = {
            billableItemsIndicator: $$('billable').getValue(),
            companyId: $$('select-company').getValue(),
            invoiceId: $$('invoice-id').getValue(),
            invoiceIdSearchType: $$('invoice-id-search-type').getValue(),
            personId: $$('select-employee').getValue(),
            projectId: $$('select-project').getValue(),
            timesheetStartDate: $$('start-date').getIntValue(),
            timesheetEndDate: $$('end-date').getIntValue(),
            timesheetState: ts_state,
            timesheetStateIndicator: 0
        };
        Utils.waitMessage("Export in progress; please wait.");
        let res = await AWS.callSoap(WS, 'getExport', data);
        if (res.wsStatus === "0") {
            Utils.showReport(res.reportUrl);
        }
        Utils.waitMessageEnd();
    });

    $$('report').onclick(async function () {
        let ts_state = $$('timesheet-state').getValue();
        if (ts_state === "any")
            ts_state = null;
        let data = {
            billableItemsIndicator: $$('billable').getValue(),
            companyId: $$('select-company').getValue(),
            invoiceId: $$('invoice-id').getValue(),
            invoiceIdSearchType: $$('invoice-id-search-type').getValue(),
            personId: $$('select-employee').getValue(),
            projectId: $$('select-project').getValue(),
            timesheetStartDate: $$('start-date').getIntValue(),
            timesheetEndDate: $$('end-date').getIntValue(),
            timesheetState: ts_state,
            timesheetStateIndicator: 0
        };
        Utils.waitMessage("Report in progress; please wait.");
        let res = await AWS.callSoap(WS, 'getReport', data);
        if (res.wsStatus === "0") {
            Utils.showReport(res.reportUrl);
        }
        Utils.waitMessageEnd();
    });

    $$('reject').onclick(function () {
        let rows = grid.getSelectedRows();
        let tsa = [];
        for (let i=0 ; i < rows.length ; i++) {
            if (rows[i].timesheetState !== 'A') {
                Utils.showMessage('Error', 'One or more selected timesheet entries are not in a state of Approved.  Only timesheets that are in the state of Approved can be Rejected.');
                return;
            }
            tsa.push(rows[i].timesheetId);
        }
        Utils.popup_open('reject-reason-popup', 'rr-reason');
        $$('rr-text').setValue('Reject ' + rows.length + ' selected timesheet(s) due to:')
        $$('rr-cancel').onclick(function () {
            Utils.popup_close();
        });

        $$('rr-ok').onclick(async function () {
            let data = {
                message: $$('rr-reason').getValue(),
                timesheetIds: tsa
            };
            let res = await AWS.callSoap(WS, 'markTimesheetsRejected', data);
            if (res.wsStatus === "0") {
                search();
            }
            Utils.popup_close();
        });
    });

    $$('defer').onclick(function () {
        let rows = grid.getSelectedRows();
        let tsa = [];
        for (let i=0 ; i < rows.length ; i++) {
            if (rows[i].timesheetState !== 'A') {
                Utils.showMessage('Error', 'One or more selected timesheet entries are not in a state of Approved.  Only timesheets that are in the state of Approved can be Deferred.');
                return;
            }
            tsa.push(rows[i].timesheetId);
        }
        Utils.yesNo('Confirmation', 'Marking Timesheet Entries as Deferred will cause them to no longer show up in lists for creating Timesheet Invoices.  These can be Reclaimed at a later time if necessary.  Are you sure you want to Defer the selected ' + tsa.length + ' Timesheet Entries?',
            async function () {
                let data = {
                    timesheetIds: tsa
                };
                let res = await AWS.callSoap(WS, 'markTimesheetsDeferred', data);
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'Timesheet Entries Deferred successfully.');
                    search();
                }
            });
    });

    $$('reclaim').onclick(function () {
        let rows = grid.getSelectedRows();
        let tsa = [];
        for (let i=0 ; i < rows.length ; i++) {
            if (rows[i].timesheetState !== 'D') {
                Utils.showMessage('Error', 'One or more selected timesheet entries are not in a state of Deferred.  Only timesheets that are in the state of Deferred can be Reclaimed.');
                return;
            }
            tsa.push(rows[i].timesheetId);
        }
        Utils.yesNo('Confirmation', 'Reclaiming Timesheet Entries will mark them as Approved and they will re-appear in lists for creating Timesheet Invoices.  Are you sure you want to Reclaim the selected Timesheet Entries?',
            async function () {
                let data = {
                    timesheetIds: tsa
                };
                let res = await AWS.callSoap(WS, 'markTimesheetsApproved', data);
                if (res.wsStatus === "0") {
                    Utils.showMessage('Information', 'Entries have been reclaimed.');
                    search();
                }
            });
    });

    grid.setOnSelectionChanged(function (rows) {
        $$('reject').enable(rows);
        $$('defer').enable(rows);
        $$('reclaim').enable(rows);
    });
})();
