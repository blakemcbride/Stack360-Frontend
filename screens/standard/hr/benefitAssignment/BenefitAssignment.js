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
    const WS = 'StandardHrBenefitAssignment';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('ba-employee').setValue(personName);

    let res = await AWS.callSoap(WS, 'checkRight');
    if (res.wsStatus === "0") {
    } else
        return;

    function BenefitsChangeData() {}

    BenefitsChangeData.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        const a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            Utils.popup_open("benefit-info-popup");
            $$('benefit-info').setValue(params.data.description);
            $$('benefit-info-ok').onclick(function () {
                Utils.popup_close();
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.benefitName;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    BenefitsChangeData.prototype.getGui = function() {
        return this.eGui;
    };

    let resultsGrid;
 
    const resultsColumnDefs = [
        {headerName: "Catogory", field: "categoryName", width: 80},
        {headerName: "Benefit", field: "benefitName", cellRenderer: 'benefitsChangeData', width: 220},
        {headerName: "Coverage Configuration", field: "configName", width: 320},
        {headerName: "Policy Start Date", field: "policyStartDate", type: "numericColumn", width: 80},
        {headerName: "Policy Owner", field: "providedByDisplayName", width: 120},
        {headerName: "Approved", field: "approved", width: 120},
    ];
    resultsGrid = new AGGrid('resultsGrid', resultsColumnDefs);
    resultsGrid.addComponent('benefitsChangeData', BenefitsChangeData);
    resultsGrid.multiSelect();
    resultsGrid.rowStyleFunction(params => {
        if (params.data.approved === "No")
            return { background: $('#ba-notYetApproved-color').val() };
        else if (params.data.active === "No")
            return { background: $('#ba-approvedDeclines-color').val() };
        else if (params.data.active === "Y")
            return { background: $('#ba-approvedBenefits-color').val() };
    });
    resultsGrid.show();

    AWS.callSoap(WS, 'loadCustomColors').then(data => {
        if (data.wsStatus === '0') {     
            $('#ba-approvedBenefits-color').val('#' + Number(data.approvedBenefitColor).toString(16));
            $('#ba-approvedDeclines-color').val('#' + Number(data.approvedDeclineColor).toString(16));
            $('#ba-notYetApproved-color').val('#' + Number(data.notYetApprovedColor).toString(16));
        }
    });   

    $('#ba-approvedBenefits-color').change(() => {
        changeColor();
    });
    $('#ba-approvedDeclines-color').change(() => {
        changeColor();
    });
    $('#ba-notYetApproved-color').change(() => {
        changeColor();
    });

    function changeColor() {
        const params = {
            approvedBenefitColor: parseInt($('#ba-approvedBenefits-color').val().substring(1), 16),
            approvedDeclineColor: parseInt($('#ba-approvedDeclines-color').val().substring(1), 16),
            notYetApprovedColor: parseInt($('#ba-notYetApproved-color').val().substring(1), 16),
        }

        AWS.callSoap(WS, 'saveCustomColors', params).then(data => {
            if (data.wsStatus === '0') {     
                getListAssignedBenefitConfigurations();
            }
        });   
    }

    $$('ba-resetColors').onclick(() => {
        const params = {
            approvedBenefitColor: 16777215,
            approvedDeclineColor: 16372439,
            notYetApprovedColor: 16777113,
        }

        AWS.callSoap(WS, 'saveCustomColors', params).then(data => {
            if (data.wsStatus === '0') {     
                $('#ba-approvedBenefits-color').val('#' + Number(16777215).toString(16));
                $('#ba-approvedDeclines-color').val('#' + Number(16372439).toString(16));
                $('#ba-notYetApproved-color').val('#' + Number(16777113).toString(16));
                getListAssignedBenefitConfigurations();
            }
        });   
    });

    function getListAssignedBenefitConfigurations() {

        const params = {           
            personId: personId,
            showApprovedBenefit: $$('ba-approvedBenefits').getValue(),
            showApprovedDecline: $$('ba-approvedDeclines').getValue(),
            showNotYetApproved: $$('ba-notYetApproved').getValue(),
        };


        AWS.callSoap(WS, 'listAssignedBenefitConfigurations', params).then(data => {
            if (data.wsStatus === '0') {     
                resultsGrid.clear();
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].policyStartDate = DateUtils.intToStr4(Number(data.item[i].policyStartDate));
                }
                resultsGrid.addRecords(data.item);
                resultsGrid.setOnSelectionChanged(() => {
                    const rows = resultsGrid.getSelectedRows();
                    if (rows.length === 1) {
                        $$('ba-edit').enable();
                        $$('ba-switchPolicy').enable();
                        $$('ba-unassign').enable();
                    } else {
                        $$('ba-edit').disable();
                        $$('ba-switchPolicy').disable();
                        $$('ba-unassign').disable();
                    }


                    for (let i = 0; i < rows.length; i++) {
                        if (rows[i].approved === 'No') {
                            $$('ba-approveSelected').enable(i);
                        } else {
                            $$('ba-approveSelected').disable(i);
                        }
                    }
                    
                });
            }
        });   
    }

    getListAssignedBenefitConfigurations();
     $$('ba-approvedBenefits').onChange(getListAssignedBenefitConfigurations);
    $$('ba-approvedDeclines').onChange(getListAssignedBenefitConfigurations);
    $$('ba-notYetApproved').onChange(getListAssignedBenefitConfigurations);

    $$('ba-approveSelected').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to approve the selected benefit election?', () => {
            const rows = resultsGrid.getSelectedRows();
            let ids = [];
            for (let i = 0; i < rows.length; i++) {
                ids.push(rows[i].personConfigId);
            }

            const params = {
                ids: ids
            };
            AWS.callSoap(WS, "approveConfig", params).then(data => {
                if (data.wsStatus === '0') {
                    getListAssignedBenefitConfigurations();
                }
            });
        });
    });

    let assignCoverageGrid;
 
    const assignCoverageColumnDefs = [
        {headerName: "Coverage Configuration", field: "configName", width: 200},
        {headerName: "Coverage", field: "coverage", width: 200}
    ];
    assignCoverageGrid = new AGGrid('assignCoverageGrid', assignCoverageColumnDefs);
    assignCoverageGrid.show();

    $$('ba-assign').onclick(() => {

        $$('ba-assign-benefitCategory').clear();
        $$('ba-assign-benefit').clear();
        $$('ba-assign-cobra').clear();
        $$('ba-assign-coverage').clear();
        $$('ba-assign-newBenefit').clear();
        $$('ba-assign-copyCurrent').clear();
        $$('ba-assign-newCobra').clear();

        Utils.popup_open('ba-assign-popup');

        const params = {
            forDecline: false,
            noFiltering: false,
            personId: personId
        }

        $$('ba-assign-benefitCategory').add('', "(select)");
        AWS.callSoap(WS, 'listBenefitCategories', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ba-assign-benefitCategory').addItems(data.item, "categoryId", "categoryName");
            }  
        });

        $$('ba-assign-newBenefit').add('', "(select)");

        $$('ba-assign-benefitCategory').onChange(() => {
            if ($$('ba-assign-benefitCategory').getValue() !== '') {
                $$('ba-assign-benefit').clear();
                $$('ba-assign-cobra').setValue(false);
                $$('ba-assign-coverage').clear();
                $$('ba-assign-newBenefit').clear().enable();
                $$('ba-assign-copyCurrent').setValue(false);
                $$('ba-assign-newCobra').setValue(false);                
            } else {
                $$('ba-assign-benefit').setValue('(none)');
                $$('ba-assign-cobra').setValue(false);
                $$('ba-assign-coverage').setValue('(none)');
                $$('ba-assign-newBenefit').clear().disable();
                $$('ba-assign-copyCurrent').setValue(false).disable();
                $$('ba-assign-newCobra').setValue(false).disable();
                $$('ba-assign-ok').disable();
            }

            $$('ba-assign-newBenefit').clear().disable().add('', "(select)");

            const benefitParams = {
                benefitId: '',
                categoryId: $$('ba-assign-benefitCategory').getValue(),
                forDecline: false,
                personId: personId
            }
            AWS.callSoap(WS, 'listBenefits', benefitParams).then(data => {

                if (data.wsStatus === "0") {
                    if (data.item !== undefined) {
                        data.item = Utils.assureArray(data.item);        
                        $$('ba-assign-newBenefit').enable().addItems(data.item, "benefitId", "benefitName");                
                    }
                    if($$('ba-assign-benefitCategory').getData($$('ba-assign-benefitCategory').selectedIndex()).allowsMultipleBenefits === 'true') {
                        $$('ba-assign-multiple').show();
                    } else {
                        $$('ba-assign-multiple').hide();
                    }
                }  
            });
        });

        $$('ba-assign-newBenefit').onChange(() => {
            const benefitParams = {
                configId: '',
                benefitId: $$('ba-assign-newBenefit').getValue(),
                personId: personId
            }
            AWS.callSoap(WS, 'listBenefitConfigs', benefitParams).then(data => {
                assignCoverageGrid.clear();
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);        
                    assignCoverageGrid.addRecords(data.item);   

                    if (data.item.length > 0) {
                        assignCoverageGrid.setOnSelectionChanged(() => {
                            $$('ba-assign-ok').enable();
                            $$('ba-assign-newCobra').enable();
                        });
                    } else {
                        $$('ba-assign-ok').enable();
                    }
                }  
            });
        });

        $$('ba-assign-ok').onclick(() => {
            let newBenefit = {
                benefitName: $$('ba-assign-newBenefit').getLabel(),
                categoryName: $$('ba-assign-benefitCategory').getLabel(),
                configName: assignCoverageGrid.getSelectedRow().configName,
                configId: assignCoverageGrid.getSelectedRow().configId
            }
            edit(newBenefit);
        });

        $$('ba-assign-cancel').onclick(Utils.popup_close);
    });

    $$('ba-decline').onclick(() => {
        $$('ba-decline-benefitCategory').clear();
        $$('ba-decline-benefit').clear();
        $$('ba-decline-dateIn').clear();
        $$('ba-decline-dateOut').clear();
        $$('ba-decline-reason').clear();

        Utils.popup_open('ba-decline-popup');

        const params = {
            forDecline: true,
            noFiltering: false,
            personId: personId
        }

        $$('ba-decline-benefitCategory').add('', "(select)");
        AWS.callSoap(WS, 'listBenefitCategories', params).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ba-decline-benefitCategory').addItems(data.item, "categoryId", "categoryName");
            }  
        });

        const personConfigId = {
            personConfigId: ''
        }
        $$('ba-decline-reason').add('', "(select)");
        AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                $$('ba-decline-reason').addItems(data.item, "id", "description");
            }  
        });

        $$('ba-decline-benefit').add('', "(select benefit to decline)");

        $$('ba-decline-benefitCategory').onChange(() => {
            if ($$('ba-decline-benefitCategory').getValue() !== '') {
                $$('ba-decline-dateIn').enable();
                $$('ba-decline-dateOut').enable();
            } else {
                $$('ba-decline-dateIn').disable();
                $$('ba-decline-dateOut').disable();
            }

            $$('ba-decline-benefit').clear().disable().add('', "(select benefit to decline)");

            const benefitParams = {
                benefitId: '',
                categoryId: $$('ba-decline-benefitCategory').getValue(),
                forDecline: true,
                personId: personId
            }
            AWS.callSoap(WS, 'listBenefits', benefitParams).then(data => {

                if (data.wsStatus === "0") {
                    if (data.item !== undefined) {
                        data.item = Utils.assureArray(data.item);        
                        $$('ba-decline-benefit').enable().addItems(data.item, "benefitId", "benefitName");                
                    }
                }  
            });
        });

        $$('ba-decline-ok').onclick(() => {
            if ($$('ba-decline-benefitCategory').isError('Benefit Category'))
                return;

            if ($$('ba-decline-reason').isError('Benefit Change Reason'))
                return;

            const benefitParams = {
                benefitChangeReasonId: $$('ba-decline-reason').getValue(),
                benefitId: $$('ba-decline-benefit').getValue(),
                categoryId: $$('ba-decline-benefitCategory').getValue(),
                endDate: $$('ba-decline-dateOut').getIntValue(),
                startDate: $$('ba-decline-dateIn').getIntValue(),
                personId: personId
            }
            AWS.callSoap(WS, 'newDeclineBenefit', benefitParams).then(data => {

                if (data.wsStatus === "0") {
                    getListAssignedBenefitConfigurations();
                    Utils.popup_close();
                }  
            });
        });

        $$('ba-decline-cancel').onclick(Utils.popup_close);
    });

    let coveragesGrid;

    const coveragesColumnDefs = [
        {headerName: "Last Name", field: "lastName", width: 80},
        {headerName: "First Name", field: "firstName", width: 80},
        {headerName: "MI.", field: "middleName", width: 20},
        {headerName: "SSN", field: "ssn", type: "numericColumn", width: 80},
        {headerName: "Relationship", field: "relationship", width: 120},
        {headerName: "Original Date", field: "originalCoverageDate", type: "numericColumn", width: 80},
        {headerName: "Start Date", field: "startDate", type: "numericColumn", width: 80},
        {headerName: "Final Date", field: "endDate", type: "numericColumn", width: 80},
        {headerName: "Amount", field: "amountCovered", type: "numericColumn", width: 80}
    ];
    coveragesGrid = new AGGrid('coveragesGrid', coveragesColumnDefs);
    coveragesGrid.show();

    let physiciansGrid;

    const physiciansColumnDefs = [
        {headerName: "Enrollee", field: "Enrollee", width: 220},
        {headerName: "Physician", field: "Physician", width: 220},
        {headerName: "Code.", field: "Code", width: 160},
        {headerName: "Address", field: "Address", width: 180},
        {headerName: "Annual Visit", field: "Annual", type: "numericColumn", width: 150}
    ];
    physiciansGrid = new AGGrid('physiciansGrid', physiciansColumnDefs);
    physiciansGrid.show();

    function edit(newBenefit = null) {
        if (newBenefit == null) {
            const row = resultsGrid.getSelectedRow();

            $$('ba-edit-employeeName').setValue(personName);
            $$('ba-edit-benefitName').setValue(row.benefitName);
            $$('ba-edit-categoryName').setValue(row.categoryName);
            $$('ba-edit-coverageName').setValue(row.configName);

            const container = new TabContainer('ba-tab-container');
            
            const personConfigId = {
                personConfigId: row.personConfigId
            }

            $$('ba-edit-benefitChangeReason').add('', "(select)");
            AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
                    $$('ba-edit-benefitChangeReason').addItems(data.item, "id", "description");
                }  
            });

            AWS.callSoap(WS, 'loadDetail', personConfigId).then(data => {
                if (data.wsStatus === "0") {
                    coveragesGrid.clear();

                    $$('ba-edit-policyStartDate').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-lastChangeDate').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-insuranceID').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-policyFinalDate').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-startDate').setValue(data.startDate);
                    $$('ba-edit-finalDate').setValue(data.endDate);

                    $$('ba-edit-benefitChangeReason').setValue(data.benefitChangeReasonId);

                    $$('ba-edit-cobra').setValue(data.usingCOBRA === 'true');
                    $$('ba-edit-acceptedDate').setValue(data.acceptedDateCOBRA);
                    $$('ba-edit-maximumMonths').setValue(data.maxMonthsCOBRA);

                    
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        data.item[i].originalCoverageDate = data.item[i].originalCoverageDate === '0' ? '' : DateUtils.intToStr4(data.item[i].originalCoverageDate);
                        data.item[i].startDate = data.item[i].startDate === '0' ? '' : DateUtils.intToStr4(data.item[i].startDate);
                        data.item[i].endDate = data.item[i].endDate === '0' ? '' : DateUtils.intToStr4(data.item[i].endDate);
                        data.item[i].amountCovered = data.item[i].amountCovered;
                    }
                    coveragesGrid.addRecords(data.item);
                    coveragesGrid.setOnSelectionChanged($$('ba-edit-editCoverage').enable);
                    physiciansGrid.setOnSelectionChanged(() => {
                        $$('ba-edit-physiciansEdit').enable();
                        $$('ba-edit-physiciansDelete').enable();
                    });

                    const params = {
                        amount: -1,
                        bcrId: '00001-0000000001',
                        configId: row.configId,
                        item: {
                            personId: personId,
                            startDate: data.startDate
                        },
                        lastCoverageChangeDate: data.lastCoverageChangeDate,
                        personId: personId,
                        policyBenefitJoinId: row.personConfigId,
                        policyEndDate: data.endDate,
                        policyStartDate: data.startDate,
                        usingCobra: data.usingCOBRA === 'true'
                    }
                    AWS.callSoap(WS, 'loadUpdatedCost', params).then(data => {
                        if (data.wsStatus === "0") {
                            $$('ba-edit-employerCostPerPay').setValue(NumberUtils.round(data.employerPPPCost, 2));
                            $$('ba-edit-employerCostMonthly').setValue(NumberUtils.round(data.employerMonthlyCost, 2));
                            $$('ba-edit-employerCostAnnualy').setValue(NumberUtils.round(data.employerAnnualCost, 2));
                            $$('ba-edit-employeeCostPerPay').setValue(NumberUtils.round(data.employeePPPCost, 2));
                            $$('ba-edit-employeeCostMonthly').setValue(NumberUtils.round(data.employeeMonthlyCost, 2));
                            $$('ba-edit-employeeCostAnnualy').setValue(NumberUtils.round(data.employeeAnnualCost, 2));
                            $$('ba-edit-benefitAmount').setValue(NumberUtils.round(data.benefitAnnualAmount, 2));
                        }  
                    });
                }  
            });

            $$('ba-edit-editCoverage').onclick(() => {

                const coverageRow = coveragesGrid.getSelectedRow();

                $$('ba-editCoverage-coverageDate').setValue(DateUtils.strToInt(coverageRow.originalCoverageDate));
                $$('ba-editCoverage-startDate').setValue(DateUtils.strToInt(coverageRow.startDate));
                $$('ba-editCoverage-finalDate').setValue(DateUtils.strToInt(coverageRow.endDate));
                $$('ba-editCoverage-amount').setValue(coverageRow.amountCovered);
                $$('ba-editCoverage-comments').setValue(coverageRow.comments);
                $$('ba-editCoverage-details').setValue(coverageRow.otherInsurance);
                $$('ba-editCoverage-otherInsurance').setValue(coverageRow.otherInsurancePrimary ? "1" : "2");
                $$('ba-editCoverage-hasOther').setValue(coverageRow.otherInsurance !== "");

                Utils.popup_open('ba-editCoverage-popup');

                $$('ba-editCoverage-hasOther').onChange(() => {
                    if ($$('ba-editCoverage-hasOther').getValue()) {
                        $$('ba-editCoverage-details').enable();
                        $$('ba-editCoverage-otherInsurance').enable();                    
                    } else {
                        $$('ba-editCoverage-details').disable().clear();
                        $$('ba-editCoverage-otherInsurance').disable().setValue('2');      
                    }
                });

                $$('ba-editCoverage-ok').onclick(() => {
                    $$('ba-editCoverage-ok').onclick(() => {
                        coverageRow.originalCoverageDate = $$('ba-editCoverage-coverageDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-editCoverage-coverageDate').getIntValue());
                        coverageRow.startDate = $$('ba-editCoverage-startDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-editCoverage-startDate').getIntValue());
                        coverageRow.endDate = $$('ba-editCoverage-finalDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-editCoverage-finalDate').getIntValue());
                        coverageRow.amountCovered = $$('ba-editCoverage-amount').getValue();
                        coverageRow.comments = $$('ba-editCoverage-comments').getValue();
                        coverageRow.otherInsurance = $$('ba-editCoverage-details').getValue();
                        coverageRow.otherInsurancePrimary = $$('ba-editCoverage-otherInsurance').getValue() === "1";
                        coveragesGrid.updateSelectedRecord(coverageRow);
                        Utils.popup_close();
                    });
                    coveragesGrid.updateSelectedRecord(coverageRow);
                    Utils.popup_close();
                });

                $$('ba-editCoverage-cancel').onclick(Utils.popup_close);
            });
            
            $$('ba-edit-physiciansAdd').onclick(() => {
                $$('ba-physician-action').setValue('Add');
                $$('ba-physician-enrollee').clear();
                $$('ba-physician-reason').clear();
                $$('ba-physician-changeDate').clear();
                $$('ba-physician-name').clear();
                $$('ba-physician-code').clear();
                $$('ba-physician-address').clear();
                $$('ba-physician-hasSeen').setValue(false);

                $$('ba-physician-reason').add('', "(select)");
                AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                    if (data.wsStatus === "0") {
                        data.item = Utils.assureArray(data.item);
                        $$('ba-physician-reason').addItems(data.item, "id", "description");
                    }  
                });

                $$('ba-physician-enrollee').add('', "(select)");
                const rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    rows[i].name = rows[i].firstName + " " + rows[i].lastName;
                }
                $$('ba-physician-enrollee').addItems(rows, "personId", "name");

                Utils.popup_open('ba-physician-popup');

                $$('ba-physician-ok').onclick(() => {
                    let newPhysician = {
                        Enrollee: $$('ba-physician-enrollee').getLabel(),
                        Physician: $$('ba-physician-name').getValue(),
                        Code: $$('ba-physician-code').getValue(),
                        Address: $$('ba-physician-address').getValue(),
                        Annual: $$('ba-physician-hasSeen').getValue() ? 'Yes' : 'No',
                        ChangeDate: DateUtils.intToStr4($$('ba-physician-changeDate').getIntValue()),
                        EnrolleeId: $$('ba-physician-enrollee').getValue(),
                        changeReason: $$('ba-physician-reason').getValue()
                    }
                    physiciansGrid.addRecord(newPhysician);
                    Utils.popup_close();
                });

                $$('ba-physician-cancel').onclick(Utils.popup_close);
            });

            $$('ba-edit-physiciansEdit').onclick(() => {
                const row = physiciansGrid.getSelectedRow();

                $$('ba-physician-action').setValue('Edit');
                $$('ba-physician-enrollee').clear();
                $$('ba-physician-reason').clear();
                $$('ba-physician-changeDate').setValue(DateUtils.strToInt(row.ChangeDate));
                $$('ba-physician-name').setValue(row.Physician);
                $$('ba-physician-code').setValue(row.Code);
                $$('ba-physician-address').setValue(row.Address);
                $$('ba-physician-hasSeen').setValue(row.Annual === 'Yes');

                $$('ba-physician-reason').add('', "(select)");
                AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                    if (data.wsStatus === "0") {
                        data.item = Utils.assureArray(data.item);
                        $$('ba-physician-reason').addItems(data.item, "id", "description");
                        $$('ba-physician-reason').setValue(row.changeReason);
                    }  
                });

                $$('ba-physician-enrollee').add('', "(select)");
                const rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    rows[i].name = rows[i].firstName + " " + rows[i].lastName;
                }
                $$('ba-physician-enrollee').addItems(rows, "personId", "name");
                $$('ba-physician-enrollee').setValue(row.EnrolleeId);

                Utils.popup_open('ba-physician-popup');

                $$('ba-physician-ok').onclick(() => {
                    row.Enrollee = $$('ba-physician-enrollee').getLabel();
                    row.Physician = $$('ba-physician-name').getValue();
                    row.Code = $$('ba-physician-code').getValue();
                    row.Address = $$('ba-physician-address').getValue();
                    row.Annual = $$('ba-physician-hasSeen').getValue() ? 'Yes' : 'No';
                    row.ChangeDate = DateUtils.intToStr4($$('ba-physician-changeDate').getIntValue());
                    row.EnrolleeId = $$('ba-physician-enrollee').getValue();
                    row.changeReason = $$('ba-physician-reason').getValue();

                    physiciansGrid.updateSelectedRecord(row);
                    Utils.popup_close();
                });

                $$('ba-physician-cancel').onclick(Utils.popup_close);
            });
            
            $$('ba-edit-physiciansDelete').onclick(() => {
                Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Physician?', function () {
                    physiciansGrid.deleteSelectedRows();
                });     
            });
            Utils.popup_open('ba-edit-popup');

            $$('ba-edit-startDateApply').onclick(async () => {
                let rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    await Utils.yesNo('Confirmation', 'Replace ' + rows[i].firstName + ' ' + rows[i].lastName + '\'s current Start Date?', function () {
                        rows[i].startDate = $$('ba-edit-startDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-edit-startDate').getIntValue());
                        coveragesGrid.updateSelectedRecord(rows[i]);
                    });           
                }            
            });

            $$('ba-edit-finalDateApply').onclick(async () => {
                let rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    await Utils.yesNo('Confirmation', 'Replace ' + rows[i].firstName + ' ' + rows[i].lastName + '\'s current Start Date?', function () {
                        rows[i].startDate = $$('ba-edit-finalDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-edit-finalDate').getIntValue());
                        coveragesGrid.updateSelectedRecord(rows[i]);
                    });           
                }            
            });

            if (row.approved === "No") {
                $$('ba-edit-approve').enable().onclick(() => {
                    Utils.yesNo('Confirmation', 'Approval can not be reversed. Are you sure you want to approve this Benefit Assignment?', () => {
                        const params = {
                            ids: row.personConfigId
                        };
                        AWS.callSoap(WS, "approveConfig", params).then(data => {
                            if (data.wsStatus === '0') {
                                getListAssignedBenefitConfigurations();
                            }
                        });
                    });
                });
            } else {
                $$('ba-edit-approve').disable();
            }

            

            $$('ba-edit-ok').onclick(() => {

            });
            $$('ba-edit-cancel').onclick(Utils.popup_close);
        } else {

            $$('ba-edit-employeeName').setValue(personName);
            $$('ba-edit-benefitName').setValue(newBenefit.benefitName);
            $$('ba-edit-categoryName').setValue(newBenefit.categoryName);
            $$('ba-edit-coverageName').setValue(newBenefit.configName);

            const container = new TabContainer('ba-tab-container');
            
            const personConfigId = {
                personConfigId: newBenefit.configId
            }

            $$('ba-edit-benefitChangeReason').add('', "(select)");
            AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
                    $$('ba-edit-benefitChangeReason').addItems(data.item, "id", "description");
                }  
            });

            AWS.callSoap(WS, 'loadDetail', personConfigId).then(data => {
                if (data.wsStatus === "0") {
                    coveragesGrid.clear();

                    $$('ba-edit-policyStartDate').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-lastChangeDate').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-insuranceID').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-policyFinalDate').setValue(data.lastCoverageChangeDate);
                    $$('ba-edit-startDate').setValue(data.startDate);
                    $$('ba-edit-finalDate').setValue(data.endDate);

                    $$('ba-edit-benefitChangeReason').setValue(data.benefitChangeReasonId);

                    $$('ba-edit-cobra').setValue(data.usingCOBRA === 'true');
                    $$('ba-edit-acceptedDate').setValue(data.acceptedDateCOBRA);
                    $$('ba-edit-maximumMonths').setValue(data.maxMonthsCOBRA);

                    
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        data.item[i].originalCoverageDate = data.item[i].originalCoverageDate === '0' ? '' : DateUtils.intToStr4(data.item[i].originalCoverageDate);
                        data.item[i].startDate = data.item[i].startDate === '0' ? '' : DateUtils.intToStr4(data.item[i].startDate);
                        data.item[i].endDate = data.item[i].endDate === '0' ? '' : DateUtils.intToStr4(data.item[i].endDate);
                        data.item[i].amountCovered = data.item[i].amountCovered;
                    }
                    coveragesGrid.addRecords(data.item);
                    coveragesGrid.setOnSelectionChanged($$('ba-edit-editCoverage').enable);
                    physiciansGrid.setOnSelectionChanged(() => {
                        $$('ba-edit-physiciansEdit').enable();
                        $$('ba-edit-physiciansDelete').enable();
                    });

                    
                    $$('ba-edit-employerCostPerPay').clear();
                    $$('ba-edit-employerCostMonthly').clear();
                    $$('ba-edit-employerCostAnnualy').clear();
                    $$('ba-edit-employeeCostPerPay').clear();
                    $$('ba-edit-employeeCostMonthly').clear();
                    $$('ba-edit-employeeCostAnnualy').clear();
                    $$('ba-edit-benefitAmount').clear();
                }  
            });

            $$('ba-edit-editCoverage').onclick(() => {

                const coverageRow = coveragesGrid.getSelectedRow();

                $$('ba-editCoverage-coverageDate').setValue(DateUtils.strToInt(coverageRow.originalCoverageDate));
                $$('ba-editCoverage-startDate').setValue(DateUtils.strToInt(coverageRow.startDate));
                $$('ba-editCoverage-finalDate').setValue(DateUtils.strToInt(coverageRow.endDate));
                $$('ba-editCoverage-amount').setValue(coverageRow.amountCovered);
                $$('ba-editCoverage-comments').setValue(coverageRow.comments);
                $$('ba-editCoverage-details').setValue(coverageRow.otherInsurance);
                $$('ba-editCoverage-otherInsurance').setValue(coverageRow.otherInsurancePrimary ? "1" : "2");
                $$('ba-editCoverage-hasOther').setValue(coverageRow.otherInsurance !== "");

                Utils.popup_open('ba-editCoverage-popup');

                $$('ba-editCoverage-hasOther').onChange(() => {
                    if ($$('ba-editCoverage-hasOther').getValue()) {
                        $$('ba-editCoverage-details').enable();
                        $$('ba-editCoverage-otherInsurance').enable();                    
                    } else {
                        $$('ba-editCoverage-details').disable().clear();
                        $$('ba-editCoverage-otherInsurance').disable().setValue('2');      
                    }
                });

                $$('ba-editCoverage-ok').onclick(() => {
                    coverageRow.originalCoverageDate = $$('ba-editCoverage-coverageDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-editCoverage-coverageDate').getIntValue());
                    coverageRow.startDate = $$('ba-editCoverage-startDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-editCoverage-startDate').getIntValue());
                    coverageRow.endDate = $$('ba-editCoverage-finalDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-editCoverage-finalDate').getIntValue());
                    coverageRow.amountCovered = $$('ba-editCoverage-amount').getValue();
                    coverageRow.comments = $$('ba-editCoverage-comments').getValue();
                    coverageRow.otherInsurance = $$('ba-editCoverage-details').getValue();
                    coverageRow.otherInsurancePrimary = $$('ba-editCoverage-otherInsurance').getValue() === "1";
                    coveragesGrid.updateSelectedRecord(coverageRow);
                    Utils.popup_close();
                });

                $$('ba-editCoverage-cancel').onclick(Utils.popup_close);
            });
            
            $$('ba-edit-physiciansAdd').onclick(() => {
                $$('ba-physician-action').setValue('Add');
                $$('ba-physician-enrollee').clear();
                $$('ba-physician-reason').clear();
                $$('ba-physician-changeDate').clear();
                $$('ba-physician-name').clear();
                $$('ba-physician-code').clear();
                $$('ba-physician-address').clear();
                $$('ba-physician-hasSeen').setValue(false);

                $$('ba-physician-reason').add('', "(select)");
                AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                    if (data.wsStatus === "0") {
                        data.item = Utils.assureArray(data.item);
                        $$('ba-physician-reason').addItems(data.item, "id", "description");
                    }  
                });

                $$('ba-physician-enrollee').add('', "(select)");
                const rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    rows[i].name = rows[i].firstName + " " + rows[i].lastName;
                }
                $$('ba-physician-enrollee').addItems(rows, "personId", "name");

                Utils.popup_open('ba-physician-popup');

                $$('ba-physician-ok').onclick(() => {
                    let newPhysician = {
                        Enrollee: $$('ba-physician-enrollee').getLabel(),
                        Physician: $$('ba-physician-name').getValue(),
                        Code: $$('ba-physician-code').getValue(),
                        Address: $$('ba-physician-address').getValue(),
                        Annual: $$('ba-physician-hasSeen').getValue() ? 'Yes' : 'No',
                        ChangeDate: DateUtils.intToStr4($$('ba-physician-changeDate').getIntValue()),
                        EnrolleeId: $$('ba-physician-enrollee').getValue(),
                        changeReason: $$('ba-physician-reason').getValue()
                    }
                    physiciansGrid.addRecord(newPhysician);
                    Utils.popup_close();
                });

                $$('ba-physician-cancel').onclick(Utils.popup_close);
            });

            $$('ba-edit-physiciansEdit').onclick(() => {
                const row = physiciansGrid.getSelectedRow();

                $$('ba-physician-action').setValue('Edit');
                $$('ba-physician-enrollee').clear();
                $$('ba-physician-reason').clear();
                $$('ba-physician-changeDate').setValue(DateUtils.strToInt(row.ChangeDate));
                $$('ba-physician-name').setValue(row.Physician);
                $$('ba-physician-code').setValue(row.Code);
                $$('ba-physician-address').setValue(row.Address);
                $$('ba-physician-hasSeen').setValue(row.Annual === 'Yes');

                $$('ba-physician-reason').add('', "(select)");
                AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                    if (data.wsStatus === "0") {
                        data.item = Utils.assureArray(data.item);
                        $$('ba-physician-reason').addItems(data.item, "id", "description");
                        $$('ba-physician-reason').setValue(row.changeReason);
                    }  
                });

                $$('ba-physician-enrollee').add('', "(select)");
                const rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    rows[i].name = rows[i].firstName + " " + rows[i].lastName;
                }
                $$('ba-physician-enrollee').addItems(rows, "personId", "name");
                $$('ba-physician-enrollee').setValue(row.EnrolleeId);

                Utils.popup_open('ba-physician-popup');

                $$('ba-physician-ok').onclick(() => {
                    row.Enrollee = $$('ba-physician-enrollee').getLabel();
                    row.Physician = $$('ba-physician-name').getValue();
                    row.Code = $$('ba-physician-code').getValue();
                    row.Address = $$('ba-physician-address').getValue();
                    row.Annual = $$('ba-physician-hasSeen').getValue() ? 'Yes' : 'No';
                    row.ChangeDate = DateUtils.intToStr4($$('ba-physician-changeDate').getIntValue());
                    row.EnrolleeId = $$('ba-physician-enrollee').getValue();
                    row.changeReason = $$('ba-physician-reason').getValue();

                    physiciansGrid.updateSelectedRecord(row);
                    Utils.popup_close();
                });

                $$('ba-physician-cancel').onclick(Utils.popup_close);
            });
            
            $$('ba-edit-physiciansDelete').onclick(() => {
                Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Physician?', function () {
                    physiciansGrid.deleteSelectedRows();
                });     
            });
            Utils.popup_open('ba-edit-popup');

            $$('ba-edit-startDateApply').onclick(async () => {
                let rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    await Utils.yesNo('Confirmation', 'Replace ' + rows[i].firstName + ' ' + rows[i].lastName + '\'s current Start Date?', function () {
                        rows[i].startDate = $$('ba-edit-startDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-edit-startDate').getIntValue());
                        coveragesGrid.updateSelectedRecord(rows[i]);
                    });           
                }            
            });

            $$('ba-edit-finalDateApply').onclick(async () => {
                let rows = coveragesGrid.getAllRows();
                for (let i = 0; i < rows.length; i++) {
                    await Utils.yesNo('Confirmation', 'Replace ' + rows[i].firstName + ' ' + rows[i].lastName + '\'s current Start Date?', function () {
                        rows[i].startDate = $$('ba-edit-finalDate').getIntValue() === 0 ? '' : DateUtils.intToStr4($$('ba-edit-finalDate').getIntValue());
                        coveragesGrid.updateSelectedRecord(rows[i]);
                    });           
                }            
            });

            $$('ba-edit-approve').enable().onclick(() => {
                Utils.yesNo('Confirmation', 'Approval can not be reversed. Are you sure you want to approve this Benefit Assignment?', () => {
                    const params = {
                        ids: configId.configId
                    };
                    AWS.callSoap(WS, "approveConfig", params).then(data => {
                        if (data.wsStatus === '0') {
                            getListAssignedBenefitConfigurations();
                        }
                    });
                });
            });      

            $$('ba-edit-ok').onclick(() => {
                let items = [];
                const rows = coveragesGrid.getAllRows();

                for (let i = 0; i < rows.length; i++) {
                    items.push({
                        address: '',
                        amountCovered: rows[i].amountCovered,
                        beneficiaryType: '',
                        comments: rows[i].comments,
                        dob: 0,
                        endDate: rows[i].endDate,
                        originalCoverageDate: rows[i].originalCoverageDate,
                        otherInsurance: rows[i].otherInsurance,
                        otherInsurancePrimary: rows[i].otherInsurancePrimary,
                        personId: rows[i].personId,
                        ssn: rows[i].ssn,
                        startDate: rows[i].startDate   
                    })             
                }
                const params = {
                    acceptedDateCOBRA: $$('ba-edit-acceptedDate').getIntValue(),
                    amountOverrideAnnual: 0,
                    amountPaidType: '',
                    benefitChangeReasonId: newBenefit.benefitChangeReasonId,
                    configId: newBenefit.configId,
                    endDate: $$('ba-edit-policyFinalDate').getIntValue(),
                    insuranceId: $$('ba-edit-insuranceID').getValue(),
                    item: items,
                    lastCoverageChangeDate: $$('ba-edit-lastChangeDate').getIntValue(),
                    maxMonthsCOBRA: $$('ba-edit-maximumMonths').getValue(),
                    personId: personId,
                    sponsoringEmployeeId: '',
                    startDate: $$('ba-edit-policyStartDate').getIntValue(),
                    useAmountOverride: false,
                    usingCOBRA: $$('ba-edit-cobra').getValue(),
                    warningsAccepted: false
                }

                AWS.callSoap(WS, "newAssignedBenefitConfig", params).then(data => {
                    if (data.wsStatus === '0') {
                        getListAssignedBenefitConfigurations();
                        Utils.popup_close();
                    }
                });
            });

            $$('ba-edit-cancel').onclick(Utils.popup_close);
        }
        
    }

    $$('ba-edit').onclick(edit);

    $$('ba-unassign').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to unassign the selected Employee Benefit?', () => {
            const rows = resultsGrid.getSelectedRows();
            let personConfigIds = [];
            for (let i = 0; i < rows.length; i++) {
                personConfigIds.push(rows[i].personConfigId);
            }

            const params = {
                personConfigIds: personConfigIds
            };
            AWS.callSoap(WS, "unassignBenefitConfig", params).then(data => {
                if (data.wsStatus === '0') {
                    getListAssignedBenefitConfigurations();
                }
            });
        });
    });

    $$('ba-report').onclick(() => {
        $$('ba-report-reportDate').setValue(DateUtils.today());
        $$('ba-report-showUserInfo').clear();
        $$('ba-report-payrollReportDate').setValue(DateUtils.today()).disable();

        $$('ba-report-type').setValue('1');

        Utils.popup_open('ba-report-popup');

        $$('ba-report-type').onChange(() => {
            if ($$('ba-report-type').getValue() === '1') {
                $$('ba-report-reportDate').enable();
                $$('ba-report-showUserInfo').enable();
                $$('ba-report-payrollReportDate').disable();
            } else {
                $$('ba-report-reportDate').disable();
                $$('ba-report-showUserInfo').disable();
                $$('ba-report-payrollReportDate').enable();
            }
        });

        $$('ba-report-ok').onclick(() => {
            if ($$('ba-report-type').getValue() === '1') {
                const params = {
                    includeCredentials: $$('ba-report-showUserInfo').getValue(),
                    personId: personId,
                    reportDate: $$('ba-report-reportDate').getIntValue(),
                    showAsDependent: false
                }

                AWS.callSoap(WS, 'getBenefitReport', params).then(data => {
                    if (data.wsStatus === "0") {
                        Utils.showReport(data.reportUrl);
                    }  
                });
            } else {
                const params = {
                    personId: personId,
                    reportDate: $$('ba-report-payrollReportDate').getIntValue(),
                    showAsDependent: false
                }

                AWS.callSoap(WS, 'getPayrollReport', params).then(data => {
                    if (data.wsStatus === "0") {
                        Utils.showReport(data.reportUrl);
                    }  
                });
            }
        });

        $$('ba-report-cancel').onclick(Utils.popup_close);
    });
})();
