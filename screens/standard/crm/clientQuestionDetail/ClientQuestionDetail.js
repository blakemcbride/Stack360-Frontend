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
    const WS = 'StandardCrmClientQuestionDetail';

    const clientId = Utils.getData("CURRENT_CLIENT_ID");
    const clientName = Utils.getData("CURRENT_CLIENT_NAME");
    let canChange = true;

    $$('client-name').setValue(clientName).setColor('black');

    function EnteredField() {}

    EnteredField.prototype.init = function(params) {
        const e = document.createElement('div');
        e.innerText = params.data.whenAddedFormatted;
        this.eGui = e;
    };

    EnteredField.prototype.getGui = function() {
        return this.eGui;
    };

    const columnDefs = [
        { headerName: 'Question', field: 'question', width: 175 },
        { headerName: 'Response', field: 'response' },
        { headerName: 'Entered', field: 'whenAddedFormatted', width: 85 }
    ];
    const questionGrid = new AGGrid('question-grid', columnDefs, 'questionId');
    questionGrid.addComponent('enteredField', EnteredField);
    questionGrid.show();
    questionGrid.setOnSelectionChanged((rows) => {
        $$('question-edit').enable(rows);
    });
    questionGrid.setOnRowDoubleClicked(editQuestion);

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
            canChange = res.accessLevel === '2';
        }
    });

    const data = {
        id: clientId
    };

    AWS.callSoap(WS, 'listQuestionDetails', data).then(res => {
        let records = Utils.assureArray(res.item);
        questionGrid.addRecords(records);
        $$('question-grid-status').setValue(`Displaying ${records.length} Client Question Details`);
    });

    questionGrid.setOnSelectionChanged((rows) => {
        $$('question-edit').enable(rows);
    });

    async function editQuestion() {
        let row = questionGrid.getSelectedRow();

        if (!row) {
            return;
        }

        let data = await questionPopup(row);

        if (row.response) {
            if (data.response) {
                const request = {
                    id: clientId,
                    detailId: row.detailId,
                    response: data.response
                };
                await AWS.callSoap(WS, 'saveQuestionDetail', request).then(res => {
                    if (res.wsStatus === '0') {
                        questionGrid.clear();
                        const listRequest = {
                            id: clientId
                        };
                        AWS.callSoap(WS, 'listQuestionDetails', listRequest).then(res => {
                            let records = Utils.assureArray(res.item);
                            questionGrid.addRecords(records);
                            $$('question-grid-status').setValue(`Displaying ${records.length} Client Question Details`);
                            $$('question-edit').disable();
                        });
                    }
                });
            } else {
                const request = {
                    ids: row.detailId,
                };
                await AWS.callSoap(WS, 'deleteQuestionDetails', request).then(res => {
                    if (res.wsStatus === '0') {
                        questionGrid.clear();
                        const listRequest = {
                            id: clientId
                        };
                        AWS.callSoap(WS, 'listQuestionDetails', listRequest).then(res => {
                            let records = Utils.assureArray(res.item);
                            questionGrid.addRecords(records);
                            $$('question-grid-status').setValue(`Displaying ${records.length} Client Question Details`);
                            $$('question-edit').disable();
                        });
                    }
                });
            }
        } else {
            if (data.response) {
                await AWS.callSoap(WS, 'newQuestionDetail', data).then(res => {
                    if (res.wsStatus === '0') {
                        questionGrid.clear();
                        const request = {
                            id: clientId
                        };
                        AWS.callSoap(WS, 'listQuestionDetails', request).then(res => {
                            let records = Utils.assureArray(res.item);
                            questionGrid.addRecords(records);
                            $$('question-grid-status').setValue(`Displaying ${records.length} Client Question Details`);
                            $$('question-edit').disable();
                        });
                    }
                });
            } else {
                questionGrid.clear();
                const request = {
                    id: clientId
                };
                AWS.callSoap(WS, 'listQuestionDetails', request).then(res => {
                    let records = Utils.assureArray(res.item);
                    questionGrid.addRecords(records);
                    $$('question-grid-status').setValue(`Displaying ${records.length} Client Question Details`);
                    $$('question-edit').disable();
                });
            }
        }        
    }

    $$('question-edit').onclick(editQuestion);

    const questionPopup = (row) => {

        let resetDialog = () => {

            $$('qp-question').setValue('');
            $$('qp-response').setValue('');
            $$('qp-entered').setValue('(generated on save)');
            
        };

        let initDialog = async () => {            
            resetDialog();

            $$('qp-question').setValue(row.question);
            $$('qp-response').setValue(row.response);

            if (row.whenAddedFormatted) {
                $$('qp-entered').setValue(row.whenAddedFormatted);
            }
            
        };

        initDialog();
        
        Utils.popup_open('question-edit-popup');
    
        return new Promise(async function (resolve, reject) {
            
            let ok = async () => {
                
                const data = {
                    id: clientId,
                    questionId: row.questionId,
                    response: $$('qp-response').getValue(),
                };
                
                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('qp-ok').onclick(ok);
            $$('qp-cancel').onclick(cancel);
        });
    
    };

    $$('question-report').onclick(() => {
        const data = {
            id: clientId
        };

        AWS.callSoap(WS, 'getReport', data).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    })

})();

