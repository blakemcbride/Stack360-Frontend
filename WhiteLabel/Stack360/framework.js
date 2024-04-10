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

/* global Utils, $$, AWS, AGGrid, Kiss */

/**
 * This is the UI framework. It utilizes Kiss components and functionality to display the screens upon request,
 * Created by Blake McBride on 12/14/15.
 *
 * All right reserved.
 */

'use strict';


const Framework = function () {
};


/*
   The following are constants used by Utils.saveData() and Utils.getData()
   to store global information used to communicate data between screens.
 */

const VISITED_CLIENTS = "VISITED_CLIENTS";
const CURRENT_CLIENT_ID = "CURRENT_CLIENT_ID";
const CURRENT_CLIENT_NAME = "CURRENT_CLIENT_NAME";


//  Project Constants
const PROJECT_SEARCH_DATA = "PROJECT_SEARCH_DATA";
const VISITED_PROJECTS = "VISITED_PROJECTS";
const CURRENT_PROJECT_ID = "CURRENT_PROJECT_ID";
const CURRENT_SHIFT_ID = "CURRENT_SHIFT_ID";
const CURRENT_PROJECT_SUMMARY = "CURRENT_PROJECT_SUMMARY";
const CURRENT_PROJECT_NAME = "CURRENT_PROJECT_NAME";
const CURRENT_PROJECT_DATE = "CURRENT_PROJECT_DATE";

// HR constants.
const HR_PERSON_ID = 'hrPersonId';
const HR_PERSON_TYPE = 'hrPersonType';
const HR_PERSON_FIRST_NAME = 'hrPersonFirstName';
const HR_PERSON_MIDDLE_NAME = 'hrPersonMiddleName';
const HR_PERSON_LAST_NAME = 'hrPersonLastName';
const HR_RECENT_PEOPLE = 'hrRecentPeople';
const HR_PERSON_NAME = "hrPersonName";
const HR_PERSON_FIRST_AWARE_DATE = 'hrPersonFirstAwareDate';
const HR_PERSON_APPLICANT_STATUS = 'hrPersonApplicantStatus';
const HR_PERSON_APPLICANT_SOURCE = 'hrPersonApplicantSource';
const HR_PERSON_EMAIL = 'hrPersonEmail';
const HR_PERSON_PHONE = 'hrPersonPhone';

// Prospect Constants
const VISITED_PROSPECTS = "VISITED_PROSPECTS";
const CURRENT_PROSPECT_ID = "CURRENT_PROSPECT_ID";
const CURRENT_PROSPECT_NAME = "CURRENT_PROSPECT_NAME";
const PROSPECT_SEARCH_CONTEXT = "PROSPECT_SEARCH_CONTEXT";

// Benefit Constants
const CURRENT_BENEFIT_ID = "CURRENT_BENEFIT_ID";

// Other constants
const SHOW_ALL = "SHOW_ALL";


Framework.needToLoadFramework = true;
Framework.selectorData = null;            //  all info for current set of buttons
Framework.screenGroupStack = [];
Framework.askBeforeLeaving = false;       //  Data has changed.  Ask before leaving page.

// The stuff that needs to be called on loading the module is placed here.
$(async function () {
    $('#username').focus();

    if (window.location.protocol === "http:" && (window.location.port >= 8000 && window.location.port <= 8100 || window.location.port === '63342')) {
        AWS.setURL('http://' + window.location.hostname + ':8080');
    } else {
        //AWS.setURL('https://[YOUR-URL]/Stack360Backend');
        //AWS.setURL('https://demo.stack360.io/backend');
        //AWS.setURL('https://admin.stack360.io/arahant');
        //AWS.setURL('https://waytogo.arahant.com/arahant');
    }

    AWS.callSoap('Main', 'getLoginProperties');
    AWS.callSoap('Main', 'getUnauthenticatedMeta');
});

