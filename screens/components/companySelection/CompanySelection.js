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


window.popup_startup = function (inData) {
    return new Promise(function (resolve, reject) {

        const WS = "com.arahant.services.standard.components.companySearch";

        let grid;

        let includeClients;
        let includeCompanies;
        let includeVendors;

        if (inData) {
            includeClients = inData.includeClients === undefined ? true : inData.includeClients;
            includeCompanies = inData.includeCompanies === undefined ? true : inData.includeCompanies;
            includeVendors = inData.includeVendors === undefined ? true : inData.includeVendors;
        }

        if (inData  &&  inData.title)
            $('#cm-cs-title').text(inData.title);
        let columnDefs;
        if (includeClients && (includeCompanies || includeVendors) ||
            includeCompanies && includeVendors) {
            columnDefs = [
                {headerName: 'Company', field: 'name', width: 75},
                {headerName: 'Type', field: 'type', width: 25}
            ];
            if (!inData  ||  !inData.title)
                $('#cm-cs-title').text('Company Selection');
        } else if (includeClients) {
            columnDefs = [
                {headerName: 'Client', field: 'name', width: 75}
            ];
            if (!inData  ||  !inData.title)
                $('#cm-cs-title').text('Client Selection');
        } else if (includeVendors) {
            columnDefs = [
                {headerName: 'Vendor', field: 'name', width: 75}
            ];
            if (!inData  ||  !inData.title)
                $('#cm-cs-title').text('Vendor Selection');
        } else {
            columnDefs = [
                {headerName: 'Company', field: 'name', width: 75}
            ];
            if (!inData  ||  !inData.title)
                $('#cm-cs-title').text('Company Selection');
        }

        if (inData && inData.allowNullSelection )
            $('#cm-radio-all-selection').show();
        else 
            $('#cm-radio-all-selection').hide();

        $$('cm-cs-name').focus();

        const accept_company = function() {
            const row = grid.getSelectedRow();
            if (row) {
                let res = {
                    _status: 'ok',
                    id: row.id,
                    name: row.name,
                    type: row.type
                };
                resolve(res);
            } else {
                if ( !$$('cm-all-selection').getValue() ) {
                    Utils.showMessage('Error', 'You must first select an company.');
                } else {
                    resolve(-1);
                }
            }
        };

        {
            grid = new AGGrid('cm-cs-grid', columnDefs, 'id');

            grid.show();

            grid.setOnSelectionChanged((rows) => {
                $$('cm-cs-ok').enable(rows);
            });

            grid.setOnRowDoubleClicked(function () {
                accept_company();
            });
        }

        function search() {
            let data = {
                nameType: $$('cm-cs-search-type').getValue(),
                name: $$('cm-cs-name').getValue(),
                active: $$('cm-cs-active').getValue(),
                includeClients: includeClients,
                includeCompanies: includeCompanies,
                includeVendors: includeVendors
            };
            
            if (inData && inData.type)
                data.type = inData.type;

            grid.clear();
            Server.call(WS, "CompanySearch", data).then(function (res) {
                if (res._Success) {
                    res.companies = Utils.assureArray(res.companies);
                    grid.addRecords(res.companies);
                    grid.clearSelection();
                    if (res.isMore)
                        $$('cm-cs-msg').setColor("red").setValue("Showing " + res.companies.length + " (more)")
                    else
                        $$('cm-cs-msg').setColor("black").setValue("Showing " + res.companies.length)
                }
            });
        }

        $$('cm-cs-search').onclick(search);
        Utils.globalEnterHandler(search);

        $$('cm-cs-ok').onclick(accept_company);

        $$('cm-cs-cancel').onclick(function() {
            resolve({ _status: 'cancel'});
        });

        $$('cm-all-selection').onChange(v => {
            if ( v )
                $$('cm-cs-ok').enable();
            else
                $$('cm-cs-ok').disable();
        });

        search();
    });
};

