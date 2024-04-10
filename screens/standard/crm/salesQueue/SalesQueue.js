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

(function () {
    const WS = 'StandardCrmSalesQueue';
    
    let searchResultsGrid;

    function getSearchResultsTable() {
        if (searchResultsGrid !== undefined) {
            searchResultsGrid.destroy();
        }
        let searchResultsColumnDefs;
        if ($$('sq-searchBy').getValue() === 'A') {
            searchResultsColumnDefs = [
                {headerName: 'Prospect', field: "prospectName", width: 200},
                {headerName: 'Status', field: "prospectStatus", width: 150},
                {headerName: 'Date Added', field: "addedDateFormatted", type: "numericColumn", width: 150},
                {headerName: 'Last Log Date', field: "lastContactDateFormatted", type: "numericColumn", width: 150},
                {headerName: 'Activity', field: "activity", width: 200},
                {headerName: 'Result', field: "result", width: 100},
                {headerName: 'Scheduled Contact', field: "scheduledContact", width: 200}
            ];
            $('#searchResultsGrid').height('calc(100% - 345px)');
        } else {
            searchResultsColumnDefs = [
                {headerName: 'Prospect', field: "prospectName", width: 400},
                {headerName: 'Status', field: "prospectStatus", width: 400},
                {headerName: 'Date Added', field: "addedDateFormatted", type: "numericColumn", width: 400}
            ];
            $('#searchResultsGrid').height('calc(100% - 310px)');
        }

        searchResultsGrid = new AGGrid('searchResultsGrid', searchResultsColumnDefs);
        searchResultsGrid.show(); 
    }

    getSearchResultsTable();

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        id: '',
        includeSelected: true,
        lastName: null,
        lastNameSearchType: 0
    };

    AWS.callSoap(WS, 'searchEmployees', params).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('sq-person');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].id, makeName(res.item[0].firstName, res.item[0].middleName, res.item[0].lastName));
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(all)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, makeName(res.item[i].firstName, res.item[i].middleName, res.item[i].lastName));
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(all)');
            }
            ctl.setSelectFunction(searchEmployee);
        }
    });

    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lastName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lastName-search').clear();

            $$('esp-firstName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-firstName-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();


            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 Employees`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('sq-person').setValue(row.personId, makeName(row.firstName, row.middleName, row.lastName));
                getListSalesPoints();
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('esp-lastName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-firstName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lastName', width: 80},
                {headerName: 'First Name', field: 'firstName', width: 80},
                {headerName: 'Middle Name', field: 'middleName', width: 80},
            ];

            formSearchGrid = new AGGrid('esp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const inParams = {
                firstName: $$('esp-firstName-search').getValue(),
                firstNameSearchType: $$('esp-firstName-criteria').getValue(),
                lastName: $$('esp-lastName-search').getValue(),
                lastNameSearchType: $$('esp-lastName-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('esp-count').setValue(`Displaying ${records.length} Employees`);
                    } else {
                        $$('esp-count').setValue(`Displaying 0 Employees`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            })
        };

        $$('esp-reset').onclick(reset);
        $$('esp-search').onclick(search);
        $$('esp-ok').onclick(ok);
        $$('esp-cancel').onclick(cancel);

        search();
    };
    function searchProspectStatus() {
        let formSearchGrid;
        
        Utils.popup_open('sq-data-search');
            
        const reset = () => {
            $$('sq-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('sq-code-search').clear();

            $$('sq-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('sq-description-search').clear();


            $$('sq-reset').enable();
            $$('sq-search').enable();

            $$('sq-ok').disable();

            formSearchGrid.clear();
            $$('sq-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('sq-prospectStatus').setValue(row.id, row.code);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('sq-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('sq-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                {headerName: 'Code', field: 'code', width: 80},
                {headerName: 'Description', field: 'description', width: 100},
                {headerName: 'Status', field: 'status', width: 30},
            ];
                    

            formSearchGrid = new AGGrid('sq-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const params = {
                code: $$('sq-code-search').getValue(),
                codeSearchType: $$('sq-code-criteria').getValue(),
                description: $$('sq-description-search').getValue(),
                descriptionSearchType: $$('sq-description-criteria').getValue(),
                statusId: ''
            }
            AWS.callSoap(WS, 'searchProspectStatuses', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('sq-count').setValue(`Displaying ${records.length} Prospect Statuses`);
                    } else {
                        $$('sq-count').setValue(`Displaying 0 Prospect Statuses`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('sq-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            }); 
        };

        $$('sq-reset').onclick(reset);
        $$('sq-search').onclick(search);
        $$('sq-ok').onclick(ok);
        $$('sq-cancel').onclick(cancel);

        $$('sq-chooseSpecific').onChange(() => {
            if ($$('sq-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('sq-code-criteria').disable();
                $$('sq-code-search').disable();

                $$('sq-description-criteria').disable();
                $$('sq-description-search').disable();

                $$('sq-count').setValue(`Displaying 0 Prospect Statuses`);

                $$('sq-ok').enable().onclick(() => {
                    $$('sq-prospectStatus').setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('sq-code-criteria').enable();
                $$('sq-code-search').enable();

                $$('sq-description-criteria').enable();
                $$('sq-description-search').enable();

                $$('sq-ok').enable().onclick(ok);
            }
        });

        search();
    };

    const statusesParams = {
        code: '',
        codeSearchType: 0,
        description: '',
        descriptionSearchType: 0,
        statusId: ''
    }

    AWS.callSoap(WS, 'searchProspectStatuses', statusesParams).then(res => {
        if (res.wsStatus === '0') {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('sq-prospectStatus');
            ctl.clear();
            if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(any)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, res.item[i].code);
            } else {
                ctl.forceSelect();
            }
            ctl.setSelectFunction(() => {
                searchProspectStatus();
            });
        }
    });  

    $$('sq-salesActivity').clear().add('', "(any)");
    AWS.callSoap(WS, 'listActivities').then(data => {
        if (data.wsStatus === "0") {
            data.item = Utils.assureArray(data.item);
            $$('sq-salesActivity').addItems(data.item, "id", "name");
        }
    });

    $$('sq-activityResult').clear().disable().add('', "(any)");

    $$('sq-salesActivity').onChange(() => {
        if ($$('sq-salesActivity').getValue() !== '') {
            const activityId = {
                activityId: $$('sq-salesActivity').getValue()
            }
            $$('sq-activityResult').clear().enable().add('', "(all)");
            AWS.callSoap(WS, 'listResults', activityId).then(data => {
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
                    $$('sq-activityResult').addItems(data.item, "id", "name");
                }
            });
        } else {
            $$('sq-activityResult').clear().disable().add('', "(all)");
        }
    });

    bindToEnum('sq-prospectName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);


    $$('sq-searchBy').onChange(() => {
        if ($$('sq-searchBy').getValue() === 'A') {
            $('#sq-forActiveFilters').show();
            $$('sq-contactDate-label').show();
            $$('sq-contactDate').show();
            getSearchResultsTable();
        } else {
            $('#sq-forActiveFilters').hide();
            $$('sq-contactDate-label').hide();
            $$('sq-contactDate').hide();
            getSearchResultsTable();
        }
    });



    $$('reset').onclick(() => {
        $$('sq-person').setValue('');
        $$('sq-prospectName-criteria').setValue(2);
        $$('sq-prospectName-search').clear();
        $$('sq-prospectStatus').setValue('');
        $$('sq-contactDate').clear();
        $$('sq-logFromDate').clear();
        $$('sq-logToDate').clear();
        $$('sq-salesActivity').setValue('');
        $$('sq-activityResult').setValue('');
    });

    let currentPageOffset = {
        firstItemIndexPaging: 0,
        itemsPerPage: 50
    };

    function searchSalesQueue() {
        const params = {
            active: $$('sq-searchBy').getValue() === 'A',
            activityId: $$('sq-searchBy').getValue() === 'A' ? $$('sq-salesActivity').getValue() : '',
            contactDate: $$('sq-searchBy').getValue() === 'A' ? $$('sq-contactDate').getIntValue() : 0,
            employeeId: $$('sq-person').getValue(),
            lastContactFrom: $$('sq-searchBy').getValue() === 'A' ? $$('sq-logFromDate').getIntValue() : 0,
            lastContactTo: $$('sq-searchBy').getValue() === 'A' ? $$('sq-logToDate').getIntValue() : 0,
            prospectName: $$('sq-prospectName-search').getValue(),
            prospectNameSearchType: $$('sq-prospectName-criteria').getValue(),
            prospectStatusId: $$('sq-prospectStatus').getValue(),
            resultId: $$('sq-searchBy').getValue() === 'A' ? $$('sq-activityResult').getValue() : ''
        }

        params.searchMeta= {
            firstItemIndexPaging: currentPageOffset.firstItemIndexPaging,
            sortAsc: true,
            sortField: "prospectName",
            usingPaging: true
        };

        AWS.callSoap(WS, 'searchSalesQueue', params).then(data => {
            if (data.wsStatus === '0') {
                searchResultsGrid.clear();
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].addedDateFormatted = data.item[i].addedDate !== '0' ? DateUtils.intToStr4(data.item[i].addedDate) : '';
                    data.item[i].lastContactDateFormatted = data.item[i].lastContactDate !== '0' ? DateUtils.intToStr4(data.item[i].lastContactDate) : '';
                }

                searchResultsGrid.addRecords(data.item);

                searchResultsGrid.setOnSelectionChanged((x) => {
                    $$('view').enable(x);
                    $$('contacts').enable(x);
                    $$('newlog').enable(x);
                });

                $$('pagination-label').setHTMLValue('<b>' + (Number(currentPageOffset.firstItemIndexPaging) + 1) + ' - ' + (data.item.length + Number(currentPageOffset.firstItemIndexPaging)) + '</b> of <b>' + data.searchMeta.totalItemsPaging + '</b>');
                
                if ((data.searchMeta.totalItemsPaging - data.searchMeta.firstItemIndexPaging) / data.searchMeta.itemsPerPage > 1) {
                    $$("next").enable();
                } else {
                    $$("next").disable();
                }

                if (data.searchMeta.firstItemIndexPaging > 0) {
                    $$("prev").enable();
                } else {
                    $$("prev").disable();
                }

                $$("next").onclick(() => {
                    currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging + currentPageOffset.itemsPerPage;
                    searchSalesQueue();
                });

                $$("prev").onclick(() => {
                    currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging - currentPageOffset.itemsPerPage;
                    searchSalesQueue();
                });
            }
        });  
    }

    $$('search').onclick(() => {
        searchSalesQueue();
    });

    $$('view').onclick(() => {
        const row = searchResultsGrid.getSelectedRow();
        Utils.saveData(CURRENT_PROSPECT_ID, row.prospectId);
        Utils.saveData(CURRENT_PROJECT_NAME, row.prospectName);
        Framework.getChild();
    });

    let contactsResultsGrid;
    const contactsResultsColumnDefs = [
        {headerName: 'Last Name', field: "lastName", width: 120},
        {headerName: 'First Name', field: "firstName", width: 120},
        {headerName: 'Primary', field: "primary", width: 70},
        {headerName: 'Job Title', field: "jobTitle", width: 120},
        {headerName: 'Work Phone', field: "workPhone", type: 'numericColumn', width: 120},
    ];

    contactsResultsGrid = new AGGrid('contactsResultsGrid', contactsResultsColumnDefs);
    contactsResultsGrid.show(); 

    $$('contacts').onclick(() => {
        const row = searchResultsGrid.getSelectedRow();
        $$('sq-contacts-prospectName').setValue(row.prospectName);

        const params = {
            orgGroupId: row.prospectId
        }
        AWS.callSoap(WS, 'listContacts', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                contactsResultsGrid.clear();
                contactsResultsGrid.addRecords(data.item);
            }
        });

        Utils.popup_open('contacts-popup');

        $$('contacts-ok').onclick(Utils.popup_close);
    });

    
    let logDescriptionGrid;
    const logDescriptionColumnDefs = [{headerName: 'Description', field: "name", width: 500}];

    logDescriptionGrid = new AGGrid('logDescriptionGrid', logDescriptionColumnDefs);
    logDescriptionGrid.show(); 

    $$('newlog').onclick(() => {
        const row = searchResultsGrid.getSelectedRow();
        $$('log-prospectName').setValue(row.prospectName);

        logDescriptionGrid.clear();

        $$('sq-log-activity').clear().add('', "(select)");
        AWS.callSoap(WS, 'listActivities').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('sq-log-activity').addItems(data.item, "id", "name");

                $$('sq-log-activity').onChange(() => {
                    if ($$('sq-log-activity').getValue() !== '') {
                        const params = {
                            activityId: $$('sq-log-activity').getValue()
                        }
                        AWS.callSoap(WS, 'listResults', params).then(data => {
                            if (data.wsStatus === "0") {
                                data.item = Utils.assureArray(data.item);
                                logDescriptionGrid.clear();
                                logDescriptionGrid.addRecords(data.item);
                            }
                        });
                    } else {
                        logDescriptionGrid.clear();
                    }
                });
            }
        });

        $$('sq-log-date').setValue(DateUtils.today());
        $$('sq-log-time').setValue(TimeUtils.current());

        Utils.popup_open('log-popup');

        $$('log-ok').onclick(() => {
            if ($$('sq-log-date').isError('Contact Date'))
                return;
            if ($$('sq-log-detail').isError('Detail'))
                return;
            
            const params = {
                activityId: $$('sq-log-activity').getValue(),
                contactDate: $$('sq-log-date').getIntValue(),
                contactText: $$('sq-log-detail').getValue(),
                contactTime: $$('sq-log-time').getValue(),
                employees: $$('sq-log-cEmployees').getValue(),
                prospectEmployees: $$('sq-log-pEmployees').getValue(),
                id: row.prospectId,
                resultId: logDescriptionGrid.getSelectedRow() !== null ? logDescriptionGrid.getSelectedRow().id : ''
            }
            AWS.callSoap(WS, 'newLog', params).then(data => {
                if (data.wsStatus === "0") {
                    Utils.popup_close();
                    searchSalesQueue();
                }
            });            
        });

        $$('log-cancel').onclick(Utils.popup_close);
    });

})();
