/*
* File: popup.js
* Type: web resource file
* Author: Nilay Soni
*/
var callback=null,xhrRequest = null;
window.addEventListener("load",function() {
	chrome.runtime.onMessage.addListener(handleMessage);
	myAppPopup.load();
});
var myAppPopup = {
	uiSettings:{},
  profile_data_arr:[],
  current: {
    active: false,
    name: '',    
    sourceId: '',
    userId: '',
    format: '',
    data: [],
  },
	/* 
  * Function : Load()  
  * Description: Initialize the modal element's click Events And user Settings.
  */
  load: function(){
    myAppPopup.initLangMessages();
    myAppPopup.addEvents();

    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length > 0) {
        var currentURL = tabs[0].url;
        if(currentURL.indexOf('linkedin') > -1) {
          if(currentURL.indexOf('/in/') > -1 || currentURL.indexOf('/profile') > -1) {
            myAppPopup.getSingleProfileInfo("","LN");
          } else if(currentURL.indexOf('sales/people/') > -1 ){
            myAppPopup.getSingleProfileInfo("","SN");
          } else {
            myAppPopup.renderPopup('use_button');
          }            
        } else {
          myAppPopup.renderPopup('error_usage');
        }
      } else {
        myAppPopup.renderPopup('error_usage');
      }
    });

    // myAppPopup.checkLoginAuth(function(account){
    //   chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //     if (tabs.length > 0) {
    //       var currentURL = tabs[0].url;
    //       if(currentURL.indexOf('linkedin') > -1) {
    //         if(currentURL.indexOf('/in/') > -1 || currentURL.indexOf('/profile') > -1) {
    //           myAppPopup.getSingleProfileInfo(account,"LN");
    //         } else if(currentURL.indexOf('sales/people/') > -1 ){
    //           myAppPopup.getSingleProfileInfo(account,"SN");
    //         } else {
    //           myAppPopup.renderPopup('use_button');
    //         }            
    //       } else {
    //         myAppPopup.renderPopup('error_usage');
    //       }
    //     } else {
    //       myAppPopup.renderPopup('error_usage');
    //     }
    //   });

    // });
    //});

  },
  /* 
  * Function : addEvents() 
  * Description:  Define click event for modals.
  */
  addEvents:function() {

    $(document).on('click','button#add-Lead-btn',function (e) {
      e.preventDefault();
      myAppPopup.renderPopup('loader');
      myAppPopup.addLeadToBuffer().then((addLeadToBuffer_res) => {
        console.log('addLeadToBuffer response >> ', addLeadToBuffer_res);
        if (addLeadToBuffer_res && addLeadToBuffer_res.saved == true) {
          myAppPopup.renderPopup('lead_saved', {
            email  : "",
          });          
        } else {
          myAppPopup.renderPopup('error');  
        }
      }).catch( err => {
        myAppPopup.renderPopup('error');
      });
    });

    $(document).on('click','button#get-email-btn',function (e) {
      e.preventDefault();
      myAppPopup.renderPopup('loader');
      myAppPopup.getLeadEmail().then((getLeadEmail_res) => {
        console.log('getLeadEmail response >> ', getLeadEmail_res);
        var found_email = "";
        try{
          var res_obj = JSON.parse(getLeadEmail_res);
          if (res_obj && res_obj.email && res_obj.email != "") {
            found_email = res_obj.email;
          }
        }catch(e){
          found_email = "";
        }
        myAppPopup.renderPopup('get_email_status', {
          email  : found_email,
        })
      }).catch( err => {
        myAppPopup.renderPopup('error');
      });
    });

    $(document).on('click','button#go-to-list-btn',function (e) {
      e.preventDefault();
      myAppPopup.renderPopup('loader');
      myAppPopup.goToList().then((goToList_res) => {
        console.log('getLeadEmail response >> ', goToList_res);
        var redirect_url = "";
        try{
          var res_obj = JSON.parse(goToList_res.res || "{}" );
          if (res_obj && res_obj.redirect && res_obj.redirect != "") {
            redirect_url = res_obj.redirect;
          }
        }catch(e){
          redirect_url = "";
        }
        myAppPopup.renderPopup('go_to_list', {
          saved_leads_count  : (goToList_res.saved_leads_count) ? goToList_res.saved_leads_count : 0,
          redirect_url : redirect_url
        });
      }).catch( err => {
        myAppPopup.renderPopup('error');
      });
    });

  },
 /*CheckLinkedinSession:function(){
  return new Promise((resolve, reject) => {
     chrome.cookies.get({url: 'https://www.linkedin.com/', name: 'liap'}, function(cookie) {
      if (cookie!=null) {
        resolve(true)
      } else {
         myAppPopup.renderPopup('linkedinLogin');
      }
    });
  });
} ,*/ 
initLangMessages : function(){

  $('#extraction_failed').text(messagesObj.get('extraction_failed')); 
  $('#leads_saved_text').html(messagesObj.get('leads_saved')+'<a class="list_url" href="'+consts.list_url+'" target="_blank"><span class="listName"></span></a>');
  $('.linkedin_info').text(messagesObj.get('linkedin_info'));
  $('.email-not-found span').text(messagesObj.get('email_not_found'));
  $('.email-found span').text(messagesObj.get('email_found'));
  $('.list-not-found span').text(messagesObj.get('list_not_found'));
  //$('#saveLead').text(messagesObj.get('save'));
  $('#add-Lead-text').text(messagesObj.get('add_Lead'));
  $('#get-email-text').text(messagesObj.get('get_email'));
  $('#go-to-list-text').text(messagesObj.get('go_to_list'));
  $('.ext_info').html(messagesObj.get('ext_info')+' <b><a class="text-info" href="https://www.linkedin.com" target="_blank">Linkedin.com</  a></b>');  

},

