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
    const WS = 'StandardCrmSalesPipeline';

    let pipelinesGrid = {};
    let fallbackGrid;

    let selectedTable;

    const fallbackColumnDefs = [{headerName: 'Followup', field: "htmlText", width: 150}];

    AWS.callSoap(WS, 'getMeta').then(data => {
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
            fallbackGrid = new AGGrid('fallbackGrid', fallbackColumnDefs);
            fallbackGrid.show(); 

            fallbackGrid.setOnSelectionChanged((x) => {
                $$('view').enable(x);
                $$('edit').enable(x);
                $$('createlog').enable(x);
                selectedTable = fallbackGrid.id;
            });

            for (let i = 0; i < data.item.length; i++) {
                let pipelineColumnDefs = [{headerName: data.item[i].statusName + ' (' + data.item[i].statusDays + ' days)', field: "htmlText", width: 150}];
                pipelinesGrid[data.item[i].statusVar] = new AGGrid('pipelinesGrid' + (i + 1), pipelineColumnDefs);
                pipelinesGrid[data.item[i].statusVar].show(); 

                pipelinesGrid[data.item[i].statusVar].setOnSelectionChanged((x) => {
                    $$('view').enable(x);
                    $$('edit').enable(x);
                    $$('createlog').enable(x);
                    selectedTable = data.item[i].statusVar;
                });
            }
            getListSalesPoints();
        }
    });  

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
            const ctl = $$('sp-person');
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

    const searchEmployee = (isForEdit = false) => {
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
                if (isForEdit) {
                    $$('sp-edit-person').setValue(row.personId, makeName(row.firstName, row.middleName, row.lastName));
                } else {
                    $$('sp-person').setValue(row.personId, makeName(row.firstName, row.middleName, row.lastName));
                    getListSalesPoints();
                }
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
    const searchData = (searchData) => {
        let formSearchGrid;
        switch (searchData) {
            case 'sourceId':
                $$('sp-data-search-type').setValue('Prospect Source');
                $$('sp-chooseSpecificLabelAll').setValue('Sources');
                $$('sp-chooseSpecificLabelSearch').setValue('Source');
                break;

            case 'statusId':
                $$('sp-data-search-type').setValue('Prospect Status');
                $$('sp-chooseSpecificLabelAll').setValue('Statuses');
                $$('sp-chooseSpecificLabelSearch').setValue('Status');
                break;
        
            default:
                break;
        }
        
        Utils.popup_open('sp-data-search');
            
        const reset = () => {
            $$('sp-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('sp-code-search').clear();

            $$('sp-description-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('sp-description-search').clear();

            $$('sp-reset').enable();
            $$('sp-search').enable();

            $$('sp-ok').disable();

            formSearchGrid.clear();
            $$('sp-count').setValue(`Displaying 0 item`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                switch (searchData) {
                    case 'statusId':
                        $$('sp-edit-status').setValue(row.id, row.code);
                        break;
        
                    case 'sourceId':
                        $$('sp-edit-source').setValue(row.id, row.code);
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

        bindToEnum('sp-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('sp-description-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs;

            switch (searchData) {
                case "statusId":
                    columnDefs = [
                        {headerName: 'Code', field: 'code', width: 80},
                        {headerName: 'Description', field: 'description', width: 100},
                        {headerName: 'Status', field: 'status', width: 30},
                    ];
                    break;
                
                case "sourceId":
                    columnDefs = [
                        {headerName: 'Code', field: 'code', width: 90},
                        {headerName: 'Description', field: 'description', width: 120},
                    ];
                    break;

                default:
                    columnDefs = [];
                    break;
            }

            formSearchGrid = new AGGrid('sp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const row = selectedTable === 'fallbackGrid' ? fallbackGrid.getSelectedRow() : pipelinesGrid[selectedTable].getSelectedRow();
            if (searchData === "sourceId") {
                const params = {
                    code: $$('sp-code-search').getValue(),
                    codeSearchType: $$('sp-code-criteria').getValue(),
                    description: $$('sp-description-search').getValue(),
                    descriptionSearchType: $$('sp-description-criteria').getValue(),
                    id: row.prospectId
                }
                AWS.callSoap(WS, 'searchProspectSources', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('sp-count').setValue(`Displaying ${records.length} Prospect Sources`);
                        } else {
                            $$('sp-count').setValue(`Displaying 0 Prospect Sources`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('sp-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            } else if (searchData === "statusId") {
                const params = {
                    code: $$('sp-code-search').getValue(),
                    codeSearchType: $$('sp-code-criteria').getValue(),
                    description: $$('sp-description-search').getValue(),
                    descriptionSearchType: $$('sp-description-criteria').getValue(),
                    id: row.prospectId
                }
                AWS.callSoap(WS, 'searchProspectStatuses', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('sp-count').setValue(`Displaying ${records.length} Prospect Statuses`);
                        } else {
                            $$('sp-count').setValue(`Displaying 0 Prospect Statuses`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('sp-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });
            }         
        };

        $$('sp-reset').onclick(reset);
        $$('sp-search').onclick(search);
        $$('sp-ok').onclick(ok);
        $$('sp-cancel').onclick(cancel);

        $$('sp-chooseSpecific').onChange(() => {
            if ($$('sp-chooseSpecific').getValue() === "A") {
                formSearchGrid.clear();
                $$('sp-code-criteria').disable();
                $$('sp-code-search').disable();

                $$('sp-description-criteria').disable();
                $$('sp-description-search').disable();

                switch (searchData) {                    
                    case 'sourceId':
                        $$('sp-count').setValue(`Displaying 0 Prospect Sources`);
                        break;

                    case 'statusId':
                        $$('sp-count').setValue(`Displaying 0 Prospect Statuses`);
                        break;
                
                    default:
                        break;
                }
                $$('sp-ok').enable().onclick(() => {
                    $$('sp-' + searchData).setValue('');                         
                    reset();
                    Utils.popup_close();
                });
            } else {
                $$('sp-code-criteria').enable();
                $$('sp-code-search').enable();

                $$('sp-description-criteria').enable();
                $$('sp-description-search').enable();

                $$('sp-ok').enable().onclick(ok);
            }
        });

        search();
    };
    function getListSalesPoints() {
        const params = {
            personId: $$('sp-person').getValue()
        }
        AWS.callSoap(WS, 'listPipelineData', params).then(data => {
            if (data.wsStatus === '0') {
                fallbackGrid.clear();
                for (const key in pipelinesGrid) {
                    pipelinesGrid[key].clear();
                }
                
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].item = Utils.assureArray(data.item[i].item);
                    if (data.item[i].name === 'fallback') {
                        fallbackGrid.addRecords(data.item[i].item);
                        continue;
                    }  
                    for (let j = 0; j < data.item[i].item.length; j++) {
                        pipelinesGrid[data.item[i].name].addRecords(data.item[i].item);
                    }               
                }
            }
        });  
    }

    $$('sp-person').onChange(getListSalesPoints);

    $$('view').onclick(() => {
        const row = selectedTable === 'fallbackGrid' ? fallbackGrid.getSelectedRow() : pipelinesGrid[selectedTable].getSelectedRow();
        Utils.saveData(CURRENT_PROSPECT_ID, row.prospectId);
        Utils.saveData(CURRENT_PROJECT_NAME, row.prospectName);
        Framework.getChild();
    });

    $$('edit').onclick(async () => {
        const row = selectedTable === 'fallbackGrid' ? fallbackGrid.getSelectedRow() : pipelinesGrid[selectedTable].getSelectedRow();
        
        AWS.callSoap(WS, 'checkRight').then(function (res) {
            if (res.wsStatus !== "0") {

            }
        });

        const params = {
            code: '',
            codeSearchType: 0,
            description: '',
            descriptionSearchType: 0,
            id: row.prospectId
        }
        await AWS.callSoap(WS, 'searchProspectSources', params).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('sp-edit-source');
                ctl.clear();
                if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code);
                    ctl.setValue(res.selectedItem.id);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(res.selectedItem.id);
                }
                ctl.setSelectFunction(() => {
                    searchData('sourceId');
                });
            }
        });  
        await AWS.callSoap(WS, 'searchProspectStatuses', params).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('sp-edit-status');
                ctl.clear();
                if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].id, res.item[i].code);
                    ctl.setValue(res.selectedItem.id);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(res.selectedItem.id);
                }
                ctl.setSelectFunction(() => {
                    searchData('statusId');
                });
            }
        });  
        const employeeParams = {
            firstName: null,
            firstNameSearchType: 0,
            id: row.prospectId,
            includeSelected: false,
            lastName: null,
            lastNameSearchType: 0
        };
    
        await AWS.callSoap(WS, 'searchEmployees', employeeParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('sp-edit-person');
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
                    searchEmployee(true);
                });
            }
        });

        const prospectId = {
            id: row.prospectId
        }
        AWS.callSoap(WS, 'loadSummary', prospectId).then(res => {
            if (res.wsStatus === '0') {
                $$('sp-edit-name').setValue(res.name);
                $$('sp-edit-id').clear();
                $$('sp-edit-street').setValue(res.street);
                
                $$('sp-edit-street2').setValue(res.street2);
                $$('sp-edit-sourceDetail').setValue(res.sourceDetail);
                $$('sp-edit-country').setValue(res.country);
                $$('sp-edit-city').setValue(res.city);
                $$('sp-edit-state').setValue(res.state);
                $$('sp-edit-zip').setValue(res.zip);
                $$('sp-edit-firstDate').setValue(res.firstContactDate);
                $$('sp-edit-certainty').setValue(res.certainty);
                $$('sp-edit-phone').setValue(res.mainPhoneNumber);
                $$('sp-edit-fax').setValue(res.mainFaxNumber);
                $$('sp-edit-NextDate').setValue(res.nextContactDate);
                $$('sp-edit-person').setValue('');
            }
        });  
        Utils.popup_open('edit-prospect');

        $$('edit-save').onclick(() => {
            if ($$('sp-edit-source').isError('Source'))
                return;
            if ($$('sp-edit-status').isError('Status'))
                return;
            if ($$('sp-edit-person').isError('Salesperson'))
                return;

            const params = {
                certainty: $$('sp-edit-certainty').getValue(),
                city: $$('sp-edit-city').getValue(),
                country: $$('sp-edit-country').getValue(),
                firstContactDate: $$('sp-edit-firstDate').getValue(),
                id: row.prospectId,
                identifier: $$('sp-edit-id').getValue(),
                mainFaxNumber: $$('sp-edit-fax').getValue(),
                mainPhoneNumber: $$('sp-edit-phone').getValue(),
                name: $$('sp-edit-name').getValue(),
                nextContactDate: $$('sp-edit-NextDate').getValue(),
                salesPersonId: $$('sp-edit-person').getValue(),
                sourceDetail: $$('sp-edit-sourceDetail').getValue(),
                sourceId: $$('sp-edit-source').getValue(),
                state: $$('sp-edit-state').getValue(),
                statusId: $$('sp-edit-status').getValue(),
                street: $$('sp-edit-street').getValue(),
                street2: $$('sp-edit-street2').getValue(),
                zip: $$('sp-edit-zip').getValue()
            }
            AWS.callSoap(WS, 'saveSummary', params).then(res => {
                if (res.wsStatus === '0') {
                    getListSalesPoints();
                    Utils.popup_close();
                }
            }); 
        });

        $$('edit-cancel').onclick(Utils.popup_close);

        $$('report').onclick(() => {
            Utils.popup_open('report-popup');

            $$('edit-report-cancel').onclick(Utils.popup_close);
        });
    });

    let logDescriptionGrid;
    const logDescriptionColumnDefs = [{headerName: 'Description', field: "description", width: 500}];

    logDescriptionGrid = new AGGrid('logDescriptionGrid', logDescriptionColumnDefs);
    logDescriptionGrid.show(); 

    $$('createlog').onclick(() => {
        const row = selectedTable === 'fallbackGrid' ? fallbackGrid.getSelectedRow() : pipelinesGrid[selectedTable].getSelectedRow();
        $$('log-prospectName').setValue(row.prospectName);

        logDescriptionGrid.clear();

        const prospectId = {
            prospectId: row.prospectId
        };
        $$('sp-log-status').clear().add('', "(select)");
        AWS.callSoap(WS, 'listPipelineStatuses', prospectId).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('sp-log-status').addItems(data.item, "id", "name").setValue(data.selectedId);
            }
        });
        $$('sp-log-activity').clear().add('', "(select)");
        AWS.callSoap(WS, 'listActivities').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('sp-log-activity').addItems(data.item, "id", "code");

                $$('sp-log-activity').onChange(() => {
                    if ($$('sp-log-activity').getValue() !== '') {
                        const params = {
                            activityId: $$('sp-log-activity').getValue()
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

        $$('sp-log-date').setValue(DateUtils.today());
        $$('sp-log-time').setValue(TimeUtils.current());

        $$('sp-log-createNewLog').onChange(() => {
            if ($$('sp-log-createNewLog').getValue()) {
                $$('sp-log-activity').enable();
                $$('sp-log-date').enable();
                $$('sp-log-time').enable();
                $$('sp-log-detail').enable();
                $$('sp-log-cEmployees').enable();
                $$('sp-log-pEmployees').enable();
            } else {
                $$('sp-log-activity').disable();
                $$('sp-log-date').disable();
                $$('sp-log-time').disable();
                $$('sp-log-detail').disable();
                $$('sp-log-cEmployees').disable();
                $$('sp-log-pEmployees').disable();
            }
        });

        Utils.popup_open('log-popup');

        $$('log-ok').onclick(() => {
            if ($$('sp-log-status').isError('Status'))
                return;
            if ($$('sp-log-createNewLog').getValue() && $$('sp-log-date').isError('Contact Date'))
                return;
            if ($$('sp-log-createNewLog').getValue() && $$('sp-log-detail').isError('Detail'))
                return;
            
            const params = {
                activityId: $$('sp-log-createNewLog').getValue() ? $$('sp-log-activity').getValue() : '',
                contactDate: $$('sp-log-createNewLog').getValue() ? $$('sp-log-date').getIntValue() : 0,
                contactText: $$('sp-log-createNewLog').getValue() ? $$('sp-log-detail').getValue() : '',
                contactTime: $$('sp-log-createNewLog').getValue() ? $$('sp-log-time').getValue() : 0,
                employees: $$('sp-log-createNewLog').getValue() ? $$('sp-log-cEmployees').getValue() : '',
                prospectEmployees: $$('sp-log-createNewLog').getValue() ? $$('sp-log-pEmployees').getValue() : '',
                prospectId: row.prospectId,
                resultId: $$('sp-log-createNewLog').getValue() ? logDescriptionGrid.getSelectedRow() !== null ? logDescriptionGrid.getSelectedRow().id : '' : '',
                statusId: $$('sp-log-status').getValue()
            }
            AWS.callSoap(WS, 'saveProspectData', params).then(data => {
                if (data.wsStatus === "0") {
                    Utils.popup_close();
                    getListSalesPoints();
                }
            });            
        });

        $$('log-cancel').onclick(Utils.popup_close);
    });

})();
