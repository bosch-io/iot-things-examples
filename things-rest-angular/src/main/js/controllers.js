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
function RestController($scope, $core, Things, Thing, Attributes, Attribute, Acl, AclEntry, Features, Feature, Properties, Property) {
    var RESPONSE_TYPE = {SUCCESS: 'success', ERROR: 'error', WARNING: 'warning'};
    var PERMISSIONS = ["READ", "WRITE", "ADMINISTRATE"];

    $scope.responses = [];
    $scope.thingToCreate = new Thing();
    $scope.thingToModify = new Thing();

    $scope.setApiToken = function (token) {
        $core.configuration.setApiToken(token);
    };

    $scope.getThings = function (thingIds, fields) {
        if (thingIds === '') {
            thingIds = undefined;
        }

        if (fields === '') {
            fields = undefined;
        }

        Things.getArray({ids: thingIds, fields: fields},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getThings", value.$status, value);
            },
            function error(httpResponse) {
                logError("getThings", httpResponse);
            });
    };

    $scope.getThing = function (thingId, fields) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }

        if (fields === '') {
            // sending an empty string selects no fields at all
            fields = undefined;
        }

        Thing.get({thingId: thingId, fields: fields},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getThing", value.$status, value);
            },
            function error(httpResponse) {
                logError("getThing", httpResponse);
            });
    };

    $scope.postThing = function (thing) {
        var t = new Thing();

        if (thing.authSubjectId === '') {
            delete t.acl;
        } else if (thing.authSubjectId !== undefined) {
            var permissions = {};
            for (var i = 0; i < PERMISSIONS.length; i++) {
                permissions[PERMISSIONS[i]] = true;
            }

            var acl = {};
            acl[thing.authSubjectId] = permissions;

            t.acl = acl;
        }

        if (thing.attributes === '') {
            delete t.attributes;
        } else if (thing.attributes) {
            t.attributes = JSON.parse(thing.attributes);
        }

        Things.post({}, t,
            function success(value, responseHeaders) {
                logResponse(RESPONSE_TYPE.SUCCESS,
                    "postThing", value.$status, "Thing created successfully at " + responseHeaders("location"));
            },
            function error(httpResponse) {
                logError("postThing", httpResponse);
            });
    };

    $scope.putThing = function (thing) {
        var t = new Thing();
        t.thingId = thing.thingId;

        if (thing.authSubjectId === '') {
            delete t.acl;
        } else if (thing.authSubjectId !== undefined) {
            var permissions = {};
            for (var i = 0; i < PERMISSIONS.length; i++) {
                permissions[PERMISSIONS[i]] = true;
            }

            var acl = {};
            acl[thing.authSubjectId] = permissions;

            t.acl = acl;
        }

        if (thing.attributes === '') {
            delete t.attributes;
        } else if (thing.attributes) {
            t.attributes = JSON.parse(thing.attributes);
        }

        Thing.put({ thingId: t.thingId }, t,
            function success(value) {
                var message = value.$status === 201 ? value : "Thing modified successfully.";
                logResponse(RESPONSE_TYPE.SUCCESS, "putThing", value.$status, message);
            },
            function error(httpResponse) {
                logError("putThing", httpResponse);
            });
    };

    $scope.deleteThing = function (thingId) {
        Thing.remove({thingId: thingId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "deleteThing", value.$status, "Thing deleted successfully.");
            }, function error(httpResponse) {
                logError("deleteThing", httpResponse);
            });
    };
    

    $scope.getAcl = function (thingId) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }

        Acl.get({thingId: thingId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getAcl", value.$status, value);
            },
            function error(httpResponse) {
                logError("getAcl", httpResponse);
            });
    };

    $scope.getAclEntry = function (thingId, subject) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Authorization Subject ID must not be undefined or empty!');
        }
        if (isNullOrEmpty(subject)) {
            throw new Error('The Authorization Subject ID must not be undefined or empty!');
        }

        AclEntry.get({thingId: thingId, subject: subject},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getAclEntry", value.$status, value);
            },
            function error(httpResponse) {
                logError("getAclEntry", httpResponse);
            });
    };

    $scope.putAcl = function (thingId, aclEntries) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }

        var acl = JSON.parse(aclEntries);

        Acl.put({thingId: thingId}, acl,
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "putAcl", value.$status, "ACL modified successfully.");
            },
            function error(httpResponse) {
                logError("putAcl", httpResponse);
            });
    };

    $scope.putAclEntry = function (thingId, subject, permissions) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }
        if (isNullOrEmpty(subject)) {
            throw new Error('The Authorization Subject ID must not be undefined or empty!');
        }

        permissions = permissions.split(',');
        var aclEntryPermissions = {};
        for (var index in PERMISSIONS) {
            var permission = PERMISSIONS[index];
            aclEntryPermissions[permission] = arrayContainsPermission(permissions, permission);
        }

        AclEntry.put({thingId: thingId, subject: subject}, aclEntryPermissions,
            function success(value) {
                var message = value.$status === 201 ? value : "ACL entry modified successfully.";
                logResponse(RESPONSE_TYPE.SUCCESS, "putAclEntry", value.$status, message);
            },
            function error(httpResponse) {
                logError("putAclEntry", httpResponse);
            });
    };

    $scope.deleteAclEntry = function (thingId, subject) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }
        if (isNullOrEmpty(subject)) {
            throw new Error('The Authorization Subject ID must not be undefined or empty!');
        }

        AclEntry.delete({thingId: thingId, subject: subject},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "deleteAclEntry", value.$status, "ACL entry deleted successfully.");
            },
            function error(httpResponse) {
                logError("deleteAclEntry", httpResponse);
            });
    };
    
    
    $scope.getAttributes = function (thingId) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");

        Attributes.get({thingId: thingId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getAttributes", value.$status, value);
            },
            function error(httpResponse) {
                logError("getAttributes", httpResponse);
            });
    };

    $scope.getAttribute = function (thingId, jsonPointer) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(jsonPointer, "JSON Pointer");

        Attribute.get({thingId: thingId, jsonPointer: jsonPointer},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getAttribute", value.$status, value);
            },
            function error(httpResponse) {
                logError("getAttribute", httpResponse);
            });
    };

    $scope.putAttributes = function (thingId, jsonObject) {
        Attribute.put({ thingId: thingId}, jsonObject,
            function success(value) {
                var message = value.$status === 201 ? value : "Attributes modified successfully.";
                logResponse(RESPONSE_TYPE.SUCCESS, "putAttributes", value.$status, message);
            },
            function error(httpResponse) {
                logError("putAttributes", httpResponse);
            });
    };

    $scope.putAttribute = function (thingId, jsonPointer, jsonValue) {
        Attribute.put({ thingId: thingId, jsonPointer: jsonPointer}, jsonValue,
            function success(value) {
                var message = value.$status === 201 ? value : "Attribute modified successfully.";
                logResponse(RESPONSE_TYPE.SUCCESS, "putAttribute", value.$status, message);
            },
            function error(httpResponse) {
                logError("putAttribute", httpResponse);
            });
    };

    $scope.deleteAttribute = function (thingId, jsonPointer) {
        Attribute.delete({ thingId: thingId, jsonPointer: jsonPointer },
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "deleteAttribute", value.$status, "Attribute deleted successfully.");
            },
            function error(httpResponse) {
                logError("deleteAttribute", httpResponse);
            });
    };


    $scope.getFeatures = function (thingId) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }

        Features.get({thingId: thingId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getFeatures", value.$status, value);
            },
            function error(httpResponse) {
                logError("getFeatures", httpResponse);
            });
    };

    $scope.getFeature = function (thingId, featureId) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }
        if (isNullOrEmpty(featureId)) {
            throw new Error('The Feature ID must not be undefined or empty!');
        }

        Feature.get({thingId: thingId, featureId: featureId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getFeature", value.$status, value);
            },
            function error(httpResponse) {
                logError("getFeature", httpResponse);
            });
    };

    $scope.putFeatures = function (thingId, features) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }

        var theFeatures = JSON.parse(features);

        Features.put({thingId: thingId}, theFeatures,
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "putFeatures", value.$status, "Features modified successfully.");
            },
            function error(httpResponse) {
                logError("putFeatures", httpResponse);
            });
    };

    $scope.putFeature = function (thingId, featureId, feature) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }
        if (isNullOrEmpty(featureId)) {
            throw new Error('The Feature ID must not be undefined or empty!');
        }

        var theFeature = JSON.parse(feature);

        Feature.put({thingId: thingId, featureId: featureId}, theFeature,
            function success(value) {
                var message = value.$status === 201 ? value : "Feature modified successfully.";
                logResponse(RESPONSE_TYPE.SUCCESS, "putFeature", value.$status, message);
            },
            function error(httpResponse) {
                logError("putFeature", httpResponse);
            });
    };

    $scope.deleteFeature = function (thingId, featureId) {
        if (isNullOrEmpty(thingId)) {
            throw new Error('The Thing ID must not be undefined or empty!');
        }
        if (isNullOrEmpty(featureId)) {
            throw new Error('The Feature ID must not be undefined or empty!');
        }

        Feature.delete({thingId: thingId, featureId: featureId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "deleteFeature", value.$status, "Feature deleted successfully.");
            },
            function error(httpResponse) {
                logError("deleteFeature", httpResponse);
            });
    };


    $scope.getProperties = function (thingId, featureId) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(featureId, "Feature ID");

        Properties.get({thingId: thingId, featureId: featureId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getProperties", value.$status, value);
            },
            function error(httpResponse) {
                logError("getProperties", httpResponse);
            });
    };

    $scope.getProperty = function (thingId, featureId, jsonPointer) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(featureId, "Feature ID");
        ensureValueIsDefinedNotNull(jsonPointer, "JSON Pointer");

        Property.get({thingId: thingId, featureId: featureId, jsonPointer: jsonPointer},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "getProperty", value.$status, value);
            },
            function error(httpResponse) {
                logError("getProperty", httpResponse);
            });
    };

    $scope.putProperties = function (thingId, featureId, jsonObject) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(featureId, "Feature ID");
        ensureValueIsDefined(jsonObject, "JSON Object");

        var theProperties = JSON.parse(jsonObject);

        Properties.put({thingId: thingId, featureId: featureId}, theProperties,
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "putProperties", value.$status, "Properties modified successfully.");
            },
            function error(httpResponse) {
                logError("putProperties", httpResponse);
            });
    };

    $scope.putProperty = function (thingId, featureId, jsonPointer, jsonValue) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(featureId, "Feature ID");
        ensureValueIsDefinedNotNull(jsonPointer, "JSON Pointer");
        ensureValueIsDefined(jsonValue, "JSON Value");

        var theValue = JSON.parse(jsonValue);

        Property.put({thingId: thingId, featureId: featureId, jsonPointer: jsonPointer}, theValue,
            function success(value) {
                var message = value.$status === 201 ? value : "Property modified successfully.";
                logResponse(RESPONSE_TYPE.SUCCESS, "putProperty", value.$status, message);
            },
            function error(httpResponse) {
                logError("putProperty", httpResponse);
            });
    };

    $scope.deleteProperties = function (thingId, featureId) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(featureId, "Feature ID");

        Properties.delete({thingId: thingId, featureId: featureId},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "deleteProperties", value.$status, "Properties deleted successfully.");
            },
            function error(httpResponse) {
                logError("deleteProperties", httpResponse);
            });
    };

    $scope.deleteProperty = function (thingId, featureId, jsonPointer) {
        ensureValueIsDefinedNotNull(thingId, "Thing ID");
        ensureValueIsDefinedNotNull(featureId, "Feature ID");
        ensureValueIsDefinedNotNull(jsonPointer, "JSON Pointer");

        Property.delete({thingId: thingId, featureId: featureId, jsonPointer: jsonPointer},
            function success(value) {
                logResponse(RESPONSE_TYPE.SUCCESS, "deleteProperty", value.$status, "Property deleted successfully.");
            },
            function error(httpResponse) {
                logError("deleteProperty", httpResponse);
            });
    };


    $scope.clearResponses = function () {
        $scope.responses.length = 0;
    };


    function logError(functionName, httpResponse)
    {
        var message = httpResponse.data.message || httpResponse.statusText;
        logResponse(RESPONSE_TYPE.ERROR, functionName, httpResponse.status, message);
    }

    function ensureValueIsDefined(stringValue, stringName)
    {
        if (stringValue === undefined)
        {
            throw new Error('The ' + stringName + ' must not be undefined!');
        }
    }

    function ensureValueIsDefinedNotNull(stringValue, stringName)
    {
        if (isNullOrEmpty(stringValue)) {
            throw new Error('The ' + stringName + ' must not be null, undefined or empty!');
        }
    }

    function isNullOrEmpty(stringValue) {
        return (!stringValue || stringValue === '');
    }

    function arrayContainsPermission(array, permission) {
        var result = false;

        if (array instanceof Array && permission) {
            result = array.indexOf(permission) !== -1;
        }

        return result;
    }

    function logResponse(responseType, method, status, message) {
        var ts = new Date().toISOString();
        var response = {type: responseType, method: method, timestamp: ts, status: status, message: message};

        if (typeof message == 'object') {
            // got primitive value - ngResource can't handle it the "right" way
            response.message = message.$data;

            // delete the data property since it doesn't belong to the resource itself
            delete message.$data;
            // delete the status property since it doesn't belong to the resource itself
            delete message.$status;
        }

        $scope.responses.unshift(response); // add at first index in array
    }
}
