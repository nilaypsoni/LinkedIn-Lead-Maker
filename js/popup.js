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
  search_profiles_arr:[],
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
          } else if(currentURL.indexOf('search/results/people') > -1 || currentURL.indexOf('search/results/all') > -1 ){
            myAppPopup.getSearchProfileInfo("","LN");
          } else if(currentURL.indexOf('sales/search/people') > -1 ){
            myAppPopup.getSearchProfileInfo("","SN");
          } else if(currentURL.indexOf('/mynetwork/invite-connect/connections/') > -1 ){
            myAppPopup.getSearchProfileInfo("","FC");
          } else {
            myAppPopup.renderPopup('use_button');
            $(".popup-footer").hide();
          }            
        } else {
          myAppPopup.renderPopup('error_usage');
          $(".popup-footer").hide();
        }
      } else {
        myAppPopup.renderPopup('error_usage');
        $(".popup-footer").hide();
      }
    });
  },
  /* 
  * Function : addEvents() 
  * Description:  Define click event for modals.
  */
  addEvents:function() {

   $("#addListModal").on('show.bs.modal', function(){
     $(".error-list-name,.success-list-name").text("");
     $("#list-name-input").val("");
   });

   $(document).on('click','button#back-btn',function (e) {
    e.preventDefault();
    if (myAppPopup.profile_data_arr.length > 0) {
      myAppPopup.renderPopup('profile_data',myAppPopup.profile_data_arr[0],{});
    } else {        
      myAppPopup.renderPopup('add_all_profile_list_seaction',myAppPopup.search_profiles_arr);
    }
  });

   $(document).on('click','a.campaign-list-item',function (e) {
    var list_name_val = $(this).text().trim();
    sendMessage({"command": "getSettings"},function(response){
      myAppPopup.uiSettings = response.uiSettings;
      var selected_campaign = list_name_val;
      myAppPopup.uiSettings.selected_campaign = selected_campaign;
      sendMessage({"command": "saveUISettings","data":myAppPopup.uiSettings },function(response){
        myAppPopup.renderCampaignLlist();
      });
    });
  });
   
   $(document).on('submit','#addListForm',function (e) {
    e.preventDefault();
    $("button#add-list-btn").click();
   });

   $(document).on('click','button#add-list-btn',function (e) {
    e.preventDefault();
    var list_name_val = $("#list-name-input").val().trim();
    $(".error-list-name,.success-list-name").text("");
    if (list_name_val.length > 0) {
      sendMessage({"command": "getSettings"},function(response){
        myAppPopup.uiSettings = response.uiSettings;
        var campaign_list = myAppPopup.uiSettings.campaign_list || ["My Contacts"];
        if (campaign_list.indexOf(list_name_val) == -1) {
          var selected_campaign = myAppPopup.uiSettings.selected_campaign || "My Contacts";
          campaign_list.push(list_name_val);
          myAppPopup.uiSettings.campaign_list = campaign_list;
          sendMessage({"command": "saveUISettings","data":myAppPopup.uiSettings },function(response){
            setTimeout(function(){
              $(".success-list-name").text("List added successfully");
              setTimeout(function(){
                $("#addListModal").modal("hide");
                myAppPopup.renderCampaignLlist();
              },1000);
            },200);
          });
        } else {
          $(".error-list-name,.success-list-name").text("");
          $(".error-list-name").text("List name already exist!");
        }
      });
    } else {
      $(".error-list-name").text("Please enter list name");
    }
  });

   $(document).on('click','button#add-all-lead-btn',function (e) {
    e.preventDefault();
    $("#add-all-lead-btn").prop('disabled',true);
    $(".profile-item").find('.add-single-lead-btn').prop('disabled',true);
    var status = messagesObj.get('saving_text');
    $(".profile-item").find('.profiles-status').addClass('text-warning').text(status);
    myAppPopup.addAllLeadToBuffer();
  });

   $(document).on('click','button.add-single-lead-btn',function (e) {
    e.preventDefault();
    $(this).prop('disabled',true);
    var data_index = $(this).closest('.profile-item').attr('data-index');
    var current_profile = myAppPopup.search_profiles_arr[data_index];
    var status = messagesObj.get('saving_text');
    $(".profile-item[data-index="+data_index+"]").find('.profiles-status').addClass('text-warning').text(status);
    myAppPopup.saveSingleAddLeadToBuffer(current_profile,data_index).then((add_res_obj) => {
      if (add_res_obj && add_res_obj.response && add_res_obj.response.saved == true) {
        $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').removeClass('text-warning');
        $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').addClass('text-success');
        $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').text(messagesObj.get('saved_text'));
      } else {
        $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').removeClass('text-warning');
        $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').addClass('text-danger');
        $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').text(messagesObj.get('error_text'));
      }
    });
  });

   $(document).on('click','button#add-Lead-btn',function (e) {
    e.preventDefault();
    myAppPopup.renderPopup('loader');
    myAppPopup.addLeadToBuffer().then((addLeadToBuffer_res) => {
      console.log('addLeadToBuffer response >> ', addLeadToBuffer_res);
      if (addLeadToBuffer_res && addLeadToBuffer_res.saved == true) {
        myAppPopup.renderPopup('lead_saved', 1);
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

renderCampaignLlist : function(){
  $("#campaign-list").html("");
  sendMessage({"command": "getSettings"},function(response){
    myAppPopup.uiSettings = response.uiSettings;
    var campaign_list_arr = myAppPopup.uiSettings.campaign_list || ["My Contacts"];
    var selected_campaign = myAppPopup.uiSettings.selected_campaign || "My Contacts";
    var campaign_list_html = "";
    for (var i2 = 0; i2 < campaign_list_arr.length; i2++) {      
      campaign_list_html += '<li role="menuitem">'+
      '<a href="#" class="campaign-list-item ' + ( selected_campaign == campaign_list_arr[i2] ? 'active' : '' ) + '"> ' + campaign_list_arr[i2] + '</a>'+
      '</li>';
    }
    campaign_list_html += '<li class="divider"></li>' +
    '<li role="menuitem"><a href="#"data-toggle="modal" data-target="#addListModal"><i class="fa fa-plus"></i> New List </a></li>';
    $("#campaign-list").html(campaign_list_html);
    $(".selected-campaign").html(selected_campaign);
  });
},
initLangMessages : function(){

  $('#extraction_failed').text(messagesObj.get('extraction_failed')); 
  $('#leads_saved_text').html(messagesObj.get('leads_saved'));
  $('.linkedin_info').text(messagesObj.get('linkedin_info'));
  $('.email-not-found span').text(messagesObj.get('email_not_found'));
  $('.email-found span').text(messagesObj.get('email_found'));
  $('.list-not-found span').text(messagesObj.get('list_not_found'));
  //$('#saveLead').text(messagesObj.get('save'));
  $('#add-Lead-text').text(messagesObj.get('add_Lead'));
  $('#add-all-lead-text').text(messagesObj.get('add_all_lead'));
  $('#my-contact-list-text').text(messagesObj.get('my_contact_list_text'));  
  $('#get-email-text').text(messagesObj.get('get_email'));
  $('#go-to-list-text').text(messagesObj.get('go_to_list'));
  $('.ext_info').html(messagesObj.get('ext_info')+' <b><a class="text-info" href="https://www.linkedin.com" target="_blank">Linkedin.com</  a></b>');  
  $('#back-btn-text').text(messagesObj.get('back_btn_text'));
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
      myAppPopup.renderCampaignLlist();
    } else {

    }
  }).catch( err => {
    myAppPopup.renderPopup('error');
  });
},
getSearchProfileInfo:function(account,search_type){
  myAppPopup.renderPopup('loader');
  //$("button#add-all-lead-btn").attr("search-type",search_type);
  myAppPopup.getSearchProfileData(search_type).then((response) => {
    console.log(response);
    if (response && response.profiles_arr && response.profiles_arr.length > 0) {
      myAppPopup.search_profiles_arr = response.profiles_arr;
      myAppPopup.renderPopup('add_all_profile_list_seaction',response.profiles_arr);
      myAppPopup.renderCampaignLlist();
    } else {

    }
  }).catch( err => {
    myAppPopup.renderPopup('error');
  });    
},
getLeadEmail:function(){
  return new Promise(function (resolve, reject) {    
    if (myAppPopup.profile_data_arr && myAppPopup.profile_data_arr.length > 0) {      
      var current_profile_id = "";
      var p_url = myAppPopup.profile_data_arr[0].linkedinUrl;
      var p_id = p_url.replace('https://www.linkedin.com/in/', '');    
      p_id = p_id.replace('https://www.linkedin.com/sales/people/', '');
      if (p_id.indexOf("?") != -1) {
        p_id = p_id.split("?")[0];
      }
      if (p_id.indexOf("/") != -1) {
        p_id = p_id.split("/")[0];
      }
      if (p_id.indexOf(",") != -1) {
        p_id = p_id.split(",")[0];
      }
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
addAllLeadToBuffer:function(profiles_arr){ 
  var allProfilesPromiseArr = [];
  var profiles_arr = myAppPopup.search_profiles_arr;
  for (var pi1 = 0; pi1 < profiles_arr.length; pi1++) {
   var current_profile = profiles_arr[pi1];
   allProfilesPromiseArr.push(
    new Promise(function (resolve, reject) {
      setTimeout(function(time_res){
        var current_profile = time_res.current_profile;
        var pi1 = time_res.pi1;
        myAppPopup.saveSingleAddLeadToBuffer(current_profile,pi1).then((add_res_obj) => {
          if (add_res_obj && add_res_obj.response && add_res_obj.response.saved == true) {
            $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').removeClass('text-warning');
            $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').addClass('text-success');
            $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').text(messagesObj.get('saved_text'));
          } else {
            $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').removeClass('text-warning');
            $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').addClass('text-danger');
            $(".profile-item[data-index="+add_res_obj.p_index+"]").find('.profiles-status').text(messagesObj.get('error_text'));
          }
          resolve(add_res_obj.response);
        });
      },(1000 * (pi1 + 1)),{current_profile,pi1});
    })
    );
 }
 Promise.all(allProfilesPromiseArr).then((doneProfilesPromiseArr) => {
  var total_saved_count = 0;
  for (var i2 = 0; i2 < doneProfilesPromiseArr.length; i2++) {      
    if (doneProfilesPromiseArr[i2] && doneProfilesPromiseArr[i2].saved == true) {
      total_saved_count = total_saved_count + 1;
    }
  }
  console.log('allProfilesPromiseArr >> ', allProfilesPromiseArr);
  console.log('allProfilesPromiseArr >> ', total_saved_count);
  setTimeout(function(){
    myAppPopup.renderPopup('lead_saved', total_saved_count);
    $("#add-all-lead-btn").prop('disabled',false);
  },500);
});
},
saveSingleAddLeadToBuffer : function(current_profile_obj,p_index){
  return new Promise(function (resolve, reject) {    
   var p_url = current_profile_obj.linkedinUrl;
   var p_id = p_url.replace('https://www.linkedin.com/in/', '');    
   p_id = p_id.replace('https://www.linkedin.com/sales/people/', '');
   if (p_id.indexOf("?") != -1) {
    p_id = p_id.split("?")[0];
  }
  if (p_id.indexOf("/") != -1) {
    p_id = p_id.split("/")[0];
  }
  if (p_id.indexOf(",") != -1) {
    p_id = p_id.split(",")[0];
  }
  sendMessage({
    command  : 'addLeadToBuffer',
    p_id   : p_id,
  }, function(response) {      
    resolve({response,p_index})
  });
});
},
addLeadToBuffer:function(){ 
  return new Promise(function (resolve, reject) {
    if (myAppPopup.profile_data_arr && myAppPopup.profile_data_arr.length > 0) {    
      var current_profile_id = "";
      var p_url = myAppPopup.profile_data_arr[0].linkedinUrl;
      var p_id = p_url.replace('https://www.linkedin.com/in/', '');    
      p_id = p_id.replace('https://www.linkedin.com/sales/people/', '');
      if (p_id.indexOf("?") != -1) {
        p_id = p_id.split("?")[0];
      }
      if (p_id.indexOf("/") != -1) {
        p_id = p_id.split("/")[0];
      }
      if (p_id.indexOf(",") != -1) {
        p_id = p_id.split(",")[0];
      }
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
getSearchProfileData:function(search_type){
  return new Promise(function (resolve, reject) {
    sendMessageActiveTab({"command": 'getSearchProfileData','search_type' : search_type}, function(p_data) {
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
    $("#add_all_profile_list_seaction").show();
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
      $currentView.find('.company-txt').text(profile_data.company);
    } else {
      $currentView.find('.company').hide();
    }
    if (profile_data.location) {
      $currentView.find('.location-txt').text(profile_data.location);
    } else {
      $currentView.find('p.location').hide();
    }


   if (profile_data.imgUrl && profile_data.imgUrl !== 'unknown') {
    var imgUrl = profile_data.imgUrl || "https://static-exp1.licdn.com/sc/h/djzv59yelk5urv2ujlazfyvrk";
    if (imgUrl && imgUrl.indexOf("data:image/gif;") != -1) {
     imgUrl = "https://static-exp1.licdn.com/sc/h/djzv59yelk5urv2ujlazfyvrk";
   }
    $currentView.find('img.imgUrl').show();
    $currentView.find('img.imgUrl').attr('src',imgUrl);
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
    } else if (viewId == 'add_all_profile_list_seaction') {
      var profiles_arr = profile_data;
      $currentView.find("#profiles-list").html("");
      var profiles_list_html = "";
      for (var pi = 0; pi < profiles_arr.length; pi++) {
        var fullName = profiles_arr[pi]['fullName'];
        var imgUrl = profiles_arr[pi]['imgUrl'] || "https://static-exp1.licdn.com/sc/h/djzv59yelk5urv2ujlazfyvrk";
        if (imgUrl && imgUrl.indexOf("data:image/gif;") != -1) {
         imgUrl = "https://static-exp1.licdn.com/sc/h/djzv59yelk5urv2ujlazfyvrk";
       }
       var location_str = profiles_arr[pi]['location'];
       var title = profiles_arr[pi]['title'];
       var company = profiles_arr[pi]['company'];
       var status = messagesObj.get('saving_text');
       if (fullName && fullName != "") {
        profiles_list_html += '<div class="row profile-item" data-index="'+ pi +'">'+
        '<div class="col-xs-2">'+
        '<img class="imgUrl" src="'+ imgUrl +'">'+
        '</div>'+
        '<div class="col-xs-6">'+
        '<div class="">'+
        '<p class="name">' + fullName +'</p>'+
        '<p class="title">' + title +'</p>';
        if (location_str && location_str != "") {
          profiles_list_html += '<p>'+
          '<i class="fa fa-map-marker"></i>'+ location_str + 
          '</p>';
        }
        if (company && company != "") {
          profiles_list_html += '<p>'+
          '<i class="fa fa-building"></i> '+ company +
          '</p>';
        }

        profiles_list_html += '</div>'+
        '<div class="email-info">'+
        '<p class="email-found text-success"> </p>'+
        '<p class="email-not-found text-danger"> <span>  </span></p>'+
        '</div>'+
        '<div class="go-to-list-info">'+
        '<p class="list-not-found text-danger" style="display: none;"> <span>  </span></p>'+
        '</div>'+
        '</div>'+
        '<div class="col-xs-4">'+
        '<button class="btn btn-info btn-block btn-blue add-single-lead-btn">'+
        '<i class="fa fa-user-plus"></i> Add'+ '</button>'+
        '<span class="profiles-status"> </span>' +
        '</div>'+
        '</div>'+
        '</div>';  
      }
    }
    $currentView.find("#profiles-list").html(profiles_list_html);      
    $currentView.find("#profiles-list").show();
  }    
  else if (viewId == 'get_email_status') {
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
    var total_saved_count = profile_data;
    $currentView.find('#leads_saved_text').text( total_saved_count +" "+ messagesObj.get('leads_saved'));
      /*if (profile_data) {
        $currentView.find('a.list_url').attr('href',profile_data.list_url);
        $currentView.find('span.listName').text(profile_data.listName);
      }*/
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
