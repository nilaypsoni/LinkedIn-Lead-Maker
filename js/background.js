var version = chrome.runtime.getManifest().version;
var uiSettings = {   
  dailyConnectionsLimit : 100,
  dailyCountConnections : 0,  
  LastCounterReset : new Date().getDate(),
  linkedin_loggedin_public_identifier : "",
  linkedin_loggedin_user_id : "",
  saved_leads_obj : {},
  campaign_list : ["My Contacts"],
  selected_campaign : "My Contacts",
};

var myApp = {
  search_change : false,  
  onExtMessage: function(message, sender, sendResponse){ 
    myApp.message = message;
    switch (message.command) {
      case "saveUISettings":
      uiSettings = message.data;   
      myApp.saveUISettings(message.data, sender, sendResponse);
      break;
      case "getLeadEmail":
      myApp.getLeadEmail(message.p_id, sender, sendResponse);
      break;
      case "addLeadToBuffer":      
      myApp.addLeadToBuffer(message.p_id, sender, sendResponse);
      break;
      case "goToList":      
      myApp.goToList(message, sender, sendResponse);
      break;      
      case "console_logs_myApp":
      console_logs_myApp(message.title,message.msg);
      break;
      case "set_delay_in_bg":
      setTimeout(function() {
        sendResponse();
      }, message.timeout);
      break;    
      case "getSettings":
      if(message.callback=="yes") {
        sendResponse({
          "uiSettings" : uiSettings 
        });
      } else {
        sendMessage(sender, {
          "command": "rec_getSettings",
          "data" : {
            "uiSettings" : uiSettings 
          }
        });
      }
      break;
    }
    return true;
  },
  load:function(){
    myApp.initStorage();
  },  
  initStorage: function(_sender){
    var storedVersion = localStorage["version"];
    if(storedVersion != version){
      localStorage["version"]      = version;
      localStorage['uiSettings']   = JSON.stringify(uiSettings);
    }
    uiSettings  = JSON.parse(localStorage["uiSettings"]);
  },
  saveUISettings : function(data, _sender, sendResponse){
    localStorage["uiSettings"] = JSON.stringify(uiSettings);
    if(typeof(sendResponse)=="function") {
      sendResponse({uiSettings:uiSettings});
    }
  },
  getLeadEmail : function(p_id, _sender, sendResponse){
    getContactInfoFromAPI(p_id).then((contact_info_res) => {
      var connectionObj = {};
      getProfileUserDetailsFromAPI(p_id).then((profileViewObj) => {
        connectionObj['user_details'] = profileViewObj;
        connectionObj['user_details']['contact_info'] = contact_info_res;
        if (profileViewObj && profileViewObj.profile && profileViewObj.profile.miniProfile && profileViewObj.profile.miniProfile.publicIdentifier) {
          var public_identifier = profileViewObj.profile.miniProfile.publicIdentifier;
          var objectUrn = profileViewObj.profile.miniProfile.objectUrn;
          var li_member = objectUrn.replace("urn:li:member:","");
          var user_id = li_member + '|' + public_identifier;        
          console.log('getUserFromServer... >> ', connectionObj);
          console.log('profile user_id  >> ', user_id);
          getUserFromServer(user_id,connectionObj).then((getUserFromServer_res) => {
            console.log('getUserFromServer response >> ', getUserFromServer_res);
            sendResponse(getUserFromServer_res);
          });          
        } else {
          resolve("");
        }
      });
    });
  },
  addLeadToBuffer : function(p_id, _sender, sendResponse){
    getContactInfoFromAPI(p_id).then((contact_info_res) => {
      var connectionObj = {};
      getProfileUserDetailsFromAPI(p_id).then((profileViewObj) => {
        connectionObj['user_details'] = profileViewObj;
        connectionObj['user_details']['contact_info'] = contact_info_res;
        if (profileViewObj && profileViewObj.profile && profileViewObj.profile.miniProfile && profileViewObj.profile.miniProfile.publicIdentifier) {
          var public_identifier = profileViewObj.profile.miniProfile.publicIdentifier;
          var objectUrn = profileViewObj.profile.miniProfile.objectUrn;
          var li_member = objectUrn.replace("urn:li:member:","");
          var user_id = li_member + '|' + public_identifier;        
          console.log('addLeadToBuffer >> ', connectionObj);
          console.log('profile user_id  >> ', user_id);
          var saved_leads_obj = uiSettings.saved_leads_obj || {};
          saved_leads_obj[user_id] = connectionObj;        
          uiSettings.saved_leads_obj = saved_leads_obj;
          myApp.saveUISettings();
          sendResponse({ saved : true });
        } else {
          sendResponse({ saved : false });
        }
      });
    });
  },
  goToList : function(message, _sender, sendResponse){
    var saved_leads_obj = uiSettings.saved_leads_obj || {};
    //saved_leads_obj = {};
    var saved_leads_count = Object.keys(saved_leads_obj).length;
    if (saved_leads_count > 0) {
      getListFromServer(saved_leads_obj).then((server_res) => {
        console.log('getListFromServer response >> ', server_res);
        sendResponse({ saved_leads_count : saved_leads_count, res : server_res});
      });
    } else {
      sendResponse({ saved_leads_count : saved_leads_count, res : ""});
    }
  }  
};

