var url = require("url");
const ITALIC = "*";
const BOLD = "**";
const UNDERLINED = "__";
const STRIKETHROUGH = "~~";
const FRAME = "=========================================================================";
const TEAMNAME = "__**Teamname:**__\n";
const PLACEMENTS ={"playing":":play_pause: _**Playing**_",
    "firstplace":":first_place::one:**. Place**",
    "first":":first_place::one:**. Place**",
    "1":":first_place::one:**. Place**",
    "secondplace":":second_place::two:**. Place**",
    "second":":second_place::two:**. Place**",
    "2":":second_place::two:**. Place**",
    "thirdplace":":third_place::three:**. Place**",
    "third":":third_place::three:**. Place**",
    "3":":third_place::three:**. Place**",
    "fourthplace":":four:**. Place**",
    "fourth":":four:**. Place**",
    "4":":four:**. Place**",
    "xpboost":":regional_indicator_x::regional_indicator_p:  **Boost**",
    "boost":":regional_indicator_x::regional_indicator_p:  **Boost**",
    "canceled":":x:",
    "delayed":":construction: _**Delayed**_",
    ":play_pause: _**Playing**_":"playing",
    ":first_place::one:**. Place**":"firstplace",
    ":second_place::two:**. Place**":"secondplace",
    ":third_place::three:**. Place**":"thirdplace",
    ":four:**. Place**":"fourthplace",
    ":regional_indicator_x::regional_indicator_p:  **Boost**":"xpboost",
    ":x:":"canceled" ,
    ":construction: _**Delayed**_":"delayed"
};
const PLACEMENTKEYS = ["playing", "firstplace", "first", "1", "secondplace", "second", "2", "thirdplace", "third", "3", "fourthplace", "fourth", "4", "xpboost", "boost", "canceled", "delayed"];
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
        if(PLACEMENTKEYS.includes(statusStr)){
            this.status = statusStr;
            return true
        }
        else return false;
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
