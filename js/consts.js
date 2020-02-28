var consts = {  
	
  base_api_url : "https://www.leadmaker.io/contacts/api/",
  new_user_api_url : "newuser",
  save_contact_api_url : "savecontact",
  save_company_api_url : "savecontact",
  get_status_api_url : "getstatus",
  get_user_api_url : "getuser",
  get_list_api_url : "getlist",
  
  http_timeout: 40000,
  ignore_domain: ['bit.ly', 'goo.gl', 'ow.ly','facebook.com/'],
  head_line_seps: ['at', 'chez'],
  tag_regex: /<[a-z\/]+>/gi,

  company_url_regex: /\/company\/[^ ]+/gi,
  company_beta_url_regex: /\/company\/[^ ]+/gi,
  linkedin_url: 'https://www.linkedin.com',
  linkedin_company_path: '/company/',
  linkedin_img_url: 'https://media.licdn.com/',
  public_link_regex: /"publicLink":"[^"]+"/gi,
  company_id_regex: /"companyId":(([0-9]+)|("[^"]+"))/gi,
  company_regex: /"companyName":"[^"]+"/gi,
  company_key: '"companyName":"',
  numeric_regex: /[0-9]+/gi,
  sn_email_regex: /"emails":\["[^"]+"/gi,
  email_regex: /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi,
  domain_url_regex: /[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/gi,
  
};