chrome.runtime.onMessage.addListener(myApp.onExtMessage);
myApp.load();

function sendMessage(tabId, msg){
  if(tabId) chrome.tabs.sendMessage(tabId, msg);
  else chrome.runtime.sendMessage(sender.id, msg);
}

var console_logs_myApp = function(title,msg){    
  console.log("%c "+title, "font-weight: bold");
  if(typeof(msg)=="object") {
    console.log("%c "+JSON.stringify(msg), 'color:#ce3e3e');
  } else {
    console.log("%c "+msg, 'color:#ce3e3e');
  }
};

chrome.alarms.clear('save1stConnectionsAlarm', function(){
  chrome.alarms.create('save1stConnectionsAlarm', {
    delayInMinutes : 60,
    periodInMinutes: 60
  });
});


function save1stConnectionsAlarm() {
  CheckDailyCounterCanReset(function(){

    var dailyCountConnections = uiSettings['dailyCountConnections'] || 0;
    dailyCountConnections = parseInt(dailyCountConnections);

    var dailyConnectionsLimit = uiSettings['dailyConnectionsLimit'] || 200;
    dailyConnectionsLimit = parseInt(dailyConnectionsLimit);

    console.log("Check Daily count extract 1st Connections >>> " +dailyCountConnections);
    console.log("Check Daily limit count extract 1st Connections >>> " +dailyConnectionsLimit);

    // check daily Count Connections
    if (dailyCountConnections >= dailyConnectionsLimit) {
      console.log("Daily limit reached for extract 1st Connections >>> " +dailyConnectionsLimit);      
      return false;
    }

    getUserResultStatus().then((res_status_str) => {
      var res_status = {};
      try{
        res_status = JSON.parse(res_status_str);
      } catch(e){
        console.log('error parse res_status >> ', e);
        res_status = {};
      }      
      console.log('getUserResultStatus res_status >> ', res_status);
      if (res_status && res_status.status == "new") {
        getAllConnections().then((all_connections_arr) => {
          console.log('all_connections_arr >> ', all_connections_arr);
          postSavelinkedinFConnections(all_connections_arr).then((connections_save_res) => {
            console.log('connections_save_res >> ', connections_save_res);
          });
        });
      } else if (res_status && res_status.status == "existing") {
        var profile_list_arr = res_status.list;
        console.log('profile_list_arr >> ', profile_list_arr);       
        getConnectionsContactInfo(profile_list_arr).then((connections_contacts_arr) => {
          //console.log('connections_contacts_arr >> ', connections_contacts_arr);
        });
      }
    });
  }); 
}

function getAllConnections() {
  return new Promise((resolve, reject) => {
    var all_connections_arr = [];

    function startGetConnectionsTimer(start_count,limit_count) {
      var randomInt = getRandomInt(1,3); 
      var set_timeout = randomInt * 1000;
      setTimeout(function() { 
        getLinkedinUserAcceptedConnection(start_count,limit_count).then((profiles_arr) => {
          if (profiles_arr.length > 0) {
            for (var i21 = 0; i21 < profiles_arr.length; i21++) {          
              var p_url = "https://www.linkedin.com/in/" + profiles_arr[i21]['profile_id'];
              all_connections_arr.push(p_url);
            }
            start_count = start_count + 100;
            startGetConnectionsTimer(start_count,limit_count);
          } else {
            resolve(all_connections_arr);
          }
        });
      },set_timeout);
    }
    startGetConnectionsTimer(0,100);
  });
}

