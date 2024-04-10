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

    const WS = 'com.arahant.services.standard.hr.labelSearch';

    $$('project').forceSelect();

    Utils.setGridHeight('screen-start', 'grid', 'bottom-start', 'bottom-end', 'screen-end');
    
    //  cell renderer
    
    function I9Color() {}

    I9Color.prototype.init = function(params) {
        this.eGui = document.createElement('div');
        let p1 = params.data.i9_part1;
        let p2 = params.data.i9_part2;
        if (p1 === 'Y'  &&  p2 === 'Y')
            this.eGui.innerHTML = '<span>' + params.data.i9 + '</span>';
        else if (p1 === 'Y'  &&  p2 === 'N')
            this.eGui.innerHTML = '<span style="color: yellow;">' + params.data.i9 + '</span>';
        else if (p1 === 'N'  &&  p2 === 'Y')
            this.eGui.innerHTML = '<span style="color: cyan;">' + params.data.i9 + '</span>';
        else if (p1 === 'N'  &&  p2 === 'N')
            this.eGui.innerHTML = '<span style="color: red;">' + params.data.i9 + '</span>';
    };

    I9Color.prototype.getGui = function() {
        return this.eGui;
    };
    
    //  End of CellRenderer
    
    const columnDefs = [
        {headerName: 'Name', field: 'name', width: 100},
        {headerName: 'Labels', field: 'labels', width: 100},
        {headerName: 'I9 Status', field: 'i9', cellRenderer: 'i9Color', width: 50}
    ];
    const grid = new AGGrid('grid', columnDefs, 'person_id');
    grid.addComponent('i9Color', I9Color);
    grid.show();

    let res = await Server.call(WS, "GetLabels");
    if (res._Success) {
        $$('label-1').add('', '(none selected)').addItems(res.labels, 'employee_label_id', 'name');
        $$('label-2').add('', '(none selected)').addItems(res.labels, 'employee_label_id', 'name');
        $$('label-3').add('', '(none selected)').addItems(res.labels, 'employee_label_id', 'name');
    }

    $$('project').setSelectFunction(async () => {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok") {
            $$('project').setValue(res.projectId, res.id + '-' + res.summary);
            grid.clear();
        }
    });

    $$('reset').onclick(() => {
        $$('project').clear();
        $$('label-1').setValue('');
        $$('label-2').setValue('');
        $$('label-3').setValue('');
        $$('i9').setValue('0');
    });

    function search() {
        $$('edit').disable();
        const lbl1 = $$('label-1').getValue();
        const lbl2 = $$('label-2').getValue();
        const lbl3 = $$('label-3').getValue();
        if (!lbl1 && !lbl2 && !lbl3) {
            Utils.showMessage('Error', 'You must select at least one label.');
            return;
        }
        const data = {
            projectId: $$('project').getValue(),
            label1: lbl1,
            label2: lbl2,
            label3: lbl3,
            i9: $$('i9').getValue()
        };
        Server.call(WS, "SearchWorkers", data).then(function (res) {
            if (res._Success) {
                const workers = res.workers;
                for (let i=0 ; i < workers.length ; i++) {
                    let w = workers[i];
                    let name = w.lname + ", " + w.fname;
                    if (w.mname)
                        name += " " + w.mname;
                    w.name = name;

                    let labels = w.labels;
                    let lblStr = '';
                    for (let j=0 ; j < labels.length ; j++)
                        lblStr += (lblStr ? ', ' : '') +  labels[j];
                    w.labels = lblStr;

                    if (w.i9_part1 === 'N' && w.i9_part2 === 'N')
                        w.i9 = 'Parts I and II incomplete';
                    else if (w.i9_part1 === 'Y' && w.i9_part2 === 'N')
                        w.i9 = 'Parts I complete, Part II incomplete';
                    else if (w.i9_part1 === 'Y' && w.i9_part2 === 'Y')
                        w.i9 = 'Parts I and II complete';
                    else if (w.i9_part1 === 'N' && w.i9_part2 === 'Y')
                        w.i9 = 'Parts I incomplete, Part II complete (??)';
                }
                grid.clear().addRecords(workers);
                if (workers.length < res.totalRecords)
                    $$('status').setColor('red').setValue(workers.length + ' workers shown (' + res.totalRecords + ' found)');
                else
                    $$('status').setColor('black').setValue(workers.length + ' workers');
            }
        });
    }

    $$('search').onclick(search);

    if (Utils.getData("label-search-active")) {
        $$('label-1').setValue(Utils.getData('label-search-label-1'));
        $$('label-2').setValue(Utils.getData('label-search-label-2'));
        $$('label-3').setValue(Utils.getData('label-search-label-3'));
        $$('i9').setValue(Utils.getData('label-search-i9'));
        $$('project').setValue(Utils.getData('label-search-project-id'), Utils.getData('label-search-project-name'));

        Utils.getAndEraseData('label-search-active');
        Utils.getAndEraseData('label-search-label-1');
        Utils.getAndEraseData('label-search-label-2');
        Utils.getAndEraseData('label-search-label-3');
        Utils.getAndEraseData('label-search-i9');
        Utils.getAndEraseData('label-search-project-id');
        Utils.getAndEraseData('label-search-project-name');

        search();
    }

    function editEmployee() {
        const row = grid.getSelectedRow();

        // for the children
        Utils.saveData(HR_PERSON_ID, row.person_id);
        Utils.saveData(HR_PERSON_NAME, row.name);

        // for when we return
        Utils.saveData("label-search-active", true);
        Utils.saveData("label-search-label-1", $$('label-1').getValue());
        Utils.saveData("label-search-label-2", $$('label-2').getValue());
        Utils.saveData("label-search-label-3", $$('label-3').getValue());
        Utils.saveData("label-search-i9", $$('i9').getValue());
        Utils.saveData("label-search-project-id", $$('project').getValue());
        Utils.saveData("label-search-project-name", $$('project').getLabel());
        Framework.getChild();
    }

    grid.setOnRowDoubleClicked(editEmployee);
    grid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
    });

    $$('edit').onclick(() => {
        const row = grid.getSelectedRow();
        if (!row)
            return;
        editEmployee();
    })


})();

