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

    const WS = 'StandardHrBenefit';
    const lowCap = 5;
    const benefitId = Utils.getData(CURRENT_BENEFIT_ID);
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const container = new TabContainer('dp-tab-container');
    let benefitName = '';
    let availableClassGrid = null, selectedClassGrid = null;
    let replacedGrid = null, notReplacedGrid = null;
    let screen_enrollment = null, screen_onBoarding = null;
    let riderGrid = null;

    availableClassGrid = new AGGrid('dp-grid-available-benefit-classes', [{headerName: 'Available Benefit Classes', field: 'name'}], 'id');
    availableClassGrid.show();
    selectedClassGrid = new AGGrid('dp-grid-selected-benefit-classes', [{headerName: 'Selected Benefit Classes', field: 'name'}], 'id');
    selectedClassGrid.show();

    notReplacedGrid = new AGGrid('dp-grid-notReplaced', [{headerName: 'Benefit', field: 'benefitName'}], 'id');
    notReplacedGrid.show();
    replacedGrid = new AGGrid('dp-grid-replaced', [{headerName: 'Benefit', field: 'benefitName'},{headerName: 'Replacing Date', field: 'date'}], 'id');
    replacedGrid.show();


    riderGrid = new AGGrid('dp-riders-grid', [
        {headerName: 'Rider Benefit', field: 'riderName'},
        {headerName: 'Required', field: 'required1'},
        {headerName: 'Hidden', field: 'hidden1'},
    ], 'benefitRiderId');
    riderGrid.show();

    Framework.askBeforeLeaving = true;  //  make sure changes are not lost when changing screens
    Utils.setSomeControlValueChangeFunction(function (status) {
        if (status) {
            $$('dp-save').enable();
            $$('dp-reset').enable();
            $$('dp-benefit-name').setColor('red').setValue(`${benefitName} (data changed)`);
        } else {
            $$('dp-save').disable();
            $$('dp-reset').disable();
            $$('dp-benefit-name').setColor('black').setValue(benefitName);
        }
    });

    async function reset() {
        const res = await AWS.callSoap(WS, "loadBenefit", {benefitId: benefitId});

        benefitName = res.name;
        $$('dp-benefit-name').setValue(res.name);
        $$('dp-name').setValue(res.name);
        $$('dp-category').setValue(res.categoryId);
        $$('dp-active').setValue(res.activeDate); $$('dp-inactive').setValue(res.inactiveDate);
        $$('dp-description').setValue(res.description);
        $$('dp-policy-or-group').setValue(res.policyOrGroup);
        $$('dp-sub-group-id').setValue(res.subGroupId);
        $$('dp-plan').setValue(res.plan); $$('dp-plan-name').setValue(res.planName);
        $$('dp-payer-id').setValue(res.payerId);
        $$('dp-additional-information').setValue(res.additionalInfo);
        $$('dp-group-account-id').setValue(res.groupAccountId);
        $$('dp-internal-id').setValue(res.internalId);

        $$('dp-wage-type').setValue(res.wageTypeId);
        $$('dp-insurance-code').setValue(res.insuranceCode);
        $$('dp-rule-name').setValue(res.ruleName);
        $$('dp-chk-has-beneficiaries').setValue(res.hasBeneficiaries);
        $$('dp-chk-time-related').setValue(res.timeRelated);
        $$('dp-chk-has-physicians').setValue(res.hasPhysicians);
        $$('dp-chk-covered-under-COBRA').setValue(res.coveredUnderCOBRA);
        $$('dp-chk-contingent-beneficiaries').setValue(res.contingentBeneficiaries);
        $$('dp-chk-requires-decline').setValue(res.requiresDecline);
        $$('dp-chk-auto-assign').setValue(res.autoAssign);
        $$('dp-cost-calc-type').setValue(res.costCalcType);
        $$('dp-employer-cost-model').setValue(res.employerCostModel);
        $$('dp-employee-cost-model').setValue(res.employeeCostModel);
        $$('dp-benefit-amount-model').setValue(res.benefitAmountModel);

        $$('dp-eligibility-type').setValue(res.eligibilityType);
        $$('dp-lossOfDependent-status').setValue(res.dependentMaxAge);
        $$('dp-lossOfDependent-status-unless').setValue(res.dependentMaxAgeStudent);
        $$('dp-lastDate-of-coverage').setValue(res.coverageEndType);
        $$('dp-min-age').setValue(res.minAge);
        $$('dp-max-age').setValue(res.maxAge);
        $$('dp-min-pay').setValue(res.minPay);
        $$('dp-max-pay').setValue(res.maxPay);
        $$('dp-minHours-per-week').setValue(res.minHoursPerWeek);

        const eligibilityPeriodField = [ '', '', 'dp-firstMonth-after-days', 'dp-firstMonth-after-months', 'dp-after-days', 'dp-after-months' ];
        const coverageEndPeriodField = [ '', '', '', 'dp-qualifyingEvent-plus-days' ];

        if (eligibilityPeriodField[res.eligibilityType] !== '') {
            $$(eligibilityPeriodField[res.eligibilityType]).setValue(res.eligibilityPeriod);
            $$(eligibilityPeriodField[res.eligibilityType]).enable();
        }
        if (coverageEndPeriodField[res.coverageEndType] !== '') {
            $$(coverageEndPeriodField[res.coverageEndType]).setValue(res.coverageEndPeriod);
            $$(coverageEndPeriodField[res.coverageEndType]).enable();
        }

        $$('dp-include-in-openEnrollment').setValue(res.includeInOpenEnrollment);
        $$('dp-include-in-onBoarding').setValue(res.includeOnBoarding);
        $$('dp-avatar-path').setValue(res.avatarPath);
        $$('dp-avatar-location').setValue(res.avatarLocation);
        $$('dp-screen-enrollment').setValue(res.screenName);
        $$('dp-screen-onBoarding').setValue(res.onBoardingScreenName);
        $$('dp-instructions').clear();

        AWS.callSoap(WS, "searchVendors", {id: res.vendorId}).then( res => {
            listVendors(res);
        });
        AWS.callSoap(WS, "searchServices", {id: res.serviceId}).then( res => {
            listServices(res);
        });
        AWS.callSoap(WS, "searchBenefits", {benefitId: benefitId, categoryId: $$('dp-category').getValue()}).then( res => {
            listBenefits(res);
        });
        updateRiderGrid();
    }

    const updateRiderGrid = () => {
        AWS.callSoap(WS, "listBenefitRiders", {benefitId: benefitId}).then( res => {
            if (res.wsStatus === "0") {
                riderGrid.clear();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    row.required1 = row.required ?  'Yes' : 'No';
                    row.hidden1 = row.hidden ?  'Yes' : 'No';
                }
                riderGrid.addRecords(res.item);
            }
        });
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

        Utils.someControlValueChanged();
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

        Utils.someControlValueChanged();
    };

    const init_details = async () => {
        let res;
        res = await AWS.callSoap(WS, "listBenefitCategories");
        fillDropDownFromService('dp-category', res, 'categoryId', 'description');

        res = await AWS.callSoap(WS, "listRules");
        if (res.wsStatus === '0') {
            $$('dp-rule-name').clear().addItems(res.item, 'id', 'name');
        }

        res = await AWS.callSoap(WS, "listWageTypes");
        if (res.wsStatus === '0') {
            $$('dp-wage-type').clear().addItems(res.item, 'id', 'description');
        }

        availableClassGrid.setOnSelectionChanged((rows) => {
            $$('dp-select-left').enable(rows);
            $$('dp-select-right').disable(rows);
        });

        selectedClassGrid.setOnSelectionChanged((rows) => {
            $$('dp-select-left').disable(rows);
            $$('dp-select-right').enable(rows);
        });

        AWS.callSoap(WS, "listBenefitClasses", {benefitId: benefitId}).then( function (res) {
            if (res.wsStatus === '0') {
                availableClassGrid.clear();
                selectedClassGrid.clear();
                availableClassGrid.addRecords(Utils.assureArray(res.availableClasses));
                selectedClassGrid.addRecords(Utils.assureArray(res.selectedClasses));
            }
        });

        availableClassGrid.setOnRowDoubleClicked(() => { moveBenefitClass('right'); });
        selectedClassGrid.setOnRowDoubleClicked(() => { moveBenefitClass('left'); });

        $$('dp-service-smart-chooser').setSelectFunction(searchServices);
        $$('dp-vendor-smart-chooser').setSelectFunction(searchVendors);
        $$('dp-replaced-benefit-smart-chooser').setSelectFunction(searchBenefits);
        
        $$('dp-eligibility-type').onChange(handleEligibilityType);
        $$('dp-lastDate-of-coverage').onChange((value) => {
            if (value !== '3') {
                $$('dp-qualifyingeEvent-plus-days').disable();
            } else {
                $$('dp-qualifyingEvent-plus-days').enable();
            }
            $$('dp-qualifyingEvent-plus-days').setValue( value === '3' ? '0':'' );
        });

        notReplacedGrid.setOnSelectionChanged((rows) => {
            $$('dp-replace-left').enable(rows);
            $$('dp-replace-right').disable(rows);
        });

        replacedGrid.setOnSelectionChanged((rows) => {
            $$('dp-replace-left').disable(rows);
            $$('dp-replace-right').enable(rows);
        });

        notReplacedGrid.setOnRowDoubleClicked(() => { moveReplaceBenefits('right'); });
        replacedGrid.setOnRowDoubleClicked(() => { moveReplaceBenefits('left'); });

        $$('dp-riders-edit').disable();
        $$('dp-riders-delete').disable();

        riderGrid.setOnSelectionChanged((rows) => {
            $$('dp-riders-edit').enable(rows);
            $$('dp-riders-delete').enable(rows);
        });
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

        if (res.selectedItem)
            $$('dp-vendor-smart-chooser').setValue(res.selectedItem.id, res.selectedItem.name);
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

        if (res.selectedItem)
            $$('dp-service-smart-chooser').setValue(res.selectedItem.id, res.selectedItem.name);
    };
    const searchServices = async () => {
        let selectedNode = await serviceSelection();
        if (selectedNode && selectedNode.data) {
            $$('dp-service-smart-chooser').setValue(selectedNode.data.id, selectedNode.data.description);
        }
    };
    const listBenefits = (res) => {
        $$('dp-replaced-benefit-smart-chooser').clear();

        if (!res.item || res.item.length === 0) {
            // $$('dp-replaced-benefit-smart-chooser').add('', '(active - not being replaced)').disable();
        } else if (res.item.length <= lowCap) {
            $$('dp-replaced-benefit-smart-chooser').add('', '(choose)');
            $$('dp-replaced-benefit-smart-chooser').addItems(res.item, 'id', 'benefitName');
            $$('dp-replaced-benefit-smart-chooser').enable();
        } else {
            $$('dp-replaced-benefit-smart-chooser').forceSelect();
        }

        if (res.selectedItem) {
            $$('dp-replaced-benefit-smart-chooser').add('', '(none - still active)').addItems(Utils.assureArray(res.selectedItem), 'id', 'benefitName');
            $$('dp-replaced-benefit-smart-chooser').setValue(res.selectedItem.id, res.selectedItem.benefitName);
        }
    };
    const searchBenefits = async () => {
        let selectedNode = await benefitSelection();
        if (selectedNode && selectedNode.data) {
            $$('dp-replaced-benefit-smart-chooser').setValue(selectedNode.data.id, selectedNode.data.benefitName);
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
                    {headerName: 'ID', field: 'accSysId'},
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
    // benefit search popup
    /////////////////////////////////////////////////////////////////////////////////
    const benefitSelection = async (rider) => {

        Utils.popup_open('benefit-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            let changeCount = count => {
                Utils.setText('bsp-count', `Displaying ${count} Benefits`);
            };
        
            let reset = () => {
                $$('bsp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('bsp-name').clear();
        
                formSearchGrid.clear();
                changeCount(0);
            };
        
            let ok = () => {
                let benefit = formSearchGrid.getSelectedRow();
        
                if (!benefit)
                    benefit = null;                
        
                reset();
                resolve(benefit);
                Utils.popup_close();
            };
        
            let cancel = () => {
                reset();
                resolve(null);
                Utils.popup_close();
            };           
        
            // Setup drop downs.
            bindToEnum('bsp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Benefit', field: 'benefitName'}
                ];
        
                formSearchGrid = new AGGrid('bsp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };
        
            if (!formSearchGrid)
                initDataGrid();
        
            reset();
        
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
        
            formSearchGrid.setOnSelectionChanged($$('bsp-ok').enable);
        
            formSearchGrid.setOnRowDoubleClicked(ok);
        
            $$('bsp-reset').onclick(reset);
        
            $$('bsp-search').onclick(async () => {
                let inParams = {
                    name: $$('bsp-name').getValue(),
                    nameSearchType: $$('bsp-name-type').getValue(),
                    benefitId: benefitId
                };
        
                let data = await AWS.callSoap(WS, rider ? 'searchBenefitsForRider' : 'searchBenefits', inParams);
        
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
        
            $$('bsp-ok').onclick(ok);
        
            $$('bsp-cancel').onclick(cancel);
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
    const riderBenefit = async (row) => {

        Utils.popup_open('rider-detail');

        return new Promise(function (resolve, reject) {

            let param = {
                benefitId: benefitId
            };
            if (row) {
                $$('rdp-title').setValue('Edit Benefit Rider');
                $$('rdp-required').setValue(row.required);
                $$('rdp-hidden').setValue(row.hidden);
                param.benefitRiderId = row.benefitRiderId;
                $$('rdp-smart-chooser').clear();
            } else {
                $$('rdp-title').setValue('Add Benefit Rider');
                $$('rdp-required').setValue(false);
                $$('rdp-hidden').setValue(false);
                $$('rdp-smart-chooser').clear();
            }

            AWS.callSoap(WS, "searchBenefitsForRider", param).then( res => {
                $$('rdp-smart-chooser').clear();

                if (!res.item || res.item.length === 0) {
                    $$('rdp-smart-chooser').add('', '(nothing to select)').disable();
                } else if (res.item.length === 1) {
                    $$('rdp-smart-chooser').add(res.item[0].benefitId, res.item[0].benefitName).disable();
                } else if (res.item.length <= lowCap) {
                    $$('rdp-smart-chooser').add('', '(select)');
                    $$('rdp-smart-chooser').addItems(res.item, 'benefitId', 'benefitName');
                    $$('rdp-smart-chooser').enable();
                } else {
                    $$('rdp-smart-chooser').forceSelect();
                }

                if (res.selectedItem) {
                    $$('rdp-smart-chooser').addItems(res.selectedItem, 'benefitId', 'benefitName');
                    $$('rdp-smart-chooser').setValue(res.selectedItem.benefitId, res.selectedItem.benefitName);
                }
            });

            $$('rdp-smart-chooser').setSelectFunction(async () => {
                let selectedNode = await benefitSelection(true);
                if (selectedNode && selectedNode.data) {
                    $$('rdp-smart-chooser').setValue(selectedNode.data.benefitId, selectedNode.data.benefitName);
                }
            });

            let ok = () => {

                let data = {
                    riderBenefitId: $$('rdp-smart-chooser').getValue(),
                    required: $$('rdp-required').getValue(),
                    hidden: $$('rdp-hidden').getValue()
                };

                if (row) {
                    data.benefitRiderId = row.benefitRiderId;
                } else {
                    data.baseBenefitId = benefitId;
                }

                AWS.callSoap(WS, row ? "saveRider":"newRider", data).then( res => {
                    if (res.wsStatus === '0') {                
                        Utils.popup_close();
                        resolve();
                    }                    
                });
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            $$('rdp-ok').onclick(ok);
            $$('rdp-cancel').onclick(cancel);

        });
    };

    $$('dp-select-left').onclick(() => { moveBenefitClass('right'); });
    $$('dp-select-right').onclick(() => { moveBenefitClass('left'); });

    $$('dp-replace-left').onclick(() => { moveReplaceBenefits('right'); });
    $$('dp-replace-right').onclick(() => { moveReplaceBenefits('left'); });

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

    $$('dp-choose-onBoarding').onclick(async () => {
        let selectedNode = await screenSelection();            
        if (selectedNode && selectedNode.data) {
            $$('dp-screen-onBoarding').setValue(selectedNode.data.name);
            screen_onBoarding = selectedNode.data.screenId;
        }
    });

    $$('dp-clear-onBoarding').onclick(() => {
        screen_onBoarding = null;
        $$('dp-screen-onBoarding').clear();
    });

    $$('dp-riders-add').onclick(async () => {
        await riderBenefit();
        updateRiderGrid();
    });

    $$('dp-riders-edit').onclick(async () => {
        await riderBenefit(riderGrid.getSelectedRow());
        updateRiderGrid();
    });

    $$('dp-riders-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Benefit Rider?', () => {
            const data = {
                ids: [riderGrid.getSelectedRow().benefitRiderId]
            };
            
            AWS.callSoap(WS, "deleteRiders", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateRiderGrid();
                }
            });
        });
    });

    $$('dp-reset').onclick(async () => {
        await init_details();
        reset();
        Utils.clearSomeControlValueChanged(true);
    });

    $$('dp-save').onclick(async () => {
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
        if ($$('dp-lastDate-of-coverage').isError('Last date of QE field')) {
            container.selectTab('dp-eligibility-TabButton');
            return;
        }

        const eligibilityPeriodField = [ '', '', 'dp-firstMonth-after-days', 'dp-firstMonth-after-months', 'dp-after-days', 'dp-after-months' ];
        const coverageEndPeriodField = [ '', '', '', 'dp-qualifyingEvent-plus-days' ];
        
        const data = {
            replacedByBenefitId: $$('dp-replaced-benefit-smart-chooser').getValue(),
            additionalInstructions: $$('dp-instructions').getValue(),
            timeRelated: $$('dp-chk-time-related').getValue(),
            onBoardingScreenId: screen_onBoarding,
            screenId: screen_enrollment,
            includeOnBoarding: $$('dp-include-in-onBoarding').getValue(),
            includeInOpenEnrollment: $$('dp-include-in-openEnrollment').getValue(),
            avatarPath: $$('dp-avatar-path').getValue(),
            avatarLocation: $$('dp-avatar-location').getValue(),
            processType: 'N',
            benefitId: benefitId,
            activeDate: $$('dp-active').getIntValue(),
            inactiveDate: $$('dp-inactive').getIntValue(),
            additionalInfo: $$('dp-additional-information').getValue(),
            categoryId: $$('dp-category').getValue(),
            coveredUnderCOBRA: $$('dp-chk-covered-under-COBRA').getValue(),
            description: $$('dp-description').getValue(),
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
            preTax: $$('dp-tax-type').getValue(),
            serviceId: $$('dp-service-smart-chooser').getValue(),
            requiresDecline: $$('dp-chk-requires-decline').getValue(),
            subGroupId: $$('dp-sub-group-id').getValue(),
            vendorId: $$('dp-vendor-smart-chooser').getValue(),
            eligibilityType: $$('dp-eligibility-type').getValue(),
            eligibilityPeriod: eligibilityPeriodField[$$('dp-eligibility-type').getValue()] !== '' ? $$(eligibilityPeriodField[$$('dp-eligibility-type').getValue()]).getValue() : 0,
            dependentMaxAge: $$('dp-lossOfDependent-status').getValue(),
            dependentMaxAgeStudent: $$('dp-lossOfDependent-status-unless').getValue(),
            coverageEndType: $$('dp-lastDate-of-coverage').getValue(),
            coverageEndPeriod: coverageEndPeriodField[$$('dp-lastDate-of-coverage').getValue()] !== '' ? $$(coverageEndPeriodField[$$('dp-lastdate-of-coverage').getValue()]).getValue() : 0,
            ruleName: $$('dp-rule-name').getValue(),
            groupAccountId: $$('dp-group-account-id').getValue(),
            autoAssign: $$('dp-chk-auto-assign').getValue(),
            minAge: $$('dp-min-age').getValue(),
            maxAge: $$('dp-max-age').getValue(),
            internalId: $$('dp-internal-id').getValue(),
            costCalcType: $$('dp-cost-calc-type').getValue(),
            employerCostModel: $$('dp-employer-cost-model').getValue(),
            employeeCostModel: $$('dp-employee-cost-model').getValue(),
            benefitAmountModel: $$('dp-benefit-amount-model').getValue(),
            minPay: $$('dp-min-pay').getValue(),
            maxPay: $$('dp-max-pay').getValue(),
            minHoursPerWeek: $$('dp-minHours-per-week').getValue(),
            benefitClassIds: selectedClassGrid.getDataItems().map(col => { return col.id }),
            replacingBenefitIds: replacedGrid.getDataItems().map(item => { return item.benefitId })
        };

        await AWS.callSoap(WS, "saveBenefit", data);
        Utils.clearSomeControlValueChanged(true);
    });

    await init_details();
    reset();

})();