function getConnectionsContactInfo(connections_profiles_arr) {
  return new Promise((resolve, reject) => {
    var contact_info_details_arr = [];  
    var dailyCountConnections = uiSettings['dailyCountConnections'] || 0;
    dailyCountConnections = parseInt(dailyCountConnections);
    
    var dailyConnectionsLimit = uiSettings['dailyConnectionsLimit'] || 200;
    dailyConnectionsLimit = parseInt(dailyConnectionsLimit);        

    function startContactInfoTimer() {
      var randomInt = getRandomInt(1,3); 
      var set_timeout = randomInt * 1000;
      setTimeout(function() { 
        var connections_profile_obj = connections_profiles_arr.pop();
        var p_type = connections_profile_obj.type;
        console.log("Connections Type >>> " + p_type );
        if (p_type == "person") {
          dailyCountConnections = dailyCountConnections + 1;
          uiSettings['dailyCountConnections'] = dailyCountConnections;
          myApp.saveUISettings();
          var p_url = connections_profile_obj.url;
          var p_id = p_url.replace('https://www.linkedin.com/in/', '').replace('/', '');
          var current_user = p_url;
          getContactInfoFromAPI(p_id).then((contact_info_res) => {
            var connectionObj = {};
            getProfileUserDetailsFromAPI(p_id).then((profileViewObj) => {
              connectionObj['user_details'] = profileViewObj;
              connectionObj['user_details']['contact_info'] = contact_info_res;
              contact_info_details_arr.push(connectionObj);
              console.log('Saving Contact connectionObj... >> ', connectionObj);
              console.log('Saving Contact Current user... >> ', current_user);
              postSaveConnectionsContactInfo(connectionObj,current_user).then((connections_contacts_save_res) => {
                console.log('Contacts save response >> ', connections_contacts_save_res);
              });
            });
          });
        } else if (p_type == "company") {

        }

        console.log("Check Daily count extract 1st Connections >>> " +dailyCountConnections);
        console.log("Check Daily limit count extract 1st Connections >>> " +dailyConnectionsLimit);

        setTimeout(function(){
          if (connections_profiles_arr.length > 0) {
          // check daily Count Connections
          if (dailyCountConnections >= dailyConnectionsLimit) {
            console.log("Daily limit reached for extract 1st Connections >>> " +dailyConnectionsLimit);
            resolve(contact_info_details_arr);
            return false;
          }      
          startContactInfoTimer();
        } else {
          resolve(contact_info_details_arr);
        }
      },1000);

      }, set_timeout);
    }

    startContactInfoTimer();
  });
}

function CheckDailyCounterCanReset(callback) {
  var currentday = new Date().getDate();
  var lastresetday = uiSettings['LastCounterReset'];
  if (lastresetday == undefined) {
    lastresetday = new Date().getDate();
    uiSettings['LastCounterReset'] = lastresetday;
  }
  if (currentday != lastresetday) {
    console.log('CheckDailyCounterCanReset true');
    uiSettings['dailyCountConnections'] = 0;
  }
  myApp.saveUISettings();
  callback();
}


// Save linkedin Users First Connections  save on the server
function postSavelinkedinFConnections(connections_profiles_arr) {
  return new Promise((resolve, reject) => {    
    getLinkedinLoggedinUserInfo().then((loggedin_obj) => {
      if (loggedin_obj && typeof(loggedin_obj.public_identifier) != "undefined" && typeof(loggedin_obj.user_id) != "undefined") {        
        var user_id = loggedin_obj.user_id + '|' + loggedin_obj.public_identifier;
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": consts.base_api_url + consts.new_user_api_url + '/' + user_id,
          "method": "POST",
          "data": { data : JSON.stringify(connections_profiles_arr)}
        };
        $.ajax(settings).done(function (response) {
          console.log("Done : postSavelinkedinFConnections : ",response);
          if (response == 'success') {
          }
          resolve(response);
        }).fail(function (response) {
          console.log("Fail : postSavelinkedinFConnections : ",response);
          resolve(response);
        });
      }
    });
  });
}

// Save linkedin Users First Connections  save on the server
function postSaveConnectionsContactInfo(post_json,current_user) {
  return new Promise((resolve, reject) => {    
    getLinkedinLoggedinUserInfo().then((loggedin_obj) => {
      if (loggedin_obj && typeof(loggedin_obj.public_identifier) != "undefined" && typeof(loggedin_obj.user_id) != "undefined") {        
        var user_id = loggedin_obj.user_id + '|' + loggedin_obj.public_identifier;        
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": consts.base_api_url + consts.save_contact_api_url + '/' + user_id,
          "method": "POST",          
          "data": { data : JSON.stringify(post_json),current_user:current_user}
        };
        $.ajax(settings).done(function (response) {
          //console.log("Done : postSaveConnectionsContactInfo : ",response);
          if (response == 'success') {

          }
          resolve(response);
        }).fail(function (response) {
          //console.log("Fail : postSaveConnectionsContactInfo : ",response);
          resolve(response);
        });
      }
    });
  });
}

