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

window.HrParent = {};
HrParent.accessLevel = null;
HrParent.checkMaxEmployees = null;
HrParent.newEmpGroupId = null;
HrParent.resultsGrid = null;
HrParent.firstPerson = null;
HrParent.lastPerson = null;

HrParent.WS = 'StandardHrHrParent';

HrParent.Person = class {

    constructor(personId, type, lname, fname, label) {
        this.personId = personId;
        this.type = type;
        this.lname = lname;
        this.fname = fname;
        this.label = label;
    }
};

HrParent.initScreen = async () => {
    // Check application constraints.
    AWS.callSoap(HrParent.WS, 'checkRight').then(data => {
        if (data.wsStatus === '0') {
            window.HrParent.accessLevel = data.accessLevel;
            window.HrParent.checkMaxEmployees = data.checkMaxEmployees;
        }
    });

    // Load meta information.
    AWS.callSoap(HrParent.WS, 'loadMeta').then(data => {
        if (data.wsStatus === '0')
            window.HrParent.newEmpGroupId = data.newEmpOpenScreenGroupId;
    });

    // Load the employee statuses.
    AWS.callSoap(HrParent.WS, 'listEmployeeStatuses').then(data => {
        if (data.wsStatus === '0') {
            let items = Utils.assureArray(data.item);
            items.forEach(item => {
                $$('statusDropDown').add(item.employeeStatusId, item.name, item);
            });
        }
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

    $('#ssnInput').on('focusout', () => {
        const ctl = $('#ssnInput');
        ctl.val(Utils.formatSsn(ctl.val()));
    });

    $('#ssnInput').on('input', () => {
        const ctl = $('#ssnInput');
        let val = ctl.val().trim();
        val = val.replace(/[^0-9-]/g, '');  // remove characters
        let ndigits = 0;
        let ndash = 0;
        for (let i = 0; i < val.length; i++)
            if (val.charAt(i) === '-')
                ndash++;
            else
                ndigits++;
        if (ndash > 2 || ndigits > 9)
            val = Utils.drop(val, -1);
        ctl.val(val);
    });

    $$('empTypeGrp').onChange(val => {
        if (val === 'false') {
            $$('statusGrp').disable('specificStatus');

            if ($$('statusGrp').getValue() === '3')
                $$('statusGrp').setValue(0);

            $$('statusDropDown').setValue('');
            $$('statusDropDown').disable();
        } else {
            $$('statusGrp').enable('specificStatus');
        }
    });

    $$('statusGrp').onChange(event => {
        if (event === "3")
            $$('statusDropDown').enable();
        else
            $$('statusDropDown').disable();
    });

    $$('editEmpDep').onclick(() => {
        const ql = $$('empDepDropDown').getData();
        const person = {};
        person.personId = ql[HR_PERSON_ID];
        person.fname = ql[HR_PERSON_FIRST_NAME];
        person.lname = ql[HR_PERSON_LAST_NAME];
        person.middleName = ql[HR_PERSON_MIDDLE_NAME];

        HrParent.editPerson(person);
    });

    /**
     * Resets the screen to default.
     */
    $$('reset').onclick(() => {
        $$('empDepDropDown').setValue('');
        $$('lastNameDropDown').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('lastNameInput').clear();
        $('#ssnInput').val('');
        $$('firstNameDropDown').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('firstNameInput').clear();
        $$('empTypeGrp').setValue('true');
        $$('statusGrp').setValue(1);
        $$('statusDropDown').setValue('');
        $$('statusDropDown').disable();
        $$('employeeGrp').clear();
        $$('assignedGrp').clear();
        $$('assigned-from').clear();
        $$('assigned-to').clear();
        HrParent.firstPerson = HrParent.lastPerson = null;
        HrParent.resultsGrid.clear();
    });

    /*
    searchType
        0 = search
        1 = previous
        2 = next
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
        let ssn = $('#ssnInput').val();
        let firstNameCriteria = $$('firstNameDropDown').getValue();
        let firstName = $$('firstNameInput').getValue();
        let statusGrpVal = $$('statusGrp').getValue();
        let empTypeGrpVal = $$('empTypeGrp').getValue();
        let empStatus = $$('statusDropDown').getValue();

        let inData = {
            ssn: ssn,
            firstName: firstName,
            lastName: lastName,
            activeIndicator: statusGrpVal,
            firstNameSearchType: firstNameCriteria,
            lastNameSearchType: lastNameCriteria,
            searchEmployees: empTypeGrpVal,
            employeeStatusId: empStatus,
            workerType: $$('employeeGrp').getValue(),
            assigned: assigned,
            assignedFrom: assignedFrom,
            assignedTo: assignedTo,
            firstPerson: HrParent.firstPerson,
            lastPerson: HrParent.lastPerson,
            searchType: searchType
        };
        HrParent.resultsGrid.clear();

        let data = await AWS.callSoap(HrParent.WS, 'searchPersons', inData);
        if (data.wsStatus !== '0')
            return;

        data.persons = Utils.assureArray(data.persons);
        HrParent.resultsGrid.addRecords(data.persons);
        HrParent.resultsGrid.sizeColumnsToFit();
        if (data.total === undefined)  // for the old backend
            data.total = data.persons.length;
        let totalRecords = Number(data.total);
        let msg = 'Total records:  ' + Utils.format(totalRecords, "C", 0, 0);
        if (totalRecords >= Number(data.cap) && totalRecords !== data.persons.length)
            msg += ' (displaying ' + data.persons.length + ', page ' + data.groupNumber + ')';
        else if (totalRecords !== data.persons.length)
            msg += ' (displaying ' + data.persons.length + ')';
        $$('status-label').setValue(msg);
        HrParent.firstPerson = data.persons.length ? data.persons[0].personId : null;
        HrParent.lastPerson = data.persons.length ? data.persons[data.persons.length - 1].personId : null;
        $$('edit').disable();
    }

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

    $$('next').onclick(() => {
        search(2);
    });

    $$('add').onclick(HrParent.addPerson);

    $$('edit').onclick(HrParent.selectPerson);

    //==================================================================================================================
    // Main event handlers end.
    //==================================================================================================================
};

////////////////////////////////////////////////////////////////////////////////////////////


function PersonInfo() {}

PersonInfo.prototype.init = function(params) {
    this.eGui = document.createElement('div');
    let a = document.createElement('a');
    a.style = "cursor: pointer;";
    a.innerHTML = '<img src="kiss/assets/icons/eye.svg" style="transform: scale(.6); position: relative; top: -3px; left: -5px;">';
    a.addEventListener("click", function () {
        let personId = params.data.personId;
        let data = {
            personId: personId
        };
        Server.call('com.arahant.services.standard.hr.hrParent', 'GetPersonDetail', data).then(async function (res) {
            if (res._Success) {
                let r = res.info[0];
                let name = r.lname + ', ' + r.fname;
                if (r.mname)
                    name += ' ' + r.mname;
                $$('pip-worker').setValue(name);
                $$('pip-position').setValue(r.position_name);
                $$('pip-mobile').setValue(r.phone_number);
                let cs = r.city;
                if (cs)
                    cs += ', ';
                cs += r.state;
                $$('pip-city-state').setValue(cs);

                const today = DateUtils.today();
                let i = 0;
                while (r.estimated_last_date < today && res.info.length > i+1)
                    r = res.info[++i];
                if (r.estimated_last_date >= today) {
                    let proj = r.description;
                    if (proj)
                        proj += ' (' + DateUtils.intToStr4(r.estimated_first_date) + '-' + DateUtils.intToStr4(r.estimated_last_date) + ')';
                    $$('pip-assignments').setValue(proj);
                    let n = 2;
                    while (res.info.length > i + 1 && n <= 4) {
                        r = res.info[++i];
                        proj = r.description;
                        if (proj)
                            proj += ' (' + DateUtils.intToStr4(r.estimated_first_date) + '-' + DateUtils.intToStr4(r.estimated_last_date) + ')';
                        $$('pip-assignments' + n++).setValue(proj);
                    }
                } else
                    $$('pip-assignments').setValue('(none)');
                Utils.popup_open('person-info-popup');
                $$('pip-ok').onclick(function () {
                    Utils.popup_close();
                });
            }
        });
    });
    let span = document.createElement('span');
    span.style = 'vertical-align: top;';
    span.innerText = params.data.lname;
    this.eGui.appendChild(a);
    this.eGui.appendChild(span);
};

PersonInfo.prototype.getGui = function() {
    return this.eGui;
};

//////////////////////////////////////////////////////////////////////////////////////


HrParent.setupResultsGrid = () => {
    let columnDefs = [
        {headerName: '', field: 'personId', hide: true},
        {headerName: 'Last Name', field: 'lname', width: 125, cellRenderer: 'personInfo'},
        {headerName: 'First Name', field: 'fname', width: 125},
        {headerName: 'Middle Name', field: 'middleName', width: 75},
 //       {headerName: 'SSN', field: 'ssn', width: 75},
        {headerName: 'Job Title', field: 'jobTitle', width: 100},
        {headerName: 'Employment Status', field: 'statusName', width: 100 },
        {headerName: '', field: 'active', hide: true},
        {headerName: '', field: 'dirty', hide: true},
        {headerName: '', field: 'type', hide: true},
    ];

    window.HrParent.resultsGrid = new Grid(columnDefs, [], Grid.SINGLE_SELECTION);
    window.HrParent.resultsGrid.addComponent('personInfo', PersonInfo);
    window.HrParent.resultsGrid.build('resultsGrid');
    window.HrParent.resultsGrid.sizeColumnsToFit();

    window.HrParent.resultsGrid.setOnSelectionChanged(() => {
        // Remember.  This is a Grid not an AGGrid.
        const grid = window.HrParent.resultsGrid;
        const rows = grid.gridOptions.api.getSelectedRows();
        $$('edit').enable(rows);
    });

    window.HrParent.resultsGrid.setOnRowDoubleClicked(HrParent.selectPerson);
};

HrParent.savePersonInQuickList = function (person) {
    let selectedPeople = Utils.getData(HR_RECENT_PEOPLE);
    let isDuplicate = false;
    selectedPeople.forEach(p => {
        if (person.personId === p[HR_PERSON_ID]) {
            isDuplicate = true;
        }
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
};

HrParent.selectPerson = () => {
    let person = window.HrParent.resultsGrid.getSelectedNodes()[0].data;
    if (person) {
        HrParent.savePersonInQuickList(person);
        HrParent.editPerson(person);
    }
};

/**
 * Contains the Add Employee Type functionality.
 */
HrParent.addPerson = async () => {

    let dependantId = undefined, applicantId = undefined;

    let reset = () => {
        $$('addEmpTypeGrp').setValue('0');

        $$('depInput').disable();
        $$('depInput').clear();

        $$('chooseDep').disable();

        $$('aplInput').disable();
        $$('aplInput').clear();

        $$('chooseApl').disable();
    };

    let run = function async () {
        $$('addEmpOK').focus();

        $$('addEmpCancel').onclick(() => {
            reset();
            Utils.popup_close1('addEmployee');
        });

        $$('addEmpTypeGrp').onChange(() => {
            let toggleDepToEmp = disable => {
                if (disable) {
                    $$('depInput').disable();
                    $$('chooseDep').disable();
                } else {
                    $$('depInput').enable();
                    $$('chooseDep').enable();
                }
            };

            let toggleAplToEmp = disable => {
                if (disable) {
                    $$('aplInput').disable();
                    $$('chooseApl').disable();
                } else {
                    $$('aplInput').enable();
                    $$('chooseApl').enable();
                }
            };

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

        let showSearchEmployee = async searchType => {
            let inData = {searchType: searchType};

            let selectedNode = await Utils.popup_open1('SearchEmployee', 'employeeSelection', inData);
            if (selectedNode && selectedNode.data) {
                let person = selectedNode.data;
                let displayName = formatDisplayName(person.firstName, person.middleName, person.lastName);

                if (searchType === EmployeeSearchTypes.DEPENDANT) {
                    $$('depInput').setValue(displayName);
                    dependantId = person.id;
                } else if (searchType === EmployeeSearchTypes.APPLICANT) {
                    $$('aplInput').setValue(displayName);
                    applicantId = person.id;
                }
            }
        };

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
                HrParent.dependantId = dependantId;
            } else if ($$('addEmpTypeGrp').getValue() === '2')
                HrParent.applicantId = applicantId;

            reset();
            Utils.popup_close1('addEmployee');

            // New worker.
            HrParent.newWorker();

            await Utils.popup_open1(null, 'addWorker', null, () => {
                $$('addWorkerOK').focus();
            });
        });
    };

    if (window.HrParent.checkMaxEmployees.toString().length > 0) {
        Utils.showMessage('Alert', `Maximum number of employees reached : ${window.HrParent.checkMaxEmployees}`);
    } else {
        await Utils.popup_open1(null, 'addEmployee', null, run);
    }
};

HrParent.editPerson = person => {
    // Save data for quick list
    HrParent.savePersonInQuickList(person);

    // Save data for new screens
    Utils.saveData(HR_PERSON_ID, person.personId);
    Utils.saveData(HR_PERSON_NAME, formatDisplayName(person.fname, person.middleName, person.lname));

    Framework.getChild();
};

/**
 * Contains the functionality for the Add Employee dialog.
 */
HrParent.newWorker = () => {
    /**
     * Show a drop down or a text input for entering state, depending on the value of the country drop down.
     */
    let filterState = () => {
        let states = getStatesForCountry($$('countries').getValue());

        if (states != null) {
            statesToDropDown('stateDropDown', states);

            $$('stateDropDown').show();
            $$('state').hide();
        } else {
            $$('stateDropDown').hide();
            $$('state').show();
        }
    };

    let toggleAssignLogin = disabled => {
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
    };

    let resetDialog = () => {
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
        HrParent.addWorkerTabContainer.selectTab('basicTabButton');
    };

    /**
     * Initialize the new worker dialog.
     */
    let initDialog = async () => {
        // Setup tab layout.
        HrParent.addWorkerTabContainer = new TabContainer('addWorkerTabContainer');

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

        AWS.callSoap(HrParent.WS, 'loadMeta').then(data => {
            if (data.wsStatus === '0') {
                HrParent.ssnRequired = data.ssnRequired;
                HrParent.canEditHicNum = data.canEditHicNumber;
                HrParent.newPerDefExtId = data.newPersonDefaultExternalId;
                HrParent.multiCompSupport = data.multipleCompanySupport;

                if (HrParent.multiCompSupport === 'true') {
                    showContainer('noCompScreenGrpContainer');
                }
            }
        });

        AWS.callSoap(HrParent.WS, 'listEEOCategories').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('eeoCat', data, 'eeoCategoryId', 'name');
        });

        AWS.callSoap(HrParent.WS, 'listEEORaces').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('eeoRace', data, 'eeoRaceId', 'name');
        });

        AWS.callSoap(HrParent.WS, 'listEmployeeStatuses').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('status', data, 'employeeStatusId', 'name');
        });

        AWS.callSoap(HrParent.WS, 'listPositions').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('position', data, 'positionId', 'positionName');
        });

        AWS.callSoap(HrParent.WS, 'listWageTypes').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('wageType', data, 'id', 'name');
        });

        AWS.callSoap(HrParent.WS, 'listBenefitClasses').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('benefitClass', data, 'id', 'name');
        });

        AWS.callSoap(HrParent.WS, 'getInheritedDefaultProject').then(data => {
            if (data.wsStatus === '0')
                $$('projectInheritedFrom').setValue(data.projectFormatted);
        });

        AWS.callSoap(HrParent.WS, 'searchProjects').then(data => {
            if (data.wsStatus === '0')
                fillDropDownFromService('employeeOverride', data, 'projectId', '', '(choose)',
                    'item', item => {
                        return `${item.projectName.trim()} - ${item.description}`;
                    });
        });

        /**
         * The functionality to load screen and security groups are put in a function for multiple access, which will
         * also be called after loading dependant and applicant data.
         */
        let loadScreenAndSecurityGroups = async () => {
            let inData = {
                searchTopLevelOnly: true,
                screenGroupId: HrParent.screenGroupId
            };
            AWS.callSoap(HrParent.WS, 'searchScreenGroups', inData).then(data => {
                if (data.wsStatus === '0') {
                    fillDropDownFromService('screenGroup', data, 'id', '', '(choose)',
                        'screenDef', item => {
                            return `${item.extId} - ${item.title}`;
                        });

                    fillDropDownFromService('noCompScreenGroup', data, 'id', '', '(choose)',
                        'screenDef', item => {
                            return `${item.extId} - ${item.title}`;
                        });
                }
            });

            inData = {
                securityGroupId: HrParent.securityGroupId
            };
            AWS.callSoap(HrParent.WS, 'searchSecurityGroups', inData).then(data => {
                if (data.wsStatus === '0')
                    fillDropDownFromService('securityGroup', data, 'groupId', 'name', '(choose)');
            });
        };

        // Initial call.
        loadScreenAndSecurityGroups();

        if (HrParent.dependantId) {
            let inData = {dependantId: HrParent.dependantId};
            let data = await AWS.callSoap(HrParent.WS, 'loadDependent', inData);
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

            HrParent.screenGroupId = data.screenGroupId;
            HrParent.securityGroupId = data.securityGroupId;

            $$('sexGrp').setValue(data.sex);
            $('#ssn').val(data.ssn);
            $$('tobUseGrp').setValue(data.tabaccoUse);
            $$('fax').setValue(data.workFax);
            $$('workPhone').setValue(data.workPhone);
            $$('zipCode').setValue(data.zipPostalCode);

            // Set state/province depending on the visibility status of either the drop down or the text input.

            if ($$('state').isVisible()) {
                $$('state').setValue(data.stateProvince);
            } else {
                $$('stateDropDown').setValue(data.stateProvince);
            }

            // Check whether there is an assigned login and enable the fields.
            if ($$('loginId').getValue().length > 0) {
                $$('assignLogin').setValue(true);

                // Reload screen and security groups.
                loadScreenAndSecurityGroups();
            }
        } else if (HrParent.applicantId) {
            let inData = {applicantId: HrParent.applicantId};
            let data = await AWS.callSoap(HrParent.WS, 'loadApplicant', inData);
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
        if (HrParent.dependantId && HrParent.dependantId.length > 0) {
            Utils.setText('addWorkerTitle', 'Add Worker - Promote an Existing Dependant to a Worker');
        } else if (HrParent.applicantId && HrParent.applicantId.length > 0) {
            Utils.setText('addWorkerTitle', 'Add Worker - Promote an Existing Applicant to a Worker');
        } else {
            Utils.setText('addWorkerTitle', 'Add New Worker');
        }

        // Can edit the HIC number.
        if (HrParent.canEditHicNum) {
            $$('hicNumber').enable();
        }
    };

    let saveEmployee = async () => {

        let validateNewOrSave = () => {
            let typeOfDischarge = $$('typeOfDischarge').getValue();
            let typeOfDischargeData = $$('typeOfDischarge').getData();
            let nonHonorableDetails = $$('nonHonourableDetails').getValue();

            if (typeOfDischarge !== '' && typeOfDischargeData === '0' && nonHonorableDetails === 0) {
                new MessageDialog('Validation Error!', 'Non honorable details are required.',
                    MessageDialog.error, () => {
                        HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                        $$('nonHonourableDetails').focus();
                    });

                return false;
            }

            let enlistedFromYear = $$('enlistedFromVal').getValue();
            let enlistedToYear = $$('enlistedToVal').getValue();
            if (typeOfDischarge !== '') {
                if (enlistedFromYear > enlistedToYear && enlistedFromYear > 0 && enlistedToYear > 0) {
                    new MessageDialog('Validation Error!', 'Enlisted from year must be before enlisted to year.',
                        MessageDialog.error, () => {
                            HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });

                    return false;
                } else {
                    if (enlistedFromYear > 0 && (enlistedFromYear > 2020 || enlistedFromYear < 1920)) {
                        new MessageDialog('Validation Error!', 'Enlisted from year must be between 1920 and 2020.',
                            MessageDialog.error, () => {
                                HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedFromVal').focus();
                            });

                        return false;
                    } else if (enlistedFromYear === 0) {
                        new MessageDialog('Validation Error!', 'Enlisted from year is required.',
                            MessageDialog.error, () => {
                                HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedFromVal').focus();
                            });

                        return false;
                    }

                    if (enlistedToYear > 0 && (enlistedToYear > 2020 || enlistedToYear < 1920)) {
                        new MessageDialog('Validation Error!', 'Enlisted to year must be between 1920 and 2020.',
                            MessageDialog.error, () => {
                                HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedToVal').focus();
                            });


                        return false;
                    } else if (enlistedToYear === 0) {
                        new MessageDialog('Validation Error!', 'Enlisted to year is required.',
                            MessageDialog.error, () => {
                                HrParent.addWorkerTabContainer.selectTab('bgTabButton');
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
                            new MessageDialog('Validation Error!', 'Enlisted from date must be before enlisted to date.',
                                MessageDialog.error, () => {
                                    HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                                    $$('enlistedFrom').focus();
                                });

                            return false;
                        }
                    }

                    if (enlistedFromMonth === '') {
                        new MessageDialog('Validation Error!', 'Enlisted from month is required.',
                            MessageDialog.error, () => {
                                HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedFrom').focus();
                            });

                        return false;
                    }

                    if (enlistedToMonth === '') {
                        new MessageDialog('Validation Error!', 'Enlisted to month is required.',
                            MessageDialog.error, () => {
                                HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                                $$('enlistedTo').focus();
                            });

                        return false;
                    }
                }
            } else {
                if (enlistedFromYear > 0 && (enlistedFromYear > 2020 || enlistedFromYear < 1920)) {
                    new MessageDialog('Validation Error!', 'Enlisted from year must be between 1920 and 2020.',
                        MessageDialog.error, () => {
                            HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });

                    return false;
                } else if (enlistedFromYear === 0 && $$('branch').getValue() !== '') {
                    new MessageDialog('Validation Error!', 'Enlisted from year is required.',
                        MessageDialog.error, () => {
                            HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFromVal').focus();
                        });

                    return false;
                }

                if ($$('enlistedFrom').getValue() === '' && $$('branch').getValue() !== '') {
                    new MessageDialog('Validation Error!', 'Enlisted from month is required.',
                        MessageDialog.error, () => {
                            HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                            $$('enlistedFrom').focus();
                        });

                    return false;
                }
            }

            if ($$('companyGroup').getValue() === 'Y' && $$('when').getValue().length === 0) {
                new MessageDialog('Validation Error!', 'Enlisted when is required.',
                    MessageDialog.error, () => {
                        HrParent.addWorkerTabContainer.selectTab('bgTabButton');
                        $$('when').focus();
                    });

                return false;
            }

            return true;
        };

        if ($$('firstName').isError('First name')) {
            return HrParent.addWorkerTabContainer.selectTab('basicTabButton');
        }

        if ($$('lastName').isError('Last name')) {
            return HrParent.addWorkerTabContainer.selectTab('basicTabButton');
        }

        if (HrParent.ssnRequired) {
            const ssn = $('#ssn').val();
            if (ssn.length !== 11) {
                await Utils.showMessage('Error', 'Invalid SSN.');
                $('#ssn').focus();
                return HrParent.addWorkerTabContainer.selectTab('basicTabButton');
            }
        }

        if ($$('status').getValue() === '') {
            return new MessageDialog('Validation Error!', 'Status is required',
                MessageDialog.error, () => {
                    HrParent.addWorkerTabContainer.selectTab('posTabButton');
                    $$('status').focus();
                });
        }

        if ($$('statusDate').getIntValue() === 0) {
            return new MessageDialog('Validation Error!', 'Status date is required',
                MessageDialog.error, () => {
                    HrParent.addWorkerTabContainer.selectTab('posTabButton');
                    $$('statusDate').focus();
                });
        }

        if ($$('position').getValue() === '' && $$('wageType').getValue() !== '') {
            return new MessageDialog('Validation Error!', 'Position is required if wage type is set',
                MessageDialog.error, () => {
                    HrParent.addWorkerTabContainer.selectTab('posTabButton');
                    $$('position').focus();
                });
        } else if ($$('position').getValue() !== '' && $$('wageType').getValue() === '') {
            return new MessageDialog('Validation Error!', 'Wage type is required if position is set',
                MessageDialog.error, () => {
                    HrParent.addWorkerTabContainer.selectTab('posTabButton');
                    $$('wageType').focus();
                });
        }

        if (validateNewOrSave()) {
            let dischargeType = $$('typeOfDischarge').getValue();
            HrParent.dischargeType = dischargeType !== '0' ? dischargeType : $$('nonHonourableDetails').getValue()
        } else {
            return;
        }

        // See if the user requested a login.
        if ($$('assignLogin').getValue() === true) {
            if ($$('loginId').isError('Login ID')) {
                return HrParent.addWorkerTabContainer.selectTab('loginTabButton');
            }

            if ($$('password').isError('Password')) {
                return HrParent.addWorkerTabContainer.selectTab('loginTabButton');
            }

            if ($$('password').getValue() !== $$('confirmPassword').getValue()) {
                return new MessageDialog('Validation Error!', 'Passwords must match',
                    MessageDialog.error, () => {
                        HrParent.addWorkerTabContainer.selectTab('loginTabButton');
                        $$('confirmPassword');
                    });
            }

            if ($$('screenGroup').getValue() === '') {
                return new MessageDialog('Validation Error!', 'Screen group is required',
                    MessageDialog.error, () => {
                        HrParent.addWorkerTabContainer.selectTab('loginTabButton');
                        $$('screenGroup');
                    });
            }

            if ($$('securityGroup').getValue() === '') {
                return new MessageDialog('Validation Error!', 'Security group is required',
                    MessageDialog.error, () => {
                        HrParent.addWorkerTabContainer.selectTab('loginTabButton');
                        $$('securityGroup').focus();
                    });
            }
        }

        let assignLogin = $$('assignLogin').getValue();
        let stateSelection = Utils.isVisible('stateDropDown');

        let inData = {
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
            applicantId: HrParent.applicantId,
            benefitClass: $$('benefitClass').getValue(),
            canLogin: assignLogin ? $$('loginStatusGrp').getValue() : null,
            citizenship: $$('citizenOf').getValue(),
            city: $$('city').getValue(),
            country: $$('countries').getValue(),
            county: $$('county').getValue(),
            defaultProjectId: $$('employeeOverride').getValue(),
            dependentId: HrParent.dependantId,
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
            noCompanyScreenGroupId: assignLogin && HrParent.multiCompSupport ? $$('noCompScreenGroup').getValue() : null,
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
            dischargeType: HrParent.dischargeType,
            dischargeExplain: $$('nonHonourableDetails').getValue(),
            workerType: $$('workerTypeGrp').getValue()
        };

        let data = await AWS.callSoap(HrParent.WS, 'newEmployee', inData);

        if (data.wsStatus === '0') {
            HrParent.employeeId = data.personId;
            Utils.popup_close1('addWorker');
        }
    };

    let generateLoginAndPassword = async () => {
        if ($$('firstName').isError('First name')) {
            return HrParent.addWorkerTabContainer.selectTab('basicTabButton');
        }

        if ($$('lastName').isError('Last name')) {
            return HrParent.addWorkerTabContainer.selectTab('basicTabButton');
        }

        let inData = {
            firstName: $$('firstName').getValue(),
            lastName: $$('lastName').getValue()
        };
        let data = await AWS.callSoap(HrParent.WS, 'generateLoginAndPassword', inData);
        if (data.wsStatus === '0') {
            $$('loginId').setValue(data.login);
            $$('password').setValue(data.password);
            $$('confirmPassword').setValue(data.password);
        }
    };

    initDialog();

    //==================================================================================================================
    // New Employee event handlers start.
    //==================================================================================================================

    $$('countries').onChange(filterState);

    $$('empOvrSearch').onclick(async () => {
        let result = await Utils.popup_open1('ChooseProject', 'projectSelection', null);
        if (result.wsStatus === '0') {
            if (result && result.data)
                $$('employeeOverride').setValue(result.data.projectId);
            else if (result === null)
                $$('employeeOverride').setValue('');
        }
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
        ctl.val(Utils.formatSsn(ctl.val()));
    });

    $('#ssn').on('input', () => {
        const ctl = $('#ssn');
        let val = ctl.val().trim();
        val = val.replace(/[^0-9-]/g, '');  // remove characters
        let ndigits = 0;
        let ndash = 0;
        for (let i = 0; i < val.length; i++)
            if (val.charAt(i) === '-')
                ndash++;
            else
                ndigits++;
        if (ndash > 2 || ndigits > 9)
            val = Utils.drop(val, -1);
        ctl.val(val);
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

    $$('typeOfDischarge').onChange(dischargeType => {
        if (dischargeType !== '' && dischargeType !== 'H') {
            $$('nonHonourableDetails').enable();
        } else {
            $$('nonHonourableDetails').disable();
        }
    });

    $$('showPasswords').onChange(event => {
        Utils.togglePwdVisibility('password', event.target.checked);
        Utils.togglePwdVisibility('confirmPassword', event.target.checked);
    });

    $$('crimeGrp').onChange(event => {
        if (event.currentTarget.value === 'Y') {
            $$('crimeDesc').enable();
        } else {
            $$('crimeDesc').clear();
            $$('crimeDesc').disable();
        }
    });

    $$('companyGroup').onChange(event => {
        if (event.currentTarget.value === 'Y') {
            $$('when').enable();
        } else {
            $$('when').clear();
            $$('when').disable();
        }
    });

    $$('generateLogin').onclick(generateLoginAndPassword);

    $$('addWorkerOK').onclick(saveEmployee);

    $$('addWorkerCancel').onclick(() => {
        Utils.popup_close1('addWorker');
    });

    //==================================================================================================================
    // New Employee handlers end.
    //==================================================================================================================
};

HrParent.initScreen();
HrParent.setupResultsGrid();