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
    const WS = 'StandardMiscOnboardingSetup';

    let webPagesGrid;
 
    const webPagesColumnDefs = [
        {headerName: "Title", field: "title", width: 200},
        {headerName: "URL", field: "url", width: 560}
    ];
    webPagesGrid = new AGGrid('webPagesGrid', webPagesColumnDefs);
    webPagesGrid.show();  

    function getListWebPages() {
        AWS.callSoap(WS, 'listWebPages').then(data => {
            if (data.wsStatus === '0') {     
                webPagesGrid.clear();
                data.item = Utils.assureArray(data.item);                
                webPagesGrid.addRecords(data.item);
                webPagesGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                webPagesGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    getListWebPages(); 

    $$('add').onclick(() => {
        
    });

    function edit() {
       
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        
    });
})();