checkLoginAuth:function(proceed){ 
  /* Check Auth */

  myAppPopup.renderPopup('loader');
  sendMessage({
    command : 'getAccount'
  }, function(acc) {
    if(acc && acc.name)  {
      $('.popup-footer .name').html(acc.name + ' <t> | </t> ' + '<a class="text-info" href="'+consts.app_url+'" target="_blank">'+messagesObj.get('goto_dashboard')+'</a>');
      $('.popup-footer p').show();
      $('.popup-footer .credit').html(acc.credit.email.used + '/' + acc.credit.email.quota);
      $('#loader').hide();
      proceed(acc);
    } else {
      // Not logged in
      myAppPopup.renderPopup('login');
      $('.popup-footer').hide();
      $('.info').css('margin-top', '19%');
    }
  }); 

},
check_credit: function() {    
  var credit = myAppPopup.current.account.credit.email;
  if(credit.quota == 0 && myAppPopup.current.account.package == "Free Package") {
    return true;
  }  
  return parseInt(credit.quota) > parseInt(credit.used);
},
initCurrentAuth: function (account) {    
  myAppPopup.current.account = {
    credit: account.credit,
    package: account.package
  }; 
},
getSingleProfileInfo:function(account,search_type){
  myAppPopup.renderPopup('loader');
  myAppPopup.getProfilePreviewData(account,search_type).then((response) => {
    console.log(response);
    myAppPopup.profile_data_arr = [];
    if (response && response.p_data) {
      myAppPopup.profile_data_arr.push(response.p_data);
      myAppPopup.renderPopup('profile_data',response.p_data,account);
    } else {

    }
  }).catch( err => {
    myAppPopup.renderPopup('error');
  });
},
getLeadEmail:function(){
  return new Promise(function (resolve, reject) {
    var LinkedinUrl, elog;
    var leads = [];
    if (myAppPopup.profile_data_arr && myAppPopup.profile_data_arr.length > 0) {      
      var current_profile_id = "";
      var p_url = myAppPopup.profile_data_arr[0].linkedinUrl;
      var p_id = p_url.replace('https://www.linkedin.com/in/', '').replace('/', '');      
      sendMessage({
        command  : 'getLeadEmail',
        p_id   : p_id,
      }, function(response) {
        if(response && response != "") resolve(response);
        else reject(true);
      });
    } else {
      reject();
    }
  });
},
goToList:function(){
  return new Promise(function (resolve, reject) {
    sendMessage({
      command  : 'goToList',      
    }, function(response) {
      if(response && response != "") resolve(response);
      else reject(true);
    });
  });
},
addLeadToBuffer:function(){ 
  return new Promise(function (resolve, reject) {
    var LinkedinUrl, elog;
    var leads = [];
    if (myAppPopup.profile_data_arr && myAppPopup.profile_data_arr.length > 0) {    
      var current_profile_id = "";
      var p_url = myAppPopup.profile_data_arr[0].linkedinUrl;
      var p_id = p_url.replace('https://www.linkedin.com/in/', '').replace('/', '');      
      sendMessage({
        command  : 'addLeadToBuffer',
        p_id   : p_id,
      }, function(response) {
        if(response && response != "") resolve(response);
        else reject(true);
      });
    } else {
      reject();
    }
  });
},
getProfilePreviewData:function(account,search_type){
  return new Promise(function (resolve, reject) {
    sendMessageActiveTab({"command": 'getProfilePreviewData','search_type' : search_type}, function(p_data) {
      if (p_data) {
        resolve(p_data);
      } else {
        reject();
      }
    });    
  });

},
renderPopup:function(viewId,profile_data,account){
  $('.popup-body .row').hide();
  var $currentView = $('.popup-body #'+viewId);
  $currentView.show();

  if (viewId == 'profile_data') {
    if (profile_data.fullName && profile_data.fullName !== '') {
      $currentView.find('p.name').text(profile_data.fullName);
    } else {
      $currentView.find('p.name').text(profile_data.firstName +' '+profile_data.lastName);
    }
    if (profile_data.title) {
      $currentView.find('p.title').text(profile_data.title);
    } else {
      $currentView.find('p.title').hide();
    }
    if (profile_data.company) {
      $currentView.find('p.company').text(profile_data.company);
    } else {
      $currentView.find('p.company').hide();
    }
    if (profile_data.location) {
      $currentView.find('p.location').text(profile_data.location);
    } else {
      $currentView.find('p.location').hide();
    }

    if (profile_data.imgUrl && profile_data.imgUrl !== '') {
      $currentView.find('img.imgUrl').show();
      $currentView.find('img.imgUrl').attr('src',profile_data.imgUrl);
    } else {
      $currentView.find('img.imgUrl').hide();
    }

    //if (profile_data.email && profile_data.email !== '') {
      // if (profile_data.email_arr.length > 0) {
      //   $currentView.find('.email-info p.email-not-found').hide();
      //   $currentView.find('.email-info p.email-found').show();
      //   for (var i = 0; i < profile_data.email_arr.length; i++) {          
      //     $currentView.find('.email-info p.email-found').append('<a class="text-success" id="p-email" href="mailto:'+profile_data.email_arr[i]+'"><i class="fa fa-envelope"></i> '+profile_data.email_arr[i]+'</a><br>');
      //   }
      // } else {
      //   $currentView.find('.email-info p.email-not-found').show();
      //   $currentView.find('.email-info p.email-found').hide();
      //   $currentView.find('.email-info p.email-found span').text('');
      // }
      // $currentView.find('.list-item-area').html('');
      /*if (account && account.lists && account.lists.length > 0) {
        var $itemList = $('<div class="form-group"><select class="form-control" name="list_name"></select> <span class="help-block"> </span></div>');
        $currentView.find('.list-item-area').html($itemList);
        var option = '';
        for(var i = 0; i < account.lists.length; i++) {
          if (account.lists[i].name != '') {
            option += '<option value="'+ account.lists[i].id +'"> '+ account.lists[i].name +' </option>';
          }
        }
        $itemList.find('select[name="list_name"]').append(option);
      } else {
        $currentView.find('.list-item-area').html('<div class="form-group"> <input type="text" class="form-control" name="list_name" id="list_name" placeholder="+ '+messagesObj.get('created_list')+'"> <span class="help-block"> </span> </div>');
      }*/
    } else if (viewId == 'get_email_status') {
      viewId = "profile_data";
      $currentView = $('.popup-body #'+viewId);
      $currentView.show();
      if (profile_data.email != undefined && profile_data.email != "") {
        $currentView.find('.email-info p.email-not-found').hide();
        $currentView.find('.email-info p.email-found').show();
        $currentView.find('.email-info p.email-found').append('<a class="text-success" id="p-email" href="mailto:'+profile_data.email+'"><i class="fa fa-envelope"></i> '+profile_data.email+'</a><br>');
      } else {
        $currentView.find('.email-info p.email-not-found').show();
        $currentView.find('.email-info p.email-found').hide();
        $currentView.find('.email-info p.email-found span').text('');
      }
    } else if (viewId == 'lead_saved') {

      if (profile_data) {
        $currentView.find('a.list_url').attr('href',profile_data.list_url);
        $currentView.find('span.listName').text(profile_data.listName);
      }

    } else if (viewId == 'go_to_list') {
      viewId = "profile_data";
      $currentView = $('.popup-body #'+viewId);
      $currentView.show();

      if (profile_data.saved_leads_count > 0 ) {
        if (profile_data.redirect_url != "") {
          chrome.tabs.create({ url : profile_data.redirect_url, active : true});
          $currentView.find('.go-to-list-info p.list-not-found').hide();
        } else {
          $currentView.find('.go-to-list-info p.list-not-found').show();
        }        
      } else {
        $currentView.find('.go-to-list-info p.list-not-found').show();
      }

    } else if(viewId == 'linkedinLogin'){
      $currentView.find('.info').html('<div class="row text-center" id="login_section">' +
        '<p> '+messagesObj.get('login_invite_ln')+'. </br><a target="_blank" href="https://www.linkedin.com/"> '+messagesObj.get('login')+' </a></p>' +
        '</div>');

    }
  }

};


