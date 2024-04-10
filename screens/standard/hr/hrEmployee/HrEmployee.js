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
 * All rights reserved.
 */

'use strict';

window.HrEmployee = {};

HrEmployee.viewedBasic = true;
HrEmployee.viewedAddress = false;
HrEmployee.viewedStatus = false;
HrEmployee.viewedMisc = false;
HrEmployee.viewedLogin = false;
HrEmployee.viewedTime = false;
HrEmployee.viewedBackground = false;
HrEmployee.dirty = false;
HrEmployee.WS = 'StandardHrHrEmployee';

HrEmployee.initScreen = async () => {

    Framework.askBeforeLeaving = true;  //  make sure changes are not lost when changing screens
    /**
     * Show a drop down or a text input for entering state, depending on the value of the country drop down.
     */
    const filterState = () => {
        const states = getStatesForCountry($$('countries').getValue());

        if (states != null) {
            statesToDropDown('stateDropDown', states);

            $$('stateDropDown').show();
            $$('state').hide();
        } else {
            $$('stateDropDown').hide();
            $$('state').show();
        }
    };

    /**
     * Enable or disable the generate login fields.
     *
     * @param disabled Boolean value
     */
    HrEmployee.toggleAssignLogin = disabled => {
        if (disabled) {
            $$('generateLogin').disable();

            $$('loginId').disable();
            $$('screenGroup').disable();
            $$('scrGrpSearch').disable();

            $$('password').disable();
            $$('securityGroup').disable();
            $$('secGrpSearch').disable();

            $$('confirmPassword').disable();
            $$('loginStatusGrp').disable('loginStatusActive');
            $$('loginStatusGrp').disable('loginStatusInactive');

            $$('noCompScreenGroup').disable();
            $$('noCompScreenGrpSearch').disable();
        } else {
            $$('generateLogin').enable();

            $$('loginId').enable();
            $$('screenGroup').enable();
            $$('scrGrpSearch').enable();

            $$('password').enable();
            $$('securityGroup').enable();
            $$('secGrpSearch').enable();

            $$('confirmPassword').enable();
            $$('loginStatusGrp').enable('loginStatusActive');
            $$('loginStatusGrp').enable('loginStatusInactive');

            $$('noCompScreenGroup').enable();
            $$('noCompScreenGrpSearch').enable();
        }
    };

    /*
    $('#ssn').on('input', () => {
        const ctl = 4$('#ssn');
        let val = ctl.val().trim();
        val = val.replace(/[^0-9-]/g, '');  // remove characters
        let ndigits = 0;
        let ndash = 0;
        for (let i=0 ; i < val.length ; i++)
            if (val.charAt(i) === '-')
                ndash++;
            else
                ndigits++;
        if (ndash > 2  ||  ndigits > 9)
            val = Utils.drop(val, -1);
        ctl.val(val);
        Utils.someControlValueChanged();
    });
*/

    HrEmployee.tabContainer = new TabContainer('empDetailTabContainer');

    // Populate the countries and state drop downs.
    countriesToDropDown('countries');
    countriesToDropDown('citizenOf');

    // Force state filter according to country. This is necessary because the countries drop down
    // initial value change does not trigger an event.
    filterState();

    // Set up military branch types.
    bindToEnum('branch', MilitaryBranchTypes, MilitaryBranchTypes.NONE);

    // Set up initial discharge type to N/A.
    $$('typeOfDischarge').clear();
    $$('typeOfDischarge').add('', '(N/A)');

    bindToEnum('enlistedFrom', Months);
    bindToEnum('enlistedTo', Months);

    statesToDropDown('driversLicenseState', US_STATE_ABBREVIATIONS);

    Utils.changeDirtyStatus('screenStatus', false);

    HrEmployee.personId = Utils.getData(HR_PERSON_ID);

    Utils.setText('screenStatus', Utils.getData(HR_PERSON_NAME));

    // not implemented yet
    if (Utils.getData(HR_PERSON_TYPE) === 'Dep') {
        Utils.setText('screenTitle', 'Dependant Detail:');

        $$('workerId').disable();
        $$('eeoCat').disable();
        $$('eeoRace').disable();
        $$('position').disable();
        $$('status').disable();
        $$('statusDate').disable();
        $$('hoursPerWeek').disable();
        $$('benefitClassOverride').disable();
        $$('citizenOf').disable();
        $$('i9-part1').disable();
        $$('i9-part2').disable();
        $$('i9p1-confirmation').disable();
        $$('i9p2-confirmation').disable();
        $$('visa').disable();
        $$('visaStatus').disable();
        $$('visaExpiration').disable();
        $$('projectInheritedFrom').disable();
        $$('employeeOverride').disable();
        $$('empOvrSearch').disable();
    }

    let data = await AWS.callSoap(HrEmployee.WS, 'loadMeta');
    if (data.wsStatus !== '0')
        return;
    HrEmployee.ssnRequired = data.ssnRequired;
    HrEmployee.newPerDefExtId = data.newPersonDefaultExternalId;
    HrEmployee.multiCompSupport = data.multipleCompanySupport;

    /*
    if (HrEmployee.multiCompSupport === 'true') {
        showContainer('noCompScreenGrpContainer');
    }
*/
    data = await AWS.callSoap(HrEmployee.WS, 'checkRight');
    if (data.wsStatus !== '0')
        return;
    HrEmployee.accessLevel = data.accessLevel;
    HrEmployee.canEditHicNum = data.canEditHicNumber;

    HrEmployee.loadPersonBasic();

    //==================================================================================================================
    // Main event handlers start.
    //==================================================================================================================

    HrEmployee.tabContainer.setOnTabChangeEventHandler(event => {
        switch (event.target.id) {
            case 'basicTabButton':
                if (!HrEmployee.viewedBasic) {
                    HrEmployee.loadPersonBasic();
                    HrEmployee.viewedBasic = true;
                }
                $$('firstName').focus();
                break;
            case 'addressTabButton':
                if (!HrEmployee.viewedAddress) {
                    HrEmployee.loadPersonAddress();
                    HrEmployee.viewedAddress = true;
                }
                $$('addrLine1').focus();
                break;
            case 'posAndStatTabButton':
                if (!HrEmployee.viewedStatus) {
                    HrEmployee.loadPersonStatus();
                    HrEmployee.viewedStatus = true;
                }
                $$('jobTitle').focus();
                break;
            case 'bgTabButton':
                if (!HrEmployee.viewedBackground) {
                    HrEmployee.loadPersonBackground();
                    HrEmployee.viewedBackground = true;
                }
                $$('branch').focus();
                break;
            case 'miscTabButton':
                if (!HrEmployee.viewedMisc) {
                    HrEmployee.loadPersonMisc();

                    if (Utils.getData(HR_PERSON_TYPE) !== "Dep") {
                        HrEmployee.loadProjects();
                    }

                    HrEmployee.viewedMisc = true;
                }
                $$('tobUseGrp').focus('tobaccoYes');
                break;
            case 'loginTabButton':
                if (!HrEmployee.viewedLogin) {
                    HrEmployee.loadLoginGroup();
                    HrEmployee.viewedLogin = true;
                }
                if ($$('assignLogin').getValue() === 'true') {
                    $$('loginId').focus();
                } else {
                    $$('assignLogin').focus();
                }
                break;
            case 'timeTabButton':
                if (!HrEmployee.viewedTime) {
                    HrEmployee.loadPersonTime();
                    HrEmployee.viewedTime = true;
                }
                $$('timeLogCheckBox').focus();
                break;
        }
    });

    Utils.setSomeControlValueChangeFunction(function (status) {
        if (status) {
            $$('save').enable();
            $$('reset').enable();
            $$('client-data-changed').show();
        } else {
            $$('save').disable();
            $$('reset').disable();
            $$('client-data-changed').hide();
        }
    });

    $$('countries').onChange(filterState);

    $$('workerTypeGrp').onChange(value => {
        if (value === "E") {
            Utils.setText('screenTitle', "Employee Detail:");
        } else if (value === "C") {
            Utils.setText('screenTitle', "Independent Contractor Detail:");
        } else {
            Utils.setText('screenTitle', "Detail:");
        }
    });

    $$('empOvrSearch').onclick(async () => {
        let result = await Utils.popup_open1('ChooseProject', 'projectSelection', null);
        if (result && result.data)
            $$('employeeOverride').setValue(result.data.projectId);
        else if (result === null)
            $$('employeeOverride').setValue('');
    });

    $$('scrGrpSearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchScreenGroup', 'screenGroupSelection', null);
        if (result && result.data)
            $$('screenGroup').setValue(result.data.id);
        else if (result === null)
            $$('screenGroup').setValue('');
    });

    $$('secGrpSearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchSecurityGroup', 'securityGroupSelection', null);
        if (result && result.data)
            $$('securityGroup').setValue(result.data.groupId);
        else if (result === null)
            $$('securityGroup').setValue('');
    });

    $$('noCompScreenGrpSearch').onclick(async () => {
        let result = await Utils.popup_open1('SearchScreenGroup', 'screenGroupSelection', null);
        if (result && result.data)
            $$('noCompScreenGroup').setValue(result.data.id);
        else if (result === null)
            $$('noCompScreenGroup').setValue('');
    });

    $$('assignLogin').onChange(() => {
        HrEmployee.toggleAssignLogin(!$$('assignLogin').getValue());
    });

    $$('ssn').onChange(() => {
        const ctl = $('#ssn');
        const val = ctl.val();
        if (val)
            ctl.val(Utils.formatSsn(val));
    });

    function enableDisableMilitary() {
        const selection = $$('branch').getValue();
        if (selection === '') {
            $$('enlistedFrom').setValue('');
            $$('enlistedTo').setValue('');
            $$('enlistedFromVal').setValue(0);
            $$('enlistedToVal').setValue(0);
            $$('rankAtDischarge').setValue('');
            $$('nonHonourableDetails').setValue('');

            $$('typeOfDischarge').clear();
            $$('typeOfDischarge').add('', '(N/A)');

            $$('enlistedFrom').disable();
            $$('enlistedTo').disable();
            $$('enlistedFromVal').disable();
            $$('enlistedToVal').disable();
            $$('rankAtDischarge').disable();
            $$('typeOfDischarge').disable();
            $$('nonHonourableDetails').disable();
        } else {
            $$('typeOfDischarge').clear();
            bindToEnum('typeOfDischarge', DischargeTypes, DischargeTypes.UNSPECIFIED);

            $$('enlistedFrom').enable();
            $$('enlistedTo').enable();
            $$('enlistedFromVal').enable();
            $$('enlistedToVal').enable();
            $$('rankAtDischarge').enable();
            $$('typeOfDischarge').enable();
            $$('nonHonourableDetails').enable();
        }
    }

    $$('branch').onChange(enableDisableMilitary);

    $$('typeOfDischarge').onChange(dischargeType => {
        if (dischargeType !== '' && dischargeType !== 'H') {
            $$('nonHonourableDetails').enable();
        } else {
            $$('nonHonourableDetails').disable();
        }
    });

    $$('crimeGrp').onChange(value => {
        if (value === 'Y') {
            $$('crimeDesc').enable();
        } else {
            $$('crimeDesc').clear();
            $$('crimeDesc').disable();
        }
    });

    $$('companyGroup').onChange(value => {
        if (value === 'Y') {
            $$('when').enable();
        } else {
            $$('when').clear();
            $$('when').disable();
        }
    });

    $$('generateLogin').onclick(HrEmployee.generateLoginAndPassword);

    $$('save').onclick(HrEmployee.save);

    $$('reset').onclick(HrEmployee.reset);

    //==================================================================================================================
    // Main event handlers end.
    //==================================================================================================================

    HrEmployee.loadPersonBackground = async () => {
        const inData = {
            personId: HrEmployee.personId
        };
        const data = await AWS.callSoap(HrEmployee.WS, 'loadPersonBackground', inData);
        if (data.wsStatus !== '0')
            return;
        $$('companyGroup').setValue(data.workedFor);
        $$('crimeGrp').setValue(data.convicted);
        $$('crimeDesc').setValue(data.convictedDescription);

        if (data.militaryBranch && data.militaryBranch !== 'U')
            $$('branch').setValue(data.militaryBranch);

        if (data.enlistFromMonth && data.enlistFromMonth !== '0')
            $$('enlistedFrom').setValue(data.enlistFromMonth);

        if (data.enlistToMonth && data.enlistToMonth !== '0')
            $$('enlistedTo').setValue(data.enlistToMonth);

        $$('rankAtDischarge').setValue(data.dischargeRank);

        enableDisableMilitary();

        if (data.dischargeType)
            $$('typeOfDischarge').setValue(data.dischargeType);

        $$('nonHonourableDetails').setValue(data.dischargeExplain);
        $$('enlistedFromVal').setValue(data.enlistFromYear);
        $$('enlistedToVal').setValue(data.enlistToYear);
        $$('when').setValue(data.workedForWhen);
    };
};

