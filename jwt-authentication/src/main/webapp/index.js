/*
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

"use strict";

$(document).ready(function () {

    var errorMessageRow = $('#error-message-row');
    var errorMessage = $('#error-message');

    var failHandler = function (jqxhr, status, error) {
        $('#autoRefresh').prop('checked', false);
        if (jqxhr.status === 401) {
            window.location = "login.html"
        }
        else {
            errorMessage.text("Server request failed.\n\n" + status + " " + error);
            errorMessageRow.show();
            setTimeout(function () {
                errorMessageRow.hide();
                errorMessage.text('');
            }, 5000);
        }
    };

    // --- Click handler for refreshing list of things
    var refreshTable = function () {
        $.getJSON("api/1/search/things?option=limit(0,200),sort(%2BthingId)")
            .fail(failHandler)
            .done(function (data, status) {

                $("#tableBody").empty();

                for (var i = 0; i < data.items.length; i++) {
                    var thing = data.items[i];

                    var row = $("<tr>");
                    row.attr("thingId", thing.thingId);
                    row.append($("<td>").text(thing.thingId));
                    row.append($("<td>").html($("<pre>").text(JSON.stringify(thing))));

                    $("#tableBody").append(row);
                }
            });

        if ($("#autoRefresh").is(":checked")) {
            window.setTimeout(refreshTable, 1000);
        }
    };

    // --- Click handler for creating new things
    var createThing = function () {
        var thingId = window.prompt("Please enter Thing Id (e.g. \"com.acme:mydevice123\" or leave it empty to generate an id).");
        if (thingId === '') {
            $.ajax("api/1/things", {
                    method: "POST",
                    data: JSON.stringify({})
                })
                .fail(failHandler)
                .done(refreshTable);
        } else if (thingId != null) {
            $.ajax("api/1/things/" + thingId, {
                    method: "PUT",
                    data: JSON.stringify({})
                })
                .fail(failHandler)
                .done(refreshTable);
        }
    };

    $("#refreshTable").click(refreshTable);
    $("#createThing").click(createThing);
    $("#autoRefresh").on("change", function () {
        if ($("#autoRefresh").is(":checked")) {
            window.setTimeout(refreshTable, 1000);
        }
    });

    $('#logout').on('click', function () {
        $.ajax({
                type: 'DELETE',
                url: 'authentication'
            })
            .done(function onSuccess() {
                window.location = 'login.html';
            });
    });

    refreshTable();
});