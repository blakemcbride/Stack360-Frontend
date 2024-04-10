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

    const WS = 'StandardCrmProspectParent';

    function timezonesToDropDown(id) {
        const timezones = { "": "(unspecified)", "-10": "Hawaiian (-10:00)", "-9": "Alaskan (-09:00)", "-8": "Pacific (-08:00)", "-7": "Mountain (-07:00)", "-6": "Central (-06:00)",
            "-5": "Eastern (-05:00)",
        };
        const ctl = $$(id);

        ctl.clear();
        Object.keys(timezones).map(key => {
            ctl.add(key, timezones[key]);
        });
    }

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    async function executeSelectFunc(element, fn, id, name) {
        const selectedNode = await fn();
        if (selectedNode)
            $$(element).setValue(selectedNode[id], selectedNode[name]);
    }

    function initSmartChooser(element, res) {
        const ctl = $$(element.tag);
        if (!res.item) {
            ctl.clear();
            ctl.forceSelect();
            return;
        }

        if (res.item.length > res.lowCap)
            ctl.forceSelect();

        ctl.addItems(Utils.assureArray(res.item), element.ID, element.label);

        if (res.selectedItem) {
            ctl.addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
            ctl.setValue(res.selectedItem[element.ID]);
        }
    }

    function listSmartChooser(data) {
        return new Promise(function (resolve, reject) {
            const elements = Utils.assureArray(data);
            let n = elements.length;

            elements.map(element => {
                $$(element.tag).clear();

                AWS.callSoap(WS, element.url, element.param).then(res => {
                    if (res.wsStatus === '0') {
                        initSmartChooser(element, res);
                        if (!--n)
                            resolve();  // all of the smartchoosers have been initialized
                    }
                });
            });
        });
    }

    function searchProspectStatus() {
        let formSearchGrid = null;
        
        Utils.popup_open('prospect-status-search');

        return new Promise(async function (resolve, reject) {

            function reset() {
                $$('pst-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pst-code-search').clear();

                $$('pst-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pst-description-search').clear();

                $$('pst-reset').enable();
                $$('pst-search').enable();

                $$('pst-ok').disable();

                formSearchGrid.clear();
                changeCount(0);
            }

            function changeCount(count) {
                Utils.setText('pst-count', `Displaying ${count} Prospect Status`);
            }

            function ok() {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            }

            function cancel() {
                resolve(null);
                reset();
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('pst-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pst-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid1() {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Code', field: 'code', width: 50},
                    {headerName: 'Description', field: 'description', width: 160},
                    {headerName: 'Status', field: 'status', width: 40}
                ];

                formSearchGrid = new AGGrid('pst-grid', columnDefs, 'id');
                formSearchGrid.show();
            }

            if (!formSearchGrid)
                initDataGrid1();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('pst-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            function search() {
                const inParams = {
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
            }

            $$('pst-reset').onclick(reset);
            $$('pst-search').onclick(search);
            $$('pst-ok').onclick(ok);
            $$('pst-cancel').onclick(cancel);

            search();

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    }

    function searchProspectType() {
        let formSearchGrid = null;
        
        Utils.popup_open('prospect-type-search');
    
        return new Promise(async function (resolve, reject) {

            function reset() {
                $$('pt-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pt-code-search').clear();
    
                $$('pt-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pt-description-search').clear();
    
                $$('pt-reset').enable();
                $$('pt-search').enable();
    
                $$('pt-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            }
    
            function changeCount(count) {
                Utils.setText('pt-count', `Displaying ${count} Prospect Types`);
            }

            function ok() {
                const row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            }

            function cancel() {
                resolve(null);
                reset();
                Utils.popup_close();
            }
    
            // Setup drop downs.
            bindToEnum('pt-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pt-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid2() {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120},
                    {headerName: 'Type', field: 'type', width: 60},
                ];
    
                formSearchGrid = new AGGrid('pt-grid', columnDefs, 'id');
                formSearchGrid.show();
            }
    
            if (!formSearchGrid)
                initDataGrid2();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('pt-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);

            function search() {
                const inParams = {
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
                            formSearchGrid.addRecords(Utils.assureArray(data.item));
                            changeCount(records.length);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            }
    
            $$('pt-reset').onclick(reset);
            $$('pt-search').onclick(search);
            $$('pt-ok').onclick(ok);
            $$('pt-cancel').onclick(cancel);
    
            search();
    
         });
    
    }

    function searchProspectSource() {
        let formSearchGrid = null;
        
        Utils.popup_open('prospect-source-search');
    
        return new Promise(async function (resolve, reject) {
            
            function reset() {
                $$('pss-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pss-code-search').clear();
    
                $$('pss-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('pss-description-search').clear();
    
                $$('pss-reset').enable();
                $$('pss-search').enable();
    
                $$('pss-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            }
    
            function changeCount(count) {
                Utils.setText('pss-count', `Displaying ${count} Prospect Sources`);
            }

            function ok() {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            }

            function cancel() {
                resolve(null);
                reset();
                Utils.popup_close();
            }
    
            // Setup drop downs.
            bindToEnum('pss-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('pss-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid3() {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120}
                ];
    
                formSearchGrid = new AGGrid('pss-grid', columnDefs, 'id');
                formSearchGrid.show();
            }
    
            if (!formSearchGrid)
                initDataGrid3();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('pss-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);

            function search() {
                const inParams = {
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
            }
    
            $$('pss-reset').onclick(reset);
            $$('pss-search').onclick(search);
            $$('pss-ok').onclick(ok);
            $$('pss-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    }

    function searchEmployee() {
        let formSearchGrid = null;
        
        Utils.popup_open('employee-search');
    
        return new Promise(async function (resolve, reject) {

            function reset() {
                $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-lname-search').clear();
    
                $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-fname-search').clear();
    
                $$('esp-reset').enable();
                $$('esp-search').enable();
    
                $$('esp-ok').disable();
    
                formSearchGrid.clear();
                changeCount(0);
            }

            function changeCount(count) {
                Utils.setText('esp-count', `Displaying ${count} Employees`);
            }

            function ok() {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            }

            function cancel() {
                resolve(null);
                reset();
                Utils.popup_close();
            }
    
            // Setup drop downs.
            bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid5() {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Last Name', field: 'lastName', width: 80},
                    {headerName: 'First Name', field: 'firstName', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 80},
                ];
    
                formSearchGrid = new AGGrid('esp-grid', columnDefs, 'id');
                formSearchGrid.show();
            }
    
            if (!formSearchGrid)
                initDataGrid5();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);

            function search() {
                const inParams = {
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
            }
    
            $$('esp-reset').onclick(reset);
            $$('esp-search').onclick(search);
            $$('esp-ok').onclick(ok);
            $$('esp-cancel').onclick(cancel);
    
            search();
    
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    }

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

    let grid = null;
    const filterControlKeys = {
        'name': { ctlId: 'filter-name', label: 'Name', popup: false },
        'nameSearchType': { ctlId: 'filter-name-type', popup: false },
        'sourceId': { ctlId: 'filter-source', labelValueField: 'sourceLabel', popup: false },
        'statusId': { ctlId: 'filter-status', labelValueField: 'statusLabel', popup: false },
        'typeId': { ctlId: 'filter-type', labelValueField: 'typeLabel', popup: false },
        'identifier': { ctlId: 'fp-id', label: 'Identifier', popup: true },
        'identifierSearchType': { ctlId: 'fp-id-type', popup: true },
        'mainContactFirstName': { ctlId: 'fp-contact-fname', label: 'Main Contact First Name', popup: true },
        'mainContactFirstNameSearchType': { ctlId: 'fp-contact-fname-type', popup: true },
        'mainContactLastName': { ctlId: 'fp-contact-lname', label: 'Main Contact Last Name', popup: true },
        'mainContactLastNameSearchType': { ctlId: 'fp-contact-lname-type', popup: true },
        'firstContactDateAfter': { ctlId: 'fp-contact-fdate-from', label: 'First Contact Date', popup: true },
        'firstContactDateBefore': { ctlId: 'fp-contact-fdate-to', label: 'First Contact Date', popup: true },
        'lastContactDateAfter': { ctlId: 'fp-contact-ldate-from', label: 'Last Contact Date', popup: true },
        'lastContactDateBefore': { ctlId: 'fp-contact-ldate-to', label: 'Last Contact Date', popup: true },
        'lastLogDateAfter': { ctlId: 'fp-last-log-date-from', label: 'Last Log Date', popup: true },
        'lastLogDateBefore': { ctlId: 'fp-last-log-date-to', label: 'Last Log Date', popup: true },
        'statusDateAfter': { ctlId: 'fp-status-date-from', label: 'Status Date', popup: true },
        'statusDateBefore': { ctlId: 'fp-status-date-to', label: 'Status Date', popup: true },
        'whenAddedDateAfter': { ctlId: 'fp-when-added-date-from', label: 'When Added After', popup: true },
        'whenAddDateBefore': { ctlId: 'fp-when-added-date-to', label: 'When Added Before', popup: true },
        'activityDateAfter': { ctlId: 'fp-activity-date-from', label: 'Activity After', popup: true },
        'activityDateBefore': { ctlId: 'fp-activity-date-to', label: 'Activity Before', popup: true },
        'timeZone': { ctlId: 'fp-time-zone', label: 'Time Zone', popup: true },
        'salesPersonId': { ctlId: 'fp-salesperson', label: 'Sales Person', labelValueField: 'salesPersonLabel', popup: true },
        'activesOnly': { ctlId: 'filter-active-only', popup: false },
    };
    const columnDefs = [
        {headerName: 'Name', field: 'name', hide: false},
        {headerName: 'ID', field: 'identifier', hide: true},
        {headerName: 'First Contact', field: 'firstContactDate1', type: "numericColumn", hide: true},
        {headerName: 'Last Contact', field: 'lastContactDate1', type: "numericColumn", hide: false},
        {headerName: 'Last Log', field: 'lastLogDate1', type: "numericColumn", hide: false},
        {headerName: 'Next Contact', field: 'nextContactDate1', type: "numericColumn", hide: false},
        {headerName: 'Status', field: 'status', hide: false},
        {headerName: 'Status Date', field: 'statusDate1', hide: true},
        {headerName: 'Source', field: 'source', hide: true},
        {headerName: 'Type', field: 'prospectType', hide: false},
        {headerName: 'Company Phone', field: 'companyPhone', hide: true},
        {headerName: 'Company Fax', field: 'companyFax', hide: true},
        {headerName: 'Main Contact Last Name', field: 'mainContactLastName', hide: false},
        {headerName: 'Main Contact First Name', field: 'mainContactFirstName', hide: false},
        {headerName: 'Main Contact Detail', field: 'mainContactName', hide: true},
        {headerName: 'Other Contact Detail', field: 'otherContactName', hide: true},
        {headerName: 'Sales Person', field: 'salesPerson', hide: true},
        {headerName: 'Certainty', field: 'certainty', hide: true},
        {headerName: 'Opportunity $', field: 'opportunityValue', hide: true},
        {headerName: 'Weighted $', field: 'weightedOpportunity2', hide: true},
        {headerName: 'Time Zone', field: 'timeZone2', hide: true, valueFormatter: formatTimezone},
        {headerName: 'When Added', field: 'whenAdded', valueFormatter: AGGrid.date, type: "numericColumn", hide: true},
    ]; 

    function resetAll() {
        Utils.getAndEraseData(PROSPECT_SEARCH_CONTEXT);
        grid.clear();
        $$('status').clear();
        Object.keys(filterControlKeys).map(key => {
            const ck = filterControlKeys[key];
            $$(ck.ctlId).setValue('');
        });
        $$('filter-name-type').setValue('2');
        $$('fp-id-type').setValue('2');
        $$('fp-contact-fname-type').setValue('2');
        $$('fp-contact-lname-type').setValue('2');
        $$('filter-details').clear();
        $$('sort1').clear();
        $$('sort-direction1').clear();
        $$('sort2').clear();
        $$('sort-direction2').clear();
        updateFilterDetails();
    }

    $$('filter-status').setSelectFunction(() => executeSelectFunc('filter-status', searchProspectStatus, 'id', 'code'));
    $$('filter-type').setSelectFunction(() => executeSelectFunc('filter-type', searchProspectType, 'id', 'code'));
    $$('filter-source').setSelectFunction(() => executeSelectFunc('filter-source', searchProspectSource, 'id', 'code'));
    $$('fp-salesperson').setSelectFunction(() => executeSelectFunc('fp-salesperson', searchEmployee, 'id', 'name'));

    function initMainDataGrid() {
        if (grid)
            grid.destroy();

        grid = new AGGrid('grid', columnDefs, 'id');
        grid.show();

        grid.setOnSelectionChanged((rows) => {
            $$('edit').enable(rows);
            $$('merge').enable(rows);
            $$('delete').enable(rows);
        });

        $$('recent-prospects').onChange(val => {
            if (val !== '')
                $$('edit-previous-prospect').enable();
            else
                $$('edit-previous-prospect').disable();
        });

        grid.setOnRowDoubleClicked(editProspect);
    }

    async function restoreContext() {
        return new Promise(async function (resolve, reject) {
            const context = Utils.getData(PROSPECT_SEARCH_CONTEXT);
            await listSmartChooser([
                {tag: 'filter-status', url: 'searchProspectStatuses', ID: 'id', label: 'code', param: {statusId: ''}},
                {tag: 'filter-type', url: 'searchProspectTypes', ID: 'id', label: 'code', param: {typeId: ''}},
                {tag: 'filter-source', url: 'searchProspectSources', ID: 'id', label: 'code', param: {id: ''}},
            ]);
            Object.keys(filterControlKeys).map(key => {
                const ck = filterControlKeys[key];
                if (!context)
                    $$(ck.ctlId).setValue('');
                else {
                    if (ck.labelValueField)
                        $$(ck.ctlId).setValue(context[key], context[ck.labelValueField]);
                    else
                        $$(ck.ctlId).setValue(context[key]);
                }
            });
            if (context) {
                $$('sort1').setValue(context.sort1);
                if (context.sortAsc1)
                    $$('sort-direction1').setValue(context.sortAsc1 ? 'true' : 'false');
                $$('sort2').setValue(context.sort2);
                if (context.sortAsc2)
                    $$('sort-direction2').setValue(context.sortAsc2 ? 'true' : 'false');
                updateGrid();
            } else {
                $$('filter-name-type').setValue('2');
                $$('fp-id-type').setValue('2');
                $$('fp-contact-fname-type').setValue('2');
                $$('fp-contact-lname-type').setValue('2');
            }
            resolve();
        });
    }

    function getValue(ck) {
        return ck.ctlId.indexOf('date') > -1 ? $$(ck.ctlId).getIntValue() : $$(ck.ctlId).getValue();
    }

    function updateGrid() {
        const data = {
            sort1: $$('sort1').getValue(),
            sortAsc1: $$('sort-direction1').getValue() === "true",
            sort2: $$('sort2').getValue(),
            sortAsc2: $$('sort-direction2').getValue() === "true"
        };
        Object.keys(filterControlKeys).map(key => {
            const ck = filterControlKeys[key];
            data[key] = getValue(ck);
        });
        data.statusLabel = $$('filter-status').getLabel();  // needed for context only
        data.typeLabel = $$('filter-type').getLabel();  // needed for context only
        data.sourceLabel = $$('filter-source').getLabel();  // needed for context only
        data.salesPersonLabel = $$('fp-salesperson').getLabel();  // needed for context only
        Utils.saveData(PROSPECT_SEARCH_CONTEXT, data);

        grid.clear();

        AWS.callSoap(WS, 'searchProspects', data).then(res => {
            const records = Utils.assureArray(res.item);
            for (let i = 0; i < records.length; i++) {
                const row = records[i];
                row.firstContactDate1 = row.firstContactDate !== '0' ? DateUtils.intToStr4(Number(row.firstContactDate)) : '';
                row.lastContactDate1 = row.lastContactDate !== '0' ? DateUtils.intToStr4(Number(row.lastContactDate)) : '';
                row.lastLogDate1 = row.lastLogDate !== '0' ? DateUtils.intToStr4(Number(row.lastLogDate)) : '';
                row.nextContactDate1 = row.nextContactDate !== '0' ? DateUtils.intToStr4(Number(row.nextContactDate)) : '';
                row.statusDate1 = row.statusDate !== '0' ? DateUtils.intToStr4(Number(row.statusDate)) : '';
                row.timeZone2 = row.timeZone !== '100' ? (Number(row.timeZone)) : '';
            }
            for (let i = 0; i < records.length; i++) {
                let r = records[i];
                r.weightedOpportunity2 = Utils.format(Number(r.weightedOpportunity), "BCD", 0, 0);
            }
            grid.addRecords(records);
            if (records.length >= Number(res.cap))
                $$('status').setValue('Displaying ' + records.length + ' records. (limit)').setColor('red');
            else
                $$('status').setValue('Displaying ' + records.length + ' records.').setColor('black');
        });

        $$('edit').disable();
        $$('merge').disable();
        $$('delete').disable();
    }

    function getSearchType(value) {
        let txt = '';
        Object.keys(StringCriteriaMatcher).map(key => {
            if (StringCriteriaMatcher[key].value === value)
                txt = StringCriteriaMatcher[key].name;
        });
        return txt;
    }

    function getTimezone(value) {
        const timezones = { "-10": "Hawaiian (-10:00)", "-9": "Alaskan (-09:00)", "-8": "Pacific (-08:00)", "-7": "Mountain (-07:00)", "-6": "Central (-06:00)",
            "-5": "Eastern (-05:00)",
        };

        return timezones[value];
    }

    function updateFilterDetails() {
        let details = '';
        Object.keys(filterControlKeys).map(key => {
            const ck = filterControlKeys[key];
            const val = getValue(ck);
            if (val) {
                if (['identifier', 'name', 'mainContactFirstName', 'mainContactLastName'].indexOf(key) > -1) {
                    details += ck.label + ' ' + getSearchType(val) + ' ' + val + '\n';
                } else if (key.indexOf('Date') > -1) {
                    details += ck.label + (key.indexOf('After') > -1 ? ' >= ' : ' <= ') + DateUtils.intToStr4(val) + '\n';
//                details += `${filterControlKeys[key].label} ${key.indexOf('After') > -1 ? '>=' : '<='} ${DateUtils.intToStr4(${$$(ck.ctlId).getValue())};\n`;
                } else if (key === 'timeZone') {
                    details += ck.label + getTimezone(val) + '\n';
//                details += `${filterControlKeys[key].label} = ${getTimezone(${$$(ck.ctlId).getValue())};\n`;
                } else if (['hasPhone', 'hasEmail'].indexOf(key) > -1) {
                    details += ck.label + ' = ' + val + '\n';
                    //               details += `${filterControlKeys[key].label} = ${${$$(ck.ctlId).getValue()};\n`;
                } else if (['salesPersonId'].indexOf(key) > -1) {
                    details += `${filterControlKeys[key].label} = ` + $$('fp-salesperson').getLabel() + '\n';
                }
            }
        });
        if ($$('sort1').getValue()) {
            if (details)
                details += "\n";
            details += "Primary sort " + $$('sort1').getValue() + " " + ($$('sort-direction1').getValue() === "true" ? "ascending\n" : "descending\n");
            if ($$('sort2').getValue())
                details += "Secondary sort " + $$('sort2').getValue() + " " + ($$('sort-direction2').getValue() === "true" ? "ascending" : "descending");
        }
        if (details === '')
            details = '(No filters or sorts applied)';
        $$('filter-details').setValue(details);
    }

    function selectFilter() {
        timezonesToDropDown('fp-time-zone');
//        listSmartChooser({tag: 'fp-salesperson', url: 'searchEmployees', ID: 'id', label: 'name'});
        {
            const ctl = $$('fp-salesperson');
            AWS.callSoap(WS, 'searchEmployees').then(res => {
                if (res.wsStatus === '0') {
                    ctl.setup(res.lowCap, ' ');
               //     ctl.testMode(true);
                    ctl.setupItems(res.item, 'id', 'name');
                    ctl.setupSelectFunction(async () => {
                        return await Utils.component('employeeSelection/EmployeeSelection', 'component-employee-selection');
                    }, 'employeeid', (item) => {
                        return item.lanem + ", " + item.fname;
                    });
                    ctl.run();
                }
            });
        }
        Utils.popup_open('filters');

        $$('fp-ok').onclick(() => {
            updateFilterDetails();
            Utils.popup_close();
        });

        $$('fp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    function selectSort() {

        Utils.popup_open('sort');

        $$('sp-ok').onclick(() => {
            if ($$("sort1").isError("Primary sort"))
                return;
            if ($$("sort-direction1").isError("Primary sort direction"))
                return;
            const sort2Val = $$('sort2').getValue();
            if (sort2Val) {
                if ($$("sort-direction2").isError("Secondary sort direction"))
                    return;
            }
            updateFilterDetails();
            Utils.popup_close();
        });

        $$('sp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    function selectColumns() {

        Utils.popup_open('columns');

        columnDefs.map((column, index) => {
            $$(`cp-chk-${index}`).setValue(!column.hide);
        })

        function ok() {
            columnDefs.map((column, index) => {
                columnDefs[index].hide = !$$(`cp-chk-${index}`).getValue();
            });
            Utils.popup_close();
            initMainDataGrid();
        }

        function cancel() {
            Utils.popup_close();
        }

        $$('cp-ok').onclick(ok);
        $$('cp-cancel').onclick(cancel);
    }

    function add() {
        let tabContainer = null;

        countriesToDropDown('dp-country');
        timezonesToDropDown('dp-time-zone');

        /**
         * Show a dropdown or a text input for entering state, depending on the value of the country drop down.
         */
        function filterState() {
            const states = getStatesForCountry($$('dp-country').getValue());

            if (states != null) {
                statesToDropDown('dp-state-drop-down', states);

                $$('dp-state-drop-down').show();
                $$('dp-state').hide();
            } else {
                $$('dp-state-drop-down').hide();
                $$('dp-state').show();
            }
        }

        function resetDialog() {
            // Basic tab.
            $$('dp-name').clear();
            $$('dp-street1').clear();
            $$('dp-street2').clear();
            $$('dp-city').clear();
            $$('dp-zip').clear();
            $$('dp-phone').clear();
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
            $$('dp-contact-type').setValue('');

            $$('dp-open-detail').setValue(true);
    
            // Select the first tab.
            tabContainer.selectTab('detailTabButton');
        }

        /**
         * Initialize the new worker dialog.
         */
        async function initDialog() {
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
        }

        initDialog();

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {

            $$('dp-country').onChange(filterState);
            
            function ok() {
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
                    identifier: $$('dp-id').getValue(),
                    mainContactFirstName: $$('dp-contact-first-name').getValue(),
                    mainContactJobTitle: $$('dp-contact-job-title').getValue(),
                    mainContactLastName: $$('dp-contact-last-name').getValue(),
                    mainContactPersonalEmail: $$('dp-contact-email').getValue(),
                    mainContactType: $$('dp-contact-type').getValue(),
                    mainContactWorkFax: '',
                    mainContactWorkPhone: $$('dp-contact-phone').getValue(),
                    mainFaxNumber: '',
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
            }
            
            function cancel() {
                resolve(null);
                Utils.popup_close();
            }

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);

        });
    }

    function searchProspects(excludeId) {
        let formSearchGrid = null;

        listSmartChooser([
            {tag: 'psp-status', url: 'searchProspectStatuses', ID: 'id', label: 'code'},
            {tag: 'psp-source', url: 'searchProspectSources', ID: 'id', label: 'code'},
        ]);

        $$('psp-status').setSelectFunction(() => executeSelectFunc('psp-status', searchProspectStatus, 'id', 'code'));
        $$('psp-source').setSelectFunction(() => executeSelectFunc('psp-source', searchProspectType, 'id', 'code'));
        
        Utils.popup_open('prospect-search');

        return new Promise(async function (resolve, reject) {

            function reset() {
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
            }

            function changeCount(count) {
                Utils.setText('psp-stat-count', `Displaying ${count} Prospects`);
            }

            function ok() {
                let row = formSearchGrid.getSelectedRow();
                resolve(row);
                reset();
                Utils.popup_close();
            }

            function cancel() {
                resolve(null);
                reset();
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('psp-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-id-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-pcontact-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('psp-pcontact-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid4() {
                // Setup data grid.
                const columnDefs = [
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
            }

            if (!formSearchGrid)
                initDataGrid4();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('psp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            function search() {
                const inParams = {
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
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);

                            let count = records.length;
                            changeCount(count);
                        } else {
                            changeCount(0);
                        }
                    }
                })
            }

            $$('psp-reset').onclick(reset);
            $$('psp-search').onclick(search);
            $$('psp-ok').onclick(ok);
            $$('psp-cancel').onclick(cancel);

            search();

            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    }

    function mergePopup(row) {

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
            $$(`mp-${dir}-source-detail`).setValue(data.sourceDetail);
            $$(`mp-${dir}-first-contact-date`).setValue(data.firstContact);
            $$(`mp-${dir}-certainty`).setValue(Number.parseInt(data.certainty));

            const p1 = AWS.callSoap(WS, 'searchProspectSources', {});
            const p2 = AWS.callSoap(WS, 'searchProspectStatuses', {});
            const p3 = AWS.callSoap(WS, 'searchEmployees', {});

            await AWS.callAll([p1, p2, p3],
                function (ret) {
                    initSmartChooser({tag: `mp-${dir}-source`, ID: 'id', label: 'code'}, ret);
                    Utils.assureArray(ret.item).map(item => {
                        if (item.code !== data.source)
                            return;
                        $$(`mp-${dir}-source`).setValue(item.id);
                    });
                },
                function (ret) {
                    initSmartChooser({tag: `mp-${dir}-status`, ID: 'id', label: 'code'}, ret);
                    Utils.assureArray(ret.item).map(item => {
                        if (item.code !== data.status)
                            return;
                        $$(`mp-${dir}-status`).setValue(item.id);
                    });
                },
                function (ret) {
                    initSmartChooser({tag: `mp-${dir}-salesperson`, ID: 'id', label: 'name'}, ret);
                    Utils.assureArray(ret.item).map(item => {
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
                sourceDetail: $$(`mp-${dir}-source-detail`).getValue(),
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

        $$('mp-search').onclick(async () => {
            let data = await searchProspects(leftID);
            if (data) {
                rightID = data.id;
                updateFields('right', data);
                $$('mp-ok').enable();
            }
        });

        function ok() {
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
                AWS.callSoap(WS, 'saveProspect', {...data, prospect1Id: leftID, prospect2Id: rightID}).then(data => {
                    if (data.wsStatus === '0') {
                        Utils.popup_close();
                    }
                })
            });
        }

        function cancel() {
            Utils.popup_close();
        }

        $$('mp-ok').onclick(ok);
        $$('mp-cancel').onclick(cancel);
    }

    function rememberVisitedProspect(id, name) {
        let visitedProspect = Utils.getData(VISITED_PROSPECTS);
        if (!visitedProspect)
            visitedProspect = {};
        if (visitedProspect[id])
            return;
        visitedProspect[id] = {};
        visitedProspect[id].name = name;
        Utils.saveData(VISITED_PROSPECTS, visitedProspect);
    }

    {
        const visitedProspect = Utils.getData(VISITED_PROSPECTS);
        const vp = $$('recent-prospects');
        vp.clear();
        if (visitedProspect && Utils.countProperties(visitedProspect))
            for (let id in visitedProspect)
                vp.add(id, visitedProspect[id].name);
    }

    $$('edit-previous-prospect').onclick(function () {
        const id = $$('recent-prospects')
        if (!id)
            return;
        Utils.saveData(CURRENT_PROSPECT_ID, id.getValue());
        Utils.saveData(CURRENT_PROSPECT_NAME, id.getLabel());
        Framework.getChild();
    });

    function editProspect() {
        const row = grid.getSelectedRow();
        rememberVisitedProspect(row.id, row.name)
        Utils.saveData(CURRENT_PROSPECT_ID, row.id);
        Utils.saveData(CURRENT_PROSPECT_NAME, row.name);
        Framework.getChild();
    }

    $$('filter-columns').onclick(selectColumns);

    $$('filter-search').onclick(updateGrid);
    $$('filter-reset').onclick(resetAll);
    $$('filters-button').onclick(selectFilter);
    $$('sorts-button').onclick(selectSort);

    $$('add').onclick(add);
    $$('edit').onclick(editProspect);
    $$('merge').onclick(async () => {
        const row = grid.getSelectedRow();
        await mergePopup(row);
        updateGrid();
    });

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Prospect?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteProspects", data).then(function (res) {
                if (res.wsStatus === '0')
                    updateGrid();
            });            
        });
    });

    $$('report').onclick(() => {
        const t = {};
        Object.keys(filterControlKeys).map(key => {
            const ck = filterControlKeys[key];
            t[key] = $$(ck.ctlId).getValue();
        });
        Utils.waitMessage('Report in progress; please wait.');
        AWS.callSoap(WS, 'getReport', t).then(ret => {
            Utils.waitMessageEnd();
            Utils.showReport(ret.reportUrl);
        });
    });

    $$('export').onclick(() => {
        const t = {};
        Object.keys(filterControlKeys).map(key => {
            const ck = filterControlKeys[key];
            t[key] = $$(ck.ctlId).getValue();
        });
        Utils.waitMessage('Export in progress; please wait.');
        AWS.callSoap(WS, 'getExport', t).then(ret => {
            Utils.waitMessageEnd();
            Utils.showReport(ret.reportUrl);
        });
    });


    initMainDataGrid();

    await restoreContext();
    updateFilterDetails();


})();