/* 
* function : sendMessage()  
* parameters:  (msg, callbackfn)
  * msg:Contains json data as parameters for send.
  * callbackfn: Contains sender object including tab id.
* description:  send Message to another script.
*/
function sendMessage(msg, callbackfn) {
	if(callbackfn!=null) {
		msg.callback = "yes";
	}
	chrome.runtime.sendMessage(msg,callbackfn);
}

/* 
* function : sendMessageActiveTab()  
* parameters:  (msg, callbackfn)
  * msg:Contains json data as parameters for send
  * callbackfn:Contains sender object including tab id
* description:  send Message to another script.
*/
function sendMessageActiveTab(msg, callbackfn) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, msg, callbackfn);
  });
}

/* 
* function : handleMessage()  
* parameters:  (message, sender)
  * message :Contains json data as parameters for send.
  * sender : Contains sender object including tab id.
* description:  Receive and handle chrome extension runtime Message from another script.
*/
function handleMessage(message, sender) {
	switch (message.command) {
		case "rec_getSettings":
		myAppPopup.uiSettings  = message.data.uiSettings;
		break;    
	}  
	if(typeof(message.data)!="undefined") {
		if(typeof(message.data.callback)!="undefined" && message.data.callback=="yes") {
			callback();
			callback = null;
		}
	}
}
