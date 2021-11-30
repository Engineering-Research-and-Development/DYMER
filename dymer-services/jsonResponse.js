function JsonResponse() {
    this.success = true;
    this.message = "";
    this.data = [];
    this.extraData = {};
}
JsonResponse.prototype.setSuccess = function(val) {
    this.success = val;
}
JsonResponse.prototype.isSuccess = function() {
    return this.success;
}
JsonResponse.prototype.setMessages = function(val) {
    this.message = val;
}
JsonResponse.prototype.getMessages = function() {
    return this.message;
}

JsonResponse.prototype.setData = function(val) {
    this.data = val;
}
JsonResponse.prototype.getData = function() {
    return this.data;
}

JsonResponse.prototype.setExtraData = function(val) {
    this.extraData = val;
}
JsonResponse.prototype.getExtraData = function() {
    return this.extraData;
}
JsonResponse.prototype.addData = function(val) {
    this.data.push(val);
}

JsonResponse.prototype.addExtraData = function(key, val) {
    this.extraData[key] = val;
}

module.exports = JsonResponse;