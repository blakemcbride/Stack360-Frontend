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

    const WS = 'StandardCrmProspectQuestionDetail';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    let prospectId = Utils.getData(CURRENT_PROSPECT_ID);
    let prospectName = Utils.getData(CURRENT_PROSPECT_NAME);

    $$('prospect-name').setValue(prospectName);

    const columnDefs = [
        {headerName: 'Question', field: 'question', width: 100 },
        {headerName: 'Response', field: 'response', width: 200 },
        {headerName: 'Entered', field: 'whenAddedFormatted', width: 60 }
    ];

    const grid = new AGGrid('grid', columnDefs, 'questionId');

    grid.show();
    grid.setOnSelectionChanged($$('edit').enable);

    function updateGrid() {
        grid.clear();

        AWS.callSoap(WS, 'listQuestionDetails', {id: prospectId}).then(ret => {
            if (ret.wsStatus === '0') {
                ret.item = Utils.assureArray(ret.item);
                grid.addRecords(Utils.assureArray(ret.item));
                $$('status').setValue(`Displaying ${ret.item.length} Prospect Question Details`);
            }
        });
    }

    updateGrid();

    const editQuestionPopup = (row) => {

        Utils.popup_open('question-edit');

        return new Promise(function (resolve, reject) {

            if (row && row.whenAddedFormatted) {
                $$('qep-entered').setValue(row.whenAddedFormatted);
            } else {
                $$('qep-entered').setValue('(generated on save)');
            }
            $$('qep-question').setValue(row.question);
            $$('qep-response').setValue(row.response);
            
            const ok = () => {
                resolve({ ...row, 
                    question: $$('qep-question').getValue(), 
                    response: $$('qep-response').getValue(),
                    formatResponse:  $$('qep-response').getValue().substr(0, 200)
                });
                Utils.popup_close();
            };
            
            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('qep-ok').onclick(ok);
            $$('qep-cancel').onclick(cancel);

        });

    };

    async function edit() {
        let row = grid.getSelectedRow();
        let item = await editQuestionPopup(row);
        if (item) {
            let operation = '';
            let data = {};
            if (!item.detailId) {
                operation = 'newQuestionDetail';
                data.id = prospectId;
                data.questionId = item.questionId;
                data.response = item.response;
            } else if (item.response.length) {
                operation = 'saveQuestionDetail';
                data.detailId = item.detailId;
                data.response = item.response;
            } else {
                operation = 'deleteQuestionDetails';
                data.ids = [item.detailId];
            }

            AWS.callSoap(WS, operation, data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }

    grid.setOnRowDoubleClicked(edit);
    $$('edit').onclick(edit);

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getReport', {id: prospectId}).then(ret => {
            if (ret.wsStatus === '0') {
                Utils.showReport(ret.reportUrl);
            }
        });
    });
    
})();