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
    const WS = 'StandardCrmSalesPoints';

    // Is this request needed for this page and if yes for what? 
    AWS.callSoap(WS, 'listActivities').then(data => {
        if (data.wsStatus === '0') {
            data.item = Utils.assureArray(data.item);
        }
    });  

    function getListSalesPoints() {
        const params = {
            fromDate: $$('sp-fromDate').getIntValue(),
            toDate: $$('sp-toDate').getIntValue()
        }
        AWS.callSoap(WS, 'listSalesPoints', params).then(data => {
            if (data.wsStatus === '0') {
                salesPointsGrid.clear();
                
                var oParser = new DOMParser();
                var oDOM = oParser.parseFromString(data.xmlString, "application/xml");
                const nodeElements = oDOM.documentElement.childNodes;

                let rowData = [];
                for (let i = 0; i < nodeElements.length; i++) {
                    let item = {};
                    for (let j = 0; j < nodeElements[i].childNodes.length; j++) {
                        if (nodeElements[i].childNodes[j].nodeName === 'ref.Meeting') {
                            item.refMeeting = nodeElements[i].childNodes[j].innerHTML;
                        } else {
                            item[nodeElements[i].childNodes[j].nodeName] = nodeElements[i].childNodes[j].innerHTML;
                        }
                    }
                    rowData.push(item)                 
                }

                salesPointsGrid.addRecords(rowData); 
            }
        });  
    }

    let salesPointsGrid;

    const salesPointsColumnDefs = [
        {headerName: "Sales Person", field: "personName", width: 150},
        {headerName: "Dials", field: "dials", width: 150},
        {headerName: "Meeting", field: "meeting", width: 150},
        {headerName: "GoTo Meeting", field: "gotoMeeting", width: 150},
        {headerName: "Ref. Meeting", field: "refMeeting", width: 150},
        {headerName: "None", field: "none", width: 150},
        {headerName: "Total Points", field: "totalPoints", width: 150}
    ];

    salesPointsGrid = new AGGrid('salesPointsGrid', salesPointsColumnDefs);
    salesPointsGrid.show(); 

    getListSalesPoints();

    $$('search').onclick(getListSalesPoints);

    $$('report').onclick(() => {
        const params = {
            fromDate: $$('sp-fromDate').getIntValue(),
            toDate: $$('sp-toDate').getIntValue()
        }
        
        AWS.callSoap(WS, 'getReport', params).then(data => {
            if (data.wsStatus === '0') {
                Utils.showReport(data.reportUrl);
            }
        });      
    });
})();
