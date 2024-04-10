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

    const WS = 'StandardAtApplicantQuestion';
    let allRows;

    const columnDefs = [
        {headerName: 'Question', field: 'question', width: 110 },
        {headerName: 'Answer Type', field: 'answerType2', width: 20 },
        {headerName: 'Internal Use', field: 'internalUse2', width: 15 },
        {headerName: 'Inactive', field: 'inactiveDate2', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    let data = {
        id: null,
        name: null,
        nameSearchType: 0
    };
    res = await AWS.callSoap(WS, "searchPositions", data);
    if (res.wsStatus === '0') {
        $$('position').clear().add('', '(common)').addItems(res.item, 'positionId', 'positionName');
    } else
        return;

    function updateDisplay() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        $$('move-up').disable();
        $$('move-down').disable();
        const type = $$('show').getValue();
        const today = DateUtils.today();
        const rows = [];
        for (let i=0 ; i < allRows.length ; i++) {
            let inactiveDate = Number(allRows[i].inactiveDate);
            if (type === '1') {
                if (!inactiveDate || inactiveDate > today)
                    rows.push(allRows[i]);
            } else if (type === '2') {
                if (inactiveDate && inactiveDate < today)
                    rows.push(allRows[i]);
            } else
                rows.push(allRows[i]);
        }
        grid.addRecords(rows);
        $$('status').setValue('Displaying ' + rows.length + ' Applicant Questions');
    }

    function updateGrid() {
        return new Promise((resolve, reject) => {
            const data = {
                activeType: Number($$('show').getValue()),
                positionId: $$('position').getValue()
            };
            AWS.callSoap(WS, "listQuestionsForPosition", data).then(function (res) {
                if (res.wsStatus === '0') {
                    res.item = Utils.assureArray(res.item);
                    for (let i = 0; i < res.item.length; i++) {
                        res.item[i].inactiveDate2 = DateUtils.intToStr4(Number(res.item[i].inactiveDate));
                        res.item[i].internalUse2 = res.item[i].internalUse === 'false' ? 'No' : 'Yes';
                        switch (res.item[i].answerType) {
                            case 'S':
                                res.item[i].answerType2 = 'Text';
                                break;
                            case 'N':
                                res.item[i].answerType2 = 'Numeric';
                                break;
                            case 'D':
                                res.item[i].answerType2 = 'Date';
                                break;
                            case 'Y':
                                res.item[i].answerType2 = 'Yes/No/Unknown';
                                break;
                            case 'L':
                                res.item[i].answerType2 = 'List';
                                break;
                        }
                    }
                    allRows = res.item;
                    updateDisplay();
                    resolve();
                }
            });
        });
    }

    updateGrid();

    $$('position').onChange(updateGrid);

    $$('show').onChange(updateDisplay);

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        $$('move-up').enable(rows);
        $$('move-down').enable(rows);
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Applicant Question');
        $$('dp-question').clear();
        $$('dp-inactive-date').clear();
        $$('dp-internal-use').clear();
        $$('dp-list-answers').clear();
        $$('dp-edit').disable();
        $$('dp-delete').disable();

        Utils.popup_open('detail-popup', 'dp-name');

        const data = {
            id: null,
            name: null,
            nameSearchType: 0
        };
        AWS.callSoap(WS, "searchPositions", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-position').clear().add('', '(common)').addItems(res.item, 'positionId', 'positionName');
            }
        });

        $$('dp-answer-type').onChange(() => {
           const val = $$('dp-answer-type').getValue();
           if (val === 'L') {
               Utils.popup_set_height('detail-popup', '400px');
               $$('dp-edit').disable();
               $$('dp-delete').disable();
               $('#dp-list-fields').show();
           } else{
               $('#dp-list-fields').hide();
               Utils.popup_set_height('detail-popup', '220px');
           }
        });

        $$('dp-list-answers').onClick(() => {
            $$('dp-edit').enable();
            $$('dp-delete').enable();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-question').isError('Question'))
                return;
            if ($$('dp-answer-type').isError('Answer Type'))
                return;

            let listAnswers;
            if ($$('dp-answer-type').getValue() === 'L') {
                listAnswers = $$('dp-list-answers').getAllLabels();
                if (!listAnswers || !listAnswers.length) {
                    Utils.showMessage('Error', 'List type must have some choices.');
                    return;
                }
            } else
                listAnswers = [];
            const data = {
                addAfterId: null,
                answerType: $$('dp-answer-type').getValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                internalUse: $$('dp-internal-use').getValue(),
                positionId: $$('dp-position').getValue(),
                question: $$('dp-question').getValue(),
                listAnswer: listAnswers
            };
            AWS.callSoap(WS, "newQuestion", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();
        $$('dp-title').setValue('Edit Applicant Question');
        $$('dp-question').setValue(row.question);
        $$('dp-inactive-date').setValue(Number(row.inactiveDate));
        $$('dp-internal-use').setValue(row.internalUse === "true");
        $$('dp-list-answers').clear();
        $$('dp-answer-type').setValue(row.answerType);

        $$('dp-edit').disable();
        $$('dp-delete').disable();

        Utils.popup_open('detail-popup', 'dp-name');

        if (row.answerType === 'L') {
            Utils.popup_set_height('detail-popup', '400px');
            $$('dp-edit').disable();
            $$('dp-delete').disable();
            $('#dp-list-fields').show();
        } else{
            $('#dp-list-fields').hide();
            Utils.popup_set_height('detail-popup', '220px');
        }

        let data = {
            id: null,
            name: null,
            nameSearchType: 0
        };
        AWS.callSoap(WS, "searchPositions", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-position').clear().add('', '(common)').addItems(res.item, 'positionId', 'positionName').setValue($$('position').getValue());
            }
        });

        data = {
            id: row.id
        };
        AWS.callSoap(WS, "loadQuestion", data).then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-list-answers').clear().addItems(res.item, 'id', 'name');
            }
        });

        $$('dp-answer-type').onChange(() => {
            const val = $$('dp-answer-type').getValue();
            if (val === 'L') {
                Utils.popup_set_height('detail-popup', '400px');
                $$('dp-edit').disable();
                $$('dp-delete').disable();
                $('#dp-list-fields').show();
            } else{
                $('#dp-list-fields').hide();
                Utils.popup_set_height('detail-popup', '220px');
            }
        });

        $$('dp-list-answers').onClick(() => {
            $$('dp-edit').enable();
            $$('dp-delete').enable();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-question').isError('Question'))
                return;
            if ($$('dp-answer-type').isError('Answer Type'))
                return;
            let listAnswers = [];
            if ($$('dp-answer-type').getValue() === 'L') {
                const ctl = $$('dp-list-answers');
                const sz = ctl.size();
                if (!sz) {
                    Utils.showMessage('Error', 'List type must have some choices.');
                    return;
                }
                for (let i=0 ; i < sz ; i++) {
                    let obj = {
                        id: ctl.getValue(i),
                        name: ctl.getLabel(i)
                    }
                    listAnswers.push(obj);
                }
            }
            const data = {
                id: row.id,
                addAfterId: null,
                answerType: $$('dp-answer-type').getValue(),
                inactiveDate: $$('dp-inactive-date').getIntValue(),
                internalUse: $$('dp-internal-use').getValue(),
                positionId: $$('dp-position').getValue(),
                question: $$('dp-question').getValue(),
                listAnswer: listAnswers
            };
            AWS.callSoap(WS, "saveQuestion", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                    Utils.popup_close();
                }
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Applicant Question?', () => {
            const data = {
                ids: grid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteQuestions", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            jobTypeId: $$('position').getValue()
        }
        AWS.callSoap(WS, "getReport", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('move-up').onclick(() => {
        const row = grid.getSelectedRow();
        const data = {
            id: row.id,  // applicant_question.applicant_question_id
            moveUp: true
        };
        AWS.callSoap(WS, "moveQuestion", data).then(async function (res) {
            if (res.wsStatus === '0') {
                await updateGrid();
                grid.selectId(row.id);
            }
        });
    });

    $$('move-down').onclick(() => {
        const row = grid.getSelectedRow();
        const data = {
            id: row.id,    // applicant_question.applicant_question_id
            moveUp: false
        };
        AWS.callSoap(WS, "moveQuestion", data).then(async function (res) {
            if (res.wsStatus === '0') {
                await updateGrid();
                grid.selectId(row.id);
            }
        });
    });

    $$('dp-add').onclick(() => {
        $$('lap-title').setValue('Add List Answer');
        $$('lap-answer').clear();
        Utils.popup_open('list-answer-popup', 'lap-answer');

        $$('lap-ok').onclick(() => {
            if ($$('lap-answer').isError('Answer'))
                return;
            $$('dp-list-answers').add(null, $$('lap-answer').getValue());
            Utils.popup_close();
        });

        $$('lap-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function editQuestionList() {
        $$('lap-title').setValue('Edit List Answer');
        $$('lap-answer').setValue($$('dp-list-answers').getLabel());
        Utils.popup_open('list-answer-popup', 'lap-answer');

        $$('lap-ok').onclick(() => {
            if ($$('lap-answer').isError('Answer'))
                return;
            $$('dp-list-answers').setLabel($$('lap-answer').getValue());
            Utils.popup_close();
        });

        $$('lap-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('dp-edit').onclick(editQuestionList);
    $$('dp-list-answers').onDblClick(editQuestionList);

    $$('dp-delete').onclick(() => {
        const ctl = $$('dp-list-answers');
        const i = ctl.selectedIndex();
        ctl.removeByIndex(i);
    });


})();
