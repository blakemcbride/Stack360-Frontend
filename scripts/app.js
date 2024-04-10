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
 * This file contains the functions and variables used application wide.
 *
 * All rights reserved.
 */

'use strict';

/**
 * Can be used in places of toggling add/edit pop-up behaviour.
 *
 * @type {{ADD: number, EDIT: number}}
 */
const AddEditMode = {ADD: 0, EDIT: 1};

const DateCriteriaMatcher = {
    BEFORE: {name: 'Before', value: 6},
    AFTER: {name: 'On or after', value: 7},
    ON: {name: 'On', value: 8},
    IS_SET: {name: 'Is Set', value: 9},
    IS_NOT_SET: {name: 'Is Not Set', value: 10}
};

const StringCriteriaMatcher = {
    STARTS_WITH: {name: 'Starts With', value: 2},
    ENDS_WITH: {name: 'Ends With', value: 3},
    CONTAINS: {name: 'Contains', value: 4},
    EXACT_MATCH: {name: 'Exact Match', value: 5}
};

const MilitaryBranchTypes = {
    NONE: {name: '(None)', value: ''},
    ARMY: {name: 'Army', value: 'A'},
    AIR_FORCE: {name: 'Air Force', value: 'F'},
    NAVY: {name: 'Navy', value: 'N'},
    MARINES: {name: 'Marines', value: 'M'},
    COAST_GUARD: {name: 'Coast Guard', value: 'C'},
    NATIONAL_GUARD: {name: 'National Guard', value: 'G'},
    OTHER: {name: 'Other', value: 'O'},
};

const DischargeTypes = {
    UNSPECIFIED: {name: '', value: 'U'},
    HONORABLE: {name: 'Honorable', value: 'H'},
    GENERAL: {name: 'General (under honorable conditions)', value: 'G'},
    OTHER: {name: 'Other than honorable', value: 'O'},
    BAD_CONDUCT: {name: 'Bad Conduct', value: 'B'},
    DISHONORABLE: {name: 'Dishonorable', value: 'D'},
};

const Months = {
    NONE: {name: '(select)', value: ''},
    JAN: {name: 'January', value: 1},
    FEB: {name: 'February', value: 2},
    MAR: {name: 'March', value: 3},
    APR: {name: 'April', value: 4},
    MAY: {name: 'May', value: 5},
    JUN: {name: 'June', value: 6},
    JUL: {name: 'July', value: 7},
    AUG: {name: 'August', value: 8},
    SEP: {name: 'September', value: 9},
    OCT: {name: 'October', value: 10},
    NOV: {name: 'November', value: 11},
    DEC: {name: 'December', value: 12},
};

const EmployeeSearchTypes = {
    DEPENDANT: {name: 'Dependant', value: 0},
    APPLICANT: {name: 'Applicant', value: 1}
};

