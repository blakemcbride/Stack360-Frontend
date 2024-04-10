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
    const WS = 'StandardMiscEmployerHomePage';
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
                receivedGrid.setOnSelectionChanged((x) => {
                    $$('receivedView').enable(x);
                    $$('receivedReply').enable(x);
                    $$('receivedDelete').enable(x);
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
                    getListClosedProjectsForCompany();
                    getListOpenProjectsForCompany();
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
                    getListClosedProjectsForCompany();
                    getListOpenProjectsForCompany();
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

    let closedProjectsGrid;

    let openProjectsGrid;

    const closedProjectsColumnDefs = [
        {headerName: "Type", field: "typeCode", width: 200},
        {headerName: "Summary", field: "summary", width: 200},
        {headerName: "Status", field: "statusCode", width: 200},
        {headerName: "Completed", field: "dateTimeRequested", type: "numericColumn", width: 200},
        {headerName: "Assigned To", field: "assignedTo", width: 200}
    ];

    const openProjectsColumnDefs = [
        {headerName: "Type", field: "typeCode", width: 200},
        {headerName: "Summary", field: "summary", width: 200},
        {headerName: "Status", field: "statusCode", width: 200},
        {headerName: "Requested", field: "dateTimeRequested", type: "numericColumn", width: 200},
        {headerName: "Assigned To", field: "assignedTo", width: 200}
    ];
    closedProjectsGrid = new AGGrid('closedProjectsGrid', closedProjectsColumnDefs);

    openProjectsGrid = new AGGrid('openProjectsGrid', openProjectsColumnDefs);

    closedProjectsGrid.show();

    openProjectsGrid.show();

    function getListClosedProjectsForCompany() {
        AWS.callSoap(WS, 'listClosedProjectsForCompany').then(data => {
            closedProjectsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                closedProjectsGrid.addRecords(data.item);     
                $$('closedProjects-label').setValue('Displaying ' + data.item.length + ' Closed Projects' + (data.item.length === Number(data.cap) ? ' (Limit)' : ''));
                if (data.item.length === Number(data.cap)) {
                    $$('closedProjects-label').setColor('red');
                } else {
                    $$('closedProjects-label').setColor('black');
                }
                closedProjectsGrid.setOnSelectionChanged($$('closedProjectView').enable);
                closedProjectsGrid.setOnRowDoubleClicked(() => {openProject('closed');});
            }     
        });
    }

    function getListOpenProjectsForCompany() {
        AWS.callSoap(WS, 'listOpenProjectsForCompany').then(data => {
            openProjectsGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                openProjectsGrid.addRecords(data.item);     
                $$('openProjects-label').setValue('Displaying ' + data.item.length + ' Open Projects' + (data.item.length === Number(data.cap) ? ' (Limit)' : ''));
                if (data.item.length === Number(data.cap)) {
                    $$('openProjects-label').setColor('red');
                } else {
                    $$('openProjects-label').setColor('black');
                }
                openProjectsGrid.setOnSelectionChanged($$('openProjectView').enable);
                openProjectsGrid.setOnRowDoubleClicked(() => {openProject('open');});
            }     
        });
    }
    async function openProject(projectStatus) {
        const row = projectStatus === 'closed' ? closedProjectsGrid.getSelectedRow() : openProjectsGrid.getSelectedRow();
        $$('ehp-project-eplName').clear();
        $$('ehp-project-ssn').clear();
        $$('ehp-project-assignedTo').clear();
        $$('ehp-project-type').clear();
        $$('ehp-project-status').clear();
        $$('ehp-project-summary').clear();
        $$('ehp-project-detail').clear();
        $$('ehp-project-requestDate').clear();
        $$('ehp-project-requestTime').clear();
        $$('ehp-project-completedDate').clear();
        $$('ehp-project-completedTime').clear();

        if (projectStatus === 'closed') {
            $$('ehp-project-email').enable();
            $$('ehp-project-type').disable();
            $$('ehp-project-summary').disable();
            $$('ehp-project-detail').disable();
            $$('ehp-project-assignedTo').disable();
            $$('ehp-project-completedDate').disable();
            $$('ehp-project-completedTime').disable();
        } else {
            $$('ehp-project-email').disable();
            $$('ehp-project-type').enable();
            $$('ehp-project-summary').enable();
            $$('ehp-project-detail').enable();
            $$('ehp-project-assignedTo').enable();
            $$('ehp-project-completedDate').enable();
            $$('ehp-project-completedTime').enable();
        }
        let res = await AWS.callSoap(WS, 'checkRight');
        if (res.wsStatus !== "0")
            return;

        $$('ehp-project-project').setValue(row.summary);

        let projectData = {};

        function getProjectData() {
            const params = {
                projectId: row.projectId
            }
            AWS.callSoap(WS, 'listEmployeesForAssignment', params).then(data => {
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
        
                    const baog = $$('ehp-project-assignedTo');
                    baog.clear().add('', '(select)');
                    baog.addItems(data.item, "employeeId", "displayName").setValue('');    
                    if (projectData.assignedEmployeeId !== undefined) {
                        baog.setValue(projectData.assignedEmployeeId);
                    }
                }
            });
        
            AWS.callSoap(WS, 'listProjectTypes').then(data => {
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
        
                    const baog = $$('ehp-project-type');
                    baog.clear().add('', '(select)');
                    baog.addItems(data.projectTypes, "projectTypeId", "code");    
                    if (projectData.projectTypeId !== undefined) {
                        baog.setValue(projectData.projectTypeId);
                    }
                }
            });
        
            AWS.callSoap(WS, 'listStatuses', params).then(data => {
                if (data.wsStatus === "0") {
                    data.item = Utils.assureArray(data.item);
        
                    const baog = $$('ehp-project-status');
                    baog.clear().add('', '(select)');
                    baog.addItems(data.item, "statusId", "statusCode"); 
                    if (projectData.statusId !== undefined) {
                        baog.setValue(projectData.statusId);
                    }   
                }
            });
        
            AWS.callSoap(WS, 'loadSummary', params).then(data => {
                if (data.wsStatus === "0") {
                    $$('ehp-project-eplName').setValue(data.personLastName + ', ' + data.personFirstName);
                    $$('ehp-project-ssn').setValue(data.personSSN);
                    $$('ehp-project-assignedTo').setValue(data.assignedEmployeeId);
                    $$('ehp-project-type').setValue(data.projectTypeId);
                    $$('ehp-project-status').setValue(data.statusId);
                    $$('ehp-project-summary').setValue(data.summary);
                    $$('ehp-project-detail').setValue(data.detail);
                    $$('ehp-project-requestDate').setValue(Number(data.dateRequested));
                    $$('ehp-project-requestTime').setValue(Number(data.timeRequested) / 100000);
        
                    $$('ehp-project-completedDate').setValue(Number(data.dateCompleted));
                    if (data.dateCompleted !== '0') {
                        $$('ehp-project-completedTime').setValue(Number(data.timeCompleted) / 100000);
                    }
                    projectData = {
                        assignedEmployeeId: data.assignedEmployeeId,
                        dateCompleted: data.dateCompleted,
                        detail: data.detail,
                        projectId: row.projectId,
                        projectTypeId: data.projectTypeId,
                        statusId: data.statusId,
                        summary: data.summary,
                        timeCompleted: data.timeCompleted
                    }
                }
            });
        }

        getProjectData();

        $$('ehp-project-reset').onclick(() => {
            $$('ehp-project-assignedTo').setValue(projectData.assignedEmployeeId);
            $$('ehp-project-type').setValue(projectData.projectTypeId);
            $$('ehp-project-status').setValue(projectData.statusId);
            $$('ehp-project-summary').setValue(projectData.summary);
            $$('ehp-project-detail').setValue(projectData.detail);

            $$('ehp-project-completedDate').setValue(Number(projectData.dateCompleted));

            if (data.dateCompleted !== '0') {
                $$('ehp-project-completedTime').setValue(Number(projectData.timeCompleted));
            }

            $$('ehp-project-update').disable();
            $$('ehp-project-reset').disable();
            $$('ehp-project-project').setValue(row.summary).setColor('black');
        });

        $$('ehp-project-update').onclick(() => {
            const params = {
                assignedEmployeeId: $$('ehp-project-assignedTo').getValue(),
                dateCompleted: $$('ehp-project-completedDate').getIntValue(),
                detail: $$('ehp-project-detail').getValue(),
                projectId: row.projectId,
                projectTypeId: $$('ehp-project-type').getValue(),
                statusId: $$('ehp-project-status').getValue(),
                summary: $$('ehp-project-summary').getValue(),
                timeCompleted: $$('ehp-project-completedDate').getIntValue() !== 0 ? $$('ehp-project-completedTime').getValue() : -1
            }

            AWS.callSoap(WS, 'saveProject', params).then(data => {
                if (data.wsStatus === "0") {
                    getProjectData();
                    $$('ehp-project-update').disable();
                    $$('ehp-project-reset').disable();
                    $$('ehp-project-project').setValue(row.summary).setColor('black');
                }
            });        
        });

        $$('ehp-project-assignedTo').onChange(() => {
            $$('ehp-project-update').enable();
            $$('ehp-project-reset').enable();
            $$('ehp-project-project').setValue(row.summary + ' (unsaved changes)').setColor('red');
        });
        $$('ehp-project-type').onChange(() => {
            $$('ehp-project-update').enable();
            $$('ehp-project-reset').enable();
            $$('ehp-project-project').setValue(row.summary + ' (unsaved changes)').setColor('red');
        });
        $$('ehp-project-status').onChange(() => {
            $$('ehp-project-update').enable();
            $$('ehp-project-reset').enable();
            $$('ehp-project-project').setValue(row.summary + ' (unsaved changes)').setColor('red');

            if ($$('ehp-project-status').getValue() === '00001-0000000078') {
                $$('ehp-project-completedDate').setValue(DateUtils.today());
                $$('ehp-project-completedTime').setValue(TimeUtils.current());
            } else {
                $$('ehp-project-completedDate').setValue(0);
                $$('ehp-project-completedTime').setValue(-1);
            }
        });
        $$('ehp-project-summary').onChange(() => {
            $$('ehp-project-update').enable();
            $$('ehp-project-reset').enable();
            $$('ehp-project-project').setValue(row.summary + ' (unsaved changes)').setColor('red');
        });
        $$('ehp-project-completedDate').onChange(() => {
            $$('ehp-project-update').enable();
            $$('ehp-project-reset').enable();
            $$('ehp-project-project').setValue(row.summary + ' (unsaved changes)').setColor('red');
        });
        $$('ehp-project-completedTime').onChange(() => {
            $$('ehp-project-update').enable();
            $$('ehp-project-reset').enable();
            $$('ehp-project-project').setValue(row.summary + ' (unsaved changes)').setColor('red');
        });

        $$('ehp-project-close').onclick(Utils.popup_close);
        Utils.popup_open('project-summary');
    }
    getListClosedProjectsForCompany();
    getListOpenProjectsForCompany();
    $$('openProjectView').onclick(() => {openProject('open');});
    $$('closedProjectView').onclick(() => {openProject('closed');});
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
            });
        };

        $$('esp-reset').onclick(reset);
        $$('esp-search').onclick(search);
        $$('esp-ok').onclick(ok);
        $$('esp-cancel').onclick(cancel);

        search();
    };

    function getEmployeeData() {
        return new Promise(resolve => {
            let formSearchGrid1;
            Utils.popup_open('dep-search');
                
            const reset = () => {
                $$('esp-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-first-search').clear();
    
                $$('esp-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-second-search').clear();
    
                $$('esp-third-search').clear();
    
                $$('esp-reset1').enable();
                $$('esp-search1').enable();
    
                $$('esp-ok1').disable();
    
                formSearchGrid1.clear();
                $$('esp-count1').setValue(`Displaying 0 Employees`);
            };
    
            const ok = () => {    
                const row = formSearchGrid1.getSelectedRow();
                if (row) {
                    resolve(row);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('esp-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lname', width: 180},
                    {headerName: 'First Name', field: 'fname', width: 180}
                ];
    
                formSearchGrid1 = new AGGrid('esp-grid1', columnDefs);
                formSearchGrid1.show();
            };
    
            if (!formSearchGrid1)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    autoDefault: false,
                    firstName: $$('esp-second-search').getValue(),
                    firstNameSearchType: $$('esp-second-criteria').getValue(),
                    lastName: $$('esp-first-search').getValue(),
                    lastNameSearchType: $$('esp-first-criteria').getValue(),
                    ssn: $$('esp-third-search').getValue()
                };
    
                
                AWS.callSoap(WS, 'searchEmployees', inParams).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid1.clear();
                        if (data.employees) {
                            const records = Utils.assureArray(data.employees);
                            formSearchGrid1.addRecords(records);
                            $$('esp-count1').setValue(`Displaying ${records.length} Employees`);
                        } else {
                            $$('esp-count1').setValue(`Displaying 0 Employees`);
                        }
    
                        formSearchGrid1.setOnSelectionChanged($$('esp-ok1').enable);
                
                        formSearchGrid1.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('esp-reset1').onclick(reset);
            $$('esp-search1').onclick(search);
            $$('esp-ok1').onclick(ok);
            $$('esp-cancel1').onclick(cancel);
    
            search();
        });
    }

    let cbResultsGrid;

    $$('employeeAdd').onclick(() => {       
        const container = new TabContainer('ep-tab-container');
        container.selectTab('ep-basic-TabButton');
        Utils.popup_open('employee-popup');

        AWS.callSoap(WS, 'loadMeta').then(data => {
            if (data.wsStatus === '0') {

            }
        });   
        $$('ep-eeoCategory').clear().add('', '(select)');
        AWS.callSoap(WS, 'listEEOCategories').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-eeoCategory').clear().add('', '(select)').addItems(data.item, 'eeoCategoryId', 'name');
            }
        });  

        $$('ep-eeoRace').clear().add('', '(select)');
        AWS.callSoap(WS, 'listEEORaces').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-eeoRace').clear().add('', '(select)').addItems(data.item, 'EEORaceId', 'name');
            }
        });  

        $$('ep-status').clear().add('', '(select)');
        AWS.callSoap(WS, 'listEmployeeStatuses').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-status').clear().add('', '(select)').addItems(data.item, 'employeeStatusId', 'name');
            }
        });  

        $$('ep-position').clear().add('', '(select)');
        AWS.callSoap(WS, 'listPositions').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-position').clear().add('', '(select)').addItems(data.item, 'positionId', 'positionName');
            }
        }); 

        $$('ep-wageType').clear().add('', '(select)');
        AWS.callSoap(WS, 'listWageTypes').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-wageType').clear().add('', '(select)').addItems(data.item, 'id', 'name');
            }
        }); 

        $$('ep-benefitClass').clear().add('', '(select)');
        AWS.callSoap(WS, 'listBenefitClasses').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-benefitClass').clear().add('', '(select)').addItems(data.item, 'BenefitClassId', 'name');
            }
        }); 

        AWS.callSoap(WS, 'getInheritedDefaultProject').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-inheritedFromCompany').setValue(data.projectFormatted);
            }
        }); 

        const paramsProject = {
            category: '',
            companyId: '',
            projectName: '',
            projectNameSearchType: 0,
            status: '',
            summary: '',
            summarySearchType: 0,
            type: ''
        }
        AWS.callSoap(WS, 'searchProjects', paramsProject).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ep-employeeOverride');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.setValue(res.item[0].projectId, res.item[0].description)
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectId, res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProject();
                });
            }
        }); 

        const paramsScreenGroup = {
            extId: '',
            name: '',
            nameSearchType: 0,
            screenGroupId: '',
            searchTopLevelOnly: true
        }
        AWS.callSoap(WS, 'searchScreenGroups', paramsScreenGroup).then(res => {
            if (res.wsStatus === '0') {
                res.screenDef = Utils.assureArray(res.screenDef);
                const ctl = $$('ep-screenGroup');
                ctl.clear();
                if (res.screenDef.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.screenDef.length === 1) {
                    ctl.setValue(res.screenDef[0].id, res.screenDef[0].title)
                } else if (res.screenDef.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.screenDef.length; i++)
                        ctl.add(res.screenDef[i].id, res.screenDef[i].title);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchScreenGroups();
                });
            }
        }); 

        const paramsSecurityGroup = {
            name: '',
            nameSearchType: 0,
            securityGroupId: ''
        }
        AWS.callSoap(WS, 'searchSecurityGroups', paramsSecurityGroup).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ep-securityGroup');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.setValue(res.item[0].groupId, res.item[0].name)
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].groupId, res.item[i].name);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchSecurityGroup();
                });
            }
        }); 
        const paramsOrgGroups = {
            name: '',
            nameSearchType: 0,
            personId: ''
        }
        AWS.callSoap(WS, 'searchOrgGroups', paramsOrgGroups).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ep-orgGroup');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.setValue(res.item[0].orgGroupId, res.item[0].orgGroupName)
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].orgGroupId, res.item[i].orgGroupName);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchOrgGroups();
                });
            }
        }); 

        function searchScreenGroups() {
            
        }
        function searchSecurityGroup() {
            
        }
        function searchOrgGroups() {
            
        }
        function searchProject() {
            let formSearchGrid;        
            Utils.popup_open('bdr-search-project');
    
            const searchProjectCode = (searchType) => {
                let formSearchGrid;
                switch (searchType) {
                    case 'category':
                        $$('bdr-project-data-search-type').setValue('Category');
                        $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Categories');
                        $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Category');
                        break;
        
                    case 'type':
                        $$('bdr-project-data-search-type').setValue('Type');
                        $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Types');
                        $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Type');
                        break;
        
                    case 'status':
                        $$('bdr-project-data-search-type').setValue('Status');
                        $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                        $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Status');
                        break;
                
                    default:
                        break;
                }
                
                Utils.popup_open('bdr-project-data-search');
                    
                const reset = () => {
                    $$('bdr-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('bdr-proj-code-search').clear();
        
                    $$('bdr-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('bdr-proj-descr-search').clear();
        
                    $$('bdr-projD-reset').enable();
                    $$('bdr-projD-search').enable();
        
                    $$('bdr-projD-ok').disable();
        
                    formSearchGrid.clear();
                    $$('bdr-projD-count').setValue(`Displaying 0 item`);
                };
        
                const ok = () => {    
                    const row = formSearchGrid.getSelectedRow();
                    if (row) {
                        switch (searchType) {
                            case 'category':
                                $$('bdr-proj-category').setValue(row.projectCategoryId, row.code);
                                break;
                
                            case 'type':
                                $$('bdr-proj-type').setValue(row.projectTypeId, row.code);
                                break;
                
                            case 'status':
                                $$('bdr-proj-status').setValue(row.projectStatusId, row.code);
                                break;
                        
                            default:
                                break;
                        }
                    }
                    reset();
                    Utils.popup_close();
                };
        
                const cancel = () => {
                    reset();
                    Utils.popup_close();
                };
        
                bindToEnum('bdr-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
                bindToEnum('bdr-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
                const initDataGrid = () => {
                    let columnDefs = [
                        {headerName: 'Code', field: 'code', width: 60},
                        {headerName: 'Description', field: 'description', width: 210}
                    ];
        
                    formSearchGrid = new AGGrid('bdr-projRes-grid', columnDefs);
                    formSearchGrid.show();
                };
        
                if (!formSearchGrid)
                    initDataGrid();
        
                const search = () => {
                    const params = {
                        code: $$('bdr-proj-code-search').getValue(),
                        codeSearchType: $$('bdr-proj-code-criteria').getValue(),
                        description: $$('bdr-proj-descr-search').getValue(),
                        descriptionSearchType: $$('bdr-proj-descr-criteria').getValue()
                    }
                    if (searchType === "category") {                    
                        AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                                } else {
                                    $$('bdr-projD-count').setValue(`Displaying 0 Project Categories`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    } else if (searchType === "type") {
                        AWS.callSoap(WS, 'searchProjectTypes', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Types`);
                                } else {
                                    $$('bdr-projD-count').setValue(`Displaying 0 Project Types`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    } else if (searchType === "status") {
                        AWS.callSoap(WS, 'searchProjectStatuses', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                                } else {
                                    $$('bdr-projD-count').setValue(`Displaying 0 Project Statuses`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    }                
                };
        
                $$('bdr-projD-reset').onclick(reset);
                $$('bdr-projD-search').onclick(search);
                $$('bdr-projD-ok').onclick(ok);
                $$('bdr-projD-cancel').onclick(cancel);
        
                $$('bdr-project-specific').onChange(() => {
                    if ($$('bdr-project-specific').getValue() === "A") {
                        formSearchGrid.clear();
                        $$('bdr-proj-code-criteria').disable();
                        $$('bdr-proj-code-search').disable();
        
                        $$('bdr-proj-descr-criteria').disable();
                        $$('bdr-proj-descr-search').disable();
        
                        switch (searchType) {
                            case 'category':
                                $$('bdr-proj-category').setValue(`Displaying 0 Project Categories`);
                                break;
                            
                            case 'status':
                                $$('bdr-proj-status').setValue(`Displaying 0 Project Statuses`);
                                break;
        
                            case 'type':
                                $$('bdr-proj-type').setValue(`Displaying 0 Project Types`);
                                break;
                        
                            default:
                                break;
                        }
                        $$('bdr-projD-ok').enable().onclick(() => {
                            $$('bdr-proj-' + searchType).setValue('');                         
                            reset();
                            Utils.popup_close();
                        });
                    } else {
                        $$('bdr-proj-code-criteria').enable();
                        $$('bdr-proj-code-search').enable();
        
                        $$('bdr-proj-descr-criteria').enable();
                        $$('bdr-proj-descr-search').enable();
        
                        $$('bdr-projD-ok').enable().onclick(ok);
                    }
                });
        
                search();
            }
                
            const reset = () => {
                $$('bdr-proj-projectName').clear();
                $$('bdr-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('bdr-proj-summary').clear();
                $$('bdr-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
    
                $$('bdr-proj-reset').enable();
                $$('bdr-proj-search').enable();
    
                $$('bdr-proj-ok').disable();
    
                formSearchGrid.clear();
                $$('bdr-proj-count').setValue(`Displaying 0 item`);
    
                $$('bdr-proj-category').clear();
                $$('bdr-proj-companyId').clear();
                $$('bdr-proj-status').clear();
                $$('bdr-proj-type').clear();
    
                const companyParams = {
                    companyId: '',
                    name: '',
                    nameSearchType: 2
                }
                AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-companyId');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].companyId, res.item[i].name);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchData('clientCompanyId');
                        });
                    }
                });
    
                const params = {
                    code: '',
                    codeSearchType: 2,
                    description: '',
                    descriptionSearchType: 2
                }
                AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-category');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].projectCategoryId, res.item[i].code);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchProjectCode('category');
                        });
                    }
                });
    
                AWS.callSoap(WS, 'searchProjectTypes', params).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-type');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].projectTypeId, res.item[i].code);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchProjectCode('type');
                        });
                    }
                });
    
                AWS.callSoap(WS, 'searchProjectStatuses', params).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-status');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].projectStatusId, res.item[i].code);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchProjectCode('status');
                        });
                    }
                });
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('ep-employeeOverride').setValue(row.projectId, row.projectName + ' - ' + row.description);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('bdr-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('bdr-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                        {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                        {headerName: 'Summary', field: 'description', width: 100},
                        {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                        {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                        {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                        {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                    ];
    
                formSearchGrid = new AGGrid('bdr-proj-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            reset();
            const search = () => {
                const params = {
                    category: $$('bdr-proj-category').getValue(),
                    companyId: $$('bdr-proj-companyId').getValue(),
                    projectName: $$('bdr-proj-projectName').getValue(),
                    projectNameSearchType: $$('bdr-proj-projectNameSearchType').getValue(),
                    status: $$('bdr-proj-status').getValue(),
                    summary: $$('bdr-proj-summary').getValue(),
                    summarySearchType: $$('bdr-proj-summarySearchType').getValue(),
                    type: $$('bdr-proj-type').getValue()
                }
                AWS.callSoap(WS, 'searchProjects', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('bdr-proj-count').setValue(`Displaying ${records.length} Projects`);
                        } else {
                            $$('bdr-proj-count').setValue(`Displaying 0 Projects`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-proj-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('bdr-proj-reset').onclick(reset);
            $$('bdr-proj-search').onclick(search);
            $$('bdr-proj-ok').onclick(ok);
            $$('bdr-proj-cancel').onclick(cancel);
    
            $$('bdr-proj-chooseProject').onChange(() => {
                if ($$('bdr-proj-chooseProject').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('bdr-proj-category').disable();
                    $$('bdr-proj-companyId').disable();
                    $$('bdr-proj-projectName').disable();
                    $$('bdr-proj-projectNameSearchType').disable();
                    $$('bdr-proj-status').disable();
                    $$('bdr-proj-summary').disable();
                    $$('bdr-proj-summarySearchType').disable();
                    $$('bdr-proj-type').disable();
    
                    $$('bdr-proj-count').setValue(`Displaying 0 Projects`);
    
                    $$('bdr-proj-ok').enable().onclick(() => {
                        $$('bdr-projectId').clear();
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('bdr-proj-category').enable();
                    $$('bdr-proj-companyId').enable();
                    $$('bdr-proj-projectName').enable();
                    $$('bdr-proj-projectNameSearchType').enable();
                    $$('bdr-proj-status').enable();
                    $$('bdr-proj-summary').enable();
                    $$('bdr-proj-summarySearchType').enable();
                    $$('bdr-proj-type').enable();
    
                    $$('bdr-proj-ok').enable().onclick(ok);
                }
            });
    
            search();
        }
        $$('ep-assignLogin').onChange(() => {
            if ($$('ep-assignLogin').getValue()) {
                $$('ep-generateLoginPass').enable();
                $$('ep-loginId').enable();
                $$('ep-screenGroup').enable();
                $$('ep-password').enable();
                $$('ep-securityGroup').enable();
                $$('ep-confirmPassword').enable();
                $$('ep-loginStatus').enable();
                $$('ep-showPassword').enable();
            } else {
                $$('ep-generateLoginPass').disable();
                $$('ep-loginId').disable().clear();
                $$('ep-screenGroup').disable().setValue('');
                $$('ep-password').disable().clear();
                $$('ep-securityGroup').disable().setValue('');
                $$('ep-confirmPassword').disable().clear();
                $$('ep-loginStatus').disable().setValue('Y');
                $$('ep-showPassword').disable().setValue(false);
            }
        });

        $$('ep-ok').onclick(() => {
            if ($$('ep-first').isError('First Name')) {
                container.selectTab('ep-basic-TabContent');
                return;
            }
            if ($$('ep-last').isError('Last Name')) {
                container.selectTab('ep-basic-TabContent');
                return;
            }
            if ($$('ep-status').isError('Status')) {
                container.selectTab('ep-position-TabContent');
                return;
            }
            if ($$('ep-statusDate').isError('Status Date')) {
                container.selectTab('ep-position-TabContent');
                return;
            }
            if ($$('ep-orgGroup').isError('Org. Group')) {
                container.selectTab('ep-position-TabContent');
                return;
            }

            if ($$('ep-assignLogin').getValue()) {
                if ($$('ep-loginId').isError('Login ID')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-screenGroup').isError('Screen Group')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-password').isError('Password')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-securityGroup').isError('Security Group')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-confirmPassword').isError('Confirm Password')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
            }
            
            const params = {
                addressLine1: $$('ep-addressLine1').getValue(),
                addressLine2: $$('ep-addressLine2').getValue(),
                applicantId: '',
                automotiveInsuranceCarrier: $$('ep-automotiveInsuranceCarrier').getValue(),
                automotiveInsuranceCoverage: $$('ep-automotiveInsuranceCoverage').getValue(),
                automotiveInsuranceExpirationDate: $$('ep-automotiveInsuranceExpirationDate').getIntValue(),
                automotiveInsurancePolicyNumber: $$('ep-automotiveInsurancePolicyNumber').getValue(),
                automotiveInsuranceStartDate: $$('ep-automotiveInsuranceStartDate').getIntValue(),
                benefitClass: $$('ep-benefitClass').getValue(),
                canLogin: $$('ep-assignLogin').getValue(),
                citizenship: $$('ep-citizenship').getValue(),
                city: $$('ep-city').getValue(),
                country: $$('ep-country').getValue(),
                county: $$('ep-county').getValue(),
                defaultProjectId: $$('ep-employeeOverride').getValue(),
                dependentId: '',
                dob: $$('ep-dob').getIntValue(),
                driversLicenseExpirationDate: $$('ep-driversLicenseExpirationDate').getIntValue(),
                driversLicenseNumber: $$('ep-driversLicenseNumber').getValue(),
                driversLicenseState: $$('ep-driversLicenseState').getValue(),
                eeoCategoryId: $$('ep-eeoCategory').getValue(),
                eeoRaceId: $$('ep-eeoRace').getValue(),
                empPassword: $$('ep-password').getValue(),
                employeeStatusDate: $$('ep-statusDate').getIntValue(),
                employeeStatusId: $$('ep-status').getValue(),
                extRef: $$('ep-extRef').getValue(),
                fname: $$('ep-first').getValue(),
                height: $$('ep-height').getValue(),
                homePhone: $$('ep-homePhone').getValue(),
                hrAdmin: $$('ep-hrAdmin').getValue(),
                i9Completed: $$('ep-i9Completed').getValue(),
                jobTitle: $$('ep-jobTitle').getValue(),
                lname: $$('ep-last').getValue(),
                login: $$('ep-loginId').getValue(),
                medicare: $$('ep-medicare').getValue(),
                middleName: $$('ep-middleName').getValue(),
                mobilePhone: $$('ep-mobilePhone').getValue(),
                nickName: $$('ep-nickName').getValue(),
                orgGroupId: $$('ep-orgGroup').getValue(),
                personalEmail: $$('ep-email').getValue(),
                positionId: $$('ep-position').getValue(),
                screenGroupId: $$('ep-screenGroup').getValue(),
                securityGroupId: $$('ep-securityGroup').getValue(),
                sex: $$('ep-sex').getValue(),
                ssn: $$('ep-ssn').getValue(),
                stateProvince: $$('ep-stateProvince').getValue(),
                tabaccoUse: $$('ep-tabaccoUse').getValue(),
                visa: $$('ep-visa').getValue(),
                visaExpirationDate: $$('ep-visaExpirationDate').getIntValue(),
                visaStatusDate: $$('ep-visaStatusDate').getIntValue(),
                wageAmount: $$('ep-wage').getValue(),
                wageTypeId: $$('ep-wageType').getValue(),
                weight: $$('ep-weight').getValue(),
                workFax: $$('ep-fax').getValue(),
                workPhone: $$('ep-workPhone').getValue(),
                zipPostalCode: $$('ep-zipPostalCode').getValue()
            }
            AWS.callSoap(WS, 'newEmployee', params).then(data => {
                if (data.wsStatus === '0') {
                    Utils.popup_close();
                }
            });
        });
        $$('ep-cancel').onclick(Utils.popup_close);
    });
    $$('employeeModify').onclick(async () => {       
        const container = new TabContainer('ep-tab-container');
        container.selectTab('ep-basic-TabButton');
        const employeeData = await getEmployeeData();

        
        $$('ep-eeoCategory').clear().add('', '(select)');
        AWS.callSoap(WS, 'listEEOCategories').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-eeoCategory').clear().add('', '(select)').addItems(data.item, 'eeoCategoryId', 'name');
            }
        });  

        $$('ep-eeoRace').clear().add('', '(select)');
        AWS.callSoap(WS, 'listEEORaces').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-eeoRace').clear().add('', '(select)').addItems(data.item, 'EEORaceId', 'name');
            }
        });  

        $$('ep-status').clear().add('', '(select)');
        AWS.callSoap(WS, 'listEmployeeStatuses').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-status').clear().add('', '(select)').addItems(data.item, 'employeeStatusId', 'name');
            }
        });  

        $$('ep-position').clear().add('', '(select)');
        AWS.callSoap(WS, 'listPositions').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-position').clear().add('', '(select)').addItems(data.item, 'positionId', 'positionName');
            }
        }); 

        $$('ep-wageType').clear().add('', '(select)');
        AWS.callSoap(WS, 'listWageTypes').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-wageType').clear().add('', '(select)').addItems(data.item, 'id', 'name');
            }
        }); 

        $$('ep-benefitClass').clear().add('', '(select)');
        AWS.callSoap(WS, 'listBenefitClasses').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-benefitClass').clear().add('', '(select)').addItems(data.item, 'BenefitClassId', 'name');
            }
        }); 

        AWS.callSoap(WS, 'getInheritedDefaultProject').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('ep-inheritedFromCompany').setValue(data.projectFormatted);
            }
        }); 

        const paramsProject = {
            category: '',
            companyId: '',
            projectName: '',
            projectNameSearchType: 0,
            status: '',
            summary: '',
            summarySearchType: 0,
            type: ''
        }
        AWS.callSoap(WS, 'searchProjects', paramsProject).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ep-employeeOverride');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.setValue(res.item[0].projectId, res.item[0].description)
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].projectId, res.item[i].description);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchProject();
                });
            }
        }); 

        const paramsScreenGroup = {
            extId: '',
            name: '',
            nameSearchType: 0,
            screenGroupId: '',
            searchTopLevelOnly: true
        }
        AWS.callSoap(WS, 'searchScreenGroups', paramsScreenGroup).then(res => {
            if (res.wsStatus === '0') {
                res.screenDef = Utils.assureArray(res.screenDef);
                const ctl = $$('ep-screenGroup');
                ctl.clear();
                if (res.screenDef.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.screenDef.length === 1) {
                    ctl.setValue(res.screenDef[0].id, res.screenDef[0].title)
                } else if (res.screenDef.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.screenDef.length; i++)
                        ctl.add(res.screenDef[i].id, res.screenDef[i].title);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchScreenGroups();
                });
            }
        }); 

        const paramsSecurityGroup = {
            name: '',
            nameSearchType: 0,
            securityGroupId: ''
        }
        AWS.callSoap(WS, 'searchSecurityGroups', paramsSecurityGroup).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ep-securityGroup');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.setValue(res.item[0].groupId, res.item[0].name)
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].groupId, res.item[i].name);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchSecurityGroup();
                });
            }
        }); 
        const paramsOrgGroups = {
            name: '',
            nameSearchType: 0,
            personId: ''
        }
        AWS.callSoap(WS, 'searchOrgGroups', paramsOrgGroups).then(res => {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                const ctl = $$('ep-orgGroup');
                ctl.clear();
                if (res.item.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.item.length === 1) {
                    ctl.setValue(res.item[0].orgGroupId, res.item[0].orgGroupName)
                } else if (res.item.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.item.length; i++)
                        ctl.add(res.item[i].orgGroupId, res.item[i].orgGroupName);
                } else {
                    ctl.forceSelect();
                    ctl.setValue('' ,'(choose)');
                }
                ctl.setSelectFunction(() => {
                    searchOrgGroups();
                });
            }
        }); 

        function searchScreenGroups() {
            
        }
        function searchSecurityGroup() {
            
        }
        function searchOrgGroups() {
            
        }
        function searchProject() {
            let formSearchGrid;        
            Utils.popup_open('bdr-search-project');
    
            const searchProjectCode = (searchType) => {
                let formSearchGrid;
                switch (searchType) {
                    case 'category':
                        $$('bdr-project-data-search-type').setValue('Category');
                        $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Categories');
                        $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Category');
                        break;
        
                    case 'type':
                        $$('bdr-project-data-search-type').setValue('Type');
                        $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Types');
                        $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Type');
                        break;
        
                    case 'status':
                        $$('bdr-project-data-search-type').setValue('Status');
                        $$('bdr-proj-chooseSpecificLabelAll').setValue('Project Statuses');
                        $$('bdr-proj-chooseSpecificLabelSearch').setValue('Project Status');
                        break;
                
                    default:
                        break;
                }
                
                Utils.popup_open('bdr-project-data-search');
                    
                const reset = () => {
                    $$('bdr-proj-code-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('bdr-proj-code-search').clear();
        
                    $$('bdr-proj-descr-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                    $$('bdr-proj-descr-search').clear();
        
                    $$('bdr-projD-reset').enable();
                    $$('bdr-projD-search').enable();
        
                    $$('bdr-projD-ok').disable();
        
                    formSearchGrid.clear();
                    $$('bdr-projD-count').setValue(`Displaying 0 item`);
                };
        
                const ok = () => {    
                    const row = formSearchGrid.getSelectedRow();
                    if (row) {
                        switch (searchType) {
                            case 'category':
                                $$('bdr-proj-category').setValue(row.projectCategoryId, row.code);
                                break;
                
                            case 'type':
                                $$('bdr-proj-type').setValue(row.projectTypeId, row.code);
                                break;
                
                            case 'status':
                                $$('bdr-proj-status').setValue(row.projectStatusId, row.code);
                                break;
                        
                            default:
                                break;
                        }
                    }
                    reset();
                    Utils.popup_close();
                };
        
                const cancel = () => {
                    reset();
                    Utils.popup_close();
                };
        
                bindToEnum('bdr-proj-code-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
                bindToEnum('bdr-proj-descr-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        
                const initDataGrid = () => {
                    let columnDefs = [
                        {headerName: 'Code', field: 'code', width: 60},
                        {headerName: 'Description', field: 'description', width: 210}
                    ];
        
                    formSearchGrid = new AGGrid('bdr-projRes-grid', columnDefs);
                    formSearchGrid.show();
                };
        
                if (!formSearchGrid)
                    initDataGrid();
        
                const search = () => {
                    const params = {
                        code: $$('bdr-proj-code-search').getValue(),
                        codeSearchType: $$('bdr-proj-code-criteria').getValue(),
                        description: $$('bdr-proj-descr-search').getValue(),
                        descriptionSearchType: $$('bdr-proj-descr-criteria').getValue()
                    }
                    if (searchType === "category") {                    
                        AWS.callSoap(WS, 'searchProjectCategories', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Categories`);
                                } else {
                                    $$('bdr-projD-count').setValue(`Displaying 0 Project Categories`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    } else if (searchType === "type") {
                        AWS.callSoap(WS, 'searchProjectTypes', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Types`);
                                } else {
                                    $$('bdr-projD-count').setValue(`Displaying 0 Project Types`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    } else if (searchType === "status") {
                        AWS.callSoap(WS, 'searchProjectStatuses', params).then(data => {
                            if (data.wsStatus === '0') {
                                formSearchGrid.clear();
                                if (data.item) {
                                    const records = Utils.assureArray(data.item);
                                    formSearchGrid.addRecords(records);
                                    $$('bdr-projD-count').setValue(`Displaying ${records.length} Project Statuses`);
                                } else {
                                    $$('bdr-projD-count').setValue(`Displaying 0 Project Statuses`);
                                }
            
                                formSearchGrid.setOnSelectionChanged($$('bdr-projD-ok').enable);
                        
                                formSearchGrid.setOnRowDoubleClicked(ok);
                            }
                        });
                    }                
                };
        
                $$('bdr-projD-reset').onclick(reset);
                $$('bdr-projD-search').onclick(search);
                $$('bdr-projD-ok').onclick(ok);
                $$('bdr-projD-cancel').onclick(cancel);
        
                $$('bdr-project-specific').onChange(() => {
                    if ($$('bdr-project-specific').getValue() === "A") {
                        formSearchGrid.clear();
                        $$('bdr-proj-code-criteria').disable();
                        $$('bdr-proj-code-search').disable();
        
                        $$('bdr-proj-descr-criteria').disable();
                        $$('bdr-proj-descr-search').disable();
        
                        switch (searchType) {
                            case 'category':
                                $$('bdr-proj-category').setValue(`Displaying 0 Project Categories`);
                                break;
                            
                            case 'status':
                                $$('bdr-proj-status').setValue(`Displaying 0 Project Statuses`);
                                break;
        
                            case 'type':
                                $$('bdr-proj-type').setValue(`Displaying 0 Project Types`);
                                break;
                        
                            default:
                                break;
                        }
                        $$('bdr-projD-ok').enable().onclick(() => {
                            $$('bdr-proj-' + searchType).setValue('');                         
                            reset();
                            Utils.popup_close();
                        });
                    } else {
                        $$('bdr-proj-code-criteria').enable();
                        $$('bdr-proj-code-search').enable();
        
                        $$('bdr-proj-descr-criteria').enable();
                        $$('bdr-proj-descr-search').enable();
        
                        $$('bdr-projD-ok').enable().onclick(ok);
                    }
                });
        
                search();
            }
                
            const reset = () => {
                $$('bdr-proj-projectName').clear();
                $$('bdr-proj-projectNameSearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('bdr-proj-summary').clear();
                $$('bdr-proj-summarySearchType').setValue(StringCriteriaMatcher.STARTS_WITH.value);
    
                $$('bdr-proj-reset').enable();
                $$('bdr-proj-search').enable();
    
                $$('bdr-proj-ok').disable();
    
                formSearchGrid.clear();
                $$('bdr-proj-count').setValue(`Displaying 0 item`);
    
                $$('bdr-proj-category').clear();
                $$('bdr-proj-companyId').clear();
                $$('bdr-proj-status').clear();
                $$('bdr-proj-type').clear();
    
                const companyParams = {
                    companyId: '',
                    name: '',
                    nameSearchType: 2
                }
                AWS.callSoap(WS, 'searchCompany', companyParams).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-companyId');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].companyId, res.item[i].name);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchData('clientCompanyId');
                        });
                    }
                });
    
                const params = {
                    code: '',
                    codeSearchType: 2,
                    description: '',
                    descriptionSearchType: 2
                }
                AWS.callSoap(WS, 'searchProjectCategories', params).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-category');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].projectCategoryId, res.item[i].code);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchProjectCode('category');
                        });
                    }
                });
    
                AWS.callSoap(WS, 'searchProjectTypes', params).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-type');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].projectTypeId, res.item[i].code);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchProjectCode('type');
                        });
                    }
                });
    
                AWS.callSoap(WS, 'searchProjectStatuses', params).then(res => {
                    if (res.wsStatus === "0") {
                        res.item = Utils.assureArray(res.item);
                        const ctl = $$('bdr-proj-status');
                        ctl.clear();
                        if (res.item.length === 0) {
                            ctl.nothingToSelect();
                        } else if (res.item.length <= res.lowCap) {
                            ctl.useDropdown();
                            ctl.add('', '(choose)');
                            for (let i = 0 ; i < res.item.length; i++)
                                ctl.add(res.item[i].projectStatusId, res.item[i].code);
                        } else {
                            ctl.forceSelect();
                            ctl.setValue('' ,'(choose)');
                        }
                        ctl.setSelectFunction(() => {
                            searchProjectCode('status');
                        });
                    }
                });
            };
    
            const ok = () => {    
                const row = formSearchGrid.getSelectedRow();
                if (row) {
                    $$('ep-employeeOverride').setValue(row.projectId, row.projectName + ' - ' + row.description);
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('bdr-proj-projectNameSearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('bdr-proj-summarySearchType', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                        {headerName: 'ID', field: 'projectName', type: "numericColumn", width: 60},
                        {headerName: 'Summary', field: 'description', width: 100},
                        {headerName: 'Requesting Company', field: 'requestingCompanyName', width: 100},
                        {headerName: 'Category Code', field: 'projectCategoryCode', width: 60},
                        {headerName: 'Type Code', field: 'projectTypeCode', width: 40},
                        {headerName: 'Status Code', field: 'projectStatusCode', width: 60}
                    ];
    
                formSearchGrid = new AGGrid('bdr-proj-grid', columnDefs);
                formSearchGrid.show();
            };
    
            if (!formSearchGrid)
                initDataGrid();
    
            reset();
            const search = () => {
                const params = {
                    category: $$('bdr-proj-category').getValue(),
                    companyId: $$('bdr-proj-companyId').getValue(),
                    projectName: $$('bdr-proj-projectName').getValue(),
                    projectNameSearchType: $$('bdr-proj-projectNameSearchType').getValue(),
                    status: $$('bdr-proj-status').getValue(),
                    summary: $$('bdr-proj-summary').getValue(),
                    summarySearchType: $$('bdr-proj-summarySearchType').getValue(),
                    type: $$('bdr-proj-type').getValue()
                }
                AWS.callSoap(WS, 'searchProjects', params).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid.addRecords(records);
                            $$('bdr-proj-count').setValue(`Displaying ${records.length} Projects`);
                        } else {
                            $$('bdr-proj-count').setValue(`Displaying 0 Projects`);
                        }
    
                        formSearchGrid.setOnSelectionChanged($$('bdr-proj-ok').enable);
                
                        formSearchGrid.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('bdr-proj-reset').onclick(reset);
            $$('bdr-proj-search').onclick(search);
            $$('bdr-proj-ok').onclick(ok);
            $$('bdr-proj-cancel').onclick(cancel);
    
            $$('bdr-proj-chooseProject').onChange(() => {
                if ($$('bdr-proj-chooseProject').getValue() === "A") {
                    formSearchGrid.clear();
                    $$('bdr-proj-category').disable();
                    $$('bdr-proj-companyId').disable();
                    $$('bdr-proj-projectName').disable();
                    $$('bdr-proj-projectNameSearchType').disable();
                    $$('bdr-proj-status').disable();
                    $$('bdr-proj-summary').disable();
                    $$('bdr-proj-summarySearchType').disable();
                    $$('bdr-proj-type').disable();
    
                    $$('bdr-proj-count').setValue(`Displaying 0 Projects`);
    
                    $$('bdr-proj-ok').enable().onclick(() => {
                        $$('bdr-projectId').clear();
                        reset();
                        Utils.popup_close();
                    });
                } else {
                    $$('bdr-proj-category').enable();
                    $$('bdr-proj-companyId').enable();
                    $$('bdr-proj-projectName').enable();
                    $$('bdr-proj-projectNameSearchType').enable();
                    $$('bdr-proj-status').enable();
                    $$('bdr-proj-summary').enable();
                    $$('bdr-proj-summarySearchType').enable();
                    $$('bdr-proj-type').enable();
    
                    $$('bdr-proj-ok').enable().onclick(ok);
                }
            });
    
            search();
        }
        $$('ep-assignLogin').onChange(() => {
            if ($$('ep-assignLogin').getValue()) {
                $$('ep-generateLoginPass').enable();
                $$('ep-loginId').enable();
                $$('ep-screenGroup').enable();
                $$('ep-password').enable();
                $$('ep-securityGroup').enable();
                $$('ep-confirmPassword').enable();
                $$('ep-loginStatus').enable();
                $$('ep-showPassword').enable();
            } else {
                $$('ep-generateLoginPass').disable();
                $$('ep-loginId').disable().clear();
                $$('ep-screenGroup').disable().setValue('');
                $$('ep-password').disable().clear();
                $$('ep-securityGroup').disable().setValue('');
                $$('ep-confirmPassword').disable().clear();
                $$('ep-loginStatus').disable().setValue('Y');
                $$('ep-showPassword').disable().setValue(false);
            }
        });

        $$('ep-ok').onclick(() => {
            if ($$('ep-first').isError('First Name')) {
                container.selectTab('ep-basic-TabContent');
                return;
            }
            if ($$('ep-last').isError('Last Name')) {
                container.selectTab('ep-basic-TabContent');
                return;
            }
            if ($$('ep-status').isError('Status')) {
                container.selectTab('ep-position-TabContent');
                return;
            }
            if ($$('ep-statusDate').isError('Status Date')) {
                container.selectTab('ep-position-TabContent');
                return;
            }
            if ($$('ep-orgGroup').isError('Org. Group')) {
                container.selectTab('ep-position-TabContent');
                return;
            }

            if ($$('ep-assignLogin').getValue()) {
                if ($$('ep-loginId').isError('Login ID')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-screenGroup').isError('Screen Group')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-password').isError('Password')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-securityGroup').isError('Security Group')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
                if ($$('ep-confirmPassword').isError('Confirm Password')) {
                    container.selectTab('ep-login-TabContent');
                    return;
                }
            }
            
            const params = {
                addressLine1: $$('ep-addressLine1').getValue(),
                addressLine2: $$('ep-addressLine2').getValue(),
                applicantId: '',
                automotiveInsuranceCarrier: $$('ep-automotiveInsuranceCarrier').getValue(),
                automotiveInsuranceCoverage: $$('ep-automotiveInsuranceCoverage').getValue(),
                automotiveInsuranceExpirationDate: $$('ep-automotiveInsuranceExpirationDate').getIntValue(),
                automotiveInsurancePolicyNumber: $$('ep-automotiveInsurancePolicyNumber').getValue(),
                automotiveInsuranceStartDate: $$('ep-automotiveInsuranceStartDate').getIntValue(),
                benefitClass: $$('ep-benefitClass').getValue(),
                canLogin: $$('ep-assignLogin').getValue(),
                citizenship: $$('ep-citizenship').getValue(),
                city: $$('ep-city').getValue(),
                country: $$('ep-country').getValue(),
                county: $$('ep-county').getValue(),
                defaultProjectId: $$('ep-employeeOverride').getValue(),
                dependentId: '',
                dob: $$('ep-dob').getIntValue(),
                driversLicenseExpirationDate: $$('ep-driversLicenseExpirationDate').getIntValue(),
                driversLicenseNumber: $$('ep-driversLicenseNumber').getValue(),
                driversLicenseState: $$('ep-driversLicenseState').getValue(),
                eeoCategoryId: $$('ep-eeoCategory').getValue(),
                eeoRaceId: $$('ep-eeoRace').getValue(),
                empPassword: $$('ep-password').getValue(),
                employeeStatusDate: $$('ep-statusDate').getIntValue(),
                employeeStatusId: $$('ep-status').getValue(),
                extRef: $$('ep-extRef').getValue(),
                fname: $$('ep-first').getValue(),
                height: $$('ep-height').getValue(),
                homePhone: $$('ep-homePhone').getValue(),
                hrAdmin: $$('ep-hrAdmin').getValue(),
                i9Completed: $$('ep-i9Completed').getValue(),
                jobTitle: $$('ep-jobTitle').getValue(),
                lname: $$('ep-last').getValue(),
                login: $$('ep-loginId').getValue(),
                medicare: $$('ep-medicare').getValue(),
                middleName: $$('ep-middleName').getValue(),
                mobilePhone: $$('ep-mobilePhone').getValue(),
                nickName: $$('ep-nickName').getValue(),
                orgGroupId: $$('ep-orgGroup').getValue(),
                personalEmail: $$('ep-email').getValue(),
                positionId: $$('ep-position').getValue(),
                screenGroupId: $$('ep-screenGroup').getValue(),
                securityGroupId: $$('ep-securityGroup').getValue(),
                sex: $$('ep-sex').getValue(),
                ssn: $$('ep-ssn').getValue(),
                stateProvince: $$('ep-stateProvince').getValue(),
                tabaccoUse: $$('ep-tabaccoUse').getValue(),
                visa: $$('ep-visa').getValue(),
                visaExpirationDate: $$('ep-visaExpirationDate').getIntValue(),
                visaStatusDate: $$('ep-visaStatusDate').getIntValue(),
                wageAmount: $$('ep-wage').getValue(),
                wageTypeId: $$('ep-wageType').getValue(),
                weight: $$('ep-weight').getValue(),
                workFax: $$('ep-fax').getValue(),
                workPhone: $$('ep-workPhone').getValue(),
                zipPostalCode: $$('ep-zipPostalCode').getValue()
            }
            AWS.callSoap(WS, 'saveEmployee', params).then(data => {
                if (data.wsStatus === '0') {
                    Utils.popup_close();
                }
            });
        });
        $$('ep-cancel').onclick(Utils.popup_close);
        const employeeParams = {
            employeeId: employeeData.personId
        }

        AWS.callSoap(WS, 'loadEmployee', employeeParams).then(data => {
            if (data.wsStatus === '0') {
                if (data.canLogin === 'true') {
                    $$('ep-generateLoginPass').enable();
                    $$('ep-loginId').enable();
                    $$('ep-screenGroup').enable();
                    $$('ep-password').enable();
                    $$('ep-securityGroup').enable();
                    $$('ep-confirmPassword').enable();
                    $$('ep-loginStatus').enable();
                    $$('ep-showPassword').enable();
                } else {
                    $$('ep-generateLoginPass').disable();
                    $$('ep-loginId').disable();
                    $$('ep-screenGroup').disable();
                    $$('ep-password').disable();
                    $$('ep-securityGroup').disable();
                    $$('ep-confirmPassword').disable();
                    $$('ep-loginStatus').disable();
                    $$('ep-showPassword').disable();
                }
                $$('ep-addressLine1').setValue(data.addressLine1);
                $$('ep-addressLine2').setValue(data.addressLine2);
                $$('ep-automotiveInsuranceCarrier').setValue(data.automotiveInsuranceCarrier);
                $$('ep-automotiveInsuranceCoverage').setValue(data.automotiveInsuranceCoverage),
                $$('ep-automotiveInsuranceExpirationDate').setValue(data.automotiveInsuranceExpirationDate !== '0' ? data.automotiveInsuranceExpirationDate : '');
                $$('ep-automotiveInsurancePolicyNumber').setValue(data.automotiveInsurancePolicyNumber);
                $$('ep-automotiveInsuranceStartDate').setValue(data.automotiveInsuranceStartDate !== '0' ? data.automotiveInsuranceStartDate : '');
                $$('ep-benefitClass').setValue(data.benefitClass);
                $$('ep-assignLogin').setValue(data.canLogin === 'true');
                $$('ep-citizenship').setValue(data.citizenship);
                $$('ep-city').setValue(data.city);
                $$('ep-country').setValue(data.country);
                $$('ep-county').setValue(data.county);
                $$('ep-employeeOverride').setValue(data.defaultProjectId);
                $$('ep-dob').setValue(data.dob !== '0' ? data.dob : '');
                $$('ep-driversLicenseExpirationDate').setValue(data.driversLicenseExpirationDate !== '0' ? data.driversLicenseExpirationDate : '');
                $$('ep-driversLicenseNumber').setValue(data.driversLicenseNumber);
                $$('ep-driversLicenseState').setValue(data.driversLicenseState);
                $$('ep-eeoCategory').setValue(data.eeoCategoryId);
                $$('ep-eeoRace').setValue(data.eeoRaceId);
                $$('ep-password').setValue(data.empPassword);
                $$('ep-confirmPassword').setValue(data.empPassword);
                $$('ep-statusDate').setValue(data.employeeStatusDate !== '0' ? data.employeeStatusDate : '');
                $$('ep-status').setValue(data.employeeStatusId);
                $$('ep-extRef').setValue(data.extRef);
                $$('ep-first').setValue(data.fname);
                $$('ep-height').setValue(data.height);
                $$('ep-homePhone').setValue(data.homePhone);
                $$('ep-hrAdmin').setValue(data.hrAdmin === 'true');
                $$('ep-i9Completed').setValue(data.i9Completed === 'true');
                $$('ep-jobTitle').setValue(data.jobTitle);
                $$('ep-last').setValue(data.lname);
                $$('ep-loginId').setValue(data.login);
                $$('ep-medicare').setValue(data.medicare);
                $$('ep-middleName').setValue(data.middleName);
                $$('ep-mobilePhone').setValue(data.mobilePhone);
                $$('ep-nickName').setValue(data.nickName);
                $$('ep-orgGroup').setValue(data.orgGroupId);
                $$('ep-email').setValue(data.personalEmail);
                $$('ep-position').setValue(data.positionId);
                $$('ep-screenGroup').setValue(data.screenGroupId);
                $$('ep-securityGroup').setValue(data.securityGroupId);
                $$('ep-sex').setValue(data.sex);
                $$('ep-ssn').setValue(data.ssn),
                $$('ep-stateProvince').setValue(data.stateProvince);
                $$('ep-tabaccoUse').setValue(data.tabaccoUse);
                $$('ep-visa').setValue(data.visa);
                $$('ep-visaExpirationDate').setValue(data.visaExpirationDate !== '0' ? data.visaExpirationDate : '');
                $$('ep-visaStatusDate').setValue(data.visaStatusDate !== '0' ? data.visaStatusDate : '');
                $$('ep-wage').setValue(data.wageAmount);
                $$('ep-wageType').setValue(data.wageTypeId);
                $$('ep-weight').setValue(data.weight);
                $$('ep-fax').setValue(data.workFax);
                $$('ep-workPhone').setValue(data.workPhone);
                $$('ep-zipPostalCode').setValue(data.zipPostalCode);
            }
        });   
        Utils.popup_open('employee-popup');
    });
    $$('employeeTerminate').onclick(async () => {
        const initDataGrid = () => {
            const cbResultsColumnDefs = [
                {headerName: "Name Name", field: "name", width: 500},
                {headerName: "Policy End Date", field: "endDateFormatted", type: "numericColumnd", width: 500}
            ];
            cbResultsGrid = new AGGrid('employeeStatusGrid', cbResultsColumnDefs);
            cbResultsGrid.show();
        }
        if (!cbResultsGrid) {
            initDataGrid();
        } else {
            cbResultsGrid.destroy();
            initDataGrid();
        }
        const employeeData = await getEmployeeData();
        Utils.popup_open('terminate-employee');

        $$('te-employee').clear();
        $$('te-inactivateLogin').setValue(true);
        $$('te-grossMisconduct').setValue(false);
        $$('te-status').clear();
        $$('te-date').clear();
        $$('te-notes').clear();
        $$('te-addInfo').clear();
        $$('te-reason').clear().add('', '(select)');
        $$('te-newStatus').clear().add('', '(select)');

        AWS.callSoap(WS, 'listInactiveStatuses').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('te-newStatus').clear().add('', '(select)').addItems(data.item, 'id', 'name');
            }
        });

        AWS.callSoap(WS, 'listTerminationChangeReasons').then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('te-reason').clear().add('', '(select)').addItems(data.item, 'id', 'description');
            }
        });

        function loadEmployeeStatus() {
            const params = {
                employeeId: employeeData.personId
            }
            AWS.callSoap(WS, 'loadEmployeeStatus', params).then(data => {
                cbResultsGrid.clear();
                if (data.wsStatus === '0') {
                    data.benefit = Utils.assureArray(data.benefit);
                    for (let i = 0; i < data.benefit.length; i++) {
                        data.benefit[i].endDateFormatted = data.benefit[i].endDate !== '0' ? DateUtils.intToStr4(data.benefit[i].endDate) : '';
                    }
                    cbResultsGrid.addRecords(data.benefit);
                    $$('te-employee').setValue(data.name);
                    $$('te-status').setValue(data.currentStatus);
                    $$('te-date').setValue(data.changeDate !== '0' ? Number(data.changeDate) : '');
                }
            });
        }
        loadEmployeeStatus();
        $$('te-edit').onclick(() => {
            const row = cbResultsGrid.getSelectedRow();
            $$('ecd-date').setValue(row.proposedEndDate);

            $$('ecd-ok').onclick(() => {
                row.proposedEndDate = $$('ecd-date').getIntValue();
                row.proposedEndDateFormatted = DateUtils.intToStr4($$('ecd-date').getIntValue());

                cbResultsGrid.updateSelectedRecord(row);
                Utils.popup_close();
            });
            $$('ecd-cancel').onclick(Utils.popup_close);
            Utils.popup_open('edit-cancel-date');
        });
        $$('te-ok').onclick(() => {
            const rows = cbResultsGrid.getAllRows();
            if ($$('te-newStatus').isError('New Status')) {
                return;
            }
            let benefitCancelDate = [];
            for (let i = 0; i < rows.length; i++) {
                benefitCancelDate.push({
                    cancelDate: rows[i].endDate,
                    id: rows[i].id
                });
            }
            const params = {
                benefitCancelDate: benefitCancelDate,
                changeReasonId: $$('te-reason').getValue(),
                finalDate: $$('te-date').getIntValue(),
                inactiveateLogin: $$('te-inactivateLogin').getValue(),
                misconduct: $$('te-grossMisconduct').getValue(),
                misconductInfo: $$('te-addInfo').getValue(),
                notes: $$('te-notes').getValue(),
                statusId: $$('te-notes').getValue(),
                personId: employeeData.personId
            }
            AWS.callSoap(WS, 'terminateEmployee', params).then(data => {
                if (data.wsStatus === '0') {
                   Utils.popup_close();
                }
            });
        });
        $$('te-cancel').onclick(Utils.popup_close);
    });
    $$('employeeEnroll').onclick(async () => {
        const employeeData = await getEmployeeData();
        Utils.popup_open('benefit-enrollment');
        
        $$('be-ok').onclick(() => {
            if ($$('be-actionType').getValue() === 1) {
                Utils.saveData(HR_PERSON_ID, employeeData.personId);
                Framework.getChild();
            } else {
                const params = {
                    employeeId: employeeData.personId
                }
                AWS.callSoap(WS, 'inviteEmployeeToEnroll', params).then(data => {
                    if (data.wsStatus === '0') {
                        Utils.popup_close();
                    }
                });      
            }
        });
        $$('be-cancel').onclick(Utils.popup_close);
    });
    $$('benefitDependentCancel').onclick(async () => {
        const initDataGrid = () => {
            const cbResultsColumnDefs = [
                {headerName: "First Name", field: "firstName", width: 200},
                {headerName: "Last Name", field: "lastName", width: 200},
                {headerName: "SSN", field: "ssn", width: 200},
                {headerName: "Relationship", field: "relationship", width: 200},
                {headerName: "Current Status", field: "currentStatus", width: 200}
            ];
            cbResultsGrid = new AGGrid('cbResults', cbResultsColumnDefs);
            cbResultsGrid.show();
        }
        const reset = () => {
            $$('cb-employee').clear();
            $$('cb-reason').clear().hide();
            $$('cb-reason-label').hide();
            $$('cb-edit').setValue('Inactivate');
            $$('cb-ok').setValue('Ok');
            $$('cb-cancel').setValue('Cancel');
        }     
        reset();
        if (!cbResultsGrid) {
            initDataGrid();
        } else {
            cbResultsGrid.destroy();
            initDataGrid();
        }
        const employeeData = await getEmployeeData();   

        function getListEmployeeDependents() {
            const employeeId = {
                employeeId: employeeData.personId
            };
            AWS.callSoap(WS, 'listEmployeeDependents', employeeId).then(data => {
                if (data.wsStatus === '0') {
                    $$('cb-employee').setValue(data.employeeName);
                    data.dependents = Utils.assureArray(data.dependents);
                    cbResultsGrid.addRecords(data.dependents);
                    cbResultsGrid.setOnSelectionChanged(() => {
                        $$('cb-edit').enable();
                        $$('cb-ok').enable();
                    })
                }
            });
        }        
        getListEmployeeDependents();
        $$('cb-edit').onclick(() => {
            $$('id-date').clear();
            $$('id-reason').clear().add('', '(select)');

            const personConfigId = {
                personConfigId: ''
            }
            AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
                if (data.wsStatus === '0') {
                    data.item = Utils.assureArray(data.item);
                    $$('id-reason').clear().add('', '(select)').addItems(data.item, 'id', 'description');
                }
            });

            $$('id-ok').onclick(() => {
                if ($$('id-reason').isError('Reason')) {
                    return;
                }
                if ($$('id-date').isError('Date')) {
                    return;
                }
                const params = {
                    benefitChangeReasonId: $$('id-reason').getValue(),
                    dependentId: cbResultsGrid.getSelectedRow().id,
                    termDate: $$('id-date').getIntValue()
                }
                AWS.callSoap(WS, 'terminateDependent', params).then(data => {
                    if (data.wsStatus === '0') {
                        getListEmployeeDependents();
                    }
                });
                
                Utils.popup_close();
            });
            $$('id-cancel').onclick(Utils.popup_close);
            Utils.popup_open('inactivate-dependent');
        });
        $$('cb-ok').onclick(() => {
            getListClosedProjectsForCompany();
            getListOpenProjectsForCompany();
            Utils.popup_close();
            reset();
        });
        $$('cb-cancel').onclick(() => { 
            Utils.popup_close(); 
            reset();
        });
        Utils.popup_open('cancel-benefits');
    });
    $$('benefitCancel').onclick(async () => {
        const initDataGrid = () => {
            const cbResultsColumnDefs = [
                {headerName: "Category", field: "categoryName", width: 200},
                {headerName: "Benefit", field: "benefitName", width: 200},
                {headerName: "Config", field: "name", width: 200},
                {headerName: "Start Date", field: "startDateFormatted", type: "numericColumn", width: 200},
                {headerName: "End Date", field: "endDateFormatted", type: "numericColumn", width: 200},
                {headerName: "Proposed End Date", field: "proposedEndDateFormatted", type: "numericColumn", width: 200}
            ];
            cbResultsGrid = new AGGrid('cbResults', cbResultsColumnDefs);
            cbResultsGrid.show();
        }
        const reset = () => {
            $$('cb-employee').setValue(employeeData.fname + ' ' + employeeData.lname);
            $$('cb-reason').clear().add('', '(select)').show();
            $$('cb-reason-label').show();
            $$('cb-edit').setValue('Edit Proposed End Date');
            $$('cb-ok').setValue('Cancel Selected Benefits');
            $$('cb-cancel').setValue('Close');
        }     
        if (!cbResultsGrid) {
            initDataGrid();
        } else {
            cbResultsGrid.destroy();
            initDataGrid();
        }
        const employeeData = await getEmployeeData();   
        reset();
        const personConfigId = {
            personConfigId: ''
        };
        AWS.callSoap(WS, 'listBenefitChangeReasons', personConfigId).then(data => {
            if (data.wsStatus === '0') {
                data.item = Utils.assureArray(data.item);
                $$('cb-reason').clear().add('', '(select)').addItems(data.item, 'id', 'description');
            }
        });
        function getListEmployeeBenefits() {
            const employeeId = {
                employeeId: employeeData.personId
            };
            AWS.callSoap(WS, 'listEmployeeBenefits', employeeId).then(data => {
                if (data.wsStatus === '0') {
                    data.item = Utils.assureArray(data.item);
                    for (let i = 0; i < data.item.length; i++) {
                        data.item[i].startDateFormatted = data.item[i].startDate !== '0' ? DateUtils.intToStr4(data.item[i].startDate) : '';
                        data.item[i].endDateFormatted = data.item[i].endDate !== '0' ? DateUtils.intToStr4(data.item[i].endDate) : '';
                        data.item[i].proposedEndDateFormatted = data.item[i].proposedEndDate !== '0' ? DateUtils.intToStr4(data.item[i].proposedEndDate) : '';
                    }
                    cbResultsGrid.addRecords(data.item);
                    cbResultsGrid.setOnSelectionChanged(() => {
                        $$('cb-edit').enable();
                        $$('cb-ok').enable();
                    })
                }
            });
        }        
        getListEmployeeBenefits();
        $$('cb-edit').onclick(() => {
            const row = cbResultsGrid.getSelectedRow();
            $$('ecd-date').setValue(row.proposedEndDate);

            $$('ecd-ok').onclick(() => {
                row.proposedEndDate = $$('ecd-date').getIntValue();
                row.proposedEndDateFormatted = DateUtils.intToStr4($$('ecd-date').getIntValue());

                cbResultsGrid.updateSelectedRecord(row);
                Utils.popup_close();
            });
            $$('ecd-cancel').onclick(Utils.popup_close);
            Utils.popup_open('edit-cancel-date');
        });
        $$('cb-ok').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you want to cancel the selected Benefit?', () => {
                if ($$('cb-reason').isError('Reason')) {
                    return;
                }
                const row = cbResultsGrid.getSelectedRow();
                const data = {
                    benefitChangeReasonId: $$('cb-reason').getValue(),
                    effectiveDates: row.proposedEndDate,
                    ids: row.id
                };
                AWS.callSoap(WS, 'cancelBenefits', data).then(function (res) {
                    if (res.wsStatus === "0") {
                        getListEmployeeBenefits();
                    }
                });
            });
        });
        $$('cb-cancel').onclick(() => { 
            Utils.popup_close(); 
            reset();
        });
        Utils.popup_open('cancel-benefits');
    });
    $$('dependentAdd').onclick(() => {
        $$('dep-title').setValue('Add Dependent');
        $$('dep-firstName').clear();
        $$('dep-relationshipType').setValue('');
        $$('dep-middleName').clear();
        $$('dep-relationship').clear().disable();
        $$('dep-lastName').setValue(personName.split(',')[0]);
        $$('dep-ssn').clear();
        $$('dep-sex').setValue('M');
        $$('dep-dob').clear();
        $$('dep-student').setValue(false);
        $$('dep-handicap').setValue(false);
        $$('dep-accalendar').setValue('NA');
        $$('dep-inactiveDate').clear();

        $$('dep-firstName').enable();
        $$('dep-middleName').enable();
        $$('dep-lastName').enable();
        $$('dep-ssn').enable();
        $$('dep-sex').enable();
        $$('dep-dob').enable();

        $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
        $$('dep-load_person').show();
        $$('dep-employeeStatus-label').hide();
        $$('dep-employeeStatus').hide();
        $$('dep-employeeStatus').clear();

        let employeeId = '';

        const searchPerson = () => {
            let formSearchGrid1;
            Utils.popup_open('dep-search');
                
            const reset = () => {
                $$('esp-first-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-first-search').clear();
    
                $$('esp-second-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('esp-second-search').clear();

                $$('esp-third-search').clear();
    
                $$('esp-reset1').enable();
                $$('esp-search1').enable();
    
                $$('esp-ok1').disable();
    
                formSearchGrid1.clear();
                $$('esp-count1').setValue(`Displaying 0 item`);
            };
    
            const ok = () => {    
                const row = formSearchGrid1.getSelectedRow();
                if (row) {
                    $$('dep-firstName').setValue(row.firstName);
                    $$('dep-middleName').setValue(row.middleName);
                    $$('dep-lastName').setValue(row.lastName);
                    $$('dep-ssn').setValue(row.ssn);
                    $$('dep-sex').setValue(row.sex);
                    $$('dep-dob').setValue(row.dob);

                    if (row.isEmployee === "Yes") {
                        $$('dep-firstName').disable();
                        $$('dep-middleName').disable();
                        $$('dep-lastName').disable();
                        $$('dep-ssn').disable();
                        $$('dep-sex').disable();
                        $$('dep-dob').disable();

                        $$('dep-isEmpl').setValue('The Dependent has an Employee record.');
                        $$('dep-load_person').hide();
                        $$('dep-employeeStatus-label').show();
                        $$('dep-employeeStatus').show();
                        $$('dep-employeeStatus').setValue(row.employeeStatus);

                        employeeId = row.id;

                    } else {
                        $$('dep-firstName').enable();
                        $$('dep-middleName').enable();
                        $$('dep-lastName').enable();
                        $$('dep-ssn').enable();
                        $$('dep-sex').enable();
                        $$('dep-dob').enable();
                        employeeId = '';
                        $$('dep-isEmpl').setValue('If this Dependent already exists in the system (same SSN), you can load that person.');
                        $$('dep-load_person').show();
                        $$('dep-employeeStatus-label').hide();
                        $$('dep-employeeStatus').hide();
                        $$('dep-employeeStatus').clear();
                    }
                }
                reset();
                Utils.popup_close();
            };
    
            const cancel = () => {
                reset();
                Utils.popup_close();
            };
    
            bindToEnum('esp-first-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('esp-second-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    
            const initDataGrid = () => {
                let columnDefs = [
                    {headerName: 'Last Name', field: 'lastName', width: 80},
                    {headerName: 'First Name', field: 'firstName', width: 80},
                    {headerName: 'Middle Name', field: 'middleName', width: 80},
                    {headerName: 'SSN', field: 'ssn', type: "numericColumn", width: 80},
                    {headerName: 'Employee', field: 'isEmployee', width: 80}
                ];
    
                formSearchGrid1 = new AGGrid('esp-grid1', columnDefs);
                formSearchGrid1.show();
            };
    
            if (!formSearchGrid1)
                initDataGrid();
    
            const search = () => {
                const inParams = {
                    employeeId: personId,
                    firstName: $$('esp-second-search').getValue(),
                    firstNameSearchType: $$('esp-second-criteria').getValue(),
                    lastName: $$('esp-first-search').getValue(),
                    lastNameSearchType: $$('esp-first-criteria').getValue(),
                    ssn: $$('esp-third-search').getValue()
                };

                
                AWS.callSoap(WS, 'searchPersons', inParams).then(data => {
                    if (data.wsStatus === '0') {
                        formSearchGrid1.clear();
                        if (data.item) {
                            const records = Utils.assureArray(data.item);
                            formSearchGrid1.addRecords(records);
                            $$('esp-count1').setValue(`Displaying ${records.length} item`);
                        } else {
                            $$('esp-count1').setValue(`Displaying 0 item`);
                        }
    
                        formSearchGrid1.setOnSelectionChanged($$('esp-ok1').enable);
                
                        formSearchGrid1.setOnRowDoubleClicked(ok);
                    }
                });        
            };
    
            $$('esp-reset1').onclick(reset);
            $$('esp-search1').onclick(search);
            $$('esp-ok1').onclick(ok);
            $$('esp-cancel1').onclick(cancel);
    
            search();
        };

        $$('dep-load_person').onclick(searchPerson);

        $$('dep-relationshipType').onChange(() => {
            if ($$('dep-relationshipType').getValue() === "O") {
                $$('dep-relationship').enable();
            } else {
                $$('dep-relationship').disable();
            }
        });

        $$('dep-student').onChange(() => {
            if ($$('dep-student').getValue()) {
                $$('dep-accalendar').enable();
                $$('dep-accalendar').setValue('S');
            } else {
                $$('dep-accalendar').disable();
                $$('dep-accalendar').setValue('NA');
            }
        });

        Utils.popup_open('dep-popup');

        $$('dep-ok').onclick(() => {

            const params = {
                dob: $$('dep-dob').getIntValue(),
                employeeId: personId,
                firstName: $$('dep-firstName').getValue(),
                handicap: $$('dep-handicap').getValue(),
                inactiveDate: $$('dep-inactiveDate').getIntValue(),
                lastName: $$('dep-lastName').getValue(),
                middleName: $$('dep-middleName').getValue(),
                relationship: $$('dep-relationship').getValue(),
                relationshipType: $$('dep-relationshipType').getValue(),
                sex: $$('dep-sex').getValue(),
                ssn: $$('dep-ssn').getValue(),
                student: $$('dep-student').getValue(),
                studentTermType: $$('dep-accalendar').getValue() !== "NA" ? $$('dep-accalendar').getValue() : ''
            }

            if (employeeId !== '') {
                params.personId = employeeId;
            }

            AWS.callSoap(WS, 'newDependent', params).then(data => {
                if (data.wsStatus === '0') {
                    getListDependents();
                    Utils.popup_close();
                }
            });      
        });

        $$('dep-cancel').onclick(() => {
            Utils.popup_close();
        });
    });
})();
