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
        if(!this.hasArgs){
            //TODO
        }
        else{
            switch (args[0]) {
                case "s":
                case "session":
                    this.message.author.send(SESSIONHELP);
                    break;
                case "t":
                case "team":
                    this.message.author.send(TEAMHELP);
                    break;
            }
        }
    }
};

const SESSIONHELP =
    "__**!session | !s**__ \n\t" +
    "**new** : Create new Session\n\t" +
    "**team** : Assign a team\n\t" +
    "**[tourney | tour] [battlefy link] [event link | event ID]** : Add a new Tournament";
const TEAMHELP =
    "__**!team **__\n\t" +
    "**ls** : Lists available Teams\n\t" +
    "" +
    "**add [name]** : Adds a new Team";

module.exports = {help};