/**
 * Used externally by the screens to get to a child screen.
 */
Framework.getChild = function () {
    const screenGroup = Framework.screenGroupStack[Framework.screenGroupStack.length - 1];
    Framework.getScreen(screenGroup.selectedIdx, true);
};

/**
 * Buttons on the left use this.
 * -1 means Go Back.
 *
 * @param i
 */
Framework.selectionMade = function (i) {
    if (Framework.askBeforeLeaving) {
        if (Utils.didSomeControlValueChange()) {
            Utils.yesNo('Confirmation', 'Changes have been made.  Discard changes?', function () {
                Utils.clearSomeControlValueChanged(false);
                Framework.getScreen(i);
            });
        } else
            Framework.getScreen(i);
    } else
        Framework.getScreen(i);
};


/**
 * User selected screen index <code>selectedIndex</code> is:
 *  0-N       - go to selected index (0 is the first valid screen selection)
 *  -N        - go back N levels
 *  null      - top level / initial load
 *  'default' - load default screen for current level
 *  'reload'  - reload current screen
 *
 * @param selectedIdx
 * @param loadChild - if true load child screens of a group
 */
Framework.getScreen = function (selectedIdx, loadChild=false) {
    /**
     * Find the selected item in the screen group passed in.
     *
     * NOT USED.
     *
     * First choice   -  screenGroup.selectedIdx - get what is currently selected
     * second choice  -  get default for that group
     *
     * @param screenGroup array of screen groups for a given level
     * @returns the screen that should be displayed
     */
    function findScreen(screenGroup) {
        const selectedIdx = screenGroup.selectedIdx;
        if (selectedIdx !== null  &&  selectedIdx >= 0 && selectedIdx < screenGroup.length) {
            const screen = screenGroup[selectedIdx];
            if (screen.type !== "0")  // if group without a parent screen use default instead
                return screen;
        }
        let ditm = null; // default item
        for (let i = 0; i < screenGroup.length; i++) {
            let titm = screenGroup[i];
            if (titm.isDefault === "true") {
                ditm = titm;
                break;
            }
        }
        return ditm;
    }

    function updateBreadCrumb() {
        const levels = Framework.screenGroupStack.length;
        const separator = '<img src="kiss/assets/icons/play.svg" class="play-icon-black" alt=""/>';
        let bc = '<div style="display: flex; flex-direction: row;align-items: center"><a id="breadcrumb-home" class="btn btn-link-stack360" onclick="if(!Utils.suspendDepth)Framework.goBack(' + levels + ')" style="color:black;">Home</a>';

        for (let i=0 ; i < Framework.screenGroupStack.length; i++) {
            const screenGroup = Framework.screenGroupStack[i];
            const screen = screenGroup[screenGroup.selectedIdx];
            if (!screen)
                break;  //  no default or selected screen for this group
            bc += separator + '<a id="breadcrumb-' + fixName(screen.title) + '" class="btn btn-link-stack360" onclick="if(!Utils.suspendDepth)Framework.goBack(' + (levels - (i + 1)) + ')" style="color:black;">' + screen.title + '</a>';
        }
        bc += '</div>';
        $('#bread-crumb').html(bc);
    }

    /**
     * Load a specific screen.
     *
     * @param originalFname Flash file name for the screen
     * @param screenId the screen ID
     */
    function loadPage(originalFname, screenId) {
        let fname = originalFname;
        if (!fname.startsWith('com/') && !fname.startsWith('htmlFlex')) {
            // new screens (something like "standard/project/assignmentHistory"
            let i = fname.lastIndexOf('/');
            if (i > 0) {
                let mainFile = fname.substring(i+1);
                if (mainFile) {
                    mainFile = mainFile.charAt(0).toUpperCase() + mainFile.substr(1);
                    fname = 'screens/' + fname + '/' + mainFile;
                }
            }
        } else {
            // old screens
            fname = fname.replace(/^com\/arahant\/app\/dynamicScreen/, 'screens');
            fname = fname.replace(/^com\/arahant\/app\/screen/, 'screens');
            fname = fname.replace(/^htmlFlex/, 'screens');
            fname = fname.replace(/Screen\.swf$/, '');
            fname = fname.replace(/\.swf$/, '');
            if (!fname.startsWith("screens/"))
                fname = "screens/" + fname;
        }

        Framework.askBeforeLeaving = false;

        // Remove pointers to old screens.
        // This is needed for screens that have global variables.
        delete window.TimeSheetEntry;
        delete window.HrEmployee;
        delete window.HrParent;
        delete window.ScreenGroup;
        delete window.HrEmployeesByStatusReport;
        delete window.HrEmployeeStatusChangedReport;
        delete window.ProspectOrgGroup;
        delete window.ClientOrgGroup;

        window.onresize = null;  // remove old values

        // clear old state
        Utils.clearSomeControlValueChanged(false);
        Utils.setSomeControlValueChangeFunction(null);
        Utils.watchControlValueChanges(true);  // re-enable the whole capability
        Kiss.RadioButtons.resetGroups();
        AGGrid.popAllGridContexts();
        AGGrid.newGridContext();   //  for the new screen we are loading
        Utils.clearAllEnterContexts();
        Utils.globalEnterHandler(null);
        Utils.popup_context = [];
        const ctl = $(':focus');   // remove any focus
        if (ctl)
            ctl.blur();

        // remove prior screen popups
        for (const id of ActivePopups)
            Utils.removeFromDOM(id);
        ActivePopups = [];

        Utils.loadPage(fname, "data-pane").then(function () {
            Framework.lastLoadedScreen = fname;
            Framework.lastLoadedScreenID = screenId;
        }, function (status, text, textStatus) {
            Framework.lastLoadedScreen = fname;
            Framework.lastLoadedScreenID = screenId;
            $('#data-pane').html('<h2 style="margin-left: 20px; margin-top: 20px;">This screen is currently unavailable. Please make another selection.</h2>');
        });
    }

    function fixName(name) {
        return name.toLowerCase().replaceAll(' ', '-').replaceAll('&', 'and');
    }

    function updateFramework(screenGroup, idx) {
        let selectors = '';
        let screen = null;
        let i = 0;
        const goBack = Framework.screenGroupStack.length > 1;

        if (goBack)
            selectors += '<div id="sidebar-go-back" class="btn-sidebar-stack360" onclick="if(!Utils.suspendDepth)Framework.selectionMade(-1)">(go back)</div>';
        for (; i < screenGroup.length; i++) {
            if (!goBack && !i)
                selectors += '<div id="sidebar-' + fixName(screenGroup[i].title) + '" class="btn-sidebar-stack360" onclick="if(!Utils.suspendDepth)Framework.selectionMade(' + i + ')">' + screenGroup[i].title + '</div>';
            else
                selectors += '<div id="sidebar-' + fixName(screenGroup[i].title) + '" class="btn-sidebar-stack360" onclick="if(!Utils.suspendDepth)Framework.selectionMade(' + i + ')">' + screenGroup[i].title + '</div>';
            let dataItem = screenGroup[i];
            if (dataItem.isDefault === 'true' && (idx === null || idx === undefined || idx < 0)  ||  idx === i) {
                screen = dataItem;
                screenGroup.selectedIdx = i;
            }
        }
        if (i >= 13)
            for (i = 0; i < 3; i++)
                selectors += '<br/>';
        else
            for (; i < 14; i++)
                selectors += '<br/>';
        $('#selector-pane').html(selectors);
        if (screen)
            if (screen.type !== '1')
                throw "Invalid default item.";
            else
                loadPage(screen.screenFile, screen.screenId);
        else {
            let title;
            if (Framework.screenGroupStack.length < 2) {
                title = 'Home';
            } else {
                const screenGroup = Framework.screenGroupStack[Framework.screenGroupStack.length - 2];
                const screen = screenGroup[screenGroup.selectedIdx];
                title = screen.title;
            }
            $('#data-pane').html('<p style="font-size: large; margin-left: 20px;">' + 'You are in <strong style="font-weight: bold;">' + title + '</strong>.<br><br>Please select a function from the buttons on the left.' + '</p>');
        }
        updateBreadCrumb();
    }
    if (selectedIdx === null || !Framework.screenGroupStack.length) {  //  load initial group
        Framework.screenGroupStack = [];
        const args = {
            groupId: '',            // '' means top-level / HOME
            currentScreenId: null,  // not used ever
            depth: 0,               // not used for regular, non-wizard screens
            employeeId: null,       // not used for regular, non-wizard screens
            asOfDate: 0             // not used ever
        };

        AWS.callSoap('Main', 'listScreensAndGroups', args).then(function (data) {
            if (data.wsStatus === "0") {
                const screenGroup = Utils.assureArray(data.item);
                Framework.screenGroupStack.push(screenGroup);
                if (Framework.needToLoadFramework)
                    $.get('framework.html' + (Utils.controlCache ? '?ver=' + Utils.softwareVersion : ''), function (text) {
                        Framework.needToLoadFramework = false;
                        $('body').html(text);
                        $('#user-info').html('<div class="text-right" style="margin-right:25px;">' + Framework.userInfo.title + '</div>');
                        updateFramework(screenGroup, null);
                        $('#full-screen-btn2').off('click').click(Utils.toggleFullscreen);
                        if (screen.width * screen.height > 1000000)
                            $('#full-screen-btn2').css('visibility', 'hidden');
                        $('#framework-logo').click(() => {
                            Framework.goBack(null);
                        });
                    });
                else
                    updateFramework(screenGroup, null);
            }
        });
    } else if (selectedIdx < 0) {  // go back
        while (selectedIdx++ < 0 && Framework.screenGroupStack.length > 1)
            Framework.screenGroupStack.pop();
        const screenGroup = Framework.screenGroupStack[Framework.screenGroupStack.length - 1];
        let si = screenGroup.selectedIdx;
        delete screenGroup.selectedIdx;
        if (si !== undefined && screenGroup[si].type === "0")
            si = null;
        updateFramework(screenGroup, si);
    } else if (selectedIdx === 'default') {  //  load default of current screen group
        const screenGroup = Framework.screenGroupStack[Framework.screenGroupStack.length - 1];
        delete screenGroup.selectedIdx;
        updateFramework(screenGroup);
    } else if (selectedIdx === 'reload') {
        const screenGroup = Framework.screenGroupStack[Framework.screenGroupStack.length - 1];
        updateFramework(screenGroup, screenGroup.selectedIdx);
    } else {  // selection made
        const screenGroup = Framework.screenGroupStack[Framework.screenGroupStack.length - 1];
        screenGroup.selectedIdx = selectedIdx;
        const selectedScreen = screenGroup[selectedIdx];
        // selectedScreen.type == "0" - group without a parent screen
        // selectedScreen.type == "1" - screen, or group with parent screen
        if (loadChild && !selectedScreen.groupId) {
            console.error("Found a screen.  Expecting a parent group.  Screen config bug.");
            return;
        }
        if (selectedScreen.type === "0" || loadChild) {
            const args = {
                groupId: selectedScreen.groupId,
                currentScreenId: null,  // not used ever
                depth: 0,               // not used for regular, non-wizard screens
                employeeId: null,       // not used for regular, non-wizard screens
                asOfDate: 0             // not used ever
            };

            AWS.callSoap('Main', 'listScreensAndGroups', args).then(function (data) {
                if (data.wsStatus === "0") {
                    const screenGroup = Utils.assureArray(data.item);
                    Framework.screenGroupStack.push(screenGroup);
                    updateFramework(screenGroup);
                }
            });
        } else {
            updateFramework(screenGroup, selectedIdx);
        }
    }
};

