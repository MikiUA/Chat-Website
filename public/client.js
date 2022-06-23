

//var chat_box;
function initialize(){
    chat_box=document.getElementById('chat_box');
    user_box=document.getElementById('user_list');
    console.log("COOKIES: ",document.cookie);
    var user = cookie_f('get','UID');
    if (!user || !user.length) {
        //redirect
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
        socket.emit('load user_collection admin', user,function(docs){
            for(var i = 0; i < docs.length; i++){
                display_user_list_admin(docs[i]);
            }   
        });
        select_user('all_chat');
    }
        //cookie_f('set','recepient','all_chat');
    //else if user admin fuck the site up
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
            let erase_start=cookie.indexOf(name);
            if(erase_start){
                let erase_end=erase_start;
                while(cookie[erase_end] && cookie[erase_end]!=';'){
                    erase_end++;
                }erase_end++;
                document.cookie=cookie.replace(cookie.slice(erase_start,erase_end),'');
            }
            //TODO this is not exactly working, though of a little use now, low priority
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
function log_in(bool0){
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
                    }
                }
                else cookie_f('set','login_res',"err_usr");
            })
        }
        else{
            
            
            socket.emit('sign up', req, function (res){
                cookie_f('set','signup_res',res);
                if(res)   cookie_f('set','UID',res); 
                else cookie_f('set','signup_res',"login_exists");
            })
        }
        //cookie_f('erase','login_res');
        //cookie_f('erase','signup_res');
        //cookie_f('erase','current_login_session');

    document.getElementById('login_page').style.display="block";
    document.getElementById('chat_page').style.display="none";
    }
    else console.log("login must not be empty!")
}


function display_user_list(data){
    const usr=document.createElement("div");
    user_box.appendChild(usr);
    usr.outerHTML="<div class='user_info' onclick='select_user(\""+data+"\")'><b>"+data+"</b></div>";
    return chat_box.append('');
}

function select_user(usr){
    document.getElementById('current_reciever').innerHTML=usr;

    cookie_f('set','recepient',usr);
    let req={"self":cookie_f('get','UID'),"opponent":usr};
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













socket.on('load old msgs', function(docs){
    for(var i = 0; i < docs.length; i++){
        displayChat(docs[i]);
    }
});


// socket.on('whisper', function(data){
//     chat_box.append('<span class="whisper"><b>' + data.nickname + '</b>:' + data.msg + data.created+'<span><br>');
// });

function displayChat(data){
    const msg=document.createElement("span");
    chat_box.appendChild(msg);
    let datetime=new Date(data.created*1000).toLocaleString();
    //let datetime=data.created*1000;
    msg.outerHTML="<span class='msg'><b>" + data.sender + ' - '+data.recepient+'</b>: ' + data.msg + " <span class='msg_time'>"+ datetime + "</span></span><br>";

    return chat_box.append('');
}








function display_user_list_admin(data){
    const usr=document.createElement("div");
    user_box.appendChild(usr);
    usr.outerHTML="<div class='user_info' onclick='select_user(\""+data.nickname+"\")'><b>"+data.nickname+"</b><br>"+data.password+"</div>";
    return chat_box.append('');
}
function admin_tools(tool){
    switch (method) {
        case ('toolbox'): {
            doc=document.getElementById('admin_toolbox_enable');
            if(document.getElementById('admin_toolbox_enable').value=='open admin tools'){doc.value='close admin tools'; document.getElementById('admin_toolbox').style.display="block";}
            else{doc.value='open admin tools'; document.getElementById('admin_toolbox').style.display="none";}
            break;
        }
        case ('get_users'): {
            socket.emit('load user_collection admin', user,function(docs){
                user_box.innerHTML="<div class='user_info' onclick='select_user(\"all_chat\")'>All chat</div>";
                for(var i = 0; i < docs.length; i++){
                    //display_user_list(docs[i]);
                    const usr=document.createElement("div");
                    user_box.appendChild(usr);
                    usr.outerHTML="<div class='user_info' onclick='select_user(\""+docs[i].nickname+"\")'><b>login: " + docs[i].nickname + '</b><p>uid: "' + docs[i].uid + '" </p><p>pass: "'+ docs[i].password + '"</p></div>';
                    return chat_box.append('');
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
socket.on('reset all cookies', function(){
   cookie_f('erase_all');
});