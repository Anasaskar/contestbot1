const mongoose = require('mongoose');
const Discord = require('discord.js');
require('dotenv').config();
const Jimp = require('jimp');



const { Client, GatewayIntentBits, EmbedBuilder, ActivityType, ActionRowBuilder, ButtonBuilder } = require('discord.js');
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers,
	],
});

const prefix = '!';

// Mongoose connection
mongoose.connect(process.env.mongo, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
const db = mongoose.connection;

db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('تم التسجيل في الداتا بنجاح');
});

const Schema = mongoose.Schema;
// User model
const userSchema = new mongoose.Schema({
  userId: String,
  serverId: String,
  photoUrl: {
    type: String,
    default: '',
  },
  users:Array
});

const User = mongoose.model('User', userSchema);

// Server model
const serverSchema = new mongoose.Schema({
  serverId: String,
  channel1: String,
  channel2: String,
  channel3: String,
});


const Server = mongoose.model('Server', serverSchema);

const emojiSchema = new mongoose.Schema({
  guildId: String,
  emoji: String,
});
const Emoji = mongoose.model('Emoji', emojiSchema);

// Define a schema for storing photos
const photoSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  photoUrl: { type: String, required: true },
});

// Create a model for the schema
const Photo = mongoose.model('Photo', photoSchema);

const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    default: 'globalCounter'
  },
  guildId: {
    type: String,
    required: true
  },
  value: {
    type: Number,
    required: true,
    default: 0
  }
});

const Counter = mongoose.model('Counter', counterSchema);

module.exports = Counter;



	
client.on("ready", () => {
  console.log(`client login ${client.user.username}`)
  client.user.setPresence ({ activities: [ { name: `${prefix}help`, type: ActivityType.Playing }], status: 'discord.gg/vo1', });

})

async function resetGlobalCounter() {
  await Counter.deleteOne({ name: 'globalCounter' });
  console.log('Global counter reset');
}

resetGlobalCounter();
client.on("messageCreate", async (message) => {
	
  if (message.content.startsWith(`<@${client.user.id}>`)) {
    message.reply(`**اهلا انا بوت <@${client.user.id}> \n انا هنا لمساعدتك علي انشاء مسابقه الصور الخاص بك \n لمزيد من المعلومات حول كيفيه استخدامي يرجي استخدام امر !help**`)
  }

});



client.on('guildCreate', (guild) => {
  const channelId = '1098098833168289802';
  const channel = guild.channels.cache.get(channelId);

  if (channel) {
    const embed = new Discord.MessageEmbed()
      .setTitle('Bot Joined Server')
      .setDescription(`Thank you for adding me to ${guild.name}!`)
      .setColor('#0099ff');

    channel.send({ embeds: [embed] }).then((message) => {
      const inviteButton = new Discord.MessageButton()
        .setStyle('LINK')
        .setLabel('Join Server')
        .setURL(`https://discord.gg/${guild.invites.create(client.user.id).code}`);

      const leaveButton = new Discord.MessageButton()
        .setStyle('DANGER')
        .setLabel('Leave Server')
        .setCustomId('leave');

      const row = new Discord.MessageActionRow().addComponents([inviteButton, leaveButton]);

      message.edit({ embeds: [embed], components: [row] });

      const filter = (interaction) =>
        interaction.customId === 'leave' && interaction.user.id === guild.ownerId;

      const collector = message.createMessageComponentCollector({ filter, time: 60000 });

      collector.on('collect', () => {
        guild.leave();
        channel.send('Leaving the server as requested by the owner.');
        collector.stop();
      });

      collector.on('end', () => {
        message.components.forEach((comp) => comp.components.forEach((button) => button.setDisabled(true)));
        message.edit({ components: message.components });
      });
    });
  }
});

