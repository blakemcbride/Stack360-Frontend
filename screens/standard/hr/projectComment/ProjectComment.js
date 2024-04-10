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
    const WS = 'StandardHrProjectComment';
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    const personId = Utils.getData(Framework.userInfo.personId);
    const personName = Framework.userInfo.personLName + ', ' + Framework.userInfo.personFName;

    $$('pc-project').setValue(projectName + " - " + projectSummary);

    let commentsGrid;
 
    const commentsColumnDefs = [
        {headerName: "Date/Time Entered", field: "dateTimeEnteredFormatted", type: "numericColumn", width: 120},
        {headerName: "Last Name", field: "lastName", width: 120},
        {headerName: "First Name", field: "firstName", width: 120},
        {headerName: "Comment Preview", field: "commentPreview", width: 840}
    ];
    commentsGrid = new AGGrid('commentsGrid', commentsColumnDefs);
    commentsGrid.show();

    function loadCommentSummary() {
        commentsGrid.clear();

        const params = {
            projectId: projectId
        };
        AWS.callSoap(WS, 'loadCommentSummary', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);                
                commentsGrid.addRecords(data.item);

                $$('pc-eplName').setValue(data.personLastName + ', ' + data.personFirstName);
                $$('pc-ssn').setValue(data.employeeSSN);
                $$('pc-summary').setValue(data.summary);
                $$('pc-detail').setValue(data.detail);

                $$('pc-status').setValue('Displaying ' + data.item.length + ' Project Comments');


                commentsGrid.setOnSelectionChanged((rows) => {
                    $$('pc-edit').enable(rows);
                    $$('pc-delete').enable(rows);
                });

                commentsGrid.setOnRowDoubleClicked(edit);


            }
        });   
    }

    loadCommentSummary();

    $$('pc-view').onclick(() => {
        
    });
    
    $$('pc-add').onclick(() => {
        $$('pc-dateTimeEntered').setValue('(generated on save)');
        $$('pc-enteredBy').setValue(personName);
        $$('pc-action').setValue('Add');

        Utils.popup_open('pc-popup');

        $$('pc-save').onclick(() => {
            if ($$('pc-comment').isError('Comment'))
                return;

            const params = {
                projectId: projectId,
                comment: $$('pc-comment').getValue()
            };
            AWS.callSoap(WS, 'newComment', params).then(data => {
                if (data.wsStatus === '0') {     
                    loadCommentSummary();
                    Utils.popup_close();
                }
            });   
        });

        $$('pc-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = commentsGrid.getSelectedRow();

        $$('pc-dateTimeEntered').setValue(row.dateTimeEnteredFormatted);
        $$('pc-enteredBy').setValue(row.lastName + ', ' + row.firstName);
        $$('pc-comment').setValue(row.commentPreview);
        $$('pc-action').setValue('Edit');

        Utils.popup_open('pc-popup');

        $$('pc-save').onclick(() => {
            if ($$('pc-comment').isError('Comment'))
                return;

            const params = {
                commentId: row.commentId,
                projectId: projectId,
                comment: $$('pc-comment').getValue()
            };
            AWS.callSoap(WS, 'saveComment', params).then(data => {
                if (data.wsStatus === '0') {     
                    loadCommentSummary();
                    Utils.popup_close();
                }
            });   
        });

        $$('pc-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('pc-edit').onclick(edit);


    $$('pc-delete').onclick(function () {
        Utils.yesNo('Delete Comment', 'Are you sure you would like to delete this comment?', function () {
            let data = {
                ids: grid.getSelectedRow().id
            };

            AWS.callSoap(WS, 'deleteComment', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateCommentList();
                }
            });

        });
    });
})();
