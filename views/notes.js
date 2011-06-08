$('.editable').focusout(function(e){
var content = "";
jQuery.each(GENTICS.Aloha.editables,function (index, editable) {
content = editable.getContents();
});
alert(content);
})

