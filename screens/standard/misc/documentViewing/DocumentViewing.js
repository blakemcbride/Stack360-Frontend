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

    const WS = 'StandardMiscDocumentViewing';

    const columnDefs = [
        { headerName: 'Comments', field: 'comment', width: 130 },
        { headerName: 'First Active', field: 'firstActiveDateFormatted', width: 70 },
        { headerName: 'Last Active', field: 'lastActiveDateFormatted', width: 70 }
    ];
    const documentsGrid = new AGGrid('documents-grid', columnDefs, 'id');

    documentsGrid.show();
    documentsGrid.setOnSelectionChanged($$('doc-view').enable);

    let root = new TreeNode("root");

    let view = new TreeView(root, "folder-tree");
    view.changeOption('show_root', false);

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

            $$('doc-view').disable();

        } else {

            documentsGrid.clear();

            $$('doc-view').disable();
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
        AWS.callSoap(WS, 'listFoldersForCurrentPerson').then(res => {
            if (res.wsStatus === '0') {
                let folders = Utils.assureArray(res.folders);
                
                for (let i = 0; i < folders.length; i ++) {
                    addChild(root, folders[i]);
                }
                
                view.collapseAllNodes();
                view.reload();
            }
        });

        $$('doc-view').disable();

        documentsGrid.clear();
    }

    updateTree();

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

})();
