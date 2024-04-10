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
    const WS = 'StandardHrBenefitHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const container = new TabContainer('bh-tab-container');
    container.selectTab('bh-policy-TabButton');

    AWS.callSoap(WS, 'listBenefitCategories').then(data => {
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);

            $$('bh-policyBenefitCategory').clear().add('', '(select)');
            $$('bh-policyBenefitCategory').addItems(data.item, "categoryId", "categoryName");  

            $$('bh-dependentBenefitCategory').clear().add('', '(select)');
            $$('bh-dependentBenefitCategory').addItems(data.item, "categoryId", "categoryName");    
        }
    });  

    AWS.callSoap(WS, 'listDependents', {personId: personId}).then(data => {
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);

            $$('bh-dependent').clear().add('', '(select)');
            $$('bh-dependent').addItems(data.item, "dependentId", "dependentName");    
        }
    });  

    AWS.callSoap(WS, 'listBenefitsWithBeneficiaryHistory', {personId: personId}).then(data => {
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);

            $$('bh-benefit').clear().add('', '(select)');
            $$('bh-benefit').addItems(data.item, "benefitId", "benefitName");    
        }
    });  

    let policyHistoryGrid;

    const policyHistoryColumnDefs = [
        {headerName: "Date/Time", field: "dateTimeFormatted", type: "numericColumn", width: 150},
        {headerName: "Type", field: "changeType", width: 100},
        {headerName: "Benefit", field: "benefitName", width: 600},
        {headerName: "Policy Start Date", field: "policyStartDateFormatted", type: "numericColumn", width: 150},
        {headerName: "Policy Final Date", field: "policyEndDateFormatted", type: "numericColumn", width: 150},
        {headerName: "Start Date", field: "coverageStartDateFormatted", type: "numericColumn", width: 150},
        {headerName: "Final Date", field: "coverageEndDateFormatted", type: "numericColumn", width: 150},
    ];

    policyHistoryGrid = new AGGrid('policyHistoryGrid', policyHistoryColumnDefs);
    policyHistoryGrid.show(); 

    $$('bh-policyBenefitCategory').onChange(() => {
        const params = {
            categoryId: $$('bh-policyBenefitCategory').getValue(),
            personId: personId
        }
        AWS.callSoap(WS, 'listPersonBenefitHistory', params).then(data => {
            if (data.wsStatus === '0') {
                policyHistoryGrid.clear();

                data.item = Utils.assureArray(data.item);
    
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].policyStartDateFormatted = data.item[i].policyStartDate !== '0' ? DateUtils.intToStr4(data.item[i].policyStartDate) : '';
                    data.item[i].policyEndDateFormatted = data.item[i].policyEndDate !== '0' ? DateUtils.intToStr4(data.item[i].policyEndDate) : '';
                    data.item[i].coverageStartDateFormatted = data.item[i].coverageStartDate !== '0' ? DateUtils.intToStr4(data.item[i].coverageStartDate) : '';
                    data.item[i].coverageEndDateFormatted = data.item[i].coverageEndDate !== '0' ? DateUtils.intToStr4(data.item[i].coverageEndDate) : '';                        
                }
                policyHistoryGrid.addRecords(data.item);

                policyHistoryGrid.setOnRowDoubleClicked(policyView);
                policyHistoryGrid.setOnSelectionChanged((x) => {
                    $$('policyView').enable(x);
                });
            }
        });   
    });
    
    let dependentHistoryGrid;
    const dependentHistoryColumnDefs = [
        {headerName: "Date/Time", field: "dateTimeFormatted", type: "numericColumn", width: 150},
        {headerName: "Type", field: "changeType", width: 100},
        {headerName: "Benefit", field: "benefitName", width: 600},
        {headerName: "Start Date", field: "coverageStartDateFormatted", type: "numericColumn", width: 150},
        {headerName: "Final Date", field: "coverageEndDateFormatted", type: "numericColumn", width: 150},
    ];

    dependentHistoryGrid = new AGGrid('dependentHistoryGrid', dependentHistoryColumnDefs);
    dependentHistoryGrid.show(); 

    $$('bh-dependentBenefitCategory').onChange(() => {
        if ($$('bh-dependent').getValue() !== '') {
            getListDependentBenefitHistory();
        }
    });

    $$('bh-dependent').onChange(() => {
        $$('bh-dependentSSN').setValue($$('bh-dependent').getData().ssn);
        if ($$('bh-dependentBenefitCategory').getValue() !== '') {
            getListDependentBenefitHistory();
        }
    });
    function getListDependentBenefitHistory() {
        const params = {
            categoryId: $$('bh-dependentBenefitCategory').getValue(),
            dependentId: $$('bh-dependent').getValue()            
        }
        AWS.callSoap(WS, 'listDependentBenefitHistory', params).then(data => {
            if (data.wsStatus === '0') {
                dependentHistoryGrid.clear();

                data.item = Utils.assureArray(data.item);
    
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].coverageStartDateFormatted = data.item[i].coverageStartDate !== '0' ? DateUtils.intToStr4(data.item[i].coverageStartDate) : '';
                    data.item[i].coverageEndDateFormatted = data.item[i].coverageEndDate !== '0' ? DateUtils.intToStr4(data.item[i].coverageEndDate) : '';                        
                }
                dependentHistoryGrid.addRecords(data.item);
                dependentHistoryGrid.setOnRowDoubleClicked(dependentView);
                dependentHistoryGrid.setOnSelectionChanged(() => {
                    $$('dependentView').enable();
                });
            }
        });   
    }

    let beneficiaryHistoryGrid;
    const beneficiaryHistoryColumnDefs = [
        {headerName: "Date/Time", field: "dateTimeFormatted", type: "numericColumn", width: 150},
        {headerName: "Type", field: "changeType", width: 100},
        {headerName: "Benefit", field: "benefitName", width: 600},
        {headerName: "Beneficiary", field: "beneficiary", width: 200},
    ];

    beneficiaryHistoryGrid = new AGGrid('beneficiaryHistoryGrid', beneficiaryHistoryColumnDefs);
    beneficiaryHistoryGrid.show(); 

    $$('bh-benefit').onChange(() => {
        if ($$('bh-benefit').getValue() !== '') {
            const params = {
                benefitId: $$('bh-benefit').getValue(),
                personId: personId           
            }
            AWS.callSoap(WS, 'listBeneficiaryHistory', params).then(data => {
                if (data.wsStatus === '0') {
                    beneficiaryHistoryGrid.clear();
    
                    data.item = Utils.assureArray(data.item);

                    beneficiaryHistoryGrid.addRecords(data.item);
                    beneficiaryHistoryGrid.setOnRowDoubleClicked(beneficiaryView);
                    beneficiaryHistoryGrid.setOnSelectionChanged(() => {
                        $$('beneficiaryView').enable();
                    });
                }
            });   
        } else {
            beneficiaryHistoryGrid.clear();
        }
    });

    function policyView() {
        const row = policyHistoryGrid.getSelectedRow();
        const historyId = {
            historyId: row.historyId
        }
        AWS.callSoap(WS, 'loadPersonBenefitHistory', historyId).then(data => {
            if (data.wsStatus === '0') {
                $$('policy-dateTime').setValue(row.dateTimeFormatted);
                $$('policy-changeType').setValue(row.changeType);
                $$('policy-changeBy').setValue(data.personName);
                $$('policy-changeReason').setValue(data.changeReason);
                $$('policy-benefit').setValue(row.benefitName);
                $$('policy-coverage').setValue(row.configName);
                $$('policy-policyStartDate').setValue(row.policyStartDate !== '0' ? row.policyStartDate : '');
                $$('policy-policyEndDate').setValue(row.policyEndDate !== '0' ? row.policyEndDate : '');
                $$('policy-coverageStartDate').setValue(row.coverageStartDate !== '0' ? row.coverageStartDate : '');
                $$('policy-coverageEndDate').setValue(row.coverageEndDate !== '0' ? row.coverageEndDate : '');
                $$('policy-approved').setValue(data.benefitApproved === 'true');
                $$('policy-cobra').setValue(data.usingCOBRA === 'true');
                $$('policy-insurance').setValue('');
                $$('policy-annual').setValue(data.amountPaid);
                $$('policy-amount').setValue(data.amountCovered);
            }
        });    
        
        Utils.popup_open('policy-popup');

        $$('policy-close').onclick(Utils.popup_close);
    }
    $$('policyView').onclick(policyView);

    function dependentView() {
        const row = dependentHistoryGrid.getSelectedRow();
        const historyId = {
            historyId: row.historyId
        }
        AWS.callSoap(WS, 'loadDependentBenefitHistory', historyId).then(data => {
            if (data.wsStatus === '0') {
                $$('dependent-dateTime').setValue(row.dateTimeFormatted);
                $$('dependent-changeType').setValue(row.changeType);
                $$('dependent-changeBy').setValue(data.personName);
                $$('dependent-changeReason').setValue(data.changeReason);
                $$('dependent-benefit').setValue(row.benefitName);
                $$('dependent-coverage').setValue(row.configName);
                $$('dependent-cobra').setValue(data.usingCOBRA === 'true');
                $$('dependent-coverageStartDate').setValue(row.coverageStartDate !== '0' ? row.coverageStartDate : '');
                $$('dependent-coverageEndDate').setValue(row.coverageEndDate !== '0' ? row.coverageEndDate : '');
                $$('dependent-name').setValue($$('bh-dependent').getLabel());
                $$('dependent-ssn').setValue($$('bh-dependentSSN').getValue());
                $$('dependent-relationship').setValue(data.relationship);
                $$('dependent-amount').setValue(data.amountCovered);
            }
        });    
        
        Utils.popup_open('dependent-popup');

        $$('dependent-close').onclick(Utils.popup_close);
    }
    $$('dependentView').onclick(dependentView);

    function beneficiaryView() {
        const row = beneficiaryHistoryGrid.getSelectedRow();
        const historyId = {
            historyId: row.historyId
        }
        AWS.callSoap(WS, 'loadBeneficiaryHistory', historyId).then(data => {
            if (data.wsStatus === '0') {
                $$('beneficiary-dateTime').setValue(row.dateTimeFormatted);
                $$('beneficiary-changeType').setValue(row.changeType);
                $$('beneficiary-changeBy').setValue(data.personName);
                $$('beneficiary-changeReason').setValue(data.changeReason);
                $$('beneficiary-benefit').setValue(row.benefitName);
                $$('beneficiary-coverage').setValue(row.configName);
                $$('beneficiary-beneficiary').setValue(row.beneficiary);
                $$('beneficiary-ssn').setValue(data.ssn);
                $$('beneficiary-dob').setValue(data.dob !== '0' ? data.dob : '');
                $$('beneficiary-relationship').setValue(data.relationship);
                $$('beneficiary-percent').setValue(data.percent);
                $$('beneficiary-beneficiaryType').setValue(data.beneficiaryType);
                $$('beneficiary-address').setValue(data.address);
            }
        });    
        
        Utils.popup_open('beneficiary-popup');

        $$('beneficiary-close').onclick(Utils.popup_close);
    }
    $$('beneficiaryView').onclick(beneficiaryView);
})();
