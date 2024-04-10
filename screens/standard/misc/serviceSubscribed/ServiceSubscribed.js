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
    const WS = 'StandardMiscServiceSubscribed';

    AWS.callSoap(WS, 'checkRight').then(function (res) {
        if (res.wsStatus === "0") {
        }
    });

    function reset() {
        $$('ss-name-criteria').clear();
        bindToEnum('ss-name-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        $$('ss-name').clear();
    }    

    reset();

    let searchResGrid;
 
    const searchResColumnDefs = [
        {headerName: "Name", field: "name", width: 200},
        {headerName: "Description", field: "descriptionPreview", width: 560},
        {headerName: "Active Date", field: "firstActiveDateFormatted", type: "numericColumn", width: 200},
        {headerName: "Inactive Date", field: "lastActiveDateFormatted", type: "numericColumn", width: 200},
    ];
    searchResGrid = new AGGrid('searchResGrid', searchResColumnDefs);
    searchResGrid.show();  

    function searchServices() {
        const params = {
            activeOnDate: 0,
            name: $$('ss-name').getValue(),
            nameSearchType: $$('ss-name-criteria').getValue(),
            showActive: $$('ss-showActive').getValue(),
            showInactive: $$('ss-showInactive').getValue()
        }
        AWS.callSoap(WS, 'searchServices', params).then(data => {
            if (data.wsStatus === '0') {     
                searchResGrid.clear();
                data.item = Utils.assureArray(data.item);
                for (let i = 0; i < data.item.length; i++) {
                    data.item[i].firstActiveDateFormatted = DateUtils.intToStr4(Number(data.item[i].firstActiveDate));
                    data.item[i].lastActiveDateFormatted = DateUtils.intToStr4(Number(data.item[i].lastActiveDate));
                }
                searchResGrid.addRecords(data.item);
                $$('ss-searchResCount').setValue('Displaying ' + data.item.length + ' Services');
                searchResGrid.setOnSelectionChanged((x) => {
                    $$('edit').enable(x);
                    $$('delete').enable(x);
                });
                searchResGrid.setOnRowDoubleClicked(edit);
            }
        });   
    }

    searchServices(); 

    $$('search').onclick(searchServices);
    $$('reset').onclick(reset);

    $$('ss-showActive').onChange(searchServices);
    $$('ss-showInactive').onChange(searchServices);

    $$('add').onclick(() => {
        $$('service-label').setValue('Add');

        $$('service-name').clear();
        $$('service-type').clear().add('', '(select)');
        $$('service-description').clear();
        $$('service-firstActiveDate').clear();
        $$('service-lastActiveDate').clear();

        AWS.callSoap(WS, 'listServiceType').then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                $$('service-type').clear().add('', '(select)').addItems(data.item, 'typeNumber', 'typeName');
            }
        });

        Utils.popup_open('service-popup');

        $$('service-ok').onclick(() => {
            if ($$('service-name').isError('Name'))
                return;

            if ($$('service-description').isError('Description'))
                return;

            if ($$('service-firstActiveDate').isError('First Active Date'))
                return;

            if ($$('service-lastActiveDate').isError('Last Active Date'))
                return;

            const params = {
                applyToAll: false,
                description: $$('service-description').getValue(),
                firstActiveDate: $$('service-firstActiveDate').getIntValue(),
                lastActiveDate: $$('service-lastActiveDate').getIntValue(),
                name: $$('service-name').getValue(),
                serviceType: $$('service-type').getValue() === '' ? 0 : $$('service-type').getValue()
            }

            AWS.callSoap(WS, 'newService', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchServices();
                    Utils.popup_close();
                }
            });
        });

        $$('service-cancel').onclick(Utils.popup_close);
    });

    function edit() {
        $$('service-label').setValue('Edit');

        const row = searchResGrid.getSelectedRow();

        $$('service-name').clear();
        $$('service-type').clear().add('', '(select)');
        $$('service-description').clear();
        $$('service-firstActiveDate').clear();
        $$('service-lastActiveDate').clear();

        AWS.callSoap(WS, 'listServiceType').then(data => {
            if (data.wsStatus === '0') {     
                data.item = Utils.assureArray(data.item);
                $$('service-type').clear().add('', '(select)').addItems(data.item, 'typeNumber', 'typeName');
            }
        });

        const params = {
            serviceId: row.id
        }
        AWS.callSoap(WS, 'loadService', params).then(data => {
            if (data.wsStatus === '0') {     
                $$('service-name').setValue(data.name);
                $$('service-type').setValue(data.serviceType);
                $$('service-description').setValue(data.description);
                $$('service-firstActiveDate').setValue(data.firstActiveDate);
                $$('service-lastActiveDate').setValue(data.lastActiveDate);
            }
        });        

        Utils.popup_open('service-popup');

        $$('service-ok').onclick(() => {
            if ($$('service-name').isError('Name'))
                return;

            if ($$('service-description').isError('Description'))
                return;

            if ($$('service-firstActiveDate').isError('First Active Date'))
                return;

            if ($$('service-lastActiveDate').isError('Last Active Date'))
                return;

            const params = {
                applyToAll: false,
                description: $$('service-description').getValue(),
                firstActiveDate: $$('service-firstActiveDate').getIntValue(),
                id: row.id,
                lastActiveDate: $$('service-lastActiveDate').getIntValue(),
                name: $$('service-name').getValue(),
                serviceType: $$('service-type').getValue() === '' ? 0 : $$('service-type').getValue()
            }

            AWS.callSoap(WS, 'saveService', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchServices();
                    Utils.popup_close();
                }
            });
        });

        $$('service-cancel').onclick(Utils.popup_close);
    }

    $$('edit').onclick(edit);

    $$('delete').onclick(() => {
        Utils.yesNo('Confirmation', 'Are you sure you want to delete the selected Service?', function () {
            const params = {
                ids: searchResGrid.getSelectedRow().id
            }
            AWS.callSoap(WS, 'deleteServices', params).then(data => {
                if (data.wsStatus === "0") {
                    searchServices();
                }  
            });
        });     
    });
})();