/**
 * Load basic tab content for the given person ID.
 */
HrEmployee.loadPersonBasic = async () => {
    const inData = {
        personId: HrEmployee.personId
    };
    const data = await AWS.callSoap(HrEmployee.WS, 'loadPersonBasic', inData);
    if (data.wsStatus !== '0')
        return;
    $$('firstName').setValue(data.fname);
    $$('middleName').setValue(data.middleName);
    $$('lastName').setValue(data.lname);
    $$('nickName').setValue(data.nickName);
    $$('sexGrp').setValue(data.sex);
    $$('workerTypeGrp').setValue(data.workerType);
    $('#ssn').val(data.ssn);
    $$('workerId').setValue(data.extRef);
    $$('dob').setValue(Number(data.dob));
    $$('email').setValue(data.personalEmail);

    HrEmployee.workerTypeChange();
};

HrEmployee.loadPersonAddress = async () => {
    const inData = {
        personId: HrEmployee.personId
    };
    const data = await AWS.callSoap(HrEmployee.WS, 'loadPersonAddress', inData);
    if (data.wsStatus !== '0')
        return;
    $$('addrLine1').setValue(data.addressLine1);
    $$('addrLine2').setValue(data.addressLine2);
    $$('city').setValue(data.city);
    $$('countries').setValue(data.country);
    $$('homePhone').setValue(data.homePhone);
    $$('workPhone').setValue(data.workPhone);
    $$('mobilePhone').setValue(data.mobilePhone);
    $$('fax').setValue(data.workFax);
    $$('zipCode').setValue(data.zipPostalCode);
    $$('county').setValue(data.county);

    if ($$('state').isVisible()) {
        $$('state').setValue(data.stateProvince);
    } else {
        $$('stateDropDown').setValue(data.stateProvince);
    }
};

