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
    const WS = 'StandardHrLogFiles';

    let logsGrid;
    const logsDefs = [
        {headerName: "File Path", field: "filePath", width: 1000}
    ];
    logsGrid = new AGGrid('logsGrid', logsDefs);
    logsGrid.show();

    const getLogFiles = () => {
        $$('view').disable();
        $$('clear').disable();
    
        AWS.callSoap(WS, 'getLogFiles').then(data => {
            logsGrid.clear();

            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);

                logsGrid.addRecords(data.item);          
                $$('status-label').setValue('Displaying ' + data.item.length + ' Log Files');
                logsGrid.setOnRowDoubleClicked(view);

                logsGrid.setOnSelectionChanged((x) => {
                    $$('view').enable(x);
                    $$('clear').enable(x);
                });
            }     
        });
    }

    function view() {
        
    }

    $$('view').onclick(view);
    $$('clear').onclick();

    getLogFiles();
})();
