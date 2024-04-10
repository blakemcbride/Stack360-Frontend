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
    const SWS = 'StandardAtApplicantPosition';
    const RWS = 'com.arahant.services.standard.at.applicantPosition';
    let editPositions = 0;

    $$('add').disable();
    $$('delete').disable();

    $$('dp-job-title').disable();
    $$('dp-position').disable();
    $$('dp-organizational-group').disable();
    $$('dp-accepting-applications').disable();
    $$('dp-job-start').disable();
    $$('dp-status').disable();

    const columnDefs = [
        {headerName: 'Applicant Position', field: 'jobTitle', width: 40},
        {headerName: 'Organizational Group', field: 'orgGroupName', width: 20 },
        {headerName: 'Status', field: 'statusType2', width: 18 },
        {headerName: 'Accepting Apps', field: 'acceptApplicationDate2', width: 15 },
        {headerName: 'Starts', field: 'jobStartDate2', width: 10 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    let data = {
    };
    AWS.callSoap(SWS, 'checkRight', data).then(function (res) {
        if (res.wsStatus === "0") {
            editPositions = Number(res.applicantPositionEditPosition);
            if (editPositions === 2) {
                $$('add').enable();

                $$('dp-job-title').enable();
                $$('dp-position').enable();
                $$('dp-organizational-group').enable();
                $$('dp-accepting-applications').enable();
                $$('dp-job-start').enable();
                $$('dp-status').enable();
            }
        }
    });

    data = {
        id: null,
        name: null,
        nameSearchType: 0
    };
    AWS.callSoap(SWS, 'searchOrgGroups', data).then(function (res) {
        if (res.wsStatus === "0") {
            $$('organizational-group').clear().add('', '(choose)').addItems(res.item, 'id', 'name');
        }
    });

    AWS.callSoap(SWS, 'listHrPositions').then(function (res) {
        if (res.wsStatus === "0") {
            $$('position').add('', '(choose)').addItems(res.item, 'positionId', 'positionName');
        }
    });

    function listPositions() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            acceptingFrom: $$('accepting-applications-from').getIntValue(),
            acceptingTo: $$('accepting-applications-to').getIntValue(),
            includeAccepting: $$('accepting-applications').getValue(),
            includeCancelled: $$('cancelled').getValue(),
            includeFilled: $$('filled').getValue(),
            includeNew: $$('new').getValue(),
            includeSuspended: $$('suspended').getValue(),
            jobStartFrom: $$('job-starts').getIntValue(),
            jobStartTo: $$('job-to').getIntValue(),
            orgGroupId: $$('organizational-group').getValue(),
            positionId: $$('position').getValue()
        };
        AWS.callSoap(SWS, 'listPositions', data).then(function (res) {
            if (res.wsStatus === "0") {
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++) {
                    let row = res.item[i];
                    switch (row.statusType) {
                        case 'N':
                            row.statusType2 = 'New';
                            break;
                        case 'A':
                            row.statusType2 = 'Accepting Applications';
                            break;
                        case 'S':
                            row.statusType2 = 'Suspended';
                            break;
                        case 'F':
                            row.statusType2 = 'Filled';
                            break;
                        case 'C':
                            row.statusType2 = 'Cancelled';
                            break;
                    }
                    row.acceptApplicationDate2 = DateUtils.intToStr4(Number(row.acceptApplicationDate));
                    row.jobStartDate2 = DateUtils.intToStr4(Number(row.jobStartDate));
                }
                grid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Applicant Positions');
            }
        });
    }

    listPositions();

    grid.setOnSelectionChanged(() => {
       const rows = grid.getSelectedRows();
       $$('edit').enable(rows);
       $$('delete').enable(rows);
    });

    $$('new').onChange(listPositions);
    $$('accepting-applications').onChange(listPositions);
    $$('suspended').onChange(listPositions);
    $$('filled').onChange(listPositions);
    $$('cancelled').onChange(listPositions);
    $$('organizational-group').onChange(listPositions);
    $$('position').onChange(listPositions);
    $$('accepting-applications-from').onChange(listPositions);
    $$('accepting-applications-to').onChange(listPositions);
    $$('job-starts').onChange(listPositions);
    $$('job-to').onChange(listPositions);

    $$('reset').onclick(() => {
        $$('new').setValue(true);
        $$('accepting-applications').setValue(true);
        $$('suspended').setValue(false);
        $$('filled').setValue(false);
        $$('cancelled').setValue(false);
        $$('organizational-group').setValue('');
        $$('position').setValue('');
        $$('accepting-applications-from').clear();
        $$('accepting-applications-to').clear();
        $$('job-starts').clear();
        $$('job-to').clear();
        listPositions();
    });

    $$('add').onclick(() => {

        $$('dp-title').setValue('Add Applicant Position');
        $$('dp-accepting-applications').clear();
        $$('dp-job-start').clear();
        $$('dp-status').setValue('N');
        $$('dp-position').clear();
        $$('dp-job-title').clear();
        $$('dp-description').hide();
        $$('dp-offer-letter').hide();

        Utils.popup_open('detail-popup', 'dp-job-title');

        AWS.callSoap(SWS, 'listHrPositions').then(function (res) {
            if (res.wsStatus === "0") {
                $$('dp-position').add('', '(choose)').addItems(res.item, 'positionId', 'positionName');
            }
        });

        let data = {
            id: null,
            name: null,
            nameSearchType: 0
        };
        AWS.callSoap(SWS, 'searchOrgGroups', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('dp-organizational-group').clear().add('', '(choose)').addItems(res.item, 'id', 'name');
            }
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-job-title').isError('Job title'))
                return;
            if ($$('dp-position').isError('Position'))
                return;
            if ($$('dp-organizational-group').isError('Organizational Group'))
                return;
            if ($$('dp-accepting-applications').isError('Accepting Applications'))
                return;
            if ($$('dp-job-start').isError('Job Start'))
                return;
            const data = {
                acceptApplicationDate: $$('dp-accepting-applications').getIntValue(),
                information: [],
                jobStartDate: $$('dp-job-start').getIntValue(),
                orgGroupId: $$('dp-organizational-group').getValue(),
                statusType: $$('dp-status').getValue(),
                jobTitle: $$('dp-job-title').getValue(),
                positionId: $$('dp-position').getValue()
            }
            AWS.callSoap(SWS, 'newPosition', data).then(function (res) {
                if (res.wsStatus === "0") {
                    listPositions();
                }
                Utils.popup_close();
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function edit() {
        const row = grid.getSelectedRow();
        let informationChanged = false;

        let deleteIds = [];

        $$('dp-title').setValue('Edit Applicant Position');
        $$('dp-accepting-applications').setValue(Number(row.acceptApplicationDate));
        $$('dp-job-start').setValue(Number(row.jobStartDate));
        $$('dp-status').setValue(row.statusType);
        $$('dp-job-title').setValue(row.jobTitle);
        $$('dp-description').show();
        $$('dp-offer-letter').show();

        Utils.popup_open('detail-popup', 'dp-position');

        AWS.callSoap(SWS, 'listHrPositions').then(function (res) {
            if (res.wsStatus === "0") {
                $$('dp-position').add('', '(choose)').addItems(res.item, 'positionId', 'positionName').setValue(row.positionId);
            }
        });

        let data = {
            id: null,
            name: null,
            nameSearchType: 0
        };
        AWS.callSoap(SWS, 'searchOrgGroups', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('dp-organizational-group').clear().add('', '(choose)').addItems(res.item, 'id', 'name').setValue(row.orgGroupId);
            }
        });

        function missingVariables(html) {
            if (!html.includes("$DATE")) {
                Utils.showMessage('Error', 'Missing $DATE variable');
                return true;
            }
            if (!html.includes("$SIGNATURE")) {
                Utils.showMessage('Error', 'Missing $SIGNATURE variable');
                return true;
            }
            if (!html.includes("$PAY-RATE")) {
                Utils.showMessage('Error', 'Missing $PAY-RATE variable');
                return true;
            }
            if (!html.includes("$NAME")) {
                Utils.showMessage('Error', 'Missing $NAME variable');
                return true;
            }
            return false;
        }

        $$('dp-description').onclick(async () => {
            Utils.popup_open('description-popup', 'olp-editor');
            const editor = await Editor.create('desp-editor');
            //editor.focus();

            Server.call(RWS, 'GetDescription', { applicantPositionId: row.id } ).then(res => {
                if (res._Success) {
                    editor.setHtml(res.html);
                }
            });

            $$('desp-ok').onclick(() => {
                const html = editor.getHtml();
                Server.call(RWS, 'SaveDescription', { applicantPositionId: row.id, html: html } ).then(res => {
                    if (res._Success) {
                    }
                });
                editor.clear();
                Utils.popup_close();
            });

            $$('desp-cancel').onclick(() => {
                editor.clear();
                Utils.popup_close();
            });
        });

        $$('dp-offer-letter').onclick(async () => {
            Utils.popup_open('offer-letter-popup', 'olp-editor');
            const editor = await Editor.create('olp-editor');
            //editor.focus();

            Server.call(RWS, 'GetOfferLetter', { applicantPositionId: row.id } ).then(res => {
                if (res._Success) {
                    editor.setHtml(res.html);
                }
            });

            $$('olp-variables').onclick(() => {
                Utils.popup_open('offer-letter-variables');
                $$('olv-ok').onclick(() => {
                    Utils.popup_close();
                });
            });

            $$('olp-ok').onclick(() => {
                const html = editor.getHtml();
                if (missingVariables(html))
                    return;
                Server.call(RWS, 'SaveOfferLetter', { applicantPositionId: row.id, html: html } ).then(res => {
                    if (res._Success) {
                    }
                });
                editor.clear();
                Utils.popup_close();
            });

            $$('olp-cancel').onclick(() => {
                editor.clear();
                Utils.popup_close();
            });
        });

        $$('dp-ok').onclick(() => {
            if ($$('dp-job-title').isError('Job title'))
                return;
            if ($$('dp-position').isError('Position'))
                return;
            if ($$('dp-organizational-group').isError('Organizational Group'))
                return;
            if ($$('dp-accepting-applications').isError('Accepting Applications'))
                return;
            if ($$('dp-job-start').isError('Job Start'))
                return;
            const data = {
                id: row.id,
                jobTitle: $$('dp-job-title').getValue(),
                positionId: $$('dp-position').getValue(),
                acceptApplicationDate: $$('dp-accepting-applications').getIntValue(),
                information: [],
                jobStartDate: $$('dp-job-start').getIntValue(),
                orgGroupId: $$('dp-organizational-group').getValue(),
                statusType: $$('dp-status').getValue(),
                informationChangedFlag: informationChanged,  // doesn't seem to be used on the back-end
                reorderedFlag: false,
                deleteIds: deleteIds
            }
            AWS.callSoap(SWS, 'savePosition', data).then(function (res) {
                if (res.wsStatus === "0") {
                    listPositions();
                }
                Utils.popup_close();
            });
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Applicant Position?', () => {
            const row = grid.getSelectedRow();
            const data = {
                ids: row.id
            };
            AWS.callSoap(SWS, 'deletePositions', data).then(function (res) {
                if (res.wsStatus === "0") {
                    listPositions();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const data = {
            acceptingFrom: $$('accepting-applications-from').getIntValue(),
            acceptingTo: $$('accepting-applications-to').getIntValue(),
            includeAccepting: $$('accepting-applications').getValue(),
            includeCancelled: $$('cancelled').getValue(),
            includeFilled: $$('filled').getValue(),
            includeNew: $$('new').getValue(),
            includeSuspended: $$('suspended').getValue(),
            jobStartFrom: $$('job-starts').getIntValue(),
            jobStartTo: $$('job-to').getIntValue(),
            orgGroupId: $$('organizational-group').getValue()
        };
        AWS.callSoap(SWS, 'getReport', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
