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

    const WS = 'com.arahant.services.standard.hr.viewLog';

    const personId = Utils.getData(HR_PERSON_ID);
    const personName = Utils.getData(HR_PERSON_NAME);

    $$('worker-name').setValue(personName);

    const columnDefs = [
        { headerName: 'When', field: 'change_when', valueFormatter:  AGGrid.dateTime, width: 40 },
        { headerName: 'Who', field: 'change_person_name', width: 50 },
        { headerName: 'Table', field: 'table_changed', width: 50 },
        { headerName: 'Column', field: 'column_changed', width: 50 },
        { headerName: 'Old Value', field: 'old_value', width: 50 },
        { headerName: 'New Value', field: 'new_value', width: 50 },
        { headerName: 'Description', field: 'description', width: 150 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'change_id');

    grid.show();

    function updateGrid() {

        grid.clear();

        const data = {
            personId: personId
        };

        Server.call(WS, 'GetEvents', data).then(res => {
            if (res._Success) {
                const events = res.events;
                for (let i = 0; i < events.length; i++) {
                    let e = events[i];
                    if (e.cp_fname && e.cp_lname) {
                        let name = e.cp_fname + ' ' + e.cp_lname;
                        name = name.replace("Arahant ", "");
                        e.change_person_name = name;
                    }
                }
                grid.addRecords(events);
                $$('status').setValue(`Displaying ${events.length} Event${events.length > 1 ? 's' : ''}`);
            }
        });
    }

    updateGrid();

})();
