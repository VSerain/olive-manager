export default {
    jsonValid(json:string): any {
        let jsonObject;
        try {
            jsonObject = JSON.parse(json);
        } catch (error) {
            // So this is string
            jsonObject = {
                error: true,
                data: json,
            };
        }
        return jsonObject;
    },
};