const COUNTRY_NAMES = ["Afghanistan", "Aland Islands", "Albania", "Algeria", "American Samoa", "Andorra", "Angola", "Anguilla", "Antarctica", "Antigua and Barbuda",
    "Argentina", "Armenia", "Aruba", "Australia", "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus",
    "Belgium", "Belize", "Benin", "Bermuda", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Bouvet Island", "Brazil",
    "British Indian Ocean Territory", "Brunei Darussalam", "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada",
    "Cape Verde", "Cayman Islands", "Central African Republic", "Chad", "Chile", "China", "Christmas Island", "Cocos (Keeling) Islands",
    "Colombia", "Comoros", "Congo", "Congo, The Democratic Republic of the", "Cook Islands", "Costa Rica", "Cote D'Ivoire", "Croatia", "Cuba",
    "Cyprus", "Czech Republic", "Denmark", "Djibouti", "Dominica", "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Equatorial Guinea",
    "Eritrea", "Estonia", "Ethiopia", "Falkland Islands (Malvinas)", "Faroe Islands", "Fiji", "Finland", "France", "French Guiana",
    "French Polynesia", "French Southern Territories", "Gabon", "Gambia", "Georgia", "Germany", "Ghana", "Gibraltar", "Greece", "Greenland",
    "Grenada", "Guadeloupe", "Guam", "Guatemala", "Guernsey", "Guinea", "Guinea-Bissau", "Guyana", "Haiti", "Heard Island and Mcdonald Islands",
    "Holy See (Vatican City State)", "Honduras", "Hong Kong", "Hungary", "Iceland", "India", "Indonesia", "Iran, Islamic Republic of",
    "Iraq", "Ireland", "Isle Of Man", "Israel", "Italy", "Jamaica", "Japan", "Jersey", "Jordan", "Kazakhstan", "Kenya", "Kiribati",
    "Korea, Democratic People's Republic of", "Korea, Republic of", "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic", "Latvia",
    "Lebanon", "Lesotho", "Liberia", "Libyan Arab Jamahiriya", "Liechtenstein", "Lithuania", "Luxembourg", "Macao",
    "Macedonia, The Former Yugoslav Republic of", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Marshall Islands",
    "Martinique", "Mauritania", "Mauritius", "Mayotte", "Mexico", "Micronesia, Federated States Of", "Moldova", "Monaco", "Mongolia",
    "Montenegro", "Montserrat", "Morocco", "Mozambique", "Myanmar", "Namibia", "Nauru", "Nepal", "Netherlands", "Netherlands Antilles",
    "New Caledonia", "New Zealand", "Nicaragua", "Niger", "Nigeria", "Niue", "Norfolk Island", "Northern Mariana Islands", "Norway", "Oman",
    "Pakistan", "Palau", "Palestinian Territory, Occupied", "Panama", "Papua New Guinea", "Paraguay", "Peru", "Philippines", "Pitcairn",
    "Poland", "Portugal", "Puerto Rico", "Qatar", "Reunion", "Romania", "Russian Federation", "Rwanda", "Saint Barthelemy", "Saint Helena",
    "Saint Kitts and Nevis", "Saint Lucia", "Saint Martin", "Saint Pierre and Miquelon", "Saint Vincent and The Grenadines", "Samoa",
    "San Marino", "Sao Tome and Principe", "Saudi Arabia", "Senegal", "Serbia", "Seychelles", "Sierra Leone", "Singapore", "Slovakia",
    "Slovenia", "Solomon Islands", "Somalia", "South Africa", "South Georgia and the South Sandwich Islands", "Spain", "Sri Lanka",
    "Sudan", "Suriname", "Svalbard and Jan Mayen", "Swaziland", "Sweden", "Switzerland", "Syrian Arab Republic", "Taiwan, Province of China",
    "Tajikistan", "Tanzania, United Republic of", "Thailand", "Timor-Leste", "Togo", "Tokelau", "Tonga", "Trinidad and Tobago",
    "Tunisia", "Turkey", "Turkmenistan", "Turks and Caicos Islands", "Tuvalu", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
    "United States", "United States Minor Outlying Islands", "Uruguay", "Uzbekistan", "Vanuatu", "Venezuela", "Viet Nam",
    "Virgin Islands, British", "Virgin Islands, U.S.", "Wallis and Futuna", "Western Sahara", "Yemen", "Zambia", "Zimbabwe"];

