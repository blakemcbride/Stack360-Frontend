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

    const WS = 'StandardSecuritySecurityToken';

    const columns = [
        { field: 'name', headerName: 'Security Token', width: 150 },
        { field: 'description', headerName: 'Description', width: 300 }
    ]
    const grid = new AGGrid('grid', columns, 'tokenId');

    grid.show();
    grid.setOnRowDoubleClicked(edit);
    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {

        grid.clear();

        AWS.callSoap(WS, 'listSecurityTokens').then(res => {
            if (res.wsStatus === '0') {
                let records = Utils.assureArray(res.item);
                grid.addRecords(records);
                $$('status').setValue(`Displaying ${records.length} Security Tokens`);

                $$('edit').disable();
                $$('delete').disable();
            }
        })
    }

    updateGrid();

    const tokenPopup = (row) => {
        
        let resetDialog = () => {
            
            if (row) {
                $$('tp-title').setValue(`Edit Security Token`);
            } else {
                $$('tp-title').setValue(`Add Security Token`);
            }

            $$('tp-name').clear();
            $$('tp-description').clear();

        };

        let initDialog = async () => {
            resetDialog();

            if (!row) {
                return;
            }

            $$('tp-name').setValue(row.name);
            $$('tp-description').setValue(row.description);
        };

        initDialog();

        Utils.popup_open('token-popup');

        return new Promise(async function (resolve, reject) {

            let ok = async () => {
                if ($$('tp-name').isError('Name')) {
                    return;
                }

                if ($$('tp-description').isError('Description')) {
                    return;
                }

                const data = {
                    name: $$('tp-name').getValue(),
                    description: $$('tp-description').getValue()
                };

                resolve(data);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('tp-ok').onclick(ok);
            $$('tp-cancel').onclick(cancel);
        });

    };

    $$('add').onclick(async () => {
        let data = await tokenPopup();

        if (data) {
            AWS.callSoap(WS, 'newSecurityToken', data).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    async function edit() {
        let row = grid.getSelectedRow();

        if (!row) {
            return;
        }

        let data = await tokenPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveSecurityToken', { ... data, tokenId: row.tokenId }).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure want to delete the selected Security Token?', () => {
            const data = {
                ids: [grid.getSelectedRow().tokenId]
            };

            AWS.callSoap(WS, 'deleteSecurityTokens', data).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });

    $$('report').onclick(() => {
        AWS.callSoap(WS, 'getSecurityTokenReport').then(res => {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });

})();
