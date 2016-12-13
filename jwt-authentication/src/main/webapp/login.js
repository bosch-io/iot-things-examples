/**
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2016 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted provided that the
 * following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following
 * disclaimer.
 *
 * 2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the
 * following disclaimer in the documentation and/or other materials provided with the distribution.
 *
 * BOSCH SI PROVIDES THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO
 * THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF
 * ALL NECESSARY SERVICING, REPAIR OR CORRECTION. THIS SHALL NOT APPLY TO MATERIAL DEFECTS AND DEFECTS OF TITLE WHICH
 * BOSCH SI HAS FRAUDULENTLY CONCEALED. APART FROM THE CASES STIPULATED ABOVE, BOSCH SI SHALL BE LIABLE WITHOUT
 * LIMITATION FOR INTENT OR GROSS NEGLIGENCE, FOR INJURIES TO LIFE, BODY OR HEALTH AND ACCORDING TO THE PROVISIONS OF
 * THE GERMAN PRODUCT LIABILITY ACT (PRODUKTHAFTUNGSGESETZ). THE SCOPE OF A GUARANTEE GRANTED BY BOSCH SI SHALL REMAIN
 * UNAFFECTED BY LIMITATIONS OF LIABILITY. IN ALL OTHER CASES, LIABILITY OF BOSCH SI IS EXCLUDED. THESE LIMITATIONS OF
 * LIABILITY ALSO APPLY IN REGARD TO THE FAULT OF VICARIOUS AGENTS OF BOSCH SI AND THE PERSONAL LIABILITY OF BOSCH SI'S
 * EMPLOYEES, REPRESENTATIVES AND ORGANS.
 */
'use strict';
(function ($, Promise, window, geolocation) {
    var ui = {};
    ui.loginForm = $('#login-form');
    ui.loginErrorMessage = $('#login-error-message');
    ui.loginErrorMessageRow = $('#login-error-message-row');
    ui.loginTenantCheckbox = $('#login-tenant-checkbox');
    ui.loginTenantInput = $('#login-tenant-input');
    ui.loginWithGoogleButton = $('#login-with-google-button');

    var authContext;

    ui.loginForm.on('submit', function () {
        var tenantNameOrId = this.tenantnameorid.value;
        var userName = this.username.value;
        var password = this.password.value;

        ui.loginErrorMessage.text('');
        ui.loginErrorMessageRow.hide();

        authContext = {
            userName: userName,
            password: password
        };

        if (!ui.loginTenantCheckbox.prop('checked') && notNullOrEmpty(tenantNameOrId)) {
            authContext.tenantNameOrId = tenantNameOrId;
        }

        $.ajax({
                type: 'POST',
                url: 'authentication',
                data: JSON.stringify(authContext),
                contentType: "application/json; charset=utf-8"
            })
            .done(function onSuccess() {
                window.location = 'index.html';
            })
            .fail(function onError(data) {
                if (data.status === 401) {
                    ui.loginErrorMessage.text('Your credentials are invalid. Please try again!');
                } else {
                    ui.loginErrorMessage.text('There was an unexpected error. Please try again!');
                }
                ui.loginErrorMessageRow.show();
            });

        return false;
    });

    ui.loginTenantCheckbox.on('change', function () {
        if (this.checked)
        {
            ui.loginTenantInput.prop('disabled', true);
        }
        else
        {
            ui.loginTenantInput.prop('disabled', false);
        }
    });

    ui.loginWithGoogleButton.on('click', function () {
        window.location = 'oauth2start/google';
    });

    $.ajax({
        type: 'DELETE',
        url: 'authentication'
    });

    function notNullOrEmpty(string) {
        return string && string !== '';
    }

})(jQuery, Promise, window, navigator.geolocation);
