# 🎮 ScrimMaster Bot

**ScrimMaster** is a Discord bot built with **Node.js** and **Discord.js** that automates the management of PUBG Mobile scrimmages across multiple time slots (Afternoon, Evening, and LateNight). It removes the hassle of manual team registrations, delays, and admin overload by running on a fully scheduled, command-ready system.

---

## 🧠 What the Bot Does

✅ **Scheduled Automated Registration Opening**  
Automatically opens registration channels for scrims based on a defined schedule using `node-cron`.

✅ **Registration Validation**  
Validates team registrations using a predefined registration format:
Ensures no duplicate team names, tags, or managers.

✅ **Automatic Closing After Slot Limit**  
Once the maximum number of valid teams (e.g., 15) is reached, the bot automatically:
- Closes the registration channel.
- Posts a list of the accepted teams.

✅ **Slot Assignment**  
The first `n` valid registrations (where `n` is the max slot size) are automatically assigned slots in the scrim.

✅ **Moderator/Admin Commands**  
Admin-only commands give staff flexibility:
- `!open` – Manually open registration
- `!close` – Manually close registration
- `!reset` – Clear registrations, remove roles, and clean up channels

✅ **Role Assignment Based on Scrim Type**  
Each scrim type (Afternoon, Evening, LateNight) has its own role. On successful registration, the team manager is assigned the corresponding role for access to the room code channel.

---

## 📦 Tech Stack

- **Node.js** – JavaScript runtime
- **Discord.js** – Discord API wrapper
- **node-cron** – Task scheduling for opening/closing registrations
- **dotenv** – Manage environment variables
- **Visual Studio Code** – Development environment
