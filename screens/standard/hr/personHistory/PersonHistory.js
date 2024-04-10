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
    const WS = 'StandardHrPersonHistory';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('ph-employee').setValue(personName);

    let personHistoryGrid;
 
    const personHistoryColumnDefs = [
        {headerName: "Name", field: "personName", width: 400},
        {headerName: "Date Changed", field: "changeDateFormatted", type: "numericColumn", width: 120},
        {headerName: "Editing Person", field: "changePerson", width: 320},
        {headerName: "Change Type", field: "changeType", width: 400}
    ];
    personHistoryGrid = new AGGrid('personHistoryGrid', personHistoryColumnDefs);
    personHistoryGrid.show();  

    function searchPersonHistory() {

        const params = {           
            personId: personId,
            fromDate: $$('ph-fromDate').getIntValue(),
            toDate: $$('ph-toDate').getIntValue()
        };
        AWS.callSoap(WS, 'searchPersonHistory', params).then(data => {
            if (data.wsStatus === '0') {     
                personHistoryGrid.clear();
                data.item = Utils.assureArray(data.item);
                $$('ph-status').setValue('Displaying ' + data.item.length + ' Person History Records');
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].changeDateFormatted = DateUtils.intToStr4(Number(data.item[i].changeDate));
                }
                personHistoryGrid.addRecords(data.item);
                personHistoryGrid.setOnSelectionChanged(() => {
                    $$('view').enable();                    
                });
                personHistoryGrid.setOnRowDoubleClicked(view);
            }
        });   
    }

    searchPersonHistory();

    $$('search').onclick(searchPersonHistory);

    let viewGrid;
 
    const viewColumnDefs = [
        {headerName: "Field", field: "fieldName", width: 200},
        {headerName: "Previous Value", field: "oldValue", width: 200},
        {headerName: "New Value", field: "newValue", width: 200}
    ];
    viewGrid = new AGGrid('viewGrid', viewColumnDefs);
    viewGrid.rowStyleFunction(() => {
        return { background: $('#ph-fieldsColor').val() };
    });
    viewGrid.show();  

    function view() {
        const row = personHistoryGrid.getSelectedRow();

        $('#ph-fieldsColor').val('#94c0d5');

        $('#ph-fieldsColor').change(() => {
            getListHistoryComparisons();
        });

        function getListHistoryComparisons() {
            const params = {           
                personId: personId,
                historyId: row.historyId,
            };
            AWS.callSoap(WS, 'listHistoryComparisons', params).then(data => {
                if (data.wsStatus === '0') {     
                    viewGrid.clear();
                    data.item = Utils.assureArray(data.item);
    
                    viewGrid.addRecords(data.item);
                }
            });   
        }

        getListHistoryComparisons();

        Utils.popup_open("view-popup");

        $$('view-ok').onclick(Utils.popup_close);
    }

    $$('view').onclick(view);
})();
