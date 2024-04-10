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

    const WS = 'StandardProjectDetailReport';

    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('project-info').setValue(projectName + " - " + projectSummary).setColor('black');

    const availableGridColumns = [
        { headerName: 'Field', field: 'id' }
    ];

    const availableGrid = new AGGrid('available-fields-grid', availableGridColumns, 'id');
    availableGrid.show();
    availableGrid.setOnSelectionChanged($$('available-add').enable);
    availableGrid.setOnRowDoubleClicked(addField);

    const selectedGridColumns = [
        { headerName: 'Field', field: 'id' }
    ];

    const selectedGrid = new AGGrid('selected-fields-grid', selectedGridColumns, 'id');
    selectedGrid.show();
    selectedGrid.setOnSelectionChanged((rows) => {
        $$('selected-up').enable(rows);
        $$('selected-down').enable(rows);
        $$('selected-remove').enable(rows);
    });
    selectedGrid.setOnRowDoubleClicked(removeField);

    let fieldsData = [];
    let fieldsGroupData = [];
    let groupTypes = [];

    let availableFields = [];
    let selectedFields = [];

    await AWS.callSoap(WS, 'listFields').then(res => {
        fieldsData = Utils.assureArray(res.item);
    });

    await AWS.callSoap(WS, 'listFieldGroups').then(res => {
        fieldsGroupData = res.item;
    });
    
    groupTypes.push({
        value: '',
        label: '(select)'
    });
    fieldsGroupData.forEach(element => {
        groupTypes.push({
            value: element.description,
            label: element.description
        });
    });

    availableFields = fieldsData;

    fieldsGroupData[0].id.forEach(element => {
        selectedFields.push({
            id: element
        });
        const index = availableFields.findIndex(field => (field.id === element));
        availableFields.splice(index, 1);
    });


    $$('field-group-type').addItems(groupTypes, 'value', 'label');

    availableGrid.addRecords(availableFields);
    $$('available-fields-status').setValue(`Displaying ${availableFields.length} Available Fields`);

    selectedGrid.addRecords(selectedFields);
    $$('selected-fields-status').setValue(`Displaying ${selectedFields.length} Selected Fields`);

    $$('field-group-type').onChange(val => {
        if (val) {
            $$('group-add').enable();
            $$('group-remove').enable();
        } else {
            $$('group-add').disable();
            $$('group-remove').disable();
        }
    });

    $$('group-add').onclick(addFields);
    $$('group-remove').onclick(removeFields);

    function updateGrids() {

        availableFields.sort(function(a, b) {
            if (a.id < b.id)
              return -1;

            if (a.id > b.id)
              return 1;
          
            return 0;
        });

        availableGrid.clear();
        availableGrid.addRecords(availableFields);
        $$('available-fields-status').setValue(`Displaying ${availableFields.length} Available Fields`);

        selectedGrid.clear();
        selectedGrid.addRecords(selectedFields);
        $$('selected-fields-status').setValue(`Displaying ${selectedFields.length} Selected Fields`);

        $$('available-add').disable();
        $$('selected-up').disable();
        $$('selected-down').disable();
        $$('selected-remove').disable();
    }

    function addFields() {
        const selectedGroup = $$('field-group-type').getValue();
        if (!selectedGroup)
            return;

        const selectedFieldGroup = fieldsGroupData.find(val => val.description === selectedGroup);
        
        selectedFieldGroup.id.forEach(element => {
            if (selectedFields.findIndex(field => field.id === element) < 0) {
                selectedFields.push({
                    id: element
                });
                let index = availableFields.findIndex(field => (field.id === element));
                availableFields.splice(index, 1);
            }
        });

        updateGrids();
    }

    function removeFields() {
        const selectedGroup = $$('field-group-type').getValue();
        if (!selectedGroup)
            return;

        const selectedFieldGroup = fieldsGroupData.find(val => val.description === selectedGroup);
        
        selectedFieldGroup.id.forEach(element => {
            if (selectedFields.findIndex(field => field.id === element) >= 0) {
                availableFields.push({
                    id: element
                });
                const index = selectedFields.findIndex(field => (field.id === element));
                selectedFields.splice(index, 1);
            }
        });

        updateGrids();
    }

    function addField() {
        const row = availableGrid.getSelectedRow();

        if (!row)
            return;

        if (selectedFields.findIndex(field => field.id === row.id) < 0) {
            selectedFields.push({
                id: row.id
            });
            const index = availableFields.findIndex(field => (field.id === row.id));
            availableFields.splice(index, 1);

            updateGrids();
        }
    }

    function removeField() {
        const row = selectedGrid.getSelectedRow();

        if (!row)
            return;

        if (selectedFields.findIndex(field => field.id === row.id) >= 0) {
            availableFields.push({
                id: row.id
            });
            const index = selectedFields.findIndex(field => (field.id === row.id));
            selectedFields.splice(index, 1);

            updateGrids();
        }
    }

    $$('available-add').onclick(addField);
    $$('selected-remove').onclick(removeField);

    function selectedUp() {
        const row = selectedGrid.getSelectedRow();

        if (!row)
            return;

        const index = selectedFields.findIndex(field => field.id === row.id);
        const temp = selectedFields[index];
        let upIndex = index - 1;
        if (index === 0)
            upIndex = selectedFields.length - 1;

        selectedFields[index] = selectedFields[upIndex];
        selectedFields[upIndex] = temp;

        updateGrids();

        selectedGrid.selectId(row.id);
    }

    function selectedDown() {
        const row = selectedGrid.getSelectedRow();

        if (!row)
            return;

        const index = selectedFields.findIndex(field => field.id === row.id);
        const temp = selectedFields[index];
        let downIndex = index + 1;
        if (index === selectedFields.length - 1)
            downIndex = 0;

        selectedFields[index] = selectedFields[downIndex];
        selectedFields[downIndex] = temp;

        updateGrids();

        selectedGrid.selectId(row.id);
    }

    $$('selected-up').onclick(selectedUp);
    $$('selected-down').onclick(selectedDown);

    $$('detail-report').onclick(() => {
        const ids = [];
        selectedFields.forEach(field => {
            ids.push(field.id);
        });
        const data = {
            ids: ids,
            projectId: projectId
        };

        AWS.callSoap(WS, 'getReport', data).then(ret => {            
            Utils.showReport(ret.reportUrl);
        });
    });

    $$('detail-export').onclick(() => {
        const ids = [];
        selectedFields.forEach(field => {
            ids.push(field.id);
        });
        const data = {
            ids: ids,
            projectId: projectId
        };

        AWS.callSoap(WS, 'getExport', data).then(ret => {            
            Utils.showReport(ret.csvUrl);
        });
    });
    
})();
