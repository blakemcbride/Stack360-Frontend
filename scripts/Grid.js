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

/**
 * @deprecated
 *
 * This is an old and bad class.  Use the AGGrid class instead.
 *
 * This class acts as a wrapper to agGrid. It can be used to create an agGrid.Grid object and manipulate the data per application requirements.
 * Please refer to agGrid documentation on 'https://www.ag-grid.com/documentation-main/documentation.php' for more information.
 *
 * All rights reserved.
 */

'use strict';

/**
 * @deprecated
 */
class Grid {

    constructor(columns, data, rowSelection = Grid.MULTI_SELECTION) {
        this.columns = columns;
        this.data = data;
        this.rowSelection = rowSelection
        this.gridInstantiated = false;
        this.components = {};
    }

    /**
     * Create a new agGrid object.
     * @param gridId
     */
    build(gridId) {
        this.gridOptions = {
            columnDefs: this.columns,
            rowData: this.data,
            rowSelection: this.rowSelection,
            suppressHorizontalScroll: true,
            components: this.components,
            // Disable all warnings
            // suppressPropertyNamesCheck: true
            defaultColDef: {
                resizable: true
            },

            onGridReady: function (params) {
                params.api.sizeColumnsToFit();

                window.addEventListener('resize', function() {
                    setTimeout(function() {
                        params.api.sizeColumnsToFit();
                    })
                })
            },
            /*
            getRowNodeId: function (data) {
                return data[self.keyColumn];
            }

             */
        };

        let eGridDiv = document.querySelector('#' + gridId);
        if (!eGridDiv)
            console.log("grid id " + this.id + " does not exist");
        else {
            eGridDiv.classList.add('ag-theme-balham');
            new agGrid.Grid(eGridDiv, this.gridOptions);
            AGGrid.addGrid(this);
            this.gridInstantiated = true;
        }
    }

    destroy() {
        if (this.gridInstantiated) {
            this.gridOptions.api.destroy();
            this.gridInstantiated = false;
            this.components = null;
        }
    }

    addComponent(tag, cls) {
        this.components[tag] = cls;
        return this;
    }

    clear() {
        this.gridOptions.api.setRowData([]);
    }

    setRowData(data) {
        this.gridOptions.api.setRowData(data);
    }

    addRecords(data) {
        return this.gridOptions.api.applyTransaction({add: data});
    }

    addRecord(data) {
        return this.gridOptions.api.applyTransaction({add: [data]});
    }

    updateSelectedRecord(index, data) {
        this.getSelectedNodes()[index].setData(data);
    }

    deleteSelectedRecords() {
        let selectedData = this.gridOptions.api.getSelectedRows();
        this.gridOptions.api.applyTransaction({remove: selectedData});
    }

    getSelectedNodes() {
        return this.gridOptions.api.getSelectedNodes();
    }

    getDataItems() {
        let dataItems = [];
        this.gridOptions.api.rowModel.forEachNode(node => {
            dataItems.push(node.data);
        });

        return dataItems;
    }

    setOnSelectionChanged(fn) {
        this.gridOptions.onSelectionChanged = fn;
    }

    setOnRowDoubleClicked(fn) {
        this.gridOptions.onRowDoubleClicked = fn;
    }

    isEmpty() {
        return (this.gridOptions.api.rowModel.getRowCount() === 0);
    }

    sizeColumnsToFit() {
        if (this.gridOptions === undefined) {
            console.error("Grid options not found. Make sure the grid is built using the 'build' method.");
        } else {
            this.gridOptions.api.sizeColumnsToFit();
        }
    }
}

// class variables
Grid.SINGLE_SELECTION = 'single';
Grid.MULTI_SELECTION = 'multiple';
