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

/**
 * login.html contains the login screen and the login functionality. Once the login is successful it will load the UI
 * framework.
 *
 * All rights reserved.
 */

'use strict';

(function () {

    const soapService = "Main";
    const restService = "com.arahant.services.standard.main";
    const curYear = new Date().getFullYear();

    Utils.setHTML('copyright', `Copyright &copy; ${curYear} STACK360 LLC`);

    async function login() {
        AWS.setUuid("");
        AWS.setCompanyId("");  // login into no specified company
        AWS.setUser($$('username').getValue(), $$('password').getValue());

        const res = await AWS.callSoap(soapService, 'login');
        if (res.wsStatus !== '0') {
            AWS.setUser("", "");
            AWS.setUuid("");
            AWS.setName("", "");
            $$('password').clear().focus();
            return;
        }
        res.company = Utils.assureArray(res.company);
        if (res.company.length === 1) {
            AWS.setPersonId(res.personId);
            AWS.setUuid(res.uuid);
            AWS.setCompanyId(res.company[0].id);
            AWS.setName(res.personFName, res.personLName);
            Framework.login(res, res.company[0].name);
        } else {
            $$('scp23-company').clear().add('', '(choose)').addItems(res.company, 'id', 'name');
            Utils.popup_open('select-company-popup23');
            $$('scp23-ok').onclick(async () => {
                if ($$('scp23-company').isError('Company selection'))
                    return;
                AWS.setCompanyId($$('scp23-company').getValue());
                Utils.popup_close();

                // Now that we know which company, we need to get a UUID
                AWS.setUser($$('username').getValue(), $$('password').getValue());
                const res2 = await AWS.callSoap(soapService, 'login');
                if (res2.wsStatus !== '0') {
                    AWS.setUser("", "");
                    AWS.setUuid("");
                    AWS.setName("", "");
                    $$('password').clear().focus();
                    return;
                }
                AWS.setPersonId(res2.personId);
                AWS.setUuid(res2.uuid);
                AWS.setCompanyId(res2.company[0].id);
                AWS.setName(res2.personFName, res2.personLName);

                Framework.login(res2, $$('scp23-company').getLabel());
            });
            $$('scp23-cancel').onclick(() => {
                Utils.popup_close();
                AWS.setUser("", "");
                AWS.setUuid("");
                AWS.setName("", "");
                $$('password').clear().focus();
            });
        }
    }

    $$('loginBtn').onclick(login);

    $$('username').focus().onEnter(function () {
        $$('password').focus();
    });

    $$('password').onEnter(login);

    $('#login-about-btn').off('click').click(function () {
        $('#about-popup-current-year').text((new Date()).getFullYear());
        Utils.popup_open('login-about-popup');
        $$('login-about-popup-ok').onclick(function () {
            Utils.popup_close('login-about-popup');
        });
    });
    
    $('#login-contact-btn').off('click').click(() => {
        window.open('https://www.stack360.io/contact', '_blank');
    });

    $('#full-screen-btn').off('click').click(Utils.toggleFullscreen);

    $$('new-user').onclick(() => {
        $$('nup-first-name').clear();
        $$('nup-middle-name').clear();
        $$('nup-last-name').clear();
        $$('nup-email').clear();
        $$('nup-password1').clear();
        $$('nup-password2').clear();

        Utils.popup_open('new-user-popup', 'nup-first-name');

        $$('nup-ok').onclick(() => {
            if ($$('nup-first-name').isError('First name'))
                return;
            if ($$('nup-last-name').isError('Last name'))
                return;
            if ($$('nup-email').isError('Email address'))
                return;
            if ($$('nup-password1').isError('Password'))
                return;
            if ($$('nup-password2').isError('Password re-entry'))
                return;
            const email = $$('nup-email').getValue();
            if (!Utils.isValidEmailAddress(email)) {
                Utils.showMessage('Error', 'Invalid email address.');
                return;
            }
            if ($$('nup-password1').getValue() !== $$('nup-password2').getValue()) {
                Utils.showMessage('Error', "Passwords don't match.");
                return;
            }
            const data = {
                fname: $$('nup-first-name').getValue(),
                mname: $$('nup-middle-name').getValue(),
                lname: $$('nup-last-name').getValue(),
                email: email,
                password: $$('nup-password1').getValue()
            };
            Server.call(restService, "NewApplicant", data).then(function (res) {
               if (res._Success) {
                   Utils.popup_close();
               }
            });
        });

        $$('nup-cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('authenticate').onclick(() => {

    });

    $$('re-send-auth').onclick(() => {

    });

    $$('reset-password').onclick(() => {

    });

    if (screen.width * screen.height > 1000000)
        $('#full-screen-btn').css('visibility', 'hidden');

})();