// Save linkedin Users First Connections  save on the server
function getUserFromServer(user_id,post_json) {
  return new Promise((resolve, reject) => {    
    var settings = {
      "async": true,
      "crossDomain": true,
      "url": consts.base_api_url + consts.get_user_api_url + '/' + user_id,      
      "method": "POST",          
      "data": { data : JSON.stringify(post_json)}
    };
    $.ajax(settings).done(function (response) {
      //console.log("Done : postSaveConnectionsContactInfo : ",response);
      if (response == 'success') {
      }
      resolve(response);
    }).fail(function (response) {
      //console.log("Fail : postSaveConnectionsContactInfo : ",response);
      resolve(response);
    });
  });
}

// Save linkedin Users First Connections  save on the server
function getListFromServer(post_json) {
  return new Promise((resolve, reject) => {
    getLinkedinLoggedinUserInfo().then((loggedin_obj) => {
      if (loggedin_obj && typeof(loggedin_obj.public_identifier) != "undefined" && typeof(loggedin_obj.user_id) != "undefined") {
        var user_id = loggedin_obj.user_id + '|' + loggedin_obj.public_identifier;
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": consts.base_api_url + consts.get_list_api_url + '/' + user_id,
          "method": "POST",          
          "data": { data : JSON.stringify(post_json),list : uiSettings.selected_campaign}          
        };
        $.ajax(settings).done(function (response) {
           //console.log("Done : postSaveConnectionsContactInfo : ",response);
           if (response && response.indexOf("redirect") != -1) {
            uiSettings.saved_leads_obj = {};
            myApp.saveUISettings();
           }
           resolve(response);
         }).fail(function (response) {
          //console.log("Fail : postSaveConnectionsContactInfo : ",response);
          resolve(response);
        });
       }
     });
  });
}

// Save linkedin Users First Connections save on the server
function postSaveConnectionsCompanyInfo(post_json) {
  return new Promise((resolve, reject) => {    
    getLinkedinLoggedinUserInfo().then((loggedin_obj) => {
      if (loggedin_obj && typeof(loggedin_obj.public_identifier) != "undefined" && typeof(loggedin_obj.user_id) != "undefined") {
        var user_id = loggedin_obj.user_id + '|' + loggedin_obj.public_identifier;
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": consts.base_api_url + consts.save_company_api_url + '/' + user_id,
          "method": "POST",
          "contentType": "application/json",
          "data":JSON.stringify(post_json),
        };
        $.ajax(settings).done(function (response) {
          console.log("Done : postSaveConnectionsCompanyInfo : ",response);
          if (response == 'success') {

          }
          resolve(response);
        }).fail(function (response) {
          console.log("Fail : postSaveConnectionsCompanyInfo : ",response);
          resolve(response);
        });
      }
    });
  });
}

function getUserResultStatus() {
  return new Promise((resolve, reject) => {
    getLinkedinLoggedinUserInfo().then((loggedin_obj) => {
      if (loggedin_obj && typeof(loggedin_obj.public_identifier) != "undefined" && typeof(loggedin_obj.user_id) != "undefined") {
        var user_id = loggedin_obj.user_id + '|' + loggedin_obj.public_identifier;
        var post_json = {};
        var settings = {
          "async": true,
          "crossDomain": true,
          "url": consts.base_api_url + consts.get_status_api_url + '/' + user_id,
          "method": "GET",
          "contentType": "application/json",          
        };
        $.ajax(settings).done(function (response) {
          console.log("Done : getUserResultStatus : ",response);
          resolve(response);
        }).fail(function (response) {
          console.log("Fail : getUserResultStatus : ",response);
          resolve("");
        });
      }
    });
  });
}

