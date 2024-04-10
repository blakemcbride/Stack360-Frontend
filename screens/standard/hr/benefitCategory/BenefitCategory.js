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

    const WS = 'StandardHrBenefitCategory';
    
    let res = await AWS.callSoap(WS, "checkRight");
    if (res.wsStatus !== '0')
        return;

    const columnDefs = [
        {headerName: 'Benefit Category', field: 'description', width: '25'},
        {headerName: 'Type', field: 'typeDescription', width: '15'},
        {headerName: 'Allow Multiple Benefits', field: 'allowsMultipleBenefitsFormatted', width: '15'},
        {headerName: 'Avatar', field: 'hasAvatar', width: '15'},
        {headerName: 'In Open Enrollment', field: 'includeInOpenEnrollment', width: '13'},
        {headerName: 'In Onboarding', field: 'includeOnboarding', width: '13'}
    ];
    const grid = new AGGrid('grid', columnDefs, 'categoryId');
    grid.show();

    function updateGrid() {
        grid.clear();

        $$('edit').disable();
        $$('delete').disable();
        
        AWS.callSoap(WS, "listCategories").then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                grid.addRecords(res.item);

                $$('status').setValue('Displaying ' + res.item.length + ' Benefit Categories');
            }
        });
    }

    updateGrid();

    function reset() {
        $$('dp-category').clear();
        $$('dp-type').clear();
        $$('dp-allowsMultipleBenefits').clear();
        $$('dp-requiresDecline').clear();
        $$('dp-includeInOpenEnrollment').clear();
        $$('dp-includeInOnboarding').clear();
        $$('dp-avatar').clear();
        $$('dp-avatar-location').clear();
        $$('screen-enrollment').clear();
        $$('screen-onboarding').clear();
        $$('dp-instructions').clear();
    }

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
        $$('comparison').enable(rows);
        $$('moveup').enable(rows);
        $$('movedown').enable(rows);
    });

    /////////////////////////////////////////////////////////////////////////////////
    // screen search popup
    /////////////////////////////////////////////////////////////////////////////////
    const screenSelection = async () => {

        Utils.popup_open('screen-selection');

        return new Promise(function (resolve, reject) {

            let screenSearchGrid = null;

            let changeCount = count => {
                Utils.setText('scrCount', `Displaying ${count} Screens`);
            };

            let reset = () => {
                $$('psp-id').clear();
                $$('psp-name').clear();
                $$('psp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);

                screenSearchGrid.clear();
                changeCount(0);
            };

            let ok = () => {
                let screen = screenSearchGrid.getSelectedRow();

                if (!screen)
                    screen = null;

                Utils.popup_close();
                resolve(screen);
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };            

            // Setup drop downs.
            bindToEnum('psp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Parent Screen', field: 'name', width: 30},
                    {headerName: 'Name', field: 'fileName', width: 55},
                    {headerName: 'ID', field: 'extId', width: 15},
                ];

                screenSearchGrid = new AGGrid('screenGrid', columnDefs, 'id');
                screenSearchGrid.show();
            };

            if (!screenSearchGrid)
                initDataGrid();

            reset();

            // Fit the columns to the grid.
            screenSearchGrid.sizeColumnsToFit();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            screenSearchGrid.setOnSelectionChanged($$('screen-ok').enable);

            screenSearchGrid.setOnRowDoubleClicked(ok);

            $$('screenReset').onclick(() => {
                $$('psp-id').clear();
                $$('psp-name').clear();
                $$('psp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            });

            $$('screenSearch').onclick(async () => {
                let inParams = {
                    screenOrGroupId: $$('psp-id').getValue(),
                    name: $$('psp-name').getValue(),
                    nameSearchType: $$('psp-name-type').getValue()
                };

                let data = await AWS.callSoap(WS, 'searchScreens', inParams);

                // Clear the grid.
                screenSearchGrid.clear();

                if (data.item) {
                    let records = Utils.assureArray(data.item);
                    screenSearchGrid.addRecords(records);

                    let count = Utils.assureArray(data.item).length;
                    changeCount(count);

                    $$('screen-ok').enable();
                } else {
                    changeCount(0);
                    $$('screen-ok').disable();
                }
            });

            $$('screen-ok').onclick(ok);

            $$('screen-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // question popup
    /////////////////////////////////////////////////////////////////////////////////
    const questionPopup = async (row, categoryId) => {

        Utils.popup_open('question-popup');

        return new Promise(function (resolve, reject) {

            if (row === null) {
                $$('qp-title').setValue("Add Question");
            } else {
                $$('qp-title').setValue("Edit Question");
            }

            let reset = () => {
                $$('qp-question').clear();
            };

            let ok = () => {                
                if ($$('qp-question').isError('Question'))
                    return;
                let data = {
                    question: $$('qp-question').getValue()
                };
                let op = '';

                if (row === null) {
                    data.categoryId = categoryId;
                    op = 'newQuestion';
                } else {
                    data.questionId = row.questionId;
                    op = 'saveQuestion';
                }

                AWS.callSoap(WS, op, data).then(function (res) {
                    if (res.wsStatus === '0') {
                        Utils.popup_close();
                        resolve(null);
                    }
                });
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            reset();
            if (row)
                $$('qp-question').setValue(row.question);

            $$('qp-ok').onclick(ok);
            $$('qp-cancel').onclick(cancel);

        });
    };

    /////////////////////////////////////////////////////////////////////////////////
    // answer popup
    /////////////////////////////////////////////////////////////////////////////////
    const answerPopup = async (row, questionId) => {

        Utils.popup_open('answer-popup');

        return new Promise(function (resolve, reject) {

            if (row === null) {
                $$('ap-title').setValue("Add Answer");
            } else {
                $$('ap-title').setValue("Edit Answer");
            }

            let reset = () => {
                $$('ap-benefit').clear();
                $$('ap-answer').clear();
            };

            AWS.callSoap(WS, "listBenefitsForQuestion", {questionId: questionId}).then(function (res) {
                if (res.wsStatus === '0') {
                    $$('ap-benefit').clear().addItems(res.item, 'benefitId', 'benefitName');
                    if (row)
                        $$('ap-benefit').setValue(row.benefitId);
                }
            });

            let ok = () => {                
                if ($$('ap-benefit').isError('Benefit'))
                    return;
                if ($$('ap-answer').isError('Answer'))
                    return;
                let data = {
                    benefitId: $$('ap-benefit').getValue(),
                    answer: $$('ap-answer').getValue()
                };
                let op = '';
                
                if (row.answerId === "") {
                    data.questionId = questionId;
                    op = 'newAnswer';
                } else {
                    data.answerId = row.answerId;
                    op = 'saveAnswer';
                }

                AWS.callSoap(WS, op, data).then(function (res) {
                    if (res.wsStatus === '0') {
                        Utils.popup_close();
                        resolve(null);
                    }
                });
            };

            let cancel = () => {
                Utils.popup_close();
                resolve(null);
            };

            reset();
            if (row) {
                $$('ap-answer').setValue(row.answer);
                $$('ap-benefit').setValue(row.benefitId);
            }

            $$('ap-ok').onclick(ok);
            $$('ap-cancel').onclick(cancel);

        });
    };

    $$('add').onclick(() => {
        let screen_enrollment = null, screen_onboarding = null;
        $$('dp-title').setValue('Add Benefit Category');
        reset();

        AWS.callSoap(WS, "listTypes").then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-type').clear().addItems(res.item, 'id', 'description');
            }
        });

        Utils.popup_open('detail-popup', 'dp-category');

        $$('choose-enrollment').onclick(async () => {
            let selectedNode = await screenSelection();
            
            if (selectedNode && selectedNode.data) {
                $$('screen-enrollment').setValue(selectedNode.data.name);
                screen_enrollment = selectedNode.data.screenId;
            }
        });

        $$('clear-enrollment').onclick(() => {
            screen_enrollment = null;
            $$('screen-enrollment').clear();
        });

        $$('choose-onboarding').onclick(async () => {
            let selectedNode = await screenSelection();
            
            if (selectedNode && selectedNode.data) {
                $$('screen-onboarding').setValue(selectedNode.data.name);
                screen_onboarding = selectedNode.data.screenId;
            }
        });

        $$('clear-onboarding').onclick(() => {
            screen_onboarding = null;
            $$('screen-onboarding').clear();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            if ($$('dp-type').isError('Type'))
                return;

            const data = {
                description: $$('dp-category').getValue(),
                typeId: $$('dp-type').getValue(),
                includeOnboarding: $$('dp-includeInOnboarding').getValue(),
                includeInOpenEnrollment: $$('dp-includeInOpenEnrollment').getValue(),
                allowsMultipleBenefits: $$('dp-allowsMultipleBenefits').getValue(),
                requiresDecline: $$('dp-requiresDecline').getValue(),
                avatarPath: $$('dp-avatar').getValue(),
                avatarLocation: $$('dp-avatar-location').getValue(),
                instructions: $$('dp-instructions').getValue(),
                screenId: screen_enrollment,
                onboardingScreenId: screen_onboarding,
            };
            AWS.callSoap(WS, "newCategory", data).then(function (res) {
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
        let screen_enrollment = row.screenId, screen_onboarding = row.onboardingScreenId;

        $$('dp-title').setValue('Edit Benefit Category');
        reset();

        AWS.callSoap(WS, "listTypes").then(function (res) {
            if (res.wsStatus === '0') {
                $$('dp-type').clear().addItems(res.item, 'id', 'description').setValue(row.typeId);
            }
        });

        $$('dp-category').setValue(row.description);
        $$('dp-allowsMultipleBenefits').setValue(row.allowsMultipleBenefits);
        $$('dp-requiresDecline').setValue(row.requiresDecline);
        $$('dp-includeInOpenEnrollment').setValue(row.includeInOpenEnrollment === 'Yes');
        $$('dp-includeInOnboarding').setValue(row.includeOnboarding === 'Yes');
        $$('dp-avatar').setValue(row.avatarPath);
        $$('dp-avatar-location').setValue(row.avatarLocation);
        $$('screen-enrollment').setValue(row.screenName);
        $$('screen-onboarding').setValue(row.onboardingScreenName);
        $$('dp-instructions').setValue(row.instructions);

        Utils.popup_open('detail-popup', 'dp-category');

        $$('choose-enrollment').onclick(async () => {
            let selectedNode = await screenSelection();
            
            if (selectedNode && selectedNode.data) {
                $$('screen-enrollment').setValue(selectedNode.data.name);
                screen_enrollment = selectedNode.data.screenId;
            }
        });

        $$('clear-enrollment').onclick(() => {
            screen_enrollment = null;
            $$('screen-enrollment').clear();
        });

        $$('choose-onboarding').onclick(async () => {
            let selectedNode = await screenSelection();
            
            if (selectedNode && selectedNode.data) {
                $$('screen-onboarding').setValue(selectedNode.data.name);
                screen_onboarding = selectedNode.data.screenId;
            }
        });

        $$('clear-onboarding').onclick(() => {
            screen_onboarding = null;
            $$('screen-onboarding').clear();
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-category').isError('Category'))
                return;
            if ($$('dp-type').isError('Type'))
                return;

            const data = {
                description: $$('dp-category').getValue(),
                typeId: $$('dp-type').getValue(),
                includeOnboarding: $$('dp-includeInOnboarding').getValue(),
                includeInOpenEnrollment: $$('dp-includeInOpenEnrollment').getValue(),
                allowsMultipleBenefits: $$('dp-allowsMultipleBenefits').getValue(),
                requiresDecline: $$('dp-requiresDecline').getValue(),
                avatarPath: $$('dp-avatar').getValue(),
                avatarLocation: $$('dp-avatar-location').getValue(),
                instructions: $$('dp-instructions').getValue(),
                screenId: screen_enrollment,
                onboardingScreenId: screen_onboarding,
                categoryId: row.categoryId
            };
            AWS.callSoap(WS, "saveCategory", data).then(function (res) {
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
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Benefit Category?', () => {
            const data = {
                ids: [grid.getSelectedRow().categoryId]
            };
            
            AWS.callSoap(WS, "deleteCategories", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('moveup').onclick(() => {
        let categoryId = grid.getSelectedRow().categoryId;
        AWS.callSoap(WS, "moveCategory", { id: grid.getSelectedRow().categoryId, moveUp: true}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(categoryId), 100);
            }
        });
    });

    $$('movedown').onclick(() => {
        let categoryId = grid.getSelectedRow().categoryId;
        AWS.callSoap(WS, "moveCategory", { id: grid.getSelectedRow().categoryId, moveUp: false}).then(function (res) {
            if (res.wsStatus === '0') {
                updateGrid();
                setTimeout(() => grid.selectId(categoryId), 100);
            }
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, "getCategoryReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    let questionGrid = null;
    let answerGrid = null;

    questionGrid = new AGGrid('questionGrid', [
        {headerName: 'Question', field: 'question'},
    ], 'questionId');
    questionGrid.show();

    answerGrid = new AGGrid('answerGrid', [
        {headerName: 'Benefit', field: 'benefitName', width: 40},
        {headerName: 'Answer', field: 'answer', width: 60},
    ], 'answerId');
    answerGrid.show();

    $$('comparison').onclick(async () => {
        let row = grid.getSelectedRow();

        questionGrid.clear();
        answerGrid.clear();

        async function updateQusGrid() {
            $$('question-edit').disable();
            $$('question-delete').disable();

            let res = await AWS.callSoap(WS, "listQuestions", { categoryId: row.categoryId });
            res.item = Utils.assureArray(res.item);
            questionGrid.clear().addRecords(res.item);
        }

        async function updateAnswerGrid(questionId) {
            $$('answer-edit').disable();

            let res = await AWS.callSoap(WS, "listAnswersForQuestion", { questionId: questionId });
            res.item = Utils.assureArray(res.item);
            answerGrid.clear().addRecords(res.item);
        }

        updateQusGrid();

        questionGrid.setOnSelectionChanged((rows) => {
            $$('question-edit').enable(rows);
            $$('question-delete').enable(rows);
            if (rows.length)
                updateAnswerGrid(questionGrid.getSelectedRow().questionId);
        });

        answerGrid.setOnSelectionChanged($$('answer-edit').enable);

        $$('question-edit').disable();
        $$('question-delete').disable();
        $$('answer-edit').disable();

        Utils.popup_open('category-comparison');

        $$('answer-edit').onclick(async () => {
            await answerPopup(answerGrid.getSelectedRow(), questionGrid.getSelectedRow().questionId);
            updateAnswerGrid(questionGrid.getSelectedRow().questionId);  
        })

        $$('question-add').onclick(async () => {
            await questionPopup(null, row.categoryId);
            updateQusGrid();
        });

        $$('question-edit').onclick(async () => {
            let question = questionGrid.getSelectedRow();
            await questionPopup(question, null);
            updateQusGrid();
        });

        $$('question-delete').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Question and associated Answers?', () => {
                const data = {
                    ids: [questionGrid.getSelectedRow().questionId]
                };
                
                AWS.callSoap(WS, "deleteQuestions", data).then(function (res) {
                    if (res.wsStatus === '0') {
                        updateQusGrid();
                        answerGrid.clear();
                    }
                });
            });
        });

        $$('comparison-close').onclick(() => {
            Utils.popup_close();            
        })
    });

})();
