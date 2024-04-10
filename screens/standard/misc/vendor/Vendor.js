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

    const WS = 'StandardMiscVendor';

    let formGrid = null;

    async function executeSelectFunc(element, fn, id, name) {
        let selectedNode = await fn();
        if (selectedNode) {
            $$(element).setValue(selectedNode[id], selectedNode[name]);
        }
    }

    const listSmartChooser = (data) => {
        let elements = Utils.assureArray(data);

        elements.map(element => {
            $$(element.tag).clear();

            AWS.callSoap(WS, element.url, element.param).then( res => {
                if (res.wsStatus === '0') {
                    if (!res.item) {
                        $$(element.tag).clear();
                        $$(element.tag).forceSelect();
                        return;
                    }
        
                    if (res.item.length > res.lowCap) {
                        $$(element.tag).forceSelect();
                    }
        
                    $$(element.tag).addItems(Utils.assureArray(res.item), element.ID, element.label);

                    if (res.selectedItem) {
                        $$(element.tag).addItems(Utils.assureArray(res.selectedItem), element.ID, element.label);
                        $$(element.tag).setValue(res.selectedItem[element.ID]);
                    }

                    if (element.selected) {
                        $$(element.tag).setValue(element.selected);
                    }
                }
            });
        })
    };
    
    let reset = () => {
        
        $$('filter-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-name').clear();
        $$('filter-id-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-id').clear();
        $$('filter-contract-first-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-contract-first-name').clear();
        $$('filter-contract-last-name-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-contract-last-name').clear();
        $$('filter-account-number-type').setValue(StringCriteriaMatcher.STARTS_WITH.value);
        $$('filter-account-number').clear();

        AWS.callSoap(WS, 'listGlAccountsByType').then(res => {
            if (res.wsStatus === '0') {
                fillDropDownFromService('filter-sales-account', res, 'id', 'accountName');
            }
        });

        formGrid.clear();
        changeCount(0);
    };

    let changeCount = count => {
        Utils.setText('vendor-count', `Displaying ${count} Vendors`);
    };

    bindToEnum('filter-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('filter-id-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('filter-contract-first-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('filter-contract-last-name-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
    bindToEnum('filter-account-number-type', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

    const columnDefs = [
        {headerName: 'Vendor Name', field: 'vendorName', width: 200},
        {headerName: 'Vendor ID', field: 'vendorIdentifier', width: 100},
        {headerName: 'Vendor Phone', field: 'vendorPhone', width: 100},
        {headerName: 'Contact Last Name', field: 'vendorContactLastName', width: 150},
        {headerName: 'Contact First Name', field: 'vendorContactFirstName', width: 150},
        {headerName: 'Contact Phone', field: 'vendorContactPhone', width: 100},
    ];

    formGrid = new AGGrid('vendor-data-grid', columnDefs, 'vendorId');
    formGrid.show();
    formGrid.setOnSelectionChanged((rows) => {
        $$('vendor-group-detail').enable(rows);
        $$('vendor-edit').enable(rows);
        $$('vendor-delete').enable(rows);
    });

    const updateGrid = () => {
        const data = {
            expenseGLAccountId: $$('filter-sales-account').getValue(),
            identifier: $$('filter-id').getValue(),
            identifierSearchType: $$('filter-id-type').getValue(),
            accountNumber: $$('filter-account-number').getValue(),
            accountNumberSearchType: $$('filter-account-number-type').getValue(),
            mainContactFirstName: $$('filter-contract-first-name').getValue(),
            mainContactFirstNameSearchType: $$('filter-contract-first-name-type').getValue(),
            mainContactLastName: $$('filter-contract-last-name').getValue(),
            mainContactLastNameSearchType: $$('filter-contract-last-name-type').getValue(),
            name: $$('filter-name').getValue(),
            nameSearchType: $$('filter-name-type').getValue(),
        };

        AWS.callSoap(WS, 'searchVendorCompany', data).then(res => {
            if (res.wsStatus === '0') {
                res.vendorList = Utils.assureArray(res.vendorList);
                formGrid.clear().addRecords(res.vendorList);
                changeCount(res.vendorList.length);
            }
        });

        $$('vendor-group-detail').disable();
        $$('vendor-edit').disable();
        $$('vendor-delete').disable();
    };

    reset();
    updateGrid();

    $$('filter-reset').onclick(reset);
    $$('filter-search').onclick(updateGrid);

    const groupDetail = (vendorId) => {

        let formSearchGrid = null;
        
        Utils.popup_open('group-detail');

        return new Promise(async function (resolve, reject) {
        
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };
        
            let initDataGrid = () => {
                // Setup data grid.
                let columnDefs = [
                    {headerName: 'Organizational Group', field: 'orgGroupName'},
                    {headerName: 'Group Vendor ID', field: 'groupVendorId', maxWidth: 150}
                ];
        
                formSearchGrid = new AGGrid('gdp-grid', columnDefs, 'vendorGroupId');
                formSearchGrid.show();
            };
        
            if (!formSearchGrid)
                initDataGrid();

            let updateDataGrid = () => {
                AWS.callSoap(WS, 'listVendorGroupDetails', {vendorId: vendorId}).then(res => {
                    if (res.wsStatus === '0') {
                        res.item = Utils.assureArray(res.item);
                        formSearchGrid.clear().addRecords(res.item);
                    }
                });

                $$('gdp-edit').disable();
                $$('gdp-delete').disable();
            };

            if (formSearchGrid)
                updateDataGrid();

            const editGroupDetail = (row) => {
                
                Utils.popup_open('edit-group-detail');
        
                return new Promise(async function (resolve, reject) {

                    listSmartChooser([
                        {tag: 'egd-org-group', url: 'searchOrgGroups', ID: 'orgGroupId', label: 'name', param: {vendorId: vendorId, orgGroupId: row ? row.orgGroupId:null}},
                    ]);

                    if (!row) {
                        $$('egd-title').setValue('Add Group Detail');
                        $$('egd-vendor-id').clear();
                        $$('egd-org-group').enable();
                    } else {
                        $$('egd-title').setValue('Edit Group Detail');
                        $$('egd-vendor-id').setValue(row.groupVendorId);
                        $$('egd-org-group').disable();
                    }

                    $$('egd-cancel').onclick(() => {
                        resolve(null);
                        Utils.popup_close();
                    });

                    $$('egd-ok').onclick(() => {
                        if ($$('egd-org-group').isError('Organizational Group'))
                            return;
                        if ($$('egd-vendor-id').isError('Group Vendor ID'))
                            return;

                        const data = {
                            orgGroupId: $$('egd-org-group').getValue(),
                            groupVendorId: $$('egd-vendor-id').getValue()
                        };
                        resolve(data);
                        Utils.popup_close();
                    });
                });
            };
        
            //==========================================================================================================
            // Event handlers start.
            //==========================================================================================================
                
            formSearchGrid.setOnSelectionChanged((rows) => {
                $$('gdp-edit').enable(rows);
                $$('gdp-delete').enable(rows);
            });

            $$('gdp-add').onclick(async () => {
                let data = await editGroupDetail(null);
                if (data) {
                    AWS.callSoap(WS, 'newVendorGroup', { ...data, vendorId: vendorId}).then(res => {
                        if (res.wsStatus === '0') {
                            updateDataGrid();
                        }
                    })
                }
            });

            $$('gdp-edit').onclick(async () => {
                let row = formSearchGrid.getSelectedRow();
                let data = await editGroupDetail(row);
                if (data) {
                    AWS.callSoap(WS, 'saveVendorGroup', { ...data, id: row.vendorGroupId}).then(res => {
                        if (res.wsStatus === '0') {
                            updateDataGrid();
                        }
                    })
                }
            });

            $$('gdp-delete').onclick(() => {
                Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Group Detail?', () => {
                    const data = {
                        ids: [formSearchGrid.getSelectedRow().vendorGroupId]
                    };
                    
                    AWS.callSoap(WS, "deleteVendorGroups", data).then(function (res) {
                        if (res.wsStatus === '0') {
                            updateDataGrid();
                        }
                    });            
                });
            });
        
            $$('gdp-close').onclick(cancel);
        
            //==========================================================================================================
            // Event handlers end.
            //==========================================================================================================
        });
    };

    const detailPopup = (row) => {

        let tabContainer = null;

        let toggleAssignLogin = disabled => {
            if (disabled) {
                $$('loginId').disable();
                $$('screenGroup').disable();

                $$('password').disable();
                $$('securityGroup').disable();

                $$('confirmPassword').disable();
                $$('loginStatusGrp').disable('loginStatusActive');
                $$('loginStatusGrp').disable('loginStatusInactive');
                $$('screenId').disable();

                $$('showPasswords').disable();

            } else {
                $$('loginId').enable();
                $$('screenGroup').enable();

                $$('password').enable();
                $$('securityGroup').enable();
                $$('screenId').enable();

                $$('confirmPassword').enable();
                $$('loginStatusGrp').enable('loginStatusActive');
                $$('loginStatusGrp').enable('loginStatusInactive');

                $$('showPasswords').enable();
            }
        };

        let toggleTransferDetail = value => {
            if (!value) {
                $$('dp-user-name').clear();
                $$('dp-user-name').disable();
                $$('dp-password').clear();
                $$('dp-password').disable();

                $$('dp-host').clear();
                $$('dp-host').disable();
                $$('dp-port').clear();
                $$('dp-port').disable();
                $$('dp-directory').clear();
                $$('dp-directory').disable();

                $$('dp-encryption').clear();
                $$('dp-encryption').disable();
                $$('dp-edit-key').disable();

                $$('dp-time-to-transmit').disable();
            } else {
                $$('dp-user-name').enable();
                $$('dp-password').enable();

                $$('dp-host').enable();
                $$('dp-port').enable();
                $$('dp-directory').enable();

                $$('dp-encryption').enable();
                $$('dp-edit-key').enable();

                $$('dp-time-to-transmit').enable();

                if (value === 'ftp') {
                    $$('dp-port').setValue(21);
                } else {
                    $$('dp-port').setValue(22);
                }
            }
        };

        let resetDialog = () => {
            // Basic tab.
            $$('dp-vendor-name').clear();
            $$('dp-street1').clear();
            $$('dp-street2').clear();
            $$('dp-city').clear();
            $$('dp-states').setValue('');
            $$('dp-zip').clear();
            $$('dp-phone').clear();
            $$('dp-fax').clear();
            $$('dp-id').clear();
            $$('dp-federal-employer-id').clear();
            $$('dp-sales-account').clear();
            $$('dp-billing-rate').clear();
            $$('dp-account').clear();

            // Contract Detail tab.
            $$('dp-contract-first-name').clear();
            $$('dp-contract-last-name').clear();
            $$('dp-contract-email').clear();
            $$('dp-contract-job-title').clear();
            $$('dp-contract-phone').clear();
            $$('dp-contract-fax').clear();

            //EDI Detail tab
            $$('dp-application-sender-id').clear();
            $$('dp-application-receiver-id').clear();
            $$('dp-interchange-sender-id').clear();
            $$('dp-interchange-receiver-id').clear();


            // Login tab.
            $$('assignLogin').clear();
            $$('loginId').clear();
            $$('password').clear();
            $$('confirmPassword').clear();
            $$('showPasswords').clear();
            $$('screenGroup').clear();
            $$('securityGroup').clear();
            $$('screenId').clear();
            $$('loginStatusGrp').setValue('true');

            // Disable the login tab content.
            toggleAssignLogin(true);

            toggleTransferDetail(false);

            setSelectedDays('NNNNNNN');
    
            // Select the first tab.
            tabContainer.selectTab('dp-vendor-detail-TabButton');
        };

        function setSelectedDays(value) {
            if (value && value.length == 7)
            {
                $$('dp-sunday').setValue( value[0] == 'Y' );
                $$('dp-monday').setValue( value[1] == 'Y' );
                $$('dp-tuesday').setValue( value[2] == 'Y' );
                $$('dp-wednesday').setValue( value[3] == 'Y' );
                $$('dp-thursday').setValue( value[4] == 'Y' );
                $$('dp-friday').setValue( value[5] == 'Y' );
                $$('dp-saturday').setValue( value[6] == 'Y' );
            }
        }

        function getSelectedDays()
        {
            let ret = "";
            ret += $$('dp-sunday').getValue() ? 'Y' : 'N';
            ret += $$('dp-monday').getValue() ? 'Y' : 'N';
            ret += $$('dp-tuesday').getValue() ? 'Y' : 'N';
            ret += $$('dp-wednesday').getValue() ? 'Y' : 'N';
            ret += $$('dp-thursday').getValue() ? 'Y' : 'N';
            ret += $$('dp-friday').getValue() ? 'Y' : 'N';
            ret += $$('dp-saturday').getValue() ? 'Y' : 'N';

            return ret;
        }

        const editPublicKey = (id, text) => {
                
            Utils.popup_open('edit-public-key');
    
            return new Promise(async function (resolve, reject) {

                $$('epk-key-id').setValue(id);
                $$('epk-key-text').setValue(text);

                $$('epk-cancel').onclick(() => {
                    resolve(null);
                    Utils.popup_close();
                });

                $$('epk-ok').onclick(() => {
                    if ($$('epk-key-id').isError('Public Key ID'))
                        return;
                    if ($$('epk-key-text').isError('Public Key Text'))
                        return;

                    const data = {
                        keyIdInHex: $$('epk-key-id').getValue(),
                        keyText: $$('epk-key-text').getValue()
                    };

                    AWS.callSoap(WS, 'verifyEncryptionKey', data).then(res => {
                        if (wsStatus === '0')  {                        
                            resolve(data);
                            Utils.popup_close();
                        }
                    });
                });
            });
        };

        /**
         * Initialize the new worker dialog.
         */
        let initDialog = async () => {
            // Setup tab layout.
            tabContainer = new TabContainer('dp-tab-container');

            resetDialog();

            statesToDropDown('dp-states', US_STATE_ABBREVIATIONS);

            let p1 = AWS.callSoap(WS, 'listGlAccountsByType', {});
            let p2 = AWS.callSoap(WS, 'listEDICommunicationSchemes', {});
            let p3 = AWS.callSoap(WS, 'listEdiInterfaces', {});

            await AWS.callAll([p1, p2, p3],
                data => fillDropDownFromService('dp-sales-account', data, 'id', 'accountName'),
                data => fillDropDownFromService('dp-scheme', data, 'id', 'description'),
                data => fillDropDownFromService('dp-interface', data, 'id', 'name')
            );

            /**
             * The functionality to load screen and security groups are put in a function for multiple access, which will
             * also be called after loading dependant and applicant data.
             */
            let loadScreenAndSecurityGroups = async () => {
                let inData = {
                    searchTopLevelOnly: true,
                    // screenGroupId: screenGroupId
                };
                let data = await AWS.callSoap(WS, 'searchScreenGroups', inData);

                fillDropDownFromService('screenGroup', data, 'id', '', '(choose)',
                    'screenDef', item => {
                        return `${item.extId} - ${item.title}`;
                    });

                inData = {
                    // securityGroupId: securityGroupId
                };
                data = await AWS.callSoap(WS, 'searchSecurityGroups', inData);
                fillDropDownFromService('securityGroup', data, 'groupId', 'name', '(choose)');
            };

            // Initial call.
            loadScreenAndSecurityGroups();

            if (row) {
                let inData = {vendorCompanyId: row.vendorId};
                let data = await AWS.callSoap(WS, 'loadVendorCompany', inData);

                $$('dp-title').setValue('Edit Vendor');
                $$('dp-account').setValue(data.accountName);
                $$('dp-city').setValue(data.city);
                $$('dp-application-sender-id').setValue(data.ediApplicationSenderId);
                $$('dp-application-receiver-id').setValue(data.ediApplicationReceiverId);
                $$('dp-interchange-sender-id').setValue(data.ediInterchangeSenderId);
                $$('dp-interchange-receiver-id').setValue(data.ediInterchangeReceiverId);
                $$('dp-scheme').setValue(data.ediTransferSchemeId);
                $$('dp-host').setValue(data.ediTransferHost);
                $$('dp-port').setValue(data.ediTransferPort);
                $$('dp-user-name').setValue(data.ediTransferUsername);
                $$('dp-password').setValue(data.ediTransferPassword);
                $$('dp-directory').setValue(data.ediTransferDirectory);
                $$('dp-interface').setValue(data.ediInterfaceId);
                $$('dp-sales-account').setValue(data.expenseGLAccountId);
                $$('dp-federal-employer-id').setValue(data.federalEmployerId);
                $$('dp-id').setValue(data.identifier);
                $$('assignLogin').setValue(data.mainContactCanLogin);
                $$('dp-contract-first-name').setValue(data.contactFirstNameTextInput);
                $$('dp-contract-last-name').setValue(data.contactLastNameTextInput);
                $$('dp-contract-job-title').setValue(data.mainContactJobTitle);
                $$('loginId').setValue(data.mainContactLogin);
                $$('password').setValue(data.mainContactPassword);
                $$('dp-contract-email').setValue(data.mainContactPersonalEmail);
                $$('screenGroup').setValue(data.mainContactScreenGroupId);
                $$('securityGroup').setValue(data.mainContactSecurityGroupId);
                $$('dp-contract-fax').setValue(data.mainContactWorkFax);
                $$('dp-contract-phone').setValue(data.mainContactWorkPhone);
                $$('dp-phone').setValue(data.mainPhoneNumber);
                $$('dp-fax').setValue(data.mainFaxNumber);
                $$('dp-states').setValue(data.state);
                $$('dp-street1').setValue(data.street);
                $$('dp-street2').setValue(data.street2);
                $$('dp-zip').setValue(data.zip);
                $$('dp-transmission-active').setValue(data.ediActivated);
                $$('dp-transmission-type').setValue(data.ediFileType);
                $$('dp-interface-status').setValue(data.ediFileStatus);
                $$('dp-vendor-name').setValue(data.name);

                $$('dp-time-to-transmit').setValue(data.timeToSend * 100000);
                setSelectedDays(data.daysToSend);

            } else {
                $$('dp-title').setValue('Add Vendor');
            }
        };

        initDialog();

        Utils.popup_open('detail-popup');

        return new Promise(async function (resolve, reject) {

            //==================================================================================================================
            // Event handlers start.
            //==================================================================================================================

            $$('assignLogin').onChange(() => toggleAssignLogin(!$$('assignLogin').getValue()));
            $$('dp-scheme').onChange((v) => toggleTransferDetail(v));

            $$('screenGroup').onChange(() => $$('screenId').setValue($$('screenGroup').getData().extId));

            $$('dp-edit-key').onclick(async () => {
                let data = await editPublicKey();
                if (data) {
                    $$('dp-encryption').setValue(data.keyIdInHex);
                }
            });

            $$('dp-cancel').onclick(() => {
                resolve(null);
                Utils.popup_close();
            });

            $$('dp-ok').onclick(() => {
                if ($$('dp-vendor-name').isError('Name')) {
                    tabContainer.selectTab('dp-vendor-detail-TabButton');
                    return;
                }

                // See if the user requested a login.
                if ($$('assignLogin').getValue() === true) {
                    if ($$('loginId').isError('Login ID')) {
                        return tabContainer.selectTab('dp-contact-login-TabButton');
                    }
        
                    if ($$('password').isError('Password')) {
                        return tabContainer.selectTab('dp-contact-login-TabButton');
                    }
        
                    if ($$('password').getValue() !== $$('confirmPassword').getValue()) {
                        Utils.showMessage('Validation Error!', 'Passwords must match');
                        tabContainer.selectTab('dp-contact-login-TabButton');
                        $$('confirmPassword');
                        return;
                    }
        
                    if ($$('screenGroup').getValue() === '') {
                        Utils.showMessage('Validation Error!', 'Screen group is required');
                        tabContainer.selectTab('dp-contact-login-TabButton');
                        return;
                    }
        
                    if ($$('securityGroup').getValue() === '') {
                        Utils.showMessage('Validation Error!', 'Security group is required');
                        tabContainer.selectTab('dp-contact-login-TabButton');
                        $$('securityGroup').focus();
                        return;
                    }
                }

                const data = {
                    accountName: $$('dp-account').getValue(),
                    city: $$('dp-city').getValue(),
                    ediApplicationSenderId: $$('dp-application-sender-id').getValue(),
                    ediApplicationReceiverId: $$('dp-application-receiver-id').getValue(),
                    ediInterchangeSenderId: $$('dp-interchange-sender-id').getValue(),
                    ediInterchangeReceiverId: $$('dp-interchange-receiver-id').getValue(),
                    ediTransferSchemeId: $$('dp-scheme').getValue(),
                    ediTransferHost: $$('dp-host').getValue(),
                    ediTransferPort: $$('dp-port').getValue(),
                    ediTransferUsername: $$('dp-user-name').getValue(),
                    ediTransferPassword: $$('dp-password').getValue(),
                    ediTransferDirectory: $$('dp-directory').getValue(),
                    ediInterfaceId: $$('dp-interface').getValue(),
                    expenseGLAccountId: $$('dp-sales-account').getValue(),
                    federalEmployerId: $$('dp-federal-employer-id').getValue(),
                    identifier: $$('dp-id').getValue(),
                    mainContactCanLogin: $$('assignLogin').getValue(),
                    contactFirstNameTextInput: $$('dp-contract-first-name').getValue(),
                    contactLastNameTextInput: $$('dp-contract-last-name').getValue(),
                    mainContactJobTitle: $$('dp-contract-job-title').getValue(),
                    mainContactLogin: $$('loginId').getValue(),
                    mainContactPassword: $$('password').getValue(),
                    mainContactPersonalEmail: $$('dp-contract-email').getValue(),
                    mainContactScreenGroupId: $$('screenGroup').getValue(),
                    mainContactSecurityGroupId: $$('securityGroup').getValue(),
                    mainContactWorkFax: $$('dp-contract-fax').getValue(),
                    mainContactWorkPhone: $$('dp-contract-phone').getValue(),
                    mainPhoneNumber: $$('dp-phone').getValue(),
                    mainFaxNumber: $$('dp-fax').getValue(),
                    state: $$('dp-states').getValue(),
                    street: $$('dp-street1').getValue(),
                    street2: $$('dp-street2').getValue(),
                    zip: $$('dp-zip').getValue(),
                    ediActivated: $$('dp-transmission-active').getValue(),
                    ediFileType: $$('dp-transmission-type').getValue(),
                    ediFileStatus: $$('dp-interface-status').getValue(),
                    name: $$('dp-vendor-name').getValue(),
                    daysToSend: getSelectedDays(),
                    timeToSend: $$('dp-time-to-transmit').getIntValue()/100000
                };

                resolve(data);
                Utils.popup_close();
            });

            //==================================================================================================================
            // Handlers end.
            //==================================================================================================================

        });
    };

    $$('vendor-group-detail').onclick(async () => {
        let row = formGrid.getSelectedRow();
        await groupDetail(row.vendorId);
    });

    $$('vendor-add').onclick(async () => {
        let data = await detailPopup(null);
        if (data) {
            AWS.callSoap(WS, 'newVendorCompany', data).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    async function edit () {
        let row = formGrid.getSelectedRow();
        let data = await detailPopup(row);
        if (data) {
            AWS.callSoap(WS, 'saveVendorCompany', { ...data, orgGroupId: row.vendorId}).then(res => {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }

    formGrid.setOnRowDoubleClicked(edit);
    $$('vendor-edit').onclick(edit);
})();