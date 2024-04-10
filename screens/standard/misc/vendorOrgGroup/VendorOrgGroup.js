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

window.VendorOrgGroup = {};

(async function () {

    const WS = 'StandardMiscVendorOrgGroup';

    let screenStack = [];
    let nameStack = [];

    let filtered = false;
    let lastNameFilter = '';
    let primaryFilter = false;

    VendorOrgGroup.goBack = function (lvl) {
        while (lvl--) {
            screenStack.pop();
            nameStack.pop();
        }
        updateOrgGroupGrid(screenStack[screenStack.length - 1]);
    }

    function updateBreadCrumb() {
        const levels = screenStack.length
        const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
        let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a class="" onclick="VendorOrgGroup.goBack(' + (levels-1) + ')" style="font-weight: bold; cursor:pointer;">Top</a>';
        let i = 1;

        for (; i < levels; i++)
            bc += separator + '<a class="" onclick="VendorOrgGroup.goBack(' + (levels - (i + 1)) + ')" style="cursor:pointer;color:black;font-weight: bold;">' + nameStack[i] + '</a>';

        let str = nameStack[levels-1];
        if ( nameStack[levels-1] === 'Top') {
            str += ' level';
            $$('org-group-label').setValue(`Organizational Groups at the ${str}`);
            $$('contacts-label').setValue(`Contacts at the ${str}`);
        } else {
            $$('org-group-label').setValue(`Organizational Groups inside ${str}`);
            $$('contacts-label').setValue(`Contacts inside ${str}`);
        }
        $$('dp-group-name').setValue(str);

        bc += '</div>';
        $('#bread-crumb-2').html(bc);
    }

    let orgGroupGrid = new AGGrid('org-groups-grid', [
        {headerName: 'Vendor Organizational Unit Name', field: 'name', width: 55 },
        {headerName: 'ID', field: 'externalId', width: 25 },
        {headerName: 'Type', field: 'type', width: 25 }
    ], 'orgGroupId');
    orgGroupGrid.show();

    function updateOrgGroupGrid( orgGroupId, name, selectId ) {
        if (!screenStack.length || screenStack.length && screenStack[screenStack.length-1] !== orgGroupId) {
            screenStack.push(orgGroupId);
            nameStack.push(name ? name : "Top");
        }
        orgGroupId ? $$('org-group-up').enable() : $$('org-group-up').disable();
        orgGroupGrid.clear();
        $$('org-group-edit').disable();
        $$('org-group-delete').disable();
        $$('org-group-disassociate').disable();
        $$('org-group-open').disable();
        const data = {
            groupId: orgGroupId
        };
        AWS.callSoap(WS, "listAssociatedOrgGroups", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.orgGroups = Utils.assureArray(res.orgGroups);
                orgGroupGrid.addRecords(res.orgGroups);

                if (selectId)
                    orgGroupGrid.selectId(selectId);

                updateBreadCrumb();
                updateContactsGrid();

                if (screenStack.length > 1) {
                    $$('contact-add').enable();
                    $$('org-group-associate').enable();
                    $$('contact-associate').enable();
                    $$('edit-filter').enable();
                } else { 
                    $$('contact-add').disable();
                    $$('org-group-associate').disable();
                    $$('contact-associate').disable();
                    $$('edit-filter').disable();
                }
            }
        });
    }

    updateOrgGroupGrid(null);

    function descend() {
        const row = orgGroupGrid.getSelectedRow();
        updateOrgGroupGrid(row.orgGroupId, row.name);
    }

    orgGroupGrid.setOnRowDoubleClicked(descend);
    orgGroupGrid.setOnSelectionChanged((rows) => {
        $$('org-group-open').enable(rows);
        $$('org-group-edit').enable(rows);
        $$('org-group-delete').enable(rows);
        if (screenStack.length > 1)
            $$('org-group-disassociate').enable(rows);
        else 
            $$('org-group-disassociate').disable(rows);
    });

    $$('org-group-up').onclick(() => {
        screenStack.pop();
        nameStack.pop();
        updateOrgGroupGrid(screenStack.pop(), nameStack.pop());
    });

    $$('org-group-open').onclick(descend);

    let contactsGrid = new AGGrid('contacts-grid', [
        {headerName: 'Last Name', field: 'lname', width: 70 },
        {headerName: 'First Name', field: 'fname', width: 70 },
        {headerName: 'Primary', field: 'primary', width: 50 },
    ], 'personId');
    contactsGrid.show();

    function updateContactsGrid() {
        contactsGrid.clear();

        const data = {
            lastNameStartsWith: lastNameFilter,
            primary: primaryFilter,
            groupId: screenStack[screenStack.length-1]
        };
        AWS.callSoap(WS, "listVendorContacts", data).then(function (res) {
            if (res.wsStatus === '0') {
                res.persons = Utils.assureArray(res.persons);
                contactsGrid.addRecords(res.persons);
                $$('contacts-status').setValue(`Displaying ${res.persons.length} Contact` + (res.persons.length > 1 ? 's' : ''));
            }
        });

        if (filtered) {
            const filterLabel = `(` + (lastNameFilter ? (`Last name '` + lastNameFilter + `' `) : ``) + (primaryFilter ? `Primary` : ``) + `)`;
            $$('filter-label').setValue(`Filtered ` + filterLabel);
        } else {
            $$('filter-label').setValue('Not Filtered');
        }

        $$('contact-edit').disable();
        $$('contact-delete').disable();
        $$('contact-disassociate').disable();
    }

    contactsGrid.setOnSelectionChanged((rows) => {
        $$('contact-edit').enable(rows);
        $$('contact-delete').enable(rows);
        $$('contact-disassociate').enable(rows);
    });

    const addOrgGroupPopup = () => {
        let parentGroupId = screenStack[screenStack.length-1];
        $$('ogp-title').setValue('Add Vendor Organizational Group');
        $$('ogp-name').clear();
        $$('ogp-id').clear();

        Utils.popup_open('org-group-popup', 'ogp-name');

        const ok = () => {
            if ($$('ogp-name').isError('Name')) {
                return;
            }

            const data = {
                name: $$('ogp-name').getValue(),
                externalId: $$('ogp-id').getValue(),
                parentGroupID: parentGroupId
            };
            AWS.callSoap(WS, 'newGroup', data).then(res => {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
                }
            });

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('ogp-ok').onclick(ok);
        $$('ogp-cancel').onclick(cancel);

    };

    const editOrgGroupPopup = () => {
        let parentGroupId = screenStack[screenStack.length-1];
        const row = orgGroupGrid.getSelectedRow();
        if (!row) {
            return;
        }

        $$('ogp-title').setValue('Edit Vendor Organizational Group');
        $$('ogp-name').setValue(row.name);
        $$('ogp-id').setValue(row.externalId);

        Utils.popup_open('org-group-popup', 'ogp-name');

        const ok = () => {
            if ($$('ogp-name').isError('Name')) {
                return;
            }

            const data = {
                name: $$('ogp-name').getValue(),
                externalId: $$('ogp-id').getValue(),
                orgGroupId: row.orgGroupId
            };
            AWS.callSoap(WS, 'saveGroup', data).then(res => {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(parentGroupId, nameStack[nameStack.length-1]);
                }
            });

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('ogp-ok').onclick(ok);
        $$('ogp-cancel').onclick(cancel);

    };

    $$('org-group-add').onclick(addOrgGroupPopup);

    $$('org-group-edit').onclick(editOrgGroupPopup);

    $$('org-group-delete').onclick(() => {
        const row = orgGroupGrid.getSelectedRow();

        if (!row) {
            return;
        }
        
        if (row.type !== 'Group') {
            Utils.showMessage('Error', 'Only Vendor Organizational Groups can be deleted from this list.');
            return;
        } else {
            Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Vendor Organizational Group?', () => {
                const data = {
                    groupIds: [orgGroupGrid.getSelectedRow().orgGroupId]
                };
                
                AWS.callSoap(WS, "deleteGroup", data).then(function (res) {
                    if (res.wsStatus === '0') {
                        updateOrgGroupGrid(screenStack[screenStack.length-1], nameStack[nameStack.length-1]);
                    }
                });            
            });
        }
    });

    const searchGroupPopup = () => {
        let formSearchGrid = null;
        
        Utils.popup_open('search-group-popup');

            
        let reset = () => {
            $$('sgp-associate-indicator-type').setValue('2');

            $$('sgp-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('sgp-name-criteria').enable();

            $$('sgp-name-search').clear();
            $$('sgp-name-search').enable();

            $$('sgp-reset').enable();
            $$('sgp-search').enable();

            $$('sgp-ok').disable();

            formSearchGrid.clear();
            $$('sgp-count').setValue(`Displaying 0 Vendor Organizational Units`).setColor('black');
        };

        let ok = () => {
            let row = formSearchGrid.getSelectedRow();
            if (!row) {
                return;
            }

            updateOrgGroupGrid(row.orgGroupId, row.name);
            reset();
            Utils.popup_close();
        };

        let cancel = () => {
            reset();
            Utils.popup_close();
        };

        // Setup drop downs.
        bindToEnum('sgp-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        let initDataGrid = () => {
            // Setup data grid.
            let columnDefs = [
                {headerName: 'Vendor Organizational Unit Name', field: 'name', width: 75},
                {headerName: 'ID', field: 'externalId', width: 30},
                {headerName: 'Type', field: 'type', width: 30},
            ];

            formSearchGrid = new AGGrid('sgp-grid', columnDefs, 'orgGroupId');
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        //==========================================================================================================
        // Event handlers start.
        //==========================================================================================================

        formSearchGrid.setOnSelectionChanged($$('sgp-ok').enable);

        formSearchGrid.setOnRowDoubleClicked(ok);

        $$('sgp-reset').onclick(reset);

        $$('sgp-search').onclick(() => {
            let inParams = {
                name: $$('sgp-name-search').getValue(),
                nameSearchType: $$('sgp-name-criteria').getValue(),
                associatedIndicator: $$('sgp-associate-indicator-type').getValue(),
            };

            formSearchGrid.clear();
            // Clear the grid.

            AWS.callSoap(WS, 'searchOrgGroupsGeneric', inParams).then(data => {
                if (data.orgGroups) {
                    let records = Utils.assureArray(data.orgGroups);
                    formSearchGrid.addRecords(records);
    
                    let count = Utils.assureArray(data.orgGroups).length;
                    if (count >= data.cap) {
                        $$('sgp-count').setValue(`Displaying ${count} Vendor Organizational Unit` + (count > 1 ? 's' : '') + (' (Limit)')).setColor('red');
                    } else {
                        $$('sgp-count').setValue(`Displaying ${count} Vendor Organizational Unit` + (count > 1 ? 's' : '')).setColor('black');
                    }
                } else {
                    $$('sgp-count').setValue(`Displaying 0 Vendor Organizational Units`).setColor('black');
                }
            });
        });

        $$('sgp-ok').onclick(ok);

        $$('sgp-cancel').onclick(cancel);

        //==========================================================================================================
        // Event handlers end.
        //==========================================================================================================
    };

    $$('search-org-group').onclick(searchGroupPopup);

    const associateGroup = () => {
        let orgGroupId = screenStack[screenStack.length-1];

        let formSearchGrid = null;
        
        Utils.popup_open('associate-group');

        let reset = () => {
            $$('agp-associate-indicator-type').setValue('2');

            $$('agp-name-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('agp-name-criteria').enable();

            $$('agp-name-search').clear();
            $$('agp-name-search').enable();

            $$('agp-reset').enable();
            $$('agp-search').enable();

            $$('agp-ok').disable();

            formSearchGrid.clear();
            $$('agp-count').setValue(`Displaying 0 Vendor Organizational Units`).setColor('black');
        };

        let ok = () => {
            let data = {
                parentGroupID: orgGroupId,
                childGroupID: [formSearchGrid.getSelectedRow().orgGroupId]
            };

            AWS.callSoap(WS, 'addGroupToGroup', data).then(res => {
                if (res.wsStatus === '0') {
                    reset();
                    updateOrgGroupGrid(orgGroupId, nameStack[nameStack.length-1]);
                    Utils.popup_close();
                }
            });
        };

        let cancel = () => {
            reset();
            Utils.popup_close();
        };

        // Setup drop downs.
        bindToEnum('agp-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        let initDataGrid = () => {
            // Setup data grid.
            let columnDefs = [
                {headerName: 'Vendor Organizational Unit Name', field: 'name', width: 75},
                {headerName: 'ID', field: 'externalId', width: 30},
                {headerName: 'Type', field: 'type', width: 30},
            ];

            formSearchGrid = new AGGrid('agp-grid', columnDefs, 'orgGroupId');
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        //==========================================================================================================
        // Event handlers start.
        //==========================================================================================================

        formSearchGrid.setOnSelectionChanged($$('agp-ok').enable);

        formSearchGrid.setOnRowDoubleClicked(ok);

        $$('agp-reset').onclick(reset);

        $$('agp-search').onclick(() => {
            let inParams = {
                name: $$('agp-name-search').getValue(),
                nameSearchType: $$('agp-name-criteria').getValue(),
                associatedIndicator: $$('agp-associate-indicator-type').getValue(),
                orgGroupId: orgGroupId
            };

            // Clear the grid.
            formSearchGrid.clear();

            AWS.callSoap(WS, 'searchOrgGroups', inParams).then(data => {
                if (data.orgGroups) {
                    let records = Utils.assureArray(data.orgGroups);
                    formSearchGrid.addRecords(records);
    
                    let count = Utils.assureArray(data.orgGroups).length;
                    if (count >= data.cap) {
                        $$('agp-count').setValue(`Displaying ${count} Vendor Organizational Unit` + (count > 1 ? 's' : '') + (' (Limit)')).setColor('red');
                    } else {
                        $$('agp-count').setValue(`Displaying ${count} Vendor Organizational Unit` + (count > 1 ? 's' : '')).setColor('black');
                    }
                } else {
                    $$('agp-count').setValue(`Displaying 0 Vendor Organizational Units`).setColor('black');
                }
            });
        });

        $$('agp-ok').onclick(ok);

        $$('agp-cancel').onclick(cancel);

        //==========================================================================================================
        // Event handlers end.
        //==========================================================================================================
    };

    $$('org-group-associate').onclick(associateGroup);

    $$('org-group-disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to disassociate the selected Vendor Organizational Group?', () => {
            const data = {
                childGroupIDs: [orgGroupGrid.getSelectedRow().orgGroupId],
                parentGroupID: screenStack[screenStack.length-1]
            };
            
            AWS.callSoap(WS, "removeGroupFromGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateOrgGroupGrid(screenStack[screenStack.length-1], nameStack[nameStack.length-1]);
                }
            });            
        });
    });

    const tabContainer = new TabContainer('ep-tab-container');

    const addEmployeePopup = () => {
        let parentGroupId = screenStack[screenStack.length-1];

        $$('ep-title').setValue('Add Contact');
        $$('ep-fname').clear();
        $$('ep-job-title').clear();
        $$('ep-lname').clear();
        $$('ep-phone').clear();
        $$('ep-email').clear();
        $$('ep-fax').clear();
        $$('ep-primary').setValue(false);

        tabContainer.selectTab('ep-contact-detail-TabButton');
        $$('ep-assign-login').setValue(false);
        $$('ep-login-id').clear();
        $$('ep-login-id').disable();
        $$('ep-screen-group').clear();
        $$('ep-screen-group').disable();
        $$('ep-screen-choose').disable();
        $$('ep-password').clear();
        $$('ep-password').disable();
        $$('ep-screen-id').clear();
        $$('ep-screen-id').disable();
        $$('ep-confirm-password').clear();
        $$('ep-confirm-password').disable();
        $$('ep-screen-group-id').clear();
        $$('ep-security-group-id').clear();
        $$('ep-security-group').clear();
        $$('ep-security-group').disable();
        $$('ep-security-choose').disable();
        $$('ep-login-status').setValue('true');
        $$('ep-login-status').disable();

        Utils.popup_open('employee-popup');

        const ok = () => {
            if ($$('ep-fname').isError('First Name')) {
                return;
            }

            if ($$('ep-lname').isError('Last Name')) {
                return;
            }

            const isLogin = $$('ep-assign-login').getValue();
            if (isLogin) {
                if ($$('ep-login-id').isError('Login ID')) {
                    return;
                }
                if ($$('ep-screen-group').isError('Screen Group')) {
                    return;
                }
                if ($$('ep-password').isError('Password')) {
                    return;
                }
                if ($$('ep-security-group').isError('Security Group')) {
                    return;
                }
                if ($$('ep-password').getValue() !== $$('ep-confirm-password').getValue()) {
                    Utils.showMessage('Error', 'Password and Confirm Password do not match.');
                    return;
                }
            }

            const data = {
                canLogin: $$('ep-assign-login').getValue(),
                contactPassword: $$('ep-password').getValue(),
                fname: $$('ep-fname').getValue(),
                jobTitle: $$('ep-job-title').getValue(),
                lname: $$('ep-lname').getValue(),
                login: $$('ep-login-id').getValue(),
                orgGroupId: parentGroupId,
                personalEmail: $$('ep-email').getValue(),
                primaryIndicator: $$('ep-primary').getValue(),
                screenGroupId: $$('ep-screen-group-id').getValue(),
                securityGroupId: $$('ep-security-group-id').getValue(),
                workFax: $$('ep-fax').getValue(),
                workPhone: $$('ep-phone').getValue()
            };


            AWS.callSoap(WS, 'newVendorContact', data).then(res => {
                if (res.wsStatus === '0') {
                    updateContactsGrid();
                }
            })

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('ep-ok').onclick(ok);
        $$('ep-cancel').onclick(cancel);
    };

    $$('contact-add').onclick(addEmployeePopup);

    const editEmployeePopup = () => {
        let parentGroupId = screenStack[screenStack.length-1];

        $$('ep-title').setValue('Add Contact');
        $$('ep-fname').clear();
        $$('ep-job-title').clear();
        $$('ep-lname').clear();
        $$('ep-phone').clear();
        $$('ep-email').clear();
        $$('ep-fax').clear();
        $$('ep-primary').setValue(false);

        tabContainer.selectTab('ep-contact-detail-TabButton');
        $$('ep-assign-login').setValue(false);
        $$('ep-login-id').clear();
        $$('ep-login-id').disable();
        $$('ep-screen-group').clear();
        $$('ep-screen-group').disable();
        $$('ep-screen-choose').disable();
        $$('ep-password').clear();
        $$('ep-password').disable();
        $$('ep-screen-id').clear();
        $$('ep-screen-id').disable();
        $$('ep-confirm-password').clear();
        $$('ep-confirm-password').disable();
        $$('ep-screen-group-id').clear();
        $$('ep-security-group-id').clear();
        $$('ep-security-group').clear();
        $$('ep-security-group').disable();
        $$('ep-security-choose').disable();
        $$('ep-login-status').setValue('true');
        $$('ep-login-status').disable();

        const row = contactsGrid.getSelectedRow();
        if (!row) {
            return;
        }

        const data = {
            groupId: parentGroupId,
            personId: row.personId
        };
        AWS.callSoap(WS, 'loadVendorContact', data).then(res => {
            $$('ep-fname').setValue(res.fname);
            $$('ep-job-title').setValue(res.jobTitle);
            $$('ep-lname').setValue(res.lname);
            $$('ep-phone').setValue(res.workPhone);
            $$('ep-email').setValue(res.personalEmail);
            $$('ep-fax').setValue(res.workFax);
            $$('ep-primary').setValue(res.primaryIndicator);

            if (res.canLogin) {
                $$('ep-assign-login').setValue(true);
                $$('ep-login-id').enable();
                $$('ep-login-id').setValue(res.login);
                $$('ep-screen-group').enable();
                $$('ep-screen-group').setValue(res.screenGroupName);
                $$('ep-screen-group-id').enable();
                $$('ep-screen-group-id').setValue(res.screenGroupId);
                $$('ep-screen-id').enable();
                $$('ep-screen-id').setValue(res.screenGroupExtId);
                $$('ep-password').enable();
                $$('ep-password').setValue(res.password);
                $$('ep-confirm-password').enable();
                $$('ep-confirm-password').setValue(res.password);
                $$('ep-security-group').enable();
                $$('ep-security-group').setValue(res.securityGroupName);
                $$('ep-security-group-id').enable();
                $$('ep-security-group-id').setValue(res.securityGroupId);
            }
        });

        Utils.popup_open('employee-popup');

        const ok = () => {
            if ($$('ep-fname').isError('First Name')) {
                return;
            }

            if ($$('ep-lname').isError('Last Name')) {
                return;
            }

            const isLogin = $$('ep-assign-login').getValue();
            if (isLogin) {
                if ($$('ep-login-id').isError('Login ID')) {
                    return;
                }
                if ($$('ep-screen-group').isError('Screen Group')) {
                    return;
                }
                if ($$('ep-password').isError('Password')) {
                    return;
                }
                if ($$('ep-security-group').isError('Security Group')) {
                    return;
                }
                if ($$('ep-password').getValue() !== $$('ep-confirm-password').getValue()) {
                    Utils.showMessage('Error', 'Password and Confirm Password do not match.');
                    return;
                }
            }

            const data = {
                personId: row.personId,
                canLogin: $$('ep-assign-login').getValue(),
                contactPassword: $$('ep-password').getValue(),
                fname: $$('ep-fname').getValue(),
                jobTitle: $$('ep-job-title').getValue(),
                lname: $$('ep-lname').getValue(),
                login: $$('ep-login-id').getValue(),
                orgGroupId: parentGroupId,
                personalEmail: $$('ep-email').getValue(),
                primaryIndicator: $$('ep-primary').getValue(),
                screenGroupId: $$('ep-screen-group-id').getValue(),
                securityGroupId: $$('ep-security-group-id').getValue(),
                workFax: $$('ep-fax').getValue(),
                workPhone: $$('ep-phone').getValue()
            };


            AWS.callSoap(WS, 'saveVendorContact', data).then(res => {
                if (res.wsStatus === '0') {
                    updateContactsGrid();
                }
            })

            Utils.popup_close();
        };
    
        const cancel = () => {
            Utils.popup_close();
        };
    
        $$('ep-ok').onclick(ok);
        $$('ep-cancel').onclick(cancel);
    };

    $$('ep-assign-login').onChange((v) => {
        if (v === true) {
            $$('ep-login-id').enable();
            $$('ep-screen-group').enable();
            $$('ep-screen-choose').enable();
            $$('ep-password').enable();
            $$('ep-screen-id').enable();
            $$('ep-confirm-password').enable();
            $$('ep-security-group').enable();
            $$('ep-security-choose').enable();
            $$('ep-login-status').setValue('true');
            $$('ep-login-status').enable();
        } else {
            $$('ep-login-id').clear();
            $$('ep-login-id').disable();
            $$('ep-screen-group').clear();
            $$('ep-screen-group').disable();
            $$('ep-screen-choose').disable();
            $$('ep-password').clear();
            $$('ep-password').disable();
            $$('ep-screen-id').clear();
            $$('ep-screen-id').disable();
            $$('ep-confirm-password').clear();
            $$('ep-confirm-password').disable();
            $$('ep-security-group').clear();
            $$('ep-security-group').disable();
            $$('ep-security-choose').disable();
            $$('ep-login-status').setValue('true');
            $$('ep-login-status').disable();
        }
    });

    $$('contact-edit').onclick(editEmployeePopup);
    contactsGrid.setOnRowDoubleClicked(editEmployeePopup);

    $$('contact-delete').onclick(() => {
        const row = contactsGrid.getSelectedRow();

        if (!row) {
            return;
        }
        
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Vendor Contact?', () => {
            const data = {
                ids: row.personId
            };
            
            AWS.callSoap(WS, "deleteVendorContact", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateContactsGrid();
                }
            });            
        });
    });

    const associateContact = () => {
        let orgGroupId = screenStack[screenStack.length-1];

        let formSearchGrid = null;
        
        Utils.popup_open('associate-contact');

        let reset = () => {
            $$('aep-associate-indicator-type').setValue('2');

            $$('aep-lname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('aep-lname-criteria').enable();

            $$('aep-lname-search').clear();
            $$('aep-lname-search').enable();

            $$('aep-fname-criteria').setValue(StringCriteriaMatcher.STARTS_WITH.value);
            $$('aep-fname-criteria').enable();

            $$('aep-fname-search').clear();
            $$('aep-fname-search').enable();

            $$('aep-reset').enable();
            $$('aep-search').enable();

            $$('aep-ok').disable();

            formSearchGrid.clear();
            $$('aep-count').setValue(`Displaying 0 Vendor Contacts`).setColor('black');
        };

        let ok = () => {
            let data = {
                groupId: orgGroupId,
                personIds: [formSearchGrid.getSelectedRow().personId]
            };

            AWS.callSoap(WS, 'assignPersonToOrgGroup', data).then(res => {
                if (res.wsStatus === '0') {
                    reset();
                    updateContactsGrid();
                    Utils.popup_close();
                }
            });
        };

        let cancel = () => {
            reset();
            Utils.popup_close();
        };

        // Setup drop downs.
        bindToEnum('aep-lname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        bindToEnum('aep-fname-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);

        let initDataGrid = () => {
            // Setup data grid.
            let columnDefs = [
                {headerName: 'Last Name', field: 'lname', width: 30},
                {headerName: 'First Name', field: 'fname', width: 30},
            ];

            formSearchGrid = new AGGrid('aep-grid', columnDefs, 'personId');
            formSearchGrid.show();
        };

        if (!formSearchGrid)
            initDataGrid();

        //==========================================================================================================
        // Event handlers start.
        //==========================================================================================================

        formSearchGrid.setOnSelectionChanged($$('aep-ok').enable);

        formSearchGrid.setOnRowDoubleClicked(ok);

        $$('aep-reset').onclick(reset);

        $$('aep-search').onclick(() => {
            let inParams = {
                firstName: $$('aep-fname-search').getValue(),
                firstNameSearchType: $$('aep-fname-criteria').getValue(),
                lastName: $$('aep-lname-search').getValue(),
                lastNameSearchType: $$('aep-lname-criteria').getValue(),
                associatedIndicator: $$('aep-associate-indicator-type').getValue(),
                orgGroupId: orgGroupId
            };

            // Clear the grid.
            formSearchGrid.clear();

            AWS.callSoap(WS, 'searchVendorContacts', inParams).then(data => {
                if (data.contacts) {
                    let records = Utils.assureArray(data.contacts);
                    formSearchGrid.addRecords(records);
    
                    let count = Utils.assureArray(data.contacts).length;
                    if (count >= data.cap) {
                        $$('aep-count').setValue(`Displaying ${count} Vendor Contact` + (count > 1 ? 's' : '') + (' (Limit)')).setColor('red');
                    } else {
                        $$('aep-count').setValue(`Displaying ${count} Vendor Contact` + (count > 1 ? 's' : '')).setColor('black');
                    }
                } else {
                    $$('aep-count').setValue(`Displaying 0 Vendor Contact`).setColor('black');
                }
            });
        });

        $$('aep-ok').onclick(ok);

        $$('aep-cancel').onclick(cancel);

        //==========================================================================================================
        // Event handlers end.
        //==========================================================================================================
    };

    $$('contact-associate').onclick(associateContact);

    $$('contact-disassociate').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to disassociate the selected Vendor Contact?', () => {
            const data = {
                personIds: [contactsGrid.getSelectedRow().personId],
                groupId: screenStack[screenStack.length-1]
            };
            
            AWS.callSoap(WS, "removePersonFromOrgGroup", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateContactsGrid();
                }
            });            
        });
    });

    const filterPopup = () => {
        Utils.popup_open('filter-popup');

        if (filtered) {
            $$('fp-filter').setValue(true);
            $$('fp-lname').enable();
            $$('fp-lname').setValue(lastNameFilter);
            $$('fp-primary').enable();
            $$('fp-primary').setValue(primaryFilter);
        } else {
            $$('fp-filter').setValue(false);
            $$('fp-lname').clear();
            $$('fp-lname').disable();
            $$('fp-primary').clear();
            $$('fp-primary').disable();
        }

        $$('fp-filter').onChange(() => {
            if ($$('fp-filter').getValue() === true) {
                $$('fp-lname').clear();
                $$('fp-lname').enable();
                $$('fp-primary').clear();
                $$('fp-primary').enable();
            } else {
                $$('fp-lname').clear();
                $$('fp-lname').disable();
                $$('fp-primary').clear();
                $$('fp-primary').disable();
            }
        });

        let ok = () => {
            filtered = $$('fp-filter').getValue();
            lastNameFilter = $$('fp-lname').getValue();
            primaryFilter = $$('fp-primary').getValue();
            updateContactsGrid();
            Utils.popup_close();
        };

        let cancel = () => {
            Utils.popup_close();
        };


        $$('fp-ok').onclick(ok);

        $$('fp-cancel').onclick(cancel);

        //==========================================================================================================
        // Event handlers end.
        //==========================================================================================================
    };

    $$('edit-filter').onclick(filterPopup);

    const screenSearchColumnDefs = [
        { headerName: 'Screen Group Name', field: 'title', width: 110 },
        { headerName: 'ID', field: 'extId', width: 30 },
        { headerName: '?', field: 'help', width: 20 },
    ];

    const screenSearchGrid = new AGGrid('screen-sp-grid', screenSearchColumnDefs, 'id');
    screenSearchGrid.show();
    screenSearchGrid.setOnSelectionChanged($$('screen-sp-ok').enable);

    const screenGroupSearchPopup = () => {
        
        const resetDialog = () => {
            $$('screen-sp-name').setValue('');
            $$('screen-sp-name-type').setValue('2');
            $$('screen-sp-id').setValue('');
            $$('screen-sp-type').setValue('1');
        };

        const search = () => {
            const data = {
                name: $$('screen-sp-name').getValue(),
                nameSearchType: $$('screen-sp-name-type').getValue(),
                extId: $$('screen-sp-id').getValue(),
                searchTopLevelOnly: $$('screen-sp-type').getValue() === '1',
            };

            AWS.callSoap(WS, 'searchScreenGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    screenSearchGrid.clear();

                    const records = Utils.assureArray(res.screenDef);
                    screenSearchGrid.addRecords(records);

                    $$('screen-sp-status').setValue(`Displaying ${records.length} Screen Groups`);
                    $$('screen-sp-ok').disable();
                };
            });
        }

        const initDialog = () => {
            resetDialog();

            search();
        };

        initDialog();

        Utils.popup_open('screen-group-search-popup');
        

        $$('screen-sp-search').onclick(search);
        $$('screen-sp-reset').onclick(resetDialog);

        const ok = () => {
            const row = screenSearchGrid.getSelectedRow();
            if (!row) {
                return;
            }
            $$('ep-screen-group').setValue(row.title);
            $$('ep-screen-id').setValue(row.extId);
            $$('ep-screen-group-id').setValue(row.id);
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        screenSearchGrid.setOnRowDoubleClicked(ok);
        $$('screen-sp-ok').onclick(ok);
        $$('screen-sp-cancel').onclick(cancel);

    };

    $$('ep-screen-choose').onclick(screenGroupSearchPopup);

    const securitySearchColumnDefs = [
        { headerName: 'Security Group Name', field: 'name' }
    ];

    const securitySearchGrid = new AGGrid('sg-sp-grid', securitySearchColumnDefs, 'groupId');
    securitySearchGrid.show();
    securitySearchGrid.setOnSelectionChanged($$('sg-sp-ok').enable);

    const securityGroupSearchPopup = () => {
        
        const resetDialog = () => {
            $$('sg-sp-name').setValue('');
            $$('sg-sp-name-type').setValue('2');
        };

        function search() {
            const data = {
                name: $$('sg-sp-name').getValue(),
                nameSearchType: $$('sg-sp-name-type').getValue()
            };

            AWS.callSoap(WS, 'searchSecurityGroups', data).then(res => {
                if (res.wsStatus === '0') {
                    securitySearchGrid.clear();

                    const records = Utils.assureArray(res.item);
                    securitySearchGrid.addRecords(records);

                    $$('sg-sp-status').setValue(`Displaying ${records.length} Security Groups`);
                    $$('sg-sp-ok').disable();
                };
            });
        }

        const initDialog = () => {
            resetDialog();

            search();
        };

        initDialog();

        Utils.popup_open('security-group-search-popup');
        

        $$('sg-sp-search').onclick(search);
        $$('sg-sp-reset').onclick(resetDialog);

        const ok = () => {
            const row = securitySearchGrid.getSelectedRow();

            $$('ep-security-group').setValue(row.name);
            $$('ep-security-group-id').setValue(row.groupId);

            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        securitySearchGrid.setOnRowDoubleClicked(ok);
        $$('sg-sp-ok').onclick(ok);
        $$('sg-sp-cancel').onclick(cancel);

    };

    $$('ep-security-choose').onclick(securityGroupSearchPopup);

})();
