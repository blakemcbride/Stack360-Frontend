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

    const WS = "com.arahant.services.standard.project.workerAvailabilityReport";
    const defaultMiles = 75;

    $$('project').setSelectFunction(async function () {
        let res = await Utils.component('projectSelection/ProjectSelection', 'component-project-selection');
        if (res._status === "ok")
            $$('project').setValue(res.projectId, res.summary);
    });

    $$('project').forceSelect();

    Server.call(WS, "GetPositions", {}).then(function (res) {
        if (res._Success) {
            let ctl = $$('position');
            ctl.clear();
            ctl.add('', '(All Positions)');
            for (let i = 0; i < res.positions.length; i++) {
                let position = res.positions[i];
                if (position.hasOwnProperty('position_name'))
                    ctl.add(position.position_id, position.position_name);
            }
        }
    });

    // Set the initial value for the miles and availability.

    const availability = $$('availability');
    availability.setValue('A');

    const miles = $$('miles');
    miles.setValue(defaultMiles);

    availability.onChange(function () {
        let val = availability.getValue();
        if (val === 'A' || val === 'T') {
            miles.enable();
            miles.setValue(75);
        } else if (val === 'B') {
            miles.setValue('');
            miles.disable();
        }
    });

    function validate_fields() {
        const proj = $$('project').getValue();
        const zipCode = $$('zip-code').getValue();
        if (!proj && !zipCode) {
            Utils.showMessage('Error', 'You must select a project or enter a zip code.');
            return true;
        }
        if (proj && zipCode) {
            Utils.showMessage('Error', 'You must select a project or enter a zip code but not both.');
            return true;
        }
        if (zipCode && zipCode.length !== 5) {
            Utils.showMessage('Error', 'Zip Code must be 5 characters long.');
            return true;
        }

        if ($$('miles').isError('Travel miles'))
            return true;

        const miles = $$('miles').getValue();

        const report_type = $$('availability').getValue();

        if (report_type === 'B' && miles) {
            Utils.showMessage('Error', 'Miles are only applicable for the Availability or Terminated reports.').then(() => {
                $$('miles').focus();
            });
            return true;
        }
        return false;
    }

    /**
     * Generate and displays the report.
     */
    $$('report').onclick(() => {

        if (validate_fields())
            return;

        const data = {
            project_id: $$('project').getValue(),
            miles: $$('miles').getValue(),
            position_id: $$('position').getValue(),  // an array because of multi-select
            zipCode: $$('zip-code').getValue(),
            availability: $$('availability').getValue(),
            include_training: $$('training').getValue(),
            send_email: false
        };

        Utils.waitMessage("Generating report; please wait.");
        Server.call(WS, "CreateReport", data).then(res => {
            Utils.waitMessageEnd();

            if (res._Success) {
                Utils.showReport(res.url);
            }
        });
    });

    $$('send-email').onclick(function () {
        if (validate_fields())
            return;
        Utils.popup_open('email-popup', 'title');
    });

    $$('email-cancel').onclick(function () {
        Utils.popup_close();
    });

    $$('email-ok').onclick(function () {
        if ($$('title').isError('Message title'))
            return;

        if ($$('detail').isError('Message detail'))
            return;

        const data = {
            first_date: $$('first-date').getIntValue(),
            last_date: $$('last-date').getIntValue(),
            zip_code: $$('zip-code').getValue(),
            miles: $$('miles').getValue(),
            position_id: $$('position').getValue(),  // an array because of multi-select
            zipCode: $$('zip-code').getValue(),
            availability: $$('availability').getValue(),
            email_title: $$('title').getValue(),
            email_message: $$('detail').getValue(),
            send_email: true
        };
        Utils.waitMessage("Sending email; please wait.");
        Server.call(WS, "CreateReport", data).then(function (res) {
            Utils.waitMessageEnd();
            if (res._Success)
                Utils.showMessage('Info', 'Email successfully sent.');
            Utils.popup_close();
        });
    });

    $$('reset').onclick(() => {
        $$('project').setValue('');
        $$('zip-code').clear();
        $$('miles').setValue(defaultMiles);
        $$('availability').clear();
        $$('training').clear();
        $$('position').clearSelection();
    });

})();
