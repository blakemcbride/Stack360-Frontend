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

    const WS = 'StandardProjectViewParent';
    let highlightedRowIndexes = [];
    let highlightedRows = [];
    let highlightedParentId;
    let isCut;

    let columnDefs = [
        {headerName: 'Summary', field: 'summary' }
    ];
    const lgrid = new AGGrid('location-grid', columnDefs, 'id');
    lgrid.show();

    columnDefs = [
        {headerName: 'Type', field: 'typeFormatted2', width: 12, rowDrag: true },
        {headerName: 'Summary', field: 'summary', width: 80 }
    ];
    const cgrid = new AGGrid('content-grid', columnDefs, 'id');
    cgrid.multiSelect();
    cgrid.show();

    function updateContentGrid(id) {
        let data = {
            parentId: id
        };
        AWS.callSoap(WS, 'listProjectViews', data).then(function (res) {
            if (res.wsStatus === "0") {
                cgrid.clear();
                if (!id && !highlightedParentId || id === highlightedParentId)
                    cgrid.highlightRows(highlightedRowIndexes);
                else
                    cgrid.highlightRows(null);
                $$('description').clear();
                res.item = Utils.assureArray(res.item);
                for (let i=0 ; i < res.item.length ; i++)
                    if (res.item[i].hasSubProjectViews === 'true')
                        res.item[i].typeFormatted2 = res.item[i].typeFormatted + ' (+)';
                    else
                        res.item[i].typeFormatted2 = res.item[i].typeFormatted;
                if (id) {
                    cgrid.addRecord({id: '', typeFormatted2: 'Folder', summary: '..'});
                    $$('back').enable();
                } else
                    $$('back').disable();
                cgrid.addRecords(res.item);
                $$('status').setValue('Displaying ' + res.item.length + ' Items');
                $$('edit').disable();
                $$('remove').disable();
                $$('remove-all').disable();
                $$('cut').disable();
                $$('copy').disable();
                $$('move-up').disable();
                $$('move-down').disable();
                $$('open-content').disable();
                $$('save').disable();
                $$('reset').disable();
                $$('open-location').disable();
                lgrid.deselectAll();
            }
        });
    }

    function addLocation(id, summary) {
        lgrid.addRecord({id: id, summary: summary});
        $$('back').enable();
        $$('open-location').disable();
    }

    function topLocation() {
        lgrid.clear();
        lgrid.addRecord({id: '', summary: '(top)'});
        $$('back').disable();
        $$('open-location').disable();
    }

    topLocation();
    updateContentGrid(null);

    function removeLocation() {
        const n = lgrid.getNumberOfRows();
        lgrid.deleteRowIndex(n-1);
        $$('open-location').disable();
    }

    function openContent() {
        const row = cgrid.getSelectedRow();
        if (row.id) {
            addLocation(row.id, row.summary);
            updateContentGrid(row.id);
        } else {
            removeLocation();
            const rows = lgrid.getAllRows();
            updateContentGrid(rows[rows.length-1].id);
        }
    }

    cgrid.setOnRowDoubleClicked(openContent);
    $$('open-content').onclick(openContent);

    $$('back').onclick(() => {
        removeLocation();
        const rows = lgrid.getAllRows();
        updateContentGrid(rows[rows.length-1].id);
    });

    function openLocation() {
        const row = lgrid.getSelectedRow();
        let nrows = lgrid.getNumberOfRows();
        const i = lgrid.getSelectedRowIndex();
        while (nrows > i+1)
            lgrid.deleteRowIndex(--nrows);
        $$('open-location').disable();
        updateContentGrid(row.id);
    }

    lgrid.setOnRowDoubleClicked(openLocation);

    cgrid.setOnSelectionChanged((rows) => {
        if (rows.length === 0) {
            $$('description').clear();
            $$('quick-add').enable();
            $$('add').disable();
            $$('edit').disable();
            $$('remove').disable();
            $$('remove-all').disable();
            $$('cut').disable();
            $$('copy').disable();
            $$('move-up').disable();
            $$('move-down').disable();
            $$('import').disable();
            $$('export').disable();
            $$('open-content').disable();
        } else if (rows.length === 1) {
            $$('description').setValue(rows[0].description);
            $$('quick-add').enable();
          //  $$('add').enable();   //  not fully implemented on the front-end yet
            $$('edit').enable();
            $$('remove').enable();
            $$('remove-all').enable();
            $$('cut').enable();
            $$('copy').enable();
            $$('move-up').enable();
            $$('move-down').enable();
            $$('import').enable();
            $$('export').enable();
            $$('open-content').enable();
        } else if (rows.length > 1) {
            $$('description').clear();
            $$('quick-add').disable();
            $$('add').disable();
            $$('edit').disable();
            $$('remove').enable();
            $$('remove-all').enable();
            $$('cut').enable();
            $$('copy').enable();
            $$('move-up').disable();
            $$('move-down').disable();
            $$('import').disable();
            $$('export').disable();
            $$('open-content').disable();
        } else {
            $$('description').clear();
            $$('quick-add').disable();
            $$('add').disable();
            $$('edit').disable();
            $$('remove').disable();
            $$('remove-all').enable();
            $$('cut').disable();
            $$('copy').disable();
            $$('move-up').disable();
            $$('move-down').disable();
            $$('import').disable();
            $$('export').disable();
            $$('open-content').disable();
        }
    });

    function getParentId() {
        const lrows = lgrid.getAllRows();
        let parentId;
        if (lrows.length === 1)
            parentId = null;
        else
            parentId = lrows[lrows.length - 1].id;
        return parentId;
    }

    function addFolderToEnd() {
        $$('app-summary').clear();
        $$('app-description').clear();
        Utils.popup_open('add-folder-popup', 'app-summary');

        $$('app-ok').onclick(() => {
            if ($$('app-summary').isError('Summary'))
                return;

            let parentId = getParentId();

            const crows = cgrid.getAllRows();
            let relativeId;
            if (crows.length === 0)
                relativeId = null;
            else
                relativeId = crows[crows.length - 1].id;

            let locationType = 2;
            let rows = cgrid.getAllRows();
            if (rows.length < 1 || rows.length === 1 && rows[0].summary === "..")
                locationType = 0;

            let data = {
                locationType: locationType,
                locationTypeRelativeToId: relativeId,
                parentId: parentId,
                views: {
                    description: $$('app-description').getValue(),
                    projectId: null,
                    summary: $$('app-summary').getValue()
                }
            };
            AWS.callSoap(WS, 'newProjectViews', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateContentGrid(parentId);
                }
            });

            Utils.popup_close();
        });

        $$('app-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('quick-add').onclick(() => {
        addFolderToEnd();
    });

    function addFolderToBeginning() {
        $$('app-summary').clear();
        $$('app-description').clear();
        Utils.popup_open('add-folder-popup', 'app-summary');

        $$('app-ok').onclick(() => {
            if ($$('app-summary').isError('Summary'))
                return;

            let parentId = getParentId();

            const crows = cgrid.getAllRows();
            let relativeId;
            if (crows.length === 0)
                relativeId = null;
            else
                relativeId = crows[crows.length - 1].id;

            let data = {
                locationType: 0,
                locationTypeRelativeToId: null,
                parentId: parentId,
                views: {
                    description: $$('app-description').getValue(),
                    projectId: null,
                    summary: $$('app-summary').getValue()
                }
            };
            AWS.callSoap(WS, 'newProjectViews', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateContentGrid(parentId);
                }
            });

            Utils.popup_close();
        });

        $$('app-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('add').onclick(() => {
        const row = cgrid.getSelectedRow();
        if (row) {
            $$('atp-item').setValue(row.summary);
            $$('atp-position').setValue('3');
            $$('atp-before').enable();
            $$('atp-after').enable();
        } else {
            $$('atp-item').clear();
            $$('atp-position').setValue('4');
            $$('atp-before').disable();
            $$('atp-after').disable();
        }
        Utils.popup_open('add-type-popup');

        $$('atp-ok').onclick(() => {
            Utils.popup_close();
            const type = $$('atp-type').getValue();
            const pos = $$('atp-position').getValue();
            if (type === 'F'  &&  pos === '4')
                addFolderToEnd();
            else if (type === 'F'  && pos === '1')
                addFolderToBeginning();
        })


        $$('atp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(() => {
        const row = cgrid.getSelectedRow();
        $$('app-summary').setValue(row.summary);
        $$('app-description').setValue(row.description);
        Utils.popup_open('add-folder-popup', 'app-summary');

        $$('app-ok').onclick(() => {
            if ($$('app-summary').isError('Summary'))
                return;

            let data = {
                description: $$('app-description').getValue(),
                id: row.id,
                summary: $$('app-summary').getValue()
            };
            AWS.callSoap(WS, 'saveProjectView', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateContentGrid(getParentId());
                }
            });

            Utils.popup_close();
        });

        $$('app-cancel').onclick(() => {
            Utils.popup_close();
        });

    });

    $$('remove').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to remove the selected item(s)?', () => {
            const ids = [];
            const rows = cgrid.getSelectedRows();
            rows.forEach(row => {
                ids.push(row.id);
            });
            const data = {
                ids: ids,
                removeAll: false
            };
            AWS.callSoap(WS, 'removeProjectViews', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateContentGrid(getParentId());
                }
            });
        });
    });

    $$('remove-all').onclick(() => {
        Utils.yesNo('Confirmation', 'Remove All removes the item from every one of your Project Folders.  Are you sure you wish to remove all the selected item(s)?', () => {
            const ids = [];
            const rows = cgrid.getSelectedRows();
            rows.forEach(row => {
                ids.push(row.id);
            });
            const data = {
                ids: ids,
                removeAll: true
            };
            AWS.callSoap(WS, 'removeProjectViews', data).then(function (res) {
                if (res.wsStatus === "0") {
                    updateContentGrid(getParentId());
                }
            });
        });
    });

    $$('report').onclick(() => {
        const parentId = getParentId();
        const data = {
            parentId: parentId
        };
        AWS.callSoap(WS, 'getReport', data).then(function (res) {
            if (res.wsStatus === "0") {
                Utils.showReport(res.reportUrl);
            }
        });
    });

    $$('move-up').onclick(() => {
        let rows = cgrid.getAllRows();
        if (rows.length > 0  &&  !rows[0].id)
            rows.shift();
        if (rows.length < 2)
            return;
        let idx;
        const row = cgrid.getSelectedRow();
        for (idx=0 ; row.id !== rows[idx].id ; idx++);
        if (idx === 0)
            return;
        const newRows = [];
        for (let i=0 ; i < rows.length ; i++) {
            if (i+1 < rows.length && rows[i+1].id === row.id) {
                newRows.push(rows[i+1].id);
                newRows.push(rows[i++].id);
            } else
                newRows.push(rows[i].id);
        }
        const data = {
            ids: newRows
        };
        // There is a better back-end API for this but it doesn't work
        AWS.callSoap(WS, 'reorderProjectViews', data).then(function (res) {
            if (res.wsStatus === "0") {
                updateContentGrid(getParentId());
                setTimeout(() => cgrid.selectId(row.id), 100);
            }
        });
    });

    $$('move-down').onclick(() => {
        let rows = cgrid.getAllRows();
        if (rows.length > 0  &&  !rows[0].id)
            rows.shift();
        if (rows.length < 2)
            return;
        let idx;
        const row = cgrid.getSelectedRow();
        for (idx=0 ; row.id !== rows[idx].id ; idx++);
        if (idx === rows.length-1)
            return;
        const newRows = [];
        for (let i=0 ; i < rows.length ; i++) {
            if (rows[i].id === row.id) {
                newRows.push(rows[i+1].id);
                newRows.push(rows[i++].id);
            } else
                newRows.push(rows[i].id);
        }
        const data = {
            ids: newRows
        };
        // There is a better back-end API for this but it doesn't work
        AWS.callSoap(WS, 'reorderProjectViews', data).then(function (res) {
            if (res.wsStatus === "0") {
                updateContentGrid(getParentId());
                setTimeout(() => cgrid.selectId(row.id), 100);
            }
        });
    });

    $$('description').onCChange(() => {
        $$('save').enable();
        $$('reset').enable();
        $$('description-text').setValue('Description: (unsaved changes)').setColor('red');
    });

    $$('save').onclick(() => {
        const row = cgrid.getSelectedRow();
        const data = {
            description: $$('description').getValue(),
            id: row.id,
            summary: row.summary
        };
        AWS.callSoap(WS, 'saveProjectView', data).then(function (res) {
            if (res.wsStatus === "0") {
                $$('save').disable();
                $$('reset').disable();
                $$('description-text').setValue('Description:').setColor('black');
                row.description = $$('description').getValue();
            }
        });
    });

    $$('reset').onclick(() => {
        const row = cgrid.getSelectedRow();
        $$('description').setValue(row.description);
        $$('save').disable();
        $$('reset').disable();
        $$('description-text').setValue('Description:').setColor('black');
    });

    lgrid.setOnSelectionChanged($$('open-location').enable);

    $$('open-location').onclick(() => {
        openLocation();
    });

    $$('cut').onclick(() => {
        highlightedRowIndexes = cgrid.getSelectedRowIndexes();
        highlightedRows = cgrid.getSelectedRows();
        highlightedParentId = getParentId();
        isCut = true;
        cgrid.highlightRows(highlightedRowIndexes);
        $$('cut-status').setValue('Pending Cut of ' + highlightedRowIndexes.length + ' Item(s)');
        $$('cut').disable();
        $$('copy').disable();
        $$('paste').enable();
        $$('cancel').enable();
    });

    $$('copy').onclick(() => {
        highlightedRowIndexes = cgrid.getSelectedRowIndexes();
        highlightedRows = cgrid.getSelectedRows();
        highlightedParentId = getParentId();
        isCut = false;
        cgrid.highlightRows(highlightedRowIndexes);
        $$('cut-status').setValue('Pending Copy of ' + highlightedRowIndexes.length + ' Item(s)');
        $$('cut').disable();
        $$('copy').disable();
        $$('paste').enable();
        $$('cancel').enable();
    });

    function endCutPaste() {
        highlightedRowIndexes = [];
        highlightedRows = [];
        highlightedParentId = null;
        cgrid.highlightRows(null);
        $$('cut-status').clear();
        $$('cut').disable();
        $$('copy').disable();
        $$('paste').disable();
        $$('cancel').disable();
    }

    $$('cancel').onclick(endCutPaste);

    function pastFromCut() {
        const row = cgrid.getSelectedRow();
        if (row) {
            $$('pp-summary').setValue(row.summary);
            $$('pp-before').enable();
            $$('pp-after').enable();
        } else {
            $$('pp-summary').clear();
            $$('pp-before').disable();
            $$('pp-after').disable();
        }
        $$('pp-position').setValue('4');
        Utils.popup_open('paste-popup');
        $$('pp-ok').onclick(() => {
            const ids = [];
            for (let i = 0; i < highlightedRows.length; i++)
                ids.push(highlightedRows[i].id);
            const row = cgrid.getSelectedRow();
            let relativeId, locationType;
            if (row) {
                switch ($$('pp-position').getValue()) {
                    case '1':
                        locationType = 0;
                        relativeId = null;
                        break;
                    case '2':
                        locationType = 1;
                        relativeId = row.id;
                        break;
                    case '3':
                        locationType = 2;
                        relativeId = row.id;
                        break;
                    case '4':
                        locationType = 2;
                        const rows = cgrid.getAllRows();
                        relativeId = rows[rows.length - 1].id;
                        break;
                }
            } else {
                if ($$('pp-position').getValue() === '1') {
                    locationType = 0;
                    relativeId = null;
                } else {
                    const rows = cgrid.getAllRows();
                    if (rows) {
                        locationType = 2;
                        relativeId = rows[rows.length - 1].id;
                    } else {
                        locationType = 0;
                        relativeId = null;
                    }
                }
            }
            const data = {
                ids: ids,
                locationType: locationType,
                locationTypeRelativeToId: relativeId,
                parentId: getParentId()
            };
            AWS.callSoap(WS, 'cutProjectViews', data).then(function (res) {
                if (res.wsStatus === "0") {
                    endCutPaste();
                    updateContentGrid(getParentId());
                }
                Utils.popup_close();
            });
        });
        $$('pp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    function pastFromCopy() {
        const row = cgrid.getSelectedRow();
        if (row) {
            $$('pp2-summary').setValue(row.summary);
            $$('pp2-before').enable();
            $$('pp2-after').enable();
        } else {
            $$('pp2-summary').clear();
            $$('pp2-before').disable();
            $$('pp2-after').disable();
        }
        $$('pp2-position').setValue('4');
        Utils.popup_open('paste-popup2');
        $$('pp2-ok').onclick(() => {
            const ids = [];
            for (let i = 0; i < highlightedRows.length; i++)
                ids.push(highlightedRows[i].id);
            const row = cgrid.getSelectedRow();
            let relativeId, locationType;
            if (row) {
                switch ($$('pp2-position').getValue()) {
                    case '1':
                        locationType = 0;
                        relativeId = null;
                        break;
                    case '2':
                        locationType = 1;
                        relativeId = row.id;
                        break;
                    case '3':
                        locationType = 2;
                        relativeId = row.id;
                        break;
                    case '4':
                        locationType = 2;
                        const rows = cgrid.getAllRows();
                        relativeId = rows[rows.length - 1].id;
                        break;
                }
            } else {
                if ($$('pp2-position').getValue() === '1') {
                    locationType = 0;
                    relativeId = null;
                } else {
                    const rows = cgrid.getAllRows();
                    if (rows) {
                        locationType = 2;
                        relativeId = rows[rows.length - 1].id;
                    } else {
                        locationType = 0;
                        relativeId = null;
                    }
                }
            }
            const data = {
                ids: ids,
                locationType: locationType,
                locationTypeRelativeToId: relativeId,
                parentId: getParentId(),
                deepCopy: $$('pp2-copy-type').getValue() === '1'
            };
            AWS.callSoap(WS, 'copyProjectViews', data).then(function (res) {
                if (res.wsStatus === "0") {
                    endCutPaste();
                    updateContentGrid(getParentId());
                }
                Utils.popup_close();
            });
        });
        $$('pp2-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('paste').onclick(() => {
        isCut ? pastFromCut() : pastFromCopy();
     });

    $$('import').onclick(() => {
        $$('ip-file').clear();
        const row = cgrid.getSelectedRow();
        if (row) {
            $$('ip-summary').setValue(row.summary);
            $$('ip-before').enable();
            $$('ip-after').enable();
        } else {
            $$('ip-summary').clear();
            $$('ip-before').disable();
            $$('ip-after').disable();
        }
        $$('ip-position').setValue('4');
        Utils.popup_open('import-popup');

        $$('ip-ok').onclick(async () => {
            if ($$('ip-file').isError('Import File'))
                return;
            if ($$('ip-import-type').isError('Import Type'))
                return;
            const row = cgrid.getSelectedRow();
            let relativeId, locationType;
            if (row) {
                switch ($$('ip-position').getValue()) {
                    case '1':
                        locationType = 0;
                        relativeId = null;
                        break;
                    case '2':
                        locationType = 1;
                        relativeId = row.id;
                        break;
                    case '3':
                        locationType = 2;
                        relativeId = row.id;
                        break;
                    case '4':
                        locationType = 2;
                        const rows = cgrid.getAllRows();
                        relativeId = rows[rows.length - 1].id;
                        break;
                }
            } else {
                if ($$('ip-position').getValue() === '1') {
                    locationType = 0;
                    relativeId = null;
                } else {
                    const rows = cgrid.getAllRows();
                    if (rows) {
                        locationType = 2;
                        relativeId = rows[rows.length - 1].id;
                    } else {
                        locationType = 0;
                        relativeId = null;
                    }
                }
            }
            const data = {
                importType: Number($$('ip-import-type').getValue()),
                parentId: getParentId(),
                locationType: locationType,
                locationTypeRelativeToId: locationType
            };
            let res = await AWS.fileUpload('ip-file', 'projectViewUpload', data);
            if (res.wsStatus === '0')
                Utils.showMessage('Information', 'Project View Import started successfully.');
            Utils.popup_close();
        });

        $$('ip-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('export').onclick(() => {
        Utils.popup_open('export-popup');

        $$('ep-ok').onclick(() => {
            const data = {
                id: getParentId(),
                exportType: Number($$('ep-export-type').getValue())
            };
            AWS.callSoap(WS, 'exportProjectView', data).then(function (res) {
                if (res.wsStatus === "0") {
                    Utils.showReport(res.exportUrl);
                }
                Utils.popup_close();
            });
        });
        $$('ep-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    cgrid.setDragFunction((row, overRow) => {
        if (row.id === overRow.id)
            return;
        let rows = cgrid.getAllRows();
        if (rows.length > 0  &&  !rows[0].id)
            rows.shift();
        if (rows.length < 2)
            return;
        const newRows = [];
        for (let i = 0; i < rows.length; i++) {
            if (overRow.id === rows[i].id) {
                newRows.push(rows[i].id);
                newRows.push(row.id);
            } else if (row.id !== rows[i].id)
                newRows.push(rows[i].id);
        }
        const data = {
            ids: newRows
        };
        AWS.callSoap(WS, 'reorderProjectViews', data).then(function (res) {
            if (res.wsStatus === "0") {
                updateContentGrid(getParentId());
            }
        });

    });

})();
