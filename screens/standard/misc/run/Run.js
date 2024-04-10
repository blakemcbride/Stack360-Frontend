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

     This screen and the corresponding code on the backend are used for testing purposes only.
     Basically, the back-end can be edited to execute any code when the run button is clicked in the context
     of a fully running system.  This is useful for testing and debugging.

 */


'use strict';

(function () {

    const WS = "com.arahant.services.standard.misc.run";

    $$('run').onclick(function () {
        const data = {

        };

        Server.call(WS, "Run", data).then(function (res) {
            if (res._Success) {

            }
        });
    });

}());
