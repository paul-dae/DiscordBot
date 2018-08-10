var Discord = require('discord.js');
var logger = require('winston');
var auth = require('./auth.json');
var session = require("./TournamentFormatter/session.js").session;
var team = require("./TournamentFormatter/session.js").team;
var tournament = require("./TournamentFormatter/session.js").tournament;
var battlefyURL = require("./TournamentFormatter/session.js").battlefyURL;
var config = require("./config.json");

var teams = new Array();
var tour;
var s;
var awaiting;
const SESSIONHELP = "!session *arg*  Alias: !s *arg*\nargs:\n\t**new** : Create new Session\n\t**team** : Assign a team\n\t**tourney** args Alias: **tour** : Add a new Tournament";
const SESSIONTOURHELP = "!s tour *Bracket URL* *Event URL*"
const TEAMHELP = "!team *arg*\nargs:\n\t**ls** : Lists available Teams\n\t**add** *name* : Adds a new Team"
const ABORT = "\nTo abort the process type abort"
const ERRORLOG = [""];
const ERRORMSG = [];
const BOTCOMMANDER = "botcommander"

// Configure logger settings
logger.remove(logger.transports.Console);
logger.add(new logger.transports.Console, {
    colorize: true
});
logger.level = 'debug';
// Initialize Discord Bot
var bot = new Discord.Client();

bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    teams.push(new team("lolgg"));
});
bot.on('message', async message => {
    if(message.author.bot || !message.member.roles.find(role => role.name === BOTCOMMANDER) || message.content.indexOf(config.prefix) === 0) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();
    var command2;

    switch(command){
        case "s":
        case "session":
            command2 = args.shift().toLowerCase();
            logger.info(command2);
            switch(command2){
                case "new":
                    createSession(message);
                break
                case "tour":
                case "tourney":
                case "tournament":
                    addTournament(message, args);
                break;
                case "team":
                    assignTeam(message, args);
                break;
                case "edit":
                    editTournament(message, args);
                break;
            }
        break;
        case "t":
        case "teams":
            command2 = args.shift().toLowerCase();
            switch(command2){
                case "ls":
                case "list":
                    teamsList(message);
                break;
                case "add":
                    teamsAdd(message, args);
                break;
            }
        break;
        case "h":
        case "help":
            help(message, args);
        break;
    }
});

bot.login(auth.token);

/**
 * Creates a new session() with the team teams[0]
 * @param  {message} message the received message object
 */
const createSession = function(message){
    this.requiredArgLength = 0;
    this.args = new Array(0);
    this.message = message;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }

    if(this.noError){
        s = new session(teams[0]);
        getInfo("newsession", this.message, [s.team.name]);
    }
}

/**
 * Adds a tournament to the session with the given bracket and event URLs.
 * @param  {message} message the received message object
 * @param  {[string, string]} args  [0]: bracketURL, [1]: event Url or ID
 */
const addTournament = function(message, args){
    this.requiredArgLength = 2;
    this.message = message;
    this.args = args;
    this.bracketURL;
    this.eventStr;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }
    else{
        this.bracketURL = this.args.shift();
        this.eventStr = this.args.shift();
    }
    if(s == null){
        getError("nosession", this.message, "session", []);
        this.noError = false;
    }

    if(this.noError)
        tour = new tournament();
        tour.bracketURL = new battlefyURL(this.bracketURL);
        tour.event(this.eventStr);
        s.addTournament(tour);
        getInfo("sTour", this.message, [tour.bracketURL.toString(), tour.eventURL]);
    }
}

/**
 * Assigns the team with the passed teamname to the current session, if a
 * team with that name exists in teams.
 * @param  {message} message the received message object
 * @param  {[string]} args    [0]: teamName
 */
const assignTeam = function(message, args){
    this.reuiredArgLength = 1;
    this.message = message;
    this.args = args;
    this.teamName;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }
    else{
        this.teamName = args.shift();
        if(s == null){
            getError("nosession", this.message, "session", []);
            this.noError = false;
        }
        if(knownTeam(this.teamname)){
            getError("unknownteam", this.message, "team", [args])
            this.noError = false;
        }
    }

    if(this.noError){
        s.team = new team(this.teamName);
        getInfo("sTeam", this.message, [this.teamName]);
    }
}

