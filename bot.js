var Discord = require('discord.io');
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
var bot = new Discord.Client({
   token: auth.token,
   autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    teams.push("lolgg");
});
bot.on('message', (message) => {

    if(message.author.bot || !message.author.hasRole(BOTCOMMANDER) || message.content.indexOf(config.prefix) !== 0) return;
    const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
    const command = args.shift().toLowerCase();

    switch(command){
        case "s":
        case "session":
            const command2 = args.shift().toLowerCase();
            switch(command2){
                case "new":
                    createSession(message).compute();
                break
                case "tour":
                case "tourney":
                case "tournament":
                    addTournament(message, args).compute();
                break;
                case "team":
                    assignTeam(message, args).compute();
                break;
                case "edit":
                    editTournament(message, args).compute();
                break;
            }
        break;
        case "t":
        case "teams":
            const command2 = args.shift().toLowerCase();
            switch(command2){
                case "ls":
                case "list":
                    teamsList(message).compute();
                break;
                case "add":
                    teamsAdd(message, args).compute();
                break;
            }
        break;
        case "h":
        case "help":
            help(message, args).compute();
        break;
    }
});



function oldmsg(user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
   // It will listen for messages that will start with `!`

   if(message === "abort") {
       awaiting.done();
       return;
   }
   if(awaiting == null || awaiting.userID != userID || awaiting.channelID != channelID || !awaiting.isActive){
        if (message.substring(0, 1) == '!') {
            var args = message.substring(1).split(" ");
            var cmd = args.shift();

            switch(cmd) {
                case "s":
                case "session":
                    if(!(args[0] === "new") && s == null){
                        bot.sendMessage({
                            to: channelID,
                            message: "Create a Session first please!"
                        })
                    }
                    else{
                        switch(args[0]){
                            case "new":
                                bot.sendMessage({
                                    to: channelID,
                                    message: "Creating new Session! Team: " + teams[0]
                                })
                                s = new session();
                                s.team = new team(teams[0]);
                            break;
                            case "team":
                                var teamsstr = "";
                                teams.forEach(function(t){
                                    teamsstr += ", " + t.toString();
                                })
                                teamsstr = teamsstr.substr(2);
                                bot.sendMessage({
                                    to: channelID,
                                    message: "Assigning Team. Available Teams: " + teamsstr
                                })
                                if(args[1] != null){
                                    assignTeam(args[1]);
                                }
                                else awaiting = new waitInput("sTeam", userID, channelID);
                            break;
                            case "tour":
                            case "tourney":
                                if(args.length == 3) {
                                    tour = new tournament();
                                    tour.bracketURL = new battlefyURL(args[1]);
                                    tour.event(args[2]);
                                    tour.create();
                                    s.addTournament(tour);
                                    post(channelID);
                                    //awaiting.done()
                                }
                                else{
                                    bot.sendMessage({
                                        to: channelID,
                                        message: "Invalid args size, usage:"
                                    })
                                }
                            break;
                            case "post":
                                post(channelID);
                            break;
                        }
                    }

                break;
                case "team":
                    switch(args[0]){
                        case "add":
                            bot.sendMessage({
                                to: channelID,
                                message: "Adding new Team!\nName:"
                            })
                            teams.push(args[1]);
                        break;
                        case "ls":
                            var teamsstr = "";
                            teams.forEach(function(t){
                                teamsstr += ", " + t.toString();
                            })
                            teamsstr = teamsstr.substr(2);
                            bot.sendMessage({
                                to: channelID,
                                message: "Teams: " + teamsstr
                            })
                        break;
                    }
                break;
                case "help":
                    if(args == null){
                        bot.sendMessage({
                            to: channelID,
                            message: "Commands:\n"
                        })
                    }
                    // else{
                    //     switch(args[0]){
                    //         case
                    //     }
                    // }
                break;
                default:
                    bot.sendMessage({
                        to: channelID,
                        message: "Did not recognize Argument." + ABORT
                    })
                    logger.log({
                        level: 'error',
                        message: "Invalid arg: " + message
                    });
                break;
            }
        }
    }
    else{
        switch(awaiting.waitingCmd){
            case "sTourBrURL":
                if(message.split(" ").length > 1){
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid Argument Length! Only post the url!" + ABORT
                    })
                    logger.log({
                        level: 'error',
                        message: "Invalid args"
                    });
                    awaiting.wrongInputs++;
                }
                else{
                    //try{
                    tour.bracketURL = new battlefyURL(message);
                    // }catch(error){
                    //     logger.log({
                    //         level: 'error',
                    //         message: error
                    //     });
                    // }                    logger.info(awaiting.awaitingCmd);
                }
                awaiting.waitingCmd = "sTourEvent";
                bot.sendMessage({
                    to: channelID,
                    message: "Event URL:"
                })
            break;
            case "sTourEvent":
                if(message.split(" ").length > 1){
                    bot.sendMessage({
                        to: channelID,
                        message: "Invalid Argument Length! Only post the url!" + ABORT
                    })
                    logger.log({
                        level: 'error',
                        message: "Invalid args"
                    });
                    awaiting.wrongInputs++;
                }
                else{
                    try{
                        if(message.length == 6)tour.eventID = message;
                        else tour.eventURL = message;
                        s.addTournament(tour);
                        post(channelID);
                        //tour.create();
                        awaiting.done();

                    }catch(error){
                        logger.log({
                            level: 'error',
                            message: error
                        });
                    }
                }
            break
            case "sTeam":
                assignTeam(message);
            break;
        }
    }
}

