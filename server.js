// Node setup

const { response } = require('express');
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const mongoose = require('mongoose');
const { deleteMany } = require('mongoose/lib/model');
const { ObjectId } = require('mongoose/lib/types');
var port=3000;
var online_users={};

//db connect  and set up
var mydb = mongoose.connect('mongodb://localhost/testdb', function(err){
	if(err){
		console.log(err);
	} else {
		console.log('connected to mongodb');
	}
});

var user = new mongoose.Schema({
	uid : String,
	nickname : String,
	// email : String,
	password : String
});
var user_collection = mongoose.model('users',user);

var message = new mongoose.Schema({
	msg : String,
	sender: String,
	recepient : String,
	created : String
})
var msg_collection = mongoose.model('chat', message);


//default server response
const path=require('path');
app.use(express.static(path.join(__dirname, "public")));

app.get('/', function(req, res){
	res.setHeader("Content-Type", "text/html");
	res.sendFile(__dirname,"public", 'index.html');
});


//connection functions
io.sockets.on('connection', function(socket){
	

	socket.on('set current connection session',function(uidentifier,calback){
		
		user_collection.findOne({uid:uidentifier}, function(err, document){
			if(err) throw err;
			if (document){	
				let nick=document.nickname;
				console.log('new connection',socket.id,':',nick);
				socket.nickname=nick;
				online_users[nick]=socket.id;
				calback(nick);
			}
		});
	});

    socket.on('sign up', function(data, callback){
	
		user_collection.find({nickname:data.login},function(err, docs){
			if(err) throw err;
			else{
				if (docs[0]) callback(false);
				else {
					let uid=ObjectId.valueOf().index;
					new user_collection({
						'uid': uid,	'password':data.password,'nickname':data.login
					}).save(function(err){
						 	if(err) throw err;
							callback(uid);
					 });	
					
					
				}
			}
		});

	});	
    socket.on('log in', function(data, callback){
		user_collection.findOne({nickname:data.login},function(err, docs){
			if(err) throw err;
			else{
				if (docs){
					if (docs.password==data.password) callback(docs.uid);
					callback("err_pass");
				}
				else {
					callback(false);}
			}
		});
	});	




	socket.on('load user_collection',function(req,callback){
		user_collection.find({}, function(err, docs){
			if(err) throw err;
			let i=0, res=[]; 
			while(docs[i]){res[i]=docs[i].nickname; i++;}
			callback(res);
		});
	});
	

	socket.on('load msgs from user', function(chatters,callback){
	
		user_collection.findOne({uid:chatters.self},function(err, docs){
			if(err) throw err;
			let u1=docs.nickname;
			let u2=chatters.opponent;
			//console.log(u1,u2);

			if(u2=='all_chat')	msg_collection.find({recepient:u2},function(err, docs){
				if(err) throw err;
				callback(docs);
			})
			else 				msg_collection.find({$or: [{sender:u1,recepient:u2},{sender:u2,recepient:u1}]},function(err, docs){
				if(err) throw err;
				callback(docs);
			})
		});
		
	});


	socket.on('send message',function(req,callback){
	

		user_collection.findOne({uid:req.self},function(err, doc){
			if(err) throw err;
			let sendr=doc.nickname;
			let massag={'msg':req.message,'sender':sendr,'recepient':req.opponent, 'created' : Date.now()};
			

			new msg_collection({
				'msg': req.message,	'sender':sendr,'recepient':req.opponent,'created' : Date.now()
			}).save(function(err){
					if(err) throw err;
					if(req.opponent=='all_chat'){	socket.broadcast.emit('recieve message', massag);}
					else{
						
						try{io.to(online_users[req.opponent]).emit('recieve message', massag);}
						catch(err){console.log("no such user",err);}
				}
				callback(massag);
			 });
		});
	});



	socket.on('disconnect', function(data){
		 if(!socket || !socket.nickname) return;
		 delete online_users[socket.nickname];
		console.log('someone left, online users: ',online_users);
	});




	socket.on('load user_collection admin',function(req,callback){
		user_collection.find({}, function(err, docs){
			if(err) throw err;
			callback(docs);
		});

	});
	socket.on('delete all docs', function(chatters,callback){

		console.log("deleting all data from databases");
		socket.emit('reset all cookies');
		mydb.connection.db.dropDatabase();
	})
	
})
server.listen(port, function(){
	console.log('server is up!');
});
