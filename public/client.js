//Client side script, loads with the html file on the browser
function initialize(){//on page load do this:
    //cookie_f('erase_all'); //in case something crashes uncomment this and not allow users to do anything
    chat_box=document.getElementById('chat_box');
    user_box=document.getElementById('user_list');
    current_recipient_button=document.getElementById('all_chat_button');
    
    //global variables, use the Ram memory
    console.log("COOKIES: ",document.cookie);
    //global variables, use the disc space, sometimes unreliable (store current user and current recipient, so they dont change when page is refreshed)
    const self_user = cookie_f('get','UID');
    if (!self_user || !self_user.length) {
           //TODO redirect to /login page
        document.getElementById('login_page').style.display="block";
        document.getElementById('chat_page').style.display="none";
        
        if(cookie_f('get','current_login_session')=="signup") changeloginbox(1);
        if(cookie_f('get','login_res')){
            if(cookie_f('get','login_res') =='err_pass'){
                document.getElementById('login_err').innerHTML="That password was incorrect. (note: there is no way to reset password on this site, so try to remember it)";
            }
            else if(cookie_f('get','login_res') =='err_usr'){
                document.getElementById('login_err').innerHTML="That login does not exist. (note: try to sign up if you are a new user)";
            }
        }
        if(cookie_f('get','signup_res')=='login_exists'){
            document.getElementById('signup_err').innerHTML="That login already exists. Choose a different one.";
        }
    }
    else {
            //TODO LOGIN by UID
            //else if user admin fuck the site up
            
        socket.emit('set current connection session',self_user,function(res){
               console.log('success',res);
        });    
        
        socket.emit('load user_collection',null,function(docs){
            for(var i = 0; i < docs.length; i++){
                display_user_list(docs[i]);
            }   
        });
        select_user('all_chat',current_recipient_button);
    }
    
 
}

