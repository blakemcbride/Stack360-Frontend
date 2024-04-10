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
    const WS = 'StandardMiscEmployeeHomePage';
    const personId = Framework.userInfo.personId;
    const personName = Framework.userInfo.personLName + ', ' + Framework.userInfo.personFName + ' ()';

    const container = new TabContainer('ehp-tab-container');

    let receivedFilters = {
        fromDate: 0,
        fromDateIndicator: 0,
        sender: '',
        senderId: '',
        subject: '',
        subjectSearchType: 0,
        toDate: 0,
        toDateIndicator: 0,
    }

    let sentFilters = {
        fromDate: 0,
        fromDateIndicator: 0,
        receiver: '',
        receiverId: '',
        subject: '',
        subjectSearchType: 0,
        toDate: 0,
        toDateIndicator: 0,
    }
    let receivedGrid;
    let sentGrid;

    const receivedColumnDefs = [
        {headerName: "Date/Time", field: "messageDateTime", type: 'numericColumn', width: 300},
        {headerName: "Sender", field: "fromDisplayName", width: 300},
        {headerName: "Subject", field: "subject", width: 700}
    ];
    const sentColumnDefs = [
        {headerName: "Date/Time", field: "messageDateTime", type: 'numericColumn', width: 300},
        {headerName: "Receiver", field: "toDisplayName", width: 300},
        {headerName: "Subject", field: "subject", width: 700}
    ];
    receivedGrid = new AGGrid('receivedGrid', receivedColumnDefs);
    sentGrid = new AGGrid('sentGrid', sentColumnDefs);

    receivedGrid.show();
    sentGrid.show();

    function searchReceivedMessages() {
        const params = receivedFilters;
        params.receiverId = personId;

        AWS.callSoap(WS, 'searchMessages', params).then(data => {
            receivedGrid.clear();
            if (data.wsStatus === "0") {
                data.messages = Utils.assureArray(data.messages);
                receivedGrid.addRecords(data.messages);     
                receivedGrid.setOnSelectionChanged(() => {
                    $$('receivedView').enable();
                    $$('receivedReply').enable();
                    $$('receivedDelete').enable();
                });
                receivedGrid.setOnRowDoubleClicked(viewReceivedMessage);
            }     
        });
    }

    function searchSentMessages() {
        const params = sentFilters;
        params.senderId = personId;

        AWS.callSoap(WS, 'searchMessages', params).then(data => {
            sentGrid.clear();
            if (data.wsStatus === "0") {
                data.messages = Utils.assureArray(data.messages);
                sentGrid.addRecords(data.messages);     
                sentGrid.setOnSelectionChanged(() => {
                    $$('sentView').enable();
                    $$('sentDelete').enable();
                });
                sentGrid.setOnRowDoubleClicked(viewSentMessage);
            }     
        });
    }
    function viewReceivedMessage() {
        $$('message-label').setValue('View');
        const row = receivedGrid.getSelectedRow();

        const params = {
            messageId: row.messageId
        } 
        AWS.callSoap(WS, 'loadMessage', params).then(data => {
            if (data.wsStatus === "0") {
                $$('message-sender').setValue(data.fromDisplayName);
                $$('message-receiver').setValue(data.toDisplayName);
                $$('message-subject').disable().setValue(data.subject);
                $$('message-message').disable().setValue(data.message);
            }     
        });

        $$('message-choose').disable().hide();
        $$('message-ok').disable().hide();
        $$('message-cancel').setValue('Close').onclick(Utils.popup_close);
        Utils.popup_open('message-popup');
    }

    function viewSentMessage() {
        $$('message-label').setValue('View');
        const row = sentGrid.getSelectedRow();

        const params = {
            messageId: row.messageId
        } 
        AWS.callSoap(WS, 'loadMessage', params).then(data => {
            if (data.wsStatus === "0") {
                $$('message-sender').setValue(data.fromDisplayName);
                $$('message-receiver').setValue(data.toDisplayName);
                $$('message-subject').disable().setValue(data.subject);
                $$('message-message').disable().setValue(data.message);
            }     
        });

        $$('message-choose').disable().hide();
        $$('message-ok').disable().hide();
        $$('message-cancel').setValue('Close').onclick(Utils.popup_close);
        Utils.popup_open('message-popup');
    }
    searchReceivedMessages();
    searchSentMessages();

    let emailAddressesGrid;
    let messageTypesGrid;

    const emailAddressesColumnDefs = [
        {headerName: "E-mail Address", field: "email", width: 300}
    ];
    const messageTypesColumnDefs = [
        {headerName: "Type", field: "description", width: 400},
        {headerName: "Notify", field: "notify", width: 50}
    ];
    emailAddressesGrid = new AGGrid('emailAddressesGrid', emailAddressesColumnDefs);
    messageTypesGrid = new AGGrid('messageTypesGrid', messageTypesColumnDefs);

    emailAddressesGrid.show();
    messageTypesGrid.show();

    $$('receivedPreferences').onclick(() => {
        $$('emailAddressesEdit').disable();
        $$('emailAddressesDelete').disable();
        AWS.callSoap(WS, 'loadPreferences').then(data => {
            emailAddressesGrid.clear();
            messageTypesGrid.clear();
            if (data.wsStatus === "0") {
                if (data.emailAddresses !== '') {
                    data.emailAddresses = data.emailAddresses.split(';');
                    data.emailAddressesFormatted = [];
                    for (let i = 0; i < data.emailAddresses.length; i++) {
                        data.emailAddressesFormatted.push({email: data.emailAddresses[i]});
                    }
                    emailAddressesGrid.addRecords(data.emailAddressesFormatted);
                    emailAddressesGrid.setOnSelectionChanged(() => {
                        if ($$('preferences-sendCopy').getValue()) {
                            $$('emailAddressesEdit').enable();
                            $$('emailAddressesDelete').enable();
                        }                    
                    });
                    emailAddressesGrid.setOnRowDoubleClicked(editEmailAddress);

                    $$('preferences-sendCopy').setValue(true);
                    $$('emailAddressesAdd').enable();
                    $$('preferences-messageBody').enable();
                } else {
                    $$('preferences-sendCopy').setValue(false);
                    $$('emailAddressesAdd').disable();
                    $$('preferences-messageBody').disable();
                }

                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].notify = data.item[i].exclude === 'true' ? 'No' : 'Yes';
                }
                messageTypesGrid.addRecords(data.item);     
                messageTypesGrid.setOnSelectionChanged(() => {
                    $$('messageTypesYes').enable();
                    $$('messageTypesNo').enable();
                });

                $$('preferences-messageBody').setValue(data.includeMessageBody === 'true' ? 'Y' : 'N')
            }      
        });

        $$('preferences-sendCopy').onChange(() => {
            if($$('preferences-sendCopy').getValue()) {
                $$('emailAddressesAdd').enable();
                $$('preferences-messageBody').enable();
                emailAddressesGrid.setOnSelectionChanged(() => {
                    if ($$('preferences-sendCopy').getValue()) {
                        $$('emailAddressesEdit').enable();
                        $$('emailAddressesDelete').enable();
                    }                    
                });
            } else {
                $$('emailAddressesAdd').disable();
                $$('emailAddressesEdit').disable();
                $$('emailAddressesDelete').disable();
                $$('preferences-messageBody').disable();
            }
        });

        $$('emailAddressesAdd').onclick(() => {
            $$('emailAddress-emailAddress').clear();
            $$('emailAddress-label').setValue('Edit');

            $$('emailAddress-ok').onclick(() => {
                if ($$('emailAddress-emailAddress').isError('E-mail Address')) {
                    return;
                }
                emailAddressesGrid.addRecord({email: $$('emailAddress-emailAddress').getValue()});
                Utils.popup_close();
            });
            $$('emailAddress-cancel').onclick(Utils.popup_close);
            Utils.popup_open('emailAddress-popup');
        });
        function editEmailAddress() {
            $$('emailAddress-emailAddress').setValue(emailAddressesGrid.getSelectedRow().email);
            $$('emailAddress-label').setValue('Add');

            $$('emailAddress-ok').onclick(() => {
                if ($$('emailAddress-emailAddress').isError('E-mail Address')) {
                    return;
                }
                emailAddressesGrid.updateSelectedRecord({email: $$('emailAddress-emailAddress').getValue()});
                $$('emailAddressesEdit').disable();
                $$('emailAddressesDelete').disable();
                Utils.popup_close();
            });
            $$('emailAddress-cancel').onclick(Utils.popup_close);
            Utils.popup_open('emailAddress-popup');
        }
        $$('emailAddressesEdit').onclick(editEmailAddress);
        $$('emailAddressesDelete').onclick(() => {
            emailAddressesGrid.deleteSelectedRows();
            $$('emailAddressesEdit').disable();
            $$('emailAddressesDelete').disable();
        });
        
        Utils.popup_open('preferences-popup');

        $$('messageTypesYes').onclick(() => {
            let row = messageTypesGrid.getSelectedRow();
            row.exclude = 'false';
            row.notify = 'Yes';
            messageTypesGrid.updateSelectedRecord(row);
        });
        $$('messageTypesNo').onclick(() => {
            let row = messageTypesGrid.getSelectedRow();
            row.exclude = 'true';
            row.notify = 'No';
            messageTypesGrid.updateSelectedRecord(row);
        });

        $$('preferences-ok').onclick(() => {
            let emailAddresses = '';
            const rows = emailAddressesGrid.getAllRows();
            for (let i = 0; i < rows.length; i++) {
                emailAddresses += rows[i].email + ';';
            }
            emailAddresses = emailAddresses.slice(0, -1);
            const params = {
                emailAddresses: emailAddresses,
                includeMessageBody: $$('preferences-messageBody').getValue() === 'Y',
                item: messageTypesGrid.getAllRows()
            }
            AWS.callSoap(WS, 'savePreferences', params).then(data => {
                if (data.wsStatus === "0") {
                    Utils.popup_close();
                }      
            });
        });
        $$('preferences-cancel').onclick(Utils.popup_close);
    });
    $$('receivedFilter').onclick(() => {
        bindToEnum('filter-fromDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
        bindToEnum('filter-toDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
        bindToEnum('filter-subject-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        $$('filter-person-label').setValue('Sender');
        $$('filter-sender').setValue(receivedFilters.senderId === '' ? '(any sender)' : receivedFilters.sender).show();
        $$('filter-senderId').setValue(receivedFilters.senderId);

        $$('filter-receiver').clear().disable().hide();
        $$('filter-receiverId').setValue(personId);

        if (receivedFilters.fromDateIndicator !== 0) {
            $$('filter-fromDate-criteria').setValue(receivedFilters.fromDateIndicator);    
        }
        $$('filter-fromDate-search').setValue(receivedFilters.fromDate);   
        if (receivedFilters.toDateIndicator !== 0) {
            $$('filter-toDate-criteria').setValue(receivedFilters.toDateIndicator);  
        }     
        $$('filter-toDate-search').setValue(receivedFilters.toDate);
        if (receivedFilters.subjectSearchType !== 0) {
            $$('filter-subject-criteria').setValue(receivedFilters.subjectSearchType);
        }        
        $$('filter-subject-search').setValue(receivedFilters.subject);

        $$('filter-any').onclick(() => {
            $$('filter-sender').setValue('(any sender)');
            $$('filter-senderId').clear();
        });

        $$('filter-choose').onclick(() => {
            searchEmployee('sender', 'filter');
        });

        Utils.popup_open('filter-search');

        $$('filter-reset').onclick(() => {
            bindToEnum('filter-fromDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
            bindToEnum('filter-toDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
            bindToEnum('filter-subject-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            $$('filter-sender').setValue('(any sender)');
            $$('filter-senderId').clear();

            $$('filter-receiver').clear().disable().hide();
            $$('filter-receiverId').setValue(personId);
            $$('filter-fromDate-search').clear();
            $$('filter-toDate-search').clear();
            $$('filter-subject-search').clear();
        });

        $$('filter-ok').onclick(() => {
            receivedFilters.sender = $$('filter-sender').getValue();
            receivedFilters.senderId = $$('filter-senderId').getValue();
            receivedFilters.fromDateIndicator = $$('filter-fromDate-criteria').getValue();
            receivedFilters.fromDate = $$('filter-fromDate-search').getIntValue();   
            receivedFilters.toDateIndicator = $$('filter-toDate-criteria').getValue();  
            receivedFilters.toDate = $$('filter-toDate-search').getIntValue();
            receivedFilters.subjectSearchType = $$('filter-subject-criteria').getValue();        
            receivedFilters.subject = $$('filter-subject-search').getValue();

            let filtersLabel = '';
            if ($$('filter-senderId').getValue() !== '') {
                filtersLabel += '<strong>Sender: </strong>' + $$('filter-sender').getValue() + ', ';
            }   
            if ($$('filter-fromDate-search').getIntValue() !== 0) {
                filtersLabel += '<strong>From Date: </strong>' + $$('filter-fromDate-criteria').getLabel() + ' ' + DateUtils.intToStr4($$('filter-fromDate-search').getIntValue()) + ', ';
            }  
            if ($$('filter-toDate-search').getIntValue() !== 0) {
                filtersLabel += '<strong>To Date: </strong>' + $$('filter-toDate-criteria').getLabel() + ' ' + DateUtils.intToStr4($$('filter-toDate-search').getIntValue()) + ', ';
            }  
            if ($$('filter-subject-search').getValue() !== '') {
                filtersLabel += '<strong>Subject: </strong>' + $$('filter-subject-criteria').getLabel() + ' ' + $$('filter-subject-search').getValue() + ', ';
            }
            if (filtersLabel !== '') {
                filtersLabel = filtersLabel.slice(0, -2);
            } else {
                filtersLabel = '(not filtered)';
            }

            $$('receivedFilter-label').setHTMLValue(filtersLabel);

            searchReceivedMessages();
            Utils.popup_close();
        });

        $$('filter-cancel').onclick(Utils.popup_close);
    });

    $$('sentFilter').onclick(() => {
        bindToEnum('filter-fromDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
        bindToEnum('filter-toDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
        bindToEnum('filter-subject-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        $$('filter-person-label').setValue('Receiver');
        $$('filter-receiver').setValue(sentFilters.receiverId === '' ? '(any receiver)' : sentFilters.receiver).show();
        $$('filter-receiverId').setValue(sentFilters.receiverId);

        $$('filter-sender').clear().disable().hide();
        $$('filter-senderId').setValue(personId);

        if (sentFilters.fromDateIndicator !== 0) {
            $$('filter-fromDate-criteria').setValue(sentFilters.fromDateIndicator);    
        }
        $$('filter-fromDate-search').setValue(sentFilters.fromDate);   
        if (sentFilters.toDateIndicator !== 0) {
            $$('filter-toDate-criteria').setValue(sentFilters.toDateIndicator);  
        }     
        $$('filter-toDate-search').setValue(sentFilters.toDate);
        if (sentFilters.subjectSearchType !== 0) {
            $$('filter-subject-criteria').setValue(sentFilters.subjectSearchType);
        }        
        $$('filter-subject-search').setValue(sentFilters.subject);

        $$('filter-any').onclick(() => {
            $$('filter-receiver').setValue('(any receiver)');
            $$('filter-receiverId').clear();
        });
        $$('filter-choose').onclick(() => {
            searchEmployee('receiver', 'filter');
        });

        Utils.popup_open('filter-search');

        $$('filter-reset').onclick(() => {
            bindToEnum('filter-fromDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
            bindToEnum('filter-toDate-criteria', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
            bindToEnum('filter-subject-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            $$('filter-receiver').setValue('(any receiver)');
            $$('filter-receiverId').clear();

            $$('filter-sender').clear().disable().hide();
            $$('filter-senderId').setValue(personId);
            $$('filter-fromDate-search').clear();
            $$('filter-toDate-search').clear();
            $$('filter-subject-search').clear();
        });

        $$('filter-ok').onclick(() => {
            sentFilters.receiver = $$('filter-receiver').getValue();
            sentFilters.receiverId = $$('filter-receiverId').getValue();
            sentFilters.fromDateIndicator = $$('filter-fromDate-criteria').getValue();
            sentFilters.fromDate = $$('filter-fromDate-search').getIntValue();   
            sentFilters.toDateIndicator = $$('filter-toDate-criteria').getValue();  
            sentFilters.toDate = $$('filter-toDate-search').getIntValue();
            sentFilters.subjectSearchType = $$('filter-subject-criteria').getValue();        
            sentFilters.subject = $$('filter-subject-search').getValue();

            let filtersLabel = '';
            if ($$('filter-receiverId').getValue() !== '') {
                filtersLabel += '<strong>Receiver: </strong>' + $$('filter-receiver').getValue() + ', ';
            }   
            if ($$('filter-fromDate-search').getIntValue() !== 0) {
                filtersLabel += '<strong>From Date: </strong>' + $$('filter-fromDate-criteria').getLabel() + ' ' + DateUtils.intToStr4($$('filter-fromDate-search').getIntValue()) + ', ';
            }  
            if ($$('filter-toDate-search').getIntValue() !== 0) {
                filtersLabel += '<strong>To Date: </strong>' + $$('filter-toDate-criteria').getLabel() + ' ' + DateUtils.intToStr4($$('filter-toDate-search').getIntValue()) + ', ';
            }  
            if ($$('filter-subject-search').getValue() !== '') {
                filtersLabel += '<strong>Subject: </strong>' + $$('filter-subject-criteria').getLabel() + ' ' + $$('filter-subject-search').getValue() + ', ';
            }
            if (filtersLabel !== '') {
                filtersLabel = filtersLabel.slice(0, -2);
            } else {
                filtersLabel = '(not filtered)';
            }

            $$('sentFilter-label').setHTMLValue(filtersLabel);

            searchSentMessages();
            Utils.popup_close();
        });

        $$('filter-cancel').onclick(Utils.popup_close);
    });

    $$('receivedNew').onclick(()=> {
        $$('message-label').setValue('New');
        $$('message-sender').setValue(personName);
        $$('message-receiver').setValue('(choose a receiver)');
        $$('message-subject').enable().clear();
        $$('message-message').enable().clear();

        $$('message-choose').onclick(() => {
            searchEmployee('receiver', 'message');
        });
        $$('message-ok').onclick(() => {
            if ($$('message-receiverId').isError('Receiver')) {
                $$('message-receiver').focus();
                return;
            }
            if ($$('message-subject').isError('Subject')) {
                return;
            }
            const params = {
                message: $$('message-message').getValue(),
                subject: $$('message-subject').getValue(),
                toPersonId: $$('message-receiverId').getValue(),
            } 
            AWS.callSoap(WS, 'createMessage', params).then(data => {
                if (data.wsStatus === "0") {
                    getListBenefitCostsForEmployee();
                    getListProjectsForEmployee();
                    Utils.popup_close();
                }     
            });
        });
        $$('message-cancel').setValue('Cancel').onclick(Utils.popup_close);
        Utils.popup_open('message-popup');
    });

    $$('receivedView').onclick(viewReceivedMessage);
    $$('sentView').onclick(viewSentMessage);

    $$('receivedReply').onclick(() => {
        const row = receivedGrid.getSelectedRow();
        $$('message-label').setValue('New');
        $$('message-sender').setValue(personName);
        $$('message-receiver').setValue(row.fromDisplayName);
        $$('message-receiverId').setValue(row.fromPersonId);
        $$('message-subject').enable().setValue('RE: ' + row.subject);
        $$('message-message').enable().clear();

        $$('message-choose').onclick(() => {
            searchEmployee('receiver', 'message');
        });
        $$('message-ok').onclick(() => {
            if ($$('message-receiverId').isError('Receiver')) {
                $$('message-receiver').focus();
                return;
            }
            if ($$('message-subject').isError('Subject')) {
                return;
            }
            const params = {
                message: $$('message-message').getValue(),
                subject: $$('message-subject').getValue(),
                toPersonId: $$('message-receiverId').getValue(),
            } 
            AWS.callSoap(WS, 'createMessage', params).then(data => {
                if (data.wsStatus === "0") {
                    getListBenefitCostsForEmployee();
                    getListProjectsForEmployee();
                    Utils.popup_close();
                }     
            });
        });
        $$('message-cancel').setValue('Cancel').onclick(Utils.popup_close);
        Utils.popup_open('message-popup');
    });

    $$('receivedDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Received Message?', () => {
            const row = receivedGrid.getSelectedRow();
            const data = {
                messageIds: row.messageId
            };
            AWS.callSoap(WS, 'deleteMessage', data).then(function (res) {
                if (res.wsStatus === "0") {
                    searchReceivedMessages();
                    searchSentMessages();
                }
            });
        });
    });

    $$('sentDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Sent Message?', () => {
            const row = sentGrid.getSelectedRow();
            const data = {
                messageIds: row.messageId
            };
            AWS.callSoap(WS, 'deleteMessage', data).then(function (res) {
                if (res.wsStatus === "0") {
                    searchReceivedMessages();
                    searchSentMessages();
                }
            });
        });
    });

    let benefitsGrid;

    let projectsGrid;

    const benefitsColumnDefs = [
        {headerName: "Benefit", field: "name", width: 300},
        {headerName: "Coverage Type", field: "coverageType", width: 300},
        {headerName: "Policy Start", field: "policyStartDate", type: 'numericColumn', width: 200},
        {headerName: "Monthly Cost", field: "monthlyCost", type: 'numericColumn', width: 300}
    ];

    const projectsColumnDefs = [
        {headerName: "Id", field: "projectName", width: 100},
        {headerName: "Summary", field: "projectSummary", width: 300},
        {headerName: "Status", field: "projectStatusName", width: 100},
    ];
    benefitsGrid = new AGGrid('benefitsGrid', benefitsColumnDefs);

    projectsGrid = new AGGrid('projectsGrid', projectsColumnDefs);

    benefitsGrid.show();

    projectsGrid.show();

    function getListBenefitCostsForEmployee() {
        AWS.callSoap(WS, 'listBenefitCostsForEmployee').then(data => {
            benefitsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                benefitsGrid.addRecords(data.item);     
                $$('benefits-label').setValue('Displaying ' + data.item.length + ' Enrolled Benefits');
            }     
        });
    }

    function getListProjectsForEmployee() {
        AWS.callSoap(WS, 'listProjectsForEmployee').then(data => {
            projectsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                projectsGrid.addRecords(data.item);     
                $$('projects-label').setValue('Displaying ' + data.item.length + ' Assigned Projects');
                projectsGrid.setOnSelectionChanged($$('projectOpen').enable)
                projectsGrid.setOnRowDoubleClicked(openProject);
            }     
        });
    }
    function openProject() {
        Utils.saveData(CURRENT_PROJECT_ID, projectsGrid.getSelectedRow().projectId);
        Utils.saveData(CURRENT_PROJECT_NAME, projectsGrid.getSelectedRow().projectName);
        Utils.saveData(CURRENT_PROJECT_SUMMARY, projectsGrid.getSelectedRow().projectSummary);
        Framework.getChild();
    }
    $$('projectOpen').onclick(openProject);
    getListBenefitCostsForEmployee();
    getListProjectsForEmployee();

    const searchEmployee = (messageMemberType, popupType) => {
        let formSearchGrid;
        $$('search-label').setValue(messageMemberType);
        Utils.popup_open('employee-search');
            
        const reset = () => {
            $$('esp-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-lname-search').clear();

            $$('esp-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-fname-search').clear();

            $$('esp-login-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('esp-login-search').clear();

            $$('esp-reset').enable();
            $$('esp-search').enable();

            $$('esp-ok').disable();

            formSearchGrid.clear();
            $$('esp-count').setValue(`Displaying 0 System Logins`);
        };

        const ok = () => {    
            const row = formSearchGrid.getSelectedRow();
            if (row) {
                $$(popupType + '-' + messageMemberType).setValue(row.lname + ', ' + row.fname + ' (' + row.userLogin + ')');
                $$(popupType + '-' + messageMemberType + 'Id').setValue(row.personId);
            }
            reset();
            Utils.popup_close();
        };

        const cancel = () => {
            reset();
            Utils.popup_close();
        };

        bindToEnum('esp-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('esp-login-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        const initDataGrid = () => {
            const columnDefs = [
                {headerName: 'Last Name', field: 'lname', width: 80},
                {headerName: 'First Name', field: 'fname', width: 80},
                {headerName: 'Login ID', field: 'userLogin', width: 80},
            ];

            formSearchGrid = new AGGrid('esp-grid', columnDefs);
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        const search = () => {
            const inParams = {
                firstName: $$('esp-fname-search').getValue(),
                firstNameSearchType: $$('esp-fname-criteria').getValue(),
                lastName: $$('esp-lname-search').getValue(),
                lastNameSearchType: $$('esp-lname-criteria').getValue(),
                userLogin: $$('esp-login-search').getValue(),
                userLoginSearchType: $$('esp-login-criteria').getValue(),
            };

            AWS.callSoap(WS, 'searchLogins', inParams).then(data => {
                if (data.wsStatus === '0') {
                    formSearchGrid.clear();
                    if (data.logins) {
                        const records = Utils.assureArray(data.logins);
                        formSearchGrid.addRecords(records);
                        $$('esp-count').setValue(`Displaying ${records.length} System Logins`);
                    } else {
                        $$('esp-count').setValue(`Displaying 0 System Logins`);
                    }

                    formSearchGrid.setOnSelectionChanged($$('esp-ok').enable);
            
                    formSearchGrid.setOnRowDoubleClicked(ok);
                }
            })
        };

        $$('esp-reset').onclick(reset);
        $$('esp-search').onclick(search);
        $$('esp-ok').onclick(ok);
        $$('esp-cancel').onclick(cancel);

        search();
    };
})();
