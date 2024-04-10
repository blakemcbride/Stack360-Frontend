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

    const WS = 'com.arahant.services.standard.project.projectComment';
    const SWS = 'StandardProjectProjectComment';
    
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    let projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");
    const shiftCtl = $$('shift');

    const columnDefs = [
        {headerName: 'Date/Time Entered', field: 'dateTimeEnteredFormatted', width: 30  },
        {headerName: 'Internal', field: 'internalComment', width: 20  },
        {headerName: 'Last Name', field: 'lastName', width: 20  },
        {headerName: 'First Name', field: 'firstName', width: 20  },
        {headerName: 'Comment Preview', field: 'commentTxt', width: 80  }
    ];
    const grid = new AGGrid('grid', columnDefs, 'commentId');
    grid.show();
    grid.clear();

    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
    
    let data = {
        projectId: projectId
    };
    const rights = await AWS.callSoap(SWS, 'checkRight', data);
    if (rights.wsStatus !== "0" || rights.accessLevel === "0")
        return;
    $$('save').show(rights.accessLevel === '2');
    $$('reset').show(rights.accessLevel === '2');
    $$('add').show(rights.accessLevel === '2');
    $$('edit').show(rights.accessLevel === '2');
    $$('delete').show(rights.accessLevel === '2');
    $$('project-detail').enable(rights.accessLevel === '2');
    grid.enable(rights.accessLevel === '2');

    async function getShifts(projectId) {
        // fill the list of shifts
        const data = {
            projectId: projectId
        };
        const res = await Server.call(WS, 'GetShifts', data);
        shiftCtl.clear().triggerGlobalChange(false);
        if (res._Success) {
            if (res.shifts.length === 1) {
                const shift = res.shifts[0];
                shiftCtl.add(shift.project_shift_id, shift.shift_start, shift).disable();
            } else
                shiftCtl.add('', 'All').addItems(res.shifts, 'project_shift_id', 'shift_start').enable();
        }
    }
    await getShifts(projectId);

    async function loadData(isGridOnly = false, previousChange = false) {
        const data = {
            projectId: projectId,
            shiftId: $$('shift').getValue()
        };

        const res = await AWS.callSoap(SWS, 'loadCommentsSummary', data);
        if (res.wsStatus === "0") {
            res.item = Utils.assureArray(res.item);
            grid.clear();
            grid.addRecords(res.item);
            Utils.setText('status', `Displaying ${res.item.length} Project Comment`);
            if (!isGridOnly) {
                $$('project-detail').setValue(res.detail);
            }
            if (!previousChange) {
                Utils.clearSomeControlValueChanged(true)
            }
        } else
            return true;  // exit
        return false;  // don't exit
    }

    loadData();

    $$('shift').onChange(() => {
        loadData();
    });

    $$('save').onclick(function () {
        if ($$('project-detail').isError('Detail'))
            return;
        const data = {
            projectId: projectId,
            detail: $$('project-detail').getValue()
        };
        AWS.callSoap(SWS, 'saveCommentsSummary', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('save').disable();
                $$('reset').disable();
                $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
                Utils.clearSomeControlValueChanged(false);
                Framework.askBeforeLeaving = false;
                Utils.showMessage('Information', 'Save completed successfully.');
            }
        });

    });
        

    Framework.askBeforeLeaving = true;  //  make sure changes are not lost when changing screens
    Utils.setSomeControlValueChangeFunction(function (status) {
        if (Utils.popup_context.length) {
            return;
        }
        if (status) {
            $$('save').enable(rights.accessLevel === '2');
            $$('reset').enable(rights.accessLevel === '2');
            $$('project-info').setValue(projectName + " - " + projectSummary + " (unsaved changes)").setColor('red');
        } else {
            $$('save').disable();
            $$('reset').disable();
            $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        }
        Framework.askBeforeLeaving = status;
    });

    $$('reset').onclick(function () {
        $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');
        Utils.clearSomeControlValueChanged(true);
        loadData();
    });

    const detailPopup = (row) => {

        Utils.popup_open('detail-popup', 'dp-comment');

        return new Promise(function (resolve, reject) {

            if (!row) {
                $$('dp-title').setValue('Add Project Comment');
                $$('dp-date-time').setValue('(generated on save)');
                $$('dp-entered-by').setValue(Framework.userInfo.title);
                $$('dp-chk-internal').clear();
                $$('dp-comment').clear();
            } else {
                $$('dp-title').setValue('Edit Project Comment');
                $$('dp-date-time').setValue(row.dateTimeEnteredFormatted);
                $$('dp-entered-by').setValue(`${row.lastName}, ${row.firstName}`);
                $$('dp-chk-internal').setValue(row.internalComment === 'Yes');
                $$('dp-comment').setValue(row.commentTxt);
            }

            
            const ok = () => {
                if ($$('dp-comment').isError('Comment'))
                    return;

                const data = {
                    internalFlag: $$('dp-chk-internal').getValue(),
                    comment: $$('dp-comment').getValue()
                };

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

    $$('add').onclick(async () => {
        if (!shiftCtl.getValue()) {
            Utils.showMessage('Error', 'A valid shift must be selected first.');
            return;
        }
        const prev = Utils.didSomeControlValueChange();
        const data = await detailPopup();
        data.projectId = projectId;
        data.shiftId = $$('shift').getValue();
        if (data) {
            AWS.callSoap(SWS, 'addProjectComment', data).then(res => {
                if (res.wsStatus === '0') {
                    loadData(true, prev);
                }
            })
        }
    });

    async function edit(){
        const row = grid.getSelectedRow();
        const prev = Utils.didSomeControlValueChange();
        const data = await detailPopup(row);
        if (data) {
            AWS.callSoap(SWS, 'saveProjectComment', { ...data, commentId: row.commentId}).then(res => {
                if (res.wsStatus === '0') {
                    loadData(true, prev);
                }
            })
        }
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    $$('delete').onclick(() => {
        const prev = Utils.didSomeControlValueChange();
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Project Comment?', () => {
            const data = {
                ids: [grid.getSelectedRow().commentId]
            };
            
            AWS.callSoap(SWS, "deleteProjectComments", data).then(function (res) {
                if (res.wsStatus === '0') {
                    loadData(true, prev);
                }
            });
        });
    });
})();
