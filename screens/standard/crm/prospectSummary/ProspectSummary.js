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

    const WS = 'StandardCrmProspectSummary2';
    
    const res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const prospectId = Utils.getData(CURRENT_PROSPECT_ID);
    let prospectName = Utils.getData(CURRENT_PROSPECT_NAME);

    Framework.askBeforeLeaving = true;  //  make sure changes are not lost when changing screens
    Utils.setSomeControlValueChangeFunction(function (status) {
        if (status) {
            $$('dp-save').enable();
            $$('dp-reset').enable();
            $$('dp-prospect-name').setColor('red').setValue(`${prospectName} (data changed)`);
        } else {
            $$('dp-save').disable();
            $$('dp-reset').disable();
            $$('dp-prospect-name').setColor('black').setValue(prospectName);
        }
    });

    async function executeSelectFunc(element, fn, id, name) {
        let selectedNode = await fn();
        if (selectedNode) {
            Utils.someControlValueChanged();
            $$(element).setValue(selectedNode[id], selectedNode[name]);
        }
    }

    function initSmartChooser(element, res) {
        if (!res.item) {
            $$(element.tag).clear();
            $$(element.tag).forceSelect();
            return;
        }

        if (res.item.length > res.lowCap)
            $$(element.tag).forceSelect();
        else
            $$(element.tag).addItems(Utils.assureArray(res.item), element.ID, element.label);

        if (res.selectedItem) {
            $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
            $$(element.tag).setValue(res.selectedItem[element.ID], res.selectedItem[element.label]);
        }

        if (element.selected) {
            $$(element.tag).setValue(element.selected);
        }
    }

    const listSmartChooser = (data) => {
        const elements = Utils.assureArray(data);

        elements.map(element => {
            $$(element.tag).clear();

            AWS.callSoap(WS, element.url, element.param).then(res => {
            
                if (res.wsStatus === '0') {
                    if (element.url === "searchEmployees") {
                        for (let i = 0; i < res.item.length; i++)
                            res.item[i].fullName = res.item[i].lastName + ', ' + res.item[i].firstName + ' ' + res.item[i].middleName;
                        if (res.selectedItem)
                            res.selectedItem.fullName = res.selectedItem.lastName + ', ' + res.selectedItem.firstName + ' ' + res.selectedItem.middleName;
                    }                        
                    initSmartChooser(element, res);
                }
            });
        });
    };

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

            const initDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Code', field: 'code', width: 50},
                    {headerName: 'Description', field: 'description', width: 160},
                    {headerName: 'Status', field: 'status', width: 40}
                ];

                formSearchGrid = new AGGrid('pst-grid', columnDefs, 'id');
                formSearchGrid.show();
            };

            if (!formSearchGrid)
                initDataGrid();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('pst-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);


            const search = () => {
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

    $$('go-website').onclick(() => {
        let url = $$('website').getValue();
        if (!url)
            return;
        if (url.search('://') === -1)
            url = 'http://' + url;
        window.open(url, '_blank');
    });

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

            const initDataGrid = () => {
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
                initDataGrid();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('pt-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
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

            const reset = () => {
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

            const changeCount = count => {
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

            const initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Code', field: 'code', width: 80},
                    {headerName: 'Description', field: 'description', width: 120}
                ];
    
                formSearchGrid = new AGGrid('pss-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
    
            formSearchGrid.setOnSelectionChanged($$('pss-ok').enable);
    
            formSearchGrid.setOnRowDoubleClicked(ok);
    
    
            const search = () => {
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
                row.fullName = row.lastName + ', ' + row.firstName + ' ' + row.middleName;
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

            const initDataGrid = () => {
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
                initDataGrid();
    
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
    

    /**
     * Show a drop down or a text input for entering state, depending on the value of the country drop down.
     */
    const filterState = () => {
        const states = getStatesForCountry($$('dp-country').getValue());

        if (states != null) {
            statesToDropDown('dp-state-drop-down', states);

            $$('dp-state-drop-down').show();
            $$('dp-state').hide();
        } else {
            $$('dp-state-drop-down').hide();
            $$('dp-state').show();
        }
    };

    const reset = () => {
        $$('dp-name').clear();
        $$('dp-street1').clear();
        $$('dp-street2').clear();
        $$('dp-city').clear();
        $$('dp-zip').clear();
        $$('dp-phone').clear();
        $$('dp-id').clear();
        $$('dp-first-contact-date').clear();
        $$('dp-source').setValue('');
        $$('dp-status').setValue('');
        $$('dp-type').setValue('');
        $$('dp-salesperson').setValue('');
        $$('dp-time-zone').setValue('');

        $$('dp-first-contact-date').clear();
        $$('dp-last-contact-date').clear();
        $$('dp-next-contact-date').clear();
        $$('dp-opportunity-value').clear();
        $$('dp-status-certainty').clear();
        $$('dp-weighted-value').clear();

        AWS.callSoap(WS, 'loadSummary', {id: prospectId}).then(ret => {
            if (ret.wsStatus === '0') {
                prospectName = ret.name;

                $$('dp-city').setValue(ret.city);
                $$('dp-country').setValue(ret.country);
                $$('dp-first-contact-date').setValue(ret.firstContactDate);
                $$('dp-last-contact-date').setValue(ret.lastContactDate);
                $$('dp-next-contact-date').setValue(ret.nextContactDate);
                $$('dp-id').setValue(ret.identifier);
                $$('dp-phone').setValue(ret.mainPhoneNumber);
                $$('dp-name').setValue(ret.name);
                $$('dp-prospect-name').setValue(ret.name);
                $$('dp-source-detail').setValue(ret.sourceDetail);
                Utils.isVisible('dp-state-drop-down') ? $$('dp-state-drop-down').setValue(ret.state) : $$('dp-state').setValue(ret.state);
                $$('dp-street1').setValue(ret.street);
                $$('dp-street2').setValue(ret.street2);
                $$('dp-zip').setValue(ret.zip);
                $$('dp-time-zone').setValue(ret.timeZone);
                $$('dp-status-certainty').setValue(ret.statusCertainty);
                $$('dp-weighted-value').setValue(ret.weightedValue);
                $$('dp-opportunity-value').setValue(ret.opportunityValue);
                $$('number-of-employees').setValue(ret.numberOfEmployees);
                $$('gross-income').setValue(ret.grossIncome);
                $$('website').setValue(ret.website);
                $$('when-added').setValue(DateTimeUtils.formatDate(ret.whenAdded));
                $$('change-date').setValue(DateTimeUtils.formatDate(ret.changeDate));
                $$('record-id').setValue(prospectId);
            }
        });

        listSmartChooser([
            {tag: 'dp-status', url: 'searchProspectStatuses', ID: 'id', label: 'code', param: {id: prospectId}},
            {tag: 'dp-type', url: 'searchProspectTypes', ID: 'id', label: 'code', param: {id: prospectId}},
            {tag: 'dp-source', url: 'searchProspectSources', ID: 'id', label: 'code', param: {id: prospectId}},
            {tag: 'dp-salesperson', url: 'searchEmployees', ID: 'id', label: 'fullName', param: {id: prospectId}},
        ]);

        timezonesToDropDown('dp-time-zone');
        countriesToDropDown('dp-country');
        filterState();
        statesToDropDown('dp-state-drop-down', US_STATE_ABBREVIATIONS);

        Utils.clearSomeControlValueChanged(true);
    };

    reset();

    $$('dp-status').setSelectFunction(() => executeSelectFunc('dp-status', searchProspectStatus, 'id', 'code'));
    $$('dp-type').setSelectFunction(() => executeSelectFunc('dp-type', searchProspectType, 'id', 'code'));
    $$('dp-source').setSelectFunction(() => executeSelectFunc('dp-source', searchProspectSource, 'id', 'code'));
    $$('dp-salesperson').setSelectFunction(() => executeSelectFunc('dp-salesperson', searchEmployee, 'id', 'fullName'));

    $$('dp-country').onChange(filterState);
    $$('dp-reset').onclick(reset);
    $$('dp-save').onclick(() => {
        if ($$('dp-status-certainty').isError('Certainty')) {
            return;
        }
        if ($$('dp-weighted-value').isError('Weighted')) {
            return;
        }
        const data = {
            certainty: $$('dp-weighted-value').getValue(),
            opportunityValue: $$('dp-opportunity-value').getValue(),
            numberOfEmployees: $$('number-of-employees').getValue(),
            grossIncome: $$('gross-income').getValue(),
            website: $$('website').getValue(),
            city: $$('dp-city').getValue(),
            country: $$('dp-country').getValue(),
            firstContactDate: $$('dp-first-contact-date').getIntValue(),
            nextContactDate: $$('dp-next-contact-date').getIntValue(),
            lastContactDate: $$('dp-last-contact-date').getIntValue(),
            id: prospectId,
            identifier: $$('dp-id').getValue(),
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
            typeId: $$('dp-type').getValue(),
            timeZone: $$('dp-time-zone').getValue(),
        };

        AWS.callSoap(WS, 'saveSummary', data).then(ret => {
            if (ret.wsStatus === '0') {
                Utils.showMessage('Information', 'Save completed successfully.');
                reset();
            }
        });
    });

    const reportOptions = () => {
        
        Utils.popup_open('report-option');
    
        return new Promise(async function (resolve, reject) {
            
            $$('ro-include-contact').setValue(true);

            const ok = () => {
                resolve($$('ro-include-contact').getValue());
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('ro-ok').onclick(ok);
            $$('ro-cancel').onclick(cancel);
        });
    
    };

    $$('dp-report').onclick(async () => {
        let chk = await reportOptions();
        if (chk !== null) {
            AWS.callSoap(WS, 'getReport', {id: prospectId, includeContactDetail: chk}).then(ret => {
                if (ret.wsStatus === '0') {
                    Utils.showReport(ret.reportUrl);
                }
            })
        }
    });
    
})();