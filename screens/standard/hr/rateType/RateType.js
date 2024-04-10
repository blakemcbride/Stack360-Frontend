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
    const WS = 'StandardHrRateType';
    let resultsGrid;

    $$('add').onclick(() => {
        $$('rt-code').clear();
        $$('rt-description').clear();
        $$('rt-date').clear();
        Utils.popup_open("rt-popup", "rt-code");
        $$('rt-title').setValue('Add Rate Type');

        $$('rt-ok').onclick(() => {
            if ($$('rt-code').isError('Code'))
                return;
            if($$('rt-description').isError('Description'))
                return;
            if($$('rt-date').isError('Last Active Date'))
                return;

            const params = {
                applyToAll: false,
                code: $$('rt-code').getValue(),
                description: $$('rt-description').getValue(),
                lastActiveDate: $$('rt-date').getIntValue()
            };
            AWS.callSoap(WS, 'newRateType', params).then(data => {
                if (data.wsStatus === '0') {
                    getRateTypes();   
                    Utils.popup_close();
                }
            });        
        });

        $$('rt-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Rate Type?', () => {
            const params = {
                ids: resultsGrid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteRateTypes", params).then(data => {
                if (data.wsStatus === '0') {
                    getRateTypes();
                }
            });
        });
    });

    function edit() {
        $$('rt-code').clear();
        $$('rt-description').clear();
        $$('rt-date').clear();
        Utils.popup_open("rt-popup");

        const row = resultsGrid.getSelectedRow();
        $$('rt-title').setValue('Edit Rate Type');
        $$('rt-code').setValue(row.code);
        $$('rt-description').setValue(row.description);
        $$('rt-date').setValue(DateUtils.strToInt(row.lastActiveDate));

        $$('rt-ok').onclick(() => {
            const row = resultsGrid.getSelectedRow();
            const params = {
                applyToAll: false,
                code: $$('rt-code').getValue(),
                id: row.id,
                description: $$('rt-description').getValue(),
                lastActiveDate: $$('rt-date').getIntValue()
            };
            AWS.callSoap(WS, 'saveRateType', params).then(data => {
                if (data.wsStatus === '0') {
                    getRateTypes();   
                    Utils.popup_close();
                }
            });        
        });

        $$('rt-cancel').onclick(() => {
            Utils.popup_close();
        });
    }


    // Load table without data from response
    const showTable = () => {
        const columnDefs = [
            {headerName: "Code", field: "code", width: 10},
            {headerName: "Description", field: "description", width: 65},
            {headerName: "Last active date", field: "lastActiveDate", width: 25}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.multiSelect();
        resultsGrid.show();
        getRateTypes();
    }

    // Load data to table from response
    const getRateTypes = () => {
        $$('edit').disable();
        $$('delete').disable();
    
        const rowData = [];        
    
        // If message object is not null, push the row into the collection.       
        resultsGrid.clear();
        AWS.callSoap(WS, 'listRateTypes').then(data => {
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                const currentDate = new Date();
                for (let item of data.item) {
                    if (item !== null) {       
                        switch (Number($$('rateType').getValue())) {
                            case 1:                         
                                if (item.lastActiveDate === "0" || DateUtils.intToDate(Number(item.lastActiveDate)) >= currentDate) {
                                    rowData.push({
                                        'code': item.code,
                                        'description': item.description,
                                        'lastActiveDate': item.lastActiveDate !== "0" ? DateUtils.intToStr4(Number(item.lastActiveDate)) : '',
                                        'id': item.id
                                    });
                                } 
                                break;  

                            case 2:
                                if (item.lastActiveDate !== "0" && DateUtils.intToDate(Number(item.lastActiveDate)) < currentDate) {
                                    rowData.push({
                                        'code': item.code,
                                        'description': item.description,
                                        'lastActiveDate': item.lastActiveDate !== "0" ? DateUtils.intToStr4(Number(item.lastActiveDate)) : '',
                                        'id': item.id
                                    });
                                }
                                break;
                        
                            default:   
                                    rowData.push({
                                        'code': item.code,
                                        'description': item.description,
                                        'lastActiveDate': item.lastActiveDate !== "0" ? DateUtils.intToStr4(Number(item.lastActiveDate)) : '',
                                        'id': item.id
                                    });
                                break;
                        }
                    }
                }
                resultsGrid.addRecords(rowData);                
                resultsGrid.setOnRowDoubleClicked(edit);
            }     
        });
    }

    $$('rateType').onChange(getRateTypes);
    
    showTable();

    resultsGrid.setOnSelectionChanged((rows) => {
        $$('edit').enable(rows);
        $$('delete').enable(rows);
    });
})();