function cookie_f(method,name,value){
    var cookie=decodeURIComponent(document.cookie);
    switch (method) {
        case ('get'||'Get'): {
            
            name=name+'=';
            let indexofname=cookie.indexOf(name);
            if(indexofname!=-1){
                indexofname+=name.length;
                let ret_val=[],i=0;
                while(cookie[indexofname] && cookie[indexofname]!=';'){
                    ret_val[i]=cookie[indexofname];
                    i++;indexofname++;
                }
                return ret_val.join('');
            }
           //else return null;
            break;
        }
        case ('set'||'Set'): {
            document.cookie=name+"="+value;
            break;
        }
        case ('erase'||'Erase'): {
            document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";        
            break;
        }
        case ('erase_all'||'Erase_all'): {
            const cookies = document.cookie.split(";");

            for (const cookie of cookies) {
              const eqPos = cookie.indexOf("=");
              const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
              document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
            break;
        }
        default: {
            console.log("Wrong method of cookie function")
        }
    }
}


function changeloginbox(box){
    if(!box){
        cookie_f('set','current_login_session',"login");
        document.getElementById('loginbox').style.display="block";
        document.getElementById('signupbox').style.display="none";
    }         
    else {
        cookie_f('set','current_login_session',"signup");
        document.getElementById('loginbox').style.display="none";
        document.getElementById('signupbox').style.display="block";
    }
}


var socket = io.connect();
function log_in(bool0){//0 if login, 1 if signup
    let login,password;
    if(!bool0){
        login=document.getElementById('login0');
        password=document.getElementById('password0');
    }
    else{
        login=document.getElementById('login1');
        password=document.getElementById('password1');
    }    
    //login
    if(login.value && password.value){
        let req={
            'login':login.value,
            'password':password.value
        }
        if(!bool0){
            socket.emit('log in', req, function (res){
                if(res)   {
                    if(res=="err_pass") cookie_f('set','login_res',"err_pass");
                    else { 
                        cookie_f('set','UID',res);
                        cookie_f('set','self_nickname',req.login);
                    }
                }
                else cookie_f('set','login_res',"err_usr");
            })
        }
        else{
            
            
            socket.emit('sign up', req, function (res){
                cookie_f('set','signup_res',res);
                if(res)   {cookie_f('set','UID',res); 
                cookie_f('set','self_nickname',req.login);}
                else cookie_f('set','signup_res',"login_exists");
            })
        }
        cookie_f('erase','login_res');
        cookie_f('erase','signup_res');
        cookie_f('erase','current_login_session');

    document.getElementById('login_page').style.display="block";
    document.getElementById('chat_page').style.display="none";
    }
    else console.log("login must not be empty!")
}


function display_user_list(data){
    const usr=document.createElement("div");
    user_box.appendChild(usr);
    usr.outerHTML="<div class='user_info' onclick='select_user(\""+data+"\",this)'><b>"+data+"</b></div>";
    return chat_box.append('');
}

function select_user(usr, button){
    try {
        current_recipient_button.style.border=  "1px solid #32a1ce";
        current_recipient_button=button;
        current_recipient_button.style.border=  "1px solid #fa110c";
    }    catch(err){console.log(err);}

    self_nick=  cookie_f('get','self_nickname');
    self_id=  cookie_f('get','UID');

    document.getElementById('current_reciever').innerHTML=self_nick+" - "+usr;
    cookie_f('set','recepient',usr);
    let req={'self':self_id,'opponent':usr}
    socket.emit('load msgs from user',req,function(res_msgs){
        chat_box.innerHTML='';
        for(var i = 0; i < res_msgs.length; i++){
            displayChat(res_msgs[i]);
        }
    });
    
}




function submit_message(){
    let message=document.getElementById('input_message');
   
    if(message.value){
        let opponent=cookie_f('get','recepient')
        if(!opponent) opponent="all_chat";
        let req={'self':cookie_f('get','UID'),'opponent':opponent,'message':message.value};
        socket.emit('send message', req,function(data){
          //  chat_box.append('<span class="error">' + data + '<span>');
          displayChat(data);
        });
        message.value='';
    }
}

socket.on('recieve message', function(data){
    let opponent=cookie_f('get','recepient');
    if((data.recepient=='all_chat' && opponent=='all_chat')||(data.recepient!='all_chat' && data.sender==opponent)){
    displayChat(data);
    }

   
});

function displayChat(data){
    const msg=document.createElement("span");
    chat_box.appendChild(msg);
    let datetime=new Date(data.created*1000).toLocaleString();
    //let datetime=data.created*1000;
    msg.outerHTML="<span class='msg'><b>" + data.sender + ' - '+data.recepient+'</b>: ' + data.msg + " <span class='msg_time'>"+ datetime + "</span></span><br>";

    return chat_box.append('');
}









function admin_tools(tool,toolbox){
    switch (tool) {
        case ('toolbox'): {
            doc=toolbox;//document.getElementById('admin_toolbox_enable');
            if(doc.value=='open admin tools'){     doc.value='close admin tools'; 
             document.getElementById('admin_toolbox').style.display="block";}
           else{doc.value='open admin tools'; document.getElementById('admin_toolbox').style.display="none";}
            break;
        }
        case ('get_users'): {
            user_box.innerHTML="<div class='user_info' onclick='select_user(\"all_chat\",this)'>All chat</div>";
            let req='null';
            socket.emit('load user_collection admin',req,function(docs){
               console.log(docs);
                for(var i = 0; i < docs.length; i++){
                    display_user_list_admin(docs[i]);
  
                }   
            });
            break;
        }
        case ('get_msgs'): {
           
            break;
        }
        case ('clear_db'): {
            //socket.emit('delete all docs', 0, function (res){ if (0) console.log(res);});
            socket.emit('delete all docs');
            break;
        }
        case ('clear_msg'): {
          
            break;
        }
        default: {
            console.log("Wrong method of admin_tools function")
        }
    }
   
    

}
function display_user_list_admin(data){
    const usr=document.createElement("div");
    user_box.appendChild(usr);
    usr.outerHTML="<div class='user_info' onclick='select_user(\""+data.nickname+"\",this)'><b>"+data.nickname+"</b><br>uid:"+data.uid+"<br>pass:"+data.password+"</div>";
    return chat_box.append('');
}
socket.on('reset all cookies', function(){
   cookie_f('erase_all');
});