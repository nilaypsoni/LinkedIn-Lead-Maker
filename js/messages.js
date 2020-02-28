var messagesObj = (function(){

  var dictionnary = {
    en : {
      find : 'Find',
      finding : 'Finding...',
      find_all : 'Find All',
      yes: 'Yes',
      no: 'No',
      next: 'Next',
      add_Lead: 'Add',
      add_all_lead: 'Add All',
      my_contact_list_text : "My Contacts",
      get_email: 'Get Email',
      go_to_list: 'Go To List',
      back_btn_text : 'Back',
      close : 'Close',
      not_loggedin: 'Not logged in.',

      no_list_found: 'No list was found, a new list will be created with this name after clicking on "Save"',
      searching_prospect : 'Searching for Prospect...',
      profile_unvailable: 'Profile data unavailable ✘',
      email_found: 'Email found ✓',
      saved_text: 'Saved ✓',      
      error_text: 'Error ✘',
      saving_text: 'Saving...',      
      email_not_found: 'Email not found ✘',
      list_not_found: 'List not found ✘',
      extraction_failed: 'An unexpected error has occurred. Please try again later.',
      
      leads_saved: 'Leads saved successfully',
      
      ext_info : 'This extension can only be used on',
      linkedin_info : 'You can only use this popup on Linkedin and Sales Navigator profile pages.',
      save : 'Save',
}

};

return {
   get: function(key) {
      return dictionnary['en'][key];
}
};
})();