Framework.goBack = function (n) {
    if (n === null) {
        Framework.getScreen(n);
        return;
    }
    if (n < 0)
        return;
    if (n === 0)
        n = 'reload';
    else if (n === 1)
        n = 'default';
    else
        n = -(n-1);
    if (Framework.askBeforeLeaving) {
        if (Utils.didSomeControlValueChange()) {
            Utils.yesNo('Confirmation', 'Changes have been made.  Discard changes?', function () {
                Utils.clearSomeControlValueChanged(false);
                Framework.getScreen(n);
            });
        } else
            Framework.getScreen(n);
    } else
        Framework.getScreen(n);
};

/**
 * Handles the login functionality. Validates the login details and shows an error if credentials are invalid or load
 * the user info and display the main screen.
 */
Framework.login = async (res, companyName) => {
    Framework.screenGroupStack = [];

    function changePassword() {

        const WS = 'StandardSiteChangePassword';
        let req;

        Utils.popup_open('change-password-popup', 'cpp-old-password');

        function StatusCheckbox() {
        }

        StatusCheckbox.prototype.init = function (params) {
            const e = document.createElement('INPUT');
            e.setAttribute('type', 'checkbox');
            e.setAttribute('id', 'cpp-cb' + params.data.id);
            e.style.position = 'relative';
            e.style.top = '-5px';
            e.style.left = '-5px';
            this.eGui = e;
        };

        StatusCheckbox.prototype.getGui = function () {
            return this.eGui;
        };

        const columnDefs = [
            {headerName: 'New Password Requirements', field: 'requirement', width: 210},
            {headerName: '', field: 'value', cellRenderer: 'statusCheckbox', width: 15}
        ];
        const grid = new AGGrid('cpp-grid', columnDefs, 'id');
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
                    $('#cpp-grid').show();
                    if (res.minimumLength !== '0')
                        grid.addRecord({id: 1, requirement: 'At least ' + res.minimumLength + ' characters'});
                    if (res.minimumLetters !== '0')
                        grid.addRecord({id: 2, requirement: 'At least ' + res.minimumLetters + ' letters'});
                    if (res.minimumDigits !== '0')
                        grid.addRecord({id: 3, requirement: 'At least ' + res.minimumDigits + ' digits'});
                    if (res.minimumLowerCaseLetters !== '0')
                        grid.addRecord({
                            id: 4,
                            requirement: 'At least ' + res.minimumLowerCaseLetters + ' lowercase letters'
                        });
                    if (res.minimumUpperCaseLetters !== '0')
                        grid.addRecord({
                            id: 5,
                            requirement: 'At least ' + res.minimumUpperCaseLetters + ' upper case letters'
                        });
                    if (res.minimumSpecialChars !== '0')
                        grid.addRecord({
                            id: 6,
                            requirement: 'At least ' + res.minimumSpecialChars + ' special characters'
                        });
                }
            }
        });

        $$('cpp-show-passwords').onChange((val) => {
            $$('cpp-old-password').setPassword(!val);
            $$('cpp-new-password').setPassword(!val);
            $$('cpp-new-password2').setPassword(!val);
        });

        function matchLength(str, regex) {
            return Utils.assureArray(str.match(regex)).length;
        }

        function passTests() {
            let ret = true;
            let val = $$('cpp-new-password').getValue();
            if (!val)
                val = '';
            let letters = matchLength(val, /[a-zA-Z]/g);
            let digits = matchLength(val, /[0-9]/g);
            let lcLetters = matchLength(val, /[a-z]/g);
            let ucLetters = matchLength(val, /[A-Z]/g);
            let nsc = matchLength(val, /[`~!@#$%^&*()\-_=+{}\[\]\\|\/;:'"?.>,<]/g);
            if (req.minimumLength !== '0') {
                $('#cpp-cb1').prop('checked', val.length >= req.minimumLength);
                if (val.length < req.minimumLength)
                    ret = false;
            }
            if (req.minimumLetters !== '0') {
                $('#cpp-cb2').prop('checked', letters >= req.minimumLetters);
                if (letters < req.minimumLetters)
                    ret = false;
            }
            if (req.minimumDigits !== '0') {
                $('#cpp-cb3').prop('checked', digits >= req.minimumDigits);
                if (digits < req.minimumDigits)
                    ret = false;
            }
            if (req.minimumLowerCaseLetters !== '0') {
                $('#cpp-cb4').prop('checked', lcLetters >= req.minimumLowerCaseLetters);
                if (lcLetters < req.minimumLowerCaseLetters)
                    ret = false;
            }
            if (req.minimumUpperCaseLetters !== '0') {
                $('#cpp-cb5').prop('checked', ucLetters >= req.minimumUpperCaseLetters);
                if (ucLetters < req.minimumUpperCaseLetters)
                    ret = false;
            }
            if (req.minimumSpecialChars !== '0') {
                $('#cpp-cb6').prop('checked', nsc >= req.minimumSpecialChars);
                if (nsc < req.minimumSpecialChars)
                    ret = false;
            }
            return ret;
        }

        $$('cpp-new-password').onCChange(passTests);

        $$('cpp-old-password').focus();

        return new Promise(function (resolve, reject) {
            Utils.popup_open('change-password-popup', 'cpp-old-password');

            $$('cpp-update').onclick(() => {
                if ($$('cpp-old-password').isError('Old password'))
                    return;
                if ($$('cpp-new-password').isError('New password'))
                    return;
                if ($$('cpp-new-password2').isError('Confirm New Password'))
                    return;
                const np1 = $$('cpp-new-password').getValue();
                const np2 = $$('cpp-new-password2').getValue();
                if (np1 !== np2) {
                    Utils.showMessage('Error', 'New Password and Confirm New Password do not match.');
                    return;
                }
                if (!passTests()) {
                    Utils.showMessage('Error', 'Your new password does not meet the minimum requirements.');
                    return;
                }
                if (np1 === $$('cpp-old-password').getValue()) {
                    Utils.showMessage('Error', 'Your new password must be different from your old password.');
                    return;
                }
                const data = {
                    oldPassword: $$('cpp-old-password').getValue(),
                    newPassword: np1
                };
                $$('cpp-old-password').clear();
                $$('cpp-new-password').clear();
                $$('cpp-new-password2').clear();
                AWS.callSoap(WS, "changePassword", data).then(async function (res) {
                    if (res.wsStatus === '0') {
                        await Utils.showMessage('Information', 'Password changed successfully');
                        Utils.popup_close();
                        resolve();
                    } else
                        $$('cpp-old-password').focus();
                });

            });
        });
    }

    if (res.meetsMinimumPasswordRequirements === 'false') {
        await Utils.showMessage('Error', 'Your password does not meet the minimum requirements.  You will need to change it.');
        await changePassword();
        Framework.logout();
    } else if (res.expiredPasswordOlderThan !== '0') {
        await Utils.showMessage('Error', 'Your current password has expired. Passwords expire after ' +
            res.expiredPasswordOlderThan + ' days.  You must change your password now in order to continue.');
        await changePassword();
        Framework.logout();
    } else {

        // prevent accidental browser back button
        window.onbeforeunload = function () {
            return "Back button hit.";
        };

        Framework.userInfo = {};
        Framework.userInfo.personId = res.personId;
        Framework.userInfo.personFName = res.personFName;
        Framework.userInfo.personLName = res.personLName;
        Framework.userInfo.title = res.personFName + ' ' + res.personLName + ' (' + AWS.user + ') - ' + companyName;
        Framework.userInfo.canSendEmail = res.canSendEmail === 'true';
        Framework.getScreen(null);
    }

};

Framework.about = async () => {
    let done = false;
    $('#about-popup-current-year').text((new Date()).getFullYear());
    $('#about-popup-current-screen').text(Framework.lastLoadedScreen);
    $('#about-popup-current-screen-id').text(Framework.lastLoadedScreenID);
    let res = await AWS.callSoap("Main", "getReleaseDetails");
    if (res.wsStatus !== "0")
        return;
    $('#about-popup-build-date').text(res.buildDate);
    $('#about-popup-source-code-revision').text(res.sourceCodeRevisionNumber);
    $('#about-popup-source-code-path').text(res.sourceCodeRevisionPath);
    $('#about-popup-application-path').text(res.applicationPath);
    $('#about-popup-backend-path').text(AWS.url);
    $('#about-popup-frontend-path').text(window.location);
    $('#about-popup-database').text(res.database);
    
    $('#about-max-memory').text(Utils.format(res.maxMemory, "C", 0, 0));
    $('#about-total-memory').text(Utils.format(res.totalMemory, "C", 0, 0));
    $('#about-free-memory').text(Utils.format(res.freeMemory, "C", 0, 0));
    $('#about-used-memory').text(Utils.format(res.usedMemory, "C", 0, 0));
    $('#about-min-used').text(Utils.format(res.minUsed, "C", 0, 0));
    $('#about-max-used').text(Utils.format(res.maxUsed, "C", 0, 0));
    $('#about-working-min').text(Utils.format(res.workingSetMinimum, "C", 0, 0));
    $('#about-working-max').text(Utils.format(res.workingSetMaximum, "C", 0, 0));
    $('#about-next-reset').text(res.timeToNextReset);

    async function getMemoryStats() {
        res = await AWS.callSoap("Main", "getReleaseDetails");
        if (res.wsStatus === "0") {
            $('#about-max-memory').text(Utils.format(res.maxMemory, "C", 0, 0));
            $('#about-total-memory').text(Utils.format(res.totalMemory, "C", 0, 0));
            $('#about-free-memory').text(Utils.format(res.freeMemory, "C", 0, 0));
            $('#about-used-memory').text(Utils.format(res.usedMemory, "C", 0, 0));
            $('#about-min-used').text(Utils.format(res.minUsed, "C", 0, 0));
            $('#about-max-used').text(Utils.format(res.maxUsed, "C", 0, 0));
            $('#about-working-min').text(Utils.format(res.workingSetMinimum, "C", 0, 0));
            $('#about-working-max').text(Utils.format(res.workingSetMaximum, "C", 0, 0));
            $('#about-next-reset').text(res.timeToNextReset);
            if (!done)
                setTimeout(getMemoryStats, 2000);
        }
    }
    getMemoryStats();
    
    
    $('#about-popup-display-size').text(screen.width + "x" + screen.height);

    const save = window.onresize;

    function resize(event) {
        $('#about-popup-screen-size').text(window.innerWidth + "x" + window.innerHeight);
        if (save && event)
            save(event);
    }

    window.onresize = resize;
    resize(null);
    Utils.popup_open("about-popup", null);
    $('#about-popup-ok').off('click').click(function () {
        done = true;
        window.onresize = save;
        Utils.popup_close('about-popup');
    });
};

Framework.preferences = () => {
};

Framework.help = () => {
    const win = window.open('http://stack360.io/contact', '_blank');
    win.focus();
};

Framework.logout = () => {
    Utils.suspendDepth = 0;
    document.body.style.cursor = 'default';
    Framework.screenGroupStack = [];
    AWS.setUser('', '');
    AWS.setCompanyId('');
    AWS.setUuid('');
    Framework.needToLoadFramework = true;
    window.onbeforeunload = null;  //  allow logout
    location.reload();
};
