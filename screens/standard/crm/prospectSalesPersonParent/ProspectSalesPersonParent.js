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
    const WS = 'StandardCrmProspectSalesPersonParent';

    function makeName(fn, mn, ln) {
        let r = ln + ", " + fn;
        if (mn)
            r += " " + mn;
        return r;
    }

    const params = {
        firstName: null,
        firstNameSearchType: 0,
        lastName: null,
        lastNameSearchType: 0
    };

    AWS.callSoap(WS, 'searchSalesPersons', params).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('pspp-person');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.singleValue(res.item[0].id, makeName(res.item[0].firstName, null, res.item[0].lastName));
                searchProspects();
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, makeName(res.item[i].firstName, null, res.item[i].lastName));
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
        }
    });

    $$('pspp-person').onChange(searchProspects);

    $$('pspp-person').setSelectFunction(async function () {
        let res = await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
        if (res._status === "ok") {
            $$('pspp-person').setValue(res.employeeid, res.lname + ", " + res.fname);
            searchProspects();
        }
    });

    const searchEmployee = () => {
        let formSearchGrid;
        
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('pspp-add-salesPersonId').setValue(row.personId, makeName(row.fname, row.middleName, row.lname));
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lname', width: 80},
                {headerName: 'First Name', field: 'fname', width: 80},
                {headerName: 'Middle Name', field: 'middleName', width: 80},
            ];

            formSearchGrid = new AGGrid('esp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const inParams = {
                firstName: $$('esp-fname-search').getValue(),
                firstNameSearchType: $$('esp-fname-criteria').getValue(),
                lastName: $$('esp-lname-search').getValue(),
                lastNameSearchType: $$('esp-lname-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('esp-count').setValue(`Displaying ${records.length} item`);
                    } else {
                        $$('esp-count').setValue(`Displaying 0 item`);
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

    let appliedFilters = {
        fromDate: $$('pspp-fromDate').getIntValue(),
        includeInactiveStatuses: $$('pspp-status').getValue() !== "0",
        personId: $$('pspp-person').getValue(),
        toDate: $$('pspp-toDate').getIntValue()
    };

    let currentPageOffset = {
        firstItemIndexPaging: 0,
        itemsPerPage: 50
    };

    $$('pspp-status').onChange(() => {
        if ($$('pspp-status').getValue() === "2")
            $$('chooseStatus').enable();
        else
            $$('chooseStatus').disable();
    });

    let prospectsGrid;
 
    const prospectsColumnDefs = [
        {headerName: "Name", field: "name", width: 400},
        {headerName: "Last Log", field: "lastLog", width: 150},
        {headerName: "Status", field: "statusCode", width: 100},
        {headerName: "Source", field: "sourceCode", width: 80},
        {headerName: "First Contact", field: "firstContactDate", type: "numericColumn", width: 100},
        {headerName: "Last Name", field: "lastName", width: 100},
        {headerName: "First Name", field: "firstName", width: 100},
    ];

    prospectsGrid = new AGGrid('prospectsGrid', prospectsColumnDefs);
    prospectsGrid.show();

    $$('pspp-prosp_name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
    bindToEnum('pspp-prosp_name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    function searchProspects() {
        if ($$('pspp-person').isError('Salesperson'))
            return;

        if (prospectsGrid !== undefined) {
            prospectsGrid.clear();
        }

        $$("prosp-next").disable();
        $$("prosp-prev").disable();

        if ($$('pspp-person').getValue()) {
            const params = appliedFilters;
            for (const key in appliedFilters) {
                if (key !== "source" && key !== "status") {
                    params[key] = appliedFilters[key];
                }               
            }

            params.personId = $$('pspp-person').getValue();

            params.searchMeta = {
                firstItemIndexPaging: currentPageOffset.firstItemIndexPaging,
                sortAsc: true,
                sortField: "name",
                usingPaging: true
            }

            params.name = $$('pspp-prosp_name').getValue();
            params.nameSearchType = $$('pspp-prosp_name-criteria').getValue();

            AWS.callSoap(WS, 'searchProspects', params).then(data => {
                if (data.wsStatus === '0') {    
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        let r = data.item[i];
                        r.lastLogDate = Number(r.lastLogDate);
                        r.lastLogTime = Number(r.lastLogTime);
                        r.lastLogTime = Math.floor(r.lastLogTime / 100000);
                        if (!r.lastLogDate)
                            r.lastLog = "";
                        else
                            r.lastLog = DateUtils.intToStr4(r.lastLogDate) + " " + TimeUtils.format(r.lastLogTime);
                        r.firstContactDate = DateUtils.intToStr4(r.firstContactDate);
                    }
                    prospectsGrid.addRecords(data.item);
                    prospectsGrid.setOnSelectionChanged($$('edit').enable);
                    prospectsGrid.setOnRowDoubleClicked(edit);

                    currentPageOffset.itemsPerPage = data.searchMeta.itemsPerPage;
                    currentPageOffset.firstItemIndexPaging = data.searchMeta.firstItemIndexPaging;
                    
                    $$('prospectsPagination_label').setHTMLValue('<b>' + (Number(currentPageOffset.firstItemIndexPaging) + 1) + ' - ' + (data.item.length + Number(currentPageOffset.firstItemIndexPaging)) + '</b> of <b>' + data.searchMeta.totalItemsPaging + '</b>');

                    if ((data.searchMeta.totalItemsPaging - data.searchMeta.firstItemIndexPaging) / data.searchMeta.itemsPerPage > 1) {
                        $$("prosp-next").enable();
                    }

                    if (data.searchMeta.firstItemIndexPaging > 0) {
                        $$("prosp-prev").enable();
                    }

                    $$("prosp-next").onclick(() => {
                        currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging + currentPageOffset.itemsPerPage;
                        searchProspects();
                    });

                    $$("prosp-prev").onclick(() => {
                        currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging - currentPageOffset.itemsPerPage;
                        searchProspects();
                    });
                    
                }
            });   
        }        
    }

    $$('filter').onclick(() => {
        if ($$('pspp-status').getValue() === "2") {
            $$('chooseStatus').enable();
        } else {
            $$('chooseStatus').disable();
        }

        Utils.popup_open('prospect-filter');

        function resetFilters() {
            $$('pspp-fromDate').clear();
            $$('pspp-status').setValue("0");
            $$('pspp-toDate').clear();
            $$('pspp-sourcesIds').clear();
            $$('pspp-statusesIds').clear();
            $$('pspp-sources').clear();
            $$('pspp-statuses').clear();
            $$('chooseStatus').disable();
        }

        let searchResGrid;
        let searchAddGrid;

        function searchSpecificProsp(prospType) {
            $$('pspp-prosp_code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            bindToEnum('pspp-prosp_code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            
            $$('pspp-prosp_descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            bindToEnum('pspp-prosp_descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            $$('pspp-specific_label').setValue(prospType);
            $$('pspp-specific_label1').setValue(prospType);
            $$('pspp-specific_label2').setValue(prospType);

            function resetSearchProspectFilters() {
                $$('pspp-prosp_code').clear();
                $$('pspp-prosp_code-criteria').setValue(2);
                $$('pspp-prosp_descr').clear();
                $$('pspp-prosp_descr-criteria').setValue(2);
            }
            let searchPageOffset = {
                itemsPerPage: 50,
                firstItemIndexPaging: 0
            }
            
            function searchProspect() {
                const params = {
                    code: $$('pspp-prosp_code').getValue(),
                    codeSearchType: $$('pspp-prosp_code-criteria').getValue(),
                    description: $$('pspp-prosp_descr').getValue(),
                    descriptionSearchType: $$('pspp-prosp_descr-criteria').getValue(),
                    searchMeta: {
                        firstItemIndexPaging: searchPageOffset.firstItemIndexPaging,
                        sortAsc: true,
                        sortField: "",
                        usingPaging: true
                    }
                }
    
                if (prospType === "Statuses") {
                    params.statusId = "";
                } else if (prospType === "Sources") {
                    params.sourceId = "";
                }

                AWS.callSoap(WS, 'searchProspect' + prospType, params).then(data => {
                    if (data.wsStatus === '0') {    
                        data.item = Utils.assureArray(data.item);
                        searchResGrid.addRecords(data.item);

                        if ($$('pspp-' + prospType.toLowerCase()).getValue().length) {
                            for (let i = 0; i < searchResGrid.getNumberOfRows(); i++) {
                                if ($$('pspp-' + prospType.toLowerCase() + "Ids").getValue().includes(searchResGrid.getRowAtIndex(i).id)) {
                                    searchAddGrid.addRecord(searchResGrid.getRowAtIndex(i));
                                    searchResGrid.deleteRowIndex(i);
                                }                         
                            }
                        }

                        searchPageOffset.itemsPerPage = data.searchMeta.itemsPerPage;
                        searchPageOffset.firstItemIndexPaging = data.searchMeta.firstItemIndexPaging;
                        
                        $$('searchPagination_label').setHTMLValue('<b>' + (Number(searchPageOffset.firstItemIndexPaging) + 1) + ' - ' + (data.item.length + Number(searchPageOffset.firstItemIndexPaging)) + '</b> of <b>' + data.searchMeta.totalItemsPaging + '</b>');

                        if ((data.searchMeta.totalItemsPaging - data.searchMeta.firstItemIndexPaging) / data.searchMeta.itemsPerPage > 1) {
                            $$("prosp-next").enable();
                        }

                        if (data.searchMeta.firstItemIndexPaging > 0) {
                            $$("prosp-prev").enable();
                        }

                        $$("search-next").onclick(() => {
                            searchPageOffset.firstItemIndexPaging = searchPageOffset.firstItemIndexPaging + searchPageOffset.itemsPerPage;
                            searchProspects();
                        });

                        $$("search-prev").onclick(() => {
                            searchPageOffset.firstItemIndexPaging = searchPageOffset.firstItemIndexPaging - searchPageOffset.itemsPerPage;
                            searchProspects();
                        });
                    }
                    searchResGrid.setOnSelectionChanged($$('search_specific-add').enable);
                    searchAddGrid.setOnSelectionChanged($$('search_specific-remove').enable);
                    searchAddGrid.setOnRowDoubleClicked($$('search_specific-remove').enable);
                });  
            }
            
            searchProspect();          

            function addSpecificProsp() {
                const rows = searchResGrid.getSelectedRows();
                searchAddGrid.addRecords(rows);
                searchResGrid.deleteSelectedRows();                
            }

            function removeSpecificProsp() {
                const rows = searchAddGrid.getSelectedRows();
                searchResGrid.addRecords(rows);
                searchAddGrid.deleteSelectedRows();                
            }

            $$('search_specific-reset').onclick(resetSearchProspectFilters);
            $$('search_specific-search').onclick(searchProspect);
            $$('search_specific-add').onclick(addSpecificProsp);
            $$('search_specific-remove').onclick(removeSpecificProsp);

            Utils.popup_open('prospect-search_specific');

            const searchResColumnDefs = [
                {headerName: "Code", field: "code", width: 150},
                {headerName: "Description", field: "description", width: 350}
            ];

            searchResGrid = new AGGrid('searchResGrid', searchResColumnDefs);
            searchResGrid.multiSelect();
            searchResGrid.show();
            searchResGrid.setOnRowDoubleClicked(addSpecificProsp);

            const searchAddColumnDefs = [
                {headerName: "Code", field: "code", width: 150},
                {headerName: "Description", field: "description", width: 350}
            ];

            searchAddGrid = new AGGrid('searchAddGrid', searchAddColumnDefs);
            searchAddGrid.multiSelect();
            searchAddGrid.show();

            $$('search_specific-ok').onclick(() => {
                let addedRows = searchAddGrid.getAllRows();
                let temp = "";
                let tempId = "";
                for (let i = 0; i < addedRows.length; i++) {
                    temp += addedRows[i].code + ", ";
                    tempId += addedRows[i].id + ",";
                }
                $$('pspp-' + prospType.toLowerCase()).setValue(temp.substring(0, temp.length - 2));
                $$('pspp-' + prospType.toLowerCase() + 'Ids').setValue(tempId.substring(0, tempId.length - 1));

                Utils.popup_close();
            });

            $$('search_specific-cancel').onclick(() => {
                Utils.popup_close();
            });
        }
        
        $$('chooseSource').onclick(() => {
            searchSpecificProsp("Sources");
        });

        $$('chooseStatus').onclick(() => {
            searchSpecificProsp("Statuses");
        });

        $$('filter-reset').onclick(resetFilters);

        $$('filter-ok').onclick(() => {
            appliedFilters = {
                fromDate: $$('pspp-fromDate').getIntValue(),
                includeInactiveStatuses: $$('pspp-status').getValue() !== "0",
                toDate: $$('pspp-toDate').getIntValue(),
                sourceIds: $$('pspp-sourcesIds').getValue().split(","),
                statusIds: $$('pspp-statusesIds').getValue().split(","),
                source: $$('pspp-sources').getValue(),
                status: $$('pspp-statuses').getValue()
            }

            if (appliedFilters.sourceIds.length === 1 && appliedFilters.sourceIds[0] === "") {
                delete appliedFilters.sourceIds;
                delete appliedFilters.source;
            }

            if (appliedFilters.statusIds.length === 1 && appliedFilters.statusIds[0] === "") {
                if ($$('pspp-status').getValue() === "2")
                    $$('pspp-status').setValue("1");
                delete appliedFilters.statusIds;
                delete appliedFilters.status;
                appliedFilters.includeInactiveStatuses = $$('pspp-status').getValue() !== "0";
            }
            Utils.popup_close();

            let showFilters = "";

            if (appliedFilters.fromDate !== 0 && appliedFilters.toDate === 0) {
                showFilters += "<b>First Contact Date After: </b>" + DateUtils.intToStr4(appliedFilters.fromDate) + ", ";
            } else if (appliedFilters.fromDate !== 0 && appliedFilters.toDate !== 0) {
                showFilters += "<b>First Contact Date Between: </b>" + DateUtils.intToStr4(appliedFilters.fromDate) + " - " + DateUtils.intToStr4(appliedFilters.toDate) + ", ";
            } else if (appliedFilters.fromDate === 0 && appliedFilters.toDate !== 0) {
                showFilters += "<b>First Contact Date Before:</b> " + DateUtils.intToStr4(appliedFilters.toDate) + ", ";
            } 

            if (appliedFilters.source) {
                showFilters += "<b>Source Codes: </b>" + appliedFilters.source + ", ";
            }

            if (appliedFilters.includeInactiveStatuses && !appliedFilters.status) {
                showFilters += "<b>Any Status: </b>, ";
            } else if (appliedFilters.includeInactiveStatuses) {
                showFilters += "<b>Status Codes: </b>" + appliedFilters.status + ", ";
            }

            if (showFilters.length) {
                showFilters = showFilters.substring(0, showFilters.length - 2);
            } else {
                showFilters = "(not filtered)";
            }

            $$('pspp-applied_filters').setHTMLValue(showFilters);
            searchProspects();
        });

        $$('filter-cancel').onclick(() => {
            $$('pspp-fromDate').setValue(appliedFilters.fromDate);
            $$('pspp-status').setValue(appliedFilters.includeInactiveStatuses ? (appliedFilters.statusIds ? "2" : "2") : "0");
            $$('pspp-toDate').setValue(appliedFilters.toDate);
            $$('pspp-sourcesIds').setValue(appliedFilters.sourceIds);
            $$('pspp-statusesIds').setValue(appliedFilters.statusIds);
            $$('pspp-sources').setValue(appliedFilters.source);
            $$('pspp-statuses').setValue(appliedFilters.status);

            Utils.popup_close();
        });
    });

    $$('search').onclick(searchProspects);
    $$('refresh').onclick(searchProspects);

    $$('add').onclick(() => {
        const container = new TabContainer('pspp-tab-container');
        container.selectTab('pspp-detail-TabButton');

        $$('pspp-add-certainty').clear();
        $$('pspp-add-city').clear();
        $$('pspp-add-country').setValue('US');
        $$('pspp-add-firstContactDate').clear();
        $$('pspp-add-identifier').clear();
        $$('pspp-add-mainContactFirstName').clear();
        $$('pspp-add-mainContactHomePhone').clear();
        $$('pspp-add-mainContactJobTitle').clear();
        $$('pspp-add-mainContactLastName').clear();
        $$('pspp-add-mainContactMobilePhone').clear();
        $$('pspp-add-mainContactPersonalEmail').clear();
        $$('pspp-add-mainContactType').setValue('');
        $$('pspp-add-mainContactWorkFax').clear();
        $$('pspp-add-mainContactWorkPhone').clear();
        $$('pspp-add-mainFaxNumber').clear();
        $$('pspp-add-mainPhoneNumber').clear();
        $$('pspp-add-name').clear();
        $$('pspp-add-salesPersonId').clear();
        $$('pspp-add-sourceDetail').clear();
        $$('pspp-add-sourceId').clear();
        $$('pspp-add-typeId').clear();
        $$('pspp-add-state').setValue('');
        $$('pspp-add-statusId').clear();
        $$('pspp-add-street').clear();
        $$('pspp-add-street2').clear();
        $$('pspp-add-zip').clear();   

        const searchProspectData = (searchData) => {
            let formSearchGrid;
            
            Utils.popup_open('prospect-data-search');
                
            const reset = () => {
                $$('esp-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-first-search').clear();
    
                $$('esp-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-second-search').clear();
    
                $$('esp-reset').enable();
                $$('esp-search').enable();
    
                $$('esp-ok').disable();
    
                formSearchGrid.clear();
                $$('esp-count').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('pspp-add-' + searchData).setValue(row.id, searchData === "salesPersonId" ? makeName(row.firstName, row.middleName, row.lastName) : row.code);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('esp-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs;

                switch (searchData) {
                    case "sourceId":
                        $$('prospect-data-search-type').setValue('Prospect Source');
                        columnDefs = [
                            {headerName: 'Code', field: 'code', width: 80},
                            {headerName: 'Description', field: 'description', width: 120}
                        ];
                        break;
                    
                    case "statusId":
                        $$('prospect-data-search-type').setValue('Prospect Status');
                        columnDefs = [
                            {headerName: 'Code', field: 'code', width: 80},
                            {headerName: 'Description', field: 'description', width: 120},
                            {headerName: 'Status', field: 'status', width: 40}
                        ];
                        break;
                
                    case "salesPersonId":
                        $$('prospect-data-search-type').setValue('Employee');
                        columnDefs = [
                            {headerName: 'Last Name', field: 'lastName', width: 80},
                            {headerName: 'First Name', field: 'firstName', width: 80},
                            {headerName: 'Middle Name', field: 'middleName', width: 80}
                        ];
                        break;

                    default:
                        columnDefs = [];
                        break;
                }
    
                formSearchGrid = new AGGrid('esp-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    firstName: $$('esp-second-search').getValue(),
                    firstNameSearchType: $$('esp-second-criteria').getValue(),
                    lastName: $$('esp-first-search').getValue(),
                    lastNameSearchType: $$('esp-first-criteria').getValue(),
                };

                if (searchData === "sourceId") {
                    AWS.callSoap(WS, 'searchProspectSources', inParams).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('esp-count').setValue(`Displaying ${records.length} item`);
                            } else {
                                $$('esp-count').setValue(`Displaying 0 item`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                } else if (searchData === "statusId") {
                    AWS.callSoap(WS, 'searchProspectStatuses', inParams).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('esp-count').setValue(`Displaying ${records.length} item`);
                            } else {
                                $$('esp-count').setValue(`Displaying 0 item`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                } else if (searchData === "salesPersonId") {
                    AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            if (data.item) {
                                const records = Utils.assureArray(data.item);
                                formSearchGrid.addRecords(records);
                                $$('esp-count').setValue(`Displaying ${records.length} item`);
                            } else {
                                $$('esp-count').setValue(`Displaying 0 item`);
                            }
        
                            formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                
            };
    
            $$('esp-reset').onclick(reset);
            $$('esp-search').onclick(search);
            $$('esp-ok').onclick(ok);
            $$('esp-cancel').onclick(cancel);
    
            search();
        };

        AWS.callSoap(WS, 'searchProspectSources', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pspp-add-sourceId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].id, res.item[0].code);
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProspectData('sourceId');
                });
            }
        });

        AWS.callSoap(WS, 'searchProspectTypes', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pspp-add-typeId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].id, res.item[0].code);
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProspectData('sourceId');
                });
            }
        });

        AWS.callSoap(WS, 'searchProspectStatuses', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pspp-add-statusId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].id, res.item[0].code);
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProspectData('statusId');
                });
            }
        });

        AWS.callSoap(WS, 'searchSalesPersons', params).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('pspp-add-salesPersonId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.singleValue(res.item[0].id, makeName(res.item[0].firstName, res.item[0].middleName, res.item[0].lastName));
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, makeName(res.item[i].firstName, res.item[i].middleName, res.item[i].lastName));
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProspectData('salesPersonId');
                });
            }
        });

        Utils.popup_open('add-prospect');

        $$('pspp-add-ok').onclick(() => {
            if ($$('pspp-add-name').isError('Name')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-sourceId').isError('Source')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-statusId').isError('Status')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-typeId').isError('Prospect Type')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactFirstName').isError('First Name')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactLastName').isError('Last Name')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactType').isError('Contact Type')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-certainty').isError('Certainty')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-city').isError('City')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-country').isError('Country')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-firstContactDate').isError('First Contact Date')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-identifier').isError('Identifier')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactHomePhone').isError('Home Phone')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactJobTitle').isError('Job Title')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactMobilePhone').isError('Mobile Phone')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactPersonalEmail').isError('Email')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactWorkFax').isError('Fax')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainContactWorkPhone').isError('Work Phone')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainFaxNumber').isError('Fax')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-mainPhoneNumber').isError('Phone')) {
                container.selectTab('pspp-contact-TabButton');
                return;
            }
            if ($$('pspp-add-salesPersonId').isError('Person')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-sourceDetail').isError('Source Detail')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-state').isError('State')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-street').isError('Street 1')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-street2').isError('Street 2')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }
            if ($$('pspp-add-zip').isError('Zip')) {
                container.selectTab('pspp-detail-TabButton');
                return;
            }

            const params = {
                certainty: $$('pspp-add-certainty').getValue(),
                city: $$('pspp-add-city').getValue(),
                country: $$('pspp-add-country').getValue(),
                firstContactDate: $$('pspp-add-firstContactDate').getIntValue(),
                identifier: $$('pspp-add-identifier').getValue(),
                mainContactFirstName: $$('pspp-add-mainContactFirstName').getValue(),
                mainContactHomePhone: $$('pspp-add-mainContactHomePhone').getValue(),
                mainContactJobTitle: $$('pspp-add-mainContactJobTitle').getValue(),
                mainContactLastName: $$('pspp-add-mainContactLastName').getValue(),
                mainContactMobilePhone: $$('pspp-add-mainContactMobilePhone').getValue(),
                mainContactPersonalEmail: $$('pspp-add-mainContactPersonalEmail').getValue(),
                mainContactType: $$('pspp-add-mainContactType').getValue(),
                mainContactWorkFax: $$('pspp-add-mainContactWorkFax').getValue(),
                mainContactWorkPhone: $$('pspp-add-mainContactWorkPhone').getValue(),
                mainFaxNumber: $$('pspp-add-mainFaxNumber').getValue(),
                mainPhoneNumber: $$('pspp-add-mainPhoneNumber').getValue(),
                name: $$('pspp-add-name').getValue(),
                salesPersonId: $$('pspp-add-salesPersonId').getValue(),
                sourceDetail: $$('pspp-add-sourceDetail').getValue(),
                sourceId: $$('pspp-add-sourceId').getValue(),
                prospectType: $$('pspp-add-typeId').getValue(),
                state: $$('pspp-add-state').getValue(),
                statusId: $$('pspp-add-statusId').getValue(),
                street: $$('pspp-add-street').getValue(),
                street2: $$('pspp-add-street2').getValue(),
                zip: $$('pspp-add-zip').getValue(),
            }
    
            AWS.callSoap(WS, 'newProspect', params).then(data => {
                if (data.wsStatus === '0') {   
                    searchProspects(); 
                    Utils.popup_close();

                    if ($$('pspp-openProspect').getValue()) {
                        Utils.saveData(CURRENT_PROSPECT_ID, data.item.id);
                        Utils.saveData(CURRENT_PROSPECT_NAME, data.item.name);
                        Framework.getChild();
                    }
                }
            });   
        });

        $$('pspp-add-cancel').onclick(() => {
            Utils.popup_close();
        });

    });

    function edit() {
        Utils.saveData(CURRENT_PROSPECT_ID, prospectsGrid.getSelectedRow().id);
        Utils.saveData(CURRENT_PROSPECT_NAME, prospectsGrid.getSelectedRow().name);
        Framework.getChild();
    }

    $$('edit').onclick(edit);

    $$('report').onclick(() => {
        if ($$('pspp-person').isError('Employee')) 
            return;
            
        if ($$('pspp-person').getValue()) {
            const params = appliedFilters;
            for (const key in appliedFilters) {
                if (key !== "source" && key !== "status") {
                    params[key] = appliedFilters[key];
                }               
            }

            params.personId = $$('pspp-person').getValue();

            params.searchMeta = {
                firstItemIndexPaging: currentPageOffset.firstItemIndexPaging,
                sortAsc: true,
                sortField: "name",
                usingPaging: true
            }

            params.name = $$('pspp-prosp_name').getValue();
            params.nameSearchType = $$('pspp-prosp_name-criteria').getValue();

            AWS.callSoap(WS, 'getReport', params).then(data => {
                if (data.wsStatus === '0') {     
                    Utils.showReport(data.reportUrl); 
                }
            });   
        }        
    });
})();
