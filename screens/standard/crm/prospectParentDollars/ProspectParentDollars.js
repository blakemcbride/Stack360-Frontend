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

    function timezonesToDropDown(id) {
        const timezones = { "-10": "Hawaiian (-10:00)", "-9": "Alaskan (-09:00)", "-8": "Pacific (-08:00)", "-7": "Mountain (-07:00)", "-6": "Central (-06:00)",
            "-5": "Eastern (-05:00)",
        };
        const ctl = $$(id);

        ctl.clear();
        Object.keys(timezones).map(key => {
            ctl.add(key, timezones[key]);
        });
    }

    const WS = 'StandardCrmProspectParentDollars';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    async function executeSelectFunc(element, fn, id, name) {
        const selectedNode = await fn();
        if (selectedNode) {
            $$(element).setValue(selectedNode[id], selectedNode[name]);
        }
    }

    const initSmartChooser = (element, res) => {
        if (!res.item) {
            $$(element.tag).clear();
            $$(element.tag).forceSelect();
            return;
        }

        if (res.item.length > res.lowCap) {
            $$(element.tag).forceSelect();
        }

        $$(element.tag).addItems(Utils.assureArray(res.item), element.ID, element.label);

        if (res.selectedItem) {
            $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
            $$(element.tag).setValue(res.selectedItem[element.ID]);
        }

        if (element.selected) {
            $$(element.tag).setValue(element.selected);
        }
    }

    const listSmartChooser = (data) => {
        return new Promise(function (resolve, reject) {
            const elements = Utils.assureArray(data);

            elements.map(element => {
                $$(element.tag).clear();

                AWS.callSoap(WS, element.url, element.param).then(res => {
                    if (res.wsStatus === '0') {
                        initSmartChooser(element, res);
                        resolve(null);
                    }
                });
            });
        });
    };

    const searchProspectStatus = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('prospect-status-search');

        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('pst-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pst-code-search').clear();

                $$('pst-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pst-description-search').clear();

                $$('pst-reset').enable();
                $$('pst-search').enable();

                $$('pst-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('pst-count', `Displaying ${count} Prospect Status`);
            };

            const ok = () => {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('pst-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pst-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid1 = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120},
                    {headerName: 'Status', field: 'status', width: 60},
                ];

                formSearchGrid = new AGGrid('pst-grid', columnDefs, 'id');
                formSearchGrid.show();
            };

            if (!formSearchGrid)
                initDataGrid1();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('pst-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            const search = () => {
                let inParams = {
                    code: $$('pst-code-search').getValue(),
                    codeSearchType: $$('pst-code-criteria').getValue(),
                    description: $$('pst-description-search').getValue(),
                    descriptionSearchType: $$('pst-description-criteria').getValue(),
                };

                AWS.callSoap(WS, 'searchProspectStatuses', inParams).then(data => {
                    if (data.wsStatus === '0') {

                        // Clear the grid.
                        formSearchGrid.clear();

                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);

                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };

            $$('pst-reset').onclick(reset);
            $$('pst-search').onclick(search);
            $$('pst-ok').onclick(ok);
            $$('pst-cancel').onclick(cancel);

            search();

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const searchProspectType = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('prospect-type-search');
    
        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('pt-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pt-code-search').clear();
    
                $$('pt-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pt-description-search').clear();
    
                $$('pt-reset').enable();
                $$('pt-search').enable();
    
                $$('pt-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };
    
            const changeCount = count => {
                Utils.setText('pt-count', `Displaying ${count} Prospect Types`);
            };

            const ok = () => {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('pt-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pt-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid2 = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120},
                    {headerName: 'Type', field: 'type', width: 60},
                ];
    
                formSearchGrid = new AGGrid('pt-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid2();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('pt-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
                let inParams = {
                    code: $$('pt-code-search').getValue(),
                    codeSearchType: $$('pt-code-criteria').getValue(),
                    description: $$('pt-description-search').getValue(),
                    descriptionSearchType: $$('pt-description-criteria').getValue(),
                };
    
                AWS.callSoap(WS, 'searchProspectTypes', inParams).then(data => {
                    if (data.wsStatus === '0') {
    
                        // Clear the grid.
                        formSearchGrid.clear();
    
                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('pt-reset').onclick(reset);
            $$('pt-search').onclick(search);
            $$('pt-ok').onclick(ok);
            $$('pt-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    const searchProspectSource = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('prospect-source-search');
    
        return new Promise(async function (resolve, reject) {
            
            let reset = () => {
                $$('pss-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pss-code-search').clear();
    
                $$('pss-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pss-description-search').clear();
    
                $$('pss-reset').enable();
                $$('pss-search').enable();
    
                $$('pss-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };
    
            let changeCount = count => {
                Utils.setText('pss-count', `Displaying ${count} Prospect Sources`);
            };

            const ok = () => {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('pss-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pss-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid3 = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120}
                ];
    
                formSearchGrid = new AGGrid('pss-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid3();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('pss-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
                let inParams = {
                    code: $$('pss-code-search').getValue(),
                    codeSearchType: $$('pss-code-criteria').getValue(),
                    description: $$('pss-description-search').getValue(),
                    descriptionSearchType: $$('pss-description-criteria').getValue(),
                };
    
                AWS.callSoap(WS, 'searchProspectSources', inParams).then(data => {
                    if (data.wsStatus === '0') {
    
                        // Clear the grid.
                        formSearchGrid.clear();
    
                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('pss-reset').onclick(reset);
            $$('pss-search').onclick(search);
            $$('pss-ok').onclick(ok);
            $$('pss-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    const searchEmployee = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('employee-search');
    
        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-lname-search').clear();
    
                $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-fname-search').clear();
    
                $$('esp-reset').enable();
                $$('esp-search').enable();
    
                $$('esp-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('esp-count', `Displaying ${count} Employees`);
            };

            const ok = () => {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };
    
            // Setup drop downs.
            bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid5 = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lastName', width: 80},
                    {headerName: 'First Name', field: 'firstName', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 80},
                ];
    
                formSearchGrid = new AGGrid('esp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid5();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);


            const search = () => {
                let inParams = {
                    firstName: $$('esp-fname-search').getValue(),
                    firstNameSearchType: $$('esp-fname-criteria').getValue(),
                    lastName: $$('esp-lname-search').getValue(),
                    lastNameSearchType: $$('esp-lname-criteria').getValue(),
                };
    
                AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                    if (data.wsStatus === '0') {
    
                        // Clear the grid.
                        formSearchGrid.clear();
    
                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
    
                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };
    
            $$('esp-reset').onclick(reset);
            $$('esp-search').onclick(search);
            $$('esp-ok').onclick(ok);
            $$('esp-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    
    };

    let filters = {};
    let searchMeta = {
        firstItemIndexPaging: 0,
        sortAsc: true,
        sortField: '',
        usingPaging: true
    };
    let grid = null;
    const filterControlKeys = {
        'name': { value: 'filter-name', label: 'Name', popup: false },
        'nameSearchType': { value: 'filter-name-type', popup: false },
        'sourceId': { value: 'filter-source', popup: false },
        'statusId': { value: 'filter-status', popup: false },
        'typeId': { value: 'filter-type', popup: false },
        'identifier': { value: 'fp-id', label: 'Identifier', popup: true },
        'identifierSearchType': { value: 'fp-id-type', popup: true },
        'mainContactFirstName': { value: 'fp-contact-fname', label: 'Main Contact First Name', popup: true },
        'mainContactFirstNameSearchType': { value: 'fp-contact-fname-type', popup: true },
        'mainContactLastName': { value: 'fp-contact-lname', label: 'Main Contact Last Name', popup: true },
        'mainContactLastNameSearchType': { value: 'fp-contact-lname-type', popup: true },
        'hasPhone': { value: 'fp-has-phone', label: 'Has Phone', popup: true },
        'hasEmail': { value: 'fp-has-email', label: 'Has Email', popup: true },
        'firstContactDateAfter': { value: 'fp-contact-fdate-from', label: 'First Contact Date', popup: true },
        'firstContactDateBefore': { value: 'fp-contact-fdate-to', label: 'First Contact Date', popup: true },
        'lastContactDateAfter': { value: 'fp-contact-ldate-from', label: 'Last Contact Date', popup: true },
        'lastContactDateBefore': { value: 'fp-contact-ldate-to', label: 'Last Contact Date', popup: true },
        'lastLogDateAfter': { value: 'fp-last-log-date-from', label: 'Last Log Date', popup: true },
        'lastLogDateBefore': { value: 'fp-last-log-date-to', label: 'Last Log Date', popup: true },
        'statusDateAfter': { value: 'fp-status-date-from', label: 'Status Date', popup: true },
        'statusDateBefore': { value: 'fp-status-date-to', label: 'Status Date', popup: true },
        'timeZone': { value: 'fp-time-zone', label: 'Time Zone', popup: true },
        'salesPersonId': { value: 'fp-salesperson', label: 'Sales Person', popup: true },
        'activesOnly': { value: 'filter-active-only', popup: false },
    };

    function formatTimezone(x) {
        switch (x.value) {
            case -10:
                return "Hawaiian";
            case -9:
                return "Alaskan";
            case -8:
                return "Pacific";
            case -7:
                return "Mountain";
            case -6:
                return "Central";
            case -5:
                return "Eastern";
            default:
                return "";
        }
    }

    const columnDefs = [
        {headerName: 'Name', field: 'name', hide: false},
        {headerName: 'ID', field: 'identifier', hide: true},
        {headerName: 'First Contact', field: 'firstContactDate1', type: "numericColumn", hide: true},
        {headerName: 'Last Contact', field: 'lastContactDate1', type: "numericColumn", hide: false},
        {headerName: 'Last Log', field: 'lastLogDate1', type: "numericColumn", hide: false},
        {headerName: 'Next Contact', field: 'nextContactDate1', type: "numericColumn", hide: false},
        {headerName: 'Status', field: 'status', type: "numericColumn", hide: false},
        {headerName: 'Status Date', field: 'statusDate1', hide: true},
        {headerName: 'Source', field: 'source', hide: true},
        {headerName: 'Type', field: 'prospectType', hide: false},
        {headerName: 'Company Phone', field: 'companyPhone', hide: true},
        {headerName: 'Company Fax', field: 'companyFax', hide: true},
        {headerName: 'Last Name', field: 'mainContactLastName', hide: true},
        {headerName: 'First Name', field: 'mainContactFirstName', hide: true},
        {headerName: 'Main Contact', field: 'mainContactName', hide: false},
        {headerName: 'Other Contact', field: 'otherContactName', hide: true},
        {headerName: 'Sales Person', field: 'salesPerson', hide: true},
        {headerName: 'Certainty', field: 'certainty', hide: true},
        {headerName: 'Opportunity $', field: 'opportunityValue', hide: true},
        {headerName: 'Weighted $', field: 'weightedOpportunity2', hide: true},
        {headerName: 'Time Zone', field: 'timeZone2', hide: true, valueFormatter: formatTimezone}
    ]; 

    const resetFilter = () => {

        Object.keys(filterControlKeys).map(key => {
            filters[key] = '';
        });

        $$('filter-name-type').setValue('2');
        $$('filter-name').clear();

        listSmartChooser([
            {tag: 'filter-status', url: 'searchProspectStatuses', ID: 'id', label: 'code', param: {statusId: ''}},
            {tag: 'filter-type', url: 'searchProspectTypes', ID: 'id', label: 'code', param: {typeId: ''}},
            {tag: 'filter-source', url: 'searchProspectSources', ID: 'id', label: 'code', param: {id: ''}},
        ]);
        $$('filter-status').setSelectFunction(() => executeSelectFunc('filter-status', searchProspectStatus, 'id', 'code'));
        $$('filter-type').setSelectFunction(() => executeSelectFunc('filter-type', searchProspectType, 'id', 'code'));
        $$('filter-source').setSelectFunction(() => executeSelectFunc('filter-source', searchProspectSource, 'id', 'code'));
        $$('fp-salesperson').setSelectFunction(() => executeSelectFunc('fp-salesperson', searchEmployee, 'id', 'name'));

        $$('filter-details').setValue('(No Filters Applied)');
        searchMeta.firstItemIndexPaging = 0;

    };

    const initMainDataGrid = () => {
        if (grid)
            grid.destroy();

        grid = new AGGrid('grid', columnDefs, 'id');
        grid.show();

        grid.setOnSelectionChanged((rows) => {
            $$('edit').enable(rows);
            $$('merge').enable(rows);
            $$('delete').enable(rows);
        });
        grid.setOnRowDoubleClicked(editProspect);
    };

    $$('recent-prospects').onChange(val => {
        $$('edit-previous-prospect').enable(!val);
    });

    const updateGrid = () => {
        const t = {};
        Object.keys(filterControlKeys).map(key => {
            if (!filterControlKeys[key].popup) {
                filters[key] = $$(filterControlKeys[key].value).getValue();
            }
            t[key] = filters[key];
        });
        t.searchMeta = searchMeta;
        

        AWS.callSoap(WS, 'searchProspects', t).then(res => {
            grid.clear();
            const records = Utils.assureArray(res.item);
            for (let i = 0; i < records.length ; i ++) {
                const row = records[i];
                row.firstContactDate1 = row.firstContactDate !== '0' ? DateUtils.intToStr4(Number(row.firstContactDate)) : '';
                row.lastContactDate1 = row.lastContactDate !== '0' ? DateUtils.intToStr4(Number(row.lastContactDate)) : '';
                row.lastLogDate1 = row.lastLogDate !== '0' ? DateUtils.intToStr4(Number(row.lastLogDate)) : '';
                row.nextContactDate1 = row.nextContactDate !== '0' ? DateUtils.intToStr4(Number(row.nextContactDate)) : '';
                row.statusDate1 = row.statusDate !== '0' ? DateUtils.intToStr4(Number(row.statusDate)) : '';
                row.timeZone2= row.timeZone !== '100' ? (Number(row.timeZone)) :'';
               
            }
            for (let i=0 ; i < records.length ; i++) {
                let r = records[i];
                r.weightedOpportunity2 = Utils.format(Number(r.weightedOpportunity), "BCD", 0 , 0);
            }

            grid.addRecords(records);

            searchMeta.itemsPerPage = Number(res.searchMeta.itemsPerPage);
            searchMeta.firstItemIndexPaging = Number(res.searchMeta.firstItemIndexPaging);
            
            $$('prospectsPagination_label').setHTMLValue('<b>' + (Number(searchMeta.firstItemIndexPaging) + 1) + ' - ' + (records.length + Number(searchMeta.firstItemIndexPaging)) + '</b> of <b>' + res.searchMeta.totalItemsPaging + '</b>');

            if ((res.searchMeta.totalItemsPaging - res.searchMeta.firstItemIndexPaging) / res.searchMeta.itemsPerPage > 1) {
                $$("prosp-next").enable();
            }
            else{
                $$("prosp-next").disable();
            }

            if (res.searchMeta.firstItemIndexPaging > 0) {
                $$("prosp-prev").enable();
            }
            else{
                $$("prosp-prev").disable();

            }

            $$("prosp-next").onclick(() => {
                searchMeta.firstItemIndexPaging = searchMeta.firstItemIndexPaging + searchMeta.itemsPerPage;
                updateGrid();
            });

            $$("prosp-prev").onclick(() => {
                searchMeta.firstItemIndexPaging = searchMeta.firstItemIndexPaging - searchMeta.itemsPerPage;
                updateGrid();
            });
        });

        $$('edit').disable();
        $$('merge').disable();
        $$('delete').disable();
    };
    
    const getSearchType = (value) => {
        let txt = '';
        Object.keys(StringCriteriaMatcher).map(key => {
            if (StringCriteriaMatcher[key].value === value)
                txt = StringCriteriaMatcher[key].name;
        });
        return txt;
    };
    const getTimezone = (value) => {
        const timezones = { "-10": "Hawaiian (-10:00)", "-9": "Alaskan (-09:00)", "-8": "Pacific (-08:00)", "-7": "Mountain (-07:00)", "-6": "Central (-06:00)",
            "-5": "Eastern (-05:00)",
        };

        return timezones[value];
    };
    const updateFilterDetails = () => {
        let details = '';
        Object.keys(filterControlKeys).map(key => {
            const filter = filters[key];
            if (!filter) return;
            if (['identifier', 'name', 'mainContactFirstName', 'mainContactLastName'].indexOf(key) > -1) {
                details += `${filterControlKeys[key].label} ${getSearchType(filters[key+'SearchType'])} '${filter}';\n`;
            } else if ( key.indexOf('Date') > -1) {
                details += `${filterControlKeys[key].label} ${key.indexOf('After') > -1 ? '>=' : '<='} ${DateUtils.intToStr4(filter)};\n`;
            } else if ( key == 'timeZone' ) {
                details += `${filterControlKeys[key].label} = ${getTimezone(filter)};\n`;
            } else if ( ['hasPhone', 'hasEmail', 'salesPersonId'].indexOf(key) > -1) {
                details += `${filterControlKeys[key].label} = ${filter};\n`;
            }
        });
        if (details === '') {
            details = '(No Filters Applied)';
        }
        $$('filter-details').setValue(details);
    };

    const selectFilter = async () => {

        timezonesToDropDown('fp-time-zone');
        await listSmartChooser({tag: 'fp-salesperson', url: 'searchEmployees', ID: 'id', label: 'name'});
        Utils.popup_open('filters');

        return new Promise(function (resolve, reject) {

            Object.keys(filterControlKeys).map(key => {
                const control = filterControlKeys[key];

                if (!control.popup)
                    return;

                if (key.indexOf('Type') > -1) {
                    $$(control.value).setValue(2);
                } else if (key.indexOf('sales') > -1) {
                    $$(control.value).setValue('');
                } else if (key.indexOf('timeZone') == -1) {
                    $$(control.value).clear();
                }

                if (filters[key]) {
                    $$(control.value).setValue(filters[key]);
                }
            });

            $$('fp-ok').onclick(() => {
                Object.keys(filterControlKeys).map(key => {
                    const control = filterControlKeys[key];

                    if (!control.popup)
                        return;
                    if (key.indexOf('Date') > -1) {
                        filters[key] = $$(control.value).getIntValue();
                    } else {
                        filters[key] = $$(control.value).getValue();
                    }
                });

                updateFilterDetails();
                resolve(null);
                Utils.popup_close();
            });

            $$('fp-cancel').onclick(() => {
                resolve(null);
                Utils.popup_close();
            });

        });
    };

    const selectColumns = () => {

        Utils.popup_open('columns');

        return new Promise(function (resolve, reject) {

            columnDefs.map((column, index) => {
                $$(`cp-chk-${index}`).setValue(!column.hide);
            })

            const ok = () => {
                columnDefs.map((column, index) => {
                    columnDefs[index].hide = !$$(`cp-chk-${index}`).getValue();
                });
                resolve(null);
                Utils.popup_close();
            };
            
            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('cp-ok').onclick(ok);
            $$('cp-cancel').onclick(cancel);
        });
    };

    const detailPopup = () => {

        let tabContainer = null;

        countriesToDropDown('dp-country');
        timezonesToDropDown('dp-time-zone');

        /**
         * Show a drop down or a text input for entering state, depending on the value of the country drop down.
         */
        const filterState = () => {
            let states = getStatesForCountry($$('dp-country').getValue());

            if (states != null) {
                statesToDropDown('dp-state-drop-down', states);

                $$('dp-state-drop-down').show();
                $$('dp-state').hide();
            } else {
                $$('dp-state-drop-down').hide();
                $$('dp-state').show();
            }
        };

        const resetDialog = () => {
            // Basic tab.
            $$('dp-name').clear();
            $$('dp-street1').clear();
            $$('dp-street2').clear();
            $$('dp-city').clear();
            $$('dp-zip').clear();
            $$('dp-phone').clear();
            $$('dp-fax').clear();
            $$('dp-id').clear();
            $$('dp-first-contact-date').clear();
            $$('dp-certainty').clear();
            $$('dp-source').setValue('');
            $$('dp-status').setValue('');
            $$('dp-type').setValue('');
            $$('dp-salesperson').setValue('');
            $$('dp-time-zone').setValue('');

            // Contract Detail tab.
            $$('dp-contact-first-name').clear();
            $$('dp-contact-last-name').clear();
            $$('dp-contact-email').clear();
            $$('dp-contact-job-title').clear();
            $$('dp-contact-phone').clear();
            $$('dp-contact-fax').clear();
            $$('dp-contact-type').setValue('');

            $$('dp-open-detail').setValue(true);
    
            // Select the first tab.
            tabContainer.selectTab('detailTabButton');
        };

        /**
         * Initialize the new worker dialog.
         */
        const initDialog = async () => {
            // Setup tab layout.
            tabContainer = new TabContainer('detailTabContainer');

            resetDialog();

            listSmartChooser([
                {tag: 'dp-status', url: 'searchProspectStatuses', ID: 'id', label: 'code'},
                {tag: 'dp-type', url: 'searchProspectTypes', ID: 'id', label: 'code'},
                {tag: 'dp-source', url: 'searchProspectSources', ID: 'id', label: 'code'},
                {tag: 'dp-salesperson', url: 'searchEmployees', ID: 'id', label: 'name'},
            ]);

            $$('dp-status').setSelectFunction(() => executeSelectFunc('dp-status', searchProspectStatus, 'id', 'code'));
            $$('dp-type').setSelectFunction(() => executeSelectFunc('dp-type', searchProspectType, 'id', 'code'));
            $$('dp-source').setSelectFunction(() => executeSelectFunc('dp-source', searchProspectSource, 'id', 'code'));
            $$('dp-salesperson').setSelectFunction(() => executeSelectFunc('dp-salesperson', searchEmployee, 'id', 'name'));

            countriesToDropDown('dp-country');

            filterState();

            statesToDropDown('dp-state-drop-down', US_STATE_ABBREVIATIONS);
        };

        initDialog();

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {

            $$('dp-country').onChange(filterState);
            
            const ok = () => {
                if ($$('dp-name').isError('Name')) {
                    tabContainer.selectTab('detailTabButton');
                    return;
                }
                if ($$('dp-source').isError('Source')) {
                    tabContainer.selectTab('detailTabButton');
                    return;
                }
                if ($$('dp-status').isError('Status')) {
                    tabContainer.selectTab('detailTabButton');
                    return;
                }
                if ($$('dp-type').isError('Type')) {
                    tabContainer.selectTab('detailTabButton');
                    return;
                }
                if ($$('dp-salesperson').isError('Sales Person')) {
                    tabContainer.selectTab('detailTabButton');
                    return;
                }

                const data = {
                    certainty: $$('dp-certainty').getValue(),
                    city: $$('dp-city').getValue(),
                    country: $$('dp-country').getValue(),
                    firstContactDate: $$('dp-first-contact-date').getIntValue(),
                    identidentifier: $$('dp-id').getValue(),
                    mainContactFirstName: $$('dp-contact-first-name').getValue(),
                    mainContactJobTitle: $$('dp-contact-job-title').getValue(),
                    mainContactLastName: $$('dp-contact-last-name').getValue(),
                    mainContactPersonalEmail: $$('dp-contact-email').getValue(),
                    mainContactType: $$('dp-contact-type').getValue(),
                    mainContactWorkFax: $$('dp-contact-fax').getValue(),
                    mainContactWorkPhone: $$('dp-contact-phone').getValue(),
                    mainFaxNumber: $$('dp-fax').getValue(),
                    mainPhoneNumber: $$('dp-phone').getValue(),
                    name: $$('dp-name').getValue(),
                    salesPersonId: $$('dp-salesperson').getValue(),
                    sourceDetail: $$('dp-source-detail').getValue(),
                    sourceId: $$('dp-source').getValue(),
                    state: Utils.isVisible('dp-state-drop-down') ? $$('dp-state-drop-down').getValue() : $$('dp-state').getValue(),
                    statusId: $$('dp-status').getValue(),
                    street: $$('dp-street1').getValue(),
                    street2: $$('dp-street2').getValue(),
                    zip: $$('dp-zip').getValue(),
                    timeZone: $$('dp-time-zone').getValue(),
                    typeId: $$('dp-type').getValue(),
                };


                AWS.callSoap(WS, 'newProspect', data).then(ret => {
                    if (ret.wsStatus === '0') {
                        if ($$('dp-open-detail').getValue()) {
                            Utils.saveData(CURRENT_PROSPECT_ID, ret.id);
                            Utils.saveData(CURRENT_PROSPECT_NAME, $$('dp-name').getValue());
                            Framework.getChild();
                        } else {
                            updateGrid();
                        }
                    }
                })

                resolve(data);
                Utils.popup_close();
            };
            
            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);

        });

    };

    const searchProspects = (excludeId) => {
        let formSearchGrid = null;

        listSmartChooser([
            {tag: 'psp-status', url: 'searchProspectStatuses', ID: 'id', label: 'code'},
            {tag: 'psp-source', url: 'searchProspectSources', ID: 'id', label: 'code'},
        ]);

        $$('psp-status').setSelectFunction(() => executeSelectFunc('psp-status', searchProspectStatus, 'id', 'code'));
        $$('psp-source').setSelectFunction(() => executeSelectFunc('psp-source', searchProspectType, 'id', 'code'));
        
        Utils.popup_open('prospect-search');

        return new Promise(async function (resolve, reject) {

            const reset = () => {
                $$('psp-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-name-search').clear();

                $$('psp-id-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-id-search').clear();

                $$('psp-pcontact-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-pcontact-fname-search').clear();

                $$('psp-pcontact-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-pcontact-lname-search').clear();

                $$('psp-status').setValue('');
                $$('psp-source').setValue('');

                $$('psp-reset').enable();
                $$('psp-search').enable();

                $$('psp-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            };

            const changeCount = count => {
                Utils.setText('psp-stat-count', `Displaying ${count} Prospects`);
            };

            const ok = () => {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                reset();
                Utils.popup_close();
            };

            // Setup drop downs.
            bindToEnum('psp-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-id-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-pcontact-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-pcontact-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid4 = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Name', field: 'name', width: 80},
                    {headerName: 'ID', field: 'identifier', width: 60},
                    {headerName: 'Status', field: 'status', width: 60},
                    {headerName: 'Source', field: 'source', width: 60},
                    {headerName: 'First Contact', field: 'firstContactDate', width: 60},
                    {headerName: 'Last Name', field: 'mainContactLastName', width: 60},
                    {headerName: 'First Name', field: 'mainContactFirstName', width: 60},
                ];

                formSearchGrid = new AGGrid('psp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };

            if (!formSearchGrid)
                initDataGrid4();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('psp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);


            const search = () => {
                let inParams = {
                    excludeId: excludeId,
                    identifier: $$('psp-id-search').getValue(),
                    identifierSearchType: $$('psp-id-criteria').getValue(),
                    name: $$('psp-name-search').getValue(),
                    nameSearchType: $$('psp-name-criteria').getValue(),
                    mainContactFirstName: $$('psp-pcontact-fname-search').getValue(),
                    mainContactFirstNameSearchType: $$('psp-pcontact-fname-criteria').getValue(),
                    mainContactLastName: $$('psp-pcontact-lname-search').getValue(),
                    mainContactLastNameSearchType: $$('psp-pcontact-lname-criteria').getValue(),
                    sourceId: $$('psp-source').getValue(),
                    statusId: $$('psp-status').getValue(),
                    sortAsc: true,
                    sortOn: 'identifier'
                };

                AWS.callSoap(WS, 'searchProspects', inParams).then(data => {
                    if (data.wsStatus === '0') {

                        // Clear the grid.
                        formSearchGrid.clear();

                        if (data.item) {
                            let records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);

                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            };

            $$('psp-reset').onclick(reset);
            $$('psp-search').onclick(search);
            $$('psp-ok').onclick(ok);
            $$('psp-cancel').onclick(cancel);

            search();

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });

    };

    const mergePopup = (row) => {

        let leftID = null, rightID = null;

        $$('mp-left-salesperson').setSelectFunction(() => executeSelectFunc('mp-left-salesperson', searchEmployee, 'id', 'name'));
        $$('mp-right-salesperson').setSelectFunction(() => executeSelectFunc('mp-right-salesperson', searchEmployee, 'id', 'name'));

        async function updateFields(dir, data) {            
            
            $$(`mp-${dir}-name`).setValue(data.name);
            $$(`mp-${dir}-street1`).setValue(data.street1);
            $$(`mp-${dir}-street2`).setValue(data.street2);
            $$(`mp-${dir}-country`).setValue(data.country);
            $$(`mp-${dir}-city`).setValue(data.city);
            $$(`mp-${dir}-state`).setValue(data.state);
            $$(`mp-${dir}-zip`).setValue(data.zip);
            $$(`mp-${dir}-id`).setValue(data.identifier);
            $$(`mp-${dir}-zip`).setValue(data.zip);
            $$(`mp-${dir}-source-detail`).setValue(data.description);
            $$(`mp-${dir}-first-contact-date`).setValue(data.firstContact);
            $$(`mp-${dir}-certainty`).setValue(Number.parseInt(data.certainty));

            let p1 = AWS.callSoap(WS, 'searchProspectSources', {});
            let p2 = AWS.callSoap(WS, 'searchProspectStatuses', {});
            let p3 = AWS.callSoap(WS, 'searchEmployees', {});

            await AWS.callAll([p1, p2, p3],
                function (ret) {
                    initSmartChooser({tag: `mp-${dir}-source`, ID: 'id', label: 'code'}, ret);
                    Utils.assureArray(ret.item).map(item=>{
                        if (item.code !== data.source)
                            return;
                        $$(`mp-${dir}-source`).setValue(item.id);                        
                    });
                },
                function (ret) {
                    initSmartChooser({tag: `mp-${dir}-status`, ID: 'id', label: 'code'}, ret);
                    Utils.assureArray(ret.item).map(item=>{
                        if (item.code !== data.status)
                            return;
                        $$(`mp-${dir}-status`).setValue(item.id);                        
                    });
                },
                function (ret) {
                    initSmartChooser({tag: `mp-${dir}-salesperson`, ID: 'id', label: 'name'}, ret);
                    Utils.assureArray(ret.item).map(item=>{
                        if (item.name !== data.salesPerson)
                            return;
                        $$(`mp-${dir}-salesperson`).setValue(item.id);                        
                    });
                }
            );
        }

        function getDataFromFields(dir) {
            return {
                name: $$(`mp-${dir}-name`).getValue(),
                street1: $$(`mp-${dir}-street1`).getValue(),
                street2: $$(`mp-${dir}-street2`).getValue(),
                country: $$(`mp-${dir}-country`).getValue(),
                city: $$(`mp-${dir}-city`).getValue(),
                state: $$(`mp-${dir}-state`).getValue(),
                zip: $$(`mp-${dir}-zip`).getValue(),
                identifier: $$(`mp-${dir}-id`).getValue(),
                source: $$(`mp-${dir}-source`).getValue(),
                description: $$(`mp-${dir}-source-detail`).getValue(),
                status: $$(`mp-${dir}-status`).getValue(),
                firstContact: $$(`mp-${dir}-first-contact-date`).getIntValue(),
                salesPerson: $$(`mp-${dir}-salesperson`).getValue(),
                certainty: $$(`mp-${dir}-certainty`).getValue()
            };
        }

        AWS.callSoap(WS, 'getProspectDetails', {prospectId: row.id}).then(ret => {
            if (ret.wsStatus === '0') {
                leftID = row.id;
                updateFields('left', ret);
            }
        });

        Utils.popup_open('merge-popup');

        return new Promise(function (resolve, reject) {

            $$('mp-search').onclick(async () => {
                let data = await searchProspects(leftID);
                if (data) {
                    rightID = data.id;
                    updateFields('right', data);
                    $$('mp-ok').enable();
                }
            });

            const ok = () => {
                if (!rightID)
                    return;

                let sel = $$('mp-prospect-selection').getValue();

                if ($$(`mp-${sel}-name`).isError('Name')) 
                    return;
                if ($$(`mp-${sel}-source`).isError('Prospect Source')) 
                    return;
                if ($$(`mp-${sel}-status`).isError('Prospect Status')) 
                    return;

                Utils.yesNo('Confirmation', 'Are you sure you want to merge these two prospects?', () => {
                    
                    const data = getDataFromFields(sel);
                    AWS.callSoap(WS, 'saveProspect', { ...data, prospect1Id: leftID, prospect2Id: rightID}).then(data => {
                        if (data.wsStatus === '0') {
                            resolve(null);
                            Utils.popup_close();
                        }
                    })           
                });                
                
            };
            
            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('mp-ok').onclick(ok);
            $$('mp-cancel').onclick(cancel);

        });
    };

    const rememberVisitedProspect = function (id, name) {
        let visitedProspect = Utils.getData(VISITED_PROSPECTS);
        if (!visitedProspect)
            visitedProspect = {};
        if (visitedProspect[id])
            return;
        visitedProspect[id] = {};
        visitedProspect[id].name = name;
        Utils.saveData(VISITED_PROSPECTS, visitedProspect);
    };

    {
        const visitedProspect = Utils.getData(VISITED_PROSPECTS);
        const vp = $$('recent-prospects');
        vp.clear();
        if (visitedProspect && Utils.countProperties(visitedProspect))
            for (let id in visitedProspect)
                vp.add(id, visitedProspect[id].name);
    }

    $$('edit-previous-prospect').onclick(function () {
        let id = $$('recent-prospects')
        Utils.saveData(CURRENT_PROSPECT_ID, id.getValue());
        Utils.saveData(CURRENT_PROSPECT_NAME, id.getLabel());
        Framework.getChild();
    });

    function editProspect() {
        const row = grid.getSelectedRow();
        rememberVisitedProspect(row.id,row.name)
        Utils.saveData(CURRENT_PROSPECT_ID, row.id);
        Utils.saveData(CURRENT_PROSPECT_NAME, row.name);
        Framework.getChild();
    }


    initMainDataGrid();
    resetFilter();

    $$('filter-columns').onclick(async () => {
        await selectColumns();
        initMainDataGrid();
        updateGrid();
    });
    $$('filter-search').onclick(() => {
        searchMeta.firstItemIndexPaging = 0;
        updateGrid();
    });
    $$('filter-reset').onclick(resetFilter);
    $$('filters-button').onclick(selectFilter);

    $$('add').onclick(detailPopup);
    $$('edit').onclick(editProspect);
    $$('merge').onclick(async () => {
        let row = grid.getSelectedRow();
        await mergePopup(row);
        updateGrid();
    });
    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Prospect?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteProspects", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });            
        });
    });

    $$('report').onclick(() => {
        const t = {};
        Object.keys(filterControlKeys).map(key => {
            if (!filterControlKeys[key].popup) {
                filters[key] = $$(filterControlKeys[key].value).getValue();
            }
            t[key] = filters[key];
        });
        AWS.callSoap(WS, 'getReport', t).then(ret => {
            console.log(res)
            Utils.showReport(ret.reportUrl);
        });
    });

$$('export').onclick(() => {
    const t = {};
    Object.keys(filterControlKeys).map(key => {
        if (!filterControlKeys[key].popup) {
            filters[key] = $$(filterControlKeys[key].value).getValue();
        }
        t[key] = filters[key];
    });
    Utils.waitMessage('Export in progress; please wait.');
    AWS.callSoap(WS, 'getExport', t).then(ret => {
        Utils.waitMessageEnd();
        Utils.showReport(ret.reportUrl);
    });
});

updateGrid();
})();
