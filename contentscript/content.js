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
      //  export page result btn
      window.onclick = function(event) {
        var export_result_popup = $('#export-result-popup');
        if ($(export_result_popup)[0] == event.target) {
          sendMessage({"command": 'hideExportResultPopup'});
        }
      };
      $(document).keydown(function(e) {
        if(e.keyCode == 27) {
          sendMessage({"command": 'hideExportResultPopup'});
        }
      });

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
        
        /* Click currebnt postion show more */
        /*if (myContentPage.search_type == "SN" && $('#profile-experience .profile-section__experience-expansion').length > 0 ) {
          $('#profile-experience .profile-section__experience-expansion')[0].click();
        } else if (myContentPage.search_type == "LN" && $('#experience-section .pv-profile-section__see-more-inline').length > 0 ) {
          $('#experience-section .pv-profile-section__see-more-inline')[0].click();
        }*/

        // if (myContentPage.search_type == "LN" && $('[data-control-name="contact_see_more"]').length > 0 ) {
        //   $('[data-control-name="contact_see_more"]')[0].click();            
        // }
        setTimeout(function(){

          var p_object = myContentPage.getSingleProfileViewData();

          if (myContentPage.search_type == "LN" && $('.artdeco-modal__dismiss').length > 0 ) {
            $('.artdeco-modal__dismiss')[0].click();
          }

          console.log(p_object);
          sendResponse({p_data : p_object});
          // myContentPage.findDomain(0,p_object,function(j_index,j_p_data){
          //   console.log(j_p_data);
          //     //if (typeof(j_p_data.email) == "undefined" || j_p_data.email === '') {
          //       myContentPage.findEmail(j_index,j_p_data,function(n_index,n_p_data){
          //         console.log(n_p_data);
          //         sendResponse({p_data:n_p_data});
          //       })
          //     /*} else {
          //       sendResponse({p_data:j_p_data});
          //     }*/

          //   });          
        },1200);      
      },
      getSingleProfileViewData: function() {
        var row = {};
          //var response = $('html').html();
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
              // Company url
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

               // Email 
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

              row.linkedinUrl = window.location.href.split('/in/')[1].split('&')[0];

            } else if (myContentPage.search_type == "SN") {

              //var parse = myContentPage.parseProfile(response,location.href);
              //var parse_headline = myContentPage.parse_headline_SN(row.title || '');
             /* if (parse.firstName) 
                row.firstName = parse.firstName
              if (parse.lastName) 
                row.lastName = parse.lastName
              if (parse.company && parse.company !== '') {
                row.company = parse.company;
              } else {
                row.company = parse_headline.company;
              }
              if (parse.title && parse.title !== ''){
                row.title = parse.title;
              } else {
                row.title = parse_headline.title;
              }
              if (parse.linkedinUrl)
                row.linkedinUrl = parse.linkedinUrl;
              if (parse.location)
                row.location = parse.location;
              if (parse.domain)
                row.domain = parse.domain || '';
              row.ignore = row.ignore || {};
              row.ignore.companyUrl = parse.companyUrl;
              row.email = parse.email || parse.bodyEmail || ''; */

              // fullName
              row.fullName = $('.profile-topcard-person-entity__content').find('span').first().text().trim();
              var oname = row.fullName.split(' ');
              var firstName = oname[0];
              oname.shift();
              var lastName = oname.join(' ');
              if (row.firstName == undefined) 
                row.firstName = firstName;
              if (row.lastName == undefined) 
                row.lastName = lastName;

              // Company URL
              companyIdSN = $('.profile-position__secondary-title').first().find('a').attr('href') || '';
              companyIdSN = companyIdSN.split('/');
              companyIdSN = companyIdSN[companyIdSN.length - 1];
              row.companyUrl = consts.linkedin_company_path + companyIdSN;
              row.ignore.companyUrl = row.companyUrl;
              // Email 
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

              row.linkedinUrl = window.location.pathname.replace('/', '');            
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
    /* 
    * Function : hidePopup()  
    * Description:  close for modals 
    */
    hidePopup:function(){
      if ($('#export-result-popup').css('display') == "block") {
        $('#export-result-popup').hide();
        $('body').removeClass('modal-opened');
      }
    },    
    simuScroll: function(message, sender, sendResponse){
      $('#export-result-popup').css('background', '#f5f5f5');
      $("html, body").animate({ scrollTop: $(document).height() });
      $("html, body").animate({ scrollTop: 0});
    },
    restorePopupBG: function(message, sender, sendResponse) {
      $('#export-result-popup').css('background', 'rgba(0, 0, 0, 0.4)');
      sendResponse();
    },
    getCurrentPage: function() {
      if (myContentPage.search_type == "LN") {
        return parseInt($('li.active').text() || myContentPage.get_parameter_by_name('page') || 1);            
      } else if (myContentPage.search_type == "SN") {
        return parseInt($('li.selected').text() || myContentPage.get_parameter_by_name('page') || 1);
      }
    },
    getPageSliderMax: function() {    
      if (myContentPage.search_type == "LN") {
        if($('.search-results__total').length == 1) {
          cnt = $('.search-results__total').text().trim().replace(/,/gi, '', '').match(/[0-9]+/gi);
          if(cnt) {
            cnt = parseInt(cnt[0]);
            max = cnt > consts.slider.search.max * 10 ? consts.slider.search.max : (cnt % 10 == 0 ? cnt / 10 : Math.floor(cnt / 10) + 1);
          } else {
            max = 1;
          }
        } else {
          maxP = parseInt($($('li.page-list ol li').get($('li.page-list ol li').length - 1)).text());
          //max = maxP > consts.slider.search.max ? consts.slider.search.max : maxP;
          max = maxP || 1;
        }
      } else if (myContentPage.search_type == "SN") {
        if($('.search-spotlights__tab.active .artdeco-tab-primary-text').length == 1) {
          cnt = $('.search-spotlights__tab.active .artdeco-tab-primary-text').text().trim().replace(/,/gi, '', '').match(/[0-9]+/gi);
          if(cnt) {
            cnt = parseInt(cnt[0]);
            max = cnt > consts.slider.search.max * 25 ? consts.slider.search.max : (cnt % 25 == 0 ? cnt / 25 : Math.floor(cnt / 25) + 1);
          } else {
            max = 1;
          }
        } else {
          // maxP = parseInt(($('li.cursor-pointer').last().text() || '').replace(new RegExp(/\…/gi), '').trim()) - this.get_current_page() + 1;
          maxP = parseInt(($('li.cursor-pointer').last().text() || '').replace(new RegExp(/\…/gi), '').trim());
          //max = maxP > consts.slider.search.max ? consts.slider.search.max : maxP;
          max = maxP || 1;
        }    
      }    
      return max;
    },
    getProfileInfo: function(message, sender, sendResponse) {
      myContentPage.skrapeProfile(message.index,message.p_data,function(i_index,i_p_data){
        sendResponse({index:i_index,p_data:i_p_data});
      })
    },
    getDomainInfo: function(message, sender, sendResponse) {
      myContentPage.findDomain(message.index,message.p_data,function(j_index,j_p_data){
        sendResponse({index:j_index,p_data:j_p_data});
      })
    },
    getEmailInfo: function(message, sender, sendResponse) {
      myContentPage.findEmail(message.index,message.p_data,function(n_index,n_p_data){
        sendResponse({index:n_index,p_data:n_p_data});
      })
    },  
    skrapeProfile: function (i, row, done) {
      row.email_arr = [];
      row.current_companies = [];
      row.domain_arr = [];
      if (myContentPage.search_type == "LN") {
        if (row && row.linkedinUrl && row.linkedinUrl !== '') {
          var contact_url = row.linkedinUrl.replace('http:', 'https:');
          contact_url = contact_url + "detail/contact-info/";
          httpRequest.get(contact_url, null, function (response) {

            var parse = myContentPage.parseProfile(response, row.linkedinUrl);

            // Name
            row.firstName = parse.firstName || row.firstName;
            row.lastName = parse.lastName || row.lastName;

            // Company
            row.company = parse.company || row.company;

            row.ignore = row.ignore || {};
            row.ignore.companyUrl = parse.companyUrl;

            // Title
            row.title = parse.title || row.title;

            // Linkedin ID
            if (parse.linkedinUrl)
              row.linkedinUrl = parse.linkedinUrl;

            // Location
            if (parse.location)
              row.location = parse.location;

            // Email
            row.email = parse.email || '';
            row.current_companies = parse.current_companies;
            row.email_arr = parse.email_arr;

            if (parse.domain) {
              row.domain = parse.domain || '';
              row.domain = row.domain.replace("http://www.","");
              row.domain = row.domain.replace("https://www.","");
              row.domain = row.domain.replace("www.","");
              row.domain_arr = myContentPage.push_domains_arr(row.domain,"",row.domain_arr);
            }
            
            done(i, row);
          }, function () {
            done(i, row)
          });
        } else {
          done(i, row);
        }
      } else if (myContentPage.search_type == "SN") {
        if (row && row.linkedinUrl && row.linkedinUrl !== '') {
          //Formating url
          var host = window.location.hostname;
          var url = row.linkedinUrl;
          if (url.indexOf('http:') > -1 || url.indexOf('https:') > -1) {
            url = url.replace('http:', 'https:');
          }
          url = parserSN.getSearchLink(url);
          var JSESSIONID_REGEX = new RegExp('JSESSIONID=["]*(.*?)["]*;');
          var csrf_token = document.cookie.match(JSESSIONID_REGEX)[1];
          httpRequest.get(url, csrf_token, function (response) {          
            var parse = parserSN.getUserInfo(response);
            console.log(parse);
            //var parse = myContentPage.parseProfile(response,row.linkedinUrl);
            var parse_headline = myContentPage.parse_headline_SN(row.title);

            if (parse.firstName) row.firstName = parse.firstName;
            if (parse.lastName) row.lastName = parse.lastName;

            if (parse.company && parse.company !== '')
              row.company = parse.company;
            else
              row.company = parse_headline.company;

            if (parse.title && parse.title !== '')
              row.title = parse.title;
            else
              row.title = parse_headline.title;

            if (parse.linkedinUrl)
              row.linkedinUrl = parse.linkedinUrl;

            if (parse.location)
              row.location = parse.location;

            if (parse.domain) {
              row.domain = parse.domain || '';
              row.domain = row.domain.replace("http://www.","");
              row.domain = row.domain.replace("https://www.","");
              row.domain = row.domain.replace("www.","");
              row.domain_arr = myContentPage.push_domains_arr(row.domain,"",row.domain_arr);
            }

            row.ignore = row.ignore || {};        
            row.ignore.companyUrl = parse.companyUrl;
            row.email = parse.email || '';
            if (row.email) {
              row.email_arr = myContentPage.search_emails(row.email, row.email_arr,'DOM');
            }

            if (parse.current && parse.current.length > 0) {
              for (var cci = 0; cci < parse.current.length; cci++) {
                var current = parse.current[cci];

                /* Parse email fomr company details*/
                if (current.description) {
                  row.email_arr = myContentPage.search_emails(current.description, row.email_arr,'DOM');
                }
                var companyUrl = "";
                if(current.source_id) {
                  companyUrl = '/company/' + current.source_id;
                }
                if (current.company_name) {
                  row.current_companies.push({
                    companyName : current.company_name || "",
                    description : current.description || "",
                    title : current.position || "",
                    companyUrl : companyUrl,
                  });                  
                }
              }
            }

            if (row.companyUrl) {
              row.ignore.companyUrl = row.companyUrl;
            }
            done(i, row);

          }, function () {
            row.ignore = row.ignore || {};
            if (row.companyUrl) {
              row.ignore.companyUrl = row.companyUrl;
            }
            done(i, row);
          });
        } else {
          done(i, row);
        }
      }
    },
    findDomain: function (i, row, done) {
      row.domain_arr = row.domain_arr || [];      
      if (row.current_companies.length > 0) {
        var companies_promise_arr = [];
        var cii = 0;
        /* Check first company[0] register from current companies array */
        for (var reg = 0; reg < row.current_companies.length; reg++) {
          if (row.current_companies[reg].companyUrl && (row.current_companies[reg].companyUrl.match(consts.company_url_regex) || row.current_companies[reg].companyUrl.match(consts.company_beta_url_regex))) {
            cii = reg;
            break;
          }
        }
        //for (var cii = 0; cii < 1; cii++) {
          //for (var cii = 0; cii < row.current_companies.length; cii++) {
            //cii = row.current_companies.length-1;
            companies_promise_arr.push(
              new Promise(function (resolve, reject) {
                if (row.current_companies[cii].companyUrl && (row.current_companies[cii].companyUrl.match(consts.company_url_regex) || row.current_companies[cii].companyUrl.match(consts.company_beta_url_regex))) {
                  companyParserObj.parse(row.current_companies[cii].companyUrl, function (company) {
                    if (company && company.domain) {
                      row.domain = company.domain;
                      row.company_obj = company;
                      var company_size = company.size || company.company_size;
                      row.domain_arr = myContentPage.push_domains_arr(company.domain,company_size,row.domain_arr);
                      //if (row.domain_arr.indexOf(company.domain) == -1) {
                        //row.domain_arr.push(company.domain);
                      //}
                      resolve();
                    } else {
                      resolve();
                    }
                  });
                } else {
                 /* Company not found */
                 clearbitParserObj.parse(row.current_companies[cii].companyName, function (d_arr) {
                  for (var di = 0; di < d_arr.length; di++) {
                    row.domain_arr = myContentPage.push_domains_arr(d_arr[di],"",row.domain_arr);
                  }
                  resolve();
                });                 
               }
             })
              );
          //}
          Promise.all(companies_promise_arr).then(() => {
            done(i, row);  
          });
        } else {          
          done(i, row);
        }        
      },
      findEmail: function (i, row, done) {
        row.email_arr = row.email_arr || [];
        if (row.domain_arr && row.domain_arr.length > 0) {  
         var domain_promise_arr = [];
         for (var dii = 0; dii < row.domain_arr.length; dii++) {
          domain_promise_arr.push(
            new Promise(function (resolve, reject) { 

            // Email not found in DOM => Look up with API            
            var ptr = "", pvr = "" ,pnr = "";
            sendMessage({
              command  : 'findEmail',
              fname    : row.firstName,
              lname    : row.lastName,
              domain   : row.domain_arr[dii].domain,
              company_size   : row.domain_arr[dii].company_size,
              pvr      : pvr,
              pnr      : pnr
            },function(response){
              if (response && response.email){
                var email_from = "API";
                if (response.response_code == "200" || response.response_code == "550") {
                  row.email_verify_code = "1";
                  email_from = "API";
                } else if (response.response_code == "320" || response.response_code == "500") {
                  row.email_verify_code = "0";
                  email_from = "RANDOM";
                } else if (response.response_code == "0" || response.response_code == 0) {
                  row.email_status = "0";
                  email_from = "RANDOM";
                }
                row.email = response.email;
                row.email_arr = myContentPage.search_emails(response.email, row.email_arr,email_from);
                resolve();
              } else {
                row.email_verify_code = "0";
                resolve();
              }
            });
          })
            );
        }
        Promise.all(domain_promise_arr).then(() => {
          done(i, row);  
        });
      } else {
        done(i, row);
      }
    },
    parseProfile: function(html, url) {
      if (myContentPage.search_type == "LN") {

        var h, j, e,  l, inc, obj, obje, cur, curn, r, current, parsed = {};
        parsed.email_arr = [];
        parsed.current_companies = [];

          // Dom init
          h = $("<div />", {
            html: html
          });

          j = h.find("code:contains('patentView')").html();
          e = h.find("code:contains('emailAddress')").html();

          try {

            obj  = JSON.parse(j);
            if (e == undefined || typeof(e) == "undefined") { 
              e =  "{}"; 
            }

            try {
              obje = JSON.parse(e);
            } catch(e) {
              console.error('Error parsing dom');
            }

            inc  = obj.included;
            l    = inc.length;

            for(var j = l-1; j >= 0; j--) {
              if(inc[j] && inc[j].firstName && inc[j].lastName && inc[j].publicIdentifier && url && url.indexOf(inc[j].publicIdentifier) > -1) {
                parsed.firstName =  inc[j].firstName;
                parsed.lastName = inc[j].lastName;
                break;
              }
            }

            parsed.email = obje && obje.data && obje.data.emailAddress ? obje.data.emailAddress : null;
            if (parsed.email) {
              parsed.email_arr = myContentPage.search_emails(parsed.email, parsed.email_arr,'DOM');
            }

            if(typeof(obje.data) != "undefined" && typeof(obje.data.websites) != "undefined" && obje.data.websites != null && obje.data.websites.length > 0){
              parsed.domain =  obje.data.websites[0].url;
            }

        // Position
        try {

          // Aggregating email
          for(var k = 0; k < l; k++) {
            if(inc[k].$type == 'com.linkedin.voyager.common.DateRange' && inc[k].$id.indexOf('fs_position') > -1 && !inc[k].endDate) {r = inc[k]; break;};
          }

          var companies_arr = [];
        // J match
        for(var i = 0; i < l; i++)  {
          if(((inc[i].companyName && inc[i].$type == 'com.linkedin.voyager.identity.profile.Position') ||
            (inc[i].name && inc[i].$type == 'com.linkedin.voyager.identity.profile.PositionGroup')) &&
            inc[i].timePeriod && r && r.$id === inc[i].timePeriod)
          {
            var cur = inc[i];
            companies_arr.push(cur);
            //var cur = inc[i]; break;
            //curn = cur.companyUrn || cur.miniCompany;
            // Looking for title            
          /*if(curn && curn.split(':').length > 0) {
            splitUrn = curn.split(':');
            parsed.companyUrl = '/company/' + splitUrn[splitUrn.length - 1];
            companies_arr.push(curn);
          }*/
            //cur = inc[i]; break;
          }
        }

        if(companies_arr.length == 0) {

          /*parsed.company = cur.companyName || cur.name;
          curn           = cur.companyUrn || cur.miniCompany;

            // Looking for title
            if(!cur.title) {
              for(var i = 0; i < l; i++) {
                  if(inc[i].title && inc[i].companyUrn == curn) { 
                    parsed.title = inc[i].title; break;
                  }                
              } 
            } else parsed.title   = cur.title;

          if(curn && curn.split(':').length > 0) {
            splitUrn = curn.split(':');
            parsed.companyUrl = '/company/' + splitUrn[splitUrn.length - 1];
          }*/

          // Alternative 
          for(var i = 0; i < l; i++) {
            if(inc[i].$type && inc[i].$type == 'com.linkedin.voyager.identity.profile.Position' && inc[i].timePeriod && inc[i].timePeriod.startDate && !inc[i].timePeriod.endDate) {
              if(!current || ( inc[i].timePeriod.startDate.year > current.timePeriod.startDate.year) || (inc[i].timePeriod.startDate.year == current.timePeriod.startDate.year && inc[i].timePeriod.startDate.month > current.timePeriod.startDate.month)) {
                companies_arr.push(inc[i]);
                //current = inc[i];
              }
            }
          }
        /*if (current) {
          parsed.company  = current.companyName || "";
          parsed.title    = current.title;
          if(current.companyUrn && current.companyUrn.split(':').length > 0) {
            parsed.companyUrl = '/company/' + current.companyUrn.split(':')[current.companyUrn.split(':').length - 1]
          }
        }*/
      }
      var current_companies = [];
      if (companies_arr.length > 0) {
        parsed.company  = companies_arr[0].companyName || "";
        parsed.title = companies_arr[0].title;

        for (var ci = 0; ci < companies_arr.length; ci++) {
          var current = companies_arr[ci];
          var companyUrl = "";
          if(current.companyUrn && current.companyUrn.split(':').length > 0) {
            companyUrl = '/company/' + current.companyUrn.split(':')[current.companyUrn.split(':').length - 1];
          }

          /* Parse email fomr company details*/
          if (current.description) {
            parsed.email_arr = myContentPage.search_emails(current.description, parsed.email_arr,'DOM');
          }
          if (current.companyName) {
            current_companies.push({
              companyName : current.companyName || "",
              description : current.description || "",
              title : current.title || "",
              companyUrl : companyUrl,
            })
          }
        } 
      }
      parsed.current_companies = current_companies;

    } catch(e) {
      console.error(e);
      console.error('Error parsing dom');
    }

  } catch(e) {
    console.error('Error parsing dom');
  }

  return parsed;

} else if (myContentPage.search_type == "SN") {

  var parsed, cPosition, companyIdSN, href, jr, targetBody;
  parsed = {};  
  if(html) {
    if(html.indexOf('embedded-json') > -1) {
      var jreg = /code id="embedded-json"><!--[^>]+--><\/code>/gi;
      var matches = html.match(jreg);
      var dump = matches ? matches[0] : '';
      var json = dump.replace(new RegExp(/code id="embedded-json"><!--/gi), '').replace(new RegExp(/--><\/code>/gi),'');

      try {
        var obj  = JSON.parse(json);
      } catch(e) {
        var obj  = null;
      }

        // Old SN
        // Title
        if(obj && obj.currentPosition && obj.currentPosition.position) {
          parsed.title = obj.currentPosition.position.title;
        }
        // Company
        if(html.match(consts.company_regex)) {
          parsed.company = html.match(consts.company_regex)[0].replace(consts.company_key, '').replace('"','');
        }
        // Company URL
        if(html.match(consts.company_id_regex)) {
          companyIdSN = html.match(consts.company_id_regex)[0];
          if(companyIdSN.match(consts.numeric_regex))
            parsed.companyUrl = consts.linkedin_company_path + companyIdSN.match(consts.numeric_regex)[0];
        }
        // Profile ID
        if(html.match(consts.public_link_regex)) {
          parsed.linkedinUrl = html.match(consts.public_link_regex)[0].replace(consts.public_link_key, '').replace('"','');
          if(parsed.linkedinUrl && parsed.linkedinUrl.indexOf('/pub/') > -1) {
            parsed.linkedinUrl = 'pub/' +  parsed.linkedinUrl.split('/pub/')[1];
          }
        }
        // location
        if(obj && obj.profile && obj.profile.location) {
          parsed.location = obj.profile.location
        }

        // Email
        if(html.match(consts.sn_email_regex)) {
          var chunk = html.match(consts.sn_email_regex)[0];
          if(chunk.match(consts.email_regex)) {
            parsed.email = chunk.match(consts.email_regex)[0];
          }
        }
      } else {
        var companyUrl;
        var jreg_sn     =  /{&quot;lastName[^>]+<\/code>/gi;
          var matches  = html.match(jreg_sn);
          var dump     = matches ? matches[0] : '';
          $('body').append("<div id='dump_html' display='none'></div>");
          $("#dump_html").html(dump);
          var json     = $("#dump_html").html().replace(/&quot;/g,'\"').replace('</code>', '');
          $("#dump_html").remove();
          try {
            var obj  = JSON.parse(json);
          } catch(e) {
            var obj  = null;
          }

          if(obj) {

            if(obj.defaultPosition) {

              parsed.title      = obj.defaultPosition.title;
              parsed.company    = obj.defaultPosition.companyName;

              if(obj.defaultPosition.companyUrn && obj.defaultPosition.companyUrn !== '') {
                companyUrl      = obj.defaultPosition.companyUrn.split(':')[obj.defaultPosition.companyUrn.split(':').length - 1];
                if(companyUrl) parsed.companyUrl = consts.linkedin_company_path + companyUrl;
              } else {
                if(typeof(obj.contactInfo) != "undefined" && typeof(obj.contactInfo.websites) != "undefined" && obj.contactInfo.websites.length > 0){
                  for (var iw = 0; iw < obj.contactInfo.websites.length; iw++) {
                    if(obj.contactInfo.websites[iw].category == "COMPANY"){
                      parsed.domain =  obj.contactInfo.websites[iw].url;
                      break;
                    }
                  }
                }
                if (typeof(parsed.domain) == "undefined") {
                  if(typeof(obj.positions) != "undefined" && obj.positions.length > 0){
                    for (var iw = 0; iw < obj.positions.length; iw++) {
                      if(obj.positions[iw].current == true){
                        var companyName = myContentPage.parse_website_from_c_name(obj.positions[iw].companyName);
                        if (companyName != null && typeof(companyName) != "null" ) {
                          parsed.domain = companyName;
                          break;
                        }
                      }
                    }
                  }                                
                }
              }
            }

            if(obj.entityUrn && url.indexOf(obj.entityUrn) > -1) {
              parsed.firstName = obj.firstName;
              parsed.lastName  = obj.lastName;
              parsed.location  = obj.location;
            }

            if(obj.entityUrn && obj.entityUrn.match(/\([^\)]+\)/gi))
              parsed.linkedinUrl  = 'sales/profile/' + (obj.entityUrn.match(/\([^\)]+\)/gi)[0] || '').replace(')', '').replace('(', '');

            if(obj.email) parsed.email = obj.email;
            else if(typeof(obj.contactInfo) != "undefined" && typeof(obj.contactInfo.primaryEmail) != "undefined") parsed.email = obj.contactInfo.primaryEmail;
            else if(typeof(obj.contactInfo) != "undefined" && typeof(obj.contactInfo.emails) != "undefined" && obj.contactInfo.emails.length > 0) parsed.email = obj.contactInfo.emails[0];
          }
        }
      }
      return parsed;

    }
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

  /*$(window).scroll(function() {
    
  });*/

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
