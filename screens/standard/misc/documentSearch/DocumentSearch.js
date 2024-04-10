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
    const WS = 'StandardMiscDocumentSearch';


    const searchData = (searchData) => {
        let formSearchGrid;
        switch (searchData) {
            case 'companyOrgGroupId':
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
                    case 'companyOrgGroupId':
                        $$('ds-companyOrgGroupId').setValue(row.orgGroupId, row.orgGroupName);
                        break;
        
                    case 'companyCompanyId':
                        $$('ds-companyCompanyId').setValue(row.companyId, row.companyName);
                        break;
        
                    case 'employeeEmployeeId':
                        $$('ds-employeeEmployeeId').setValue(row.id, makeName(row.firstName, row.lastName));
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
                case "companyOrgGroupId":
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
            if (searchData === "companyOrgGroupId") {
                const params = {
                    name: $$('ogpl-first-search').getValue(),
                    nameSearchType: $$('ogpl-first-criteria').getValue(),
                    companyId: $$('ds-companyCompanyId').getValue()
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
                    orgGroupId: $$('ds-companyOrgGroupId').getValue(),
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
                    case 'companyOrgGroupId':
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
                    $$('ds-' + searchData).setValue('');  
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

    const companyParams = {
        companyName: '',
        companyNameSearchType: 0
    }
    await AWS.callSoap(WS, 'searchCompanies', companyParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('ds-companyCompanyId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length === 1) {
                ctl.disable().setValue(res.item[0].companyId, res.item[0].companyName);
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(choose)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].companyId, res.item[i].companyName);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(choose)');
            }
            ctl.setSelectFunction(() => {
                searchData('companyCompanyId');
            });
        }
    });

    function makeName(fn, ln) {
        let r = ln + ", " + fn;
        return r;
    }

    const employeesParams = {
        firstName: '',
        firstNameSearchType: 0,
        lastName: '',
        lastNameSearchType: 0
    }
    AWS.callSoap(WS, 'searchEmployees', employeesParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('ds-employeeEmployeeId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length <= res.cap) {
                ctl.useDropdown();
                ctl.add('', '(all)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, makeName(res.item[i].firstName, res.item[i].lastName));
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(all)');
            }
            ctl.setSelectFunction(() => {
                searchData('employeeEmployeeId');
            });
        }
    });
    const orgGroupParams = {
        orgGroupName: '',
        orgGroupNameSearchType: 0,
        companyId: $$('ds-companyCompanyId').getValue()
    }
    AWS.callSoap(WS, 'searchGroupsForCompany', orgGroupParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('ds-companyOrgGroupId');
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
                searchData('companyOrgGroupId');
            });
        }
    });

    AWS.callSoap(WS, 'listDocumentTypes').then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            $$('ds-companyTypeId').clear().add('', '(all)').addItems(res.item, 'typeId', 'typeName');
            $$('ds-employeeTypeId').clear().add('', '(all)').addItems(res.item, 'typeId', 'typeName');
        }
    });

    const container = new TabContainer('ds-tab-container');

    bindToEnum('ds-employeeComment-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    bindToEnum('ds-companyComment-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    function companyReset() {
        
        $$('ds-employeeComment-criteria').setValue(2);
        $$('ds-companyFromDate').clear();
        $$('ds-companyToDate').clear();
        $$('ds-companyOrgGroupId').setValue('');
        $$('ds-companyComment-search').clear();
        $$('ds-companyTypeId').setValue('');

        companyDocumentsGrid.clear();
        $$('companyDocuments-label').setValue('Displaying 0 Company Documents');
        $$('companyView').disable();
    }

    function employeeReset() {
        
        $$('ds-employeeComment-criteria').setValue(2);
        $$('ds-employeeEmployeeId').setValue('');
        $$('ds-employeeFromDate').clear();
        $$('ds-employeeToDate').clear();
        $$('ds-employeeTypeId').setValue('');
        $$('ds-employeeComment-search').clear();

        employeeDocumentsGrid.clear();
        $$('employeeDocuments-label').setValue('Displaying 0 Employee Documents');
        $$('employeeView').disable();
    }

    $$('ds-company-reset').onclick(companyReset);
    $$('ds-employee-reset').onclick(employeeReset);

    let employeeDocumentsGrid;

    const employeeDocumentsColumnDefs = [
        {headerName: "Filename", field: "filename", width: 200},
        {headerName: "Employee", field: "employeeName", width: 200},
        {headerName: "Type", field: "documentType", width: 50},
        {headerName: "Date", field: "dateFormatted", type: 'numericColumn', width: 100},
        {headerName: "File Type", field: "fileExtension", width: 100},
        {headerName: "Document Comment", field: "documentName", width: 400}
    ];

    employeeDocumentsGrid = new AGGrid('employeeDocumentsGrid', employeeDocumentsColumnDefs);

    employeeDocumentsGrid.show();

    function searchEmployeeDocuments() {
        const params = {
            employeeId: $$('ds-employeeEmployeeId').getValue(),
            fromDate: $$('ds-employeeFromDate').getIntValue(),
            toDate: $$('ds-employeeToDate').getIntValue(),
            typeId: $$('ds-employeeTypeId').getValue(),
            nameSearchType: $$('ds-employeeComment-criteria').getValue(),
            name: $$('ds-employeeComment-search').getValue(),
        }

        AWS.callSoap(WS, 'searchEmployeeDocuments', params).then(data => {
            employeeDocumentsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].dateFormatted = data.item[i].date !== '0' ? DateUtils.intToStr4(Number(data.item[i].date)) : '';
                }
                employeeDocumentsGrid.addRecords(data.item);     
                employeeDocumentsGrid.setOnSelectionChanged(() => {
                    $$('employeeView').enable();
                });
                employeeDocumentsGrid.setOnRowDoubleClicked(viewEmployeeDocument);
                $$('employeeDocuments-label').setValue('Displaying ' + data.item.length + ' Employee Documents');
            }     
        });
    }

    $$('ds-employee-search').onclick(searchEmployeeDocuments);

    function viewEmployeeDocument() {
        const documentId = {
            documentId: employeeDocumentsGrid.getSelectedRow().documentId
        }
        AWS.callSoap(WS, 'openEmployeeDocument', documentId).then(data => {
            if (data.wsStatus === "0") {
                Utils.showReport(data.reportUrl);
            }     
        });
    }
    $$('employeeView').onclick(viewEmployeeDocument);


    let companyDocumentsGrid;

    const companyDocumentsColumnDefs = [
        {headerName: "Filename", field: "filename", width: 200},
        {headerName: "Type", field: "documentType", width: 100},
        {headerName: "Active Period", field: "periodFormatted", width: 100},
        {headerName: "File Type", field: "fileExtension", width: 50},
        {headerName: "Comment", field: "documentName", width: 400}
    ];

    companyDocumentsGrid = new AGGrid('companyDocumentsGrid', companyDocumentsColumnDefs);

    companyDocumentsGrid.show();

    function searchCompanyDocuments() {
        const params = {
            orgGroupId: $$('ds-companyOrgGroupId').getValue(),
            fromDate: $$('ds-companyFromDate').getIntValue(),
            toDate: $$('ds-companyToDate').getIntValue(),
            typeId: $$('ds-companyTypeId').getValue(),
            nameSearchType: $$('ds-companyComment-criteria').getValue(),
            name: $$('ds-companyComment-search').getValue(),
        }

        AWS.callSoap(WS, 'searchCompanyDocuments', params).then(data => {
            companyDocumentsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].periodFormatted = (data.item[i].firstActiveDate !== '0' ? DateUtils.intToStr4(Number(data.item[i].firstActiveDate)) : 'No Start') 
                        + ' - ' + (data.item[i].lastActiveDate !== '0' ? DateUtils.intToStr4(Number(data.item[i].lastActiveDate)) : 'No End');
                }
                companyDocumentsGrid.addRecords(data.item);     
                companyDocumentsGrid.setOnSelectionChanged(() => {
                    $$('companyView').enable();
                });
                companyDocumentsGrid.setOnRowDoubleClicked(viewCompanyDocument);
                $$('companyDocuments-label').setValue('Displaying ' + data.item.length + ' Company Documents');
            }     
        });
    }

    $$('ds-company-search').onclick(searchCompanyDocuments);

    function viewCompanyDocument() {
        const documentId = {
            documentId: companyDocumentsGrid.getSelectedRow().documentId
        }
        AWS.callSoap(WS, 'openCompanyDocument', documentId).then(data => {
            if (data.wsStatus === "0") {
                Utils.showReport(data.reportUrl);
            }     
        });
    }
    $$('companyView').onclick(viewCompanyDocument);
})();
