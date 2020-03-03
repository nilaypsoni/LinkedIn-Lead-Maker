var callback=[];
var collect_data_array = [];
var collect_full_data_array = [];

var myContentPage = {
  search_type : "",
  current : {
    lists : [],
    account : {},
  },
  load:function(){    
    var pathname = window.location.pathname;
    var hostname = window.location.hostname;
    if (hostname.indexOf("linkedin") !=-1) {

      /* Check lineind Search page or sales Search page */
      if(pathname.indexOf("sales/search/") != -1) {
        myContentPage.search_type = "SN";
      } else if(pathname.indexOf("search/results/") != -1) {
        myContentPage.search_type = "LN";
      } else {
        $('.export-page-result-divArea').remove();
        $("#export-result-popup").remove();
        return false;
      }
    }
  },
  onExtMessage: function(message, sender, sendResponse){ 
    myContentPage.message = message;
    switch (message.command) {      
      case "rec_LoadExtension":
      myContentPage.load();
      break;          
      case "restorePopupBG":
      myContentPage.restorePopupBG(message, sender, sendResponse);
      break;
      case "getProfilePreviewData":
      myContentPage.getProfilePreviewData(message, sender, sendResponse);
      break;
      case "getSearchProfileData":
      myContentPage.getSearchProfileData(message, sender, sendResponse);      
      break;
      case "hideExportResultPopup":
      myContentPage.hidePopup();
      break; 
    }
    return true;
  },
  sliderInit:function(){
    var $rangeslider = $('#js-amount-range');
    var $amount = $('#remaining');
    $rangeslider
    .rangeslider({
      polyfill: false
    })
    .on('input', function() {
      $amount[0].value = this.value;
    });

    $amount.on('input', function() {
      $rangeslider.val(this.value).change();
    });
  },
  addEvents: function(message, sender, sendResponse){

  },

  clickNextPage: function(done) {
    if (myContentPage.search_type == "LN") {

      var interval;  
      var url = window.location.href;

      if($('button.next').length == 0 && $('button.artdeco-pagination__button--next').length == 0) {
        done(false);
        return;
      }

      if($('button.next').attr('disabled') == "disabled") {
        done(false);
        return;
      } 
      if($('button.artdeco-pagination__button--next').attr('disabled') == "disabled") {
        done(false);
        return;
      }

      if($('button.next').length > 0) {
        $('button.next').click();
      } else { 
        $('button.artdeco-pagination__button--next').click();
      }
      setTimeout(function(){
        interval = setInterval(function(){
          if(!!$('.search-result--person').length && !$('.search-is-loading').length) {
            clearInterval(interval);
            setTimeout(function(){
              done(true);
            }, 720);
          }
        }, 100);
      }, 300);

    } else if (myContentPage.search_type == "SN") {
          // Only LSN
          var $pagination  = $('.search-results__result-item').first().length > 0 ? '.search-results__pagination-next-button' : '.next-pagination';
          if($($pagination).length == 0) {
            done(false);
            return;
          }
          if($($pagination).attr('disabled') == "disabled") {
            done(false);
            return;
          }
          var pagcond;
          $($pagination)[0].click();
          setTimeout(function() { 
            var interval = setInterval(function() {
              pagcond = $('.search-results__results-loader.hidden').length > 0 || $('.search-results__results-loader').length == 0;
              if(pagcond) {
                clearInterval(interval);
                setTimeout(function(){
                  done(true);
                }, 720);
              }
            }, 100);
          }, 700);
        }

      },      
      getProfilePreviewData: function(message, sender, sendResponse) {
        myContentPage.search_type = message.search_type;
        /* Check Linkedin profile page is loaded */
        if(myContentPage.search_type == "LN" && ($('.pv-top-card-section__name').length == 0 && $('.pv-profile-wrapper').length == 0)){
          sendResponse();
          return;
        } else if(myContentPage.search_type == "SN" && $('.profile-topcard-person-entity__content').length == 0){
          sendResponse();
          return;
        }
        /* End Check Linkedin profile page is loaded */

        //$("html, body").animate({ scrollTop: $(document).height() });
        //$("html, body").animate({ scrollTop: 0 });   
        setTimeout(function(){

          var p_object = myContentPage.getSingleProfileViewData();

          if (myContentPage.search_type == "LN" && $('.artdeco-modal__dismiss').length > 0 ) {
            $('.artdeco-modal__dismiss')[0].click();
          }

          console.log(p_object);
          sendResponse({p_data : p_object});     
        },1200);      
      },      
      getSearchProfileData: function(message, sender, sendResponse)  {
        myContentPage.search_type = message.search_type;
        myContentPage.getPageResultsContent().then((profiles_arr) => { 
          console.log('profiles_arr >> ', profiles_arr.results);
          sendResponse({profiles_arr : profiles_arr.results});
        });
        /*myContentPage.simuScroll();
        setTimeout(function(){
          myContentPage.getPageResultsContent().then((profiles_arr) => { 
            console.log('profiles_arr >> ', profiles_arr.results);
            sendResponse({profiles_arr : profiles_arr.results});
          });
        }, 4000);*/
      },
      getPageResultsContent: function()  {
        return new Promise(function (resolve, reject) {
          var results = new Array;
          if (myContentPage.search_type == "LN") {
            var $profile_selector = $('.search-result--person');
            $profile_selector.each(function() {
              var url, title, imgUrl, name, oname, fname, lname,location_text,company,account = "Regular";
              url = $(this).find('a.search-result__result-link').attr('href') || '';
              imgUrl = $(this).find('.search-result__image').first().find('.visually-hidden').first().parent().css('background-image');
              if (imgUrl == "" || imgUrl == "none" || $(this).find('.search-result__image').find('img').length > 0) {
                imgUrl = $(this).find('.search-result__image').find('img').attr('src');
              }  
              name = $(this).find('.actor-name').html() || '';
              title = $(this).find('.subline-level-1').text().trim();
              location_text = $(this).find('.subline-level-2').text().trim();
              oname = name.split(' ');
              fname = oname[0];
              oname.shift();
              lname = oname.join(' ');
              var title_2 = $(this).find('.search-result__snippets').text().trim();
              var title_3 = $(this).find('.search-result__snippets-black').text().trim();

              if ($(this).find('li-icon[type="linkedin-bug"][color="premium"]').length > 0) {
                account = "premium";
              }
              var company = "";
              if (title.indexOf(" at ") != -1) {
                company = title.split(" at ")[1].trim();
              } else if (title_2.indexOf(" at ") != -1) {
                company = title_2.split(" at ")[1];
              } else if (title.indexOf(" At ") != -1) {
                company = title.split(" At ")[1].trim();
              } else if (title_2.indexOf(" At ") != -1) {
                company = title_2.split(" At ")[1];
              } else if (title_3.indexOf(" at ") != -1) {
                company = title_3.split(" at ")[1].trim();
              } else if (title_3.indexOf(" At ") != -1) {
                company = title_3.split(" At ")[1];
              }               
              if(imgUrl && imgUrl.indexOf('static') > -1) imgUrl = null;

              results.push({
                firstName   : fname,
                lastName    : lname,
                fullName    : name,
                title    : title,
                location    : location_text,
                linkedinUrl : "https://www.linkedin.com"+url,
                account : account,
                company : company,
                email: '',
                domain: '',
                imgUrl      : imgUrl || '',
                searchDivID      : $(this).attr('id')
              });
            });

          } else if (myContentPage.search_type == "SN") {

            $profile_selector = $('.search-results__result-item');
            $profile_selector.each(function(){

              var url, imgUrl, name, oname, fname, lname, title, company, companyUrl, location, mcpu, fline, s_title, s_company;

              url = $(this).find('a').first().attr('href') || '';
              name = $(this).find('.result-lockup__name').text().trim() || '';
              imgUrl = $(this).find('a.result-lockup__icon-link').find('img').attr('src') || $(this).find('img').attr('src') || '';

              oname = name.split(' ');
              fname = oname[0];
              oname.shift();
              lname = oname.join(' ');

              if(imgUrl && imgUrl !== '')
                if(imgUrl && (imgUrl.indexOf('ghosts') > -1 ||  imgUrl.indexOf('spacer') > -1  || imgUrl.indexOf('data') > -1 || imgUrl.indexOf('chrome-extension') > -1))
                  imgUrl = null;

                if(url && url.charAt(0) == '/') url = url.substring(1);

                fline = $($(this).find('dd')[1]);

                company    = fline.find('a').text().trim();
                companyUrl = fline.find('a').attr('href');

                fline.find('a').remove();

                title      = fline.find('span').text().trim();
                location   = $($(this).find('dd')[3]).text().trim();

                if(companyUrl && companyUrl !== '' && companyUrl.indexOf('sales/company') > -1) {
                  mcpu = companyUrl.split('/');
                  if(mcpu && mcpu.length > 0) companyUrl = consts.linkedin_company_path + mcpu[mcpu.length - 1];
                } 
                var premium_account = "Regular";
                var open_profile = "Private";
                var $align_items = $(this).find('ul.list-style-none li');
                if ($align_items.find('li-icon[type="linkedin-bug"][color="premium"]').length > 0) {
                  premium_account = "premium";
                } 

                s_company = company.split('\n');
                company   = s_company[0];
                s_title   = title.split('\n');
                title     = s_title[0];

                results.push({
                  firstName  : fname,
                  lastName   : lname,
                  fullName    : name,
                  account : premium_account,
                  email: '',
                  domain: '',
                  linkedinUrl : "https://www.linkedin.com/" + url,
                  imgUrl     : imgUrl || '',
                  title      : title,
                  company    : company,
                  companyUrl : companyUrl,
                  location   : location,
                  searchDivID      : $(this).attr('id')
                });
              });

          } else if (myContentPage.search_type == "FC") {
            var $profile_selector = $('.mn-connections .mn-connection-card');
            $profile_selector.each(function() {
              var url, title, imgUrl, name, oname, fname, lname,location_text,company,account = "Regular";
              url = $(this).find('a.mn-connection-card__link').attr('href') || '';
              imgUrl = $(this).find('img.presence-entity__image').attr('src');
              name = $(this).find('.mn-connection-card__name').text().trim() || '';
              title = $(this).find('.mn-connection-card__occupation').text().trim();
              location_text = "";
              oname = name.split(' ');
              fname = oname[0];
              oname.shift();
              lname = oname.join(' ');
              var title_2 = "";
              var title_3 = "";
              var company = "";
              if (title.indexOf(" at ") != -1) {
                company = title.split(" at ")[1].trim();
              } else if (title_2.indexOf(" at ") != -1) {
                company = title_2.split(" at ")[1];
              } else if (title.indexOf(" At ") != -1) {
                company = title.split(" At ")[1].trim();
              } else if (title_2.indexOf(" At ") != -1) {
                company = title_2.split(" At ")[1];
              } else if (title_3.indexOf(" at ") != -1) {
                company = title_3.split(" at ")[1].trim();
              } else if (title_3.indexOf(" At ") != -1) {
                company = title_3.split(" At ")[1];
              }               
              if(imgUrl && imgUrl.indexOf('static') > -1) imgUrl = null;

              results.push({
                firstName   : fname,
                lastName    : lname,
                fullName    : name,
                title    : title,
                location    : location_text,
                linkedinUrl : "https://www.linkedin.com"+url,
                account : account,
                company : company,
                email: '',
                domain: '',
                imgUrl      : imgUrl || '',
                searchDivID      : $(this).attr('id')
              });
            });

          }

          resolve({results:results});
        });
},
getSingleProfileViewData: function() {
  var row = {};
  row.ignore = {};
  row.email = '';
  row.domain = '';
  row.email_arr = [];
  row.current_companies = [];
  row.domain_arr = [];
  if (myContentPage.search_type == "LN") {

    try {
      row.fullName = $('.pv-top-card-section__name').text().trim();
      if (!row.fullName) {
        row.fullName = $('ul.pv-top-card-v3--list.inline-flex.align-items-center > li.inline.t-normal.break-words').text().trim();
      }
      if (!row.fullName) {
        row.fullName = $('.pv-top-card--list > li.inline.t-normal.break-words').text().trim();
      }              
      var oname = row.fullName.split(' ');
      var firstName = oname[0];
      oname.shift();
      var lastName = oname.join(' ');
      if (row.firstName == undefined) 
        row.firstName = firstName;
      if (row.lastName == undefined) 
        row.lastName = lastName;

      if($('.pv-top-card-section__image').attr('src')){
        imgUrl = $('.pv-top-card-section__image').attr('src');
      } else {
        imgUrl = ($('.pv-top-card-section__photo').css('background-image') || $('.profile-photo-edit__preview').attr('src') || '').replace('url("', '').replace('")', '');
      }
      if (!imgUrl || imgUrl == "none") {
        imgUrl = $('.pv-top-card-section__photo.presence-entity__image').attr('src');
      }
      if (!imgUrl || imgUrl == "none") {
        imgUrl = $('.pv-top-card__photo.presence-entity__image').attr('src');
      }
      row.imgUrl = imgUrl
    } catch (e) {
      console.error('Error while parsing fullname');
    }
    try {
      var companyUrl = $($('a[data-control-name="background_details_company"')[0]).attr('href');
      if (companyUrl && companyUrl != undefined) {
        row.companyUrl = companyUrl;
        row.ignore.companyUrl = row.companyUrl;                
      } 
    } catch (e) {
      console.error('Error while parsing company url');
    }

    try {
      var location_text = $('h3.pv-top-card-section__location').first().text().trim();
      if (location_text && location_text != undefined) {
        row.location = location_text;
      }
      if (location_text == "") {
        location_text = $('ul.pv-top-card-v3--list.pv-top-card-v3--list-bullet.mt1 > li.t-normal.inline-block').first().text().trim();
        row.location = location_text;
      }
      if (location_text == "") {
        location_text = $('ul.pv-top-card--list.pv-top-card--list-bullet.mt1 > li.t-normal.inline-block').first().text().trim();
        row.location = location_text;
      }
    } catch (e) {
      console.error('Error parsing location');
      row.location = '';
    }

    var companies_arr = [];              
    $('.pv-entity__position-group-pager').each(function(){
      if($(this).find('.pv-entity__date-range').length > 0 && String($(this).find('.pv-entity__date-range').text()).indexOf("Present") != -1){
        if ($(this).find('.lt-line-clamp__more').length > 0) {
          $(this).find('.lt-line-clamp__more')[0].click();
        }
        var companyUrl = $(this).find('a[data-control-name="background_details_company"]').attr('href') || "";
        var companyName = $(this).find('.pv-entity__secondary-title').text().trim() || "";
        if (companyName == "") {
          companyName = $(this).find('.pv-entity__company-summary-info span:eq(1)').text().trim() || "";
        }
        var companyTitle = $(this).find('.pv-entity__summary-info h3').first().text().trim();
        var companyDescription = $(this).find('.pv-entity__description').text().trim() || "";
        if (companyDescription == "") {
          companyDescription = $(this).find('.pv-entity__extra-details').text().trim() || "";
        }
        var companyAddress = $(this).find('.pv-entity__location span:eq(1)').text().trim() || "";
        if (companyName) {
          companies_arr.push({
            companyName : companyName || "",
            description : companyDescription || "",
            title : companyTitle || "",
            companyUrl : companyUrl || "" ,
            companyAddress : companyAddress || "" ,
          });
        }                  
        /* Parse email fomr company details*/
        if (companyDescription) {
          row.email_arr = myContentPage.search_emails(companyDescription, row.email_arr,'DOM');
        }
      }
    });

    row.current_companies = companies_arr;

    try {
      var fpos = $($('.pv-entity__position-group-pager')[0]);
      if(fpos.find('.pv-entity__summary-info-v2').length > 0) {
        var company_text =  $(fpos.find('.pv-entity__company-summary-info h3 span')[1]).text().trim();
      } else {
        var company_text =  $($('.pv-position-entity .pv-entity__summary-info h4').first().find('span')[1]).text().trim();
      }
      if (!company_text) {
        company_text =  $('.pv-top-card--experience-list-item:eq(0)').text().trim();
      }
      if (company_text && company_text != undefined) {
        row.company = company_text;
      }
    } catch(e) {
      console.error('Error parsing company');
      row.company =  '';
    } 

    try {
      var fpos = $($('.pv-entity__position-group-pager')[0]);
      if (fpos.find('.pv-entity__summary-info-v2').length > 0) {
        var title_text = $(fpos.find('.pv-entity__summary-info-v2 h3 span')[1]).text().trim();
      } else {
        var title_text = $('.pv-position-entity .pv-entity__summary-info h3').first().text().trim();
      }
      if (!title_text) {
        title_text =  $('h2.mt1.t-black.t-normal:eq(0)').text().trim();
      }
      if (title_text && title_text != undefined) {
        row.title = title_text;
      }
    } catch (e) {
      console.error('Error parsing title');
      row.title = '';
    }

    var emailSN;
    $('.pv-contact-info__contact-link').each(function () {
      var link = $(this).attr('href');
      if (String(link).indexOf('mailto') > -1) {
        emailSN = String(link).split('mailto:')[1];
        return false;
      }
    });

    if (emailSN){
      row.email = emailSN;
      row.email_arr = myContentPage.search_emails(emailSN, row.email_arr,'DOM');
    } else {
      var e = $("code:contains('emailAddress')").html(),obje;
      try {
        obje = JSON.parse(e);
      } catch(e) {                  
      }
      if (obje) {
        row.email = obje && obje.data && obje.data.emailAddress ? obje.data.emailAddress : null;
        if (row.email) {
          row.email_arr = myContentPage.search_emails(row.email, row.email_arr,'DOM');
        }
      }
    }

    /*Find domain */
    var website_url = $('.pv-contact-info__contact-type.ci-websites .pv-contact-info__contact-link:eq(0)').text().trim();
    if (website_url){
      row.domain = website_url;                
    } else {
      row.domain = "";
    }

    if (row.domain) {
      row.domain = row.domain || '';
      row.domain = row.domain.replace("http://www.","");
      row.domain = row.domain.replace("https://www.","");
      row.domain = row.domain.replace("www.","");
      row.domain_arr = myContentPage.push_domains_arr(row.domain,"",row.domain_arr);
    }
    if (window.location.href.indexOf('?') != -1) {
      row.linkedinUrl = window.location.href.split('?')[0];
    } else {
      row.linkedinUrl = window.location.href;
    }

  } else if (myContentPage.search_type == "SN") {

    row.fullName = $('.profile-topcard-person-entity__content').find('span').first().text().trim();
    var oname = row.fullName.split(' ');
    var firstName = oname[0];
    oname.shift();
    var lastName = oname.join(' ');
    if (row.firstName == undefined) 
      row.firstName = firstName;
    if (row.lastName == undefined) 
      row.lastName = lastName;

    companyIdSN = $('.profile-position__secondary-title').first().find('a').attr('href') || '';
    companyIdSN = companyIdSN.split('/');
    companyIdSN = companyIdSN[companyIdSN.length - 1];
    row.companyUrl = consts.linkedin_company_path + companyIdSN;
    row.ignore.companyUrl = row.companyUrl;
    var emailSN;
    $('.profile-topcard__contact-info-item-link').each(function () {
      var link = $(this).attr('href');
      if (String(link).indexOf('mailto') > -1) {
        emailSN = String(link).split('mailto:')[1];
        return false;
      }
    });

    if (emailSN){
      row.email = emailSN;
      row.email_arr = myContentPage.search_emails(emailSN, row.email_arr,'DOM');
    }

    var imgUrl = '';
    if($('.profile-topcard-person-entity__image img').attr('src')){
      imgUrl = $('.profile-topcard-person-entity__image img').attr('src');
    } else {
      imgUrl = ($('.pv-top-card-section__photo').css('background-image') || $('.profile-photo-edit__preview').attr('src') || '').replace('url("', '').replace('")', '');
    }
    if (!imgUrl) {
      imgUrl = $('.background-transparent img').attr('src');
    }              
    row.imgUrl = imgUrl;

    if ($('.profile-topcard__location-data').length > 0) {
      var location_text =  $('.profile-topcard__location-data').text().trim();
    } else {
      var location_text =  $('.info-container .location') ? $('.info-container .location').html() : '';
    }
    if (location_text && location_text != undefined) {
      row.location = location_text;
    }
    if ($('.profile-position__secondary-title').length > 0) {
      var company_text =  $('.profile-position__secondary-title').first().find('span').last().text().trim();
    } else {
      company = $('.company-name').first();
      if (company)
        var company_text =  company.text() || '';
    }
    if (company_text && company_text != undefined) {
      row.company = company_text;
    }
    if ($('.profile-position__title').length > 0) {
      var title_text = $('.profile-position__title').first().text().trim();
    } else {
      var title_text = $('.position-title').first().html() ? $('.position-title').first().html().trim() : '';
    }
    if (title_text && title_text != undefined) {
      row.title = title_text;
    }

    var companies_arr = [];
    $('#profile-experience li.profile-position').each(function(){
      if($(this).find('.profile-position__dates-employed').length > 0 && String($(this).find('.profile-position__dates-employed').text()).indexOf("Present") != -1){
        var companyUrl = "";
        var companyIdSN = $(this).find('.profile-position__secondary-title').first().find('a').attr('href') || "";
        companyIdSN = companyIdSN.split('/');
        companyIdSN = companyIdSN[companyIdSN.length - 1];
        if (companyIdSN) {
          companyUrl = consts.linkedin_company_path + companyIdSN;                    
        }
        var companyTitle = $(this).find('.profile-topcard__summary-position-title').text().trim() || "";
        var companyName = $(this).find('.profile-position__secondary-title').first().find('span').last().text().trim();
        var companyDescription = "";
        if (companyName) {
          companies_arr.push({
            companyName : companyName || "",
            description : companyDescription || "",
            title : companyTitle || "",
            companyUrl : companyUrl || "" ,
          });
        }
        /* Parse email fomr company details*/
        if (companyDescription) {
          row.email_arr = myContentPage.search_emails(companyDescription, row.email_arr,'DOM');
        }
      }
    });

    row.current_companies = companies_arr;

    if (window.location.href.indexOf('?') != -1) {
      row.linkedinUrl = window.location.href.split('?')[0];
    } else if (window.location.href.indexOf(',') != -1) {
      row.linkedinUrl = window.location.href.split(',')[0];
    } else  {
      row.linkedinUrl = window.location.href;
    }
  }
  return row;
},

get_campaign_dropdown:function(){ 
  var options = '<option value="0"> '+ messagesObj.get('provide_campaign') +' </option>';
  var lists = myContentPage.current.lists;
  for (var i = 0; i < lists.length; i++) {
    if (lists[i].name != "") {
      options += '<option value="'+lists[i].name+'"> '+lists[i].name+' </option>';
    }
  }
  return options;
},
simuScroll: function(message, sender, sendResponse){
  $('#export-result-popup').css('background', '#f5f5f5');
  $("html, body").animate({ scrollTop: $(document).height() },2000);
  setTimeout(function(){
    $("html, body").animate({ scrollTop: 0},2000);
  },2000);
},    
search_emails : function(input, emailsOld,from) {
  input = input || "";
  input = input.replace(/\s/ig, ' ') ;

  var emails = input.match(/\b[a-z\d-][_a-z\d-+]*(?:\.[_a-z\d-+]*)*@[a-z\d]+[a-z\d-]*(?:\.[a-z\d-]+)*(?:\.[a-z]{2,63})\b/gi);

  if (emails && (emails.length > 0)) {
    for (var iNo = 0; iNo < emails.length; iNo++) {
      if (emailsOld.indexOf(emails[iNo]['email']) == -1) {
        emailsOld.push({
          email : emails[iNo],
          from : from,
        });
      }
    }
  }

  return emailsOld;
},
push_domains_arr : function(domain_str,company_size, d_arr) {
  var domain_str = domain_str || "";
  var company_size = company_size || "";
  var domain_found = false;
  if (domain_str) {
    for (var iNo = 0; iNo < d_arr.length; iNo++) {
      if (domain_str == d_arr[iNo].domain) {
        d_arr[iNo].company_size = company_size;
        domain_found = true;
        break;
      }
    }
    if (domain_found == false) {
      d_arr.push({
        domain : domain_str,
        company_size : company_size
      });
    }
  }
  return d_arr;
},
parse_website_from_c_name: function(body) {  
  var domain = null;
  if(body) {
    domain = body.match(consts.domain_url_regex) ? body.match(consts.domain_url_regex)[0] : null;
  } 
  return domain; 
},
parse_headline_SN: function (headLine) {

  var parts, index, sep;
  headLine = headLine.replace(new RegExp(consts.tag_regex), '');

  for (var j = 0; j < consts.head_line_seps.length; j++) {
    index = headLine.indexOf(consts.head_line_seps[j]);
    if (index > 0 && headLine[index - 1] === ' ' && headLine[index + consts.head_line_seps[j].length] === ' ') {
      sep = consts.head_line_seps[j];
      break;
    }
  }

  parts = headLine.split(sep);

  return {
    company: parts[1] || '',
    title: parts[0]
  }
},
get_parameter_by_name: function(name,url) {  
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
  results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
},
update_query_string_parameter : function(uri, key, value) {
  var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
  var separator = uri.indexOf('?') !== -1 ? "&" : "?";
  if (uri.match(re)) {
    return uri.replace(re, '$1' + key + "=" + value + '$2');
  }
  else {
    return uri + separator + key + "=" + value;
  }
},
parse_query_string : function(queryString) {
  var params = {}, queries, temp, i, l;
  queries = queryString.replace('?', '&').split("&");
  for (i = 0, l = queries.length; i < l; i++) {
    temp = queries[i].split('=');
    params[temp[0]] = temp[1];
  }
  return params;
},
get_next_page_URL : function() {
  var params = myContentPage.parse_query_string(window.location.href);
  if (myContentPage.search_type == 'LN') {
    if (params.page) {
      parseInt(params.page++);
    }
    else {
      params.page = 2;
    }
    return myContentPage.update_query_string_parameter(window.location.href, 'page', params.page);
  } else if (myContentPage.search_type == 'SN') {
    if (params.page) {
      parseInt(params.page++);
    } else {
      params.page = 2;
    }
    return myContentPage.update_query_string_parameter(window.location.href, 'page', params.page);
  }
},    
convertHtmlToText : function(inputText) {
  var returnText = inputText;
  if (returnText) {

    returnText = returnText.replace(/<br>/gi, "\n");
    returnText = returnText.replace(/<br\s\/>/gi, "\n");
    returnText = returnText.replace(/<br\/>/gi, "\n");

    returnText = returnText.replace(/ +(?= )/g, '');

    returnText = returnText.replace(/&nbsp;/gi, ' ');
    returnText = returnText.replace(/&amp;/gi, '&');
    returnText = returnText.replace(/&quot;/gi, '"');
    returnText = returnText.replace(/&lt;/gi, '<');
    returnText = returnText.replace(/&gt;/gi, '>');

    returnText = returnText.replace(/<.*?>/gi, '');
    returnText = returnText.replace(/%20/gi, ' ');
  }

  return (returnText);
},
findDescrByRegEx : function(source, reg, html) {
  var sTemp = '';
  var fnd = source.match(reg);

  if ((fnd) && (fnd.length > 1)) {
    if (fnd[1]) {
      sTemp = fnd[1];
    } else {
      if (fnd[2]) {
        sTemp = fnd[2];
      }
    }

    sTemp = sTemp.trim();
    if (!html) {
      sTemp = myContentPage.convertHtmlToText(sTemp);
    }
    return sTemp;
  } else {
    return '';
  }
}
};

chrome.runtime.onMessage.addListener(myContentPage.onExtMessage);

$(document).ready(function(){
  setTimeout(function(){
  },1000);
  myContentPage.load();
  myContentPage.addEvents();
  window.addEventListener('message', function(event) { 
    if (~event.origin.indexOf('chrome-extension://')) {      
      $('#'+event.data.iframe).height(event.data.height+'px');
    } else { 
      return; 
    }
  });
});

function get(url, params, headers) {
  return Promise.resolve(
    $.ajax({
      url: url,
      type: "GET",
      data: params,
      headers: headers
    })
    );
}
var console_logs_myApp = function(title,msg){    
  console.log("%c "+title, "font-weight: bold");
  if(typeof(msg) == "object") {
    console.log("%c "+JSON.stringify(msg), 'color:#ce3e3e');
  } else {
    console.log("%c "+msg, 'color:#ce3e3e');
  }
};

function sendMessage(msg, callbackfn) {
  if(callbackfn!=null) {
    callback.push(callbackfn);
    msg.callback = "yes";
  }
  chrome.runtime.sendMessage(msg,callbackfn);
}
