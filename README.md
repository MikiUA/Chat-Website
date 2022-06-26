# Chat-Website
A chat website with essential login system. Uses express, mongoose, socket) to implement a global chat and person-to-person 

<b> Basics:</b>
<br>&nbsp;&nbsp;It is a single-page website with mounted user database and message database, uses minimalistic styling and simple css-related scripts (hide/show).

 <b> Login System:</b>
 
1. Server stores a database (mongo Schema type) with logins, passwords and IDs of users. When client sumbits his login and password, server returns user unique identifier which is stored in cookies and is sent with every request. This is not the best security solution, but is a lot better than only username access.
2. To store errors in login/signup system, website uses cookies, as it reloads on every press of login/signup submit. Currently it only checks if boxes aren't empty (on client side, can be exploited) and if user already exists (you can't login unexistent and sign up existing niknames) 
3. Email box doesn't work in current version, as it is of no use for this now.
    
<b> Chatting system:</b>
1. Server stores a message database, with each message containing date, sender, reciever and content of message (text only yet).
2. Webpage has a clickable user list, and onclick client assigns a cookie (current recepient), and loads all messages between two users.
3. One of list items is "All chat", which is not a user in database (may cause problems if someone tries to sign up as "All_chat").
4. When user sends a message it is not only saved, but server pushes this message to all current sockets that should recieve it (only to reciever if personal, to all if "All chat") It never should send a message to a user that shouldn't get it.
5. On recieved message client checks if it is from the current chat companion, and if so - mounts message to the chat. This allows to get all the messages from current companion without reloading the page.
    
Screenshots can be found inside the /screenshots folder.
