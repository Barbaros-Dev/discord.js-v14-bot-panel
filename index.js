const express = require('express')
const app = express()
const port = 3000
const path = require('path');
const { Client, Events, GatewayIntentBits } = require('discord.js');
const { LocalStorage } = require("node-localstorage");

global.localStorage = new LocalStorage('./storage');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers, GatewayIntentBits.DirectMessages] });

client.once(Events.ClientReady, async c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

class Guild {
  constructor(name, id) {
    this.name = name;
    this.id = id;
  }
}

class Channel {
  constructor(name, id, type) {
    this.name = name;
    this.id = id;
    this.type = type;
  }
}

class User {
  constructor(name, id, tag) {
    this.name = name;
    this.id = id;
    this.tag = tag;
  }
}

app.get('/', (req, res) => {
  const token = global.localStorage.getItem("token")
  if(token) {
    client.login(token).then(() => {
      res.sendFile(path.join(__dirname + "/index.html"))
    }).catch(() => {
      res.sendFile(path.join(__dirname + "/login.html"))
    })
  } else {
    res.sendFile(path.join(__dirname + "/login.html"))
  }
})

app.get('/login', (req, res) => {
  global.localStorage.setItem("token", req.headers["token"])
  res.json({ status: "success" })
})

app.get('/logout', (req, res) => {
  global.localStorage.removeItem("token")
  res.json({ status: "success" })
})

app.get('/leave', (req, res) => {
  client.guilds.cache.get(req.headers["guild"]).leave()
  res.json({ status: "success" })
})

app.get('/guilds', async (req, res) => {
  try {
    const guildsFetch = await client.guilds.fetch()
    const guilds = []
    guildsFetch.map(guild => guilds.push(new Guild(guild.name, guild.id)))
    res.json({ guilds: guilds })
  } catch {
    res.json({ guilds: [] })
  }
})

app.get('/channels', async (req, res) => {
  try {
    const channelsFetch = await client.guilds.cache.get(req.headers["id"]).channels.fetch()
    const channels = []
    channelsFetch.map(channel => channels.push(new Channel(channel.name, channel.id, channel.type)))
    res.json({ channels: channels })
  } catch {
    res.json({ channels: [] })
  }
})

app.get('/members', async (req, res) => {
  try {
    const membersFetch = await client.guilds.cache.get(req.headers["id"]).members.fetch()
    const members = []
    membersFetch.map(member => members.push(new User(member.user.username, member.user.id, member.user.tag)))
    res.json({ members: members })
  } catch {
    res.json({ members: [] })
  }
})

app.get('/invite', async (req, res) => {
  try {
    const invite = await client.guilds.cache.get(req.headers["guild"]).invites.create(req.headers["channel"])
    const link = "https://discord.gg/" + invite.code
    res.json({ invite: link })
  } catch {
    res.json({ invite: "" })
  }
})

app.get('/send', (req, res) => {
  if(!req.headers["guild"] && req.headers["channel"]) client.users.cache.get(req.headers["channel"]).send(req.headers["message"]).catch(err => console.error(err))
  else client.guilds.cache.get(req.headers["guild"]).channels.cache.get(req.headers["channel"]).send(req.headers["message"]).catch(err => console.error(err))
})

app.listen(port, () => {
  console.log(`App started on http://localhost:${port}`)
})