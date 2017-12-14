/**
 *                                            Bosch SI Example Code License
 *                                              Version 1.0, January 2016
 *
 * Copyright 2017 Bosch Software Innovations GmbH ("Bosch SI"). All rights reserved.
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

    var THROTTLE_RATE_MS = 1000;

    var ui = {};
    ui.window = $(window);
    ui.geolocationLabel = $('#geolocation-label');
    ui.orientationLabel = $('#orientation-label');
    ui.statusLabel = $('#status-label');

    var logger = {
        log: function (level, message) {
            if (typeof message == 'object') {
                message = JSON.stringify(message);
            }
            if (message.length > 140) {
                message = message.substr(0, 140) + " ...";
            }
            var s = new Date().toISOString().replace("T", " ").replace("Z", "") + " " + level + ": " + message;

            console.log(s);

            $("<div />").text(s).appendTo(ui.statusLabel);
            if (ui.statusLabel.children().length > 10) {
                ui.statusLabel.children(":first").remove();
            }
        },
        info: function (message) {
            this.log("Info", message);
        },
        warn: function (message) {
            this.log("Warning", message);
        },
        error: function (message) {
            this.log("Error", message);
        }
    }

    var params = {};
    window.location.search.replace(
        new RegExp("([^?&=]+)(=([^&]*))?", "g"),
        function (match, p, dummy, v) {
            params[p] = v;
        });
    var thingId = params.thingId;

    // listen for geolocation changes
    if (geolocation) {
        geolocation.watchPosition(throttle(geolocationChanged, THROTTLE_RATE_MS));
    } else {
        ui.geolocationLabel.text('Not available.');
    }

    // listen for orientation changes and transmit data every 100ms
    ui.window.on('deviceorientation', throttle(orientationChanged, THROTTLE_RATE_MS));

    function geolocationChanged(geoData) {
        var position = {
            latitude: geoData.coords.latitude,
            longitude: geoData.coords.longitude
        };

        ui.geolocationLabel.text(JSON.stringify(position, null, 3));
        updateGeolocation({geoposition: position})
            .then(function onSuccess(data) {
                logger.info('Geolocation updated successfully.');
            }, function onError(error) {
                logger.error(error);
            });
    }

    function orientationChanged(event) {
        var eventData = (event.alpha && event.beta && event.gamma) ? event : event.originalEvent;
        var orientation = {
            x: eventData.beta,
            y: eventData.gamma,
            z: eventData.alpha
        };

        ui.orientationLabel.text(JSON.stringify(orientation, null, 3));

        updateOrientation(orientation)
            .then(function onSuccess(data) {
                logger.info('Orientation updated successfully.');
            }, function onError(error) {
                logger.error(error);
            });

    }

    function updateGeolocation(position) {
        return updateFeatureProperties(thingId, 'geolocation', position);
    }

    function updateOrientation(orientation) {
        return updateFeatureProperties(thingId, 'orientation', orientation);
    }

    function updateFeatureProperties(thingId, featureId, properties) {
        return new Promise(function (resolve, reject) {
            if (thingId) {
                updateFeaturePropertiesRaw(thingId, featureId, properties)
                    .then(resolve, function onError(data) {
                        if (data.status == 404) {
                            // on NOT FOUND create feature first and then retry updating values
                            $.ajax({
                                       type: 'PUT',
                                       url: 'api/2/things/' + thingId + '/features/' + featureId,
                                       data: JSON.stringify({}),
                                       contentType: 'application/json; charset=UTF-8'
                                   })
                                .then(function onSuccess(data) {
                                    updateFeaturePropertiesRaw(thingId, featureId, properties)
                                        .then(resolve, reject)
                                }, function onError(data) {
                                    reject(data.status + " " + data.statusText + ": " + data.responseText);
                                });
                        } else {
                            reject(data.status + " " + data.statusText + ": " + data.responseText);
                        }
                    });
            } else {
                reject('no thingId specified');
            }
        });
    }

    function updateFeaturePropertiesRaw(thingId, featureId, properties) {
        return $.ajax({
                          type: 'PUT',
                          url: 'api/2/things/' + thingId + '/features/' + featureId + '/properties',
                          data: JSON.stringify(properties),
                          contentType: 'application/json; charset=UTF-8'
                      });
    }

    function throttle(fn, threshhold, scope) {
        threshhold || (threshhold = 250);
        var last,
            deferTimer;
        return function () {
            var context = scope || this;

            var now = +new Date,
                args = arguments;
            if (last && now < last + threshhold) {
                // hold on to it
                clearTimeout(deferTimer);
                deferTimer = setTimeout(function () {
                    last = now;
                    fn.apply(context, args);
                }, threshhold);
            } else {
                last = now;
                fn.apply(context, args);
            }
        };
    }

})(jQuery, Promise, window, navigator.geolocation);