/**
 * Creates a new session() with the team teams[0]
 * @param  {message} message the received message object
 */
const createSession = function(message){
    this.requiredArgLength = 0;
    this.args = new Array(0);
    this.message = message;

    this.compute = function(){
        if(this.check()){
            s = new session(team(teams[0]));
        }
    }

    this.check = function(){
        var noError = true;
        if(!(this.args.length === this.requiredArgLength)){
            getError("arglength", message, "session", [this.requiredArgLength, this.args.length]);
            noError = false;
        }
        if(s == null){
            getError("nosession", message, "session", []);
            noError = false;
        }

        return noError;
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

    this.compute = function(){
        if(this.check()){
            tour = new tournament();
            tour.bracketURL = new battlefyURL(this.bracketURL);
            tour.event(this.eventStr);
            s.addTournament(tour);
        }
    }

    this.check = function(){
        var noError = true;
        if(!(this.args.length === this.requiredArgLength)){
            getError("arglength", message, "session", [this.requiredArgLength, this.args.length]);
            noError = false;
        }
        else{
            this.bracketURL = this.args.shift();
            this.eventStr = this.args.shift();
        }
        if(s == null){
            getError("nosession", message, "session", []);
            noError = false;
        }
        return noError;
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

    this.compute = function(){
        if(this.check()){
            s.team = new team(this.teamName);
        }
    }

    this.check = function(){
        var noError = true;
        if(!(this.args.length === this.requiredArgLength)){
            getError("arglength", message, "session", [this.requiredArgLength, this.args.length]);
            noError = false;
        }
        else{
            this.teamName = args.shift();
            if(s == null){
                getError("nosession", message, "session", []);
                noError = false;
            }
            if(!teams.includes(this.teamname)){
                getError("unknownteam", message, "team", [args])
                noError = false;
            }
        }
        return noError;
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

    this.compute = function(){
        if(this.check()){
            switch(cmd){
                case "bracket":
                    s.tournaments[teamIndex].bracketURL = new battlefyURL(this.value);
                break;
                case "event":
                    s.tournaments[teamIndex].event(this.value);
                break;
                case "status":
                    s.tournaments[teamIndex].setStatus(this.value);
                break;
            }
        }
    }

    this.check = function(){
        var noError = true;
        if(!(this.args.length === this.requiredArgLength)){
            getError("arglength", message, "session", [this.requiredArgLength, this.args.length]);
            noError = false;
        }
        else{
            this.teamIndex = parseInt(this.args.shift().toLowerCase()) - 1;
            this.cmd = this.args.shift().toLowerCase();
            this.value = this.args.shift();
        }
        if(s == null){
            getError("nosession", message, "session", []);
            noError = false;
        }
        if(s.tournaments == null){
            getError("notours", message, "session", [args])
            noError = false;
        }
        if(s.tournaments.length < this.teamIndex){
            getError("indexOutOfRange", message, "session post", [args])
            noError = false;
        }
        return noError;
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

    this.compute = function(){
        if(this.check()){
            //TODO
        }
    }

    this.check = function(){
        var noError = true;
        if(!(this.args.length === this.requiredArgLength)){
            getError("arglength", message, "session", [this.requiredArgLength, this.args.length]);
            noError = false;
        }
        if(s == null){
            getError("nosession", message, "session", []);
            noError = false;
        }
        if(s.tournaments == null || s.tournaments == 0){
            getError("notours", message, "session", [args])
            noError = false;
        }
        return noError;
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

    this.compute = function(){
        if(this.check()){
            //TODO
        }
    }

    this.check = function(){
        var noError = true;
        if(!(this.args.length === this.requiredArgLength)){
            getError("arglength", message, "session", [this.requiredArgLength, this.args.length]);
            noError = false;
        }
        else{
            this.teamName = args.shift();
        }
        if(teams.includes(arg)){
            getError("knownteam", message, "teams ls", [args])
            noError = false;
        }
        return noError;
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

    this.compute = function(){
        if(this.check()){
            //TODO
        }
    }

    this.check = function(){
        var noError = true;
        if(this.args != null && this.args.length > 0) this.hasArgs = true;
        return noError;
    }
}

/**
 * Logs an Error and gives the user feedback as well.
 * @param  {string} type    errortype
 * @param  {message} message the received message object
 * @param  {string} command helpcommand
 * @param  {string} args    arguments, that are relevant to the error;
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
    }
    logger.log({
        level: "error";
        message: logmsg
    })
    message.channel.send(botmsg);
}











//IDEA
function post(channelID){
    if(s.tournaments.length > 0){
        bot.sendMessage({
            to: channelID,
            message: s.toString()
        })
    }
}

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