function getLinkedinLoggedinUserInfo() {
  return new Promise((resolve, reject) => {
    CheckLinkedinSession().then((is_linkedin_loggedin) => {
      var obj = {};
      if (is_linkedin_loggedin == true) {
        var linkedin_loggedin_public_identifier = uiSettings['linkedin_loggedin_public_identifier'] || "";
        var linkedin_loggedin_user_id = uiSettings['linkedin_loggedin_user_id'] || "";
        if (linkedin_loggedin_public_identifier == "" || linkedin_loggedin_user_id == "") {
          getProfileUserDetailsFromAPI('me').then((profileViewObj) => {
            if (profileViewObj && profileViewObj.profile && profileViewObj.profile.miniProfile && profileViewObj.profile.miniProfile.publicIdentifier) {
              var public_identifier = profileViewObj.profile.miniProfile.publicIdentifier;          
              var objectUrn = profileViewObj.profile.miniProfile.objectUrn;
              var li_member = objectUrn.replace("urn:li:member:","");
              obj.public_identifier = public_identifier;
              obj.user_id = li_member;
              uiSettings['linkedin_loggedin_public_identifier'] = obj.public_identifier;
              uiSettings['linkedin_loggedin_user_id'] = obj.user_id;
              myApp.saveUISettings();
              resolve(obj);
            }
          });
        } else {
          var obj = { 
            public_identifier : linkedin_loggedin_public_identifier,
            user_id : linkedin_loggedin_user_id
          };
          resolve(obj);
        }
        /*getCsrfToken().then((csrf_token) => {
          var obj = {};
          var linkedin_loggedin_email = uiSettings['linkedin_loggedin_email'] || "";
          if (linkedin_loggedin_email == "") {
            $.ajax({
              url: 'https://www.linkedin.com/voyager/api/identity/profiles/me/profileContactInfo',
              beforeSend: function(req) {         
                req.setRequestHeader('csrf-token', csrf_token);
              },
              xhrFields: {
                withCredentials: true
              },
              success: function(contact_info){
                if(contact_info && contact_info.emailAddress){
                  obj.email = contact_info.emailAddress;
                  if(obj.email.indexOf('phishing') >= 0){
                    obj.email = decodeURIComponent(obj.email).replace(/(.*?)https:.*?=(.*)/,'$1$2');                    
                  }
                  console.log('linkedin_loggedin_email >> '+ obj.email);
                  uiSettings['linkedin_loggedin_email'] = obj.email;
                  myApp.saveUISettings();
                }
                resolve(obj);
              },
              error: function () {
                resolve({});
              }
            });
          } else {
            var obj = { email : linkedin_loggedin_email};
            resolve(obj);
          }
        });*/
      }
    });
  });
}