HrEmployee.loadPersonStatus = async () => {

    let data = await AWS.callSoap(HrEmployee.WS, 'listBenefitClasses');
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('benefitClassOverride', data, 'id', 'name');

    data = await AWS.callSoap(HrEmployee.WS, 'listEEOCategories');
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('eeoCat', data, 'eeoCategoryId', 'name');

    data = await AWS.callSoap(HrEmployee.WS, 'listEEORaces');
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('eeoRace', data, 'EEORaceId', 'name');

    let inData = {
        personId: HrEmployee.personId
    };
    data = await AWS.callSoap(HrEmployee.WS, 'loadPersonStatus', inData);
    if (data.wsStatus !== '0')
        return;
    $$('hireDate').setValue(DateUtils.intToStr4(data.hireDate));
    $$('hrAdmin').setValue(data.hrAdmin === 'true');
    $$('compCode').setValue(data.workersCompCode);
    $$('statusDate').setValue(DateUtils.intToStr4(data.employeeStatusDate));
    $$('status').setValue(data.employeeStatusName);
    $$('position').setValue(data.positionName);
    $$('jobTitle').setValue(data.jobTitle);
    $$('wage').setValue(data.wageAmount);
    $$('wageType').setValue(data.wageTypeName);
    $$('eeoCat').setValue(data.eeoCategoryId);
    $$('eeoRace').setValue(data.eeoRaceId);
    $$('benefitClassOverride').setValue(data.benefitClassId);
    $$('citizenOf').setValue(data.citizenship);
    $$('visa').setValue(data.visa);
    $$('visaExpiration').setValue(Number(data.visaExpirationDate));
    $$('visaStatus').setValue(Number(data.visaStatusDate));
    $$('i9-part1').setValue(data.i9Part1 === 'true');
    $$('i9-part2').setValue(data.i9Part2 === 'true');
    $$('i9p1-confirmation').setValue(data.i9p1confirmation);
    $$('i9p2-confirmation').setValue(data.i9p2confirmation);
    $$('i9p1-confirm-who').setValue(data.i9p1who);
    $$('i9p2-confirm-who').setValue(data.i9p2who);
    $$('i9p1-confirm-when').setValue(data.i9p1when);
    $$('i9p2-confirm-when').setValue(data.i9p2when);
    $$('hoursPerWeek').setValue(data.hoursPerWeek);
    $$('medicareGrp').setValue(data.medicare);
    $$('hicNumber').setValue(data.hicNumber);
    $$('inhBenefitClass').setValue(data.inheritedBenefitClass);
};

