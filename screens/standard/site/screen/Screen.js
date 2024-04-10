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

    const WS = 'StandardSiteScreen';
    let gridFilled = false;

    const columnDefs = [
        {headerName: 'Name', field: 'name', width: 25  },
        {headerName: 'ID', field: 'extId', type: 'numericColumn', width: 8 },
        {headerName: 'Type', field: 'screenType', width: 10 },
        {headerName: 'File Name', field: 'fileName', width: 100 },
        {headerName: 'Avatar', field: 'hasAvatar', width: 8 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.show();

    function updateGrid() {
        grid.clear();
        $$('edit').disable();
        $$('delete').disable();
        const data = {
            extId: $$('id').getValue(),
            fileName: $$('file-name').getValue(),
            fileNameSearchType: $$('file-name-type').getValue(),
            includeChild: $$('child').getValue(),
            includeNormal: $$('normal').getValue(),
            includeParent: $$('parent').getValue(),
            includeWizard: $$('wizard').getValue(),
            includeWizardPage: $$('wizard-page').getValue(),
            name: $$('name').getValue(),
            nameSearchType: $$('name-type').getValue()
        };
        AWS.callSoap(WS, "searchScreens", data).then(function (res) {
            if (res.wsStatus === '0') {
                grid.addRecords(res.item);
                gridFilled = true;
            }
        });
    }

    $$('search').onclick(updateGrid);

    $$('reset').onclick(() => {
        $$('name-type').setValue('2');
        $$('name').clear();
        $$('normal').setValue(true);
        $$('parent').setValue(true);
        $$('child').setValue(true);
        $$('wizard').setValue(true);
        $$('wizard-page').setValue(true);
        $$('file-name-type').setValue('2');
        $$('file-name').clear();
        $$('id').clear();
    });

    $$('add').onclick(() => {
        $$('dp-title').setValue('Add Screen');
        $$('dp-name').clear();
        $$('dp-type').setValue('');
        $$('dp-id').setValue('(generated on save)');
        $$('dp-description').clear();
        $$('dp-file-name').clear();
        $$('dp-avatar-path').clear();
        Utils.popup_open('detail-popup', 'dp-name');

        $$('dp-ok').onclick(() => {
           if ($$('dp-name').isError('Name'))
               return;
           if ($$('dp-type').isError('Type'))
               return;
           if ($$('dp-description').isError('Description'))
               return;
           if ($$('dp-file-name').isError('File Name'))
               return;
            const data = {
                name: $$('dp-name').getValue(),
                screenType: Number($$('dp-type').getValue()),
                fileName: $$('dp-file-name').getValue(),
                description: $$('dp-description').getValue(),
                avatarPath: $$('dp-avatar-path').getValue(),
                authCode: null,
                techType: 'F'
            };
            AWS.callSoap(WS, "newScreen", data).then(function (res) {
                if (res.wsStatus === '0') {
                    Utils.showMessage('Information', "New screen '" + res.extId + "' created successfully");
                    if (gridFilled)
                        updateGrid();
                }
            });
            Utils.popup_close();
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    async function edit() {
        $$('dp-title').setValue('Edit Screen');
        const row = grid.getSelectedRow();

        const data = {
            screenId: row.extIdExpanded
        };
        let res = await AWS.callSoap(WS, "loadScreen", data);
        if (res.wsStatus !== '0')
            return;

        $$('dp-name').setValue(res.name);
        $$('dp-type').setValue(res.screenType);
        $$('dp-id').setValue(res.extId);
        $$('dp-description').setValue(res.description);
        $$('dp-file-name').setValue(res.fileName);
        $$('dp-avatar-path').setValue(res.avatarPath);
        Utils.popup_open('detail-popup', 'dp-name');
        $$('dp-ok').onclick(() => {
            if ($$('dp-name').isError('Name'))
                return;
            if ($$('dp-type').isError('Type'))
                return;
            if ($$('dp-description').isError('Description'))
                return;
            if ($$('dp-file-name').isError('File Name'))
                return;
            const data = {
                screenId: res.screenId,
                name: $$('dp-name').getValue(),
                screenType: Number($$('dp-type').getValue()),
                fileName: $$('dp-file-name').getValue(),
                description: $$('dp-description').getValue(),
                avatarPath: $$('dp-avatar-path').getValue(),
                authCode: null,
                techType: 'F'
            };
            AWS.callSoap(WS, "saveScreen", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
            Utils.popup_close();
        });

        $$('dp-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('edit').onclick(edit);
    grid.setOnRowDoubleClicked(edit);

    grid.setOnSelectionChanged((rows) => {
        rows.length === 1 ? $$('edit').enable() : $$('edit').disable();
        $$('delete').enable(rows);
    });

    $$('delete').onclick(() => {
        const row = grid.getSelectedRow();
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected screen?', () => {
            const data = {
                screenIds: row.id
            };
            AWS.callSoap(WS, "deleteScreen", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });

        });
    });

})();
