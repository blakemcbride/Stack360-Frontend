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
      Author: Blake McBride
      Date:  4/24/20
 */

/* global Utils, Component */

'use strict';

(function () {

    const processor = function (elm, attr, content) {
        let nstyle;
        let height = null;
        let width = null;
        if (attr.style)
            nstyle = attr.style;
        else
            nstyle = '';
        let nattrs = '';
        let id;
        for (let prop in attr) {
            switch (prop) {

                // new attributes
                case 'height':
                    height = Utils.removeQuotes(attr[prop]);
                    break;
                case 'width':
                    width = Utils.removeQuotes(attr[prop]);
                    break;


                // preexisting attributes

                case 'style':
                    break;  // already dealing with this
                case 'id':
                    id = Utils.removeQuotes(attr[prop]);
                    break;
                default:
                    nattrs += ' ' + prop + '="' + attr[prop] + '"';
                    break;
            }
        }

        nattrs += ' hidden';
        nstyle = 'height: ' + height + '; width: ' + width + '; ' + nstyle;

        content = content.replace(/<popup-title/, '<div').replace(/<\/popup-title>/, '</div>');
        content = content.replace(/<popup-body/, '<div').replace(/<\/popup-body>/, '</div>');

        Utils.replaceHTML(id, elm, '<div id="{id}" style="{style}" {attr}>{content}</div>', {
            style: nstyle,
            attr: nattrs,
            content: content
        });
    };

    const componentInfo = {
        name: 'Popup',
        tag: 'popup',
        processor: processor
    };
    Utils.newComponent(componentInfo);

})();


