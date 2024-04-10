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
    const WS = 'StandardHrHrTraining';
    const personName = Utils.getData(HR_PERSON_NAME);
    const personId = Utils.getData(HR_PERSON_ID);
    $$('worker-name').setValue(personName);
    let resultsGrid;
    let popupEditing;


    $$('add').onclick(() => {
        popupEditing = false;
        $$('trainingClientDropDown').clear();
        $$('trainingCatNameDropDown').clear();
        $$('training-date').clear();
        $$('training-hours').clear();
        $$('training-expDate').clear();
        Utils.popup_open("training-popup");
        getClientByName();
        $$('training-title').setValue('Add Training');

        $$('training-ok').onclick(() => {
            if ($$('training-expDate').isError('Expiration Date'))  
                return;
            if($$('trainingCatNameDropDown').isError('Category Name')) 
                return;
            if($$('training-date').isError('Training Date')) 
                return;
            if($$('training-hours').isError('Actual Hours'))
                return;
            const params = {
                employeeId: personId,
                applyToAll: false,
                expireDate: $$('training-expDate').getIntValue(),
                trainingCategoryId: $$('trainingCatNameDropDown').getValue(),
                trainingDate: $$('training-date').getIntValue(),
                trainingHours: $$('training-hours').getValue()
            };
            AWS.callSoap(WS, 'newTrainingDetail', params).then(data => {
                if (data.wsStatus === '0') {
                    getListTrainingDetails();
                    Utils.popup_close();
                }
            });        
        });

        $$('training-cancel').onclick(() => {
            Utils.popup_close();
        });
    });


    $$('edit').onclick(() => {
        edit();
    });

    function edit() {
        popupEditing = true;
        $$('trainingClientDropDown').clear();
        $$('trainingCatNameDropDown').clear();   
        Utils.popup_open("training-popup");    
        const row = resultsGrid.getSelectedRow();
        getClientByName();
        $$('training-title').setValue('Edit Training');
        $$('training-date').setValue(DateUtils.strToInt(row.date));
        $$('training-expDate').setValue(DateUtils.strToInt(row.exp_date));
        $$('training-hours').setValue(row.hours);

        $$('training-ok').onclick(() => {
            if ($$('training-expDate').isError('Expiration Date')) 
                    return;
            if ($$('trainingCatNameDropDown').isError('Category Name')) 
                return;
            if ($$('training-date').isError('Training Date')) 
                return;
            if ($$('training-hours').isError('Actual Hours'))
                return;

            const params = {
                employeeId: personId,
                applyToAll: false,
                trainingDetailId: row.id,
                expireDate: $$('training-expDate').getIntValue(),
                trainingCategoryId: $$('trainingCatNameDropDown').getValue(),
                trainingDate: $$('training-date').getIntValue(),
                trainingHours: $$('training-hours').getValue()
            };
            AWS.callSoap(WS, 'saveTrainingDetail', params).then(data => {
                if (data.wsStatus === '0') {
                    getListTrainingDetails();
                    Utils.popup_close();
                }
            });        
        });

        $$('training-cancel').onclick(() => {
            Utils.popup_close();
        });
    }

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you wish to delete the selected Training?', () => {
            const params = {
                ids: resultsGrid.getSelectedRow().id
            };
            AWS.callSoap(WS, "deleteTrainingDetails", params).then(data => {
                if (data.wsStatus === '0') {
                    getListTrainingDetails();
                }
            });
        });
    });

    $$('report').onclick(() => {
        const params = {     
            employeeId: personId
        };
        AWS.callSoap(WS, 'getTrainingDetailsReport', params).then(data => {
            if (data.wsStatus === '0') {   
                Utils.showReport(data.fileName);
            }
        });     
    });

    const showTable = () => {
        const columnDefs = [
            {headerName: "Training Date", field: "date", width: 30},
            {headerName: "Client Name", field: "client_name", width: 50},
            {headerName: "Category Name", field: "category_name", width: 100},
            {headerName: "Hours", field: "hours", type: 'numericColumn', width: 30},
            {headerName: "Expiration Date", field: "exp_date", width: 40}
        ];
        resultsGrid = new AGGrid('resultsGrid', columnDefs);
        resultsGrid.show();
        getListTrainingDetails();
    }            

    const getClientByName = () => {
        // const params = {
        //     nameSearchType: 0, 
        //     clientId: ""
        // }
        // AWS.callSoap(WS, 'searchClientByName', params).then(listClients => {
        //     if (listClients.wsStatus === "0") {
        //         listClients.clients = Utils.assureArray(listClients.clients);
        //         $$('trainingClientDropDown').addItems(listClients.clients, "orgGroupId", "clientName");
        //         getListTrainingCategories();
        //     }            
        // });     
        const row = resultsGrid.getSelectedRow();
        
        const params = {
            nameSearchType: 0, 
            clientId: ""
        };
        AWS.callSoap(WS, 'searchClientByName', params).then(res => {
            if (res.wsStatus === "0") {
                res.clients = Utils.assureArray(res.clients);
                const ctl = $$('trainingClientDropDown');
                ctl.clear();
                if (res.clients.length === 0) {
                    ctl.nothingToSelect();
                } else if (res.clients.length === 1) {
                    ctl.singleValue(res.clients[0].orgGroupId, res.clients[0].clientName);
                } else if (res.clients.length <= res.lowCap) {
                    ctl.useDropdown();
                    ctl.add('', '(choose)');
                    for (let i = 0 ; i < res.clients.length; i++)
                        ctl.add(res.clients[i].orgGroupId, res.clients[i].clientName);
                    ctl.setValue(row.clientId !== "" ? row.clientId : res.clients[0].orgGroupId);
                } else {
                    ctl.forceSelect();
                    ctl.setValue(row.clientId, row.client_name);
                }
                getListTrainingCategories();
                $$('trainingClientDropDown').onChange(getListTrainingCategories);
            }
        });

        $$('trainingClientDropDown').setSelectFunction(async function () {
            let res = await Utils.component('companySelection/CompanySelection', 'component-company-selection');
            if (res._status === "ok")
                $$('trainingClientDropDown').setValue(res.id, res.name);
        });
    }

    const getListTrainingCategories = () => {
        const ctl = $$('trainingCatNameDropDown');
        ctl.clear().add('', '(select)');
        const params = {
            clientId: $$('trainingClientDropDown').getValue()
        };
        AWS.callSoap(WS, 'listTrainingCategories', params).then(listTrainingCategories => {
            if (listTrainingCategories.wsStatus === "0") {
                listTrainingCategories.item = Utils.assureArray(listTrainingCategories.item);
                ctl.addItems(listTrainingCategories.item, "trainingCategoryId", "name");
                if (popupEditing)
                    ctl.setValue(resultsGrid.getSelectedRow().trainingCategoryId);
            }            
        });     
    }

    const getListTrainingDetails = () => {
        const rowData = [];  
        $$('edit').disable();
        $$('delete').disable();
        resultsGrid.clear();
        const params = {
            employeeId: personId
        }
        AWS.callSoap(WS, 'listTrainingDetails', params).then(listTrainingDetails => {
            if (listTrainingDetails.wsStatus === "0") {
                listTrainingDetails.item = Utils.assureArray(listTrainingDetails.item);
                for (let item of listTrainingDetails.item) {
                    if (item !== null) {
                        rowData.push({
                            "id": item.trainingId,
                            'category_name': item.categoryName,
                            'clientId': item.clientId,
                            'client_name': item.clientName,
                            'trainingCategoryId': item.trainingCategoryId,
                            'hours': Utils.format(Number(item.trainingHours), "", 0, 2),
                            'date': item.trainingDate !== "0" ? DateUtils.intToStr4(Number(item.trainingDate)) : '',
                            'exp_date': item.expireDate !== "0" ? DateUtils.intToStr4(Number(item.expireDate)) : '',
                        });
                    }
                }
                resultsGrid.addRecords(rowData); 
                resultsGrid.setOnSelectionChanged((rows) => {
                    $$('edit').enable(rows);
                    $$('delete').enable(rows);
                });   
                resultsGrid.setOnRowDoubleClicked(edit);
            }            
        });        
    }
    showTable();

    $$('trainingClientDropDown').onChange(getListTrainingCategories);
})();