HrEmployee.loadPersonMisc = async () => {
    let inData = {
        personId: HrEmployee.personId
    };
    let data = await AWS.callSoap(HrEmployee.WS, 'loadPersonMisc', inData);
    if (data.wsStatus !== '0')
        return;
    $$('tobUseGrp').setValue('tobaccoUse');
    $$('driversLicenseExpiry').setValue(Number(data.driversLicenseExpirationDate));
    $$('driversLicenseNumber').setValue(data.driversLicenseNumber);
    $$('driversLicenseState').setValue(data.driversLicenseState);
    $$('autoInsCarrier').setValue(data.automotiveInsuranceCarrier);
    $$('autoInsCoverage').setValue(data.automotiveInsuranceCoverage);
    $$('autoInsExpire').setValue(Number(data.automotiveInsuranceExpirationDate));
    $$('autoInsPolicyNo').setValue(Number(data.automotiveInsurancePolicyNumber));
    $$('autoInsBegin').setValue(Number(data.automotiveInsuranceStartDate));
    $$('workerHeight').setValue(Number(data.height));
    $$('workerWeight').setValue(Number(data.weight));
};

HrEmployee.loadLoginGroup = async () => {
    let inData = {
        personId: HrEmployee.personId
    };
    let data = await AWS.callSoap(HrEmployee.WS, 'loadPersonLogin', inData);
    if (data.wsStatus !== '0')
        return;
    $$('loginId').setValue(data.login);
    $$('password').setValue(data.password);
    $$('confirmPassword').setValue(data.password);
    $$('loginStatusGrp').setValue(data.canLogin);
    $$('personId').setValue(HrEmployee.personId);

    data = await AWS.callSoap(HrEmployee.WS, 'searchSecurityGroups', inData);
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('securityGroup', data, 'groupId', 'name', '(choose)');
    if (data.selectedItem)
        $$('securityGroup').setValue(data.selectedItem.groupId);

    inData.searchTopLevelOnly = true;
    data = await AWS.callSoap(HrEmployee.WS, 'searchScreenGroups', inData);
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('screenGroup', data, 'id', '', '(choose)',
        'screenDef', item => {
            return `${item.extId} - ${item.title}`;
        });
    if (data.selectedItem)
        $$('screenGroup').setValue(data.selectedItem.id);

    data = await AWS.callSoap(HrEmployee.WS, 'searchNoCompanyScreenGroups', inData);
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('noCompScreenGroup', data, 'id', '', '(choose)',
        'screenDef', item => {
            return `${item.extId} - ${item.title}`;
        });
    const hasLogin = $$('loginId').getValue().length > 0;
    $$('assignLogin').setValue(hasLogin);
    HrEmployee.toggleAssignLogin(!hasLogin);
};

HrEmployee.loadPersonTime = async () => {
    let inData = {
        personId: HrEmployee.personId
    };
    let data = await AWS.callSoap(HrEmployee.WS, 'loadPersonTime', inData);
    if (data.wsStatus !== '0')
        return;
    $$('timeLogCheckBox').setValue(data.timeLog === 'true');
    $$('overtimeLogoutCheckBox').setValue(data.overtimeLogout === 'true');
    $$('workHoursNumericTextInput').setValue(data.workHours);
    $$('breakHoursNumericTextInput').setValue(data.breakHours);
    $$('timesheetCheckbox').setValue(data.autoTimesheet === 'true');
};

