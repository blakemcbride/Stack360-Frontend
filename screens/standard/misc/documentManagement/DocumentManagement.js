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

    const WS = 'StandardMiscDocumentManagement';

    const columnDefs = [
        { headerName: 'Filename', field: 'filename', width: 100 },
        { headerName: 'Comments', field: 'comment', width: 100 },
        { headerName: 'First Active', field: 'firstActiveDateFormatted', width: 50 },
        { headerName: 'Last Active', field: 'lastActiveDateFormatted', width: 50 }
    ];
    const documentsGrid = new AGGrid('documents-grid', columnDefs, 'id');

    documentsGrid.show();
    documentsGrid.setOnSelectionChanged((rows) => {
        $$('doc-edit').enable(rows);
        $$('doc-view').enable(rows);
        $$('doc-delete').enable(rows);
    });

    const orgGroupColumnDefs = [
        { headerName: 'Name', field: 'name' }
    ];
    const orgGroupGrid = new AGGrid('org-group-grid', orgGroupColumnDefs, 'id');

    orgGroupGrid.show();

    const locationColumnDefs = [
        { headerName: 'Location', field: 'location' }
    ];
    const locationGrid = new AGGrid('org-location-grid', locationColumnDefs, 'id');

    locationGrid.show();

    const orgGroupPopColumnDefs = [
        { headerName: 'Name', field: 'name' }
    ];
    const orgGroupPopupGrid = new AGGrid('org-group-popup-grid', orgGroupPopColumnDefs, 'id');

    orgGroupPopupGrid.show();

    const orgGroupSelectedColumnDefs = [
        { headerName: 'Name', field: 'name' }
    ];
    const orgGroupSelectedGrid = new AGGrid('org-selected-group-grid', orgGroupSelectedColumnDefs, 'id');

    orgGroupSelectedGrid.show();

    let root = new TreeNode("root");

    let view = new TreeView(root, "folder-tree");
    view.changeOption('show_root', false);

    let clipboard = [];

    const folderClick = (data) => {
        if (data.type === 'f') {
            AWS.callSoap(WS, 'listDocumentsInFolder', {
                folderId: data.id
            }).then(res => {
                if (res.wsStatus === '0') {
                    documentsGrid.clear();
                    if (res.item) {
                        let documents = Utils.assureArray(res.item);
                        for (let i = 0; i < documents.length; i ++) {
                            documents[i].firstActiveDateFormatted = DateUtils.intToStr4(documents[i].firstActiveDate);
                            documents[i].lastActiveDateFormatted = DateUtils.intToStr4(documents[i].lastActiveDate);
                        }
                        documentsGrid.addRecords(documents);
                    }
                }
            });

            AWS.callSoap(WS, 'listOrgGroupsForFolder', {
                folderId: data.id
            }).then(res => {
                if (res.wsStatus === '0') {
                    orgGroupGrid.clear();
                    if (res.orgGroup) {
                        let orgGroups = Utils.assureArray(res.orgGroup);
                        orgGroupGrid.addRecords(orgGroups);
                    }
                }
            });

            AWS.callSoap(WS, 'loadCompanyForFolder', {
                folderId: data.id
            }).then(res => {
                if (res.wsStatus === '0') {
                    $$('associated-company').setValue(res.companyName);
                }
            });

            $$('folder-add').enable();
            $$('folder-edit').enable();
            $$('folder-delete').enable();

            $$('doc-cut').disable();
            $$('doc-copy').disable();
            if (clipboard.length > 0) {
                $$('doc-paste').enable();
            } else {
                $$('doc-paste').disable();
            }

            $$('doc-view').disable();
            $$('doc-add').enable();
            $$('doc-edit').disable();
            $$('doc-delete').disable();

            $$('org-associate').enable();
            $$('org-disassociate').disable();
        } else {
            $$('folder-add').disable();
            $$('folder-edit').disable();
            $$('folder-delete').disable();

            $$('doc-cut').enable();
            $$('doc-copy').enable();

            documentsGrid.clear();
            orgGroupGrid.clear();

            $$('doc-view').disable();
            $$('doc-add').disable();
            $$('doc-edit').disable();
            $$('doc-delete').disable();

            $$('org-associate').disable();
            $$('org-disassociate').disable();
        }
    }

    const addChild = (node, data) => {
        let child = new TreeNode(
            data.name + (data.childCount !== '0' ? (' (' + data.childCount + ')') : '' ), 
            data
        );
        child.on('click', (e, node) => {
            folderClick(data);
        })
        node.addChild(child);
        if (data.childCount === '0') {
            return;
        }
        if (data.childCount === '1') {
            addChild(child, data.child);
        } else {
            for (let i = 0; i < data.child.length; i ++) {
                addChild(child, data.child[i]);
            }
        }
    }

    const updateTree = () => {
        root.removeAllChild();
        AWS.callSoap(WS, 'listFoldersAndDocuments').then(res => {
            if (res.wsStatus === '0') {
                let items = Utils.assureArray(res.item);
                
                for (let i = 0; i < items.length; i ++) {
                    addChild(root, items[i]);
                }
                
                view.collapseAllNodes();
                view.reload();
            }
        });
        $$('folder-edit').disable();
        $$('folder-delete').disable();
        
        $$('doc-cut').disable();
        $$('doc-copy').disable();
        $$('doc-paste').disable();
        
        $$('doc-view').disable();
        $$('doc-add').disable();
        $$('doc-edit').disable();
        $$('doc-delete').disable();

        $$('org-associate').disable();
        $$('org-disassociate').disable();

        documentsGrid.clear();
        orgGroupGrid.clear();
        $$('associated-company').clear();
    }

    updateTree();

    const addFolder = () => {
        Utils.popup_open('add-folder-popup', 'folder-name');
        $$('afp-title').setValue('Add Folder');
            
        $$('folder-name').setValue('');

        const ok = () => {
            if ($$('folder-name').isError('Folder Name')) {
                return;
            }

            const selected = view.getSelectedNodes();
            let request = {};

            if (selected.length === 0) {
                request = { 
                    name: $$('folder-name').getValue()
                };
            } else {
                request = { 
                    name: $$('folder-name').getValue(),
                    parentId: selected[0].data.id
                };
            }
            
            AWS.callSoap(WS, 'newFolder', request).then(res => {
                if (res.wsStatus === '0') {
                    updateTree();
                }
            })

            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('afp-ok').onclick(ok);
        $$('afp-cancel').onclick(cancel);
    };

    $$('folder-add').onclick(addFolder);

    const editFolder = () => {
        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }
        Utils.popup_open('add-folder-popup');
        $$('afp-title').setValue('Edit Folder');
            
        $$('folder-name').setValue(selectedFolder[0].data.name);

        const ok = () => {
            if ($$('folder-name').isError('Folder Name')) {
                return;
            }

            const request = { 
                name: $$('folder-name').getValue(),
                id: selectedFolder[0].data.id
            };
            
            AWS.callSoap(WS, 'saveFolder', request).then(res => {
                if (res.wsStatus === '0') {
                    updateTree();
                }
            })

            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('afp-ok').onclick(ok);
        $$('afp-cancel').onclick(cancel);
    };

    $$('folder-edit').onclick(editFolder);
    
    $$('folder-delete').onclick(() => {
        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected folder and all of its contents?', () => {
            AWS.callSoap(WS, 'deleteFolderDeep', {
                folderId: selectedFolder[0].data.id
            }).then(res => {
                if (res.wsStatus === '0') {
                    updateTree();
                }
            })
        });        
    });

    $$('doc-cut').onclick(() => {
        clipboard = [];
        let ids = [];
        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }
        for (let i = 0; i < selectedFolder.length; i ++) {
            clipboard.push(selectedFolder[i].data.id);
            ids.push({
                documentId: selectedFolder[i].data.id,
                folderId: selectedFolder[i].parent.data.id
            });
        }
        AWS.callSoap(WS, 'removeDocumentFromFolder', {
            ids: ids
        }).then(res => {
            if (res.wsStatus === '0') {
                updateTree();
            }
        });
    });

    $$('doc-copy').onclick(() => {
        clipboard = [];
        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }
        for (let i = 0; i < selectedFolder.length; i ++) {
            clipboard.push(selectedFolder[i].data.id);
        }
    });

    $$('doc-paste').onclick(() => {
        if (clipboard.length === 0) {
            return;
        }
        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }
        AWS.callSoap(WS, 'addDocumentToFolder', {
            documentIds: clipboard,
            folderId: selectedFolder[0].data.id
        }).then(res => {
            if (res.wsStatus === '0') {
                updateTree();
            }
        });
    });

    const updateDocuments = (folderId) => {
        AWS.callSoap(WS, 'listDocumentsInFolder', {
            folderId: folderId
        }).then(res => {
            if (res.wsStatus === '0') {
                documentsGrid.clear();
                if (res.item) {
                    let documents = Utils.assureArray(res.item);
                    for (let i = 0; i < documents.length; i ++) {
                        documents[i].firstActiveDateFormatted = DateUtils.intToStr4(documents[i].firstActiveDate);
                        documents[i].lastActiveDateFormatted = DateUtils.intToStr4(documents[i].lastActiveDate);
                    }
                    documentsGrid.addRecords(documents);
                }
            }
        });

        $$('doc-view').disable();
        $$('doc-add').enable();
        $$('doc-edit').disable();
        $$('doc-delete').disable();
    };

    const updateOrgGroups = (folderId) => {
        AWS.callSoap(WS, 'listOrgGroupsForFolder', {
            folderId: folderId
        }).then(res => {
            if (res.wsStatus === '0') {
                orgGroupGrid.clear();
                if (res.orgGroup) {
                    let orgGroups = Utils.assureArray(res.orgGroup);
                    orgGroupGrid.addRecords(orgGroups);
                }
            }
        });
        $$('org-associate').enable();
        $$('org-disassociate').disable();
    };

    const addDocument = () => {
        $('#add-document-popup--height').css('height', '376px');
        Utils.popup_open('add-document-popup');
        
        const reset = () => {
            $$('adp-title').setValue('Add Document');
            $$('doc-description').clear();
            $$('doc-comments').clear();
            $$('doc-form').clear();
            $$('doc-form').show();
            $$('form-label').show();
            $$('doc-first-date').clear();
            $$('doc-last-date').clear();

            AWS.callSoap(WS, 'listFormTypes').then(res => {
                if (res.wsStatus === '0') {
                    let codeCtrl = $$('doc-code');
                    codeCtrl.clear();

                    codeCtrl.add("", "(select)");

                    // Add the sources to the drop down control.
                    res.item = Utils.assureArray(res.item);

                    if (res.item) {
                        res.item.forEach(item => {
                            codeCtrl.add(item.id, item.code, item);
                        });
                    }
                }
            })
        };

        reset();

        $$('doc-code').onChange(() => {
            const selectedItem = $$('doc-code').getData();
            if (selectedItem) {
                $$('doc-description').setValue(selectedItem.description);                
            } else {
                $$('doc-description').clear();                
            }
        });
        
        const ok = async () => {
            if ($$('doc-code').isError('Code')) {
                return;
            }
            if ($$('doc-form').isError('Form')) {
                return;
            }
            if ($$('doc-comments').isError('Comments')) {
                return;
            }

            const selectedFolder = view.getSelectedNodes();
            if (selectedFolder.length === 0) {
                return;
            }

            const data = {
                folderId: selectedFolder[0].data.id,
                comments: $$('doc-comments').getValue(),
                lastActiveDate: $$('doc-last-date').getIntValue(),
                firstActiveDate: $$('doc-first-date').getIntValue(),
                formTypeId: $$('doc-code').getValue(),
                myFilename: $$('doc-form').uploadFilename(0),
                extension: $$('doc-form').uploadFileExtension(0)
            };
            Utils.waitMessage('File upload in progress.');
            await AWS.fileUpload('doc-form', 'companyFormUpload', data);
            updateTree();

            /*
            AWS.callSoap(WS, 'listDocumentsInFolder', {
                folderId: selectedFolder[0].data.id
            }).then(res => {
                if (res.wsStatus === '0') {
                    documentsGrid.clear();
                    if (res.item) {
                        let documents = Utils.assureArray(res.item);
                        for (let i = 0; i < documents.length; i ++) {
                            documents[i].firstActiveDateFormatted = DateUtils.intToStr4(documents[i].firstActiveDate);
                            documents[i].lastActiveDateFormatted = DateUtils.intToStr4(documents[i].lastActiveDate);
                            if (documents[i].filename === $$('doc-form').uploadFilename(0)) {
                                const newDoc = {
                                    childCount: 0,
                                    id: documents[i].id,
                                    name: $$('doc-description').getValue() + ' - ' + $$('doc-comments').getValue(),
                                    type: 'd'
                                };
                                const newChild = new TreeNode(
                                    newDoc.name,
                                    newDoc
                                );
                                selectedFolder[0].addChild(newChild);
                                view.reload();
                            }
                        }
                        documentsGrid.addRecords(documents);
                        Utils.waitMessageEnd();
                        Utils.showMessage('Status', 'Upload Complete');            
                    }
                }
            });
            */

            Utils.waitMessageEnd();
            Utils.showMessage('Status', 'Upload Complete');
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('adp-ok').onclick(ok);
        $$('adp-cancel').onclick(cancel);
    };

    $$('doc-add').onclick(addDocument);

    const editDocument = () => {
        $('#add-document-popup--height').css('height', '348px');
        Utils.popup_open('add-document-popup');
        const row = documentsGrid.getSelectedRow();
        if (!row) {
            return;
        }
        let document;
        
        const reset = () => {
            $$('adp-title').setValue('Edit Document');
            $$('doc-description').clear();
            $$('doc-comments').clear();
            $$('doc-form').hide();
            $$('form-label').hide();
            $$('doc-first-date').clear();
            $$('doc-last-date').clear();

            AWS.callSoap(WS, 'listFormTypes').then(res => {
                if (res.wsStatus === '0') {
                    let codeCtrl = $$('doc-code');
                    codeCtrl.clear();

                    codeCtrl.add("", "(select)");

                    // Add the sources to the drop down control.
                    res.item = Utils.assureArray(res.item);

                    if (res.item) {
                        res.item.forEach(item => {
                            codeCtrl.add(item.id, item.code, item);
                        });
                    }

                    AWS.callSoap(WS, 'loadDocument', {
                        documentId: row.id
                    }).then(ret => {
                        if (ret.wsStatus === '0') {
                            document = ret;
                            let codeCtrl = $$('doc-code');
                            codeCtrl.setValue(ret.formTypeId);
                            for (let i = 0; i < res.item.length; i ++) {
                                if (res.item[i].id === ret.formTypeId) {
                                    $$('doc-description').setValue(res.item[i].description);
                                    break;
                                }
                            }
                            $$('doc-comments').setValue(ret.comment);
                            $$('doc-first-date').setValue(ret.firstActiveDate);
                            $$('doc-last-date').setValue(ret.lastActiveDate);
                        }
                    });
                }
            });

        };

        reset();

        $$('doc-code').onChange(() => {
            const selectedItem = $$('doc-code').getData();
            if (selectedItem) {
                $$('doc-description').setValue(selectedItem.description);                
            } else {
                $$('doc-description').clear();                
            }
        });

        const ok = () => {
            if ($$('doc-code').isError('Code')) {
                return;
            }
            if ($$('doc-comments').isError('Comments')) {
                return;
            }

            const data = {
                comment: $$('doc-comments').getValue(),
                lastActiveDate: $$('doc-last-date').getIntValue(),
                firstActiveDate: $$('doc-first-date').getIntValue(),
                formTypeId: $$('doc-code').getValue(),
                id: row.id,
                signitureRequired: document.signitureRequired
            };
            AWS.callSoap(WS, 'saveDocument', data).then(res => {
                if (res.wsStatus === '0') {
                    updateTree();
                }
            });

            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('adp-ok').onclick(ok);
        $$('adp-cancel').onclick(cancel);
    };

    $$('doc-edit').onclick(editDocument);

    $$('doc-delete').onclick(() => {
        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }
        const row = documentsGrid.getSelectedRow();
        if (!row) {
            return;
        }

        const ids = [{
            documentId: row.id,
            folderId: selectedFolder[0].data.id
        }];

        const data = {
            ids: ids
        };

        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected document?', () => {
            AWS.callSoap(WS, 'removeDocumentFromFolder', data).then(res => {
                if (res.wsStatus === '0') {
                    updateTree();
                }
            });
        });
    });

    const viewDocument = () => {
        const row = documentsGrid.getSelectedRow();
        if (!row) {
            return;
        }

        AWS.callSoap(WS, 'getForm', {
            documentId: row.id
        }).then(res => {
            Utils.showReport(res.reportUrl);
        });
    }

    documentsGrid.setOnRowDoubleClicked(viewDocument);
    $$('doc-view').onclick(viewDocument);

    const associateOrgGroup = () => {
        Utils.popup_open('associate-org-group');
        const selectedFolder = view.getSelectedNodes();
        let orgGroupId = '';
        if (selectedFolder.length === 0) {
            return;
        }
        
        const search = () => {
            orgGroupPopupGrid.clear();
            AWS.callSoap(WS, 'searchOrgGroups', {
                folderId: selectedFolder[0].data.id,
                name: $$('aop-name-search').getValue(),
                nameSearchType: $$('aop-name-criteria').getValue(),
                orgGroupId: orgGroupId
            }).then(res => {
                if (res.wsStatus === '0') {
                    let orgGroups = Utils.assureArray(res.orgGroup);
                    const selectedOrgGroups = orgGroupSelectedGrid.getAllRows();
                    let availableOrgGroups = [];
                    for (let i = 0; i < orgGroups.length; i ++) {
                        let j;
                        for (j = 0; j < selectedOrgGroups.length; j ++) {
                            if (orgGroups[i].id === selectedOrgGroups[j].id) {
                                break;
                            }
                        }
                        if (j === selectedOrgGroups.length) {
                            availableOrgGroups.push(orgGroups[i]);
                        }
                    }
                    orgGroupPopupGrid.addRecords(availableOrgGroups);
                    $$('opg-group-popup-status').setValue('Displaying ' + availableOrgGroups.length + ' Org Group' + (availableOrgGroups.length > 1 ? 's' : ''));
                    $$('org-group-open').disable();
                    $$('org-group-associate').disable();
                    $$('org-group-disassociate').disable();
                }
            });
        };

        const reset = () => {
            locationGrid.clear();
            locationGrid.addRecord({
                location: '(top)',
                id: '0'
            });
            $$('location-open').disable();
            $$('location-up').enable();

            $$('aop-name-criteria').setValue('0');
            $$('aop-name-search').clear();

            $$('org-group-open').disable();

            orgGroupSelectedGrid.clear();
            $$('org-group-associate').disable();
            $$('org-group-disassociate').disable();

            search();

        };

        reset();

        locationGrid.setOnSelectionChanged((rows) => {
            $$('location-open').enable(rows);
            // $$('location-up').disable(rows);
        });
        locationGrid.setOnRowDoubleClicked(search);

        $$('location-up').onclick(() => {
            const count = locationGrid.getNumberOfRows();
            if (count > 1) {
                locationGrid.deleteRowIndex(count - 1);
            }
            const rows = locationGrid.getAllRows();
            if (rows[rows.length - 1].id === '0') {
                orgGroupId = '';
            } else {
                orgGroupId = rows[rows.length - 1].id;
            }
            search();
        });

        const openLocation = () => {
            const row = locationGrid.getSelectedRow();
            if (!row) {
                return;
            }
            const rowIndex = locationGrid.getSelectedRowIndex();
            if (row.id === '0') {
                orgGroupId = '';
            } else {
                orgGroupId = row.id;
            }
            const rows = locationGrid.getAllRows();
            for (let i = rows.length - 1; i > rowIndex; i --) {
                locationGrid.deleteRowIndex(i);
            }
            search();
        };
        $$('location-open').onclick(openLocation);
        locationGrid.setOnRowDoubleClicked(openLocation);

        $$('aop-reset').onclick(reset);
        $$('aop-search').onclick(search);

        orgGroupPopupGrid.setOnSelectionChanged((rows) => {
            $$('org-group-associate').enable(rows);
            $$('org-group-open').enable(rows);
        });
        orgGroupPopupGrid.setOnRowDoubleClicked(() => {
            const row = orgGroupPopupGrid.getSelectedRow();
            orgGroupId = row.id;
            search();
            locationGrid.addRecord({
                location: row.name,
                id: row.id
            });
        });

        $$('org-group-open').onclick(() => {
            const row = orgGroupPopupGrid.getSelectedRow();
            orgGroupId = row.id;
            search();
            locationGrid.addRecord({
                location: row.name,
                id: row.id
            });
        });

        $$('org-group-associate').onclick(() => {
            const row = orgGroupPopupGrid.getSelectedRow();
            if (!row) {
                return;
            }
            const rowIndex = orgGroupPopupGrid.getSelectedRowIndex();

            orgGroupSelectedGrid.addRecord({
                name: row.name,
                id: row.id
            });
            orgGroupPopupGrid.deleteRowIndex(rowIndex);
            $$('org-group-associate').disable();
        });

        const orgGroupDisassociate = () => {
            const row = orgGroupSelectedGrid.getSelectedRow();
            if (!row) {
                return;
            }
            const rowIndex = orgGroupSelectedGrid.getSelectedRowIndex();

            orgGroupPopupGrid.addRecord({
                name: row.name,
                id: row.id
            });
            orgGroupSelectedGrid.deleteRowIndex(rowIndex);
            $$('org-group-disassociate').disable();
        };

        $$('org-group-disassociate').onclick(orgGroupDisassociate);
        orgGroupSelectedGrid.setOnRowDoubleClicked(orgGroupDisassociate);
        orgGroupSelectedGrid.setOnSelectionChanged($$('org-group-disassociate').enable);
            
        const ok = () => {
            const selectedOrgGroups = orgGroupSelectedGrid.getAllRows();
            let orgGroupIds = [];
            for (let i = 0 ; i < selectedOrgGroups.length; i ++) {
                orgGroupIds.push(selectedOrgGroups[i].id);
            }
            const data = {
                folderId: selectedFolder[0].data.id,
                orgGroupIds: orgGroupIds
            };
            AWS.callSoap(WS, 'associateOrgGroupsToFolder', data).then(res => {
                if (res.wsStatus === '0') {
                    updateOrgGroups(selectedFolder[0].data.id);
                }
            });
            Utils.popup_close();
        };

        const cancel = () => {
            Utils.popup_close();
        };

        $$('aop-ok').onclick(ok);
        $$('aop-cancel').onclick(cancel);
    };

    $$('org-associate').onclick(associateOrgGroup);

    orgGroupGrid.setOnSelectionChanged($$('org-disassociate').enable);

    $$('org-disassociate').onclick(() => {
        const row = orgGroupGrid.getSelectedRow();
        if (!row) {
            return;
        }

        const selectedFolder = view.getSelectedNodes();
        if (selectedFolder.length === 0) {
            return;
        }

        AWS.callSoap(WS, 'disassociateOrgGroupsFromFolder', {
            folderId: selectedFolder[0].data.id,
            orgGroupIds: row.id
        }).then(res => {
            if (res.wsStatus === '0') {
                updateOrgGroups(selectedFolder[0].data.id);
            }
        });
    });
})();