function CheckLinkedinSession(){
  return new Promise((resolve, reject) => { 
    chrome.cookies.get({url: 'https://www.linkedin.com/', name: 'liap'}, function(cookie) {
      if (cookie != null) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  });
}

function getCsrfToken(){
  return new Promise((resolve, reject) => {
    chrome.cookies.get({
      url: 'https://www.linkedin.com',
      name: 'JSESSIONID'
    }, function done(data) {
      xt = data || {};
      resolve(xt.value.replace(/"/g, ''));
    });
  }); 
}

/* Get profile user details data from linkein API */
function getProfileUserDetailsFromAPI(profile_id) {
  return new Promise((resolve, reject) => {
    var profileViewObj = {};
    getCsrfToken().then((csrf_token) => {
      $.ajax({
        url: 'https://www.linkedin.com/voyager/api/identity/profiles/'+profile_id+'/profileView',
        beforeSend: function(req) {         
          req.setRequestHeader('csrf-token', csrf_token);
          req.setRequestHeader('accept', '*');
        },
        xhrFields: {
          withCredentials: true
        },
        success: function(profileViewRes){
          if(profileViewRes && profileViewRes.entityUrn){
            profileViewObj = profileViewRes;
          }
          console.log("response success getProfileUserDetailsFromAPI >>> ");
          console.log(profileViewObj);
          resolve(profileViewObj);
        },
        error: function () {
          resolve(profileViewObj);
        }
      });
    });
  });
}



chrome.webRequest.onBeforeSendHeaders.addListener(
  function (details) {    
    if (details.url.indexOf("/login-submit") > 0) {
      setTimeout(function(){
        console.log("LinkedIn login submit");
        uiSettings['linkedin_loggedin_public_identifier'] = "";
        myApp.saveUISettings();
        getLinkedinLoggedinUserInfo().then((loggedin_obj) => {
        });
      },2000);
    } else if (details.url.indexOf("/logout") > 0) {
      console.log("LinkedIn logout");
      uiSettings['linkedin_loggedin_public_identifier'] = "";
      myApp.saveUISettings();
    } 
    return {
      requestHeaders: details.requestHeaders
    };
  }, {
    urls: ['https://www.linkedin.com/*/*']
  }, ['requestHeaders']
  );

// Install extension and reload extension check linkedin loggedin email
uiSettings['linkedin_loggedin_public_identifier'] = "";
myApp.saveUISettings();
getLinkedinLoggedinUserInfo().then((loggedin_obj) => { 
});


function getLinkedinUserAcceptedConnection(start_from,limit_count) {
  return new Promise((resolve, reject) => {
    CheckLinkedinSession().then((is_linkedin_loggedin) => {
      if (is_linkedin_loggedin == true) {
        getCsrfToken().then((csrf_token) => {           
          $.ajax({            
            url: 'https://www.linkedin.com/voyager/api/relationships/connections?count='+limit_count+'&sortType=RECENTLY_ADDED&start='+start_from,
            beforeSend: function(req) {         
              req.setRequestHeader('csrf-token', csrf_token);
            },
            xhrFields: {
              withCredentials: true
            },
            success: function(response){
              var recently_added_arr = [];
              if (response && response.elements && response.elements.length > 0) {
                for (var i = 0; i < response.elements.length; i++) {
                  var miniProfile = response.elements[i]['miniProfile'];
                  var entityUrn = miniProfile.entityUrn
                  var li_user_id = entityUrn.replace("urn:li:fs_miniProfile:","");
                  var datetime_accepted = response.elements[i]['createdAt'];
                  recently_added_arr.push({profile_id : miniProfile.publicIdentifier,li_user_id : li_user_id,datetime_accepted:datetime_accepted});
                }
              }
              resolve(recently_added_arr);
            },
            error: function () {
              resolve([]);
            }
          });
        });
      }
    });
  });
}


/**
* Returns a random integer between min (inclusive) and max (inclusive).
* The value is no lower than min (or the next integer greater than min
* if min isn't an integer) and no greater than max (or the next integer
* lower than max if max isn't an integer).
* Using Math.round() will give you a non-uniform distribution!
*/
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


function getProfileContactInfo(p_index,profile_obj){
  return new Promise((resolve, reject) => { 
    var url = "https://www.linkedin.com/in/"+profile_obj.id+"/detail/contact-info/";
    $.get(url).done(function (res) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(res, "text/html"); 
      var html = $(doc).find('html').html();
      
      /*Skrapp profiles contact info from json*/

      var h, j, e,  l, inc, obj, obje, cur, curn, r, current, parsed = {};

          // Dom init
          h = $("<div />", {
            html: html
          });

          j = h.find("code:contains('patentView')").html();
          e = h.find("code:contains('emailAddress')").html();

          try {

            if (j == undefined || typeof(j) == "undefined") { 
              j = h.find("code:contains('FullProfilePatents')").html();
            }

            if (j == undefined || typeof(j) == "undefined") { 
              j =  "{}"; 
            }

            obj  = JSON.parse(j);
            if (e == undefined || typeof(e) == "undefined") { 
              e =  "{}"; 
            }

            try {
              obje = JSON.parse(e);
            } catch(e) {
              console.error('Error parsing dom');
            }

            inc  = obj.included || [];
            l    = inc ? inc.length : 0;

            for(var j = l-1; j >= 0; j--) {
              if(inc[j] && inc[j].firstName && inc[j].lastName && inc[j].publicIdentifier && url && url.indexOf(inc[j].publicIdentifier) > -1) {
                profile_obj.firstName =  inc[j].firstName;
                profile_obj.lastName = inc[j].lastName;
                break;
              }
            }

            profile_obj.email = obje && obje.data && obje.data.emailAddress ? obje.data.emailAddress : "";

            var phoneNumber = obje && obje.data && obje.data.phoneNumbers ? obje.data.phoneNumbers : [];
            profile_obj.phoneNumber = phoneNumber.length > 0 && phoneNumber[0] && phoneNumber[0]['number'] != "" ? phoneNumber[0]['number'] : "";

            var twitterHandles = obje && obje.data && obje.data.twitterHandles ? obje.data.twitterHandles : [];
            profile_obj.twitter = twitterHandles.length > 0 && twitterHandles[0] && twitterHandles[0]['name'] != "" ? twitterHandles[0]['name'] : "";

            var websites = obje && obje.data && obje.data.websites ? obje.data.websites : [];
            profile_obj.websiteUrl = websites.length > 0 && websites[0] && websites[0]['url'] != "" ? websites[0]['url'] : "";

            // Position
            try {
              // Aggregating email
              for(var k = 0; k < l; k++) {
                if(inc[k].$type == 'com.linkedin.voyager.common.DateRange' && inc[k].$id.indexOf('fs_position') > -1 && !inc[k].endDate) {r = inc[k]; break;};
              }

              // J match
              for(var i = 0; i < l; i++)  {
                if(((inc[i].companyName && inc[i].$type == 'com.linkedin.voyager.identity.profile.Position') ||
                  (inc[i].name && inc[i].$type == 'com.linkedin.voyager.identity.profile.PositionGroup')) &&
                  inc[i].timePeriod && r && r.$id === inc[i].timePeriod)
                {
                  cur = inc[i]; break;
                }
              }

              if(cur) {
                profile_obj.company = cur.companyName || cur.name;
                curn           = cur.companyUrn || cur.miniCompany;

                    // Looking for title
                    if(!cur.title) {
                      for(var i = 0; i < l; i++) if(inc[i].title && inc[i].companyUrn == curn) { profile_obj.title = inc[i].title; break;}
                    } else profile_obj.title   = cur.title;

                  if(curn && curn.split(':').length > 0) {
                    splitUrn = curn.split(':');
                    profile_obj.companyUrl = '/company/' + splitUrn[splitUrn.length - 1];
                  }
                } else {
                // Alternative
                for(var i = 0; i < l; i++) {
                  if(inc[i].$type && inc[i].$type == 'com.linkedin.voyager.identity.profile.Position' && inc[i].timePeriod && inc[i].timePeriod.startDate && !inc[i].timePeriod.endDate) {
                    if(!current || ( inc[i].timePeriod.startDate.year > current.timePeriod.startDate.year) || (inc[i].timePeriod.startDate.year == current.timePeriod.startDate.year && inc[i].timePeriod.startDate.month > current.timePeriod.startDate.month)) current = inc[i]
                  }
              }
              if (current) {
                profile_obj.company  = current.companyName || "";
                profile_obj.title    = current.title;
                if(current.companyUrn && current.companyUrn.split(':').length > 0) {
                  profile_obj.companyUrl = '/company/' + current.companyUrn.split(':')[current.companyUrn.split(':').length - 1]
                }
              }
            }

            if (obj.data && obj.data['*profile']) {
              var profile_entityUrn = obj.data['*profile'];
              for(var i = 0; i < l; i++) {
                if(inc[i].$type && inc[i].$type == 'com.linkedin.voyager.identity.profile.Profile' && inc[i].entityUrn && inc[i].entityUrn == profile_entityUrn) {                  
                  profile_obj.summary =  inc[i].summary || "";
                  profile_obj.industryName =  inc[i].industryName || "";
                  profile_obj.locality =  inc[i].locationName || ""; 
                  profile_obj.headline =  inc[i].headline || "";
                  break; 
                }
              } 
            } 
            
            if (typeof(obj.data) != "undefined" && typeof(obj.data['*elements']) != "undefined" && obj.data['*elements'].length > 0) {
              var profile_entityUrn = obj.data['*elements'][0];
              for(var i = 0; i < l; i++) {
                if(inc[i].$type && inc[i].$type == 'com.linkedin.voyager.dash.identity.profile.Profile' && inc[i].entityUrn && inc[i].entityUrn == profile_entityUrn) {
                  profile_obj.summary =  inc[i].summary || "";
                  profile_obj.locality =  inc[i].locationName || ""; 
                  profile_obj.headline =  inc[i].headline || "";

                  

                  /* For find profileEducations */
                  var profileEducations = inc[i]['*profileEducations'];
                  for(var i3 = 0; i3 < l; i3++) {
                    if(inc[i3].$type && inc[i3].$type == 'com.linkedin.restli.common.CollectionResponse' && inc[i3].entityUrn && inc[i3].entityUrn == profileEducations) {
                      var educations_elements = inc[i3]['*elements'];
                      if (educations_elements && educations_elements.length > 0) {

                        var educations_entityUrn =  educations_elements[0];
                        for(var i4 = 0; i4 < l; i4++) {
                          if(inc[i4].$type && inc[i4].$type == 'com.linkedin.voyager.dash.identity.profile.Education' && inc[i4].entityUrn && inc[i4].entityUrn == educations_entityUrn) {
                            var current_education = inc[i4];
                            profile_obj.education  = current_education.degreeName || "";
                            break; 
                          }
                        }

                      }

                      break; 
                    }
                  } 

                  /* For find industry name */
                  var industryUrn = inc[i].industryUrn;
                  for(var i1 = 0; i1 < l; i1++) {
                    if(inc[i1].$type && inc[i1].$type == 'com.linkedin.voyager.dash.common.Industry' && inc[i1].entityUrn && inc[i1].entityUrn == industryUrn) {
                      profile_obj.industryName =  inc[i1].name || "";
                      break; 
                    }
                  } 

                  /* For find company info */
                  var profilePositionGroups = inc[i]['*profilePositionGroups'];
                  for(var i3 = 0; i3 < l; i3++) {
                    if(inc[i3].$type && inc[i3].$type == 'com.linkedin.restli.common.CollectionResponse' && inc[i3].entityUrn && inc[i3].entityUrn == profilePositionGroups) {
                      var company_elements = inc[i3]['*elements'];
                      if (company_elements && company_elements.length > 0) {

                        var company_entityUrn =  company_elements[0];
                        for(var i4 = 0; i4 < l; i4++) {
                          if(inc[i4].$type && inc[i4].$type == 'com.linkedin.voyager.dash.identity.profile.PositionGroup' && inc[i4].entityUrn && inc[i4].entityUrn == company_entityUrn) {

                            var current_company = inc[i4];
                            profile_obj.company  = current_company.companyName || "";
                            if(current_company.companyUrn && current_company.companyUrn.split(':').length > 0) {
                              profile_obj.companyUrl = '/company/' + current_company.companyUrn.split(':')[current_company.companyUrn.split(':').length - 1]
                            }

                            var profilePositionInPositionGroup = inc[i4]['*profilePositionInPositionGroup'];
                            for(var i5 = 0; i5 < l; i5++) {
                              if(inc[i5].$type && inc[i5].$type == 'com.linkedin.restli.common.CollectionResponse' && inc[i5].entityUrn && inc[i5].entityUrn == profilePositionInPositionGroup) {
                                var position_elements = inc[i5]['*elements'];
                                if (position_elements && position_elements.length > 0) {

                                  var position_entityUrn = position_elements[0];
                                  for(var i6 = 0; i6 < l; i6++) {
                                    if(inc[i6].$type && inc[i6].$type == 'com.linkedin.voyager.dash.identity.profile.Position' && inc[i6].entityUrn && inc[i6].entityUrn == position_entityUrn) {
                                      var current_position = inc[i6];
                                      profile_obj.company  = current_position.companyName || "";
                                      profile_obj.title    = current_position.title;
                                      if(current_position.companyUrn && current_position.companyUrn.split(':').length > 0) {
                                        profile_obj.companyUrl = '/company/' + current_position.companyUrn.split(':')[current_position.companyUrn.split(':').length - 1]
                                      }
                                      break;
                                    }
                                  }

                                }
                                break;
                              }
                            }

                            break; 
                          }
                        }

                      }

                      break; 
                    }
                  } 

                  break; 
                }
              } 
            }

          } catch(e) {}
        } catch(e) {}

        resolve({profile_obj,p_index});
        /*End Skrapp profiles contact info from json*/
      }).fail(function (data) {
        resolve({profile_obj,p_index});
      });
    });
}

function getCompanyDetails(c_obj) {
  return new Promise(function (resolve, reject) {
    if (c_obj.companyUrl && (c_obj.companyUrl.match(consts.company_url_regex) || c_obj.companyUrl.match(consts.company_beta_url_regex))) {
      companyParserObj.parse(c_obj.companyUrl, function (company_obj) {
        if (company_obj && company_obj != undefined && company_obj != null) {          
          resolve(company_obj);
        } else {
          resolve({});
        }
      });
    } else {
      resolve({});
    }
  });
}

/* Get contact profile info from linkein API */
function getContactInfoFromAPI(profile_id) {
  return new Promise((resolve, reject) => {
    var contact_info_obj = {};
    getCsrfToken().then((csrf_token) => {
      $.ajax({
        url: 'https://www.linkedin.com/voyager/api/identity/profiles/'+profile_id+'/profileContactInfo',
        beforeSend: function(req) {         
          req.setRequestHeader('csrf-token', csrf_token);
        },
        xhrFields: {
          withCredentials: true
        },
        success: function(contact_info){
          if(contact_info && contact_info.emailAddress){
            contact_info_obj.emailAddress = contact_info.emailAddress;
          }
          if(contact_info && contact_info.websites){
            contact_info_obj.websites = contact_info.websites;
          }
          if(contact_info && contact_info.twitterHandles){
            contact_info_obj.twitterHandles = contact_info.twitterHandles;
          }
          if(contact_info && contact_info.phoneNumbers){
            contact_info_obj.phoneNumbers = contact_info.phoneNumbers;
          }

          console.log("response success getContactInfoFromAPI >>> ");
          console.log(contact_info_obj);

          resolve(contact_info_obj);
        },
        error: function () {
          resolve(contact_info_obj);
        }
      });
    });
  });
}