HrEmployee.loadProjects = async () => {
    let inData = {
        personId: HrEmployee.personId
    };
    let data = await AWS.callSoap(HrEmployee.WS, 'searchProjects', inData);
    if (data.wsStatus !== '0')
        return;
    fillDropDownFromService('employeeOverride', data, 'projectId', '', '(choose)',
        'item', item => {
            return `${item.projectName.trim()} - ${item.description}`;
        });

    data = await AWS.callSoap(HrEmployee.WS, 'getInheritedDefaultProject', inData);
    if (data.wsStatus !== '0')
        return;
    $$('projectInheritedFrom').setValue(data.projectFormatted);
};

/**
 * Change title label value according to the employee type.
 */
HrEmployee.workerTypeChange = () => {

    if ($$('workerTypeGrp').getValue() === 'E')
        Utils.setText('screenTitle', "Employee Detail: ");
    else if ($$('workerTypeGrp').getValue() === 'C')
        Utils.setText('screenTitle', "Independent Contractor Detail: ");
    else
        Utils.setText('screenTitle', "Detail: ");
};

HrEmployee.validateNewOrSave = () => {
    const branch = $$('branch').getValue();

    if (branch) {
        const typeOfDischarge = $$('typeOfDischarge').getValue();
        const typeOfDischargeData = $$('typeOfDischarge').getData();
        const nonHonorableDetails = $$('nonHonourableDetails').getValue();
        if (typeOfDischarge !== '' && typeOfDischargeData === '0' && nonHonorableDetails === 0) {
            new MessageDialog('Validation Error!', 'Non honorable details are required.',
                MessageDialog.error, () => {
                    HrEmployee.tabContainer.selectTab('bgTabButton');
                    $$('nonHonourableDetails').focus();
                });

            return false;
        }

        const enlistedFromYear = $$('enlistedFromVal').getValue();
        const enlistedToYear = $$('enlistedToVal').getValue();
        if (typeOfDischarge !== '') {
            if (enlistedFromYear > enlistedToYear && enlistedFromYear > 0 && enlistedToYear > 0) {
                new MessageDialog('Validation Error!', 'Enlisted from year must be before enlisted to year.',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('bgTabButton');
                        $$('enlistedFromVal').focus();
                    });

                return false;
            } else {
                if (enlistedFromYear > 0 && (enlistedFromYear > 2020 || enlistedFromYear < 1920)) {
                    new MessageDialog('Validation Error!', 'Enlisted from year must be between 1920 and 2020.',
                        MessageDialog.error, () => {
                            HrEmployee.tabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });

                    return false;
                } else if (enlistedFromYear === 0) {
                    new MessageDialog('Validation Error!', 'Enlisted from year is required.',
                        MessageDialog.error, () => {
                            HrEmployee.tabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });

                    return false;
                }

                if (enlistedToYear > 0 && (enlistedToYear > 2020 || enlistedToYear < 1920)) {
                    new MessageDialog('Validation Error!', 'Enlisted to year must be between 1920 and 2020.',
                        MessageDialog.error, () => {
                            HrEmployee.tabContainer.selectTab('bgTabButton');
                            $$('enlistedToVal').focus();
                        });

                    return false;
                } else if (enlistedToYear === 0) {
                    new MessageDialog('Validation Error!', 'Enlisted to year is required.',
                        MessageDialog.error, () => {
                            HrEmployee.tabContainer.selectTab('bgTabButton');
                            $$('enlistedToVal').focus();
                        });

                    return false;
                }

                const enlistedFromMonth = $$('enlistedFrom').getValue();
                const enlistedFromMonthData = $$('enlistedFrom').getData();
                const enlistedToMonth = $$('enlistedTo').getValue();
                const enlistedToMonthData = $$('enlistedTo').getData();

                if (enlistedFromYear === enlistedToYear) {
                    if (enlistedFromMonth !== '' && enlistedToMonth !== '' && (enlistedFromMonthData > enlistedToMonthData)) {
                        new MessageDialog('Validation Error!', 'Enlisted from date must be before enlisted to date.',
                            MessageDialog.error, () => {
                                HrEmployee.tabContainer.selectTab('bgTabButton');
                                $$('enlistedFrom').focus();
                            });

                        return false;
                    }
                }

                if (enlistedFromMonth === '') {
                    new MessageDialog('Validation Error!', 'Enlisted from month is required.',
                        MessageDialog.error, () => {
                            HrEmployee.tabContainer.selectTab('bgTabButton');
                            $$('enlistedFrom').focus();
                        });

                    return false;
                }

                if (enlistedToMonth === '') {
                    new MessageDialog('Validation Error!', 'Enlisted to month is required.',
                        MessageDialog.error, () => {
                            HrEmployee.tabContainer.selectTab('bgTabButton');
                            $$('enlistedTo').focus();
                        });

                    return false;
                }
            }
        } else {
            if (enlistedFromYear > 0 && (enlistedFromYear > 2020 || enlistedFromYear < 1920)) {
                new MessageDialog('Validation Error!', 'Enlisted from year must be between 1920 and 2020.',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('bgTabButton');
                        $$('enlistedFromVal').focus();
                    });

                return false;
            } else if (enlistedFromYear === 0 && $$('branch').getValue() !== '') {
                new MessageDialog('Validation Error!', 'Enlisted from year is required.',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('bgTabButton');
                        $$('enlistedFromVal').focus();
                    });

                return false;
            }

            if ($$('enlistedFrom').getValue() === '' && $$('branch').getValue() !== '') {
                new MessageDialog('Validation Error!', 'Enlisted from month is required.',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('bgTabButton');
                        $$('enlistedFrom').focus();
                    });

                return false;
            }
        }
    }

    if ($$('companyGroup').getValue() === 'Y' && $$('when').getValue().length === 0) {
        new MessageDialog('Validation Error!', 'When they worked for the company is required.',
            MessageDialog.error, () => {
                HrEmployee.tabContainer.selectTab('bgTabButton');
                $$('when').focus();
            });

        return false;
    }

    return true;
};

