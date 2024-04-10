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
      Date:  1/31/20
 */

/* global Kiss, Utils */

'use strict';

(function () {
    
    const processor = function (elm, attr, content) {
        let nStyle, originalValue = null;
        let required = false;
        if (attr.style)
            nStyle = attr.style;
        else
            nStyle = '';
        let nAttrs = '';
        let id;
        let default_option;
        let isDropdown = true;
        let valueWhenText;
        let dataWhenText;
        let changeFunc;
        let originalControl;
        let cls = '';
        let disabled = false;
        let outsideWidth;
        let insideWidth;
        let forceSelection;
        let forceDropDown;
        let triggerGlobalChange = true;
        for (let prop of Object.keys(attr)) {
            switch (prop) {

                // New attributes.

                case 'required':
                    required = true;
                    break;
                case 'disabled':
                    disabled = true;
                    break;
                case 'default-option':
                    default_option = attr[prop];
                    break;
                case 'inside-width':
                    insideWidth = attr[prop];
                    break;
                case 'outside-width':
                    outsideWidth = attr[prop];
                    break;

                // Pre-existing attributes

                case 'style':
                    break;  // Already dealing with this.
                case 'class':
                    cls = attr[prop];
                    break;
                case 'id':
                    id = Utils.removeQuotes(attr[prop]);
                    break;
                default:
                    nAttrs += ' ' + prop + '="' + attr[prop] + '"';
                    break;
            }
        }

        if (insideWidth)
            nStyle = 'width: ' + (Number(insideWidth)+10) + "px; " + nStyle;
        else if (outsideWidth)
            nStyle = 'width: ' + (Number(outsideWidth)-16) + "px; " + nStyle;
        if (!content  &&  default_option)
            content = '<option value="">' + default_option + '</option>';

        let btnId = id + "-chooser-button";

        const newElm = Utils.replaceHTML(id, elm, '<div style="display: inline-flex;"><select style="{style}" class="{class}" {attr} id="{id}">{content}</select><input type="button" id="{btnId}" class="btn-smart-chooser" disabled></div>', {
            style: nStyle,
            class: cls,
            attr: nAttrs,
            content: content,
            btnId: btnId
        });
        if (!newElm)
            return;
        let jqObj = newElm.jqObj;
        let dataStore = {};

        jqObj.on('change', function () {
            if (triggerGlobalChange)
                Utils.someControlValueChanged();
        });

        //--

        /*
         *  Force the user to use the selection button.
         */
        newElm.forceSelect = function (title = "(choose)") {
            if (!originalControl)
                originalControl = jqObj;
            const wth = originalControl.width();
            //const lb = parseInt(ctl.css("border-left-width"));
            //const rb = parseInt(ctl.css("border-right-width"));
            //const lp = parseInt(ctl.css("padding-left"));
            //const rp = parseInt(ctl.css("padding-right"));
            //const h = ctl.height();
            const mr = parseInt(originalControl.css("margin-right"));
            jqObj.replaceWith('<input id="' + id + '" type="text" value="' + title + '" disabled>');
            jqObj = $('#' + id);  // update reference
            jqObj.width(wth);
            //const wth2 = ctl.width();
            //const lb2 = parseInt(ctl.css("border-left-width"));
            //const rb2 = parseInt(ctl.css("border-right-width"));
            const lp2 = parseInt(jqObj.css("padding-left"));
            const rp2 = parseInt(jqObj.css("padding-right"));
            //const h2 = ctl.height();
            jqObj.width(wth-lp2-rp2-1);
            jqObj.css('margin-right', (mr)+'px');
            isDropdown = false;
            jqObj[0].kiss = newElm;  // make sure the new ctl is still a Kiss ctl
//            $('#' + id + "-chooser-button").prop('disabled', disabled);
            newElm.enable();
            return this;
        };

        //---------------------------------------------------------------------------
        //  High-level interface


        let hl_maxNumberInDropDown;
        let hl_addChooseOption;

        let hl_items_items;
        let hl_items_valField;
        let hl_items_labelField;
        let hl_items_dataField;

        let hl_sf_selectFunction;  // must be an async function
        let hl_sf_valField;
        let hl_sf_labelField;
        let hl_sf_dataField;

        let hl_defaultValue;
        let hl_defaultLabel;
        let hl_defaultData;

        let hl_testMode;

        /**
         * First method called to initialize the high-level interface to the smart chooser.
         *
         * @param maxNumberInDropDown
         * @param addChooseOption
         */
        newElm.setup = function (maxNumberInDropDown, addChooseOption) {
            hl_maxNumberInDropDown = maxNumberInDropDown;
            hl_addChooseOption = addChooseOption;

            hl_items_items = undefined;
            hl_items_valField = undefined;
            hl_items_labelField = undefined;
            hl_items_dataField = undefined;

            hl_sf_selectFunction = undefined;
            hl_sf_valField = undefined;
            hl_sf_labelField = undefined;
            hl_sf_dataField = undefined;

            hl_defaultValue = undefined;
            hl_defaultLabel = undefined;
            hl_defaultData = undefined;

            hl_testMode = undefined;

            return newElm;
        };

        /**
         * Define the field names in the data array.
         *
         * @param items
         * @param valField
         * @param labelField can be string field name or formatting function
         * @param dataField
         */
        newElm.setupItems = function (items, valField, labelField, dataField) {
            hl_items_items = Utils.assureArray(items);
            hl_items_valField = valField;
            hl_items_labelField = labelField;
            hl_items_dataField = dataField;
            return newElm;
        };

        /**
         *  If the smartchooser has too many entries it has a selection button that allows the user to select via
         *  a search popup.  This <code>selectfunction</code> implements that functionality.
         *  <br><br>
         *  <code>valField</code>, <code>labelField</code>, and <code>dataField</code> are indexes into the
         *  value returned by running <code>selectfunction</code>.
         *
         * @param selectFunction  must be async
         * @param valField
         * @param labelField can be string field name or formatting function
         * @param dataField
         */
        newElm.setupSelectFunction = function (selectFunction, valField, labelField, dataField) {
            hl_sf_selectFunction = selectFunction;
            hl_sf_valField = valField;
            hl_sf_labelField = labelField;
            hl_sf_dataField = dataField;
            return newElm;
        };

        newElm.setupDefault = function (defaultValue, defaultLabel, defaultData) {
            hl_defaultValue = defaultValue;
            hl_defaultLabel = defaultLabel;
            hl_defaultData = defaultData;
            return newElm;
        };

        /**
         *
         * @param testMode true to force both dropdown and selection button
         */
        newElm.testMode = function (testMode) {
            hl_testMode = testMode;
            return newElm;
        };

        newElm.run = function () {
            newElm.clear();
            if (hl_testMode) {
                newElm.useDropdown();
                $('#'+id+'-chooser-button').prop('disabled', false);
                if (hl_addChooseOption)
                    newElm.add('', typeof hl_addChooseOption === 'string' ? hl_addChooseOption : '(choose)');
                newElm.addItems(hl_items_items, hl_items_valField, hl_items_labelField, hl_items_dataField);
                if (hl_defaultValue)
                    newElm.setValue(hl_defaultValue, hl_defaultLabel, hl_defaultData);
                if (hl_sf_selectFunction)
                    newElm.setSelectFunction(async () => {
                        const item = await hl_sf_selectFunction();
                        if (!item)
                            return;  //  don't change anything because nothing was selected
                        if (item[hl_sf_valField] === undefined) {
                            console.log("field " + hl_sf_valField + " not found.");
                            return;
                        }
                        const lbl = typeof hl_sf_labelField === 'function' ? hl_sf_labelField(item) : item[hl_sf_labelField];
                        if (lbl === undefined) {
                            console.log("select function label not found.");
                            return;
                        }
                        if (hl_sf_dataField  &&  item[hl_sf_dataField] === undefined) {
                            console.log("select field " + hl_sf_dataField + " not found.");
                            return;
                        }
                        newElm.setValue(item[hl_sf_valField], lbl, hl_sf_dataField ? item[hl_sf_dataField] : null);
                    });
            } else if (hl_items_items.length === 0 && !forceSelection)
                newElm.nothingToSelect();
            else if (hl_items_items.length === 1 && !forceSelection) {
                const item = hl_items_items[0];
                const lbl = typeof hl_items_labelField === 'function' ? hl_items_labelField(item) : item[hl_items_labelField];
                if (!lbl) {
                    console.log("Label field not found.");
                    return;
                }
                if (item[hl_items_valField] === undefined) {
                    console.log("Value field " + hl_items_valField + " not found.");
                    return;
                }
                if (hl_items_dataField && item[hl_items_dataField] === undefined) {
                    console.log("Data field " + hl_items_dataField + " not found.");
                    return;
                }
                newElm.singleValue(item[hl_items_valField], lbl, hl_items_dataField ? item[hl_items_dataField] : null);
            } else if ((hl_items_items.length < hl_maxNumberInDropDown || forceDropDown) && !forceSelection) {
                newElm.useDropdown();
                if (hl_addChooseOption)
                    newElm.add('', typeof hl_addChooseOption === 'string' ? hl_addChooseOption : '(choose)');
                newElm.addItems(hl_items_items, hl_items_valField, hl_items_labelField, hl_items_dataField);
                if (hl_defaultValue)
                    newElm.setValue(hl_defaultValue, hl_defaultLabel, hl_defaultData);
                jqObj.off('change').on('change', function () {
                    if (triggerGlobalChange)
                        Utils.someControlValueChanged();
                    // func gets passed the selected value, label
                    if (changeFunc)
                        changeFunc(jqObj.val(), jqObj.find('option:selected').text(), dataStore[jqObj.val()]);
                });
            } else {
                newElm.forceSelect();
                if (hl_defaultValue)
                    newElm.setValue(hl_defaultValue, hl_defaultLabel, hl_defaultData);
                newElm.setSelectFunction(async () => {
                    const item = await hl_sf_selectFunction();
                    if (!item)
                        return;  //  don't change anything because nothing was selected
                    // the next line is a good place to put a breakpoint to see the data returned from the select function
                    if (item[hl_sf_valField] === undefined) {
                        console.log("field " + hl_sf_valField + " not found.");
                        return;
                    }
                    const lbl = typeof hl_sf_labelField === 'function' ? hl_sf_labelField(item) : item[hl_sf_labelField];
                    if (lbl === undefined) {
                        console.log("select function label not found.");
                        return;
                    }
                    if (hl_sf_dataField  &&  item[hl_sf_dataField] === undefined) {
                        console.log("select field " + hl_sf_dataField + " not found.");
                        return;
                    }
                    newElm.setValue(item[hl_sf_valField], lbl, hl_sf_dataField ? item[hl_sf_dataField] : null);
                    if (triggerGlobalChange)
                        Utils.someControlValueChanged();
                    // changeFunc gets passed the selected value, label
                    if (changeFunc)
                        changeFunc(jqObj.val(), jqObj.find('option:selected').text(), dataStore[jqObj.val()]);
                });
            }
        };

        //  End of high-level interface

        newElm.setForceSelection = function (flg=true) {
            forceSelection = flg;
            return this;
        };

        newElm.setForceDropDown = function (flg=true) {
            forceDropDown = flg;
            return this;
        };
        
        newElm.triggerGlobalChange = function (flg) {
            triggerGlobalChange = flg;
        };
        
        /**
         * Reset control back to its initial state.
         *
         * @returns {this}
         */
        newElm.reset = function () {
            let ctl = $('#' + id);
            if (originalControl) {
                ctl.replaceWith(originalControl);
                ctl = originalControl;
                isDropdown = true;
            }
            return this.clear().enable().show();
        };

        newElm.nothingToSelect = function () {
            return this.forceSelect().setValue('', '(nothing to select)').disable();
        };

        newElm.singleValue = function (val, label, data) {
            valueWhenText = val;
            dataWhenText = data;
            return this.forceSelect().setValue(val, label, data).disable();
        };

        newElm.clear = function (txt = '(choose)') {
            if (isDropdown) {
                jqObj.empty();
                if (default_option)
                    newElm.add('', default_option);
                dataStore = {};
                originalValue = jqObj.val();
            } else {
                // the following line is done this way because I changed the control mid-stream jQuery doesn't work.
                document.getElementById(id).value = valueWhenText = default_option ? default_option : txt;
                originalValue = valueWhenText = '';
            }
            return this;
        };

        newElm.add = function (val, label, data) {
            if (isDropdown) {
                jqObj.append($('<option></option>').attr('value', val).text(label));
                if (data)
                    dataStore[val] = data;
                originalValue = jqObj.val();
            }
            return this;
        };

        /**
         * This is the function that gets executed when the user hits the search icon.
         *
         * @param fun
         * @returns {newElm}
         */
        newElm.setSelectFunction = function(fun) {
            $('#'+id+'-chooser-button').off('click').click(fun);
            return this;
        };

        /**
         * labelField can optionally be a function to format the label.
         *
         * @param items
         * @param valField
         * @param labelField string field name or function to format label
         * @param dataField
         * @returns {newElm}
         */
        newElm.addItems = function (items, valField, labelField, dataField) {
            if (isDropdown) {
                items = Utils.assureArray(items);
                const len = items.length;
                for (let i=0 ; i < len ; i++) {
                    let item = items[i];
                    let lbl = typeof labelField === 'function' ? labelField(item) : item[labelField];
                    jqObj.append($('<option></option>').attr('value', item[valField]).text(lbl));
                    dataStore[item[valField]] = dataField ? item[dataField] : item;
                }
                originalValue = jqObj.val();
            }
            return this;
        };

        /**
         * This causes the dropdown only to be used.
         * I also, optionally, allows data fill.
         *
         * @param items       optional
         * @param valField
         * @param labelField
         * @param dataField optional
         * @returns {newElm}
         */
        newElm.useDropdown = function (items, valField, labelField, dataField) {
            newElm.clear();
            $('#'+id+'-chooser-button').prop('disabled', true);
            return items ? this.addItems(items, valField, labelField, dataField) : this;
        };

        newElm.size = function () {
            return jqObj.children('option').length;
        };

        newElm.getValue = function () {
            return isDropdown ? jqObj.val() : valueWhenText;
        };

        newElm.getIntValue = function () {
            let val = isDropdown ? jqObj.val() : valueWhenText;
            return val ? Number(val) : 0;
        };

        function isValuePresent(val) {
            const options = jqObj.find('option');
            for (let i=0 ; i < options.length ; i++) {
                let val2 = $(options[i]).val();
                if (val === val2)
                    return true;
            }
            return false;
        }

        /**
         * If it is a dropdown and the item isn't present, it is added and then selected.
         *
         * @param val
         * @param label
         * @param data
         * @returns {newElm}
         */
        newElm.setValue = function (val, label, data) {
            if (isDropdown) {
                if (!isValuePresent(val)) {
                    jqObj.append($('<option></option>').attr('value', val).text(label));
                    if (data)
                        dataStore[val] = data;
                }
                jqObj.val(val);
                originalValue = jqObj.val();
            } else {
                let lbl = label;
                if (!val  &&  !label)
                    lbl = "(choose)";
                document.getElementById(id).value = lbl;
                valueWhenText = val;
                dataWhenText = data;
//                if (changeFunc)
//                    changeFunc(val, label, data);
            }
            return this;
        };

        newElm.getLabel = function () {
            return isDropdown ? jqObj.find('option:selected').text() : document.getElementById(id).value;
        };

        newElm.getData = function () {
            return isDropdown ? dataStore[jqObj.val()] : dataWhenText;
        };

        newElm.isDirty = function () {
            return originalValue !== jqObj.val();
        };

        newElm.readOnly = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            jqObj.attr('readonly', flg);
            return this;
        };

        newElm.readWrite = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            jqObj.attr('readonly', !flg);
            return this;
        };

        newElm.isReadOnly = function () {
            return !!jqObj.attr('readonly');
        };

        newElm.disable = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            if (flg) {
                jqObj.prop('disabled', true);
                $('#' + id + '-chooser-button').prop('disabled', true);
                disabled = true;
            } else {
                if (isDropdown) {
                    jqObj.prop('disabled', false);
                    $('#' + id + '-chooser-button').prop('disabled', true);
                } else {
                    jqObj.prop('disabled', true);
                    $('#' + id + '-chooser-button').prop('disabled', false);
                }
                disabled = false;
            }
            return this;
        };

        newElm.enable = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            if (flg) {
                if (isDropdown) {
                    jqObj.prop('disabled', false);
                    $('#' + id + '-chooser-button').prop('disabled', true);
                } else {
                    jqObj.prop('disabled', true);
                    $('#' + id + '-chooser-button').prop('disabled', false);
                }
                disabled = false;
            } else {
                jqObj.prop('disabled', true);
                $('#' + id + '-chooser-button').prop('disabled', true);
                disabled = true;
            }
            return this;
        };

        newElm.isDisabled = function () {
            return disabled;
        };

        newElm.hide = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            if (flg) {
                jqObj.hide();
                $('#' + id + '-chooser-button').hide();
            } else {
                jqObj.show();
                $('#' + id + '-chooser-button').show();
            }
            return this;
        };

        newElm.show = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            if (flg) {
                jqObj.show();
                $('#' + id + '-chooser-button').show();
            } else {
                jqObj.hide();
                $('#' + id + '-chooser-button').hide();
            }
            return this;
        };

        newElm.isHidden = function () {
            return jqObj.is(':hidden');
        };

        newElm.isVisible = function () {
            return jqObj.is(':visible');
        };

        newElm.onChange = function (func) {
            changeFunc = func;
            jqObj.off('change').on('change', function () {
                if (triggerGlobalChange)
                    Utils.someControlValueChanged();
                // func gets passed the selected value, label
                if (func)
                    func(jqObj.val(), jqObj.find('option:selected').text(), dataStore[jqObj.val()]);
            });
            return this;
        };

        newElm.focus = function () {
            jqObj.focus();
            return this;
        };

        newElm.isError = function (desc) {
            if (!required)
                return false;
            let val = newElm.getValue();
            if (!val) {
                Utils.showMessage('Error', desc + ' selection is required.').then(function () {
                    jqObj.focus();
                });
                return true;
            }
            return false;
        };

        if (disabled)
            newElm.disable();
    };

    const componentInfo = {
        name: 'SmartChooser',
        tag: 'smart-chooser',
        processor: processor
    };

    Utils.newComponent(componentInfo);

})();