client.on('messageCreate', async (message) => {
			
  if (!message.content.startsWith(prefix) || message.author.bot) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

 if (command === 'ping') {
    const botPing = Math.round(client.ws.ping);
    const startTime = Date.now();
    const sentMessage = await message.channel.send('Pinging...');
    const endTime = Date.now();
    const apiLatency = endTime - startTime;

    sentMessage.edit(
      `**\`\`\`Latency: ${botPing}ms\n.    API Latency: ${apiLatency}ms\`\`\`**`
    );
  }	
  if (command === 'help') {
    const exampleEmbed = new EmbedBuilder()
    .setColor('Random')
	.setTitle('قائمه المساعده')
  .setDescription("**هنا يوجد جميع اوامر البوت لتعرف كيفيه استخدامه \n من المرجو استخدام اوامر التعيين اولا مثل تحديد الرومات والخط والايموجي اولا لتفادي الاخطاء**")
	.addFields(
    { name: '\u200B', value: '\u200B' },
    { name: `${prefix}set-join`, value: `لتحديد روم مشاركه الاعضاء عن طريق امر ${prefix}join \n ليتم تسجيلهم في المسابقه` },
		{ name: `${prefix}set-vote`, value: `لتحديد الروم التي سيرسل فيها البوت معلومات الشخص الذي شارك في المسابقه وصورته ومعلوماته`, inline: true },
		{ name: `${prefix}set-emoji`, value: 'لتحديد الايموجي الذي سيوضع علي صوره المشارك ليتم تحديد عدد الاصوات له', inline: true },
    { name: `${prefix}set-line`, value: 'لتحديد الخط الخاص بك الذي سيتم ارساله بعد مشاركه كل شخص اسفل صورته', inline: true},
    { name: `${prefix}get-join`, value: 'لعرض اخر روم تم تحديدها لمشاركه الاعضاء', inline: true},
    { name: `${prefix}get-vote`, value: 'لعرض اخر روم تم تحديدها لارسال معلومات الاعضاءالمشاركه', inline: true},
    { name: `${prefix}get-emoji`, value: 'لعرض اخر ايموجي تم تحديده لوضعه ع صوره المتسابقين', inline: true},
    { name: `${prefix}get-line`, value: 'لعرض اخر خظ تم وضعه', inline: true},
    { name: `${prefix}join`, value: 'للمشاركه من اي عضو ليتم تسجيله في المسابقه', inline: true},
    { name: `${prefix}reset`, value: 'لتصفير ارقام المتسابقين ومسح جميع الرسائل في روم التصويتات وتصفير جميع المتسابقين لكي يتمكنوا من المشاركه في المسابقه القادمه' },
    { name: '\u200B', value: '\u200B' }
    )
    .setFooter({ 
      text: `requested by: ${message.author.tag}`, 
      iconURL: message.author.displayAvatarURL({ dynamic: true }) 
  }) 
  .setAuthor({ 
    name: client.user.username, 
    iconURL: client.user.displayAvatarURL({ dynamic: true }), 
    url: `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`
})
.setThumbnail(message.guild.iconURL({ dynamic: false }))
.setColor(message.guild.roles.highest.color || '#33461f');

var row = new ActionRowBuilder()
.setComponents(
new ButtonBuilder()
.setLabel("فيديو لكيفيه استخدام الاوامر")
.setStyle('Danger')
.setCustomId("sad")
)

message.reply({ embeds: [exampleEmbed], components: [row] });


client.on("interactionCreate" , interaction => {

  if(!interaction.isButton()) return;
  if(interaction.customId == "sad") {
  try {
  interaction.reply({content:"اليك الفيديو التوضيحي لكيفيه استخدام الاوامر : \n https://youtu.be/ew4APNApqKk "})
  }catch(err) {
  console.log(err)
  }
  }
  })

}

  if (command === 'send-example') {
	  
if (!message.member?.permissions.has('ADMINISTRATOR')) {
    return message.reply('هذا الأمر مخصص للمشرفين فقط.');
  }
    
    var row1 = new ActionRowBuilder()
.setComponents(
new ButtonBuilder()
.setLabel("ارسال امثله ب الفيديو")
.setStyle('Danger')
.setCustomId("video")
)


    var row2 = new ActionRowBuilder()
.setComponents(
new ButtonBuilder()
.setLabel("ارسال امثله ب الصور")
.setStyle('Secondary')
.setCustomId("photo")
)

message.reply({ content: `هل تريد المثال ب الصور ام فيديو؟`, components: [row1 ,row2] });

client.on("interactionCreate" , interaction => {

  if(!interaction.isButton()) return;
  if(interaction.customId == "video") {
  try {
  interaction.reply({content:"اليك فيديو كيفيه المشاركه الي المسابقه : "})
 const videoPath = 'path/to/loggvideo.mp4';  // Replace with the actual path to your video file
      await interaction.followUp({ files: [videoPath] });
  }catch(err) {
  console.log(err)
  }
  }
  })

client.on("interactionCreate" , interaction => {

  if(!interaction.isButton()) return;
  if(interaction.customId == "photo") {
  try {
  interaction.reply({content:"اليك كيفيه المشاركه الي المسابقه : "})
  }catch(err) {
  console.log(err)
  }
  }
  })

  }
	
  if (command === 'set-line') {
    // Check if a photo was uploaded or provided as a URL
    const attachment = message.attachments.first();
    const photoUrl = attachment ? attachment.url : args[0];
  
    // Check if a photo was provided
    if (!photoUrl) {
      return message.reply('الرجاء ارسال الخط او رابط الخط مع الامر');
    }
  
    // Update the photo in the database
    const guildId = message.guild.id;
    const photo = await Photo.findOneAndUpdate({ guildId }, { photoUrl }, { upsert: true, new: true });
  
    // Respond to the user
    return message.reply(`تم تحديد الخط الي: ${photo.photoUrl}`);
  }
  

  if (command === 'get-line') {
    const guildId = message.guild.id;
    const photo = await Photo.findOne({ guildId });
  
    if (!photo) {
      return message.reply('لم يتم تحديد خط بعد الرجاء تحديد خط عن طريق امر !set-line');
    }
  
    return message.reply(`الخط الحالي للسيرفر: ${photo.photoUrl}`);
  }
  



  
  if (command === 'set-emoji') {
    const emoji = args.join(' ');
    if (!emoji) {
      message.reply('الرجاء ارسال ايموجي مع الامر');
      return;
    }
  
    // Delete any existing emoji for this server
    await Emoji.deleteMany({guildId: message.guild.id});
  
    // Create new emoji data with the new emoji
    await Emoji.create({guildId: message.guild.id, emoji});
  
    message.reply(`تم تحديد ايموجي سيرفرك الي : ${emoji}`);
    return;
  }
  
  

  if (command === 'get-emoji') {
    const emojiData = await Emoji.findOne({guildId: message.guild.id});
    if (!emojiData) {
      message.reply('لم يتم تحديد ايموجي بعد الرجاء تحديد ايموجي عن طريق امر !set-emoji');
      return;
    }
    const {emoji} = emojiData;
    message.reply(`الايموجي الخاص بالمسابقه هو : ${emoji}`);
  }

  if (command === 'set-join') {
    const serverId = message.guild.id;
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('الرجاء منشن الروم الصحيح');
    }
    try {

      let server = await Server.findOneAndUpdate(
        { serverId },
        { channel1: channel.id },
        { upsert: true, new: true }
      );
      message.reply(`تم تحديد روم المشاركه الي ${channel}`);
    } catch (err) {
      console.error(err);
      message.reply('حدث خطا ما الرجاء اعاده المحاوله');
    }
  }


  
  if (command === 'set-vote') {
    const serverId = message.guild.id;
    const channel = message.mentions.channels.first();
    if (!channel) {
      return message.reply('الرجاء منشن الروم الصحيح');
    }
    try {
      let server = await Server.findOneAndUpdate(
        { serverId },
        { channel2: channel.id },
        { upsert: true, new: true }
      );
      message.reply(`تم تحديد روم التصويت الي${channel}`);
    } catch (err) {
      console.error(err);
      message.reply('حدث خطا ما الرجاء اعاده المحاوله');
    }
  }

  

  
  if (command === 'get-join') {
    const serverId = message.guild.id;
    try {
      let server = await Server.findOne({ serverId });
      if (!server || !server.channel1) {
        return message.reply('لم يتم تحديد روم المشاركه لتحديدها الرجاء استخدام امر \n !set-join');
      }
      const channel = await message.guild.channels.fetch(server.channel1);
      if (!channel) {
        return message.reply('لم يتم تحديد روم المشاركه لتحديدها الرجاء استخدام امر \n !set-join');
      }
      message.reply(`روم المشاركه هي ${channel}`);
    } catch (err) {
      console.error(err);
      message.reply('حدث خطا ما الرجاء اعاده المحاوله');
    }
  }





  if (command === 'get-vote') {
    const serverId = message.guild.id;
    try {
      let server = await Server.findOne({ serverId });
      if (!server || !server.channel2) {
        return message.reply('لم يتم تحديد روم التصويتات لتحديدها الرجاء استخدام امر \n !set-vote');
      }
      const channel = await message.guild.channels.fetch(server.channel2);
      if (!channel) {
        return message.reply('لم يتم تحديد روم التصويتات لتحديدها الرجاء استخدام امر \n !set-vote');
      }
      message.reply(`روم التصويتات هي ${channel}`); } catch (err) {
        console.error(err);
        message.reply('حدث خطا ما الرجاء اعاده المحاوله');
      }      
    }


   if (command === 'join') {

      const user = await User.findOne({ serverId:message.guild.id,userId: message.author.id });
	   if(user) return message.reply({content:"انت مشارك بالفعل"});
            if (!user) {
   
        const guildData = await Server.findOne({ serverId: message.guild.id });
        const channel1 = message.guild.channels.cache.get(guildData.channel1);
        const channel2 = message.guild.channels.cache.get(guildData.channel2);

        const emojiData = await Emoji.findOne({guildId: message.guild.id});
        if (!emojiData) {
          message.reply('لم يتم تحديد ايموجي المسابقه بعد الرجاء تحديد ايموجي عن طريق امر !set-emoji \n اذا كنت مجرد عضو ف يرجي اخبار احد الاونر  بتحديد ايموجي للمسابقه').then(replyMessage => {    
            setTimeout(() => {
              message.delete(); 
              replyMessage.delete();
            }, 10000); 
          }).catch(err => console.error(err));
          return;
        }
        const {emoji} = emojiData;

    /*    const serverId = message.guild.id;
const sentMessage = await SentMessageModel.findOne({ serverId });
if (sentMessage) {
  return; // Message has already been sent
}
const message = 'تم فتح مسابقه جديده في السيرفر وتم انشاء رول المتسابق من جديد لتستطيع عمل منشن لها';
channel3.send(message);
await sentMessage.save();
*/

        const guildId = message.guild.id;
    const photo = await Photo.findOne({ guildId });
  
    if (!photo) {
      return message.reply('لم يتم تحديد خط المسابقه بعد الرجاء تحديد الخط عن طريق امر !set-line \n اذا كنت مجرد عضو ف يرجي اخبار احد الاونر  بتحديد خط للمسابقه').then(replyMessage => {  
        setTimeout(() => {
          message.delete(); 
          replyMessage.delete(); 
        }, 10000); 
      }).catch(err => console.error(err));
    }
 var sd = new User({
 userId:message.guild.id,
serverId:message.guild.id,
 })
sd.save().catch((err) => {
console.log(err)
})

 
    const attachment = message.attachments.first();

    const imageUrl = attachment ? attachment.url : message.content.split(" ")[1];
    if (!imageUrl) {
      return message.reply('برجاء رفع صوره او وضع الرابط بعد الامر').then(replyMessage => { 
        setTimeout(() => {
          message.delete(); 
          replyMessage.delete(); 
        }, 10000); 
      }).catch(err => console.error(err));
     
    }
          
        const counter = await Counter.findOneAndUpdate(
          { name: guildId },
          { $inc: { value: 1 } },
          { new: true, upsert: true }
        );
        channel2.send(`**المتسابق : ${message.author}\n رقم : \`\`${counter.value}\`\`**`)
        channel2.send(imageUrl).then(m => {
        m.react(emoji) 
        })
        channel2.send(photo.photoUrl)

        
            const role = message.guild.roles.cache.find(r => r.name === 'متسابق') || await message.guild.roles.create({ name: 'متسابق' });
        await message.member.roles.add(role);
  

        message.reply(`**تمت مشاركتك بنجاح \n وتم ارسال صورتك ومعلوماتك الي روم ${channel2} \n وتم وضع الايموجي الخاص ب السيرفر ${emoji}\n وبالتوفيق لك ${message.author} ولجميع المتسابقين**`).then(replyMessage => { 
          setTimeout(() => {
            message.delete(); 
            replyMessage.delete(); 
          }, 10000); 
        }).catch(err => console.error(err));
		    
      } else {
        message.reply(`**لقد قمت ب المشاركه في هذه المسابقه من قبل يرجي تنفيذ شروطها او انتظار مسابقه جديده يمكنك فحص نفسك من هنا \n ${channel2}**`).then(replyMessage => {  
          setTimeout(() => {
            message.delete(); 
            replyMessage.delete(); 
          }, 10000); 
        }).catch(err => console.error(err));
      }
    }

     if (command === 'reset') {
      try{
      const guildId = message.guild.id;
      await Counter.deleteOne({ name: guildId });
      await User.deleteMany({serverId:guildId})
      message.reply('تم تصفير جميع بيانات المسابقه');
      }catch(err) {
        message.reply({content:`${err.message}`})
      }
    }
  })
 

client.on('guildCreate', (guild) => {
    const channelId = '39929292';
    const channel = guild.channels.cache.get(channelId);

    if (channel) {
        guild.channels
            .createInvite({ maxAge: 0, maxUses: 0 })
            .then((invite) => {
                const leaveButton = new MessageButton()
                    .setCustomId('leave_server')
                    .setLabel('Leave Server')
                    .setStyle('DANGER');

                const row = new MessageActionRow().addComponents(leaveButton);

                channel.send({
                    content: `I have joined a new server! Here's the invite link: ${invite.url}`,
                    components: [row],
                });

                client.on('interactionCreate', async (interaction) => {
                    if (!interaction.isButton()) return;

                    if (interaction.customId === 'leave_server') {
                        await interaction.guild.leave();
                        interaction.reply('Leaving the server...');
                    }
                });
            })
            .catch((error) => {
                console.error(`Error creating invite: ${error}`);
            });
    } else {
        console.error('Channel not found!');
    }
});


  client.login(process.env.token);
