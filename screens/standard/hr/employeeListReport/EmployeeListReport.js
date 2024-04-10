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

window.EmployeeListReport = {};

(async function () {

    const WS = 'StandardHrEmployeeListReport';
    
    const availableGrid = new AGGrid('available-fields', [{headerName: 'Field', field: 'id'}], 'id');
    availableGrid.show();
    availableGrid.setOnSelectionChanged($$('add-field').enable);
    availableGrid.setOnRowDoubleClicked(()=>moveFields('right'));

    const selectedGrid = new AGGrid('selected-fields', [{headerName: 'Field', field: 'id'}], 'id');
    selectedGrid.show();
    selectedGrid.setOnSelectionChanged((rows) => {
        $$('up-field').enable(rows);
        $$('down-field').enable(rows);
        $$('remove-field').enable(rows);
    });
    selectedGrid.setOnRowDoubleClicked(()=>moveFields('left'));
    
    AWS.callSoap(WS, "listFields").then(function (res) {
        if (res.wsStatus === '0') {
            res.item = Utils.assureArray(res.item);
            availableGrid.clear().addRecords(res.item);
            $$('available-status').setValue(`Displaying ${res.item.length} Available Fields`);
        }
    });

    const moveFields = (direction) => {
        let available = [];
        let selected = [];

        availableGrid.getDataItems().map((col) => {
            if (direction === 'right' && col.id !== availableGrid.getSelectedRow().id) {
                available.push(col);                
            } else if (direction === 'left') {
                available.push(col);
            }
        });
        selectedGrid.getDataItems().map((col) => {
            if (direction === 'left' && col.id !== selectedGrid.getSelectedRow().id) {
                selected.push(col);                
            } else if (direction === 'right') {
                selected.push(col);
            }
        });

        if (direction === 'right') {
            selected.push( availableGrid.getSelectedRow() );
        } else if (direction === 'left') {
            available.push( selectedGrid.getSelectedRow() );
        }

        availableGrid.clear().addRecords(available);
        selectedGrid.clear().addRecords(selected);

        $$('available-status').setValue(`Displaying ${available.length} Available Fields`)
        $$('selected-status').setValue(`Displaying ${selected.length} Selected Fields`)

        $$('add-field').disable();
        $$('up-field').disable();
        $$('down-field').disable();
        $$('remove-field').disable();
    };

    const moveSelected = (direction) => {
        let data = selectedGrid.getDataItems();
        let selected = selectedGrid.getSelectedRow();
        let nxt ;
        for (let i = 0; i < data.length; i++ ) {
            if (data[i].id === selected.id) {
                let flg = 0;
                if (direction === 'up' && i)
                    flg = -1;
                else if (direction === 'down' && i !== data.length - 1)
                    flg = 1;
                nxt = i + flg;
                let tmp = data[i];
                data[i] = data[i + flg];
                data[i + flg] = tmp;
                break;
            }
        }
        selectedGrid.clear().addRecords(data);
        setTimeout(() => selectedGrid.selectId(selected.id), 100);
    }

    /////////////////////////////////////////////////////////////////////////////////
    // choose org group popup
    /////////////////////////////////////////////////////////////////////////////////
    let orgGroupGrid = null;

    orgGroupGrid = new AGGrid('cop-grid', [
        {headerName: 'Organizational Group', field: 'orgGroupName', width: 55 },
        {headerName: 'ID', field: 'externalId', width: 25 }
    ], 'orgGroupId');
    orgGroupGrid.show();
    const chooseOrgGroupPopup = async () => {

        let screenStack = [];
        let nameStack = [];

        if (orgGroupGrid)
            orgGroupGrid.clear();

        Utils.popup_open('choose-org-group-popup');

        return new Promise(function (resolve, reject) {

            EmployeeListReport.goBack = function (lvl) {
                while (lvl--) {
                    screenStack.pop();
                    nameStack.pop();
                }
                updateGrid(screenStack[screenStack.length - 1]);
            }

            function updateBreadCrumb() {
                const levels = screenStack.length
                const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
                let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="BenefitConfigAdvancedCost.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
                let i = 1;
        
                for (; i < levels; i++)
                    bc += separator + '<a class="" onclick="BenefitConfigAdvancedCost.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';
        
                bc += '</div>';
                $('#cop-bread-crumb-2').html(bc);
            }

            function updateGrid( orgGroupId, name, selectId ) {
                if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== orgGroupId) {
                    screenStack.push(orgGroupId);
                    nameStack.push(name ? name : "Top");
                }
                orgGroupId ? $$('cop-go-up').enable() : $$('cop-go-up').disable();
                orgGroupGrid.clear();
                $$('cop-open').disable();
                const data = {
                    orgGroupId: orgGroupId
                };
                AWS.callSoap(WS, "listOrgGroupsForGroup", data).then(function (res) {
                    if (res.wsStatus === '0') {
                        res.item = Utils.assureArray(res.item);
                        $$('cop-status').setValue(`Displaying ${res.item.length} Organizational Groups`)
                        orgGroupGrid.addRecords(res.item);
                        if (selectId)
                            orgGroupGrid.selectId(selectId);
                        updateBreadCrumb();
                    }
                });
            }

            updateGrid(null);

            function descend() {
                const row = orgGroupGrid.getSelectedRow();
                updateGrid(row.orgGroupId, row.orgGroupName);
            }

            orgGroupGrid.setOnRowDoubleClicked(descend);
            orgGroupGrid.setOnSelectionChanged($$('cop-open').enable);

            $$('cop-go-up').onclick(() => {
                screenStack.pop();
                nameStack.pop();
                updateGrid(screenStack.pop(), nameStack.pop());
            });

            $$('cop-open').onclick(descend);

            let ok = () => {
                const row = orgGroupGrid.getSelectedRow();
                Utils.popup_close();
                resolve(row);
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            $$('cop-ok').onclick(ok);
            $$('cop-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // choose benefit popup
    /////////////////////////////////////////////////////////////////////////////////
    let configs;
    let orgGroup;
    const chooseBenefit = async () => {

        let selected = [];

        const configsGrid = new AGGrid('cbp-configs-grid', [{headerName: 'Coverage Configuration', field: 'description'}], 'id');
        configsGrid.show();
        configsGrid.setOnSelectionChanged($$('cbp-add-selected').enable);

        const selectedConfigsGrid = new AGGrid('cbp-selected-configs-grid', [
            {headerName: 'Category', field: 'category2'},
            {headerName: 'Benefit', field: 'benefit2'},
            {headerName: 'Coverage Configuration', field: 'config'}
        ], 'id');
        selectedConfigsGrid.show();
        selectedConfigsGrid.setOnSelectionChanged($$('cbp-remove-selected').enable);

        function updateGrids() {
            let data = [];
            configsGrid.getDataItems().map(item => {
                if (selected.map(sel => sel.id).indexOf(item.id) === -1) {
                    data.push(item);
                }
            })
            configsGrid.clear().addRecords(data);
            selectedConfigsGrid.clear().addRecords(selected);

            $$('cbp-coverage-config-status').setValue(`Displaying ${selected.length} Coverage Configurations`);
        }

        Utils.popup_open('choose-benefit-popup');

        return new Promise(function (resolve, reject) {

            AWS.callSoap(WS, 'listBenefitCategories').then(res => {
                fillDropDownFromService('cbp-benefit-category', res, 'id', 'description');
            });

            $$('cbp-benefit-category').onChange(v => {
                AWS.callSoap(WS, 'listBenefits', {categoryId: v}).then(res => {
                    fillDropDownFromService('cbp-benefit', res, 'id', 'description');
                });
            });

            $$('cbp-benefit').onChange(v => {
                $$('cbp-add-all').disable();
                $$('cbp-add-selected').disable();

                AWS.callSoap(WS, 'listCoverageConfigurations', {benefitId: v}).then(res => {
                    if (res.wsStatus === '0') {
                        res.item = Utils.assureArray(res.item);
                        if (res.item.length) {
                            $$('cbp-add-all').enable();
                        }
                        for (let i=0 ; i < res.item.length ; i++) {
                            let row = res.item[i];
                            row.config = row.description;
                            row.category = $$('cbp-benefit-category').getValue();
                            row.category2 = $$('cbp-benefit-category').getLabel();
                            row.benefit = $$('cbp-benefit').getValue();
                            row.benefit2 = $$('cbp-benefit').getLabel();
                        }
                        configsGrid.clear().addRecords(res.item);
                        updateGrids();
                    }
                });
            });

            $$('cbp-add-all').onclick(() => {
                configsGrid.getDataItems().map(item => selected.push(item));
                updateGrids();
            });

            $$('cbp-add-selected').onclick(() => {
                selected.push(configsGrid.getSelectedRow());
                updateGrids();
            });

            $$('cbp-remove-selected').onclick(() => {
                let data = [];
                selected.map(item => {
                    if (item.id !== selectedConfigsGrid.getSelectedRow().id) {
                        data.push(item);
                    }
                })
                selected = data;
                updateGrids();
            });

            let ok = () => {
                Utils.popup_close();
                resolve(selected);
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            $$('cbp-ok').onclick(ok);
            $$('cbp-cancel').onclick(cancel);

        });
    };

    $$('add-field').onclick(() => {
        moveFields('right');
    });

    $$('up-field').onclick(() => {
        moveSelected('up');
    });

    $$('down-field').onclick(() => {
        moveSelected('down');
    });

    $$('remove-field').onclick(() => {
        moveFields('left');
    });

    $$('choose-org-group').onclick(async () => {
        let selected = await chooseOrgGroupPopup();
        if (selected) {
            $$('filter-org-group').setValue(selected.orgGroupName);
            orgGroup = selected;
        }
    });

    $$('choose-benefit').onclick(async () => {
        let selected = await chooseBenefit();
        if (selected) {
            let str = '';
            selected.map(item => {
                str += `(${item.config}) `;
            });
            $$('filter-benefits').setValue(str);
            configs = selected;
        }
    });

    $$('report').onclick(() => {
        const ids = selectedGrid.getDataItems().map(item => item.id);
        if (!ids || !ids.length) {
            Utils.showMessage('Error', 'No fields selected.');
            return;
        }
        const data = {
            dobFrom: $$('filter-dob-from').getIntValue(),
            dobTo: $$('filter-dob-to').getIntValue(),
            lastNameStartsWithFrom: $$('filter-last-name-from').getValue(),
            lastNameStartsWithTo: $$('filter-last-name-to').getValue(),
            sortAsc: $$('filter-sort-direction').getValue(),
            sortType: $$('filter-sort-type').getValue(),
            statusType: $$('filter-status-type').getValue(),
            ids: ids,
            orgGroupIds: orgGroup ? [orgGroup.orgGroupId] : [],
            orgGroupCodes: orgGroup ? [orgGroup.code] : [],
            configIds: configs ? configs.map(item => item.id) : []
        };
        Utils.waitMessage("Report in progress");
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('export').onclick(() => {
        const ids = selectedGrid.getDataItems().map(item => item.id);
        if (!ids || !ids.length) {
            Utils.showMessage('Error', 'No fields selected.');
            return;
        }
        const data = {
            dobFrom: $$('filter-dob-from').getIntValue(),
            dobTo: $$('filter-dob-to').getIntValue(),
            lastNameStartsWithFrom: $$('filter-last-name-from').getValue(),
            lastNameStartsWithTo: $$('filter-last-name-to').getValue(),
            sortAsc: $$('filter-sort-direction').getValue(),
            sortType: $$('filter-sort-type').getValue(),
            statusType: $$('filter-status-type').getValue(),
            ids: ids,
            orgGroupIds: orgGroup ? [orgGroup.orgGroupId] : [],
            orgGroupCodes: orgGroup ? [orgGroup.code] : [],
            configIds: configs ? configs.map(item => item.id) : []
        };
        Utils.waitMessage("Export in progress");
        AWS.callSoap(WS, "getExport", data).then(function (res) {
            Utils.waitMessageEnd();
            if (res.wsStatus === '0') {
                Utils.showReport(res.csvUrl);
            }
        });
    });

})();
