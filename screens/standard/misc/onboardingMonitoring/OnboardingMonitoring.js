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
    const WS = 'StandardMiscOnboardingMonitoring';

    // Employee grid
    let employeesGrid;
 
    const employeesColumnDefs = [
        {headerName: "Name", field: "lastOnline", width: 100},
        {headerName: "Last Online", field: "lastOnline", width: 100}
    ];
    employeesGrid = new AGGrid('employeesGrid', employeesColumnDefs);
    employeesGrid.show();  
    function getListOnboardingEmployees() {
        AWS.callSoap(WS, 'listOnboardingEmployees').then(data => {
            if (data.wsStatus === '0') {     
                employeesGrid.clear();
                data.item = Utils.assureArray(data.item);
                employeesGrid.addRecords(data.item);
                employeesGrid.setOnSelectionChanged(row => {
                    getListOnboardingTasks(row[0].personId);
                    $$('employeeView').enable();                    
                    $$('employeeMessage').enable();                    
                });
            }
        });   
    }
    
    getListOnboardingEmployees(); 

    // End employee grid

    // Tasks grid 
    let tasksGrid;
 
    const tasksColumnDefs = [
        {headerName: "Name", field: "taskName", width: 200},
        {headerName: "Status", field: "status", width: 500},
        {headerName: "Date", field: "statusDate", width: 200},
    ];
    tasksGrid = new AGGrid('tasksGrid', tasksColumnDefs);
    tasksGrid.show();  
    function getListOnboardingTasks(person = '') {
        const params = {
            personId: person,
            showInProgress: $$('om-showInProgress').getValue(),
            showCompleted: $$('om-showCompleted').getValue()
        }
        AWS.callSoap(WS, 'listOnboardingTasks', params).then(data => {
            if (data.wsStatus === '0') {
                tasksGrid.clear();
                data.item = Utils.assureArray(data.item);
                tasksGrid.addRecords(data.item);
                tasksGrid.setOnSelectionChanged(() => {
                    $$('taskView').enable();                    
                    $$('taskEdit').enable();                    
                    $$('taskDelete').enable();                    
                });
            }
        });   
    }

    $$('om-showInProgress').onChange(() => {
        getListOnboardingTasks();
    });
    $$('om-showCompleted').onChange(() => {
        getListOnboardingTasks();
    });
    getListOnboardingTasks(); 
    // End task grid

    // Messages grid
    const personId = Framework.userInfo.personId;
    const personName = Framework.userInfo.personLName + ', ' + Framework.userInfo.personFName + ' ()';

    const container = new TabContainer('om-tab-container');

    let messagesReceivedGrid;
    let messagesSentGrid;

    const receivedColumnDefs = [
        {headerName: "Date/Time", field: "messageDateTime", type: 'numericColumn', width: 100},
        {headerName: "Sender", field: "fromDisplayName", width: 100},
        {headerName: "Subject", field: "subject", width: 100}
    ];
    const sentColumnDefs = [
        {headerName: "Date/Time", field: "messageDateTime", type: 'numericColumn', width: 100},
        {headerName: "Receiver", field: "toDisplayName", width: 100},
        {headerName: "Subject", field: "subject", width: 100}
    ];
    messagesReceivedGrid = new AGGrid('messagesReceivedGrid', receivedColumnDefs);
    messagesSentGrid = new AGGrid('messagesSentGrid', sentColumnDefs);

    messagesReceivedGrid.show();
    messagesSentGrid.show();

    function searchReceivedMessages() {
        const params = {
            fromDate: 0,
            fromDateIndicator: 0,
            senderId: '',
            subject: '',
            subjectSearchType: 0,
            toDate: 0,
            toDateIndicator: 0,
            receiverId: personId
        };

        AWS.callSoap(WS, 'searchMessages', params).then(data => {
            messagesReceivedGrid.clear();
            if (data.wsStatus === "0") {
                data.messages = Utils.assureArray(data.messages);
                messagesReceivedGrid.addRecords(data.messages);     
                messagesReceivedGrid.setOnSelectionChanged(() => {
                    $$('messageReceivedView').enable();
                    $$('messageReceivedReply').enable();
                    $$('messageReceivedDelete').enable();
                });
                messagesReceivedGrid.setOnRowDoubleClicked(viewReceivedMessage);
            }     
        });
    }

    function searchSentMessages() {
        const params = {
            fromDate: 0,
            fromDateIndicator: 0,
            senderId: personId,
            subject: '',
            subjectSearchType: 0,
            toDate: 0,
            toDateIndicator: 0,
            receiverId: ''
        };

        AWS.callSoap(WS, 'searchMessages', params).then(data => {
            messagesSentGrid.clear();
            if (data.wsStatus === "0") {
                data.messages = Utils.assureArray(data.messages);
                messagesSentGrid.addRecords(data.messages);     
                messagesSentGrid.setOnSelectionChanged(() => {
                    $$('messageSentView').enable();
                    $$('messageSentDelete').enable();
                });
                messagesSentGrid.setOnRowDoubleClicked(viewSentMessage);
            }     
        });
    }

    function viewReceivedMessage() {
        $$('message-label').setValue('View');
        const row = messagesReceivedGrid.getSelectedRow();

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
        const row = messagesSentGrid.getSelectedRow();

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

    $$('messageReceivedNew').onclick(()=> {
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

    $$('messageReceivedView').onclick(viewReceivedMessage);
    $$('messageSentView').onclick(viewSentMessage);

    $$('messageReceivedReply').onclick(() => {
        const row = messagesReceivedGrid.getSelectedRow();
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

    $$('messageReceivedDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Received Message?', () => {
            const row = messagesReceivedGrid.getSelectedRow();
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

    $$('messageSentDelete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Sent Message?', () => {
            const row = messagesSentGrid.getSelectedRow();
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
    searchReceivedMessages();
    searchSentMessages();
    // Messages grid end

    function refresh() {
        getListOnboardingEmployees();
        getListOnboardingTasks();
    }
    $$('om-refreshRate').setValue(60000);
    let refreshInterval = setInterval(() => {
        refresh();
    }, Number($$('om-refreshRate').getValue()));

    $$('om-refreshRate').onChange(() => {
        clearInterval(refreshInterval);
        refreshInterval = setInterval(() => {
            refresh();
        }, Number($$('om-refreshRate').getValue()));
    })
    $$('refresh').onclick(refresh);
})();
