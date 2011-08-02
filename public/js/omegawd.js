var Article = {
	facts: {},
	secrets: {},
	dossier: []
}

$(document).ready(function(){
  /*$( "#sortable" ).sortable({
    update: function(event, ui) { 
      var data = encodeURIComponent(JSON.stringify($(this).sortable('toArray')));
      console.log(data);
      $.post('/sort-blurbs?data='+data, function(err,data){console.log(data)})
      }  
  });*/
  	//$( "#sortable" ).disableSelection();
  $('.published:checkbox').live('change', function(e){$.post('/publish-state', {id: $(this).attr('value'), published: $(this).attr('checked')})})
var classes = ['content', 'meta', 'media'];
  /*
	$('#MyForm').transloadit({
      wait: false,
      fields: true
  });
*/
  $('ul.picker').live('click', function (e){
    var select = $(this);
    $(this).children().slideToggle(200);})
  $('.subMenuItem').live('click', function(e){
	 var select = $(this).attr('data-filter');
	$('.'+select).toggle();})
	function updoc(_id, field, key, valu){
		var data = {"_id":_id, "field":field, "key":key,"valu":valu};
		$.post('/update?_id='+_id+'&field='+field+'&key='+key+'&valu='+valu, function(){console.log('sucksess')}).error(function(){console.log('err')})};
	function bindAndReplace (elem){
		elem.live('change',function(e){
			var a = $(this).attr('data-class');
			var b = $(this).attr('id');
			var c = $(this).val();
			function update (a,b,c){
				Article[a][b] = c;
			}
			update(a,b,c);
			bindAndReplace($(this));
			console.log(Article);
			updoc($('#document').attr('data-filter'), a, b, c)
		});
	}bindAndReplace($('textarea'))
});