const COUNTRY_ABBREVIATIONS = ["AF", "AX", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT", "AZ", "BS", "BH", "BD", "BB",
    "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BA", "BW", "BV", "BR", "IO", "BN", "BG", "BF", "BI", "KH", "CM", "CA", "CV",
    "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO", "KM", "CG", "CD", "CK", "CR", "CI", "HR", "CU", "CY", "CZ", "DK", "DJ",
    "DM", "DO", "EC", "EG", "SV", "GQ", "ER", "EE", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE",
    "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN", "HK", "HU", "IS",
    "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE", "KI", "KP", "KR", "KW", "KG", "LA",
    "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MK", "MG", "MW", "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU",
    "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA", "MZ", "MM", "NA", "NR", "NP", "NL", "AN", "NC", "NZ", "NI", "NE",
    "NG", "NU", "NF", "MP", "NO", "OM", "PK", "PW", "PS", "PA", "PG", "PY", "PE", "PH", "PN", "PL", "PT", "PR", "QA", "RE",
    "RO", "RU", "RW", "BL", "SH", "KN", "LC", "MF", "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SK",
    "SI", "SB", "SO", "ZA", "GS", "ES", "LK", "SD", "SR", "SJ", "SZ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG",
    "TK", "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "US", "UM", "UY", "UZ", "VU", "VE", "VN", "VG",
    "VI", "WF", "EH", "YE", "ZM", "ZW"];

const US_STATE_ABBREVIATIONS = ["AK", "AL", "AR", "AZ", "CA",
    "CO", "CT", "DC", "DE", "FL",
    "GA", "HI", "IA", "ID", "IL",
    "IN", "KS", "KY", "LA", "MA",
    "MD", "ME", "MI", "MN", "MO",
    "MS", "MT", "NC", "ND", "NE",
    "NH", "NJ", "NM", "NY", "NV",
    "OH", "OK", "OR", "PA", "RI",
    "SC", "SD", "TN", "TX", "UT",
    "VA", "VT", "WA", "WI", "WV",
    "WY"];

const ACCESS_LEVEL_NOT_VISIBLE = 0;
const ACCESS_LEVEL_READ_ONLY = 1;
const ACCESS_LEVEL_WRITE = 2;

const UA_REASONS = {
    NONE: {name: "(None)", value: ''},
    NO_SHOW: {name: "No Show", value: 1},
    NON_PRODUCTIVE: {name: "Non-productive", value: 2},
    INSUBORDINATE: {name: "Insubordinate", value: 3},
    CLIENT_REQUEST: {name: "Client Request", value: 4},
    EMPLOYEE_REQUEST: {name: "Employee Request", value: 5},
    OTHER: {name: "Other", value: 6},
};

/**
 * Can e used to log errors to the console.
 *
 * @param e Error to log.
 */
function logError(e) {
    console.log(e.name + ': ' + e.message);
}

/**
 * Executes an HTTP GET request using an XMLHttpRequest. The function is asynchronous.
 *
 * @param url URL of the resource.
 * @param successFn Function to execute on success.
 * @param failureFn Function to execute on failure.
 *
 * @deprecated
 */
function httpGet(url, successFn, failureFn) {
    const request = new XMLHttpRequest();

    request.onreadystatechange = () => {
        if (request.readyState === 4) {
            if (request.status === 200) {
                if (successFn)
                    successFn(request.responseText);
            } else {
                if (failureFn)
                    failureFn(request.responseText);
            }
        }
    };

    request.open("GET", url, true);
    request.send();
}

/**
 * Bind a control to an enumeration.
 *
 * @param id Id of the control
 * @param enumObj Enumeration object.
 * @param defaultValue(optional) Default enum to be set.
 */
function bindToEnum(id, enumObj, defaultValue) {
    const ctl = $$(id);
    ctl.clear();

    for (let key of Object.keys(enumObj))
        ctl.add(enumObj[key].value, enumObj[key].name);

    if (defaultValue)
        ctl.setValue(defaultValue.value);
}

/**
 * Restricts input for the given textbox to the given inputFilter.
 *
 * @param id Id of the text input to filter.
 * @param inputFilter Regular expression filter value.
 */
function setInputFilter(id, inputFilter) {
    const textbox = document.getElementById(id);

    ["input", "keydown", "keyup", "mousedown", "mouseup", "select", "contextmenu", "drop"].forEach(function (event) {
        textbox.addEventListener(event, function () {
            if (inputFilter(this.value)) {
                this.oldValue = this.value;
                this.oldSelectionStart = this.selectionStart;
                this.oldSelectionEnd = this.selectionEnd;
            } else if (this.oldValue) {
                this.value = this.oldValue;
                this.setSelectionRange(this.oldSelectionStart, this.oldSelectionEnd);
            }
        });
    });
}

