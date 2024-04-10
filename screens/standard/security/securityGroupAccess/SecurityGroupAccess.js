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

    const WS = 'StandardSecuritySecurityGroupAccess';

    const listSmartChooser = (data) => {
        let elements = Utils.assureArray(data);

        elements.map(element => {
            $$(element.tag).clear();

            AWS.callSoap(WS, element.url, element.param).then(res => {
            
                if (res.wsStatus === '0') {
                    if (!res[element.item]) {
                        $$(element.tag).clear();
                        return;
                    }
                    
                    $$(element.tag).addItems(Utils.assureArray(res[element.item]), element.ID, element.label);
            
                    if (res.selectedItem) {
                        $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
                        $$(element.tag).setValue(res.selectedItem[element.ID], res.selectedItem[element.label]);
                    }
            
                    if (element.selected) {
                        $$(element.tag).setValue(element.selected);
                    }
                }

            });
        });
    };

    listSmartChooser({tag: 'security-group', url: 'listSecurityGroups', item: 'securityGroups', ID: 'id', label: 'name'});

    $$('security-group').enable();

    const securityColumnDefs = [
        { headerName: 'Name', field: 'name' }
    ];

    const securityGrid = new AGGrid('security-grid', securityColumnDefs, 'id');
    securityGrid.show();

    const screenColumnDefs = [
        { headerName: 'Name', field: 'name' }
    ];

    const screenGrid = new AGGrid('screen-grid', screenColumnDefs, 'id');
    screenGrid.show();

    const securitySearchColumnDefs = [
        { headerName: 'Security Group Name', field: 'name' }
    ];

    const securitySearchGrid = new AGGrid('sg-sp-grid', securitySearchColumnDefs, 'id');
    securitySearchGrid.show();
    securitySearchGrid.setOnSelectionChanged($$('sg-sp-ok').enable);

    const securityGroupSearchPopup = (excludeIds) => {
        
        let resetDialog = () => {
            $$('sg-sp-name').setValue('');
            $$('sg-sp-name-type').setValue('2');
        };

        function search() {
            let data;

            if (excludeIds) {
                data = {
                    name: $$('sg-sp-name').getValue(),
                    nameSearchType: $$('sg-sp-name-type').getValue(),
                    excludeIds: excludeIds
                };
            } else {
                data = {
                    name: $$('sg-sp-name').getValue(),
                    nameSearchType: $$('sg-sp-name-type').getValue()
                };
            }

            AWS.callSoap(WS, 'searchSecurityGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    securitySearchGrid.clear();

                    let records = Utils.assureArray(res.securityGroups);
                    securitySearchGrid.addRecords(records);

                    $$('sg-sp-status').setValue(`Displaying ${records.length} Security Groups`);
                    $$('sg-sp-ok').disable();
                };
            });
        }

        let initDialog = async () => {
            resetDialog();

            search();
        };

        initDialog();

        Utils.popup_open('security-group-search-popup');
        

        $$('sg-sp-search').onclick(search);
        $$('sg-sp-reset').onclick(resetDialog);

        return new Promise(async function (resolve, reject) {
            let ok = async () => {
                let row = securitySearchGrid.getSelectedRow();

                resolve(row);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('sg-sp-ok').onclick(ok);
            $$('sg-sp-cancel').onclick(cancel);
        });

    };

    function updateGrids(groupId) {
        const data = {
            securityGroupId: groupId
        };

        AWS.callSoap(WS, 'listAssociatedSecurityGroups', data).then(res => {
            let records = Utils.assureArray(res.securityGroups);
            securityGrid.clear();
            securityGrid.addRecords(records);
        });

        AWS.callSoap(WS, 'listAssociatedScreenGroups', data).then(res => {
            let records = Utils.assureArray(res.screenGroups);
            screenGrid.clear();
            screenGrid.addRecords(records);
        });
    }

    $$('security-group-chooser-btn').onclick( async () => {
        let data = await securityGroupSearchPopup();

        if (data) {
            $$('security-group').setValue(data.id);
            updateGrids(data.id);
            $$('security-edit').enable();
            $$('screen-edit').enable();
        }

    });

    $$('security-group').onChange( async (val) => {
        if (val) {
            updateGrids(val);
            $$('security-edit').enable();
            $$('screen-edit').enable();
        } else {
            $$('security-edit').disable();
            $$('screen-edit').disable();
        }
    });

    const availableSecurityGroupCols = [
        { headerName: 'Available', field: 'name' }
    ];

    const availableSecurityGroupGrid = new AGGrid('available-grid', availableSecurityGroupCols, 'id');
    availableSecurityGroupGrid.show();
    availableSecurityGroupGrid.setOnSelectionChanged($$('es-gp-allow').enable);
    availableSecurityGroupGrid.setOnRowDoubleClicked(allow);

    const allowedSecurityGroupCols = [
        { headerName: 'Allowed', field: 'name' }
    ];

    const allowedSecurityGroupGrid = new AGGrid('allowed-grid', allowedSecurityGroupCols, 'id');
    allowedSecurityGroupGrid.show();
    allowedSecurityGroupGrid.setOnSelectionChanged($$('es-gp-disallow').enable);
    allowedSecurityGroupGrid.setOnRowDoubleClicked(disallow);


    function allow() {
        let row = availableSecurityGroupGrid.getSelectedRow();
        
        availableSecurityGroupGrid.deleteSelectedRows();
        allowedSecurityGroupGrid.addRecord(row);

        $$('es-gp-allow').disable();

    }

    function disallow() {
        let row = allowedSecurityGroupGrid.getSelectedRow();

        allowedSecurityGroupGrid.deleteSelectedRows();
        availableSecurityGroupGrid.addRecord(row);

        $$('es-gp-disallow').disable();
    }

    const editSecurityGroupPopup = () => {
        
        let initDialog = async () => {
            let currentGroupId = $$('security-group').getValue();
            let currentGroupIds = [];
            const data = {
                securityGroupId: currentGroupId
            };

            await AWS.callSoap(WS, 'listAssociatedSecurityGroups', data).then(res => {
                let records = Utils.assureArray(res.securityGroups);
                allowedSecurityGroupGrid.clear();
                allowedSecurityGroupGrid.addRecords(records);
                records.forEach(record => {
                    currentGroupIds.push(record.id);
                });
            });

            const availableRequest = {
                excludeIds: currentGroupIds
            };

            AWS.callSoap(WS, 'listAvailableSecurityGroups', availableRequest).then(res => {
                let records = Utils.assureArray(res.securityGroups);
                availableSecurityGroupGrid.clear();
                availableSecurityGroupGrid.addRecords(records);
            });
        };

        initDialog();

        Utils.popup_open('edit-security-group-popup');

        $$('es-gp-allow').onclick(allow);
        $$('es-gp-disallow').onclick(disallow);

        $$('es-gp-search').onclick( async () => {
            let records = allowedSecurityGroupGrid.getAllRows();
            let excludeIds = [];
            records.forEach(record => {
                excludeIds.push(record.id);
            });

            let data = await securityGroupSearchPopup(excludeIds);
    
            if (data) {
                allowedSecurityGroupGrid.addRecord(data);
                availableSecurityGroupGrid.deleteRow(data.id);
            }
    
        });

        return new Promise(async function (resolve, reject) {
            let ok = async () => {
                let records = allowedSecurityGroupGrid.getAllRows();
                let excludeIds = [];
                records.forEach(record => {
                    excludeIds.push(record.id);
                });
                let data = {
                    securityGroupId: $$('security-group').getValue(),
                    securityGroupIds: excludeIds
                }

                resolve(data);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('es-gp-ok').onclick(ok);
            $$('es-gp-cancel').onclick(cancel);
        });

    };

    $$('security-edit').onclick( async () => {
        let data = await editSecurityGroupPopup();

        if (data) {
            AWS.callSoap(WS, 'associateSecurityGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    const request = {
                        securityGroupId: data.securityGroupId
                    };
            
                    AWS.callSoap(WS, 'listAssociatedSecurityGroups', request).then(res => {
                        let records = Utils.assureArray(res.securityGroups);
                        securityGrid.clear();
                        securityGrid.addRecords(records);
                    });
                }
            });
        }

    });

    const screenSearchColumnDefs = [
        { headerName: 'Screen Group Name', field: 'name' }
    ];

    const screenSearchGrid = new AGGrid('screen-sp-grid', screenSearchColumnDefs, 'id');
    screenSearchGrid.show();
    screenSearchGrid.setOnSelectionChanged($$('screen-sp-ok').enable);

    const screenGroupSearchPopup = (excludeIds) => {
        
        let resetDialog = () => {
            $$('screen-sp-name').setValue('');
            $$('screen-sp-name-type').setValue('2');
            $$('screen-sp-id').setValue('');
            $$('screen-sp-type').setValue('1');
        };

        function search() {
            let data;

            if (excludeIds) {
                data = {
                    name: $$('screen-sp-name').getValue(),
                    nameSearchType: $$('screen-sp-name-type').getValue(),
                    extId: $$('screen-sp-id').getValue(),
                    searchTopLevelOnly: $$('screen-sp-type').getValue() === '1',
                    excludeIds: excludeIds
                };
            } else {
                data = {
                    name: $$('screen-sp-name').getValue(),
                    nameSearchType: $$('screen-sp-name-type').getValue(),
                    extId: $$('screen-sp-id').getValue(),
                    searchTopLevelOnly: $$('screen-sp-type').getValue() === '1',
                };
            }

            AWS.callSoap(WS, 'searchScreenGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    screenSearchGrid.clear();

                    let records = Utils.assureArray(res.screenGroups);
                    screenSearchGrid.addRecords(records);

                    $$('screen-sp-status').setValue(`Displaying ${records.length} Screen Groups`);
                    $$('screen-sp-ok').disable();
                };
            });
        }

        let initDialog = async () => {
            resetDialog();

            search();
        };

        initDialog();

        Utils.popup_open('screen-group-search-popup');
        

        $$('screen-sp-search').onclick(search);
        $$('screen-sp-reset').onclick(resetDialog);

        return new Promise(async function (resolve, reject) {
            let ok = async () => {
                let row = screenSearchGrid.getSelectedRow();

                resolve(row);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('screen-sp-ok').onclick(ok);
            $$('screen-sp-cancel').onclick(cancel);
        });

    };

    const availableScreenGroupCols = [
        { headerName: 'Available', field: 'name' }
    ];

    const availableScreenGroupGrid = new AGGrid('available-screen-grid', availableScreenGroupCols, 'id');
    availableScreenGroupGrid.show();
    availableScreenGroupGrid.setOnSelectionChanged($$('es-screen-allow').enable);
    availableScreenGroupGrid.setOnRowDoubleClicked(screenAllow);

    const allowedScreenGroupCols = [
        { headerName: 'Allowed', field: 'name' }
    ];

    const allowedScreenGroupGrid = new AGGrid('allowed-screen-grid', allowedScreenGroupCols, 'id');
    allowedScreenGroupGrid.show();
    allowedScreenGroupGrid.setOnSelectionChanged($$('es-screen-disallow').enable);
    allowedScreenGroupGrid.setOnRowDoubleClicked(screenDisallow);


    function screenAllow() {
        let row = availableScreenGroupGrid.getSelectedRow();
        
        availableScreenGroupGrid.deleteSelectedRows();
        allowedScreenGroupGrid.addRecord(row);

        $$('es-screen-allow').disable();

    }

    function screenDisallow() {
        let row = allowedScreenGroupGrid.getSelectedRow();

        allowedScreenGroupGrid.deleteSelectedRows();
        availableScreenGroupGrid.addRecord(row);

        $$('es-screen-disallow').disable();
    }

    const editScreenGroupPopup = () => {
        
        let initDialog = async () => {
            let currentGroupId = $$('security-group').getValue();
            let currentGroupIds = [];
            const data = {
                securityGroupId: currentGroupId
            };

            await AWS.callSoap(WS, 'listAssociatedScreenGroups', data).then(res => {
                let records = Utils.assureArray(res.screenGroups);
                allowedScreenGroupGrid.clear();
                allowedScreenGroupGrid.addRecords(records);
                records.forEach(record => {
                    currentGroupIds.push(record.id);
                });
            });

            const availableRequest = {
                excludeIds: currentGroupIds
            };

            AWS.callSoap(WS, 'listAvailableScreenGroups', availableRequest).then(res => {
                let records = Utils.assureArray(res.screenGroups);
                availableScreenGroupGrid.clear();
                availableScreenGroupGrid.addRecords(records);
            });
        };

        initDialog();

        Utils.popup_open('edit-screen-group-popup');

        $$('es-screen-allow').onclick(screenAllow);
        $$('es-screen-disallow').onclick(screenDisallow);

        $$('es-screen-search').onclick( async () => {
            let records = allowedScreenGroupGrid.getAllRows();
            let excludeIds = [];
            records.forEach(record => {
                excludeIds.push(record.id);
            });

            let data = await screenGroupSearchPopup(excludeIds);
    
            if (data) {
                allowedScreenGroupGrid.addRecord(data);
                availableScreenGroupGrid.deleteRow(data.id);
            }
    
        });

        return new Promise(async function (resolve, reject) {
            let ok = async () => {
                let records = allowedScreenGroupGrid.getAllRows();
                let excludeIds = [];
                records.forEach(record => {
                    excludeIds.push(record.id);
                });
                let data = {
                    securityGroupId: $$('security-group').getValue(),
                    screenGroupIds: excludeIds
                }

                resolve(data);
                Utils.popup_close();
            };

            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('es-screen-ok').onclick(ok);
            $$('es-screen-cancel').onclick(cancel);
        });

    };

    $$('screen-edit').onclick( async () => {
        let data = await editScreenGroupPopup();

        if (data) {
            AWS.callSoap(WS, 'associateScreenGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    const request = {
                        securityGroupId: data.securityGroupId
                    };
            
                    AWS.callSoap(WS, 'listAssociatedScreenGroups', request).then(res => {
                        let records = Utils.assureArray(res.screenGroups);
                        screenGrid.clear();
                        screenGrid.addRecords(records);
                    });
                }
            });
        }

    });

})();
