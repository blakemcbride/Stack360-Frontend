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

    const WS = 'StandardCrmProspectContact';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    let prospectId = Utils.getData(CURRENT_PROSPECT_ID);
    let prospectName = Utils.getData(CURRENT_PROSPECT_NAME);

    $$('prospect-name').setValue(prospectName);
    let data = await AWS.callSoap(WS, 'searchOrgGroupsForCompany', {companyId: prospectId});
    $$('org-group').addItems(Utils.assureArray(data.item), 'id', 'name');

    const columnDefs = [
        {headerName: 'Last Name', field: 'lastName', width: 50  },
        {headerName: 'First Name', field: 'firstName', width: 50 },
        {headerName: 'Primary', field: 'primary', width: 30 },
        {headerName: 'Job Title', field: 'jobTitle', width: 50 },
        {headerName: 'Work Phone', field: 'workPhone', width: 35 },
        {headerName: 'Mobile Phone', field: 'mobilePhone', width: 35 },
        {headerName: 'E-mail', field: 'emailAddress', width: 50 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');

    grid.show();
    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {
        grid.clear();

        AWS.callSoap(WS, 'listContacts', {orgGroupId: $$('org-group').getValue()}).then(ret => {
            if (ret.wsStatus === '0') {
                ret.item = Utils.assureArray(ret.item);
                grid.addRecords(Utils.assureArray(ret.item));
                $$('status').setValue(`Displaying ${ret.item.length} Prospect Contact`);
            }
        });
    }

    updateGrid();

    const questionGrid = new AGGrid('dp-qus-grid', [
        {headerName: 'Question', field: 'question', width: 225 },
        {headerName: 'Response', field: 'response', width: 325 },
        {headerName: 'Entered', field: 'whenAddedFormatted', width: 100 }
    ], 'questionId');
    questionGrid.show();
    questionGrid.setOnSelectionChanged((rows)=>{
        $$('dp-qus-edit').enable(rows);
    });

    function editQuestionPopup(row) {

        Utils.popup_open('question-edit');

        return new Promise(function (resolve, reject) {

            if (row && row.whenAddedFormatted) {
                $$('qep-entered').setValue(row.whenAddedFormatted);
            } else {
                $$('qep-entered').setValue('(generated on save)');
            }
            $$('qep-question').setValue(row.question);
            $$('qep-response').setValue(row.response);
            
            function ok() {
                resolve({ ...row, 
                    question: $$('qep-question').getValue(), 
                    response: $$('qep-response').getValue(),
                    formatResponse:  $$('qep-response').getValue().substr(0, 200)
                });
                Utils.popup_close();
            }
            
            function cancel() {
                resolve(null);
                Utils.popup_close();
            }

            $$('qep-ok').onclick(ok);
            $$('qep-cancel').onclick(cancel);
        });
    }

    function detailPopup(row) {

        let tabContainer = null;
        let questions = [];

        countriesToDropDown('dp-country');

        /**
         * Show a dropdown or a text input for entering state, depending on the value of the country dropdown.
         */
        function filterState() {
            let states = getStatesForCountry($$('dp-country').getValue());

            if (states != null) {
                statesToDropDown('dp-state-drop-down', states);

                $$('dp-state-drop-down').show();
                $$('dp-state').hide();
            } else {
                $$('dp-state-drop-down').hide();
                $$('dp-state').show();
            }
        }

        function resetDialog() {
            $$('dp-title').setValue(row ? 'Edit Contact':'Add Contact');
            
            // Summary tab.
            $$('dp-fname').clear();
            $$('dp-lname').clear();
            $$('dp-type').setValue('');
            $$('dp-job-title').clear();
            $$('dp-email').clear();
            $$('dp-primary').clear();
            
            $$('dp-street1').clear();
            $$('dp-street2').clear();
            $$('dp-city').clear();
            $$('dp-zip').clear();
            $$('dp-work-phone').clear();
            $$('dp-mobile-phone').clear();
    
            // Select the first tab.
            tabContainer.selectTab('summaryTabButton');
            questionGrid.clear();
        }

        function updateQuestions() {
            questionGrid.clear();
            questionGrid.addRecords(questions);
            $$('dp-qus-count').setValue(`Displaying ${questions.length} Contact Questions`);
        }

        /**
         * Initialize the new worker dialog.
         */
        async function initDialog() {
            // Setup tab layout.
            tabContainer = new TabContainer('detailTabContainer');

            resetDialog();

            countriesToDropDown('dp-country');

            filterState();

            statesToDropDown('dp-state-drop-down', US_STATE_ABBREVIATIONS);

            AWS.callSoap(WS, 'loadContact', {id: row? row.id:null}).then(res => {
                if (res.wsStatus === '0') {
                    $$('dp-email').setValue(res.personalEmail);
                    $$('dp-mobile-phone').setValue(res.mobilePhone);
                    $$('dp-work-phone').setValue(res.workPhone);
                    $$('dp-street1').setValue(res.street);
                    $$('dp-street2').setValue(res.street2);
                    $$('dp-city').setValue(res.city);
                    $$('dp-zip').setValue(res.zip);
                    $$('dp-country').setValue(res.country);
                    $$('dp-linkedin').setValue(res.linkedIn);
                    if (res.country === 'US') {
                        $$('dp-state-drop-down').setValue(res.state);
                    } else {
                        $$('dp-state').setValue(res.state);
                    }
                }
            });

            if (row) {
                $$('dp-fname').setValue(row.firstName);
                $$('dp-lname').setValue(row.lastName);
                $$('dp-job-title').setValue(row.jobTitle);
                $$('dp-primary').setValue(row.primary === 'Yes');
                $$('dp-type').setValue(row.type);
            }

            AWS.callSoap(WS, 'listContactQuestions', {id: row ? row.id : null}).then(res => {
                if (res.wsStatus === '0') {
                    questions = Utils.assureArray(res.item);
                    updateQuestions();
                }
            });

            $$('dp-qus-edit').disable();
        }

        initDialog();

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {

            $$('dp-country').onChange(filterState);

            async function questionEdit() {
                let row = questionGrid.getSelectedRow();
                let data = await editQuestionPopup(row);
                if (data) {
                    let updated = [];
                    questions.map(qus => {
                        if (qus.questionId === data.questionId) {
                            updated.push(data);
                        } else {
                            updated.push(qus);
                        }
                    });
                    questions = updated;
                    updateQuestions();
                }
            }
            
            questionGrid.setOnRowDoubleClicked(questionEdit);
            $$('dp-qus-edit').onclick(questionEdit);
            
            function ok() {
                if ($$('dp-fname').isError('First Name')) {
                    tabContainer.selectTab('summaryTabButton');
                    return;
                }
                if ($$('dp-lname').isError('Last Name')) {
                    tabContainer.selectTab('summaryTabButton');
                    return;
                }
                if ($$('dp-type').isError('Type')) {
                    tabContainer.selectTab('summaryTabButton');
                    return;
                }
                const data = {
                    firstName: $$('dp-fname').getValue(),
                    jobTitle: $$('dp-job-title').getValue(),
                    lastName: $$('dp-lname').getValue(),
                    personalEmail: $$('dp-email').getValue(),
                    primaryIndicator: $$('dp-primary').getValue(),
                    type: $$('dp-type').getValue(),
                    workFax: '',
                    workPhone: $$('dp-work-phone').getValue(),
                    homePhone: '',
                    linkedIn: $$('dp-linkedin').getValue(),
                    mobilePhone: $$('dp-mobile-phone').getValue(),
                    street: $$('dp-street1').getValue(),
                    street2: $$('dp-street2').getValue(),
                    city: $$('dp-city').getValue(),
                    country: $$('dp-country').getValue(),
                    state: Utils.isVisible('dp-state-drop-down') ? $$('dp-state-drop-down').getValue() : $$('dp-state').getValue(),
                    zip: $$('dp-zip').getValue(),
                    personId: row ? row.id : null,
                    item: questions
                };
                resolve(data);
                Utils.popup_close();
            }
            
            function cancel() {
                resolve(null);
                Utils.popup_close();
            }

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);

        });

    }

    $$('add').onclick(async () => {
        const data = await detailPopup();
        if (data) {
            AWS.callSoap(WS, 'newContact', { ...data, orgGroupId: $$('org-group').getValue() }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    async function edit() {
        const row = grid.getSelectedRow();
        const data = await detailPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveContact', { ...data, orgGroupId: $$('org-group').getValue() }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Prospect Contact?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deleteContacts", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });            
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getReport', {id: prospectId}).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });

    $$('dp-go-linkedin').onclick(() => {
        let url = $$('dp-linkedin').getValue();
        if (!url)
            return;
        if (url.search('://') === -1)
            url = 'http://' + url;
        window.open(url, '_blank');
    });
})();