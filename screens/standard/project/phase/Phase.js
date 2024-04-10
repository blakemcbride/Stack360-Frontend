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

    const WS = 'StandardProjectPhase';

    const columnDefs = [
        { headerName: 'Code', field: 'code', width: 50 },
        { headerName: 'Description', field: 'description', width: 150 },
        { headerName: 'Security Category', field: 'categoryName', width: 40 },
        { headerName: 'Last Active Date', field: 'lastActiveDate1', width: 35 },
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');

    grid.show();
    grid.setOnRowDoubleClicked(edit);
    grid.setOnSelectionChanged(function (rows) {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });

    function updateGrid() {

        grid.clear();

        AWS.callSoap(WS, 'listPhases').then(ret => {
            if (ret.wsStatus === '0') {
                let records = Utils.assureArray(ret.item);
                let data = [];

                for (let i = 0; i < records.length; i ++) {
                    let row = records[i];
                    row.lastActiveDate1 = DateUtils.intToStr4(Number(row.lastActiveDate));

                    if ($$('type').getValue() == '3') {
                        data.push(row);
                        continue;
                    }
                    if ($$('type').getValue() == '1' && (row.lastActiveDate == 0 || row.lastActiveDate >= DateUtils.dateToInt(new Date))) {
                        data.push(row);
                        continue;
                    }
                    if ($$('type').getValue() == '2' && (row.lastActiveDate != 0 && row.lastActiveDate < DateUtils.dateToInt(new Date))) {
                        data.push(row);
                    }
                }
                grid.addRecords(data);
                $$('status').setValue(`Displaying ${data.length} Project Phases`);

                $$('edit').disable();
                $$('delete').disable();
            }
        });
    }

    updateGrid();

    const phasePopup = (row) => {

        let resetDialog = () => {

            if (row) {
                $$('pp-title').setValue(`Edit Project Phase`);
            } else {
                $$('pp-title').setValue(`Add Project Phase`);
            }

            $$('pp-code').clear();
            $$('pp-description').clear();
            $$('pp-category').setValue('');
            $$('pp-last-active-date').clear();
            $$('pp-apply-all').clear();
            
        };

        let initDialog = async () => {            
            resetDialog();

            AWS.callSoap(WS, 'listSecurityCategories').then(res => {
                if (res.wsStatus === '0') {
                    fillDropDownFromService('pp-category', res, 'id', 'name');
                    if (row) {
                        $$('pp-category').setValue(row.categoryId);
                    }
                }
            });

            if (!row)
                return;

            $$('pp-code').setValue(row.code);
            $$('pp-description').setValue(row.description);
            $$('pp-last-active-date').setValue(row.lastActiveDate);
            $$('pp-apply-all').setValue(row.allCompanies);
        };

        initDialog();
        
        Utils.popup_open('phase-popup');
    
        return new Promise(async function (resolve, reject) {
            
            let ok = async () => {
                if ($$('pp-code').isError('Code'))
                    return;
                
                if ($$('pp-description').isError('Description'))
                    return;
                    
                const data = {
                    code: $$('pp-code').getValue(),
                    description: $$('pp-description').getValue(),
                    categoryId: $$('pp-category').getValue(),
                    allCompanies: $$('pp-apply-all').getValue(),
                    lastActiveDate: $$('pp-last-active-date').getIntValue()
                };
                
                resolve(data);
                Utils.popup_close();
            };
    
            let cancel = () => {
                resolve(null);
                Utils.popup_close();
            };

            $$('pp-ok').onclick(ok);
            $$('pp-cancel').onclick(cancel);
        });
    
    };

    $$('type').onChange(updateGrid);

    $$('add').onclick(async () => {
        let data = await phasePopup();
        if (data) {
            AWS.callSoap(WS, 'newPhase', data).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    });

    async function edit() {
        let row = grid.getSelectedRow();

        if (!row)
            return;

        let data = await phasePopup(row);
        if (data) {
            AWS.callSoap(WS, 'savePhase', { ... data, id: row.id }).then(ret => {
                if (ret.wsStatus === '0') {
                    updateGrid();
                }
            });
        }
    }
    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Project Phase?', () => {
            const data = {
                ids: [grid.getSelectedRow().id]
            };
            
            AWS.callSoap(WS, "deletePhases", data).then(function (res) {
                if (res.wsStatus === '0') {
                    updateGrid();
                }
            });
        });
    });
    $$('report').onclick(() => {
        AWS.callSoap(WS, "getReport").then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showReport(res.reportUrl);
            }
        });
    });


})();