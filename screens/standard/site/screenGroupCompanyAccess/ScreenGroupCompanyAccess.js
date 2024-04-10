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
    const WS = 'StandardSiteScreenGroupCompanyAccess';

    function ViewProfile() {}

    ViewProfile.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('input');
        a.setAttribute('type', 'button');
        a.style = "cursor: pointer;";
        a.value = 'View Profile';
        a.style.fontSize = '10px';
        a.style.verticalAlign = 'super';
        a.style.padding = '4px 8px';

        a.addEventListener("click", function () {
        Utils.saveData(HR_PERSON_ID, params.data.personId);

        Framework.getChild();
            
        });
        this.eGui.appendChild(a);
    };

    ViewProfile.prototype.getGui = function() {
        return this.eGui;
    };

    const searchCompanies = () => {
        let formSearchGrid;
        
        Utils.popup_open('sgca-data-search');
            
        const reset = () => {
            $$('sgca-companyName-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('sgca-companyName').clear();

            $$('sgca-reset').enable();
            $$('sgca-search').enable();

            $$('sgca-ok').disable();

            formSearchGrid.clear();
            $$('sgca-count').setValue(`Displaying 0 Companies`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$('sgca-clientCompanyId').setValue(row.id, row.name);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('sgca-companyName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            let columnDefs = [
                {headerName: 'Company Name', field: 'name', width: 470}
            ];

            formSearchGrid = new AGGrid('sgca-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const params = {
                name: $$('sgca-companyName').getValue(),
                nameSearchType: $$('sgca-companyName-criteria').getValue()
            }
            AWS.callSoap(WS, 'searchCompanies', params).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.item) {
                        const records = Utils.assureArray(data.item);
                        formSearchGrid.addRecords(records);
                        $$('sgca-count').setValue(`Displaying ${records.length} Companies`);
                    } else {
                        $$('sgca-count').setValue(`Displaying 0 Companies`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('sgca-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            });
        };

        $$('sgca-reset').onclick(reset);
        $$('sgca-search').onclick(search);
        $$('sgca-ok').onclick(ok);
        $$('sgca-cancel').onclick(cancel);

        search();
    }; 

    bindToEnum('sgca-firstName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('sgca-lastName-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    const companyParams = {
        name: '',
        nameSearchType: 0
    }
    AWS.callSoap(WS, 'searchCompanies', companyParams).then(res => {
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            const ctl = $$('sgca-clientCompanyId');
            ctl.clear();
            if (res.item.length === 0) {
                ctl.nothingToSelect();
            } else if (res.item.length <= res.lowCap) {
                ctl.useDropdown();
                ctl.add('', '(select)');
                for (let i = 0 ; i < res.item.length; i++)
                    ctl.add(res.item[i].id, res.item[i].name);
            } else {
                ctl.forceSelect();
                ctl.setValue('' ,'(select)');
            }
            ctl.setSelectFunction(() => {
                searchCompanies();
            });
        }
    });
    
    AWS.callSoap(WS, 'listScreenGroups').then(res => {
        if (res.wsStatus === "0") {
            res.screenGroups = Utils.assureArray(res.screenGroups);
            const ctl = $$('sgca-screenGroup');
            ctl.clear().add('', '(select)').addItems(res.screenGroups, 'id', 'name');
        }
    });

    AWS.callSoap(WS, 'listSecurityGroups').then(res => {
        if (res.wsStatus === "0") {
            res.securityGroups = Utils.assureArray(res.securityGroups);
            const ctl = $$('sgca-securityGroup');
            ctl.clear().add('', '(select)').addItems(res.securityGroups, 'id', 'name');
        }
    });

    let resultsGrid;

    const resultsColumnDefs = [
        {headerName: "Company", field: "companyName", width: 180},
        {headerName: "Last Name", field: "LName", width: 180},
        {headerName: "First Name", field: "FName", width: 180},
        {headerName: "Last Signed in", field: "signInDate", width: 180},
        {headerName: "Screen Group", field: "screenGroupName", width: 220},
        {headerName: "Security Group", field: "securityGroupName", width: 220},
        {headerName: "", field: "viewProfile", cellRenderer: 'viewProfile', width: 100}
    ];
    resultsGrid = new AGGrid('resultsGrid', resultsColumnDefs);
    resultsGrid.addComponent('viewProfile', ViewProfile);
    resultsGrid.show();


    let currentPageOffset = {
        firstItemIndexPaging: 0,
        itemsPerPage: 50
    };

    $$('search').onclick(() => {
        const params = {
            companyId: $$('sgca-clientCompanyId').getValue(),
            firstName: $$('sgca-firstName').getValue(),
            firstNameSearchType: $$('sgca-firstName-criteria').getValue(),
            lastName: $$('sgca-lastName').getValue(),
            lastNameSearchType: $$('sgca-lastName-criteria').getValue(),
            screenGroupId: $$('sgca-screenGroup').getValue(),
            securityGroupId: $$('sgca-securityGroup').getValue(),
        };

        params.searchMeta = {
            firstItemIndexPaging: currentPageOffset.firstItemIndexPaging,
            sortAsc: true,
            sortField: "",
            usingPaging: true
        }

        AWS.callSoap(WS, 'searchScreenAndSecurityGroups', params).then(data => {
            if (data.wsStatus === '0') {
                resultsGrid.clear();

                data.item = Utils.assureArray(data.item); 
                $$('sgca-status').setValue(`Displaying ${data.item.length} Users`);
                resultsGrid.addRecords(data.item);

                currentPageOffset.itemsPerPage = data.searchMeta.itemsPerPage;
                    currentPageOffset.firstItemIndexPaging = data.searchMeta.firstItemIndexPaging;
                    
                    $$('pagination_label').setHTMLValue('<b>' + (Number(currentPageOffset.firstItemIndexPaging) + 1) + ' - ' + (data.item.length + Number(currentPageOffset.firstItemIndexPaging)) + '</b> of <b>' + data.searchMeta.totalItemsPaging + '</b>');

                    if ((data.searchMeta.totalItemsPaging - data.searchMeta.firstItemIndexPaging) / data.searchMeta.itemsPerPage > 1) {
                        $$("sgca-next").enable();
                    }

                    if (data.searchMeta.firstItemIndexPaging > 0) {
                        $$("sgca-prev").enable();
                    }

                    $$("sgca-next").onclick(() => {
                        currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging + currentPageOffset.itemsPerPage;
                        searchProspects();
                    });

                    $$("sgca-prev").onclick(() => {
                        currentPageOffset.firstItemIndexPaging = currentPageOffset.firstItemIndexPaging - currentPageOffset.itemsPerPage;
                        searchProspects();
                    });
            }
        });      
    });

    $$('reset').onclick(() => {
        $$('sgca-clientCompanyId').setValue('');
        $$('sgca-firstName').clear();
        $$('sgca-firstName-criteria').setValue(2);
        $$('sgca-lastName').clear();
        $$('sgca-lastName-criteria').setValue(2);
        $$('sgca-screenGroup').setValue('');
        $$('sgca-securityGroup').setValue('');

        currentPageOffset = {
            firstItemIndexPaging: 0,
            itemsPerPage: 50
        };
    });

    $$('report').onclick(() => {
        const params = {
            companyId: $$('sgca-clientCompanyId').getValue(),
            firstName: $$('sgca-firstName').getValue(),
            firstNameSearchType: $$('sgca-firstName-criteria').getValue(),
            lastName: $$('sgca-lastName').getValue(),
            lastNameSearchType: $$('sgca-lastName-criteria').getValue(),
            screenGroupId: $$('sgca-screenGroup').getValue(),
            securityGroupId: $$('sgca-securityGroup').getValue(),
        };
        
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });
})();
