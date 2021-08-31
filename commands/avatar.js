module.exports = {
    name: 'avatar',
    description: 'gets a users avatar',
    execute(message, args){
        let membera = message.mentions.users.first();
   if(!membera) {
    message.channel.send(message.author + ": Proper Usage: mavatar @user")
    return
  }
   let getavatar = membera.displayAvatarURL
   message.channel.send(membera.username + "'s avatar: " + getavatar)
  }
}