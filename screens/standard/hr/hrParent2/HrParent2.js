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


/* global AWS, Utils, $$, Server */

'use strict';


(async function () {
    const SoapService = 'StandardHrHrParent';
    const RestService = 'com.arahant.services.standard.hr.hrParent';
    const SAVE_KEY = "HrParent2Data";
    let resultsGrid;
    let accessLevel;
    let checkMaxEmployees;
    let newEmpGroupId;
    let firstPerson;
    let lastPerson;
    let prevFirstPerson;
    let prevLastPerson;
    let prevSearchType;
    let addWorkerTabContainer;
    let ssnRequired;
    let canEditHicNum;
    let multiCompSupport;
    let screenGroupId;
    let securityGroupId;
    let dependantId;
    let applicantId;
    let dischargeType;
    const ssnCtl = $('#ssnInput');

    // Check application constraints.
    let data = await AWS.callSoap(SoapService, 'checkRight');
    if (data.wsStatus !== '0')
        return;
    accessLevel = data.accessLevel;
    checkMaxEmployees = data.checkMaxEmployees;

    // Load meta information.
//    data = await AWS.callSoap(SoapService, 'loadMeta');
//    if (data.wsStatus !== '0')
//        return;
//    newEmpGroupId = data.newEmpOpenScreenGroupId;

    // Load the employee statuses.
    AWS.callSoap(SoapService, 'listEmployeeStatuses').then(data => {
        if (data.wsStatus !== '0')
            return;
        const items = Utils.assureArray(data.item);
        items.forEach(item => {
            $$('statusDropDown').add(item.employeeStatusId, item.name, item);
        });
    });

    Server.call(RestService, 'GetLabels').then(data => {
        $$('labels').addItems(data.labels, 'employee_label_id', 'name');
        $$('negative-labels').addItems(data.labels, 'employee_label_id', 'name');
        restoreSearch();
    });

    if (!Utils.getData(HR_RECENT_PEOPLE))
        Utils.saveData(HR_RECENT_PEOPLE, []);

    // Initialize the drop-downs.
    let recent = Utils.getData(HR_RECENT_PEOPLE);
    recent.forEach(item => $$('empDepDropDown').add(item[HR_PERSON_ID], item[HR_PERSON_NAME], item));

    if ($$('lastNameDropDown').size() === 0)
        bindToEnum('lastNameDropDown', StringCriteriaMatcher);

    if ($$('firstNameDropDown').size() === 0)
        bindToEnum('firstNameDropDown', StringCriteriaMatcher);

    $$('lastNameInput').focus();

    //==================================================================================================================
    // Main event handlers start.
    //==================================================================================================================

    $$('empDepDropDown').onChange(val => {
        if (val !== '')
            $$('editEmpDep').enable();
        else
            $$('editEmpDep').disable();
    });

    $$('lastNameDropDown').onChange($$('lastNameInput').focus);

    $$('firstNameDropDown').onChange($$('firstNameInput').focus);

    ssnCtl.on('focusout', () => {
        const val = ssnCtl.val();
        if (val)
            ssnCtl.val(Utils.formatSsn(val));
    });

    ssnCtl.on('input', () => {
        let val = ssnCtl.val().trim();
        if (val)
            ssnCtl.val(Utils.formatSsn(val));
    });

    $$('statusGrp').onChange(event => {
        if (event === "3")
            $$('statusDropDown').enable();
        else
            $$('statusDropDown').disable();
    });

    function savePersonInQuickList(person) {
        let selectedPeople = Utils.getData(HR_RECENT_PEOPLE);
        let isDuplicate = false;
        selectedPeople.forEach(p => {
            if (person.personId === p[HR_PERSON_ID])
                isDuplicate = true;
        });

        if (!isDuplicate) {
            const obj = {};
            obj[HR_PERSON_ID] = person.personId;
            obj[HR_PERSON_FIRST_NAME] = person.fname;
            obj[HR_PERSON_LAST_NAME] = person.lname;
            obj[HR_PERSON_MIDDLE_NAME] = person.middleName;
            obj[HR_PERSON_NAME] = formatDisplayName(person.fname, person.middleName, person.lname);
            selectedPeople.push(obj);
            Utils.saveData(HR_RECENT_PEOPLE, selectedPeople);
        }
    }

    function editPerson(person) {
        // Save data for quick list
        savePersonInQuickList(person);

        // Save data for new screens
        Utils.saveData(HR_PERSON_ID, person.personId);
        Utils.saveData(HR_PERSON_NAME, formatDisplayName(person.fname, person.middleName, person.lname));

        Framework.getChild();
    }

    $$('editEmpDep').onclick(() => {
        const ql = $$('empDepDropDown').getData();
        const person = {};
        person.personId = ql[HR_PERSON_ID];
        person.fname = ql[HR_PERSON_FIRST_NAME];
        person.lname = ql[HR_PERSON_LAST_NAME];
        person.middleName = ql[HR_PERSON_MIDDLE_NAME];

        editPerson(person);
    });

    /**
     * Resets the screen to default.
     */
    $$('reset').onclick(() => {
        $$('empDepDropDown').setValue('');
        $$('lastNameDropDown').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('lastNameInput').clear();
        ssnCtl.val('');
        $$('firstNameDropDown').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('firstNameInput').clear();
        $$('statusGrp').setValue(1);
        $$('statusDropDown').setValue('');
        $$('statusDropDown').disable();
        $$('employeeGrp').clear();
        $$('assignedGrp').clear();
        $$('assigned-from').clear();
        $$('assigned-to').clear();
        firstPerson = lastPerson = null;
        resultsGrid.clear();
        $$('labels').clearSelection();
        $$('negative-labels').clearSelection();
        $$('phone').clear();
    });

    function restoreSearch() {
        const d = Utils.getData(SAVE_KEY);
        if (d) {
            $$('assignedGrp').setValue(d.assigned);
            $$('assigned-from').setValue(d.assignedFrom);
            $$('assigned-to').setValue(d.assignedTo);
            $$('lastNameInput').setValue(d.lastName);
            $$('lastNameDropDown').setValue(d.lastNameSearchType);
            ssnCtl.val(d.ssn);
            $$('firstNameDropDown').setValue(d.firstNameSearchType);
            $$('firstNameInput').setValue(d.firstName);
            $$('statusGrp').setValue(d.activeIndicator);
            $$('statusDropDown').setValue(d.employeeStatusId);
            $$('employeeGrp').setValue(d.workerType);
            $$('labels').setValue(d.labels);
            $$('negative-labels').setValue(d.negativeLabels);
            $$('phone').setValue(d.phone);
            search(0);
        }
    }

    /*
    searchType
        0 = search from beginning
        1 = previous (not implemented)
        2 = next
        3 = get same page again
     */
    async function search(searchType) {
        const assigned = $$('assignedGrp').getValue();
        const assignedFrom = $$('assigned-from').getIntValue();
        const assignedTo = $$('assigned-to').getIntValue();
        if (assigned !== "either")
            if (assignedFrom < 20100101) {
                Utils.showMessage('Error', 'Assigned from is required.');
                return;
            } else if (assignedTo < 20100101) {
                Utils.showMessage('Error', 'Assigned to is required.');
                return;
            }

        let lastName = $$('lastNameInput').getValue();
        let lastNameCriteria = $$('lastNameDropDown').getValue();
        let ssn = ssnCtl.val();
        let firstNameCriteria = $$('firstNameDropDown').getValue();
        let firstName = $$('firstNameInput').getValue();
        let statusGrpVal = $$('statusGrp').getValue();
        let empStatus = $$('statusDropDown').getValue();

        if (searchType === 3) {
            searchType = prevSearchType;
            firstPerson = prevFirstPerson;
            lastPerson = prevLastPerson;
        } else {
            prevFirstPerson = firstPerson;
            prevLastPerson = lastPerson;
            prevSearchType = searchType;
        }

        const inData = {
            ssn: ssn,
            firstName: firstName,
            lastName: lastName,
            activeIndicator: statusGrpVal,
            firstNameSearchType: firstNameCriteria,
            lastNameSearchType: lastNameCriteria,
            searchEmployees: "true",
            employeeStatusId: empStatus,
            workerType: $$('employeeGrp').getValue(),
            assigned: assigned,
            assignedFrom: assignedFrom,
            assignedTo: assignedTo,
            firstPerson: firstPerson,
            lastPerson: lastPerson,
            searchType: searchType,
            labels: $$('labels').getValue(),
            negativeLabels: $$('negative-labels').getValue(),
            phone: $$('phone').getValue(),
            export: false
        };

        Utils.saveData(SAVE_KEY, inData);

        Utils.waitMessage('Performing search; Please wait.');
        const data = await Server.call(RestService, 'SearchPersons', inData);
        Utils.waitMessageEnd();

        resultsGrid.clear();

        if (!data._Success)
            return;

        resultsGrid.addRecords(data.persons);
        let totalRecords = Number(data.total);
        let msg = 'Total records:  ' + Utils.format(totalRecords, "C", 0, 0);
        if (totalRecords >= Number(data.cap) && totalRecords !== data.persons.length)
            msg += ' (displaying ' + data.persons.length + ', page ' + data.groupNumber + ')';
        else if (totalRecords !== data.persons.length)
            msg += ' (displaying ' + data.persons.length + ')';
        $$('status-label').setValue(msg);
        firstPerson = data.persons.length ? data.persons[0].personId : null;
        lastPerson = data.persons.length ? data.persons[data.persons.length - 1].personId : null;
        $$('edit').disable();
        $$('next').enable(totalRecords > (data.groupNumber - 1) * 100 + data.persons.length);
    }

    $$('export').onclick(async () => {
        const assigned = $$('assignedGrp').getValue();
        const assignedFrom = $$('assigned-from').getIntValue();
        const assignedTo = $$('assigned-to').getIntValue();
        if (assigned !== "either")
            if (assignedFrom < 20100101) {
                Utils.showMessage('Error', 'Assigned from is required.');
                return;
            } else if (assignedTo < 20100101) {
                Utils.showMessage('Error', 'Assigned to is required.');
                return;
            }

        let lastName = $$('lastNameInput').getValue();
        let lastNameCriteria = $$('lastNameDropDown').getValue();
        let ssn = ssnCtl.val();
        let firstNameCriteria = $$('firstNameDropDown').getValue();
        let firstName = $$('firstNameInput').getValue();
        let statusGrpVal = $$('statusGrp').getValue();
        let empStatus = $$('statusDropDown').getValue();

        let inData = {
            ssn: ssn,
            firstName: firstName,
            lastName: lastName,
            activeIndicator: statusGrpVal,
            firstNameSearchType: firstNameCriteria,
            lastNameSearchType: lastNameCriteria,
            searchEmployees: "true",
            employeeStatusId: empStatus,
            workerType: $$('employeeGrp').getValue(),
            assigned: assigned,
            assignedFrom: assignedFrom,
            assignedTo: assignedTo,
            firstPerson: firstPerson,
            lastPerson: lastPerson,
            searchType: 0,
            labels: $$('labels').getValue(),
            negativeLabels: $$('negative-labels').getValue(),
            phone: $$('phone').getValue(),
            export: true
        };

        const res = await Server.call(RestService, 'SearchPersons', inData);
        if (res._Success) {
            Utils.showReport(res.reportUrl);
        }
    });

    $$('search').onclick(() => {
        search(0);
    });

    Utils.setEnterFunction(() => {
        search(0);
    });

    /*
    $$('previous').onclick(() => {
        search(1);
    });
     */

    function selectPerson() {
        const person = resultsGrid.getSelectedRow();
        if (person) {
            savePersonInQuickList(person);
            editPerson(person);
        }
    }

    $$('next').onclick(() => {
        search(2);
    });

    /**
     * Contains the functionality for the Add Employee dialog.
     */
    function newWorker() {
        /**
         * Show a dropdown or a text input for entering state, depending on the value of the country drop down.
         */
        function filterState() {
            const states = getStatesForCountry($$('countries').getValue());

            if (states != null) {
                statesToDropDown('stateDropDown', states);

                $$('stateDropDown').show();
                $$('state').hide();
            } else {
                $$('stateDropDown').hide();
                $$('state').show();
            }
        }

        function toggleAssignLogin(disabled) {
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

                $$('showPasswords').disable();
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

                $$('showPasswords').enable();
                $$('noCompScreenGroup').enable();
                $$('noCompScreenGrpSearch').enable();
            }
        }

        function resetDialog() {
            // Basic tab.
            $$('firstName').clear();
            $('#ssn').val('');
            $$('middleName').clear();
            $$('workerId').clear();
            $$('lastName').clear();
            $$('dob').clear();
            $$('nickName').clear();
            $$('email').clear();
            $$('sexGrp').setValue('M');
            $$('workerTypeGrp').setValue('E');
            $$('phone').clear();

            // Address tab.
            $$('addrLine1').clear();
            $$('homePhone').clear();
            $$('addrLine2').clear();
            $$('workPhone').clear();
            $$('countries').clear();
            $$('mobilePhone').clear();
            $$('city').clear();
            $$('fax').clear();
            $$('stateDropDown').clear();
            $$('state').clear();
            $$('zipCode').clear();
            $$('county').clear();

            // Position tab.
            $$('status').clear();
            $$('benefitClass').clear();
            $$('statusDate').clear();
            $$('hrAdmin').clear();
            $$('citizenOf').clear();
            $$('position').clear();
            $$('visa').clear();
            $$('jobTitle').clear();
            $$('visaStatus').clear();
            $$('i9Completed').clear();
            $$('wageType').clear();
            $$('visaExpiration').clear();
            $$('wage').clear();
            $$('medicareGrp').setValue('U');
            $$('eeoCat').clear();
            $$('eeoRace').clear();
            $$('hicNumber').clear();
            $$('hicNumber').disable();

            // Background tab.
            $$('branch').clear();
            $$('enlistedFrom').clear();
            $$('enlistedFromVal').clear();
            $$('enlistedTo').clear();
            $$('enlistedToVal').clear();
            $$('rankAtDischarge').clear();
            $$('typeOfDischarge').clear();
            $$('typeOfDischarge').clear();
            $$('nonHonourableDetails').clear();
            $$('crimeGrp').setValue('U');
            $$('crimeDesc').clear();
            $$('crimeDesc').disable();
            $$('companyGroup').setValue('N');
            $$('when').clear();
            $$('when').disable();

            // Misc tab.
            $$('tobUseGrp').setValue('U');
            $$('workerHeight').clear();
            $$('compCode').clear();
            $$('workerWeight').clear();
            $$('driversLicenseNumber').clear();
            $$('driversLicenseState').clear();
            $$('driversLicenseExpiry').clear();
            $$('autoInsCarrier').clear();
            $$('autoInsPolicyNo').clear();
            $$('autoInsBegin').clear();
            $$('autoInsExpire').clear();
            $$('autoInsCoverage').clear();
            $$('projectInheritedFrom').clear();
            $$('employeeOverride').clear();

            // Login tab.
            $$('assignLogin').clear();
            $$('loginId').clear();
            $$('password').clear();
            $$('confirmPassword').clear();
            $$('showPasswords').clear();
            $$('screenGroup').clear();
            $$('securityGroup').clear();
            $$('loginStatusGrp').setValue('true');
            $$('noCompScreenGroup').clear();

            // Disable the login tab content.
            toggleAssignLogin(true);

            // Select the first tab.
            addWorkerTabContainer.selectTab('basicTabButton');
        }

        /**
         * Initialize the new worker dialog.
         */
        async function initDialog() {
            // Setup tab layout.
            addWorkerTabContainer = new TabContainer('addWorkerTabContainer');

            resetDialog();

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

            let data = await AWS.callSoap(SoapService, 'loadMeta');
            if (data.wsStatus !== '0')
                return;

            ssnRequired = data.ssnRequired;
            canEditHicNum = data.canEditHicNumber;
            multiCompSupport = data.multipleCompanySupport;

            if (multiCompSupport === 'true') {
                showContainer('noCompScreenGrpContainer');
            }

            //////////////////////////////////////////////////////////////////////////////

            const p1 = AWS.callSoap(SoapService, 'listEEOCategories');

            const p2 = AWS.callSoap(SoapService, 'listEEORaces');

            const p3 = AWS.callSoap(SoapService, 'listEmployeeStatuses');

            const p4 = AWS.callSoap(SoapService, 'listPositions');

            const p5 = AWS.callSoap(SoapService, 'listWageTypes');

            const p6 = AWS.callSoap(SoapService, 'listBenefitClasses');

            const p7 = AWS.callSoap(SoapService, 'getInheritedDefaultProject');

            const p8 = AWS.callSoap(SoapService, 'searchProjects');

            if (AWS.callAll([p1, p2, p3, p4, p5, p6, p7, p8],
                data => fillDropDownFromService('eeoCat', data, 'eeoCategoryId', 'name'),
                data => fillDropDownFromService('eeoRace', data, 'eeoRaceId', 'name'),
                data => fillDropDownFromService('status', data, 'employeeStatusId', 'name'),
                data => fillDropDownFromService('position', data, 'positionId', 'positionName'),
                data => fillDropDownFromService('wageType', data, 'id', 'name'),
                data => fillDropDownFromService('benefitClass', data, 'id', 'name'),
                data => $$('projectInheritedFrom').setValue(data.projectFormatted),
                data => fillDropDownFromService('employeeOverride', data, 'projectId', '', '(choose)',
                    'item', item => {
                        return `${item.projectName.trim()} - ${item.description}`;
                    })
                ))
                return;
            //////////////////////////////////////////////////////////////////////////////

            /**
             * The functionality to load screen and security groups are put in a function for multiple access, which will
             * also be called after loading dependant and applicant data.
             */
            async function loadScreenAndSecurityGroups() {
                let inData = {
                    searchTopLevelOnly: true,
                    screenGroupId: screenGroupId
                };
                AWS.callSoap(SoapService, 'searchScreenGroups', inData).then(data => {
                    if (data.wsStatus !== '0')
                        return;
                    fillDropDownFromService('screenGroup', data, 'id', '', '(choose)',
                        'screenDef', item => {
                            return `${item.extId} - ${item.title}`;
                        });

                    fillDropDownFromService('noCompScreenGroup', data, 'id', '', '(choose)',
                        'screenDef', item => {
                            return `${item.extId} - ${item.title}`;
                        });
                });

                inData = {
                    securityGroupId: securityGroupId
                };
                data = await AWS.callSoap(SoapService, 'searchSecurityGroups', inData);
                if (data.wsStatus !== '0')
                    return;
                fillDropDownFromService('securityGroup', data, 'groupId', 'name', '(choose)');
            }

            // Initial call.
            loadScreenAndSecurityGroups();

            if (dependantId) {
                let inData = {dependantId: dependantId};
                let data = await AWS.callSoap(SoapService, 'loadDependent', inData);
                if (data.wsStatus !== '0')
                    return;
                $$('hicNumber').setValue(data.hicNumber);
                $$('addrLine1').setValue(data.addressLine1);
                $$('addrLine2').setValue(data.addressLine2);
                $$('autoInsCarrier').setValue(data.automotiveInsuranceCarrier);
                $$('autoInsCoverage').setValue(data.automotiveInsuranceCoverage);
                $$('autoInsExpire').setValue(data.automotiveInsuranceExpirationDate);
                $$('autoInsPolicyNo').setValue(data.automotiveInsurancePolicyNumber);
                $$('autoInsBegin').setValue(data.automotiveInsuranceStartDate);
                $$('loginStatusGrp').setValue(data.canLogin);
                $$('city').setValue(data.city);
                $$('countries').setValue(data.country);
                $$('county').setValue(data.county);
                $$('dob').setValue(data.dob);
                $$('driversLicenseExpiry').setValue(data.driversLicenseExpirationDate);
                $$('driversLicenseNumber').setValue(data.driversLicenseNumber);
                $$('driversLicenseState').setValue(data.driversLicenseState);
                $$('firstName').setValue(data.firstName);
                $$('homePhone').setValue(data.homePhone);
                $$('jobTitle').setValue(data.jobTitle);
                $$('lastName').setValue(data.lastName);
                $$('loginId').setValue(data.login);
                $$('middleName').setValue(data.middleName);
                $$('mobilePhone').setValue(data.mobilePhone);
                $$('nickName').setValue(data.nickName);
                $$('password').setValue(data.password);
                $$('email').setValue(data.personalEmail);

                screenGroupId = data.screenGroupId;
                securityGroupId = data.securityGroupId;

                $$('sexGrp').setValue(data.sex);
                $('#ssn').val(data.ssn);
                $$('tobUseGrp').setValue(data.tabaccoUse);
                $$('fax').setValue(data.workFax);
                $$('workPhone').setValue(data.workPhone);
                $$('zipCode').setValue(data.zipPostalCode);

                // Set state/province depending on the visibility status of either the drop down or the text input.

                if ($$('state').isVisible())
                    $$('state').setValue(data.stateProvince);
                else
                    $$('stateDropDown').setValue(data.stateProvince);

                // Check whether there is an assigned login and enable the fields.
                if ($$('loginId').getValue().length > 0) {
                    $$('assignLogin').setValue(true);

                    // Reload screen and security groups.
                    loadScreenAndSecurityGroups();
                }
            } else if (applicantId) {
                let inData = {applicantId: applicantId};
                let data = await AWS.callSoap(SoapService, 'loadApplicant', inData);
                if (data.wsStatus !== '0')
                    return;
                $$('companyGroup').setValue(data.workedFor);
                $$('when').setValue(data.workedForWhen);
                $$('crimeGrp').setValue(data.convicted);
                $$('crimeDesc').setValue(data.convictedDescription);
                $$('addrLine1').setValue(data.addressLine1);
                $$('addrLine2').setValue(data.addressLine2);
                $$('citizenOf').setValue(data.citizenship);
                $$('city').setValue(data.city);
                $$('countries').setValue(data.country);
                $$('county').setValue(data.county);
                $$('dob').setValue(data.dob);
                $$('firstName').setValue(data.firstName);
                $$('homePhone').setValue(data.homePhone);
                $$('i9Completed').setValue(data.i9Completed);
                $$('i9Completed').setValue(data.i9Completed);
                $$('lastName').setValue(data.lastName);
                $$('middleName').setValue(data.middleName);
                $$('mobilePhone').setValue(data.mobilePhone);
                $$('nickName').setValue(data.nickName);
                $$('email').setValue(data.personalEmail);
                $$('sexGrp').setValue(data.sex);
                $('#ssn').val(data.ssn);
                $$('visa').setValue(data.visa);
                $$('visaExpiration').setValue(data.visaExpirationDate);
                $$('visaStatus').setValue(data.visaStatusDate);
                $$('fax').setValue(data.workFax);
                $$('workPhone').setValue(data.workPhone);
                $$('zipCode').setValue(data.zipPostalCode);
                $$('branch').setValue(data.militaryBranch.data);
                $$('enlistedFrom').setValue(data.enlistFromMonth.data);
                $$('enlistedTo').setValue(data.enlistToMonth.data);
                $$('enlistedFromVal').setValue(data.enlistFromYear);
                $$('enlistedToVal').setValue(data.enlistToYear);
                $$('rankAtDischarge').setValue(data.dischargeRank);
                $$('typeOfDischarge').setValue(data.dischargeType.data);
                $$('nonHonourableDetails').setValue(data.dischargeExplain.data);

                // Set state/province depending on the visibility status of either the drop down or the text input.
                if ($$('state').isVisible()) {
                    $$('state').setValue(data.stateProvince);
                } else {
                    $$('stateDropDown').setValue(data.stateProvince);
                }
            }

            // Set the dialog title.
            if (dependantId && dependantId.length > 0) {
                Utils.setText('addWorkerTitle', 'Add Worker - Promote an Existing Dependant to a Worker');
            } else if (applicantId && applicantId.length > 0) {
                Utils.setText('addWorkerTitle', 'Add Worker - Promote an Existing Applicant to a Worker');
            } else {
                Utils.setText('addWorkerTitle', 'Add New Worker');
            }

            // Can edit the HIC number.
            if (canEditHicNum) {
                $$('hicNumber').enable();
            }
        }

        async function saveEmployee() {

            function validateNewOrSave() {
                let typeOfDischarge = $$('typeOfDischarge').getValue();
                let typeOfDischargeData = $$('typeOfDischarge').getData();
                let nonHonorableDetails = $$('nonHonourableDetails').getValue();

                if (typeOfDischarge !== '' && typeOfDischargeData === '0' && nonHonorableDetails === 0) {
                    Utils.showMessage('Error', 'Non honorable details are required.').then(() => {
                        addWorkerTabContainer.selectTab('bgTabButton');
                        $$('nonHonourableDetails').focus();
                    });
                    return false;
                }

                let enlistedFromYear = $$('enlistedFromVal').getValue();
                let enlistedToYear = $$('enlistedToVal').getValue();
                if (typeOfDischarge !== '') {
                    if (enlistedFromYear > enlistedToYear && enlistedFromYear > 0 && enlistedToYear > 0) {
                        Utils.showMessage('Error!', 'Enlisted from year must be before enlisted to year.').then(() => {
                            addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });
                        return false;
                    } else {
                        if (enlistedFromYear > 0 && (enlistedFromYear > 2020 || enlistedFromYear < 1920)) {
                            Utils.showMessage('Error', 'Enlisted from year must be between 1920 and 2020.').then(() => {
                                addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedFromVal').focus();
                            });
                            return false;
                        } else if (enlistedFromYear === 0) {
                            Utils.showMessage('Error', 'Enlisted from year is required.').then(() => {
                                addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedFromVal').focus();
                            });
                            return false;
                        }

                        if (enlistedToYear > 0 && (enlistedToYear > 2020 || enlistedToYear < 1920)) {
                            Utils.showMessage('Error', 'Enlisted to year must be between 1920 and 2020.').then(() => {
                                addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedToVal').focus();
                            });
                            return false;
                        } else if (enlistedToYear === 0) {
                            Utils.showMessage('Error', 'Enlisted to year is required.').then(() => {
                                addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedToVal').focus();
                            });
                            return false;
                        }

                        let enlistedFromMonth = $$('enlistedFrom').getValue();
                        let enlistedFromMonthData = $$('enlistedFrom').getData();
                        let enlistedToMonth = $$('enlistedTo').getValue();
                        let enlistedToMonthData = $$('enlistedTo').getData();

                        if (enlistedFromYear === enlistedToYear) {
                            if (enlistedFromMonth !== '' && enlistedToMonth !== '' && (enlistedFromMonthData > enlistedToMonthData)) {
                                Utils.showMessage('Error', 'Enlisted from date must be before enlisted to date.').then(() => {
                                    addWorkerTabContainer.selectTab('bgTabButton');
                                    $$('enlistedFrom').focus();
                                });
                                return false;
                            }
                        }

                        if (enlistedFromMonth === '') {
                            Utils.showMessage('Error', 'Enlisted from month is required.').then(() => {
                                addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedFrom').focus();
                            });
                            return false;
                        }

                        if (enlistedToMonth === '') {
                            Utils.showMessage('Error', 'Enlisted to month is required.').then(() => {
                                addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedTo').focus();
                            });
                            return false;
                        }
                    }
                } else {
                    if (enlistedFromYear > 0 && (enlistedFromYear > 2020 || enlistedFromYear < 1920)) {
                        Utils.showMessage('Error', 'Enlisted from year must be between 1920 and 2020.').then(() => {
                            addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });
                        return false;
                    } else if (enlistedFromYear === 0 && $$('branch').getValue() !== '') {
                        Utils.showMessage('Error', 'Enlisted from year is required.').then(() => {
                            addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });
                        return false;
                    }

                    if ($$('enlistedFrom').getValue() === '' && $$('branch').getValue() !== '') {
                        Utils.showMessage('Error', 'Enlisted from month is required.').then(() => {
                            addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFrom').focus();
                        });
                        return false;
                    }
                }

                if ($$('companyGroup').getValue() === 'Y' && $$('when').getValue().length === 0) {
                    Utils.showMessage('Validation Error!', 'Enlisted when is required.').then(() => {
                        addWorkerTabContainer.selectTab('bgTabButton');
                        $$('when').focus();
                    });
                    return false;
                }

                return true;
            }

            if ($$('firstName').isError('First name')) {
                return addWorkerTabContainer.selectTab('basicTabButton');
            }

            if ($$('lastName').isError('Last name')) {
                return addWorkerTabContainer.selectTab('basicTabButton');
            }

            if (ssnRequired && false) {
                const ssn = $('#ssn').val();
                if (ssn.length !== 11) {
                    await Utils.showMessage('Error', 'Invalid SSN.');
                    $('#ssn').focus();
                    return addWorkerTabContainer.selectTab('basicTabButton');
                }
            }

            {
                let phone = $$('homePhone').getValue();
                if (phone)
                    phone = phone.trim();
                if (phone  &&  !Utils.isValidPhoneNumber(phone))
                    Utils.showMessage('Warning', 'Home phone is invalid.  New worker added with bad home phone number.');
            }

            {
                let phone = $$('workPhone').getValue();
                if (phone)
                    phone = phone.trim();
                if (phone  &&  !Utils.isValidPhoneNumber(phone))
                    Utils.showMessage('Warning', 'Work phone is invalid.  New worker added with bad work phone number.');
            }

            if ($$('status').getValue() === '') {
                Utils.showMessage('Error', 'Status is required').then(() => {
                    addWorkerTabContainer.selectTab('posTabButton');
                    $$('status').focus();
                });
                return false;
            }

            if ($$('statusDate').getIntValue() === 0) {
                Utils.showMessage('Error', 'Status date is required').then(() => {
                    addWorkerTabContainer.selectTab('posTabButton');
                    $$('statusDate').focus();
                });
                return false;
            }

            if ($$('position').getValue() === '' && $$('wageType').getValue() !== '') {
                Utils.showMessage('Error', 'Position is required if wage type is set').then(() => {
                    addWorkerTabContainer.selectTab('posTabButton');
                    $$('position').focus();
                });
                return false;
            } else if ($$('position').getValue() !== '' && $$('wageType').getValue() === '') {
                Utils.showMessage('Error', 'Wage type is required if position is set').then(() => {
                    addWorkerTabContainer.selectTab('posTabButton');
                    $$('wageType').focus();
                });
                return false;
            }

            if ($$('wageType').getValue() === '') {
                Utils.showMessage('Error', 'Wage type is required').then(() => {
                    addWorkerTabContainer.selectTab('posTabButton');
                    $$('wageType').focus();
                });
                return false;
            }

            if (!$$('wage').getValue()) {
                Utils.showMessage('Error', 'Wage is required').then(() => {
                    addWorkerTabContainer.selectTab('posTabButton');
                    $$('wage').focus();
                });
                return false;
            }

            if (validateNewOrSave()) {
                let disType = $$('typeOfDischarge').getValue();
                dischargeType = disType !== '0' ? disType : $$('nonHonourableDetails').getValue()
            } else {
                return;
            }

            // See if the user requested a login.
            if ($$('assignLogin').getValue() === true) {
                if ($$('loginId').isError('Login ID')) {
                    return addWorkerTabContainer.selectTab('loginTabButton');
                }

                if ($$('password').isError('Password')) {
                    return addWorkerTabContainer.selectTab('loginTabButton');
                }

                if ($$('password').getValue() !== $$('confirmPassword').getValue()) {
                    Utils.showMessage('Error', 'Passwords must match').then(() => {
                        addWorkerTabContainer.selectTab('loginTabButton');
                        $$('confirmPassword');
                    });
                    return false;
                }

                if ($$('screenGroup').getValue() === '') {
                    Utils.showMessage('Error', 'Screen group is required').then(() => {
                        addWorkerTabContainer.selectTab('loginTabButton');
                        $$('screenGroup');
                    });
                    return false;
                }

                if ($$('securityGroup').getValue() === '') {
                    Utils.showMessage('Error', 'Security group is required').then(() => {
                        addWorkerTabContainer.selectTab('loginTabButton');
                        $$('securityGroup').focus();
                    });
                    return false;
                }
            }

            const assignLogin = $$('assignLogin').getValue();
            const stateSelection = Utils.isVisible('stateDropDown');

            const inData = {
                hicNumber: $$('hicNumber').getValue(),
                hrAdmin: $$('hrAdmin').getValue(),
                medicare: $$('medicareGrp').getValue(),
                enlistFromYear: $$('enlistedFromVal').getValue(),
                enlistToYear: $$('enlistedToVal').getValue(),
                workedForWhen: $$('when').getValue(),
                workedFor: $$('companyGroup').getValue(),
                convicted: $$('crimeGrp').getValue(),
                convictedDescription: $$('crimeDesc').getValue(),
                workersCompCode: $$('compCode').getValue(),
                height: $$('workerHeight').getValue(),
                weight: $$('workerWeight').getValue(),
                addressLine1: $$('addrLine1').getValue(),
                addressLine2: $$('addrLine2').getValue(),
                automotiveInsuranceCarrier: $$('autoInsCarrier').getValue(),
                automotiveInsuranceCoverage: $$('autoInsCoverage').getValue(),
                automotiveInsuranceExpirationDate: $$('autoInsExpire').getIntValue(),
                automotiveInsurancePolicyNumber: $$('autoInsPolicyNo').getValue(),
                automotiveInsuranceStartDate: $$('autoInsBegin').getIntValue(),
                applicantId: applicantId,
                benefitClass: $$('benefitClass').getValue(),
                canLogin: assignLogin ? $$('loginStatusGrp').getValue() : null,
                citizenship: $$('citizenOf').getValue(),
                city: $$('city').getValue(),
                country: $$('countries').getValue(),
                county: $$('county').getValue(),
                defaultProjectId: $$('employeeOverride').getValue(),
                dependentId: dependantId,
                dob: $$('dob').getIntValue(),
                driversLicenseExpirationDate: $$('driversLicenseExpiry').getIntValue(),
                driversLicenseNumber: $$('driversLicenseNumber').getValue(),
                driversLicenseState: $$('driversLicenseState').getValue(),
                eeoCategoryId: $$('eeoCat').getValue(),
                eeoRaceId: $$('eeoRace').getValue(),
                empPassword: assignLogin ? $$('password').getValue() : null,
                employeeStatusDate: $$('statusDate').getIntValue(),
                employeeStatusId: $$('status').getValue(),
                extRef: $$('workerId').getValue(),
                fname: $$('firstName').getValue(),
                homePhone: $$('homePhone').getValue(),
                i9Completed: $$('i9Completed').getValue(),
                jobTitle: $$('jobTitle').getValue(),
                lname: $$('lastName').getValue(),
                login: assignLogin ? $$('loginId').getValue() : null,
                middleName: $$('middleName').getValue(),
                mobilePhone: $$('mobilePhone').getValue(),
                nickName: $$('nickName').getValue(),
                noCompanyScreenGroupId: assignLogin && multiCompSupport ? $$('noCompScreenGroup').getValue() : null,
                personalEmail: $$('email').getValue(),
                positionId: $$('position').getValue(),
                screenGroupId: assignLogin ? $$('screenGroup').getValue() : null,
                securityGroupId: assignLogin ? $$('securityGroup').getValue() : null,
                sex: $$('sexGrp').getValue(),
                ssn: $('#ssn').val(),
                stateProvince: stateSelection ? $$('stateDropDown').getValue() : $$('state').getValue(),
                tabaccoUse: $$('tobUseGrp').getValue(),
                visa: $$('visa').getValue(),
                visaExpirationDate: $$('visaExpiration').getIntValue(),
                visaStatusDate: $$('visaStatus').getIntValue(),
                wageAmount: $$('wage').getValue(),
                wageTypeId: $$('wageType').getValue(),
                workFax: $$('fax').getValue(),
                workPhone: $$('workPhone').getValue(),
                zipPostalCode: $$('zipCode').getValue(),
                militaryBranch: $$('branch').getValue(),
                enlistFromMonth: $$('enlistedFrom').getValue(),
                enlistToMonth: $$('enlistedTo').getValue(),
                dischargeRank: $$('rankAtDischarge').getValue(),
                dischargeType: dischargeType,
                dischargeExplain: $$('nonHonourableDetails').getValue(),
                workerType: $$('workerTypeGrp').getValue()
            };

            let data = await AWS.callSoap(SoapService, 'newEmployee', inData);

            if (data.wsStatus === '0') {
                Utils.popup_close1('addWorker');
                Utils.showMessage('Status', 'Employee has been added.');
                search(3);
            }
        }

        async function generateLoginAndPassword() {
            if ($$('firstName').isError('First name')) {
                return addWorkerTabContainer.selectTab('basicTabButton');
            }

            if ($$('lastName').isError('Last name')) {
                return addWorkerTabContainer.selectTab('basicTabButton');
            }

            const inData = {
                firstName: $$('firstName').getValue(),
                lastName: $$('lastName').getValue()
            };
            let data = await AWS.callSoap(SoapService, 'generateLoginAndPassword', inData);
            if (data.wsStatus !== '0')
                return;
            $$('loginId').setValue(data.login);
            $$('password').setValue(data.password);
            $$('confirmPassword').setValue(data.password);
        }

        initDialog();

        //==================================================================================================================
        // New Employee event handlers start.
        //==================================================================================================================

        $$('countries').onChange(filterState);

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
            if (result)
                $$('noCompScreenGroup').setValue(result.data.id);
            else if (result === null)
                $$('noCompScreenGroup').setValue('');
        });

        $$('assignLogin').onChange(() => toggleAssignLogin(!$$('assignLogin').getValue()));

        $('#ssn').on('focusout', () => {
            const ctl = $('#ssn');
            const val = ctl.val();
            if (val)
                ctl.val(Utils.formatSsn(val));
        });

        $('#ssn').on('input', () => {
            const ctl = $('#ssn');
            let val = ctl.val().trim();
            if (val)
                ctl.val(Utils.formatSsn(val));
        });

        $$('position').onChange(() => {
            if ($$('position').getValue() === '')
                $$('benefitClass').setValue('');
            else {
                let position = $$('position').getData();
                $$('benefitClass').setValue(position.benefitClassId);
            }
        });

        $$('branch').onChange(selection => {
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
                bindToEnum('typeOfDischarge', DischargeTypes, MilitaryBranchTypes.NONE);

                $$('enlistedFrom').enable();
                $$('enlistedTo').enable();
                $$('enlistedFromVal').enable();
                $$('enlistedToVal').enable();
                $$('rankAtDischarge').enable();
                $$('typeOfDischarge').enable();
            }
        });

        $$('typeOfDischarge').onChange(disType => {
            if (disType !== '' && disType !== 'H')
                $$('nonHonourableDetails').enable();
            else
                $$('nonHonourableDetails').disable();
        });

        $$('showPasswords').onChange(event => {
            Utils.togglePwdVisibility('password', event.target.checked);
            Utils.togglePwdVisibility('confirmPassword', event.target.checked);
        });

        $$('crimeGrp').onChange(event => {
            if (event.currentTarget.value === 'Y')
                $$('crimeDesc').enable();
            else
                $$('crimeDesc').clear().disable();
        });

        $$('companyGroup').onChange(event => {
            if (event.currentTarget.value === 'Y')
                $$('when').enable();
            else
                $$('when').clear().disable();
        });

        $$('generateLogin').onclick(generateLoginAndPassword);

        $$('addWorkerOK').onclick(saveEmployee);

        $$('addWorkerCancel').onclick(() => {
            Utils.popup_close1('addWorker');
        });

        //==================================================================================================================
        // New Employee handlers end.
        //==================================================================================================================
    }

    /**
     * Contains the Add Employee Type functionality.
     */
    async function addPerson() {

        let depId, appId;

        function reset() {
            $$('addEmpTypeGrp').setValue('0');

            $$('depInput').disable();
            $$('depInput').clear();

            $$('chooseDep').disable();

            $$('aplInput').disable();
            $$('aplInput').clear();

            $$('chooseApl').disable();
        }

        function addEmployee() {
            $$('addEmpTypeGrp').setValue('0');
            $$('addEmpCancel').onclick(() => {
                reset();
                Utils.popup_close();
            });

            function showFields() {
                switch ($$('addEmpTypeGrp').getValue()) {
                    case '0':  // New Employee
                        $$('chooseDep').disable();
                        $$('chooseApl').disable();
                        break;
                    case '1':  // Dependent -> Employee
                        $$('chooseDep').enable();
                        $$('chooseApl').disable();
                        break;
                    case '2':  // Applicant -> Employee
                        $$('chooseDep').disable();
                        $$('chooseApl').enable();
                        break;
                }
                $$('depInput').clear();
                $$('aplInput').clear();
                applicantId = dependantId = null;
            }

            $$('addEmpTypeGrp').onChange(showFields);

            showFields();

            Utils.popup_open('addEmployee');

            async function showSearchEmployee(searchType) {
                const inData = {searchType: searchType};

                const selectedNode = await Utils.popup_open1('SearchEmployee', 'employeeSelection', inData);
                if (selectedNode && selectedNode.data) {
                    const person = selectedNode.data;
                    const displayName = formatDisplayName(person.firstName, person.middleName, person.lastName);

                    if (searchType === EmployeeSearchTypes.DEPENDANT) {
                        $$('depInput').setValue(displayName);
                        dependantId = person.id;
                    } else if (searchType === EmployeeSearchTypes.APPLICANT) {
                        $$('aplInput').setValue(displayName);
                        applicantId = person.id;
                    }
                }
            }

            $$('chooseDep').onclick(() => showSearchEmployee(EmployeeSearchTypes.DEPENDANT));

            $$('chooseApl').onclick(() => showSearchEmployee(EmployeeSearchTypes.APPLICANT));

            $$('addEmpOK').onclick(async () => {
                switch ($$('addEmpTypeGrp').getValue()) {
                    case '0':  // New employee
                        Utils.popup_close();
                        newWorker();
                        await Utils.popup_open1(null, 'addWorker', null, () => {
                            $$('addWorkerOK').focus();
                        });
                        break;
                    case '1':  //  Dependent -> Employee
                        if (!dependantId) {
                            Utils.showMessage('Error', 'Please select a dependent.');
                            return;
                        }
                        Utils.popup_close();
                        break;
                    case '2':  //  Applicant -> Employee
                        if (!applicantId) {
                            Utils.showMessage('Error', 'Please select an applicant.');
                            return;
                        }
                        Utils.popup_close();

                        const inData = {
                            applicantId: applicantId,
                        };

                        let data = await AWS.callSoap(SoapService, 'newEmployee', inData);

                        if (data.wsStatus === '0') {
                            Utils.showMessage('Status', "Applicant has been added as an employee.");
                            search(3);
                        }
                        break;
                }
            });
        }

        async function run() {
            $$('addEmpOK').focus();

            $$('addEmpCancel').onclick(() => {
                reset();
                Utils.popup_close1('addEmployee');
            });

            $$('addEmpTypeGrp').onChange(() => {
                function toggleDepToEmp(disable) {
                    if (disable) {
                        $$('depInput').disable();
                        $$('chooseDep').disable();
                    } else {
                        $$('depInput').enable();
                        $$('chooseDep').enable();
                    }
                }

                function toggleAplToEmp(disable) {
                    if (disable) {
                        $$('aplInput').disable();
                        $$('chooseApl').disable();
                    } else {
                        $$('aplInput').enable();
                        $$('chooseApl').enable();
                    }
                }

                if ($$('addEmpTypeGrp').getValue() === '1') {
                    toggleDepToEmp(false);
                    toggleAplToEmp(true);
                } else if ($$('addEmpTypeGrp').getValue() === '2') {
                    toggleDepToEmp(true);
                    toggleAplToEmp(false);
                } else {
                    toggleDepToEmp(true);
                    toggleAplToEmp(true);
                }
            });

            async function showSearchEmployee(searchType) {
                const inData = {searchType: searchType};

                const selectedNode = await Utils.popup_open1('SearchEmployee', 'employeeSelection', inData);
                if (selectedNode && selectedNode.data) {
                    const person = selectedNode.data;
                    const displayName = formatDisplayName(person.firstName, person.middleName, person.lastName);

                    if (searchType === EmployeeSearchTypes.DEPENDANT) {
                        $$('depInput').setValue(displayName);
                        depId = person.id;
                    } else if (searchType === EmployeeSearchTypes.APPLICANT) {
                        $$('aplInput').setValue(displayName);
                        appId = person.id;
                    }
                }
            }

            $$('chooseDep').onclick(() => showSearchEmployee(EmployeeSearchTypes.DEPENDANT));

            $$('chooseApl').onclick(() => showSearchEmployee(EmployeeSearchTypes.APPLICANT));

            $$('addEmpOK').onclick(async () => {
                if ($$('addEmpTypeGrp').getValue() === '1' && $$('depInput').getValue() === '') {
                    Utils.showMessage('Missing Required Entry', 'Dependant is required').then($$('chooseDep').focus);
                    return;
                }

                if ($$('addEmpTypeGrp').getValue() === '2' && $$('aplInput').getValue() === '') {
                    Utils.showMessage('Missing Required Entry', 'Applicant is required').then($$('chooseApl').focus);
                    return;
                }

                if ($$('addEmpTypeGrp').getValue() === '1') {
                    dependantId = depId;
                } else if ($$('addEmpTypeGrp').getValue() === '2')
                    applicantId = appId;

                reset();
                Utils.popup_close1('addEmployee');

                // New worker.
                newWorker();

                await Utils.popup_open1(null, 'addWorker', null, () => {
                    $$('addWorkerOK').focus();
                });
            });
        }

        if (checkMaxEmployees.toString().length > 0)
            Utils.showMessage('Alert', `Maximum number of employees reached : ${checkMaxEmployees}`);
        else
            // await Utils.popup_open1(null, 'addEmployee', null, run);
            addEmployee();
    }

    $$('add').onclick(addPerson);

    $$('edit').onclick(selectPerson);

    //==================================================================================================================
    // Main event handlers end.
    //==================================================================================================================

    const columnDefs = [
        {headerName: '', field: 'personId', hide: true},
        {headerName: 'Last Name', field: 'lname', width: 200, cellRenderer: 'personInfo'},
        {headerName: 'First Name', field: 'fname', width: 175},
        {headerName: 'Middle Name', field: 'middleName', width: 175},
        {headerName: 'Position', field: 'positionName', width: 150 },
        {headerName: 'Current Active Assignment(s)', field: 'assignedProject', width: 375 },
        {headerName: 'I-9 P1', field: 'i9p1', width: 100, cellRenderer: 'i9renderer' },
        {headerName: 'Labels', field: 'labels', width: 550 },
        {headerName: '', field: 'active', hide: true},
        {headerName: '', field: 'dirty', hide: true},
        {headerName: '', field: 'type', hide: true},
        {headerName: '', field: 'statusName', hide: true}
    ];

    // **************   CELL RENDERER

    function PersonInfo() {}

    PersonInfo.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let a = document.createElement('a');
        a.style = "cursor: pointer;";
        a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
        a.addEventListener("click", function () {
            let personId = params.data.personId;
            let data = {
                personId: personId,
                assignedFrom: $$('assigned-from').getIntValue(),
                assignedTo: $$('assigned-to').getIntValue()
            };
            Server.call(RestService, 'GetPersonDetail', data).then(async function (res) {
                if (res._Success) {
                    const maxNumProjects = 5;
                    let r = res.info[0];
                    let name = r.lname + ', ' + r.fname;
                    if (r.mname)
                        name += ' ' + r.mname;
                    $$('pip-worker').setValue(name);
                    $$('pip-status').setValue(r.status_name);
                    $$('pip-mobile').setValue(r.phone_number);
                    let cs = r.city;
                    if (cs)
                        cs += ', ';
                    cs += r.state;
                    $$('pip-city-state').setValue(cs);

                    if (res.unavailableDates.length) {
                        let s = "";
                        let needComma = false;
                        for (let j=0 ; j < res.unavailableDates.length ; j++) {
                            let r = res.unavailableDates[j];
                            if (needComma)
                                s += ', ';
                            else
                                needComma = true;
                            s += DateUtils.intToStr4(r.start_date) + '-' + DateUtils.intToStr4(r.end_date);
                        }
                        $$('pip-dates-unavailable').setValue(s);
                    } else
                        $$('pip-dates-unavailable').setValue('Available');

                    // clear any previous
                    let i;
                    for (i=0 ; i < maxNumProjects ; i++)
                        $$('pip-assignments' + i).clear();

                    const today = DateUtils.today();
                    i = 0;
                    const nProjects = res.info.length;
                    if (r.estimated_last_date == null)
                        $$('pip-assignments' + i++).setValue('(none)');
                    else {
                        for (i = 0; i < maxNumProjects && i < nProjects && res.info[i].estimated_last_date != null; i++) {
                            r = res.info[i];
                            let proj = r.description;
                            if (proj) {
                                proj += ' (' + r.shift_start + ')';
                                proj += ' (' + DateUtils.intToStr4(r.estimated_first_date) + '-' + DateUtils.intToStr4(r.estimated_last_date) + ')';
                            }
                            $$('pip-assignments' + i).setValue(proj);
                        }
                        if (nProjects > maxNumProjects)
                            $$('pip-assignments' + i++).setValue('(more projects)');
                    }

                    Utils.popup_open('person-info-popup');
                    $$('pip-ok').onclick(function () {
                        Utils.popup_close();
                    });
                }
            });
        });
        const span = document.createElement('span');
        span.style = 'vertical-align: top;';
        span.innerText = params.data.lname;
        this.eGui.appendChild(a);
        this.eGui.appendChild(span);
    };

    PersonInfo.prototype.getGui = function() {
        return this.eGui;
    };

    //  ************  END OF CELL RENDERER


    // **************   CELL RENDERER

    function I9Renderer() {}

    I9Renderer.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        if (params.value)
            this.eGui.innerText = params.value;
        else
            this.eGui.innerHTML = '<div style="background-color: red; width: 20px; height: 15px; margin-top: 5px;"></div><div style="display: inline-block; position: relative; top: -20px;">No</div>';
    };

    I9Renderer.prototype.getGui = function() {
        return this.eGui;
    };

    //  ************  END OF CELL RENDERER

    Utils.setGridHeight('screen-start', 'resultsGrid', 'bottom-start', 'bottom-end', 'screen-end');

    resultsGrid = new AGGrid('resultsGrid', columnDefs);
    resultsGrid.addComponent('personInfo', PersonInfo);
    resultsGrid.addComponent('i9renderer', I9Renderer);

    resultsGrid.rowStyleFunction((params) => {
        if (!params.data.available)
            return { background: 'pink' };
        else
            return null;
    });


    resultsGrid.show();

    resultsGrid.setOnSelectionChanged($$('edit').enable);

    resultsGrid.setOnRowDoubleClicked(selectPerson);
})();

//////////////////////////////////////////////////////////////////////////////////////

