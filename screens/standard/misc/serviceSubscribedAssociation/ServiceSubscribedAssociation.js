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
    const WS = 'StandardMiscServiceSubscribedAssociation';

    function resetAvailable() {
        $$('ssa-nameAvailable-criteria').clear();
        bindToEnum('ssa-nameAvailable-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        $$('ssa-nameAvailable').clear();
    }

    function resetSubscribed() {
        $$('ssa-nameSubscribed-criteria').clear();
        bindToEnum('ssa-nameSubscribed-criteria', StringCriteriaMatcher, StringCriteriaMatcher.STARTS_WITH);
        $$('ssa-nameSubscribed').clear();
    }

    resetAvailable();
    resetSubscribed();

    let availableServicesGrid;
 
    const availableServicesColumnDefs = [
        {headerName: "Name", field: "name", width: 170},
        {headerName: "Description", field: "descriptionPreview", width: 200}
    ];
    availableServicesGrid = new AGGrid('availableServicesGrid', availableServicesColumnDefs);
    availableServicesGrid.multiSelect();
    availableServicesGrid.show();

    let subscribedServicesGrid;
 
    const subscribedServicesColumnDefs = [
        {headerName: "Name", field: "name", width: 400},
        {headerName: "Description", field: "descriptionPreview", width: 600},
        {headerName: "Ext. Id", field: "externalId", width: 200},
        {headerName: "Begin Date", field: "beginDate", width: 200},
        {headerName: "End Date", field: "endDate", width: 200},
    ];
    subscribedServicesGrid = new AGGrid('subscribedServicesGrid', subscribedServicesColumnDefs);
    subscribedServicesGrid.multiSelect();
    subscribedServicesGrid.show();  

    function searchAvailableServices() {
        const params = {
            name: $$('ssa-nameAvailable').getValue(),
            nameSearchType: $$('ssa-nameAvailable-criteria').getValue()
        }
        AWS.callSoap(WS, 'searchAvailableServices', params).then(data => {
            $$('subscribe').disable();
            if (data.wsStatus === '0') {     
                availableServicesGrid.clear();
                data.item = Utils.assureArray(data.item);                
                availableServicesGrid.addRecords(data.item);
                availableServicesGrid.setOnSelectionChanged((x) => {
                    $$('subscribe').enable(x);
                });
                availableServicesGrid.setOnRowDoubleClicked(subscribe);
            }
        });   
    }

    function searchSubscribedServices() {
        const params = {
            name: $$('ssa-nameSubscribed').getValue(),
            nameSearchType: $$('ssa-nameSubscribed-criteria').getValue()
        }
        AWS.callSoap(WS, 'searchSubscribedServices', params).then(data => {
            $$('unsubscribe').disable();
            if (data.wsStatus === '0') {     
                subscribedServicesGrid.clear();
                data.item = Utils.assureArray(data.item);                
                subscribedServicesGrid.addRecords(data.item);
                subscribedServicesGrid.setOnSelectionChanged((x) => {
                    $$('unsubscribe').enable(x);
                });
                subscribedServicesGrid.setOnRowDoubleClicked(unsubscribe);
            }
        });   
    }

    searchAvailableServices(); 
    searchSubscribedServices();

    $$('resetAvailable').onclick(resetAvailable);
    $$('searchAvailable').onclick(searchAvailableServices);

    $$('resetSubscribed').onclick(resetSubscribed);
    $$('searchSubscribed').onclick(searchSubscribedServices);

    function subscribe() {
        $$('subscribe-label').setValue('Begin');
        $$('subscribe-label2').setValue('Begin');

        $$('subscribe-date').clear();
        $$('subscribe-externalId-label').show();
        $$('subscribe-externalId').clear().show();
        
        Utils.popup_open('subscribe-popup');
        Utils.popup_set_height('subscribe-popup', '100px');

        $$('subscribe-ok').onclick(() => {
            if ($$('subscribe-date').isError('Date'))
                return;

            const rows = availableServicesGrid.getSelectedRows();
            let serviceIds = [];
            for (let i = 0; i < rows.length; i++) {
                serviceIds.push(rows[i].id)
            }
            const params = {
                date: $$('subscribe-date').getIntValue(),
                externalId: $$('subscribe-externalId').getValue(),
                serviceIds: serviceIds
            }

            AWS.callSoap(WS, 'subscribe', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchAvailableServices();
                    searchSubscribedServices();
                    Utils.popup_close();
                }
            });
        });

        $$('subscribe-cancel').onclick(Utils.popup_close);
    }
    function unsubscribe() {
        $$('subscribe-label').setValue('End');
        $$('subscribe-label2').setValue('End');

        $$('subscribe-date').clear();
        $$('subscribe-externalId-label').hide();
        $$('subscribe-externalId').clear().hide();

        Utils.popup_open('subscribe-popup');
        Utils.popup_set_height('subscribe-popup', '65px');

        $$('subscribe-ok').onclick(() => {
            if ($$('subscribe-date').isError('Date'))
                return;

            const rows = subscribedServicesGrid.getSelectedRows();
            let serviceIds = [];
            for (let i = 0; i < rows.length; i++) {
                serviceIds.push(rows[i].id)
            }
            const params = {
                date: $$('subscribe-date').getIntValue(),
                serviceIds: serviceIds
            }

            AWS.callSoap(WS, 'unsubscribe', params).then(data => {
                if (data.wsStatus === '0') {     
                    searchAvailableServices();
                    searchSubscribedServices();
                    Utils.popup_close();
                }
            });
        });

        $$('subscribe-cancel').onclick(Utils.popup_close);
    }
    $$('subscribe').onclick(subscribe);
    $$('unsubscribe').onclick(unsubscribe);
})();
