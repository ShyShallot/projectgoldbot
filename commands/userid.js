module.exports = {
    name: 'userid',
    description: 'gets a users ID',
    execute(message, args){
        let memberi = message.mentions.users.first();
        if(!memberi){
          message.channel.send(message.author + ": Proper Usage: muserid @user")
         return
        }
        let memberm = message.mentions.members.first();
        message.channel.send(message.author + ": here is " + memberm.displayName + "'s ID: " + memberi.id)
  }
}