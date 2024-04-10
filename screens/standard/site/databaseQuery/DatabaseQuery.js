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
    const WS = 'StandardSiteDatabaseQuery';

    $$('execute').onclick(function () {
        if($$('dq-queryString').isError('Query String'))
            return;

        const queryString = {
            queryString: $$('dq-queryString').getValue()
        }
        AWS.callSoap(WS, "executeQuery", queryString).then(data => {
            if (data.wsStatus === '0') {
                data.columnNames = Utils.assureArray(data.columnNames);

                let columnDefs = [];
                for (let i = 0; i < data.columnNames.length; i++) {
                    columnDefs.push({headerName: data.columnNames[i], field: 'column_' + i, width: "100"})
                }
                let responseGrid = new AGGrid('responseGrid', columnDefs);
                responseGrid.show();
                let results = data.queryResults.split(' | ');

                let resultsNew = [];
                let iteration = 0;
                let temp = {};
                for (let i = 0; i < results.length; i++) {
                    if (iteration == columnDefs.length) {
                        iteration = 0;
                        resultsNew.push(temp);
                        temp = {};
                    }
                    temp[columnDefs[iteration].field] = results[i];
                    
                    iteration++;
                    
                }
                responseGrid.addRecords(resultsNew);
                $$('response-count').setValue('Displaying '+ resultsNew.length + ' Results');
            }
        });
    });
})();