/**
 * Edit tournament with given indexOf
 * @param  {message} message the received message object
 * @param  {[int, string, string]} args    [0]: teamIndex, [1]:Field to edit, [2]: new Value
 */
const editTournament = function(message, args){
    this.requiredArgLength = 3;
    this.message = message;
    this.args = args;
    this.teamIndex;
    this.cmd;
    this.value;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }
    else{
        this.teamIndex = parseInt(this.args.shift().toLowerCase()) - 1;
        this.cmd = this.args.shift().toLowerCase();
        this.value = this.args.shift();

        if(s.tournaments.length < this.teamIndex){
            getError("indexOutOfRange", this.message, "session post", [args])
            this.noError = false;
        }
    }
    if(s == null){
        getError("nosession", this.message, "session", []);
        this.noError = false;
    }
    else if(s.tournaments == null){
        getError("notours", this.message, "session", [args])
        this.noError = false;
    }

    if(this.noError){
        switch(cmd){
            case "bracket":
                s.tournaments[this.teamIndex].bracketURL = new battlefyURL(this.value);
            break;
            case "event":
                s.tournaments[this.teamIndex].event(this.value);
            break;
            case "status":
                s.tournaments[this.teamIndex].setStatus(this.value);
            break;
            default:
                getError("editcmd", this.message, "session edit", [this.cmd])
            break;
        }
        getInfo("sEdit", this.message, [this.teamIndex, s.tournaments[this.teamIndex].bracketURL.toString(), s.tournaments[this.teamIndex].eventURL]);
    }
}


/**
 * Posts the Session
 * @param  {message} message the received message object
 */
const post = function(message){
    this.requiredArgLength = 0;
    this.args = new Array(0);
    this.message = message;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }
    if(s == null){
        getError("nosession", this.message, "session", []);
        this.noError = false;
    }
    else if(s.tournaments == null || s.tournaments == 0){
        getError("notours", this.message, "session", [args])
        this.noError = false;
    }

    if(this.noError){
        this.message.send(s.toString());
        logger.info("Posting session");
    }
}

/**
 * Lists all available teams
 * @param  {message} message the received message object
 */
const teamsList = function(message){
    this.requiredArgLength = 0;
    this.args = new Array(0);
    this.message = message;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }
    if(s == null){
        getError("nosession", this.message, "session", []);
        this.noError = false;
    }
    if(s.tournaments == null || s.tournaments == 0){
        getError("notours", this.message, "session", [args])
        this.noError = false;
    }

    if(this.noError){
        var teamsStr = "";
        teams.forEach((t) => {
            teamsStr.push(", " + t.name);
        })
        teamStr = teamStr.substring(2);
        this.message.channel.send(teamsStr);
        logger.info("Posting teams: " + teamsStr);
    }
}

/**
 * Adds a team to teams
 * @param  {message} message the received message object
 * @param  {[string]} args  [0]: teamName
 */
const teamsAdd = function(message, args){
    this.requiredArgLength = 1;
    this.message = message;
    this.args = args;
    this.teamName;
    this.noError = true;

    if(!(this.args.length === this.requiredArgLength)){
        getError("arglength", this.message, "session", [this.requiredArgLength, this.args.length]);
        this.noError = false;
    }
    else{
        this.teamName = args.shift();
        if(knownTeam(this.teamName)){
            getError("knownteam", this.message, "teams ls", [args])
            this.noError = false;
        }
    }

    if(this.noError){
        teams.push(new Team(this.teamName));
        getInfo("tAdd", this.message, [this.teamName]);
    }
}

/**
 * Replies a help message [to the given command]
 * @param  {message} message the received message object
 * @param  {[string]} args  The Command(s)
 */
const help = function(message, args){
    this.message = message;
    this.args = args;
    this.hasArgs = false;
    this.noError = true;

    if(this.args != null && this.args.length > 0) this.hasArgs = true;

    if(this.noError){
        logger.info("Posting help");
        if(this.args == null || this.args.length === 0){
            message.channel.send(SESSIONHELP + "\n" + TEAMHELP);
        }
    }
}

/**
 * Logs an Error and gives the user feedback as well.
 * @param  {string} type    errortype
 * @param  {message} message the received message object
 * @param  {string} command helpcommand
 * @param  {[string]} args    arguments, that are relevant to the error;
 */