HrEmployee.generateLoginAndPassword = async () => {
    if ($$('firstName').isError('First name')) {
        return HrEmployee.tabContainer.selectTab('basicTabButton');
    }

    if ($$('lastName').isError('Last name')) {
        return HrEmployee.tabContainer.selectTab('basicTabButton');
    }

    let inData = {
        id: HrEmployee.personId
    };
    let data = await AWS.callSoap(HrEmployee.WS, 'generateLoginAndPassword', inData);
    if (data.wsStatus !== '0')
        return;
    if (data.wsStatus === '2') {
        new MessageDialog('Error', `Couldn't generate login ID : ${data.wsMessage}`, MessageDialog.error, () => {
            $$('generateLogin').focus();
        });
    } else {
        $$('loginId').setValue(data.login);
        $$('password').setValue(data.password);
        $$('confirmPassword').setValue(data.password);
    }
};

HrEmployee.save = async () => {
    let inData, data;

    /**
     * Handle the error messages upon saving a section.
     */
    if ($$('firstName').isError('First name'))
        return;
    if ($$('middleName').isError('Middle name'))
        return;
    if ($$('lastName').isError('Last name'))
        return;
    if ($$('addrLine1').isError('Street line 1'))
        return;
    if ($$('addrLine2').isError('Street line 2'))
        return;
    if ($$('city').isError('City'))
        return;
    if ($$('zipCode').isError('Zip code'))
        return;
    if ($$('county').isError('County'))
        return;

    if (!$$('i9-part1').getValue() && $$('i9-part2').getValue()) {
        Utils.showMessage('Error', "I-9 Part 2 can't be completed until Part 1 is completed.");
        return;
    }

    const handleSaveError = data => {
        if (data && data.wsStatus === '2') {
            new MessageDialog('Validation Error!', `Server returned error: ${data.wsMessage}`, MessageDialog.error);

            return false;
        }

        {
            let phone = $$('homePhone').getValue();
            if (phone)
                phone = phone.trim();
            if (phone  &&  !Utils.isValidPhoneNumber(phone))
                Utils.showMessage('Warning', 'Home phone is invalid.  Worker saved with bad home phone number.');
        }

        {
            let phone = $$('workPhone').getValue();
            if (phone)
                phone = phone.trim();
            if (phone  &&  !Utils.isValidPhoneNumber(phone))
                Utils.showMessage('Warning', 'Work phone is invalid.  Worker saved with bad work phone number.');
        }

        {
            let phone = $$('mobilePhone').getValue();
            if (phone)
                phone = phone.trim();
            if (phone  &&  !Utils.isValidPhoneNumber(phone))
                Utils.showMessage('Warning', 'Mobile phone is invalid.  Worker saved with bad mobile phone number.');
        }

        {
            let phone = $$('fax').getValue();
            if (phone)
                phone = phone.trim();
            if (phone  &&  !Utils.isValidPhoneNumber(phone))
                Utils.showMessage('Warning', 'Fax number is invalid.  Worker saved with bad fax number.');
        }

        return true;
    };

    // Validate the basic tab content and exit if the data is invalid.
    if (HrEmployee.ssnRequired) {
        const ssnCtl = $$('ssn');
        const ssn = ssnCtl.getValue();
        if (ssn && !Utils.isValidSsn(ssn)) {
            await Utils.showMessage('Error', 'Invalid SSN.');
            ssnCtl.focus();
            return HrEmployee.tabContainer.selectTab('basicTabButton');
        }
    }


    //==================================================================================================================
    // Save the basic details.
    //==================================================================================================================

    if (HrEmployee.viewedBasic) {
        inData = {
            personId: HrEmployee.personId,
            fname: $$('firstName').getValue(),
            middleName: $$('middleName').getValue(),
            lname: $$('lastName').getValue(),
            nickName: $$('nickName').getValue(),
            sex: $$('sexGrp').getValue(),
            ssn: Utils.formatSsn($('#ssn').val()),
            workerType: $$('workerTypeGrp').getValue(),
            extRef: $$('workerId').getValue(),
            dob: $$('dob').getIntValue(),
            personalEmail: $$('email').getValue()
        };
        let r = await AWS.callSoap(HrEmployee.WS, 'savePersonBasic', inData);
        if (r.wsStatus !== '0')
            return;

        if (!handleSaveError(r)) {
            let firstName = $$('firstName').getValue();
            let lastName = $$('lastName').getValue();

            Utils.saveData(HR_PERSON_NAME, formatDisplayName(firstName, null, lastName));

            // Update recent people array.
            let recentPeople = Utils.getData(HR_RECENT_PEOPLE);

            if (recentPeople) {
                recentPeople.forEach(recentPerson => {
                    if (recentPerson[HR_PERSON_ID] === HrEmployee.personId) {
                        recentPerson[HR_PERSON_NAME] = formatDisplayName(firstName, null, lastName);
                    }
                });
            }

            // Update screen status label.
            Utils.setText('screenStatus', formatDisplayName(firstName, null, lastName));
        }
    }

    //==================================================================================================================
    // Save the address details.
    //==================================================================================================================

    if (HrEmployee.viewedAddress) {
        let stateSelection = Utils.isVisible('stateDropDown');

        inData = {
            personId: HrEmployee.personId,
            addressLine1: $$('addrLine1').getValue(),
            addressLine2: $$('addrLine2').getValue(),
            city: $$('city').getValue(),
            country: $$('countries').getValue(),
            county: $$('county').getValue(),
            homePhone: $$('homePhone').getValue(),
            workPhone: $$('workPhone').getValue(),
            mobilePhone: $$('mobilePhone').getValue(),
            workFax: $$('fax').getValue(),
            stateProvince: stateSelection ? $$('stateDropDown').getValue() : $$('state').getValue(),
            zipPostalCode: $$('zipCode').getValue()
        };
        data = await AWS.callSoap(HrEmployee.WS, 'savePersonAddress', inData);
        if (data.wsStatus !== '0')
            return;
        handleSaveError(data);
    }
    //==================================================================================================================
    // Save the status details.
    //==================================================================================================================

    if (HrEmployee.viewedStatus) {
        inData = {
            personId: HrEmployee.personId,
            hrAdmin: $$('hrAdmin').getValue(),
            workersCompCode: $$('compCode').getValue(),
            jobTitle: $$('jobTitle').getValue(),
            eeoCategoryId: $$('eeoCat').getValue(),
            eeoRaceId: $$('eeoRace').getValue(),
            benefitClassId: $$('benefitClassOverride').getValue(),
            citizenship: $$('citizenOf').getValue(),
            visa: $$('visa').getValue(),
            visaExpirationDate: $$('visaExpiration').getIntValue(),
            visaStatusDate: $$('visaStatus').getIntValue(),
            hoursPerWeek: $$('hoursPerWeek').getValue(),
            i9Part1: $$('i9-part1').getValue(),
            i9Part2: $$('i9-part2').getValue(),
            i9p1confirmation: $$('i9p1-confirmation').getValue(),
            i9p2confirmation: $$('i9p2-confirmation').getValue(),
            medicare: $$('medicareGrp').getValue(),
            hicNumber: $$('hicNumber').getValue()
        };
        data = await AWS.callSoap(HrEmployee.WS, 'savePersonStatus', inData);
        if (data.wsStatus !== '0')
            return;
        handleSaveError(data);
        if (HrEmployee.viewedStatus)
            HrEmployee.loadPersonStatus();  // need to reload in order to get who and time I9 changed from server
    }

    //==================================================================================================================
    // Save the background details.
    //==================================================================================================================

    if (HrEmployee.viewedBackground) {
        if (HrEmployee.validateNewOrSave()) {
            let dischargeType = $$('typeOfDischarge').getValue();
            HrEmployee.dischargeType = dischargeType !== '0' ? dischargeType : $$('nonHonourableDetails').getValue()
        } else
            return;

        inData = {
            personId: HrEmployee.personId,
            enlistFromYear: $$('enlistedFromVal').getValue(),
            enlistToYear: $$('enlistedToVal').getValue(),
            workedForWhen: $$('when').getValue(),
            workedFor: $$('companyGroup').getValue(),
            convicted: $$('crimeGrp').getValue(),
            convictedDescription: $$('crimeDesc').getValue(),
            militaryBranch: $$('branch').getValue(),
            enlistFromMonth: $$('enlistedFrom').getValue(),
            enlistToMonth: $$('enlistedTo').getValue(),
            dischargeRank: $$('rankAtDischarge').getValue(),
            dischargeType: HrEmployee.dischargeType,
            dischargeExplain: $$('nonHonourableDetails').getValue()
        };
        data = await AWS.callSoap(HrEmployee.WS, 'savePersonBackground', inData);
        if (data.wsStatus !== '0')
            return;
        handleSaveError(data);
    }

    //==================================================================================================================
    // Save the misc details.
    //==================================================================================================================

    if (HrEmployee.viewedMisc) {
        inData = {
            personId: HrEmployee.personId,
            tobaccoUse: $$('tobUseGrp').getValue(),
            driversLicenseExpirationDate: $$('driversLicenseExpiry').getIntValue(),
            driversLicenseNumber: $$('driversLicenseNumber').getValue(),
            driversLicenseState: $$('driversLicenseState').getValue(),
            automotiveInsuranceCarrier: $$('autoInsCarrier').getValue(),
            automotiveInsuranceCoverage: $$('autoInsCoverage').getValue(),
            automotiveInsuranceExpirationDate: $$('autoInsExpire').getIntValue(),
            automotiveInsurancePolicyNumber: $$('autoInsPolicyNo').getValue(),
            automotiveInsuranceStartDate: $$('autoInsBegin').getIntValue(),
            height: $$('workerHeight').getValue(),
            weight: $$('workerWeight').getValue(),
            defaultProjectId: $$('employeeOverride').getValue()
        };
        data = await AWS.callSoap(HrEmployee.WS, 'savePersonMisc', inData);
        if (data.wsStatus !== '0')
            return;
        handleSaveError(data);
    }

    //==================================================================================================================
    // Save the login details.
    //==================================================================================================================

    if (HrEmployee.viewedLogin) {
        // See if the user requested a login.
        if ($$('assignLogin').getValue() === true) {
            if ($$('loginId').isError('Login ID')) {
                return HrEmployee.tabContainer.selectTab('loginTabButton');
            }

            if ($$('password').isError('Password')) {
                return HrEmployee.tabContainer.selectTab('loginTabButton');
            }

            if ($$('password').getValue() !== $$('confirmPassword').getValue()) {
                return new MessageDialog('Validation Error!', 'Passwords must match',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('loginTabButton');
                        $$('confirmPassword').focus();
                    });
            }

            if ($$('screenGroup').getValue() === '') {
                return new MessageDialog('Validation Error!', 'Screen group is required',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('loginTabButton');
                        $$('screenGroup').focus();
                    });
            }

            if ($$('securityGroup').getValue() === '') {
                return new MessageDialog('Validation Error!', 'Security group is required',
                    MessageDialog.error, () => {
                        HrEmployee.tabContainer.selectTab('loginTabButton');
                        $$('securityGroup').focus();
                    });
            }
        }

        let assignLogin = $$('assignLogin').getValue();

        inData = {
            personId: HrEmployee.personId,
            login: assignLogin ? $$('loginId').getValue() : null,
            empPassword: assignLogin ? $$('password').getValue() : null,
            screenGroupId: assignLogin ? $$('screenGroup').getValue() : null,
            noCompanyScreenGroupId: assignLogin && HrEmployee.multiCompSupport ? $$('noCompScreenGroup').getValue() : null,
            securityGroupId: assignLogin ? $$('securityGroup').getValue() : null,
            canLogin: assignLogin ? $$('loginStatusGrp').getValue() : null
        };
        data = await AWS.callSoap(HrEmployee.WS, 'savePersonLogin', inData);
        if (data.wsStatus !== '0')
            return;
        handleSaveError(data);
    }

    //==================================================================================================================
    // Save the time details.
    //==================================================================================================================

    if (HrEmployee.viewedTime) {
        inData = {
            personId: HrEmployee.personId,
            overtimeLogout: $$('overtimeLogoutCheckBox').getValue(),
            timeLog: $$('timeLogCheckBox').getValue(),
            workHours: $$('workHoursNumericTextInput').getValue(),
            breakHours: $$('breakHoursNumericTextInput').getValue(),
            autoTimesheet: $$('timesheetCheckbox').getValue()
        };
        data = await AWS.callSoap(HrEmployee.WS, 'savePersonTime', inData);
        if (data.wsStatus !== '0')
            return;
        handleSaveError(data);
    }

    Utils.clearSomeControlValueChanged(true);
};

