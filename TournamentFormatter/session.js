var url = require("url");
const ITALIC = "*";
const BOLD = "**";
const UNDERLINED = "__";
const STRIKETHROUGH = "~~";
const FRAME = "=========================================================================";
const TEAMNAME = "__**Teamname:**__\n";
const PLACEMENTS ={"Playing":":play_pause: _**Playing**_",
    "First Place":":first_place::one:**. Place**",
    "Second Place":":second_place::two:**. Place**",
    "Third Place":":third_place::three:**. Place**",
    "Fourth Place":":four:**. Place**",
    "XPBoost":":regional_indicator_x::regional_indicator_p:  **Boost**",
    "Canceled":":x:",
    "Delayed":":construction: _**Delayed**_",
    ":play_pause: _**Playing**_":"Playing",
    ":first_place::one:**. Place**":"First Place",
    ":second_place::two:**. Place**":"Second Place",
    ":third_place::three:**. Place**":"Third Place",
    ":four:**. Place**":"Fourth Place",
    ":regional_indicator_x::regional_indicator_p:  **Boost**":"XPBoost",
    ":x:":"Canceled" ,
    ":construction: _**Delayed**_":"Delayed"
};
const PLACEMENTKEYS = ["Playing" , "First Place", "Second Place", "Third Place", "Fourth Place", "XPBoost", "Canceled", "Delayed"];
const BATTLEFY_HOST = "battlefy.com";
const EVENT_URL = "https://events.euw.leagueoflegends.com/events/";
const BRACKET = toItalic("Bracket:") + " ";
const OVERVIEW = toItalic("Overview:") + " ";
const EVENT = toItalic("Eventpage:") + " ";

function session(team){
    this.notes = "-";
    this.team = team;
    this.tournaments = new Array();

    this.addTournament = function(t, checkDuplicates = true){
        if(this.tournaments != null){
            if(checkDuplicates){
                var duplicates = 1;
                this.tournaments.forEach(function(tmnt){
                    if(tmnt.bracketURL.tName.includes(t.bracketURL.tName)) duplicates++;
                });
                if(duplicates > 1) t.bracketURL.tName = t.bracketURL.tName + " " + duplicates;
            }
        }
        this.tournaments.push(t);
    }

    this.toString = function(){
        var out = FRAME + "\n";
        this.tournaments.forEach(function(t){
            out += t.toString()
        })
        out += TEAMNAME + this.team.name + "\n" + FRAME + "\n" + toBold("Notes: " + this.notes);
        return out;
    }
}

function team(name, isDefault = false){
    this.name = name;
    this.isDefault = isDefault;

    this.toString = function(){
        return this.name;
    }
}

function tournament(){
    this.bracketURL;
    this.eventURL;
    this.eventID;
    this.status = "Playing";
    this.tName;

    this.event = function(str){
        if(str.length == 6) {
            this.eventID = str;
            this.eventURL = EVENT_URL + this.eventID;
        }
        else {
            this.eventURL = str;
            this.eventID = this.eventURL.substr(this.eventURL.length - 6);
        }
    }

    this.setStatus = function(statusStr){
        if(PLACEMENTKEYS.contains(statusStr)) this.status = statusStr;
        else throw "Can't compute status: " + statusStr;
    }

    this.toString = function(){
        return toUnderlined(toBold(this.bracketURL.tName)) + ": " + PLACEMENTS[this.status] + "\n" + BRACKET
                + "<" + this.bracketURL.toString() + ">" + "\n" + EVENT + "<" + this.eventURL + ">\n\n";
    }
}

function battlefyURL(sURL){
    this.url;
    this.splitPath = new Array();
    this.tName;
    //try{
        this.url = url.parse(sURL, true);
        if(!(this.url.host === BATTLEFY_HOST)) throw "Not Battlefy URL: " + sURL;
    // }catch(e){
    //     throw "Malformed URL: " + sURL;
    // }

    this.splitPath = this.url.pathname.split("/").clean("");

    if(this.splitPath.length > 0){
        this.tName = this.splitPath[0];
        this.tName = this.tName.charAt(0).toUpperCase() + this.tName.substr(1);
    }

    this.toString = function(){
        return this.url.href;
    }
}

function wrap(string, wrapper){
    return wrapper + string + wrapper;
}

function toBold(string){
    return wrap(string, BOLD);
}

function toItalic(string){
    return wrap(string, ITALIC);
}

function toUnderlined(string){
    return wrap(string, UNDERLINED);
}

function toStrikethrough(string){
    return wrap(string, STRIKETHROUGH);
}

Array.prototype.clean = function(deleteValue) {
  for (var i = 0; i < this.length; i++) {
    if (this[i] == deleteValue) {
      this.splice(i, 1);
      i--;
    }
  }
  return this;
};

module.exports = {session, team, tournament, battlefyURL};