function getError(type, message, command, args){
    var logmsg = "Unidentified error: " + type;
    var botmsg = "oof";
    switch(type){
        case "arglength":
            logmsg = "Wrong argument Length\nGiven Args Length: " + args[0] + "\nRequired arglength" + args[1];
            botmsg = "Incorrect arguments. Try: !help " + command;
        break;
        case "unknownteam":
            logmsg = "Unknown Team: " + args[0] + "\nKnown Teams: " + teams;
            botmsg = "Unknown Team. Note: Teamname is case sensitive! Try !help " + command;
        break;
        case "nosession":
            logmsg = "No Session created yet.";
            botmsg = "Please try creating a new Session first! Try !help " + command;
        break;
        case "notours":
            logmsg = "No tournaments found in session to edit.";
            botmsg = "Please add tournaments to the session first! Try !help " + command;
        break;
        case "knownteam":
            logmsg = "No tournaments found in session to edit.";
            botmsg = "This team has already been added! Try !help " + command;
        break;
        case "indexOutOfRange":
            logmsg = "IndexOutOfRange: " + args[0] + " , max: " + args[1];
            botmsg = "Please add tournaments to the session first Try !help " + command;
        break;
        case "editcmd":
            logmsg = "Unknown edit command: " + args[0];
            botmsg = "Unknown edit command : *" + args[0] + "*.  Try !help " + command;
        break;
        default:
        break;
    }
    logger.log({
        level: "error",
        message: logmsg
    })
    this.message.channel.send(botmsg);
}

function getInfo(type, message, args){
    var logmsg = "Unidentified error: " + type;
    var botmsg = "oof";
    switch(type){
        case "newsession":
            logmsg = "Created new Session, team: " + args[0];
            botmsg = "Created new Session. Team: " + args[0];
        break;
        case "sTeam":
            logmsg = "Assigned team " +  args[0] + " to session";
            botmsg = "Assigned team " +  args[0] + " to session.";
        break;
        case "sTour":
            logmsg = "Created new tournament, bURL: " + args[0] + "\neURL: " + args[1];
            botmsg = "Created new tournament.";
        break;
        case "sEdit":
            logmsg = "Edited tournament, index: " + args[0] + "\nbURL: " + args[1] + "\neURL: " + args[2];
            botmsg = "Tournament edited.";
        break;
        case "tAdd":
            logmsg = "Added new team: " + args[0];
            botmsg = "Added new team: " + args[0];
        break;
    }
    logger.info(logmsg);
    this.message.channel.send(botmsg);
}

function getStringArray(objArr){
    var strArr = [];
    objArr.forEach((o) => {
        strArr.push(o.toString());
    })
    return strArr;
}


function knownTeam(teamName){
    teams.forEach((t) => {
        if(t.name.includes(teamName)) return true;
    })
    return false;
}









//IDEA
function transmission(userID, channelID){
    this.userID = userID;
    this.channelID = channelID;
}

function task(transmission, requiredState, execute, args){
    this.transmission = transmission;
    this.requiredState = requiredState;
    this.execute = execute;
    this.args = args;
}

function taskhandler(){
    this.defaultState = "awaitingCmd";
    this.availablesStates = ["awaitingCmd", "awaitingContext"];
    this.state = this.defaultState;

    this.abort = function(){
        this.state = availablesStates[1];
    }

    this.compute = function(task){
        if(this.state === this.availablesStates[task.requiredState]) this.state = this.availablesStates[task.execute(task.transmission, task.args)];
        else{
            var msg;
            if(this.state = this.availablesStates[0]) msg = 0;
            else if(this.state = this.availablesStates[1]) msg = 1;
            bot.sendMessage({
                to: channelID,
                message: ERRORMSG[msg]
            })
            logger.log({
                level: 'error',
                message: ERRORLOG[msg]
            });
        }
    }
}

// OLD
// function waitInput(waitingCmd, userID, channelID, isActive = true){
//     this.waitingCmd = waitingCmd;
//     this.userID = userID;
//     this.channelID = channelID;
//     this.isActive = isActive;
//     this.wrongInputs = 0;
//     if(this.wrongInputs > 3) this.isActive = false;
//
//     this.done = function(){
//         this.isActive = false;
//     }
// }
