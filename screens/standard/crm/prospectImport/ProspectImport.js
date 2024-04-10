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

    $$('pi-pf_import').onclick(async function () {
        if ($$('pi-pf_file').isError('Prospect file'))
            return;

        const params = {
            uploadType: "salesGenieFileUpload"
        };
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('pi-pf_file', 'FileUploadServlet', params);
        Utils.waitMessageEnd();
        Utils.showMessage('Status', 'Import process complete.');
    });

    $$('pi-af_import').onclick(async function () {
        if ($$('pi-af_file').isError('Activity file'))
            return;

        const params = {
            uploadType: "prospectActivityFileUpload"
        };
        Utils.waitMessage('File upload in progress.');
        await AWS.fileUpload('pi-af_file', 'FileUploadServlet', params);
        Utils.waitMessageEnd();
        Utils.showMessage('Status', 'Import process complete.');
    });


})();