/**
 * Sets the filter property for SSN fields. Please note that this function overrides the onChange event handler of the element.
 *
 * @param inputId Id of the input element.
 */
function setSSNFilter(inputId) {
    // let ssnInput = document.getElementById(inputId);
    setInputFilter(inputId, value => {
        return /^\d*$/.test(value) && Number(value) <= 999999999;
    });
}

/**
 * Format the username to display format.
 *
 * @param firstName First name of the user.
 * @param middleName First name of the user. Default is null.
 * @param lastName Last name of the user. Default is null.
 * @param userName Username of the user. Default is null.
 *
 * @returns {string} The name formatted in app standard display format.
 */
function formatDisplayName(firstName, middleName = null, lastName = null, userName = null) {
    let displayName = lastName + ", " + firstName;

    if (middleName != null)
        displayName += " " + middleName;

    if (userName != null)
        displayName += " (" + userName + ")";

    return displayName;
}

function countriesToDropDown(id, defaultVal = 'US') {
    const ctl = $$(id);
    for (let i = 0; i < COUNTRY_NAMES.length; i++)
        ctl.add(COUNTRY_ABBREVIATIONS[i], COUNTRY_NAMES[i]);
    ctl.setValue(defaultVal);
}

/**
 * Fill a drop down with data items from a web response. The function provides the ability to provide the array name
 * and the default label. The value for default label is always ''.
 *
 * @param id Id of the drop down to be filled.
 * @param data Data object returned from the web service.
 * @param value Name of the value field on an array item.
 * @param label Name of the label field on the array item.
 * @param defaultLabel Default label to be displayed on the drop down. Default value if not provided is '(select)'.
 * @param arrayName Name of the array to choose from within the data object. Default value if not provided is 'item'.
 * @param customLabelFn Custom label function to apply. The current line item is passed into the function. Default is null.`
 */
function fillDropDownFromService(id, data, value, label, defaultLabel = '(select)', arrayName = 'item', customLabelFn = null) {
    const items = Utils.assureArray(data[arrayName]);
    const ctl = $$(id);

    ctl.clear();
    ctl.add('', defaultLabel);

    if (items.length > 0) {
        items.forEach(item => {
            if (customLabelFn == null)
                ctl.add(item[value], item[label], item);
            else
                ctl.add(item[value], customLabelFn(item), item);
        });
    }
}

/**
 * Shows the given HTML container/element if it was hidden.
 *
 * @param id ID of the element to be shown
 *
 * @deprecated
 */
function showContainer(id) {
    try {
        document.getElementById(id).style.display = 'inherit';
    } catch (e) {
        console.log(`Couldn't change element style: ${e}`);
    }
}

/**
 * Hide a given HTML container/element using CSS.
 *
 * @param id ID of the element to be hidden.
 *
 * @deprecated
 */
function hideContainer(id) {
    try {
        document.getElementById(id).style.display = 'none';
    } catch (e) {
        console.log(`Couldn't change element style: ${e}`);
    }
}

/**
 * Get a list of states for the given country if available, else return null.
 *
 * @param country Country abbreviation
 * @returns {null|string[]} Array of states if available, else null.
 */
function getStatesForCountry(country) {
    if (country === 'US')
        return US_STATE_ABBREVIATIONS;
    return null;
}

function statesToDropDown(id, states) {
    const ctl = $$(id);
    ctl.clear();
    ctl.add('', '(select)');
    for (let i = 0; i < states.length; i++)
        ctl.add(states[i], states[i]);
}

function canRead(accessLevel) {
    return accessLevel >= ACCESS_LEVEL_READ_ONLY;
}

function canWrite(accessLevel) {
    return accessLevel >= ACCESS_LEVEL_WRITE;
}
