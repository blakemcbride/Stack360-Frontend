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

    const SWS = 'StandardAtMessage';
    const RWS = "com.arahant.services.standard.at.message";

    const sendFilterParms = {
        personType: 'receiver',
        senderId: null,
        receiverId: null,
        fromDate: 0,
        fromDateIndicator: 0,
        toDate: 0,
        toDateIndicator: 0,
        subject: '',
        subjectSearchType: 0
    };

    /*
    tinymce.init({
        selector: '#messageText'
    });
*/

    let receivedFilter = null;
    let sentGrid;
    let sentFilter = null;
    let messageTextCtl;


    function initScreen() {
        //==================================================================================================================
        // Main event handlers start.
        //==================================================================================================================

        $$('openSentFilter').onclick(async () => {
            filterPopup(sendFilterParms);
        });

        //==================================================================================================================
        // Main event handlers end.
        //==================================================================================================================
    }

    async function updateSentGrid() {

        let inParams = {
            ...sendFilterParms,
            includeHandled: $$('show-handled').getValue(),
            sortType: $$('sort-type').getValue()
        };

        Utils.waitMessage("Retrieving messages; Please wait.");
        let data = await Server.call(RWS, 'SearchMessages', inParams);
        Utils.waitMessageEnd();
        if (!data._Success)
            return;

        const rowData = [];
        let msgCount = 0;

        // If message object is not null, push the row into the collection.
        if (data.messages != null) {
            data.messages = Utils.assureArray(data.messages);
            msgCount = data.messages.length;

            let prevMessageId = null;
            for (let msg of data.messages) {
                if (msg !== null) {
                    prevMessageId = msg.messageId;
                    msg.toPersons = Utils.assureArray(msg.toPersons);
                    let toPersons = "";
                    for (let i = 0; i < msg.toPersons.length; i++) {
                        if (toPersons)
                            toPersons += "; ";
                        toPersons += msg.toPersons[i].displayName;
                    }
                    rowData.push({
                        'date': msg.messageDateTime,
                        'sender': msg.fromPerson.displayName,
                        'receiver': toPersons,
                        'subject': msg.subject,
                        'mode': (msg.sendEmail ? 'E' : '') + (msg.sendText ? 'T' : '') + (msg.sendInternal ? 'I' : ''),
                        'handled': msg.handled  ? 'Yes' : '',
                        'personId': msg.toPersonId,
                        'messageId': msg.messageId
                    });
                }
            }
        }

        sentGrid.clear();
        sentGrid.addRecords(rowData);

        // Change sent count.
        $$('sentCount').setValue(`Displaying ${msgCount} Sent Messages.`);

        sentGrid.setOnSelectionChanged((rows) => {
            const nr = rows.length;
            if (nr > 1) {
                $$('viewSent').disable();
                $$('replySent').disabled();
                $$('deleteSent').enable();
                $$('handledSent').enable();
            } else if (nr === 1) {
                $$('viewSent').enable();
                $$('replySent').enable();
                $$('deleteSent').enable();
                $$('handledSent').enable();
            } else {
                $$('viewSent').disable();
                $$('replySent').disabled();
                $$('deleteSent').disable();
                $$('handledSent').disable();
            }
        });

        sentGrid.setOnRowDoubleClicked(viewMessage);

        $$('viewSent').onclick(viewMessage);

        $$('replySent').onclick(async () => {
            const inData = {
                messageId: sentGrid.getSelectedRow().messageId
            };

            let data = await AWS.callSoap(SWS, 'loadMessage', inData);
            if (data.wsStatus !== "0")
                return;
            $$('messageReceiver').setValue(data.fromDisplayName);
            $$('messageSubject').setValue(`RE: ${data.subject}`);
            const recipients = [{
                personId: data.fromPersonId,
                personName: data.fromDisplayName,
                mobilePhone: data.mobilePhone,
                emailAddress: data.emailAddress
            }]
            sentNewMessage(recipients);
        });

        $$('deleteSent').onclick(deleteMessage);

        // Disable the buttons.
        $$('viewSent').disable();
        $$('replySent').disable();
        $$('deleteSent').disable();
        $$('handledSent').disable();
    }

    function updateGrid() {
        updateSentGrid();
    }

    $$('show-handled').onChange(updateGrid);
    $$('sort-type').onChange(updateGrid);

    function clearMessage() {
        $$('messageSender').clear();
        $$('messageReceiver').clear();
        $$('messageCC').clear();
        $$('messageBCC').clear();

        $$('messageSubject').clear();
        messageTextCtl.clear();
    }

    function sentNewMessage(recipients) {
        newMessage(true, recipients);
    }

    $$('newSent').onclick(() => {
        sentNewMessage([]);
    });

    /**
     * Returns a promise that resolves with the updated recipients list.
     *
     * @param {Array} recipients - the list of recipients
     * @param {string} type - the type of recipient "", "CC", or "Bcc"
     * @param {boolean} limitToOne - limit the number of possible selections to one
     * @return {Promise} a promise that resolves with the updated recipients list or null
     */
    function searchReceiver(recipients, type, limitToOne) {
        const previousRecipients = Array.from(recipients);
        return new Promise(function (resolve, reject) {
            $$('rs-title').setValue('Send To ' + type);

            Utils.popup_open('receiverSelection');

            let searchReceiverGrid = null;

            // Setup drop downs.
            bindToEnum('receiverLastNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
            bindToEnum('receiverFirstNameCriteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const srInitDataGrid = () => {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Person ID', field: 'personID', hide: true},
                    {headerName: 'Last Name', field: 'lastName'},
                    {headerName: 'First Name', field: 'firstName'},
                    {headerName: 'Email', field: 'emailAddress'},
                    {headerName: 'Phone', field: 'mobilePhone'}
                ];

                searchReceiverGrid = new AGGrid('searchReceiverResultsGrid', columnDefs);
                searchReceiverGrid.show();
            };

            srInitDataGrid();

            function srChangeCount(count) {
                $$('receiverCount').setValue(`Displaying ${count} Workers.`);
            }

            const srOk = () => {
                Utils.popup_close();
                recipients.length = 0;
                for (let i=0 ; i < previousRecipients.length; i++)
                    recipients.push(previousRecipients[i]);
                resolve(recipients);
            };

            const srCancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            searchReceiverGrid.setOnSelectionChanged((rows) => {
                $$('receiverOK').enable(recipients);
                $$('receiverAdd').enable(rows && rows.length && (!limitToOne || !recipients.length));
            });

            function updateRecipientList() {
                $$('rs-delete-recipient').disable();
                $$('receiverAdd').disable();
                const lst = $$('rs-recipient-list');
                lst.clear();
                for (let i = 0; i < recipients.length; i++)
                    lst.add(i, recipients[i].personName, recipients[i].personId);
            }

            updateRecipientList();

            $$('rs-recipient-list').onClick(() => {
                $$('rs-delete-recipient').enable();
            });

            function deleteRecipient() {
                const lst = $$('rs-recipient-list');
                recipients.splice(lst.getValue(), 1);
                updateRecipientList();
                receiverSearch();
            }

            $$('rs-delete-recipient').onclick(deleteRecipient);
            $$('rs-recipient-list').onDblClick(deleteRecipient);

            function addRecipient() {
                if (limitToOne && recipients.length > 0)
                    return;
                const nodes = searchReceiverGrid.getSelectedRows();
                for (let i = 0; i < nodes.length; i++) {
                    const selectedNode = nodes[i];
                    const obj = {
                        personId: selectedNode.personID,
                        personName: selectedNode.lastName + ', ' + selectedNode.firstName,
                        emailAddress: selectedNode.emailAddress,
                        mobilePhone: selectedNode.mobilePhone
                    }
                    recipients.push(obj);
                    updateRecipientList();
                }
                searchReceiverGrid.deleteSelectedRows();
            }

            function srReset() {
                $$('receiverFirstNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('receiverFirstNameSearch').clear();
                $$('receiverLastNameCriteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('receiverLastNameSearch').clear();
                searchReceiverGrid.clear();
                $$('receiverAdd').disable();
                $$('receiverOK').disable();
                srChangeCount(0);
            }

            searchReceiverGrid.setOnRowDoubleClicked(addRecipient);
            $$('receiverAdd').onclick(addRecipient);

            $$('receiverReset').onclick(srReset);

            async function receiverSearch() {
                const inParams = {
                    firstName: $$('receiverFirstNameSearch').getValue(),
                    firstNameSearchType: $$('receiverFirstNameCriteria').getValue(),
                    lastName: $$('receiverLastNameSearch').getValue(),
                    lastNameSearchType: $$('receiverLastNameCriteria').getValue()
                };

                const data = await AWS.callSoap(SWS, 'searchPeople', inParams);
                if (data.wsStatus !== "0")
                    return;

                // Clear the grid.
                searchReceiverGrid.clear();

                data.people = Utils.assureArray(data.people);
                let people = data.people;
                for (let key of Object.keys(people)) {
                    const person = people[key];
                    if (!recipients.find(x => x.personId === person.personId))
                        searchReceiverGrid.addRecord({
                            'personID': person.personId,
                            'lastName': person.lname,
                            'firstName': person.fname,
                            'emailAddress': person.emailAddress,
                            'mobilePhone': person.mobilePhone
                        });
                }
                srChangeCount(data.people.length);
            }

            $$('receiverSearch').onclick(receiverSearch);

            $$('receiverOK').onclick(srOk);
            $$('receiverCancel').onclick(srCancel);
            $$('receiverLastNameSearch').focus();
        });
    }

    /**
     * The reason this function needs its arguments is that it is used for two purposes:
     * 1. creating a new message
     * 2. replying to a prior message
     *
     * @param updateGridFlg if true, update the sent grid when a message is sent
     * @param recipients
     * @returns {Promise<void>}
     */
    async function newMessage(updateGridFlg, recipients) {
        const recipientsCC = [];
        const recipientsBCC = [];
        let attachments = [];
        $$('messageModalTitle').setValue('New Message');
        $$('messageSubject').clear().enable();

        $$('messageEmailCB').clear().enable().onChange((val) => {
            if (!Framework.userInfo.canSendEmail) {
                Utils.showMessage('Error', 'You are not configured to send email messages.');
                $$('messageEmailCB').clear();
            } else {
                if (val)
                    $$('messageNoBodyCB').enable();
                else
                    $$('messageNoBodyCB').clear().disable();
            }
        });
        $$('messageTextCB').clear().enable();

        $$('messageHasAttachments').hide();

        $$('chooseReceiver').setValue("Choose").show();
        $$('chooseCC').setValue("Choose").show();
        $$('chooseBCC').setValue("Choose").show();
        $$('messageOK').show();
        $$('messageCancel').setValue('Cancel');

        $$('messageSubject').readWrite();
        $$('attachments').enable();
        $$('picture-upload').clear();
        $$('messageNoBodyCB').clear().disable();

        $$('messageSender').setValue(Framework.userInfo.personFName + ' ' + Framework.userInfo.personLName);

        async function validate() {
            if (!$$('messageEmailCB').getValue() && !$$('messageTextCB').getValue()) {
                let res = await Utils.yesNo('Query', 'You have not selected Email or Text so this is an Internal message only.  Do you wish to continue?');
                if (!res)
                    return false;
            }

            if ($$('messageEmailCB').getValue()) {
                for (let i=0; i < recipients.length; i++)
                    if (!recipients[i].emailAddress) {
                        Utils.showMessage('Error', 'Some recipients do not have an email address.');
                        return false;
                    }

                for (let i=0; i < recipientsCC.length; i++)
                    if (!recipientsCC[i].emailAddress) {
                        Utils.showMessage('Error', 'Some CC recipients do not have an email address.');
                        return false;
                    }

                for (let i=0; i < recipientsBCC.length; i++)
                    if (!recipientsBCC[i].emailAddress) {
                        Utils.showMessage('Error', 'Some BCC recipients do not have an email address.');
                        return false;
                    }
            }

            if ($$('messageTextCB').getValue()) {
                for (let i=0; i < recipients.length; i++)
                    if (!recipients[i].mobilePhone) {
                        Utils.showMessage('Error', 'Some recipients do not have a mobile phone number.');
                        return false;
                    }

                for (let i=0; i < recipientsCC.length; i++)
                    if (!recipientsCC[i].mobilePhone) {
                        Utils.showMessage('Error', 'Some CC recipients do not have a mobile phone number.');
                        return false;
                    }

                for (let i=0; i < recipientsBCC.length; i++)
                    if (!recipientsBCC[i].mobilePhone) {
                        Utils.showMessage('Error', 'Some BCC recipients do not have a mobile phone number.');
                        return false;
                    }
            }

            if (!recipients.length && !recipientsCC.length && !recipientsBCC.length) {
                Utils.showMessage('Error', 'Please select a receiver.');
                return false;
            }

            if ($$('messageSubject').isError('Subject'))
                return false;

            const messageText = messageTextCtl.getHtml();
            if (!messageText) {
                Utils.showMessage('Error', 'Please enter a message.');
                return false;
            }

            return true;
        }

        function updateMessageReceiver(ctlName, recipients) {
            let s = '';
            for (let i = 0; i < recipients.length; i++) {
                let r = recipients[i];
                if (s)
                    s += '; ' + r.personName;
                else
                    s = r.personName;
            }
            $$(ctlName).setValue(s);
        }

        $$('chooseReceiver').onclick(async () => {
            await searchReceiver(recipients, '', false);
            updateMessageReceiver('messageReceiver', recipients);
        });

        $$('chooseCC').onclick(async () => {
            await searchReceiver(recipientsCC, '(Cc)', false);
            updateMessageReceiver('messageCC', recipientsCC);
        });

        $$('chooseBCC').onclick(async () => {
            await searchReceiver(recipientsBCC, '(Bcc)', false);
            updateMessageReceiver('messageBCC', recipientsBCC);
        });

        $$('messageOK').onclick(async () => {
            if (!await validate())
                return;

            Utils.waitMessage("Sending message.");

            let subject = $$('messageSubject').getValue();
            let message = messageTextCtl.getHtml();

            const personIds = [];
            recipients.forEach(function (r) {
                personIds.push(r.personId);
            });

            const CcIds = [];
            recipientsCC.forEach(function (r) {
                CcIds.push(r.personId);
            });

            const BccIds = [];
            recipientsBCC.forEach(function (r) {
                BccIds.push(r.personId);
            });

            let inData = {
                fromPersonId: AWS.personId,
                sendInternal: $$('messageInternalCB').getValue(),
                sendEmail: $$('messageEmailCB').getValue(),
                sendText: $$('messageTextCB').getValue(),
                dontSendBody: $$('messageNoBodyCB').getValue(),
                toPersonId: personIds,
                ccPersonIds: CcIds,
                bccPersonIds: BccIds,
                subject: subject,
                message: message,
                backEndUrl: AWS.url
            };

            let res = await AWS.fileUpload(attachments, 'createMessage', inData);
            Utils.waitMessageEnd();
            if (res.wsStatus === "0")
                Utils.showMessage('Status', 'Message Sent');
            else
                Utils.showMessage('Error', 'Message Not Sent');

            //await AWS.callSoap(WS, 'createMessage', inData);

            clearMessage();
            Utils.popup_close();
            if (updateGridFlg)
                updateSentGrid();
        });

        $$('messageCancel').onclick(() => {
            clearMessage();
            Utils.popup_close();
        });

        $$('attachments').onclick(async function () {
            attachments = await addAttachmentModal(attachments);
            if (attachments.length)
                $$('messageHasAttachments').show();
            else
                $$('messageHasAttachments').hide();
        });

        Utils.popup_open('messageModal');

        //  The following line MUST be called AFTER Utils.popup_open()
        messageTextCtl = await Editor.create('messageText');
        messageTextCtl.readWrite();
    }

    function viewAttachmentModal(attachments) {
        Utils.popup_open('viewAttachmentModal');
        const lst = $$('attachment-list');
        lst.clear();
        attachments.forEach(function (att) {
            lst.add(att.id, att.name);
        });
        const view = async function () {
            if (lst.isError('Attachment'))
                return;
            const data = {
                attachmentId: lst.getValue()
            }
            const ret = await AWS.callSoap(SWS, 'getAttachment', data);
            if (ret.wsStatus === "0")
                Utils.showReport(ret.fileName);
        }
        $$('attachmentView').onclick(view);
        lst.onDblClick(view);
        $$('attachmentCancel').onclick(function () {
            Utils.popup_close();
        });
    }

    function addAttachmentModal(attachments) {

        const dlt = $$('delete-attachment');
        const lst = $$('add-attachment-list');

        const fillList = function () {
            dlt.disable();
            lst.clear();
            for (let i = 0; i < attachments.length; i++)
                lst.add(i, attachments[i].name);
        }

        $$('add-attachment').onclick(function () {
            $$('picture-upload').click();
        });

        $$('picture-upload').onChange(function () {
            const ctl = $$('picture-upload');
            const n = ctl.numberOfUploadFiles();
            for (let i = 0; i < n; i++) {
                console.log("Adding an attachment");
                attachments.push(ctl.uploadFile(i));
            }
            fillList();
        });

        lst.onClick(function () {
            dlt.enable();
        });

        dlt.onclick(function () {
            attachments.splice(lst.getValue(), 1);
            fillList();
        });

        return new Promise(function (resolve, reject) {
            Utils.popup_open('addAttachmentModal');
            fillList();
            $$('done-attachment').onclick(function () {
                Utils.popup_close();
                resolve(attachments);
            });
        });
    }

    async function viewMessage() {
        $$('messageModalTitle').setValue('View Message');

        // Change buttons to fit the view modal.
        $$('chooseReceiver').setValue("Show").hide();
        $$('chooseCC').setValue("Show").hide();
        $$('chooseBCC').setValue("Show").hide();
        $$('messageOK').hide();
        $$('messageCancel').setValue('Close');
        $$('messageSubject').disable();

        // Change inputs to read only.
        $$('messageEmailCB').disable();
        $$('messageTextCB').disable();
        $$('messageNoBodyCB').disable();
        $$('messageSubject').readOnly();

        $$('messageCancel').onclick(() => {
            clearMessage();
            Utils.popup_close();
        });

        let messageId = sentGrid.getSelectedRow().messageId;

        let inData = {
            messageId: messageId
        };

        let data = await AWS.callSoap(SWS, 'loadMessage', inData);
        if (data.wsStatus !== "0")
            return;
        data.toPersons = Utils.assureArray(data.toPersons);
        data.ccPersons = Utils.assureArray(data.ccPersons);
        data.bccPersons = Utils.assureArray(data.bccPersons);
        data.attachments = Utils.assureArray(data.attachments);

        $$('messageEmailCB').setValue(data.sendEmail);
        $$('messageTextCB').setValue(data.sendText);
        $$('messageNoBodyCB').setValue(data.noBody);

        let names = "";
        for (let i = 0; i < data.toPersons.length; i++) {
            if (names)
                names += "; ";
            names += data.toPersons[i].displayName;
        }
        $$('messageReceiver').setValue(names);


        names = "";
        for (let i = 0; i < data.ccPersons.length; i++) {
            if (names)
                names += "; ";
            names += data.ccPersons[i].displayName;
        }
        $$('messageCC').setValue(names);

        names = "";
        for (let i = 0; i < data.bccPersons.length; i++) {
            if (names)
                names += "; ";
            names += data.bccPersons[i].displayName;
        }
        $$('messageBCC').setValue(names);

        let recipients = Utils.assureArray(data.recipients);
        if (recipients.length > 1)
            $$('chooseReceiver').show();
        else
            $$('chooseReceiver').hide();
        if (data.attachments.length) {
            $$('attachments').enable();
            $$('messageHasAttachments').show();
        } else {
            $$('attachments').disable();
            $$('messageHasAttachments').hide();
        }

        $$('messageSender').setValue(data.fromDisplayName);

        $$('messageSubject').setValue(data.subject);

        $$('attachments').onclick(function () {
            viewAttachmentModal(data.attachments);
        });

        $$('chooseReceiver').onclick(function () {
            Utils.popup_open('addRecipientModal');
            const recp = $$('add-recipient-list');

            function updateList() {
                recp.clear();
                for (let i = 0; i < recipients.length; i++)
                    recp.add(i, recipients[i].name, recipients[i].id);
            }

            updateList();

            $$('done-recipient').onclick(function () {
                Utils.popup_close();
            });
        });

        Utils.popup_open('messageModal');
        messageTextCtl = await Editor.create('messageText');
        messageTextCtl.readOnly();
        messageTextCtl.setHtml(data.message);
    }

    function deleteMessage() {
        let grid = sentGrid;

        let msgTxt = 'message';
        if (grid.numberOfSelectedRows() > 1)
            msgTxt += 's';

        Utils.yesNo('Confirmation', `Are you sure you want to delete the selected Received\n ${msgTxt}?`, async () => {
            let messageIds = [];
            grid.getSelectedRows().forEach(row => {
                messageIds.push(row.messageId);
            });

            let inData = {
                messageIds: messageIds
            };

            await AWS.callSoap(SWS, 'deleteMessage', inData);
            updateSentGrid();
        });
    }

    function filterToString(filter) {
        if (!filter || (!filter.personName && !filter.fromDate && !filter.toDate && !filter.subject))
            return '(not filtered)';
        let filterText = '';
        if (filter.personName)
            filterText += '<b>Person: </b>(' + filter.personName + ')';
        if (filter.fromDate)
            filterText += '<b>From date: </b>('
                + $$('fromDropDown').getLabel() + ': '
                + DateTimeUtils.formatDateTime(filter.fromDate, 0) + ')';
        if (filter.toDate)
            filterText += '<b>To date: </b>('
                + $$('toDropDown').getLabel() + ': '
                + DateTimeUtils.formatDateTime(filter.toDate, 0) + ')';
        if (filter.subject)
            filterText += '<b>Subject: </b>('
                + $$('subjectDropDown').getLabel() + ': '
                + filter.subject + ')';
        return filterText;
    }

    function filterPopup(params) {
        Utils.popup_open('filterModal');

        let person = null;
        let personType = params.personType;
        let filter;
        if (personType === 'sender') {
            filter = sentFilter;
        } else {
            filter = receivedFilter;
        }
        const ANY_PERSON = '(any ' + personType + ')';

        Utils.setText('personLabel', `${personType.charAt(0).toUpperCase() + personType.slice(1)}:`);

        if ($$('personTextInput').getValue() === '')
            $$('personTextInput').setValue(ANY_PERSON);

        // Setup drop-downs.
        if ($$('fromDropDown').size() === 0)
            bindToEnum('fromDropDown', DateCriteriaMatcher, DateCriteriaMatcher.AFTER);
        if ($$('toDropDown').size() === 0)
            bindToEnum('toDropDown', DateCriteriaMatcher, DateCriteriaMatcher.BEFORE);
        if ($$('subjectDropDown').size() === 0)
            bindToEnum('subjectDropDown', StringCriteriaMatcher);

        if (filter !== null && filter.person !== null) {
            person = filter.person;

            if (filter.personText === '')
                $$('personTextInput').setValue(ANY_PERSON);
            else
                $$('personTextInput').setValue(filter.personText);

            $$('fromDropDown').setValue(filter.fromDateCriteria);
            $$('fromDateInput').setValue(filter.fromDate);
            $$('toDropDown').setValue(filter.toDateCriteria);
            $$('toDateInput').setValue(filter.toDate);
            $$('subjectDropDown').setValue(filter.subjectCriteria);
            $$('subjectInput').setValue(filter.subject);
        }

        function reset() {
            person = null;

            $$('personTextInput').setValue(ANY_PERSON);

            $$('fromDropDown').setValue(DateCriteriaMatcher.AFTER.value);
            $$('toDropDown').setValue(DateCriteriaMatcher.BEFORE.value);
            $$('subjectDropDown').setValue(StringCriteriaMatcher.STARTS_WITH.value);

            $$('fromDateInput').clear();
            $$('toDateInput').clear();
            $$('subjectInput').clear();
        }

        //==================================================================================================================
        // Filter event handlers start.
        //==================================================================================================================

        $$('anyBtn').onclick(() => {
            person = null;
            $$('personTextInput').setValue(ANY_PERSON);
        });

        $$('chooseBtn').onclick(async () => {
            let result = await searchReceiver([], '', true);

            if (result && result.length > 0) {
                person = result[0];
                $$('personTextInput').setValue(person.personName);
            }
        });

        $$('filterReset').onclick(reset);

        $$('filterOK').onclick(() => {
            sendFilterParms.fromDate = $$('fromDateInput').getIntValue();
            sendFilterParms.toDate = $$('toDateInput').getIntValue();
            sendFilterParms.fromDateIndicator = $$('fromDropDown').getValue();
            sendFilterParms.toDateIndicator = $$('toDropDown').getValue();
            sendFilterParms.subject = $$('subjectInput').getValue();
            sendFilterParms.subjectSearchType = $$('subjectDropDown').getValue();
            sendFilterParms.receiverId = person !== null ? person.personId : '';
            sendFilterParms.personName = person !== null ? person.personName : '';

            Utils.setHTML('sentFilterStatus', filterToString(sendFilterParms));
            updateGrid();
            Utils.popup_close();
        });

        $$('filterCancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('handledSent').onclick(() => {
        const rows = sentGrid.getSelectedRows();
        const messageIds = [];
        for (let i = 0; i < rows.length; i++)
            messageIds.push(rows[i].messageId);
        if (messageIds.length) {
            const data = {
                messageIds: messageIds
            };
            Server.call(RWS, "HandleSent", data).then(function (res) {
                if (res._Success)
                    updateSentGrid();
            });
        }
    });

    let columnDefs = [
        {headerName: "Date/Time", field: "date", width: 190},
        {headerName: "Sender", field: "sender", width: 200},
        {headerName: "Receiver", field: "receiver", width: 200},
        {headerName: "Mode", field: "mode", width: 70},
        {headerName: "Handled", field: "handled", width: 90},
        {headerName: "Subject", field: "subject", width: 600}
    ];
    sentGrid = new AGGrid('sentGrid', columnDefs);
    sentGrid.multiSelect();
    sentGrid.show();

    initScreen();
    updateSentGrid();
})();
