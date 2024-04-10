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
    const WS = 'StandardHrProjectCheckList';
    const projectId = Utils.getData("CURRENT_PROJECT_ID");
    const projectName = Utils.getData("CURRENT_PROJECT_NAME");
    const projectSummary = Utils.getData("CURRENT_PROJECT_SUMMARY");

    $$('pcl-project').setValue(projectName + " - " + projectSummary);

    let checkListGrid;
 
    const checkListColumnDefs = [
        {headerName: "Required", field: "required", width: 120},
        {headerName: "Completed", field: "completedDate", type: "numericColumn", width: 120},
        {headerName: "Summary", field: "description", width: 840}
    ];
    checkListGrid = new AGGrid('checkListGrid', checkListColumnDefs);
    checkListGrid.show();

    const params = {
        projectId: projectId
    }

    $$('pcl-routeStopOwner').add('', "(select)");
    AWS.callSoap(WS, 'listRouteStopsForProject', params).then(data => {
        if (data.wsStatus === "0") {
            data.item = Utils.assureArray(data.item);
            $$('pcl-routeStopOwner').addItems(data.item, "routeStopId", "routeStopNameFormatted");
            $$('pcl-routeStopOwner').setValue(data.currentRouteStopId);
            getListCheckListDetailsForRouteStop();
        }  
    });

    function getListCheckListDetailsForRouteStop() {
        checkListGrid.clear();

        const params = {
            projectId: projectId,
            routeStopId: $$('pcl-routeStopOwner').getValue()
        };
        AWS.callSoap(WS, 'listCheckListDetailsForRouteStop', params).then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);                
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].completedDate = data.item[i].completedDate !== '0' ? DateUtils.intToStr4(Number(data.item[i].completedDate)) : '';
                }
                checkListGrid.addRecords(data.item);

                $$('pcl-status').setValue('Displaying ' + data.item.length + ' Check List Details');

                checkListGrid.setOnSelectionChanged($$('pcl-view').enable);
                checkListGrid.setOnRowDoubleClicked(view);
            }
        });   
    }

    function view() {
        $$('pcl-summary').clear();
        $$('pcl-required').clear();
        $$('pcl-detail').clear();
        $$('pcl-completedBy').clear();
        $$('pcl-completedDate').clear();
        $$('pcl-comment').clear();
        $$('pcl-enteredBy').clear();
        $$('pcl-enteredDate').clear();

        const row = checkListGrid.getSelectedRow();

        const params = {
            checkListDetailId: row.checkListDetailId,
            checkListId: row.checkListId
        }
        AWS.callSoap(WS, 'loadCheckListDetail', params).then(data => {
            if (data.wsStatus === '0') {    
                $$('pcl-summary').setValue(row.description);
                $$('pcl-required').setValue(row.required);
                $$('pcl-detail').setValue(data.detail);
                $$('pcl-completedBy').setValue(data.completedName);
                $$('pcl-completedDate').setValue(row.completedDate);
                $$('pcl-comment').setValue(data.comments);
                $$('pcl-enteredBy').setValue(data.entryNameFormatted);
                $$('pcl-enteredDate').setValue(data.entryDateTimeFormatted);
            }
        });   

        Utils.popup_open('pcl-popup');



        $$('pcl-close').onclick(() => {
            Utils.popup_close();
        })
    }

    $$('pcl-view').onclick(view);

    $$('pcl-routeStopOwner').onChange(getListCheckListDetailsForRouteStop);

    $$('pcl-report').onclick(() => {
        const params = {
            projectId: projectId,
            routeStopId: $$('pcl-routeStopOwner').getValue()
        };

        AWS.callSoap(WS, "getReport", params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });
    });
})();
