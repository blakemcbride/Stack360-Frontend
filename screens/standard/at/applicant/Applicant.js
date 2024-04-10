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
    const SWS = 'StandardAtApplicant';
    const RWS = "com.arahant.services.standard.at.applicant";
    const FilterSave = "ApplicantFilterSave";
    let filters = {}, filterQAGrid = null, filterTabContainer = null;
    let grid = null;
    let page = 1;  // desired page number
    let questions;
    let canDelete = 0;

    Utils.waitMessage("Retrieving data; Please wait.");

    Server.call(RWS, 'GetPositions').then(res => {
        if (res._Success) {
            const olpCtl = $$('olp-position');
            const qapCtl = $$('qap-position');
            olpCtl.clear().add('', '(choose)').addItems(res.positions, "position_id", "position_name");
            qapCtl.clear().addItems(res.positions, "position_id", "position_name");
            if (res.defaultPosition.position_id) {
                olpCtl.setValue(res.defaultPosition.position_id);
                qapCtl.setValue(res.defaultPosition.position_id);
            }
            Server.call(RWS, 'LoadQuestions', { positionId: res.defaultPosition.position_id }).then(res => {
                if (res._Success) {
                    $$('qap-question').addItems(questions=res.questions, "applicant_question_id", "question");
                }
            });
        }
    });

    async function executeSelectFunc(element, fn, id, name) {
        const selectedNode = await fn();
        if (selectedNode) {
            $$(element).setValue(selectedNode[id], selectedNode[name]);
        }
    }

    /////////////////////////////////////////////////////////////////////////////////
    // position search popup
    /////////////////////////////////////////////////////////////////////////////////
    async function positionSelection() {

        Utils.popup_open('position-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            function changeCount(count) {
                Utils.setText('psp-count', `Displaying ${count} Position`);
            }

            async function reset() {
                await listSmartChooser([
                    {tag: 'psp-sm-organizational-group', url: 'searchOrgGroups', ID: 'id', label: 'name'}
                ]);

                $$('psp-position-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('psp-position').clear();
                $$('psp-sm-job-type').clear();
                $$('psp-sm-organizational-group').clear();
                $$('psp-chk-new').setValue(true);
                $$('psp-chk-accepting').setValue(true);
                $$('psp-chk-suspended').clear();
                $$('psp-chk-filled').clear();
                $$('psp-chk-cancelled').clear();

                formSearchGrid.clear();
                changeCount(0);
            }

            function ok() {
                let vendor = formSearchGrid.getSelectedRow();

                if (!vendor)
                    vendor = null;

                reset();
                resolve(vendor);
                Utils.popup_close();
            }

            function cancel() {
                reset();
                resolve(null);
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('psp-position-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid() {
                // Setup data grid.
                const columnDefs = [
                    {headerName: 'Position', field: 'position'},
                    {headerName: 'Job Type', field: 'jobTypeDescription'},
                    {headerName: 'Group', field: 'orgGroupName'},
                    {headerName: 'Status', field: 'statusType'},
                    {headerName: 'Accepting', field: 'acceptApplicationDate'},
                    {headerName: 'Starts', field: 'jobStartDate'}
                ];

                formSearchGrid = new AGGrid('psp-grid', columnDefs, 'id');
                formSearchGrid.show();
            }

            if (!formSearchGrid)
                initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('psp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('psp-reset').onclick(reset);

            async function search() {
                const inParams = {
                    position: $$('psp-position').getValue(),
                    positionSearchType: $$('psp-position-type').getValue(),
                    includeAccepting: $$('psp-chk-accepting').getValue(),
                    includeCancelled: $$('psp-chk-cancelled').getValue(),
                    includeFilled: $$('psp-chk-filled').getValue(),
                    includeNew: $$('psp-chk-new').getValue(),
                    includeSuspended: $$('psp-chk-suspended').getValue(),
                    orgGroupId: $$('psp-sm-organizational-group').getValue()
                };

                let data;// = await AWS.callSoap(SWS, 'searchPositions', inParams);

                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    const count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            }

            $$('psp-search').onclick(search);
            search();

            $$('psp-ok').onclick(ok);
            $$('psp-cancel').onclick(cancel);

            $$('psp-sm-organizational-group').setSelectFunction(() => executeSelectFunc('psp-sm-organizational-group', orgGroupSelection, 'id', 'name'));
        });
    }

    /////////////////////////////////////////////////////////////////////////////////
    // org group search popup
    /////////////////////////////////////////////////////////////////////////////////
    async function orgGroupSelection() {

        Utils.popup_open('orggroup-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            function changeCount(count) {
                Utils.setText('ogsp-count', `Displaying ${count} Organizational Group`);
            }

            function reset() {
                $$('ogsp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ogsp-name').clear();

                formSearchGrid.clear();
                changeCount(0);
            }

            function ok() {
                let item = formSearchGrid.getSelectedRow();

                if (!item)
                    item = null;

                reset();
                resolve(item);
                Utils.popup_close();
            }

            function cancel() {
                reset();
                resolve(null);
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('ogsp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid() {
                const columnDefs = [
                    {headerName: 'Organizational Group Name', field: 'name'}
                ];

                formSearchGrid = new AGGrid('ogsp-grid', columnDefs, id);
                formSearchGrid.show();
            }

            if (!formSearchGrid)
                initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('ogsp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('ogsp-reset').onclick(reset);

            async function search() {
                const inParams = {
                    name: $$('ogsp-name').getValue(),
                    nameSearchType: $$('ogsp-name-type').getValue()
                };

                const data = await AWS.callSoap(SWS, 'searchOrgGroups', inParams);

                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    const count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            }

            $$('ogsp-search').onclick(search);
            search();

            $$('ogsp-ok').onclick(ok);
            $$('ogsp-cancel').onclick(cancel);
        });
    }

    /////////////////////////////////////////////////////////////////////////////////
    // application status search popup
    /////////////////////////////////////////////////////////////////////////////////
    async function applicationStatusSelection() {

        Utils.popup_open('application-status-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            function changeCount(count) {
                Utils.setText('apsp-count', `Displaying ${count} Application Status`);
            }

            function reset() {
                $$('apsp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('apsp-name').clear();

                formSearchGrid.clear();
                changeCount(0);
            }

            function ok() {
                let item = formSearchGrid.getSelectedRow();

                if (!item)
                    item = null;

                reset();
                resolve(item);
                Utils.popup_close();
            }

            function cancel() {
                reset();
                resolve(null);
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('apsp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid() {
                const columnDefs = [
                    {headerName: 'Application Status', field: 'name'},
                    {headerName: 'Active', field: 'active1'}
                ];

                formSearchGrid = new AGGrid('apsp-grid', columnDefs, 'id');
                formSearchGrid.show();
            }

            if (!formSearchGrid)
                initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('apsp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('apsp-reset').onclick(reset);

            async function search() {
                const inParams = {
                    name: $$('apsp-name').getValue(),
                    nameSearchType: $$('apsp-name-type').getValue()
                };

                const data = await AWS.callSoap(SWS, 'searchApplicationStatuses', inParams);

                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    for (let i = 0; i < records.length; i++) {
                        let row = records[i];
                        row.active1 = row.active ? 'Yes' : 'No';
                    }
                    formSearchGrid.addRecords(records);

                    const count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            }

            $$('apsp-search').onclick(search);
            search();

            $$('apsp-ok').onclick(ok);
            $$('apsp-cancel').onclick(cancel);
        });
    }

    /////////////////////////////////////////////////////////////////////////////////
    // applicant status search popup
    /////////////////////////////////////////////////////////////////////////////////
    async function applicantStatusSelection() {

        Utils.popup_open('applicant-status-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            function changeCount(count) {
                Utils.setText('acsp-count', `Displaying ${count} Applicant Status`);
            }

            function reset() {
                $$('acsp-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('acsp-name').clear();

                formSearchGrid.clear();
                changeCount(0);
            }

            function ok() {
                let item = formSearchGrid.getSelectedRow();

                if (!item)
                    item = null;

                reset();
                resolve(item);
                Utils.popup_close();
            }

            function cancel() {
                reset();
                resolve(null);
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('acsp-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid() {
                const columnDefs = [
                    {headerName: 'Applicant Status', field: 'name'},
                    {headerName: 'Consider for Hire', field: 'considerForHire1'}
                ];

                formSearchGrid = new AGGrid('acsp-grid', columnDefs, 'id');
                formSearchGrid.show();
            }

            if (!formSearchGrid)
                initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('acsp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('acsp-reset').onclick(reset);

            async function search() {
                const inParams = {
                    name: $$('acsp-name').getValue(),
                    nameSearchType: $$('acsp-name-type').getValue()
                };

                const data = await AWS.callSoap(SWS, 'searchApplicantStatuses', inParams);

                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    for (let i = 0; i < records.length; i++) {
                        let row = records[i];
                        row.considerForHire1 = row.considerForHire ? 'Yes' : 'No';
                    }
                    formSearchGrid.addRecords(records);

                    const count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            }

            $$('acsp-search').onclick(search);
            search();

            $$('acsp-ok').onclick(ok);
            $$('acsp-cancel').onclick(cancel);
        });
    }

    /////////////////////////////////////////////////////////////////////////////////
    // applicant/application source search popup
    /////////////////////////////////////////////////////////////////////////////////
    async function sourceSelection() {

        Utils.popup_open('source-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            function changeCount(count) {
                Utils.setText('ssp-count', `Displaying ${count} Source`);
            }

            function reset() {
                $$('ssp-description-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('ssp-description').clear();

                formSearchGrid.clear();
                changeCount(0);
            }

            function ok() {
                let item = formSearchGrid.getSelectedRow();

                if (!item)
                    item = null;

                reset();
                resolve(item);
                Utils.popup_close();
            }

            function cancel() {
                reset();
                resolve(null);
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('ssp-description-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            function initDataGrid() {
                const columnDefs = [
                    {headerName: 'Source', field: 'description'}
                ];

                formSearchGrid = new AGGrid('ssp-grid', columnDefs, 'id');
                formSearchGrid.show();
            }

            initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('ssp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('ssp-reset').onclick(reset);

            async function search() {
                const inParams = {
                    description: $$('ssp-description').getValue(),
                    descriptionSearchType: $$('ssp-description-type').getValue()
                };

                const data = await AWS.callSoap(SWS, 'searchApplicantSources', inParams);

                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    const count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            }

            $$('ssp-search').onclick(search);
            search();

            $$('ssp-ok').onclick(ok);
            $$('ssp-cancel').onclick(cancel);
        });
    }

    /////////////////////////////////////////////////////////////////////////////////
    // question search popup
    /////////////////////////////////////////////////////////////////////////////////
    async function questionSelection(jobTypeId) {

        Utils.popup_open('question-selection');

        return new Promise(function (resolve, reject) {

            let formSearchGrid = null;

            const changeCount = count => {
                Utils.setText('qsp-count', `Displaying ${count} Questions`);
            };

            function reset() {
                $$('qsp-question-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
                $$('qsp-question').clear();

                formSearchGrid.clear();
                changeCount(0);
            }

            function ok() {
                let item = formSearchGrid.getSelectedRow();

                if (!item)
                    item = null;

                reset();
                resolve(item);
                Utils.popup_close();
            }

            function cancel() {
                reset();
                resolve(null);
                Utils.popup_close();
            }

            // Setup drop downs.
            bindToEnum('qsp-question-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

            const initDataGrid = () => {
                const columnDefs = [
                    {headerName: 'Question', field: 'question'}
                ];

                formSearchGrid = new AGGrid('qsp-grid', columnDefs, 'id');
                formSearchGrid.show();
            };

            if (!formSearchGrid)
                initDataGrid();

            reset();

            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================

            formSearchGrid.setOnSelectionChanged($$('qsp-ok').enable);

            formSearchGrid.setOnRowDoubleClicked(ok);

            $$('qsp-reset').onclick(reset);

            async function search() {
                const inParams = {
                    question: $$('qsp-question').getValue(),
                    questionSearchType: $$('qsp-question-type').getValue()
                };

                const data = await AWS.callSoap(SWS, 'searchQuestionsForJobType', inParams);

                formSearchGrid.clear();

                if (data.item) {
                    const records = Utils.assureArray(data.item);
                    formSearchGrid.addRecords(records);

                    const count = Utils.assureArray(data.item).length;
                    changeCount(count);
                } else {
                    changeCount(0);
                }
            }

            $$('qsp-search').onclick(search);
            search();

            $$('qsp-ok').onclick(ok);
            $$('qsp-cancel').onclick(cancel);
        });
    }

    function listSmartChooser(data) {
        return new Promise(function (resolve, reject) {
            const elements = Utils.assureArray(data);
            let n = 0;  // number processed

            elements.map(element => {
                const ctl = $$(element.tag);
                ctl.clear();

                AWS.callSoap(SWS, element.url, element.param).then(res => {
                    if (res.wsStatus === '0') {
                        n++;
                        if (!res.item) {
                            ctl.clear();
                            ctl.forceSelect();
                            if (n === elements.length)
                                resolve();
                            return;
                        }

                        if (res.item.length > res.lowCap)
                            ctl.forceSelect();

                        ctl.addItems(Utils.assureArray(res.item), element.ID, element.label);

                        if (res.selectedItem) {
                            ctl.addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
                            ctl.setValue(res.selectedItem[element.ID]);
                        }

                        if (element.selected)
                            ctl.setValue(element.selected);

                        if (n === elements.length)
                            resolve();
                    } else
                        reject();
                });
            })
        });
    }

    await listSmartChooser([
        {tag: 'filter-sm-position', url: 'searchPositions', ID: 'positionId', label: 'positionName'},
        {tag: 'filter-sm-application-status', url: 'searchApplicationStatuses', ID: 'id', label: 'name'},
        {tag: 'filter-sm-applicant-status', url: 'searchApplicantStatuses', ID: 'id', label: 'name'},
        {tag: 'filter-sm-applicant-source', url: 'searchApplicantSources', ID: 'id', label: 'description'},
    ]);
    $$('filter-organizational-group').clear();

    let updateQAFilterGrid;

    async function initFilter() {

        filterTabContainer = new TabContainer('filter-tab-container');
        filters = {
            answers: []
        };

        //     $$('filter-first-name').clear();
        //      $$('filter-last-name').clear();

        $$('filter-sm-position').onChange((val, lbl, data) => {
            $$('filter-organizational-group').setValue(data && data.groupName ? data.groupName : '');
        });

        filterQAGrid = new AGGrid('filter-qa-grid', [
            {headerName: 'Question', field: 'question', width: 300},
            {headerName: 'Position', field: 'position', width: 110},
            {headerName: 'Comparison', field: 'comparator2', width: 100},
            {headerName: 'Answer', field: 'displayAnswer', width: 300}
        ], 'uuid');
        filterQAGrid.show();
        filterQAGrid.setOnSelectionChanged((rows) => {
            $$('filter-qa-edit').enable(rows);
            $$('filter-qa-remove').enable(rows);
        });

        updateQAFilterGrid = function () {
            const formatComparator = ['', '', 'Starts With', 'Ends With', 'Contains', 'Exact Match', 'Before', 'After', 'On', 'Is Set', 'Is Not Set', 'Greater Than', 'Less Than', 'Equal To', 'Not Equal To'];
            filterQAGrid.clear();
            for (let i = 0; i < filters.answers.length; i++) {
                let row = filters.answers[i];
                row.comparator2 = formatComparator[row.comparator];
                if (row.answerType === 'D')
                    row.displayAnswer = DateUtils.intToStr4(row.answer);
                else if (row.answerType === 'Y') {
                    if (row.answer === '1' || row.answer === 'Y')
                        row.displayAnswer = 'Yes';
                    else if (row.answer === '2' || row.answer === 'N')
                        row.displayAnswer = 'No';
                    else
                        row.displayAnswer = 'Unspecified';
                } else
                    row.displayAnswer = row.answer;
            }
            filterQAGrid.addRecords(filters.answers);
        }

        $$('filter-sm-position').setSelectFunction(() => executeSelectFunc('filter-sm-position', positionSelection, 'id', 'position'));
        $$('filter-sm-application-status').setSelectFunction(() => executeSelectFunc('filter-sm-application-status', applicationStatusSelection, 'id', 'name'));
        $$('filter-sm-applicant-status').setSelectFunction(() => executeSelectFunc('filter-sm-applicant-status', applicantStatusSelection, 'id', 'name'));
        $$('filter-sm-applicant-source').setSelectFunction(() => executeSelectFunc('filter-sm-applicant-source', sourceSelection, 'id', 'description'));

        function qaSelection(row) {
            Utils.popup_open('qa-popup');

            $$('qap-position').onChange((val, lbl, data) => {
                Server.call(RWS, 'LoadQuestions', { positionId: val }).then(res => {
                    if (res._Success) {
                        $$('qap-question').clear().addItems(questions=res.questions, "applicant_question_id", "question");
                    }
                });
            });

            return new Promise(function (resolve, reject) {
                let selectedQus = null;

                if (!row) {
                    $$('qap-title').setValue('Add Question & Answer');
                    $$('qap-question').setValue('');
                    $('.answer-detail').hide();
                    $('#qap-ans-container-none').show();
                } else {
                    $$('qap-title').setValue('Edit Question & Answer');

                    selectQuestion(row.questionDetail);

                    if (selectedQus.answerType === 'L') {
                        $$(`qap-answer-${selectedQus.answerType}`).setValue(row.answerId);
                    } else {
                        $$(`qap-answer-${selectedQus.answerType}`).setValue(row.answer);
                    }
                    if (selectedQus.answerType !== 'L' && selectedQus.answerType !== 'Y')
                        $$(`qap-answer-${selectedQus.answerType}-type`).setValue(row.comparator);
                }
/*
                $$('qap-question').setSelectFunction(async () => {
                    const selectedNode = await questionSelection($$('qap-position').getValue());
                    if (selectedNode && selectedNode.data) {
                        $$(element).setValue(selectedNode.data.id, selectedNode.data.question);
                        selectQuestion(selectedNode);
                    }
                });
 */
                $$('qap-question').onChange(v => {
                    $$('qap-ok').disable();
                    questions.map(qus => {
                        if (qus.applicant_question_id === v)
                            selectQuestion(qus);
                    });
                });

                function selectQuestion(data) {
                    $$('qap-ok').enable();

                    selectedQus = data;

                    $('.answer-detail').hide();
                    $(`#qap-ans-container-${selectedQus.data_type}`).show();

                    $$(`qap-answer-${selectedQus.data_type}`).clear();
                    if (selectedQus.data_type === 'L') {
                        AWS.callSoap(SWS, 'listAnswersForQuestion', {id: data.applicant_question_id}).then(res => {
                            if (res.wsStatus === '0') {
                                $$('qap-answer-L').addItems(Utils.assureArray(res.item), 'id', 'name')
                            }
                        });
                    }
                }

                function comparator() {
                    let ret;
                    switch (selectedQus.data_type) {
                        case 'D':
                        case 'S':
                        case 'N':
                            ret = $$(`qap-answer-${selectedQus.data_type}-type`).getValue();
                            break;
                        default:
                            ret = 13;
                            break;
                    }
                    return ret;
                }

                function ok() {
                    if ($$(`qap-answer-${selectedQus.data_type}`).isError('Answer'))
                        return;
                    const data = {
                        // Used by back-end
                        id: $$('qap-question').getValue(),
                        comparator: comparator(),
                        textAnswer: $$('qap-answer-S').getValue(),
                        dateAnswer: $$('qap-answer-D').getIntValue(),
                        numericAnswer: $$('qap-answer-N').getValue(),
                        ynAnswer: $$('qap-answer-Y').getValue(),
                        listAnswerId: $$('qap-answer-L').getValue(),

                        // Used by UI
                        uuid: row ? row.uuid : '',
                        positionId: $$('qap-position').getValue(),
                        position: $$('qap-position').getLabel(),
                        question: $$('qap-question').getLabel(),
                        questionDetail: selectedQus,
                        answerType: selectedQus.data_type,
                        answerId: selectedQus.data_type === "L" ? $$(`qap-answer-${selectedQus.data_type}`).getValue() : "",
                        answer: selectedQus.data_type === "D" ? $$(`qap-answer-${selectedQus.data_type}`).getIntValue() :
                            (selectedQus.data_type === "L" ? $$(`qap-answer-${selectedQus.data_type}`).getLabel() : $$(`qap-answer-${selectedQus.data_type}`).getValue()),
                    };
                    resolve(data);
                    Utils.popup_close();
                }

                function cancel() {
                    resolve(null);
                    Utils.popup_close();
                }

                $$('qap-ok').onclick(ok);
                $$('qap-cancel').onclick(cancel);
            });
        }

        $$('filter-qa-add').onclick(async () => {
            const data = await qaSelection();
            if (data) {
                filters.answers.push({...data, uuid: Utils.uuid()});
                updateQAFilterGrid();
            }
        });

        $$('filter-qa-edit').onclick(async () => {
            const row = filterQAGrid.getSelectedRow();
            const data = await qaSelection(row);
            if (data) {
                for (let i = 0; i < filters.answers.length; i++) {
                    if (filters.answers[i].uuid !== row.uuid) {
                        continue;
                    }
                    filters.answers[i] = {
                        ...data,
                        uuid: row.uuid
                    }
                }
                updateQAFilterGrid();
            }
        });

        $$('filter-qa-remove').onclick(() => {
            Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Question & Answer?', () => {
                const row = filterQAGrid.getSelectedRow();
                const tmp = [];
                for (let i = 0; i < filters.answers.length; i++) {
                    if (filters.answers[i].uuid === row.uuid)
                        continue;
                    tmp.push(filters.answers[i]);
                }
                filters.answers = tmp;
                updateQAFilterGrid();
            });
        });
    }

    function getFilterParams() {
        const prevFilters = Utils.getData(FilterSave);
        if (prevFilters) {
            filters = prevFilters;
            page = filters.page;
            $$('filter-sm-applicant-source').setValue(filters.applicantSource);
            $$('filter-sm-applicant-status').setValue(filters.applicantStatus);
            $$('filter-sm-application-status').setValue(filters.applicationStatus);
            $$('filter-sm-position').setValue(filters.positionId);
            const data = $$('filter-sm-position').getData();
            $$('filter-organizational-group').setValue(data && data.groupName ? data.groupName : '');
            $$('filter-first-name').setValue(filters.firstName);
            $$('filter-first-name-type').setValue(filters.firstNameSearchType);
            $$('chk-include-employees').setValue(filters.includeEmployeesWithApps);
            $$('chk-include-outdated').setValue(filters.includeOutdatedApplicants);
            $$('chk-include-inactive').setValue(filters.includeInactive);
            $$('chk-sort-last-event-first').setValue(filters.sortLastEventFirst);
            $$('chk-sort-last-event-last').setValue(filters.sortLastEventLast);
            $$('filter-last-name').setValue(filters.lastName);
            $$('filter-last-name-type').setValue(filters.lastNameSearchType);
            $$('filter-state').setValue(filters.state);
            updateQAFilterGrid();
        } else {
            filters = {
                ...filters,
                page: page,
                applicantSource: $$('filter-sm-applicant-source').getValue(),
                applicantStatus: $$('filter-sm-applicant-status').getValue(),
                applicationStatus: $$('filter-sm-application-status').getValue(),
                positionId: $$('filter-sm-position').getValue(),
                firstName: $$('filter-first-name').getValue(),
                firstNameSearchType: $$('filter-first-name-type').getValue(),
                includeEmployeesWithApps: $$('chk-include-employees').getValue(),
                includeOutdatedApplicants: $$('chk-include-outdated').getValue(),
                includeInactive: $$('chk-include-inactive').getValue(),
                sortLastEventFirst: $$('chk-sort-last-event-first').getValue(),
                sortLastEventLast: $$('chk-sort-last-event-last').getValue(),
                lastName: $$('filter-last-name').getValue(),
                lastNameSearchType: $$('filter-last-name-type').getValue(),
                state: $$('filter-state').getValue(),
                searchMeta: {
                    firstItemIndexPaging: 0,
                    sortAsc: true,
                    sortField: 'lastName',
                    usingPaging: false
                }
            }
            Utils.saveData(FilterSave, filters);
        }
    }

    function applicationPopup(row) {

        Utils.popup_open('application-popup');

        return new Promise(async function (resolve, reject) {

            $$('app-sm-position').setSelectFunction(() => executeSelectFunc('app-sm-position', positionSelection, 'id', 'position'));
            $$('app-sm-job-type').setSelectFunction(() => executeSelectFunc('app-sm-job-type', jobtypeSelection, 'id', 'description'));
            $$('app-sm-status').setSelectFunction(() => executeSelectFunc('app-sm-status', applicationStatusSelection, 'id', 'name'));
            $$('app-sm-source').setSelectFunction(() => executeSelectFunc('app-sm-source', sourceSelection, 'id', 'description'));

            if (!row) {
                $$('app-title').setValue('Add Application');
                $$('app-org-group').clear();
            } else {
                $$('app-title').setValue('Edit Application');
            }

            await listSmartChooser([
                {
                    tag: 'app-sm-status',
                    url: 'searchApplicationStatuses',
                    ID: 'id',
                    label: 'name',
                    selected: row ? row.statusId : null
                },
                {
                    tag: 'app-sm-source',
                    url: 'searchApplicantSources',
                    ID: 'id',
                    label: 'description',
                    selected: row ? row.sourceId : null
                },
            ]);

            $$('app-sm-position').onChange(async v => {
                /*
                AWS.callSoap(SWS, 'searchPositions', { includeAccepting: true, includeNew: true }).then(res => {
                    if (res.wsStatus === '0') {
                        Utils.assureArray(res.item).map(item => {
                            if (item.id === v) {
                                $$('app-org-group').setValue(item.orgGroupName);
                            }
                        })
                    }
                });

                 */
            });

            function ok() {
                if ($$('app-date').isError('Date'))
                    return;
                if ($$('app-sm-job-type').isError('Job Type'))
                    return;
                if ($$('app-sm-status').isError('Status'))
                    return;
                if ($$('app-sm-source').isError('Source'))
                    return;

                const data = {
                    uuid: row ? row.uuid : '',
                    date: $$('app-date').getIntValue(),
                    position: $$('app-sm-position').getLabel(),
                    positionId: $$('app-sm-position').getValue(),
                    orgGroupName: $$('app-org-group').getValue(),
                    jobType: $$('app-sm-job-type').getLabel(),
                    source: $$('app-sm-source').getLabel(),
                    sourceId: $$('app-sm-source').getValue(),
                    status: $$('app-sm-status').getLabel(),
                    statusId: $$('app-sm-status').getValue(),
                };

                resolve(data);
                Utils.popup_close();
            }

            function cancel() {
                resolve(null);
                Utils.popup_close();
            }

            $$('app-ok').onclick(ok);
            $$('app-cancel').onclick(cancel);
        });
    }

    const applicationContactPopup = async (row) => {

        Utils.popup_open('application-contact-popup');

        return new Promise(function (resolve, reject) {

            if (!row) {
                $$('apc-title').setValue('Add Contact');
                $$('apc-date').clear();
                $$('apc-time').clear();
                $$('apc-type').setValue("");
                $$('apc-result').setValue("");
                $$('apc-detail').clear();
            } else {
                $$('apc-title').setValue('Edit Contact');
                $$('apc-date').setValue(row.date);
                $$('apc-time').setValue(row.time);
                $$('apc-type').setValue(row.mode);
                $$('apc-result').setValue(row.status);
                $$('apc-detail').setValue(row.description);
            }

            const ok = () => {
                if ($$('apc-date').isError('Date'))
                    return;
                if ($$('apc-time').isError('Time'))
                    return;
                if ($$('apc-type').isError('Type'))
                    return;
                if ($$('apc-result').isError('Result'))
                    return;
                if ($$('apc-detail').isError('Description'))
                    return;

                const data = {
                    date: $$('apc-date').getIntValue(),
                    time: $$('apc-time').getValue(),
                    mode: $$('apc-type').getValue(),
                    status: $$('apc-result').getValue(),
                    description: $$('apc-detail').getValue(),
                };

                resolve(data);
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('apc-ok').onclick(ok);
            $$('apc-cancel').onclick(cancel);
        });
    };

    const editQuestionPopup = async (row) => {

        Utils.popup_open('edit-question-popup');

        return new Promise(function (resolve, reject) {

            if (!row)
                return;

            $$('eqp-question').setValue(row.question);
            $('.answer-detail').hide();
            $(`#eqp-ans-container-${row.answerType}`).show();

            if (row.answerType === 'L') {
                AWS.callSoap(SWS, 'listAnswersForQuestion', {id: row.id}).then(res => {
                    if (res.wsStatus === '0') {
                        $$('eqp-answer-L').clear().addItems(Utils.assureArray(res.item), 'id', 'name');
                    }
                });
            } else {
                $$(`eqp-answer-${row.answerType}`).clear();
            }

            $$(`eqp-answer-${row.answerType}`).setValue(row.answer);

            const ok = () => {
                if ($$(`eqp-answer-${row.answerType}`).isError('Answer'))
                    return;

                if (row.answerType === 'S') {
                    row.textBasedAnswer = $$(`eqp-answer-S`).getValue();
                } else if (row.answerType === 'L') {
                    row.listBasedAnswer = $$(`eqp-answer-L`).getLabel();
                    row.listBasedAnswerId = $$(`eqp-answer-L`).getValue();
                } else if (row.answerType === 'N') {
                    row.numberBasedAnswer = $$(`eqp-answer-N`).getValue();
                }

                resolve({
                    ...row,
                    answer: row.answerType === 'D' ? $$(`eqp-answer-${row.answerType}`).getIntValue() : $$(`eqp-answer-${row.answerType}`).getValue()
                });
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('eqp-ok').onclick(ok);
            $$('eqp-cancel').onclick(cancel);
        });
    };

    function formPopup(row) {

        Utils.popup_open('form-popup');

        return new Promise(async function (resolve, reject) {
            const res = await AWS.callSoap(SWS, 'listFormTypes');
            const types = Utils.assureArray(res.item);

            $$('fp-code').clear().addItems(types, 'id', 'code');

            if (!row) {
                $$('fp-title').setValue('Add Form');
                $$('fp-code').setValue("");
            } else {
                $$('fp-title').setValue('Edit Form');
                $$('fp-code').setValue(row.formTypeId);
            }

            $$('fp-code').onChange(handleTypeChange);

            function handleTypeChange() {
                const v = $$('fp-code').getValue();
                types.map(type => {
                    if (type.id === v)
                        $$('fp-description').setValue(type.description);
                });
            }

            handleTypeChange();

            const ok = async () => {
                if ($$('fp-code').isError('Type'))
                    return;
                if ($$('fp-form').isError('Form'))
                    return;

                const data = {
                    id: row ? row.id : Utils.uuid(),
                    formTypeId: $$('fp-code').getValue(),
                    formTypeCode: $$('fp-code').getLabel(),
                    formTypeDescription: $$('fp-description').getValue(),
                    comment: $$('fp-comments').getValue(),
                    date: row ? row.date : DateUtils.today()
                };

                resolve(data);

                Utils.waitMessage('File upload in progress.');
                let r = await AWS.fileUpload('fp-form', 'hrFormUpload', data);
                Utils.waitMessageEnd();

                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('fp-ok').onclick(ok);
            $$('fp-cancel').onclick(cancel);
        });
    }

    const applicantPopup = async (applicantId) => {
        let data = {};

        if (applicantId) {
            data = await AWS.callSoap(SWS, "loadApplicant", {id: applicantId});
        }

        const detailTabContainer = new TabContainer('dp-tab-container');
        detailTabContainer.selectTab('dp-general-TabButton');

        countriesToDropDown('dp-citizen-of');
        countriesToDropDown('dp-address-country');
        statesToDropDown('dp-address-states', getStatesForCountry($$('dp-address-country').getValue()));

        $$('dp-sm-applicant-status').setSelectFunction(() => executeSelectFunc('dp-sm-applicant-status', applicantStatusSelection, 'id', 'name'));
        $$('dp-sm-applicant-source').setSelectFunction(() => executeSelectFunc('dp-sm-applicant-source', sourceSelection, 'id', 'description'));
        await listSmartChooser([
            {tag: 'dp-sm-applicant-status', url: 'searchApplicantStatuses', ID: 'id', label: 'name'},
            {tag: 'dp-sm-applicant-source', url: 'searchApplicantSources', ID: 'id', label: 'description'}
        ]);

        AWS.callSoap(SWS, 'listEEORaces').then(res => {
            if (res.wsStatus === '0') {
                fillDropDownFromService('dp-eeo-race', res, 'id', 'name');
                if (data.eeoRaceId) {
                    $$('dp-eeo-race').setValue(data.eeoRaceId);
                }
            }
        });

        AWS.callSoap(SWS, 'listCompanies').then(res => {
            if (res.wsStatus === '0') {
                fillDropDownFromService('dp-company', res, 'id', 'name');
                if (data.companyId) {
                    $$('dp-company').setValue(data.companyId);
                }
            }
        });

        const fieldMatch = {
            'firstName': {id: 'dp-first-name'},
            'lastName': {id: 'dp-last-name'},
            'middleName': {id: 'dp-middle-name'},
            'nickName': {id: 'dp-nick-name'},
            'sex': {id: 'dp-sex'},
            'citizenship': {id: 'dp-citizen-of', skip: true},
            'visa': {id: 'dp-visa'},
            'visaStatusDate': {id: 'dp-visa-status', date: true},
            'i9Completed': {id: 'dp-i9-completed'},
            'visaExpirationDate': {id: 'dp-visa-expiration', date: true},
            'eeoRaceId': {id: 'dp-eeo-race', skip: true},
            'dob': {id: 'dp-dob', date: true},
            'personalEmail': {id: 'dp-email'},
            'companyId': {id: 'dp-company', skip: true},
            'firstAwareDate': {id: 'dp-first-aware-date', date: true},
            'dateAvailable': {id: 'dp-available-date', date: true},
            'applicantSourceId': {id: 'dp-sm-applicant-source', skip: true},
            'applicantStatusId': {id: 'dp-sm-applicant-status', skip: true},
            'desiredSalary': {id: 'dp-desired-salary'},
            'addressLine1': {id: 'dp-address-line1'},
            'addressLine2': {id: 'dp-address-line2'},
            'country': {id: 'dp-address-country', skip: true},
            'city': {id: 'dp-address-city'},
            'stateProvince': {id: 'dp-address-states', skip: true},
            'zipPostalCode': {id: 'dp-address-zipcode'},
            'county': {id: 'dp-address-county'},
            'homePhone': {id: 'dp-address-home-phone'},
            'workPhone': {id: 'dp-address-work-phone'},
            'mobilePhone': {id: 'dp-address-mobile-phone'},
            'workFax': {id: 'dp-address-fax'},
            'militaryBranch': {id: 'dp-military-branch', skip: true},
            'enlistFromMonth': {id: 'dp-military-month-from', skip: true},
            'enlistFromYear': {id: 'dp-military-year-from'},
            'enlistToMonth': {id: 'dp-military-month-to', skip: true},
            'enlistToYear': {id: 'dp-military-year-to'},
            'dischargeRank': {id: 'dp-military-discharge-rank'},
            'dischargeType': {id: 'dp-military-discharge-type', skip: true},
            'dischargeExplain': {id: 'dp-military-other-text'},
            'convicted': {id: 'dp-military-convicted'},
            'convictedDescription': {id: 'dp-military-convicted-description'},
            'workedFor': {id: 'dp-military-worked-for'},
            'workedForWhen': {id: 'dp-military-worked-for-when'},
            'comments': {id: 'dp-comments'}
        };

        Object.keys(fieldMatch).map(key => {
            const field = fieldMatch[key];

            if (!field.skip)
                $$(field.id).clear();
            else
                $$(field.id).setValue('');

            if (Object.keys(data).indexOf(key) > -1)
                $$(field.id).setValue(data[key]);
        });
        $$('dp-ssn').setValue(data.ssn);

        if (!data.applicants) {
            data.applicants = [];
            data.questionDetails = [];
            data.forms = [];
        } else
            for (let i = 0; i < data.applicants.length; i++) {
                let row = data.applicants[i];
                row.uuid = Utils.uuid();
            }

        function backgroundTabEvents() {
            const dischargeType = $$('dp-military-discharge-type').getValue();
            if (dischargeType === '' || dischargeType === 'H') {
                $$('dp-military-other-text').disable();
            } else {
                $$('dp-military-other-text').enable();
            }

            if ($$('dp-military-convicted').getValue() === 'Y') {
                $$('dp-military-convicted-description').enable();
            } else {
                $$('dp-military-convicted-description').disable();
            }

            if ($$('dp-military-worked-for').getValue() === 'Y') {
                $$('dp-military-worked-for-when').enable();
            } else {
                $$('dp-military-worked-for-when').disable();
            }
        }

        $$('dp-military-discharge-type').onChange(backgroundTabEvents);
        $$('dp-military-convicted').onChange(backgroundTabEvents);
        $$('dp-military-worked-for').onChange(backgroundTabEvents);

        backgroundTabEvents();

        Utils.popup_open('detail-popup');

        return new Promise(function (resolve, reject) {

            const ok = () => {
                if ($$('dp-first-name').isError('First Name')) {
                    detailTabContainer.selectTab('dp-general-TabButton');
                    return;
                }
                if ($$('dp-last-name').isError('Last Name')) {
                    detailTabContainer.selectTab('dp-general-TabButton')
                    return;
                }
                if ($$('dp-first-aware-date').isError('First Aware Date')) {
                    detailTabContainer.selectTab('dp-general-TabButton')
                    return;
                }
                if ($$('dp-available-date').isError('Date Available')) {
                    detailTabContainer.selectTab('dp-general-TabButton')
                    return;
                }
                if ($$('dp-sm-applicant-status').isError('Applicant Status')) {
                    detailTabContainer.selectTab('dp-general-TabButton')
                    return;
                }
                if ($$('dp-sm-applicant-source').isError('Applicant Source')) {
                    detailTabContainer.selectTab('dp-general-TabButton')
                    return;
                }
                if ($$('dp-military-worked-for').isError('Worked for This Company')) {
                    detailTabContainer.selectTab('dp-background-TabButton')
                    return;
                }

                Object.keys(fieldMatch).map(key => {
                    const field = fieldMatch[key];
                    let value;
                    if (field.date)
                        value = $$(field.id).getIntValue();
                    else
                        value = $$(field.id).getValue();
                    data[key] = value;
                });
                data.ssn = Utils.formatSsn($$('dp-ssn').getValue());

                resolve(data);
                Utils.popup_close();
            };

            const cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('dp-ok').onclick(ok);
            $$('dp-cancel').onclick(cancel);
        });
    };

    function updateGrid() {
        getFilterParams();
        Utils.waitMessage("Retrieving data; Please wait...");
        AWS.callSoap(SWS, "searchApplicants", filters).then(function (res) {
            if (res.wsStatus === '0') {
                res.item = Utils.assureArray(res.item);
                for (let i = 0; i < res.item.length; i++) {
                    const row = res.item[i];
                    row.firstAwareDate2 = row.firstAwareDate !== '0' ? DateUtils.intToStr4(Number(row.firstAwareDate)) : '';
                    row.employee2 = row.employee === 'true' ? 'Yes' : 'No';
                }
                grid.clear().addRecords(res.item);
                let start = res.cap * (page-1) + 1;
                let end = start + res.item.length-1;
                if (res.searchMeta.totalItemsPaging > 0) {
                    const tr = Utils.format(res.searchMeta.totalItemsPaging, "C", 0, 0);
                    $$('record-count').setValue("Showing " + Utils.format(start, "C", 0, 0) + " - " + Utils.format(end, "C", 0, 0) + " of " + tr + " records");
                    $$('next').enable(res.searchMeta.totalItemsPaging > end);
                } else {
                    $$('record-count').setValue("Showing " + Utils.format(start, "C", 0, 0) + " - " + Utils.format(end, "C", 0, 0));
                    $$('next').enable(res.item.length >= res.cap);
                }
                $$('prev').enable(page > 1);
                Utils.waitMessageEnd();
                //$$('applicants-generate-offer-letter').disable();
               // $$('applicants-email-offer-letter').disable();
            } else
                Utils.waitMessageEnd();
        });
    }

    const res = await AWS.callSoap(SWS, "checkRight");
    if (res.wsStatus !== '0')
        return;
    else {
        canDelete = Number(res.applicantDelete);
    }

    const columnDefs = [
        {headerName: 'Last Name', field: 'lastName', width: 180},
        {headerName: 'First Name', field: 'firstName', width: 180},
        {headerName: 'Middle Name', field: 'middleName', width: 100},
        {headerName: 'State', field: 'state', width: 100},
        {headerName: 'Applicant Status', field: 'applicantStatus', width: 200},
        {headerName: 'Position', field: 'position', width: 200},
        {headerName: 'Application Status', field: 'applicationStatus', width: 200},
        {headerName: 'First Aware', field: 'firstAwareDate2', width: 160},
        {headerName: 'Last Event', field: 'lastEventDate', valueFormatter:  AGGrid.date, width: 160},
        {headerName: 'Employee Status', field: 'employeeStatus', width: 200}
    ];

    grid = new AGGrid('applicants-data-grid', columnDefs, 'personId');
    grid.show();
    grid.setOnRowDoubleClicked(editChildren);

    grid.setOnSelectionChanged((rows) => {
     //   $$('applicants-generate-offer-letter').enable(rows.length && !!rows[0].applicationId);
    //    $$('applicants-email-offer-letter').enable(rows.length && !!rows[0].applicationId);
        $$('applicants-make-offer').enable(rows.length && !!rows[0].applicationId);
        $$('applicants-edit').enable(rows);
        if (canDelete === 2)
            $$('applicants-delete').enable(rows);
    });

    initFilter();

    $$('chk-include-employees').onChange(() => {
        filters.includeEmployeesWithApps = $$('chk-include-employees').getValue();
        //updateGrid();
    });

    $$('chk-include-outdated').onChange(() => {
        filters.includeOutdatedApplicants = $$('chk-include-outdated').getValue();
        //updateGrid();
    });

    $$('chk-include-inactive').onChange(() => {
        filters.includeInactive = $$('chk-include-inactive').getValue();
        //updateGrid();
    });

    $$('chk-sort-last-event-first').onChange((v) => {
        filters.sortLastEventFirst = v;
        if (v) {
            filters.sortLastEventLast = false;
            $$('chk-sort-last-event-last').setValue(false);
        }
    });

    $$('chk-sort-last-event-last').onChange((v) => {
        filters.sortLastEventLast = v;
        if (v) {
            filters.sortLastEventFirst = false;
            $$('chk-sort-last-event-first').setValue(false);
        }
    });

    $$('filter-reset').onclick(() => {
        $$('filter-sm-applicant-source').setValue('');
        $$('filter-sm-applicant-status').setValue('');
        $$('filter-sm-application-status').setValue('');
        $$('filter-sm-position').setValue('');
        $$('filter-first-name').clear();
        $$('filter-first-name-type').setValue('2');
        $$('chk-include-employees').setValue(false);
        $$('chk-include-outdated').setValue(false);
        $$('chk-include-inactive').setValue(false);
        $$('chk-sort-last-event-first').setValue(false);
        $$('chk-sort-last-event-last').setValue(false);
        $$('filter-last-name').clear();
        $$('filter-last-name-type').setValue('2');
        $$('filter-state').setValue('');
        filters = {
            answers: []
        };
        filterQAGrid.clear();
        Utils.getAndEraseData(FilterSave);
        grid.clear();
        $$('record-count').setValue('');
        $$('applicants-make-offer').disable();
        $$('applicants-edit').disable();
        $$('applicants-delete').disable();
    });

    $$('filter-search').onclick(() => {
        Utils.getAndEraseData(FilterSave);
        page = 1;
        updateGrid();
    });

    $$('next').onclick(() => {
        Utils.getAndEraseData(FilterSave);
        page++;
        updateGrid();
    });

    $$('prev').onclick(() => {
        Utils.getAndEraseData(FilterSave);
        if (page > 1)
            page--;
        updateGrid();
    });

    $$('applicants-add').onclick(async () => {
        const data = await applicantPopup(null);
        if (data) {
            AWS.callSoap(SWS, 'newApplicant', data).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    function editChildren() {
        const row = grid.getSelectedRow();
        // Save data for new screens
        Utils.saveData(HR_PERSON_ID, row.personId);
        Utils.saveData(HR_PERSON_FIRST_NAME, row.firstName);
        Utils.saveData(HR_PERSON_MIDDLE_NAME, row.middleName);
        Utils.saveData(HR_PERSON_LAST_NAME, row.lastName);
        Utils.saveData(HR_PERSON_NAME, formatDisplayName(row.firstName, row.middleName, row.lastName));
        Utils.saveData(HR_PERSON_FIRST_AWARE_DATE, row.firstAwareDate);
        Utils.saveData(HR_PERSON_APPLICANT_SOURCE, row.applicantSourceId);
        Utils.saveData(HR_PERSON_APPLICANT_STATUS, row.applicantStatusId);
        Utils.saveData(HR_PERSON_PHONE, row.mobilePhone);
        Utils.saveData(HR_PERSON_EMAIL, row.emailAddress);

        Framework.getChild();
    }

    $$('applicants-edit').onclick(editChildren);

    /*
    $$('applicants-generate-offer-letter').onclick(() => {
        const row = grid.getSelectedRow();
        let name = row.firstName;
        if (row.middleName)
            name += ' ' + row.middleName;
        name += ' ' + row.lastName;
        $$('olp-name').setValue(name);
        $$('olp-pay-rate').setValue(row.payRate);
        $$('olp-position').setValue(row.positionId);

        Utils.popup_open('offer-letter-popup');

        $$('olp-ok').onclick(() => {
            if ($$('olp-position').isError('Position'))
                return;
            if ($$('olp-pay-rate').isError('Pay Rate'))
                return;
            const data = {
                applicationId: row.applicationId,
                positionId: $$('olp-position').getValue(),
                payRate: $$('olp-pay-rate').getValue()
            };
            Server.call(RWS, 'GenerateOfferLetter', data).then(res => {
                if (res._Success) {
                    //Utils.showReport(res.fileName);
                    let browserTab = window.open();

                    //     Set browser tab icon.  This must come before the write
                    const headTitle = browserTab.document.querySelector('head');
                    const favicon = browserTab.document.createElement('link');
                    favicon.setAttribute('rel','shortcut icon');
                    favicon.setAttribute('href', document.location.href.replace("index.html", "Stack360_tab-icon-13.png"));
                    favicon.setAttribute('type', 'image/x-icon');
                    headTitle.appendChild(favicon);

                    browserTab.document.write(res.offerLetter);
                    // Set browser tab tab title.  This must come after the write.
                    browserTab.document.title = "Offer Letter";

                    Utils.popup_close();
                    updateGrid();
                }
            });
        });

        $$('olp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('applicants-email-offer-letter').onclick(() => {
        const row = grid.getSelectedRow();
        let name = row.firstName;
        if (row.middleName)
            name += ' ' + row.middleName;
        name += ' ' + row.lastName;
        $$('olp-name').setValue(name);
        $$('olp-pay-rate').setValue(row.payRate);
        /*
        Server.call(RWS, 'GetPositions').then(res => {
            if (res._Success) {
                $$('olp-position').clear().add('', '(choose)').addItems(res.positions, "position_id", "position_name").setValue(row.positionId);
            }
        });

         * /
        Utils.popup_open('offer-letter-popup');

        $$('olp-ok').onclick(() => {
            if ($$('olp-position').isError('Position'))
                return;
            if ($$('olp-pay-rate').isError('Pay Rate'))
                return;
            const data = {
                applicationId: row.applicationId,
                positionId: $$('olp-position').getValue(),
                payRate: $$('olp-pay-rate').getValue()
            };
            Utils.waitMessage('Emailing offer letter.');
            Server.call(RWS, 'EmailOfferLetter', data).then(res => {
                Utils.waitMessageEnd();
                if (res._Success) {
                    Utils.popup_close();
                    updateGrid();
                    Utils.showMessage('Status', 'The offer letter has been emailed.');
                }
            });
        });

        $$('olp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });
*/

    $$('applicants-make-offer').onclick(() => {
        Utils.popup_open('make-offer-popup');

        $$('mop-ok').onclick(() => {
            Utils.popup_close();
            makeOffer();
        });

        $$('mop-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function makeOffer() {
        const row = grid.getSelectedRow();
        let name = row.firstName;
        if (row.middleName)
            name += ' ' + row.middleName;
        name += ' ' + row.lastName;
        $$('olp-name').setValue(name);
        $$('olp-pay-rate').setValue(row.payRate);
        $$('olp-position').setValue(row.positionId);

        Utils.popup_open('offer-letter-popup');

        $$('olp-ok').onclick(() => {
            if ($$('olp-position').isError('Position'))
                return;
            if ($$('olp-pay-rate').isError('Pay Rate'))
                return;
            Utils.waitMessage('Generating offer.');
            const data = {
                applicationId: row.applicationId,
                hrPositionId: $$('olp-position').getValue(),
                payRate: $$('olp-pay-rate').getValue()
            };
            Server.call(RWS, 'MakeOffer', data).then(res => {
                Utils.waitMessageEnd();
                if (res._Success) {
                    //Utils.showReport(res.fileName);
                    let browserTab = window.open();

                    //     Set browser tab icon.  This must come before the write
                    const headTitle = browserTab.document.querySelector('head');
                    const favicon = browserTab.document.createElement('link');
                    favicon.setAttribute('rel','shortcut icon');
                    favicon.setAttribute('href', document.location.href.replace("index.html", "Stack360_tab-icon-13.png"));
                    favicon.setAttribute('type', 'image/x-icon');
                    headTitle.appendChild(favicon);

                    browserTab.document.write(res.offerLetter);
                    // Set browser tab tab title.  This must come after the write.
                    browserTab.document.title = "Offer Letter";

                    Utils.popup_close();
                    updateGrid();
                }
            });
        });

        $$('olp-cancel').onclick(() => {
            Utils.popup_close();
        });

    }

    $$('applicants-delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Applicant?', () => {
            const data = {
                ids: [grid.getSelectedRow().personId]
            };

            AWS.callSoap(SWS, "deleteApplicants", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('applicants-report').onclick(() => {
        getFilterParams(false);
        AWS.callSoap(SWS, "getReport", filters).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    if (Utils.getData(FilterSave)) {
        updateGrid();
    }

    Utils.waitMessageEnd();

})();