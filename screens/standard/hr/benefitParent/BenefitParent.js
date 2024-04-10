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

    const WS = 'StandardHrBenefitParent';
    const lowCap = 5;
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    res = await AWS.callSoap(WS, "listBenefitCategories");
    if (res.wsStatus === '0') {
        $$('category-list').clear().addItems(res.item, 'categoryId', 'description');
    } else
        return;

    const columnDefs = [
        {headerName: 'Benefit', field: 'name', width: 40  },
        {headerName: 'Category', field: 'categoryName', width: 14  },
        {headerName: 'Vendor', field: 'vendor', width: 5  },
        {headerName: 'Active', field: 'active', width: 5  },
        {headerName: 'In Open Enrollment', field: 'includeInOpenEnrollment', width: 13  },
        {headerName: 'In Onboarding', field: 'includeOnboarding', width: 13  }
    ];
    const grid = new AGGrid('grid', columnDefs, 'benefitId');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('moveup').disable();
        $$('movedown').disable();
        $$('edit').disable();
        $$('clone').disable();
        $$('delete').disable();
        $$('report').enable();

        const data = {
            categoryId: $$('category-list').getValue()
        };
        
        AWS.callSoap(WS, "listBenefits", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Employee Benefit');
            }
        });
    }

    $$('category-list').onChange(updateGrid);

    grid.setOnSelectionChanged((rows) => {
        if (rows.length && $$('category-list').getValue()) {
            $$('moveup').enable();
            $$('movedown').enable();
        } else {
            $$('moveup').disable();
            $$('movedown').disable();
        }
        $$('edit').enable(rows);
        $$('clone').enable(rows);
        $$('delete').enable(rows);
    });
    grid.setOnRowDoubleClicked(edit);

    updateGrid();

    const container = new TabContainer('dp-tab-container');
    let availableClassGrid, selectedClassGrid;
    let replacedGrid, notReplacedGrid;

    availableClassGrid = new AGGrid('dp-grid-available-benefit-classes', [{headerName: 'Available Benefit Classes', field: 'name'}], 'id');
    availableClassGrid.show(); 

    selectedClassGrid = new AGGrid('dp-grid-selected-benefit-classes', [{headerName: 'Selected Benefit Classes', field: 'name'}], 'id');
    selectedClassGrid.show();

    notReplacedGrid = new AGGrid('dp-grid-notreplaced', [{headerName: 'Benefit', field: 'benefitName'}], 'id');
    notReplacedGrid.show();
    replacedGrid = new AGGrid('dp-grid-replaced', [{headerName: 'Benefit', field: 'benefitName'},{headerName: 'Replacing Date', field: 'date'}], 'id');
    replacedGrid.show();

    function reset() {
        $$('dp-name').clear();
        $$('dp-category').setValue('');
        $$('dp-active').clear(); $$('dp-inactive').clear();
        $$('dp-description').clear();
        $$('dp-vendor-smart-chooser').clear();
        $$('dp-policy-or-group').clear()
        $$('dp-sub-group-id').clear();
        $$('dp-plan').clear(); $$('dp-plan-name').clear();
        $$('dp-payer-id').clear();
        $$('dp-additional-information').clear();
        $$('dp-group-account-id').clear();

        $$('dp-wage-type').clear();
        $$('dp-insurance-code').clear();
        $$('dp-service-smart-chooser').clear();
        $$('dp-rule-name').clear();
        $$('dp-chk-pre-tax').setValue(true);
        $$('dp-chk-has-beneficiaries').clear();
        $$('dp-chk-employee-specific-cost').clear();
        $$('dp-chk-time-related').clear();
        $$('dp-chk-has-physicians').clear();
        $$('dp-chk-covered-under-COBRA').clear();
        $$('dp-chk-contingent-beneficiaries').clear();
        $$('dp-chk-employee-chooses-amount').clear();
        $$('dp-chk-requires-decline').clear();
        $$('dp-chk-auto-assign').clear();

        $$('dp-eligibility-type').setValue('1');
        $$('dp-lossofdependent-status').setValue('18');
        $$('dp-lossofdependent-status-unless').setValue('25');
        $$('dp-lastdate-of-coverage').clear();

        $$('dp-include-in-openenrollment').clear();
        $$('dp-include-in-onboarding').clear();
        $$('dp-avatar-path').clear();
        $$('dp-avatar-location').clear();
        $$('dp-screen-enrollment').clear();
        $$('dp-screen-onboarding').clear();
        $$('dp-instructions').clear();
    }

    const moveBenefitClass = async (direction) => {
        let available = [];
        let selected = [];

        availableClassGrid.getDataItems().map((col) => {
            if (direction === 'right' && col.id !== availableClassGrid.getSelectedRow().id) {
                available.push(col);                
            } else if (direction === 'left') {
                available.push(col);
            }
        });
        selectedClassGrid.getDataItems().map((col) => {
            if (direction === 'left' && col.id !== selectedClassGrid.getSelectedRow().id) {
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

    const moveReplaceBenefits = async (direction) => {
        let replaced = [];
        let unreplaced = [];

        notReplacedGrid.getDataItems().map((col) => {
            if (direction === 'right' && col.id !== notReplacedGrid.getSelectedRow().id) {
                replaced.push(col);                
            } else if (direction === 'left') {
                replaced.push(col);
            }
        });
        replacedGrid.getDataItems().map((col) => {
            if (direction === 'left' && col.id !== replacedGrid.getSelectedRow().id) {
                unreplaced.push(col);                
            } else if (direction === 'right') {
                unreplaced.push(col);
            }
        });

        if (direction === 'right') {
            replaced.push( notReplacedGrid.getSelectedRow() );
        } else if (direction === 'left') {
            unreplaced.push( replacedGrid.getSelectedRow() );
        }

        replacedGrid.clear(); replacedGrid.addRecords(replaced);
        notReplacedGrid.clear(); notReplacedGrid.addRecords(unreplaced);

        $$('dp-replace-left').disable();
        $$('dp-replace-right').disable();
    };

    const init_details = async () => {
        let res;
        res = await AWS.callSoap(WS, "listBenefitCategories");
        if (res.wsStatus === '0') {
            $$('dp-category').clear().addItems(res.item, 'categoryId', 'description');
        }

        res = await AWS.callSoap(WS, "listRules");
        if (res.wsStatus === '0') {
            $$('dp-rule-name').clear().addItems(res.item, 'id', 'name');
        }

        res = await AWS.callSoap(WS, "listWageTypes");
        if (res.wsStatus === '0') {
            $$('dp-wage-type').clear().addItems(res.item, 'id', 'description');
        }

        res = await AWS.callSoap(WS, "searchVendors"); listVendors(res);
        res = await AWS.callSoap(WS, "searchServices"); listServices(res);

        if (availableClassGrid)
            availableClassGrid.clear();
        availableClassGrid.setOnSelectionChanged((rows) => {
            $$('dp-select-left').enable(rows);
            $$('dp-select-right').disable(rows);
        });
        availableClassGrid.sizeColumnsToFit();

        AWS.callSoap(WS, "listBenefitClasses").then( function (res) {
            if (res.wsStatus === '0') {
                availableClassGrid.clear();
                res.item = Utils.assureArray(res.item);
                availableClassGrid.addRecords(res.item);
            }
        });

        if (selectedClassGrid)
            selectedClassGrid.clear();
        selectedClassGrid.setOnSelectionChanged((rows) => {
            $$('dp-select-left').disable(rows);
            $$('dp-select-right').enable(rows);
        });
        selectedClassGrid.sizeColumnsToFit();

        availableClassGrid.setOnRowDoubleClicked(() => { moveBenefitClass('right'); });
        selectedClassGrid.setOnRowDoubleClicked(() => { moveBenefitClass('left'); });

        $$('dp-service-smart-chooser').setSelectFunction(searchServicies);
        $$('dp-vendor-smart-chooser').setSelectFunction(searchVendors);
        
        $$('dp-eligibility-type').onChange(handleEligibilityType);
        $$('dp-lastdate-of-coverage').onChange((value) => {
            if (value !== '3') {
                $$('dp-qualifyingevent-plus-days').disable();
            } else {
                $$('dp-qualifyingevent-plus-days').enable();                
            }
            $$('dp-qualifyingevent-plus-days').setValue( value === '3' ? '0':'' );
        });


        if (notReplacedGrid)
            notReplacedGrid.clear();
        notReplacedGrid.setOnSelectionChanged((rows) => {
            $$('dp-replace-left').enable(rows);
            $$('dp-replace-right').disable(rows);
        });
        notReplacedGrid.sizeColumnsToFit();

        if (replacedGrid)
            replacedGrid.clear();
        replacedGrid.setOnSelectionChanged((rows) => {
            $$('dp-replace-left').disable(rows);
            $$('dp-replace-right').enable(rows);
        });
        replacedGrid.sizeColumnsToFit();

        notReplacedGrid.setOnRowDoubleClicked(() => { moveReplaceBenefits('right'); });
        replacedGrid.setOnRowDoubleClicked(() => { moveReplaceBenefits('left'); });
    };

    const listVendors = (res) => {
        $$('dp-vendor-smart-chooser').clear();

        if (res.item.length === 0) {
            $$('dp-vendor-smart-chooser').add('', '(nothing to select)').disable();
        } else if (res.item.length === 1) {
            $$('dp-vendor-smart-chooser').add(res.item[0].id, res.item[0].name).disable();
        } else if (res.item.length <= lowCap) {
            $$('dp-vendor-smart-chooser').add('', '(choose)');
            $$('dp-vendor-smart-chooser').addItems(res.item, 'id', 'name');
            $$('dp-vendor-smart-chooser').enable();
        } else {
            $$('dp-vendor-smart-chooser').forceSelect();
        }
    };
    const searchVendors = async () => {
        let selectedNode = await vendorSelection();
        if (selectedNode && selectedNode.data) {
            $$('dp-vendor-smart-chooser').setValue(selectedNode.data.id, selectedNode.data.name);
        }
    };
    const listServices = (res) => {
        $$('dp-service-smart-chooser').clear();

        if (res.item.length === 0) {
            $$('dp-service-smart-chooser').add('', '(nothing to select)').disable();
        } else if (res.item.length === 1) {
            $$('dp-service-smart-chooser').add(res.item[0].serviceId, res.item[0].description).disable();
        } else if (res.item.length <= lowCap) {
            $$('dp-service-smart-chooser').add('', '(choose)');
            $$('dp-service-smart-chooser').addItems(res.item, 'serviceId', 'description');
            $$('dp-service-smart-chooser').enable();
        } else {
            $$('dp-service-smart-chooser').forceSelect();
        }
    };
    const searchServicies = async () => {
        let selectedNode = await serviceSelection();
        if (selectedNode && selectedNode.data) {
            $$('dp-service-smart-chooser').setValue(selectedNode.data.id, selectedNode.data.description);
        }
    };

    const handleEligibilityType = (value) => {
        const ctls = $('.eligibility-days');
        ctls.attr('disabled', 'disabled');
        ctls.map( (idx, tag) => {
            if (Number.parseInt($(tag).val()) > 0)
                return;
            $(tag).val("");
        })
        $(ctls[value-2]).removeAttr('disabled');
        if ($(ctls[value-2]).val() === "")
            $(ctls[value-2]).val("0");
        $(ctls[value-2]).focus();
    };

    /////////////////////////////////////////////////////////////////////////////////
    // vendor search popup
    /////////////////////////////////////////////////////////////////////////////////
    const vendorSelection = async () => {

        Utils.popup_open('vendor-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            let changeCount = count => {
                Utils.setText('vsp-count', `Displaying ${count} Vendor`);
            };
        
            let reset = () => {
                $$('vsp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('vsp-name').clear();
        
                formSearchGrid.clear();
                changeCount(0);
            };
        
            let ok = () => {
                let vendor = formSearchGrid.getSelectedRow();
        
                if (!vendor)
                    vendor = null;                
        
                reset();
                resolve(vendor);
                Utils.popup_close();
            };
        
            let cancel = () => {
                reset();
                resolve(null);
                Utils.popup_close();
            };           
        
            // Setup drop downs.
            bindToEnum('vsp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Vendor Name', field: 'name'}
                ];
        
                formSearchGrid = new AGGrid('vsp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
        
            if (!formSearchGrid)
                initDataGrid();
        
            reset();
        
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
        
            formSearchGrid.setOnSelectionChanged($$('vsp-ok').enable);
        
            formSearchGrid.setOnRowDoubleClicked(ok);
        
            $$('vsp-reset').onclick(reset);
        
            $$('vsp-search').onclick(async () => {
                let inParams = {
                    name: $$('vsp-name').getValue(),
                    nameSearchType: $$('vsp-name-type').getValue(),
                };
        
                let data = await AWS.callSoap(WS, 'searchVendors', inParams);
        
                // Clear the grid.
                formSearchGrid.clear();
        
                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);
        
                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });
        
            $$('vsp-ok').onclick(ok);
        
            $$('vsp-cancel').onclick(cancel);
        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // service item search popup
    /////////////////////////////////////////////////////////////////////////////////
    const serviceSelection = async () => {

        Utils.popup_open('service-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            let changeCount = count => {
                Utils.setText('ssp-count', `Displaying ${count} Service Items`);
            };
        
            let reset = () => {
                $$('ssp-id-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ssp-id').clear();
                $$('ssp-desc-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ssp-desc').clear();
        
                formSearchGrid.clear();
                changeCount(0);
            };
        
            let ok = () => {
                let vendor = formSearchGrid.getSelectedRow();
        
                if (!vendor)
                    vendor = null;                
        
                reset();
                resolve(vendor);
                Utils.popup_close();
            };
        
            let cancel = () => {
                reset();
                resolve(null);
                Utils.popup_close();
            };           
        
            // Setup drop downs.
            bindToEnum('ssp-id-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('ssp-desc-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'ID', field: 'accsysId'},
                    {headerName: 'Description', field: 'description'},
                    {headerName: 'Expense Account', field: 'glExpenseAccountNumber'}
                ];
        
                formSearchGrid = new AGGrid('ssp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
        
            if (!formSearchGrid)
                initDataGrid();
        
            reset();
        
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
        
            formSearchGrid.setOnSelectionChanged($$('ssp-ok').enable);
        
            formSearchGrid.setOnRowDoubleClicked(ok);
        
            $$('ssp-reset').onclick(reset);
        
            $$('ssp-search').onclick(async () => {
                let inParams = {
                    accountingSystemId: $$('ssp-id').getValue(),
                    accountingSystemIdSearchType: $$('ssp-id-type').getValue(),
                    description: $$('ssp-desc').getValue(),
                    descriptionSearchType: $$('ssp-desc-type').getValue()
                };
        
                let data = await AWS.callSoap(WS, 'searchServices', inParams);
        
                // Clear the grid.
                formSearchGrid.clear();
        
                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);
        
                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            });
        
            $$('ssp-ok').onclick(ok);
        
            $$('ssp-cancel').onclick(cancel);
        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // screen search popup
    /////////////////////////////////////////////////////////////////////////////////
    const screenSelection = async () => {

        Utils.popup_open('screen-selection');

        return new Promise(function (resolve, reject) {

            let screenSearchGrid = null;

            let changeCount = count => {
                Utils.setText('scrCount', `Displaying ${count} Screens`);
            };

            let reset = () => {
                $$('psp-id').clear();
                $$('psp-name').clear();
                $$('psp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);

                screenSearchGrid.clear();
                changeCount(0);
            };

            let ok = () => {
                let screen = screenSearchGrid.getSelectedRow();

                if (!screen)
                    screen = null;

                Utils.popup_close();
                resolve(screen);
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };            

            // Setup drop downs.
            bindToEnum('psp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Parent Screen', field: 'name', width: 30},
                    {headerName: 'Name', field: 'fileName', width: 50},
                    {headerName: 'ID', field: 'extId', width: 10},
                ];

                screenSearchGrid = new AGGrid('screenGrid', columnDefs, 'id');
                screenSearchGrid.show();
            };

            if (!screenSearchGrid)
                initDataGrid();

            reset();

            // Fit the columns to the grid.
            screenSearchGrid.sizeColumnsToFit();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            screenSearchGrid.setOnSelectionChanged($$('screen-ok').enable);

            screenSearchGrid.setOnRowDoubleClicked(ok);

            $$('screenReset').onclick(() => {
                $$('psp-id').clear();
                $$('psp-name').clear();
                $$('psp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            });

            $$('screenSearch').onclick(async () => {
                let inParams = {
                    screenOrGroupId: $$('psp-id').getValue(),
                    name: $$('psp-name').getValue(),
                    nameSearchType: $$('psp-name-type').getValue()
                };

                let data = await AWS.callSoap(WS, 'searchScreens', inParams);

                // Clear the grid.
                screenSearchGrid.clear();

                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    screenSearchGrid.addRecords(records);

                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);

                    $$('screen-ok').enable();
                } else {
                    changeCount(0);
                    $$('screen-ok').disable();
                }
            });

            $$('screen-ok').onclick(ok);

            $$('screen-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // clone benefit popup
    /////////////////////////////////////////////////////////////////////////////////
    const newBenefitName = async (name) => {

        Utils.popup_open('clone-benefit');

        return new Promise(function (resolve, reject) {

            $$('cbp-name').setValue(name);
            $$('cbp-ok').disable();

            $('#cbp-name').on('input', (v) => {                
                if (v.target.value !== name) {
                    $$('cbp-ok').enable();
                } else {
                    $$('cbp-ok').disable();
                }
            });
            
            let ok = () => {
                if ($$('cbp-name').isError('Name'))
                    return;
                
                Utils.popup_close();
                resolve($$('cbp-name').getValue());
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            $$('cbp-ok').onclick(ok);
            $$('cbp-cancel').onclick(cancel);

        });
    };

    $$('add').onclick(() => {
        let screen_enrollment = null;
        let screen_onboarding = null;

        $$('dp-title').setValue('New Benefit');
        container.selectTab('dp-general-TabButton');
        
        reset();
        init_details();

        Utils.popup_open('detail-popup');

        $$('dp-select-left').onclick(() => { moveBenefitClass('right'); });
        $$('dp-select-right').onclick(() => { moveBenefitClass('left'); });

        $$('dp-replace-left').onclick(() => { moveReplaceBenefits('right'); });
        $$('dp-replace-right').onclick(() => { moveReplaceBenefits('left'); });

        $$('dp-category').onChange((v) => {
            if (v !== "") {
                $('#dp-category-err').hide();
            } else {
                $('#dp-category-err').show();
            }
            AWS.callSoap(WS, "listReplacingBenefits", {categoryId: v}).then( function (res) {
                if (res.wsStatus === '0') {
                    replacedGrid.clear();
                    notReplacedGrid.clear();
                    replacedGrid.addRecords(Utils.assureArray(res.replacingBenefits));
                    notReplacedGrid.addRecords(Utils.assureArray(res.notReplacingBenefits  ));
                }
            });
        })

        $$('dp-choose-enrollment').onclick(async () => {
            let selectedNode = await screenSelection();            
            if (selectedNode && selectedNode.data) {
                $$('dp-screen-enrollment').setValue(selectedNode.data.name);
                screen_enrollment = selectedNode.data.screenId;
            }
        });

        $$('dp-clear-enrollment').onclick(() => {
            screen_enrollment = null;
            $$('dp-screen-enrollment').clear();
        });

        $$('dp-choose-onboarding').onclick(async () => {
            let selectedNode = await screenSelection();            
            if (selectedNode && selectedNode.data) {
                $$('dp-screen-onboarding').setValue(selectedNode.data.name);
                screen_onboarding = selectedNode.data.screenId;
            }
        });

        $$('dp-clear-onboarding').onclick(() => {
            screen_onboarding = null;
            $$('dp-screen-onboarding').clear();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name')) {
                container.selectTab('dp-general-TabButton');
                return;
            }
            if ($$('dp-category').isError('Category')) {            
                container.selectTab('dp-general-TabButton');
                return;
            }
            if ($$('dp-wage-type').isError('Wage Type field')) {
                container.selectTab('dp-detail-TabButton');
                return;
            }
            if ($$('dp-lastdate-of-coverage').isError('Last date of QE field')) {
                container.selectTab('dp-eligibility-TabButton');
                return;
            }

            const eligibilityPeriodField = [ '', '', 'dp-firstmonth-after-days', 'dp-firstmonth-after-months', 'dp-after-days', 'dp-after-months' ];
            const coverageEndPeriodField = [ '', '', '', 'dp-qualifyingevent-plus-days' ];
            
            const data = {
                instructions: $$('dp-instructions').getValue(),
                timeRelated: $$('dp-chk-time-related').getValue(),
                onboardingScreenId: screen_onboarding,
                screenId: screen_enrollment,
                includeOnboarding: $$('dp-include-in-onboarding').getValue(),
                includeInOpenEnrollment: $$('dp-include-in-openenrollment').getValue(),
                avatarPath: $$('dp-avatar-path').getValue(),
                avatarLocation: $$('dp-avatar-location').getValue(),
                processType: 'N',
                activeDate: $$('dp-active').getIntValue(),
                inactiveDate: $$('dp-inactive').getIntValue(),
                additionalInfo: $$('dp-additional-information').getValue(),
                categoryId: $$('dp-category').getValue(),
                coveredUnderCOBRA: $$('dp-chk-covered-under-COBRA').getValue(),
                description: $$('dp-description').getValue(),
                employeeChoosesAmount: $$('dp-chk-employee-chooses-amount').getValue(),
                employeeSpecificCost: $$('dp-chk-employee-specific-cost').getValue(),
                hasBeneficiaries: $$('dp-chk-has-beneficiaries').getValue(),
                hasPhysicians: $$('dp-chk-has-physicians').getValue(),
                contingentBeneficiaries: $$('dp-chk-contingent-beneficiaries').getValue(),
                insuranceCode: $$('dp-insurance-code').getValue(),
                name: $$('dp-name').getValue(),
                payerId: $$('dp-payer-id').getValue(),
                plan: $$('dp-plan').getValue(),
                planName: $$('dp-plan-name').getValue(),
                wageTypeId: $$('dp-wage-type').getValue(),
                policyOrGroup: $$('dp-policy-or-group').getValue(),
                preTax: $$('dp-chk-pre-tax').getValue(),
                serviceId: $$('dp-service-smart-chooser').getValue(),
                requiresDecline: $$('dp-chk-requires-decline').getValue(),
                subGroupId: $$('dp-sub-group-id').getValue(),
                vendorId: $$('dp-vendor-smart-chooser').getValue(),
                eligibilityType: $$('dp-eligibility-type').getValue(),
                eligibilityPeriod: eligibilityPeriodField[$$('dp-eligibility-type').getValue()] !== '' ? $$(eligibilityPeriodField[$$('dp-eligibility-type').getValue()]).getValue() : 0,
                dependentMaxAge: $$('dp-lossofdependent-status').getValue(),
                dependentMaxAgeStudent: $$('dp-lossofdependent-status-unless').getValue(),
                coverageEndType: $$('dp-lastdate-of-coverage').getValue(),
                coverageEndPeriod: coverageEndPeriodField[$$('dp-lastdate-of-coverage').getValue()] !== '' ? $$(coverageEndPeriodField[$$('dp-lastdate-of-coverage').getValue()]).getValue() : 0,
                ruleName: $$('dp-rule-name').getValue(),
                groupAccountId: $$('dp-group-account-id').getValue(),
                autoAssign: $$('dp-chk-auto-assign').getValue(),
                benefitClassIds: selectedClassGrid.getDataItems().map(col => { return col.id }),
                replacingBenefitIds: replacedGrid.getDataItems().map(item => { return item.benefitId })
            };

            AWS.callSoap(WS, "newBenefit", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        Utils.saveData(CURRENT_BENEFIT_ID, grid.getSelectedRow().benefitId);
        Framework.getChild();
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Employee Benefit?', () => {
            const data = {
                ids: [grid.getSelectedRow().benefitId]
            };
            
            AWS.callSoap(WS, "deleteBenefits", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('clone').onclick(async () => {
        let row = grid.getSelectedRow();
        let name = await newBenefitName(row.name);
        if (name) {
            AWS.callSoap(WS, "copyBenefit", {benefitId: row.benefitId, newName: name}).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    $$('moveup').onclick(() => {
        let benefitId = grid.getSelectedRow().benefitId;
        AWS.callSoap(WS, "moveBenefit", { id: grid.getSelectedRow().benefitId, moveUp: true}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(benefitId), 100);
            }
        });
    });

    $$('movedown').onclick(() => {
        let benefitId = grid.getSelectedRow().benefitId;
        AWS.callSoap(WS, "moveBenefit", { id: grid.getSelectedRow().benefitId, moveUp: false}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(benefitId), 100);
            }
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getBenefitReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();