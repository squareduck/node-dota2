var Dota2 = require("../index"),
    fs = require("fs"),
    util = require("util"),
    Schema = require('protobuf').Schema,
    base_gcmessages = new Schema(fs.readFileSync(__dirname + "/../generated/base_gcmessages.desc")),
    gcsdk_gcmessages = new Schema(fs.readFileSync(__dirname + "/../generated/gcsdk_gcmessages.desc")),
    dota_gcmessages_client = new Schema(fs.readFileSync(__dirname + "/../generated/dota_gcmessages_client.desc")),
    dota_gcmessages_server = new Schema(fs.readFileSync(__dirname + "/../generated/dota_gcmessages_server.desc")),
    protoMask = 0x80000000;


// Methods

Dota2.Dota2Client.prototype.resourceRequest = function(steamId, playerId, callback) {
  callback = callback || null;
  /* Sends a message to the Game Coordinator requesting `accountId`'s profile data.  Listen for `profileData` event for Game Coordinator's response. */
  if (!this._gcReady) {
    if (this.debug) util.log("GC not ready, please listen for the 'ready' event.");
    return null;
  }

  if (this.debug) util.log("Sending resource request");
  var payload = dota_gcmessages_server.CMsgDOTARequestPlayerResources.serialize({
    "steamId": steamId,
    "playerId": playerId
  });

  this._client.toGC(this._appid, (Dota2.EDOTAGCMsg.k_EMsgGCRequestPlayerResources | protoMask), payload, callback);
};

// Handlers

var handlers = Dota2.Dota2Client.prototype._handlers;

handlers[Dota2.EDOTAGCMsg.k_EMsgGCRequestPlayerResourcesResponse] = function onPlayerResourcesResponse(message, callback) {
  callback = callback || null;
  var playerResourcesResponse = dota_gcmessages_server.CMsgDOTARequestPlayerResourcesResponse.parse(message);

  if (playerResourcesResponse.steamId) {
    if (this.debug) util.log("Received player resource data for: " + playerResourcesResponse.steamId);
    this.emit("playerResourceData", playerResourcesResponse.steamId, playerResourcesResponse);
    if (callback) callback(null, playerResourcesResponse);
  }
  else if (this.debug) {
    util.log("Received a bad resource data");
    if (callback) callback(playerResourcesResponse.steamId, playerResourcesResponse);
  }
};