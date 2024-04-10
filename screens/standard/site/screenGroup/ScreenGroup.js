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

window.ScreenGroup = {};

(function () {

    const WS = 'StandardSiteScreenGroup';
    let screenStack = [];
    let nameStack = [];

    const columnDefs = [
        {headerName: 'Name', field: 'title', width: 55, rowDrag: true  },
        {headerName: 'Type', field: 'type', width: 25 },
        {headerName: 'Label', field: 'label', width: 70 },
        {headerName: 'ID', field: 'extId', type: 'numericColumn', width: 20 },
        {headerName: 'Default', field: 'defaultScreen', width: 18 },
        {headerName: 'Detail', field: 'hasAvatar', width: 100 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    function updateGrid(screenGroupId, name, selectId) {
        if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== screenGroupId) {
            screenStack.push(screenGroupId);
            nameStack.push(name ? name : "Top");
        }
        screenGroupId ? $$('up').enable() : $$('up').disable();
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        $$('copy').disable();
        if (screenGroupId)
            $$('associate').enable();
        else
            $$('associate').disable();
        $$('disassociate').disable();
        $$('move-up').disable();
        $$('move-down').disable();
        $$('open').disable();
        const data = {
            screenGroupId: screenGroupId
        };
        AWS.callSoap(WS, "listScreensAndGroupsForScreenGroup", data).then(function (res) {
            if (res.wsStatus === '0') {
                grid.addRecords(res.screenDefs);
                if (selectId)
                    grid.selectId(selectId);
                updateBreadCrumb();
            }
        });
    }

    updateGrid(null);

    function descend() {
        const row = grid.getSelectedRow();
        if (row.type === "Group")
            updateGrid(row.id, row.title);
    }

    grid.setOnRowDoubleClicked(descend);
    grid.setOnSelectionChanged((rows) => {
        if (!rows.length) {
            $$('open').disable();
            $$('copy').disable();
            $$('edit').disable();
            $$('delete').disable();
            $$('disassociate').disable();
            $$('move-up').disable();
            $$('move-down').disable();
            return;
        }
        const row = rows[0];
        if (row.type === "Group") {
            $$('open').enable();
            $$('copy').enable();
        } else {
            $$('open').disable();
            $$('copy').disable();
        }
        $$('edit').enable();
        $$('delete').enable();
        if (screenStack.length <= 1) {
            $$('disassociate').disable();
            $$('move-up').disable();
            $$('move-down').disable();
        } else {
            $$('disassociate').enable();
            $$('move-up').enable();
            $$('move-down').enable();
        }
    });

    $$('up').onclick(() => {
        screenStack.pop();
        nameStack.pop();
        updateGrid(screenStack.pop(), nameStack.pop());
    });

    $$('open').onclick(descend);

    $$('report').onclick(() => {
        Utils.popup_open('report-popup');

        let top;
        if ($$('rp-start').getValue() === '1')
            top = null;
        else {
            if (!screenStack.length)
                top = null;
            else
                top = screenStack[screenStack.length-1];
        }

        $$('rp-ok').onclick(() => {
            const data = {
                startFromScreenGroupId: top,
                showIds: $$('rp-show-ids').getValue(),
                showLabels: $$('rp-show-labels').getValue(),
                showSubHeaders: $$('rp-show-sub-headers').getValue()
            };
            AWS.callSoap(WS, "getReport", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.showReport(res.reportUrl);
                    Utils.popup_close();
                }
            });
        });

        $$('rp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function parentScreenSearch() {
        return new Promise(function (resolve, reject) {
            $$('psp-name').clear();
            $$('psp-id').clear();
            $$('psp-name-type').setValue('2');
            $$('psp-status').setValue('Displaying 0 Parent Screens');
            Utils.popup_open('parent-screen-popup');
            const columnDefs = [
                {headerName: 'Parent Screen Name', field: 'name', width: 40  },
                {headerName: 'File Name', field: 'fileName', width: 100 },
                {headerName: 'ID', field: 'extId', type: 'numericColumn', width: 10 }
            ];
            const sgrid = new AGGrid('psp-grid', columnDefs, 'screenId');
            sgrid.show();

            $$('psp-reset').onclick(() => {
                $$('psp-name').clear();
                $$('psp-id').clear();
                $$('psp-name-type').setValue('2');
            });
            $$('psp-search').onclick(() => {
                sgrid.clear();
                const data = {
                    name: $$('psp-name').getValue(),
                    nameSearchType: Number($$('psp-name-type').getValue()),
                    extId: $$('psp-id').getValue()
                };
                AWS.callSoap(WS, "searchParentScreens", data).then(function (res) {
                    if (res.wsStatus === '0') {
                        res.item = Utils.assureArray(res.item);
                        sgrid.addRecords(res.item);
                        $$('psp-status').setValue('Displaying ' + res.item.length + ' Parent Screens');
                    }
                });
            });
            function ok() {
                const row = sgrid.getSelectedRow();
                if (!row) {
                    Utils.showMessage('Error', 'No selected parent screen.');
                    return;
                }
                Utils.popup_close();
                resolve(row);
            }
            $$('psp-ok').onclick(ok);
            sgrid.setOnRowDoubleClicked(ok);
            $$('psp-cancel').onclick(() => {
                Utils.popup_close();
                resolve(null);
            });
        });
    }

    $$('add-group').onclick(() => {
        let parentScreen = null;
        $$('sgp-title').setValue('Add Screen Group');
        $$('sgp-name').clear();
        $$('sgp-label').clear();
        $$('sgp-group-id').setValue('(generated on save)');
        $$('sgp-description').clear();
        $$('sgp-screen').clear();
        $$('sgp-id').clear();
        $$('sgp-default-screen').clear().disable();
        Utils.popup_open('screen-group-popup', 'sgp-name');

        $$('sgp-choose').onclick(async () => {
            const r = await parentScreenSearch();
            if (!r)
                return;
            parentScreen = r;
            $$('sgp-screen').setValue(parentScreen.name);
            $$('sgp-id').setValue(parentScreen.extId);
            $$('sgp-default-screen').enable();
        });

        $$('sgp-clear').onclick(() => {
            parentScreen = null;
            $$('sgp-screen').clear();
            $$('sgp-id').clear();
            $$('sgp-default-screen').clear().disable();
        });

        $$('sgp-ok').onclick(() => {
           if ($$('sgp-name').isError('Name'))
               return;
            const data = {
                name: $$('sgp-name').getValue(),
                label: $$('sgp-label').getValue(),
                description: $$('sgp-description').getValue(),
                parentScreenId: parentScreen ? parentScreen.screenId : null,
                parentScreenGroupId:  screenStack[screenStack.length-1],
                defaultScreen: $$('sgp-default-screen').getValue(),
                wizardType: $$('sgp-wizard-type').getValue()
            };
            AWS.callSoap(WS, "newScreenGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    updateGrid(screenStack[screenStack.length-1]);
                }
            });
        });

        $$('sgp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    function editScreen(row) {
        Utils.popup_open('edit-screen-popup');
        $$('esp-name').setValue(row.title);
        $$('esp-label').setValue(row.label);
        $$('esp-default-screen').setValue(row.defaultScreen === 'Yes');

        $$('esp-ok').onclick(() => {
            const data = {
                screenId: row.id,
                label: $$('esp-label').getValue(),
                parentScreenGroupId: screenStack[screenStack.length - 1],
                defaultScreen: $$('esp-default-screen').getValue()
            };
            AWS.callSoap(WS, "saveScreen", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    updateGrid(screenStack[screenStack.length - 1]);
                }
            });
        });

        $$('esp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    function edit() {
        let parentScreen;
        const row = grid.getSelectedRow();
        if (row.type === 'Screen') {
            editScreen(row);
            return;
        }
        $$('sgp-title').setValue('Edit Screen Group');
        $$('sgp-name').setValue(row.title);
        $$('sgp-label').setValue(row.label);
        $$('sgp-group-id').setValue(row.extId);
        $$('sgp-description').setValue(row.description);
        $$('sgp-screen').setValue(row.parentScreen);
        const shortId = Utils.makeShortId(row.parentScreenId);
        $$('sgp-id').setValue(shortId);
        $$('sgp-default-screen').setValue(!!row.defaultScreen);
        if (row.parentScreenId)
            $$('sgp-default-screen').enable();
        else
            $$('sgp-default-screen').disable();
        $$('sgp-wizard-type').setValue(row.wizardType);
        if (row.parentScreenId)
            parentScreen = {
                screenId: row.parentScreenId,
                name: row.parentScreen,
                extId: shortId
            };
        else
            parentScreen = null;
        Utils.popup_open('screen-group-popup', 'sgp-name');

        $$('sgp-choose').onclick(async () => {
            const r = await parentScreenSearch();
            if (!r)
                return;
            parentScreen = r;
            $$('sgp-screen').setValue(parentScreen.name);
            $$('sgp-id').setValue(parentScreen.extId);
            $$('sgp-default-screen').enable();
        });

        $$('sgp-clear').onclick(() => {
            parentScreen = null;
            $$('sgp-screen').clear();
            $$('sgp-id').clear();
            $$('sgp-default-screen').clear().disable();
        });

        $$('sgp-ok').onclick(() => {
            if ($$('sgp-name').isError('Name'))
                return;
            const data = {
                screenGroupId: row.id,
                name: $$('sgp-name').getValue(),
                label: $$('sgp-label').getValue(),
                description: $$('sgp-description').getValue(),
                parentScreenId: parentScreen ? parentScreen.screenId : null,
                parentScreenGroupId:  screenStack[screenStack.length-1],
                defaultScreen: $$('sgp-default-screen').getValue(),
                wizardType: $$('sgp-wizard-type').getValue()
            };
            AWS.callSoap(WS, "saveScreenGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    updateGrid(screenStack[screenStack.length-1]);
                }
            });
        });

        $$('sgp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);

    function deleteScreen(row) {
        Utils.yesNo('Confirmation', 'Are you sure you wish to disassociate the selected screen?', () => {
            const data = {
                screenIds: row.id,
                parentScreenGroupId: screenStack[screenStack.length - 1],
                deepDelete: false
            };
            AWS.callSoap(WS, "deleteScreensAndGroups", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid(screenStack[screenStack.length - 1]);
                }
            });
        });
    }

    $$('delete').onclick(() => {
        const row = grid.getSelectedRow();
        if (row.type === 'Screen') {
            deleteScreen(row);
            return;
        }
        Utils.popup_open('delete-popup');

        $$('dp-ok').onclick(() => {
            const data = {
                screenGroupIds: row.id,
                parentScreenGroupId: screenStack[screenStack.length - 1],
                deepDelete: $$('dp-delete-type').getValue() === 'D'
            };
            AWS.callSoap(WS, "deleteScreensAndGroups", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    updateGrid(screenStack[screenStack.length - 1]);
                }
            });
        });

       $$('dp-cancel').onclick(() => {
           Utils.popup_close();
       });
    });

    $$('copy').onclick(() => {
        const row = grid.getSelectedRow();
        $$('cgp-old-name').setValue(row.title);
        $$('cgp-new-name').setValue(row.title + ' (1)');
        Utils.popup_open('copy-group-popup', 'cgp-new-name');

        $$('cgp-ok').onclick(() => {
            if ($$('cgp-new-name').isError('New Screen Group Name'))
                return;
            const data = {
                associate: $$('cgp-level').getValue() === 'S',
                parentScreenGroupId: screenStack[screenStack.length - 1],
                screenGroupId: row.id,
                screenGroupName: $$('cgp-new-name').getValue(),
                shallowCopy: !$$('cgp-deep-copy').getValue()
            };
            AWS.callSoap(WS, "copyScreenGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    updateGrid(screenStack[screenStack.length - 1]);
                }
            });
        });

        $$('cgp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('associate').onclick(() => {
        $$('ap-name').clear();
        $$('ap-id').clear();
        $$('ap-status').setValue('Displaying 0 Screens and Groups').setColor('black');
        Utils.popup_open('associate-popup');

        const columnDefs = [
            {headerName: 'Name', field: 'title', width: 50  },
            {headerName: 'Type', field: 'type', width: 15 },
            {headerName: 'Detail', field: 'typeDetail', width: 100 },
            {headerName: 'ID', field: 'extId', type: 'numericColumn', width: 15 }
        ];
        const apGrid = new AGGrid('ap-grid', columnDefs, 'id');
        apGrid.show();

        $$('ap-search').onclick(() => {
            apGrid.clear();
            $$('ap-ok').disable();
            const data = {
                associatedIndicator: Number($$('ap-associated').getValue()),
                extId: $$('ap-id').getValue(),
                name: $$('ap-name').getValue(),
                nameSearchType: Number($$('ap-name-search-type').getValue()),
                screenGroupId: screenStack[screenStack.length - 1],
                typeIndicator: Number($$('ap-type').getValue())
            };
            AWS.callSoap(WS, "searchScreenGroups", data).then(function (res) {
                if (res.wsStatus === '0') {
                    const cap = Number(res.cap);
                    res.screenDef = Utils.assureArray(res.screenDef);
                    apGrid.addRecords(res.screenDef);
                    if (res.screenDef.length >= cap)
                        $$('ap-status').setValue('Displaying ' + res.screenDef.length + ' Screens and Groups (limit)').setColor('red');
                    else
                        $$('ap-status').setValue('Displaying ' + res.screenDef.length + ' Screens and Groups').setColor('black');
                }
            });
        });

        apGrid.setOnSelectionChanged($$('ap-ok').enable);

        function save() {
            const row = apGrid.getSelectedRow();
            const data = {
                parentGroupId: screenStack[screenStack.length - 1]
            };
            if (row.type === "Screen")
                data.screenIds = row.id;
            else
                data.groupIds = row.id;
            AWS.callSoap(WS, "addScreensAndGroupsToGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.popup_close();
                    updateGrid(screenStack[screenStack.length - 1]);
                }
            });
        }

        $$('ap-ok').onclick(save);
        apGrid.setOnRowDoubleClicked(save);

        $$('ap-cancel').onclick(() => {
            Utils.popup_close();
        });

        $$('ap-reset').onclick(() => {
            $$('ap-name-search-type').setValue('2');
            $$('ap-name').clear();
            $$('ap-id').clear();
            $$('ap-type').setValue('0');
            $$('ap-associated').setValue('0');
        });
    });

    $$('disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to disassociate the selected Screen or Group?', () => {
            const row = grid.getSelectedRow();
            const data = {
                parentScreenGroupId: screenStack[screenStack.length - 1],
            };
            if (row.type === "Screen")
                data.screenIds = row.id;
            else
                data.screenGroupIds = row.id;
            AWS.callSoap(WS, "removeScreensAndGroupsFromGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid(screenStack[screenStack.length - 1]);
                }
            });
        });
    });

    $$('move-up').onclick(() => {
        const row = grid.getSelectedRow();
        if (row.type === 'Group') {
            const data = {
                parentScreenGroupId: screenStack[screenStack.length - 1],
                childScreenGroupId: row.id
            };
            AWS.callSoap(WS, "moveScreenGroupUp", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid(screenStack[screenStack.length - 1], null, row.id);
                }
            });
        } else {
            const data = {
                screenGroupId: screenStack[screenStack.length - 1],
                screenId: row.id
            };
            AWS.callSoap(WS, "moveScreenUp", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid(screenStack[screenStack.length - 1], null, row.id);
                }
            });
        }
    });

    $$('move-down').onclick(() => {
        const row = grid.getSelectedRow();
        if (row.type === 'Group') {
            const data = {
                parentScreenGroupId: screenStack[screenStack.length - 1],
                childScreenGroupId: row.id
            };
            AWS.callSoap(WS, "moveScreenGroupDown", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid(screenStack[screenStack.length - 1], null, row.id);
                }
            });
        } else {
            const data = {
                screenGroupId: screenStack[screenStack.length - 1],
                screenId: row.id
            };
            AWS.callSoap(WS, "moveScreenDown", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid(screenStack[screenStack.length - 1], null, row.id);
                }
            });
        }
    });

    grid.setDragFunction((row, overRow) => {
        let obj;
        if (screenStack.length <= 1)
            return;
        if (row.id === overRow.id)
            return;
        let rows = grid.getAllRows();
        if (rows.length < 2)
            return;
        const newRows = [];
        for (let i = 0; i < rows.length; i++) {
            if (overRow.id === rows[i].id) {
                obj = {
                    id: rows[i].id,
                    type: rows[i].type
                };
                newRows.push(obj);
                obj = {
                    id: row.id,
                    type: row.type
                };
                newRows.push(obj);
            } else if (row.id !== rows[i].id) {
                obj = {
                    id: rows[i].id,
                    type: rows[i].type
                };
                newRows.push(obj);
            }
        }
        const data = {
            parentScreenGroupId: screenStack[screenStack.length - 1],
            item: newRows
        };
        AWS.callSoap(WS, 'reorderScreensAndScreenGroups', data).then(function (res) {
            if (res.wsStatus === "0") {
                updateGrid(screenStack[screenStack.length - 1]);
            }
        });
    });

    ScreenGroup.goBack = function (lvl) {
        while (lvl--) {
            screenStack.pop();
            nameStack.pop();
        }
        updateGrid(screenStack[screenStack.length - 1]);
    }

    function updateBreadCrumb() {
        const levels = screenStack.length
        const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
        let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="ScreenGroup.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
        let i = 1;

        for (; i < levels; i++)
            bc += separator + '<a class="" onclick="ScreenGroup.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';

        bc += '</div>';
        $('#bread-crumb-2').html(bc);
    }

    $$('search').onclick(() => {
        $$('sp-name').clear();
        $$('sp-id').clear();
        $$('sp-status').setValue('Displaying 0 Screen Groups').setColor('black');
       Utils.popup_open('search-popup');
        const columnDefs = [
            {headerName: 'Name', field: 'title', width: 50  },
            {headerName: 'ID', field: 'extId', type: 'numericColumn', width: 10 }
        ];
        const sGrid = new AGGrid('sp-grid', columnDefs, 'id');
        sGrid.show();

        $$('sp-reset').onclick(() => {
            $$('sp-name-search-type').setValue('2');
            $$('sp-name').clear();
            $$('sp-id').clear();
            $$('sp-associated').setValue('0');
        });

        $$('sp-search').onclick(() => {
            sGrid.clear();
            $$('sp-ok').disable();
            const data = {
                associatedIndicator: Number($$('sp-associated').getValue()),
                extId: $$('sp-id').getValue(),
                name: $$('sp-name').getValue(),
                nameSearchType: Number($$('sp-name-search-type').getValue()),
                screenGroupId: screenStack[screenStack.length - 1],
                typeIndicator: 2
            };
            AWS.callSoap(WS, "searchScreenGroups", data).then(function (res) {
                if (res.wsStatus === '0') {
                    const cap = Number(res.cap);
                    res.screenDef = Utils.assureArray(res.screenDef);
                    sGrid.addRecords(res.screenDef);
                    if (res.screenDef.length >= cap)
                        $$('sp-status').setValue('Displaying ' + res.screenDef.length + ' Screen Groups (limit)').setColor('red');
                    else
                        $$('sp-status').setValue('Displaying ' + res.screenDef.length + ' Screen Groups').setColor('black');
                }
            });
        });

        sGrid.setOnSelectionChanged($$('sp-ok').enable);

        function save() {
            const row = sGrid.getSelectedRow();
            screenStack = [null, row.id ];
            nameStack = ['Top', row.title ];
            Utils.popup_close();
            updateGrid(screenStack[screenStack.length - 1]);
        }

        $$('sp-ok').onclick(save);
        sGrid.setOnRowDoubleClicked(save);

       $$('sp-cancel').onclick(() => {
           Utils.popup_close();
       });
    });

})();
