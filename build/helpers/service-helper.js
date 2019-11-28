"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = {
    jsonValid: function (json) {
        var jsonObject;
        try {
            jsonObject = JSON.parse(json);
        }
        catch (error) {
            // So this is string
            jsonObject = {
                error: true,
                data: json,
            };
        }
        return jsonObject;
    },
};
