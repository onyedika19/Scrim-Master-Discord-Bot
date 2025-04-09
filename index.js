require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  PermissionsBitField,
} = require("discord.js");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
const cron = require("node-cron");
const adminRole = "931479116002258964";
const scrims = {
  afternoon: {
    key: "afternoon",
    category: "AFTERNOON SCRIMS",
    registrationChannelId: "1297592465842503773",
    slotsChannelId: "1297592529130356878",
    openTime: "13 4 * * *",
    roleId: "1297596226438566049",
    registrations: [],
  },
  evening: {
    key: "evening",
    category: "EVENING SCRIMS",
    registrationChannelId: "1297592651859759196",
    slotsChannelId: "1297592731819835422",
    openTime: "0 12 * * *",
    roleId: "1297596478683877438",
    registrations: [],
  },
  latenight: {
    key: "latenight",
    category: "LATENIGHT SCRIMS",
    registrationChannelId: "1297592672822886471",
    slotsChannelId: "1297592529130356878",
    openTime: "0 14 * * *", 
    roleId: "1297596616944914483",
    registrations: [],
  },
};


const PREFIX = "%register";
const MAX_REGISTRATIONS = 10;
const okEmoji = "✅"; 
const badEmoji = "❌"; 


function openRegistration(scrimKey) {
  const scrim = scrims[scrimKey];
  const channel = client.channels.cache.get(scrim.registrationChannelId);

  if (!channel) return;
  channel.permissionOverwrites
    .edit(channel.guild.roles.everyone, {
      [PermissionsBitField.Flags.SendMessages]: true, 
    })
    .then(() => {
      channel.send(
        `Registration is now open for ${scrim.category}! Use the format: \n%register \nteam name \nteam tag \nteam manager`
      );
    })
    .catch((err) => {
      console.error("Error opening registration:", err);
    });
}

function closeRegistration(scrimKey, channel) {
  const scrim = scrims[scrimKey];
  if (!scrim) return;
  channel.permissionOverwrites
    .edit(channel.guild.roles.everyone, {
      [PermissionsBitField.Flags.SendMessages]: false,
    })
    .then(() => {
      channel.send("Slots have been filled and registration closed.");
    })
    .catch(console.error);

  const slotsChannel = client.channels.cache.get(scrim.slotsChannelId);
  if (slotsChannel) {
    let registrationMessage = "";
    scrim.registrations.forEach((reg, index) => {
      registrationMessage += `${index + 1}. ${"`"}${reg.teamTag}${"`"} ${
        reg.teamName
      } <@${reg.teamManager.id}>\n`;
    });

    slotsChannel.send(
      `Here are the teams that have registered:\n${registrationMessage}`
    );
  } else {
    console.log("Slots channel not found!");
  }
}

function validateRegistration(message, scrimKey) {
  const scrim = scrims[scrimKey];
  const lines = message.content.trim().split("\n");

  if (lines.length !== 4) {
    return null;
  }

  if (lines[0].trim() !== PREFIX) {
    return null; 
  }

  const teamName = lines[1].trim();
  const teamTag = lines[2].trim();

  if (teamTag.includes(" ")) {
    return null;
  }

  const teamManager = message.mentions.users.first();
  if (!teamManager) {
    return null;
  }

  const isDuplicate = scrim.registrations.some(
    (reg) =>
      reg.teamName === teamName &&
      reg.teamTag === teamTag &&
      reg.teamManager.id === teamManager.id
  );

  if (isDuplicate) {
    return null; 
  }


  if (scrim) {
    const role = message.guild.roles.cache.get(scrim.roleId);
    const member = message.guild.members.cache.get(teamManager.id);

    if (role && member) {
      member.roles
        .add(role)
        .then(() =>
          console.log(`Assigned role ${role.name} to ${teamManager.username}`)
        )
        .catch(console.error);
    } else {
      console.log("Role or member not found!");
    }
  }

  return {
    teamName,
    teamTag,
    teamManager,
  };
}