HrEmployee.reset = () => {
    HrEmployee.viewedBasic = true;
    HrEmployee.viewedAddress = false;
    HrEmployee.viewedStatus = false;
    HrEmployee.viewedBackground = false;
    HrEmployee.viewedMisc = false;
    HrEmployee.viewedLogin = false;
    HrEmployee.viewedTime = false;

    let selectedTabId = 'basicTabButton';
    if (HrEmployee.tabContainer.selectedTabButton)
        selectedTabId = HrEmployee.tabContainer.selectedTabButton.id;

    switch (selectedTabId) {
        case 'basicTabButton':
            HrEmployee.viewedBasic = true;
            HrEmployee.loadPersonBasic();
            break;
        case 'addressTabButton':
            HrEmployee.viewedAddress = true;
            HrEmployee.loadPersonAddress();
            break;
        case 'posAndStatTabButton':
            HrEmployee.viewedStatus = true;
            HrEmployee.loadPersonStatus();
            break;
        case 'bgTabButton':
            HrEmployee.viewedBackground = true;
            HrEmployee.loadPersonBackground();
            break;
        case 'miscTabButton':
            HrEmployee.viewedMisc = true;
            HrEmployee.loadPersonMisc();
            if (Utils.getData(HR_PERSON_TYPE) !== 'Dep')
                HrEmployee.loadProjects();
            break;
        case 'loginTabButton':
            HrEmployee.viewedLogin = true;
            HrEmployee.loadLoginGroup();
            break;
        case 'timeTabButton':
            HrEmployee.viewedTime = true;
            HrEmployee.loadPersonTime();
            break;
    }
    Utils.clearSomeControlValueChanged(true);
};

HrEmployee.initScreen();