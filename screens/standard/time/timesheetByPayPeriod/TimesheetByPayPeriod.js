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
    const WS = 'StandardTimeTimesheetByPayPeriod';


    const searchData = (searchData) => {
        let formSearchGrid;
        switch (searchData) {
            case 'orgGroupId':
                $$('ogpl-data-search-type').setValue('Organizational Group');
                $$('ogpl-chooseSpecificLabelAll').setValue('Organizational Groups');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Organizational Group');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;

            case 'companyCompanyId':
                $$('ogpl-data-search-type').setValue('Requesting Company');
                $$('ogpl-chooseSpecificLabelAll').setValue('Companies');
                $$('ogpl-chooseSpecificLabelSearch').setValue('Company');

                $$('ogpl-first-label').setValue('Name:');

                $$('ogpl-second-label').hide();
                $$('ogpl-second-criteria').hide();
                $$('ogpl-second-search').hide();
                break;

            case 'employeeEmployeeId':
                $$('ogpl-data-search-type').setValue('Person');
                $$('ogpl-chooseSpecific').hide();

                $$('ogpl-first-label').setValue('Last Name:');

                $$('ogpl-second-label').show().setValue('First Name:');
                $$('ogpl-second-criteria').show();
                $$('ogpl-second-search').show();
                break;
            default:
                break;
        }
        
        Utils.popup_open('ogpl-data-search');
            
        const reset = () => {
            $$('ogpl-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ogpl-first-search').clear();

            $$('ogpl-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('ogpl-second-search').clear();

            $$('ogpl-reset').enable();
            $$('ogpl-search').enable();

            $$('ogpl-ok').disable();

            formSearchGrid.clear();
            $$('ogpl-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchData) {
                    case 'orgGroupId':
                        $$('tbpp-orgGroupId').setValue(row.orgGroupId, row.orgGroupName);
                        break;
        
                    case 'companyCompanyId':
                        $$('tbpp-companyCompanyId').setValue(row.companyId, row.companyName);
                        break;
        
                    case 'employeeEmployeeId':
                        $$('tbpp-employeeEmployeeId').setValue(row.id, makeName(row.firstName, row.lastName));
                        break;
                    default:
                        break;
                }
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('ogpl-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('ogpl-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs;

            switch (searchData) {
                case "orgGroupId":
                    columnDefs = [
                        {headerName: 'Organizational Group Name', field: 'orgGroupName', width: 210}
                    ];
                    break;
                
                case "companyCompanyId":
                    columnDefs = [
                        {headerName: 'Company Name', field: 'companyName', width: 210}
                    ];
                    break;
            
                case "employeeEmployeeId":
                    columnDefs = [
                        {headerName: 'Last Name', field: 'lastName', width: 70},
                        {headerName: 'First Name', field: 'firstName', width: 70},
                        {headerName: 'Middle Name', field: 'middleName', width: 70}
                    ];
                    Utils.popup_set_height('ogpl-data-search', '520px');
                    break;
                default:
                    columnDefs = [];
                    break;
            }

            formSearchGrid = new AGGrid('ogpl-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();
            
        const search = () => {
            if (searchData === "orgGroupId") {
                const params = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    companyId: $$('tbpp-companyCompanyId').getValue()
                }
                AWS.callSoap(WS, 'searchGroupsForCompany', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Organizational Groups`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Organizational Groups`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "companyCompanyId") {
                const params = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    companyId: '',
                    autoDefault: false
                }
                AWS.callSoap(WS, 'searchCompanyByType', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Companies`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Companies`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "employeeEmployeeId") {
                const params = {
                    firstName: $$('ogpl-second-search').getValue(),
                    firstNameSearchType: $$('ogpl-second-criteria').getValue(),
                    lastName: $$('ogpl-first-search').getValue(),
                    lastNameSearchType: $$('ogpl-first-criteria').getValue(),
                    orgGroupId: $$('tbpp-orgGroupId').getValue(),
                    personId: '',
                    projectId: ''
                }
                AWS.callSoap(WS, 'searchEmployees', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('ogpl-count').setValue(`Displaying ${records.length} Peoples`);
                        } else {
                            $$('ogpl-count').setValue(`Displaying 0 Peoples`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('ogpl-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } 
        };

        $$('ogpl-reset').onclick(reset);
        $$('ogpl-search').onclick(search);
        $$('ogpl-ok').onclick(ok);
        $$('ogpl-cancel').onclick(cancel);

        $$('ogpl-chooseSpecific').onChange(() => {
            if ($$('ogpl-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('ogpl-first-criteria').disable();
                $$('ogpl-first-search').disable();

                $$('ogpl-second-criteria').disable();
                $$('ogpl-second-search').disable();

                switch (searchData) {
                    case 'orgGroupId':
                        $$('ogpl-count').setValue(`Displaying 0 Organizational Groups`);
                        break;
                    
                    case 'companyCompanyId':
                        $$('ogpl-count').setValue(`Displaying 0 Companies`);
                        break;

                    case 'employeeEmployeeId':
                        $$('ogpl-count').setValue(`Displaying 0 Peoples`);
                        break;
                
                    default:
                        break;
                }
                $$('ogpl-ok').enable().onclick(() => {
                    $$('tbpp-' + searchData).setValue('');  
                    reset();
                    Utils.popup_close();           
                });
            } else {
                $$('ogpl-first-criteria').enable();
                $$('ogpl-first-search').enable();

                $$('ogpl-second-criteria').enable();
                $$('ogpl-second-search').enable();

                $$('ogpl-ok').enable().onclick(ok);
            }
        });

        search();
    };

    function makeName(fn, ln) {
        let r = ln + ", " + fn;
        return r;
    }

    const orgGroupParams = {
        name: '',
        nameSearchType: 0,
        id: ''
    }
    AWS.callSoap(WS, 'searchOrgGroups', orgGroupParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('tbpp-orgGroupId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.setValue(res.item[0].orgGroupId, res.item[0].orgGroupName)
            } else if (res.item.length <= res.cap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].orgGroupId, res.item[i].orgGroupName);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(() => {
                searchData('orgGroupId');
            });
        }
    });


    const container = new TabContainer('tbpp-tab-container');

    let timesheetsGrid;

    function showTimesheetsGrid() {
        let timesheetsColumnDefs;
        if (timesheetsGrid != undefined) {
            timesheetsGrid.destroy();
        }
        if ($$('tbpp-timesheetsType').getValue() === '0') {
            timesheetsColumnDefs = [
                {headerName: "Employee", field: "employeeName", width: 300},
                {headerName: "Project ID", field: "externalProjectId", type: "numericColumn", width: 300},
                {headerName: "Description Preview", field: "description", width: 600},
                {headerName: "Date", field: "date", type: "numericColumn", width: 100},
                {headerName: "Day", field: "day", type: "numericColumn", width: 100},
                {headerName: "Begin", field: "begin", type: "numericColumn", width: 100},
                {headerName: "End", field: "end", type: "numericColumn", width: 100},
                {headerName: "Hours", field: "hours", type: "numericColumn", width: 100}
            ];
        } else {
            timesheetsColumnDefs = [
                {headerName: "Employee", field: "employeeName", width: 200},
                {headerName: "Description Preview", field: "description", width: 800},
                {headerName: "Day", field: "day", type: "numericColumn", width: 100},
                {headerName: "Hours", field: "hours", type: "numericColumn", width: 100}
            ];
        }

        timesheetsGrid = new AGGrid('timesheetsGrid', timesheetsColumnDefs);

        timesheetsGrid.rowStyleFunction(params => {
            if (params.data.approved === "No")
                return { background: $('#tbpp-dailyTotals-color').val() };
            else if (params.data.active === "No")
                return { background: $('#tbpp-periodTotals-color').val() };
        });

        timesheetsGrid.show();

        searchTimesheets();
    }
    $('#tbpp-dailyTotals-color').change(() => {
        searchTimesheets();
    });
    $('#tbpp-periodTotals-color').change(() => {
        searchTimesheets();
    });

    showTimesheetsGrid();

    function searchTimesheets() {

    }
    $$('tbpp-timesheetsType').onChange(() => {
        showTimesheetsGrid();
    });

    let accrualsGrid;
    const accrualsColumnDefs = [
        {headerName: "Employee", field: "employeeName", width: 400},
        {headerName: "Accrual Type", field: "accrualType", width: 300},
        {headerName: "Hours Used", field: "hoursUsed", type: "numericColumn", width: 200},
        {headerName: "Hours Available", field: "hoursAvailable", type: "numericColumn", width: 200}
    ];
    accrualsGrid = new AGGrid('accrualsGrid', accrualsColumnDefs);
    accrualsGrid.show();
})();
