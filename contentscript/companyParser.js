var companyParserObj = {
  save: function (company) {
    sendMessage({"command": "saveCompany",company : company},function(response){
    });
  },
  get: function (id, callback) {
    sendMessage({"command": "getCompany",id : id},function(response){
      callback(response);
    });
  },
  scrape: function (url, callback) {
    if (url.indexOf('http:') > -1 || url.indexOf('https:') > -1) {
      url = url.replace('http:', 'https:')
    }
    else {
      if (url.indexOf("/company/") != -1) {
        url = consts.linkedin_url + url;
      } else {
        url = consts.linkedin_url + '/' + url          
      }
    }
    var company = {}; 
    httpRequest.get(url, null, function (body) {

      var h, t, j, o, d, l, s, r;

      r = /[0-9]+-?[0-9]+,?[0,9]+\+?/gi;

      h = $("<div />", {
        html: body
      });

      try {

        t = h.find("code").filter(function () { return $(this).html().indexOf('squareLogo') > -1 });

        if (t.length > 0) {

          j = t.html().replace('<!--', '').replace('-->', '').trim();
          o = JSON.parse(j);

          l = document.createElement("a");
          l.href = o.website;
          d = l.hostname.replace('www.', '');

          s = d.split('.');

          if (s.length > 2 && s[s.length - 2].length > 3) {
            d = s[s.length - 2] + '.' + s[s.length - 1]
          }

          if ((d.indexOf('linkedin.') > -1 && (o.companyName || '').toLowerCase().indexOf('linkedin') == -1) ||
            (d.indexOf('facebook.') > -1 && (o.companyName || '').toLowerCase().indexOf('facebook') == -1) ||
            (d.indexOf('apple.') > -1 && (o.companyName || '').toLowerCase().indexOf('apple') == -1)) {

            d = '';

        }

        callback({
          id: o.companyId.toString(),
          name: o.companyName,
          domain: d,
          description: o.description,
          hq: o.headquarters,
          industry: o.industry,
          size: o.size.match(r) ? o.size.match(r)[0].replace(new RegExp(/,/gi), '') : '0',
          logo: o.squareLogo,
          founded: o.yearFounded
        });

      }

      else {

            // Beta vars
            var inc, id, hq, logo, size, founded, href;

            t = h.find("code").filter(function () { return $(this).html().indexOf('"companyPageUrl":') > -1 });

            try {
              j = t.html().replace('<!--', '').replace('-->', '').trim();
            } catch (e) {
              j = '{data : {}}'
            }

            o = JSON.parse(j);
            inc = o.included;


            // Company linkedin id
            if (url.charAt(url.length - 1) == '/') url = url.substring(0, url.length - 1);
            id = url.split('/')[url.split('/').length - 1].split('?')[0];

            if (!o.data.companyPageUrl) {
              for (var i = 0; i < inc.length; i++) {
                if (inc[i].$type === 'com.linkedin.voyager.organization.Company') {
                  var splt = inc[i].url.split('/');
                  if (splt[splt.length - 1].split('?')[0] == id) {
                    o.data = inc[i];
                    break;
                  }
                }
              }
            }

            l = document.createElement("a");
            l.href = o.data.companyPageUrl;
            d = l.hostname.replace('www.', '');

            s = d.split('.');

            if (s.length > 2 && s[s.length - 2].length > 3) {
              d = s[s.length - 2] + '.' + s[s.length - 1];
            }

            for (var i = 0; i < inc.length; i++) {

              if (!hq && inc[i].$type === 'com.linkedin.common.Address') {
                hq = inc[i];
                for (var key in hq) {
                  if (key.indexOf('$') > -1) delete hq[key];
                }
              }

              if (inc[i].$type === 'com.linkedin.voyager.common.Industry') {
                if (typeof (inc[i].localizedName) != "undefined") {
                  o.data.industries = [];
                  o.data.industries[0] = inc[i].localizedName;
                }
              }

              if (!size && inc[i].$type === 'com.linkedin.voyager.organization.shared.StaffCountRange')
                size = inc[i].start + (inc[i].end ? ('-' + inc[i].end) : '+');

              if (!logo && inc[i].$type === 'com.linkedin.voyager.common.MediaProcessorImage' && inc[i].$id && inc[i].$id.indexOf(':' + id + ',logo,') > -1)
                logo = inc[i].id;

              if (!founded && inc[i].$type === 'com.linkedin.common.Date')
                founded = inc[i].year;


              if (inc[i].$type === "com.linkedin.voyager.organization.Company") {

                if (!hq && typeof (inc[i].headquarter) != "undefined" && inc[i].headquarter != null && inc[i].headquarter.$type === 'com.linkedin.common.Address') {
                  hq = inc[i].headquarter;
                  for (var key in hq) {
                    if (key.indexOf('$') > -1) delete hq[key];
                  }
                }

                if (!founded && typeof (inc[i].foundedOn) != "undefined" && inc[i].foundedOn != null && inc[i].foundedOn.$type == 'com.linkedin.common.Date') {
                  founded = inc[i].foundedOn.year;
                }

                if (!logo && typeof (inc[i].backgroundCoverImage) != "undefined" && inc[i].backgroundCoverImage != null) {
                  if (typeof (inc[i].backgroundCoverImage.image) != "undefined" && inc[i].backgroundCoverImage.image.$type == 'com.linkedin.voyager.common.MediaProcessorImage') {
                    logo = inc[i].backgroundCoverImage.image.id;
                  }
                }

                if (!size && typeof (inc[i].staffCountRange) != "undefined" && inc[i].staffCountRange != null && inc[i].staffCountRange.$type == 'com.linkedin.voyager.organization.shared.StaffCountRange') {
                  size = inc[i].staffCountRange.start + (inc[i].staffCountRange.end ? ('-' + inc[i].staffCountRange.end) : '+');
                }

              }
            }

            if ((d.indexOf('linkedin.') > -1 && (o.companyName || '').toLowerCase().indexOf('linkedin') == -1) ||
              (d.indexOf('facebook.') > -1 && (o.companyName || '').toLowerCase().indexOf('facebook') == -1) ||
              (d.indexOf('apple.') > -1 && (o.companyName || '').toLowerCase().indexOf('apple') == -1)) {
              d = '';
          }

          callback({
            id: id,
            name: o.data.name,
            domain: d,
            description: o.data.description,
            hq: hq,
            industry: typeof(o.data.industries) != "undefined" ? o.data.industries.length > 0 ? o.data.industries[0] : "" : "" ,
            size: size || '0',
            logo: logo,
            founded: founded
          });
        }
      }
      catch (e) {
        console.log(e);
        if (url && url.indexOf('company-beta') > -1) {
          url = url.replace('company-beta', 'company');
          companyParserObj.scrape(url, callback);
        } else {
          callback();
        }
      }
    }, function () {
      callback();
    })
},
parse: function (url, done) {
  var _this, id, l, su, sq;
  if (url) {
    l = url.length;
    su = url.split('/');
    if (url[l - 1] == '/') {
      sq = su[su.length - 2].split('?');
      id = sq[0];
    } else {
      sq = su[su.length - 1].split('?');
      id = sq[0];
    }
    companyParserObj.get(id, function (company) {
      if (company) {
        done(company);
      } else {
        companyParserObj.scrape(url, function (company) {
          if (company)
            company.linkedin_id = id;
          done(company);
          companyParserObj.save(company);
        });
      }
    });
  } else {
    done();    
  } 
}
};
