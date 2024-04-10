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

    const SWS = "StandardAtApplicantProfile";
    const RWS = "com.arahant.services.standard.at.applicantProfile";
    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);
    const firstAwareDate = Utils.getData(HR_PERSON_FIRST_AWARE_DATE);
    const applicantStatusId = Utils.getData(HR_PERSON_APPLICANT_STATUS);
    const applicantSourceId = Utils.getData(HR_PERSON_APPLICANT_SOURCE);

    $$('worker-name').setValue(personName);

    const tabContainer = new TabContainer('tab-container');

    let columnDefs = [
        {headerName: 'Date', field: 'dateFormatted', type: 'numericColumn', width: 100 },
        {headerName: 'Job', field: 'jobTitle', width: 200 },
        {headerName: 'Group', field: 'orgGroupName', width: 200 },
        {headerName: 'Status', field: 'status', width: 200 }
    ];
    const applicationGrid = new AGGrid('application-grid', columnDefs, 'index');
    applicationGrid.show();

    columnDefs = [
        {headerName: 'Date/Time', field: 'dateTimeFormatted', type: 'numericColumn', width: 100 },
        {headerName: 'Type', field: 'type', width: 200 },
        {headerName: 'Result', field: 'result', width: 200 },
        {headerName: 'Description', field: 'description' }
    ];
    const contactGrid = new AGGrid('contact-grid', columnDefs, 'index');
    contactGrid.show();

    columnDefs = [
        {headerName: 'Question', field: 'question', width: 400 },
        {headerName: 'Answer', field: 'displayAnswer', width: 400 }
    ];
    const questionGrid = new AGGrid('question-grid', columnDefs, 'main_key');
    questionGrid.show();

    columnDefs = [
        {headerName: 'Code', field: 'formTypeCode', width: 200 },
        {headerName: 'Description', field: 'formTypeDescription', width: 200 },
        {headerName: 'Date', field: 'dateFormatted', type: 'numericColumn', width: 200 },
        {headerName: 'File Type', field: 'extension', width: 200 },
        {headerName: 'Comment Preview', field: 'comment' }
    ];
    const formGrid = new AGGrid('form-grid', columnDefs, 'index');
    formGrid.show();

    let applications = [];
    let questionDetails = [];
    let uploadFiles = [];
    let uploadForms = [];
    let formGridData = [];
    let formMaxIndex = 0;

    Server.call(RWS, 'GetPositions').then(res => {
        if (res._Success) {
            const ctl = $$('position');
            ctl.clear().add('', '(choose)').addItems(res.positions, 'position_id', 'position_name').triggerGlobalChange(false);
            if (res.defaultPosition) {
                ctl.setValue(res.defaultPosition.position_id);
                updateQuestionGrid();
            }
        }
    });

    async function reset() {
        applications = []
        questionDetails = [];
        uploadFiles = [];
        uploadForms = [];
        formGridData = [];
        formMaxIndex = 0;

        const p1 = AWS.callSoap(SWS, 'listCompanies');

        let data = {
            description: '',
            descriptionSearchType: 0,
            id: applicantSourceId // initial selected item ID
        };
        const p2 = AWS.callSoap(SWS, 'searchApplicantSources', data);

        data = {
            id: applicantStatusId, // initial selected item ID
            name: '',
            nameSearchType: 0,
        };
        const p3 = AWS.callSoap(SWS, 'searchApplicantStatuses', data);

        const p5 = AWS.callSoap(SWS, 'listEEORaces');

        if (await AWS.callAll([p1, p2, p3, p5],
            function (res) {
                $$('company').clear();
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('company').addItems(res.item, 'id', 'name');
                }
            },
            function (res) {
                $$('applicant-source').clear();
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('applicant-source').add('', '(choose)').addItems(res.item, 'id', 'description');
                    if (res.selectedItem) {
                        $$('applicant-source').setValue(res.selectedItem.id);
                    }
                }
            },
            function (res) {
                $$('applicant-status').clear();
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('applicant-status').add('', '(choose)').addItems(res.item, 'id', 'name');
                    if (res.selectedItem) {
                        $$('applicant-status').setValue(res.selectedItem.id);
                    }
                }
            },
            function (res) {
                $$('race').clear();
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    $$('race').add('', '(select)').addItems(res.item, 'id', 'name');
                }
            }
            ))
            return;  // error

        data = {
            id: personId
        };
        AWS.callSoap(SWS, 'loadApplicant', data).then(res => {
            if (res.wsStatus === '0') {
                //// Profile Tab
                $$('first-name').setValue(res.fname);
                $$('race').setValue(res.eeoRaceId);
                $$('middle-name').setValue(res.mname);
                $$('ssn').setValue(res.ssn);
                $$('last-name').setValue(res.lname);
                $$('dob').setValue(res.dob);
                $$('nick-name').setValue(res.nickName);
                $$('personal-email').setValue(res.personalEmail);
                $$('sex').setValue(res.sex);
                $$('company').setValue(res.companyId);
                $$('citizenship').setValue(res.citizenship);
                $$('first-aware-date').setValue(firstAwareDate);
                $$('date-available').setValue(res.dateAvailable);
                $$('visa').setValue(res.visa);
                $$('visa-status-date').setValue(Number(res.visaStatusDate));
                $$('visa-expiration-date').setValue(Number(res.visaExpirationDate));
                $$('desired-salary').setValue(res.desiredSalary);
                $$('i9p1').setValue(res.i9Part1);
                $$('i9p2').setValue(res.i9Part2);
                $$('referred-by').setValue(res.referredBy);
                $$('employee-status').setValue(res.employeeStatus);

                //// Address Tab
                $$('address-line1').setValue(res.addressLine1);
                $$('home-phone').setValue(res.homePhone);
                $$('address-line2').setValue(res.addressLine2);
                $$('work-phone').setValue(res.workPhone);
                $$('country').setValue(res.country);
                $$('mobile-phone').setValue(res.mobilePhone);
                $$('city').setValue(res.city);
                $$('work-fax').setValue(res.workFax);
                $$('state-province').setValue(res.stateProvince);
                $$('zip-postal-code').setValue(res.zipPostalCode);
                $$('county').setValue(res.county);

                //// Background Tab
                $$('veteran').setValue(res.veteran);
                $$('military-branch').setValue(res.militaryBranch);
                if (res.militaryBranch === 'U') {
                    $$('enlist-from-month').setValue('0');
                    $$('enlist-from-month').disable();
                    $$('enlist-from-year').clear();
                    $$('enlist-from-year').disable();
                    $$('enlist-to-month').setValue('0');
                    $$('enlist-to-month').disable();
                    $$('enlist-to-year').clear();
                    $$('enlist-to-year').disable();
                    $$('discharge-rank').clear();
                    $$('discharge-rank').disable();
                    $$('discharge-type').setValue('U');
                    $$('discharge-type').disable();
                    $$('discharge-explain').clear();
                    $$('discharge-explain').disable();
                } else {
                    $$('enlist-from-month').enable();
                    $$('enlist-from-month').setValue(res.enlistFromMonth);
                    $$('enlist-from-year').enable();
                    $$('enlist-from-year').setValue(res.enlistFromYear);
                    $$('enlist-to-month').enable();
                    $$('enlist-to-month').setValue(res.enlistToMonth);
                    $$('enlist-to-year').enable();
                    $$('enlist-to-year').setValue(res.enlistToYear);
                    $$('discharge-rank').enable();
                    $$('discharge-rank').setValue(res.dischargeRank);
                    $$('discharge-type').enable();
                    $$('discharge-type').setValue(res.dischargeType);

                    if (res.dischargeType === 'U' || res.dischargeType === 'H') {
                        $$('discharge-explain').clear();
                        $$('discharge-explain').disable();
                    } else {
                        $$('discharge-explain').enable();
                        $$('discharge-explain').setValue(res.dischargeExplain);
                    }
                }
                $$('convicted').setValue(res.convicted);
                if (res.convicted === 'Y') {
                    $$('convicted-description').enable();
                    $$('convicted-description').setValue(res.convictedDescription);
                } else {
                    $$('convicted-description').clear();
                    $$('convicted-description').disable();
                }
                $$('worked-for').setValue(res.workedFor);
                if (res.workedFor === 'Y') {
                    $$('worked-for-when').enable();
                    $$('worked-for-when').setValue(res.workedForWhen);
                } else {
                    $$('worked-for-when').clear();
                    $$('worked-for-when').disable();
                }


                //// Comments Tab
                $$('comments').setValue(res.comments);


                /// Applications Tab
                if (res.applications) {
                    applicationGrid.clear();
                    applications = Utils.assureArray(res.applications);
                    for (let i = 0; i < applications.length; i++) {
                        applications[i].index = i;
                        applications[i].dateFormatted = DateUtils.intToStr4(applications[i].date);
                        applications[i].contacts = applications[i].contacts ? Utils.assureArray(applications[i].contacts) : [];
                    }
                    applicationGrid.addRecords(applications);
                    $$('application-status').setValue('Displaying ' + applications.length + ' Application' + (applications.length > 1 ? 's' : ''));
                } else {
                    $$('application-status').setValue('Displaying 0 Applications');
                    applicationGrid.clear();
                }
                $$('contact-status').setValue('Displaying 0 Contacts');
                $$('application-add').enable();
                $$('application-edit').disable();
                $$('application-delete').disable();
                $$('contact-add').disable();
                $$('contact-edit').disable();
                $$('contact-delete').disable();

                /// Questions Tab
                questionDetails = Utils.assureArray(res.questionDetails);

                $$('question-edit').disable();

                /// Forms Tab
                if (res.forms) {
                    formGrid.clear();
                    formGridData = Utils.assureArray(res.forms);
                    for (let i = 0; i < formGridData.length; i++) {
                        formGridData[i].index = i;
                        formGridData[i].dateFormatted = DateUtils.intToStr4(formGridData[i].date);
                        uploadForms.push({
                            index: i,
                            comment: formGridData[i].comment,
                            formTypeId: formGridData[i].formTypeId,
                            id: formGridData[i].id
                        });
                    }
                    formMaxIndex = formGridData.length;
                    formGrid.addRecords(formGridData);
                    $$('form-status').setValue('Displaying ' + formGridData.length + ' Applicant Form' + (formGridData.length > 1 ? 's' : ''));
                } else {
                    $$('form-status').setValue('Displaying 0 Applicant Forms');
                    formGrid.clear();
                }
                $$('form-add').enable();
                $$('form-view').disable();
                $$('form-edit').disable();
                $$('form-delete').disable();
            }
        });

        $$('save').disable();
        $$('reset').disable();
        Utils.clearSomeControlValueChanged(false);
        $$('worker-name').setValue(personName).setColor('black');
        Framework.askBeforeLeaving = false;
    }

    function setSomeValueChanged() {
        $$('save').enable();
        $$('reset').enable();
        $$('worker-name').setValue(personName + " (unsaved changes)").setColor('red');
        Framework.askBeforeLeaving = true;
    }

    Utils.setSomeControlValueChangeFunction(setSomeValueChanged);

    reset();

    $$('reset').onclick(reset);

    $$('discharge-type').onChange(() => {
        if ($$('discharge-type').getValue() === 'U' || $$('discharge-type').getValue() === 'H') {
            $$('discharge-explain').clear();
            $$('discharge-explain').disable();
        } else {
            $$('discharge-explain').enable();
        }
    });

    $$('convicted').onChange(() => {
        if ($$('convicted').getValue() === 'Y') {
            $$('convicted-description').enable();
        } else {
            $$('convicted-description').clear();
            $$('convicted-description').disable();
        }
    });

    $$('worked-for').onChange(() => {
        if ($$('worked-for').getValue() === 'Y') {
            $$('worked-for-when').enable();
        } else {
            $$('worked-for-when').clear();
            $$('worked-for-when').disable();
        }
    });

    $$('military-branch').onChange(() => {
        if ($$('military-branch').getValue() === 'U') {
            $$('enlist-from-month').setValue('0');
            $$('enlist-from-month').disable();
            $$('enlist-from-year').clear();
            $$('enlist-from-year').disable();
            $$('enlist-to-month').setValue('0');
            $$('enlist-to-month').disable();
            $$('enlist-to-year').clear();
            $$('enlist-to-year').disable();
            $$('discharge-rank').clear();
            $$('discharge-rank').disable();
            $$('discharge-type').setValue('U');
            $$('discharge-type').disable();
            $$('discharge-explain').clear();
            $$('discharge-explain').disable();
        } else {
            $$('enlist-from-month').enable();
            $$('enlist-from-year').enable();
            $$('enlist-to-month').enable();
            $$('enlist-to-year').enable();
            $$('discharge-rank').enable();
            $$('discharge-type').enable();
        }
    });

    function convertType(value) {
        switch (value) {
            case 'C':
                return 'Company Site';
            case 'E':
                return 'E-mail';
            case 'F':
                return 'Fax';
            case 'M':
                return 'Mail';
            case 'P':
                return 'Phone';
            case 'R':
                return 'Remote Location';
            default:
                return '';
        }
    }

    const convertResult = (value) => {
        switch (value) {
            case 'S':
                return 'Appointment Set';
            case 'A':
                return 'Applicant Cancelled/Rescheduled';
            case 'C':
                return 'Company Cancelled/Rescheduled';
            case 'N':
                return 'No Show';
            case 'L':
                return 'Late';
            case 'O':
                return 'On Time';
            case 'G':
                return 'Other';
            default:
                return '';
        }
    };

    applicationGrid.setOnSelectionChanged((rows) => {
        if (!rows.length)
            return;
        const row = rows[0];

        if (row.contacts) {
            contactGrid.clear();
            const contacts = row.contacts;
            for (let i = 0; i < contacts.length; i++) {
                contacts[i].index = i;
                contacts[i].type = convertType(contacts[i].mode);
                contacts[i].result = convertResult(contacts[i].status);
            }
            contactGrid.addRecords(contacts);
            $$('contact-status').setValue('Displaying ' + contacts.length + ' Contact' + (contacts.length > 1 ? 's' : ''));
        } else {
            $$('contact-status').setValue('Displaying 0 Contacts');
            contactGrid.clear();
        }

        $$('application-edit').enable();
        $$('application-delete').enable();
        $$('contact-add').enable();
        $$('contact-edit').disable();
        $$('contact-delete').disable();
    });
    
    contactGrid.setOnSelectionChanged((rows) => {
        $$('contact-edit').enable(rows);
        $$('contact-delete').enable(rows);
    });
    
    $$('save').onclick(() => {
        if ($$('first-name').isError('First Name'))
            return;
        if ($$('last-name').isError('Last Name'))
            return;
        if ($$('first-aware-date').isError('First Aware Date'))
            return;
        /*
        if ($$('date-available').isError('Date Available')) {
            return;
        }
         */
        if ($$('applicant-status').isError('Applicant Status'))
            return;
        if ($$('applicant-source').isError('Applicant Source'))
            return;
        const ssn = $$('ssn').getValue();
        if (ssn && !Utils.isValidSsn(ssn)) {
            Utils.showMessage('Error', 'Invalid SSN.');
            return;
        }
        if ($$('military-branch').getValue() !== 'U') {
            if ($$('enlist-from-month').getValue() === '0') {
                Utils.showMessage('Error', 'Enlist From Month is required.');
                return;
            }
            if ($$('enlist-from-year').isError('Enlist From Year'))
                return;
            if ($$('enlist-to-month').getValue() === '0') {
                Utils.showMessage('Error', 'Enlist To Month is required.');
                return;
            }
            if ($$('enlist-to-year').isError('Enlist To Year'))
                return;
            if ($$('discharge-rank').isError('Rank At Discharge'))
                return;
        }
        /*
        if (applications.length === 0) {
            Utils.showMessage('Error', 'At least 1 application required.');
            return;
        }
         */
        const requestApplications = [];
        for (let i = 0; i < applications.length; i++) {
            const requestContacts = [];
            if (applications[i].contacts)
                for (let j = 0; j < applications[i].contacts.length; j++) {
                    requestContacts.push({
                        date: applications[i].contacts[j].date,
                        description: applications[i].contacts[j].description,
                        id: applications[i].contacts[j].id,
                        mode: applications[i].contacts[j].mode,
                        status: applications[i].contacts[j].status,
                        time: applications[i].contacts[j].time
                    });
                }
            requestApplications.push({
                contacts: requestContacts,
                date: applications[i].date,
                id: applications[i].id,
                applicantPositionId: applications[i].applicantPositionId,
                positionId: applications[i].positionId,
                sourceId: applications[i].sourceId,
                statusId: applications[i].statusId,
                title: applications[i].title,
                payRate: applications[i].payRate,
                applicationPositionId: applications[i].applicationPositionId
            });
        }

        const requestForms = [];
        for (let i = 0; i < uploadForms.length; i++) {
            requestForms.push({
                comment: uploadForms[i].comment,
                formTypeId: uploadForms[i].formTypeId,
                id: uploadForms[i].id
            });
        }

        const requestQuestions = [];
        /*
        for (let i = 0; i < questionDetails.length; i++) {
            questionDetails[i].question = Utils.assureArray(questionDetails[i].question);
            for (let j = 0; j < questionDetails[i].question.length; j++) {
                requestQuestions.push({
                    answerType: questionDetails[i].question[j].answerType,
                    applicantQuestionId: questionDetails[i].question[j].applicantQuestionId,
                    listBasedAnswerId: '',
                    numberBasedAnswer: questionDetails[i].question[j].numberBasedAnswer,
                    textBasedAnswer: questionDetails[i].question[j].textBasedAnswer
                });
            }
        }

         */

        const data = {
            applications: requestApplications,
            forms: requestForms,
            questionDetails: requestQuestions,
            addressLine1: $$('address-line1').getValue(),
            addressLine2: $$('address-line2').getValue(),
            applicantSourceId: $$('applicant-source').getValue(),
            applicantStatusId: $$('applicant-status').getValue(),
            citizenship: $$('citizenship').getValue(),
            city: $$('city').getValue(),
            stateProvince: $$('state-province').getValue(),
            comments: $$('comments').getValue(),
            convicted: $$('convicted').getValue(),
            convictedDescription: $$('convicted-description').getValue(),
            country: $$('country').getValue(),
            county: $$('county').getValue(),
            dateAvailable: $$('date-available').getIntValue(),
            desiredSalary: $$('desired-salary').getValue(),
            dischargeExplain: $$('discharge-explain').getValue(),
            dischargeRank: $$('discharge-rank').getValue(),
            dischargeType: $$('discharge-type').getValue(),
            dob: $$('dob').getIntValue(),
            eeoRaceId: $$('race').getValue(),
            enlistFromMonth: $$('enlist-from-month').getValue(),
            enlistFromYear: $$('enlist-from-year').getValue(),
            enlistToMonth: $$('enlist-to-month').getValue(),
            enlistToYear: $$('enlist-to-year').getValue(),
            firstAwareDate: $$('first-aware-date').getIntValue(),
            firstName: $$('first-name').getValue(),
            homePhone: $$('home-phone').getValue(),
            i9Part1: $$('i9p1').getValue(),
            i9Part2: $$('i9p2').getValue(),
            id: personId,
            lastName: $$('last-name').getValue(),
            middleName: $$('middle-name').getValue(),
            militaryBranch: $$('military-branch').getValue(),
            mobilePhone: $$('mobile-phone').getValue(),
            nickName: $$('nick-name').getValue(),
            personalEmail: $$('personal-email').getValue(),
            sendEmail: false,
            sex: $$('sex').getValue(),
            ssn: Utils.formatSsn(ssn),
            visa: $$('visa').getValue(),
            visaExpirationDate: $$('visa-expiration-date').getIntValue(),
            visaStatusDate: $$('visa-status-date').getIntValue(),
            workFax: $$('work-fax').getValue(),
            workPhone: $$('work-phone').getValue(),
            workedFor: $$('worked-for').getValue(),
            workedForWhen: $$('worked-for-when').getValue(),
            zipPostalCode: $$('zip-postal-code').getValue(),
            referredBy: $$('referred-by').getValue(),
            veteran:  $$('veteran').getValue()
        };

        AWS.callSoap(SWS, 'saveApplicant', data).then(async (res) => {
            if (res.wsStatus === '0') {
                for (let i = 0; i < uploadFiles.length; i++)
                    await AWS.fileUpload('fp-form', 'hrFormUpload', uploadFiles[i]);
                reset();
            }
        });

        const positionId = $$('position').getValue();
        if (positionId) {
            const indata = {
                positionId: positionId,
                personId: personId,
                questions: questionGrid.getAllRows()
            };
            Server.call(RWS, 'SaveQuestions', indata).then(res => {
                if (res._Success) {

                }
            });
        }
    });

    function updateApplicationGrid() {
        applicationGrid.clear();
        for (let i = 0; i < applications.length; i++)
            applications[i].positionFormatted = applications[i].positionId ? applications[i].position : '(no position)';
        applicationGrid.addRecords(applications);
        $$('application-status').setValue('Displaying ' + applications.length + ' Application' + (applications.length > 1 ? 's' : ''));
        contactGrid.clear();
        $$('contact-status').setValue('Displaying 0 Contacts');
        $$('application-add').enable();
        $$('application-edit').disable();
        $$('application-delete').disable();
        $$('contact-add').disable();
        $$('contact-edit').disable();
        $$('contact-delete').disable();
    }

    function addApplication() {
        $$('ap-title').setValue('Add Application');
        $$('ap-date').setValue(DateUtils.today());
        $$('ap-org-group').clear();
        $$('ap-pay-rate').clear();

        Utils.popup_open("application-popup", "ap-date");
        const prevWatch = Utils.watchControlValueChanges(false);

        AWS.callSoap(SWS, 'searchJobs').then(res => {
            $$('ap-job-title').clear();
            if (res.wsStatus === '0') {
                if (res.item) {
                    res.item = Utils.assureArray(res.item);
                    $$('ap-job-title').add('', '(select)').addItems(res.item, 'applicantPositionId', 'jobTitle');
                }
            }
        });

        function updateGroup() {
            const data = $$('ap-job-title').getData();
            $$('ap-org-group').setValue(data ? data.orgGroupName : '');
        }

        $$('ap-job-title').onChange(updateGroup);

        let request = {
            id: '',
            name: '',
            nameSearchType: 0
        };

        AWS.callSoap(SWS, 'searchApplicationStatuses', request).then(res => {
            $$('ap-status').clear();
            if (res.wsStatus === '0') {
                if (res.item) {
                    res.item = Utils.assureArray(res.item);
                    $$('ap-status').add('', '(choose)').addItems(res.item, 'id', 'name');
                }
            }
        });

        Server.call(RWS, 'GetPositions').then(res => {
            if (res._Success) {
                $$('ap-position').clear().add('', '(choose)').addItems(res.positions, 'position_id', 'position_name');
            }
        });

        $$('ap-ok').onclick(() => {
            if ($$('ap-job-title').isError('Job title'))
                return;
            if ($$('ap-position').isError('Position'))
                return;
            if ($$('ap-status').isError('Status'))
                return;

            const data = {
                index: applications.length,
                date: $$('ap-date').getIntValue(),
                dateFormatted: DateUtils.intToStr4($$('ap-date').getIntValue()),
                applicantPositionId: $$('ap-job-title').getValue(),
                orgGroupName: $$('ap-org-group').getValue(),
                status: $$('ap-status').getData().name,
                statusId: $$('ap-status').getValue(),
                payRate: $$('ap-pay-rate').getValue(),
                positionId: $$('ap-job-title').getData().positionId,
                applicationPositionId: $$('ap-position').getValue()
            };
            applications.push(data);
            updateApplicationGrid();
            Utils.watchControlValueChanges(prevWatch);
            Utils.someControlValueChanged();
            Utils.popup_close();
        });

        $$('ap-cancel').onclick(() => {
            Utils.watchControlValueChanges(prevWatch);
            Utils.popup_close();
        });
    }

    function editApplication() {
        $$('ap-title').setValue('Edit Application');
        const row = applicationGrid.getSelectedRow();
        if (!row)
            return;
        $$('ap-date').setValue(row.date ? row.date : DateUtils.today());
        $$('ap-org-group').setValue(row.orgGroupName);
        $$('ap-pay-rate').setValue(row.payRate);

        Utils.popup_open("application-popup", "ap-date");

        const prevWatch = Utils.watchControlValueChanges(false);

        AWS.callSoap(SWS, 'searchJobs').then(res => {
            $$('ap-job-title').clear();
            if (res.wsStatus === '0') {
                if (res.item) {
                    res.item = Utils.assureArray(res.item);
                    $$('ap-job-title').add('', '(select)').addItems(res.item, 'applicantPositionId', 'jobTitle');
                    $$('ap-job-title').setValue(row.applicantPositionId);
                }
            }
        });

        function updateGroup() {
            const data = $$('ap-job-title').getData();
            $$('ap-org-group').setValue(data ? data.orgGroupName : '');
        }

        $$('ap-job-title').onChange(updateGroup);

        let request = {
            id: '',
            name: '',
            nameSearchType: 0
        };

        AWS.callSoap(SWS, 'searchApplicationStatuses', request).then(res => {
            $$('ap-status').clear();
            if (res.wsStatus === '0') {
                if (res.item) {
                    res.item = Utils.assureArray(res.item);
                    $$('ap-status').add('', '(choose)').addItems(res.item, 'id', 'name');
                }
                $$('ap-status').setValue(row.statusId);
            }
        });

        Server.call(RWS, 'GetPositions').then(res => {
            if (res._Success) {
                $$('ap-position').clear().add('', '(choose)').addItems(res.positions, 'position_id', 'position_name');
                $$('ap-position').setValue(row.applicationPositionId);
            }
        });

        request = {
            id: '',
            name: '',
            nameSearchType: 0,
            positionId: ''
        };

        $$('ap-ok').onclick(() => {
            if ($$('ap-status').isError('Status'))
                return;

            for (let i = 0; i < applications.length; i++) {
                if (applications[i].index === row.index) {
                    applications[i].date = $$('ap-date').getIntValue();
                    applications[i].dateFormatted = DateUtils.intToStr4($$('ap-date').getIntValue());
                //    applications[i].position = $$('ap-position').getData() ? $$('ap-position').getData().position : '';
                //    applications[i].positionId = $$('ap-position').getValue();
                    applications[i].orgGroupName = $$('ap-org-group').getValue();
                    applications[i].status = $$('ap-status').getData().name;
                    applications[i].statusId = $$('ap-status').getValue();
                    applications[i].payRate = $$('ap-pay-rate').getValue();
                    applications[i].applicationPositionId = $$('ap-position').getValue();
                }
            }

            updateApplicationGrid();
            Utils.watchControlValueChanges(prevWatch);
            Utils.someControlValueChanged();
            Utils.popup_close();
        });

        $$('ap-cancel').onclick(() => {
            Utils.watchControlValueChanges(prevWatch);
            Utils.popup_close();
        });
    }

    $$('application-add').onclick(addApplication);
    $$('application-edit').onclick(editApplication);
    applicationGrid.setOnRowDoubleClicked(editApplication);

    $$('application-delete').onclick(() => {
        const row = applicationGrid.getSelectedRow();
        if (!row)
            return;

        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Application?', () => {
            const newApplications = [];
            for (let i = 0; i < applications.length; i++) {
                if (applications[i].index !== row.index) {
                    newApplications.push(applications[i]);
                }
            }
            applications = newApplications;
            for (let i = 0; i < applications.length; i++) {
                applications[i].index = i;
            }
            updateApplicationGrid();
            setSomeValueChanged();
        });
    });

    function updateContacsGrid() {
        const selectedApplication = applicationGrid.getSelectedRow();
        if (!selectedApplication)
            return;
        contactGrid.clear();
        const contacts = Utils.assureArray(selectedApplication.contacts);
        for (let i = 0; i < contacts.length; i++) {
            contacts[i].index = i;
            contacts[i].type = convertType(contacts[i].mode);
            contacts[i].result = convertResult(contacts[i].status);
        }
        contactGrid.addRecords(contacts);
        $$('contact-status').setValue('Displaying ' + contacts.length + ' Contact' + (contacts.length > 1 ? 's' : ''));
        $$('contact-add').enable();
        $$('contact-edit').disable();
        $$('contact-delete').disable();
    }
    
    function addContact() {
        const selectedApplication = applicationGrid.getSelectedRow();
        if (!selectedApplication)
            return;

        $$('cp-title').setValue('Add Contact');
        $$('cp-date').setValue(DateUtils.today());
        $$('cp-time').setValue(TimeUtils.current());
        $$('cp-type').setValue('');
        $$('cp-result').setValue('');
        $$('cp-detail').clear();

        Utils.popup_open("contact-popup", "cp-date");

        $$('cp-ok').onclick(() => {
            if ($$('cp-date').isError('Date'))
                return;
            if ($$('cp-time').isError('Time'))
                return;
            if ($$('cp-type').isError('Type'))
                return;
            if ($$('cp-result').isError('Result'))
                return;
            if ($$('cp-detail').isError('Detail'))
                return;

            const data = {
                index: selectedApplication.length,
                date: $$('cp-date').getIntValue(),
                description: $$('cp-detail').getValue(),
                mode: $$('cp-type').getValue(),
                status: $$('cp-result').getValue(),
                time: $$('cp-time').getValue() * 100000,
                dateTimeFormatted: DateUtils.intToStr4($$('cp-date').getIntValue()) + '  ' + TimeUtils.format($$('cp-time').getValue())
            };
            
            for (let i = 0; i < applications.length; i++)
                if (applications[i].index === selectedApplication.index)
                    applications[i].contacts.push(data);

            updateContacsGrid();

            Utils.popup_close();
        });
        $$('cp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('contact-add').onclick(addContact);

    function editContact() {
        const selectedApplication = applicationGrid.getSelectedRow();
        if (!selectedApplication)
            return;
        const selectedContact = contactGrid.getSelectedRow();
        if (!selectedContact)
            return;

        $$('cp-title').setValue('Add Contact');
        $$('cp-date').setValue(selectedContact.date);
        $$('cp-time').setValue(selectedContact.time / 100000);
        $$('cp-type').setValue(selectedContact.mode);
        $$('cp-result').setValue(selectedContact.status);
        $$('cp-detail').setValue(selectedContact.description);

        Utils.popup_open("contact-popup", "cp-date");

        $$('cp-ok').onclick(() => {
            if ($$('cp-date').isError('Date'))
                return;
            if ($$('cp-time').isError('Time'))
                return;
            if ($$('cp-type').isError('Type'))
                return;
            if ($$('cp-result').isError('Result'))
                return;
            if ($$('cp-detail').isError('Detail'))
                return;

            for (let i = 0; i < applications.length; i++) {
                if (applications[i].index === selectedApplication.index) {
                    for (let j = 0; j < selectedApplication.contacts.length; j++) {
                        if (applications[i].contacts[j].index === selectedContact.index) {
                            applications[i].contacts[j].date = $$('cp-date').getIntValue();
                            applications[i].contacts[j].description = $$('cp-detail').getValue();
                            applications[i].contacts[j].mode = $$('cp-type').getValue();
                            applications[i].contacts[j].status = $$('cp-result').getValue();
                            applications[i].contacts[j].time = $$('cp-time').getValue() * 100000;
                            applications[i].contacts[j].dateTimeFormatted = DateUtils.intToStr4($$('cp-date').getIntValue()) + '  ' + TimeUtils.format($$('cp-time').getValue());
                        }
                    }
                    break;
                }
            }

            updateContacsGrid();

            Utils.popup_close();
        });
        $$('cp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('contact-edit').onclick(editContact);
    contactGrid.setOnRowDoubleClicked(editContact);

    $$('contact-delete').onclick(() => {
        const selectedApplication = applicationGrid.getSelectedRow();
        if (!selectedApplication)
            return;
        const selectedContact = contactGrid.getSelectedRow();
        if (!selectedContact)
            return;

        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Application?', () => {
            for (let i = 0; i < applications.length; i++) {
                if (applications[i].index === selectedApplication.index) {
                    let newContacts = [];
                    for (let j = 0; j < applications[i].contacts.length; j++)
                        if (applications[i].contacts[j].index !== selectedContact.index)
                            newContacts.push(applications[i].contacts[j]);
                    applications[i].contacts = newContacts;
                    for (let j = 0; j < applications[i].contacts.length; j++)
                        applications[i].contacts[j].index = j;
                    break;
                }
                setSomeValueChanged();
            }
            updateContacsGrid();
        });
    });

    function updateQuestionGrid() {
        const positionId = $$('position').getValue();
        questionGrid.clear();
        if (!positionId)
            return;
        const indata = {
            positionId: positionId,
            personId: personId
        };
        Server.call(RWS, 'LoadQuestions', indata).then(res => {
            if (res._Success) {
                for (let i=0 ; i < res.questions.length ; i++) {
                    let q = res.questions[i];
                    switch (q.data_type) {
                        case 'N':  // numeric
                            q.displayAnswer = (q.numeric_answer ? q.numeric_answer : '') + '';
                            break;
                        case 'D':  // date
                            q.displayAnswer = DateUtils.intToStr4(q.date_answer);
                            break;
                        case 'S':  // string
                            q.displayAnswer = (q.string_answer ? q.string_answer : '');
                            break;
                        case 'Y':  // yes/no
                            q.displayAnswer = q.string_answer === 'Y' ? 'Yes' : (q.string_answer === 'N'? 'No' : '');
                            break;
                        case 'L': // list of choices
                            q.displayAnswer = q.description;
                            break;
                    }
                    q.main_key = q.applicant_question_id + 'x' + (q.applicant_answer_id ? q.applicant_answer_id : '');
                    questionGrid.addRecords(q);
                }
            }
        });
        /*
        AWS.callSoap(SWS, 'loadQuestions', {
            positionId: positionId
        }).then(res => {
            if (res.wsStatus === '0') {
                if (res.item) {
                    res.item = Utils.assureArray(res.item);
                    for (let j = 0; j < questionDetails.length; j++) {
                        if (questionDetails[j].jobTypeId === positionId) {
                            for (let i = 0; i < res.item.length; i++) {
                                let k = 0;
                                questionDetails[j].question = Utils.assureArray(questionDetails[j].question);
                                for (; k < questionDetails[j].question.length; k++) {
                                    if (res.item[i].applicantQuestionId === questionDetails[j].question[k].applicantQuestionId) {
                                        res.item[i].listBasedAnswer = questionDetails[j].question[k].listBasedAnswer;
                                        res.item[i].listBasedAnswerId = questionDetails[j].question[k].listBasedAnswerId;
                                        res.item[i].numberBasedAnswer = questionDetails[j].question[k].numberBasedAnswer;
                                        res.item[i].textBasedAnswer = questionDetails[j].question[k].textBasedAnswer;
                                        if (res.item[i].answerType === 'S') {
                                            res.item[i].displayAnswer = questionDetails[j].question[k].textBasedAnswer;
                                        } else if (res.item[i].answerType === 'N') {
                                            res.item[i].displayAnswer = questionDetails[j].question[k].numberBasedAnswer;
                                        } else if (res.item[i].answerType === 'Y') {
                                            if (questionDetails[j].question[k].numberBasedAnswer === '1.0') {
                                                res.item[i].displayAnswer = 'Yes';
                                            } else if (questionDetails[j].question[k].numberBasedAnswer === '2.0') {
                                                res.item[i].displayAnswer = 'No';
                                            } else {
                                                res.item[i].displayAnswer = 'Unknown';
                                            }
                                        }
                                        break;
                                    }
                                }
                                if (k === questionDetails[j].question.length) {
                                    if (res.item[i].answerType === 'Y') {
                                        res.item[i].displayAnswer = 'Unknown';
                                    } else {
                                        res.item[i].displayAnswer = '';
                                    }
                                }
                            }
                            break;
                        }
                    }
                    questionGrid.addRecords(res.item);
                }
                $$('question-edit').disable();
            }
        });
         */
    }

    $$('position').onChange(updateQuestionGrid);

    questionGrid.setOnSelectionChanged($$('question-edit').enable);

    function editQuestion() {
        const row = questionGrid.getSelectedRow();
        if (!row)
            return;

        $$('qp-answer-y').clear();
        $$('qp-answer-n').clear();
        $$('qp-answer-s').clear();

        let sz;
        if (row.data_type === 'Y') {
            // Yes/No
            sz = '180px';
            $('#y-container').css('display', 'inline-block');
            $('#qp-answer-s').css('display', 'none');
            $('#qp-answer-n').css('display', 'none');
            $('#qp-answer-d').css('display', 'none');
            $('#qp-answer-dd').css('display', 'none');

            if (row.string_answer === 'Y' || row.string_answer === 'N')
                $$('qp-answer-y').setValue(row.string_answer);
            else
                $$('qp-answer-y').setValue('U');
        } else if (row.data_type === 'S') {
            // String
            sz = '348px';
            $('#y-container').css('display', 'none');
            $('#qp-answer-s').css('display', 'block');
            $('#qp-answer-n').css('display', 'none');
            $('#qp-answer-d').css('display', 'none');
            $('#qp-answer-dd').css('display', 'none');

            $$('qp-answer-s').setValue(row.string_answer);
            setTimeout(() => { $$('qp-answer-s').focus(); }, 100);
        } else if (row.data_type === 'N') {
            // Numeric
            sz = '180px';
            $('#y-container').css('display', 'none');
            $('#qp-answer-s').css('display', 'none');
            $('#qp-answer-n').css('display', 'block');
            $('#qp-answer-d').css('display', 'none');
            $('#qp-answer-dd').css('display', 'none');

            $$('qp-answer-n').setValue(row.numeric_answer);
            setTimeout(() => { $$('qp-answer-n').focus(); }, 100);
        } else if (row.data_type === 'D') {
            // Date

            $('#y-container').css('display', 'none');
            $('#qp-answer-s').css('display', 'none');
            $('#qp-answer-n').css('display', 'none');
            $('#qp-answer-d').css('display', 'block');
            $('#qp-answer-dd').css('display', 'none');
            sz = '180px';

            $$('qp-answer-d').setValue(row.date_answer);
            setTimeout(() => { $$('qp-answer-d').focus(); }, 100);
        } else if (row.data_type === 'L') {
            // List
            sz = '180px';
            $('#y-container').css('display', 'none');
            $('#qp-answer-s').css('display', 'none');
            $('#qp-answer-n').css('display', 'none');
            $('#qp-answer-d').css('display', 'none');
            $('#qp-answer-dd').css('display', 'block');

            let dd = $$('qp-answer-dd');
            dd.clear().add('', '(unsecified)');
            if (row.choices) {
                for (let i = 0; i < row.choices.length; i++) {
                    let c = row.choices[i];
                    dd.add(c.applicant_question_choice_id, c.description);
                }
                dd.setValue(row.applicant_question_choice_id);
            }
        }

        Utils.popup_open("question-popup");
        Utils.popup_set_height('question-popup', sz);

        $$('qp-question').setValue(row.question);

        $$('qp-ok').onclick(() => {
            if (row.data_type === 'S') {
                // String
                row.displayAnswer = $$('qp-answer-s').getValue();
                row.string_answer = $$('qp-answer-s').getValue();
            } else if (row.data_type === 'Y') {
                // Yes/No
                if ($$('qp-answer-y').getValue() === 'Y') {
                    row.displayAnswer = 'Yes';
                    row.string_answer = 'Y';
                } else if ($$('qp-answer-y').getValue() === 'N') {
                    row.displayAnswer = 'No';
                    row.string_answer = 'N';
                } else {
                    row.displayAnswer = 'Unknown';
                    row.string_answer = '';
                }
            } else if (row.data_type === 'N') {
                // Numeric
                row.displayAnswer = $$('qp-answer-n').getValue();
                row.numeric_answer = $$('qp-answer-n').getValue();
            } else if (row.data_type === 'D') {
                // Date
                row.date_answer = $$('qp-answer-d').getIntValue();
                row.displayAnswer = DateUtils.intToStr4(row.date_answer);
            } else if (row.data_type === 'L') {
                // List
                row.displayAnswer = $$('qp-answer-dd').getLabel();
                row.applicant_question_choice_id = $$('qp-answer-dd').getValue();
            }
            questionGrid.updateSelectedRecord(row);

            /*
            const questions = questionGrid.getAllRows();
            for (let i = 0; i < questions.length; i++)
                if (questions[i].applicantQuestionId === row.applicantQuestionId)
                    questions[i] = row;
            questionGrid.clear();
            questionGrid.addRecords(questions);

            let found = false;
            let i;
            questionDetails = Utils.assureArray(questionDetails);
            for (i = 0; i < questionDetails.length && !found ; i++) {
                questionDetails[i].question = Utils.assureArray(questionDetails[i].question);
                for (let j = 0; j < questionDetails[i].question.length; j++) {
                    if (questionDetails[i].question[j].applicantQuestionId === row.applicantQuestionId) {
                        questionDetails[i].question[j].numberBasedAnswer = row.numberBasedAnswer;
                        questionDetails[i].question[j].textBasedAnswer = row.textBasedAnswer;
                        found = true;
                        break;
                    }
                }
            }
            if (!found)
                for (i = 0; i < questionDetails.length && !found ; i++) {
                    if (questionDetails[i].jobTypeId === row.jobTypeId) {
                        questionDetails[i].question.push({
                            answerType: row.data_type,
                            common: row.common,
                            applicantQuestionId: row.applicantQuestionId,
                            listBasedAnswer: '',
                            listBasedAnswerId: '',
                            numberBasedAnswer: row.numberBasedAnswer,
                            question: row.question,
                            textBasedAnswer: row.textBasedAnswer
                        });
                        found = true;
                        break;
                    }
                }
            if (!found) {
                questionDetails.push({
                    jobTypeId: row.jobTypeId,
                    question: []
                });
                questionDetails[i].question.push({
                    answerType: row.data_type,
                    common: row.common,
                    applicantQuestionId: row.applicantQuestionId,
                    listBasedAnswer: '',
                    listBasedAnswerId: '',
                    numberBasedAnswer: row.numberBasedAnswer,
                    question: row.question,
                    textBasedAnswer: row.textBasedAnswer
                });
            }
*/
            Utils.popup_close();
        });

        $$('qp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('question-edit').onclick(editQuestion);
    questionGrid.setOnRowDoubleClicked(editQuestion);

    formGrid.setOnSelectionChanged((rows) => {
        $$('form-view').enable(rows);
        $$('form-edit').enable(rows);
        $$('form-delete').enable(rows);
    });
    
    function addForm() {
        $('#form-popup--height').css('height', '306px');
        Utils.popup_open('form-popup');
        
        function reset() {
            $$('fp-title').setValue('Add Form');
            $$('fp-description').clear();
            $$('fp-comments').clear();
            $$('fp-form').clear();
            $$('fp-form').show();
            $$('form-label').show();

            AWS.callSoap(SWS, 'listFormTypes').then(res => {
                if (res.wsStatus === '0') {
                    const codeCtrl = $$('fp-code');
                    codeCtrl.clear();

                    codeCtrl.add("", "(select)");

                    // Add the sources to the drop-down control.
                    res.item = Utils.assureArray(res.item);
                    codeCtrl.addItems(res.item, 'formTypeId', 'code');
                }
            })
        }

        reset();

        $$('fp-code').onChange(() => {
            const selectedItem = $$('fp-code').getData();
            if (selectedItem) {
                $$('fp-description').setValue(selectedItem.description);                
            } else {
                $$('fp-description').clear();                
            }
        });
        
        function ok() {
            if ($$('fp-code').isError('Code'))
                return;
            if ($$('fp-form').isError('Form'))
                return;

            formGridData.push({
                index: formMaxIndex,
                comment: $$('fp-comments').getValue(),
                date: DateUtils.today(),
                dateFormatted: DateUtils.intToStr4(DateUtils.today()),
                extension: $$('fp-form').uploadFileExtension(0),
                formTypeId: $$('fp-code').getValue(),
                formTypeCode: $$('fp-code').getData().code,
                formTypeDescription: $$('fp-description').getValue()
            });

            uploadFiles.push({
                index: formMaxIndex,
                comments: $$('fp-comments').getValue(),
                personId: personId,
                myFilename: $$('fp-form').uploadFilename(0),
                formTypeId: $$('fp-code').getValue()
            });

            formMaxIndex++;

            formGrid.clear();
            formGrid.addRecords(formGridData);
            $$('form-status').setValue('Displaying ' + formGridData.length + ' Applicant Form' + (formGridData.length > 1 ? 's' : ''));
            $$('form-add').enable();
            $$('form-view').disable();
            $$('form-edit').disable();
            $$('form-delete').disable();
            Utils.popup_close();
        }

        function cancel() {
            Utils.popup_close();
        }

        $$('fp-ok').onclick(ok);
        $$('fp-cancel').onclick(cancel);
    }

    $$('form-add').onclick(addForm);

    function editForm() {
        $('#form-popup--height').css('height', '278px');
        Utils.popup_open('form-popup');
        const row = formGrid.getSelectedRow();
        if (!row)
            return;
        
        function reset() {
            $$('fp-title').setValue('Edit Form');
            $$('fp-description').setValue(row.formTypeDescription);
            $$('fp-comments').setValue(row.comment);
            $$('fp-form').hide();
            $$('form-label').hide();
            
            AWS.callSoap(SWS, 'listFormTypes').then(res => {
                if (res.wsStatus === '0') {
                    const codeCtrl = $$('fp-code');
                    codeCtrl.clear();

                    codeCtrl.add("", "(select)");

                    // Add the sources to the drop-down control.
                    res.item = Utils.assureArray(res.item);
                    codeCtl.addItems(res.item, 'formTypeId', 'code');
                    codeCtl.setValue(row.formTypeId);
                }
            });
        }

        reset();

        $$('fp-code').onChange(() => {
            const selectedItem = $$('fp-code').getData();
            if (selectedItem) {
                $$('fp-description').setValue(selectedItem.description);                
            } else {
                $$('fp-description').clear();                
            }
        });

        const ok = () => {
            if ($$('fp-code').isError('Code'))
                return;
            if ($$('fp-comments').isError('Comments'))
                return;

            for (let i = 0; i < formGridData.length; i++) {
                if (formGridData[i].index === row.index) {
                    formGridData[i].comment = $$('fp-comments').getValue();
                    formGridData[i].date = DateUtils.today();
                    formGridData[i].formTypeId = $$('fp-code').getValue();
                    formGridData[i].formTypeCode = $$('fp-code').getLabel();
                    formGridData[i].formTypeDescription = $$('fp-description').getValue();
                }
            }

            for (let i = 0; i < uploadFiles.length; i++) {
                if (uploadFiles[i].index === row.index) {
                    uploadFiles[i].comments = $$('fp-comments').getValue();
                    uploadFiles[i].formTypeId = $$('fp-code').getValue();
                }
            }

            for (let i = 0; i < uploadForms.length; i++) {
                if (uploadForms[i].index === row.index) {
                    uploadForms[i].comment = $$('fp-comments').getValue();
                    uploadForms[i].formTypeId = $$('fp-code').getValue();
                }
            }

            formGrid.clear();
            formGrid.addRecords(formGridData);
            $$('form-status').setValue('Displaying ' + formGridData.length + ' Applicant Form' + (formGridData.length > 1 ? 's' : ''));
            $$('form-add').enable();
            $$('form-view').disable();
            $$('form-edit').disable();
            $$('form-delete').disable();
            
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('fp-ok').onclick(ok);
        $$('fp-cancel').onclick(cancel);
    }

    $$('form-edit').onclick(editForm);

    $$('form-delete').onclick(() => {
        const row = formGrid.getSelectedRow();
        if (!row)
            return;

        const newFormGridData = [];
        for (let i = 0; i < formGridData.length; i++) {
            if (formGridData[i].index !== row.index) {
                newFormGridData.push(formGridData[i]);
            }
        }
        formGridData = newFormGridData;

        let newUploadFiles = [];
        for (let i = 0; i < uploadFiles.length; i++) {
            if (uploadFiles[i].index !== row.index) {
                newUploadFiles.push(uploadFiles[i]);
            }
        }
        uploadFiles = newUploadFiles;

        const newUploadForms = [];
        for (let i = 0; i < uploadForms.length; i++) {
            if (uploadForms[i].index !== row.index) {
                newUploadForms.push(uploadForms[i]);
            }
        }
        uploadForms = newUploadForms;

        formGrid.clear();
        formGrid.addRecords(formGridData);
        $$('form-status').setValue('Displaying ' + formGridData.length + ' Applicant Form' + (formGridData.length > 1 ? 's' : ''));
        $$('form-add').enable();
        $$('form-view').disable();
        $$('form-edit').disable();
        $$('form-delete').disable();
        setSomeValueChanged();
    });

    function viewForm() {
        const row = formGrid.getSelectedRow();
        if (!row)
            return;

        if (row.id) {
            AWS.callSoap(SWS, 'getForm', {
                id: row.id  // personFormId
            }).then(res => {
                Utils.showReport(res.reportUrl);
            });
        } else {
            Utils.showMessage('Error', 'Forms must be saved to the Arahant server before they can be viewed.');
        }

    }

    formGrid.setOnRowDoubleClicked(viewForm);
    $$('form-view').onclick(viewForm);

})();
