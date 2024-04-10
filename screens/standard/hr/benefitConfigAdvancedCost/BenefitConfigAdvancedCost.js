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

window.BenefitConfigAdvancedCost = {};

(async function () {

    const WS = 'StandardHrBenefitConfigAdvancedCost';
    const benefitId = Utils.getData(CURRENT_BENEFIT_ID);

    const columnDefs = [
        {headerName: 'Coverage Type', field: 'name', width: 30},
        {headerName: 'Coverage', field: 'coverage', width: 55},
        {headerName: 'Active', field: 'active', width: 15},
    ];
    const grid = new AGGrid('grid', columnDefs, 'configId');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        $$('moveup').disable();
        $$('movedown').disable();
        
        AWS.callSoap(WS, "listConfigs", {benefitId: benefitId}).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Benefit Coverage Configurations');
            }
        });
    }

    updateGrid();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        $$('moveup').enable(rows);
        $$('movedown').enable(rows);
    });

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

        orgGroupGrid.clear();

        Utils.popup_open('choose-org-group-popup');

        return new Promise(function (resolve, reject) {

            BenefitConfigAdvancedCost.goBack = function (lvl) {
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
    // monthly cost popup
    /////////////////////////////////////////////////////////////////////////////////
    let availableStatusGrid = null, selectedStatusGrid = null;

    availableStatusGrid = new AGGrid('mcp-grid-available-status', [{headerName: 'Available Statuses', field: 'name'}], 'id');
    availableStatusGrid.show();

    selectedStatusGrid = new AGGrid('mcp-grid-selected-status', [{headerName: 'Selected Statuses', field: 'name'}], 'id');
    selectedStatusGrid.show();  

    const monthlyCostPopup = async (coverageType, row) => {

        const container = new TabContainer('mcp-tab-container');
        let orgGroupId = null;

        availableStatusGrid.clear();
        availableStatusGrid.setOnSelectionChanged((rows) => {
            $$('mcp-status-assign').enable(rows);
            $$('mcp-status-unassign').disable(rows);
        });

        selectedStatusGrid.clear();
        selectedStatusGrid.setOnSelectionChanged((rows) => {
            $$('mcp-status-assign').disable(rows);
            $$('mcp-status-unassign').enable(rows);
        });
        
        if (coverageType) {
            $$('mcp-coverage-type').setValue(coverageType);
        } else {
            $$('mcp-coverage-type').setValue('(not yet entered)');
        }

        container.selectTab('mcp-restrictions-TabButton');
        Utils.popup_open('monthly-cost-popup');

        return new Promise(function (resolve, reject) {

            if (!row) {
                $$('mcp-title').setValue('Add Costs');
                $$('mcp-org-group').clear();
                $$('mcp-cost-restriction').setValue('C');
                $$('mcp-first-active-date').clear();
                $$('mcp-last-active-date').clear();
            } else {
                $$('mcp-title').setValue('Edit Costs');
                $$('mcp-org-group').setValue(row.orgGroupName);
                $$('mcp-cost-restriction').setValue(row.statusType);
                selectedStatusGrid.addRecords(row.statusesArray);
                $$('mcp-first-active-date').setValue(row.firstActiveDate);
                $$('mcp-last-active-date').setValue(row.lastActiveDate);
            }
            handleRadioChange();

            $$('mcp-choose-org-group').onclick(async () => {
                let selected = await chooseOrgGroupPopup();
                if (selected) {
                    $$('mcp-org-group').setValue(selected.orgGroupName);
                    orgGroupId = selected.orgGroupId;
                }
            });

            function updateStatusGrid() {
                availableStatusGrid.clear();
                
                AWS.callSoap(WS, 'listEmployeeStatuses', { excludeIds: selectedStatusGrid.getDataItems().map(col => col.id) }).then(res => {
                    if (res.wsStatus === '0') {
                        availableStatusGrid.addRecords(Utils.assureArray(res.item));
                    }
                });
            }

            $$('mcp-cost-restriction').onChange(handleRadioChange);

            function handleRadioChange() {
                if ($$('mcp-cost-restriction').getValue() === 'S') {
                    updateStatusGrid();
                } else {
                    availableStatusGrid.clear();
                    selectedStatusGrid.clear();
                    $$('mcp-status-assign').disable();
                    $$('mcp-status-unassign').disable();
                }
            }

            const assginStatus = async (flag) => {
                let available = [];
                let selected = [];
        
                availableStatusGrid.getDataItems().map((col) => {
                    if (flag === true && col.id != availableStatusGrid.getSelectedRow().id) {
                        available.push(col);                
                    } else if (flag === false) {
                        available.push(col);
                    }
                });
                selectedStatusGrid.getDataItems().map((col) => {
                    if (flag === false && col.id != selectedStatusGrid.getSelectedRow().id) {
                        selected.push(col);                
                    } else if (flag === true) {
                        selected.push(col);
                    }
                });
        
                if (flag === true) {
                    selected.push( availableStatusGrid.getSelectedRow() );
                } else if (flag === false) {
                    available.push( selectedStatusGrid.getSelectedRow() );
                }
        
                selectedStatusGrid.clear().addRecords(selected);
                updateStatusGrid();
        
                $$('mcp-status-assign').disable();
                $$('mcp-status-unassign').disable();
            };
    
            $$('mcp-status-assign').onclick(() => { assginStatus(true); });
            $$('mcp-status-unassign').onclick(() => { assginStatus(false); });

            let ok = () => {
                if ($$('mcp-org-group').isError('Organizations Group'))
                    return;
                if ($$('mcp-cost-restriction').getValue() === 'S' && !selectedStatusGrid.getDataItems().length) {
                    Utils.showMessage('Validation Error!', 'Select status');
                    return;
                }

                const data = {
                    orgGroupId: orgGroupId,
                    orgGroupName: $$('mcp-org-group').getValue(),
                    statusesArray: selectedStatusGrid.getDataItems(),
                    statusType: $$('mcp-cost-restriction').getValue(),
                    firstActiveDate: $$('mcp-first-active-date').getIntValue(),
                    lastActiveDate: $$('mcp-last-active-date').getIntValue()
                };
                
                Utils.popup_close();
                resolve(data);
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            $$('mcp-ok').onclick(ok);
            $$('mcp-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // detail popup
    /////////////////////////////////////////////////////////////////////////////////
    let costDataGrid = null, availableClassGrid = null, selectedClassGrid = null;

    availableClassGrid = new AGGrid('dp-grid-available-benefit-classes', [{headerName: 'Available Benefit Classes', field: 'name'}], 'id');
    availableClassGrid.show();

    selectedClassGrid = new AGGrid('dp-grid-selected-benefit-classes', [{headerName: 'Selected Benefit Classes', field: 'name'}], 'id');
    selectedClassGrid.show();

    costDataGrid = new AGGrid('dp-grid-monthly-cost-data', [
        {headerName: 'Organizational Group', field: 'orgGroupName'},
        {headerName: 'Status Restriction', field: 'statusType2'},
        {headerName: 'First Active', field: 'firstActiveDate2'},
    ], 'uuid');
    costDataGrid.show();  

    const detailPopup = async (benefitId,  configId) => {

        const container = new TabContainer('dp-tab-container');
        const checkboxes = [
            'dp-chk-covers-employee',
            'dp-chk-covers-employee-spouse',
            'dp-chk-covers-nonemployee-spouse',
            'dp-chk-covers-children',
            'dp-chk-covers-employee-spouse-or-children',
            'dp-chk-covers-nonemployee-spouse-or-children',
        ];

        const benefit = await AWS.callSoap(WS, "loadBenefit", { benefitId: benefitId });
        let config = null;
        let costData = [];
        if (configId) {
            config = await AWS.callSoap(WS, "loadConfig", { configId: configId });
        }

        if (costDataGrid)
            costDataGrid.clear();
        costDataGrid.setOnSelectionChanged((rows) => {
            $$('dp-monthly-cost-edit').enable(rows);
            $$('dp-monthly-cost-delete').enable(rows);
        });
        if (config) {
            costData = Utils.assureArray(config.configCost);
            for (let i = 0; i < costData.length; i ++) {
                costData[i].uuid = Utils.uuid();
            }
        }
        updateCostGrid();

        if (availableClassGrid)
            availableClassGrid.clear();
        availableClassGrid.setOnSelectionChanged((rows) => {
            $$('dp-select-left').enable(rows);
            $$('dp-select-right').disable(rows);
        });

        if (selectedClassGrid)
            selectedClassGrid.clear();
        selectedClassGrid.setOnSelectionChanged((rows) => {
            $$('dp-select-left').disable(rows);
            $$('dp-select-right').enable(rows);
        });

        AWS.callSoap(WS, "listBenefitClasses", {benefitId: benefitId, excludeIds: config ? Utils.assureArray(config.benefitClass).map(col => col.id):[] }).then( function (res) {
            if (res.wsStatus === '0') {
                availableClassGrid.clear();
                availableClassGrid.addRecords(Utils.assureArray(res.item));
            }
        });
        if (config) {
            selectedClassGrid.clear();
            selectedClassGrid.addRecords(Utils.assureArray(config.benefitClass));            
        }

        const moveBenefitClass = async (direction) => {
            let available = [];
            let selected = [];
    
            availableClassGrid.getDataItems().map((col) => {
                if (direction === 'right' && col.id != availableClassGrid.getSelectedRow().id) {
                    available.push(col);                
                } else if (direction === 'left') {
                    available.push(col);
                }
            });
            selectedClassGrid.getDataItems().map((col) => {
                if (direction === 'left' && col.id != selectedClassGrid.getSelectedRow().id) {
                    selected.push(col);                
                } else if (direction === 'right') {
                    selected.push(col);
                }
            });
    
            if (direction === 'right') {
                selected.push( availableClassGrid.getSelectedRow() );
            } else if (direction === 'left') {
                available.push( selectedClassGrid.getSelectedRow() );
            }
    
            availableClassGrid.clear(); availableClassGrid.addRecords(available);
            selectedClassGrid.clear(); selectedClassGrid.addRecords(selected);
    
            $$('dp-select-left').disable();
            $$('dp-select-right').disable();
        };

        function formatStatusType(item) {
            if (item.statusType == "A")
            {
                return "None"
            }
            if (item.statusType == "C")
            {
                return "Received Under COBRA";
            }
            if (item.statusType == "S")
            {
                let result = "";
                
                for (let status of item.statusesArray)
                {
                    if (result.length > 0)
                    {
                        result += ", ";
                    }
                    
                    result += status.name;
                }
                
                return result;
            }

            return "Unknown";
        }

        function updateCostGrid() {
            costDataGrid.clear();
            for (let i=0 ; i < costData.length ; i++) {
                let row = costData[i];
                row.firstActiveDate2 = row.firstActiveDate !== '0' ? DateUtils.intToStr4(Number(row.firstActiveDate)) : '';
                row.statusType2 = formatStatusType(row);
            }
            costDataGrid.addRecords(costData);
        }

        $$('dp-select-left').onclick(() => { moveBenefitClass('right'); });
        $$('dp-select-right').onclick(() => { moveBenefitClass('left'); });

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {

            if (!configId) {
                $$('dp-title').setValue('Add Benefit Coverage Type');
                $$('dp-coverage-type').clear();
                $$('dp-active-date').clear();
                $$('dp-inactive-date').clear();
                $$('dp-additional-information').clear();

                $$('dp-coverage-radio').setValue('A');
                $$('dp-chk-customize').clear();
                $$('dp-chk-covers-employee').clear();
                $$('dp-chk-covers-employee-spouse').clear();
                $$('dp-chk-covers-nonemployee-spouse').clear();
                $$('dp-chk-covers-children').clear();
                $$('dp-chk-covers-employee-spouse-or-children').clear();
                $$('dp-chk-covers-nonemployee-spouse-or-children').clear();
                $$('dp-maxnum-covered').clear();
                $$('dp-chk-spouse-declines-outside-coverage').clear();

                $$('dp-chk-include-in-consolidated-billing').clear();
                $$('dp-chk-auto-assign').clear();
            } else {
                $$('dp-title').setValue('Edit Benefit Coverage Type');
                $$('dp-coverage-type').setValue(config.name);
                $$('dp-active-date').setValue(config.activeDate);
                $$('dp-inactive-date').setValue(config.inactiveDate);
                $$('dp-additional-information').setValue(config.additionalInfo);
                
                $$('dp-chk-customize').clear();
                $$('dp-chk-covers-employee').setValue(config.coversEmployee);
                $$('dp-chk-covers-employee-spouse').setValue(config.coversEmployeeSpouse);
                $$('dp-chk-covers-nonemployee-spouse').setValue(config.coversNonEmployeeSpouse);
                $$('dp-chk-covers-children').setValue(config.coversChildren);
                $$('dp-chk-covers-employee-spouse-or-children').setValue(config.coversEmployeeSpouseOrChildren);
                $$('dp-chk-covers-nonemployee-spouse-or-children').setValue(config.coversNonEmployeeSpouseOrChildren);
                $$('dp-maxnum-covered').setValue(config.maxDependents);
                $$('dp-chk-spouse-declines-outside-coverage').setValue(config.spouseDeclinesExternalCoverage);

                $$('dp-chk-include-in-consolidated-billing').setValue(config.includeInBilling);
                $$('dp-chk-auto-assign').setValue(config.autoAssign);
            }
            container.selectTab('dp-overview-TabButton');

            const handleCheckboxChange = (field) => {
                if ( $$('dp-chk-customize').getValue() ) {
                    checkboxes.map( chkItem => $$(chkItem).enable() );
                    $$('dp-maxnum-covered').enable();
                    $('.customize-area').css('color', 'black');
                } else {
                    checkboxes.map( chkItem => $$(chkItem).disable() );
                    $$('dp-maxnum-covered').disable();
                    $('.customize-area').css('color', '#b9c0c0');
                    return;
                }

                if (field === 'children')
                {
                    if ($$('dp-chk-covers-children').getValue()) {
                        $$('dp-chk-covers-employee-spouse-or-children').setValue(false);
                        $$('dp-chk-covers-nonemployee-spouse-or-children').setValue(false);
                    } else {
                        $$('dp-maxnum-covered').setValue(0);
                    }
                }
                if (field === 'spouse')
                {
                    if (!$$('dp-chk-covers-children').getValue()) {
                        $$('dp-maxnum-covered').setValue(0);
                    }
                    if ($$('dp-chk-covers-employee-spouse').getValue() || $$('dp-chk-covers-nonemployee-spouse').getValue()) {
                        $$('dp-chk-covers-employee-spouse-or-children').setValue(false);
                        $$('dp-chk-covers-nonemployee-spouse-or-children').setValue(false);
                    }
                }
                if (field === 'spouseOrchildren')
                {
                    if ($$('dp-chk-covers-employee-spouse-or-children').getValue() || $$('dp-chk-covers-nonemployee-spouse-or-children').getValue()) {
                        $$('dp-chk-covers-children').setValue(false);
                        $$('dp-chk-covers-employee-spouse').setValue(false);
                        $$('dp-chk-covers-nonemployee-spouse').setValue(false);
                    } else {
                        $$('dp-maxnum-covered').setValue(0);
                    }
                }

                if ($$('dp-chk-covers-children').getValue()) {
                    $$('dp-maxnum-label').setValue('Maximum Number of Children Covered (0 for no maximum):');
                    $$('dp-maxnum-covered').enable();
                } else {
                    $$('dp-maxnum-label').setValue('Maximum Number of Dependents Covered (0 for no maximum):');
                    if ($$('dp-chk-covers-employee-spouse-or-children').getValue() || $$('dp-chk-covers-nonemployee-spouse-or-children').getValue()) {
                        $$('dp-maxnum-covered').enable();
                    } else {
                        $$('dp-maxnum-covered').disable();
                    }
                }
            };
            $$('dp-chk-customize').onChange(handleCheckboxChange);
            $$('dp-chk-covers-children').onChange(() => handleCheckboxChange('children'));
            $$('dp-chk-covers-employee-spouse').onChange(() => handleCheckboxChange('spouse'));
            $$('dp-chk-covers-nonemployee-spouse').onChange(() => handleCheckboxChange('spouse'));
            $$('dp-chk-covers-employee-spouse-or-children').onChange(() => handleCheckboxChange('spouseOrchildren'));
            $$('dp-chk-covers-nonemployee-spouse-or-children').onChange(() => handleCheckboxChange('spouseOrchildren'));

            handleCheckboxChange();

            const handleRadioChange = () => {
                if ( !$$('dp-coverage-radio').getValue() )
                    return;

                if ( $$('dp-coverage-radio').getValue() !== 'F' ) {
                    $$('dp-chk-customize').clear();
                    checkboxes.map( chkItem => $$(chkItem).clear() );
                }

                const radioStatus = {
                    'A': [ 'dp-chk-covers-employee' ],
                    'B': [ 'dp-chk-covers-employee', 'dp-chk-covers-employee-spouse', 'dp-chk-covers-nonemployee-spouse' ],
                    'C': [ 'dp-chk-covers-employee', 'dp-chk-covers-employee-spouse-or-children', 'dp-chk-covers-nonemployee-spouse-or-children' ],
                    'D': [ 'dp-chk-covers-employee', 'dp-chk-covers-children' ],
                    'E': [ 'dp-chk-covers-employee', 'dp-chk-covers-employee-spouse-or-children', 'dp-chk-covers-nonemployee-spouse-or-children' ],
                    'F': [ 'dp-chk-customize' ]
                };
                
                radioStatus[ $$('dp-coverage-radio').getValue() ].map( chkItem => {
                    $$(chkItem).setValue(true);
                });

                handleCheckboxChange();
            };

            $$('dp-coverage-radio').onChange(handleRadioChange);
            handleRadioChange();

            $$('dp-monthly-cost-add').onclick(async () => {
                const data = await monthlyCostPopup($$('dp-coverage-type').getValue());
                if (data) {
                    costData.push({ ...data, uuid: Utils.uuid() });
                    updateCostGrid();
                }
            });
            $$('dp-monthly-cost-edit').onclick(async () => {
                let row = costDataGrid.getSelectedNodes()[0].data;
                const data = await monthlyCostPopup($$('dp-coverage-type').getValue(), row);
                if (data) {
                    for (let i = 0; i < costData.length; i ++) {
                        if (costData[i].uuid != row.uuid) {
                            continue;
                        }
                        costData[i] = {
                            ...data,
                            uuid: row.uuid
                        }
                    }
                    updateCostGrid();
                }
            });
            $$('dp-monthly-cost-delete').onclick(() => {
                Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Monthly Cost Configuration?', () => {
                    let row = costDataGrid.getSelectedNodes()[0].data;
                    let tmp = [];
                    for (let i = 0; i < costData.length; i ++) {
                        if (costData[i].uuid === row.uuid)
                            continue;
                        tmp.push(costData[i]);
                    }
                    costData = tmp;
                    updateCostGrid();
                });
            });

            let ok = () => {
                if ($$('dp-coverage-type').isError('Coverage Type')) {
                    container.selectTab('dp-overview-TabButton');
                    return;
                }
                
                let validate = false;
                for ( let chk of checkboxes ) {
                    validate |= $$(chk).getValue();
                }
                if (!validate) {
                    Utils.showMessage('Validation Error!', 'At least one of the Covers checkboxes must be selected.');
                    container.selectTab('dp-coverage-TabButton');
                    return;
                }

                const data = {
                    benefitId: benefitId,
                    name: $$('dp-coverage-type').getValue(),
                    activeDate: $$('dp-active-date').getIntValue(),
                    inactiveDate: $$('dp-inactive-date').getIntValue(),
                    additionalInfo: $$('dp-additional-information').getValue(),
                    autoAssign: $$('dp-chk-auto-assign').getValue(),
                    coversChildren: $$('dp-chk-covers-children').getValue(),
                    coversEmployee: $$('dp-chk-covers-employee').getValue(),
                    coversEmployeeSpouse: $$('dp-chk-covers-employee-spouse').getValue(),
                    coversEmployeeSpouseOrChildren: $$('dp-chk-covers-employee-spouse-or-children').getValue(),
                    coversNonEmployeeSpouse: $$('dp-chk-covers-nonemployee-spouse').getValue(),
                    coversNonEmployeeSpouseOrChildren: $$('dp-chk-covers-nonemployee-spouse-or-children').getValue(),
                    includeInBilling: $$('dp-chk-include-in-consolidated-billing').getValue(),
                    maxDependents: $$('dp-maxnum-covered').getValue(),
                    spouseDeclinesExternalCoverage: $$('dp-chk-spouse-declines-outside-coverage').getValue(),
                    configCostArray: costData
                };

                Utils.popup_close();
                resolve(data);
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);

        });
    };

    $$('add').onclick(async () => {
        const data = await detailPopup(benefitId);
        if (data) {
            AWS.callSoap(WS, "newConfig", { ... data }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    async function edit() {
        const row = grid.getSelectedRow();
        const data = await detailPopup(benefitId, row.configId);
        if (data) {
            AWS.callSoap(WS, "saveConfig", { ... data, configId: row.configId }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Benefit Coverage Configuration?', () => {
            const data = {
                ids: [grid.getSelectedRow().configId]
            };
            
            AWS.callSoap(WS, "deleteConfigs", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('moveup').onclick(() => {
        let configId = grid.getSelectedRow().configId;
        AWS.callSoap(WS, "moveConfig", { id: grid.getSelectedRow().configId, moveUp: true}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(configId), 100);
            }
        });
    });

    $$('movedown').onclick(() => {
        let configId = grid.getSelectedRow().configId;
        AWS.callSoap(WS, "moveConfig", { id: grid.getSelectedRow().configId, moveUp: false}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(configId), 100);
            }
        });
    });
})();
