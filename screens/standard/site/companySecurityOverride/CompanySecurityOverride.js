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
    const WS = 'StandardSiteCompanySecurityOverride';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('cso-employee').setValue(personName);

    let companySecurityGrid;
    const companySecurityColumnDefs = [
        {headerName: "Company", field: "companyName", width: 420},
        {headerName: "Screen Group", field: "screenGroupName", width: 420},
        {headerName: "Security Group", field: "securityGroupName",  width: 420},
    ];
    companySecurityGrid = new AGGrid('companySecurityGrid', companySecurityColumnDefs);
    companySecurityGrid.show();  

    function searchCompaniesForEmployee() {
        const params = {
            employeeId: personId
        }
        AWS.callSoap(WS, 'searchCompaniesForEmployee', params).then(res => {
            if (res.wsStatus === "0") {
                $$('defaultScreenGroup').setValue(res.screenGroupName);
                $$('defaultSecurityGroup').setValue(res.securityGroupName);
                res.item = Utils.assureArray(res.item);
                $$('cso-status').setValue('Displaying ' + res.item.length + ' Overrides')
                companySecurityGrid.addRecords(res.item);
                companySecurityGrid.setOnRowDoubleClicked(edit);
                companySecurityGrid.setOnSelectionChanged($$('edit').enable);
            }
        });
    }

    searchCompaniesForEmployee();

    $$('add').onclick(() => {
        const searchData = (searchData) => {
            let formSearchGrid;
            switch (searchData) {
                case 'companyId':
                    $$('cso-data-search-type').setValue('Company');
    
                    $$('cso-id-label').hide();
                    $$('cso-id-search').hide();
    
                    $$('cso-searchTopLevelOnlyLabel').hide();
                    $$('cso-searchTopLevelOnly').hide();
                    break;
    
                case 'securityId':
                    $$('cso-data-search-type').setValue('Security Group');
    
                    $$('cso-id-label').hide();
                    $$('cso-id-search').hide();
    
                    $$('cso-searchTopLevelOnlyLabel').hide();
                    $$('cso-searchTopLevelOnly').hide();
                    break;
    
                case 'screenId':
                    $$('cso-data-search-type').setValue('Screen Group');
    
                    $$('cso-id-label').show();
                    $$('cso-id-search').show();
    
                    $$('cso-searchTopLevelOnlyLabel').show();
                    $$('cso-searchTopLevelOnly').show();
                    break;
            
                default:
                    break;
            }
            
            Utils.popup_open('cso-data-search');
                
            const reset = () => {
                $$('cso-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('cso-name-search').clear();
    
                $$('cso-id-search').clear();
    
                $$('cso-searchTopLevelOnly').setValue('True');
    
                $$('cso-reset').enable();
                $$('cso-search').enable();
    
                $$('cso-ok').disable();
    
                formSearchGrid.clear();
                $$('cso-count').setValue(`Displaying 0 item`);
            };
            
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    switch (searchData) {        
                        case 'companyId':
                            $$('cso-companyId').setValue(row.companyId, row.companyName);
                            break;
            
                        case 'securityId':
                            $$('cso-securityGroup').setValue(row.groupId, row.name);
                            break;
                        
                        case 'screenId':
                            $$('cso-screenGroup').setValue(row.id, row.extId + ' - ' + row.title);
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
    
            bindToEnum('cso-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs;
    
                switch (searchData) {               
                    case "companyId":
                        columnDefs = [
                            {headerName: 'Company Name', field: 'companyName', width: 300},
                        ];
                        break;
                
                    case "securityId":
                        columnDefs = [
                            {headerName: 'Security Group Name', field: 'name', width: 300}
                        ];
                        break;
                    
                    case "screenId":
                        columnDefs = [
                            {headerName: 'Screen Group Name', field: 'name', width: 200},
                            {headerName: 'ID', field: 'extId', type: "numericColumn", width: 70},
                            {headerName: '?', field: 'help', type: "numericColumn", width: 30}
                        ];
                        break;
    
                    default:
                        columnDefs = [];
                        break;
                }
    
                formSearchGrid = new AGGrid('cso-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                if (searchData === "companyId") {
                    const params = {
                        name: $$('cso-name-search').getValue(),
                        nameSearchType: $$('cso-name-criteria').getValue(),
                        companyId: '',
                        employeeId: personId
                    }
                    AWS.callSoap(WS, 'searchCompanies', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            data.item = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(data.item);
                            $$('cso-count').setValue(`Displaying ${data.item.length} Companies`);
        
                            formSearchGrid.setOnSelectionChanged($$('cso-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                } else if (searchData === "securityId") {
                    const params = {
                        companyId: $$('cso-companyId').getValue(),
                        name: $$('cso-name-search').getValue(),
                        nameSearchType: $$('cso-name-criteria').getValue(),
                        personId: personId
                    }
                    AWS.callSoap(WS, 'searchSecurityGroups', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            data.item = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(data.item);
                            $$('cso-count').setValue(`Displaying ${data.item.length} Security Groups`);
        
                            formSearchGrid.setOnSelectionChanged($$('cso-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                } else if (searchData === "screenId") {
                    const params = {
                        companyId: $$('cso-companyId').getValue(),
                        extId: $$('cso-id-search'),
                        name: $$('cso-name-search').getValue(),
                        nameSearchType: $$('cso-name-criteria').getValue(),
                        personId: personId,
                        searchTopLevelOnly: $$('cso-searchTopLevelOnly').getValue() === 'True'
                    }
                    AWS.callSoap(WS, 'searchScreenGroups', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            data.screenDef = Utils.assureArray(data.screenDef);
                            formSearchGrid.addRecords(data.screenDef);
                            $$('cso-count').setValue(`Displaying ${data.screenDef.length} Security Groups`);
        
                            formSearchGrid.setOnSelectionChanged($$('cso-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                            
            };
    
            $$('cso-reset').onclick(reset);
            $$('cso-search').onclick(search);
            $$('cso-ok').onclick(ok);
            $$('cso-cancel').onclick(cancel);
    
            search();
        }; 
    
        const companyParams = {
            companyId: '',
            employeeId: personId
        }
        AWS.callSoap(WS, 'searchCompanies', companyParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('cso-companyId');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
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
                    searchData('companyId');
                });
            }
        });
    
        $$('cso-companyId').onChange(() => {
            if ($$('cso-companyId').getValue() !== '') {
                const securityGroupParams = {
                    companyId: $$('cso-companyId').getValue(),
                    name: '',
                    nameSearchType: 0,
                    personId: personId
                }
                AWS.callSoap(WS, 'searchSecurityGroups', securityGroupParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('cso-securityGroup');
                        ctl.enable().clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].groupId, res.item[i].name );
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchData('securityId');
                        });
                    }
                });
            
                const screenGroupParams = {
                    companyId: $$('cso-companyId').getValue(),
                    extId: '',
                    name: '',
                    nameSearchType: 0,
                    personId: personId,
                    searchTopLevelOnly: true
                }
                AWS.callSoap(WS, 'searchScreenGroups', screenGroupParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.screenDef = Utils.assureArray(res.screenDef);
                        const ctl = $$('cso-screenGroup');
                        ctl.enable().clear();
                        if (res.screenDef.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.screenDef.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.screenDef.length; i++)
                                ctl.add(res.screenDef[i].id, res.screenDef[i].extId + ' - ' + res.screenDef[i].title );
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchData('screenId');
                        });
                    }
                });
            } else {
                $$('cso-securityGroup').disable().clear();
                $$('cso-screenGroup').disable().clear();
            }
        });

        $$('override-label').setValue('Add');
        Utils.popup_open('override-popup');

        $$('override-ok').onclick(() => {
            const params = {
                companyId: $$('cso-companyId').getValue(),
                employeeId: personId,
                screenGroupId: $$('cso-screenGroup').getValue(),
                securityGroupId: $$('cso-securityGroup').getValue()
            }
            AWS.callSoap(WS, 'newCompanyOverride', params).then(res => {
                if (res.wsStatus === "0") {
                    searchCompaniesForEmployee();
                }
            });
        });

        $$('override-cancel').onclick(Utils.popup_close);
    });

    function edit() {
        const searchData = (searchData) => {
            let formSearchGrid;
            switch (searchData) {
                case 'companyId':
                    $$('cso-data-search-type').setValue('Company');
    
                    $$('cso-id-label').hide();
                    $$('cso-id-search').hide();
    
                    $$('cso-searchTopLevelOnlyLabel').hide();
                    $$('cso-searchTopLevelOnly').hide();
                    break;
    
                case 'securityId':
                    $$('cso-data-search-type').setValue('Security Group');
    
                    $$('cso-id-label').hide();
                    $$('cso-id-search').hide();
    
                    $$('cso-searchTopLevelOnlyLabel').hide();
                    $$('cso-searchTopLevelOnly').hide();
                    break;
    
                case 'screenId':
                    $$('cso-data-search-type').setValue('Screen Group');
    
                    $$('cso-id-label').show();
                    $$('cso-id-search').show();
    
                    $$('cso-searchTopLevelOnlyLabel').show();
                    $$('cso-searchTopLevelOnly').show();
                    break;
            
                default:
                    break;
            }
            
            Utils.popup_open('cso-data-search');
                
            const reset = () => {
                $$('cso-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('cso-name-search').clear();
    
                $$('cso-id-search').clear();
    
                $$('cso-searchTopLevelOnly').setValue('True');
    
                $$('cso-reset').enable();
                $$('cso-search').enable();
    
                $$('cso-ok').disable();
    
                formSearchGrid.clear();
                $$('cso-count').setValue(`Displaying 0 item`);
            };
            
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    switch (searchData) {        
                        case 'companyId':
                            $$('cso-companyId').setValue(row.companyId, row.companyName);
                            break;
            
                        case 'securityId':
                            $$('cso-securityGroup').setValue(row.groupId, row.name);
                            break;
                        
                        case 'screenId':
                            $$('cso-screenGroup').setValue(row.id, row.extId + ' - ' + row.title);
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
    
            bindToEnum('cso-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs;
    
                switch (searchData) {               
                    case "companyId":
                        columnDefs = [
                            {headerName: 'Company Name', field: 'companyName', width: 300},
                        ];
                        break;
                
                    case "securityId":
                        columnDefs = [
                            {headerName: 'Security Group Name', field: 'name', width: 300}
                        ];
                        break;
                    
                    case "screenId":
                        columnDefs = [
                            {headerName: 'Screen Group Name', field: 'name', width: 200},
                            {headerName: 'ID', field: 'extId', type: "numericColumn", width: 70},
                            {headerName: '?', field: 'help', type: "numericColumn", width: 30}
                        ];
                        break;
    
                    default:
                        columnDefs = [];
                        break;
                }
    
                formSearchGrid = new AGGrid('cso-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            const search = () => {
                if (searchData === "companyId") {
                    const params = {
                        name: $$('cso-name-search').getValue(),
                        nameSearchType: $$('cso-name-criteria').getValue(),
                        companyId: '',
                        employeeId: personId
                    }
                    AWS.callSoap(WS, 'searchCompanies', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            data.item = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(data.item);
                            $$('cso-count').setValue(`Displaying ${data.item.length} Companies`);
        
                            formSearchGrid.setOnSelectionChanged($$('cso-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                } else if (searchData === "securityId") {
                    const params = {
                        companyId: $$('cso-companyId').getValue(),
                        name: $$('cso-name-search').getValue(),
                        nameSearchType: $$('cso-name-criteria').getValue(),
                        personId: personId
                    }
                    AWS.callSoap(WS, 'searchSecurityGroups', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            data.item = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(data.item);
                            $$('cso-count').setValue(`Displaying ${data.item.length} Security Groups`);
        
                            formSearchGrid.setOnSelectionChanged($$('cso-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                } else if (searchData === "screenId") {
                    const params = {
                        companyId: $$('cso-companyId').getValue(),
                        extId: $$('cso-id-search'),
                        name: $$('cso-name-search').getValue(),
                        nameSearchType: $$('cso-name-criteria').getValue(),
                        personId: personId,
                        searchTopLevelOnly: $$('cso-searchTopLevelOnly').getValue() === 'True'
                    }
                    AWS.callSoap(WS, 'searchScreenGroups', params).then(data => {
                        if (data.wsStatus === '0') {
                            formSearchGrid.clear();
                            data.screenDef = Utils.assureArray(data.screenDef);
                            formSearchGrid.addRecords(data.screenDef);
                            $$('cso-count').setValue(`Displaying ${data.screenDef.length} Security Groups`);
        
                            formSearchGrid.setOnSelectionChanged($$('cso-ok').enable);
                    
                            formSearchGrid.setOnRowDoubleClicked(ok);
                        }
                    });
                }                            
            };
    
            $$('cso-reset').onclick(reset);
            $$('cso-search').onclick(search);
            $$('cso-ok').onclick(ok);
            $$('cso-cancel').onclick(cancel);
    
            search();
        }; 
    
        const row = companySecurityGrid.getSelectedRow();
        const companyParams = {
            companyId: '',
            employeeId: personId
        }
        AWS.callSoap(WS, 'searchCompanies', companyParams).then(res => {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('cso-companyId');
                ctl.disable().clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
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
                    searchData('companyId');
                });
                ctl.setValue(row.companyId);
            }
        });

        function getSecurityAndScreenGroups(companyId) {
            const securityGroupParams = {
                companyId: companyId,
                name: '',
                nameSearchType: 0,
                personId: personId
            }
            AWS.callSoap(WS, 'searchSecurityGroups', securityGroupParams).then(res => {
                if (res.wsStatus === "0") {
                    res.item = Utils.assureArray(res.item);
                    const ctl = $$('cso-securityGroup');
                    ctl.enable().clear();
                    if (res.item.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.item.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.item.length; i++)
                            ctl.add(res.item[i].groupId, res.item[i].name );
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchData('securityId');
                    });
                    ctl.setValue(row.securityGroupId);
                }
            });
        
            const screenGroupParams = {
                companyId: companyId,
                extId: '',
                name: '',
                nameSearchType: 0,
                personId: personId,
                searchTopLevelOnly: true
            }
            AWS.callSoap(WS, 'searchScreenGroups', screenGroupParams).then(res => {
                if (res.wsStatus === "0") {
                    res.screenDef = Utils.assureArray(res.screenDef);
                    const ctl = $$('cso-screenGroup');
                    ctl.enable().clear();
                    if (res.screenDef.length === 0) {
                        ctl.nothingToSelect();
                    } else if (res.screenDef.length <= res.lowCap) {
                        ctl.useDropdown();
                        ctl.add('', '(choose)');
                        for (let i = 0 ; i < res.screenDef.length; i++)
                            ctl.add(res.screenDef[i].id, res.screenDef[i].extId + ' - ' + res.screenDef[i].title );
                    } else {
                        ctl.forceSelect();
                        ctl.setValue('' ,'(choose)');
                    }
                    ctl.setSelectFunction(() => {
                        searchData('screenId');
                    });
                    ctl.setValue(row.screenGroupId);
                }
            });
        }

        getSecurityAndScreenGroups();

        $$('override-label').setValue('Edit');
        Utils.popup_open('override-popup');

        $$('override-ok').onclick(() => {
            const params = {
                companyId: $$('cso-companyId').getValue(),
                employeeId: personId,
                loginExceptionId: row.loginExceptionId,
                screenGroupId: $$('cso-screenGroup').getValue(),
                securityGroupId: $$('cso-securityGroup').getValue()
            }
            AWS.callSoap(WS, 'saveCompanyOverride', params).then(res => {
                if (res.wsStatus === "0") {
                    searchCompaniesForEmployee();
                }
            });
        });

        $$('override-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);
})();
