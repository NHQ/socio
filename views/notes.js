$('.editable').focusout(function(e){
var content = "";
jQuery.each(GENTICS.Aloha.editables,function (index, editable) {
content = editable.getContents();
});
alert(content);
})



// fix the floating menu in place, if it's not already pinned
if (!GENTICS.Aloha.FloatingMenu.pinned) {
GENTICS.Aloha.FloatingMenu.togglePin();
}

// now you have to move it into position. the FloatingMenu will be 
// positioned absolutely, so you have to specify top and left 
// coordinates for both the FloatingMenu and it's shadow
GENTICS.Aloha.FloatingMenu.obj.css('top', [YOUR POS HERE]);
GENTICS.Aloha.FloatingMenu.obj.css('left', [YOUR POS HERE]);
GENTICS.Aloha.FloatingMenu.shadow.css('top', [YOUR POS HERE]);
GENTICS.Aloha.FloatingMenu.shadow.css('left', [YOUR POS HERE]);

// you also don't want the toggle pin to be visible, so we'll hide it
$(".GENTICS_floatingmenu_pin").hide();
