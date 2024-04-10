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

    const WS = 'StandardSecuritySecurityGroup';

    const groupColumns = [
        { field: 'name', headerName: 'Name' },
        { field: 'shortGroupId', headerName: 'ID', width: 50 }
    ];

    const groupGrid = new AGGrid('sg-group-grid', groupColumns, 'groupId');

    groupGrid.show();
    groupGrid.setOnRowDoubleClicked(edit);

    const rightColumns = [
        { field: 'name', headerName: 'Name' },
        { field: 'tokenAccessLevel', headerName: 'Access Level', width: 100 }
    ];

    const rightGrid = new AGGrid('sg-right-grid', rightColumns, 'rightId');

    rightGrid.show();
    rightGrid.setOnRowDoubleClicked(editAccess);

    const effectRightColumns = [
        { field: 'name', headerName: 'Name' },
        { field: 'accessLevel', headerName: 'Access Level', width: 100 }
    ];

    const effectRightGrid = new AGGrid('sg-effect-right-grid', effectRightColumns, 'name');

    effectRightGrid.show();

    const mpColumns = [
        { field: 'lastName', headerName: 'Last Name', width: 120 },
        { field: 'firstName', headerName: 'First Name', width: 120 },
        { field: 'loginName', headerName: 'Login Name', width: 120 },
        { field: 'companyName', headerName: 'Company' }
    ];

    const mpGrid = new AGGrid('mp-grid', mpColumns, 'loginName');
    mpGrid.show();

    function updateGroupGrid() {

        groupGrid.clear();
        rightGrid.clear();
        effectRightGrid.clear();

        AWS.callSoap(WS, 'listSecurityGroups').then(res => {
            if (res.wsStatus === '0') {
                let records = Utils.assureArray(res.item);
                groupGrid.addRecords(records);

                $$('edit').disable();
                $$('delete').disable();
                $$('view').disable();
            }
        });
    }

    updateGroupGrid();

    function updateRightGrids() {
        let row = groupGrid.getSelectedRow();
        if (!row)
            return;

        AWS.callSoap(WS, 'listRightsForSecurityGroup', {
            groupId: row.groupId
        }).then(res => {
            if (res.wsStatus === '0') {
                rightGrid.clear();

                let records = Utils.assureArray(res.item);
                rightGrid.addRecords(records);
            }
        });

        AWS.callSoap(WS, 'listEffectiveRightsForSecurityGroup', {
            groupId: row.groupId
        }).then(res => {
            if (res.wsStatus === '0') {
                effectRightGrid.clear();

                let records = Utils.assureArray(res.item);
                effectRightGrid.addRecords(records);
            }
        });

        $$('edit').enable();
        $$('delete').enable();
        $$('view').enable();

        $$('associate').enable();
        $$('disassociate').disable();
        $$('edit-access').disable();
    }

    groupGrid.setOnSelectionChanged(updateRightGrids);

    rightGrid.setOnSelectionChanged((rows) => {
        $$('disassociate').enable(rows);
        $$('edit-access').enable(rows);
    });

    const sgPopup = (row) => {

        let resetDialog = () => {
            
            if (row) {
                $$('sg-title').setValue(`Edit Security Group`);
            } else {
                $$('sg-title').setValue(`Add Security Group`);
            }

            $$('sg-name').clear();
            $$('sg-description').clear();

        };

        let initDialog = async () => {
            resetDialog();

            if (!row) {
                return;
            }

            $$('sg-name').setValue(row.name);
            $$('sg-description').setValue(row.description);
        };

        initDialog();

        Utils.popup_open('sg-popup');

        return new Promise(async function (resolve, reject) {

            let ok = async () => {
                if ($$('sg-name').isError('Name')) {
                    return;
                }

                if ($$('sg-description').isError('Description')) {
                    return;
                }

                const data = {
                    name: $$('sg-name').getValue(),
                    description: $$('sg-description').getValue()
                };

                resolve(data);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('sg-ok').onclick(ok);
            $$('sg-cancel').onclick(cancel);
        });

    };

    $$('add').onclick(async() => {
        let data = await sgPopup();

        if (data) {
            AWS.callSoap(WS, 'newSecurityGroup', data).then(res => {
                if (res.wsStatus === '0') {
                    updateGroupGrid();
                }
            });
        }
    });

    async function edit() {
        let row = groupGrid.getSelectedRow();

        if (!row) {
            return;
        }

        let data = await sgPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveSecurityGroup', { 
                ... data, 
                groupId: row.groupId 
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateGroupGrid();
                }
            });
        }
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Security Group?', () => {
            const data = {
                groupIds: [groupGrid.getSelectedRow().groupId]
            };

            AWS.callSoap(WS, 'deleteSecurityGroup', data).then(res => {
                if (res.wsStatus === '0') {
                    updateGroupGrid();
                }
            });
        });
    });


    const mpPopup = (row) => {
        
        let resetDialog = () => {
            $$('mp-name').clear();

            mpGrid.clear();
            $$('mp-status').setValue(`Displaying 0 Security Group Members`);
        };

        let initDialog = async () => {
            resetDialog();

            if (!row) {
                return;
            }

            $$('mp-name').setValue(row.name);

            AWS.callSoap(WS, 'listMembersForSecurityGroup', {
                groupId: row.groupId
            }).then(res => {
                if (res.wsStatus === '0') {
                    mpGrid.clear();
    
                    let records = Utils.assureArray(res.item);
                    mpGrid.addRecords(records);
                    $$('mp-status').setValue(`Displaying ${records.length} Security Tokens`);
                }
            });
        };

        initDialog();

        Utils.popup_open('memebers-popup')

        return new Promise(async function (resolve, reject) {

            let close = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('mp-close').onclick(close);
        });

    };

    $$('view').onclick( async () => {
        let row = groupGrid.getSelectedRow();

        if (!row) {
            return;
        }

        await mpPopup(row);

        return;
    });

    const arColumns = [
        { field: 'name', headerName: 'Name' },
        { field: 'type', headerName: 'Type', width: 75 }
    ];

    const arGrid = new AGGrid('as-rp-right-grid', arColumns, 'rightId');

    arGrid.show();
    arGrid.setOnSelectionChanged((rows) => {
        if (!rows.length)
            return;
        const row = rows[0];
        $$('as-rp-ok').enable();
        if (row.type !== 'Group')
            $$('as-rp-token-level').enable();
    });

    const arPopup = () => {        

        let resetDialog = () => {
            $$('as-rp-name').setValue('');
            $$('as-rp-name-type').setValue('2');
            $$('as-rp-type').setValue('0');
            $$('as-rp-token-level').setValue('0');
        };

        let initDialog = async () => {
            resetDialog();

            arGrid.clear();
        };

        initDialog();

        Utils.popup_open('associate-right-popup');

        function search() {
            const data = {
                name: $$('as-rp-name').getValue(),
                nameSearchType: $$('as-rp-name-type').getValue(),
                parentGroupId: groupGrid.getSelectedRow().groupId,
                typeIndicator: $$('as-rp-type').getValue()
            };

            arGrid.clear();

            AWS.callSoap(WS, 'searchSecurityGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    let records = Utils.assureArray(res.item);
                    arGrid.addRecords(records);
                    $$('as-rp-status').setValue(`Displaying ${records.length} Rights`);

                    $$('as-rp-ok').disable();
                    $$('as-rp-token-level').setValue('0');
                    $$('as-rp-token-level').disable();
                }
            });
        }

        $$('as-rp-search').onclick(search);
        $$('as-rp-reset').onclick(resetDialog);

        return new Promise(async function (resolve, reject) {

            let ok = async () => {
                let row = arGrid.getSelectedRow();
                let data;
                if (row.type === 'Group') {
                    data = {
                        parentGroupId: groupGrid.getSelectedRow().groupId,
                        tokenAccessLevel: $$('as-rp-token-level').getValue(),
                        groupIds: arGrid.getSelectedRow().rightId
                    };
                } else {
                    data = {
                        parentGroupId: groupGrid.getSelectedRow().groupId,
                        tokenAccessLevel: $$('as-rp-token-level').getValue(),
                        tokenIds: arGrid.getSelectedRow().rightId
                    };
                }

                resolve(data);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('as-rp-ok').onclick(ok);
            $$('as-rp-cancel').onclick(cancel);
        });

    };

    $$('associate').onclick( async () => {
        let data = await arPopup();

        if (data) {
            AWS.callSoap(WS, 'assignRightsToSecurityGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    updateRightGrids();
                }
            });
        }
    });

    $$('disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to disassociate the selected Security Group?', () => {
            let row = rightGrid.getSelectedRow();
            let data;
            if (row.type === 'Group') {
                data = {
                    parentGroupId: groupGrid.getSelectedRow().groupId,
                    groupIds: rightGrid.getSelectedRow().rightId
                };
            } else {
                data = {
                    parentGroupId: groupGrid.getSelectedRow().groupId,
                    tokenIds: rightGrid.getSelectedRow().rightId
                };
            }

            AWS.callSoap(WS, 'unassignRightsFromSecurityGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    updateRightGrids();
                }
            });
        });
    });

    const accessPopup = (row) => {

        let initDialog = async () => {

            if (!row) {
                return;
            }

            $$('ac-name').setValue(row.name);
            $$('ac-description').setValue(row.description);

            switch (row.tokenAccessLevel) {
                case 'None':
                    $$('ac-access-level').setValue(0);
                    break;
                case 'Read':
                    $$('ac-access-level').setValue(1);
                    break;
                case 'Write':
                    $$('ac-access-level').setValue(2);
                    break;
                default:
                    break;
            }
        };

        initDialog();

        Utils.popup_open('access-popup');

        return new Promise(async function (resolve, reject) {

            let ok = async () => {
                const data = {
                    parentGroupId: groupGrid.getSelectedRow().groupId,
                    accessLevel: $$('ac-access-level').getValue(),
                    tokenId: rightGrid.getSelectedRow().rightId
                };

                resolve(data);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('ac-ok').onclick(ok);
            $$('ac-cancel').onclick(cancel);
        });

    };


    async function editAccess() {
        let row = rightGrid.getSelectedRow();

        if (!row) {
            return;
        }

        if (row.type === 'Group') {
            Utils.showMessage('Error', 'Only Security Tokens can have an Access Level set.');
            return;
        }

        let data = await accessPopup(row);
        if (data) {
            AWS.callSoap(WS, 'editSecurityTokenAssignment', { ... data }).then(res => {
                if (res.wsStatus === '0') {
                    updateRightGrids();
                }
            });
        }
    }

    $$('edit-access').onclick(editAccess);

})();
