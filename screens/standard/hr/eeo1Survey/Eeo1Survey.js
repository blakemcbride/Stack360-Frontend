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
    const WS = 'StandardHrEeo1Survey';

    let surveysGrid;

    const surveysColumnDefs = [
        {headerName: "Created", field: "dateCreatedFormatted", type: 'numericColumn', width: 150},
        {headerName: "Pay Period Start", field: "payPeriodStartFormatted", type: 'numericColumn', width: 180},
        {headerName: "Pay Period Final", field: "payPeriodEndFormatted", type: 'numericColumn', width: 180},
        {headerName: "Common Owner/Central Mgmt", field: "owner", width: 280},
        {headerName: "Government Contractor", field: "government", width: 280},
        {headerName: "Uploaded", field: "dateUploadedFormatted", width: 150},
    ];

    surveysGrid = new AGGrid('surveysGrid', surveysColumnDefs);

    surveysGrid.show();

    function getListSurveys() {
        AWS.callSoap(WS, 'listSurveys').then(data => {
            surveysGrid.clear();
            if (data.wsStatus === "0") {
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item.dateCreatedFormatted = data.item.dateCreated !== '0' ? DateUtils.intToStr4(Number(data.item.dateCreated)) : '';                    
                    data.item.payPeriodStartFormatted = data.item.payPeriodStart !== '0' ? DateUtils.intToStr4(Number(data.item.payPeriodStart)) : '';                    
                    data.item.payPeriodEndFormatted = data.item.payPeriodEnd !== '0' ? DateUtils.intToStr4(Number(data.item.payPeriodEnd)) : '';                    
                    data.item.dateUploadedFormatted = data.item.dateUploaded !== '0' ? DateUtils.intToStr4(Number(data.item.dateUploaded)) : '';                    
                }
                
                surveysGrid.addRecords(data.item);     

                $$('surveys-label').setValue('Displaying ' + data.item.length + ' EEO-1 Surveys');
            }     
        });
    }

    getListSurveys();


    let establishmentGrid;

    const establishmentColumnDefs = [
        {headerName: "Establishment", field: "establishment", width: 300},
        {headerName: "Headquarters", field: "headquarters", width: 180},
        {headerName: "Filed Last Year", field: "filedLastYear", width: 180},
        {headerName: "Unit Number", field: "unitNumber", width: 180}
    ];

    establishmentGrid = new AGGrid('establishmentGrid', establishmentColumnDefs);

    establishmentGrid.show();

    $$('add').onclick(() => {
        $$('es-affiliated').clear();
        $$('es-employees').clear();
        $$('payPeriodStartDate').clear();
        $$('payPeriodFinalDate').clear();
        $$('es-certifyingOfficialNumber').clear();
        $$('es-certifyingPhoneNumber').clear();
        $$('es-certifyingOfficialJobTitle').clear();
        $$('es-certifyingOfficialEmail').clear();

        AWS.callSoap(WS, 'listSurveys').then(data => {
            establishmentGrid.clear();
            if (data.wsStatus === "0") {
                $$('surveysOk').enable();
                data.item = Utils.assureArray(data.item);                
                establishmentGrid.addRecords(data.item);
                $$('establishment-label').setValue('Displaying ' + data.item.length + ' Establishments');
                if (data.item.length === 0) {
                    Utils.showMessage('Error', 'No establishments were found. At least one Establishment must exist to file an EEO-1 Survey.');
                    $$('surveysOk').disable();
                    return;
                }
            }     
        });

        Utils.popup_open('surveys-popup');

        $$('surveysCancel').onclick(Utils.popup_close);
    });
})();
