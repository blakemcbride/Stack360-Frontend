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

    const WS = 'StandardSiteChangePassword';
    let req;

    function StatusCheckbox() {}

    StatusCheckbox.prototype.init = function(params) {
        const e = document.createElement('INPUT');
        e.setAttribute('type', 'checkbox');
        e.setAttribute('id', 'cb' + params.data.id);
        e.style.position = 'relative';
        e.style.top = '-5px';
        e.style.left = '-5px';
        this.eGui = e;
    };

    StatusCheckbox.prototype.getGui = function() {
        return this.eGui;
    };

    const columnDefs = [
        {headerName: 'New Password Requirements', field: 'requirement', width: 210  },
        {headerName: '', field: 'value', cellRenderer: 'statusCheckbox', width: 15 }
    ];
    const grid = new AGGrid('grid', columnDefs, 'id');
    grid.noRowSelection();
    grid.addComponent('statusCheckbox', StatusCheckbox);
    grid.show();

    AWS.callSoap(WS, "loadPasswordRules").then(function (res) {
        req = res;
        if (res.wsStatus === '0') {
            if (res.minimumLength === '0' &&
                res.minimumLetters === '0' &&
                res.minimumDigits === '0' &&
                res.minimumLowerCaseLetters === '0' &&
                res.minimumUpperCaseLetters === '0' &&
                res.minimumSpecialChars === '0') {
            } else {
                $('#grid').show();
                if (res.minimumLength !== '0')
                    grid.addRecord({id: 1, requirement: 'At least ' + res.minimumLength + ' characters'});
                if (res.minimumLetters !== '0')
                    grid.addRecord({id: 2, requirement: 'At least ' + res.minimumLetters + ' letters'});
                if (res.minimumDigits !== '0')
                    grid.addRecord({id: 3, requirement: 'At least ' + res.minimumDigits + ' digits'});
                if (res.minimumLowerCaseLetters !== '0')
                    grid.addRecord({id: 4, requirement: 'At least ' + res.minimumLowerCaseLetters + ' lowercase letters'});
                if (res.minimumUpperCaseLetters !== '0')
                    grid.addRecord({id: 5, requirement: 'At least ' + res.minimumUpperCaseLetters + ' upper case letters'});
                if (res.minimumSpecialChars !== '0')
                    grid.addRecord({id: 6, requirement: 'At least ' + res.minimumSpecialChars + ' special characters'});
            }
        }
    });

    $$('show-passwords').onChange((val) => {
        $$('old-password').setPassword(!val);
        $$('new-password').setPassword(!val);
        $$('new-password2').setPassword(!val);
    });

    $$('update').onclick(() => {
        if ($$('old-password').isError('Old password'))
            return;
        if ($$('new-password').isError('New password'))
            return;
        if ($$('new-password2').isError('Confirm New Password'))
            return;
        const np1 = $$('new-password').getValue();
        const np2 = $$('new-password2').getValue();
        if (np1 !== np2) {
            Utils.showMessage('Error', 'New Password and Confirm New Password do not match.');
            return;
        }
        if (!passTests()) {
            Utils.showMessage('Error', 'Your new password does not meet the minimum requirements.');
            return;
        }
        if (np1 === $$('old-password').getValue()) {
            Utils.showMessage('Error', 'Your new password must be different from your old password.');
            return;
        }
        const data = {
            oldPassword: $$('old-password').getValue(),
            newPassword: np1
        };
        AWS.callSoap(WS, "changePassword", data).then(function (res) {
            if (res.wsStatus === '0') {
                Utils.showMessage('Information', 'Password changed successfully');
                $$('old-password').clear();
                $$('new-password').clear();
                $$('new-password2').clear();
            }
        });
    });

    function matchLength(str, regex) {
        return Utils.assureArray(str.match(regex)).length;
    }

    function passTests() {
        let ret = true;
        let val = $$('new-password').getValue();
        if (!val)
            val = '';
        let oval = $$('old-password').getValue();
        let letters = matchLength(val, /[a-zA-Z]/g);
        let digits = matchLength(val, /[0-9]/g);
        let lcLetters = matchLength(val, /[a-z]/g);
        let ucLetters = matchLength(val, /[A-Z]/g);
        let nsc = matchLength(val, /[`~!@#$%^&*()\-_=+{}\[\]\\|\/;:'"?.>,<]/g);
        if (req.minimumLength !== '0') {
            $('#cb1').prop('checked', val.length >= req.minimumLength);
            if (val.length < req.minimumLength)
                ret = false;
        }
        if (req.minimumLetters !== '0') {
            $('#cb2').prop('checked', letters >= req.minimumLetters);
            if (letters < req.minimumLetters)
                ret = false;
        }
        if (req.minimumDigits !== '0') {
            $('#cb3').prop('checked', digits >= req.minimumDigits);
            if (digits < req.minimumDigits)
                ret = false;
        }
        if (req.minimumLowerCaseLetters !== '0') {
            $('#cb4').prop('checked', lcLetters >= req.minimumLowerCaseLetters);
            if (lcLetters < req.minimumLowerCaseLetters)
                ret = false;
        }
        if (req.minimumUpperCaseLetters !== '0') {
            $('#cb5').prop('checked', ucLetters >= req.minimumUpperCaseLetters);
            if (ucLetters < req.minimumUpperCaseLetters)
                ret = false;
        }
        if (req.minimumSpecialChars !== '0') {
            $('#cb6').prop('checked', nsc >= req.minimumSpecialChars);
            if (nsc < req.minimumSpecialChars)
                ret = false;
        }
        return ret;
    }

    $$('new-password').onCChange(passTests);

    $$('old-password').focus();

})();