// Schedule the opening of registration channels using node-cron scheduler
Object.values(scrims).forEach((scrim) => {
  cron.schedule(scrim.openTime, () => {
    console.log(
      `Scheduled task for ${
        scrim.category
      } is running at ${new Date().toLocaleString()}`
    );
    openRegistration(scrim.key);
  });
});

// Schedule a task to reset at midnight
cron.schedule("3 21 * * *", () => {
  reset();
});

client.once("ready", () => {
  console.log("Bot is ready!");
  //   const testChannel = client.channels.cache.get("931881321922449418"); // Your channel ID
  //   openRegistration(testChannel); // Call the function to test
});


client.on("messageCreate", (message) => {
  const scrim = Object.values(scrims).find(
    (scrim) => scrim.registrationChannelId === message.channel.id
  );
  if (!scrim || message.author.bot) return;
  const member = message.guild.members.cache.get(message.author.id);
  if (message.content == "!open" && member.roles.cache.has(adminRole)) {
    message.delete().catch((e) => {});
    openRegistration(scrim.key);
    return;
  }
  if (message.content == "!close" && member.roles.cache.has(adminRole)) {
    closeRegistration(scrim.key, message.channel);
    message.delete().catch((e) => {});
    return;
  }
  if (message.content == "!reset" && member.roles.cache.has(adminRole)) {
    reset();
    return;
  }

  const result = validateRegistration(message, scrim.key);
  if (result && scrim.registrations.length < MAX_REGISTRATIONS) {
    scrim.registrations.push(result);
    message.react(okEmoji);

    if (scrim.registrations.length >= MAX_REGISTRATIONS) {
      closeRegistration(scrim.key, message.channel);
    }
  } else {
    message.react(badEmoji);
  }
});

function reset() {
  console.log("Running daily reset task at midnight");

  Object.values(scrims).forEach(async (scrim) => {
    const registrationChannel = client.channels.cache.get(
      scrim.registrationChannelId
    );
    const slotsChannel = client.channels.cache.get(scrim.slotsChannelId);

    // Step 1: Clear messages in the registration channel
    if (registrationChannel) {
      try {
        const messages = await registrationChannel.messages.fetch({
          limit: 100,
        });
        for (const message of messages.values()) {
          try {
            await message.delete();
          } catch (err) {
            if (err.code !== 10008) {
              // Ignore "Unknown Message" errors
              console.error(
                `Failed to delete message in ${registrationChannel.name}:`,
                err
              );
            }
          }
        }
        console.log(
          `Cleared messages in  ${scrim.category} ${registrationChannel.name}`
        );
      } catch (err) {
        console.error(
          `Failed to clear messages in ${registrationChannel.name}:`,
          err
        );
      }
    } else {
      console.log(`Registration channel for ${scrim.category} not found.`);
    }

    // Step 2: Clear messages in the team slots channel
    if (slotsChannel) {
      try {
        const messages = await slotsChannel.messages.fetch({ limit: 100 });
        for (const message of messages.values()) {
          try {
            await message.delete();
          } catch (err) {
            if (err.code !== 10008) {
              // Ignore "Unknown Message" errors
              console.error(
                `Failed to delete message in ${slotsChannel.name}:`,
                err
              );
            }
          }
        }
        console.log(`Cleared messages in ${slotsChannel.name}`);
      } catch (err) {
        console.error(`Failed to clear messages in ${slotsChannel.name}:`, err);
      }
    } else {
      console.log(`Slots channel for ${scrim.category} not found.`);
    }

    // Step 3: Remove roles from team managers
    const role = registrationChannel.guild.roles.cache.get(scrim.roleId);
    if (role) {
      // Fetch all members with the role
      const membersWithRole = role.members;
      membersWithRole.forEach(async (member) => {
        try {
          await member.roles.remove(role);
          console.log(`Removed role ${role.name} from ${member.user.username}`);
        } catch (err) {
          console.error(
            `Failed to remove role from ${member.user.username}:`,
            err
          );
        }
      });
    } else {
      console.log(`Role for ${scrim.category} not found.`);
    }

    scrim.registrations = [];
  });
}

client.login(process.env.DISCORD_TOKEN);
